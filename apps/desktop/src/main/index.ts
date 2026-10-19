import { app, BrowserWindow, ipcMain, shell } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID, scryptSync, timingSafeEqual } from 'node:crypto';
import { PowerSyncDatabase } from '@powersync/node';
import { AppSchema } from './db/schema';
import { SupabaseConnector } from './db/connector';
import type {
  CompleteSaleInput,
  AdjustSupplyInput,
  ZatcaOnboardInput
} from '../preload';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 1. Prevent multiple instances corrupting the local SQLite database
if (!app.requestSingleInstanceLock()) {
  app.quit();
  process.exit(0);
}

let mainWindow: BrowserWindow | null = null;
let powerSync: PowerSyncDatabase | null = null;
let connector: SupabaseConnector | null = null;
let isQuitting = false;

// Active operator session in Main memory (never trusted from Renderer)
let activeOperator: {
  userId: string;
  fullNameAr: string;
  fullNameEn: string;
  role: 'admin' | 'cashier';
  appMode: 'POS_TERMINAL' | 'CLOUD_OWNER';
} | null = null;

// PIN brute-force rate limiter
const failedPinAttempts = new Map<string, { count: number; lockedUntil: number }>();

async function initPowerSync() {
  const dbPath = path.join(app.getPath('userData'), 'oasis-pos-v1.db');

  powerSync = new PowerSyncDatabase({
    schema: AppSchema,
    database: {
      dbFilename: dbPath,
      implementation: { type: 'better-sqlite3' }
    }
  });

  await powerSync.init();

  const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
  const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'placeholder-key';
  const powerSyncEndpoint = process.env.VITE_POWERSYNC_URL || 'https://powersync.journeyapps.com';

  connector = new SupabaseConnector(supabaseUrl, supabaseKey, powerSyncEndpoint);

  // Connect in background (if offline, app works immediately from local SQLite)
  powerSync.connect(connector).catch((err) => {
    console.info('[PowerSync] Starting in offline mode:', err.message);
  });

  // Notify React UI whenever watched tables change locally or via remote sync
  const watchedTables = [
    'appointments',
    'sales',
    'shifts',
    'parties',
    'services',
    'packages',
    'supplies',
    'rooms',
    'therapists',
    'settings'
  ];

  powerSync.onChangeWithCallback(
    {
      onChange: (event) => {
        mainWindow?.webContents.send('db:tables-changed', event.changedTables);
      }
    },
    { tables: watchedTables }
  );
}

function registerIpcHandlers() {
  // --- AUTH: Owner Cloud Login (Supabase Email + Password) ---
  ipcMain.handle('auth:loginCloudOwner', async (_e, { email, password }: { email: string; password: string }) => {
    if (!connector) throw new Error('Connector not ready');
    const { data, error } = await connector.supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user) throw new Error(error?.message ?? 'Login failed');

    // Reconnect PowerSync stream with the authenticated token
    await powerSync?.connect(connector);

    activeOperator = {
      userId: data.user.id,
      fullNameAr: 'مدير النظام',
      fullNameEn: data.user.email ?? 'Owner',
      role: 'admin',
      appMode: 'CLOUD_OWNER'
    };
    return activeOperator;
  });

  // --- AUTH: Offline-Capable Cashier/Admin 4-Digit PIN Unlock ---
  ipcMain.handle('auth:unlockWithPin', async (_e, { userId, pin }: { userId: string; pin: string }) => {
    if (!powerSync) throw new Error('DB not ready');

    const lock = failedPinAttempts.get(userId);
    if (lock && Date.now() < lock.lockedUntil) {
      throw new Error('LOCKED_OUT: Too many failed PIN attempts. Try again in 5 minutes.');
    }

    const user = await powerSync.getOptional<{
      id: string;
      full_name_ar: string;
      full_name_en: string;
      role_name: 'admin' | 'cashier';
      pin_hash: string;
    }>('SELECT id, full_name_ar, full_name_en, role_name, pin_hash FROM users WHERE id = ? AND is_active = 1', [userId]);

    if (!user || !user.pin_hash) throw new Error('INVALID_PIN');

    const [saltHex, storedHashHex] = user.pin_hash.split(':');
    const derived = scryptSync(pin, Buffer.from(saltHex, 'hex'), 32);
    const matches = timingSafeEqual(derived, Buffer.from(storedHashHex, 'hex'));

    if (!matches) {
      const count = (lock?.count ?? 0) + 1;
      failedPinAttempts.set(userId, {
        count,
        lockedUntil: count >= 5 ? Date.now() + 5 * 60_000 : 0
      });
      throw new Error('INVALID_PIN');
    }

    failedPinAttempts.delete(userId);
    activeOperator = {
      userId: user.id,
      fullNameAr: user.full_name_ar,
      fullNameEn: user.full_name_en,
      role: user.role_name,
      appMode: 'POS_TERMINAL'
    };
    return activeOperator;
  });

  // --- POS: Complete Sale + HALA Payment + ZATCA Stamp (Atomic Local Write) ---
  ipcMain.handle('sales:complete', async (_e, input: CompleteSaleInput) => {
    if (!powerSync) throw new Error('DB not ready');
    if (!activeOperator) throw new Error('UNAUTHORIZED');

    const saleId = randomUUID();
    const nowIso = new Date().toISOString();

    await powerSync.writeTransaction(async (tx) => {
      // 1. Read next sequential ICV and previous hash from local device state
      const counterRow = await tx.getOptional<{ icv: number; prev_hash: string; seq: number }>(
        `SELECT json_extract(value, '$.invoiceCounter') as icv,
                json_extract(value, '$.prevInvoiceHash') as prev_hash,
                json_extract(value, '$.nextReceiptSeq') as seq
         FROM settings WHERE key = 'zatca_config' LIMIT 1`
      );

      const icv = counterRow?.icv ?? 1;
      const seq = counterRow?.seq ?? 1;
      const prevHash =
        counterRow?.prev_hash ??
        'NWZlY2ViNjZmZmM4NmYzOGQ5NTI3ODZjNmQ2OTZjZjljMmI5N2I3M2I2Yjg2Y2I0ZjA0M2M4Y2I1YzQ3NTI4ZA==';
      const receiptNo = `JED01-T1-${String(seq).padStart(6, '0')}`;

      // 2. Insert immutable sale row
      await tx.execute(
        `INSERT INTO sales (
          id, branch_id, terminal_id, shift_id, document_type, receipt_no,
          customer_id, cashier_id, status, subtotal_halalas, discount_halalas,
          tax_halalas, grand_total_halalas, change_halalas,
          zatca_uuid, zatca_icv, zatca_prev_hash, zatca_hash, zatca_qr, zatca_status, created_at
        ) VALUES (?, 'JED01', 'T1', ?, '388', ?, ?, ?, 'completed', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)`,
        [
          saleId,
          input.shiftId,
          receiptNo,
          input.customerId ?? null,
          activeOperator!.userId,
          input.subtotalHalalas,
          input.discountHalalas,
          input.taxHalalas,
          input.grandTotalHalalas,
          input.changeHalalas,
          saleId,
          icv,
          prevHash,
          input.zatcaHash,
          input.zatcaQrBase64,
          nowIso
        ]
      );

      // 3. Insert sale line items
      for (const line of input.items) {
        await tx.execute(
          `INSERT INTO sale_items (
            id, branch_id, sale_id, service_id, therapist_id,
            description_ar, description_en, qty, unit_price_halalas,
            discount_halalas, tax_rate, line_total_halalas
          ) VALUES (?, 'JED01', ?, ?, ?, ?, ?, 1, ?, 0, 15, ?)`,
          [
            randomUUID(),
            saleId,
            line.serviceId,
            line.therapistId,
            line.nameAr,
            line.nameEn,
            line.priceHalalas,
            line.priceHalalas
          ]
        );
      }

      // 4. Insert payments (Cash / HALA Card / Wallet / Transfer)
      for (const pay of input.payments) {
        await tx.execute(
          `INSERT INTO payments (
            id, branch_id, sale_id, kind, provider, amount_halalas,
            card_scheme, approval_code, rrn, terminal_tid, created_at
          ) VALUES (?, 'JED01', ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            randomUUID(),
            saleId,
            pay.kind,
            pay.kind === 'card' || pay.kind === 'wallet' ? 'hala' : pay.kind,
            pay.amountHalalas,
            pay.cardScheme ?? null,
            pay.approvalCode ?? null,
            pay.rrn ?? null,
            pay.terminalTid ?? null,
            nowIso
          ]
        );
      }
    });

    return { saleId };
  });

  // --- SUPPLIES: Record Internal Shop Consumable Usage / Restock ---
  ipcMain.handle('supplies:adjustStock', async (_e, input: AdjustSupplyInput) => {
    if (!powerSync) throw new Error('DB not ready');
    if (!activeOperator) throw new Error('UNAUTHORIZED');

    await powerSync.execute(`UPDATE supplies SET stock_qty = MAX(0, stock_qty + ?) WHERE id = ?`, [
      input.deltaQty,
      input.supplyId
    ]);
    return { ok: true };
  });

  // --- ZATCA: Owner Cloud Onboarding via Supabase Edge Function ---
  ipcMain.handle('zatca:onboardCsid', async (_e, input: ZatcaOnboardInput) => {
    if (!connector) throw new Error('Connector not initialized');
    if (!activeOperator || activeOperator.role !== 'admin') {
      throw new Error('FORBIDDEN: Only Admin/Owner can register ZATCA CSID');
    }

    const { data, error } = await connector.supabase.functions.invoke('zatca-onboard', {
      body: {
        environment: input.environment, // 'sandbox' | 'simulation' | 'production'
        otpCode: input.otpCode, // 6-digit Fatoora portal OTP
        egsSerialNumber: input.egsSerialNumber,
        vatNumber: input.vatNumber,
        organizationNameAr: input.organizationNameAr
      }
    });

    if (error) throw new Error(error.message);
    return data;
  });

  // --- READ QUERIES (Domain-Scoped) ---
  ipcMain.handle('dashboard:getSnapshot', async () => {
    if (!powerSync) throw new Error('DB not ready');
    const [services, supplies, therapists, rooms, shifts, sales, appointments] = await Promise.all([
      powerSync.getAll('SELECT * FROM services WHERE is_active = 1'),
      powerSync.getAll('SELECT * FROM supplies WHERE is_active = 1'),
      powerSync.getAll('SELECT * FROM therapists WHERE is_active = 1'),
      powerSync.getAll('SELECT * FROM rooms WHERE is_active = 1'),
      powerSync.getAll('SELECT * FROM shifts ORDER BY opened_at DESC LIMIT 30'),
      powerSync.getAll('SELECT * FROM sales ORDER BY created_at DESC LIMIT 200'),
      powerSync.getAll('SELECT * FROM appointments ORDER BY starts_at DESC LIMIT 300')
    ]);
    return { services, supplies, therapists, rooms, shifts, sales, appointments };
  });

  // --- SYNC STATUS ---
  ipcMain.handle('sync:getStatus', () => ({
    connected: powerSync?.connected ?? false,
    lastSyncedAt: powerSync?.currentStatus?.lastSyncedAt?.toISOString() ?? null,
    hasSynced: powerSync?.currentStatus?.hasSynced ?? false
  }));
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1366,
    height: 860,
    minWidth: 1024,
    minHeight: 700,
    show: false,
    backgroundColor: '#FAF7F2',
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.mjs'),
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true,
      spellcheck: false
    }
  });

  mainWindow.once('ready-to-show', () => mainWindow?.show());

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://')) shell.openExternal(url);
    return { action: 'deny' };
  });

  if (process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }
}

app.whenReady().then(async () => {
  await initPowerSync();
  registerIpcHandlers();
  createWindow();
});

// Safe async shutdown so SQLite WAL checkpoints cleanly before exit
app.on('before-quit', (event) => {
  if (isQuitting) return;
  event.preventDefault();
  isQuitting = true;
  Promise.resolve(powerSync?.disconnect())
    .catch(() => {})
    .finally(() => {
      app.exit(0);
    });
});

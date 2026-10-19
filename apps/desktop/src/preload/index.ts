import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

export interface CompleteSaleInput {
  shiftId: string;
  customerId?: string | null;
  subtotalHalalas: number;
  discountHalalas: number;
  taxHalalas: number;
  grandTotalHalalas: number;
  changeHalalas: number;
  zatcaHash: string;
  zatcaQrBase64: string;
  items: Array<{
    serviceId: string;
    therapistId: string | null;
    nameAr: string;
    nameEn: string;
    priceHalalas: number;
  }>;
  payments: Array<{
    kind: 'cash' | 'card' | 'wallet' | 'transfer' | 'package';
    amountHalalas: number;
    cardScheme?: 'mada' | 'visa' | 'mastercard' | 'apple_pay' | 'stc_pay';
    approvalCode?: string; // HALA Approval Code
    rrn?: string;          // HALA RRN
    terminalTid?: string;  // HALA Terminal ID
  }>;
}

export interface AdjustSupplyInput {
  supplyId: string;
  deltaQty: number; // negative for session usage, positive for restock
}

export interface ZatcaOnboardInput {
  environment: 'sandbox' | 'simulation' | 'production';
  otpCode: string;
  egsSerialNumber: string;
  vatNumber: string;
  organizationNameAr: string;
}

const electronAPI = {
  auth: {
    loginCloudOwner: (email: string, password: string) =>
      ipcRenderer.invoke('auth:loginCloudOwner', { email, password }),
    unlockWithPin: (userId: string, pin: string) =>
      ipcRenderer.invoke('auth:unlockWithPin', { userId, pin })
  },

  sales: {
    complete: (payload: CompleteSaleInput): Promise<{ saleId: string }> =>
      ipcRenderer.invoke('sales:complete', payload)
  },

  supplies: {
    adjustStock: (payload: AdjustSupplyInput): Promise<{ ok: boolean }> =>
      ipcRenderer.invoke('supplies:adjustStock', payload)
  },

  zatca: {
    onboardCsid: (payload: ZatcaOnboardInput) =>
      ipcRenderer.invoke('zatca:onboardCsid', payload)
  },

  dashboard: {
    getSnapshot: () => ipcRenderer.invoke('dashboard:getSnapshot'),
    onTablesChanged: (callback: (tables: string[]) => void): (() => void) => {
      const listener = (_e: IpcRendererEvent, tables: string[]) => callback(tables);
      ipcRenderer.on('db:tables-changed', listener);
      return () => {
        ipcRenderer.removeListener('db:tables-changed', listener);
      };
    }
  },

  sync: {
    getStatus: (): Promise<{
      connected: boolean;
      lastSyncedAt: string | null;
      hasSynced: boolean;
    }> => ipcRenderer.invoke('sync:getStatus')
  }
} as const;

contextBridge.exposeInMainWorld('electronAPI', electronAPI);

export type ElectronAPI = typeof electronAPI;

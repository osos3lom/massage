import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import { toHalalas } from '@oasis/shared';
import { db, queryClient } from './src/client';
import * as s from './src/schema';

/*
 * Seeds the single branch (JED01) catalog and staff, reconciled to the live schema:
 *  - money in halalas (SAR x100 via @oasis/shared)
 *  - VAT-registered: prices are VAT-INCLUSIVE, 15% extracted at checkout
 *    (company.vatNumber is left null until the ZATCA registration number is available)
 *  - no commission_rules / payment_methods / products tables (see blueprint §2)
 * Run-once: it skips if a company row already exists.
 */
async function main() {
  const existing = await db.select({ id: s.company.id }).from(s.company).limit(1);
  if (existing.length) {
    console.log('Seed skipped — company already exists.');
    return;
  }

  const companyId = randomUUID();
  await db.insert(s.company).values({
    id: companyId,
    nameEn: 'Relaxation Oasis',
    nameAr: 'واحة الإسترخاء للمساج',
    currency: 'SAR',
    vatNumber: null, // VAT-registered; 15-digit number pending — fill when available
    crNumber: null,
  });

  const branchId = randomUUID();
  await db.insert(s.branches).values({
    id: branchId,
    companyId,
    code: 'JED01',
    nameEn: 'Al Nuzha Branch',
    nameAr: 'فرع النزهة',
    address: 'Al Nuzha District, Jeddah',
  });

  await db.insert(s.roles).values([
    { name: 'admin', permissions: [] },
    { name: 'cashier', permissions: [] },
  ]);

  const cat = { massage: randomUUID(), bath: randomUUID(), pedicure: randomUUID() };
  await db.insert(s.serviceCategories).values([
    { id: cat.massage, nameEn: 'Massage', nameAr: 'المساج', sortOrder: 1 },
    { id: cat.bath, nameEn: 'Moroccan Bath', nameAr: 'الحمام المغربي', sortOrder: 2 },
    { id: cat.pedicure, nameEn: 'Pedicure', nameAr: 'البديكير', sortOrder: 3 },
  ]);

  // Prices are VAT-inclusive (KSA consumer pricing); 15% is extracted at checkout.
  await db.insert(s.services).values([
    { code: 'MSG60', categoryId: cat.massage, kind: 'massage', nameEn: 'One-Hour Massage', nameAr: 'ساعة مساج', durationMin: 60, priceHalalas: toHalalas(250), taxRate: 15, taxable: true },
    { code: 'MSG45', categoryId: cat.massage, kind: 'massage', nameEn: '45-Minute Massage', nameAr: '45 دقيقة مساج', durationMin: 45, priceHalalas: toHalalas(200), taxRate: 15, taxable: true },
    { code: 'BATH30', categoryId: cat.bath, kind: 'moroccan_bath', nameEn: 'Moroccan Bath', nameAr: 'حمام مغربي', durationMin: 30, priceHalalas: toHalalas(180), taxRate: 15, taxable: true },
    { code: 'PED45', categoryId: cat.pedicure, kind: 'pedicure', nameEn: 'Pedicure', nameAr: 'بديكير', durationMin: 45, priceHalalas: toHalalas(200), taxRate: 15, taxable: true },
  ]);

  await db.insert(s.packages).values([
    { code: 'PKG-HALF', nameEn: 'Half-Hour Massage Package', nameAr: 'باكيج نصف ساعة مساج', priceHalalas: toHalalas(250), durationMin: 60, contents: [{ kind: 'massage', minutes: 30 }, { kind: 'moroccan_bath', minutes: 30 }] },
    { code: 'PKG-45', nameEn: '45-Minute Massage Package', nameAr: 'باكيج 45 دقيقة مساج', priceHalalas: toHalalas(300), durationMin: 75, contents: [{ kind: 'massage', minutes: 45 }, { kind: 'moroccan_bath', minutes: 30 }] },
    { code: 'PKG-60', nameEn: 'One-Hour Massage Package', nameAr: 'باكيج ساعة مساج', priceHalalas: toHalalas(350), durationMin: 90, contents: [{ kind: 'massage', minutes: 60 }, { kind: 'moroccan_bath', minutes: 30 }] },
    { code: 'PKG-ROYAL', nameEn: 'The Royal Package', nameAr: 'الباكيج الملكي', priceHalalas: toHalalas(500), durationMin: 135, contents: [{ kind: 'massage', minutes: 60 }, { kind: 'moroccan_bath', minutes: 30 }, { kind: 'pedicure', minutes: 45 }] },
  ]);

  await db.insert(s.rooms).values([
    { branchId, code: 'R1', nameEn: 'Massage Room 1', nameAr: 'غرفة مساج 1', forKind: 'massage' },
    { branchId, code: 'HAM', nameEn: 'Hammam', nameAr: 'الحمام المغربي', forKind: 'moroccan_bath' },
  ]);

  await db.insert(s.therapists).values([
    { branchId, nameEn: 'Therapist A', nameAr: 'المعالج أ', skills: ['massage', 'moroccan_bath'], commissionPercent: 10 },
    { branchId, nameEn: 'Therapist B', nameAr: 'المعالج ب', skills: ['pedicure', 'massage'], commissionPercent: 10 },
  ]);

  console.log('Seed complete: company, branch, 2 roles, 3 categories, 4 services, 4 packages, 2 rooms, 2 therapists.');
}

main()
  .then(() => queryClient.end())
  .catch(async (e) => {
    console.error(e);
    await queryClient.end();
    process.exit(1);
  });

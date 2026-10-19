import { useEffect, useState } from 'react';

export function App() {
  const [syncStatus, setSyncStatus] = useState<{ connected: boolean; lastSyncedAt: string | null }>({
    connected: false,
    lastSyncedAt: null
  });

  useEffect(() => {
    window.electronAPI.sync.getStatus().then(setSyncStatus).catch(console.error);

    const cleanup = window.electronAPI.dashboard.onTablesChanged((tables) => {
      console.log('Tables changed via sync/local:', tables);
    });

    return () => cleanup();
  }, []);

  return (
    <div className="flex flex-col h-screen w-screen p-8 bg-[#FAF7F2]">
      <header className="flex justify-between items-center border-b pb-4 mb-6 border-[#E8DFD8]">
        <div>
          <h1 className="text-2xl font-bold text-[#2D241E]">واحة الإسترخاء للمساج</h1>
          <p className="text-sm text-[#7D6E65]">نظام نقاط البيع وإدارة الصالون · فرع النزهة (JED01-T1)</p>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`inline-block w-3 h-3 rounded-full ${
              syncStatus.connected ? 'bg-emerald-500' : 'bg-amber-500'
            }`}
          />
          <span className="text-xs text-[#7D6E65]">
            {syncStatus.connected ? 'متصل بالسحابة (PowerSync Online)' : 'يعمل دون اتصال (Offline-First SQLite)'}
          </span>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center text-center">
        <div className="max-w-md p-6 bg-white rounded-2xl shadow-sm border border-[#E8DFD8]">
          <h2 className="text-lg font-semibold text-[#2D241E] mb-2">تطبيق سطح المكتب قيد التشغيل بنجاح</h2>
          <p className="text-sm text-[#7D6E65] mb-4">
            تم إعداد بنية Electron + Vite + PowerSync + SQLite مع دعم أجهزة الدفع HALA ونظام الفوترة الإلكترونية ZATCA.
          </p>
        </div>
      </main>
    </div>
  );
}

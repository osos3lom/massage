import { LanguageProvider } from './i18n/LanguageProvider';
import { AppRouter } from './router';

export function App() {
  return (
    <LanguageProvider>
      <div className="h-screen w-screen overflow-hidden flex flex-col bg-aura-bg text-aura-text antialiased">
        <AppRouter />
      </div>
    </LanguageProvider>
  );
}

export default App;

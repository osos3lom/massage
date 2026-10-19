import { useState, useEffect } from 'react';
import PosApp from './features/pos/PosApp';
import DashboardShell from './features/dashboard/DashboardShell';
import OverviewPage from './features/dashboard/OverviewPage';
import BookingsPage from './features/dashboard/BookingsPage';
import ClientsPage from './features/dashboard/ClientsPage';
import ServicesPage from './features/dashboard/ServicesPage';
import PackagesPage from './features/dashboard/PackagesPage';
import PromotionsPage from './features/dashboard/PromotionsPage';
import TherapistsPage from './features/dashboard/TherapistsPage';
import RoomsPage from './features/dashboard/RoomsPage';
import SalesPage from './features/dashboard/SalesPage';
import ShiftsPage from './features/dashboard/ShiftsPage';
import ReportsPage from './features/dashboard/ReportsPage';
import InventoryPage from './features/dashboard/InventoryPage';
import SettingsPage from './features/dashboard/SettingsPage';

function getHashPath(): string {
  const hash = window.location.hash.replace(/^#/, '');
  if (!hash || hash === '/') return '/pos';
  return hash;
}

export function usePathname(): string {
  const [path, setPath] = useState(getHashPath);

  useEffect(() => {
    const handleHashChange = () => setPath(getHashPath());
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  return path;
}

export function useNavigate() {
  return (to: string) => {
    const target = to.startsWith('#') ? to : `#${to}`;
    window.location.hash = target;
  };
}

export function AppRouter() {
  const pathname = usePathname();

  // POS view (fullscreen terminal layout)
  if (pathname === '/pos' || pathname === '') {
    return <PosApp />;
  }

  // Dashboard views wrapped in DashboardShell
  const renderDashboardContent = () => {
    switch (pathname) {
      case '/dashboard':
      case '/dashboard/':
        return <OverviewPage />;
      case '/dashboard/bookings':
        return <BookingsPage />;
      case '/dashboard/clients':
        return <ClientsPage />;
      case '/dashboard/services':
        return <ServicesPage />;
      case '/dashboard/packages':
        return <PackagesPage />;
      case '/dashboard/promotions':
        return <PromotionsPage />;
      case '/dashboard/therapists':
        return <TherapistsPage />;
      case '/dashboard/rooms':
        return <RoomsPage />;
      case '/dashboard/sales':
        return <SalesPage />;
      case '/dashboard/shifts':
        return <ShiftsPage />;
      case '/dashboard/reports':
        return <ReportsPage />;
      case '/dashboard/inventory':
        return <InventoryPage />;
      case '/dashboard/settings':
        return <SettingsPage />;
      default:
        return <OverviewPage />;
    }
  };

  return <DashboardShell>{renderDashboardContent()}</DashboardShell>;
}

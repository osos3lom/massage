import type { Metadata } from 'next';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

// The till runs full-screen without the back-office sidebar (it becomes the Electron app in Phase 2)
export default function PosLayout({ children }: { children: React.ReactNode }) {
  return children;
}

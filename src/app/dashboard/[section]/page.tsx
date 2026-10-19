import { notFound } from 'next/navigation';
import PlannedPage from '@/components/dashboard/PlannedPage';
import { NAV_ITEMS, PLANNED_SECTIONS } from '@/components/dashboard/nav';

// Static export: one placeholder page per sidebar item that isn't built yet
export const dynamicParams = false;

export function generateStaticParams() {
  return PLANNED_SECTIONS.map((section) => ({ section }));
}

export default async function PlannedSectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  const item = NAV_ITEMS.find((i) => i.href === `/dashboard/${section}`);
  if (!item || item.ready) notFound();
  return <PlannedPage navKey={item.key} />;
}

import { PlaceholderPage } from '@/components/business/PlaceholderPage';

const pages = [
  ['airtime', 'Airtime'],
  ['data', 'Data'],
  ['electricity', 'Electricity'],
  ['cable', 'Cable TV'],
  ['bulk', 'Bulk payments'],
] as const;

export function generateStaticParams() {
  return pages.map(([slug]) => ({ slug }));
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const label = pages.find(([s]) => s === slug)?.[1] ?? slug;
  return <PlaceholderPage title={label} description={`${label} payment flow — Phase 2.`} />;
}

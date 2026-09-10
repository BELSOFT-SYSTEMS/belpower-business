import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { AirtimePaymentFlow } from '@/components/business/payments/AirtimePaymentFlow';
import { BulkPaymentFlow } from '@/components/business/payments/BulkPaymentFlow';
import { CablePaymentFlow } from '@/components/business/payments/CablePaymentFlow';
import { DataPaymentFlow } from '@/components/business/payments/DataPaymentFlow';
import { ElectricityPaymentFlow } from '@/components/business/payments/ElectricityPaymentFlow';

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

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const label = pages.find(([value]) => value === slug)?.[1] ?? 'Payments';
  return { title: label };
}

function PaymentRoute({ slug }: { slug: string }) {
  switch (slug) {
    case 'airtime':
      return <AirtimePaymentFlow />;
    case 'data':
      return <DataPaymentFlow />;
    case 'electricity':
      return <ElectricityPaymentFlow />;
    case 'cable':
      return <CablePaymentFlow />;
    case 'bulk':
      return <BulkPaymentFlow />;
    default:
      return null;
  }
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!pages.some(([value]) => value === slug)) {
    notFound();
  }

  return (
    <Suspense fallback={<p className="text-sm text-gray-500">Loading payment…</p>}>
      <PaymentRoute slug={slug} />
    </Suspense>
  );
}

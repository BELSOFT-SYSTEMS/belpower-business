import Link from 'next/link';
import { Suspense } from 'react';
import { Lock } from 'lucide-react';
import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/business/PageHeader';
import { AirtimePaymentFlow } from '@/components/business/payments/AirtimePaymentFlow';
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

const primaryBtn =
  'inline-flex items-center justify-center gap-2 rounded-xl bg-blue-normal px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-normal-hover';
const secondaryBtn =
  'inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50';

export function generateStaticParams() {
  return pages.map(([slug]) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const label = pages.find(([value]) => value === slug)?.[1] ?? 'Payments';
  return { title: label };
}

function BulkComingSoon() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Bulk payments"
        description="Pay many staff numbers at once from the company wallet."
      />
      <section className="rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border-2 border-gray-200 bg-gray-50">
          <Lock className="h-7 w-7 text-gray-500" aria-hidden />
        </div>
        <h2 className="text-xl font-semibold text-gray-900">Coming soon</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-gray-600">
          Bulk airtime and data for beneficiary groups is not available yet. You can still buy for one
          number at a time.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link href="/business/payments/airtime" className={primaryBtn}>
            Buy airtime
          </Link>
          <Link href="/business/payments/data" className={secondaryBtn}>
            Buy data
          </Link>
        </div>
      </section>
    </div>
  );
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
      return <BulkComingSoon />;
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

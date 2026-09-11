'use client';

import Link from 'next/link';
import { Lock } from 'lucide-react';
import { PageHeader } from '@/components/business/PageHeader';

const primaryBtn =
  'inline-flex items-center justify-center gap-2 rounded-xl bg-blue-normal px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-normal-hover';
const secondaryBtn =
  'inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50';

export default function SchedulesPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Schedules"
        description="Set up recurring utility payments from the company wallet."
      />
      <section className="rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border-2 border-gray-200 bg-gray-50">
          <Lock className="h-7 w-7 text-gray-500" aria-hidden />
        </div>
        <h2 className="text-xl font-semibold text-gray-900">Coming soon</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-gray-600">
          Recurring schedules are not available yet. You can still make one-off payments from the
          Payments menu.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link href="/business/payments/airtime" className={primaryBtn}>
            Buy airtime
          </Link>
          <Link href="/business/payments/electricity" className={secondaryBtn}>
            Pay electricity
          </Link>
        </div>
      </section>
    </div>
  );
}

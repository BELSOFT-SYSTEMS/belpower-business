'use client';

import { Copy } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/business/PageHeader';
import { MOCK_VIRTUAL_ACCOUNT } from '@/data/businessMocks';

function copyText(value: string, label: string) {
  navigator.clipboard.writeText(value);
  toast.success(`${label} copied`);
}

export default function FundWalletPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Fund wallet"
        description="Add money to your business wallet via bank transfer or virtual account."
      />

      <section className="rounded-xl border border-blue-200 bg-blue-light/30 p-6">
        <h2 className="text-lg font-semibold text-gray-900">Virtual account (recommended)</h2>
        <p className="mt-2 text-sm text-gray-600">
          Transfer from any Nigerian bank. Your wallet is credited automatically when payment is confirmed.
        </p>
        <dl className="mt-6 space-y-4">
          {[
            ['Bank', MOCK_VIRTUAL_ACCOUNT.bankName],
            ['Account name', MOCK_VIRTUAL_ACCOUNT.accountName],
            ['Account number', MOCK_VIRTUAL_ACCOUNT.accountNumber],
          ].map(([label, value]) => (
            <div key={label} className="flex items-center justify-between gap-4 rounded-lg bg-white px-4 py-3">
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</dt>
                <dd className="mt-0.5 text-sm font-semibold text-gray-900">{value}</dd>
              </div>
              <button
                type="button"
                onClick={() => copyText(value, label)}
                className="rounded-lg border border-gray-200 p-2 text-gray-600 hover:bg-gray-50"
                aria-label={`Copy ${label}`}
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>
          ))}
        </dl>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Bank transfer</h2>
        <p className="mt-2 text-sm text-gray-600">
          Use the virtual account above or contact your Finance Manager for corporate transfer details.
        </p>
        <ul className="mt-4 list-inside list-disc space-y-2 text-sm text-gray-600">
          <li>Minimum funding: ₦1,000</li>
          <li>No transfer fees from BelPower</li>
          <li>Wallet funding is not a bank deposit — funds are for utility payments only</li>
        </ul>
      </section>

      <p className="text-center text-xs text-gray-500">
        Card funding coming in a future release. Demo UI — no real payments processed.
      </p>
    </div>
  );
}

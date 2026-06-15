'use client';

import { Download } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { PageHeader } from '@/components/business/PageHeader';
import { StatusBadge } from '@/components/business/StatusBadge';
import { useBusinessAuth } from '@/context/BusinessAuthContext';
import { getMockWalletStatementsForRole } from '@/data/businessMocks';
import { formatPrice } from '@/utils/formatPrice';

export default function WalletStatementsPage() {
  const { user, demoRole } = useBusinessAuth();
  const role = user?.role ?? demoRole;
  const statements = getMockWalletStatementsForRole(role);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          title="Wallet statements"
          description="Download or review credits and debits on your business wallet."
        />
        <button
          type="button"
          onClick={() => toast.success('Statement export started (demo)')}
          className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-xs font-medium uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Reference</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">Branch</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-4 py-3 text-right">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {statements.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50/80">
                  <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                    {formatDistanceToNow(new Date(row.createdAt), { addSuffix: true })}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-700">{row.reference}</td>
                  <td className="px-4 py-3 text-gray-900">{row.description}</td>
                  <td className="px-4 py-3 text-gray-600">{row.branchName ?? 'Company wallet'}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={row.type} />
                  </td>
                  <td
                    className={`px-4 py-3 text-right font-medium ${row.type === 'credit' ? 'text-green-normal' : 'text-gray-900'}`}
                  >
                    {row.type === 'credit' ? '+' : '-'}
                    {formatPrice(row.amount)}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-900">{formatPrice(row.balanceAfter)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useMemo, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { Download } from 'lucide-react';
import { toast } from 'sonner';
import { BusinessDatePicker } from '@/components/business/BusinessDatePicker';
import { BusinessSelect } from '@/components/business/BusinessSelect';
import { EmptyState } from '@/components/business/EmptyState';
import { PageHeader } from '@/components/business/PageHeader';
import { StatusBadge } from '@/components/business/StatusBadge';
import { useBusinessAuth } from '@/context/BusinessAuthContext';
import {
  getMockBranchWalletOverviewForRole,
  getMockDashboardForRole,
  getMockStatementBranchFilterOptions,
  getMockWalletStatementsForRole,
  getWalletBalanceDisplayForRole,
} from '@/data/businessMocks';
import type { WalletStatementRow } from '@/types/business';
import { formatAdminRoleLabel } from '@/utils/businessRoleDisplay';
import { formatPrice } from '@/utils/formatPrice';

const ALL_BRANCHES = 'all';

function getStatementDateKey(row: WalletStatementRow): string {
  return format(parseISO(row.createdAt), 'yyyy-MM-dd');
}

function isCountableCredit(row: WalletStatementRow): boolean {
  return row.type === 'credit' && row.status === 'completed';
}

function isCountableDebit(row: WalletStatementRow): boolean {
  return row.type === 'debit' && row.status === 'completed';
}

export function WalletStatementsFlow() {
  const { user, demoRole, canAccess } = useBusinessAuth();
  const role = user?.role ?? demoRole;
  const allStatements = getMockWalletStatementsForRole(role);
  const branchOptions = getMockStatementBranchFilterOptions(role);
  const walletDisplay = getWalletBalanceDisplayForRole(role);
  const dashboard = getMockDashboardForRole(role);
  const branchOverview = getMockBranchWalletOverviewForRole(role);

  const [branchFilter, setBranchFilter] = useState(ALL_BRANCHES);
  const [dateFilter, setDateFilter] = useState<string | null>(null);

  const canExport = canAccess('transactions.export');
  const isOpsOfficer = role === 'operations_officer';

  const filteredStatements = useMemo(() => {
    return allStatements
      .filter((row) => {
        if (branchFilter !== ALL_BRANCHES && row.branchName !== branchFilter) {
          return false;
        }
        if (dateFilter && getStatementDateKey(row) !== dateFilter) {
          return false;
        }
        return true;
      })
      .sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
  }, [allStatements, branchFilter, dateFilter]);

  const summary = useMemo(() => {
    const totalCredit = filteredStatements.reduce(
      (sum, row) => (isCountableCredit(row) ? sum + row.amount : sum),
      0,
    );
    const totalDebit = filteredStatements.reduce(
      (sum, row) => (isCountableDebit(row) ? sum + row.amount : sum),
      0,
    );

    let walletBalance = walletDisplay.balance;

    if (branchFilter !== ALL_BRANCHES) {
      const branch = branchOverview.find((item) => item.branchName === branchFilter);
      walletBalance = branch?.allocatedBalance ?? filteredStatements[0]?.balanceAfter ?? walletBalance;
    } else if (dateFilter && filteredStatements.length > 0) {
      walletBalance = filteredStatements[0].balanceAfter;
    }

    return { totalCredit, totalDebit, walletBalance };
  }, [branchFilter, branchOverview, dateFilter, filteredStatements, walletDisplay.balance]);

  const branchSelectOptions = useMemo(
    () => [
      { value: ALL_BRANCHES, label: 'All branches' },
      ...branchOptions.map((branchName) => ({
        value: branchName,
        label: branchName,
      })),
    ],
    [branchOptions],
  );

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          title="Wallet statements"
          description="Review credits, debits, and running balances across your business wallet."
        />
        {canExport && (
          <button
            type="button"
            onClick={() => toast.success('Statement export started (demo)')}
            className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-green-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-500">Total credit</p>
          <p className="mt-1 text-xl font-semibold text-green-normal">
            {formatPrice(summary.totalCredit)}
          </p>
        </div>
        <div className="rounded-xl border border-red-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-500">Total debit</p>
          <p className="mt-1 text-xl font-semibold text-red-normal">
            {formatPrice(summary.totalDebit)}
          </p>
        </div>
        <div className="rounded-xl border border-blue-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-500">
            {branchFilter === ALL_BRANCHES ? walletDisplay.label : `${branchFilter} balance`}
          </p>
          <p className="mt-1 text-xl font-semibold text-gray-900">
            {formatPrice(summary.walletBalance)}
          </p>
          {dashboard.wallet.isFrozen ? (
            <p className="mt-1 text-xs font-medium text-red-normal">Wallet is frozen</p>
          ) : null}
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:flex-row sm:items-end">
        <div className="min-w-[200px] flex-1">
          <label htmlFor="statement-branch-filter" className="mb-1.5 block text-sm font-medium text-gray-700">
            Branch
          </label>
          <BusinessSelect
            id="statement-branch-filter"
            value={branchFilter}
            onChange={setBranchFilter}
            disabled={isOpsOfficer && branchOptions.length <= 1}
            aria-label="Filter by branch"
            options={branchSelectOptions}
          />
        </div>
        <div className="min-w-[200px] sm:w-auto">
          <label htmlFor="statement-date-filter" className="mb-1.5 block text-sm font-medium text-gray-700">
            Date
          </label>
          <BusinessDatePicker
            id="statement-date-filter"
            value={dateFilter}
            onChange={setDateFilter}
            fitContent
            aria-label="Filter by date"
          />
        </div>
      </div>

      {filteredStatements.length === 0 ? (
        <EmptyState
          title="No statement entries"
          description={
            dateFilter || branchFilter !== ALL_BRANCHES
              ? 'No wallet activity matches your filters. Try another branch or date.'
              : 'Wallet funding and debits will appear here once activity starts.'
          }
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50 text-xs font-medium uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Reference</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3">Branch</th>
                  <th className="px-4 py-3">Performed by</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3 text-right">Balance before</th>
                  <th className="px-4 py-3 text-right">Balance after</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredStatements.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50/80">
                    <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                      {format(parseISO(row.createdAt), 'dd MMM yyyy, h:mm a')}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-gray-700">
                      {row.reference}
                    </td>
                    <td className="min-w-[180px] px-4 py-3 text-gray-900">{row.description}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                      {row.branchName ?? '—'}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-900">
                      {row.performedByName}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                      {formatAdminRoleLabel(row.performedByRole)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <StatusBadge status={row.type} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <StatusBadge status={row.status} />
                    </td>
                    <td
                      className={`whitespace-nowrap px-4 py-3 text-right font-medium ${
                        row.type === 'credit' ? 'text-green-normal' : 'text-gray-900'
                      } ${row.status === 'failed' ? 'line-through opacity-60' : ''}`}
                    >
                      {row.type === 'credit' ? '+' : '-'}
                      {formatPrice(row.amount)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-gray-700">
                      {formatPrice(row.balanceBefore)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right font-medium text-gray-900">
                      {formatPrice(row.balanceAfter)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <p className="text-center text-xs text-gray-500">
        Demo UI — statement data is mock until backend integration. Credits and debits totals include
        completed entries only.
      </p>
    </div>
  );
}

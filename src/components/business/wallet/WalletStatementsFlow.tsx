'use client';

import { useEffect, useMemo, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { Download } from 'lucide-react';
import { toast } from 'sonner';
import { BusinessDatePicker } from '@/components/business/BusinessDatePicker';
import { BusinessSelect } from '@/components/business/BusinessSelect';
import { EmptyState } from '@/components/business/EmptyState';
import { PageHeader } from '@/components/business/PageHeader';
import { StatusBadge } from '@/components/business/StatusBadge';
import { useBusinessAuth } from '@/context/BusinessAuthContext';
import { isBranchScopedRole } from '@/constants/businessRoles';
import {
  getMockBranchWalletOverviewForRole,
  getMockDashboardForRole,
  getMockStatementBranchFilterOptions,
  getMockWalletStatementsForRole,
  getWalletBalanceDisplayForRole,
} from '@/data/businessMocks';
import { BusinessApiError, businessWalletApi } from '@/lib/businessApi';
import type { WalletStatementRow } from '@/types/business';
import { formatAdminRoleLabel } from '@/utils/businessRoleDisplay';
import { formatPrice } from '@/utils/formatPrice';

const ALL_WALLETS = 'all';

function getStatementDateKey(row: WalletStatementRow): string {
  return format(parseISO(row.createdAt), 'yyyy-MM-dd');
}

function isCountableCredit(row: WalletStatementRow): boolean {
  return row.type === 'credit' && row.status === 'completed';
}

function isCountableDebit(row: WalletStatementRow): boolean {
  return row.type === 'debit' && row.status === 'completed';
}

type LiveWalletOption = {
  id: string;
  label: string;
  balance: number;
  branchName: string | null;
  isFrozen?: boolean;
};

export function WalletStatementsFlow() {
  const { user, demoRole, canAccess, isAuthenticated } = useBusinessAuth();
  const role = user?.role ?? demoRole;
  const canExport = canAccess('transactions.export');
  const isBranchUser = isBranchScopedRole(role);

  const mockStatements = useMemo(() => getMockWalletStatementsForRole(role), [role]);
  const mockBranchOptions = useMemo(() => getMockStatementBranchFilterOptions(role), [role]);
  const mockWalletDisplay = useMemo(() => getWalletBalanceDisplayForRole(role), [role]);
  const mockDashboard = useMemo(() => getMockDashboardForRole(role), [role]);
  const mockBranchOverview = useMemo(() => getMockBranchWalletOverviewForRole(role), [role]);

  const [walletFilter, setWalletFilter] = useState(ALL_WALLETS);
  const [dateFilter, setDateFilter] = useState<string | null>(null);
  const [liveWallets, setLiveWallets] = useState<LiveWalletOption[]>([]);
  const [liveStatements, setLiveStatements] = useState<WalletStatementRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [companyFrozen, setCompanyFrozen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      setLiveWallets([]);
      setLiveStatements([]);
      return;
    }

    let cancelled = false;
    setLoading(true);
    void (async () => {
      try {
        const overview = await businessWalletApi.overview();
        if (cancelled) return;

        const options: LiveWalletOption[] = [];
        if (overview.companyWallet) {
          const company = overview.wallets.find((w) => w.scope === 'company');
          options.push({
            id: overview.companyWallet.id,
            label: 'Head Office (company)',
            balance: overview.companyWallet.availableBalance,
            branchName: 'Head Office',
            isFrozen: Boolean(company?.isFrozen),
          });
          setCompanyFrozen(Boolean(company?.isFrozen));
        }

        for (const wallet of overview.wallets.filter((w) => w.scope === 'branch')) {
          options.push({
            id: wallet.id,
            label: wallet.branchName || 'Branch',
            balance: wallet.availableBalance,
            branchName: wallet.branchName,
            isFrozen: Boolean(wallet.isFrozen),
          });
        }
        setLiveWallets(options);

        const statements = await businessWalletApi.statements({
          walletId: walletFilter === ALL_WALLETS ? null : walletFilter,
          limit: 100,
        });
        if (cancelled) return;
        setLiveStatements(
          statements.items.map((row) => ({
            ...row,
            createdAt: row.createdAt || new Date().toISOString(),
          })),
        );
      } catch (error) {
        if (!cancelled) {
          toast.error(
            error instanceof BusinessApiError ? error.message : 'Could not load statements',
          );
          setLiveStatements([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, walletFilter]);

  const allStatements = isAuthenticated ? liveStatements : mockStatements;
  const branchOptions = isAuthenticated
    ? liveWallets.map((wallet) => wallet.label)
    : mockBranchOptions;
  const walletDisplay = isAuthenticated
    ? {
        label:
          walletFilter === ALL_WALLETS
            ? 'Wallet balance'
            : liveWallets.find((w) => w.id === walletFilter)?.label || 'Wallet balance',
        balance:
          walletFilter === ALL_WALLETS
            ? liveWallets[0]?.balance ?? 0
            : liveWallets.find((w) => w.id === walletFilter)?.balance ?? 0,
      }
    : mockWalletDisplay;
  const isFrozen = isAuthenticated
    ? walletFilter === ALL_WALLETS
      ? companyFrozen
      : Boolean(liveWallets.find((w) => w.id === walletFilter)?.isFrozen)
    : mockDashboard.wallet.isFrozen;

  const filteredStatements = useMemo(() => {
    return allStatements
      .filter((row) => {
        if (!isAuthenticated && walletFilter !== ALL_WALLETS) {
          const selectedLabel = mockBranchOptions.find((name) => name === walletFilter);
          if (selectedLabel && row.branchName !== selectedLabel) return false;
        }
        if (dateFilter && getStatementDateKey(row) !== dateFilter) {
          return false;
        }
        return true;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [allStatements, dateFilter, isAuthenticated, mockBranchOptions, walletFilter]);

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

    if (!isAuthenticated && walletFilter !== ALL_WALLETS) {
      const branch = mockBranchOverview.find((item) => item.branchName === walletFilter);
      walletBalance = branch?.allocatedBalance ?? filteredStatements[0]?.balanceAfter ?? walletBalance;
    } else if (dateFilter && filteredStatements.length > 0) {
      walletBalance = filteredStatements[0].balanceAfter;
    }

    return { totalCredit, totalDebit, walletBalance };
  }, [
    dateFilter,
    filteredStatements,
    isAuthenticated,
    mockBranchOverview,
    walletDisplay.balance,
    walletFilter,
  ]);

  const branchSelectOptions = useMemo(() => {
    if (isAuthenticated) {
      return [
        { value: ALL_WALLETS, label: 'All wallets' },
        ...liveWallets.map((wallet) => ({
          value: wallet.id,
          label: wallet.label,
        })),
      ];
    }

    return [
      { value: ALL_WALLETS, label: 'All branches' },
      ...branchOptions.map((branchName) => ({
        value: branchName,
        label: branchName,
      })),
    ];
  }, [branchOptions, isAuthenticated, liveWallets]);

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
            onClick={() => {
              if (filteredStatements.length === 0) {
                toast.message('No statement rows to export');
                return;
              }
              const header = [
                'Date',
                'Reference',
                'Type',
                'Description',
                'Amount',
                'Balance Before',
                'Balance After',
                'Branch',
                'Performed By',
                'Role',
                'Status',
              ];
              const lines = filteredStatements.map((row) =>
                [
                  row.createdAt,
                  row.reference,
                  row.type,
                  `"${String(row.description || '').replace(/"/g, '""')}"`,
                  row.amount,
                  row.balanceBefore,
                  row.balanceAfter,
                  row.branchName ?? '',
                  `"${String(row.performedByName || '').replace(/"/g, '""')}"`,
                  row.performedByRole ?? '',
                  row.status,
                ].join(','),
              );
              const csv = [header.join(','), ...lines].join('\n');
              const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              link.download = `wallet-statements-${format(new Date(), 'yyyy-MM-dd')}.csv`;
              link.click();
              URL.revokeObjectURL(url);
              toast.success('Statement CSV downloaded');
            }}
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
          <p className="text-sm text-gray-500">{walletDisplay.label}</p>
          <p className="mt-1 text-xl font-semibold text-gray-900">
            {formatPrice(summary.walletBalance)}
          </p>
          {isFrozen ? (
            <p className="mt-1 text-xs font-medium text-red-normal">Wallet is frozen</p>
          ) : null}
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:flex-row sm:items-end">
        <div className="min-w-[200px] flex-1">
          <label htmlFor="statement-branch-filter" className="mb-1.5 block text-sm font-medium text-gray-700">
            {isAuthenticated ? 'Wallet' : 'Branch'}
          </label>
          <BusinessSelect
            id="statement-branch-filter"
            value={walletFilter}
            onChange={setWalletFilter}
            disabled={
              loading ||
              (isBranchUser &&
                (isAuthenticated ? liveWallets.length <= 1 : mockBranchOptions.length <= 1))
            }
            aria-label={isAuthenticated ? 'Filter by wallet' : 'Filter by branch'}
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
          title={loading ? 'Loading statements…' : 'No statement entries'}
          description={
            loading
              ? 'Fetching wallet activity…'
              : dateFilter || walletFilter !== ALL_WALLETS
                ? 'No wallet activity matches your filters. Try another wallet or date.'
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
    </div>
  );
}

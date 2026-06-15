'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ChevronDown, Download, ArrowRightLeft, Wallet } from 'lucide-react';
import { BusinessTransactionList } from '@/components/business/BusinessTransactionList';
import { useBusinessAuth } from '@/context/BusinessAuthContext';
import {
  getMockBranchWalletOverviewForRole,
  getMockDashboardForRole,
  getMockTransactionsForRole,
  canViewAllBranchWalletInfo,
} from '@/data/businessMocks';
import { formatPrice } from '@/utils/formatPrice';

export default function WalletPage() {
  const { user, demoRole, canAccess } = useBusinessAuth();
  const role = user?.role ?? demoRole;
  const dashboard = getMockDashboardForRole(role);
  const { wallet } = dashboard;
  const branchOptions = getMockBranchWalletOverviewForRole(role);
  const allTransactions = getMockTransactionsForRole(role);

  const defaultBranchId = user?.branchId ?? branchOptions[0]?.branchId ?? '';
  const [selectedBranchId, setSelectedBranchId] = useState(defaultBranchId);

  useEffect(() => {
    const valid = branchOptions.some((b) => b.branchId === selectedBranchId);
    if (!valid) {
      setSelectedBranchId(branchOptions[0]?.branchId ?? '');
    }
  }, [branchOptions, selectedBranchId]);

  const selectedBranch = useMemo(
    () => branchOptions.find((b) => b.branchId === selectedBranchId) ?? branchOptions[0],
    [branchOptions, selectedBranchId]
  );

  const canViewCompanyWallet = canViewAllBranchWalletInfo(role);

  const balanceLabel = canViewCompanyWallet ? 'Company wallet balance' : 'Branch wallet balance';
  const balanceAmount = canViewCompanyWallet
    ? wallet.availableBalance
    : (selectedBranch?.allocatedBalance ?? 0);
  const balanceSubtitle = canViewCompanyWallet
    ? selectedBranch
      ? `${selectedBranch.branchName} allocation: ${formatPrice(selectedBranch.allocatedBalance)}`
      : 'Shared pool — allocate to branches'
    : `Allocated to ${selectedBranch?.branchName ?? 'your branch'}`;

  const branchActivity = useMemo(() => {
    if (!selectedBranch) return [];
    return allTransactions
      .filter((tx) => tx.branchName === selectedBranch.branchName)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [allTransactions, selectedBranch]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="mb-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">Wallet</h1>
          <div className="relative w-full sm:w-auto sm:min-w-[220px]">
            <select
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              disabled={branchOptions.length <= 1}
              className="w-full appearance-none rounded-xl border border-gray-300 bg-white py-2.5 pr-10 pl-4 text-sm font-medium text-gray-900 outline-none focus:border-blue-normal focus:ring-2 focus:ring-blue-normal/20 disabled:cursor-default disabled:bg-gray-50"
              aria-label="Select branch"
            >
              {branchOptions.map((branch) => (
                <option key={branch.branchId} value={branch.branchId}>
                  {canViewCompanyWallet
                    ? `${branch.branchName} · ${formatPrice(branch.allocatedBalance)}`
                    : branch.branchName}
                </option>
              ))}
            </select>
            <ChevronDown
              className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-gray-500"
              aria-hidden
            />
          </div>
        </div>
        <p className="mt-2 text-sm text-gray-600">
          Wallet stats and activity for{' '}
          <span className="font-medium text-gray-900">{selectedBranch?.branchName ?? 'selected branch'}</span>.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-xl border border-green-200 bg-white p-4 shadow-sm sm:col-span-2 lg:col-span-2">
          <p className="text-sm text-gray-500">{balanceLabel}</p>
          <p className="mt-1 text-3xl font-semibold text-gray-900">{formatPrice(balanceAmount)}</p>
          <p className="mt-1 text-xs text-gray-500">{balanceSubtitle}</p>
          {wallet.isFrozen && (
            <p className="mt-2 text-sm font-medium text-red-normal">Wallet is frozen</p>
          )}
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-500">Today&apos;s spend</p>
          <p className="mt-1 text-xl font-semibold text-gray-900">
            {formatPrice(selectedBranch?.todaySpend ?? 0)}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-500">This month</p>
          <p className="mt-1 text-xl font-semibold text-gray-900">
            {formatPrice(selectedBranch?.monthSpend ?? 0)}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-500">Transactions this month</p>
          <p className="mt-1 text-xl font-semibold text-gray-900">
            {selectedBranch?.monthTransactions ?? 0}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        {canAccess('wallet.fund') && (
          <Link
            href="/business/wallet/fund"
            className="inline-flex items-center gap-2 rounded-xl bg-blue-normal px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-normal-hover"
          >
            <Wallet className="h-4 w-4" />
            Fund wallet
          </Link>
        )}
        {canAccess('wallet.allocate') && (
          <Link
            href="/business/wallet/allocate"
            className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-light/40 px-4 py-2.5 text-sm font-semibold text-blue-normal hover:bg-blue-light/60"
          >
            <ArrowRightLeft className="h-4 w-4" />
            Allocate funds
          </Link>
        )}
        {canAccess('wallet.statements') && (
          <Link
            href="/business/wallet/statements"
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <Download className="h-4 w-4" />
            Statements
          </Link>
        )}
      </div>

      <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Recent activity</h2>
          <Link href="/business/transactions" className="text-sm font-medium text-blue-normal hover:underline">
            View all
          </Link>
        </div>
        <BusinessTransactionList
          transactions={branchActivity}
          showEntryTypeBadge
          entryType="debit"
          emptyMessage={`No recent activity for ${selectedBranch?.branchName ?? 'this branch'}.`}
        />
      </section>
    </div>
  );
}

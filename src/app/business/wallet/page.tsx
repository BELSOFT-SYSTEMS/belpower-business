'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { Download, ArrowRightLeft, Wallet } from 'lucide-react';
import { BusinessSelect } from '@/components/business/BusinessSelect';
import { BusinessTransactionList } from '@/components/business/BusinessTransactionList';
import { useBusinessAuth } from '@/context/BusinessAuthContext';
import {
  HEAD_OFFICE_BRANCH_ID,
  canViewAllBranchWalletInfo,
  getMockDashboardForRole,
  getMockTransactionsForRole,
  getTotalAllocatedBalance,
  getWalletScopeOptionsForRole,
  isHeadOfficeWalletScope,
} from '@/data/businessMocks';
import { formatPrice } from '@/utils/formatPrice';

export default function WalletPage() {
  const { user, demoRole, canAccess } = useBusinessAuth();
  const role = user?.role ?? demoRole;
  const dashboard = getMockDashboardForRole(role);
  const { wallet } = dashboard;
  const scopeOptions = useMemo(() => getWalletScopeOptionsForRole(role), [role]);
  const allTransactions = getMockTransactionsForRole(role);
  const canViewCompanyWallet = canViewAllBranchWalletInfo(role);
  const previousRoleRef = useRef(role);

  const [selectedScopeId, setSelectedScopeId] = useState(() =>
    canViewAllBranchWalletInfo(role)
      ? HEAD_OFFICE_BRANCH_ID
      : (user?.branchId ?? scopeOptions[0]?.branchId ?? ''),
  );

  useEffect(() => {
    const roleChanged = previousRoleRef.current !== role;
    previousRoleRef.current = role;

    if (roleChanged) {
      if (canViewCompanyWallet) {
        setSelectedScopeId(HEAD_OFFICE_BRANCH_ID);
        return;
      }
      setSelectedScopeId(user?.branchId ?? scopeOptions[0]?.branchId ?? '');
      return;
    }

    const stillValid = scopeOptions.some((scope) => scope.branchId === selectedScopeId);
    if (!stillValid) {
      setSelectedScopeId(
        canViewCompanyWallet
          ? HEAD_OFFICE_BRANCH_ID
          : (user?.branchId ?? scopeOptions[0]?.branchId ?? ''),
      );
    }
  }, [canViewCompanyWallet, role, scopeOptions, selectedScopeId, user?.branchId]);

  const selectedScope = useMemo(
    () => scopeOptions.find((scope) => scope.branchId === selectedScopeId) ?? scopeOptions[0],
    [scopeOptions, selectedScopeId],
  );

  const viewingHeadOffice = isHeadOfficeWalletScope(selectedScope?.branchId);

  const balanceLabel = viewingHeadOffice
    ? 'Company wallet (Head Office)'
    : canViewCompanyWallet
      ? `${selectedScope?.branchName ?? 'Branch'} allocation`
      : 'Branch wallet balance';

  const balanceAmount = selectedScope?.allocatedBalance ?? 0;

  const balanceSubtitle = viewingHeadOffice
    ? `Held at Head Office · ${formatPrice(getTotalAllocatedBalance())} already allocated to branches`
    : canViewCompanyWallet
      ? 'Allocated from the Head Office company wallet'
      : `Allocated to ${selectedScope?.branchName ?? 'your branch'}`;

  const scopeActivity = useMemo(() => {
    if (!selectedScope) return [];
    return allTransactions
      .filter((tx) => tx.branchName === selectedScope.branchName)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [allTransactions, selectedScope]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="mb-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">Wallet</h1>
          <BusinessSelect
            value={selectedScope?.branchId ?? selectedScopeId}
            onChange={setSelectedScopeId}
            disabled={scopeOptions.length <= 1}
            fitContent
            aria-label="Select wallet scope"
            options={scopeOptions.map((scope) => ({
              value: scope.branchId,
              label: isHeadOfficeWalletScope(scope.branchId)
                ? `Head Office · ${formatPrice(scope.allocatedBalance)} (company)`
                : canViewCompanyWallet
                  ? `${scope.branchName} · ${formatPrice(scope.allocatedBalance)}`
                  : scope.branchName,
            }))}
          />
        </div>
        <p className="mt-2 text-sm text-gray-600">
          Wallet stats and activity for{' '}
          <span className="font-medium text-gray-900">
            {selectedScope?.branchName ?? 'selected location'}
          </span>
          {viewingHeadOffice ? ' (company wallet)' : ''}.
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
            {formatPrice(selectedScope?.todaySpend ?? 0)}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-500">This month</p>
          <p className="mt-1 text-xl font-semibold text-gray-900">
            {formatPrice(selectedScope?.monthSpend ?? 0)}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-500">Transactions this month</p>
          <p className="mt-1 text-xl font-semibold text-gray-900">
            {selectedScope?.monthTransactions ?? 0}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        {canAccess('wallet.fund') && viewingHeadOffice && (
          <Link
            href="/business/wallet/fund"
            className="inline-flex items-center gap-2 rounded-xl bg-blue-normal px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-normal-hover"
          >
            <Wallet className="h-4 w-4" />
            Fund wallet
          </Link>
        )}
        {canAccess('wallet.allocate') && viewingHeadOffice && (
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
          <h2 className="text-lg font-semibold text-gray-900">
            {viewingHeadOffice ? 'Head Office activity' : 'Recent activity'}
          </h2>
          <Link href="/business/transactions" className="text-sm font-medium text-blue-normal hover:underline">
            View all
          </Link>
        </div>
        <BusinessTransactionList
          transactions={scopeActivity}
          emptyMessage={`No recent activity for ${selectedScope?.branchName ?? 'this location'}.`}
        />
      </section>
    </div>
  );
}

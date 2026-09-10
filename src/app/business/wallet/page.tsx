'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { Download, ArrowRightLeft, Wallet } from 'lucide-react';
import { toast } from 'sonner';
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
import { BusinessApiError, businessWalletApi } from '@/lib/businessApi';
import type { BranchWalletOverview, BusinessTransactionPreview } from '@/types/business';
import { formatPrice } from '@/utils/formatPrice';

type LiveScope = BranchWalletOverview & { isFrozen?: boolean };

const COMPANY_SCOPE_ID = HEAD_OFFICE_BRANCH_ID;

export default function WalletPage() {
  const { user, demoRole, canAccess, isAuthenticated, dashboardBootstrap } = useBusinessAuth();
  const role = user?.role ?? demoRole;
  const mockDashboard = getMockDashboardForRole(role);
  const mockScopeOptions = useMemo(() => getWalletScopeOptionsForRole(role), [role]);
  const mockTransactions = getMockTransactionsForRole(role);
  const canViewCompanyWallet = canViewAllBranchWalletInfo(role);
  const previousRoleRef = useRef(role);

  const [liveScopes, setLiveScopes] = useState<LiveScope[] | null>(null);
  const [totalAllocatedLive, setTotalAllocatedLive] = useState(0);
  const [loading, setLoading] = useState(false);

  const [selectedScopeId, setSelectedScopeId] = useState(() =>
    canViewAllBranchWalletInfo(role)
      ? COMPANY_SCOPE_ID
      : (user?.branchId ?? mockScopeOptions[0]?.branchId ?? ''),
  );

  useEffect(() => {
    if (!isAuthenticated) {
      setLiveScopes(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    void (async () => {
      try {
        const overview = await businessWalletApi.overview();
        if (cancelled) return;

        const scopes: LiveScope[] = [];
        if (overview.companyWallet && canViewCompanyWallet) {
          scopes.push({
            branchId: COMPANY_SCOPE_ID,
            branchName: 'Head Office',
            allocatedBalance: overview.companyWallet.availableBalance,
            todaySpend: overview.companyWallet.todaySpend ?? 0,
            monthSpend: overview.companyWallet.monthSpend ?? 0,
            monthTransactions: overview.companyWallet.monthTransactions ?? 0,
            isFrozen: Boolean(
              overview.wallets.find((w) => w.scope === 'company')?.isFrozen,
            ),
          });
        }

        for (const wallet of overview.wallets.filter((w) => w.scope === 'branch')) {
          if (!wallet.branchId) continue;
          scopes.push({
            branchId: wallet.branchId,
            branchName: wallet.branchName || 'Branch',
            allocatedBalance: wallet.availableBalance,
            todaySpend: wallet.todaySpend ?? 0,
            monthSpend: wallet.monthSpend ?? 0,
            monthTransactions: wallet.monthTransactions ?? 0,
            isFrozen: Boolean(wallet.isFrozen),
          });
        }

        setLiveScopes(scopes);
        setTotalAllocatedLive(overview.totalAllocated);
      } catch (error) {
        if (!cancelled) {
          toast.error(
            error instanceof BusinessApiError ? error.message : 'Could not load wallet overview',
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [canViewCompanyWallet, isAuthenticated]);

  const scopeOptions = isAuthenticated ? liveScopes ?? [] : mockScopeOptions;

  useEffect(() => {
    const roleChanged = previousRoleRef.current !== role;
    previousRoleRef.current = role;

    if (roleChanged) {
      if (canViewCompanyWallet) {
        setSelectedScopeId(COMPANY_SCOPE_ID);
        return;
      }
      setSelectedScopeId(user?.branchId ?? scopeOptions[0]?.branchId ?? '');
      return;
    }

    const stillValid = scopeOptions.some((scope) => scope.branchId === selectedScopeId);
    if (!stillValid) {
      setSelectedScopeId(
        canViewCompanyWallet
          ? COMPANY_SCOPE_ID
          : (user?.branchId ?? scopeOptions[0]?.branchId ?? ''),
      );
    }
  }, [canViewCompanyWallet, role, scopeOptions, selectedScopeId, user?.branchId]);

  const selectedScope = useMemo(
    () => scopeOptions.find((scope) => scope.branchId === selectedScopeId) ?? scopeOptions[0],
    [scopeOptions, selectedScopeId],
  );

  const viewingHeadOffice = isHeadOfficeWalletScope(selectedScope?.branchId);
  const isFrozen = Boolean(
    (selectedScope as LiveScope | undefined)?.isFrozen ??
      (isAuthenticated ? false : mockDashboard.wallet.isFrozen),
  );

  const balanceLabel = viewingHeadOffice
    ? 'Company wallet (Head Office)'
    : canViewCompanyWallet
      ? `${selectedScope?.branchName ?? 'Branch'} allocation`
      : 'Branch wallet balance';

  const balanceAmount = selectedScope?.allocatedBalance ?? 0;
  const allocatedTotal = liveScopes ? totalAllocatedLive : getTotalAllocatedBalance();

  const balanceSubtitle = viewingHeadOffice
    ? `Held at Head Office · ${formatPrice(allocatedTotal)} already allocated to branches`
    : canViewCompanyWallet
      ? 'Allocated from the Head Office company wallet'
      : `Allocated to ${selectedScope?.branchName ?? 'your branch'}`;

  const liveTransactions = useMemo((): BusinessTransactionPreview[] => {
    if (!isAuthenticated || !dashboardBootstrap?.recentTransactions) return [];
    return dashboardBootstrap.recentTransactions.map((tx) => ({
      id: tx.id,
      reference: tx.reference,
      service: tx.service || 'payment',
      provider: tx.provider || '—',
      amount: tx.amount,
      status:
        tx.status === 'completed' || tx.status === 'pending' || tx.status === 'failed'
          ? tx.status
          : 'pending',
      entryType: tx.entryType,
      branchName: tx.branchName || '—',
      userName: tx.userName || '—',
      createdAt: tx.createdAt || new Date().toISOString(),
    }));
  }, [dashboardBootstrap?.recentTransactions, isAuthenticated]);

  const scopeActivity = useMemo(() => {
    if (!selectedScope) return [];
    const source = isAuthenticated ? liveTransactions : mockTransactions;
    if (viewingHeadOffice) {
      return source
        .filter(
          (tx) =>
            !tx.branchName ||
            tx.branchName === '—' ||
            tx.branchName === 'Head Office' ||
            tx.service === 'business_wallet_allocate',
        )
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return source
      .filter((tx) => tx.branchName === selectedScope.branchName)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [isAuthenticated, liveTransactions, mockTransactions, selectedScope, viewingHeadOffice]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="mb-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">Wallet</h1>
          <BusinessSelect
            value={selectedScope?.branchId ?? selectedScopeId}
            onChange={setSelectedScopeId}
            disabled={scopeOptions.length <= 1 || loading}
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
          {isFrozen && (
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
          {canAccess('transactions.view') ? (
            <Link
              href="/business/transactions"
              className="text-sm font-medium text-blue-normal hover:underline"
            >
              View all
            </Link>
          ) : null}
        </div>
        <BusinessTransactionList
          transactions={scopeActivity}
          emptyMessage={`No recent activity for ${selectedScope?.branchName ?? 'this location'}.`}
        />
      </section>
    </div>
  );
}

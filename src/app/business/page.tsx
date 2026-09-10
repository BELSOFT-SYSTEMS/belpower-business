'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Wallet, TrendingUp, Clock, Building2 } from 'lucide-react';
import { DigitalMeterDisplay } from '@/components/business/DigitalMeterDisplay';
import { BranchSpendCarousel } from '@/components/business/BranchSpendCarousel';
import { BusinessTransactionList } from '@/components/business/BusinessTransactionList';
import { useBusinessAuth } from '@/context/BusinessAuthContext';
import { getMockDashboardForRole, getWalletBalanceDisplayForRole } from '@/data/businessMocks';
import { canViewCompanyWallet } from '@/constants/businessRoles';
import { formatPrice } from '@/utils/formatPrice';
import { formatAdminRoleLabel } from '@/utils/businessRoleDisplay';
import { formatBusinessBranchLabel } from '@/utils/businessBranchLabel';
import type {
  BranchMeter,
  BusinessRole,
  BusinessTransactionPreview,
  BranchSpendItem,
} from '@/types/business';

const DEMO_ROLES: BusinessRole[] = [
  'super_admin',
  'hq_finance',
  'hq_operations',
  'branch_admin',
  'branch_operations',
  'hq_viewer',
];

function StatCard({
  label,
  value,
  icon,
  borderClass,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  borderClass: string;
}) {
  return (
    <div className={`rounded-xl border bg-white p-4 shadow-sm ${borderClass}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">{value}</p>
        </div>
        <div className="rounded-lg bg-gray-50 p-2 text-blue-normal">{icon}</div>
      </div>
    </div>
  );
}

function mapMeters(
  meters: Array<{
    id: string;
    branchId: string;
    branchName: string;
    meterNumber: string;
    disco: string | null;
    meterType: string | null;
    isHeadOffice?: boolean;
  }> = [],
): BranchMeter[] {
  return meters.map((meter) => ({
    id: meter.id,
    branchId: meter.branchId,
    branchName: meter.branchName,
    meterNumber: meter.meterNumber,
    disco: meter.disco || 'UNKNOWN',
    meterType: meter.meterType === 'postpaid' ? 'postpaid' : 'prepaid',
    isHeadOffice: Boolean(meter.isHeadOffice),
  }));
}

function mapTransactions(
  rows: Array<{
    id: string;
    reference: string;
    service: string | null;
    provider: string | null;
    amount: number;
    status: string;
    entryType: 'credit' | 'debit';
    branchName: string | null;
    userName: string | null;
    createdAt: string | null;
  }> = [],
): BusinessTransactionPreview[] {
  return rows.map((tx) => ({
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
    branchName: formatBusinessBranchLabel(tx.branchName),
    userName: tx.userName || '—',
    createdAt: tx.createdAt || new Date().toISOString(),
  }));
}

export default function BusinessDashboardPage() {
  const {
    user,
    isSuperAdmin,
    demoRole,
    setDemoRole,
    canAccess,
    dashboardBootstrap,
    isAuthenticated,
  } = useBusinessAuth();

  const role = user?.role ?? demoRole;
  const useLive = Boolean(isAuthenticated);

  const mockDashboard = useMemo(() => getMockDashboardForRole(role), [role]);
  const mockWalletDisplay = useMemo(() => getWalletBalanceDisplayForRole(role), [role]);

  const walletLabel = useLive
    ? canViewCompanyWallet(role)
      ? 'Company wallet (Head Office)'
      : 'Branch wallet balance'
    : mockWalletDisplay.label;

  const walletBalance = useLive
    ? Number(dashboardBootstrap?.wallet?.availableBalance ?? dashboardBootstrap?.wallet?.balance ?? 0)
    : mockWalletDisplay.balance;

  const todaySpend = useLive
    ? Number(dashboardBootstrap?.stats?.todaySpend ?? dashboardBootstrap?.wallet?.todaySpend ?? 0)
    : mockDashboard.wallet.todaySpend;

  const monthSpend = useLive
    ? Number(dashboardBootstrap?.stats?.monthSpend ?? dashboardBootstrap?.wallet?.monthSpend ?? 0)
    : mockDashboard.wallet.monthSpend;

  const activeBranches = useLive
    ? Number(dashboardBootstrap?.stats?.activeBranches ?? dashboardBootstrap?.branches?.length ?? 0)
    : mockDashboard.branchSpend.length;

  const meters = useLive ? mapMeters(dashboardBootstrap?.meters) : mockDashboard.meters;

  const recentTransactions = useLive
    ? mapTransactions(dashboardBootstrap?.recentTransactions)
    : mockDashboard.recentTransactions;

  const branchSpend: BranchSpendItem[] = useLive
    ? (dashboardBootstrap?.branchSpend || []).map((row) => ({
        branchId: row.branchId,
        branchName: row.branchName,
        amount: row.amount,
      }))
    : mockDashboard.branchSpend;

  const greetingName = user?.firstName ?? 'there';

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-gray-500">Welcome back</p>
          <h1 className="text-2xl font-semibold text-gray-900">{greetingName}</h1>
          <p className="mt-1 text-sm text-gray-600">What would you like to do today?</p>
        </div>

        {process.env.NODE_ENV === 'development' && !isAuthenticated && (
          <div className="flex flex-wrap gap-2">
            {DEMO_ROLES.map((demo) => (
              <button
                key={demo}
                type="button"
                onClick={() => setDemoRole(demo)}
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  role === demo ? 'bg-blue-normal text-white' : 'bg-gray-100 text-gray-700'
                }`}
              >
                {formatAdminRoleLabel(demo)}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={walletLabel}
          value={formatPrice(walletBalance)}
          icon={<Wallet className="h-5 w-5" />}
          borderClass="border-green-200"
        />
        <StatCard
          label="Today's spend"
          value={formatPrice(todaySpend)}
          icon={<TrendingUp className="h-5 w-5" />}
          borderClass="border-blue-200"
        />
        <StatCard
          label="This month"
          value={formatPrice(monthSpend)}
          icon={<Clock className="h-5 w-5" />}
          borderClass="border-purple-200"
        />
        <StatCard
          label="Active branches"
          value={String(activeBranches)}
          icon={<Building2 className="h-5 w-5" />}
          borderClass="border-amber-200"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2 xl:items-stretch">
        <div className="flex min-h-0 w-full min-w-0 flex-col">
          <DigitalMeterDisplay
            meters={meters}
            walletBalance={walletBalance}
            allowSwipe={isSuperAdmin || canViewCompanyWallet(role)}
          />
        </div>

        <section className="flex h-full min-h-0 flex-col rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex shrink-0 items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Quick actions</h2>
          </div>
          <div className="flex flex-1 items-center">
            {canAccess('payments.single') ? (
              <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  {
                    name: 'Airtime',
                    href: '/business/payments/airtime',
                    emoji: '/airtime.png',
                    color: 'bg-green-50',
                  },
                  {
                    name: 'Data',
                    href: '/business/payments/data',
                    emoji: '/data.png',
                    color: 'bg-pink-50',
                  },
                  {
                    name: 'Electricity',
                    href: '/business/payments/electricity',
                    emoji: '/electricity.png',
                    color: 'bg-purple-50',
                  },
                  {
                    name: 'Cable TV',
                    href: '/business/payments/cable',
                    emoji: '/Tv.png',
                    color: 'bg-yellow-50',
                  },
                ].map((action) => (
                  <Link
                    key={action.href}
                    href={action.href}
                    className={`${action.color} flex flex-col items-center gap-2 rounded-xl border border-gray-100 p-4 transition hover:shadow-md`}
                  >
                    <Image src={action.emoji} alt={action.name} width={40} height={40} />
                    <span className="text-sm font-medium text-gray-800">{action.name}</span>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="w-full text-center text-sm text-gray-500">
                Payment shortcuts are not available for your role.
              </p>
            )}
          </div>
        </section>
      </div>

      <section className="min-w-0 rounded-xl border border-gray-200 bg-white p-3 shadow-sm sm:p-4">
        <div className="mb-4 flex min-w-0 items-center justify-between gap-3">
          <h2 className="min-w-0 truncate text-lg font-semibold text-gray-900">Recent transactions</h2>
          {canAccess('transactions.view') ? (
            <Link
              href="/business/transactions"
              className="shrink-0 text-sm font-medium text-blue-normal hover:underline"
            >
              View all
            </Link>
          ) : null}
        </div>
        <BusinessTransactionList transactions={recentTransactions} />
      </section>

      {(isSuperAdmin || canViewCompanyWallet(role)) && (
        <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <BranchSpendCarousel role={role} items={useLive ? branchSpend : undefined} />
        </section>
      )}
    </div>
  );
}

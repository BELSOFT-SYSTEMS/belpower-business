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
import { formatPrice } from '@/utils/formatPrice';

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

export default function BusinessDashboardPage() {
  const { user, isSuperAdmin, demoRole, setDemoRole, canAccess } = useBusinessAuth();

  const dashboard = useMemo(
    () => getMockDashboardForRole(user?.role ?? demoRole),
    [user?.role, demoRole]
  );

  const walletDisplay = useMemo(
    () => getWalletBalanceDisplayForRole(user?.role ?? demoRole),
    [user?.role, demoRole]
  );

  const greetingName = user?.firstName ?? 'there';

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-gray-500">Welcome back</p>
          <h1 className="text-2xl font-semibold text-gray-900">{greetingName}</h1>
          <p className="mt-1 text-sm text-gray-600">What would you like to do today?</p>
        </div>

        {process.env.NODE_ENV === 'development' && (
          <div className="flex flex-wrap gap-2">
            {(['super_admin', 'finance_manager', 'operations_officer', 'viewer'] as const).map(
              (role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setDemoRole(role)}
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    (user?.role ?? demoRole) === role
                      ? 'bg-blue-normal text-white'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {role.replace('_', ' ')}
                </button>
              )
            )}
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={walletDisplay.label}
          value={formatPrice(walletDisplay.balance)}
          icon={<Wallet className="h-5 w-5" />}
          borderClass="border-green-200"
        />
        <StatCard
          label="Today's spend"
          value={formatPrice(dashboard.wallet.todaySpend)}
          icon={<TrendingUp className="h-5 w-5" />}
          borderClass="border-blue-200"
        />
        <StatCard
          label="This month"
          value={formatPrice(dashboard.wallet.monthSpend)}
          icon={<Clock className="h-5 w-5" />}
          borderClass="border-purple-200"
        />
        <StatCard
          label="Active branches"
          value={String(dashboard.branchSpend.length)}
          icon={<Building2 className="h-5 w-5" />}
          borderClass="border-amber-200"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2 xl:items-stretch">
        <div className="flex min-h-0 w-full min-w-0 flex-col">
          <DigitalMeterDisplay
            meters={dashboard.meters}
            walletBalance={walletDisplay.balance}
            allowSwipe={isSuperAdmin}
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
              { name: 'Airtime', href: '/business/payments/airtime', emoji: '/airtime.png', color: 'bg-green-50' },
              { name: 'Data', href: '/business/payments/data', emoji: '/data.png', color: 'bg-pink-50' },
              { name: 'Electricity', href: '/business/payments/electricity', emoji: '/electricity.png', color: 'bg-purple-50' },
              { name: 'Cable TV', href: '/business/payments/cable', emoji: '/Tv.png', color: 'bg-yellow-50' },
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

      <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Recent transactions</h2>
          <Link href="/business/transactions" className="text-sm font-medium text-blue-normal hover:underline">
            View all
          </Link>
        </div>
        <BusinessTransactionList transactions={dashboard.recentTransactions} />
      </section>

      {isSuperAdmin && (
        <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <BranchSpendCarousel role={user?.role ?? demoRole} />
        </section>
      )}
    </div>
  );
}

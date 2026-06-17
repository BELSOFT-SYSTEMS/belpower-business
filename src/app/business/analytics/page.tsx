'use client';

import { useMemo } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { PageHeader } from '@/components/business/PageHeader';
import { useBusinessAuth } from '@/context/BusinessAuthContext';
import { getMockAnalyticsForRole } from '@/data/businessMocks';
import { formatPrice } from '@/utils/formatPrice';

export default function AnalyticsPage() {
  const { user, demoRole } = useBusinessAuth();
  const role = user?.role ?? demoRole;

  const analytics = useMemo(() => getMockAnalyticsForRole(role), [role]);

  const branchChartData = analytics.branchSpend.map((branch) => ({
    name: branch.branchName.replace(' Branch', '').replace('Head Office', 'HQ'),
    spend: branch.amount,
  }));

  const serviceChartData = analytics.serviceBreakdown.map((item) => ({
    name: item.service,
    spend: item.amount,
  }));

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title="Analytics"
        description="Spending overview across branches and services (mock data)."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-500">Spend this month</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">
            {formatPrice(analytics.totalSpendThisMonth)}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-500">Transactions</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">
            {analytics.totalTransactionsThisMonth.toLocaleString()}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-500">Average payment</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">
            {formatPrice(analytics.averageTransactionAmount)}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Spend by branch</h2>
          {branchChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={branchChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip
                  formatter={(value) =>
                    typeof value === 'number' ? formatPrice(value) : String(value ?? '')
                  }
                  contentStyle={{
                    borderRadius: '0.5rem',
                    border: '1px solid #e5e7eb',
                  }}
                />
                <Bar dataKey="spend" fill="#0064FF" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-12 text-center text-sm text-gray-500">No branch data for your role.</p>
          )}
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Spend by service</h2>
          {serviceChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={serviceChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip
                  formatter={(value) =>
                    typeof value === 'number' ? formatPrice(value) : String(value ?? '')
                  }
                  contentStyle={{
                    borderRadius: '0.5rem',
                    border: '1px solid #e5e7eb',
                  }}
                />
                <Bar dataKey="spend" fill="#7c3aed" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-12 text-center text-sm text-gray-500">No service breakdown yet.</p>
          )}
        </section>
      </div>

      <p className="text-center text-xs text-gray-500">
        Mock analytics — live reporting will connect in Phase 3.
      </p>
    </div>
  );
}

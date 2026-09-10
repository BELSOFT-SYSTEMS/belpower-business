'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { toast } from 'sonner';
import { PageHeader } from '@/components/business/PageHeader';
import { useBusinessAuth } from '@/context/BusinessAuthContext';
import { BusinessApiError } from '@/lib/businessApi';
import { businessAnalyticsApi } from '@/lib/businessAnalyticsApi';
import type { BusinessAnalyticsData } from '@/types/business';
import { formatPrice } from '@/utils/formatPrice';

const EMPTY_ANALYTICS: BusinessAnalyticsData = {
  totalSpendThisMonth: 0,
  totalTransactionsThisMonth: 0,
  averageTransactionAmount: 0,
  branchSpend: [],
  serviceBreakdown: [],
};

export default function AnalyticsPage() {
  const { isAuthenticated } = useBusinessAuth();
  const [analytics, setAnalytics] = useState<BusinessAnalyticsData>(EMPTY_ANALYTICS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    void (async () => {
      try {
        const data = await businessAnalyticsApi.get();
        if (!cancelled) setAnalytics(data);
      } catch (error) {
        if (!cancelled) {
          toast.error(
            error instanceof BusinessApiError ? error.message : 'Could not load analytics',
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  const branchChartData = useMemo(
    () =>
      analytics.branchSpend.map((branch) => ({
        name: branch.branchName.replace(' Branch', '').replace('Head Office', 'HQ'),
        spend: branch.amount,
      })),
    [analytics.branchSpend],
  );

  const serviceChartData = useMemo(
    () =>
      analytics.serviceBreakdown.map((item) => ({
        name: item.service,
        spend: item.amount,
      })),
    [analytics.serviceBreakdown],
  );

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title="Analytics"
        description="Spending overview across branches and services for the current month."
      />

      {loading ? (
        <p className="text-sm text-gray-500">Loading analytics…</p>
      ) : (
        <>
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
                <p className="py-12 text-center text-sm text-gray-500">
                  No branch spend this month.
                </p>
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
                    <Bar dataKey="spend" fill="#0f766e" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="py-12 text-center text-sm text-gray-500">No service breakdown yet.</p>
              )}
            </section>
          </div>
        </>
      )}
    </div>
  );
}

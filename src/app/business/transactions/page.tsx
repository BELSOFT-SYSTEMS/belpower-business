'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { PageHeader } from '@/components/business/PageHeader';
import { BusinessTransactionList } from '@/components/business/BusinessTransactionList';
import { useBusinessAuth } from '@/context/BusinessAuthContext';
import { getMockTransactionsForRole } from '@/data/businessMocks';
import { BusinessApiError, businessTransactionsApi } from '@/lib/businessApi';
import type { BusinessTransactionPreview } from '@/types/business';
import { toast } from 'sonner';
import { formatBusinessBranchLabel } from '@/utils/businessBranchLabel';
import { resolveBusinessTransactionProvider } from '@/utils/resolveBusinessTransactionProvider';

const STATUS_FILTERS = ['all', 'completed', 'pending', 'failed'] as const;

function mapLiveTransactions(
  rows: Array<{
    id: string;
    reference: string;
    service: string;
    provider: string | null;
    amount: number;
    status: string;
    entryType: 'credit' | 'debit';
    branchName: string | null;
    userName: string | null;
    createdAt: string | null;
    metadata?: Record<string, unknown> | null;
  }>,
): BusinessTransactionPreview[] {
  return rows.map((tx) => ({
    id: tx.id,
    reference: tx.reference,
    service: tx.service || 'payment',
    provider: resolveBusinessTransactionProvider({
      provider: tx.provider,
      metadata: tx.metadata,
    }),
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

export default function TransactionsPage() {
  const { user, demoRole, isAuthenticated } = useBusinessAuth();
  const role = user?.role ?? demoRole;
  const [transactions, setTransactions] = useState<BusinessTransactionPreview[]>(() =>
    isAuthenticated ? [] : getMockTransactionsForRole(role),
  );
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_FILTERS)[number]>('all');
  const [search, setSearch] = useState('');

  const handleTransactionUpdated = useCallback(
    (update: {
      id: string;
      status?: BusinessTransactionPreview['status'];
      amount?: number;
      reference?: string;
      service?: string;
      provider?: string;
      branchName?: string;
      userName?: string;
      createdAt?: string;
      entryType?: BusinessTransactionPreview['entryType'];
    }) => {
      setTransactions((prev) =>
        prev.map((tx) =>
          tx.id === update.id
            ? {
                ...tx,
                ...update,
                status: update.status ?? tx.status,
              }
            : tx,
        ),
      );
    },
    [],
  );

  useEffect(() => {
    if (!isAuthenticated) {
      setTransactions(getMockTransactionsForRole(role));
      return;
    }

    let cancelled = false;
    setLoading(true);
    void (async () => {
      try {
        const result = await businessTransactionsApi.list({ limit: 100 });
        if (!cancelled) setTransactions(mapLiveTransactions(result.items));
      } catch (error) {
        if (!cancelled) {
          toast.error(
            error instanceof BusinessApiError ? error.message : 'Could not load transactions',
          );
          setTransactions([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, role]);

  const filtered = useMemo(() => {
    return transactions.filter((tx) => {
      const matchesStatus = statusFilter === 'all' || tx.status === statusFilter;
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        tx.reference.toLowerCase().includes(q) ||
        tx.branchName.toLowerCase().includes(q) ||
        tx.service.toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [transactions, statusFilter, search]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title="Transactions"
        description="All utility payments made from your business wallet."
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${
                statusFilter === status ? 'bg-blue-normal text-white' : 'bg-gray-100 text-gray-700'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
        <input
          type="search"
          placeholder="Search reference, branch, service…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-gray-300 px-4 py-2 text-sm sm:max-w-xs"
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white p-3 shadow-sm sm:p-4">
        <BusinessTransactionList
          transactions={filtered}
          emptyMessage={
            loading ? 'Loading transactions…' : 'No transactions match your filters.'
          }
          onTransactionUpdated={handleTransactionUpdated}
        />
      </div>
    </div>
  );
}

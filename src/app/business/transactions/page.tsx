'use client';

import { useMemo, useState } from 'react';
import { PageHeader } from '@/components/business/PageHeader';
import { BusinessTransactionList } from '@/components/business/BusinessTransactionList';
import { useBusinessAuth } from '@/context/BusinessAuthContext';
import { getMockTransactionsForRole } from '@/data/businessMocks';

const STATUS_FILTERS = ['all', 'completed', 'pending', 'failed'] as const;

export default function TransactionsPage() {
  const { user, demoRole } = useBusinessAuth();
  const role = user?.role ?? demoRole;
  const transactions = getMockTransactionsForRole(role);
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_FILTERS)[number]>('all');
  const [search, setSearch] = useState('');

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

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <BusinessTransactionList
          transactions={filtered}
          emptyMessage="No transactions match your filters."
        />
      </div>
    </div>
  );
}

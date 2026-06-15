'use client';

import { useMemo, useState } from 'react';
import { ArrowRightLeft } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/business/PageHeader';
import { useBusinessAuth } from '@/context/BusinessAuthContext';
import {
  getMockBranchWalletOverviewForRole,
  getMockDashboardForRole,
  getTotalAllocatedBalance,
  getUnallocatedCompanyBalance,
} from '@/data/businessMocks';
import { formatPrice } from '@/utils/formatPrice';

export default function AllocateFundsPage() {
  const { user, demoRole } = useBusinessAuth();
  const role = user?.role ?? demoRole;
  const dashboard = getMockDashboardForRole(role);
  const branches = getMockBranchWalletOverviewForRole(role);
  const unallocated = getUnallocatedCompanyBalance();
  const totalAllocated = getTotalAllocatedBalance();

  const [branchId, setBranchId] = useState(branches[0]?.branchId ?? '');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');

  const selectedBranch = useMemo(
    () => branches.find((b) => b.branchId === branchId),
    [branches, branchId]
  );

  const parsedAmount = Number(amount.replace(/,/g, '')) || 0;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedBranch) {
      toast.error('Select a branch');
      return;
    }
    if (parsedAmount < 1000) {
      toast.error('Minimum allocation is ₦1,000');
      return;
    }
    if (parsedAmount > unallocated) {
      toast.error('Amount exceeds unallocated company balance');
      return;
    }
    toast.success(
      `₦${parsedAmount.toLocaleString()} allocated to ${selectedBranch.branchName} (demo only)`
    );
    setAmount('');
    setNote('');
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Allocate funds"
        description="Move money from the company wallet into branch allocations. Branches spend from their allocated balance."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-green-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-500">Company wallet</p>
          <p className="mt-1 text-xl font-semibold text-gray-900">
            {formatPrice(dashboard.wallet.availableBalance)}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-500">Total allocated</p>
          <p className="mt-1 text-xl font-semibold text-gray-900">{formatPrice(totalAllocated)}</p>
        </div>
        <div className="rounded-xl border border-blue-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-500">Available to allocate</p>
          <p className="mt-1 text-xl font-semibold text-gray-900">{formatPrice(unallocated)}</p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
      >
        <h2 className="text-lg font-semibold text-gray-900">New allocation</h2>

        <div>
          <label htmlFor="allocate-branch" className="block text-sm font-medium text-gray-700">
            Branch
          </label>
          <select
            id="allocate-branch"
            value={branchId}
            onChange={(e) => setBranchId(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-blue-normal focus:ring-2 focus:ring-blue-normal/20"
          >
            {branches.map((branch) => (
              <option key={branch.branchId} value={branch.branchId}>
                {branch.branchName} — current {formatPrice(branch.allocatedBalance)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="allocate-amount" className="block text-sm font-medium text-gray-700">
            Amount (NGN)
          </label>
          <input
            id="allocate-amount"
            type="text"
            inputMode="numeric"
            placeholder="e.g. 50000"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-blue-normal focus:ring-2 focus:ring-blue-normal/20"
          />
          {parsedAmount > 0 && parsedAmount > unallocated && (
            <p className="mt-1 text-xs text-red-normal">
              Exceeds available balance ({formatPrice(unallocated)})
            </p>
          )}
        </div>

        <div>
          <label htmlFor="allocate-note" className="block text-sm font-medium text-gray-700">
            Note (optional)
          </label>
          <input
            id="allocate-note"
            type="text"
            placeholder="e.g. Q2 operations budget"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-blue-normal focus:ring-2 focus:ring-blue-normal/20"
          />
        </div>

        <button
          type="submit"
          className="inline-flex items-center gap-2 rounded-xl bg-blue-normal px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-normal-hover disabled:opacity-50"
          disabled={!parsedAmount || parsedAmount > unallocated}
        >
          <ArrowRightLeft className="h-4 w-4" />
          Allocate funds
        </button>
      </form>

      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Branch allocations</h2>
        <p className="mt-1 text-sm text-gray-600">
          Current allocated balance per branch. Reallocate by moving funds between branches (coming soon).
        </p>
        <ul className="mt-4 divide-y divide-gray-100">
          {branches.map((branch) => (
            <li key={branch.branchId} className="flex items-center justify-between py-3">
              <span className="text-sm font-medium text-gray-900">{branch.branchName}</span>
              <span className="text-sm font-semibold text-gray-900">
                {formatPrice(branch.allocatedBalance)}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <p className="text-center text-xs text-gray-500">
        Demo UI — allocations are not persisted until backend integration.
      </p>
    </div>
  );
}

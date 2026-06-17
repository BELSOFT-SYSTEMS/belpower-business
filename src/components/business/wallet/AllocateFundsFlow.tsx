'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRightLeft, Check, Loader2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { BusinessSelect } from '@/components/business/BusinessSelect';
import { PageHeader } from '@/components/business/PageHeader';
import { useBusinessAuth } from '@/context/BusinessAuthContext';
import {
  getMockBranchWalletOverviewForRole,
  getMockDashboardForRole,
  getTotalAllocatedBalance,
  getUnallocatedCompanyBalance,
} from '@/data/businessMocks';
import {
  MIN_ALLOCATE_AMOUNT,
  mockSubmitAllocation,
} from '@/data/mockAllocateFundsFlow';
import { formatPrice } from '@/utils/formatPrice';

type FlowView = 'form' | 'success' | 'failed';

function parseAmount(value: string): number {
  const parsed = Number(value.replace(/,/g, '').trim());
  return Number.isFinite(parsed) ? parsed : 0;
}

export function AllocateFundsFlow() {
  const { user, demoRole } = useBusinessAuth();
  const role = user?.role ?? demoRole;
  const dashboard = getMockDashboardForRole(role);
  const branches = getMockBranchWalletOverviewForRole(role);
  const unallocated = getUnallocatedCompanyBalance();
  const totalAllocated = getTotalAllocatedBalance();

  const [view, setView] = useState<FlowView>('form');
  const [branchId, setBranchId] = useState(branches[0]?.branchId ?? '');
  const [amountInput, setAmountInput] = useState('');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastAllocation, setLastAllocation] = useState<{
    amount: number;
    branchName: string;
    reference: string;
  } | null>(null);

  const selectedBranch = useMemo(
    () => branches.find((branch) => branch.branchId === branchId),
    [branches, branchId],
  );

  const amount = useMemo(() => parseAmount(amountInput), [amountInput]);
  const amountBelowMinimum = amountInput.length > 0 && amount > 0 && amount < MIN_ALLOCATE_AMOUNT;
  const amountExceedsBalance = amount > unallocated;

  const resetForm = () => {
    setView('form');
    setAmountInput('');
    setNote('');
    setLastAllocation(null);
  };

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!selectedBranch) {
      toast.error('Select a branch');
      return;
    }
    if (amount < MIN_ALLOCATE_AMOUNT) {
      toast.error(`Minimum allocation is ${formatPrice(MIN_ALLOCATE_AMOUNT)}`);
      return;
    }
    if (amount > unallocated) {
      toast.error('Amount exceeds unallocated company balance');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await mockSubmitAllocation({
        branchId: selectedBranch.branchId,
        branchName: selectedBranch.branchName,
        amount,
        note: note.trim() || undefined,
      });

      setLastAllocation({
        amount,
        branchName: selectedBranch.branchName,
        reference: result.reference,
      });
      setView('success');
      toast.success('Funds allocated successfully');
    } catch {
      setView('failed');
      toast.error('Allocation could not be completed');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (view === 'success' && lastAllocation) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <PageHeader
          title="Allocate funds"
          description="Move money from the company wallet into branch allocations."
        />
        <section className="rounded-xl border border-green-200 bg-green-50 p-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border-2 border-green-200 bg-white">
            <Check className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Allocation successful</h2>
          <p className="mt-2 text-sm text-gray-600">
            {formatPrice(lastAllocation.amount)} has been allocated to{' '}
            <span className="font-medium text-gray-900">{lastAllocation.branchName}</span> (demo).
          </p>
          <p className="mt-1 text-xs text-gray-500">Reference: {lastAllocation.reference}</p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/business/wallet"
              className="rounded-xl bg-blue-normal px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-normal-hover"
            >
              Back to wallet
            </Link>
            <button
              type="button"
              onClick={resetForm}
              className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Allocate again
            </button>
          </div>
        </section>
      </div>
    );
  }

  if (view === 'failed') {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <PageHeader
          title="Allocate funds"
          description="Move money from the company wallet into branch allocations."
        />
        <section className="rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border-2 border-red-200 bg-white">
            <XCircle className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Allocation failed</h2>
          <p className="mt-2 text-sm text-gray-600">
            We could not complete this allocation. Check the amount and try again.
          </p>
          <button
            type="button"
            onClick={() => setView('form')}
            className="mt-6 rounded-xl bg-blue-normal px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-normal-hover"
          >
            Try again
          </button>
        </section>
      </div>
    );
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
          <BusinessSelect
            id="allocate-branch"
            value={branchId}
            onChange={setBranchId}
            className="mt-1.5"
            disabled={isSubmitting}
            options={branches.map((branch) => ({
              value: branch.branchId,
              label: `${branch.branchName} — current ${formatPrice(branch.allocatedBalance)}`,
            }))}
          />
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
            value={amountInput}
            onChange={(event) => setAmountInput(event.target.value)}
            disabled={isSubmitting}
            className="mt-1.5 w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-blue-normal focus:ring-2 focus:ring-blue-normal/20 disabled:bg-gray-50"
          />
          <p className="mt-2 text-xs text-gray-500">
            Minimum {formatPrice(MIN_ALLOCATE_AMOUNT)} · Available {formatPrice(unallocated)}
          </p>
          {amountBelowMinimum ? (
            <p className="mt-2 text-xs text-red-600">
              Enter at least {formatPrice(MIN_ALLOCATE_AMOUNT)}.
            </p>
          ) : null}
          {amountExceedsBalance ? (
            <p className="mt-2 text-xs text-red-600">
              Exceeds available balance ({formatPrice(unallocated)}).
            </p>
          ) : null}
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
            onChange={(event) => setNote(event.target.value)}
            disabled={isSubmitting}
            className="mt-1.5 w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-blue-normal focus:ring-2 focus:ring-blue-normal/20 disabled:bg-gray-50"
          />
        </div>

        <button
          type="submit"
          disabled={
            isSubmitting ||
            !amount ||
            amount < MIN_ALLOCATE_AMOUNT ||
            amount > unallocated ||
            !selectedBranch
          }
          className="inline-flex items-center gap-2 rounded-xl bg-blue-normal px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-normal-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Allocating…
            </>
          ) : (
            <>
              <ArrowRightLeft className="h-4 w-4" />
              Allocate funds
            </>
          )}
        </button>
      </form>

      <p className="text-center text-xs text-gray-500">
        Demo UI — allocations are not persisted until backend integration.
      </p>
    </div>
  );
}

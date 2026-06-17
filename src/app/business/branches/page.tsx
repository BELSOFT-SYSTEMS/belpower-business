'use client';

import { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { BusinessFormModal } from '@/components/business/BusinessFormModal';
import { EmptyState } from '@/components/business/EmptyState';
import { PageHeader } from '@/components/business/PageHeader';
import { StatusBadge } from '@/components/business/StatusBadge';
import { useBusinessAuth } from '@/context/BusinessAuthContext';
import {
  canViewAllBranchWalletInfo,
  getMockBranchWalletOverviewForRole,
  getMockBranchesForRole,
} from '@/data/businessMocks';
import { formatPrice } from '@/utils/formatPrice';

export default function BranchesPage() {
  const { user, demoRole, canAccess } = useBusinessAuth();
  const role = user?.role ?? demoRole;
  const branches = getMockBranchesForRole(role);
  const branchWallets = getMockBranchWalletOverviewForRole(role);
  const canViewBalances = canViewAllBranchWalletInfo(role);
  const [addOpen, setAddOpen] = useState(false);

  const walletByBranchId = useMemo(
    () => new Map(branchWallets.map((b) => [b.branchId, b])),
    [branchWallets]
  );

  const handleAddBranch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get('name') ?? '').trim();
    setAddOpen(false);
    toast.success(`${name || 'Branch'} added (demo)`);
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          title="Branches"
          description="Organize your company locations. Branches share one business wallet (MVP)."
        />
        {canAccess('branches.manage') && (
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-normal px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-normal-hover"
          >
            <Plus className="h-4 w-4" />
            Add branch
          </button>
        )}
      </div>

      {branches.length === 0 ? (
        <EmptyState
          title="No branches yet"
          description="Add your first branch to organize team members and spending."
          action={
            canAccess('branches.manage') ? (
              <button
                type="button"
                onClick={() => setAddOpen(true)}
                className="rounded-xl bg-blue-normal px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-normal-hover"
              >
                Add branch
              </button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {branches.map((branch) => {
            const wallet = walletByBranchId.get(branch.id);
            return (
              <article
                key={branch.id}
                className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">{branch.name}</h2>
                    <p className="text-sm text-gray-500">
                      {branch.code} · {branch.city}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {branch.isHeadOffice && (
                      <span className="rounded-full bg-blue-light px-2 py-0.5 text-xs font-medium text-blue-normal">
                        Head Office
                      </span>
                    )}
                    <StatusBadge status={branch.status} />
                  </div>
                </div>
                <p className="mt-3 text-sm text-gray-600">
                  {branch.address}, {branch.city}
                </p>
                <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <dt className="text-gray-500">Team members</dt>
                    <dd className="font-medium text-gray-900">{branch.userCount}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Meters linked</dt>
                    <dd className="font-medium text-gray-900">{branch.meterCount}</dd>
                  </div>
                  {wallet && (
                    <>
                      <div>
                        <dt className="text-gray-500">
                          {canViewBalances ? 'Allocated balance' : 'Your branch balance'}
                        </dt>
                        <dd className="font-medium text-gray-900">
                          {formatPrice(wallet.allocatedBalance)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-gray-500">This month spend</dt>
                        <dd className="font-medium text-gray-900">
                          {formatPrice(wallet.monthSpend)}
                        </dd>
                      </div>
                    </>
                  )}
                </dl>
              </article>
            );
          })}
        </div>
      )}

      <BusinessFormModal
        open={addOpen}
        title="Add branch"
        description="Create a new branch location for your organization."
        submitLabel="Add branch"
        onClose={() => setAddOpen(false)}
        onSubmit={handleAddBranch}
      >
        <input
          required
          name="name"
          placeholder="Branch name"
          className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-blue-normal focus:ring-2 focus:ring-blue-normal/20"
        />
        <input
          required
          name="code"
          placeholder="Branch code (e.g. LAG)"
          className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-blue-normal focus:ring-2 focus:ring-blue-normal/20"
        />
        <input
          required
          name="city"
          placeholder="City"
          className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-blue-normal focus:ring-2 focus:ring-blue-normal/20"
        />
        <textarea
          required
          name="address"
          rows={2}
          placeholder="Address"
          className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-blue-normal focus:ring-2 focus:ring-blue-normal/20"
        />
      </BusinessFormModal>
    </div>
  );
}

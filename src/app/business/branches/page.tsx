'use client';

import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/business/PageHeader';
import { StatusBadge } from '@/components/business/StatusBadge';
import { useBusinessAuth } from '@/context/BusinessAuthContext';
import { getMockBranchesForRole } from '@/data/businessMocks';

export default function BranchesPage() {
  const { user, demoRole, canAccess } = useBusinessAuth();
  const role = user?.role ?? demoRole;
  const branches = getMockBranchesForRole(role);

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
            onClick={() => toast.message('Add branch — API coming soon')}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-normal px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-normal-hover"
          >
            <Plus className="h-4 w-4" />
            Add branch
          </button>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {branches.map((branch) => (
          <article
            key={branch.id}
            className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{branch.name}</h2>
                <p className="text-sm text-gray-500">{branch.code} · {branch.city}</p>
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
            <p className="mt-3 text-sm text-gray-600">{branch.address}, {branch.city}</p>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-gray-500">Team members</dt>
                <dd className="font-medium text-gray-900">{branch.userCount}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Meters linked</dt>
                <dd className="font-medium text-gray-900">{branch.meterCount}</dd>
              </div>
            </dl>
          </article>
        ))}
      </div>
    </div>
  );
}

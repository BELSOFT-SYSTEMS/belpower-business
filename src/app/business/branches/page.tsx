'use client';

import { useEffect, useMemo, useState } from 'react';
import { MapPin, MoreVertical, Plus, Trash2, Users, Wallet, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { BusinessFormModal } from '@/components/business/BusinessFormModal';
import { AddBranchModal } from '@/components/business/AddBranchModal';
import { EmptyState } from '@/components/business/EmptyState';
import { PageHeader } from '@/components/business/PageHeader';
import { StatusBadge } from '@/components/business/StatusBadge';
import { useBusinessAuth } from '@/context/BusinessAuthContext';
import { isSuperAdminRole } from '@/constants/businessRoles';
import {
  canViewAllBranchWalletInfo,
  getMockBranchWalletOverviewForRole,
  getOperatingBranchesForRole,
  getTotalAllocatedBalance,
} from '@/data/businessMocks';
import { BusinessApiError, businessBranchesApi } from '@/lib/businessApi';
import type { BusinessBranch } from '@/types/business';
import { formatPrice } from '@/utils/formatPrice';
import { cn } from '@/lib/utils';
import {
  OptionPager,
  usePagedItems,
} from '@/components/business/payments/paymentShared';

const BRANCHES_PAGE_SIZE = 4;

export default function BranchesPage() {
  const { user, demoRole, isAuthenticated, refreshMe } = useBusinessAuth();
  const role = user?.role ?? demoRole;
  const isSuperAdmin = isSuperAdminRole(role);
  const mockBranchWallets = getMockBranchWalletOverviewForRole(role);
  const canViewBalances = canViewAllBranchWalletInfo(role);

  const [branches, setBranches] = useState<BusinessBranch[]>(() => getOperatingBranchesForRole(role));
  const [walletByBranchId, setWalletByBranchId] = useState(
    () => new Map(mockBranchWallets.map((branch) => [branch.branchId, branch.allocatedBalance])),
  );
  const [addOpen, setAddOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BusinessBranch | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      setBranches(getOperatingBranchesForRole(role));
      setWalletByBranchId(
        new Map(mockBranchWallets.map((branch) => [branch.branchId, branch.allocatedBalance])),
      );
      setMenuOpenId(null);
      setDeleteTarget(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    void (async () => {
      try {
        const rows = await businessBranchesApi.list();
        if (cancelled) return;
        const operating = rows
          .filter((row) => !row.isHeadOffice)
          .map((row) => ({
            id: row.id,
            name: row.name,
            code: row.code || '',
            address: row.address || '',
            city: row.city || '',
            isHeadOffice: false,
            userCount: row.userCount ?? 0,
            meterCount: row.meterCount ?? 0,
            status: (row.status === 'inactive' ? 'inactive' : 'active') as BusinessBranch['status'],
          }));
        setBranches(operating);
        setWalletByBranchId(
          new Map(
            rows
              .filter((row) => row.wallet)
              .map((row) => [
                row.id,
                Number(row.wallet?.availableBalance ?? row.wallet?.balance ?? 0),
              ]),
          ),
        );
      } catch (error) {
        if (!cancelled) {
          toast.error(
            error instanceof BusinessApiError ? error.message : 'Could not load branches',
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, role]);

  const filteredBranches = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return branches;
    return branches.filter((branch) => {
      const haystack = `${branch.name} ${branch.code} ${branch.city} ${branch.address}`.toLowerCase();
      return haystack.includes(needle);
    });
  }, [branches, query]);

  const {
    pageItems: pagedBranches,
    page,
    pageCount,
    setPage,
  } = usePagedItems(filteredBranches, query, BRANCHES_PAGE_SIZE);

  useEffect(() => {
    setMenuOpenId(null);
  }, [page, query]);

  const totals = useMemo(() => {
    const team = branches.reduce((sum, branch) => sum + branch.userCount, 0);
    const meters = branches.reduce((sum, branch) => sum + branch.meterCount, 0);
    const allocated = canViewBalances
      ? isAuthenticated
        ? Array.from(walletByBranchId.values()).reduce((sum, value) => sum + value, 0)
        : getTotalAllocatedBalance()
      : branches.reduce((sum, branch) => sum + (walletByBranchId.get(branch.id) ?? 0), 0);
    const active = branches.filter((branch) => branch.status === 'active').length;
    return { team, meters, allocated, active };
  }, [branches, canViewBalances, isAuthenticated, walletByBranchId]);

  const handleAddBranch = async (branch: BusinessBranch) => {
    if (!isSuperAdmin) return;
    setBranches((current) => [...current, branch]);
    setWalletByBranchId((current) => new Map(current).set(branch.id, 0));
    setAddOpen(false);
    try {
      await refreshMe();
    } catch {
      // ignore
    }
  };

  const handleToggleStatus = async (branch: BusinessBranch) => {
    if (!isSuperAdmin) return;
    const nextStatus = branch.status === 'active' ? 'inactive' : 'active';
    setMenuOpenId(null);
    try {
      await businessBranchesApi.updateStatus(branch.id, nextStatus);
      setBranches((current) =>
        current.map((item) => (item.id === branch.id ? { ...item, status: nextStatus } : item)),
      );
      toast.success(
        nextStatus === 'active' ? `${branch.name} enabled` : `${branch.name} disabled`,
      );
      try {
        await refreshMe();
      } catch {
        // ignore
      }
    } catch (error) {
      toast.error(error instanceof BusinessApiError ? error.message : 'Could not update branch');
    }
  };

  const handleConfirmDelete = async () => {
    if (!isSuperAdmin || !deleteTarget) return;
    const name = deleteTarget.name;
    try {
      await businessBranchesApi.updateStatus(deleteTarget.id, 'inactive');
      setBranches((current) =>
        current.map((branch) =>
          branch.id === deleteTarget.id ? { ...branch, status: 'inactive' } : branch,
        ),
      );
      setDeleteTarget(null);
      setMenuOpenId(null);
      toast.success(`${name} disabled`);
      try {
        await refreshMe();
      } catch {
        // ignore
      }
    } catch (error) {
      toast.error(error instanceof BusinessApiError ? error.message : 'Could not disable branch');
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          title="Branches"
          description="Operating locations with allocated wallets. Head Office is company HQ and is managed from Wallet — it is not listed here."
        />
        {isSuperAdmin ? (
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-normal px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-normal-hover"
          >
            <Plus className="h-4 w-4" />
            Add branch
          </button>
        ) : null}
      </div>

      {branches.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryStat
            label="Operating branches"
            value={String(branches.length)}
            hint={`${totals.active} active`}
          />
          <SummaryStat
            label={canViewBalances ? 'Total allocated' : 'Your balance'}
            value={formatPrice(totals.allocated)}
            hint="From company wallet"
          />
          <SummaryStat label="Team across branches" value={String(totals.team)} hint="Assigned members" />
          <SummaryStat label="Meters linked" value={String(totals.meters)} hint="Saved electricity meters" />
        </div>
      ) : null}

      {branches.length === 0 ? (
        <EmptyState
          title="No branches yet"
          description="Add your first operating branch to allocate funds and organize local teams."
          action={
            isSuperAdmin ? (
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
        <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-gray-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">All operating branches</h2>
              <p className="mt-0.5 text-xs text-gray-500">
                Showing {pagedBranches.length} of {filteredBranches.length}
                {query.trim() ? ` matching “${query.trim()}”` : ''}
                {pageCount > 1 ? ` · Page ${page + 1} of ${pageCount}` : ''}
                {isSuperAdmin ? ' · Super Admin can enable, disable, or delete' : ''}
              </p>
            </div>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by name, code, or city"
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-normal focus:ring-2 focus:ring-blue-normal/20 sm:max-w-xs"
            />
          </div>

          {filteredBranches.length === 0 ? (
            <div className="px-4 py-12 text-center text-sm text-gray-500">
              No branches match “{query.trim()}”.
            </div>
          ) : (
            <>
              <ul className="divide-y divide-gray-100 overflow-visible">
                {pagedBranches.map((branch, index) => {
                  const wallet = walletByBranchId.get(branch.id);
                  const disabled = branch.status === 'inactive';
                  const openMenuUpward = index >= pagedBranches.length - 2;
                  return (
                    <li
                      key={branch.id}
                      className={cn(
                        'relative flex flex-col gap-4 px-4 py-4 transition hover:bg-gray-50/80 lg:flex-row lg:items-center lg:justify-between',
                        disabled && 'bg-gray-50/60',
                      )}
                    >
                      <div className="flex min-w-0 items-start gap-3">
                        <div
                          className={cn(
                            'flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-xs font-bold tracking-wide',
                            disabled ? 'bg-gray-100 text-gray-500' : 'bg-blue-50 text-blue-normal',
                          )}
                        >
                          {branch.code}
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3
                              className={cn(
                                'truncate text-base font-semibold',
                                disabled ? 'text-gray-500' : 'text-gray-900',
                              )}
                            >
                              {branch.name}
                            </h3>
                            <StatusBadge
                              status={branch.status}
                              label={branch.status === 'active' ? 'Enabled' : 'Disabled'}
                            />
                          </div>
                          <p className="mt-1 flex items-start gap-1.5 text-sm text-gray-600">
                            <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-400" />
                            <span>
                              {branch.address}, {branch.city}
                            </span>
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center lg:gap-4">
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:min-w-[28rem]">
                          <MetaCell
                            icon={<Users className="h-3.5 w-3.5" />}
                            label="Team"
                            value={String(branch.userCount)}
                          />
                          <MetaCell
                            icon={<Zap className="h-3.5 w-3.5" />}
                            label="Meters"
                            value={String(branch.meterCount)}
                          />
                          {wallet !== undefined || canViewBalances ? (
                            <>
                              <MetaCell
                                icon={<Wallet className="h-3.5 w-3.5" />}
                                label={canViewBalances ? 'Allocated' : 'Balance'}
                                value={formatPrice(wallet ?? 0)}
                              />
                              {!isAuthenticated ? (
                                <MetaCell
                                  label="This month"
                                  value={formatPrice(
                                    mockBranchWallets.find((item) => item.branchId === branch.id)
                                      ?.monthSpend ?? 0,
                                  )}
                                />
                              ) : null}
                            </>
                          ) : null}
                        </div>

                        {isSuperAdmin ? (
                          <div className="relative z-10 self-end lg:self-center">
                            <button
                              type="button"
                              onClick={() =>
                                setMenuOpenId((current) =>
                                  current === branch.id ? null : branch.id,
                                )
                              }
                              className="rounded-lg p-2 text-gray-500 hover:bg-white hover:text-gray-800"
                              aria-label={`${branch.name} actions`}
                            >
                              <MoreVertical className="h-4 w-4" />
                            </button>
                            {menuOpenId === branch.id ? (
                              <div
                                className={cn(
                                  'absolute right-0 z-30 w-44 rounded-xl border border-gray-200 bg-white py-1 shadow-lg',
                                  openMenuUpward ? 'bottom-full mb-1' : 'top-full mt-1',
                                )}
                              >
                                <button
                                  type="button"
                                  onClick={() => handleToggleStatus(branch)}
                                  className="block w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                                >
                                  {branch.status === 'active' ? 'Disable branch' : 'Enable branch'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setMenuOpenId(null);
                                    setDeleteTarget(branch);
                                  }}
                                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                  Disable branch
                                </button>
                              </div>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ul>
              {pageCount > 1 ? (
                <div className="border-t border-gray-100 px-4 py-3">
                  <OptionPager page={page} pageCount={pageCount} onPageChange={setPage} />
                </div>
              ) : null}
            </>
          )}
        </section>
      )}

      <AddBranchModal
        open={addOpen && isSuperAdmin}
        onClose={() => setAddOpen(false)}
        onAdd={handleAddBranch}
      />

      <BusinessFormModal
        open={Boolean(deleteTarget) && isSuperAdmin}
        title="Disable branch"
        description={
          deleteTarget
            ? `Disable ${deleteTarget.name}? The branch wallet will be set inactive. This can be reversed by enabling the branch again.`
            : 'Disable this branch?'
        }
        submitLabel="Disable branch"
        onClose={() => setDeleteTarget(null)}
        onSubmit={(event) => {
          event.preventDefault();
          void handleConfirmDelete();
        }}
      >
        <p className="text-sm text-gray-600">
          Disabling sets the branch and its wallet to inactive. You can enable it again later.
        </p>
      </BusinessFormModal>
    </div>
  );
}

function SummaryStat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white px-4 py-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-1.5 text-xl font-semibold text-gray-900">{value}</p>
      <p className="mt-1 text-xs text-gray-500">{hint}</p>
    </div>
  );
}

function MetaCell({
  icon,
  label,
  value,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0">
      <p className="flex items-center gap-1 text-[11px] font-medium uppercase tracking-wide text-gray-500">
        {icon}
        {label}
      </p>
      <p className="mt-0.5 truncate text-sm font-semibold text-gray-900">{value}</p>
    </div>
  );
}

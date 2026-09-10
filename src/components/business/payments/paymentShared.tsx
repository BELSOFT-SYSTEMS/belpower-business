'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Check, ChevronLeft, ChevronRight, Loader2, Star, Wallet, XCircle } from 'lucide-react';
import { BusinessSelect } from '@/components/business/BusinessSelect';
import { BusinessProviderAvatar } from '@/components/business/BusinessProviderAvatar';
import { useBusinessAuth } from '@/context/BusinessAuthContext';
import { isHeadOfficeRole } from '@/constants/businessRoles';
import {
  getMockBeneficiariesForRole,
  getMockBranchWalletOverviewForRole,
  getMockDashboardForRole,
  getWalletBalanceDisplayForRole,
  HEAD_OFFICE_BRANCH_ID,
} from '@/data/businessMocks';
import type { BusinessBeneficiary } from '@/types/business';
import { getPaymentBlockReason, type PaymentService as CatalogService } from '@/data/mockPaymentCatalog';
import { businessWalletApi } from '@/lib/businessApi';
import { formatBusinessBranchLabel } from '@/utils/businessBranchLabel';
import { formatPrice } from '@/utils/formatPrice';
import { cn } from '@/lib/utils';

type Service = CatalogService;

type SessionBranch = {
  branchId: string;
  branchName: string;
  allocatedBalance: number;
  todaySpend: number;
  monthSpend: number;
  monthTransactions: number;
  walletId?: string;
  isFrozen?: boolean;
  dailyLimit?: number;
};

/** Branch label for payment success / review rows (never blank for company wallet). */
export function paymentBranchLabel(
  selectedBranch: { branchName?: string | null } | null | undefined,
): string {
  return formatBusinessBranchLabel(selectedBranch?.branchName);
}

export const fieldClass =
  'mt-1.5 w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-blue-normal focus:ring-2 focus:ring-blue-normal/20 disabled:bg-gray-50';

export const primaryButtonClass =
  'inline-flex items-center justify-center gap-2 rounded-xl bg-blue-normal px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-normal-hover disabled:cursor-not-allowed disabled:opacity-50';

export const secondaryButtonClass =
  'inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50';

function mapBeneficiary(raw: Record<string, unknown>): BusinessBeneficiary | null {
  const id = String(raw.id || '');
  let service = String(raw.service || raw.type || '');
  if (service === 'phone') service = 'airtime';
  if (!id || !['airtime', 'data', 'electricity', 'cable', 'phone'].includes(service)) return null;
  return {
    id,
    label: String(raw.label || raw.name || raw.accountNumber || 'Beneficiary'),
    service: service as BusinessBeneficiary['service'],
    provider: String(raw.provider || raw.disco || ''),
    accountNumber: String(raw.accountNumber || raw.account_number || raw.phone || raw.meter || ''),
    branchName: String(raw.branchName || raw.branch_name || 'Head Office'),
    meterType: (raw.meterType as BusinessBeneficiary['meterType']) || undefined,
    isPrimary: Boolean(raw.isPrimary ?? raw.is_primary),
    createdAt: String(raw.createdAt || raw.created_at || new Date().toISOString()),
  };
}

export function usePaymentSession() {
  const { user, demoRole, isAuthenticated, dashboardBootstrap, business } = useBusinessAuth();
  const role = user?.role ?? demoRole;
  const mockDashboard = getMockDashboardForRole(role);
  const mockWallet = getWalletBalanceDisplayForRole(role);
  const mockBranches = getMockBranchWalletOverviewForRole(role);

  const [liveBranches, setLiveBranches] = useState<SessionBranch[]>([]);
  const [liveCompany, setLiveCompany] = useState<{
    balance: number;
    todaySpend: number;
    monthSpend: number;
    isFrozen: boolean;
    dailyLimit: number;
    walletId?: string;
    branchName?: string;
  } | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      setLiveBranches([]);
      setLiveCompany(null);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const overview = await businessWalletApi.overview();
        if (cancelled) return;

        const company = overview.companyWallet;
        const bootstrapWallet = dashboardBootstrap?.wallet;
        setLiveCompany({
          balance: company?.availableBalance ?? company?.balance ?? bootstrapWallet?.availableBalance ?? bootstrapWallet?.balance ?? 0,
          todaySpend: company?.todaySpend ?? bootstrapWallet?.todaySpend ?? 0,
          monthSpend: company?.monthSpend ?? bootstrapWallet?.monthSpend ?? 0,
          isFrozen: Boolean(
            overview.wallets.find((w) => w.scope === 'company')?.isFrozen ??
              bootstrapWallet?.isFrozen ??
              bootstrapWallet?.status === 'frozen',
          ),
          dailyLimit: Number(bootstrapWallet?.dailyLimit ?? 2_000_000),
          walletId: company?.id,
          branchName: bootstrapWallet?.branchName || 'Head Office',
        });

        setLiveBranches(
          (overview.allocatableBranches || []).map((branch) => ({
            branchId: branch.branchId,
            branchName: branch.branchName,
            allocatedBalance: branch.allocatedBalance,
            todaySpend: 0,
            monthSpend: 0,
            monthTransactions: 0,
            walletId: branch.walletId,
            isFrozen: branch.isFrozen,
          })),
        );
      } catch {
        if (cancelled) return;
        const bootstrapWallet = dashboardBootstrap?.wallet;
        if (bootstrapWallet) {
          setLiveCompany({
            balance: bootstrapWallet.availableBalance ?? bootstrapWallet.balance ?? 0,
            todaySpend: bootstrapWallet.todaySpend ?? 0,
            monthSpend: bootstrapWallet.monthSpend ?? 0,
            isFrozen: Boolean(bootstrapWallet.isFrozen || bootstrapWallet.status === 'frozen'),
            dailyLimit: Number(bootstrapWallet.dailyLimit ?? 2_000_000),
            walletId: bootstrapWallet.id,
            branchName: bootstrapWallet.branchName || 'Head Office',
          });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, dashboardBootstrap]);

  const branches: SessionBranch[] = isAuthenticated
    ? liveBranches
    : mockBranches.map((branch) => ({
        branchId: branch.branchId,
        branchName: branch.branchName,
        allocatedBalance: branch.allocatedBalance,
        todaySpend: branch.todaySpend,
        monthSpend: branch.monthSpend,
        monthTransactions: branch.monthTransactions,
      }));
  const canChargeToBranch = isHeadOfficeRole(role) && branches.length > 0;
  const [chargeToBranch, setChargeToBranch] = useState(false);
  const [branchId, setBranchId] = useState('');

  useEffect(() => {
    if (!branchId && branches[0]?.branchId) {
      setBranchId(branches[0].branchId);
    }
  }, [branchId, branches]);

  const defaultWallet = useMemo(() => {
    if (isAuthenticated && liveCompany) {
      return {
        label: liveCompany.branchName ? `${liveCompany.branchName} wallet` : 'Company wallet',
        balance: liveCompany.balance,
      };
    }
    if (isAuthenticated && dashboardBootstrap?.wallet) {
      return {
        label: `${dashboardBootstrap.wallet.branchName || 'Head Office'} wallet`,
        balance: dashboardBootstrap.wallet.availableBalance ?? dashboardBootstrap.wallet.balance ?? 0,
      };
    }
    return mockWallet;
  }, [dashboardBootstrap?.wallet, isAuthenticated, liveCompany, mockWallet]);

  const dashboard = useMemo(() => {
    if (!isAuthenticated) return mockDashboard;
    const todaySpend = liveCompany?.todaySpend ?? dashboardBootstrap?.wallet?.todaySpend ?? 0;
    const monthSpend = liveCompany?.monthSpend ?? dashboardBootstrap?.wallet?.monthSpend ?? 0;
    const isFrozen =
      liveCompany?.isFrozen ??
      Boolean(dashboardBootstrap?.wallet?.isFrozen || dashboardBootstrap?.wallet?.status === 'frozen');
    const dailyLimit =
      liveCompany?.dailyLimit ?? Number(dashboardBootstrap?.wallet?.dailyLimit ?? 2_000_000);
    return {
      ...mockDashboard,
      business: business
        ? {
            ...mockDashboard.business,
            ...business,
          }
        : mockDashboard.business,
      wallet: {
        ...mockDashboard.wallet,
        balance: defaultWallet.balance,
        todaySpend,
        monthSpend,
        isFrozen,
        dailyLimit,
      },
    };
  }, [
    business,
    dashboardBootstrap?.wallet,
    defaultWallet.balance,
    isAuthenticated,
    liveCompany,
    mockDashboard,
  ]);

  const selectedBranch = useMemo(() => {
    if (canChargeToBranch && !chargeToBranch) {
      return {
        branchId: HEAD_OFFICE_BRANCH_ID,
        branchName: 'Head Office',
        allocatedBalance: defaultWallet.balance,
        todaySpend: dashboard.wallet.todaySpend,
        monthSpend: dashboard.wallet.monthSpend,
        monthTransactions: 0,
        walletId: liveCompany?.walletId,
      } satisfies SessionBranch;
    }
    const matched = branches.find((branch) => branch.branchId === branchId) ?? branches[0];
    if (matched) {
      return {
        ...matched,
        branchName: formatBusinessBranchLabel(matched.branchName),
      };
    }
    return {
      branchId: HEAD_OFFICE_BRANCH_ID,
      branchName: 'Head Office',
      allocatedBalance: defaultWallet.balance,
      todaySpend: dashboard.wallet.todaySpend,
      monthSpend: dashboard.wallet.monthSpend,
      monthTransactions: 0,
      walletId: liveCompany?.walletId,
    } satisfies SessionBranch;
  }, [
    branchId,
    branches,
    canChargeToBranch,
    chargeToBranch,
    dashboard.wallet.monthSpend,
    dashboard.wallet.todaySpend,
    defaultWallet.balance,
    liveCompany?.walletId,
  ]);

  const wallet = useMemo(() => {
    if (canChargeToBranch && chargeToBranch && selectedBranch) {
      return {
        label: `${selectedBranch.branchName} wallet`,
        balance: selectedBranch.allocatedBalance,
      };
    }
    return defaultWallet;
  }, [canChargeToBranch, chargeToBranch, defaultWallet, selectedBranch]);

  const todaySpend =
    canChargeToBranch && chargeToBranch && selectedBranch
      ? selectedBranch.todaySpend
      : dashboard.wallet.todaySpend;

  const beneficiaries = useMemo(() => {
    if (isAuthenticated && dashboardBootstrap?.beneficiaries?.length) {
      return dashboardBootstrap.beneficiaries
        .map((item) => mapBeneficiary(item as Record<string, unknown>))
        .filter((item): item is BusinessBeneficiary => Boolean(item));
    }
    if (isAuthenticated) return [];
    return getMockBeneficiariesForRole(role);
  }, [dashboardBootstrap?.beneficiaries, isAuthenticated, role]);

  const spendWalletId =
    canChargeToBranch && chargeToBranch ? selectedBranch?.walletId : liveCompany?.walletId;
  const spendBranchId =
    canChargeToBranch && chargeToBranch ? selectedBranch?.branchId || null : null;

  return {
    role,
    dashboard,
    wallet,
    branches,
    beneficiaries,
    canChargeToBranch,
    chargeToBranch,
    setChargeToBranch,
    branchId,
    setBranchId,
    selectedBranch,
    frozen: dashboard.wallet.isFrozen,
    todaySpend,
    dailyLimit: dashboard.wallet.dailyLimit,
    spendWalletId: spendWalletId || null,
    spendBranchId,
    refreshWallet: async () => {
      if (!isAuthenticated) return;
      try {
        const overview = await businessWalletApi.overview();
        const company = overview.companyWallet;
        setLiveCompany((current) => ({
          balance: company?.availableBalance ?? company?.balance ?? 0,
          todaySpend: company?.todaySpend ?? current?.todaySpend ?? 0,
          monthSpend: company?.monthSpend ?? current?.monthSpend ?? 0,
          isFrozen: Boolean(overview.wallets.find((w) => w.scope === 'company')?.isFrozen),
          dailyLimit: current?.dailyLimit ?? 2_000_000,
          walletId: company?.id,
          branchName: current?.branchName || 'Head Office',
        }));
        setLiveBranches(
          (overview.allocatableBranches || []).map((branch) => ({
            branchId: branch.branchId,
            branchName: branch.branchName,
            allocatedBalance: branch.allocatedBalance,
            todaySpend: 0,
            monthSpend: 0,
            monthTransactions: 0,
            walletId: branch.walletId,
            isFrozen: branch.isFrozen,
          })),
        );
      } catch {
        // keep current balances
      }
    },
  };
}

export function PaymentSourceCard({
  label,
  balance,
  branches,
  branchId,
  onBranchChange,
  canChargeToBranch = false,
  chargeToBranch = false,
  onChargeToBranchChange,
  amount,
  frozen,
  todaySpend,
  dailyLimit,
}: {
  label: string;
  balance: number;
  branches: { branchId: string; branchName: string }[];
  branchId: string;
  onBranchChange: (value: string) => void;
  canChargeToBranch?: boolean;
  chargeToBranch?: boolean;
  onChargeToBranchChange?: (checked: boolean) => void;
  amount?: number;
  frozen: boolean;
  todaySpend: number;
  dailyLimit: number;
}) {
  const remainingDaily = Math.max(dailyLimit - todaySpend, 0);
  const blockReason =
    amount && amount > 0
      ? getPaymentBlockReason({ amount, balance, frozen, todaySpend, dailyLimit })
      : frozen
        ? 'This wallet is frozen. Payments are paused.'
        : null;

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 text-green-700">
            <Wallet className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Paying from</p>
            <p className="text-sm font-medium text-gray-700">{label}</p>
            <p className="mt-1 text-xl font-semibold text-gray-900">{formatPrice(balance)}</p>
          </div>
        </div>
        {canChargeToBranch ? (
          <div className="w-full sm:max-w-xs">
            <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-gray-700">
              <input
                type="checkbox"
                checked={chargeToBranch}
                onChange={(event) => onChargeToBranchChange?.(event.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-normal focus:ring-blue-normal"
              />
              Charge to branch
            </label>
            {chargeToBranch ? (
              <>
                <BusinessSelect
                  value={branchId}
                  onChange={onBranchChange}
                  className="mt-2"
                  aria-label="Charge to branch"
                  options={branches.map((branch) => ({
                    value: branch.branchId,
                    label: branch.branchName,
                  }))}
                />
                <p className="mt-1.5 text-xs text-gray-500">
                  Debits the selected branch wallet and records spend against that branch.
                </p>
              </>
            ) : (
              <p className="mt-1.5 text-xs text-gray-500">
                Head Office is buying for itself from the company wallet.
              </p>
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-500">
            Branch <span className="font-medium text-gray-800">{branches[0]?.branchName}</span>
          </p>
        )}
      </div>
      <p className="mt-3 text-xs text-gray-500">
        Daily limit remaining {formatPrice(remainingDaily)}
        {amount && amount > 0 ? ` · This payment ${formatPrice(amount)}` : ''}
      </p>
      {blockReason ? <p className="mt-2 text-xs text-red-600">{blockReason}</p> : null}
    </section>
  );
}

export function FieldLabel({
  htmlFor,
  children,
}: {
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <label htmlFor={htmlFor} className="block text-sm font-medium text-gray-700">
      {children}
    </label>
  );
}

export function ProviderTiles({
  options,
  value,
  onChange,
}: {
  options: { id: string; name: string; logo: string }[];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="mt-1.5 grid grid-cols-2 gap-2 sm:grid-cols-4">
      {options.map((option) => {
        const selected = option.id === value;
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            className={cn(
              'flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-sm font-medium transition',
              selected
                ? 'border-blue-normal bg-blue-50 text-gray-900 ring-2 ring-blue-normal/20'
                : 'border-gray-200 bg-white text-gray-800 hover:border-gray-300',
            )}
          >
            <BusinessProviderAvatar src={option.logo} provider={option.id} size="md" />
            {option.name}
          </button>
        );
      })}
    </div>
  );
}

/** Max rows of plan/package cards per page on all viewports. */
export const PLAN_PACKAGE_ROWS = 3;
/** Columns from `sm` breakpoint (`sm:grid-cols-2`). */
export const PLAN_PACKAGE_COLS_SM = 2;
/** Desktop page size (3 rows × 2 cols). Mobile uses PLAN_PACKAGE_ROWS. */
export const PLAN_PACKAGE_PAGE_SIZE = PLAN_PACKAGE_ROWS * PLAN_PACKAGE_COLS_SM;

/** 3 items on mobile (1 col × 3 rows), 6 from `sm` up (2 cols × 3 rows). */
export function usePlanPackagePageSize() {
  const [pageSize, setPageSize] = useState(PLAN_PACKAGE_ROWS);

  useEffect(() => {
    const media = window.matchMedia('(min-width: 640px)');
    const sync = () => {
      setPageSize(media.matches ? PLAN_PACKAGE_PAGE_SIZE : PLAN_PACKAGE_ROWS);
    };
    sync();
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, []);

  return pageSize;
}

export function usePagedItems<T>(items: T[], resetKey: string, pageSize = PLAN_PACKAGE_PAGE_SIZE) {
  const [page, setPage] = useState(0);
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));

  useEffect(() => {
    setPage(0);
  }, [resetKey, pageSize]);

  useEffect(() => {
    setPage((current) => Math.min(current, pageCount - 1));
  }, [pageCount]);

  const safePage = Math.min(page, pageCount - 1);
  const pageItems = items.slice(safePage * pageSize, safePage * pageSize + pageSize);

  return {
    pageItems,
    page: safePage,
    pageCount,
    setPage,
    showPager: items.length > pageSize,
  };
}

export function OptionPager({
  page,
  pageCount,
  onPageChange,
}: {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
}) {
  if (pageCount <= 1) return null;

  return (
    <div className="mt-3 flex items-center justify-between gap-2">
      <button
        type="button"
        onClick={() => onPageChange(Math.max(0, page - 1))}
        disabled={page === 0}
        className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
        aria-label="Previous page"
      >
        <ChevronLeft className="h-4 w-4" />
        <span className="hidden sm:inline">Previous</span>
      </button>

      <div className="flex min-w-0 flex-wrap items-center justify-center gap-1.5" role="tablist" aria-label="Pages">
        {Array.from({ length: pageCount }, (_, index) => {
          const active = index === page;
          return (
            <button
              key={index}
              type="button"
              role="tab"
              aria-selected={active}
              aria-label={`Page ${index + 1}`}
              onClick={() => onPageChange(index)}
              className={cn(
                'h-2 rounded-full transition-all',
                active ? 'w-5 bg-blue-normal' : 'w-2 bg-gray-300 hover:bg-gray-400',
              )}
            />
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => onPageChange(Math.min(pageCount - 1, page + 1))}
        disabled={page >= pageCount - 1}
        className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
        aria-label="Next page"
      >
        <span className="hidden sm:inline">Next</span>
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}

const SAVED_AVATAR_COLORS = [
  'bg-blue-500',
  'bg-sky-500',
  'bg-slate-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-pink-500',
  'bg-violet-500',
  'bg-emerald-500',
  'bg-cyan-600',
  'bg-orange-500',
] as const;

function beneficiaryInitials(item: BusinessBeneficiary) {
  const source = item.label || item.customerName || item.accountNumber || '?';
  const words = source.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0] ?? ''}${words[1][0] ?? ''}`.toUpperCase();
}

function beneficiaryChipLabel(item: BusinessBeneficiary, service: Service) {
  if (service === 'electricity' && item.isPrimary) return 'My Meter';
  return item.label || item.customerName || item.accountNumber;
}

function isPhoneBeneficiary(item: BusinessBeneficiary) {
  return item.service === 'phone' || item.service === 'airtime' || item.service === 'data';
}

export function SavedBeneficiaryPicker({
  service,
  beneficiaries,
  selectedAccount,
  onSelect,
}: {
  service: Service;
  beneficiaries: BusinessBeneficiary[];
  selectedAccount?: string;
  onSelect: (beneficiary: BusinessBeneficiary) => void;
}) {
  const saved = useMemo(() => {
    const filtered = beneficiaries.filter((item) => {
      if (item.service === service) return true;
      if ((service === 'airtime' || service === 'data') && isPhoneBeneficiary(item)) return true;
      return false;
    });
    return [...filtered].sort((a, b) => Number(Boolean(b.isPrimary)) - Number(Boolean(a.isPrimary)));
  }, [beneficiaries, service]);

  if (saved.length === 0) return null;

  const title =
    service === 'electricity'
      ? 'Saved meters'
      : service === 'airtime' || service === 'data'
        ? 'Saved numbers'
        : 'Saved beneficiaries';
  const selectedDigits = (selectedAccount ?? '').replace(/\D/g, '');

  return (
    <div>
      <FieldLabel>{title}</FieldLabel>
      <div className="mt-2 -mx-1 flex gap-3 overflow-x-auto px-1 pt-3 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {saved.map((item, index) => {
          const isSelected =
            Boolean(selectedDigits) && item.accountNumber.replace(/\D/g, '') === selectedDigits;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item)}
              className="flex w-[4.5rem] shrink-0 flex-col items-center gap-1.5 pt-0.5 text-center"
            >
              <span className="relative inline-flex">
                <span
                  className={cn(
                    'flex h-14 w-14 items-center justify-center rounded-full text-base font-bold text-white',
                    SAVED_AVATAR_COLORS[index % SAVED_AVATAR_COLORS.length],
                    isSelected && 'ring-[2.5px] ring-blue-normal ring-offset-2',
                  )}
                >
                  {beneficiaryInitials(item)}
                </span>
                {item.isPrimary ? (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full border-[1.5px] border-white bg-blue-normal">
                    <Star className="h-2.5 w-2.5 fill-white text-white" />
                  </span>
                ) : null}
                {isSelected ? (
                  <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full border-[1.5px] border-white bg-emerald-500">
                    <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />
                  </span>
                ) : null}
              </span>
              <span className="w-full truncate text-xs text-gray-600">
                {beneficiaryChipLabel(item, service)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function ReviewList({ rows }: { rows: { label: string; value: string }[] }) {
  return (
    <dl className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-gray-50">
      {rows.map((row) => (
        <div key={row.label} className="flex items-start justify-between gap-4 px-4 py-3 text-sm">
          <dt className="text-gray-500">{row.label}</dt>
          <dd className="text-right font-medium text-gray-900">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function PaymentSuccessView({
  title,
  description,
  reference,
  rows,
  onAgain,
  againLabel,
}: {
  title: string;
  description: string;
  reference: string;
  rows: { label: string; value: string }[];
  onAgain: () => void;
  againLabel: string;
}) {
  return (
    <section className="rounded-xl border border-green-200 bg-green-50 p-8">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border-2 border-green-200 bg-white">
        <Check className="h-8 w-8 text-green-600" />
      </div>
      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
        <p className="mt-2 text-sm text-gray-600">{description}</p>
        <p className="mt-1 text-xs text-gray-500">Reference: {reference}</p>
      </div>
      <div className="mx-auto mt-6 max-w-lg">
        <ReviewList rows={rows} />
      </div>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Link href="/business/transactions" className={primaryButtonClass}>
          View transactions
        </Link>
        <button type="button" onClick={onAgain} className={secondaryButtonClass}>
          {againLabel}
        </button>
      </div>
    </section>
  );
}

export function PaymentFailedView({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border-2 border-red-200 bg-white">
        <XCircle className="h-8 w-8 text-red-600" />
      </div>
      <h2 className="text-xl font-semibold text-gray-900">Payment failed</h2>
      <p className="mt-2 text-sm text-gray-600">{message}</p>
      <button type="button" onClick={onRetry} className={`${primaryButtonClass} mt-6`}>
        Try again
      </button>
    </section>
  );
}

export function PayButton({
  pending,
  disabled,
  label,
}: {
  pending: boolean;
  disabled: boolean;
  label: string;
}) {
  return (
    <button type="submit" disabled={disabled || pending} className={primaryButtonClass}>
      {pending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Paying…
        </>
      ) : (
        label
      )}
    </button>
  );
}

export function demoNote() {
  return null;
}

export function beneficiaryPayPath(
  beneficiary: BusinessBeneficiary,
  payService?: 'airtime' | 'data',
): string {
  const account = encodeURIComponent(beneficiary.accountNumber);
  const provider = encodeURIComponent(beneficiary.provider);
  if (beneficiary.service === 'electricity') {
    const type = beneficiary.meterType ?? 'prepaid';
    return `/business/payments/electricity?meterNumber=${account}&disco=${provider}&type=${type}`;
  }
  if (beneficiary.service === 'cable') {
    return `/business/payments/cable?smartCardNumber=${account}&provider=${provider}`;
  }
  if (isPhoneBeneficiary(beneficiary)) {
    const target = payService ?? 'airtime';
    if (target === 'data') {
      return `/business/payments/data?phoneNumber=${account}&network=${provider}`;
    }
    return `/business/payments/airtime?phoneNumber=${account}&network=${provider}`;
  }
  if (beneficiary.service === 'data') {
    return `/business/payments/data?phoneNumber=${account}&network=${provider}`;
  }
  return `/business/payments/airtime?phoneNumber=${account}&network=${provider}`;
}

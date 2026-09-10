'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Check, ChevronLeft, ChevronRight, Loader2, Star, Wallet, XCircle } from 'lucide-react';
import { BusinessSelect } from '@/components/business/BusinessSelect';
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
import { formatPrice } from '@/utils/formatPrice';
import { cn } from '@/lib/utils';

type Service = CatalogService;

export const fieldClass =
  'mt-1.5 w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-blue-normal focus:ring-2 focus:ring-blue-normal/20 disabled:bg-gray-50';

export const primaryButtonClass =
  'inline-flex items-center justify-center gap-2 rounded-xl bg-blue-normal px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-normal-hover disabled:cursor-not-allowed disabled:opacity-50';

export const secondaryButtonClass =
  'inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50';

export function usePaymentSession() {
  const { user, demoRole } = useBusinessAuth();
  const role = user?.role ?? demoRole;
  const dashboard = getMockDashboardForRole(role);
  const defaultWallet = getWalletBalanceDisplayForRole(role);
  const branches = getMockBranchWalletOverviewForRole(role);
  const canChargeToBranch = isHeadOfficeRole(role) && branches.length > 0;
  const [chargeToBranch, setChargeToBranch] = useState(false);
  const [branchId, setBranchId] = useState(branches[0]?.branchId ?? '');

  const selectedBranch = useMemo(() => {
    if (canChargeToBranch && !chargeToBranch) {
      return {
        branchId: HEAD_OFFICE_BRANCH_ID,
        branchName: 'Head Office',
        allocatedBalance: defaultWallet.balance,
        todaySpend: dashboard.wallet.todaySpend,
        monthSpend: dashboard.wallet.monthSpend,
        monthTransactions: 0,
      };
    }
    return branches.find((branch) => branch.branchId === branchId) ?? branches[0];
  }, [
    branchId,
    branches,
    canChargeToBranch,
    chargeToBranch,
    dashboard.wallet.monthSpend,
    dashboard.wallet.todaySpend,
    defaultWallet.balance,
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

  return {
    role,
    dashboard,
    wallet,
    branches,
    beneficiaries: getMockBeneficiariesForRole(role),
    canChargeToBranch,
    chargeToBranch,
    setChargeToBranch,
    branchId,
    setBranchId,
    selectedBranch,
    frozen: dashboard.wallet.isFrozen,
    todaySpend,
    dailyLimit: dashboard.wallet.dailyLimit,
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
            <Image
              src={option.logo}
              alt=""
              width={28}
              height={28}
              className="h-7 w-7 rounded-md bg-white object-contain"
            />
            {option.name}
          </button>
        );
      })}
    </div>
  );
}

export const PLAN_PACKAGE_PAGE_SIZE = 6;

export function usePagedItems<T>(items: T[], resetKey: string, pageSize = PLAN_PACKAGE_PAGE_SIZE) {
  const [page, setPage] = useState(0);
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));

  useEffect(() => {
    setPage(0);
  }, [resetKey]);

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
    <div className="mt-3 flex items-center justify-between gap-3">
      <button
        type="button"
        onClick={() => onPageChange(Math.max(0, page - 1))}
        disabled={page === 0}
        className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
        aria-label="Previous page"
      >
        <ChevronLeft className="h-4 w-4" />
        Previous
      </button>

      <div className="flex items-center gap-1.5" role="tablist" aria-label="Pages">
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
        className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
        aria-label="Next page"
      >
        Next
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
  return (
    <p className="text-center text-xs text-gray-500">
      Demo UI — payments are not sent to a provider until backend integration.
    </p>
  );
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

'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import type { BusinessTransactionPreview } from '@/types/business';
import { getDiscoDisplayName } from '@/constants/discoNames';
import { getTransactionIcon } from '@/utils/transactionIcons';
import { formatPrice } from '@/utils/formatPrice';
import { formatBusinessBranchLabel } from '@/utils/businessBranchLabel';
import { StatusBadge } from '@/components/business/StatusBadge';
import { BusinessTransactionDetailModal } from '@/components/business/BusinessTransactionDetailModal';
import { cn } from '@/lib/utils';

export type BusinessTransactionListUpdate = {
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
};

type BusinessTransactionListProps = {
  transactions: BusinessTransactionPreview[];
  emptyMessage?: string;
  showStatusBadge?: boolean;
  showEntryTypeBadge?: boolean;
  onTransactionUpdated?: (update: BusinessTransactionListUpdate) => void;
};

function normalizeServiceKey(service: string) {
  return String(service || '').toLowerCase();
}

function serviceLabel(tx: BusinessTransactionPreview) {
  const service = normalizeServiceKey(tx.service);

  if (
    service === 'business_wallet_funding' ||
    service.includes('wallet_fund') ||
    service.includes('funding') ||
    service === 'deposit' ||
    service === 'wallet'
  ) {
    return 'Wallet funding';
  }

  if (service.includes('allocate')) {
    return tx.entryType === 'debit' ? 'Funds allocated' : 'Allocation received';
  }

  if (service === 'electricity') {
    return `Electricity · ${getDiscoDisplayName(tx.provider)}`;
  }

  if (tx.provider && tx.provider !== '—') {
    return `${tx.service} · ${tx.provider}`;
  }

  return tx.service;
}

export function BusinessTransactionList({
  transactions,
  emptyMessage = 'No transactions yet.',
  showStatusBadge = true,
  showEntryTypeBadge = true,
  onTransactionUpdated,
}: BusinessTransactionListProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [rows, setRows] = useState(transactions);

  useEffect(() => {
    setRows(transactions);
  }, [transactions]);

  const handleUpdated = (update: BusinessTransactionListUpdate) => {
    setRows((prev) =>
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
    onTransactionUpdated?.(update);
  };

  if (!rows.length) {
    return <p className="py-10 text-center text-sm text-gray-500">{emptyMessage}</p>;
  }

  return (
    <>
      <ul className="divide-y divide-gray-100">
        {rows.map((tx) => (
          <li key={tx.id} className="min-w-0">
            <button
              type="button"
              onClick={() => setSelectedId(tx.id)}
              className={cn(
                'flex w-full min-w-0 items-start gap-3 py-3 text-left transition hover:bg-gray-50',
                'rounded-lg px-1 -mx-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-normal/30',
              )}
            >
              <Image
                src={getTransactionIcon({ type: tx.service, provider: tx.provider })}
                alt={tx.service}
                width={36}
                height={36}
                className="mt-0.5 shrink-0 rounded-lg bg-gray-50 p-1"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="min-w-0 truncate text-sm font-medium text-gray-900">
                    {serviceLabel(tx)}
                  </p>
                  <p className="shrink-0 text-sm font-semibold tabular-nums text-gray-900">
                    {formatPrice(tx.amount)}
                  </p>
                </div>
                <p className="mt-0.5 truncate text-xs text-gray-500">
                  {formatBusinessBranchLabel(tx.branchName)} · {tx.userName}
                </p>
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  {showStatusBadge && <StatusBadge status={tx.status} />}
                  {showEntryTypeBadge && <StatusBadge status={tx.entryType} />}
                  <span className="text-xs text-gray-500">
                    {formatDistanceToNow(new Date(tx.createdAt), { addSuffix: true })}
                  </span>
                </div>
              </div>
            </button>
          </li>
        ))}
      </ul>

      <BusinessTransactionDetailModal
        transactionId={selectedId}
        open={selectedId !== null}
        onClose={() => setSelectedId(null)}
        onUpdated={handleUpdated}
      />
    </>
  );
}

'use client';

import { useState } from 'react';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import type { BusinessTransactionPreview } from '@/types/business';
import { getDiscoDisplayName } from '@/constants/discoNames';
import { getTransactionIcon } from '@/utils/transactionIcons';
import { formatPrice } from '@/utils/formatPrice';
import { StatusBadge } from '@/components/business/StatusBadge';
import { BusinessTransactionDetailModal } from '@/components/business/BusinessTransactionDetailModal';
import { cn } from '@/lib/utils';

type BusinessTransactionListProps = {
  transactions: BusinessTransactionPreview[];
  emptyMessage?: string;
  showStatusBadge?: boolean;
  showEntryTypeBadge?: boolean;
};

function serviceLabel(tx: BusinessTransactionPreview) {
  const providerLabel =
    tx.service === 'electricity' ? getDiscoDisplayName(tx.provider) : tx.provider;
  return `${tx.service} · ${providerLabel}`;
}

export function BusinessTransactionList({
  transactions,
  emptyMessage = 'No transactions yet.',
  showStatusBadge = true,
  showEntryTypeBadge = true,
}: BusinessTransactionListProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (!transactions.length) {
    return <p className="py-10 text-center text-sm text-gray-500">{emptyMessage}</p>;
  }

  return (
    <>
      <ul className="divide-y divide-gray-100">
        {transactions.map((tx) => (
          <li key={tx.id}>
            <button
              type="button"
              onClick={() => setSelectedId(tx.id)}
              className={cn(
                'flex w-full items-center gap-3 py-3 text-left transition hover:bg-gray-50',
                'rounded-lg px-1 -mx-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-normal/30',
              )}
            >
              <Image
                src={getTransactionIcon({ type: tx.service, provider: tx.provider })}
                alt={tx.service}
                width={36}
                height={36}
                className="rounded-lg bg-gray-50 p-1"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium capitalize text-gray-900">
                  {serviceLabel(tx)}
                </p>
                <p className="truncate text-xs text-gray-500">
                  {tx.branchName} · {tx.userName}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-sm font-semibold text-gray-900">{formatPrice(tx.amount)}</p>
                <div className="mt-1 flex items-center justify-end gap-2">
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
      />
    </>
  );
}

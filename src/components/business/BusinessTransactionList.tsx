'use client';

import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import type { BusinessTransactionPreview } from '@/types/business';
import { getDiscoDisplayName } from '@/constants/discoNames';
import { getTransactionIcon } from '@/utils/transactionIcons';
import { formatPrice } from '@/utils/formatPrice';
import { StatusBadge } from '@/components/business/StatusBadge';

type BusinessTransactionListProps = {
  transactions: BusinessTransactionPreview[];
  emptyMessage?: string;
  showEntryTypeBadge?: boolean;
  entryType?: 'debit' | 'credit';
};

function serviceLabel(tx: BusinessTransactionPreview) {
  const providerLabel =
    tx.service === 'electricity' ? getDiscoDisplayName(tx.provider) : tx.provider;
  return `${tx.service} · ${providerLabel}`;
}

export function BusinessTransactionList({
  transactions,
  emptyMessage = 'No transactions yet.',
  showEntryTypeBadge = false,
  entryType = 'debit',
}: BusinessTransactionListProps) {
  if (!transactions.length) {
    return <p className="py-10 text-center text-sm text-gray-500">{emptyMessage}</p>;
  }

  return (
    <ul className="divide-y divide-gray-100">
      {transactions.map((tx) => (
        <li key={tx.id} className="flex items-center gap-3 py-3">
          <Image
            src={getTransactionIcon({ type: tx.service, provider: tx.provider })}
            alt={tx.service}
            width={36}
            height={36}
            className="rounded-lg bg-gray-50 p-1"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium capitalize text-gray-900">{serviceLabel(tx)}</p>
            <p className="truncate text-xs text-gray-500">
              {tx.branchName} · {tx.userName}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-sm font-semibold text-gray-900">{formatPrice(tx.amount)}</p>
            <div className="mt-1 flex items-center justify-end gap-2">
              {showEntryTypeBadge && <StatusBadge status={entryType} />}
              <span className="text-xs text-gray-500">
                {formatDistanceToNow(new Date(tx.createdAt), { addSuffix: true })}
              </span>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

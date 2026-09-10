'use client';

import {
  BusinessProviderAvatar,
  type ProviderAvatarService,
} from '@/components/business/BusinessProviderAvatar';
import type { TransactionIconInput } from '@/utils/transactionIcons';

type BusinessTransactionProviderIconProps = {
  transaction: TransactionIconInput;
  alt?: string;
  size?: number;
  className?: string;
};

function mapService(transaction: TransactionIconInput): ProviderAvatarService | string {
  return transaction.type || transaction.service || transaction.payment_for || 'electricity';
}

function mapSize(size?: number): 'sm' | 'md' | 'lg' {
  if (!size || size <= 28) return 'sm';
  if (size >= 40) return 'lg';
  return 'md';
}

/** Transaction list/detail provider mark — chip style via BusinessProviderAvatar. */
export function BusinessTransactionProviderIcon({
  transaction,
  alt,
  size = 36,
  className,
}: BusinessTransactionProviderIconProps) {
  return (
    <BusinessProviderAvatar
      service={mapService(transaction)}
      provider={transaction.provider}
      size={mapSize(size)}
      className={className}
      alt={alt || transaction.service || transaction.type || 'transaction'}
    />
  );
}

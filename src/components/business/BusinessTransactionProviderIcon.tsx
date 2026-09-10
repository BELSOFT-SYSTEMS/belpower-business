'use client';

import { useEffect, useState } from 'react';
import {
  getTransactionIcon,
  getTransactionIconFallback,
  type TransactionIconInput,
} from '@/utils/transactionIcons';
import { cn } from '@/lib/utils';

type BusinessTransactionProviderIconProps = {
  transaction: TransactionIconInput;
  alt?: string;
  size?: number;
  className?: string;
};

/**
 * Provider logo with onError fallback — same pattern as belpower-frontend
 * `TransactionProviderIcon` (avoids broken Next/Image when a logo path 404s).
 */
export function BusinessTransactionProviderIcon({
  transaction,
  alt,
  size = 36,
  className,
}: BusinessTransactionProviderIconProps) {
  const [src, setSrc] = useState(() => getTransactionIcon(transaction));
  const fallbackType = transaction.type || transaction.service || transaction.payment_for;

  useEffect(() => {
    setSrc(getTransactionIcon(transaction));
  }, [transaction.type, transaction.service, transaction.provider, transaction.payment_for]);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt || transaction.service || transaction.type || 'transaction'}
      width={size}
      height={size}
      className={cn('shrink-0 object-contain', className)}
      style={{
        width: size,
        height: size,
        minWidth: size,
        maxWidth: size,
        minHeight: size,
        maxHeight: size,
      }}
      onError={() => setSrc(getTransactionIconFallback(fallbackType))}
    />
  );
}

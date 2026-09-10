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
 * `TransactionProviderIcon`. Remounts when provider changes so a prior 404
 * cannot leave the fallback stuck after the list is hydrated from detail.
 */
export function BusinessTransactionProviderIcon({
  transaction,
  alt,
  size = 36,
  className,
}: BusinessTransactionProviderIconProps) {
  const resolvedSrc = getTransactionIcon(transaction);
  const fallbackType = transaction.type || transaction.service || transaction.payment_for;
  const fallbackSrc = getTransactionIconFallback(fallbackType);
  const [src, setSrc] = useState(resolvedSrc);

  useEffect(() => {
    setSrc(resolvedSrc);
  }, [resolvedSrc]);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      key={resolvedSrc}
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
      onError={() => {
        if (src !== fallbackSrc) setSrc(fallbackSrc);
      }}
    />
  );
}

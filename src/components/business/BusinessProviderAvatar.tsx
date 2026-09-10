'use client';

import { useEffect, useState } from 'react';
import { getDiscoLogoPath } from '@/utils/discoLogoMap';
import {
  getProviderLogo as getBillProviderLogo,
  getTransactionIcon,
  getTransactionIconFallback,
} from '@/utils/transactionIcons';
import { cn } from '@/lib/utils';

export type ProviderAvatarService =
  | 'airtime'
  | 'data'
  | 'electricity'
  | 'cable'
  | 'phone'
  | 'deposit'
  | 'wallet';

type BusinessProviderAvatarProps = {
  /** Bill/service type used to resolve the logo when `src` is not provided. */
  service?: ProviderAvatarService | string;
  provider?: string | null;
  /** Direct public path override (e.g. tile logos). */
  src?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  alt?: string;
};

function normalizeService(service?: string): string {
  const value = String(service || '').toLowerCase();
  if (value === 'phone' || value.includes('airtime') || value === 'vtu') return 'airtime';
  if (value.includes('data')) return 'data';
  if (value.includes('cable') || value === 'tv') return 'cable';
  if (value.includes('electric')) return 'electricity';
  if (
    value === 'deposit' ||
    value === 'wallet' ||
    value.includes('fund') ||
    value.includes('allocate') ||
    value.startsWith('business_wallet')
  ) {
    return 'deposit';
  }
  return value || 'electricity';
}

function resolveLogoSrc(service: string, provider?: string | null, src?: string): string {
  if (src) return src;
  if (service === 'deposit') return '/wallet.png';
  if (service === 'electricity') return getDiscoLogoPath(String(provider || ''));
  if (provider) {
    return getBillProviderLogo(String(provider), service);
  }
  return getTransactionIcon({ type: service, provider: provider || undefined });
}

function fallbackFor(service: string): string {
  return getTransactionIconFallback(service);
}

const SIZE_SHELL = {
  sm: 'h-8 w-8',
  md: 'h-9 w-9',
  lg: 'h-12 w-12',
} as const;

const SIZE_MARK = {
  sm: 'h-6 w-6',
  md: 'h-7 w-7',
  lg: 'h-9 w-9',
} as const;

/**
 * Shared provider logo chip — blue ring circle + contained mark.
 * Used on beneficiaries, disco selector, transaction lists, payment tiles, receipts.
 */
export function BusinessProviderAvatar({
  service,
  provider,
  src,
  size = 'md',
  className,
  alt = '',
}: BusinessProviderAvatarProps) {
  const normalizedService = normalizeService(service);
  const resolved = resolveLogoSrc(normalizedService, provider, src);
  const fallback = fallbackFor(normalizedService);
  const [currentSrc, setCurrentSrc] = useState(resolved);

  useEffect(() => {
    setCurrentSrc(resolved);
  }, [resolved]);

  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-50 ring-1 ring-blue-100',
        SIZE_SHELL[size],
        className,
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        key={resolved}
        src={currentSrc}
        alt={alt}
        className={cn('block shrink-0 rounded-full object-contain', SIZE_MARK[size])}
        onError={() => {
          if (currentSrc !== fallback) setCurrentSrc(fallback);
        }}
      />
    </span>
  );
}

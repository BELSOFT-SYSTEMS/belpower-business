'use client';

import { useEffect, useState } from 'react';
import { getDiscoLogoPath } from '@/utils/discoLogoMap';
import { getProviderLogo as getBillProviderLogo } from '@/utils/transactionIcons';
import { cn } from '@/lib/utils';

type BusinessProviderAvatarProps = {
  service: 'airtime' | 'data' | 'electricity' | 'cable' | 'phone';
  provider: string;
  size?: 'sm' | 'md';
  className?: string;
};

function resolveLogoSrc(
  service: BusinessProviderAvatarProps['service'],
  provider: string,
): string {
  const normalizedService =
    service === 'phone' ? 'airtime' : service;
  if (normalizedService === 'electricity') {
    return getDiscoLogoPath(provider);
  }
  return getBillProviderLogo(provider, normalizedService);
}

function fallbackSrc(service: BusinessProviderAvatarProps['service']): string {
  if (service === 'electricity') return '/electricity.png';
  if (service === 'cable') return '/Tv.png';
  if (service === 'data') return '/data.png';
  return '/airtime.png';
}

/**
 * Same chip treatment as ElectricityDiscoSelector logos:
 * blue ring circle + contained provider mark.
 */
export function BusinessProviderAvatar({
  service,
  provider,
  size = 'md',
  className,
}: BusinessProviderAvatarProps) {
  const resolved = resolveLogoSrc(service, provider);
  const [src, setSrc] = useState(resolved);

  useEffect(() => {
    setSrc(resolved);
  }, [resolved]);

  const shell =
    size === 'sm'
      ? 'h-8 w-8'
      : 'h-9 w-9';
  const mark =
    size === 'sm'
      ? 'h-6 w-6'
      : 'h-7 w-7';

  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-50 ring-1 ring-blue-100',
        shell,
        className,
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        key={resolved}
        src={src}
        alt=""
        className={cn('block shrink-0 rounded-full object-contain', mark)}
        onError={() => {
          const next = fallbackSrc(service);
          if (src !== next) setSrc(next);
        }}
      />
    </span>
  );
}

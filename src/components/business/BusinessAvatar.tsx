'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

export function getBusinessInitials(name: string | null | undefined): string {
  const parts = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .filter((part) => !/^(ltd|limited|llc|inc|plc|co|company|&|and|the)$/i.test(part));

  if (parts.length === 0) return 'B';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
}

type BusinessAvatarProps = {
  name: string;
  logoUrl?: string | null;
  size?: number;
  className?: string;
};

export function BusinessAvatar({ name, logoUrl, size = 36, className }: BusinessAvatarProps) {
  const initials = getBusinessInitials(name);
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [logoUrl]);

  if (logoUrl && !imageFailed) {
    return (
      <Image
        src={logoUrl}
        alt={name}
        width={size}
        height={size}
        className={cn(
          'rounded-lg border border-gray-200 bg-white object-contain p-1',
          className,
        )}
        unoptimized={logoUrl.startsWith('blob:') || logoUrl.startsWith('data:')}
        onError={() => setImageFailed(true)}
      />
    );
  }

  return (
    <div
      className={cn(
        'inline-flex items-center justify-center rounded-lg border border-blue-200 bg-blue-light font-semibold text-blue-normal',
        className,
      )}
      style={{ width: size, height: size, fontSize: Math.max(11, Math.round(size * 0.32)) }}
      aria-label={name}
      title={name}
    >
      {initials}
    </div>
  );
}

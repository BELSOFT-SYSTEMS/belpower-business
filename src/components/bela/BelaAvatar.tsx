'use client';

import Image from 'next/image';

type BelaAvatarProps = {
  size: number;
  className?: string;
  priority?: boolean;
};

/** Bela assistant avatar — unoptimized to match consumer app and avoid optimizer issues with the large PNG. */
export function BelaAvatar({ size, className = '', priority = false }: BelaAvatarProps) {
  return (
    <span
      className={`bela-avatar-inner relative z-[2] block shrink-0 overflow-hidden rounded-full bg-white ${className}`}
      style={{ width: size, height: size }}
    >
      <Image
        src="/Bela.png"
        alt="Bela"
        width={size}
        height={size}
        unoptimized
        priority={priority}
        className="h-full w-full object-cover"
        draggable={false}
      />
    </span>
  );
}

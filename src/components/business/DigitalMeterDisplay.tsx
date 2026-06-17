'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { IoWallet } from 'react-icons/io5';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { BranchMeter } from '@/types/business';
import { getDiscoDisplayName } from '@/constants/discoNames';
import { getDiscoIcon } from '@/utils/transactionIcons';
import { formatPrice } from '@/utils/formatPrice';
import styles from './DigitalMeter.module.css';

type Reading = {
  value: string;
  label: string;
};

type DigitalMeterCardProps = {
  meter: BranchMeter;
  walletBalance: number;
  showBranchLabel?: boolean;
};

function DigitalMeterCard({ meter, walletBalance, showBranchLabel = false }: DigitalMeterCardProps) {
  const [currentReadingIndex, setCurrentReadingIndex] = useState(0);

  const readings: Reading[] = [
    { value: '25 W', label: 'Power usage' },
    { value: '6.20 kWh', label: 'Energy balance' },
    { value: '230 V', label: 'Voltage' },
    { value: '50 Hz', label: 'Frequency' },
  ];

  useEffect(() => {
    const interval = window.setInterval(() => {
      setCurrentReadingIndex((prev) => (prev + 1) % readings.length);
    }, 3000);
    return () => window.clearInterval(interval);
  }, [readings.length]);

  const currentReading = readings[currentReadingIndex];
  const hasEnoughCredit = walletBalance > 0;
  const discoIcon = getDiscoIcon(meter.disco);

  return (
    <div className="relative flex w-full flex-col gap-2 overflow-hidden rounded-xl bg-linear-to-t from-[#28228D] to-[#000041] p-4 text-white">
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-gray-800/80 backdrop-blur-sm">
        <div className="flex flex-col items-center justify-center gap-1.5 px-4 text-center">
          <div className="inline-block rounded-full bg-gray-800/90 px-3 py-1">
            <span className="text-xs font-semibold text-gray-300">🚧 Feature Coming Soon</span>
          </div>
          <p className="text-xs text-gray-300">
            Real-time meter monitoring will be available in the next update
          </p>
        </div>
      </div>

      <div className="flex items-start justify-between gap-2">
        {showBranchLabel ? (
          <p className="min-w-0 truncate text-xs font-medium text-blue-200">{meter.branchName}</p>
        ) : (
          <span className="text-xs font-semibold uppercase tracking-wide text-blue-200/80">
            Digital meter
          </span>
        )}
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="min-w-0 truncate text-sm font-medium">Meter: {meter.meterNumber}</p>
        <div className="flex shrink-0 items-center gap-1.5 whitespace-nowrap">
          <span className="text-xs">{hasEnoughCredit ? 'Enough credit' : 'Low credit'}</span>
          <div className={`h-2 w-2 rounded-full ${hasEnoughCredit ? 'bg-green-400' : 'bg-red-500'}`} />
        </div>
      </div>

      <div className="flex min-w-0 items-center gap-2">
        <Image
          src={discoIcon}
          alt={meter.disco}
          width={24}
          height={24}
          className="shrink-0 rounded bg-white/10 p-0.5"
        />
        <p className="min-w-0 truncate text-xs text-gray-300">{getDiscoDisplayName(meter.disco)}</p>
      </div>

      <div className="relative mb-2 rounded-lg border border-green-400/30 bg-green-400/20 p-3">
        <div className="mb-1 flex items-center justify-between">
          <span className="text-xs text-green-300">{currentReading.label}</span>
          <span className="text-xs text-green-300">
            {currentReadingIndex + 1}/{readings.length}
          </span>
        </div>
        <div className={`${styles.digitalDisplay} font-digital`}>{currentReading.value}</div>
      </div>

      <div className="flex items-center justify-between text-xs text-gray-300">
        <div className="flex items-center space-x-1">
          <IoWallet className="h-3.5 w-3.5" />
          <span>Wallet:</span>
          <span className="font-medium">{formatPrice(walletBalance)}</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className={`h-2 w-2 rounded-full ${hasEnoughCredit ? 'bg-green-400' : 'bg-red-500'}`} />
          <span>{hasEnoughCredit ? 'Connected' : 'Disconnected'}</span>
        </div>
      </div>
    </div>
  );
}

type DigitalMeterDisplayProps = {
  meters: BranchMeter[];
  walletBalance: number;
  allowSwipe?: boolean;
};

export function DigitalMeterDisplay({
  meters,
  walletBalance,
  allowSwipe = false,
}: DigitalMeterDisplayProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const showCarousel = allowSwipe && meters.length > 1;

  if (!meters.length) {
    return (
      <div className="w-full rounded-xl border border-dashed border-gray-300 bg-gray-50 p-6 text-center text-sm text-gray-500">
        No meter linked to this branch yet.
      </div>
    );
  }

  const goPrev = () => setActiveIndex((i) => (i === 0 ? meters.length - 1 : i - 1));
  const goNext = () => setActiveIndex((i) => (i + 1) % meters.length);

  if (!showCarousel) {
    return (
      <div className="h-full w-full">
        <DigitalMeterCard
          meter={meters[0]}
          walletBalance={walletBalance}
          showBranchLabel={false}
        />
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-700">
          Branch meters ({activeIndex + 1} of {meters.length})
        </p>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={goPrev}
            className="rounded-lg border border-gray-200 bg-white p-1.5 text-gray-600 hover:bg-gray-50"
            aria-label="Previous meter"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={goNext}
            className="rounded-lg border border-gray-200 bg-white p-1.5 text-gray-600 hover:bg-gray-50"
            aria-label="Next meter"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex w-full flex-1 flex-col">
        <div
          className="flex w-full flex-1 touch-pan-y"
        onTouchStart={(e) => {
          (e.currentTarget as HTMLElement & { _touchX?: number })._touchX = e.touches[0].clientX;
        }}
        onTouchEnd={(e) => {
          const el = e.currentTarget as HTMLElement & { _touchX?: number };
          const startX = el._touchX;
          if (startX == null) return;
          const diff = e.changedTouches[0].clientX - startX;
          if (Math.abs(diff) > 40) {
            if (diff > 0) goPrev();
            else goNext();
          }
        }}
        >
          <DigitalMeterCard
            meter={meters[activeIndex]}
            walletBalance={walletBalance}
            showBranchLabel
          />
        </div>
      </div>

      <div className="flex justify-center gap-1.5">
        {meters.map((meter, index) => (
          <button
            key={meter.id}
            type="button"
            onClick={() => setActiveIndex(index)}
            className={`h-2 rounded-full transition-all ${
              index === activeIndex ? 'w-6 bg-blue-normal' : 'w-2 bg-gray-300'
            }`}
            aria-label={`Show ${meter.branchName} meter`}
          />
        ))}
      </div>
    </div>
  );
}

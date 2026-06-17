'use client';

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { BranchSpendItem, BranchSpendPeriod, BusinessRole } from '@/types/business';
import { getMockBranchSpendForPeriod } from '@/data/businessMocks';
import { formatPrice } from '@/utils/formatPrice';
import { cn } from '@/lib/utils';

const SPEND_PERIOD_OPTIONS: { value: BranchSpendPeriod; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: '7d', label: '7 days' },
  { value: '30d', label: '30 days' },
  { value: 'all', label: 'All time' },
];

type BranchSpendCarouselProps = {
  role: BusinessRole;
};

const SCROLL_SPEED = 0.75;
const MANUAL_PAUSE_MS = 3000;

function BranchSpendCard({ branch }: { branch: BranchSpendItem }) {
  return (
    <li className="w-fit max-w-full shrink-0 rounded-lg border border-gray-100 bg-gray-50 px-4 py-3">
      <p className="whitespace-nowrap text-sm font-medium text-gray-900">{branch.branchName}</p>
      <p className="mt-1 whitespace-nowrap text-lg font-semibold text-blue-normal">
        {formatPrice(branch.amount)}
      </p>
    </li>
  );
}

export function BranchSpendCarousel({ role }: BranchSpendCarouselProps) {
  const [period, setPeriod] = useState<BranchSpendPeriod>('30d');
  const branches = useMemo(
    () => getMockBranchSpendForPeriod(period, role),
    [period, role],
  );

  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLUListElement>(null);
  const offsetRef = useRef(0);
  const loopWidthRef = useRef(0);
  const pausedRef = useRef(false);
  const canLoopRef = useRef(false);
  const pauseTimerRef = useRef<number | null>(null);
  const [canNavigate, setCanNavigate] = useState(false);
  const [needsLoop, setNeedsLoop] = useState(false);

  const displayItems = useMemo(() => {
    const source = needsLoop ? [...branches, ...branches] : branches;
    return source.map((branch, index) => ({
      ...branch,
      key: `${branch.branchId}-${period}-${index}`,
    }));
  }, [branches, period, needsLoop]);

  const applyOffset = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;

    if (needsLoop && loopWidthRef.current > 0) {
      track.style.transform = `translate3d(-${offsetRef.current}px, 0, 0)`;
      return;
    }

    track.style.transform = '';
  }, [needsLoop]);

  const normalizeOffset = useCallback(() => {
    const loopWidth = loopWidthRef.current;
    if (!loopWidth) return;

    while (offsetRef.current >= loopWidth) {
      offsetRef.current -= loopWidth;
    }
    while (offsetRef.current < 0) {
      offsetRef.current += loopWidth;
    }
  }, []);

  const measureLoopWidth = useCallback(
    (track: HTMLUListElement) => {
      const midIndex = branches.length;
      const first = track.children[0] as HTMLElement | undefined;
      const secondSetFirst = track.children[midIndex] as HTMLElement | undefined;

      if (first && secondSetFirst) {
        return secondSetFirst.offsetLeft - first.offsetLeft;
      }

      return track.scrollWidth / 2;
    },
    [branches.length],
  );

  const measureLayout = useCallback(() => {
    const track = trackRef.current;
    const container = containerRef.current;
    if (!track || !container) return;

    const viewportWidth = container.clientWidth;

    if (needsLoop) {
      const loopWidth = measureLoopWidth(track);
      const shouldScroll = loopWidth > viewportWidth + 1;

      if (!shouldScroll) {
        setNeedsLoop(false);
        offsetRef.current = 0;
        loopWidthRef.current = 0;
        canLoopRef.current = false;
        setCanNavigate(false);
        track.style.transform = '';
        return;
      }

      loopWidthRef.current = loopWidth;
      canLoopRef.current = true;
      setCanNavigate(true);
      normalizeOffset();
      applyOffset();
      return;
    }

    const contentWidth = track.scrollWidth;
    if (contentWidth > viewportWidth + 1) {
      setNeedsLoop(true);
      return;
    }

    offsetRef.current = 0;
    loopWidthRef.current = 0;
    canLoopRef.current = false;
    setCanNavigate(false);
    track.style.transform = '';
  }, [applyOffset, measureLoopWidth, needsLoop, normalizeOffset]);

  useEffect(() => {
    setNeedsLoop(false);
    setCanNavigate(false);
    offsetRef.current = 0;
    loopWidthRef.current = 0;
    canLoopRef.current = false;
    if (trackRef.current) trackRef.current.style.transform = '';
  }, [period, branches]);

  useLayoutEffect(() => {
    measureLayout();
    const rafId = window.requestAnimationFrame(measureLayout);
    return () => window.cancelAnimationFrame(rafId);
  }, [displayItems, measureLayout]);

  useEffect(() => {
    const track = trackRef.current;
    const container = containerRef.current;
    if (!track || !container) return;

    const observer = new ResizeObserver(measureLayout);
    observer.observe(container);
    observer.observe(track);
    for (const child of track.children) {
      observer.observe(child);
    }

    return () => observer.disconnect();
  }, [displayItems, measureLayout]);

  const pauseAutoScroll = useCallback((duration = MANUAL_PAUSE_MS) => {
    pausedRef.current = true;
    if (pauseTimerRef.current) window.clearTimeout(pauseTimerRef.current);
    pauseTimerRef.current = window.setTimeout(() => {
      pausedRef.current = false;
      pauseTimerRef.current = null;
    }, duration);
  }, []);

  const getStepSize = useCallback(() => {
    const track = trackRef.current;
    if (!track) return 200;
    const card = track.querySelector('li');
    return card ? card.clientWidth + 12 : 200;
  }, []);

  const scrollByStep = useCallback(
    (direction: 'prev' | 'next') => {
      if (!canLoopRef.current || !loopWidthRef.current) return;

      pauseAutoScroll();
      const step = getStepSize();
      offsetRef.current += direction === 'next' ? step : -step;
      normalizeOffset();
      applyOffset();
    },
    [applyOffset, getStepSize, normalizeOffset, pauseAutoScroll],
  );

  useEffect(() => {
    if (!needsLoop) return;

    let frame = 0;

    const animate = () => {
      if (!pausedRef.current && canLoopRef.current && loopWidthRef.current > 0) {
        offsetRef.current += SCROLL_SPEED;

        if (offsetRef.current >= loopWidthRef.current) {
          offsetRef.current -= loopWidthRef.current;
        }

        const track = trackRef.current;
        if (track) {
          track.style.transform = `translate3d(-${offsetRef.current}px, 0, 0)`;
        }
      }

      frame = window.requestAnimationFrame(animate);
    };

    frame = window.requestAnimationFrame(animate);
    return () => window.cancelAnimationFrame(frame);
  }, [needsLoop, displayItems]);

  useEffect(
    () => () => {
      if (pauseTimerRef.current) window.clearTimeout(pauseTimerRef.current);
    },
    [],
  );

  if (!branches.length) return null;

  return (
    <div className="min-w-0">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Spend by branch</h2>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap gap-2">
            {SPEND_PERIOD_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setPeriod(option.value)}
                className={cn(
                  'rounded-full px-3 py-1 text-xs font-medium',
                  period === option.value
                    ? 'bg-blue-normal text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
          {canNavigate && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => scrollByStep('prev')}
                className="rounded-lg border border-gray-200 bg-white p-1.5 text-gray-600 hover:bg-gray-50"
                aria-label="Previous branch"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => scrollByStep('next')}
                className="rounded-lg border border-gray-200 bg-white p-1.5 text-gray-600 hover:bg-gray-50"
                aria-label="Next branch"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      <div
        ref={containerRef}
        className="relative w-full min-w-0 overflow-hidden"
        onMouseEnter={() => {
          pausedRef.current = true;
        }}
        onMouseLeave={() => {
          if (!pauseTimerRef.current) pausedRef.current = false;
        }}
        onTouchStart={() => {
          pauseAutoScroll();
        }}
      >
        <ul
          ref={trackRef}
          className={cn(
            'flex gap-3 pb-1 will-change-transform',
            needsLoop ? 'w-max' : 'w-full min-w-0',
          )}
          aria-label="Spend by branch"
        >
          {displayItems.map((branch) => (
            <BranchSpendCard key={branch.key} branch={branch} />
          ))}
        </ul>
      </div>
    </div>
  );
}

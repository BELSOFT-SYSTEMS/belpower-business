'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { formatPrice } from '@/utils/formatPrice';

type BranchSpendItem = {
  branchId: string;
  branchName: string;
  amount: number;
};

type BranchSpendCarouselProps = {
  branches: BranchSpendItem[];
};

const SCROLL_SPEED = 0.75;
const MANUAL_PAUSE_MS = 3000;

function BranchSpendCard({ branch }: { branch: BranchSpendItem }) {
  return (
    <li className="w-[min(100%,220px)] shrink-0 rounded-lg border border-gray-100 bg-gray-50 px-4 py-3 sm:w-[calc((100%-1.5rem)/3)]">
      <p className="truncate text-sm font-medium text-gray-900">{branch.branchName}</p>
      <p className="mt-1 text-lg font-semibold text-blue-normal">{formatPrice(branch.amount)}</p>
    </li>
  );
}

export function BranchSpendCarousel({ branches }: BranchSpendCarouselProps) {
  const scrollRef = useRef<HTMLUListElement>(null);
  const loopWidthRef = useRef(0);
  const pausedRef = useRef(false);
  const canLoopRef = useRef(false);
  const pauseTimerRef = useRef<number | null>(null);
  const [canNavigate, setCanNavigate] = useState(false);

  const loopItems = useMemo(
    () => [...branches, ...branches].map((branch, index) => ({ ...branch, key: `${branch.branchId}-${index}` })),
    [branches]
  );

  const pauseAutoScroll = useCallback((duration = MANUAL_PAUSE_MS) => {
    pausedRef.current = true;
    if (pauseTimerRef.current) window.clearTimeout(pauseTimerRef.current);
    pauseTimerRef.current = window.setTimeout(() => {
      pausedRef.current = false;
      pauseTimerRef.current = null;
    }, duration);
  }, []);

  const getStepSize = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return 232;
    const card = el.querySelector('li');
    return card ? card.clientWidth + 12 : 232;
  }, []);

  const normalizeScroll = useCallback(() => {
    const el = scrollRef.current;
    const loopWidth = loopWidthRef.current;
    if (!el || !loopWidth) return;

    if (el.scrollLeft >= loopWidth) {
      el.scrollLeft -= loopWidth;
    }
  }, []);

  const measureLoop = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;

    loopWidthRef.current = el.scrollWidth / 2;
    canLoopRef.current = loopWidthRef.current > el.clientWidth + 1;
    setCanNavigate(canLoopRef.current);

    if (canLoopRef.current && el.scrollLeft >= loopWidthRef.current) {
      el.scrollLeft -= loopWidthRef.current;
    }
  }, []);

  const scrollByStep = useCallback(
    (direction: 'prev' | 'next') => {
      const el = scrollRef.current;
      const loopWidth = loopWidthRef.current;
      if (!el || !canLoopRef.current) return;

      pauseAutoScroll();
      const step = getStepSize();

      if (direction === 'next') {
        el.scrollBy({ left: step, behavior: 'smooth' });
        window.setTimeout(normalizeScroll, 320);
        return;
      }

      if (el.scrollLeft < step && loopWidth) {
        el.scrollLeft += loopWidth;
      }
      el.scrollBy({ left: -step, behavior: 'smooth' });
      window.setTimeout(normalizeScroll, 320);
    },
    [getStepSize, normalizeScroll, pauseAutoScroll]
  );

  useEffect(() => {
    measureLoop();
    window.addEventListener('resize', measureLoop);
    return () => window.removeEventListener('resize', measureLoop);
  }, [loopItems, measureLoop]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    let frame = 0;

    const animate = () => {
      if (!pausedRef.current && canLoopRef.current) {
        el.scrollLeft += SCROLL_SPEED;
        normalizeScroll();
      }
      frame = window.requestAnimationFrame(animate);
    };

    frame = window.requestAnimationFrame(animate);
    return () => window.cancelAnimationFrame(frame);
  }, [loopItems, normalizeScroll]);

  useEffect(
    () => () => {
      if (pauseTimerRef.current) window.clearTimeout(pauseTimerRef.current);
    },
    []
  );

  if (!branches.length) return null;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-gray-900">Spend by branch</h2>
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

      <div
        className="relative overflow-hidden"
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
          ref={scrollRef}
          onScroll={normalizeScroll}
          className="flex gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          aria-label="Spend by branch"
        >
          {loopItems.map((branch) => (
            <BranchSpendCard key={branch.key} branch={branch} />
          ))}
        </ul>
      </div>
    </div>
  );
}

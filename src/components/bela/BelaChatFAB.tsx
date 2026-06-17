'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useBelaChat } from '@/context/BelaChatContext';
import { BelaAvatar } from './BelaAvatar';

const FAB_SIZE = 56;
const EDGE_PADDING = 20;
const BOTTOM_PADDING = 80;
const DRAG_THRESHOLD = 6;
const STORAGE_KEY = 'bela-fab-position';

type Position = { x: number; y: number };

function clampPosition(x: number, y: number): Position {
  const maxX = Math.max(EDGE_PADDING, window.innerWidth - FAB_SIZE - EDGE_PADDING);
  const maxY = Math.max(EDGE_PADDING, window.innerHeight - FAB_SIZE - EDGE_PADDING);
  return {
    x: Math.min(Math.max(x, EDGE_PADDING), maxX),
    y: Math.min(Math.max(y, EDGE_PADDING), maxY),
  };
}

function defaultPosition(): Position {
  if (typeof window === 'undefined') {
    return { x: EDGE_PADDING, y: EDGE_PADDING };
  }
  return clampPosition(
    window.innerWidth - FAB_SIZE - EDGE_PADDING,
    window.innerHeight - FAB_SIZE - BOTTOM_PADDING
  );
}

function snapPosition(position: Position): Position {
  const midX = window.innerWidth / 2;
  const snapLeft = position.x + FAB_SIZE / 2 < midX;
  const x = snapLeft ? EDGE_PADDING : window.innerWidth - FAB_SIZE - EDGE_PADDING;
  return clampPosition(x, position.y);
}

function loadStoredPosition(): Position | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Position;
    if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
      return clampPosition(parsed.x, parsed.y);
    }
  } catch {
    /* ignore */
  }
  return null;
}

export default function BelaChatFAB() {
  const { isOpen, openChat } = useBelaChat();
  const [position, setPosition] = useState<Position>(() => defaultPosition());
  const [visible, setVisible] = useState(false);
  const dragState = useRef({
    active: false,
    moved: false,
    pointerId: -1,
    startX: 0,
    startY: 0,
    originX: 0,
    originY: 0,
  });

  useEffect(() => {
    const stored = loadStoredPosition();
    setPosition(stored ?? defaultPosition());
    setVisible(true);

    const onResize = () => {
      setPosition((current) => clampPosition(current.x, current.y));
    };

    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const persistPosition = useCallback((next: Position) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const onPointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (isOpen) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragState.current = {
      active: true,
      moved: false,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: position.x,
      originY: position.y,
    };
  };

  const onPointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (!dragState.current.active || dragState.current.pointerId !== event.pointerId) return;

    const dx = event.clientX - dragState.current.startX;
    const dy = event.clientY - dragState.current.startY;

    if (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD) {
      dragState.current.moved = true;
    }

    setPosition(clampPosition(dragState.current.originX + dx, dragState.current.originY + dy));
  };

  const finishPointer = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (!dragState.current.active || dragState.current.pointerId !== event.pointerId) return;

    const moved = dragState.current.moved;
    dragState.current.active = false;

    if (moved) {
      const dx = event.clientX - dragState.current.startX;
      const dy = event.clientY - dragState.current.startY;
      const snapped = snapPosition(
        clampPosition(dragState.current.originX + dx, dragState.current.originY + dy)
      );
      setPosition(snapped);
      persistPosition(snapped);
    } else {
      openChat();
    }

    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      /* ignore */
    }
  };

  if (!visible) return null;

  return (
    <button
      type="button"
      aria-label="Chat with Bela"
      title="Chat with Bela"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={finishPointer}
      onPointerCancel={finishPointer}
      className={`bela-fab fixed z-[100000] touch-none select-none transition-opacity duration-300 ${
        isOpen ? 'pointer-events-none opacity-0' : 'opacity-100'
      }`}
      style={{
        left: position.x,
        top: position.y,
        width: FAB_SIZE,
        height: FAB_SIZE,
      }}
    >
      <span className="bela-pulse-ring absolute inset-[-3px] rounded-full bg-blue-light" />
      <span className="relative z-10 block h-full w-full overflow-hidden rounded-full shadow-lg ring-2 ring-white">
        <div className="bela-image-container flex h-full w-full items-center justify-center p-0.5">
          <BelaAvatar size={FAB_SIZE - 4} priority />
        </div>
      </span>
    </button>
  );
}

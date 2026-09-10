'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { MoreVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

type MenuPosition = { top: number; right: number };

type BusinessActionsMenuProps = {
  label: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
  className?: string;
  menuClassName?: string;
};

/**
 * Row/card actions menu that uses fixed viewport positioning so it is not
 * clipped by overflow-hidden / overflow-x-auto ancestors (tables, cards).
 */
export function BusinessActionsMenu({
  label,
  open,
  onOpenChange,
  children,
  className,
  menuClassName,
}: BusinessActionsMenuProps) {
  const [position, setPosition] = useState<MenuPosition | null>(null);

  useEffect(() => {
    if (!open) {
      setPosition(null);
      return;
    }

    const close = () => onOpenChange(false);
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target?.closest('[data-business-actions-menu]') ||
        target?.closest('[data-business-actions-trigger]')
      ) {
        return;
      }
      close();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };
    const onScroll = () => close();

    window.addEventListener('mousedown', onPointerDown);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('scroll', onScroll, true);
    return () => {
      window.removeEventListener('mousedown', onPointerDown);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('scroll', onScroll, true);
    };
  }, [open, onOpenChange]);

  return (
    <div className={cn('relative inline-flex justify-end', className)}>
      <button
        type="button"
        data-business-actions-trigger
        onClick={(event) => {
          if (open) {
            onOpenChange(false);
            setPosition(null);
            return;
          }
          const rect = event.currentTarget.getBoundingClientRect();
          const menuHeight = 160;
          const openUpward = rect.bottom + menuHeight > window.innerHeight - 8;
          setPosition({
            top: openUpward ? Math.max(8, rect.top - menuHeight - 4) : rect.bottom + 4,
            right: Math.max(8, window.innerWidth - rect.right),
          });
          onOpenChange(true);
        }}
        className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-800"
        aria-label={label}
        aria-expanded={open}
      >
        <MoreVertical className="h-4 w-4" />
      </button>
      {open && position ? (
        <div
          data-business-actions-menu
          className={cn(
            'fixed z-50 w-48 rounded-xl border border-gray-200 bg-white py-1 shadow-lg',
            menuClassName,
          )}
          style={{ top: position.top, right: position.right }}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}

export function BusinessActionsMenuItem({
  children,
  onClick,
  destructive = false,
}: {
  children: ReactNode;
  onClick: () => void;
  destructive?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-50',
        destructive ? 'text-red-600 hover:bg-red-50' : 'text-gray-700',
      )}
    >
      {children}
    </button>
  );
}

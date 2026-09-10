'use client';

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { useBusinessAuth } from '@/context/BusinessAuthContext';
import { MOCK_NOTIFICATIONS } from '@/data/businessMocks';
import { businessNotificationsApi } from '@/lib/businessNotificationsApi';
import type { BusinessNotification } from '@/types/business';

const typeStyles = {
  transaction: 'bg-purple-50 text-purple-700',
  wallet: 'bg-green-light text-green-normal',
  team: 'bg-blue-light text-blue-normal',
  system: 'bg-gray-normal text-gray',
} as const;

const PREVIEW_COUNT = 5;
const PANEL_MAX_WIDTH = 352; // 22rem
const VIEWPORT_GUTTER = 8;

function normalizeType(type: string): BusinessNotification['type'] {
  if (type === 'transaction' || type === 'wallet' || type === 'team' || type === 'system') {
    return type;
  }
  return 'system';
}

type PanelPosition = {
  top: number;
  left: number;
  width: number;
};

function getPanelPosition(trigger: HTMLElement): PanelPosition {
  const rect = trigger.getBoundingClientRect();
  const width = Math.min(PANEL_MAX_WIDTH, window.innerWidth - VIEWPORT_GUTTER * 2);
  let left = rect.right - width;
  left = Math.max(VIEWPORT_GUTTER, Math.min(left, window.innerWidth - width - VIEWPORT_GUTTER));
  return {
    top: rect.bottom + 8,
    left,
    width,
  };
}

export function BusinessNotificationsDropdown() {
  const { dashboardBootstrap, isAuthenticated, refreshMe } = useBusinessAuth();
  const [open, setOpen] = useState(false);
  const [localReads, setLocalReads] = useState<Record<string, boolean>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [panelPosition, setPanelPosition] = useState<PanelPosition | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const notifications = useMemo(() => {
    const source: BusinessNotification[] = isAuthenticated
      ? (dashboardBootstrap?.notifications ?? []).map((row) => ({
          id: row.id,
          title: row.title,
          message: row.message,
          type: normalizeType(row.type),
          read: Boolean(localReads[row.id] ?? row.read),
          createdAt: row.createdAt || new Date().toISOString(),
        }))
      : MOCK_NOTIFICATIONS.map((row) => ({
          ...row,
          read: Boolean(localReads[row.id] ?? row.read),
        }));

    return [...source].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }, [dashboardBootstrap?.notifications, isAuthenticated, localReads]);

  const preview = useMemo(() => notifications.slice(0, PREVIEW_COUNT), [notifications]);
  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.read).length,
    [notifications],
  );

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) {
      setPanelPosition(null);
      return;
    }

    const update = () => {
      if (!triggerRef.current) return;
      setPanelPosition(getPanelPosition(triggerRef.current));
    };

    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      setExpandedId(null);
      return;
    }

    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (containerRef.current?.contains(target) || panelRef.current?.contains(target)) {
        return;
      }
      setOpen(false);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    window.addEventListener('mousedown', onPointerDown);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('mousedown', onPointerDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const toggleNotification = (id: string) => {
    setLocalReads((current) => ({ ...current, [id]: true }));
    setExpandedId((current) => (current === id ? null : id));

    if (isAuthenticated) {
      void (async () => {
        try {
          await businessNotificationsApi.markRead(id);
          await refreshMe();
        } catch {
          // Keep optimistic localReads; refresh may still catch up later.
        }
      })();
    }
  };

  const markAllAsRead = () => {
    const next: Record<string, boolean> = {};
    for (const notification of notifications) {
      next[notification.id] = true;
    }
    setLocalReads(next);

    if (isAuthenticated) {
      void (async () => {
        try {
          await businessNotificationsApi.markAllRead();
          await refreshMe();
        } catch {
          // Keep optimistic localReads; refresh may still catch up later.
        }
      })();
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="relative rounded-lg p-2 text-gray-600 hover:bg-gray-100"
        aria-label="Notifications"
        aria-expanded={open}
        aria-haspopup="dialog"
        title="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 ? (
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-blue-normal ring-2 ring-white" />
        ) : null}
      </button>

      {open && panelPosition ? (
        <div
          ref={panelRef}
          role="dialog"
          aria-label="Notifications"
          className="fixed z-50 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg"
          style={{
            top: panelPosition.top,
            left: panelPosition.left,
            width: panelPosition.width,
            maxHeight: `min(24rem, calc(100vh - ${panelPosition.top + VIEWPORT_GUTTER}px))`,
          }}
        >
          <div className="flex items-start justify-between gap-2 border-b border-gray-100 px-3 py-3 sm:items-center sm:gap-3 sm:px-4">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900">Notifications</p>
              <p className="text-xs text-gray-500">
                {unreadCount > 0 ? `${unreadCount} unread` : 'You are all caught up'}
              </p>
            </div>
            {unreadCount > 0 ? (
              <button
                type="button"
                onClick={markAllAsRead}
                className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-blue-normal hover:bg-blue-light"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                <span className="sm:hidden">All read</span>
                <span className="hidden sm:inline">Mark all read</span>
              </button>
            ) : null}
          </div>

          {preview.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-gray-500">No notifications yet.</p>
          ) : (
            <ul
              className="overflow-y-auto divide-y divide-gray-100"
              style={{
                maxHeight: `min(20rem, calc(100vh - ${panelPosition.top + 72}px))`,
              }}
            >
              {preview.map((notification) => {
                const expanded = expandedId === notification.id;
                return (
                  <li key={notification.id} className="min-w-0">
                    <button
                      type="button"
                      onClick={() => toggleNotification(notification.id)}
                      aria-expanded={expanded}
                      className={cn(
                        'w-full min-w-0 px-3 py-3 text-left transition hover:bg-gray-50 sm:px-4',
                        !notification.read && 'bg-blue-light/20',
                      )}
                    >
                      <div className="flex min-w-0 flex-col gap-1.5">
                        <div className="flex min-w-0 items-start justify-between gap-2">
                          <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                            <p className="min-w-0 break-words text-sm font-semibold text-gray-900">
                              {notification.title}
                            </p>
                            <span
                              className={cn(
                                'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium capitalize',
                                typeStyles[notification.type],
                              )}
                            >
                              {notification.type}
                            </span>
                            {!notification.read ? (
                              <span
                                className="h-1.5 w-1.5 shrink-0 rounded-full bg-blue-normal"
                                aria-label="Unread"
                              />
                            ) : null}
                          </div>
                          <time className="shrink-0 whitespace-nowrap pt-0.5 text-[10px] text-gray-500">
                            {formatDistanceToNow(new Date(notification.createdAt), {
                              addSuffix: true,
                            })}
                          </time>
                        </div>
                        <p
                          className={cn(
                            'min-w-0 break-words text-xs text-gray-600',
                            expanded ? 'whitespace-pre-wrap' : 'line-clamp-2',
                          )}
                        >
                          {notification.message}
                        </p>
                        {notification.message.length > 90 ? (
                          <span className="text-[11px] font-medium text-blue-normal">
                            {expanded ? 'Show less' : 'Show more'}
                          </span>
                        ) : null}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}

'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { useBusinessAuth } from '@/context/BusinessAuthContext';
import { MOCK_NOTIFICATIONS } from '@/data/businessMocks';
import type { BusinessNotification } from '@/types/business';

const typeStyles = {
  transaction: 'bg-purple-50 text-purple-700',
  wallet: 'bg-green-light text-green-normal',
  team: 'bg-blue-light text-blue-normal',
  system: 'bg-gray-normal text-gray',
} as const;

const PREVIEW_COUNT = 5;

function normalizeType(type: string): BusinessNotification['type'] {
  if (type === 'transaction' || type === 'wallet' || type === 'team' || type === 'system') {
    return type;
  }
  return 'system';
}

export function BusinessNotificationsDropdown() {
  const { dashboardBootstrap, isAuthenticated } = useBusinessAuth();
  const [open, setOpen] = useState(false);
  const [localReads, setLocalReads] = useState<Record<string, boolean>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (!open) {
      setExpandedId(null);
      return;
    }

    const onPointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
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
  };

  const markAllAsRead = () => {
    const next: Record<string, boolean> = {};
    for (const notification of notifications) {
      next[notification.id] = true;
    }
    setLocalReads(next);
  };

  return (
    <div ref={containerRef} className="relative">
      <button
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

      {open ? (
        <div
          role="dialog"
          aria-label="Notifications"
          className="absolute right-0 z-50 mt-2 w-[min(100vw-2rem,22rem)] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg"
        >
          <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-gray-900">Notifications</p>
              <p className="text-xs text-gray-500">
                {unreadCount > 0 ? `${unreadCount} unread` : 'You are all caught up'}
              </p>
            </div>
            {unreadCount > 0 ? (
              <button
                type="button"
                onClick={markAllAsRead}
                className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-blue-normal hover:bg-blue-light"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Mark all read
              </button>
            ) : null}
          </div>

          {preview.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-gray-500">No notifications yet.</p>
          ) : (
            <ul className="max-h-[24rem] overflow-y-auto divide-y divide-gray-100">
              {preview.map((notification) => {
                const expanded = expandedId === notification.id;
                return (
                  <li key={notification.id}>
                    <button
                      type="button"
                      onClick={() => toggleNotification(notification.id)}
                      aria-expanded={expanded}
                      className={cn(
                        'w-full px-4 py-3 text-left transition hover:bg-gray-50',
                        !notification.read && 'bg-blue-light/20',
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-semibold text-gray-900">
                              {notification.title}
                            </p>
                            <span
                              className={cn(
                                'rounded-full px-2 py-0.5 text-[10px] font-medium capitalize',
                                typeStyles[notification.type],
                              )}
                            >
                              {notification.type}
                            </span>
                            {!notification.read ? (
                              <span
                                className="h-1.5 w-1.5 rounded-full bg-blue-normal"
                                aria-label="Unread"
                              />
                            ) : null}
                          </div>
                          <p
                            className={cn(
                              'mt-1 text-xs text-gray-600',
                              expanded ? 'whitespace-pre-wrap' : 'line-clamp-2',
                            )}
                          >
                            {notification.message}
                          </p>
                          {!expanded && notification.message.length > 90 ? (
                            <span className="mt-1 inline-block text-[11px] font-medium text-blue-normal">
                              Show more
                            </span>
                          ) : null}
                          {expanded && notification.message.length > 90 ? (
                            <span className="mt-1 inline-block text-[11px] font-medium text-blue-normal">
                              Show less
                            </span>
                          ) : null}
                        </div>
                        <time className="shrink-0 text-[10px] text-gray-500">
                          {formatDistanceToNow(new Date(notification.createdAt), {
                            addSuffix: true,
                          })}
                        </time>
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

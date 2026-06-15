'use client';

import { formatDistanceToNow } from 'date-fns';
import { PageHeader } from '@/components/business/PageHeader';
import { MOCK_NOTIFICATIONS } from '@/data/businessMocks';

const typeStyles = {
  transaction: 'bg-purple-50 text-purple-700',
  wallet: 'bg-green-light text-green-normal',
  team: 'bg-blue-light text-blue-normal',
  system: 'bg-gray-normal text-gray',
} as const;

export default function NotificationsPage() {
  const unread = MOCK_NOTIFICATIONS.filter((n) => !n.read).length;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Notifications"
        description={unread > 0 ? `${unread} unread notification${unread === 1 ? '' : 's'}` : 'You are all caught up.'}
      />

      <ul className="space-y-3">
        {MOCK_NOTIFICATIONS.map((notif) => (
          <li
            key={notif.id}
            className={`rounded-xl border p-4 shadow-sm ${
              notif.read ? 'border-gray-200 bg-white' : 'border-blue-200 bg-blue-light/20'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-semibold text-gray-900">{notif.title}</h2>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${typeStyles[notif.type]}`}
                  >
                    {notif.type}
                  </span>
                  {!notif.read && (
                    <span className="h-2 w-2 rounded-full bg-blue-normal" aria-label="Unread" />
                  )}
                </div>
                <p className="mt-1 text-sm text-gray-600">{notif.message}</p>
              </div>
              <time className="shrink-0 text-xs text-gray-500">
                {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
              </time>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

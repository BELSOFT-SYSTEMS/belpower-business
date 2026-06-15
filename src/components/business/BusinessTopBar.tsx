'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Bell, LogOut, Menu } from 'lucide-react';
import { useBusinessAuth } from '@/context/BusinessAuthContext';
import { formatAdminRoleLabel } from '@/utils/businessRoleDisplay';

type BusinessTopBarProps = {
  onMenuClick?: () => void;
};

export function BusinessTopBar({ onMenuClick }: BusinessTopBarProps) {
  const { business, user, logout } = useBusinessAuth();

  return (
    <header className="fixed inset-x-0 top-0 z-40 h-16 border-b border-gray-200 bg-white">
      <div className="flex h-full items-center justify-between gap-4 px-4 md:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 md:hidden"
            onClick={onMenuClick}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          {business && (
            <Image
              src={business.logoUrl ?? '/belsoft-logo-2.jpg'}
              alt={business.businessName}
              width={36}
              height={36}
              className="rounded-lg border border-gray-200 bg-white object-contain p-1"
            />
          )}

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-gray-900">{business?.businessName}</p>
            <p className="truncate text-xs text-gray-500">{business?.businessId}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {user?.branchName && (
            <span className="hidden rounded-full bg-blue-light px-3 py-1 text-xs font-medium text-blue-normal sm:inline">
              {user.branchName}
            </span>
          )}
          {user?.role && (
            <span className="hidden rounded-full bg-gray-normal px-3 py-1 text-xs font-medium text-gray-700 lg:inline">
              {formatAdminRoleLabel(user.role)}
            </span>
          )}

          <Link
            href="/business/notifications"
            className="rounded-lg p-2 text-gray-600 hover:bg-gray-100"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
          </Link>

          <button
            type="button"
            onClick={logout}
            className="rounded-lg p-2 text-gray-600 hover:bg-gray-100"
            aria-label="Sign out"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
}

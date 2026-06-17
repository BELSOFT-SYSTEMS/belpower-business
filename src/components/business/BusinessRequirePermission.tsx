'use client';

import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';
import { useBusinessAuth } from '@/context/BusinessAuthContext';

type BusinessForbiddenProps = {
  permission?: string;
};

export function BusinessForbidden({ permission }: BusinessForbiddenProps) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-16 text-center">
      <div className="mb-4 rounded-full bg-red-50 p-4 text-red-normal">
        <ShieldAlert className="h-8 w-8" aria-hidden />
      </div>
      <h1 className="text-xl font-semibold text-gray-900">Access restricted</h1>
      <p className="mt-2 text-sm text-gray-600">
        Your role does not have permission to view this page
        {permission ? ` (${permission})` : ''}.
      </p>
      <Link
        href="/business"
        className="mt-6 rounded-xl bg-blue-normal px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-normal-hover"
      >
        Back to dashboard
      </Link>
    </div>
  );
}

type BusinessRequirePermissionProps = {
  permission: string;
  children: React.ReactNode;
};

export function BusinessRequirePermission({ permission, children }: BusinessRequirePermissionProps) {
  const { canAccess, isLoading } = useBusinessAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-sm text-gray-500">Loading…</p>
      </div>
    );
  }

  if (!canAccess(permission)) {
    return <BusinessForbidden permission={permission} />;
  }

  return <>{children}</>;
}

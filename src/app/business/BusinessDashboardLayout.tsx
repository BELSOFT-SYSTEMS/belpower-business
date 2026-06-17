'use client';

import { ReactNode, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BusinessSidebar } from '@/components/business/BusinessSidebar';
import { BusinessTopBar } from '@/components/business/BusinessTopBar';
import { useBusinessAuth } from '@/context/BusinessAuthContext';
import { BusinessShellProvider, useBusinessShell } from '@/context/BusinessShellContext';
import { isPublicBusinessRoute, getRequiredPermissionForRoute } from '@/constants/businessNavPermissions';
import { BusinessForbidden } from '@/components/business/BusinessRequirePermission';
import '@/styles/businessShell.css';

type BusinessDashboardLayoutProps = {
  children: ReactNode;
};

function BusinessDashboardContent({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? '';
  const { isAuthenticated, isLoading, canAccess } = useBusinessAuth();
  const { sidebarCollapsed } = useBusinessShell();
  const isPublicRoute = isPublicBusinessRoute(pathname);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (isLoading || isPublicRoute) return;
    if (!isAuthenticated) {
      window.location.href = `/business/sign-in?from=${encodeURIComponent(pathname)}`;
    }
  }, [isLoading, isAuthenticated, isPublicRoute, pathname]);

  if (isPublicRoute) {
    return <>{children}</>;
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-blue-normal" />
          <p className="text-gray-600">Loading business dashboard…</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-normal" aria-hidden />
      </div>
    );
  }

  const requiredPermission = getRequiredPermissionForRoute(pathname);
  if (requiredPermission && !canAccess(requiredPermission)) {
    return (
      <div className="min-h-screen bg-gray-50">
        <BusinessTopBar onMenuClick={() => setMobileNavOpen((v) => !v)} />
        <div className="pt-16">
          <main className="min-h-[calc(100vh-4rem)] p-4 md:p-6">
            <BusinessForbidden permission={requiredPermission} />
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <BusinessTopBar onMenuClick={() => setMobileNavOpen((v) => !v)} />

      {mobileNavOpen && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/30 md:hidden"
          onClick={() => setMobileNavOpen(false)}
          aria-label="Close menu"
        />
      )}

      <div
        className={cn(
          'fixed top-16 left-0 z-40 h-[calc(100vh-4rem)] transition-[width] duration-200 md:z-30',
          mobileNavOpen ? 'block w-64' : 'hidden md:block',
          !mobileNavOpen && (sidebarCollapsed ? 'md:w-[4.5rem]' : 'md:w-64')
        )}
      >
        <BusinessSidebar onNavigate={() => setMobileNavOpen(false)} />
      </div>

      <div
        className={cn(
          'pt-16 transition-[padding] duration-200',
          sidebarCollapsed ? 'md:pl-[4.5rem]' : 'md:pl-64'
        )}
      >
        <main className="min-h-[calc(100vh-4rem)] p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}

export default function BusinessDashboardLayout({ children }: BusinessDashboardLayoutProps) {
  return (
    <BusinessShellProvider>
      <BusinessDashboardContent>{children}</BusinessDashboardContent>
    </BusinessShellProvider>
  );
}

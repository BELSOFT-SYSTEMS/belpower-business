'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { BUSINESS_NAV_ITEMS } from '@/constants/businessNavPermissions';
import { useBusinessAuth } from '@/context/BusinessAuthContext';

export function BusinessSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { canAccess } = useBusinessAuth();

  const visibleItems = BUSINESS_NAV_ITEMS.filter(
    (item) => !item.permission || canAccess(item.permission)
  );

  return (
    <aside className="flex h-full w-64 flex-col border-r border-gray-200 bg-white shadow-xl md:shadow-none">
      <div className="auth-hero-panel sidebar-brand-panel relative overflow-hidden border-b border-gray-200 px-4 py-6">
        <div className="auth-hero-blob1" aria-hidden />
        <div className="auth-hero-blob2" aria-hidden />
        <div className="relative z-10 flex flex-col items-center text-center">
          <Link href="/business" className="inline-flex justify-center" onClick={onNavigate}>
            <Image
              src="/transparent_belpower.png"
              alt="BelPower Business"
              width={180}
              height={48}
              className="h-12 w-auto"
            />
          </Link>
          <p className="mt-3 text-base font-bold tracking-wide text-white">Business Platform</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-3">
        <ul className="space-y-1">
          {visibleItems.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== '/business' && pathname.startsWith(item.href));

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    'block rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    active
                      ? 'bg-blue-normal text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  )}
                >
                  {item.name}
                </Link>
                {item.children && active && (
                  <ul className="ml-3 mt-1 space-y-0.5 border-l border-gray-200 pl-3">
                    {item.children
                      .filter((child) => !child.permission || canAccess(child.permission))
                      .map((child) => (
                        <li key={child.href}>
                          <Link
                            href={child.href}
                            onClick={onNavigate}
                            className={cn(
                              'block rounded-md px-2 py-1.5 text-xs',
                              pathname === child.href
                                ? 'font-semibold text-blue-normal'
                                : 'text-gray-600 hover:text-gray-900'
                            )}
                          >
                            {child.name}
                          </Link>
                        </li>
                      ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}

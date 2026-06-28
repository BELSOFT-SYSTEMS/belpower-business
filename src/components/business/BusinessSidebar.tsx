'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  BarChart3,
  Bell,
  Building2,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  LayoutDashboard,
  Receipt,
  Settings,
  Users,
  Wallet,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { BUSINESS_NAV_ITEMS } from '@/constants/businessNavPermissions';
import { useBusinessAuth } from '@/context/BusinessAuthContext';
import { useBusinessShell } from '@/context/BusinessShellContext';
import '@/styles/businessShell.css';
import type { ReactNode } from 'react';

const NAV_ICONS: Record<string, ReactNode> = {
  '/business': <LayoutDashboard size={18} />,
  '/business/wallet': <Wallet size={18} />,
  '/business/payments/airtime': <CreditCard size={18} />,
  '/business/branches': <Building2 size={18} />,
  '/business/beneficiaries': <Users size={18} />,
  '/business/transactions': <Receipt size={18} />,
  '/business/analytics': <BarChart3 size={18} />,
  '/business/team': <Users size={18} />,
  '/business/notifications': <Bell size={18} />,
  '/business/settings': <Settings size={18} />,
};

export function BusinessSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { canAccess } = useBusinessAuth();
  const { sidebarCollapsed, toggleSidebarCollapsed } = useBusinessShell();

  const visibleItems = BUSINESS_NAV_ITEMS.filter(
    (item) => !item.permission || canAccess(item.permission)
  );

  const collapseLabel = sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar';

  return (
    <div
      className={cn(
        'business_sidebar_shell',
        sidebarCollapsed && 'is_collapsed'
      )}
    >
      <aside className="flex h-full w-full flex-col border-r border-gray-200 bg-white shadow-xl md:shadow-none">
        <div className="auth-hero-panel sidebar-brand-panel business_sidebar_brand_panel relative overflow-hidden border-b border-gray-200 px-4 py-6">
          <div className="auth-hero-blob1" aria-hidden />
          <div className="auth-hero-blob2" aria-hidden />
          <div className="relative z-10 flex flex-col items-center text-center">
            <Link href="/business" className="inline-flex justify-center" onClick={onNavigate}>
              <Image
                src="/transparent_belpower.png"
                alt="BelPower Business"
                width={180}
                height={48}
                className="business_sidebar_brand_logo h-12 w-auto"
              />
            </Link>
            <p className="business_sidebar_brand_text mt-3 text-base font-bold tracking-wide text-white">
              Business Platform
            </p>
          </div>
        </div>

        <nav className="business_sidebar_nav">
          <ul className="space-y-1">
            {visibleItems.map((item) => {
              const active =
                pathname === item.href ||
                (item.href !== '/business' && pathname.startsWith(item.href));

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    title={sidebarCollapsed ? item.name : undefined}
                    onClick={onNavigate}
                    className={cn(
                      'business_sidebar_nav_link rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                      active
                        ? 'bg-blue-normal text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    )}
                  >
                    <span className="business_sidebar_nav_icon">
                      {NAV_ICONS[item.href] ?? <LayoutDashboard size={18} />}
                    </span>
                    <span className="business_sidebar_nav_label">{item.name}</span>
                  </Link>
                  {item.children && active && (
                    <ul className="business_sidebar_children ml-3 mt-1 space-y-0.5 border-l border-gray-200 pl-3">
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

      <button
        type="button"
        className="business_sidebar_edge_toggle"
        onClick={toggleSidebarCollapsed}
        aria-label={collapseLabel}
        title={collapseLabel}
      >
        {sidebarCollapsed ? (
          <ChevronRight size={14} aria-hidden />
        ) : (
          <ChevronLeft size={14} aria-hidden />
        )}
      </button>
    </div>
  );
}

'use client';

import Image from 'next/image';
import { ChevronDown, Lock, Trash2, Users } from 'lucide-react';
import {
  BusinessActionsMenu,
  BusinessActionsMenuItem,
} from '@/components/business/BusinessActionsMenu';
import { secondaryButtonClass } from '@/components/business/payments/paymentShared';
import { getProviderLogo, getProviderName } from '@/data/mockPaymentCatalog';
import type { BeneficiaryGroup } from '@/types/business';
import { cn } from '@/lib/utils';

export function BeneficiaryGroupCard({
  group,
  highlighted = false,
  expanded,
  canManage,
  canBulk,
  menuOpen,
  onToggleExpand,
  onOpenChange,
  onDelete,
  onSetPrimary,
}: {
  group: BeneficiaryGroup;
  highlighted?: boolean;
  expanded: boolean;
  canManage: boolean;
  canBulk: boolean;
  menuOpen: boolean;
  onToggleExpand: () => void;
  onOpenChange: (open: boolean) => void;
  onDelete: () => void;
  onSetPrimary: () => void;
}) {
  const networks = Array.from(new Set(group.members.map((member) => member.provider)));

  return (
    <article
      className={cn(
        'relative rounded-xl border bg-white p-4 shadow-sm',
        highlighted ? 'border-blue-normal bg-blue-50/40' : 'border-gray-200',
      )}
    >
      <div className="flex gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-normal ring-1 ring-blue-100">
          <Users className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="truncate font-semibold text-gray-900">{group.name}</h3>
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-600">
                  Group
                </span>
                {group.isPrimary ? (
                  <span className="rounded-full bg-blue-normal px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                    Primary
                  </span>
                ) : null}
              </div>
              <p className="mt-1 text-sm text-gray-600">
                {group.members.length} number{group.members.length === 1 ? '' : 's'}
                {networks.length > 0
                  ? ` · ${networks.map((id) => getProviderName('airtime', id)).join(', ')}`
                  : ''}
              </p>
              <p className="mt-1 text-xs text-gray-500">{group.branchName}</p>
            </div>

            {canManage ? (
              <BusinessActionsMenu
                label={`${group.name} options`}
                open={menuOpen}
                onOpenChange={onOpenChange}
                menuClassName="w-44"
              >
                {!group.isPrimary ? (
                  <BusinessActionsMenuItem onClick={onSetPrimary}>
                    Set as primary
                  </BusinessActionsMenuItem>
                ) : null}
                <BusinessActionsMenuItem destructive onClick={onDelete}>
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete group
                </BusinessActionsMenuItem>
              </BusinessActionsMenu>
            ) : null}
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onToggleExpand}
              className={`${secondaryButtonClass} !px-3 !py-2`}
            >
              <ChevronDown className={cn('h-4 w-4 transition', expanded && 'rotate-180')} />
              {expanded ? 'Hide numbers' : 'Show numbers'}
            </button>
            {canBulk ? (
              <>
                <button
                  type="button"
                  disabled
                  title="Coming soon"
                  className={`${secondaryButtonClass} !px-3 !py-2 cursor-not-allowed opacity-60`}
                >
                  <Lock className="h-3.5 w-3.5" aria-hidden />
                  Bulk airtime
                </button>
                <button
                  type="button"
                  disabled
                  title="Coming soon"
                  className={`${secondaryButtonClass} !px-3 !py-2 cursor-not-allowed opacity-60`}
                >
                  <Lock className="h-3.5 w-3.5" aria-hidden />
                  Bulk data
                </button>
              </>
            ) : null}
          </div>

          {expanded ? (
            <ul className="mt-3 space-y-2 rounded-xl border border-gray-100 bg-gray-50 p-3">
              {group.members.map((member) => (
                <li key={member.id} className="flex items-center gap-3 text-sm">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white ring-1 ring-gray-200">
                    <Image
                      src={getProviderLogo('airtime', member.provider)}
                      alt=""
                      width={20}
                      height={20}
                      className="h-5 w-5 object-contain"
                    />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-gray-900">
                      {member.label || getProviderName('airtime', member.provider)}
                    </p>
                    <p className="font-mono text-xs text-gray-600">{member.accountNumber}</p>
                  </div>
                  <span className="text-xs capitalize text-gray-500">
                    {getProviderName('airtime', member.provider)}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </article>
  );
}

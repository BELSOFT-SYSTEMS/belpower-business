'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, MoreVertical, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { EmptyState } from '@/components/business/EmptyState';
import { PageHeader } from '@/components/business/PageHeader';
import { ElectricityDiscoSelector } from '@/components/business/payments/ElectricityDiscoSelector';
import {
  beneficiaryPayPath,
  fieldClass,
  primaryButtonClass,
  ProviderTiles,
  secondaryButtonClass,
} from '@/components/business/payments/paymentShared';
import { BusinessSelect } from '@/components/business/BusinessSelect';
import { useBusinessAuth } from '@/context/BusinessAuthContext';
import {
  AIRTIME_NETWORKS,
  CABLE_PROVIDERS,
  ELECTRICITY_DISCOS,
  getProviderLogo,
  getProviderName,
  isValidNigerianPhone,
  mockLookupMeter,
  mockLookupSmartcard,
  normalizePhone,
  resolveDiscoCode,
  type CableProviderId,
  type MeterType,
} from '@/data/mockPaymentCatalog';
import {
  BeneficiaryGroupCard,
} from '@/components/business/beneficiaries/BeneficiaryGroupCard';
import {
  getMockBeneficiariesForRole,
  getMockBeneficiaryGroupsForRole,
  getMockBranchesForRole,
} from '@/data/businessMocks';
import type { BeneficiaryGroup, BeneficiaryGroupMember, BusinessBeneficiary } from '@/types/business';
import { cn } from '@/lib/utils';

const METER_VERIFY_MIN_DIGITS = 10;

type BeneficiaryService = BusinessBeneficiary['service'];
type AddMode = 'single' | 'group';
type PhoneSubTab = 'groups' | 'singles';

type DraftGroupMember = {
  id: string;
  label: string;
  provider: string;
  phone: string;
};

function supportsGroups(service: BeneficiaryService): service is 'phone' {
  return service === 'phone';
}

function newDraftMember(provider = 'mtn'): DraftGroupMember {
  return {
    id: `draft-${Math.random().toString(36).slice(2, 9)}`,
    label: '',
    provider,
    phone: '',
  };
}

const SERVICE_TABS: {
  id: BeneficiaryService;
  label: string;
  singular: string;
  primaryTitle: string;
  savedTitle: string;
  emptyTitle: string;
  emptyDescription: string;
}[] = [
  {
    id: 'electricity',
    label: 'Electricity',
    singular: 'meter',
    primaryTitle: 'Primary meter',
    savedTitle: 'Saved meters',
    emptyTitle: 'No saved meters yet',
    emptyDescription: 'Add a meter to access it quickly when buying electricity.',
  },
  {
    id: 'phone',
    label: 'Phone Numbers',
    singular: 'number',
    primaryTitle: 'Primary number',
    savedTitle: 'Saved numbers',
    emptyTitle: 'No saved numbers or groups yet',
    emptyDescription: 'Save phone lines once and use them for airtime or data — including bulk groups.',
  },
  {
    id: 'cable',
    label: 'Cable TV',
    singular: 'smartcard',
    primaryTitle: 'Primary smartcard',
    savedTitle: 'Saved smartcards',
    emptyTitle: 'No saved smartcards yet',
    emptyDescription: 'Save DStv, GOtv, and other decoder accounts for renewals.',
  },
];

export default function BeneficiariesPage() {
  const { user, demoRole, canAccess } = useBusinessAuth();
  const role = user?.role ?? demoRole;
  const branches = getMockBranchesForRole(role);

  const [service, setService] = useState<BeneficiaryService>('electricity');
  const [items, setItems] = useState(() => getMockBeneficiariesForRole(role));
  const [groups, setGroups] = useState(() => getMockBeneficiaryGroupsForRole(role));
  const [isAdding, setIsAdding] = useState(false);
  const [addMode, setAddMode] = useState<AddMode>('single');
  const [phoneSubTab, setPhoneSubTab] = useState<PhoneSubTab>('groups');
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [groupMenuOpenId, setGroupMenuOpenId] = useState<string | null>(null);
  const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null);
  const [groupMembers, setGroupMembers] = useState<DraftGroupMember[]>(() => [
    newDraftMember(),
    newDraftMember('airtel'),
  ]);

  const [title, setTitle] = useState('');
  const [disco, setDisco] = useState(ELECTRICITY_DISCOS[0]?.id ?? 'ABUJA');
  const [meterType, setMeterType] = useState<MeterType>('prepaid');
  const [meterNumber, setMeterNumber] = useState('');
  const [network, setNetwork] = useState(AIRTIME_NETWORKS[0]?.id ?? 'mtn');
  const [phone, setPhone] = useState('');
  const [cableProvider, setCableProvider] = useState<CableProviderId>('dstv');
  const [smartCard, setSmartCard] = useState('');
  const [branchName, setBranchName] = useState(branches[0]?.name ?? '');
  const [lookupName, setLookupName] = useState('');
  const [lookupAddress, setLookupAddress] = useState('');
  const [lookingUp, setLookingUp] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const verifyRequestRef = useRef(0);
  const addFormRef = useRef<HTMLFormElement | null>(null);

  const tab = SERVICE_TABS.find((item) => item.id === service) ?? SERVICE_TABS[0];
  const serviceItems = useMemo(() => {
    if (service === 'phone') {
      return items.filter(
        (item) => item.service === 'phone' || item.service === 'airtime' || item.service === 'data',
      );
    }
    return items.filter((item) => item.service === service);
  }, [items, service]);
  const serviceGroups = useMemo(
    () => (supportsGroups(service) ? groups.filter((group) => group.service === 'phone') : []),
    [groups, service],
  );
  const primaryItem = serviceItems.find((item) => item.isPrimary) ?? serviceItems[0] ?? null;
  const savedItems = serviceItems.filter((item) => item.id !== primaryItem?.id);
  const primaryGroup = serviceGroups.find((group) => group.isPrimary) ?? null;
  const savedGroups = serviceGroups.filter((group) => group.id !== primaryGroup?.id);
  const hasAnyForService =
    service === 'phone'
      ? phoneSubTab === 'groups'
        ? serviceGroups.length > 0
        : serviceItems.length > 0
      : serviceItems.length > 0 || serviceGroups.length > 0;

  const discoOptions = useMemo(
    () => ELECTRICITY_DISCOS.map((item) => ({ code: item.id, name: item.name, available: true })),
    [],
  );

  const startAdding = (mode?: AddMode) => {
    const nextMode =
      mode ??
      (supportsGroups(service) && phoneSubTab === 'groups' ? 'group' : 'single');
    resetAddForm();
    setAddMode(supportsGroups(service) ? nextMode : 'single');
    setIsAdding(true);
  };

  useEffect(() => {
    setItems(getMockBeneficiariesForRole(role));
    setGroups(getMockBeneficiaryGroupsForRole(role));
  }, [role]);

  useEffect(() => {
    setIsAdding(false);
    setMenuOpenId(null);
    setGroupMenuOpenId(null);
    setExpandedGroupId(null);
    resetAddForm(service);
    setAddMode(supportsGroups(service) && phoneSubTab === 'groups' ? 'group' : 'single');
    if (service !== 'phone') {
      setPhoneSubTab('groups');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset when switching tabs only
  }, [service]);

  useEffect(() => {
    if (service !== 'phone') return;
    setIsAdding(false);
    setMenuOpenId(null);
    setGroupMenuOpenId(null);
    setAddMode(phoneSubTab === 'groups' ? 'group' : 'single');
  }, [phoneSubTab, service]);

  useEffect(() => {
    if (!isAdding) return;
    const frame = window.requestAnimationFrame(() => {
      addFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [isAdding]);

  useEffect(() => {
    if (!isAdding || service !== 'electricity') {
      setLookingUp(false);
      return;
    }

    const digits = meterNumber.replace(/\D/g, '');
    if (digits.length < METER_VERIFY_MIN_DIGITS || !disco) {
      setLookingUp(false);
      return;
    }

    const requestId = ++verifyRequestRef.current;
    setLookingUp(true);
    setVerifyError(null);
    setLookupName('');
    setLookupAddress('');

    void (async () => {
      try {
        const next = await mockLookupMeter(digits, disco, meterType);
        if (requestId !== verifyRequestRef.current) return;
        setLookupName(next.customerName);
        setLookupAddress(next.address);
        setVerifyError(null);
      } catch (error) {
        if (requestId !== verifyRequestRef.current) return;
        setLookupName('');
        setLookupAddress('');
        setVerifyError(error instanceof Error ? error.message : 'Could not verify meter');
      } finally {
        if (requestId === verifyRequestRef.current) setLookingUp(false);
      }
    })();
  }, [disco, isAdding, meterNumber, meterType, service]);

  function resetAddForm(nextService: BeneficiaryService = service) {
    setTitle('');
    setDisco(ELECTRICITY_DISCOS[0]?.id ?? 'ABUJA');
    setMeterType('prepaid');
    setMeterNumber('');
    setNetwork(AIRTIME_NETWORKS[0]?.id ?? 'mtn');
    setPhone('');
    setCableProvider('dstv');
    setSmartCard('');
    setBranchName(branches[0]?.name ?? '');
    setLookupName('');
    setLookupAddress('');
    setVerifyError(null);
    setLookingUp(false);
    setGroupMembers([newDraftMember(), newDraftMember('airtel')]);
    void nextService;
  }

  async function handleVerifySmartcard() {
    setLookingUp(true);
    setVerifyError(null);
    try {
      const next = await mockLookupSmartcard(smartCard, cableProvider);
      setLookupName(next.customerName);
      setLookupAddress('');
      toast.success('Smartcard verified');
    } catch (error) {
      setLookupName('');
      setVerifyError(error instanceof Error ? error.message : 'Could not verify smartcard');
      toast.error(error instanceof Error ? error.message : 'Could not verify smartcard');
    } finally {
      setLookingUp(false);
    }
  }

  const handleSave = (event: React.FormEvent) => {
    event.preventDefault();
    const branch = branchName || branches[0]?.name || 'Head Office';

    if (supportsGroups(service) && addMode === 'group') {
      if (!title.trim()) {
        toast.error('Enter a group name');
        return;
      }
      const members: BeneficiaryGroupMember[] = [];
      for (const draft of groupMembers) {
        if (!draft.phone.trim()) continue;
        if (!isValidNigerianPhone(draft.phone)) {
          toast.error(`Invalid phone number: ${draft.phone || '(empty)'}`);
          return;
        }
        members.push({
          id: `mem-${Date.now()}-${members.length}`,
          label: draft.label.trim() || undefined,
          provider: draft.provider,
          accountNumber: normalizePhone(draft.phone),
          verified: true,
        });
      }
      if (members.length < 2) {
        toast.error('A group needs at least 2 phone numbers');
        return;
      }

      const nextGroup: BeneficiaryGroup = {
        id: `grp-${Date.now()}`,
        name: title.trim(),
        service: 'phone',
        branchName: branch,
        createdAt: new Date().toISOString(),
        members,
        isPrimary: serviceGroups.length === 0,
      };
      setGroups((current) => [...current, nextGroup]);
      setIsAdding(false);
      resetAddForm();
      toast.success('Group saved (demo)');
      return;
    }

    if (!title.trim()) {
      toast.error(`Enter a nickname for this ${tab.singular}`);
      return;
    }

    let next: BusinessBeneficiary | null = null;

    if (service === 'electricity') {
      const digits = meterNumber.replace(/\D/g, '');
      if (digits.length < 11) {
        toast.error('Enter a valid meter number (at least 11 digits)');
        return;
      }
      if (!lookupName || lookingUp) {
        toast.error('Verify the meter before saving');
        return;
      }
      next = {
        id: `ben-${Date.now()}`,
        label: title.trim(),
        service: 'electricity',
        provider: resolveDiscoCode(disco),
        accountNumber: digits,
        branchName: branch,
        createdAt: new Date().toISOString(),
        meterType,
        customerName: lookupName,
        address: lookupAddress,
        verified: true,
        isPrimary: serviceItems.length === 0,
      };
    } else if (service === 'phone') {
      if (!isValidNigerianPhone(phone)) {
        toast.error('Enter a valid Nigerian phone number');
        return;
      }
      next = {
        id: `ben-${Date.now()}`,
        label: title.trim(),
        service: 'phone',
        provider: network,
        accountNumber: normalizePhone(phone),
        branchName: branch,
        createdAt: new Date().toISOString(),
        verified: true,
        isPrimary: serviceItems.length === 0,
      };
    } else {
      const digits = smartCard.replace(/\D/g, '');
      if (digits.length < 10) {
        toast.error('Enter a valid smartcard / IUC number');
        return;
      }
      if (!lookupName || lookingUp) {
        toast.error('Verify the smartcard before saving');
        return;
      }
      next = {
        id: `ben-${Date.now()}`,
        label: title.trim(),
        service: 'cable',
        provider: cableProvider,
        accountNumber: digits,
        branchName: branch,
        createdAt: new Date().toISOString(),
        customerName: lookupName,
        verified: true,
        isPrimary: serviceItems.length === 0,
      };
    }

    setItems((current) => [...current, next!]);
    setIsAdding(false);
    resetAddForm();
    toast.success(`${tab.singular[0].toUpperCase()}${tab.singular.slice(1)} saved (demo)`);
  };

  const handleDelete = (id: string) => {
    setItems((current) => {
      const target = current.find((item) => item.id === id);
      const remaining = current.filter((item) => item.id !== id);
      if (!target) return remaining;
      const sameService = remaining.filter((item) => item.service === target.service);
      if (!sameService.some((item) => item.isPrimary) && sameService[0]) {
        return remaining.map((item) =>
          item.id === sameService[0].id ? { ...item, isPrimary: true } : item,
        );
      }
      return remaining;
    });
    setMenuOpenId(null);
    toast.success(`${tab.singular[0].toUpperCase()}${tab.singular.slice(1)} removed (demo)`);
  };

  const handleSetPrimary = (id: string) => {
    setItems((current) => {
      const target = current.find((item) => item.id === id);
      if (!target) return current;
      return current.map((item) =>
        item.service !== target.service
          ? item
          : {
              ...item,
              isPrimary: item.id === id,
            },
      );
    });
    setMenuOpenId(null);
    toast.success(`Primary ${tab.singular} updated (demo)`);
  };

  const handleDeleteGroup = (id: string) => {
    setGroups((current) => {
      const target = current.find((group) => group.id === id);
      const remaining = current.filter((group) => group.id !== id);
      if (!target) return remaining;
      const sameService = remaining.filter((group) => group.service === target.service);
      if (!sameService.some((group) => group.isPrimary) && sameService[0]) {
        return remaining.map((group) =>
          group.id === sameService[0].id ? { ...group, isPrimary: true } : group,
        );
      }
      return remaining;
    });
    setGroupMenuOpenId(null);
    toast.success('Group removed (demo)');
  };

  const handleSetPrimaryGroup = (id: string) => {
    setGroups((current) => {
      const target = current.find((group) => group.id === id);
      if (!target) return current;
      return current.map((group) =>
        group.service !== target.service
          ? group
          : { ...group, isPrimary: group.id === id },
      );
    });
    setGroupMenuOpenId(null);
    toast.success('Primary group updated (demo)');
  };

  const canManage = canAccess('beneficiaries.manage');
  const canPay = canAccess('payments.single');
  const canBulk = canAccess('payments.bulk');

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          title="Beneficiaries"
          description="Saved meters, phone numbers, smartcards, and number groups for faster and bulk payments."
        />
        {canManage && !isAdding ? (
          <button type="button" onClick={() => startAdding()} className={primaryButtonClass}>
            <Plus className="h-4 w-4" />
            Add
          </button>
        ) : null}
      </div>

      <div className="flex gap-1 overflow-x-auto rounded-xl border border-gray-200 bg-white p-1 shadow-sm">
        {SERVICE_TABS.map((item) => {
          const active = item.id === service;
          const singleCount =
            item.id === 'phone'
              ? items.filter(
                  (beneficiary) =>
                    beneficiary.service === 'phone' ||
                    beneficiary.service === 'airtime' ||
                    beneficiary.service === 'data',
                ).length
              : items.filter((beneficiary) => beneficiary.service === item.id).length;
          const groupCount = supportsGroups(item.id)
            ? groups.filter((group) => group.service === 'phone').length
            : 0;
          const count = singleCount + groupCount;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setService(item.id)}
              className={cn(
                'flex-1 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition',
                active
                  ? 'bg-blue-normal text-white'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
              )}
            >
              {item.label}
              <span className={cn('ml-1.5 text-xs', active ? 'text-white/80' : 'text-gray-400')}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {service === 'phone' ? (
        <div className="flex gap-1 rounded-xl border border-gray-200 bg-gray-50 p-1">
          {(
            [
              { id: 'groups' as const, label: 'Number groups', count: serviceGroups.length },
              { id: 'singles' as const, label: 'Single numbers', count: serviceItems.length },
            ] as const
          ).map((sub) => {
            const active = phoneSubTab === sub.id;
            return (
              <button
                key={sub.id}
                type="button"
                onClick={() => setPhoneSubTab(sub.id)}
                className={cn(
                  'flex-1 rounded-lg px-3 py-2 text-sm font-medium transition',
                  active
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900',
                )}
              >
                {sub.label}
                <span className={cn('ml-1.5 text-xs', active ? 'text-gray-500' : 'text-gray-400')}>
                  {sub.count}
                </span>
              </button>
            );
          })}
        </div>
      ) : null}

      {!hasAnyForService && !isAdding ? (
        <EmptyState
          title={
            service === 'phone'
              ? phoneSubTab === 'groups'
                ? 'No number groups yet'
                : 'No single numbers yet'
              : tab.emptyTitle
          }
          description={
            service === 'phone'
              ? phoneSubTab === 'groups'
                ? 'Create a named group of phones for bulk airtime or data.'
                : 'Save a phone line once and use it for airtime or data.'
              : tab.emptyDescription
          }
          action={
            canManage ? (
              <button type="button" onClick={() => startAdding()} className={primaryButtonClass}>
                <Plus className="h-4 w-4" />
                Add
              </button>
            ) : undefined
          }
        />
      ) : null}

      {service === 'phone' && phoneSubTab === 'groups' && (primaryGroup || savedGroups.length > 0) ? (
        <section className="space-y-3">
          <div className="space-y-3">
            {primaryGroup ? (
              <BeneficiaryGroupCard
                group={primaryGroup}
                highlighted
                expanded={expandedGroupId === primaryGroup.id}
                canManage={canManage}
                canBulk={canBulk}
                menuOpen={groupMenuOpenId === primaryGroup.id}
                onToggleExpand={() =>
                  setExpandedGroupId((current) =>
                    current === primaryGroup.id ? null : primaryGroup.id,
                  )
                }
                onToggleMenu={() =>
                  setGroupMenuOpenId((current) =>
                    current === primaryGroup.id ? null : primaryGroup.id,
                  )
                }
                onDelete={() => handleDeleteGroup(primaryGroup.id)}
                onSetPrimary={() => handleSetPrimaryGroup(primaryGroup.id)}
              />
            ) : null}
            {savedGroups.map((group) => (
              <BeneficiaryGroupCard
                key={group.id}
                group={group}
                expanded={expandedGroupId === group.id}
                canManage={canManage}
                canBulk={canBulk}
                menuOpen={groupMenuOpenId === group.id}
                onToggleExpand={() =>
                  setExpandedGroupId((current) => (current === group.id ? null : group.id))
                }
                onToggleMenu={() =>
                  setGroupMenuOpenId((current) => (current === group.id ? null : group.id))
                }
                onDelete={() => handleDeleteGroup(group.id)}
                onSetPrimary={() => handleSetPrimaryGroup(group.id)}
              />
            ))}
          </div>
        </section>
      ) : null}

      {service !== 'phone' && primaryItem ? (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
            {tab.primaryTitle}
          </h2>
          <BeneficiaryCard
            item={primaryItem}
            highlighted
            singular={tab.singular}
            canPay={canPay}
            canManage={canManage}
            menuOpen={menuOpenId === primaryItem.id}
            onToggleMenu={() =>
              setMenuOpenId((current) => (current === primaryItem.id ? null : primaryItem.id))
            }
            onDelete={() => handleDelete(primaryItem.id)}
            onSetPrimary={() => handleSetPrimary(primaryItem.id)}
          />
        </section>
      ) : null}

      {service === 'phone' && phoneSubTab === 'singles' && primaryItem ? (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
            {tab.primaryTitle}
          </h2>
          <BeneficiaryCard
            item={primaryItem}
            highlighted
            singular={tab.singular}
            canPay={canPay}
            canManage={canManage}
            menuOpen={menuOpenId === primaryItem.id}
            onToggleMenu={() =>
              setMenuOpenId((current) => (current === primaryItem.id ? null : primaryItem.id))
            }
            onDelete={() => handleDelete(primaryItem.id)}
            onSetPrimary={() => handleSetPrimary(primaryItem.id)}
          />
        </section>
      ) : null}

      {service !== 'phone' && savedItems.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
            {tab.savedTitle}
          </h2>
          <div className="space-y-3">
            {savedItems.map((item) => (
              <BeneficiaryCard
                key={item.id}
                item={item}
                singular={tab.singular}
                canPay={canPay}
                canManage={canManage}
                menuOpen={menuOpenId === item.id}
                onToggleMenu={() =>
                  setMenuOpenId((current) => (current === item.id ? null : item.id))
                }
                onDelete={() => handleDelete(item.id)}
                onSetPrimary={() => handleSetPrimary(item.id)}
              />
            ))}
          </div>
        </section>
      ) : null}

      {service === 'phone' && phoneSubTab === 'singles' && savedItems.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
            {tab.savedTitle}
          </h2>
          <div className="space-y-3">
            {savedItems.map((item) => (
              <BeneficiaryCard
                key={item.id}
                item={item}
                singular={tab.singular}
                canPay={canPay}
                canManage={canManage}
                menuOpen={menuOpenId === item.id}
                onToggleMenu={() =>
                  setMenuOpenId((current) => (current === item.id ? null : item.id))
                }
                onDelete={() => handleDelete(item.id)}
                onSetPrimary={() => handleSetPrimary(item.id)}
              />
            ))}
          </div>
        </section>
      ) : null}

      {canManage && !isAdding && hasAnyForService ? (
        service === 'phone' ? (
          <button
            type="button"
            onClick={() => startAdding(phoneSubTab === 'groups' ? 'group' : 'single')}
            className="flex w-full items-center gap-3 rounded-xl border border-dashed border-blue-200 bg-white px-4 py-4 text-sm font-semibold text-blue-normal hover:border-blue-normal hover:bg-blue-50/40"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-normal">
              <Plus className="h-4 w-4" />
            </span>
            {phoneSubTab === 'groups' ? 'Add group' : 'Add single number'}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => startAdding('single')}
            className="flex w-full items-center gap-3 rounded-xl border border-dashed border-blue-200 bg-white px-4 py-4 text-sm font-semibold text-blue-normal hover:border-blue-normal hover:bg-blue-50/40"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-normal">
              <Plus className="h-4 w-4" />
            </span>
            Add
          </button>
        )
      ) : null}

      {isAdding ? (
        <form
          ref={addFormRef}
          onSubmit={handleSave}
          className="scroll-mt-6 space-y-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
        >
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-gray-900">
              {supportsGroups(service) && addMode === 'group'
                ? 'Add number group'
                : service === 'electricity'
                  ? 'Add meter'
                  : service === 'cable'
                    ? 'Add smartcard'
                    : 'Add number'}
            </h2>
            <button
              type="button"
              onClick={() => {
                setIsAdding(false);
                resetAddForm();
              }}
              className="text-sm font-medium text-gray-500 hover:text-gray-800"
            >
              Cancel
            </button>
          </div>

          <div>
            <label htmlFor="beneficiary-title" className="block text-sm font-medium text-gray-700">
              {supportsGroups(service) && addMode === 'group' ? 'Group name' : 'Nickname'}
            </label>
            <input
              id="beneficiary-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder={
                supportsGroups(service) && addMode === 'group'
                  ? 'e.g. Staff'
                  : service === 'electricity'
                    ? 'e.g. HQ prepaid meter'
                    : service === 'cable'
                      ? 'e.g. HQ conference TV'
                      : 'e.g. HQ office line'
              }
              className={fieldClass}
            />
          </div>

          {supportsGroups(service) && addMode === 'group' ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-gray-700">Group numbers</p>
                <button
                  type="button"
                  onClick={() => setGroupMembers((current) => [...current, newDraftMember()])}
                  className="text-sm font-medium text-blue-normal hover:underline"
                >
                  + Add number
                </button>
              </div>
              {groupMembers.map((member, index) => (
                <div
                  key={member.id}
                  className="space-y-3 rounded-xl border border-gray-200 bg-gray-50 p-4"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Number {index + 1}
                    </p>
                    {groupMembers.length > 2 ? (
                      <button
                        type="button"
                        onClick={() =>
                          setGroupMembers((current) =>
                            current.filter((item) => item.id !== member.id),
                          )
                        }
                        className="text-xs font-medium text-red-600 hover:underline"
                      >
                        Remove
                      </button>
                    ) : null}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Nickname (optional)
                    </label>
                    <input
                      value={member.label}
                      onChange={(event) =>
                        setGroupMembers((current) =>
                          current.map((item) =>
                            item.id === member.id
                              ? { ...item, label: event.target.value }
                              : item,
                          ),
                        )
                      }
                      placeholder="e.g. Ops lead"
                      className={fieldClass}
                    />
                  </div>
                  <div>
                    <p className="block text-sm font-medium text-gray-700">Network</p>
                    <ProviderTiles
                      options={AIRTIME_NETWORKS}
                      value={member.provider}
                      onChange={(provider) =>
                        setGroupMembers((current) =>
                          current.map((item) =>
                            item.id === member.id ? { ...item, provider } : item,
                          ),
                        )
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Phone number</label>
                    <input
                      inputMode="tel"
                      value={member.phone}
                      onChange={(event) =>
                        setGroupMembers((current) =>
                          current.map((item) =>
                            item.id === member.id
                              ? { ...item, phone: event.target.value }
                              : item,
                          ),
                        )
                      }
                      placeholder="0803 123 4567"
                      className={fieldClass}
                    />
                  </div>
                </div>
              ))}
              <p className="text-xs text-gray-500">
                Groups need at least 2 numbers and can be selected later in bulk payments.
              </p>
            </div>
          ) : null}

          {!(supportsGroups(service) && addMode === 'group') && service === 'electricity' ? (
            <>
              <ElectricityDiscoSelector
                discos={discoOptions}
                selectedCode={disco}
                onSelect={(code) => {
                  setDisco(code);
                  setLookupName('');
                  setLookupAddress('');
                  setVerifyError(null);
                }}
              />

              <div>
                <p className="block text-sm font-medium text-gray-700">Meter type</p>
                <div className="mt-1.5 grid grid-cols-2 gap-2">
                  {(['prepaid', 'postpaid'] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => {
                        setMeterType(type);
                        setLookupName('');
                        setLookupAddress('');
                        setVerifyError(null);
                      }}
                      className={cn(
                        'rounded-xl border px-4 py-2.5 text-sm font-medium capitalize',
                        meterType === type
                          ? 'border-blue-normal bg-blue-50 text-gray-900'
                          : 'border-gray-200 text-gray-700 hover:bg-gray-50',
                      )}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="add-meter-number" className="block text-sm font-medium text-gray-700">
                  Meter number
                </label>
                <div className="relative mt-1.5">
                  <input
                    id="add-meter-number"
                    inputMode="numeric"
                    value={meterNumber}
                    onChange={(event) => setMeterNumber(event.target.value.replace(/[^\d]/g, ''))}
                    placeholder="45022530096"
                    className={cn(
                      fieldClass.replace('mt-1.5 ', ''),
                      lookupName && 'border-green-500 focus:border-green-500 focus:ring-green-500/20',
                    )}
                  />
                  <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs font-medium">
                    {lookingUp ? (
                      <span className="text-gray-500">Verifying…</span>
                    ) : lookupName ? (
                      <span className="text-green-600">✓ Verified</span>
                    ) : null}
                  </span>
                </div>
                {verifyError ? <p className="mt-2 text-xs text-red-600">{verifyError}</p> : null}
              </div>

              {lookupName ? (
                <div className="space-y-3 rounded-xl border border-green-200 bg-green-50 p-4">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-green-700">
                      Customer name
                    </p>
                    <p className="mt-1 text-sm font-semibold text-gray-900">{lookupName}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-green-700">Address</p>
                    <p className="mt-1 text-sm text-gray-700">{lookupAddress}</p>
                  </div>
                </div>
              ) : null}
            </>
          ) : null}

          {!(supportsGroups(service) && addMode === 'group') && service === 'phone' ? (
            <>
              <div>
                <p className="block text-sm font-medium text-gray-700">Network</p>
                <ProviderTiles options={AIRTIME_NETWORKS} value={network} onChange={setNetwork} />
              </div>
              <div>
                <label htmlFor="add-phone" className="block text-sm font-medium text-gray-700">
                  Phone number
                </label>
                <input
                  id="add-phone"
                  inputMode="tel"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="0803 123 4567"
                  className={fieldClass}
                />
              </div>
            </>
          ) : null}

          {!(supportsGroups(service) && addMode === 'group') && service === 'cable' ? (
            <>
              <div>
                <p className="block text-sm font-medium text-gray-700">Provider</p>
                <ProviderTiles
                  options={CABLE_PROVIDERS}
                  value={cableProvider}
                  onChange={(id) => {
                    setCableProvider(id as CableProviderId);
                    setLookupName('');
                    setVerifyError(null);
                  }}
                />
              </div>
              <div>
                <label htmlFor="add-smartcard" className="block text-sm font-medium text-gray-700">
                  Smartcard / IUC
                </label>
                <div className="mt-1.5 flex gap-2">
                  <input
                    id="add-smartcard"
                    inputMode="numeric"
                    value={smartCard}
                    onChange={(event) => {
                      setSmartCard(event.target.value.replace(/[^\d]/g, ''));
                      setLookupName('');
                      setVerifyError(null);
                    }}
                    placeholder="7012345678"
                    className={cn(
                      fieldClass.replace('mt-1.5 ', ''),
                      lookupName && 'border-green-500 focus:border-green-500 focus:ring-green-500/20',
                    )}
                  />
                  <button
                    type="button"
                    onClick={handleVerifySmartcard}
                    disabled={lookingUp || smartCard.trim().length < 10}
                    className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-800 hover:bg-gray-50 disabled:opacity-50"
                  >
                    {lookingUp ? 'Checking…' : 'Verify'}
                  </button>
                </div>
                {verifyError ? <p className="mt-2 text-xs text-red-600">{verifyError}</p> : null}
              </div>
              {lookupName ? (
                <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-gray-800">
                  <p className="font-semibold">{lookupName}</p>
                </div>
              ) : null}
            </>
          ) : null}

          {branches.length > 1 ? (
            <div>
              <label htmlFor="beneficiary-branch" className="block text-sm font-medium text-gray-700">
                Branch
              </label>
              <BusinessSelect
                id="beneficiary-branch"
                value={branchName}
                onChange={setBranchName}
                className="mt-1.5"
                searchable={branches.length > 5}
                searchPlaceholder="Search branch…"
                placeholder="Select branch"
                aria-label="Branch"
                options={branches.map((branch) => ({
                  value: branch.name,
                  label: branch.name,
                }))}
              />
            </div>
          ) : null}

          <button
            type="submit"
            disabled={
              lookingUp ||
              (addMode === 'single' && service === 'electricity' && !lookupName) ||
              (addMode === 'single' && service === 'cable' && !lookupName)
            }
            className={primaryButtonClass}
          >
            {supportsGroups(service) && addMode === 'group' ? 'Save group' : `Save ${tab.singular}`}
          </button>
        </form>
      ) : null}
    </div>
  );
}

function BeneficiaryCard({
  item,
  highlighted = false,
  singular,
  canPay,
  canManage,
  menuOpen,
  onToggleMenu,
  onDelete,
  onSetPrimary,
}: {
  item: BusinessBeneficiary;
  highlighted?: boolean;
  singular: string;
  canPay: boolean;
  canManage: boolean;
  menuOpen: boolean;
  onToggleMenu: () => void;
  onDelete: () => void;
  onSetPrimary: () => void;
}) {
  const catalogService =
    item.service === 'phone' || item.service === 'airtime' || item.service === 'data'
      ? 'airtime'
      : item.service;
  const providerLabel = getProviderName(catalogService, item.provider);
  const detailLine =
    item.service === 'electricity'
      ? `${providerLabel} · ${item.meterType ?? 'prepaid'}`
      : providerLabel;
  const isPhone = item.service === 'phone' || item.service === 'airtime' || item.service === 'data';

  return (
    <article
      className={cn(
        'relative rounded-xl border bg-white p-4 shadow-sm',
        highlighted ? 'border-blue-normal bg-blue-50/40' : 'border-gray-200',
      )}
    >
      <div className="flex gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-50 ring-1 ring-blue-100">
          <Image
            src={getProviderLogo(catalogService, item.provider)}
            alt=""
            width={28}
            height={28}
            className="h-7 w-7 object-contain"
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="truncate font-semibold text-gray-900">{item.label}</h3>
                {item.isPrimary ? (
                  <span className="rounded-full bg-blue-normal px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                    Primary
                  </span>
                ) : null}
                {item.verified ? (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Verified
                  </span>
                ) : null}
              </div>
              <p className="mt-1 font-mono text-sm text-gray-800">{item.accountNumber}</p>
              <p className="mt-1 text-sm capitalize text-gray-600">{detailLine}</p>
              {item.customerName ? (
                <p className="mt-1 text-sm text-gray-700">{item.customerName}</p>
              ) : null}
              {item.address ? <p className="mt-0.5 text-xs text-gray-500">{item.address}</p> : null}
              <p className="mt-1 text-xs text-gray-500">{item.branchName}</p>
            </div>

            {canManage ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={onToggleMenu}
                  className="rounded-lg p-2 text-gray-500 hover:bg-white hover:text-gray-800"
                  aria-label={`${singular} options`}
                >
                  <MoreVertical className="h-4 w-4" />
                </button>
                {menuOpen ? (
                  <div className="absolute right-0 z-20 mt-1 w-44 overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-lg">
                    {!item.isPrimary ? (
                      <button
                        type="button"
                        onClick={onSetPrimary}
                        className="block w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                      >
                        Set as primary
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={onDelete}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete {singular}
                    </button>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>

          {canPay ? (
            isPhone ? (
              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  href={beneficiaryPayPath(item, 'airtime')}
                  className={`${secondaryButtonClass} !px-3 !py-2`}
                >
                  Buy airtime
                </Link>
                <Link
                  href={beneficiaryPayPath(item, 'data')}
                  className={`${secondaryButtonClass} !px-3 !py-2`}
                >
                  Buy data
                </Link>
              </div>
            ) : (
              <Link href={beneficiaryPayPath(item)} className={`${secondaryButtonClass} mt-4`}>
                {item.service === 'cable' ? 'Pay subscription' : 'Buy electricity'}
              </Link>
            )
          ) : null}
        </div>
      </div>
    </article>
  );
}

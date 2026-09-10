'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  BusinessActionsMenu,
  BusinessActionsMenuItem,
} from '@/components/business/BusinessActionsMenu';
import { BusinessProviderAvatar } from '@/components/business/BusinessProviderAvatar';
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
  detectNetworkFromPhone,
  getProviderName,
  isValidNigerianPhone,
  mockLookupMeter,
  normalizePhone,
  resolveDiscoCode,
  type CableProviderId,
  type MeterType,
} from '@/data/mockPaymentCatalog';
import { DISCO_NAMES } from '@/constants/discoNames';
import { businessBeneficiariesApi } from '@/lib/businessBeneficiariesApi';
import { businessPaymentsApi, paymentErrorMessage } from '@/lib/businessPaymentsApi';
import {
  mapCableProviderOptions,
  mapNetworkProviderOptions,
  meterCustomerAddress,
  meterCustomerName,
  normalizeElectricityDiscoMap,
  parseMeterVerifyCustomerData,
  type CatalogProviderOption,
} from '@/utils/businessPaymentCatalog';
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

const FALLBACK_DISCO_OPTIONS = ELECTRICITY_DISCOS.map((item) => ({
  code: item.id,
  name: item.name,
  available: true,
}));

const FALLBACK_NETWORK_OPTIONS: CatalogProviderOption[] = AIRTIME_NETWORKS.map((item) => ({
  ...item,
  available: true,
}));

const FALLBACK_CABLE_OPTIONS: CatalogProviderOption[] = CABLE_PROVIDERS.filter(
  (item) => item.id !== 'showmax',
).map((item) => ({
  ...item,
  available: true,
}));

function providerTileOptions(options: CatalogProviderOption[]) {
  const available = options.filter((item) => item.available);
  const source = available.length > 0 ? available : options;
  return source.map(({ id, name, logo }) => ({ id, name, logo }));
}

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
  shortLabel: string;
  singular: string;
  primaryTitle: string;
  savedTitle: string;
  emptyTitle: string;
  emptyDescription: string;
}[] = [
  {
    id: 'electricity',
    label: 'Electricity',
    shortLabel: 'Electricity',
    singular: 'meter',
    primaryTitle: 'Primary meter',
    savedTitle: 'Saved meters',
    emptyTitle: 'No saved meters yet',
    emptyDescription: 'Add a meter to access it quickly when buying electricity.',
  },
  {
    id: 'phone',
    label: 'Phone Numbers',
    shortLabel: 'Phone',
    singular: 'number',
    primaryTitle: 'Primary number',
    savedTitle: 'Saved numbers',
    emptyTitle: 'No saved numbers or groups yet',
    emptyDescription: 'Save phone lines once and use them for airtime or data — including bulk groups.',
  },
  {
    id: 'cable',
    label: 'Cable TV',
    shortLabel: 'Cable',
    singular: 'smartcard',
    primaryTitle: 'Primary smartcard',
    savedTitle: 'Saved smartcards',
    emptyTitle: 'No saved smartcards yet',
    emptyDescription: 'Save DStv, GOtv, and other decoder accounts for renewals.',
  },
];

export default function BeneficiariesPage() {
  const { user, demoRole, canAccess, isAuthenticated, dashboardBootstrap, refreshMe } =
    useBusinessAuth();
  const role = user?.role ?? demoRole;
  const branches = useMemo(() => {
    if (isAuthenticated) {
      const liveBranches = (dashboardBootstrap?.branches || []) as Array<{
        id?: string;
        name?: string;
      }>;
      return liveBranches
        .filter((branch) => branch.name)
        .map((branch) => ({
          id: String(branch.id || branch.name),
          name: String(branch.name),
        }));
    }
    return getMockBranchesForRole(role);
  }, [dashboardBootstrap?.branches, isAuthenticated, role]);

  const [service, setService] = useState<BeneficiaryService>('electricity');
  const [items, setItems] = useState<BusinessBeneficiary[]>(() =>
    isAuthenticated ? [] : getMockBeneficiariesForRole(role),
  );
  const [groups, setGroups] = useState<BeneficiaryGroup[]>(() =>
    isAuthenticated ? [] : getMockBeneficiaryGroupsForRole(role),
  );
  const [isAdding, setIsAdding] = useState(false);
  const [addMode, setAddMode] = useState<AddMode>('single');
  const [phoneSubTab, setPhoneSubTab] = useState<PhoneSubTab>(
    isAuthenticated ? 'singles' : 'groups',
  );
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [groupMenuOpenId, setGroupMenuOpenId] = useState<string | null>(null);
  const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null);
  const [groupMembers, setGroupMembers] = useState<DraftGroupMember[]>(() => [
    newDraftMember(),
    newDraftMember('airtel'),
  ]);

  const [title, setTitle] = useState('');
  const [disco, setDisco] = useState(ELECTRICITY_DISCOS[0]?.id ?? 'ABUJA');
  const [discoOptions, setDiscoOptions] = useState(FALLBACK_DISCO_OPTIONS);
  const [meterType, setMeterType] = useState<MeterType>('prepaid');
  const [meterNumber, setMeterNumber] = useState('');
  const [network, setNetwork] = useState(AIRTIME_NETWORKS[0]?.id ?? 'mtn');
  const [networkOptions, setNetworkOptions] =
    useState<CatalogProviderOption[]>(FALLBACK_NETWORK_OPTIONS);
  const [phone, setPhone] = useState('');
  const [cableProvider, setCableProvider] = useState<CableProviderId>('dstv');
  const [cableOptions, setCableOptions] =
    useState<CatalogProviderOption[]>(FALLBACK_CABLE_OPTIONS);
  const [smartCard, setSmartCard] = useState('');
  const [branchName, setBranchName] = useState(branches[0]?.name ?? '');
  const [lookupName, setLookupName] = useState('');
  const [lookupAddress, setLookupAddress] = useState('');
  const [lookingUp, setLookingUp] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const verifyRequestRef = useRef(0);
  const addFormRef = useRef<HTMLFormElement | null>(null);

  useEffect(() => {
    if (!branchName && branches[0]?.name) {
      setBranchName(branches[0].name);
    }
  }, [branchName, branches]);

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

  const networkTileOptions = useMemo(
    () => providerTileOptions(networkOptions),
    [networkOptions],
  );
  const cableTileOptions = useMemo(() => providerTileOptions(cableOptions), [cableOptions]);

  const startAdding = (mode?: AddMode) => {
    const nextMode =
      isAuthenticated
        ? 'single'
        : (mode ??
          (supportsGroups(service) && phoneSubTab === 'groups' ? 'group' : 'single'));
    resetAddForm();
    setAddMode(supportsGroups(service) && !isAuthenticated ? nextMode : 'single');
    setIsAdding(true);
  };

  useEffect(() => {
    if (!isAuthenticated) {
      setDiscoOptions(FALLBACK_DISCO_OPTIONS);
      setNetworkOptions(FALLBACK_NETWORK_OPTIONS);
      setCableOptions(FALLBACK_CABLE_OPTIONS);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const [electricity, networks, cables] = await Promise.all([
          businessPaymentsApi.electricityProviders(),
          businessPaymentsApi.networkProviders(),
          businessPaymentsApi.cableProviders(),
        ]);
        if (cancelled) return;

        const nextDiscos = normalizeElectricityDiscoMap(electricity, DISCO_NAMES);
        if (nextDiscos.length > 0) {
          setDiscoOptions(nextDiscos);
          setDisco((current) => {
            const resolved = resolveDiscoCode(current);
            const match = nextDiscos.find((item) => item.code === resolved && item.available);
            if (match) return match.code;
            return nextDiscos.find((item) => item.available)?.code ?? resolved;
          });
        } else {
          setDiscoOptions(FALLBACK_DISCO_OPTIONS);
        }

        const nextNetworks = mapNetworkProviderOptions(networks, AIRTIME_NETWORKS);
        setNetworkOptions(nextNetworks.length > 0 ? nextNetworks : FALLBACK_NETWORK_OPTIONS);
        setNetwork((current) => {
          const tiles = providerTileOptions(
            nextNetworks.length > 0 ? nextNetworks : FALLBACK_NETWORK_OPTIONS,
          );
          return tiles.find((item) => item.id === current)?.id ?? tiles[0]?.id ?? current;
        });

        const nextCables = mapCableProviderOptions(cables, CABLE_PROVIDERS);
        setCableOptions(nextCables.length > 0 ? nextCables : FALLBACK_CABLE_OPTIONS);
        setCableProvider((current) => {
          const tiles = providerTileOptions(
            nextCables.length > 0 ? nextCables : FALLBACK_CABLE_OPTIONS,
          );
          const match = tiles.find((item) => item.id === current)?.id;
          return (match ?? tiles[0]?.id ?? current) as CableProviderId;
        });
      } catch {
        if (!cancelled) {
          setDiscoOptions(FALLBACK_DISCO_OPTIONS);
          setNetworkOptions(FALLBACK_NETWORK_OPTIONS);
          setCableOptions(FALLBACK_CABLE_OPTIONS);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      setPhoneSubTab('singles');
      setAddMode('single');
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      const live = (dashboardBootstrap?.beneficiaries || []) as Array<Record<string, unknown>>;
      setItems(
        live.map((row) => {
          const serviceRaw = String(row.service || 'electricity');
          const serviceValue: BusinessBeneficiary['service'] =
            serviceRaw === 'phone' ||
            serviceRaw === 'cable' ||
            serviceRaw === 'airtime' ||
            serviceRaw === 'data' ||
            serviceRaw === 'electricity'
              ? serviceRaw
              : 'electricity';
          const meterType =
            row.meterType === 'postpaid' || row.meterType === 'prepaid'
              ? row.meterType
              : undefined;

          return {
            id: String(row.id),
            label: String(row.label || 'Beneficiary'),
            service: serviceValue,
            provider: String(row.provider || ''),
            accountNumber: String(row.accountNumber || ''),
            branchName: String(row.branchName || '—'),
            branchId: row.branchId != null ? String(row.branchId) : null,
            createdAt: String(row.createdAt || new Date().toISOString()),
            meterType,
            customerName: row.customerName ? String(row.customerName) : undefined,
            address: row.address ? String(row.address) : undefined,
            isPrimary: Boolean(row.isPrimary),
            verified: Boolean(row.verified),
          };
        }),
      );
      setGroups([]);
      return;
    }

    setItems(getMockBeneficiariesForRole(role));
    setGroups(getMockBeneficiaryGroupsForRole(role));
  }, [dashboardBootstrap?.beneficiaries, isAuthenticated, role]);

  useEffect(() => {
    setIsAdding(false);
    setMenuOpenId(null);
    setGroupMenuOpenId(null);
    setExpandedGroupId(null);
    resetAddForm(service);
    setAddMode(
      !isAuthenticated && supportsGroups(service) && phoneSubTab === 'groups'
        ? 'group'
        : 'single',
    );
    if (service !== 'phone') {
      setPhoneSubTab(isAuthenticated ? 'singles' : 'groups');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset when switching tabs only
  }, [service]);

  useEffect(() => {
    if (service !== 'phone') return;
    setIsAdding(false);
    setMenuOpenId(null);
    setGroupMenuOpenId(null);
    setAddMode(!isAuthenticated && phoneSubTab === 'groups' ? 'group' : 'single');
  }, [phoneSubTab, service, isAuthenticated]);

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
        if (isAuthenticated) {
          const raw = await businessPaymentsApi.verifyMeter({
            meter: digits,
            disco: resolveDiscoCode(disco),
            vendType: meterType.toUpperCase(),
          });
          if (requestId !== verifyRequestRef.current) return;
          const data = parseMeterVerifyCustomerData(raw);
          const name = meterCustomerName(data);
          if (!name) {
            throw new Error('Could not verify meter');
          }
          setLookupName(name);
          setLookupAddress(meterCustomerAddress(data) || '—');
          setVerifyError(null);
        } else {
          const next = await mockLookupMeter(digits, disco, meterType);
          if (requestId !== verifyRequestRef.current) return;
          setLookupName(next.customerName);
          setLookupAddress(next.address);
          setVerifyError(null);
        }
      } catch (error) {
        if (requestId !== verifyRequestRef.current) return;
        setLookupName('');
        setLookupAddress('');
        setVerifyError(
          paymentErrorMessage(error, error instanceof Error ? error.message : 'Could not verify meter'),
        );
      } finally {
        if (requestId === verifyRequestRef.current) setLookingUp(false);
      }
    })();
  }, [disco, isAdding, isAuthenticated, meterNumber, meterType, service]);

  function resetAddForm(nextService: BeneficiaryService = service) {
    setTitle('');
    setDisco(discoOptions.find((item) => item.available)?.code ?? ELECTRICITY_DISCOS[0]?.id ?? 'ABUJA');
    setMeterType('prepaid');
    setMeterNumber('');
    setNetwork(networkTileOptions[0]?.id ?? AIRTIME_NETWORKS[0]?.id ?? 'mtn');
    setPhone('');
    setCableProvider((cableTileOptions[0]?.id as CableProviderId) ?? 'dstv');
    setSmartCard('');
    setBranchName(branches[0]?.name ?? '');
    setLookupName('');
    setLookupAddress('');
    setVerifyError(null);
    setLookingUp(false);
    setGroupMembers([newDraftMember(), newDraftMember('airtel')]);
    void nextService;
  }

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    const selectedBranch =
      branches.find((branch) => branch.name === branchName) ?? branches[0] ?? null;
    const branch = selectedBranch?.name || branchName || 'Head Office';

    if (supportsGroups(service) && addMode === 'group') {
      if (isAuthenticated) {
        toast.error('Bulk groups coming soon');
        return;
      }
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

    let payload: {
      label: string;
      service: BusinessBeneficiary['service'];
      provider: string;
      accountNumber: string;
      branchId?: string | null;
      meterType?: 'prepaid' | 'postpaid' | null;
      customerName?: string | null;
      address?: string | null;
      isPrimary?: boolean;
      verified?: boolean;
    } | null = null;
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
      payload = {
        label: title.trim(),
        service: 'electricity',
        provider: resolveDiscoCode(disco),
        accountNumber: digits,
        branchId: selectedBranch?.id ?? null,
        meterType,
        customerName: lookupName,
        address: lookupAddress || null,
        verified: true,
        isPrimary: serviceItems.length === 0,
      };
      next = {
        id: `ben-${Date.now()}`,
        label: payload.label,
        service: 'electricity',
        provider: payload.provider,
        accountNumber: digits,
        branchName: branch,
        branchId: selectedBranch?.id ?? null,
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
      payload = {
        label: title.trim(),
        service: 'phone',
        provider: network,
        accountNumber: normalizePhone(phone),
        branchId: selectedBranch?.id ?? null,
        verified: true,
        isPrimary: serviceItems.length === 0,
      };
      next = {
        id: `ben-${Date.now()}`,
        label: payload.label,
        service: 'phone',
        provider: network,
        accountNumber: normalizePhone(phone),
        branchName: branch,
        branchId: selectedBranch?.id ?? null,
        createdAt: new Date().toISOString(),
        verified: true,
        isPrimary: serviceItems.length === 0,
      };
    } else {
      const digits = smartCard.replace(/\D/g, '');
      if (digits.length < 8) {
        toast.error('Enter a valid smartcard / IUC number (at least 8 digits)');
        return;
      }
      payload = {
        label: title.trim(),
        service: 'cable',
        provider: cableProvider,
        accountNumber: digits,
        branchId: selectedBranch?.id ?? null,
        isPrimary: serviceItems.length === 0,
      };
      next = {
        id: `ben-${Date.now()}`,
        label: payload.label,
        service: 'cable',
        provider: cableProvider,
        accountNumber: digits,
        branchName: branch,
        branchId: selectedBranch?.id ?? null,
        createdAt: new Date().toISOString(),
        isPrimary: serviceItems.length === 0,
      };
    }

    if (isAuthenticated && payload) {
      setSaving(true);
      try {
        await businessBeneficiariesApi.create(payload);
        await refreshMe();
        setIsAdding(false);
        resetAddForm();
        toast.success(`${tab.singular[0].toUpperCase()}${tab.singular.slice(1)} saved`);
      } catch (error) {
        toast.error(paymentErrorMessage(error, `Could not save ${tab.singular}`));
      } finally {
        setSaving(false);
      }
      return;
    }

    setItems((current) => [...current, next!]);
    setIsAdding(false);
    resetAddForm();
    toast.success(`${tab.singular[0].toUpperCase()}${tab.singular.slice(1)} saved (demo)`);
  };

  const handleDelete = async (id: string) => {
    if (isAuthenticated) {
      try {
        await businessBeneficiariesApi.remove(id);
        await refreshMe();
        setMenuOpenId(null);
        toast.success(`${tab.singular[0].toUpperCase()}${tab.singular.slice(1)} removed`);
      } catch (error) {
        toast.error(paymentErrorMessage(error, `Could not remove ${tab.singular}`));
      }
      return;
    }

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

  const handleSetPrimary = async (id: string) => {
    if (isAuthenticated) {
      try {
        await businessBeneficiariesApi.update(id, { isPrimary: true });
        await refreshMe();
        setMenuOpenId(null);
        toast.success(`Primary ${tab.singular} updated`);
      } catch (error) {
        toast.error(paymentErrorMessage(error, `Could not update primary ${tab.singular}`));
      }
      return;
    }

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

      <div className="flex gap-1 rounded-xl border border-gray-200 bg-white p-1 shadow-sm">
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
                'min-w-0 flex-1 rounded-lg px-2 py-2 text-xs font-medium transition sm:px-3 sm:text-sm',
                active
                  ? 'bg-blue-normal text-white'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
              )}
            >
              <span className="sm:hidden">{item.shortLabel}</span>
              <span className="hidden sm:inline">{item.label}</span>
              <span className={cn('ml-1 text-xs sm:ml-1.5', active ? 'text-white/80' : 'text-gray-400')}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {service === 'phone' && !isAuthenticated ? (
        <div className="flex gap-1 rounded-xl border border-gray-200 bg-gray-50 p-1">
          {(
            [
              { id: 'groups' as const, label: 'Number groups', shortLabel: 'Groups', count: serviceGroups.length },
              { id: 'singles' as const, label: 'Single numbers', shortLabel: 'Singles', count: serviceItems.length },
            ] as const
          ).map((sub) => {
            const active = phoneSubTab === sub.id;
            return (
              <button
                key={sub.id}
                type="button"
                onClick={() => setPhoneSubTab(sub.id)}
                className={cn(
                  'min-w-0 flex-1 rounded-lg px-2 py-2 text-xs font-medium transition sm:px-3 sm:text-sm',
                  active
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900',
                )}
              >
                <span className="sm:hidden">{sub.shortLabel}</span>
                <span className="hidden sm:inline">{sub.label}</span>
                <span className={cn('ml-1 text-xs sm:ml-1.5', active ? 'text-gray-500' : 'text-gray-400')}>
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
                onOpenChange={(open) => setGroupMenuOpenId(open ? primaryGroup.id : null)}
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
                onOpenChange={(open) => setGroupMenuOpenId(open ? group.id : null)}
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
            onOpenChange={(open) => setMenuOpenId(open ? primaryItem.id : null)}
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
            onOpenChange={(open) => setMenuOpenId(open ? primaryItem.id : null)}
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
                onOpenChange={(open) => setMenuOpenId(open ? item.id : null)}
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
                onOpenChange={(open) => setMenuOpenId(open ? item.id : null)}
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
            onClick={() =>
              startAdding(
                !isAuthenticated && phoneSubTab === 'groups' ? 'group' : 'single',
              )
            }
            className="flex w-full items-center gap-3 rounded-xl border border-dashed border-blue-200 bg-white px-4 py-4 text-sm font-semibold text-blue-normal hover:border-blue-normal hover:bg-blue-50/40"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-normal">
              <Plus className="h-4 w-4" />
            </span>
            {!isAuthenticated && phoneSubTab === 'groups' ? 'Add group' : 'Add single number'}
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
                      options={networkTileOptions}
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
                <ProviderTiles options={networkTileOptions} value={network} onChange={setNetwork} />
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
                  options={cableTileOptions}
                  value={cableProvider}
                  onChange={(id) => setCableProvider(id as CableProviderId)}
                />
              </div>
              <div>
                <label htmlFor="add-smartcard" className="block text-sm font-medium text-gray-700">
                  Smartcard / IUC
                </label>
                <input
                  id="add-smartcard"
                  inputMode="numeric"
                  value={smartCard}
                  onChange={(event) => setSmartCard(event.target.value.replace(/[^\d]/g, ''))}
                  placeholder="7012345678"
                  className={fieldClass}
                />
              </div>
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
              saving ||
              lookingUp ||
              (addMode === 'single' && service === 'electricity' && !lookupName)
            }
            className={primaryButtonClass}
          >
            {saving
              ? 'Saving…'
              : supportsGroups(service) && addMode === 'group'
                ? 'Save group'
                : `Save ${tab.singular}`}
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
  onOpenChange,
  onDelete,
  onSetPrimary,
}: {
  item: BusinessBeneficiary;
  highlighted?: boolean;
  singular: string;
  canPay: boolean;
  canManage: boolean;
  menuOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete: () => void;
  onSetPrimary: () => void;
}) {
  const catalogService =
    item.service === 'phone' || item.service === 'airtime' || item.service === 'data'
      ? 'airtime'
      : item.service;
  const resolvedProvider =
    catalogService === 'airtime' &&
    (!item.provider || item.provider.toLowerCase() === 'unknown')
      ? detectNetworkFromPhone(item.accountNumber) || item.provider
      : item.provider;
  const providerLabel = getProviderName(catalogService, resolvedProvider);
  const detailLine =
    item.service === 'electricity'
      ? `${providerLabel} · ${item.meterType ?? 'prepaid'}`
      : providerLabel && providerLabel.toLowerCase() !== 'unknown'
        ? providerLabel
        : null;
  const isPhone = item.service === 'phone' || item.service === 'airtime' || item.service === 'data';

  return (
    <article
      className={cn(
        'relative rounded-xl border bg-white p-4 shadow-sm',
        highlighted ? 'border-blue-normal bg-blue-50/40' : 'border-gray-200',
      )}
    >
      <div className="flex gap-3">
        <BusinessProviderAvatar
          service={
            item.service === 'phone' || item.service === 'airtime' || item.service === 'data'
              ? 'airtime'
              : item.service
          }
          provider={resolvedProvider}
          size="md"
        />
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
              {detailLine ? (
                <p className="mt-1 text-sm capitalize text-gray-600">{detailLine}</p>
              ) : null}
              {item.customerName ? (
                <p className="mt-1 text-sm text-gray-700">{item.customerName}</p>
              ) : null}
              {item.address ? <p className="mt-0.5 text-xs text-gray-500">{item.address}</p> : null}
              <p className="mt-1 text-xs text-gray-500">{item.branchName}</p>
            </div>

            {canManage ? (
              <BusinessActionsMenu
                label={`${singular} options`}
                open={menuOpen}
                onOpenChange={onOpenChange}
                menuClassName="w-44"
              >
                {!item.isPrimary ? (
                  <BusinessActionsMenuItem onClick={onSetPrimary}>
                    Set as primary
                  </BusinessActionsMenuItem>
                ) : null}
                <BusinessActionsMenuItem destructive onClick={onDelete}>
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete {singular}
                </BusinessActionsMenuItem>
              </BusinessActionsMenu>
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

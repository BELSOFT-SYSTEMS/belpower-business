'use client';

import Image from 'next/image';
import { useState } from 'react';
import { Plus } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { BusinessFormModal } from '@/components/business/BusinessFormModal';
import { BusinessSelect } from '@/components/business/BusinessSelect';
import { EmptyState } from '@/components/business/EmptyState';
import { PageHeader } from '@/components/business/PageHeader';
import { useBusinessAuth } from '@/context/BusinessAuthContext';
import { getMockBeneficiariesForRole, getMockBranchesForRole } from '@/data/businessMocks';
import { getDiscoDisplayName } from '@/constants/discoNames';
import { getTransactionIcon } from '@/utils/transactionIcons';

export default function BeneficiariesPage() {
  const { user, demoRole, canAccess } = useBusinessAuth();
  const role = user?.role ?? demoRole;
  const beneficiaries = getMockBeneficiariesForRole(role);
  const branches = getMockBranchesForRole(role);
  const [addOpen, setAddOpen] = useState(false);
  const [service, setService] = useState('electricity');
  const [branch, setBranch] = useState(branches[0]?.name ?? '');

  const resetAddForm = () => {
    setService('electricity');
    setBranch(branches[0]?.name ?? '');
  };

  const handleAdd = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const label = String(form.get('label') ?? '').trim();
    setAddOpen(false);
    resetAddForm();
    toast.success(`${label || 'Beneficiary'} saved (demo)`);
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          title="Beneficiaries"
          description="Saved utility accounts for faster repeat payments."
        />
        {canAccess('beneficiaries.manage') && (
          <button
            type="button"
            onClick={() => {
              resetAddForm();
              setAddOpen(true);
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-normal px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-normal-hover"
          >
            <Plus className="h-4 w-4" />
            Add beneficiary
          </button>
        )}
      </div>

      {beneficiaries.length === 0 ? (
        <EmptyState
          title="No beneficiaries yet"
          description="Save frequently used meter numbers and phone lines for quick payments."
          action={
            canAccess('beneficiaries.manage') ? (
              <button
                type="button"
                onClick={() => {
              resetAddForm();
              setAddOpen(true);
            }}
                className="rounded-xl bg-blue-normal px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-normal-hover"
              >
                Add beneficiary
              </button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {beneficiaries.map((ben) => (
            <article
              key={ben.id}
              className="flex gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
            >
              <Image
                src={getTransactionIcon({ type: ben.service, provider: ben.provider })}
                alt={ben.service}
                width={44}
                height={44}
                className="rounded-lg bg-gray-50 p-1"
              />
              <div className="min-w-0 flex-1">
                <h2 className="font-semibold text-gray-900">{ben.label}</h2>
                <p className="mt-0.5 text-sm capitalize text-gray-600">
                  {ben.service}
                  {ben.service === 'electricity'
                    ? ` · ${getDiscoDisplayName(ben.provider)}`
                    : ` · ${ben.provider}`}
                </p>
                <p className="mt-1 font-mono text-sm text-gray-800">{ben.accountNumber}</p>
                <p className="mt-2 text-xs text-gray-500">
                  {ben.branchName} · Added{' '}
                  {formatDistanceToNow(new Date(ben.createdAt), { addSuffix: true })}
                </p>
              </div>
            </article>
          ))}
        </div>
      )}

      <BusinessFormModal
        open={addOpen}
        title="Add beneficiary"
        description="Save a utility account for repeat payments."
        submitLabel="Save beneficiary"
        onClose={() => {
          setAddOpen(false);
          resetAddForm();
        }}
        onSubmit={handleAdd}
      >
        <input
          required
          name="label"
          placeholder="Label (e.g. HQ main meter)"
          className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-blue-normal focus:ring-2 focus:ring-blue-normal/20"
        />
        <BusinessSelect
          name="service"
          value={service}
          onChange={setService}
          options={[
            { value: 'electricity', label: 'Electricity' },
            { value: 'airtime', label: 'Airtime' },
            { value: 'data', label: 'Data' },
            { value: 'cable', label: 'Cable TV' },
          ]}
        />
        <input
          required
          name="accountNumber"
          placeholder="Meter / phone / smartcard number"
          className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-blue-normal focus:ring-2 focus:ring-blue-normal/20"
        />
        <BusinessSelect
          name="branch"
          value={branch}
          onChange={setBranch}
          options={branches.map((item) => ({
            value: item.name,
            label: item.name,
          }))}
        />
      </BusinessFormModal>
    </div>
  );
}

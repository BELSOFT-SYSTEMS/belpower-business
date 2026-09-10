'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import { ElectricityDiscoSelector } from '@/components/business/payments/ElectricityDiscoSelector';
import { fieldClass } from '@/components/business/payments/paymentShared';
import {
  ELECTRICITY_DISCOS,
  getProviderName,
  mockLookupMeter,
  resolveDiscoCode,
  type MeterType,
} from '@/data/mockPaymentCatalog';
import type { BusinessBranch } from '@/types/business';
import { cn } from '@/lib/utils';

const METER_VERIFY_MIN_DIGITS = 10;

type AddBranchModalProps = {
  open: boolean;
  onClose: () => void;
  onAdd: (branch: BusinessBranch) => void;
};

type Step = 1 | 2 | 3;

export function AddBranchModal({ open, onClose, onAdd }: AddBranchModalProps) {
  const [step, setStep] = useState<Step>(1);
  const [disco, setDisco] = useState(ELECTRICITY_DISCOS[0]?.id ?? 'ABUJA');
  const [meterType, setMeterType] = useState<MeterType>('prepaid');
  const [meterNumber, setMeterNumber] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [verifiedAddress, setVerifiedAddress] = useState('');
  const [lookingUp, setLookingUp] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [city, setCity] = useState('');
  const verifyRequestRef = useRef(0);

  const discoOptions = useMemo(
    () => ELECTRICITY_DISCOS.map((item) => ({ code: item.id, name: item.name, available: true })),
    [],
  );

  const verified = Boolean(customerName && verifiedAddress);
  const discoLabel = getProviderName('electricity', resolveDiscoCode(disco));

  const stepCopy =
    step === 1
      ? 'Step 1 of 3 — Verify the branch electricity meter first.'
      : step === 2
        ? 'Step 2 of 3 — Enter branch details. Address comes from the verified meter.'
        : 'Step 3 of 3 — Review everything, then add the branch.';

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    setStep(1);
    setDisco(ELECTRICITY_DISCOS[0]?.id ?? 'ABUJA');
    setMeterType('prepaid');
    setMeterNumber('');
    setCustomerName('');
    setVerifiedAddress('');
    setLookingUp(false);
    setVerifyError(null);
    setName('');
    setCode('');
    setCity('');
  }, [open]);

  useEffect(() => {
    if (!open || step !== 1) {
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
    setCustomerName('');
    setVerifiedAddress('');

    void (async () => {
      try {
        const next = await mockLookupMeter(digits, disco, meterType);
        if (requestId !== verifyRequestRef.current) return;
        setCustomerName(next.customerName);
        setVerifiedAddress(next.address);
        setVerifyError(null);
      } catch (error) {
        if (requestId !== verifyRequestRef.current) return;
        setCustomerName('');
        setVerifiedAddress('');
        setVerifyError(error instanceof Error ? error.message : 'Could not verify meter');
      } finally {
        if (requestId === verifyRequestRef.current) setLookingUp(false);
      }
    })();
  }, [disco, meterNumber, meterType, open, step]);

  const clearMeterLookup = () => {
    setCustomerName('');
    setVerifiedAddress('');
    setVerifyError(null);
  };

  const handleContinueFromMeter = () => {
    const digits = meterNumber.replace(/\D/g, '');
    if (digits.length < 11) {
      toast.error('Enter a valid meter number (at least 11 digits)');
      return;
    }
    if (!verified || lookingUp) {
      toast.error('Verify the meter before continuing');
      return;
    }
    setStep(2);
  };

  const handleContinueFromDetails = (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) {
      toast.error('Enter a branch name');
      return;
    }
    if (!code.trim()) {
      toast.error('Enter a branch code');
      return;
    }
    if (!city.trim()) {
      toast.error('Enter a city');
      return;
    }
    if (!verifiedAddress) {
      toast.error('Verified address is required');
      return;
    }
    setStep(3);
  };

  const handleSubmit = () => {
    if (step !== 3) return;

    const trimmedName = name.trim();
    const trimmedCode = code.trim().toUpperCase();
    const trimmedCity = city.trim();

    if (!trimmedName || !trimmedCode || !trimmedCity || !verifiedAddress) {
      toast.error('Complete all branch details before adding');
      setStep(2);
      return;
    }

    onAdd({
      id: `branch-${Date.now()}`,
      name: trimmedName,
      code: trimmedCode,
      address: verifiedAddress,
      city: trimmedCity,
      isHeadOffice: false,
      userCount: 0,
      meterCount: 1,
      status: 'active',
    });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-label="Close dialog"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-branch-title"
        className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-gray-200 bg-white p-6 shadow-xl"
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 id="add-branch-title" className="text-lg font-semibold text-gray-900">
              Add branch
            </h2>
            <p className="mt-1 text-sm text-gray-600">{stepCopy}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-gray-500 hover:bg-gray-100"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-5 flex items-center gap-2">
          <StepPill active={step === 1} done={step > 1} label="1. Meter" />
          <div className="h-px flex-1 bg-gray-200" />
          <StepPill active={step === 2} done={step > 2} label="2. Details" />
          <div className="h-px flex-1 bg-gray-200" />
          <StepPill active={step === 3} done={false} label="3. Review" />
        </div>

        {step === 1 ? (
          <div className="space-y-4">
            <ElectricityDiscoSelector
              discos={discoOptions}
              selectedCode={disco}
              onSelect={(next) => {
                setDisco(next);
                clearMeterLookup();
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
                      clearMeterLookup();
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
              <label htmlFor="add-branch-meter" className="block text-sm font-medium text-gray-700">
                Meter number
              </label>
              <div className="relative mt-1.5">
                <input
                  id="add-branch-meter"
                  inputMode="numeric"
                  value={meterNumber}
                  onChange={(event) => {
                    setMeterNumber(event.target.value.replace(/[^\d]/g, ''));
                    clearMeterLookup();
                  }}
                  placeholder="45022530096"
                  className={cn(
                    fieldClass.replace('mt-1.5 ', ''),
                    verified && 'border-green-500 focus:border-green-500 focus:ring-green-500/20',
                  )}
                />
                <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs font-medium">
                  {lookingUp ? (
                    <span className="text-gray-500">Verifying…</span>
                  ) : verified ? (
                    <span className="text-green-600">✓ Verified</span>
                  ) : null}
                </span>
              </div>
              {verifyError ? <p className="mt-2 text-xs text-red-600">{verifyError}</p> : null}
              <p className="mt-1.5 text-xs text-gray-500">
                Disco: {resolveDiscoCode(disco)} · Verification runs automatically.
              </p>
            </div>

            {verified ? (
              <div className="space-y-3 rounded-xl border border-green-200 bg-green-50 p-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-green-700">
                    Customer name
                  </p>
                  <p className="mt-1 text-sm font-semibold text-gray-900">{customerName}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-green-700">Address</p>
                  <p className="mt-1 text-sm text-gray-700">{verifiedAddress}</p>
                </div>
              </div>
            ) : null}

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleContinueFromMeter}
                disabled={lookingUp || !verified}
                className="rounded-xl bg-blue-normal px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-normal-hover disabled:cursor-not-allowed disabled:opacity-50"
              >
                Continue
              </button>
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <form onSubmit={handleContinueFromDetails} className="space-y-4">
            <div>
              <label htmlFor="add-branch-name" className="block text-sm font-medium text-gray-700">
                Branch name
              </label>
              <input
                id="add-branch-name"
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="e.g. Ibadan Branch"
                className={fieldClass}
              />
            </div>

            <div>
              <label htmlFor="add-branch-code" className="block text-sm font-medium text-gray-700">
                Branch code
              </label>
              <input
                id="add-branch-code"
                required
                value={code}
                onChange={(event) => setCode(event.target.value.toUpperCase())}
                placeholder="e.g. IBD"
                className={fieldClass}
              />
            </div>

            <div>
              <label htmlFor="add-branch-city" className="block text-sm font-medium text-gray-700">
                City
              </label>
              <input
                id="add-branch-city"
                required
                value={city}
                onChange={(event) => setCity(event.target.value)}
                placeholder="e.g. Ibadan"
                className={fieldClass}
              />
            </div>

            <div>
              <label htmlFor="add-branch-address" className="block text-sm font-medium text-gray-700">
                Address
              </label>
              <textarea
                id="add-branch-address"
                readOnly
                rows={2}
                value={verifiedAddress}
                className={cn(fieldClass, 'cursor-not-allowed resize-none bg-gray-50 text-gray-700')}
              />
              <p className="mt-1.5 text-xs text-gray-500">
                Filled from the verified meter and cannot be edited.
              </p>
            </div>

            <div className="flex justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Back
              </button>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-blue-normal px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-normal-hover"
                >
                  Continue
                </button>
              </div>
            </div>
          </form>
        ) : null}

        {step === 3 ? (
          <div className="space-y-4">
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
              <ReviewSection title="Meter">
                <ReviewRow label="Disco" value={discoLabel} />
                <ReviewRow label="Meter type" value={meterType} capitalize />
                <ReviewRow label="Meter number" value={meterNumber} mono />
                <ReviewRow label="Customer" value={customerName} />
              </ReviewSection>
              <ReviewSection title="Branch">
                <ReviewRow label="Name" value={name.trim()} />
                <ReviewRow label="Code" value={code.trim().toUpperCase()} />
                <ReviewRow label="City" value={city.trim()} />
                <ReviewRow label="Address" value={verifiedAddress} />
              </ReviewSection>
            </div>

            <div className="flex justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Back
              </button>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="rounded-xl bg-blue-normal px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-normal-hover"
                >
                  Add branch
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function StepPill({
  active,
  done,
  label,
}: {
  active: boolean;
  done: boolean;
  label: string;
}) {
  return (
    <span
      className={cn(
        'rounded-full px-2.5 py-1 text-xs font-medium',
        active
          ? 'bg-blue-normal text-white'
          : done
            ? 'bg-blue-50 text-blue-normal'
            : 'bg-gray-100 text-gray-500',
      )}
    >
      {label}
    </span>
  );
}

function ReviewSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-gray-200 last:border-b-0">
      <p className="bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
        {title}
      </p>
      <dl className="divide-y divide-gray-100">{children}</dl>
    </div>
  );
}

function ReviewRow({
  label,
  value,
  mono = false,
  capitalize = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
  capitalize?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 px-4 py-3 text-sm">
      <dt className="text-gray-500">{label}</dt>
      <dd
        className={cn(
          'text-right font-medium text-gray-900',
          mono && 'font-mono',
          capitalize && 'capitalize',
        )}
      >
        {value || '—'}
      </dd>
    </div>
  );
}

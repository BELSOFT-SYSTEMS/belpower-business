'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { PageHeader } from '@/components/business/PageHeader';
import { ElectricityDiscoSelector } from '@/components/business/payments/ElectricityDiscoSelector';
import { useBusinessAuth } from '@/context/BusinessAuthContext';
import { DISCO_NAMES } from '@/constants/discoNames';
import {
  ELECTRICITY_DISCOS,
  ELECTRICITY_MAX,
  ELECTRICITY_MIN,
  getPaymentBlockReason,
  getProviderName,
  isValidNigerianPhone,
  resolveDiscoCode,
  type MeterLookup,
  type MeterType,
} from '@/data/mockPaymentCatalog';
import {
  businessPaymentsApi,
  normalizeBusinessPhone,
  paymentErrorMessage,
} from '@/lib/businessPaymentsApi';
import {
  meterCustomerAddress,
  meterCustomerName,
  meterOutstanding,
  normalizeElectricityDiscoMap,
  parseMeterVerifyCustomerData,
} from '@/utils/businessPaymentCatalog';
import { formatPrice } from '@/utils/formatPrice';
import { cn } from '@/lib/utils';
import {
  FieldLabel,
  PayButton,
  PaymentFailedView,
  PaymentSourceCard,
  PaymentSuccessView,
  ReviewList,
  SavedBeneficiaryPicker,
  fieldClass,
  usePaymentSession,
} from '@/components/business/payments/paymentShared';

type View = 'form' | 'success' | 'failed' | 'pending';

type DiscoOption = { code: string; name: string; available: boolean };

const METER_VERIFY_DEBOUNCE_MS = 600;
const METER_VERIFY_MIN_DIGITS = 10;

const FALLBACK_DISCO_OPTIONS: DiscoOption[] = ELECTRICITY_DISCOS.map((item) => ({
  code: item.id,
  name: item.name,
  available: true,
}));

function mapMeterLookup(raw: unknown, disco: string, meterType: MeterType): MeterLookup {
  const data = parseMeterVerifyCustomerData(raw);
  return {
    customerName: meterCustomerName(data) || 'Customer',
    address: meterCustomerAddress(data) || '—',
    disco,
    meterType,
    outstanding: meterOutstanding(data),
  };
}

function readVendLimits(raw: unknown): { minVend: number | null; maxVend: number | null } {
  const data = parseMeterVerifyCustomerData(raw);
  if (!data) return { minVend: null, maxVend: null };

  const min =
    typeof data.min_vend_amount === 'number' && Number.isFinite(data.min_vend_amount)
      ? data.min_vend_amount
      : null;
  const max =
    typeof data.max_vend_amount === 'number' && Number.isFinite(data.max_vend_amount)
      ? data.max_vend_amount
      : null;

  return {
    minVend: min != null && min > 0 ? min : null,
    maxVend: max != null && max > 0 ? max : null,
  };
}

export function ElectricityPaymentFlow() {
  const params = useSearchParams();
  const session = usePaymentSession();
  const { business } = useBusinessAuth();
  const initialType = params.get('type') === 'postpaid' ? 'postpaid' : 'prepaid';
  const defaultPhone = business?.phone ? normalizeBusinessPhone(business.phone) : '';
  const [view, setView] = useState<View>('form');
  const [disco, setDisco] = useState(resolveDiscoCode(params.get('disco') || 'ABUJA'));
  const [discoOptions, setDiscoOptions] = useState<DiscoOption[]>(FALLBACK_DISCO_OPTIONS);
  const [meterType, setMeterType] = useState<MeterType>(initialType);
  const [meterNumber, setMeterNumber] = useState(params.get('meterNumber') ?? '');
  const [phone, setPhone] = useState(defaultPhone);
  const [amountInput, setAmountInput] = useState(params.get('amount') ?? '');
  const [lookup, setLookup] = useState<MeterLookup | null>(null);
  const [minVend, setMinVend] = useState<number | null>(null);
  const [maxVend, setMaxVend] = useState<number | null>(null);
  const [lookingUp, setLookingUp] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<{
    reference: string;
    status: string;
    token: string | null;
  } | null>(null);
  const verifyRequestRef = useRef(0);

  useEffect(() => {
    if (!phone && business?.phone) {
      setPhone(normalizeBusinessPhone(business.phone));
    }
  }, [business?.phone, phone]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const providers = await businessPaymentsApi.electricityProviders();
        if (cancelled) return;
        const next = normalizeElectricityDiscoMap(providers, DISCO_NAMES);
        if (next.length > 0) {
          setDiscoOptions(next);
          setDisco((current) => {
            const resolved = resolveDiscoCode(current);
            const match = next.find((item) => item.code === resolved && item.available);
            if (match) return match.code;
            const firstAvailable = next.find((item) => item.available);
            return firstAvailable?.code ?? resolved;
          });
        } else {
          setDiscoOptions(FALLBACK_DISCO_OPTIONS);
        }
      } catch {
        if (!cancelled) setDiscoOptions(FALLBACK_DISCO_OPTIONS);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const amountMin = minVend ?? ELECTRICITY_MIN;
  const amountMax = maxVend ?? ELECTRICITY_MAX;

  const amount = useMemo(() => {
    if (meterType === 'postpaid' && lookup?.outstanding) return lookup.outstanding;
    return Number(amountInput.replace(/,/g, '').trim()) || 0;
  }, [amountInput, lookup, meterType]);

  const phoneOk = isValidNigerianPhone(phone);

  const blockReason = getPaymentBlockReason({
    amount,
    balance: session.wallet.balance,
    frozen: session.frozen,
    todaySpend: session.todaySpend,
    dailyLimit: session.dailyLimit,
  });

  function clearLookup() {
    setLookup(null);
    setVerifyError(null);
    setMinVend(null);
    setMaxVend(null);
    setResult(null);
  }

  useEffect(() => {
    const digits = meterNumber.replace(/\D/g, '');
    if (digits.length < METER_VERIFY_MIN_DIGITS || !disco) {
      setLookingUp(false);
      return;
    }

    const requestId = ++verifyRequestRef.current;
    setLookingUp(true);
    setVerifyError(null);
    setLookup(null);
    setMinVend(null);
    setMaxVend(null);

    const timer = window.setTimeout(async () => {
      try {
        const raw = await businessPaymentsApi.verifyMeter({
          meter: digits,
          disco: disco.toUpperCase(),
          vendType: meterType.toUpperCase(),
        });
        if (requestId !== verifyRequestRef.current) return;
        const next = mapMeterLookup(raw, disco.toUpperCase(), meterType);
        const limits = readVendLimits(raw);
        setLookup(next);
        setMinVend(limits.minVend);
        setMaxVend(limits.maxVend);
        setVerifyError(null);
        if (next.meterType === 'postpaid' && next.outstanding) {
          setAmountInput(String(next.outstanding));
        }
      } catch (error) {
        if (requestId !== verifyRequestRef.current) return;
        setLookup(null);
        setMinVend(null);
        setMaxVend(null);
        setVerifyError(paymentErrorMessage(error, 'Could not verify meter'));
      } finally {
        if (requestId === verifyRequestRef.current) {
          setLookingUp(false);
        }
      }
    }, METER_VERIFY_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timer);
    };
  }, [disco, meterNumber, meterType]);

  const reset = () => {
    setView('form');
    setMeterNumber('');
    setAmountInput('');
    setLookup(null);
    setMinVend(null);
    setMaxVend(null);
    setVerifyError(null);
    setResult(null);
  };

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!lookup) {
      toast.error('Verify the meter before paying');
      return;
    }
    if (!phoneOk) {
      toast.error('Enter a valid Nigerian phone number for the receipt');
      return;
    }
    if (amount < amountMin || amount > amountMax) {
      toast.error(`Amount must be between ${formatPrice(amountMin)} and ${formatPrice(amountMax)}`);
      return;
    }
    if (blockReason) {
      toast.error(blockReason);
      return;
    }

    setPending(true);
    try {
      const data = await businessPaymentsApi.buyElectricity({
        meter: meterNumber.replace(/\D/g, ''),
        disco: disco.toUpperCase(),
        vendType: meterType === 'postpaid' ? 'POSTPAID' : 'PREPAID',
        amount,
        phone: normalizeBusinessPhone(phone),
        branchId: session.spendBranchId,
        walletId: session.spendWalletId,
      });
      const token =
        meterType === 'prepaid' && data.token != null && String(data.token).trim()
          ? String(data.token)
          : null;
      setResult({
        reference: data.reference,
        status: data.status,
        token,
      });
      setView(data.pending || data.status === 'pending' ? 'pending' : 'success');
      toast.success(
        data.pending || data.status === 'pending'
          ? 'Electricity payment is processing'
          : 'Electricity payment completed',
      );
      await session.refreshWallet?.();
    } catch (error) {
      setView('failed');
      toast.error(paymentErrorMessage(error, 'Electricity payment could not be completed'));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Electricity"
        description="Pay prepaid or postpaid disco bills for branch meters."
      />

      {view === 'success' && result ? (
        <PaymentSuccessView
          title="Electricity paid"
          description={`${formatPrice(amount)} has been paid to ${getProviderName('electricity', disco)}.`}
          reference={result.reference}
          rows={[
            { label: 'Disco', value: getProviderName('electricity', disco) },
            { label: 'Meter', value: meterNumber },
            { label: 'Customer', value: lookup?.customerName ?? '—' },
            { label: 'Type', value: meterType },
            { label: 'Amount', value: formatPrice(amount) },
            ...(result.token ? [{ label: 'Token', value: result.token }] : []),
            { label: 'Branch', value: session.selectedBranch?.branchName ?? '—' },
          ]}
          onAgain={reset}
          againLabel="Pay another meter"
        />
      ) : view === 'pending' && result ? (
        <PaymentSuccessView
          title="Electricity processing"
          description="Your payment is being confirmed with the disco. The wallet debit will be refunded automatically if it fails."
          reference={result.reference}
          rows={[
            { label: 'Disco', value: getProviderName('electricity', disco) },
            { label: 'Meter', value: meterNumber },
            { label: 'Customer', value: lookup?.customerName ?? '—' },
            { label: 'Amount', value: formatPrice(amount) },
            { label: 'Status', value: 'Pending confirmation' },
          ]}
          onAgain={reset}
          againLabel="Pay another meter"
        />
      ) : view === 'failed' ? (
        <PaymentFailedView
          message="The disco did not complete this vend. The meter details are still filled in so you can retry."
          onRetry={() => setView('form')}
        />
      ) : (
        <>
          <PaymentSourceCard
            label={session.wallet.label}
            balance={session.wallet.balance}
            branches={session.branches}
            branchId={session.branchId}
            onBranchChange={session.setBranchId}
            canChargeToBranch={session.canChargeToBranch}
            chargeToBranch={session.chargeToBranch}
            onChargeToBranchChange={session.setChargeToBranch}
            amount={amount}
            frozen={session.frozen}
            todaySpend={session.todaySpend}
            dailyLimit={session.dailyLimit}
          />

          <form onSubmit={handleSubmit} className="space-y-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <SavedBeneficiaryPicker
              service="electricity"
              beneficiaries={session.beneficiaries}
              selectedAccount={meterNumber}
              onSelect={(beneficiary) => {
                setMeterNumber(beneficiary.accountNumber);
                setDisco(resolveDiscoCode(beneficiary.provider));
                if (beneficiary.meterType) {
                  setMeterType(beneficiary.meterType);
                }
                clearLookup();
              }}
            />

            <ElectricityDiscoSelector
              discos={discoOptions}
              selectedCode={disco}
              onSelect={(code) => {
                setDisco(code.toUpperCase());
                clearLookup();
              }}
            />

            <div>
              <FieldLabel>Meter type</FieldLabel>
              <div className="mt-1.5 grid grid-cols-2 gap-2">
                {(['prepaid', 'postpaid'] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => {
                      setMeterType(type);
                      clearLookup();
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
              <FieldLabel htmlFor="meter-number">Meter number</FieldLabel>
              <div className="relative mt-1.5">
                <input
                  id="meter-number"
                  inputMode="numeric"
                  value={meterNumber}
                  onChange={(event) => {
                    setMeterNumber(event.target.value.replace(/[^\d]/g, ''));
                  }}
                  placeholder="45022530096"
                  className={cn(
                    fieldClass.replace('mt-1.5 ', ''),
                    lookup && 'border-green-500 focus:border-green-500 focus:ring-green-500/20',
                    verifyError && 'border-red-400 focus:border-red-400 focus:ring-red-400/20',
                  )}
                />
                <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs font-medium">
                  {lookingUp ? (
                    <span className="text-gray-500">Verifying…</span>
                  ) : lookup ? (
                    <span className="text-green-600">✓ Verified</span>
                  ) : null}
                </span>
              </div>
              <p className="mt-2 text-xs text-gray-500">
                Auto-verifies after {METER_VERIFY_MIN_DIGITS}+ digits (same as BelPower mobile).
              </p>
              {verifyError ? <p className="mt-2 text-xs text-red-600">{verifyError}</p> : null}
            </div>

            {lookup ? (
              <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-gray-800">
                <p className="font-semibold">Customer: {lookup.customerName}</p>
                <p className="mt-1 text-gray-600">{lookup.address}</p>
                {lookup.outstanding ? (
                  <p className="mt-1">Outstanding {formatPrice(lookup.outstanding)}</p>
                ) : null}
              </div>
            ) : null}

            <div>
              <FieldLabel htmlFor="electricity-phone">Contact phone</FieldLabel>
              <input
                id="electricity-phone"
                inputMode="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="0803 123 4567"
                className={fieldClass}
              />
              <p className="mt-1.5 text-xs text-gray-500">
                Used for the disco receipt. Defaults to your business phone when available.
              </p>
            </div>

            <div>
              <FieldLabel htmlFor="electricity-amount">
                {meterType === 'postpaid' ? 'Amount due (NGN)' : 'Amount (NGN)'}
              </FieldLabel>
              <input
                id="electricity-amount"
                inputMode="numeric"
                value={
                  meterType === 'postpaid' && lookup?.outstanding
                    ? String(lookup.outstanding)
                    : amountInput
                }
                onChange={(event) => setAmountInput(event.target.value)}
                readOnly={meterType === 'postpaid' && Boolean(lookup?.outstanding)}
                placeholder="5000"
                className={fieldClass}
              />
              <p className="mt-2 text-xs text-gray-500">
                Minimum {formatPrice(amountMin)} · Maximum {formatPrice(amountMax)}
              </p>
            </div>

            <ReviewList
              rows={[
                { label: 'Disco', value: getProviderName('electricity', disco) },
                { label: 'Meter', value: meterNumber || '—' },
                { label: 'Customer', value: lookup?.customerName ?? 'Not verified' },
                { label: 'Phone', value: phoneOk ? normalizeBusinessPhone(phone) : '—' },
                { label: 'Debit', value: amount ? formatPrice(amount) : '—' },
              ]}
            />

            <PayButton
              pending={pending}
              disabled={
                !lookup ||
                lookingUp ||
                !phoneOk ||
                amount < amountMin ||
                amount > amountMax ||
                Boolean(blockReason)
              }
              label={`Pay ${amount ? formatPrice(amount) : 'electricity'}`}
            />
          </form>
        </>
      )}
    </div>
  );
}

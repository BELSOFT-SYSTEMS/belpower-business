'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { PageHeader } from '@/components/business/PageHeader';
import { useBusinessAuth } from '@/context/BusinessAuthContext';
import {
  CABLE_PROVIDERS,
  getPaymentBlockReason,
  getProviderName,
  isValidNigerianPhone,
  type CableProviderId,
  type SmartcardLookup,
} from '@/data/mockPaymentCatalog';
import {
  businessPaymentsApi,
  cableToDisco,
  normalizeBusinessPhone,
  paymentErrorMessage,
  type BusinessCablePlan,
} from '@/lib/businessPaymentsApi';
import { formatPrice } from '@/utils/formatPrice';
import { cn } from '@/lib/utils';
import {
  FieldLabel,
  OptionPager,
  PayButton,
  PaymentFailedView,
  PaymentSourceCard,
  PaymentSuccessView,
  ProviderTiles,
  ReviewList,
  SavedBeneficiaryPicker,
  fieldClass,
  usePagedItems,
  usePaymentSession,
} from '@/components/business/payments/paymentShared';

type View = 'form' | 'success' | 'failed' | 'pending';

type NormalizedCablePlan = {
  key: string;
  name: string;
  amount: number;
  tariffClass: string;
};

const CABLE_PROVIDER_OPTIONS = CABLE_PROVIDERS.filter((item) => item.id !== 'showmax');

function normalizeCablePlan(plan: BusinessCablePlan): NormalizedCablePlan | null {
  const tariffClass = String(plan.tariffClass || plan.code || plan.id || '').trim();
  if (!tariffClass) return null;
  const amount = Number(plan.amount ?? plan.price ?? 0);
  if (!amount || amount <= 0) return null;
  return {
    key: tariffClass,
    name: String(plan.name || plan.description || tariffClass),
    amount,
    tariffClass,
  };
}

function mapSmartcardLookup(
  raw: Record<string, unknown>,
  provider: CableProviderId,
): SmartcardLookup {
  const customerName =
    (typeof raw.name === 'string' && raw.name.trim()) ||
    (typeof raw.customer_name === 'string' && raw.customer_name.trim()) ||
    (typeof raw.customerName === 'string' && raw.customerName.trim()) ||
    (typeof raw.CustomerName === 'string' && raw.CustomerName.trim()) ||
    'Customer';
  const currentPackage =
    (typeof raw.currentPackage === 'string' && raw.currentPackage) ||
    (typeof raw.current_bouquet === 'string' && raw.current_bouquet) ||
    (typeof raw.bouquet === 'string' && raw.bouquet) ||
    (typeof raw.package === 'string' && raw.package) ||
    null;
  return { customerName, provider, currentPackage };
}

export function CablePaymentFlow() {
  const params = useSearchParams();
  const session = usePaymentSession();
  const { business } = useBusinessAuth();
  const initialProviderRaw = params.get('provider')?.toLowerCase() || 'dstv';
  const initialProvider = (
    initialProviderRaw === 'showmax' ? 'dstv' : initialProviderRaw
  ) as CableProviderId;
  const defaultPhone = business?.phone ? normalizeBusinessPhone(business.phone) : '';
  const [view, setView] = useState<View>('form');
  const [provider, setProvider] = useState<CableProviderId>(initialProvider);
  const [smartCard, setSmartCard] = useState(params.get('smartCardNumber') ?? '');
  const [phone, setPhone] = useState(defaultPhone);
  const [packageKey, setPackageKey] = useState(params.get('package') ?? '');
  const [packages, setPackages] = useState<NormalizedCablePlan[]>([]);
  const [packagesLoading, setPackagesLoading] = useState(false);
  const [lookup, setLookup] = useState<SmartcardLookup | null>(null);
  const [lookingUp, setLookingUp] = useState(false);
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<{ reference: string; status: string } | null>(null);

  useEffect(() => {
    if (!phone && business?.phone) {
      setPhone(normalizeBusinessPhone(business.phone));
    }
  }, [business?.phone, phone]);

  const selectedPackage = packages.find((item) => item.key === packageKey) ?? null;
  const amount = selectedPackage?.amount ?? 0;
  const phoneOk = isValidNigerianPhone(phone);
  const {
    pageItems: visiblePackages,
    page: packagePage,
    pageCount: packagePageCount,
    setPage: setPackagePage,
  } = usePagedItems(packages, provider);

  const preferredPackage = params.get('package') ?? '';

  useEffect(() => {
    let cancelled = false;
    setPackagesLoading(true);
    setPackages([]);
    setPackageKey('');

    (async () => {
      try {
        const raw = await businessPaymentsApi.cablePlans(provider);
        if (cancelled) return;
        const next = raw
          .map(normalizeCablePlan)
          .filter((plan): plan is NormalizedCablePlan => Boolean(plan));
        setPackages(next);
        const match =
          (preferredPackage &&
            next.find(
              (plan) =>
                plan.key === preferredPackage ||
                plan.name.toLowerCase() === preferredPackage.toLowerCase(),
            )) ||
          next[0];
        setPackageKey(match?.key ?? '');
      } catch (error) {
        if (cancelled) return;
        setPackages([]);
        setPackageKey('');
        toast.error(paymentErrorMessage(error, 'Could not load cable packages'));
      } finally {
        if (!cancelled) setPackagesLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [provider, preferredPackage]);

  const blockReason = getPaymentBlockReason({
    amount,
    balance: session.wallet.balance,
    frozen: session.frozen,
    todaySpend: session.todaySpend,
    dailyLimit: session.dailyLimit,
  });

  const summary = useMemo(
    () => [
      { label: 'Provider', value: getProviderName('cable', provider) },
      { label: 'Smartcard', value: smartCard || '—' },
      { label: 'Customer', value: lookup?.customerName ?? 'Not verified' },
      { label: 'Package', value: selectedPackage?.name ?? '—' },
      { label: 'Phone', value: phoneOk ? normalizeBusinessPhone(phone) : '—' },
      { label: 'Debit', value: amount ? formatPrice(amount) : '—' },
    ],
    [amount, lookup, phone, phoneOk, provider, selectedPackage, smartCard],
  );

  async function handleLookup() {
    setLookingUp(true);
    try {
      const raw = await businessPaymentsApi.verifySmartcard({
        meter: smartCard.replace(/\D/g, ''),
        disco: cableToDisco(provider),
      });
      const next = mapSmartcardLookup(raw, provider);
      setLookup(next);
      if (next.currentPackage) {
        const match = packages.find(
          (item) =>
            item.name.toLowerCase() === next.currentPackage!.toLowerCase() ||
            item.key.toLowerCase() === next.currentPackage!.toLowerCase(),
        );
        if (match) setPackageKey(match.key);
      }
      toast.success('Smartcard verified');
    } catch (error) {
      setLookup(null);
      toast.error(paymentErrorMessage(error, 'Could not verify smartcard'));
    } finally {
      setLookingUp(false);
    }
  }

  const reset = () => {
    setView('form');
    setSmartCard('');
    setLookup(null);
    setResult(null);
  };

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!lookup) {
      toast.error('Verify the smartcard before paying');
      return;
    }
    if (!selectedPackage) {
      toast.error('Select a package');
      return;
    }
    if (!phoneOk) {
      toast.error('Enter a valid Nigerian phone number');
      return;
    }
    if (blockReason) {
      toast.error(blockReason);
      return;
    }

    setPending(true);
    try {
      const data = await businessPaymentsApi.buyCable({
        meter: smartCard.replace(/\D/g, ''),
        disco: cableToDisco(provider),
        tariffClass: selectedPackage.tariffClass,
        amount: selectedPackage.amount,
        phone: normalizeBusinessPhone(phone),
        branchId: session.spendBranchId,
        walletId: session.spendWalletId,
      });
      setResult({ reference: data.reference, status: data.status });
      setView(data.pending || data.status === 'pending' ? 'pending' : 'success');
      toast.success(
        data.pending || data.status === 'pending'
          ? 'Cable payment is processing'
          : 'Cable subscription paid successfully',
      );
      await session.refreshWallet?.();
    } catch (error) {
      setView('failed');
      toast.error(paymentErrorMessage(error, 'Cable payment could not be completed'));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Cable TV"
        description="Renew DStv, GOtv, and StarTimes for office locations."
      />

      {view === 'success' && result && selectedPackage ? (
        <PaymentSuccessView
          title="Subscription paid"
          description={`${selectedPackage.name} has been renewed for ${smartCard}.`}
          reference={result.reference}
          rows={[...summary, { label: 'Branch', value: session.selectedBranch?.branchName ?? '—' }]}
          onAgain={reset}
          againLabel="Pay another subscription"
        />
      ) : view === 'pending' && result && selectedPackage ? (
        <PaymentSuccessView
          title="Subscription processing"
          description="Your renewal is being confirmed with the provider. The wallet debit will be refunded automatically if it fails."
          reference={result.reference}
          rows={[
            ...summary,
            { label: 'Status', value: 'Pending confirmation' },
            { label: 'Branch', value: session.selectedBranch?.branchName ?? '—' },
          ]}
          onAgain={reset}
          againLabel="Pay another subscription"
        />
      ) : view === 'failed' ? (
        <PaymentFailedView
          message="The cable provider did not complete this renewal. The smartcard is still filled in so you can retry."
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
              service="cable"
              beneficiaries={session.beneficiaries}
              selectedAccount={smartCard}
              onSelect={(beneficiary) => {
                setSmartCard(beneficiary.accountNumber);
                const next = beneficiary.provider.toLowerCase() as CableProviderId;
                setProvider(next === 'showmax' ? 'dstv' : next);
                setLookup(null);
              }}
            />

            <div>
              <FieldLabel>Provider</FieldLabel>
              <ProviderTiles
                options={CABLE_PROVIDER_OPTIONS}
                value={provider}
                onChange={(id) => {
                  setProvider(id as CableProviderId);
                  setLookup(null);
                }}
              />
            </div>

            <div>
              <FieldLabel htmlFor="smartcard">Smartcard / IUC</FieldLabel>
              <div className="mt-1.5 flex gap-2">
                <input
                  id="smartcard"
                  inputMode="numeric"
                  value={smartCard}
                  onChange={(event) => {
                    setSmartCard(event.target.value);
                    setLookup(null);
                  }}
                  placeholder="7012345678"
                  className={fieldClass.replace('mt-1.5 ', '')}
                />
                <button
                  type="button"
                  onClick={handleLookup}
                  disabled={lookingUp || smartCard.trim().length < 10}
                  className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-800 hover:bg-gray-50 disabled:opacity-50"
                >
                  {lookingUp ? 'Checking…' : 'Verify'}
                </button>
              </div>
            </div>

            {lookup ? (
              <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-gray-800">
                <p className="font-semibold">{lookup.customerName}</p>
                {lookup.currentPackage ? (
                  <p className="mt-1 text-gray-600">Current package: {lookup.currentPackage}</p>
                ) : null}
              </div>
            ) : null}

            <div>
              <FieldLabel htmlFor="cable-phone">Contact phone</FieldLabel>
              <input
                id="cable-phone"
                inputMode="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="0803 123 4567"
                className={fieldClass}
              />
              <p className="mt-1.5 text-xs text-gray-500">
                Required by the cable provider. Defaults to your business phone when available.
              </p>
            </div>

            <div>
              <FieldLabel>Package</FieldLabel>
              {packagesLoading ? (
                <p className="mt-2 text-sm text-gray-500">Loading packages…</p>
              ) : packages.length === 0 ? (
                <p className="mt-2 text-sm text-gray-500">No packages available for this provider.</p>
              ) : (
                <>
                  <div className="mt-1.5 grid gap-2 sm:grid-cols-2">
                    {visiblePackages.map((item) => {
                      const selected = item.key === selectedPackage?.key;
                      return (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => setPackageKey(item.key)}
                          className={cn(
                            'rounded-xl border px-4 py-3 text-left',
                            selected
                              ? 'border-blue-normal bg-blue-50 ring-2 ring-blue-normal/20'
                              : 'border-gray-200 hover:border-gray-300',
                          )}
                        >
                          <p className="text-sm font-semibold text-gray-900">{item.name}</p>
                          <p className="mt-1 text-sm text-gray-600">{formatPrice(item.amount)}</p>
                        </button>
                      );
                    })}
                  </div>
                  <OptionPager
                    page={packagePage}
                    pageCount={packagePageCount}
                    onPageChange={setPackagePage}
                  />
                </>
              )}
            </div>

            <ReviewList rows={summary} />

            <PayButton
              pending={pending}
              disabled={
                !lookup || !selectedPackage || !phoneOk || packagesLoading || Boolean(blockReason)
              }
              label={`Pay ${amount ? formatPrice(amount) : 'subscription'}`}
            />
          </form>
        </>
      )}
    </div>
  );
}

'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { PageHeader } from '@/components/business/PageHeader';
import {
  CABLE_PROVIDERS,
  createPaymentReference,
  findCablePackage,
  getCablePackages,
  getPaymentBlockReason,
  getProviderName,
  mockCompletePayment,
  mockLookupSmartcard,
  type CableProviderId,
  type SmartcardLookup,
} from '@/data/mockPaymentCatalog';
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
  demoNote,
  fieldClass,
  usePagedItems,
  usePaymentSession,
} from '@/components/business/payments/paymentShared';

type View = 'form' | 'success' | 'failed';

export function CablePaymentFlow() {
  const params = useSearchParams();
  const session = usePaymentSession();
  const initialProvider = (params.get('provider')?.toLowerCase() as CableProviderId) || 'dstv';
  const [view, setView] = useState<View>('form');
  const [provider, setProvider] = useState<CableProviderId>(initialProvider);
  const [smartCard, setSmartCard] = useState(params.get('smartCardNumber') ?? '');
  const [packageId, setPackageId] = useState(
    () =>
      findCablePackage(params.get('package') ?? '', initialProvider)?.id ??
      getCablePackages(initialProvider)[0]?.id ??
      '',
  );
  const [lookup, setLookup] = useState<SmartcardLookup | null>(null);
  const [lookingUp, setLookingUp] = useState(false);
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<{ reference: string } | null>(null);

  const packages = getCablePackages(provider);
  const selectedPackage = packages.find((item) => item.id === packageId) ?? null;
  const amount = selectedPackage?.amount ?? 0;
  const {
    pageItems: visiblePackages,
    page: packagePage,
    pageCount: packagePageCount,
    setPage: setPackagePage,
  } = usePagedItems(packages, provider);

  useEffect(() => {
    setPackageId((current) => {
      const nextPackages = getCablePackages(provider);
      if (current && nextPackages.some((item) => item.id === current)) return current;
      return nextPackages[0]?.id ?? '';
    });
  }, [provider]);

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
      { label: 'Debit', value: amount ? formatPrice(amount) : '—' },
    ],
    [amount, lookup, provider, selectedPackage, smartCard],
  );

  async function handleLookup() {
    setLookingUp(true);
    try {
      const next = await mockLookupSmartcard(smartCard, provider);
      setLookup(next);
      if (next.currentPackage) {
        const match = findCablePackage(next.currentPackage, provider);
        if (match) setPackageId(match.id);
      }
      toast.success('Smartcard verified');
    } catch (error) {
      setLookup(null);
      toast.error(error instanceof Error ? error.message : 'Could not verify smartcard');
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
    if (blockReason) {
      toast.error(blockReason);
      return;
    }

    setPending(true);
    try {
      await mockCompletePayment();
      setResult({ reference: createPaymentReference('CBL') });
      setView('success');
      toast.success('Cable subscription paid (demo)');
    } catch {
      setView('failed');
      toast.error('Cable payment could not be completed');
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Cable TV"
        description="Renew DStv, GOtv, StarTimes, and Showmax for office locations."
      />

      {view === 'success' && result && selectedPackage ? (
        <PaymentSuccessView
          title="Subscription paid"
          description={`${selectedPackage.name} has been renewed for ${smartCard} (demo).`}
          reference={result.reference}
          rows={[...summary, { label: 'Branch', value: session.selectedBranch?.branchName ?? '—' }]}
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
                setProvider(beneficiary.provider.toLowerCase() as CableProviderId);
                setLookup(null);
              }}
            />

            <div>
              <FieldLabel>Provider</FieldLabel>
              <ProviderTiles
                options={CABLE_PROVIDERS}
                value={provider}
                onChange={(id) => {
                  setProvider(id as CableProviderId);
                  setPackageId('');
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
              <FieldLabel>Package</FieldLabel>
              <div className="mt-1.5 grid gap-2 sm:grid-cols-2">
                {visiblePackages.map((item) => {
                  const selected = item.id === selectedPackage?.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setPackageId(item.id)}
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
            </div>

            <ReviewList rows={summary} />

            <PayButton
              pending={pending}
              disabled={!lookup || !selectedPackage || Boolean(blockReason)}
              label={`Pay ${amount ? formatPrice(amount) : 'subscription'}`}
            />
          </form>
          {demoNote()}
        </>
      )}
    </div>
  );
}

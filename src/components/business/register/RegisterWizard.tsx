'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { OtpInput } from '@/components/business/register/OtpInput';
import { PasswordFieldWithRequirements } from '@/components/business/PasswordFieldWithRequirements';
import { PasswordInput } from '@/components/business/PasswordInput';
import { getElectricityProviderOptions } from '@/constants/discoNames';
import { isBusinessPasswordValid, validateBusinessPassword } from '@/constants/passwordPolicy';
import {
  DEMO_EMAIL_OTP,
  isMeterNumberLongEnough,
  METER_MIN_LENGTH,
  mockSendEmailOtp,
  mockVerifyEmailOtp,
  mockVerifyMeter,
  normalizeMeterNumber,
} from '@/data/mockRegisterFlow';
import { useBusinessAuth } from '@/context/BusinessAuthContext';
import { BusinessSelect } from '@/components/business/BusinessSelect';
import { cn } from '@/lib/utils';

const STEPS = [
  { id: 1, label: 'Meter verification' },
  { id: 2, label: 'Business details' },
  { id: 3, label: 'Account details' },
  { id: 4, label: 'Password' },
  { id: 5, label: 'Terms' },
] as const;

const electricityProviders = getElectricityProviderOptions();

const inputClassName =
  'w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-blue-normal focus:ring-2 focus:ring-blue-normal/20';

type RegisterWizardProps = {
  onComplete?: () => void;
};

export function RegisterWizard({ onComplete }: RegisterWizardProps) {
  const router = useRouter();
  const { signInMock } = useBusinessAuth();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  const [disco, setDisco] = useState('');
  const [meterType, setMeterType] = useState<'PREPAID' | 'POSTPAID' | ''>('');
  const [meterNumber, setMeterNumber] = useState('');
  const [meterVerified, setMeterVerified] = useState(false);
  const [meterVerifying, setMeterVerifying] = useState(false);
  const [meterError, setMeterError] = useState<string | null>(null);
  const [verificationId, setVerificationId] = useState('');

  const [businessName, setBusinessName] = useState('');
  const [businessEmail, setBusinessEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [emailOtpSending, setEmailOtpSending] = useState(false);
  const [emailOtpVerifying, setEmailOtpVerifying] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [emailOtp, setEmailOtp] = useState('');
  const [emailOtpError, setEmailOtpError] = useState<string | null>(null);
  const lastOtpEmailRef = useRef('');

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const meterVerifyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const emailOtpSendTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const emailOtpVerifyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const passwordMismatch = useMemo(() => {
    if (confirmPassword && password !== confirmPassword) {
      return 'Passwords do not match.';
    }
    return null;
  }, [password, confirmPassword]);

  const runMeterVerification = useCallback(
    async (number: string, selectedDisco: string, selectedType: string) => {
      if (!isMeterNumberLongEnough(number) || !selectedDisco || !selectedType) {
        return;
      }

      setMeterVerifying(true);
      setMeterError(null);
      setMeterVerified(false);

      try {
        const result = await mockVerifyMeter(number, selectedDisco, selectedType);
        setMeterVerified(true);
        setVerificationId(result.verificationId);
        setAddress(result.address);
        setBusinessName((current) => current.trim() || result.customerName);
        toast.success('Meter verified (demo).');
      } catch (error) {
        setMeterVerified(false);
        setMeterError(error instanceof Error ? error.message : 'Meter verification failed.');
      } finally {
        setMeterVerifying(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (meterVerifyTimeoutRef.current) {
      clearTimeout(meterVerifyTimeoutRef.current);
    }

    const readyToVerify =
      isMeterNumberLongEnough(meterNumber) && Boolean(disco) && Boolean(meterType);

    if (readyToVerify) {
      meterVerifyTimeoutRef.current = setTimeout(() => {
        runMeterVerification(meterNumber, disco, meterType);
      }, 1000);
    } else {
      setMeterVerified(false);
      setMeterVerifying(false);
      if (meterNumber && !isMeterNumberLongEnough(meterNumber)) {
        setMeterError(null);
      }
    }

    return () => {
      if (meterVerifyTimeoutRef.current) {
        clearTimeout(meterVerifyTimeoutRef.current);
      }
    };
  }, [meterNumber, disco, meterType, runMeterVerification]);

  const sendEmailOtp = useCallback(async (email: string) => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return;
    }

    setEmailOtpSending(true);
    setEmailOtpError(null);

    try {
      await mockSendEmailOtp(email);
      setEmailOtpSent(true);
      setEmailVerified(false);
      setEmailOtp('');
      lastOtpEmailRef.current = email;
      toast.success(`OTP sent (demo). Use ${DEMO_EMAIL_OTP}.`);
    } catch (error) {
      setEmailOtpSent(false);
      setEmailOtpError(error instanceof Error ? error.message : 'Could not send OTP.');
    } finally {
      setEmailOtpSending(false);
    }
  }, []);

  useEffect(() => {
    if (emailOtpSendTimeoutRef.current) {
      clearTimeout(emailOtpSendTimeoutRef.current);
    }

    if (!businessEmail.trim()) {
      setEmailOtpSent(false);
      setEmailVerified(false);
      setEmailOtp('');
      lastOtpEmailRef.current = '';
      return;
    }

    if (businessEmail !== lastOtpEmailRef.current) {
      setEmailVerified(false);
      setEmailOtp('');
    }

    emailOtpSendTimeoutRef.current = setTimeout(() => {
      sendEmailOtp(businessEmail.trim());
    }, 800);

    return () => {
      if (emailOtpSendTimeoutRef.current) {
        clearTimeout(emailOtpSendTimeoutRef.current);
      }
    };
  }, [businessEmail, sendEmailOtp]);

  useEffect(() => {
    if (emailOtpVerifyTimeoutRef.current) {
      clearTimeout(emailOtpVerifyTimeoutRef.current);
    }

    if (emailOtp.length !== 6 || emailVerified || emailOtpVerifying) {
      return;
    }

    emailOtpVerifyTimeoutRef.current = setTimeout(async () => {
      setEmailOtpVerifying(true);
      setEmailOtpError(null);

      try {
        await mockVerifyEmailOtp(businessEmail.trim(), emailOtp);
        setEmailVerified(true);
        toast.success('Business email verified.');
      } catch (error) {
        setEmailVerified(false);
        setEmailOtpError(error instanceof Error ? error.message : 'Invalid OTP.');
        setEmailOtp('');
      } finally {
        setEmailOtpVerifying(false);
      }
    }, 300);

    return () => {
      if (emailOtpVerifyTimeoutRef.current) {
        clearTimeout(emailOtpVerifyTimeoutRef.current);
      }
    };
  }, [businessEmail, emailOtp, emailVerified, emailOtpVerifying]);

  const canContinueStep1 =
    meterVerified &&
    disco &&
    meterType &&
    isMeterNumberLongEnough(meterNumber) &&
    !meterVerifying;

  const canContinueStep2 =
    businessName.trim().length >= 2 &&
    businessEmail.trim().length > 0 &&
    emailVerified &&
    phone.trim().length >= 10 &&
    address.trim().length >= 5;

  const canContinueStep3 = firstName.trim().length >= 2 && lastName.trim().length >= 2;

  const canContinueStep4 =
    isBusinessPasswordValid(password) && password === confirmPassword && !passwordMismatch;

  const handleFinish = async () => {
    if (!agreedToTerms) {
      toast.error('Please accept the terms to continue.');
      return;
    }

    const errors = validateBusinessPassword(password);
    if (errors.length) {
      toast.error(errors[0]);
      setStep(4);
      return;
    }

    setSubmitting(true);
    toast.success('Business registered (demo). You are now Super Admin at Head Office.');
    signInMock('super_admin');
    onComplete?.();
    router.push('/business');
    setSubmitting(false);
  };

  const goNext = () => setStep((current) => Math.min(current + 1, STEPS.length));
  const goBack = () => setStep((current) => Math.max(current - 1, 1));

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center justify-between gap-2">
          {STEPS.map((item) => (
            <div key={item.id} className="flex flex-1 flex-col items-center gap-2">
              <div
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition',
                  step > item.id
                    ? 'bg-green-100 text-green-700'
                    : step === item.id
                      ? 'bg-blue-normal text-white'
                      : 'bg-gray-100 text-gray-500',
                )}
              >
                {step > item.id ? <Check className="h-4 w-4" aria-hidden /> : item.id}
              </div>
              <span
                className={cn(
                  'hidden text-center text-[10px] leading-tight sm:block',
                  step === item.id ? 'font-medium text-gray-900' : 'text-gray-500',
                )}
              >
                {item.label}
              </span>
            </div>
          ))}
        </div>
        <p className="mt-4 text-sm text-gray-500">
          Step {step} of {STEPS.length}: {STEPS[step - 1]?.label}
        </p>
      </div>

      <div className="space-y-6">
        {step === 1 ? (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Verify head office meter</h3>
              <p className="mt-1 text-sm text-gray-600">
                Link your business to a verified electricity meter before registration.
              </p>
            </div>

            <div>
              <label htmlFor="disco" className="mb-1.5 block text-sm font-medium text-gray-700">
                Distribution company (DISCO)
              </label>
              <BusinessSelect
                id="disco"
                value={disco}
                onChange={(nextDisco) => {
                  setDisco(nextDisco);
                  setMeterVerified(false);
                }}
                placeholder="Select disco"
                options={electricityProviders.map((provider) => ({
                  value: provider.code,
                  label: provider.name,
                }))}
              />
            </div>

            <div>
              <label htmlFor="meterType" className="mb-1.5 block text-sm font-medium text-gray-700">
                Meter type
              </label>
              <BusinessSelect
                id="meterType"
                value={meterType}
                onChange={(nextType) => {
                  setMeterType(nextType as 'PREPAID' | 'POSTPAID' | '');
                  setMeterVerified(false);
                }}
                placeholder="Select meter type"
                options={[
                  { value: 'PREPAID', label: 'Prepaid' },
                  { value: 'POSTPAID', label: 'Postpaid' },
                ]}
              />
            </div>

            <div>
              <label htmlFor="meterNumber" className="mb-1.5 block text-sm font-medium text-gray-700">
                Meter number
              </label>
              <input
                id="meterNumber"
                value={meterNumber}
                onChange={(event) => {
                  setMeterNumber(normalizeMeterNumber(event.target.value));
                  setMeterVerified(false);
                  setMeterError(null);
                }}
                placeholder="Enter meter number"
                inputMode="numeric"
                className={cn(
                  inputClassName,
                  meterVerified && 'border-green-400 focus:border-green-500 focus:ring-green-500/20',
                  meterError && 'border-red-400',
                )}
              />
              <div className="mt-2 flex items-center gap-2 text-sm">
                {meterVerifying ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-blue-normal" aria-hidden />
                    <span className="text-gray-600">Verifying meter…</span>
                  </>
                ) : meterVerified ? (
                  <span className="font-medium text-green-700">Meter verified</span>
                ) : (
                  <span className="text-gray-500">
                    Verification runs when you stop typing ({METER_MIN_LENGTH}+ digits).
                  </span>
                )}
              </div>
              {meterError ? <p className="mt-1 text-sm text-red-normal">{meterError}</p> : null}
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Business details</h3>
              <p className="mt-1 text-sm text-gray-600">
                Verify your business email, then complete the remaining company information.
              </p>
            </div>

            <div>
              <label htmlFor="businessEmail" className="mb-1.5 block text-sm font-medium text-gray-700">
                Business email
              </label>
              <input
                id="businessEmail"
                type="email"
                value={businessEmail}
                onChange={(event) => setBusinessEmail(event.target.value.trim())}
                placeholder="company@example.com"
                className={cn(
                  inputClassName,
                  emailVerified && 'border-green-400 focus:border-green-500 focus:ring-green-500/20',
                )}
              />
              <div className="mt-2 text-sm text-gray-500">
                {emailOtpSending ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-blue-normal" aria-hidden />
                    Sending OTP…
                  </span>
                ) : emailVerified ? (
                  <span className="font-medium text-green-700">Email verified</span>
                ) : emailOtpSent ? (
                  <span>Enter the 6-digit code sent to your email.</span>
                ) : (
                  <span>OTP will be sent when you enter a valid email.</span>
                )}
              </div>
            </div>

            {emailOtpSent && !emailVerified ? (
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Email verification code</label>
                <OtpInput
                  value={emailOtp}
                  onChange={setEmailOtp}
                  error={emailOtpError}
                  disabled={emailOtpVerifying}
                />
                {emailOtpVerifying ? (
                  <p className="mt-2 inline-flex items-center gap-2 text-sm text-gray-600">
                    <Loader2 className="h-4 w-4 animate-spin text-blue-normal" aria-hidden />
                    Verifying OTP…
                  </p>
                ) : null}
                <p className="mt-2 text-xs text-gray-500">Demo OTP: {DEMO_EMAIL_OTP}</p>
              </div>
            ) : null}

            <div>
              <label htmlFor="businessName" className="mb-1.5 block text-sm font-medium text-gray-700">
                Business name
              </label>
              <input
                id="businessName"
                value={businessName}
                onChange={(event) => setBusinessName(event.target.value)}
                placeholder="Registered business name"
                className={inputClassName}
              />
            </div>

            <div>
              <label htmlFor="phone" className="mb-1.5 block text-sm font-medium text-gray-700">
                Business phone
              </label>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value.replace(/\D/g, '').slice(0, 11))}
                placeholder="08012345678"
                className={inputClassName}
              />
            </div>

            <div>
              <label htmlFor="address" className="mb-1.5 block text-sm font-medium text-gray-700">
                Head office address
              </label>
              <textarea
                id="address"
                rows={2}
                value={address}
                readOnly
                placeholder="Verified from your meter"
                className={`${inputClassName} cursor-not-allowed bg-gray-50 text-gray-600`}
              />
              <p className="mt-1.5 text-xs text-gray-500">Auto-filled from meter verification.</p>
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Super Admin account</h3>
              <p className="mt-1 text-sm text-gray-600">
                The first user becomes Super Admin at Head Office with full business access.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="firstName" className="mb-1.5 block text-sm font-medium text-gray-700">
                  First name
                </label>
                <input
                  id="firstName"
                  value={firstName}
                  onChange={(event) => setFirstName(event.target.value)}
                  placeholder="First name"
                  className={inputClassName}
                />
              </div>
              <div>
                <label htmlFor="lastName" className="mb-1.5 block text-sm font-medium text-gray-700">
                  Last name
                </label>
                <input
                  id="lastName"
                  value={lastName}
                  onChange={(event) => setLastName(event.target.value)}
                  placeholder="Last name"
                  className={inputClassName}
                />
              </div>
            </div>

            <p className="text-sm text-gray-600">
              Account email:{' '}
              <span className="font-medium text-gray-900">{businessEmail || '—'}</span>
            </p>
          </div>
        ) : null}

        {step === 4 ? (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Create password</h3>
              <p className="mt-1 text-sm text-gray-600">
                Set a secure password for your Super Admin account.
              </p>
            </div>

            <PasswordFieldWithRequirements
              id="register-password"
              label="Password"
              value={password}
              onChange={setPassword}
              placeholder="Create a strong password"
              autoComplete="new-password"
              required
              minLength={8}
            />
            <PasswordInput
              id="register-confirm-password"
              label="Confirm password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              placeholder="Re-enter password"
              autoComplete="new-password"
              required
              minLength={8}
            />
            {passwordMismatch ? (
              <p className="text-sm text-red-normal" role="alert">
                {passwordMismatch}
              </p>
            ) : null}
          </div>
        ) : null}

        {step === 5 ? (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Terms & conditions</h3>
              <p className="mt-1 text-sm text-gray-600">
                Review and accept the BelPower Business terms before creating your account.
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm leading-relaxed text-gray-600">
              <p>
                By creating a BelPower Business account, you agree to our Terms of Use and Privacy
                Policy. You confirm that you are authorized to register this business and manage
                utility payments on its behalf.
              </p>
              <p className="mt-3">
                Meter verification ID:{' '}
                <span className="font-mono text-gray-800">{verificationId || '—'}</span>
              </p>
            </div>

            <label className="flex items-start gap-3 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(event) => setAgreedToTerms(event.target.checked)}
                className="mt-1 rounded border-gray-300"
              />
              <span>
                I agree to the BelPower Business{' '}
                <Link href="#" className="font-medium text-blue-normal hover:underline">
                  Terms of Use
                </Link>{' '}
                and{' '}
                <Link href="#" className="font-medium text-blue-normal hover:underline">
                  Privacy Policy
                </Link>
                .
              </span>
            </label>
          </div>
        ) : null}
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        {step > 1 ? (
          <button
            type="button"
            onClick={goBack}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
            Back
          </button>
        ) : null}

        {step < 5 ? (
          <button
            type="button"
            disabled={
              (step === 1 && !canContinueStep1) ||
              (step === 2 && !canContinueStep2) ||
              (step === 3 && !canContinueStep3) ||
              (step === 4 && !canContinueStep4)
            }
            onClick={goNext}
            className="flex-1 rounded-xl bg-blue-normal py-3 text-sm font-semibold text-white hover:bg-blue-normal-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            Continue
          </button>
        ) : (
          <button
            type="button"
            disabled={!agreedToTerms || submitting}
            onClick={handleFinish}
            className="flex-1 rounded-xl bg-blue-normal py-3 text-sm font-semibold text-white hover:bg-blue-normal-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? 'Creating account…' : 'Create business account'}
          </button>
        )}
      </div>

      <p className="mt-4 text-center text-xs text-gray-500">
        Demo mode — registration runs locally until the API is connected.
      </p>
    </div>
  );
}

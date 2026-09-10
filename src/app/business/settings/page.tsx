'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { BusinessFormModal } from '@/components/business/BusinessFormModal';
import { PageHeader } from '@/components/business/PageHeader';
import { OtpInput } from '@/components/business/register/OtpInput';
import { useBusinessAuth } from '@/context/BusinessAuthContext';
import { getMockDashboardForRole } from '@/data/businessMocks';
import {
  DEMO_EMAIL_OTP,
  DEMO_PHONE_OTP,
  mockSendEmailOtp,
  mockSendPhoneOtp,
  mockVerifyEmailOtp,
  mockVerifyPhoneOtp,
} from '@/data/mockRegisterFlow';
import { isValidNigerianPhone, normalizePhone } from '@/data/mockPaymentCatalog';
import { cn } from '@/lib/utils';

type ContactField = 'email' | 'phone';

const readonlyFieldClass =
  'w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600';
const editableFieldClass =
  'w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-blue-normal focus:ring-2 focus:ring-blue-normal/20';

function formatDisplayPhone(value: string): string {
  const phone = normalizePhone(value);
  if (phone.length === 11) {
    return `${phone.slice(0, 4)} ${phone.slice(4, 7)} ${phone.slice(7)}`;
  }
  return value;
}

export default function BusinessSettingsPage() {
  const { user, demoRole, business } = useBusinessAuth();
  const role = user?.role ?? demoRole;
  const mockBusiness = business ?? getMockDashboardForRole(role).business;

  const [logoUrl, setLogoUrl] = useState(mockBusiness.logoUrl ?? '/belsoft-logo-2.jpg');
  const [email, setEmail] = useState(mockBusiness.email);
  const [phone, setPhone] = useState(mockBusiness.phone);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [changeField, setChangeField] = useState<ContactField | null>(null);
  const [draftValue, setDraftValue] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);

  useEffect(() => {
    setLogoUrl(mockBusiness.logoUrl ?? '/belsoft-logo-2.jpg');
    setEmail(mockBusiness.email);
    setPhone(mockBusiness.phone);
  }, [mockBusiness.email, mockBusiness.logoUrl, mockBusiness.phone]);

  const resetChangeFlow = () => {
    setChangeField(null);
    setDraftValue('');
    setOtp('');
    setOtpSent(false);
    setSendingOtp(false);
    setVerifyingOtp(false);
    setOtpError(null);
  };

  const openChange = (field: ContactField) => {
    setChangeField(field);
    setDraftValue(field === 'email' ? email : normalizePhone(phone));
    setOtp('');
    setOtpSent(false);
    setOtpError(null);
  };

  const handleLogoPick = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Choose an image file for the logo');
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setLogoUrl((previous) => {
      if (previous.startsWith('blob:')) URL.revokeObjectURL(previous);
      return objectUrl;
    });
    toast.success('Logo updated (demo)');
    event.target.value = '';
  };

  const handleSendOtp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!changeField || sendingOtp || verifyingOtp) return;

    setOtpError(null);

    if (changeField === 'email') {
      const nextEmail = draftValue.trim().toLowerCase();
      if (nextEmail === email.toLowerCase()) {
        toast.error('Enter a new email address');
        return;
      }
      setSendingOtp(true);
      try {
        await mockSendEmailOtp(nextEmail);
        setDraftValue(nextEmail);
        setOtpSent(true);
        setOtp('');
        toast.success(`Verification code sent to ${nextEmail} (demo)`);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Could not send code');
      } finally {
        setSendingOtp(false);
      }
      return;
    }

    const nextPhone = normalizePhone(draftValue);
    if (!isValidNigerianPhone(nextPhone)) {
      toast.error('Enter a valid Nigerian phone number');
      return;
    }
    if (nextPhone === normalizePhone(phone)) {
      toast.error('Enter a new phone number');
      return;
    }

    setSendingOtp(true);
    try {
      await mockSendPhoneOtp(nextPhone);
      setDraftValue(nextPhone);
      setOtpSent(true);
      setOtp('');
      toast.success(`Verification code sent to ${formatDisplayPhone(nextPhone)} (demo)`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not send code');
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyOtp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!changeField || !otpSent || verifyingOtp) return;

    if (otp.length < 6) {
      setOtpError('Enter the 6-digit verification code');
      return;
    }

    setOtpError(null);
    setVerifyingOtp(true);

    try {
      if (changeField === 'email') {
        await mockVerifyEmailOtp(draftValue, otp);
        setEmail(draftValue);
        toast.success('Contact email updated (demo)');
      } else {
        await mockVerifyPhoneOtp(draftValue, otp);
        setPhone(formatDisplayPhone(draftValue));
        toast.success('Phone number updated (demo)');
      }
      resetChangeFlow();
    } catch (error) {
      setOtpError(error instanceof Error ? error.message : 'Invalid verification code');
    } finally {
      setVerifyingOtp(false);
    }
  };

  const demoOtp = changeField === 'email' ? DEMO_EMAIL_OTP : DEMO_PHONE_OTP;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Business settings"
        description="Company details are fixed. You can update logo, email, and phone — email and phone require verification."
      />

      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Company profile</h2>

        <div className="mb-6 flex items-center gap-4">
          <Image
            src={logoUrl}
            alt="Business logo"
            width={64}
            height={64}
            className="rounded-xl border border-gray-200 object-contain p-1"
            unoptimized={logoUrl.startsWith('blob:')}
          />
          <div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Change logo
            </button>
            <p className="mt-1.5 text-xs text-gray-500">PNG or JPG. Updates immediately (demo).</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleLogoPick}
            />
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Business ID</label>
            <input readOnly value={mockBusiness.businessId} className={readonlyFieldClass} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Business name</label>
            <input readOnly value={mockBusiness.businessName} className={readonlyFieldClass} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Address</label>
            <textarea
              readOnly
              rows={2}
              value={mockBusiness.address}
              className={cn(readonlyFieldClass, 'resize-none')}
            />
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between gap-3">
              <label className="block text-sm font-medium text-gray-700">Contact email</label>
              <button
                type="button"
                onClick={() => openChange('email')}
                className="text-sm font-medium text-blue-normal hover:text-blue-normal-hover"
              >
                Change
              </button>
            </div>
            <input readOnly value={email} className={readonlyFieldClass} />
            <p className="mt-1.5 text-xs text-gray-500">Requires email verification to update.</p>
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between gap-3">
              <label className="block text-sm font-medium text-gray-700">Phone</label>
              <button
                type="button"
                onClick={() => openChange('phone')}
                className="text-sm font-medium text-blue-normal hover:text-blue-normal-hover"
              >
                Change
              </button>
            </div>
            <input readOnly value={phone} className={readonlyFieldClass} />
            <p className="mt-1.5 text-xs text-gray-500">Requires SMS verification to update.</p>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Notifications</h2>
        <div className="space-y-3">
          {[
            'Email me when wallet is funded',
            'Email me on failed transactions',
            'Notify team on large payments (> ₦100,000)',
          ].map((label) => (
            <label key={label} className="flex items-center gap-3 text-sm text-gray-700">
              <input
                type="checkbox"
                defaultChecked
                className="rounded border-gray-300"
              />
              {label}
            </label>
          ))}
        </div>
      </section>

      <BusinessFormModal
        open={changeField !== null && !otpSent}
        title={changeField === 'email' ? 'Change contact email' : 'Change phone number'}
        description={
          changeField === 'email'
            ? 'Enter the new email. We will send a verification code before updating.'
            : 'Enter the new phone number. We will send an SMS code before updating.'
        }
        submitLabel={sendingOtp ? 'Sending…' : 'Send verification code'}
        submitting={sendingOtp}
        onClose={resetChangeFlow}
        onSubmit={handleSendOtp}
      >
        {changeField === 'email' ? (
          <input
            required
            type="email"
            value={draftValue}
            onChange={(event) => setDraftValue(event.target.value)}
            placeholder="new@company.com"
            className={editableFieldClass}
            autoFocus
          />
        ) : (
          <input
            required
            type="tel"
            inputMode="numeric"
            value={draftValue}
            onChange={(event) => setDraftValue(event.target.value.replace(/\D/g, '').slice(0, 11))}
            placeholder="08012345678"
            className={editableFieldClass}
            autoFocus
          />
        )}
      </BusinessFormModal>

      <BusinessFormModal
        open={changeField !== null && otpSent}
        title="Verify change"
        description={
          changeField === 'email'
            ? `Enter the 6-digit code sent to ${draftValue}.`
            : `Enter the 6-digit code sent to ${formatDisplayPhone(draftValue)}.`
        }
        submitLabel={verifyingOtp ? 'Verifying…' : 'Confirm change'}
        submitting={verifyingOtp}
        onClose={resetChangeFlow}
        onSubmit={handleVerifyOtp}
      >
        <OtpInput value={otp} onChange={setOtp} error={otpError} disabled={verifyingOtp} />
        {verifyingOtp ? (
          <p className="inline-flex items-center gap-2 text-sm text-gray-600">
            <Loader2 className="h-4 w-4 animate-spin text-blue-normal" aria-hidden />
            Verifying…
          </p>
        ) : (
          <p className="text-xs text-gray-500">Demo OTP: {demoOtp}</p>
        )}
      </BusinessFormModal>
    </div>
  );
}

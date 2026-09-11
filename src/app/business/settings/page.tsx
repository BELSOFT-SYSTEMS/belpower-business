'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { BusinessAvatar } from '@/components/business/BusinessAvatar';
import { BusinessFormModal } from '@/components/business/BusinessFormModal';
import { PageHeader } from '@/components/business/PageHeader';
import { OtpInput } from '@/components/business/register/OtpInput';
import { useBusinessAuth } from '@/context/BusinessAuthContext';
import { PasswordFieldWithRequirements } from '@/components/business/PasswordFieldWithRequirements';
import { PasswordInput } from '@/components/business/PasswordInput';
import { isBusinessPasswordValid } from '@/constants/passwordPolicy';
import { businessAuthApi, BusinessApiError } from '@/lib/businessApi';
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
  const { business, canAccess, refreshMe } = useBusinessAuth();
  const canManageCompany = canAccess('business.settings.manage');

  const [logoUrl, setLogoUrl] = useState<string | null>(business?.logoUrl ?? null);
  const [email, setEmail] = useState(business?.email ?? '');
  const [phone, setPhone] = useState(business?.phone ?? '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [changeField, setChangeField] = useState<ContactField | null>(null);
  const [draftValue, setDraftValue] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [devOtpHint, setDevOtpHint] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);

  useEffect(() => {
    setLogoUrl(business?.logoUrl ?? null);
    setEmail(business?.email ?? '');
    setPhone(business?.phone ?? '');
  }, [business?.email, business?.logoUrl, business?.phone]);

  const resetChangeFlow = () => {
    setChangeField(null);
    setDraftValue('');
    setOtp('');
    setOtpSent(false);
    setSendingOtp(false);
    setVerifyingOtp(false);
    setOtpError(null);
    setDevOtpHint(null);
  };

  const openChange = (field: ContactField) => {
    setChangeField(field);
    setDraftValue(field === 'email' ? email : normalizePhone(phone));
    setOtp('');
    setOtpSent(false);
    setOtpError(null);
    setDevOtpHint(null);
  };

  const handleLogoPick = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!canManageCompany) return;
    const file = event.target.files?.[0];
    if (!file) return;

    const mime = String(file.type || '').toLowerCase();
    if (mime !== 'image/png' && mime !== 'image/jpeg' && mime !== 'image/jpg') {
      toast.error('Logo must be a PNG or JPG image');
      event.target.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Logo is too large. Max size is 5MB.');
      event.target.value = '';
      return;
    }

    try {
      const updated = await businessAuthApi.uploadLogo(file);
      setLogoUrl(updated.logoUrl || null);
      toast.success('Logo updated');
      await refreshMe();
    } catch (error) {
      toast.error(
        error instanceof BusinessApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : 'Could not upload logo',
      );
    } finally {
      event.target.value = '';
    }
  };

  const handleUpdatePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!isBusinessPasswordValid(newPassword)) {
      toast.error('New password does not meet requirements');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setUpdatingPassword(true);
    try {
      await businessAuthApi.updatePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast.success('Password updated');
    } catch (error) {
      toast.error(
        error instanceof BusinessApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : 'Could not update password',
      );
    } finally {
      setUpdatingPassword(false);
    }
  };

  const handleSendOtp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!changeField || sendingOtp || verifyingOtp) return;

    setOtpError(null);
    setDevOtpHint(null);

    if (changeField === 'email') {
      const nextEmail = draftValue.trim().toLowerCase();
      if (nextEmail === email.toLowerCase()) {
        toast.error('Enter a new email address');
        return;
      }
      setSendingOtp(true);
      try {
        const result = await businessAuthApi.sendContactEmailOtp(nextEmail);
        setDraftValue(nextEmail);
        setOtpSent(true);
        setOtp('');
        if (result.otp) setDevOtpHint(result.otp);
        toast.success(`Verification code sent to ${nextEmail}`);
      } catch (error) {
        toast.error(
          error instanceof BusinessApiError
            ? error.message
            : error instanceof Error
              ? error.message
              : 'Could not send code',
        );
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
      const result = await businessAuthApi.sendContactPhoneOtp(nextPhone);
      setDraftValue(nextPhone);
      setOtpSent(true);
      setOtp('');
      if (result.otp) setDevOtpHint(result.otp);
      toast.success(`Verification code sent to ${formatDisplayPhone(nextPhone)}`);
    } catch (error) {
      toast.error(
        error instanceof BusinessApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : 'Could not send code',
      );
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
        const updated = await businessAuthApi.verifyContactEmail(draftValue, otp);
        setEmail(updated.email);
        toast.success('Contact email updated');
      } else {
        const updated = await businessAuthApi.verifyContactPhone(draftValue, otp);
        setPhone(formatDisplayPhone(updated.phone));
        toast.success('Phone number updated');
      }
      await refreshMe();
      resetChangeFlow();
    } catch (error) {
      setOtpError(
        error instanceof BusinessApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : 'Invalid verification code',
      );
    } finally {
      setVerifyingOtp(false);
    }
  };

  if (!business) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <PageHeader title="Business settings" description="Loading company profile…" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Business settings"
        description={
          canManageCompany
            ? 'Company details are fixed except logo, email, and phone. You can also update your password.'
            : 'View company details and update your own password.'
        }
      />

      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Company profile</h2>

        <div className="mb-6 flex items-center gap-4">
          <BusinessAvatar
            name={business.businessName}
            logoUrl={logoUrl}
            size={64}
            className="shrink-0"
          />
          {canManageCompany ? (
            <div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Change logo
              </button>
              <p className="mt-1.5 text-xs text-gray-500">PNG or JPG, max 5MB. Stored in Sanity.</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg"
                className="hidden"
                onChange={handleLogoPick}
              />
            </div>
          ) : null}
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Business ID</label>
            <input readOnly value={business.businessId} className={readonlyFieldClass} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Business name</label>
            <input readOnly value={business.businessName} className={readonlyFieldClass} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Address</label>
            <textarea
              readOnly
              rows={2}
              value={business.address}
              className={cn(readonlyFieldClass, 'resize-none')}
            />
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between gap-3">
              <label className="block text-sm font-medium text-gray-700">Contact email</label>
              {canManageCompany ? (
                <button
                  type="button"
                  onClick={() => openChange('email')}
                  className="text-sm font-medium text-blue-normal hover:text-blue-normal-hover"
                >
                  Change
                </button>
              ) : null}
            </div>
            <input readOnly value={email} className={readonlyFieldClass} />
            {canManageCompany ? (
              <p className="mt-1.5 text-xs text-gray-500">Requires email verification to update.</p>
            ) : null}
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between gap-3">
              <label className="block text-sm font-medium text-gray-700">Phone</label>
              {canManageCompany ? (
                <button
                  type="button"
                  onClick={() => openChange('phone')}
                  className="text-sm font-medium text-blue-normal hover:text-blue-normal-hover"
                >
                  Change
                </button>
              ) : null}
            </div>
            <input readOnly value={phone} className={readonlyFieldClass} />
            {canManageCompany ? (
              <p className="mt-1.5 text-xs text-gray-500">Requires SMS verification to update.</p>
            ) : null}
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-1 text-lg font-semibold text-gray-900">Security</h2>
        <p className="mb-4 text-sm text-gray-500">Update the password for your own account.</p>
        <form onSubmit={handleUpdatePassword} className="space-y-4">
          <PasswordInput
            id="current-password"
            label="Current password"
            value={currentPassword}
            onChange={setCurrentPassword}
            placeholder="Enter current password"
            autoComplete="current-password"
            required
          />
          <PasswordFieldWithRequirements
            id="settings-new-password"
            label="New password"
            value={newPassword}
            onChange={setNewPassword}
            placeholder="Min. 8 characters"
            autoComplete="new-password"
            required
            minLength={8}
          />
          <PasswordInput
            id="settings-confirm-password"
            label="Confirm new password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            placeholder="Re-enter new password"
            autoComplete="new-password"
            required
            minLength={8}
          />
          {confirmPassword && newPassword !== confirmPassword ? (
            <p className="text-sm text-red-normal" role="alert">
              Passwords do not match.
            </p>
          ) : null}
          <button
            type="submit"
            disabled={
              updatingPassword ||
              !currentPassword ||
              !isBusinessPasswordValid(newPassword) ||
              newPassword !== confirmPassword
            }
            className="rounded-xl bg-blue-normal px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-normal-hover disabled:opacity-60"
          >
            {updatingPassword ? 'Updating…' : 'Update password'}
          </button>
        </form>
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
              <input type="checkbox" defaultChecked className="rounded border-gray-300" />
              {label}
            </label>
          ))}
        </div>
      </section>

      <BusinessFormModal
        open={canManageCompany && changeField !== null && !otpSent}
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
        open={canManageCompany && changeField !== null && otpSent}
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
        ) : devOtpHint ? (
          <p className="text-xs text-gray-500">Dev OTP: {devOtpHint}</p>
        ) : null}
      </BusinessFormModal>
    </div>
  );
}

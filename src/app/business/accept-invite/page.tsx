'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { PasswordFieldWithRequirements } from '@/components/business/PasswordFieldWithRequirements';
import { PasswordInput } from '@/components/business/PasswordInput';
import { isBusinessPasswordValid, validateBusinessPassword } from '@/constants/passwordPolicy';
import { formatAdminRoleLabel } from '@/utils/businessRoleDisplay';
import { BusinessApiError } from '@/lib/businessApi';
import { businessTeamApi, type InvitePreview } from '@/lib/businessTeamApi';
import type { BusinessRole } from '@/types/business';

function AcceptInviteForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [preview, setPreview] = useState<InvitePreview | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(Boolean(token));
  const [submitting, setSubmitting] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    if (!token) {
      setPreviewError('Missing invite token. Open the link from your invitation email.');
      setLoadingPreview(false);
      return;
    }
    let cancelled = false;
    setLoadingPreview(true);
    void (async () => {
      try {
        const data = await businessTeamApi.invitePreview(token);
        if (!cancelled) {
          setPreview(data);
          setPreviewError(null);
        }
      } catch (error) {
        if (!cancelled) {
          setPreviewError(
            error instanceof BusinessApiError
              ? error.message
              : 'Invalid or expired invite link',
          );
        }
      } finally {
        if (!cancelled) setLoadingPreview(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const passwordMismatch = useMemo(() => {
    if (confirmPassword && password !== confirmPassword) {
      return 'Passwords do not match.';
    }
    return null;
  }, [password, confirmPassword]);

  const canSubmit =
    Boolean(token) &&
    Boolean(preview) &&
    isBusinessPasswordValid(password) &&
    password === confirmPassword &&
    !submitting;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const firstName = String(form.get('firstName') ?? '').trim();
    const lastName = String(form.get('lastName') ?? '').trim();
    const errors = validateBusinessPassword(password);
    if (errors.length) {
      toast.error(errors[0]);
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }
    setSubmitting(true);
    try {
      await businessTeamApi.acceptInvite({
        token,
        firstName,
        lastName,
        password,
      });
      toast.success('Invite accepted. Sign in to continue.');
      router.push('/business/sign-in');
    } catch (error) {
      toast.error(error instanceof BusinessApiError ? error.message : 'Could not accept invite');
    } finally {
      setSubmitting(false);
    }
  };

  const roleLabel = preview?.role
    ? formatAdminRoleLabel(preview.role as BusinessRole)
    : 'team member';

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-6 py-12">
      <div className="mx-auto w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Image src="/belpower_full.png" alt="BelPower" width={160} height={48} className="h-10 w-auto" />
        </div>

        <h1 className="text-2xl font-semibold text-gray-900">Accept invitation</h1>

        {loadingPreview ? (
          <p className="mt-2 text-sm text-gray-600">Loading invitation…</p>
        ) : previewError ? (
          <p className="mt-2 text-sm text-red-600">{previewError}</p>
        ) : (
          <p className="mt-2 text-sm text-gray-600">
            You&apos;ve been invited to join BelPower Business as{' '}
            <span className="font-medium">{roleLabel}</span>
            {preview?.branchName ? (
              <>
                {' '}
                at <span className="font-medium">{preview.branchName}</span>
              </>
            ) : null}
            .
          </p>
        )}

        {preview && !previewError ? (
          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Email</label>
              <input
                readOnly
                value={preview.email}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="firstName" className="mb-1.5 block text-sm font-medium text-gray-700">
                  First name
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  required
                  defaultValue={preview.firstName && preview.firstName !== 'Invited' ? preview.firstName : ''}
                  placeholder="First name"
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-blue-normal focus:ring-2 focus:ring-blue-normal/20"
                />
              </div>
              <div>
                <label htmlFor="lastName" className="mb-1.5 block text-sm font-medium text-gray-700">
                  Last name
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  required
                  defaultValue={preview.lastName && preview.lastName !== 'User' ? preview.lastName : ''}
                  placeholder="Last name"
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-blue-normal focus:ring-2 focus:ring-blue-normal/20"
                />
              </div>
            </div>
            <PasswordFieldWithRequirements
              id="password"
              label="Create password"
              value={password}
              onChange={setPassword}
              placeholder="Create a strong password"
              autoComplete="new-password"
              required
              minLength={8}
            />
            <PasswordInput
              id="confirm-password"
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
            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full rounded-xl bg-blue-normal py-3 text-sm font-semibold text-white hover:bg-blue-normal-hover disabled:opacity-60"
            >
              {submitting ? 'Creating account…' : 'Accept & create account'}
            </button>
          </form>
        ) : null}

        <p className="mt-6 text-center text-sm text-gray-500">
          Already have an account?{' '}
          <Link href="/business/sign-in" className="font-medium text-blue-normal hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function BusinessAcceptInvitePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-sm text-gray-500">
          Loading invitation…
        </div>
      }
    >
      <AcceptInviteForm />
    </Suspense>
  );
}

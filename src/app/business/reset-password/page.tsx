'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { PasswordFieldWithRequirements } from '@/components/business/PasswordFieldWithRequirements';
import { PasswordInput } from '@/components/business/PasswordInput';
import { isBusinessPasswordValid } from '@/constants/passwordPolicy';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const email = searchParams.get('email') ?? '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const tokenMissing = !token.trim();

  const passwordMismatch = useMemo(() => {
    if (confirmPassword && password !== confirmPassword) {
      return 'Passwords do not match.';
    }
    return null;
  }, [password, confirmPassword]);

  const canSubmit =
    !tokenMissing &&
    isBusinessPasswordValid(password) &&
    password === confirmPassword &&
    !submitting;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    toast.success('Password updated (demo). Sign in with your new password.');
    router.push('/business/sign-in');
    setSubmitting(false);
  };

  return (
    <div className="flex min-h-screen bg-white">
      <div className="auth-hero-panel relative hidden min-h-screen w-1/2 overflow-hidden bg-linear-to-br from-blue-normal via-blue-dark to-blue-darker p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="auth-hero-blob1" aria-hidden />
        <div className="auth-hero-blob2" aria-hidden />
        <div className="relative z-10">
          <Image src="/transparent_belpower.png" alt="BelPower" width={160} height={48} />
          <h1 className="mt-10 text-3xl font-semibold">Choose a new password</h1>
          <p className="mt-4 max-w-md text-blue-light">
            Create a strong password for your business account. You&apos;ll sign in again with your
            new credentials.
          </p>
        </div>
        <p className="relative z-10 text-xs text-blue-light/80">
          &copy; {new Date().getFullYear()} BelPower. All rights reserved. · Powered by{' '}
          <a
            href="https://belsoftsystems.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white underline-offset-2 hover:underline"
          >
            Belsoft Systems Ltd
          </a>
        </p>
      </div>

      <div className="flex w-full flex-col justify-center px-6 py-12 lg:w-1/2 lg:px-16">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-8">
            <div className="-mt-2.5 mb-6 flex justify-center">
              <Image
                src="/belpower_full.png"
                alt="BelPower"
                width={160}
                height={48}
                priority
                className="h-10 w-auto"
              />
            </div>

            {tokenMissing ? (
              <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
                <h2 className="text-xl font-semibold text-gray-900">Invalid reset link</h2>
                <p className="mt-2 text-sm text-gray-600">
                  This password reset link is missing or expired. Request a new one from the sign-in
                  page.
                </p>
                <Link
                  href="/business/forgot-password"
                  className="mt-6 inline-block text-sm font-medium text-blue-normal hover:underline"
                >
                  Request new link
                </Link>
              </div>
            ) : (
              <>
                <h2 className="text-2xl font-semibold text-gray-900">Reset password</h2>
                <p className="mt-2 text-sm text-gray-600">
                  {email ? (
                    <>
                      Set a new password for{' '}
                      <span className="font-medium text-gray-900">{email}</span>.
                    </>
                  ) : (
                    'Enter your new password below.'
                  )}
                </p>

                <form onSubmit={handleSubmit} className="mt-8 space-y-4">
                  <PasswordFieldWithRequirements
                    id="new-password"
                    label="New password"
                    value={password}
                    onChange={setPassword}
                    placeholder="Min. 8 characters"
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
                    className="w-full rounded-xl bg-blue-normal px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-normal-hover disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submitting ? 'Updating…' : 'Update password'}
                  </button>
                  <p className="text-center text-xs text-gray-500">
                    Mock flow — password is not saved until the API is connected.
                  </p>
                </form>

                <p className="mt-6 text-center text-sm text-gray-500">
                  <Link href="/business/sign-in" className="font-medium text-blue-normal hover:underline">
                    Back to sign in
                  </Link>
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BusinessResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-sm text-gray-500">
          Loading…
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}

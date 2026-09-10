'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';
import { businessAuthApi, BusinessApiError } from '@/lib/businessApi';

export default function BusinessForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await businessAuthApi.forgotPassword(email.trim());
      setSubmitted(true);
      toast.success('If an account exists, a reset link has been sent');
    } catch (error) {
      toast.error(
        error instanceof BusinessApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : 'Could not send reset link',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-white">
      <div className="auth-hero-panel relative hidden min-h-screen w-1/2 overflow-hidden bg-linear-to-br from-blue-normal via-blue-dark to-blue-darker p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="auth-hero-blob1" aria-hidden />
        <div className="auth-hero-blob2" aria-hidden />
        <div className="relative z-10">
          <Image src="/transparent_belpower.png" alt="BelPower" width={160} height={48} />
          <h1 className="mt-10 text-3xl font-semibold">Reset your password</h1>
          <p className="mt-4 max-w-md text-blue-light">
            Enter the email linked to your business account. We&apos;ll send a secure link to choose
            a new password.
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

            {submitted ? (
              <div className="rounded-xl border border-green-200 bg-green-light/30 p-6 text-center">
                <h2 className="text-xl font-semibold text-gray-900">Check your email</h2>
                <p className="mt-2 text-sm text-gray-600">
                  If an account exists for <span className="font-medium">{email}</span>, we sent a
                  reset link. The link expires in 15 minutes.
                </p>
                <p className="mt-4">
                  <Link
                    href="/business/sign-in"
                    className="text-sm font-medium text-blue-normal hover:underline"
                  >
                    Back to sign in
                  </Link>
                </p>
              </div>
            ) : (
              <>
                <h2 className="text-2xl font-semibold text-gray-900">Forgot password?</h2>
                <p className="mt-2 text-sm text-gray-600">
                  Enter your work email and we&apos;ll send a link to reset your password.
                </p>

                <form onSubmit={handleSubmit} className="mt-8 space-y-4">
                  <div>
                    <label
                      htmlFor="reset-email"
                      className="mb-1.5 block text-sm font-medium text-gray-700"
                    >
                      Work email
                    </label>
                    <input
                      id="reset-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@company.com"
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-normal focus:ring-2 focus:ring-blue-normal/20"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full rounded-xl bg-blue-normal px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-normal-hover disabled:opacity-60"
                  >
                    {submitting ? 'Sending…' : 'Send reset link'}
                  </button>
                </form>

                <p className="mt-6 text-center text-sm text-gray-500">
                  Remember your password?{' '}
                  <Link href="/business/sign-in" className="font-medium text-blue-normal hover:underline">
                    Sign in
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

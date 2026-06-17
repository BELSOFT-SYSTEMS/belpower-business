'use client';

import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

type OtpInputProps = {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  error?: string | null;
  disabled?: boolean;
};

export function OtpInput({
  length = 6,
  value,
  onChange,
  error,
  disabled = false,
}: OtpInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!error && value.length === 0) {
      inputRefs.current[0]?.focus();
    }
  }, [error, value.length]);

  const handleKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace' && !event.currentTarget.value && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleInput = (index: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const digit = event.target.value.replace(/\D/g, '').slice(-1);
    const digits = value.padEnd(length, ' ').split('');
    digits[index] = digit;
    const next = digits.join('').replace(/\s/g, '').slice(0, length);
    onChange(next);

    if (digit && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  return (
    <div>
      <div className="flex gap-2">
        {Array.from({ length }).map((_, index) => (
          <input
            key={index}
            ref={(element) => {
              inputRefs.current[index] = element;
            }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={value[index] ?? ''}
            disabled={disabled}
            aria-label={`OTP digit ${index + 1}`}
            className={cn(
              'h-12 w-11 rounded-xl border text-center text-lg font-semibold outline-none transition focus:border-blue-normal focus:ring-2 focus:ring-blue-normal/20',
              error ? 'border-red-400' : 'border-gray-300',
              disabled && 'cursor-not-allowed bg-gray-50 opacity-70',
            )}
            onKeyDown={(event) => handleKeyDown(index, event)}
            onChange={(event) => handleInput(index, event)}
          />
        ))}
      </div>
      {error ? <p className="mt-2 text-sm text-red-normal">{error}</p> : null}
    </div>
  );
}

'use client';

import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { applyOtpDigitInput } from '@/lib/otpInput';

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

  const applyInput = (index: number, rawValue: string) => {
    const { value: nextValue, focusIndex } = applyOtpDigitInput(value, rawValue, index, length);
    onChange(nextValue);
    if (nextValue) {
      inputRefs.current[focusIndex]?.focus();
    }
  };

  const handleKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace' && !value[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
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
            maxLength={length}
            value={value[index] ?? ''}
            disabled={disabled}
            autoComplete={index === 0 ? 'one-time-code' : 'off'}
            aria-label={`OTP digit ${index + 1}`}
            className={cn(
              'h-12 w-11 rounded-xl border text-center text-lg font-semibold outline-none transition focus:border-blue-normal focus:ring-2 focus:ring-blue-normal/20',
              error ? 'border-red-400' : 'border-gray-300',
              disabled && 'cursor-not-allowed bg-gray-50 opacity-70',
            )}
            onKeyDown={(event) => handleKeyDown(index, event)}
            onChange={(event) => applyInput(index, event.target.value)}
            onPaste={(event) => {
              event.preventDefault();
              applyInput(index, event.clipboardData.getData('text'));
            }}
          />
        ))}
      </div>
      {error ? <p className="mt-2 text-sm text-red-normal">{error}</p> : null}
    </div>
  );
}

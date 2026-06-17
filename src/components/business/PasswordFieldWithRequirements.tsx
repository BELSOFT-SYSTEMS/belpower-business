'use client';

import { useState } from 'react';
import { PasswordInput } from '@/components/business/PasswordInput';
import { PasswordRequirementsHint } from '@/components/business/PasswordRequirementsHint';

type PasswordFieldWithRequirementsProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoComplete?: string;
  required?: boolean;
  minLength?: number;
};

export function PasswordFieldWithRequirements({
  value,
  ...props
}: PasswordFieldWithRequirementsProps) {
  const [focused, setFocused] = useState(false);

  return (
    <div className="space-y-2">
      <PasswordInput
        {...props}
        value={value}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
      {focused ? <PasswordRequirementsHint password={value} /> : null}
    </div>
  );
}

import { Check } from 'lucide-react';
import { getPasswordRequirementChecks } from '@/constants/passwordPolicy';
import { cn } from '@/lib/utils';

type PasswordRequirementsHintProps = {
  password?: string;
};

export function PasswordRequirementsHint({ password = '' }: PasswordRequirementsHintProps) {
  const checks = getPasswordRequirementChecks(password);
  const hasInput = password.length > 0;
  const allMet = checks.every((check) => check.met);
  const anyFailed = hasInput && checks.some((check) => !check.met);

  return (
    <div
      className={cn(
        'rounded-xl border px-4 py-3 transition-colors',
        allMet && hasInput
          ? 'border-green-200 bg-green-50'
          : anyFailed
            ? 'border-red-200 bg-red-50'
            : 'border-gray-200 bg-gray-50',
      )}
      aria-live="polite"
    >
      <p
        className={cn(
          'text-xs font-semibold uppercase tracking-wide',
          allMet && hasInput ? 'text-green-700' : anyFailed ? 'text-red-700' : 'text-gray-600',
        )}
      >
        Password requirements
      </p>

      <ul className="mt-2 space-y-1.5">
        {checks.map((check) => (
          <li key={check.id} className="flex items-start gap-2 text-xs leading-snug">
            {check.met ? (
              <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-600" aria-hidden />
            ) : (
              <span
                className={cn(
                  'mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full',
                  hasInput ? 'bg-red-400' : 'bg-gray-300',
                )}
                aria-hidden
              />
            )}
            <span
              className={cn(
                check.met
                  ? 'text-green-700'
                  : hasInput
                    ? 'text-red-700'
                    : 'text-gray-600',
              )}
            >
              {check.label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

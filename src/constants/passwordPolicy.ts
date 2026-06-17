/** Mirrors belpower-back `utils/passwordValidator.js` for Phase 1 UI. */

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;
export const PASSWORD_SPECIAL_CHARS = '@$!%*?&';
export const PASSWORD_POLICY_SHORT = `${PASSWORD_MIN_LENGTH}+ characters with uppercase, lowercase, a number, and ${PASSWORD_SPECIAL_CHARS.split('').join(' ')}`;

export const PASSWORD_POLICY_EXTRA =
  'Avoid common words, sequences (123, abc), and 3+ repeated characters. Max 128 characters.';

export type PasswordRequirementCheck = {
  id: string;
  label: string;
  met: boolean;
};

export function getPasswordRequirementChecks(password: string): PasswordRequirementCheck[] {
  return [
    {
      id: 'length',
      label: `${PASSWORD_MIN_LENGTH}–${PASSWORD_MAX_LENGTH} characters`,
      met: password.length >= PASSWORD_MIN_LENGTH && password.length <= PASSWORD_MAX_LENGTH,
    },
    {
      id: 'uppercase',
      label: 'One uppercase letter (A–Z)',
      met: /[A-Z]/.test(password),
    },
    {
      id: 'lowercase',
      label: 'One lowercase letter (a–z)',
      met: /[a-z]/.test(password),
    },
    {
      id: 'number',
      label: 'One number (0–9)',
      met: /\d/.test(password),
    },
    {
      id: 'special',
      label: `One special character (${PASSWORD_SPECIAL_CHARS.split('').join(' ')})`,
      met: /[@$!%*?&]/.test(password),
    },
    {
      id: 'charset',
      label: 'Only letters, numbers, and @ $ ! % * ? &',
      met: password.length > 0 && /^[A-Za-z\d@$!%*?&]+$/.test(password),
    },
    {
      id: 'forbidden',
      label: 'No common or brand-related words',
      met: password.length > 0 && !hasForbiddenPattern(password),
    },
    {
      id: 'sequences',
      label: 'No sequences (123, abc)',
      met: password.length > 0 && !hasSequences(password),
    },
    {
      id: 'repeats',
      label: 'No 3+ repeated characters in a row',
      met: password.length > 0 && !hasRepeats(password),
    },
  ];
}

const FORBIDDEN_PATTERNS = [
  'password',
  '123456',
  'qwerty',
  'admin',
  'user',
  'test',
  'bel',
  'power',
];

function hasSequences(password: string): boolean {
  const lower = password.toLowerCase();
  for (let i = 0; i < lower.length - 2; i++) {
    const c1 = lower.charCodeAt(i);
    const c2 = lower.charCodeAt(i + 1);
    const c3 = lower.charCodeAt(i + 2);
    if ((c2 === c1 + 1 && c3 === c2 + 1) || (c2 === c1 - 1 && c3 === c2 - 1)) {
      return true;
    }
  }
  return false;
}

function hasRepeats(password: string): boolean {
  return /(.)\1{2,}/.test(password);
}

function hasForbiddenPattern(password: string): boolean {
  const lower = password.toLowerCase();
  return FORBIDDEN_PATTERNS.some((pattern) => lower.includes(pattern));
}

export function validateBusinessPassword(password: string): string[] {
  const errors: string[] = [];

  if (!password) {
    return ['Password is required'];
  }
  if (password.length < PASSWORD_MIN_LENGTH) {
    errors.push(`Password must be at least ${PASSWORD_MIN_LENGTH} characters long`);
  }
  if (password.length > PASSWORD_MAX_LENGTH) {
    errors.push(`Password must not exceed ${PASSWORD_MAX_LENGTH} characters`);
  }
  if (!/[A-Z]/.test(password)) errors.push('Include at least one uppercase letter');
  if (!/[a-z]/.test(password)) errors.push('Include at least one lowercase letter');
  if (!/\d/.test(password)) errors.push('Include at least one number');
  if (!/[@$!%*?&]/.test(password)) {
    errors.push(`Include at least one special character (${PASSWORD_SPECIAL_CHARS})`);
  }
  if (!/^[A-Za-z\d@$!%*?&]+$/.test(password)) {
    errors.push('Use only letters, numbers, and @ $ ! % * ? &');
  }
  if (hasForbiddenPattern(password)) {
    errors.push('Avoid common or brand-related words in your password');
  }
  if (hasSequences(password)) {
    errors.push('Avoid sequential characters (e.g. 123 or abc)');
  }
  if (hasRepeats(password)) {
    errors.push('Avoid three or more repeated characters in a row');
  }

  return [...new Set(errors)];
}

export function isBusinessPasswordValid(password: string): boolean {
  return validateBusinessPassword(password).length === 0;
}

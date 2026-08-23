export function parseOtpDigits(raw: string, length: number): string {
  return raw.replace(/\D/g, '').slice(0, length);
}

export function applyOtpDigitInput(
  current: string,
  raw: string,
  index: number,
  length: number
): { value: string; focusIndex: number } {
  const digits = parseOtpDigits(raw, length);

  if (!digits) {
    const slots = Array.from({ length }, (_, i) => current[i] ?? '');
    slots[index] = '';
    return { value: slots.join('').replace(/\s/g, ''), focusIndex: index };
  }

  if (digits.length > 1) {
    return {
      value: digits,
      focusIndex: Math.min(digits.length, length - 1),
    };
  }

  const slots = Array.from({ length }, (_, i) => current[i] ?? '');
  slots[index] = digits;

  return {
    value: slots.join('').replace(/\s/g, ''),
    focusIndex: index < length - 1 ? index + 1 : index,
  };
}

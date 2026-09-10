/** Phase 1 demo helpers for business registration wizard. */

export const DEMO_EMAIL_OTP = '123456';
export const METER_MIN_LENGTH = 10;
export const METER_MAX_LENGTH = 15;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function normalizeMeterNumber(value: string): string {
  return value.replace(/\D/g, '').slice(0, METER_MAX_LENGTH);
}

export function isMeterNumberLongEnough(value: string): boolean {
  return normalizeMeterNumber(value).length >= METER_MIN_LENGTH;
}

export type MockMeterVerificationResult = {
  verificationId: string;
  address: string;
  customerName: string;
};

export async function mockVerifyMeter(
  meterNumber: string,
  disco: string,
  meterType: string,
): Promise<MockMeterVerificationResult> {
  await delay(900);

  if (!isMeterNumberLongEnough(meterNumber)) {
    throw new Error(`Enter a valid meter number (at least ${METER_MIN_LENGTH} digits).`);
  }

  if (!disco || !meterType) {
    throw new Error('Select your disco and meter type.');
  }

  return {
    verificationId: `demo-verification-${meterNumber.slice(-6)}`,
    address: `12 Head Office Avenue, ${disco.replace(/_/g, ' ')}, Nigeria`,
    customerName: 'Demo Business Customer',
  };
}

export async function mockSendEmailOtp(email: string): Promise<void> {
  await delay(700);

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('Enter a valid business email address.');
  }
}

export async function mockVerifyEmailOtp(email: string, otp: string): Promise<void> {
  await delay(500);

  if (!email) {
    throw new Error('Business email is required.');
  }

  if (otp !== DEMO_EMAIL_OTP) {
    throw new Error(`Invalid OTP. Demo code is ${DEMO_EMAIL_OTP}.`);
  }
}

export const DEMO_PHONE_OTP = '123456';

export async function mockSendPhoneOtp(phone: string): Promise<void> {
  await delay(700);

  const digits = phone.replace(/\D/g, '');
  const normalized =
    digits.startsWith('234') && digits.length === 13 ? `0${digits.slice(3)}` : digits;

  if (!/^0[7-9]\d{9}$/.test(normalized)) {
    throw new Error('Enter a valid Nigerian phone number (e.g. 08012345678).');
  }
}

export async function mockVerifyPhoneOtp(phone: string, otp: string): Promise<void> {
  await delay(500);

  if (!phone) {
    throw new Error('Business phone is required.');
  }

  if (otp !== DEMO_PHONE_OTP) {
    throw new Error(`Invalid OTP. Demo code is ${DEMO_PHONE_OTP}.`);
  }
}

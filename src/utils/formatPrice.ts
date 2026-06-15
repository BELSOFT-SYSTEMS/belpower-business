export const formatPrice = (amount: number | string | null | undefined): string => {
  const value = typeof amount === 'string' ? parseFloat(amount) : amount ?? 0;
  if (!Number.isFinite(value)) return '₦0.00';

  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 2,
  }).format(value);
};

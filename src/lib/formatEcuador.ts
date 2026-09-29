export const ECUADOR_PHONE_PREFIX = '+593';
export const ECUADOR_MOBILE_PLACEHOLDER = '+593 9XX XXX XXX';

export const normalizeEcuadorPhone = (phone: string) => {
  let digits = phone.replace(/\D/g, '');

  if (digits.startsWith('593')) {
    digits = digits.slice(3);
  } else if (digits.startsWith('0')) {
    digits = digits.slice(1);
  }

  return digits ? `${ECUADOR_PHONE_PREFIX}${digits}` : '';
};

export const isValidEcuadorMobile = (phone: string) => {
  const normalized = normalizeEcuadorPhone(phone).replace('+', '');
  return /^5939\d{8}$/.test(normalized);
};

export const formatEcuadorPhone = (phone: string) => {
  const normalized = normalizeEcuadorPhone(phone).replace('+', '').replace(/^593/, '');

  if (normalized.length === 9) {
    return `${ECUADOR_PHONE_PREFIX} ${normalized.slice(0, 2)} ${normalized.slice(2, 5)} ${normalized.slice(5)}`;
  }

  if (normalized.length === 8) {
    return `${ECUADOR_PHONE_PREFIX} ${normalized.slice(0, 1)} ${normalized.slice(1, 4)} ${normalized.slice(4)}`;
  }

  return normalized ? `${ECUADOR_PHONE_PREFIX} ${normalized}` : '';
};

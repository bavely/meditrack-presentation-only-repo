/**
 * Redacts an email so that only the first and last character
 * of the local‐part are visible, e.g. "johndoe@example.com" → "j*****e@example.com"
 *
 * @param email - The email address to redact
 * @returns the redacted email
 */
export function redactEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!domain) {
    // not a valid email, just return as-is
    return email;
  }

  // if local part is too short, just mask it entirely
  if (local.length <= 2) {
    return '*'.repeat(local.length) + '@' + domain;
  }

  const firstChar = local[0];
  const lastChar = local[local.length - 1];
  const numMask = local.length - 2;
  const maskedMiddle = '*'.repeat(numMask);

  return `${firstChar}${maskedMiddle}${lastChar}@${domain}`;
}

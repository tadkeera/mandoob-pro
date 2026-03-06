// Per-user signature storage
const SIGNATURE_PREFIX = 'bilquis-signature-';

export function saveSignature(dataUrl: string, userId?: string): void {
  const key = userId ? `${SIGNATURE_PREFIX}${userId}` : `${SIGNATURE_PREFIX}default`;
  localStorage.setItem(key, dataUrl);
}

export function getSignature(userId?: string): string | null {
  const key = userId ? `${SIGNATURE_PREFIX}${userId}` : `${SIGNATURE_PREFIX}default`;
  return localStorage.getItem(key);
}

export function deleteSignature(userId?: string): void {
  const key = userId ? `${SIGNATURE_PREFIX}${userId}` : `${SIGNATURE_PREFIX}default`;
  localStorage.removeItem(key);
}

const DEFAULT_AUTH_REDIRECT = '/dashboard';

/**
 * Accept only same-origin relative redirects. This prevents auth pages from
 * becoming open redirects while preserving deep links like /dashboard/orders.
 */
export function getSafeRedirect(value: string | null, fallback = DEFAULT_AUTH_REDIRECT): string {
  if (!value) return fallback;

  const trimmedValue = value.trim();

  if (!trimmedValue.startsWith('/') || trimmedValue.startsWith('//') || trimmedValue.includes('\\')) {
    return fallback;
  }

  try {
    const parsed = new URL(trimmedValue, 'http://c-connect.local');
    if (parsed.origin !== 'http://c-connect.local') return fallback;
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
}

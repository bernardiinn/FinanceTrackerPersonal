let cachedToken: string | null = null;

const API_BASE_URL = '/api';

const readCookie = (name: string): string | null => {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
};

export const ensureCsrfToken = async (): Promise<string> => {
  if (cachedToken) return cachedToken;
  // Try cookie first
  const fromCookie = readCookie('XSRF-TOKEN');
  if (fromCookie) {
    cachedToken = fromCookie;
    return cachedToken;
  }
  const res = await fetch(`${API_BASE_URL}/csrf-token`, { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to obtain CSRF token');
  const data = await res.json();
  cachedToken = data.csrfToken || readCookie('XSRF-TOKEN');
  if (!cachedToken) throw new Error('No CSRF token available');
  return cachedToken;
};

export const withCsrf = async (headers: HeadersInit = {}): Promise<HeadersInit> => {
  const token = await ensureCsrfToken();
  return { ...(headers || {}), 'X-CSRF-Token': token };
};

export default { ensureCsrfToken, withCsrf };

// Клиент к бэкенду. Авторизация = подпись сообщения кошельком (SIWE-подобно), токен живёт в sessionStorage.

const tokenKey = (address: string) => `payflow:session:${address.toLowerCase()}`;

export async function ensureSession(
  address: string,
  signMessage: (message: string) => Promise<string>
): Promise<string> {
  const cached = sessionStorage.getItem(tokenKey(address));
  if (cached) return cached;

  const nonceRes = await fetch('/api/auth/nonce', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address }),
  });
  if (!nonceRes.ok) throw new Error('Could not start sign-in');
  const { nonce, message } = await nonceRes.json();

  const signature = await signMessage(message);
  const verifyRes = await fetch('/api/auth/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address, nonce, signature }),
  });
  if (!verifyRes.ok) throw new Error('Sign-in failed');
  const { token } = await verifyRes.json();
  sessionStorage.setItem(tokenKey(address), token);
  return token;
}

export function clearSession(address?: string | null) {
  if (address) sessionStorage.removeItem(tokenKey(address));
}

export async function apiFetch<T>(path: string, token: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...(init.headers || {}) },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data?.error || `Request failed (${res.status})`), { status: res.status });
  return data as T;
}

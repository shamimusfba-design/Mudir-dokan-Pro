import { auth } from './firebase';
import { supabase, isSupabaseAuthEnabled } from './supabase';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/$/, '');

function resolveApiUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  return API_BASE_URL ? `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}` : path;
}

async function getActiveBearerToken(): Promise<string> {
  if (isSupabaseAuthEnabled && supabase) {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) {
      throw new Error('Please sign in first');
    }
    return token;
  }

  const user = auth.currentUser;
  if (!user) {
    throw new Error('Please sign in first');
  }
  return user.getIdToken();
}

export async function apiFetch<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await getActiveBearerToken();
  const headers = new Headers(options.headers || {});
  headers.set('Authorization', `Bearer ${token}`);
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const res = await fetch(resolveApiUrl(path), { ...options, headers });
  const contentType = res.headers.get('content-type') || '';
  const text = await res.text();
  let data: any = {};
  if (text) {
    if (text.trim().startsWith('<') || !contentType.includes('application/json')) {
      throw new Error(`API endpoint ${path} returned HTML or non-JSON (${res.status}). Ensure backend server is active.`);
    }
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error(`API endpoint ${path} returned invalid JSON payload.`);
    }
  }
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data as T;
}

export async function portalFetch<T = any>(
  path: string,
  token: string | null,
  options: RequestInit = {}
): Promise<T> {
  const headers = new Headers(options.headers || {});
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const res = await fetch(resolveApiUrl(path), { ...options, headers });
  const contentType = res.headers.get('content-type') || '';
  const text = await res.text();
  let data: any = {};
  if (text) {
    if (text.trim().startsWith('<') || !contentType.includes('application/json')) {
      throw new Error(`API endpoint ${path} returned HTML or non-JSON (${res.status}). Ensure backend server is active.`);
    }
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error(`API endpoint ${path} returned invalid JSON payload.`);
    }
  }
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data as T;
}

export function exportRowsToCsv(filename: string, headers: string[], rows: Array<Array<string | number>>) {
  const escapeCell = (v: string | number) => {
    const str = String(v ?? '');
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };
  const csv = [headers.map(escapeCell).join(','), ...rows.map((r) => r.map(escapeCell).join(','))].join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

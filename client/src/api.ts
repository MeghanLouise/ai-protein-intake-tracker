import { auth } from './firebase';
import type { Entry, Estimate, ImagePayload, TodayResponse } from './types';

async function request<T>(url: string, method = 'GET', body?: unknown): Promise<T> {
  // Firebase caches the token and refreshes it automatically when it's about to expire.
  const token = await auth?.currentUser?.getIdToken();
  const res = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data as T;
}

export const checkInvite = (code: string) =>
  request<{ ok: true }>('/api/invite/check', 'POST', { code });

export const getMe = () => request<{ activated: boolean }>('/api/me');

export const redeemInvite = (code: string) =>
  request<{ activated: true }>('/api/invite/redeem', 'POST', { code });

// The server may be in another timezone, so send our local date and time.
const localDate = () => new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
const localTime = () => new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

export const getToday = () => request<TodayResponse>(`/api/today?date=${localDate()}`);

export const estimateProtein = (text: string, image?: ImagePayload) =>
  request<Estimate>('/api/estimate', 'POST', { text, image });

export const saveEntry = (description: string, protein_g: number) =>
  request<Entry>('/api/entries', 'POST', { description, protein_g, date: localDate(), time: localTime() });

export const saveGoal = (goal: number) => request<{ goal: number }>('/api/goal', 'PUT', { goal });

// Read a File as { mimeType, data } with base64 data (no data: prefix).
export function readImage(file: File): Promise<ImagePayload> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () =>
      resolve({ mimeType: file.type, data: (reader.result as string).split(',')[1] });
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export const errorMessage = (err: unknown) => (err instanceof Error ? err.message : String(err));

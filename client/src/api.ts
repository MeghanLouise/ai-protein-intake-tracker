import type { Entry, Estimate, ImagePayload, TodayResponse } from './types';

async function request<T>(url: string, method = 'GET', body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data as T;
}

export const getToday = () => request<TodayResponse>('/api/today');

export const estimateProtein = (text: string, image?: ImagePayload) =>
  request<Estimate>('/api/estimate', 'POST', { text, image });

export const saveEntry = (description: string, protein_g: number) =>
  request<Entry>('/api/entries', 'POST', { description, protein_g });

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

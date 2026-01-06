export async function invokeEdgeFunction<T = any>(
  functionName: string,
  body: unknown,
  options?: { signal?: AbortSignal }
): Promise<T> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

  if (!supabaseUrl || !anonKey) {
    throw new Error('Supabase environment variables are missing');
  }

  const res = await fetch(`${supabaseUrl}/functions/v1/${functionName}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
    },
    body: JSON.stringify(body),
    signal: options?.signal,
  });

  const contentType = res.headers.get('content-type') ?? '';
  const payload = contentType.includes('application/json')
    ? await res.json().catch(() => null)
    : await res.text().catch(() => '');

  if (!res.ok) {
    const msg =
      (payload && typeof payload === 'object' && 'error' in (payload as any) && (payload as any).error) ||
      (typeof payload === 'string' && payload) ||
      res.statusText ||
      `Edge function error (${res.status})`;
    throw new Error(String(msg));
  }

  return payload as T;
}

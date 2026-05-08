import type { AdvisorMeta, AgentEvent } from '@meclis/shared';

export async function fetchAdvisors(): Promise<AdvisorMeta[]> {
  const r = await fetch('/api/meclis/advisors');
  if (!r.ok) throw new Error(`failed to load advisors (${r.status})`);
  const data = (await r.json()) as { advisors: AdvisorMeta[] };
  return data.advisors;
}

export async function resetSession(): Promise<void> {
  const r = await fetch('/api/meclis/reset', { method: 'POST' });
  if (!r.ok) throw new Error(`reset failed (${r.status})`);
}

export type StreamHandlers = {
  onEvent: (ev: AgentEvent) => void;
  onError?: (err: Error) => void;
  onClose?: () => void;
};

export function subscribeStream(handlers: StreamHandlers): () => void {
  let aborted = false;
  let backoff = 500;
  let ctrl: AbortController | null = null;

  const connect = async () => {
    if (aborted) return;
    ctrl = new AbortController();
    try {
      const res = await fetch('/api/meclis/stream', {
        headers: { Accept: 'text/event-stream' },
        signal: ctrl.signal,
      });
      if (!res.ok || !res.body) throw new Error(`stream failed (${res.status})`);
      backoff = 500;

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = '';

      while (!aborted) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });

        let idx;
        while ((idx = buf.indexOf('\n\n')) >= 0) {
          const raw = buf.slice(0, idx);
          buf = buf.slice(idx + 2);
          const ev = parseEvent(raw);
          if (ev) handlers.onEvent(ev);
        }
      }
      handlers.onClose?.();
    } catch (err) {
      if (aborted) return;
      handlers.onError?.(err as Error);
    } finally {
      if (!aborted) {
        const next = Math.min(backoff * 2, 10_000);
        const wait = backoff;
        backoff = next;
        setTimeout(connect, wait);
      }
    }
  };

  connect();
  return () => {
    aborted = true;
    ctrl?.abort();
  };
}

function parseEvent(raw: string): AgentEvent | null {
  let dataLine: string | null = null;
  for (const line of raw.split('\n')) {
    if (line.startsWith('data:')) dataLine = line.slice(5).trimStart();
  }
  if (!dataLine) return null;
  try {
    return JSON.parse(dataLine) as AgentEvent;
  } catch {
    return null;
  }
}

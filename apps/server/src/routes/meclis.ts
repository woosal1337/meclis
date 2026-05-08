import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import { z } from 'zod';
import type { AgentEvent } from '@meclis/shared';
import { getAdvisors, toMeta } from '../meclis/advisors.js';
import { bus } from '../meclis/bus.js';
import { rounds } from '../meclis/round-tracker.js';
import { emit } from '../meclis/sse.js';
import { env } from '../env.js';

export const meclisRoute = new Hono();

meclisRoute.get('/advisors', async (c) => {
  const advisors = await getAdvisors();
  return c.json({ advisors: advisors.map(toMeta) });
});

meclisRoute.get('/stream', (c) => {
  return streamSSE(c, async (stream) => {
    const helloEvent: AgentEvent = { type: 'hello', serverStartedAt: serverStartedAt, ts: Date.now() };
    await emit(stream, helloEvent);

    for (const ev of bus.recent()) {
      if (stream.aborted) return;
      await emit(stream, ev);
    }

    const unsub = bus.subscribe(async (ev) => {
      if (stream.aborted) return;
      try {
        await emit(stream, ev);
      } catch {
      }
    });

    await new Promise<void>((resolve) => {
      stream.onAbort(() => {
        unsub();
        resolve();
      });
    });
  });
});

const hookSchema = z.object({
  secret: z.string(),
  phase: z.enum(['pre-tool', 'post-tool', 'subagent-stop']),
  advisorId: z.string(),
  displayName: z.string(),
  userMessage: z.string().optional(),
  fullSpeech: z.string().optional(),
  thinking: z.string().optional(),
  durationMs: z.number().optional(),
  errorMessage: z.string().optional(),
});

let sessionId = 1;
meclisRoute.post('/reset', async (c) => {
  bus.clear();
  rounds.reset();
  sessionId += 1;
  bus.publish({ type: 'session_reset', sessionId, ts: Date.now() });
  return c.json({ ok: true, sessionId });
});

meclisRoute.post('/hooks/event', async (c) => {
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'invalid json' }, 400);
  }

  const parsed = hookSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: 'invalid payload', details: parsed.error.flatten() }, 400);
  }

  if (parsed.data.secret !== env.HOOK_SECRET) {
    return c.json({ error: 'forbidden' }, 403);
  }

  const { phase, advisorId, userMessage, fullSpeech, thinking, durationMs, errorMessage } = parsed.data;
  const ts = Date.now();

  console.log(`[hook] ${phase} ${advisorId}${fullSpeech ? ` (+${fullSpeech.length}c speech)` : ''}`);

  if (phase === 'pre-tool') {
    const round = rounds.start(advisorId, ts);
    bus.publish({ type: 'turn_start', advisorId, round, userMessage, ts });
  } else if (phase === 'post-tool') {
    const round = rounds.current(advisorId) || 1;
    if (errorMessage) {
      bus.publish({ type: 'turn_error', advisorId, round, message: errorMessage, ts });
    } else if (fullSpeech) {
      bus.publish({
        type: 'turn_complete',
        advisorId,
        round,
        speech: fullSpeech,
        thinking,
        durationMs: durationMs ?? 0,
        ts,
      });
    }
  } else if (phase === 'subagent-stop') {
  }

  return c.json({ ok: true });
});

const serverStartedAt = Date.now();

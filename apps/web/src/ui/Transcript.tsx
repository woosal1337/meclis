import { useEffect, useRef } from 'react';
import type { AdvisorMeta } from '@meclis/shared';

export type TranscriptEntry =
  | { kind: 'turn_start'; advisorId: string; round: number; userMessage?: string }
  | { kind: 'thinking_delta'; advisorId: string; text: string }
  | { kind: 'speech_delta'; advisorId: string; text: string }
  | {
      kind: 'turn_complete';
      advisorId: string;
      round: number;
      speech: string;
      thinking?: string;
      durationMs: number;
    }
  | { kind: 'error'; advisorId: string; round: number; message: string };

export function Transcript(props: {
  advisors: AdvisorMeta[];
  entries: TranscriptEntry[];
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [props.entries.length, props.entries[props.entries.length - 1]]);

  function nameFor(id: string): string {
    return props.advisors.find((a) => a.id === id)?.displayName ?? id;
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="border-b border-marble-700/60 px-5 pb-3 pt-5">
        <div className="laurel-rule">
          <span>The Codex</span>
        </div>
        <div className="mt-1 text-center font-serif text-[11px] italic text-marble-200/85">
          inscribed in real time
        </div>
      </div>

      <div
        ref={ref}
        className="scrollbar-thin min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-5"
      >
        {props.entries.length === 0 && (
          <div className="parchment rounded-sm px-4 py-4 font-serif text-sm italic text-ink/80">
            <div className="smallcaps mb-1.5 text-[10px] text-terracotta-700">
              awaiting the question
            </div>
            Open Claude Code and invoke{' '}
            <code className="font-mono not-italic text-terracotta-700">
              /meclis&nbsp;…
            </code>
            . Each speaker's words will be transcribed here as they fall.
          </div>
        )}

        {props.entries.map((e, i) => {
          if (e.kind === 'turn_start') {
            return (
              <div key={i} className="space-y-2">
                <div className="laurel-rule">
                  <span>
                    Round {e.round} · {nameFor(e.advisorId)}
                  </span>
                </div>
                {e.userMessage && (
                  <div className="font-serif text-[14px] italic leading-snug text-marble-50">
                    <span className="smallcaps mr-2 text-[10px] not-italic text-amber-flame">
                      asked
                    </span>
                    {e.userMessage.slice(0, 240)}
                    {e.userMessage.length > 240 ? '…' : ''}
                  </div>
                )}
              </div>
            );
          }

          if (e.kind === 'thinking_delta') {
            return (
              <div
                key={i}
                className="rounded-sm border border-marble-700/70 bg-marble-800/40 px-4 py-3 font-serif text-[13px] italic leading-relaxed text-marble-100/85"
              >
                <div className="smallcaps mb-1 text-[10px] text-amber-flame/80">
                  {nameFor(e.advisorId)} considers
                </div>
                {e.text}
              </div>
            );
          }

          if (e.kind === 'speech_delta') {
            return (
              <div key={i} className="parchment rounded-sm px-4 py-3">
                <div className="smallcaps mb-1.5 text-[10px] text-terracotta-700">
                  {nameFor(e.advisorId)} says
                </div>
                <div className="font-serif text-[15px] leading-relaxed text-ink">
                  {e.text}
                </div>
              </div>
            );
          }

          if (e.kind === 'turn_complete') {
            const seconds = (e.durationMs / 1000).toFixed(1);
            return (
              <div key={i} className="parchment rounded-sm px-4 py-3.5">
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="smallcaps text-[10px] text-terracotta-700">
                    {nameFor(e.advisorId)} · round {e.round}
                  </span>
                  <span className="font-serif text-[10px] italic text-terracotta-700/70">
                    {seconds}s
                  </span>
                </div>
                <div className="font-serif text-[15px] leading-relaxed text-ink">
                  <span className="float-left mr-1.5 mt-0.5 font-display text-3xl leading-none text-terracotta-600">
                    {e.speech.charAt(0)}
                  </span>
                  {e.speech.slice(1)}
                </div>
              </div>
            );
          }

          if (e.kind === 'error') {
            return (
              <div
                key={i}
                className="rounded-sm border border-terracotta-600 bg-terracotta-700/30 px-4 py-3 font-serif text-sm italic text-marble-50"
              >
                <div className="smallcaps mb-1 text-[10px] text-terracotta-400">
                  {nameFor(e.advisorId)} · round {e.round} faltered
                </div>
                {e.message}
              </div>
            );
          }

          return null;
        })}
      </div>
    </div>
  );
}

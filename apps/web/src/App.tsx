import { useEffect, useMemo, useRef, useState } from 'react';
import type { AdvisorMeta, AgentEvent } from '@meclis/shared';
import { Stage } from './stage/Stage.js';
import { fetchAdvisors, resetSession, subscribeStream } from './api/meclis-stream.js';

function stripAttribution(speech: string): string {
  return speech.replace(/\n+\s*—[^\n]*$/, '').trim();
}
import { CastPanel } from './ui/CastPanel.js';
import { Transcript, type TranscriptEntry } from './ui/Transcript.js';

export function App() {
  const stageContainerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Stage | null>(null);

  const [advisors, setAdvisors] = useState<AdvisorMeta[]>([]);
  const [activeIds, setActiveIds] = useState<Set<string>>(new Set());
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [statusLine, setStatusLine] = useState<string>(
    'the chamber is quiet. awaiting a question.',
  );
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const stage = new Stage();
    stageRef.current = stage;
    const container = stageContainerRef.current;
    if (!container) return;
    stage
      .mount(container)
      .catch((e) => setError(`stage failed to mount: ${(e as Error).message}`));
    return () => {
      stage.destroy();
      stageRef.current = null;
    };
  }, []);

  useEffect(() => {
    fetchAdvisors()
      .then(setAdvisors)
      .catch((e) =>
        setError(`could not load advisors: ${(e as Error).message}`),
      );
  }, []);

  useEffect(() => {
    stageRef.current?.setAdvisors(advisors);
  }, [advisors]);

  useEffect(() => {
    const cancel = subscribeStream({
      onEvent: handleEvent,
      onError: (err) => {
        setConnected(false);
        setError(err.message);
      },
      onClose: () => setConnected(false),
    });
    return cancel;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleEvent(ev: AgentEvent) {
    const stage = stageRef.current;
    if (!stage) return;

    switch (ev.type) {
      case 'hello':
        setConnected(true);
        setStatusLine('the chamber is quiet. awaiting a question.');
        break;
      case 'session_reset':
        setTranscript([]);
        setActiveIds(new Set());
        setError(null);
        setStatusLine('the chamber is quiet. awaiting a question.');
        stage.reset();
        break;
      case 'cast_changed':
        fetchAdvisors().then(setAdvisors).catch(() => {});
        break;
      case 'turn_start': {
        setActiveIds((prev) => new Set([...prev, ev.advisorId]));
        stage.startTurn(ev.advisorId);
        stage.showThinking(ev.advisorId);
        appendTranscript({
          kind: 'turn_start',
          advisorId: ev.advisorId,
          round: ev.round,
          userMessage: ev.userMessage,
        });
        setStatusLine(`${nameOf(ev.advisorId)} takes the floor · round ${ev.round}`);
        break;
      }
      case 'thinking_delta':
        stage.appendThought(ev.advisorId, ev.text);
        appendTranscriptDelta(ev.advisorId, 'thinking', ev.text);
        break;
      case 'speech_delta':
        stage.appendSpeech(ev.advisorId, ev.text);
        appendTranscriptDelta(ev.advisorId, 'speech', ev.text);
        break;
      case 'turn_complete': {
        stage.endThinking(ev.advisorId);
        stage.speakFully(ev.advisorId, stripAttribution(ev.speech), {
          onDone: () => {
            stage.endTurn(ev.advisorId);
            setActiveIds((prev) => {
              const next = new Set(prev);
              next.delete(ev.advisorId);
              return next;
            });
          },
        });
        appendTranscript({
          kind: 'turn_complete',
          advisorId: ev.advisorId,
          round: ev.round,
          speech: ev.speech,
          thinking: ev.thinking,
          durationMs: ev.durationMs,
        });
        const seconds = (ev.durationMs / 1000).toFixed(1);
        setStatusLine(
          `${nameOf(ev.advisorId)} concludes round ${ev.round} · ${seconds}s`,
        );
        break;
      }
      case 'turn_error':
        stage.endThinking(ev.advisorId);
        stage.endTurn(ev.advisorId);
        setActiveIds((prev) => {
          const next = new Set(prev);
          next.delete(ev.advisorId);
          return next;
        });
        appendTranscript({
          kind: 'error',
          advisorId: ev.advisorId,
          round: ev.round,
          message: ev.message,
        });
        setError(`${nameOf(ev.advisorId)}: ${ev.message}`);
        break;
      case 'server_error':
        setError(ev.message);
        break;
    }
  }

  function nameOf(id: string): string {
    return advisors.find((a) => a.id === id)?.displayName ?? id;
  }

  function appendTranscript(entry: TranscriptEntry) {
    setTranscript((prev) => [...prev, entry]);
  }

  function appendTranscriptDelta(
    advisorId: string,
    kind: 'thinking' | 'speech',
    text: string,
  ) {
    const targetKind = `${kind}_delta` as const;
    setTranscript((prev) => {
      const last = prev[prev.length - 1];
      if (last && last.kind === targetKind && last.advisorId === advisorId) {
        return [...prev.slice(0, -1), { ...last, text: last.text + text }];
      }
      return [...prev, { kind: targetKind, advisorId, text }];
    });
  }

  const ember = useMemo(() => {
    if (!connected) return 'ember--off';
    if (activeIds.size > 0) return 'ember';
    return 'ember--idle';
  }, [connected, activeIds.size]);

  return (
    <div
      className="grid h-screen overflow-hidden"
      style={{
        gridTemplateColumns: 'minmax(0, 1fr) 400px',
        gridTemplateRows: 'minmax(0, 1fr)',
      }}
    >
      <main className="relative flex min-h-0 flex-col overflow-hidden">
        <header className="relative z-10 flex items-center justify-between border-b border-marble-700/70 bg-gradient-to-b from-marble-deep via-marble-800 to-marble-deep/95 px-7 py-4 backdrop-blur">
          <div className="flex items-baseline gap-4">
            <h1 className="font-display text-2xl tracking-[0.32em] text-marble-50">
              MECLIS
            </h1>
            <span className="font-serif italic text-marble-100 text-sm">
              {' '}— a symposium of advisors
            </span>
          </div>
          <div className="flex items-center gap-3 text-sm text-marble-50">
            <span className="font-serif italic">{statusLine}</span>
            <span className={ember} aria-hidden="true" />
            <span className="smallcaps text-[10px] text-amber-flame">
              {connected ? 'OBSERVED' : 'RECONNECTING'}
            </span>
            <button
              type="button"
              onClick={() =>
                resetSession().catch((e) =>
                  setError(`reset failed: ${(e as Error).message}`),
                )
              }
              title="Clear the codex and start a fresh session"
              className="smallcaps ml-2 rounded-sm border border-marble-600/60 bg-marble-800/50 px-2.5 py-1 text-[10px] text-marble-100 transition hover:border-amber-flame/70 hover:bg-marble-700/60 hover:text-amber-flame"
            >
              New Session
            </button>
          </div>
        </header>

        <div className="meander" aria-hidden="true" />

        <div
          className="stage-canvas-container flex-1"
          ref={stageContainerRef}
        />

        <div className="meander" aria-hidden="true" />

        {error && (
          <div className="border-t border-terracotta-700 bg-terracotta-700/30 px-7 py-2 font-serif italic text-sm text-marble-50">
            {error}
          </div>
        )}
      </main>

      <aside className="codex-panel flex flex-col">
        <CastPanel advisors={advisors} activeIds={activeIds} />
        <Transcript advisors={advisors} entries={transcript} />
      </aside>
    </div>
  );
}

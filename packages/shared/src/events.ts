
export type AdvisorId = string;

type Base = { ts: number };

export type HelloEvent = Base & {
  type: 'hello';
  serverStartedAt: number;
};

export type TurnStartEvent = Base & {
  type: 'turn_start';
  advisorId: AdvisorId;
  round: number;
  userMessage?: string;
};

export type SpeechDeltaEvent = Base & {
  type: 'speech_delta';
  advisorId: AdvisorId;
  text: string;
};

export type ThinkingDeltaEvent = Base & {
  type: 'thinking_delta';
  advisorId: AdvisorId;
  text: string;
};

export type TurnCompleteEvent = Base & {
  type: 'turn_complete';
  advisorId: AdvisorId;
  round: number;
  speech: string;
  thinking?: string;
  durationMs: number;
};

export type TurnErrorEvent = Base & {
  type: 'turn_error';
  advisorId: AdvisorId;
  round: number;
  message: string;
};

export type CastChangedEvent = Base & {
  type: 'cast_changed';
};

export type ServerErrorEvent = Base & {
  type: 'server_error';
  message: string;
};

export type SessionResetEvent = Base & {
  type: 'session_reset';
  sessionId: number;
};

export type AgentEvent =
  | HelloEvent
  | TurnStartEvent
  | SpeechDeltaEvent
  | ThinkingDeltaEvent
  | TurnCompleteEvent
  | TurnErrorEvent
  | CastChangedEvent
  | ServerErrorEvent
  | SessionResetEvent;

export type AgentEventType = AgentEvent['type'];
export type AgentEventOf<T extends AgentEventType> = Extract<AgentEvent, { type: T }>;

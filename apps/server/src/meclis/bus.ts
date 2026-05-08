import type { AgentEvent } from '@meclis/shared';

class EventBus {
  private buffer: AgentEvent[] = [];
  private listeners = new Set<(ev: AgentEvent) => void>();
  private maxBuffer = 500;

  publish(ev: AgentEvent): void {
    this.buffer.push(ev);
    if (this.buffer.length > this.maxBuffer) this.buffer.splice(0, this.buffer.length - this.maxBuffer);
    for (const l of this.listeners) {
      try {
        l(ev);
      } catch (err) {
        console.error('[bus] listener threw:', err);
      }
    }
  }

  subscribe(fn: (ev: AgentEvent) => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  recent(limit = 100): AgentEvent[] {
    return this.buffer.slice(-limit);
  }

  clear(): void {
    this.buffer = [];
  }
}

export const bus = new EventBus();

import type { AgentEvent } from '@meclis/shared';

export interface SSEWriter {
  writeSSE(event: { event?: string; data: string; id?: string }): Promise<void>;
}

export async function emit(writer: SSEWriter, ev: AgentEvent): Promise<void> {
  await writer.writeSSE({
    event: ev.type,
    data: JSON.stringify(ev),
  });
}

export const now = (): number => Date.now();

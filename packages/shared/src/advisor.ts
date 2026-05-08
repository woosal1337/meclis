export type AdvisorMeta = {
  id: string;
  displayName: string;
  brief: string;
  spriteSlug?: string;
};

export type AdvisorFull = AdvisorMeta & {
  systemPrompt: string;
};

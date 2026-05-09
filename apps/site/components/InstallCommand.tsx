'use client';

import { useState } from 'react';

export function InstallCommand({ command }: { command: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  return (
    <button
      type="button"
      onClick={copy}
      className="copyable w-full text-left flex items-center justify-between gap-4 hover:border-bronze-glow transition-colors"
    >
      <span className="truncate">{command}</span>
      <span className="smallcaps text-[10px] text-bronze-glow shrink-0">
        {copied ? 'copied' : 'copy'}
      </span>
    </button>
  );
}

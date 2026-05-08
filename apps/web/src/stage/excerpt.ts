export function bubbleExcerpt(speech: string, maxChars = 140): string {
  if (!speech) return '';
  const trimmed = speech.trim();
  if (trimmed.length <= maxChars) return trimmed;

  const window = trimmed.slice(0, maxChars + 1);
  const sentenceEnd = window.search(/[.!?](\s|$)/);
  if (sentenceEnd > 20 && sentenceEnd <= maxChars) {
    return trimmed.slice(0, sentenceEnd + 1).trim();
  }

  const cut = trimmed.slice(0, maxChars);
  const lastSpace = cut.lastIndexOf(' ');
  const head = lastSpace > 40 ? cut.slice(0, lastSpace) : cut;
  return head.replace(/[,;:.\s]+$/, '') + '…';
}

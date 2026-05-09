import { Fragment, type ReactNode } from 'react';

function escapeHtml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderInline(text: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re =
    /(`[^`]+`)|(\*\*[^*]+\*\*)|(\*[^*]+\*)|(_[^_]+_)|(\[[^\]]+\]\([^)]+\))|(https?:\/\/[^\s)]+)/g;
  let lastIndex = 0;
  let m: RegExpExecArray | null;
  let key = 0;
  while ((m = re.exec(text))) {
    if (m.index > lastIndex) out.push(text.slice(lastIndex, m.index));
    const token = m[0];
    if (token.startsWith('`')) {
      out.push(<code key={key++}>{token.slice(1, -1)}</code>);
    } else if (token.startsWith('**')) {
      out.push(<strong key={key++}>{token.slice(2, -2)}</strong>);
    } else if (token.startsWith('*') || token.startsWith('_')) {
      out.push(<em key={key++}>{token.slice(1, -1)}</em>);
    } else if (token.startsWith('[')) {
      const linkMatch = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(token);
      if (linkMatch) {
        out.push(
          <a key={key++} href={linkMatch[2]} target="_blank" rel="noopener noreferrer">
            {linkMatch[1]}
          </a>,
        );
      } else {
        out.push(token);
      }
    } else {
      out.push(
        <a key={key++} href={token} target="_blank" rel="noopener noreferrer">
          {token}
        </a>,
      );
    }
    lastIndex = m.index + token.length;
  }
  if (lastIndex < text.length) out.push(text.slice(lastIndex));
  return out;
}

type Block =
  | { type: 'h'; level: 1 | 2 | 3 | 4; text: string }
  | { type: 'p'; text: string }
  | { type: 'ul'; items: string[] }
  | { type: 'ol'; items: string[] }
  | { type: 'blockquote'; lines: string[] }
  | { type: 'pre'; lang?: string; code: string }
  | { type: 'hr' }
  | { type: 'table'; header: string[]; rows: string[][] };

function tokenize(md: string): Block[] {
  const lines = md.split(/\r?\n/);
  const blocks: Block[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (!line.trim()) {
      i += 1;
      continue;
    }

    const fence = /^```(\S+)?\s*$/.exec(line);
    if (fence) {
      const lang = fence[1];
      i += 1;
      const buf: string[] = [];
      while (i < lines.length && !/^```\s*$/.test(lines[i])) {
        buf.push(lines[i]);
        i += 1;
      }
      i += 1;
      blocks.push({ type: 'pre', lang, code: buf.join('\n') });
      continue;
    }

    if (/^---+\s*$/.test(line)) {
      blocks.push({ type: 'hr' });
      i += 1;
      continue;
    }

    const heading = /^(#{1,4})\s+(.+?)\s*$/.exec(line);
    if (heading) {
      blocks.push({
        type: 'h',
        level: heading[1].length as 1 | 2 | 3 | 4,
        text: heading[2],
      });
      i += 1;
      continue;
    }

    if (/^>\s?/.test(line)) {
      const buf: string[] = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) {
        buf.push(lines[i].replace(/^>\s?/, ''));
        i += 1;
      }
      blocks.push({ type: 'blockquote', lines: buf });
      continue;
    }

    if (/^[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^[-*]\s+/, ''));
        i += 1;
      }
      blocks.push({ type: 'ul', items });
      continue;
    }

    if (/^\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s+/, ''));
        i += 1;
      }
      blocks.push({ type: 'ol', items });
      continue;
    }

    if (/^\|.+\|\s*$/.test(line) && i + 1 < lines.length && /^\|[\s:|-]+\|\s*$/.test(lines[i + 1])) {
      const header = line
        .replace(/^\||\|\s*$/g, '')
        .split('|')
        .map((c) => c.trim());
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && /^\|.+\|\s*$/.test(lines[i])) {
        rows.push(
          lines[i]
            .replace(/^\||\|\s*$/g, '')
            .split('|')
            .map((c) => c.trim()),
        );
        i += 1;
      }
      blocks.push({ type: 'table', header, rows });
      continue;
    }

    const buf: string[] = [line];
    i += 1;
    while (
      i < lines.length &&
      lines[i].trim() &&
      !/^(#{1,4}\s|>\s|[-*]\s|\d+\.\s|```|---+\s*$|\|.+\|\s*$)/.test(lines[i])
    ) {
      buf.push(lines[i]);
      i += 1;
    }
    blocks.push({ type: 'p', text: buf.join(' ') });
  }

  return blocks;
}

export function Markdown({ source, skipFirstH1 = false }: { source: string; skipFirstH1?: boolean }) {
  const blocks = tokenize(source);
  let skipped = !skipFirstH1;
  return (
    <div className="prose-parchment">
      {blocks.map((b, i) => {
        if (b.type === 'h' && b.level === 1 && !skipped) {
          skipped = true;
          return null;
        }
        return <BlockNode key={i} block={b} />;
      })}
    </div>
  );
}

function BlockNode({ block }: { block: Block }) {
  if (block.type === 'h') {
    if (block.level === 1) return <h1>{renderInline(block.text)}</h1>;
    if (block.level === 2) return <h2>{renderInline(block.text)}</h2>;
    if (block.level === 3) return <h3>{renderInline(block.text)}</h3>;
    return <h4>{renderInline(block.text)}</h4>;
  }
  if (block.type === 'p') return <p>{renderInline(block.text)}</p>;
  if (block.type === 'ul')
    return (
      <ul>
        {block.items.map((it, i) => (
          <li key={i}>{renderInline(it)}</li>
        ))}
      </ul>
    );
  if (block.type === 'ol')
    return (
      <ol>
        {block.items.map((it, i) => (
          <li key={i}>{renderInline(it)}</li>
        ))}
      </ol>
    );
  if (block.type === 'blockquote')
    return (
      <blockquote>
        {block.lines.map((line, i) => (
          <Fragment key={i}>
            {renderInline(line)}
            {i < block.lines.length - 1 ? <br /> : null}
          </Fragment>
        ))}
      </blockquote>
    );
  if (block.type === 'pre')
    return (
      <pre>
        <code dangerouslySetInnerHTML={{ __html: escapeHtml(block.code) }} />
      </pre>
    );
  if (block.type === 'hr') return <hr />;
  if (block.type === 'table')
    return (
      <table>
        <thead>
          <tr>
            {block.header.map((h, i) => (
              <th key={i}>{renderInline(h)}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {block.rows.map((row, ri) => (
            <tr key={ri}>
              {row.map((c, ci) => (
                <td key={ci}>{renderInline(c)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    );
  return null;
}

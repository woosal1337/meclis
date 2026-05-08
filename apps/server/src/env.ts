import 'dotenv/config';
import { homedir } from 'node:os';
import { resolve } from 'node:path';
import { z } from 'zod';

const expandHome = (p: string) => (p.startsWith('~') ? resolve(homedir(), p.slice(2)) : resolve(p));

const schema = z.object({
  PORT: z.coerce.number().int().positive().default(3001),
  ADVISOR_DIR: z
    .string()
    .default('~/.claude/skills/meclis/advisors')
    .transform(expandHome),
  CLAUDE_PROJECTS_DIR: z
    .string()
    .default('~/.claude/projects')
    .transform(expandHome),
  HOOK_SECRET: z.string().default('local-only-meclis'),
  WEB_ORIGIN: z.string().default('http://localhost:5173'),
});

export const env = schema.parse(process.env);

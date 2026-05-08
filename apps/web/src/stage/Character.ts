import * as PIXI from 'pixi.js';
import type { AdvisorMeta } from '@meclis/shared';
import { SpeechBubble } from './SpeechBubble.js';
import { ThoughtBubble } from './ThoughtBubble.js';

type State = 'idle' | 'thinking' | 'speaking' | 'listening';

export class Character {
  readonly root = new PIXI.Container();
  readonly bubblesRoot = new PIXI.Container();

  private spriteContainer = new PIXI.Container();
  private sprite: PIXI.Sprite | null = null;
  private fallbackBody: PIXI.Graphics;
  readonly speech: SpeechBubble;
  private thought: ThoughtBubble;
  private state: State = 'idle';
  private breathTime = 0;
  private destroyed = false;
  private clickHandlers = new Set<() => void>();

  constructor(public meta: AdvisorMeta) {
    this.fallbackBody = new PIXI.Graphics();
    this.drawFallback();
    this.fallbackBody.visible = false;

    this.spriteContainer.addChild(this.fallbackBody);
    this.root.addChild(this.spriteContainer);

    this.speech = new SpeechBubble();
    this.thought = new ThoughtBubble();

    this.bubblesRoot.addChild(this.speech.root, this.thought.root);

    this.root.eventMode = 'static';
    this.root.cursor = 'pointer';
    this.root.hitArea = new PIXI.Rectangle(-450, -1320, 900, 1320);
    this.root.on('pointertap', () => {
      for (const fn of this.clickHandlers) fn();
    });

    this.loadSprite();

    PIXI.Ticker.shared.add(this.tick, this);
  }

  onClick(fn: () => void): () => void {
    this.clickHandlers.add(fn);
    return () => this.clickHandlers.delete(fn);
  }

  private async loadSprite() {
    try {
      const url = `/assets/sprites/${this.meta.spriteSlug ?? this.meta.id}.png`;
      const tex = await PIXI.Assets.load(url);
      if (this.destroyed) return;
      tex.source.scaleMode = 'nearest';
      const s = new PIXI.Sprite(tex);
      s.anchor.set(0.5, 1);
      this.sprite = s;
      this.spriteContainer.addChild(s);
      this.fallbackBody.visible = false;
    } catch (err) {
      console.warn(`[character] sprite missing for ${this.meta.id}; using fallback`, err);
      this.fallbackBody.visible = true;
    }
  }

  private drawFallback() {
    const hue = djb2(this.meta.id) % 360;
    const color = hslToHex(hue, 35, 55);
    const accent = hslToHex(hue, 30, 35);
    this.fallbackBody.clear();
    this.fallbackBody.roundRect(-50, -90, 100, 90, 6).fill(color);
    this.fallbackBody.circle(0, -120, 38).fill(color);
    this.fallbackBody.rect(-50, -10, 100, 6).fill(accent);
  }

  bindBubblesToCharacter() {
  }

  setPosition(x: number, y: number) {
    this.root.position.set(x, y);
  }
  setScale(s: number) {
    this.root.scale.set(s);
  }
  setFacing(facing: 'left' | 'right') {
    this.spriteContainer.scale.x =
      Math.abs(this.spriteContainer.scale.x) * (facing === 'left' ? -1 : 1);
  }

  startSpeaking() {
    this.state = 'speaking';
    this.speech.show();
    this.thought.reset();
  }

  endSpeaking() {
    this.state = 'idle';
  }

  appendSpeech(text: string) {
    if (this.state !== 'speaking') {
      this.state = 'speaking';
      this.speech.show();
      this.thought.reset();
    }
    this.speech.append(text);
  }

  private paceTimer: ReturnType<typeof setTimeout> | null = null;
  speakFully(
    text: string,
    opts?: { charsPerTick?: number; tickMs?: number; onDone?: () => void },
  ) {
    if (this.paceTimer) {
      clearTimeout(this.paceTimer);
      this.paceTimer = null;
    }
    if (this.state !== 'speaking') {
      this.state = 'speaking';
      this.speech.show();
    }
    this.thought.reset();
    this.speech.reset();
    this.speech.show();
    const charsPerTick = opts?.charsPerTick ?? 3;
    const tickMs = opts?.tickMs ?? 22;
    let i = 0;
    const step = () => {
      if (i >= text.length) {
        this.paceTimer = null;
        opts?.onDone?.();
        return;
      }
      this.speech.append(text.slice(i, i + charsPerTick));
      i += charsPerTick;
      this.paceTimer = setTimeout(step, tickMs);
    };
    step();
  }

  appendThought(text: string) {
    if (this.state === 'idle') this.state = 'thinking';
    this.thought.show();
    this.thought.append(text);
  }

  resetThought() {
    this.thought.reset();
  }

  endThinking() {
    this.thought.fadeOut();
  }

  reset() {
    this.state = 'idle';
    this.speech.reset();
    this.thought.reset();
  }

  private spriteHeightCss(): number {
    if (this.sprite?.texture?.height) {
      return this.sprite.texture.height * this.root.scale.y;
    }
    return 220 * this.root.scale.y;
  }

  private tick = (ticker: PIXI.Ticker) => {
    this.breathTime += ticker.deltaMS / 1000;

    const breath = Math.sin(this.breathTime * 1.6) * 0.02 + 1;
    this.spriteContainer.scale.y = breath;

    if (this.state === 'speaking') {
      this.spriteContainer.position.y = Math.sin(this.breathTime * 8) * 1.5;
    } else {
      this.spriteContainer.position.y = 0;
    }

    const charX = this.root.position.x;
    const charY = this.root.position.y;
    const headY = charY - this.spriteHeightCss() - 10;
    this.speech.root.position.set(charX, headY);
    this.thought.root.position.set(charX + 90 * this.root.scale.x, headY - 8);
    this.speech.setHeadroom(headY - 24 - 28);
  };

  destroy() {
    this.destroyed = true;
    if (this.paceTimer) clearTimeout(this.paceTimer);
    PIXI.Ticker.shared.remove(this.tick, this);
    this.root.destroy({ children: true });
    this.bubblesRoot.destroy({ children: true });
  }
}

function djb2(str: string): number {
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = (h * 33) ^ str.charCodeAt(i);
  return h >>> 0;
}

function hslToHex(h: number, s: number, l: number): number {
  s /= 100;
  l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) =>
    l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const r = Math.round(f(0) * 255);
  const g = Math.round(f(8) * 255);
  const b = Math.round(f(4) * 255);
  return (r << 16) | (g << 8) | b;
}

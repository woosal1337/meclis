import * as PIXI from 'pixi.js';
import type { AdvisorMeta } from '@meclis/shared';
import { Character } from './Character.js';
import { positionsFor, BACKGROUND_NATIVE } from './layout.js';

export class Stage {
  private app: PIXI.Application;
  private characters = new Map<string, Character>();
  private container: HTMLElement | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private ready: Promise<void> | null = null;
  private initialized = false;
  private destroyed = false;
  private pendingAdvisors: AdvisorMeta[] | null = null;

  private worldLayer = new PIXI.Container();
  private castLayer = new PIXI.Container();
  private uiLayer = new PIXI.Container();

  private background: PIXI.Sprite | null = null;
  private vignette: PIXI.Graphics = new PIXI.Graphics();
  private bgTransform = { scale: 1, offsetX: 0, offsetY: 0 };

  constructor() {
    this.app = new PIXI.Application();
  }

  async mount(container: HTMLElement): Promise<void> {
    this.container = container;
    const rect = container.getBoundingClientRect();
    const initialW = Math.max(1, Math.floor(rect.width));
    const initialH = Math.max(1, Math.floor(rect.height));
    this.ready = this.app.init({
      antialias: false,
      background: '#1a120a',
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
      width: initialW,
      height: initialH,
    });
    await this.ready;
    if (this.destroyed) return;
    this.initialized = true;
    container.appendChild(this.app.canvas);

    this.app.stage.addChild(this.worldLayer, this.castLayer, this.uiLayer);
    this.worldLayer.addChild(this.vignette);

    try {
      const tex = await PIXI.Assets.load('/assets/stages/greek-symposium.png');
      tex.source.scaleMode = 'nearest';
      const sprite = new PIXI.Sprite(tex);
      sprite.anchor.set(0, 0);
      this.background = sprite;
      this.worldLayer.addChildAt(sprite, 0);
      this.handleResize();
    } catch (err) {
      console.warn('[stage] failed to load background', err);
    }

    this.resizeObserver = new ResizeObserver(() => this.handleResize());
    this.resizeObserver.observe(container);
    window.addEventListener('resize', this.handleResize);

    requestAnimationFrame(() => {
      this.handleResize();
      requestAnimationFrame(() => this.handleResize());
    });

    if (import.meta.env?.DEV) {
      (window as unknown as { __stage: Stage }).__stage = this;
    }

    if (this.pendingAdvisors) {
      const queued = this.pendingAdvisors;
      this.pendingAdvisors = null;
      this.setAdvisors(queued);
    }
  }

  private handleResize = () => {
    if (!this.initialized || !this.container) return;
    const rect = this.container.getBoundingClientRect();
    const w = Math.max(1, Math.floor(rect.width));
    const h = Math.max(1, Math.floor(rect.height));
    const screen = this.app.renderer.screen;
    if (w !== screen.width || h !== screen.height) {
      this.app.renderer.resize(w, h);
    }
    const canvas = this.app.canvas;
    if (canvas) {
      canvas.style.width = '';
      canvas.style.height = '';
      canvas.style.position = '';
      canvas.style.top = '';
      canvas.style.left = '';
    }
    this.layout();
  };

  destroy(): void {
    this.destroyed = true;
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    window.removeEventListener('resize', this.handleResize);
    if (this.initialized) {
      try {
        this.app.destroy(true, { children: true, texture: true });
      } catch {
      }
      if (this.container && this.app.canvas.parentElement === this.container) {
        this.container.removeChild(this.app.canvas);
      }
    }
    this.characters.clear();
    this.container = null;
  }

  setAdvisors(advisors: AdvisorMeta[]): void {
    if (!this.initialized) {
      this.pendingAdvisors = advisors;
      return;
    }

    for (const [, c] of this.characters) c.destroy();
    this.characters.clear();

    for (const a of advisors) {
      const ch = new Character(a);
      this.castLayer.addChild(ch.root);
      this.uiLayer.addChild(ch.bubblesRoot);
      ch.bindBubblesToCharacter();
      ch.onClick(() => this.focusAdvisor(a.id));
      this.characters.set(a.id, ch);
    }

    if (this.focusedId && !this.characters.has(this.focusedId)) {
      this.focusedId = null;
    }

    this.layout();
    this.applyFocus();

    for (const a of advisors) this.drainPending(a.id);
  }

  focusAdvisor(id: string | null): void {
    if (this.focusedId === id) return;
    this.focusedId = id;
    this.applyFocus();
  }

  private applyFocus(): void {
    for (const [otherId, ch] of this.characters) {
      const focused = this.focusedId == null ? true : otherId === this.focusedId;
      ch.speech.setFocused(focused);
      if (focused && this.focusedId != null) {
        const idx = this.uiLayer.getChildIndex(ch.bubblesRoot);
        if (idx >= 0 && idx !== this.uiLayer.children.length - 1) {
          this.uiLayer.setChildIndex(ch.bubblesRoot, this.uiLayer.children.length - 1);
        }
      }
    }
  }

  private focusedId: string | null = null;

  private layout(): void {
    if (!this.initialized || !this.container) return;
    const { width: w, height: h } = this.app.renderer.screen;

    if (this.background) {
      const bgW = BACKGROUND_NATIVE.width;
      const bgH = BACKGROUND_NATIVE.height;
      const scale = Math.max(w / bgW, h / bgH);
      this.background.scale.set(scale);
      const drawW = bgW * scale;
      const drawH = bgH * scale;
      const offsetX = (w - drawW) / 2;
      const offsetY = (h - drawH) / 2;
      this.background.position.set(offsetX, offsetY);
      this.bgTransform = { scale, offsetX, offsetY };
    }

    this.vignette.clear();
    this.vignette
      .rect(0, 0, w, Math.round(h * 0.2))
      .fill({ color: 0x0a0604, alpha: 0.45 });
    this.vignette
      .rect(0, h - Math.round(h * 0.18), w, Math.round(h * 0.18))
      .fill({ color: 0x0a0604, alpha: 0.4 });

    const ids = [...this.characters.keys()];
    const pts = positionsFor(ids.length, w, h, this.bgTransform);
    for (let i = 0; i < ids.length; i++) {
      const ch = this.characters.get(ids[i])!;
      const p = pts[i];
      ch.setPosition(p.x, p.y);
      ch.setScale(p.scale);
      ch.setFacing(p.facing);
    }
  }

  startTurn(advisorId: string): void {
    if (this.queueIfMissing(advisorId, () => this.startTurn(advisorId))) return;
    this.characters.get(advisorId)?.startSpeaking();
    this.focusAdvisor(advisorId);
  }

  appendThought(advisorId: string, text: string): void {
    if (this.queueIfMissing(advisorId, () => this.appendThought(advisorId, text))) return;
    this.characters.get(advisorId)?.appendThought(text);
  }

  endThinking(advisorId: string): void {
    if (this.queueIfMissing(advisorId, () => this.endThinking(advisorId))) return;
    this.characters.get(advisorId)?.endThinking();
  }

  appendSpeech(advisorId: string, text: string): void {
    if (this.queueIfMissing(advisorId, () => this.appendSpeech(advisorId, text))) return;
    this.characters.get(advisorId)?.appendSpeech(text);
    this.focusAdvisor(advisorId);
  }

  speakFully(advisorId: string, text: string, opts?: { onDone?: () => void }): void {
    if (this.queueIfMissing(advisorId, () => this.speakFully(advisorId, text, opts))) return;
    this.characters.get(advisorId)?.speakFully(text, opts);
    this.focusAdvisor(advisorId);
  }

  showThinking(advisorId: string): void {
    if (this.queueIfMissing(advisorId, () => this.showThinking(advisorId))) return;
    const ch = this.characters.get(advisorId);
    if (!ch) return;
    ch.resetThought();
    ch.appendThought('…');
  }

  private queueIfMissing(advisorId: string, replay: () => void): boolean {
    if (this.characters.has(advisorId)) return false;
    let queue = this.pendingForAdvisor.get(advisorId);
    if (!queue) {
      queue = [];
      this.pendingForAdvisor.set(advisorId, queue);
    }
    queue.push(replay);
    return true;
  }

  private drainPending(advisorId: string): void {
    const queue = this.pendingForAdvisor.get(advisorId);
    if (!queue) return;
    this.pendingForAdvisor.delete(advisorId);
    for (const fn of queue) fn();
  }

  private pendingForAdvisor = new Map<string, Array<() => void>>();

  endTurn(advisorId: string): void {
    this.characters.get(advisorId)?.endSpeaking();
  }

  reset(): void {
    for (const [, c] of this.characters) c.reset();
    this.focusedId = null;
    this.applyFocus();
    this.pendingForAdvisor.clear();
  }
}

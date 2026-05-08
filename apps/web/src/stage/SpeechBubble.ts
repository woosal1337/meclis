import * as PIXI from 'pixi.js';

const MAX_WIDTH = 380;
const MIN_WIDTH = 200;
const PADDING_X = 18;
const PADDING_Y = 14;
const FONT_SIZE = 16;
const LINE_HEIGHT = 21;
const MAX_LINES = 14;
const ABS_MAX_TEXT_HEIGHT = LINE_HEIGHT * MAX_LINES;
const PARCHMENT = 0xf2e6c4;
const PARCHMENT_SHADOW = 0xd9c596;
const INK = 0x1f1407;
const ACCENT = 0x8a4a1a;

export class SpeechBubble {
  readonly root = new PIXI.Container();
  private bg: PIXI.Graphics;
  private text: PIXI.Text;
  private buf = '';
  private maxTextHeight = ABS_MAX_TEXT_HEIGHT;
  private active = false;
  private focused = true;

  constructor() {
    this.root.alpha = 0;
    this.bg = new PIXI.Graphics();
    this.text = new PIXI.Text({
      text: '',
      style: {
        fill: INK,
        fontFamily: 'EB Garamond, ui-serif, Georgia, serif',
        fontSize: FONT_SIZE,
        fontStyle: 'italic',
        wordWrap: true,
        wordWrapWidth: MAX_WIDTH - PADDING_X * 2,
        lineHeight: LINE_HEIGHT,
      },
    });
    this.root.addChild(this.bg, this.text);
    this.redraw();
  }

  show() {
    this.active = true;
    this.applyAlpha();
  }

  setFocused(focused: boolean): void {
    if (this.focused === focused) return;
    this.focused = focused;
    this.applyAlpha();
  }

  private applyAlpha(): void {
    const hasContent = this.buf.length > 0;
    this.root.alpha = this.active && hasContent ? (this.focused ? 1 : 0.55) : 0;
  }

  setHeadroom(availablePx: number): void {
    const next = Math.max(LINE_HEIGHT * 2, Math.min(ABS_MAX_TEXT_HEIGHT, availablePx));
    if (Math.abs(next - this.maxTextHeight) < 1) return;
    this.maxTextHeight = next;
    if (this.buf) {
      this.text.text = this.fitToLines(this.buf);
      this.redraw();
    }
  }

  reset() {
    this.buf = '';
    this.text.text = '';
    this.active = false;
    this.applyAlpha();
    this.redraw();
  }

  append(text: string) {
    const wasEmpty = this.buf.length === 0;
    this.buf += text;
    this.text.text = this.fitToLines(this.buf);
    this.redraw();
    if (wasEmpty) this.applyAlpha();
  }

  private fitToLines(raw: string): string {
    if (raw.length === 0) return raw;
    const probe = this.text;
    probe.text = raw;
    if (probe.height <= this.maxTextHeight) return raw;

    let lo = 0;
    let hi = raw.length;
    while (lo < hi) {
      const mid = (lo + hi + 1) >>> 1;
      probe.text = raw.slice(0, mid) + '…';
      if (probe.height <= this.maxTextHeight) lo = mid;
      else hi = mid - 1;
    }
    const cut = raw.slice(0, lo);
    const lastSpace = cut.lastIndexOf(' ');
    const safeCut = lastSpace > 20 ? cut.slice(0, lastSpace) : cut;
    return safeCut.replace(/[,;:.\s]+$/, '') + '…';
  }

  private redraw() {
    const w = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, this.text.width + PADDING_X * 2));
    const h = Math.max(48, this.text.height + PADDING_Y * 2);
    const left = -w / 2;
    const top = -h - 14;

    this.bg.clear();
    this.bg
      .roundRect(left + 3, top + 3, w, h, 6)
      .fill({ color: 0x000000, alpha: 0.32 });
    this.bg.roundRect(left, top, w, h, 6).fill(PARCHMENT);
    this.bg
      .rect(left + 4, top + h - 5, w - 8, 3)
      .fill({ color: PARCHMENT_SHADOW, alpha: 0.7 });
    this.bg.roundRect(left, top, w, h, 6).stroke({ color: ACCENT, width: 2 });
    this.bg
      .roundRect(left + 4, top + 4, w - 8, h - 8, 4)
      .stroke({ color: ACCENT, width: 1, alpha: 0.35 });

    this.bg
      .poly([-8, -14, 8, -14, 0, 0])
      .fill(PARCHMENT)
      .stroke({ color: ACCENT, width: 2 });

    this.text.position.set(left + PADDING_X, top + PADDING_Y);
  }
}

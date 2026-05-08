import * as PIXI from 'pixi.js';

const MAX_WIDTH = 280;
const PADDING = 12;
const MAX_CHARS = 240;

export class ThoughtBubble {
  readonly root = new PIXI.Container();
  private bg: PIXI.Graphics;
  private text: PIXI.Text;
  private buf = '';
  private fadeTarget = 0;

  constructor() {
    this.root.alpha = 0;
    this.bg = new PIXI.Graphics();
    this.text = new PIXI.Text({
      text: '',
      style: {
        fill: '#3a2a18',
        fontFamily: 'EB Garamond, ui-serif, Georgia, serif',
        fontSize: 15,
        fontStyle: 'italic',
        wordWrap: true,
        wordWrapWidth: MAX_WIDTH - PADDING * 2,
        lineHeight: 19,
      },
    });
    this.text.position.set(PADDING, PADDING);
    this.root.addChild(this.bg, this.text);
    this.redraw();
    PIXI.Ticker.shared.add(this.tick, this);
  }

  show() {
    this.fadeTarget = 1;
  }

  fadeOut() {
    this.fadeTarget = 0;
  }

  reset() {
    this.buf = '';
    this.text.text = '';
    this.root.alpha = 0;
    this.fadeTarget = 0;
    this.redraw();
  }

  append(text: string) {
    this.buf += text;
    const tail = this.buf.length > MAX_CHARS ? '…' + this.buf.slice(-MAX_CHARS) : this.buf;
    this.text.text = tail;
    this.fadeTarget = 1;
    this.redraw();
  }

  private redraw() {
    const w = Math.max(120, this.text.width + PADDING * 2);
    const h = Math.max(30, this.text.height + PADDING * 2);
    this.bg.clear();
    const cloudColor = 0xefe5cc;
    const stroke = { color: 0x6b5234, width: 1.5 } as const;
    this.bg.roundRect(-w / 2, -h, w, h, 18).fill(cloudColor).stroke(stroke);
    for (let i = 0; i < 3; i++) {
      const cx = -w / 2 + (w * (i + 1)) / 4;
      const cy = -h - 4;
      this.bg.circle(cx, cy, 8 + (i % 2) * 3).fill(cloudColor).stroke(stroke);
    }
    this.bg.circle(-12, 8, 5).fill(cloudColor).stroke(stroke);
    this.bg.circle(-22, 18, 3).fill(cloudColor).stroke(stroke);
    this.text.position.set(-w / 2 + PADDING, -h + PADDING);
  }

  private tick = (t: PIXI.Ticker) => {
    const speed = 0.06 * (t.deltaMS / 16.6);
    this.root.alpha += (this.fadeTarget - this.root.alpha) * speed;
  };
}

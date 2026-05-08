
export type Position = {
  x: number;
  y: number;
  scale: number;
  facing: 'left' | 'right';
};

export type BackgroundTransform = {
  scale: number;
  offsetX: number;
  offsetY: number;
};

export const BACKGROUND_NATIVE = { width: 2752, height: 1536 };

const DISCS = [
  { x: 1010, y: 1262 },
  { x: 1376, y: 1325 },
  { x: 1745, y: 1262 },
];

const CHARACTER_HEIGHT_FRAC = 0.34;

const SPRITE_NATIVE_HEIGHT = 768;

export function positionsFor(
  n: number,
  canvasW: number,
  canvasH: number,
  bg: BackgroundTransform,
): Position[] {
  if (n === 0) return [];

  const project = (nx: number, ny: number) => ({
    x: nx * bg.scale + bg.offsetX,
    y: ny * bg.scale + bg.offsetY,
  });

  const targetSpriteHeightCss = canvasH * CHARACTER_HEIGHT_FRAC;
  const baseScale = targetSpriteHeightCss / SPRITE_NATIVE_HEIGHT;

  let chosen: typeof DISCS;
  if (n === 1) chosen = [DISCS[1]];
  else if (n === 2) chosen = [DISCS[0], DISCS[2]];
  else chosen = DISCS;

  if (n > chosen.length) {
    chosen = [];
    for (let i = 0; i < n; i++) {
      const t = n === 1 ? 0.5 : i / (n - 1);
      const x = DISCS[0].x + (DISCS[2].x - DISCS[0].x) * t;
      const y =
        DISCS[0].y + (DISCS[2].y - DISCS[0].y) * t + Math.sin(t * Math.PI) * 12;
      chosen.push({ x, y });
    }
  }

  return chosen.slice(0, n).map((d, i) => {
    const p = project(d.x, d.y);
    const facing: 'left' | 'right' =
      i < n / 2 ? (n === 1 ? 'right' : 'right') : 'left';
    return {
      x: p.x,
      y: p.y,
      scale: baseScale,
      facing,
    };
  });
}

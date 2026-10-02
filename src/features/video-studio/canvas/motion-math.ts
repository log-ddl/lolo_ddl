export type MotionKind = 'imageMotion' | 'motionBobbing' | 'motionBreathing' | 'motionFrames';
export const MOTION_KINDS: MotionKind[] = ['imageMotion', 'motionBobbing', 'motionBreathing', 'motionFrames'];
export const MOTION_MODES = ['natural', 'bobbing', 'breathing', 'frames', 'sway', 'zoom', 'shake', 'spin', 'float'] as const;
export type MotionMode = typeof MOTION_MODES[number];
export function isMotionKind(kind: string): kind is MotionKind { return MOTION_KINDS.includes(kind as MotionKind); }
export function motionMode(kind: string, mode?: MotionMode): MotionMode {
  return mode ?? (kind === 'imageMotion' ? 'natural' : kind === 'motionBreathing' ? 'breathing' : kind === 'motionFrames' ? 'frames' : 'bobbing');
}
export const MOTION_ENTRANCES = ['none', 'pop', 'bottom', 'left', 'right', 'top'] as const;
export type MotionEntrance = typeof MOTION_ENTRANCES[number];
// Damped oscillator with the same mass/stiffness/damping as Character.tsx.
export function entranceSpring(frame: number) {
  const time = Math.max(0, frame) / 30;
  const decay = 12 / (2 * 0.6);
  const frequency = Math.sqrt(120 / 0.6 - decay * decay);
  return 1 - Math.exp(-decay * time) * (Math.cos(frequency * time) + decay / frequency * Math.sin(frequency * time));
}
export function motionAt(kind: MotionKind | MotionMode, frame: number, count: number, intensity = 1, speed = 1, entrance: MotionEntrance = 'none') {
  const mode = isMotionKind(kind) ? motionMode(kind) : kind;
  const f = frame * speed;
  let x = 0, y = 0, tilt = 0, scaleX = 1, scaleY = 1;
  switch (mode) {
    case 'natural':
    case 'frames':
      y = Math.sin(f / 7) * 6 * intensity; tilt = Math.sin(f / 12) * 1.8 * intensity;
      scaleY += Math.sin(f / 10) * .018 * intensity; scaleX -= Math.sin(f / 10) * .012 * intensity; break;
    case 'bobbing': y = Math.sin(f / 7) * 6 * intensity; tilt = Math.sin(f / 12) * 1.8 * intensity; break;
    case 'breathing': scaleY += Math.sin(f / 10) * .018 * intensity; scaleX -= Math.sin(f / 10) * .012 * intensity; break;
    case 'sway': x = Math.sin(f / 15) * 24 * intensity; break;
    case 'zoom': scaleX = scaleY = 1 + (1 - Math.cos(f / 24)) * .05 * intensity; break;
    case 'shake': x = Math.sin(f * 1.7) * 3 * intensity; y = Math.sin(f * 2.3) * 2 * intensity; tilt = Math.sin(f * 1.3) * .8 * intensity; break;
    case 'spin': tilt = f * intensity; break;
    case 'float': x = Math.sin(f / 24) * 12 * intensity; y = Math.sin(f / 17) * 10 * intensity; tilt = Math.sin(f / 30) * 2 * intensity; break;
  }
  let opacity = 1;
  if (entrance !== 'none') {
    const progress = entranceSpring(frame);
    const scale = entrance === 'pop' ? progress : .8 + progress * .2;
    scaleX *= scale; scaleY *= scale; opacity = Math.max(0, Math.min(1, progress / .4));
    if (entrance === 'bottom') y += 300 * (1 - progress);
    if (entrance === 'top') y -= 300 * (1 - progress);
    if (entrance === 'left') x -= 300 * (1 - progress);
    if (entrance === 'right') x += 300 * (1 - progress);
  }
  return { x, y, tilt, scaleX, scaleY, opacity, imageIndex: mode === 'frames' ? Math.floor(f / 6) % Math.max(1, count) : 0 };
}
/** CSS scaleX/scaleY followed by rotate, around a fixed bottom-center anchor.
 * Keep every coefficient fractional; only the final video dimensions are rounded. */
export function motionMatrix(width: number, height: number, motion: ReturnType<typeof motionAt>) {
  const angle = motion.tilt * Math.PI / 180;
  const a = motion.scaleX * Math.cos(angle), c = -motion.scaleX * Math.sin(angle);
  const b = motion.scaleY * Math.sin(angle), d = motion.scaleY * Math.cos(angle);
  return { a, b, c, d, e: motion.x - a * width / 2 - c * height, f: motion.y - b * width / 2 - d * height };
}
export function motionBounds(width: number, height: number, mode: MotionMode, frames: number, intensity: number, speed: number, entrance: MotionEntrance = 'none') {
  let minX = -width / 2, maxX = width / 2, minY = -height, maxY = 0;
  for (let frame = 0; frame < frames; frame++) {
    const m = motionMatrix(width, height, motionAt(mode, frame, 1, intensity, speed, entrance));
    for (const [x, y] of [[0, 0], [width, 0], [0, height], [width, height]]) {
      const px = m.a * x + m.c * y + m.e, py = m.b * x + m.d * y + m.f;
      minX = Math.min(minX, px); maxX = Math.max(maxX, px);
      minY = Math.min(minY, py); maxY = Math.max(maxY, py);
    }
  }
  return { width: Math.ceil((maxX - minX + 8) / 2) * 2, height: Math.ceil((maxY - minY + 8) / 2) * 2, originX: 4 - minX, originY: 4 - minY };
}

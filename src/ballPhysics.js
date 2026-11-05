import { BALL } from './config.js';

// Phần vật lý bóng dùng chung cho server (bóng thật) và máy khách (vẽ đường bay dự đoán khi ngắm),
// để đường vẽ trên cỏ khớp với đường bóng đi thật.

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

/** Tốc độ bóng ngay sau cú sút, theo lực 0..1. */
export const kickSpeed = (power) => BALL.kickMin + (BALL.kickMax - BALL.kickMin) * clamp(Number(power) || 0, 0, 1);

/** Độ xoáy (độ cong đường bay, dương = cong sang phải người sút) theo mức xoáy -1..1. */
export const spinOf = (curve) => BALL.curveRate * clamp(Number(curve) || 0, -1, 1);

/**
 * Bóng xoáy đi thêm một đoạn dt: bẻ hướng vận tốc sang phải (spin dương) hoặc trái. Góc bẻ tỉ lệ
 * quãng đường đi được, nên đường bay là vòng cung đều, sút nhẹ hay mạnh đều cong như nhau.
 */
export function turn(b, dt) {
  const a = b.spin * Math.hypot(b.vx, b.vz) * dt;
  const c = Math.cos(a);
  const s = Math.sin(a);
  const vx = b.vx * c - b.vz * s;
  b.vz = b.vz * c + b.vx * s;
  b.vx = vx;
}

/** Ma sát và xoáy tắt dần sau một bước dt. */
export function settle(b, dt) {
  const damp = Math.exp(-BALL.friction * dt);
  b.vx *= damp;
  b.vz *= damp;
  b.spin *= Math.exp(-BALL.spinDecay * dt);
  if (Math.hypot(b.vx, b.vz) < 0.05) b.vx = b.vz = b.spin = 0;
}

import { BALL } from './config.js';

// Phần vật lý bóng dùng chung cho server (bóng thật) và máy khách (vẽ đường bay dự đoán khi ngắm),
// để đường vẽ trên cỏ khớp với đường bóng đi thật.

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

/** Tốc độ bóng ngay sau cú sút, theo lực 0..1. */
export const kickSpeed = (power) => BALL.kickMin + (BALL.kickMax - BALL.kickMin) * clamp(Number(power) || 0, 0, 1);

/** Vận tốc bay lên theo độ bổng 0..1 (0 = sệt). */
export const loftVy = (loft) => BALL.loftVy * clamp(Number(loft) || 0, 0, 1);

/** Tốc độ ngang sau cú sút: bóng càng bổng càng đi chậm ngang. */
export const kickGroundSpeed = (power, loft) => kickSpeed(power) * (1 - BALL.loftSlow * clamp(Number(loft) || 0, 0, 1));

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

/** Bóng đi một bước nhỏ dt (chưa tính va chạm): xoáy bẻ hướng, bay theo trọng lực, chạm cỏ thì nảy. */
export function advance(b, dt) {
  if (b.spin) turn(b, dt);
  b.x += b.vx * dt;
  b.z += b.vz * dt;
  if (b.y > 0 || b.vy > 0) {
    b.vy -= BALL.gravity * dt;
    b.y += b.vy * dt;
    if (b.y <= 0) {
      b.y = 0;
      b.vy = b.vy < -1.5 ? -b.vy * BALL.groundBounce : 0;
    }
  }
}

/** Ma sát (lăn trên cỏ hoặc cản gió khi bay) và xoáy tắt dần sau một bước dt. */
export function settle(b, dt) {
  const air = b.y > 0.01;
  const damp = Math.exp(-(air ? BALL.airDrag : BALL.friction) * dt);
  b.vx *= damp;
  b.vz *= damp;
  b.spin *= Math.exp(-BALL.spinDecay * dt);
  if (!air && Math.hypot(b.vx, b.vz) < 0.05) b.vx = b.vz = b.spin = 0;
}

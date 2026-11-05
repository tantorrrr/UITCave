import { ARENA, BALL } from '../src/config.js';

// Quả bóng chung: server giữ vị trí thật, chạy vật lý 2D (mặt sàn) mỗi nhịp tick.
// Người chơi đi chạm vào bóng thì rê bóng; giữ nút sút để lấy lực, nhả ra thì bóng đi theo hướng ngắm.

const PLAYER_RADIUS = 0.55;
const POST_RADIUS = 0.08;
const BOUNCE = 0.75; // độ nảy khi chạm vách hang
const NET_BOUNCE = 0.3; // lưới mềm: bóng chạm lưới gần như dừng lại
const GOAL_BACK = BALL.goalLineX + BALL.goalDepth; // |x| của lưới sau
// Màn hình lớn: bóng không lăn ra sau màn (người chơi cũng bị chặn ở đây).
const SCREEN_LINE = ARENA.screenZ + 0.45;

export function createBall({ onGoal } = {}) {
  const ball = { x: BALL.start.x, z: BALL.start.z, vx: 0, vz: 0 };
  let lastTouchId = null;
  let goalUntil = 0; // sau khi ghi bàn: bóng nằm trong lưới một lúc rồi mới về chỗ cũ
  const score = { west: 0, east: 0 }; // west: khung -x, east: khung +x

  function reset() {
    ball.x = BALL.start.x;
    ball.z = BALL.start.z;
    ball.vx = 0;
    ball.vz = 0;
    goalUntil = 0;
  }

  // Bóng đang nằm trong lòng khung thành (sau vạch vôi, giữa hai cột dọc, trước lưới sau).
  const inGoalMouth = () =>
    Math.abs(ball.x) > BALL.goalLineX && Math.abs(ball.x) < GOAL_BACK && Math.abs(ball.z) < BALL.goalHalfWidth;

  // Nảy vào vật tròn (cột dọc khung thành).
  function bouncePost(px, pz) {
    const reach = POST_RADIUS + BALL.radius;
    const dx = ball.x - px;
    const dz = ball.z - pz;
    const d = Math.hypot(dx, dz);
    if (d >= reach || d < 1e-6) return;
    const nx = dx / d;
    const nz = dz / d;
    ball.x = px + nx * reach;
    ball.z = pz + nz * reach;
    const vn = ball.vx * nx + ball.vz * nz;
    if (vn < 0) {
      ball.vx -= 1.7 * vn * nx;
      ball.vz -= 1.7 * vn * nz;
    }
  }

  // Nảy vào một tấm phẳng mỏng (lưới khung thành, màn hình) từ đoạn (ax, az) tới (bx, bz), cả hai mặt.
  function bounceSegment(ax, az, bx, bz, k) {
    const sx = bx - ax;
    const sz = bz - az;
    const t = Math.min(1, Math.max(0, ((ball.x - ax) * sx + (ball.z - az) * sz) / (sx * sx + sz * sz)));
    const dx = ball.x - (ax + sx * t);
    const dz = ball.z - (az + sz * t);
    const d = Math.hypot(dx, dz);
    if (d >= BALL.radius || d < 1e-6) return;
    const nx = dx / d;
    const nz = dz / d;
    ball.x += nx * (BALL.radius - d);
    ball.z += nz * (BALL.radius - d);
    const vn = ball.vx * nx + ball.vz * nz;
    if (vn < 0) {
      ball.vx -= (1 + k) * vn * nx;
      ball.vz -= (1 + k) * vn * nz;
    }
  }

  // Bóng lăn tự do khắp hang: chỉ nảy ở vách hang, màn hình lớn, cột dọc và lưới khung thành
  // (lưới chặn cả từ ngoài vào, nên chỉ vào lòng khung thành được qua vạch vôi).
  function collide() {
    const R = BALL.radius;
    const gw = BALL.goalHalfWidth;
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) {
        bouncePost(sx * BALL.goalLineX, sz * gw);
        bounceSegment(sx * BALL.goalLineX, sz * gw, sx * GOAL_BACK, sz * gw, NET_BOUNCE); // lưới bên
      }
      bounceSegment(sx * GOAL_BACK, -gw, sx * GOAL_BACK, gw, NET_BOUNCE); // lưới sau
    }
    bounceSegment(-ARENA.screenHalfW, SCREEN_LINE, ARENA.screenHalfW, SCREEN_LINE, BOUNCE);
    // Vách hang (hình tròn).
    const r = Math.hypot(ball.x, ball.z);
    const max = ARENA.caveRadius - R;
    if (r > max) {
      const nx = ball.x / r;
      const nz = ball.z / r;
      ball.x = nx * max;
      ball.z = nz * max;
      const vn = ball.vx * nx + ball.vz * nz;
      if (vn > 0) {
        ball.vx -= (1 + BOUNCE) * vn * nx;
        ball.vz -= (1 + BOUNCE) * vn * nz;
      }
    }
  }

  /** Mỗi nhịp tick: rê bóng khi người chạm vào, di chuyển, va chạm, kiểm bàn thắng. */
  function step(dt, players) {
    const now = Date.now();
    if (goalUntil) {
      if (now >= goalUntil) reset();
      else {
        ball.vx *= 0.8;
        ball.vz *= 0.8;
      }
    } else {
      for (const p of players) {
        if (p.ghostUntil) continue; // ma đi xuyên bóng
        const dx = ball.x - p.x;
        const dz = ball.z - p.z;
        const d = Math.hypot(dx, dz);
        const reach = PLAYER_RADIUS + BALL.radius;
        if (d >= reach) continue;
        const nx = d > 1e-3 ? dx / d : Math.sin(p.ry);
        const nz = d > 1e-3 ? dz / d : Math.cos(p.ry);
        // Rê bóng: chạy vào bóng từ phía sau thì bóng được kéo về ngay trước mũi giày và lăn theo
        // hướng chạy, nhanh hơn người một chút nên dính chân. Chạm ngang/đứng yên thì chỉ đẩy ra.
        const pv = Math.hypot(p.vx ?? 0, p.vz ?? 0);
        let ux = nx;
        let uz = nz;
        if (pv > 0.8 && (p.vx * nx + p.vz * nz) / pv > 0.3) {
          ux = (p.vx / pv) * 0.9 + nx * 0.1;
          uz = (p.vz / pv) * 0.9 + nz * 0.1;
          const ul = Math.hypot(ux, uz) || 1;
          ux /= ul;
          uz /= ul;
        }
        ball.x = p.x + ux * reach;
        ball.z = p.z + uz * reach;
        const speed = Math.max(BALL.dribbleSpeed, pv * BALL.dribbleBoost);
        ball.vx = ux * speed;
        ball.vz = uz * speed;
        lastTouchId = p.id;
      }
    }

    // Sút mạnh đi xa mỗi nhịp: chia nhỏ bước để khỏi xuyên qua cột dọc.
    const n = Math.max(1, Math.ceil((Math.hypot(ball.vx, ball.vz) * dt) / 0.3));
    for (let i = 0; i < n; i++) {
      ball.x += (ball.vx * dt) / n;
      ball.z += (ball.vz * dt) / n;
      collide();
    }
    const damp = Math.exp(-BALL.friction * dt);
    ball.vx *= damp;
    ball.vz *= damp;
    if (Math.hypot(ball.vx, ball.vz) < 0.05) ball.vx = ball.vz = 0;

    if (!goalUntil && inGoalMouth()) {
      const side = ball.x > 0 ? 'east' : 'west';
      score[side] += 1;
      goalUntil = now + 2500;
      onGoal?.({ side, scorerId: lastTouchId, score: { ...score } });
    }
  }

  /**
   * Người chơi sút: chỉ tính khi đứng đủ gần bóng. power 0..1 (giữ nút lâu thì mạnh),
   * aim là hướng ngắm {x, z} từ máy khách; thiếu thì theo hướng đang chạy. Trả về true nếu sút được.
   */
  function kick(p, power = 1, aim = null) {
    if (goalUntil || p.ghostUntil) return false;
    const dx = ball.x - p.x;
    const dz = ball.z - p.z;
    const d = Math.hypot(dx, dz);
    if (d > BALL.kickRange) return false;
    // Hướng sút: theo hướng ngắm; không có thì theo hướng đang chạy, đứng yên thì từ người tới bóng.
    let nx = p.vx ?? 0;
    let nz = p.vz ?? 0;
    let len = Math.hypot(nx, nz);
    const ax = Number(aim?.x);
    const az = Number(aim?.z);
    if (Number.isFinite(ax) && Number.isFinite(az) && Math.hypot(ax, az) > 1e-3) {
      nx = ax;
      nz = az;
      len = Math.hypot(ax, az);
    } else if (len < 0.8) {
      nx = dx;
      nz = dz;
      len = d;
    }
    if (len < 1e-3) {
      nx = Math.sin(p.ry);
      nz = Math.cos(p.ry);
      len = 1;
    }
    const pw = Math.min(1, Math.max(0, Number(power) || 0));
    const speed = BALL.kickMin + (BALL.kickMax - BALL.kickMin) * pw;
    ball.vx = (nx / len) * speed;
    ball.vz = (nz / len) * speed;
    lastTouchId = p.id;
    return true;
  }

  return {
    step,
    kick,
    reset,
    get score() {
      return { ...score };
    },
    /** Gói gọn để gửi kèm tin `state`: [x, z, vx, vz]. */
    snapshot: () => [+ball.x.toFixed(2), +ball.z.toFixed(2), +ball.vx.toFixed(2), +ball.vz.toFixed(2)],
  };
}

import { ARENA, BALL } from '../src/config.js';

// Quả bóng chung: server giữ vị trí thật, chạy vật lý 2D (mặt sàn) mỗi nhịp tick.
// Người chơi đi chạm vào bóng thì rê bóng; bấm sút thì bóng bay mạnh theo hướng đang chạy.

const PLAYER_RADIUS = 0.55;
const WALL = ARENA.caveRadius - BALL.radius;

export function createBall({ onGoal } = {}) {
  const ball = { x: BALL.start.x, z: BALL.start.z, vx: 0, vz: 0 };
  let lastTouchId = null;
  let lastTouchAt = Date.now();
  let goalUntil = 0; // sau khi ghi bàn: bóng nằm trong lưới một lúc rồi mới về chỗ cũ
  const score = { west: 0, east: 0 }; // west: khung -x, east: khung +x

  function reset() {
    ball.x = BALL.start.x;
    ball.z = BALL.start.z;
    ball.vx = 0;
    ball.vz = 0;
    goalUntil = 0;
    lastTouchAt = Date.now();
  }

  // Bóng đang nằm trong lòng khung thành (sau vạch vôi, giữa hai cột dọc).
  const inGoalMouth = () => Math.abs(ball.x) > BALL.goalLineX && Math.abs(ball.z) < BALL.goalHalfWidth;

  function collide() {
    const back = BALL.goalLineX + BALL.goalDepth - BALL.radius;
    if (inGoalMouth()) {
      // Trong lưới: chặn lưới sau và hai bên.
      if (Math.abs(ball.x) > back) {
        ball.x = Math.sign(ball.x) * back;
        ball.vx *= -0.2;
      }
    } else {
      // Cột dọc + hai má lưới: bóng đến gần vạch vôi ngoài lòng khung thì nảy ra.
      if (Math.abs(ball.x) > BALL.goalLineX && Math.abs(ball.z) < BALL.goalHalfWidth + 0.4 && Math.abs(ball.x) < back + 0.4) {
        ball.z = Math.sign(ball.z || 1) * (BALL.goalHalfWidth + 0.4);
        ball.vz *= -0.6;
      }
    }

    // Vách hang: phản xạ thành phần hướng tâm.
    const r = Math.hypot(ball.x, ball.z);
    if (r > WALL) {
      const nx = ball.x / r;
      const nz = ball.z / r;
      ball.x = nx * WALL;
      ball.z = nz * WALL;
      const vn = ball.vx * nx + ball.vz * nz;
      if (vn > 0) {
        ball.vx -= 1.7 * vn * nx;
        ball.vz -= 1.7 * vn * nz;
      }
    }
    // Đống lửa ở giữa.
    const fr = ARENA.fireRadius + BALL.radius;
    if (r < fr) {
      const nx = r > 0 ? ball.x / r : 0;
      const nz = r > 0 ? ball.z / r : 1;
      ball.x = nx * fr;
      ball.z = nz * fr;
      const vn = ball.vx * nx + ball.vz * nz;
      if (vn < 0) {
        ball.vx -= 1.7 * vn * nx;
        ball.vz -= 1.7 * vn * nz;
      }
    }
    // Không lọt ra sau màn hình lớn.
    const screenFront = ARENA.screenZ + 0.8 + BALL.radius;
    if (Math.abs(ball.x) < ARENA.screenHalfW && ball.z < screenFront) {
      ball.z = screenFront;
      if (ball.vz < 0) ball.vz *= -0.7;
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
        // Đẩy bóng ra khỏi người, rồi cho bóng lăn theo hướng người đang đi vào nó.
        ball.x = p.x + nx * reach;
        ball.z = p.z + nz * reach;
        const speed = Math.max(BALL.dribbleSpeed, Math.hypot(p.vx ?? 0, p.vz ?? 0) * 1.25);
        ball.vx = nx * speed;
        ball.vz = nz * speed;
        lastTouchId = p.id;
        lastTouchAt = now;
      }
    }

    ball.x += ball.vx * dt;
    ball.z += ball.vz * dt;
    const damp = Math.exp(-BALL.friction * dt);
    ball.vx *= damp;
    ball.vz *= damp;
    if (Math.hypot(ball.vx, ball.vz) < 0.05) ball.vx = ball.vz = 0;
    collide();

    if (!goalUntil && inGoalMouth()) {
      const side = ball.x > 0 ? 'east' : 'west';
      score[side] += 1;
      goalUntil = now + 2500;
      onGoal?.({ side, scorerId: lastTouchId, score: { ...score } });
    }
    // Không ai chạm một lúc lâu mà bóng nằm xa chỗ cũ (kẹt góc) thì tự về.
    if (!goalUntil && now - lastTouchAt > BALL.idleResetMs && Math.hypot(ball.x - BALL.start.x, ball.z - BALL.start.z) > 1) reset();
  }

  /** Người chơi bấm sút: chỉ tính khi đứng đủ gần bóng. Trả về true nếu sút được. */
  function kick(p) {
    if (goalUntil || p.ghostUntil) return false;
    const dx = ball.x - p.x;
    const dz = ball.z - p.z;
    const d = Math.hypot(dx, dz);
    if (d > BALL.kickRange) return false;
    // Hướng sút: theo hướng đang chạy; đứng yên thì theo hướng từ người tới bóng.
    let nx = p.vx ?? 0;
    let nz = p.vz ?? 0;
    let len = Math.hypot(nx, nz);
    if (len < 0.8) {
      nx = dx;
      nz = dz;
      len = d;
    }
    if (len < 1e-3) {
      nx = Math.sin(p.ry);
      nz = Math.cos(p.ry);
      len = 1;
    }
    ball.vx = (nx / len) * BALL.kickSpeed;
    ball.vz = (nz / len) * BALL.kickSpeed;
    lastTouchId = p.id;
    lastTouchAt = Date.now();
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

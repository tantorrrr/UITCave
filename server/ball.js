import { BALL, PITCH } from '../src/config.js';

// Quả bóng chung: server giữ vị trí thật, chạy vật lý 2D (mặt sàn) mỗi nhịp tick.
// Người chơi đi chạm vào bóng thì rê bóng; giữ nút sút để lấy lực, nhả ra thì bóng đi theo hướng ngắm.

const PLAYER_RADIUS = 0.55;
const POST_RADIUS = 0.08;
const BOUNCE = 0.75; // độ nảy khi chạm vách biên

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

  // Sân mini có vách biên: bóng nảy lại ở biên dọc và biên ngang, chỉ lọt được vào lòng khung thành.
  function collide() {
    const R = BALL.radius;
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) bouncePost(sx * BALL.goalLineX, sz * BALL.goalHalfWidth);

    if (Math.abs(ball.z) < BALL.goalHalfWidth) {
      // Đang trong làn khung thành: được qua vạch vôi, chặn ở lưới sau.
      const back = BALL.goalLineX + BALL.goalDepth - R;
      if (Math.abs(ball.x) > back) {
        ball.x = Math.sign(ball.x) * back;
        ball.vx *= -0.2;
      }
      // Trong lưới thì hai lưới bên giữ bóng lại.
      const sideNet = BALL.goalHalfWidth - R;
      if (Math.abs(ball.x) > BALL.goalLineX && Math.abs(ball.z) > sideNet) {
        ball.z = Math.sign(ball.z) * sideNet;
        ball.vz *= -0.3;
      }
    } else if (Math.abs(ball.x) > PITCH.halfLength - R) {
      // Vách biên ngang hai đầu sân (ngoài lòng khung thành).
      ball.x = Math.sign(ball.x) * (PITCH.halfLength - R);
      ball.vx *= -BOUNCE;
    }
    // Vách biên dọc.
    if (Math.abs(ball.z) > PITCH.halfWidth - R) {
      ball.z = Math.sign(ball.z) * (PITCH.halfWidth - R);
      ball.vz *= -BOUNCE;
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
        lastTouchAt = now;
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
    // Không ai chạm một lúc lâu mà bóng nằm xa chỗ cũ (kẹt góc) thì tự về.
    if (!goalUntil && now - lastTouchAt > BALL.idleResetMs && Math.hypot(ball.x - BALL.start.x, ball.z - BALL.start.z) > 1) reset();
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

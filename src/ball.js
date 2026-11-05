import * as THREE from 'three';
import { BALL } from './config.js';
import { kickSpeed, settle, spinOf, turn } from './ballPhysics.js';
import { textCanvas } from './scenery.js';

// Hiển thị quả bóng chung và hai khung thành. Vị trí thật do server quyết định (server/ball.js);
// ở đây chỉ nội suy cho mượt, lăn tròn theo quãng đường, và nhích bóng ngay khi mình bấm sút.

/** Texture bóng kiểu "ngũ giác đen trên nền trắng" (vẽ tay, không lấy mẫu bóng của hãng nào). */
function ballTexture() {
  return textCanvas(512, 256, (g, w, h) => {
    g.fillStyle = '#f7f7f2';
    g.fillRect(0, 0, w, h);
    g.fillStyle = '#1b1b1b';
    const penta = (cx, cy, r) => {
      g.beginPath();
      for (let i = 0; i < 5; i++) {
        const a = -Math.PI / 2 + (i * Math.PI * 2) / 5;
        g.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.9);
      }
      g.closePath();
      g.fill();
    };
    for (let row = 0; row < 3; row++) {
      for (let i = 0; i < 6; i++) {
        const cx = (i + (row % 2) * 0.5) * (w / 6) + 20;
        const cy = 42 + row * 86;
        penta(cx % w, cy, row === 1 ? 30 : 24);
      }
    }
    g.strokeStyle = 'rgba(0,0,0,0.25)';
    g.lineWidth = 3;
    for (let x = 0; x < w; x += w / 12) {
      g.beginPath();
      g.moveTo(x, 0);
      g.lineTo(x + 20, h);
      g.stroke();
    }
  });
}

function netTexture() {
  const tex = textCanvas(128, 128, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    g.strokeStyle = 'rgba(255,255,255,0.85)';
    g.lineWidth = 3;
    for (let i = 0; i <= w; i += 16) {
      g.beginPath();
      g.moveTo(i, 0);
      g.lineTo(i, h);
      g.moveTo(0, i);
      g.lineTo(w, i);
      g.stroke();
    }
  });
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

/** Khung thành mini: 2 cột dọc, xà ngang, lưới sau và hai bên; biển số bàn phía trên. */
function createGoal(side) {
  const sx = side === 'east' ? 1 : -1;
  const group = new THREE.Group();
  const W = BALL.goalHalfWidth * 2;
  const H = BALL.goalHeight;
  const D = BALL.goalDepth;
  const postMat = new THREE.MeshStandardMaterial({ color: '#f4f4f0', roughness: 0.4 });
  const postGeo = new THREE.CylinderGeometry(0.08, 0.08, H, 10);
  for (const z of [-W / 2, W / 2]) {
    const post = new THREE.Mesh(postGeo, postMat);
    post.position.set(0, H / 2, z);
    post.castShadow = true;
    group.add(post);
  }
  const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, W + 0.16, 10), postMat);
  bar.rotation.x = Math.PI / 2;
  bar.position.set(0, H, 0);
  group.add(bar);

  const net = netTexture();
  const netMat = new THREE.MeshBasicMaterial({ map: net, transparent: true, side: THREE.DoubleSide, depthWrite: false });
  const back = new THREE.Mesh(new THREE.PlaneGeometry(W, H), netMat);
  back.rotation.y = Math.PI / 2;
  back.position.set(sx * D, H / 2, 0);
  net.repeat.set(W / 0.6, H / 0.6);
  group.add(back);
  for (const z of [-W / 2, W / 2]) {
    const sideNet = new THREE.Mesh(new THREE.PlaneGeometry(D, H), netMat);
    sideNet.position.set((sx * D) / 2, H / 2, z);
    group.add(sideNet);
  }
  const roof = new THREE.Mesh(new THREE.PlaneGeometry(D, W), netMat);
  roof.rotation.x = Math.PI / 2;
  roof.position.set((sx * D) / 2, H, 0);
  group.add(roof);
  // Vạch vôi.
  const line = new THREE.Mesh(
    new THREE.PlaneGeometry(0.12, W + 1),
    new THREE.MeshBasicMaterial({ color: '#f4f4f0', transparent: true, opacity: 0.7 }),
  );
  line.rotation.x = -Math.PI / 2;
  line.position.set(0, 0.02, 0);
  group.add(line);

  // Biển số bàn đã lọt lưới khung này.
  let goals = 0;
  const label = side === 'east' ? 'KHUNG ĐÔNG' : 'KHUNG TÂY';
  const signTex = textCanvas(512, 160, (g, w, h) => drawSign(g, w, h));
  function drawSign(g, w, h) {
    g.fillStyle = '#14301c';
    g.fillRect(0, 0, w, h);
    g.strokeStyle = '#f4f4f0';
    g.lineWidth = 8;
    g.strokeRect(4, 4, w - 8, h - 8);
    g.fillStyle = '#ffffff';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.font = '700 40px "Be Vietnam Pro", sans-serif';
    g.fillText(label, w / 2, 48);
    g.font = '800 64px Bitter, Georgia, serif';
    g.fillText(`⚽ ${goals}`, w / 2, 112);
  }
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.75), new THREE.MeshBasicMaterial({ map: signTex }));
  sign.position.set(0, H + 0.7, 0);
  sign.rotation.y = -sx * Math.PI / 2; // quay vào giữa hang
  group.add(sign);

  group.position.set(sx * BALL.goalLineX, 0, 0);
  return {
    group,
    side,
    setGoals(n) {
      goals = n;
      drawSign(signTex.image.getContext('2d'), signTex.image.width, signTex.image.height);
      signTex.needsUpdate = true;
    },
    redraw() {
      this.setGoals(goals);
    },
  };
}

export function createBallView(scene, { fontsReady } = {}) {
  const geo = new THREE.SphereGeometry(BALL.radius, 24, 16);
  const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: ballTexture(), roughness: 0.5 }));
  mesh.castShadow = true;
  mesh.position.set(BALL.start.x, BALL.radius, BALL.start.z);
  scene.add(mesh);
  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(BALL.radius * 1.1, 20),
    new THREE.MeshBasicMaterial({ color: '#000', transparent: true, opacity: 0.35, depthWrite: false }),
  );
  shadow.rotation.x = -Math.PI / 2;
  scene.add(shadow);

  const goals = { west: createGoal('west'), east: createGoal('east') };
  scene.add(goals.west.group, goals.east.group);
  fontsReady?.().then(() => Object.values(goals).forEach((g) => g.redraw()));

  // Trạng thái nhận từ server + thời điểm nhận, để ngoại suy giữa hai nhịp.
  const target = new THREE.Vector3(BALL.start.x, 0, BALL.start.z);
  const vel = new THREE.Vector3();
  let recvAt = performance.now();
  const shown = new THREE.Vector3(BALL.start.x, 0, BALL.start.z);
  const prev = shown.clone();
  const axis = new THREE.Vector3();
  const q = new THREE.Quaternion();
  let bounce = 0;

  return {
    get position() {
      return shown;
    },
    /** b = [x, z, vx, vz] từ tin `state`. */
    setState(b) {
      if (!b) return;
      target.set(b[0], 0, b[1]);
      vel.set(b[2], 0, b[3]);
      recvAt = performance.now();
    },
    setScore(score) {
      if (!score) return;
      goals.west.setGoals(score.west ?? 0);
      goals.east.setGoals(score.east ?? 0);
    },
    goalPosition(side) {
      return goals[side].group.position;
    },
    /** Mình vừa bấm sút: nhích bóng ngay theo hướng đó cho có cảm giác, server sẽ chỉnh lại. */
    nudge(dirX, dirZ) {
      shown.x += dirX * 0.35;
      shown.z += dirZ * 0.35;
      bounce = 0.25;
    },
    update(dt) {
      const ahead = Math.min(0.15, (performance.now() - recvAt) / 1000);
      const px = target.x + vel.x * ahead;
      const pz = target.z + vel.z * ahead;
      const k = 1 - Math.exp(-dt * 14);
      prev.copy(shown);
      shown.x += (px - shown.x) * k;
      shown.z += (pz - shown.z) * k;
      // Lăn tròn theo quãng đường đi được.
      const dx = shown.x - prev.x;
      const dz = shown.z - prev.z;
      const dist = Math.hypot(dx, dz);
      if (dist > 1e-4) {
        axis.set(dz, 0, -dx).normalize();
        q.setFromAxisAngle(axis, dist / BALL.radius);
        mesh.quaternion.premultiply(q);
      }
      bounce = Math.max(0, bounce - dt);
      mesh.position.set(shown.x, BALL.radius + Math.sin((bounce / 0.25) * Math.PI) * 0.35, shown.z);
      shadow.position.set(shown.x, 0.02, shown.z);
    },
  };
}

/**
 * Ngắm sút (chỉ mình thấy): mũi tên trên cỏ ngay trước bóng, và khi đang lấy lực thì thêm chuỗi
 * chấm vẽ đường bay dự đoán (cong theo độ xoáy, dài theo lực). show(pos, dir, power, curve):
 * pos null thì ẩn; power < 0 là đang đứng gần bóng (mờ, ngắn), 0..1 là đang lấy lực.
 */
export function createAimArrow(scene) {
  const shape = new THREE.Shape();
  // Vẽ dọc trục +y, gốc ở 0: thân dài 1, đầu nhọn rộng 0.5.
  shape.moveTo(-0.09, 0);
  shape.lineTo(0.09, 0);
  shape.lineTo(0.09, 0.72);
  shape.lineTo(0.25, 0.72);
  shape.lineTo(0, 1);
  shape.lineTo(-0.25, 0.72);
  shape.lineTo(-0.09, 0.72);
  shape.closePath();
  const geo = new THREE.ShapeGeometry(shape);
  geo.rotateX(-Math.PI / 2); // nằm trên mặt sàn, mũi chỉ về -z
  geo.rotateY(Math.PI); // mũi chỉ về +z
  const mat = new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, depthWrite: false });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.renderOrder = 2;
  mesh.visible = false;
  scene.add(mesh);

  // Chấm đường bay: chạy thử vật lý thật của bóng (không tính va chạm) trong một khoảng thời gian.
  const DOTS = 28;
  const dotGeo = new THREE.CircleGeometry(0.14, 10);
  dotGeo.rotateX(-Math.PI / 2);
  const dotMat = new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, depthWrite: false });
  const dots = new THREE.InstancedMesh(dotGeo, dotMat, DOTS);
  dots.renderOrder = 2;
  dots.frustumCulled = false;
  dots.visible = false;
  scene.add(dots);
  const m4 = new THREE.Matrix4();
  const fly = { vx: 0, vz: 0, spin: 0 };

  const color = new THREE.Color();
  return {
    show(pos, dir, power, curve = 0) {
      mesh.visible = !!pos;
      const charging = !!pos && power >= 0;
      dots.visible = charging;
      if (!pos) return;
      const len = charging ? 1.4 : 1.3;
      mesh.scale.set(charging ? 1.3 : 1, 1, len);
      mesh.position.set(pos.x + dir.x * (BALL.radius + 0.1), 0.04, pos.z + dir.z * (BALL.radius + 0.1));
      mesh.rotation.y = Math.atan2(dir.x, dir.z);
      mat.opacity = charging ? 0.85 : 0.3;
      mat.color.copy(charging ? color.setHSL((120 - power * 120) / 360, 0.85, 0.55) : color.set('#ffffff'));
      if (!charging) return;
      dotMat.color.copy(mat.color);
      // Dự đoán 0.35s → 1.1s đường bay tuỳ lực, chia đều cho các chấm.
      const speed = kickSpeed(power);
      Object.assign(fly, { vx: dir.x * speed, vz: dir.z * speed, spin: spinOf(curve) });
      const span = 0.35 + power * 0.75;
      const sub = 4;
      const dt = span / DOTS / sub;
      let x = pos.x;
      let z = pos.z;
      for (let i = 0; i < DOTS; i++) {
        for (let k = 0; k < sub; k++) {
          turn(fly, dt);
          x += fly.vx * dt;
          z += fly.vz * dt;
          settle(fly, dt);
        }
        const s = 1 - (i / DOTS) * 0.6; // chấm nhỏ dần về cuối
        m4.makeScale(s, 1, s).setPosition(x, 0.05, z);
        dots.setMatrixAt(i, m4);
      }
      dots.instanceMatrix.needsUpdate = true;
      dotMat.opacity = 0.8;
    },
  };
}

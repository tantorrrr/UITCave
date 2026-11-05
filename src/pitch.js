import * as THREE from 'three';
import { BALL, BRAND, PITCH } from './config.js';
import { textCanvas } from './scenery.js';

// Sân bóng mini giữa hang: mặt cỏ kẻ vạch, vách biên thấp (bóng nảy lại, người bước qua được),
// bốn cột đèn sân thay cho ánh lửa trước đây.

const L = PITCH.halfLength * 2;
const W = PITCH.halfWidth * 2;

/** Mặt cỏ sọc + vạch vôi, vẽ trên canvas theo tỉ lệ sân (px trên mỗi đơn vị). */
function turfTexture() {
  const S = 40;
  return textCanvas(L * S, W * S, (g, w, h) => {
    const stripes = 10;
    for (let i = 0; i < stripes; i++) {
      g.fillStyle = i % 2 ? '#2f8a3b' : '#36993f';
      g.fillRect((i * w) / stripes, 0, w / stripes + 1, h);
    }
    g.strokeStyle = 'rgba(255,255,255,0.92)';
    g.lineWidth = 0.12 * S;
    const m = 0.35 * S; // mép trong của vạch biên
    g.strokeRect(m, m, w - 2 * m, h - 2 * m);
    // Vạch giữa sân, vòng tròn giữa sân, chấm giữa.
    g.beginPath();
    g.moveTo(w / 2, m);
    g.lineTo(w / 2, h - m);
    g.stroke();
    g.beginPath();
    g.arc(w / 2, h / 2, 2.4 * S, 0, Math.PI * 2);
    g.stroke();
    g.fillStyle = 'rgba(255,255,255,0.92)';
    g.beginPath();
    g.arc(w / 2, h / 2, 0.18 * S, 0, Math.PI * 2);
    g.fill();
    // Vòng cấm địa (kiểu sân 5 người: nửa vòng tròn) + chấm phạt đền.
    for (const side of [0, 1]) {
      const x = side ? w - m : m;
      const dir = side ? -1 : 1;
      g.beginPath();
      g.arc(x, h / 2, 4.2 * S, -Math.PI / 2, Math.PI / 2, side === 1);
      g.stroke();
      g.beginPath();
      g.arc(x + dir * 3.2 * S, h / 2, 0.15 * S, 0, Math.PI * 2);
      g.fill();
    }
    // Cung phạt góc.
    for (const [cx, cy, a0] of [[m, m, 0], [w - m, m, Math.PI / 2], [w - m, h - m, Math.PI], [m, h - m, -Math.PI / 2]]) {
      g.beginPath();
      g.arc(cx, cy, 0.6 * S, a0, a0 + Math.PI / 2);
      g.stroke();
    }
  });
}

/** Vách biên: chữ thương hiệu lặp lại như bảng quảng cáo sân bóng. */
function boardTexture(length) {
  const tex = textCanvas(512, 64, (g, w, h) => {
    g.fillStyle = BRAND.jersey.body;
    g.fillRect(0, 0, w, h);
    g.fillStyle = BRAND.jersey.trim;
    g.fillRect(0, h - 6, w, 6);
    g.fillStyle = '#ffffff';
    g.font = '800 34px Bitter, Georgia, serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(`${BRAND.signMain} · VÀO HANG`, w / 2, h / 2);
  });
  tex.wrapS = THREE.RepeatWrapping;
  tex.repeat.set(Math.max(1, Math.round(length / 6)), 1);
  return tex;
}

export function createPitch(scene) {
  const group = new THREE.Group();
  scene.add(group);

  const turf = new THREE.Mesh(
    new THREE.PlaneGeometry(L, W),
    new THREE.MeshStandardMaterial({ map: turfTexture(), roughness: 0.95 }),
  );
  turf.rotation.x = -Math.PI / 2;
  turf.position.y = 0.015;
  turf.receiveShadow = true;
  group.add(turf);

  // Viền đất nện quanh sân cho tách khỏi nền hang.
  const apron = new THREE.Mesh(
    new THREE.PlaneGeometry(L + 2.4, W + 2.4),
    new THREE.MeshStandardMaterial({ color: '#2b2118', roughness: 1 }),
  );
  apron.rotation.x = -Math.PI / 2;
  apron.position.y = 0.008;
  apron.receiveShadow = true;
  group.add(apron);

  // Vách biên thấp; hai đầu sân chừa lòng khung thành.
  const H = PITCH.boardHeight;
  const T = 0.12;
  const edgeMat = new THREE.MeshStandardMaterial({ color: '#16316e' });
  const board = (len, x, z, rotY) => {
    const tex = boardTexture(len);
    const face = new THREE.MeshStandardMaterial({ map: tex, emissive: '#ffffff', emissiveMap: tex, emissiveIntensity: 0.25 });
    // Thứ tự mặt hộp: +x, -x, +y, -y, +z, -z; hai mặt dài in chữ.
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(len, H, T), [edgeMat, edgeMat, edgeMat, edgeMat, face, face]);
    mesh.position.set(x, H / 2, z);
    mesh.rotation.y = rotY;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
  };
  const hl = PITCH.halfLength;
  const hw = PITCH.halfWidth;
  board(L, 0, hw + T / 2, Math.PI); // mặt có chữ quay vào trong sân
  board(L, 0, -hw - T / 2, 0);
  const endLen = hw - BALL.goalHalfWidth;
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      board(endLen, sx * (hl + T / 2), sz * (BALL.goalHalfWidth + endLen / 2), sx > 0 ? -Math.PI / 2 : Math.PI / 2);
    }
  }

  // Bốn cột đèn sân ở bốn góc, rọi vào giữa sân.
  const poleMat = new THREE.MeshStandardMaterial({ color: '#59606b', metalness: 0.5, roughness: 0.5 });
  const lampMat = new THREE.MeshBasicMaterial({ color: '#fff7dd' });
  const lamps = [];
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const x = sx * (hl + 1.4);
      const z = sz * (hw + 1.6);
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, 8, 8), poleMat);
      pole.position.set(x, 4, z);
      group.add(pole);
      const head = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.7, 0.25), lampMat);
      head.position.set(x, 8.1, z);
      head.lookAt(0, 0, 0);
      group.add(head);
      const light = new THREE.SpotLight('#fff3d6', 140, 34, Math.PI / 4.2, 0.45, 1.2);
      light.position.set(x, 8, z);
      light.target.position.set(-sx * 3, 0, -sz * 2);
      group.add(light, light.target);
      lamps.push(light);
    }
  }
  // Một nguồn sáng chính từ trên cao để nhân vật và bóng có bóng đổ (rẻ hơn bóng đổ từ 4 đèn).
  const sun = new THREE.DirectionalLight('#fff1d8', 1.2);
  sun.position.set(4, 16, 6);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, { left: -16, right: 16, top: 12, bottom: -12, near: 1, far: 40 });
  sun.shadow.bias = -0.0015;
  group.add(sun, sun.target);

  return { group, lamps };
}

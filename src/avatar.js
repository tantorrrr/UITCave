import * as THREE from 'three';
import { BRAND, CLUBS } from './config.js';

const SKIN = '#e8b896';

// Áo mặc định khi không chọn CLB: màu thương hiệu Hang Uit.
const DEFAULT_KIT = {
  body: BRAND.jersey.body,
  sleeve: BRAND.jersey.body,
  trim: BRAND.jersey.trim,
  shorts: '#f4f1ea',
  number: BRAND.jersey.number,
};

/** Bộ màu áo theo mã CLB (liverpool, barcelona…); mã lạ hoặc rỗng → áo Hang Uit. */
export function kitOf(club) {
  return CLUBS[club]?.kit ?? DEFAULT_KIT;
}

/** Vẽ sọc dọc (Barca) lên vùng (x, y, w, h). */
function drawStripes(g, kit, x, y, w, h, count) {
  if (!kit.stripe) return;
  const sw = w / count;
  g.fillStyle = kit.stripe;
  for (let i = 1; i < count; i += 2) g.fillRect(x + i * sw, y, sw, h);
}

function jerseyTexture(number, kit) {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = kit.body;
  g.fillRect(0, 0, c.width, c.height);
  drawStripes(g, kit, 0, 0, c.width, c.height, 12);
  // Viền cổ/vai
  g.fillStyle = kit.trim;
  g.fillRect(0, 0, c.width, 14);
  // UV u=0.5 của CylinderGeometry nằm phía -z = lưng nhân vật.
  if (number) {
    g.fillStyle = kit.number;
    g.font = '800 150px Bitter, Georgia, serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    // Viền chữ để số vẫn rõ trên áo sọc hoặc áo trắng.
    g.lineWidth = 6;
    g.strokeStyle = 'rgba(0,0,0,0.25)';
    g.strokeText(String(number), c.width / 2, 140);
    g.fillText(String(number), c.width / 2, 140);
  }
  // Huy hiệu nhỏ ở ngực (u≈0.08)
  g.fillStyle = kit.trim;
  g.beginPath();
  g.arc(c.width * 0.08, 70, 14, 0, Math.PI * 2);
  g.fill();
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

/** Nhân vật dạng "con lăn": thân áo đấu, đầu tròn, hai tay. Mặt quay về +z. */
export function createAvatar(number, club) {
  const root = new THREE.Group();
  const kit = kitOf(club);

  const bodyMat = new THREE.MeshStandardMaterial({ map: jerseyTexture(number, kit), roughness: 0.75 });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.5, 1.1, 24, 1), bodyMat);
  body.position.y = 0.75;
  body.castShadow = true;
  root.add(body);

  const shorts = new THREE.Mesh(
    new THREE.CylinderGeometry(0.5, 0.48, 0.28, 24),
    new THREE.MeshStandardMaterial({ color: kit.shorts, roughness: 0.8 }),
  );
  shorts.position.y = 0.14;
  shorts.castShadow = true;
  root.add(shorts);

  const skinMat = new THREE.MeshStandardMaterial({ color: SKIN, roughness: 0.6 });
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.3, 20, 16), skinMat);
  head.position.y = 1.55;
  head.castShadow = true;
  root.add(head);

  const hair = new THREE.Mesh(
    new THREE.SphereGeometry(0.31, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2.3),
    new THREE.MeshStandardMaterial({ color: '#2b211b', roughness: 0.9 }),
  );
  hair.position.y = 1.57;
  root.add(hair);

  const eyeMat = new THREE.MeshBasicMaterial({ color: '#1a1a1a' });
  for (const sx of [-0.1, 0.1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 8), eyeMat);
    eye.position.set(sx, 1.58, 0.27);
    root.add(eye);
  }

  const armGeo = new THREE.CapsuleGeometry(0.11, 0.45, 4, 10);
  const sleeveMat = new THREE.MeshStandardMaterial({ color: kit.sleeve, roughness: 0.75 });
  const arms = [];
  for (const side of [-1, 1]) {
    const pivot = new THREE.Group();
    pivot.position.set(side * 0.55, 1.15, 0);
    const arm = new THREE.Mesh(armGeo, sleeveMat);
    arm.position.y = -0.3;
    arm.castShadow = true;
    const fist = new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 10), skinMat);
    fist.position.y = -0.62;
    pivot.add(arm, fist);
    root.add(pivot);
    arms.push(pivot);
  }

  // Vòng dưới chân: chuyển đỏ khi trong tầm đấm.
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.62, 0.72, 40),
    new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.0, side: THREE.DoubleSide, depthWrite: false }),
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.02;
  root.add(ring);

  const anim = { walk: 0, punch: 0, celebrate: 0, hit: 0, ghost: false, t: 0 };

  // Ma: ẩn nhân vật, thay bằng con ma trùm khăn trắng phát sáng, bay lơ lửng.
  const normalParts = root.children.filter((c) => c !== ring);
  const ghostBody = createGhostBody();
  ghostBody.visible = false;
  root.add(ghostBody);

  function setGhost(on) {
    anim.ghost = on;
    for (const p of normalParts) p.visible = !on;
    ghostBody.visible = on;
  }

  function update(dt, moving) {
    anim.walk += dt * (moving ? 10 : 0);
    const swing = moving ? Math.sin(anim.walk) * 0.6 : 0;
    arms[0].rotation.x = swing;
    arms[1].rotation.x = -swing;
    body.position.y = 0.75 + (moving ? Math.abs(Math.sin(anim.walk)) * 0.05 : 0);

    if (anim.punch > 0) {
      anim.punch = Math.max(0, anim.punch - dt);
      const t = 1 - anim.punch / 0.35;
      arms[1].rotation.x = -Math.PI / 2 * Math.sin(Math.min(1, t) * Math.PI);
    }
    if (anim.celebrate > 0) {
      anim.celebrate = Math.max(0, anim.celebrate - dt);
      const t = 1.6 - anim.celebrate;
      arms[0].rotation.z = -2.6;
      arms[1].rotation.z = 2.6;
      root.position.y = Math.abs(Math.sin(t * 7)) * 0.5;
    } else {
      arms[0].rotation.z = 0;
      arms[1].rotation.z = 0;
      anim.t += dt;
      root.position.y = anim.ghost ? 0.35 + Math.sin(anim.t * 2.5) * 0.12 : 0;
    }
    if (anim.ghost) {
      ghostBody.rotation.z = Math.sin(anim.t * 1.7) * 0.08;
      ghostBody.userData.skirt.rotation.y += dt * 1.2;
    }
    if (anim.hit > 0) {
      anim.hit = Math.max(0, anim.hit - dt);
      root.rotation.z = Math.sin(anim.hit * 40) * 0.15 * (anim.hit / 0.5);
    } else {
      root.rotation.z = 0;
    }
  }

  return {
    root,
    ring,
    update,
    punch: () => (anim.punch = 0.35),
    celebrate: () => (anim.celebrate = 1.6),
    hit: () => (anim.hit = 0.5),
    setGhost,
    get ghost() {
      return anim.ghost;
    },
    get celebrating() {
      return anim.celebrate > 0;
    },
    dispose() {
      root.traverse((o) => {
        if (o.isMesh) {
          o.geometry.dispose();
          o.material.map?.dispose();
          o.material.dispose();
        }
      });
    },
  };
}

/** Con ma trùm khăn: thân tròn đầu, vạt dưới lượn sóng, mắt và miệng chữ O. Mặt quay về +z. */
function createGhostBody() {
  const group = new THREE.Group();
  const sheetMat = new THREE.MeshStandardMaterial({
    color: '#f4f7ff',
    emissive: '#8fb2ff',
    emissiveIntensity: 0.55,
    roughness: 0.6,
    transparent: true,
    opacity: 0.85,
    side: THREE.DoubleSide,
  });

  // Thân: lathe từ đỉnh đầu xuống vạt áo.
  const profile = [];
  for (let i = 0; i <= 10; i++) {
    const a = (i / 10) * (Math.PI / 2);
    profile.push(new THREE.Vector2(Math.sin(a) * 0.55, 1.45 + Math.cos(a) * 0.55));
  }
  profile.push(new THREE.Vector2(0.6, 0.9), new THREE.Vector2(0.66, 0.45));
  const head = new THREE.Mesh(new THREE.LatheGeometry(profile, 32), sheetMat);
  group.add(head);

  // Vạt dưới: ống hở đáy, mép dưới lượn sóng và tự xoay chậm.
  const skirtGeo = new THREE.CylinderGeometry(0.66, 0.78, 0.5, 48, 4, true);
  const pos = skirtGeo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    if (y < -0.2) {
      const ang = Math.atan2(pos.getZ(i), pos.getX(i));
      pos.setY(i, y + Math.sin(ang * 7) * 0.12);
    }
  }
  skirtGeo.computeVertexNormals();
  const skirt = new THREE.Mesh(skirtGeo, sheetMat);
  skirt.position.y = 0.2;
  group.add(skirt);
  group.userData.skirt = skirt;

  // Mắt và miệng.
  const dark = new THREE.MeshBasicMaterial({ color: '#1b2140' });
  for (const sx of [-0.18, 0.18]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.085, 12, 10), dark);
    eye.scale.set(1, 1.5, 0.5);
    eye.position.set(sx, 1.55, 0.51);
    group.add(eye);
  }
  const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.025, 8, 16), dark);
  mouth.scale.y = 1.4;
  mouth.position.set(0, 1.3, 0.55);
  group.add(mouth);

  // Hai tay ngắn giơ ra trước.
  for (const sx of [-1, 1]) {
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.1, 0.32, 4, 8), sheetMat);
    arm.rotation.x = Math.PI / 2.4;
    arm.rotation.z = sx * 0.3;
    arm.position.set(sx * 0.58, 1.05, 0.25);
    group.add(arm);
  }
  return group;
}

/** Áo đấu treo trên giá ở cửa hang. */
export function createHangingJersey() {
  const shape = new THREE.Shape();
  shape.moveTo(-0.45, 0);
  shape.lineTo(0.45, 0);
  shape.lineTo(0.45, 0.8);
  shape.lineTo(0.75, 0.62);
  shape.lineTo(0.92, 0.9);
  shape.lineTo(0.5, 1.15);
  shape.lineTo(0.2, 1.15);
  shape.quadraticCurveTo(0, 1.0, -0.2, 1.15);
  shape.lineTo(-0.5, 1.15);
  shape.lineTo(-0.92, 0.9);
  shape.lineTo(-0.75, 0.62);
  shape.lineTo(-0.45, 0.8);
  shape.closePath();
  const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.12, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03, bevelSegments: 2 });
  geo.translate(0, 0, -0.06);
  const mat = new THREE.MeshStandardMaterial({ color: BRAND.jersey.body, roughness: 0.7 });
  const shirt = new THREE.Mesh(geo, mat);
  shirt.castShadow = true;

  const collar = new THREE.Mesh(
    new THREE.TorusGeometry(0.2, 0.035, 8, 20, Math.PI),
    new THREE.MeshStandardMaterial({ color: BRAND.jersey.trim }),
  );
  collar.rotation.z = Math.PI;
  collar.position.set(0, 1.15, 0.1);
  shirt.add(collar);

  const badge = new THREE.Mesh(
    new THREE.CircleGeometry(0.08, 20),
    new THREE.MeshStandardMaterial({ color: BRAND.jersey.trim }),
  );
  badge.position.set(0.22, 0.85, 0.1);
  shirt.add(badge);
  return shirt;
}

/** Vẽ áo 2D nhỏ cho hộp nhập tên. */
export function drawJerseyIcon(canvas, number, club) {
  const kit = kitOf(club);
  const g = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  g.clearRect(0, 0, w, h);
  g.save();
  g.scale(w / 40, h / 40);
  const shirt = () => {
    g.beginPath();
    g.moveTo(13, 5);
    g.lineTo(8, 7);
    g.lineTo(2, 13);
    g.lineTo(6, 18);
    g.lineTo(10, 15);
    g.lineTo(10, 36);
    g.lineTo(30, 36);
    g.lineTo(30, 15);
    g.lineTo(34, 18);
    g.lineTo(38, 13);
    g.lineTo(32, 7);
    g.lineTo(27, 5);
    g.quadraticCurveTo(20, 10, 13, 5);
  };
  shirt();
  g.fillStyle = kit.body;
  g.fill();
  // Sọc và tay áo vẽ trong khuôn áo.
  g.save();
  shirt();
  g.clip();
  drawStripes(g, kit, 10, 0, 20, 40, 5);
  g.fillStyle = kit.sleeve;
  g.fillRect(0, 0, 10, 40);
  g.fillRect(30, 0, 10, 40);
  g.restore();
  // Viền áo để áo trắng (Real) vẫn nổi trên nền sáng.
  shirt();
  g.strokeStyle = 'rgba(0,0,0,0.35)';
  g.lineWidth = 0.8;
  g.stroke();
  g.strokeStyle = kit.trim;
  g.lineWidth = 1.5;
  g.beginPath();
  g.moveTo(13, 5);
  g.quadraticCurveTo(20, 10, 27, 5);
  g.stroke();
  if (number) {
    g.fillStyle = kit.number;
    g.font = '800 13px Bitter, Georgia, serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(String(number), 20, 23);
  }
  g.restore();
}

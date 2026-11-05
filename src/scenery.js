import * as THREE from 'three';

/** PRNG nhỏ để đá có hình dạng cố định giữa các lần tải. */
export function rng(seed) {
  let s = seed >>> 0 || 1;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function hash3(x, y, z, seed) {
  const h = Math.sin(x * 127.1 + y * 311.7 + z * 74.7 + seed * 13.37) * 43758.5453;
  return h - Math.floor(h);
}

/** Đá low-poly: icosahedron bị bóp méo, shading phẳng. */
export function rockGeometry(radius, seed = 1, detail = 1, jag = 0.28) {
  const geo = new THREE.IcosahedronGeometry(radius, detail);
  const pos = geo.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    // Cùng vị trí → cùng hệ số, nên các mặt vẫn khít nhau.
    const k = 1 + (hash3(+v.x.toFixed(3), +v.y.toFixed(3), +v.z.toFixed(3), seed) - 0.5) * 2 * jag;
    v.multiplyScalar(k);
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  geo.computeVertexNormals();
  return geo;
}

export function rockMaterial(color = '#d8cbb5') {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.95, flatShading: true });
}

/** Đống lửa có ánh sáng chập chờn và tàn lửa bay lên. */
export function createCampfire() {
  const group = new THREE.Group();

  const logMat = new THREE.MeshStandardMaterial({ color: '#4a2e1c', roughness: 1 });
  for (let i = 0; i < 5; i++) {
    const log = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 1.3, 7), logMat);
    log.rotation.z = Math.PI / 2.6;
    log.rotation.y = (i / 5) * Math.PI * 2;
    log.position.y = 0.25;
    log.castShadow = true;
    group.add(log);
  }
  const stoneGeo = rockGeometry(0.22, 7, 0, 0.3);
  const stoneMat = rockMaterial('#8d8378');
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const s = new THREE.Mesh(stoneGeo, stoneMat);
    s.position.set(Math.cos(a) * 0.95, 0.1, Math.sin(a) * 0.95);
    s.rotation.set(a, a * 2, 0);
    group.add(s);
  }

  const flames = [];
  const flameColors = ['#ff4d1a', '#ff8c1a', '#ffd23f'];
  for (let i = 0; i < 3; i++) {
    const f = new THREE.Mesh(
      new THREE.ConeGeometry(0.42 - i * 0.11, 1.2 - i * 0.25, 8, 1, true),
      new THREE.MeshBasicMaterial({ color: flameColors[i], transparent: true, opacity: 0.85, depthWrite: false, side: THREE.DoubleSide }),
    );
    f.position.y = 0.7 - i * 0.05;
    group.add(f);
    flames.push(f);
  }

  const light = new THREE.PointLight('#ff8a3d', 60, 26, 1.6);
  light.position.y = 1.4;
  light.castShadow = true;
  light.shadow.mapSize.set(512, 512);
  light.shadow.bias = -0.002;
  group.add(light);

  const SPARKS = 60;
  const sparkPos = new Float32Array(SPARKS * 3);
  const sparkVel = new Float32Array(SPARKS);
  const rand = rng(42);
  for (let i = 0; i < SPARKS; i++) {
    sparkPos[i * 3] = (rand() - 0.5) * 0.6;
    sparkPos[i * 3 + 1] = rand() * 4;
    sparkPos[i * 3 + 2] = (rand() - 0.5) * 0.6;
    sparkVel[i] = 0.6 + rand() * 1.2;
  }
  const sparkGeo = new THREE.BufferGeometry();
  sparkGeo.setAttribute('position', new THREE.BufferAttribute(sparkPos, 3));
  const sparks = new THREE.Points(
    sparkGeo,
    new THREE.PointsMaterial({ color: '#ffb347', size: 0.07, transparent: true, opacity: 0.9, depthWrite: false }),
  );
  group.add(sparks);

  let t = 0;
  function update(dt) {
    t += dt;
    flames.forEach((f, i) => {
      const s = 1 + Math.sin(t * (9 + i * 3) + i) * 0.08 + Math.sin(t * 23 + i) * 0.04;
      f.scale.set(1 / s, s, 1 / s);
      f.rotation.y += dt * (1 + i);
    });
    light.intensity = 55 + Math.sin(t * 13) * 6 + Math.sin(t * 31) * 4;
    for (let i = 0; i < SPARKS; i++) {
      let y = sparkPos[i * 3 + 1] + sparkVel[i] * dt;
      if (y > 4.5) {
        y = 0.5;
        sparkPos[i * 3] = (Math.random() - 0.5) * 0.6;
        sparkPos[i * 3 + 2] = (Math.random() - 0.5) * 0.6;
      }
      sparkPos[i * 3] += Math.sin(t * 2 + i) * dt * 0.15;
      sparkPos[i * 3 + 1] = y;
    }
    sparkGeo.attributes.position.needsUpdate = true;
  }

  return { group, update, light };
}

/** Đuốc gắn tường. */
export function createTorch() {
  const group = new THREE.Group();
  const stick = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.04, 0.7, 6),
    new THREE.MeshStandardMaterial({ color: '#3b2a1e' }),
  );
  stick.rotation.x = -0.35;
  group.add(stick);
  const flame = new THREE.Mesh(
    new THREE.ConeGeometry(0.1, 0.32, 6),
    new THREE.MeshBasicMaterial({ color: '#ffb347' }),
  );
  flame.position.set(0, 0.48, 0.12);
  group.add(flame);
  const light = new THREE.PointLight('#ff9a4a', 6, 8, 1.8);
  light.position.set(0, 0.6, 0.3);
  group.add(light);
  const seed = Math.random() * 10;
  return {
    group,
    update(t) {
      const s = 1 + Math.sin(t * 15 + seed) * 0.12;
      flame.scale.set(1, s, 1);
      light.intensity = 5.5 + Math.sin(t * 11 + seed) * 1.2;
    },
  };
}

/** Texture chữ từ canvas, dùng cho biển hiệu và bảng tin. */
export function textCanvas(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(c.getContext('2d'), w, h);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

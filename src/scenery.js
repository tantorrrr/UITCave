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

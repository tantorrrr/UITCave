import * as THREE from 'three';
import { CLUBS, FIXTURE_TEAMS } from './config.js';
import { textCanvas } from './scenery.js';

// Chữ viết tắt in trên khiên cờ (không dùng logo CLB để tránh bản quyền).
const INITIALS = { liverpool: 'LFC', manutd: 'MU', mancity: 'MCFC', chelsea: 'CFC', arsenal: 'AFC', barcelona: 'FCB', realmadrid: 'RMA' };

const SCREEN_ANGLE = -Math.PI / 2; // hướng màn hình lớn (phía -z)
const SHAME_ANGLE = Math.PI / 2; // góc cà chua: vách sau lưng chỗ xuất hiện (phía +z)

/**
 * Kết quả trận gần nhất của từng CLB theo dõi: thắng → treo cờ chiến thắng, thua → góc cà chua.
 * Hoà hoặc phải đá luân lưu (không biết ai thắng loạt sút) thì bỏ qua.
 * results: danh sách từ /api/results, mới nhất trước.
 */
export function latestOutcomes(results) {
  const out = [];
  for (const team of FIXTURE_TEAMS) {
    const m = results.find((r) => r.home === team.name || r.away === team.name);
    if (!m || /pen/i.test(m.detail ?? '')) continue;
    const home = m.home === team.name;
    const mine = Number(home ? m.homeScore : m.awayScore);
    const theirs = Number(home ? m.awayScore : m.homeScore);
    if (!Number.isFinite(mine) || !Number.isFinite(theirs) || mine === theirs) continue;
    out.push({
      club: team.club,
      outcome: mine > theirs ? 'win' : 'loss',
      score: `${mine} - ${theirs}`,
      opponent: home ? m.away : m.home,
      date: m.date,
    });
  }
  return out;
}

function clubLook(club) {
  const c = CLUBS[club];
  const kit = c?.kit ?? { body: '#1e4fd8', trim: '#f2c230', number: '#fff' };
  // Áo sáng màu (Real trắng) thì chữ tối; còn lại chữ sáng.
  const light = new THREE.Color(kit.body).getHSL({}).l > 0.8;
  return { name: c?.name ?? club, kit, text: light ? '#1c2c5b' : '#ffffff', accent: c?.accent ?? '#f2c230' };
}

/** Đường viền cờ kiểu trung cổ: thân chữ nhật, đuôi xẻ chữ V. */
function bannerPath(g, w, h, tail) {
  g.beginPath();
  g.moveTo(0, 0);
  g.lineTo(w, 0);
  g.lineTo(w, h);
  g.lineTo(w / 2, h - tail);
  g.lineTo(0, h);
  g.closePath();
}

function fitText(g, text, maxW, size, weight = 800, family = 'Bitter, Georgia, serif') {
  let s = size;
  g.font = `${weight} ${s}px ${family}`;
  while (g.measureText(text).width > maxW && s > 12) g.font = `${weight} ${(s -= 2)}px ${family}`;
}

/** Vẽ vết cà chua: một bãi đỏ không đều, có hạt và vệt chảy xuống. */
function drawSplat(g, x, y, seed) {
  let s = seed;
  const rand = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  g.fillStyle = '#b3211a';
  for (let i = 0; i < 7; i++) {
    const a = rand() * Math.PI * 2;
    const r = 6 + rand() * 16;
    g.beginPath();
    g.arc(x + Math.cos(a) * r, y + Math.sin(a) * r * 0.8, 8 + rand() * 12, 0, Math.PI * 2);
    g.fill();
  }
  for (let i = 0; i < 3; i++) {
    const dx = (rand() - 0.5) * 30;
    g.fillRect(x + dx - 2.5, y, 5, 18 + rand() * 40);
  }
  g.fillStyle = 'rgba(255, 210, 120, 0.8)';
  for (let i = 0; i < 6; i++) {
    g.beginPath();
    g.arc(x + (rand() - 0.5) * 34, y + (rand() - 0.5) * 26, 2, 0, Math.PI * 2);
    g.fill();
  }
}

/**
 * Một lá cờ treo dưới thanh ngang. Gốc toạ độ của group là điểm giữa thanh ngang (mép trên lá cờ).
 * kind: 'win' (cờ lớn thả từ nóc hang) | 'loss' (cờ ở góc cà chua, nhận vết cà chua).
 */
function createBanner(info, kind, { width, height }) {
  const look = clubLook(info.club);
  const TW = 256;
  const TH = Math.round((TW * height) / width);
  const tail = Math.round(TW * 0.42);
  const splats = [];
  let tomatoes = 0;

  const draw = (g, w, h) => {
    g.clearRect(0, 0, w, h);
    g.save();
    bannerPath(g, w, h, tail);
    g.clip();
    g.fillStyle = look.kit.body;
    g.fillRect(0, 0, w, h);
    if (look.kit.stripe) {
      // Sọc dọc (Barca).
      g.fillStyle = look.kit.stripe;
      const sw = w / 5;
      for (let i = 1; i < 5; i += 2) g.fillRect(i * sw, 0, sw, h);
    }
    if (kind === 'loss') {
      // Cờ đội thua: phủ tối để trông "tủi".
      g.fillStyle = 'rgba(20, 16, 12, 0.35)';
      g.fillRect(0, 0, w, h);
    }
    // Viền trong kiểu thêu.
    g.strokeStyle = look.accent;
    g.lineWidth = 10;
    bannerPath(g, w, h, tail);
    g.stroke();
    g.restore();

    g.textAlign = 'center';
    g.textBaseline = 'middle';
    // Khiên tròn có chữ viết tắt.
    const cy = kind === 'win' ? TW * 0.55 : TW * 0.42;
    g.fillStyle = look.accent;
    g.beginPath();
    g.arc(w / 2, cy, TW * 0.27, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = look.kit.body === '#f7f7f7' ? '#1c2c5b' : look.kit.body;
    g.beginPath();
    g.arc(w / 2, cy, TW * 0.22, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = look.kit.body === '#f7f7f7' ? '#ffffff' : look.accent;
    fitText(g, INITIALS[info.club] ?? '', TW * 0.36, 52);
    g.fillText(INITIALS[info.club] ?? '', w / 2, cy + 2);

    g.fillStyle = look.text;
    g.shadowColor = 'rgba(0,0,0,0.45)';
    g.shadowBlur = 6;
    let y = cy + TW * 0.42;
    fitText(g, look.name.toUpperCase(), w - 40, 46);
    g.fillText(look.name.toUpperCase(), w / 2, y);
    y += 64;
    g.font = '800 56px Bitter, Georgia, serif';
    g.fillStyle = kind === 'win' ? look.accent : '#ffb4a8';
    g.fillText(kind === 'win' ? '★ THẮNG ★' : 'VỪA THUA', w / 2, y);
    y += 70;
    g.fillStyle = look.text;
    g.font = '800 64px Bitter, Georgia, serif';
    g.fillText(info.score, w / 2, y);
    y += 50;
    fitText(g, `vs ${info.opponent}`, w - 40, 30, 600, '"Be Vietnam Pro", sans-serif');
    g.fillText(`vs ${info.opponent}`, w / 2, y);
    if (kind === 'loss') {
      y += 56;
      g.font = '800 40px "Be Vietnam Pro", sans-serif';
      g.fillStyle = '#ffffff';
      g.fillText(`🍅 × ${tomatoes}`, w / 2, y);
    }
    g.shadowBlur = 0;
    // Vết cà chua chỉ nằm trên vải (cắt theo hình lá cờ).
    if (splats.length) {
      g.save();
      bannerPath(g, w, h, tail);
      g.clip();
      for (const sp of splats) drawSplat(g, sp.u * w, sp.v * h, sp.seed);
      g.restore();
    }
  };

  const tex = textCanvas(TW, TH, draw);
  const redraw = () => {
    draw(tex.image.getContext('2d'), tex.image.width, tex.image.height);
    tex.needsUpdate = true;
  };

  const geo = new THREE.PlaneGeometry(width, height);
  geo.translate(0, -height / 2, 0); // treo từ mép trên
  const mat = new THREE.MeshStandardMaterial({
    map: tex, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.85,
    emissive: '#ffffff', emissiveMap: tex, emissiveIntensity: kind === 'win' ? 0.35 : 0.25,
  });
  const cloth = new THREE.Mesh(geo, mat);
  cloth.castShadow = false;

  // Thanh ngang gỗ có núm đồng hai đầu.
  const group = new THREE.Group();
  const wood = new THREE.MeshStandardMaterial({ color: '#4a2e1c', roughness: 0.9 });
  const brass = new THREE.MeshStandardMaterial({ color: '#c99a3c', metalness: 0.6, roughness: 0.35 });
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, width + 0.6, 10), wood);
  rod.rotation.z = Math.PI / 2;
  group.add(rod);
  for (const sx of [-1, 1]) {
    const knob = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 10), brass);
    knob.position.x = sx * (width / 2 + 0.3);
    group.add(knob);
  }
  group.add(cloth);

  return {
    info,
    kind,
    group,
    cloth,
    width,
    height,
    setTomatoes(n) {
      tomatoes = n;
      redraw();
    },
    addSplat(u, v) {
      splats.push({ u, v, seed: Math.floor(Math.random() * 100000) });
      if (splats.length > 40) splats.shift();
      redraw();
    },
    redraw,
    dispose() {
      group.traverse((o) => {
        if (o.isMesh) {
          o.geometry.dispose();
          o.material.map?.dispose();
          o.material.dispose();
        }
      });
    },
  };
}

/**
 * Cờ chiến thắng thả từ nóc hang + góc cà chua cho đội vừa thua, kèm đạn cà chua bay.
 * opts.ceilingAt(r): độ cao trần hang ở bán kính r (để dây treo chạm trần).
 */
export function createBanners(scene, { ceilingAt, fontsReady }) {
  const root = new THREE.Group();
  scene.add(root);
  let winners = [];
  let losers = [];
  let tomatoCounts = {};
  const drops = []; // { banner, delay, t, fromY, toY }
  const flying = []; // đạn cà chua đang bay
  const splashes = [];
  let time = 0;

  // Góc cà chua: biển gỗ + thùng cà chua, luôn có dù chưa đội nào thua.
  const SHAME_R = 19.5;
  const shameBase = new THREE.Group();
  shameBase.position.set(Math.cos(SHAME_ANGLE) * SHAME_R, 0, Math.sin(SHAME_ANGLE) * SHAME_R);
  shameBase.lookAt(0, 0, 0);
  scene.add(shameBase);
  const signTex = textCanvas(1024, 160, (g, w, h) => {
    g.fillStyle = '#6b4a30';
    g.fillRect(0, 0, w, h);
    g.strokeStyle = '#3b2618';
    g.lineWidth = 10;
    g.strokeRect(5, 5, w - 10, h - 10);
    g.fillStyle = '#ffe9c7';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.font = '800 64px Bitter, Georgia, serif';
    g.fillText('🍅 GÓC CÀ CHUA 🍅', w / 2, 60);
    g.font = '600 32px "Be Vietnam Pro", sans-serif';
    g.fillText('Cờ đội vừa thua · đứng gần, quay mặt về đây, bấm T hoặc 🍅 để ném', w / 2, 120);
  });
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(9, 1.4), new THREE.MeshStandardMaterial({ map: signTex, emissive: '#ffffff', emissiveMap: signTex, emissiveIntensity: 0.3 }));
  sign.position.set(0, 8.2, 0);
  shameBase.add(sign);
  const crate = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.7, 1), new THREE.MeshStandardMaterial({ color: '#7a5233', roughness: 0.9 }));
  crate.position.set(4.2, 0.35, 2.2);
  shameBase.add(crate);
  const tomatoGeo = new THREE.SphereGeometry(0.18, 12, 10);
  const tomatoMat = new THREE.MeshStandardMaterial({ color: '#d62a1e', roughness: 0.4 });
  for (let i = 0; i < 14; i++) {
    const t = new THREE.Mesh(tomatoGeo, tomatoMat);
    t.position.set(4.2 + (Math.random() - 0.5) * 1.3, 0.8 + Math.random() * 0.15, 2.2 + (Math.random() - 0.5) * 0.7);
    shameBase.add(t);
  }

  function clear(list) {
    for (const b of list) {
      b.group.parent?.remove(b.group);
      b.dispose();
    }
    list.length = 0;
  }

  // Góc cho cờ chiến thắng: chừa hướng màn hình lớn và góc cà chua.
  function winnerAngles(n) {
    const arcs = [
      [SCREEN_ANGLE + 0.85, SHAME_ANGLE - 0.65], // bên phải
      [SHAME_ANGLE + 0.65, SCREEN_ANGLE + Math.PI * 2 - 1.15], // bên trái (chừa bảng kết quả)
    ];
    const angles = [];
    const per = [Math.ceil(n / 2), Math.floor(n / 2)];
    arcs.forEach(([a0, a1], k) => {
      for (let i = 0; i < per[k]; i++) angles.push(a0 + ((a1 - a0) * (i + 0.5)) / per[k]);
    });
    return angles;
  }

  function setOutcomes(list) {
    clear(winners);
    clear(losers);
    drops.length = 0;
    const wins = list.filter((o) => o.outcome === 'win');
    const losses = list.filter((o) => o.outcome === 'loss');

    const WIN_R = 15.5;
    const WIN_TOP = 16;
    winnerAngles(wins.length).forEach((a, i) => {
      const b = createBanner(wins[i], 'win', { width: 2.6, height: 8.5 });
      b.group.position.set(Math.cos(a) * WIN_R, WIN_TOP, Math.sin(a) * WIN_R);
      b.group.lookAt(0, WIN_TOP, 0);
      // Hai dây treo lên trần.
      const ceil = ceilingAt(WIN_R);
      const ropeLen = Math.max(0.5, ceil - WIN_TOP);
      const ropeMat = new THREE.MeshStandardMaterial({ color: '#2b1d14' });
      for (const sx of [-1, 1]) {
        const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, ropeLen, 6), ropeMat);
        rope.position.set(sx * (b.width / 2 + 0.15), ropeLen / 2, 0);
        b.group.add(rope);
      }
      root.add(b.group);
      winners.push(b);
      // Thả từ nóc hang xuống, lần lượt từng lá.
      drops.push({ banner: b, delay: 0.4 + i * 0.35, t: 0, fromY: ceil + 2, toY: WIN_TOP });
      b.group.position.y = ceil + 2;
      b.cloth.scale.y = 0.05;
    });

    const SHAME_TOP = 6.4;
    const spacing = 3;
    losses.forEach((o, i) => {
      const b = createBanner(o, 'loss', { width: 2.2, height: 5.2 });
      const x = (i - (losses.length - 1) / 2) * spacing;
      b.group.position.set(x, SHAME_TOP, 0.3);
      shameBase.add(b.group);
      b.setTomatoes(tomatoCounts[o.club] ?? 0);
      losers.push(b);
    });
    fontsReady?.().then(() => [...winners, ...losers].forEach((b) => b.redraw()));
  }

  function setTomatoes(counts) {
    tomatoCounts = { ...counts };
    for (const b of losers) b.setTomatoes(tomatoCounts[b.info.club] ?? 0);
  }

  /** Cờ ở góc cà chua gần hướng nhìn nhất (trong tầm ném). */
  function pickTarget(pos, forward) {
    let best = null;
    let bestAngle = 0.7;
    const wp = new THREE.Vector3();
    for (const b of losers) {
      b.cloth.getWorldPosition(wp);
      const dx = wp.x - pos.x;
      const dz = wp.z - pos.z;
      const d = Math.hypot(dx, dz);
      if (d > 26) continue;
      const ang = Math.acos(THREE.MathUtils.clamp((dx * forward.x + dz * forward.z) / d, -1, 1));
      if (ang < bestAngle) {
        bestAngle = ang;
        best = b.info.club;
      }
    }
    return best;
  }

  /** Ném một quả cà chua từ `from` vào cờ của `club`; trúng thì để lại vết. */
  function throwTomato(from, club, count, onHit) {
    const b = losers.find((x) => x.info.club === club);
    if (count != null) tomatoCounts[club] = count;
    if (!b) return;
    const u = 0.15 + Math.random() * 0.7;
    const v = 0.08 + Math.random() * 0.6;
    const target = new THREE.Vector3((u - 0.5) * b.width, -v * b.height, 0.02);
    b.cloth.localToWorld(target);
    const start = new THREE.Vector3(from.x, 1.8, from.z);
    const mesh = new THREE.Mesh(tomatoGeo, tomatoMat);
    mesh.position.copy(start);
    scene.add(mesh);
    const dur = THREE.MathUtils.clamp(start.distanceTo(target) / 22, 0.35, 1);
    flying.push({ mesh, start, target, t: 0, dur, banner: b, u, v, onHit });
  }

  function splash(at) {
    const n = 18;
    const pos = new Float32Array(n * 3);
    const vel = [];
    for (let i = 0; i < n; i++) {
      pos.set([at.x, at.y, at.z], i * 3);
      vel.push(new THREE.Vector3((Math.random() - 0.5) * 3, Math.random() * 2.5, (Math.random() - 0.5) * 3));
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const pts = new THREE.Points(geo, new THREE.PointsMaterial({ color: '#d62a1e', size: 0.12, transparent: true }));
    scene.add(pts);
    splashes.push({ pts, vel, life: 0.8 });
  }

  function update(dt) {
    time += dt;
    for (const d of drops) {
      if (d.t >= 1) continue;
      if (d.delay > 0) {
        d.delay -= dt;
        continue;
      }
      d.t = Math.min(1, d.t + dt / 1.4);
      // Rơi nhanh rồi nảy nhẹ (ease out back), vải bung ra theo.
      const k = d.t;
      const c = 1.7;
      const e = 1 + (c + 1) * (k - 1) ** 3 + c * (k - 1) ** 2;
      d.banner.group.position.y = d.fromY + (d.toY - d.fromY) * e;
      d.banner.cloth.scale.y = Math.max(0.05, Math.min(1, k * 1.6));
    }
    winners.forEach((b, i) => (b.cloth.rotation.x = Math.sin(time * 0.9 + i * 1.3) * 0.05));
    losers.forEach((b, i) => (b.cloth.rotation.x = Math.sin(time * 1.1 + i) * 0.04));

    for (let i = flying.length - 1; i >= 0; i--) {
      const f = flying[i];
      f.t += dt / f.dur;
      const k = Math.min(1, f.t);
      f.mesh.position.lerpVectors(f.start, f.target, k);
      f.mesh.position.y += Math.sin(k * Math.PI) * 1.6; // vòng cung
      f.mesh.rotation.x += dt * 12;
      if (k >= 1) {
        scene.remove(f.mesh);
        if (f.banner.group.parent) {
          f.banner.addSplat(f.u, f.v);
          f.banner.setTomatoes(tomatoCounts[f.banner.info.club] ?? 0);
        }
        splash(f.target);
        f.onHit?.();
        flying.splice(i, 1);
      }
    }
    for (let i = splashes.length - 1; i >= 0; i--) {
      const s = splashes[i];
      s.life -= dt;
      const p = s.pts.geometry.attributes.position;
      s.vel.forEach((v, j) => {
        v.y -= 9 * dt;
        p.setXYZ(j, p.getX(j) + v.x * dt, p.getY(j) + v.y * dt, p.getZ(j) + v.z * dt);
      });
      p.needsUpdate = true;
      s.pts.material.opacity = Math.max(0, s.life / 0.8);
      if (s.life <= 0) {
        scene.remove(s.pts);
        s.pts.geometry.dispose();
        s.pts.material.dispose();
        splashes.splice(i, 1);
      }
    }
  }

  return {
    setOutcomes,
    setTomatoes,
    pickTarget,
    throwTomato,
    update,
    get hasLosers() {
      return losers.length > 0;
    },
    dispose() {
      clear(winners);
      clear(losers);
      scene.remove(root, shameBase);
    },
  };
}


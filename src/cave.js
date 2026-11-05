import * as THREE from 'three';
import { CSS2DObject, CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';
import { CSS3DObject, CSS3DRenderer } from 'three/addons/renderers/CSS3DRenderer.js';
import { ARENA, BALL, BRAND, CLUB_ORDER, CLUBS, FIXTURE_TEAMS, FAN_SONGS, LEGENDS, POLL, POSTER_SLOTS, POSTER_SWAP_MS, SCOREBOARD } from './config.js';
import { createAvatar } from './avatar.js';
import { LEGEND_PHOTOS } from './legendPhotos.js';
import { createBanners, latestOutcomes } from './banners.js';
import { createBallView } from './ball.js';
import { createAudio } from './audio.js';
import { connect } from './net.js';
import { createCampfire, createTorch, rng, rockGeometry, rockMaterial, textCanvas } from './scenery.js';
import { el } from './util.js';

const CAVE_RADIUS = ARENA.caveRadius;
const FIRE_RADIUS = ARENA.fireRadius;
const WALK_SPEED = ARENA.walkSpeed;
const PUNCH_RANGE = 2.2;
const MAX_HP = 5; // khớp với server/index.js
const SEND_INTERVAL = 1 / 15;
const SCREEN_Z = ARENA.screenZ;
const SCREEN_HALF_W = ARENA.screenHalfW; // nửa bề ngang khung màn hình, để chặn người chơi đi xuyên
// Bảng kết quả gần đây: đứng bên trái màn hình lớn, xoay về giữa hang.
const RESULTS_POS = { x: -14.5, z: -12.5 };
const RESULTS_W = 6.4;
const RESULTS_H = 8;
const RESULTS_GAP = 1.05; // góc (rad) bên trái màn hình không treo tranh để khỏi bị bảng che
const DOME_R = 27;
const DOME_SY = 1.0; // vòm cao để chứa màn hình lớn và bảng lịch thi đấu
const VN_TIME = new Intl.DateTimeFormat('vi-VN', {
  timeZone: 'Asia/Ho_Chi_Minh',
  weekday: 'short',
  day: '2-digit',
  month: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});
const TUTORIAL_KEY = 'hanguit.tutorial.punch';

// ---------------------------------------------------------------------------
// Khung cảnh trong hang
// ---------------------------------------------------------------------------

function buildCave(scene) {
  scene.background = new THREE.Color('#1c0f0a');
  scene.fog = new THREE.Fog('#1c0f0a', 30, 70);
  scene.add(new THREE.HemisphereLight('#c09070', '#3a2216', 2.4));

  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(27, 64),
    new THREE.MeshStandardMaterial({ color: '#4a3226', roughness: 1 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  const dome = new THREE.Mesh(rockGeometry(DOME_R, 11, 3, 0.07), rockMaterial('#6b4a3a'));
  dome.material.side = THREE.BackSide;
  dome.scale.y = DOME_SY;
  scene.add(dome);

  const rand = rng(99);

  // Thạch nhũ treo trần.
  const stal = new THREE.InstancedMesh(new THREE.ConeGeometry(0.35, 2.2, 6), rockMaterial('#7a5747'), 70);
  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI, 0, 0));
  for (let i = 0; i < stal.count; i++) {
    const a = rand() * Math.PI * 2;
    const r = 4 + rand() * 18;
    const s = 0.6 + rand() * 1.4;
    const y = Math.sqrt(Math.max(0, 1 - (r / DOME_R) ** 2)) * DOME_R * DOME_SY - 0.8 * s;
    m4.compose(new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r), q, new THREE.Vector3(s, s, s));
    stal.setMatrixAt(i, m4);
  }
  scene.add(stal);

  // Bậc ngồi kiểu khán đài vòng quanh đống lửa, chừa lối nhìn lên màn hình.
  const benchMat = new THREE.MeshStandardMaterial({ color: '#7b5a44', roughness: 0.95, flatShading: true });
  const rows = [
    { r: 4.2, h: 0.35 },
    { r: 6.0, h: 0.6 },
    { r: 7.8, h: 0.85 },
  ];
  for (const { r, h } of rows) {
    const n = Math.round(r * 5);
    const benches = new THREE.InstancedMesh(new THREE.BoxGeometry(1, h, 1.1), benchMat, n);
    let k = 0;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      // Khoảng trống hướng về màn hình (phía -z).
      if (Math.abs(Math.atan2(Math.sin(a + Math.PI / 2), Math.cos(a + Math.PI / 2))) < 0.45) continue;
      m4.compose(
        new THREE.Vector3(Math.cos(a) * r, h / 2, Math.sin(a) * r),
        new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -a),
        new THREE.Vector3(1, 1, (2 * Math.PI * r) / n),
      );
      benches.setMatrixAt(k++, m4);
    }
    benches.count = k;
    benches.receiveShadow = true;
    scene.add(benches);
  }

  // Đá rải quanh chân tường.
  const rockMat = rockMaterial('#5e4234');
  for (let i = 0; i < 40; i++) {
    const a = rand() * Math.PI * 2;
    const r = 22 + rand() * 4;
    const m = new THREE.Mesh(rockGeometry(0.8 + rand() * 1.6, 500 + i, 0, 0.3), rockMat);
    m.position.set(Math.cos(a) * r, 0.2, Math.sin(a) * r);
    m.rotation.set(rand() * 3, rand() * 3, rand() * 3);
    scene.add(m);
  }

  const fire = createCampfire();
  scene.add(fire.group);

  // Đuốc, cờ, chân dung treo quanh tường.
  const torches = [];
  const wallR = 22.5;
  const bannerTex = textCanvas(128, 256, (g, w, h) => {
    g.fillStyle = BRAND.jersey.body;
    g.fillRect(0, 0, w, h);
    g.fillStyle = BRAND.jersey.trim;
    g.fillRect(0, 0, w, 16);
    g.beginPath();
    g.arc(w / 2, h / 2, 34, 0, Math.PI * 2);
    g.fill();
  });
  const bannerMat = new THREE.MeshStandardMaterial({ map: bannerTex, side: THREE.DoubleSide, roughness: 0.8 });

  // Phòng truyền thống: chân dung xếp kín vách từ hai mép màn hình vòng ra sau, nhóm theo CLB.
  // Góc chừa trống tính từ hướng màn hình: bên phải chừa cho màn hình, bên trái thêm chỗ cho bảng kết quả.
  const GAP_RIGHT = 0.62;
  const GAP_LEFT = RESULTS_GAP;
  const start = -Math.PI / 2 + GAP_RIGHT;
  const span = Math.PI * 2 - GAP_RIGHT - GAP_LEFT;
  // Chia đều khung tranh cho các CLB (khung dư chia cho CLB đầu danh sách), xếp liền nhau theo CLB;
  // cầu thủ còn lại của mỗi CLB thay phiên dần.
  const slots = Math.min(POSTER_SLOTS, LEGENDS.length);
  const clubs = CLUB_ORDER.filter((c) => LEGENDS.some((l) => l.club === c));
  const initial = clubs.flatMap((c, i) => {
    const count = Math.floor(slots / clubs.length) + (i < slots % clubs.length ? 1 : 0);
    return LEGENDS.filter((l) => l.club === c).slice(0, count);
  });
  // Chừa khoảng vách sau lưng cho Góc cà chua (src/banners.js, hướng +z).
  const SHAME_GAP = 0.42;
  const gapFrom = Math.PI / 2 - SHAME_GAP - start;
  const usable = span - SHAME_GAP * 2;
  const angleAt = (i) => {
    const d = (usable * (i + 0.5)) / initial.length;
    return start + (d < gapFrom ? d : d + SHAME_GAP * 2);
  };
  const posters = initial.map((legend, i) => createPoster(scene, legend, angleAt(i), wallR));
  const gallery = createGallery(posters);
  // Chỉ bản dev: xem cầu thủ đang treo để kiểm việc thay phiên.
  if (import.meta.env.DEV) window.__hangPosters = () => posters.map((p) => p.legend.name);
  // Đuốc và cờ treo cao phía trên hàng chân dung.
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2 + 0.31;
    const off = Math.atan2(Math.sin(a + Math.PI / 2), Math.cos(a + Math.PI / 2)); // >0: bên phải màn hình
    if (off > -GAP_LEFT && off < GAP_RIGHT) continue;
    const torch = createTorch();
    torch.group.position.set(Math.cos(a) * (wallR + 0.3), 6.4, Math.sin(a) * (wallR + 0.3));
    torch.group.lookAt(0, 6.4, 0);
    scene.add(torch.group);
    torches.push(torch);

    const banner = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 2.4), bannerMat);
    const b = a + 0.31;
    banner.position.set(Math.cos(b) * (wallR + 0.5), 7.8, Math.sin(b) * (wallR + 0.5));
    banner.lookAt(0, 7.8, 0);
    scene.add(banner);
  }

  return { fire, torches, gallery };
}

/** Bảng "Kết quả gần đây" đặt cạnh màn hình lớn. Trả về setResults(matches). */
function buildResultsBoard(scene) {
  const group = new THREE.Group();
  group.position.set(RESULTS_POS.x, 0, RESULTS_POS.z);
  group.lookAt(0, 0, 0);
  scene.add(group);

  const bottom = 1.2;
  const frame = new THREE.Mesh(
    new THREE.BoxGeometry(RESULTS_W + 0.5, RESULTS_H + 0.5, 0.35),
    new THREE.MeshStandardMaterial({ color: '#1b1210', roughness: 0.6 }),
  );
  frame.position.set(0, bottom + RESULTS_H / 2, -0.25);
  group.add(frame);
  // Hai chân đỡ.
  for (const sx of [-1, 1]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.3, bottom + 0.2, 0.3), frame.material);
    leg.position.set(sx * (RESULTS_W / 2 - 0.4), (bottom + 0.2) / 2, -0.25);
    group.add(leg);
  }

  const tex = textCanvas(1024, 1280, (g, w, h) => drawResults(g, w, h, null));
  const board = new THREE.Mesh(new THREE.PlaneGeometry(RESULTS_W, RESULTS_H), new THREE.MeshBasicMaterial({ map: tex, fog: false }));
  board.position.set(0, bottom + RESULTS_H / 2, -0.05);
  group.add(board);

  return {
    async setResults(matches) {
      await canvasFontsReady();
      drawResults(tex.image.getContext('2d'), tex.image.width, tex.image.height, matches);
      tex.needsUpdate = true;
    },
  };
}

/** 10 trận đã đá gần nhất, mới nhất ở trên. matches = null: đang tải. */
function drawResults(g, w, h, matches) {
  g.fillStyle = '#0f1426';
  g.fillRect(0, 0, w, h);
  g.fillStyle = BRAND.jersey.body;
  g.fillRect(0, 0, w, 110);
  g.fillStyle = BRAND.jersey.trim;
  g.fillRect(0, 110, w, 6);
  g.textBaseline = 'middle';
  g.textAlign = 'left';
  g.fillStyle = '#fff';
  g.font = '800 56px Bitter, Georgia, serif';
  g.fillText('📊 KẾT QUẢ GẦN ĐÂY', 32, 58);

  if (!matches?.length) {
    g.textAlign = 'center';
    g.font = '600 44px "Be Vietnam Pro", sans-serif';
    g.fillStyle = '#c9d3ee';
    g.fillText(matches ? 'Chưa có kết quả' : 'Đang tải kết quả…', w / 2, h / 2);
    return;
  }

  const top = 126;
  const rows = 10;
  const rowH = (h - top - 8) / rows;
  const mid = w / 2;
  matches.slice(0, rows).forEach((m, i) => {
    const y = top + i * rowH;
    if (i % 2 === 0) {
      g.fillStyle = 'rgba(255, 255, 255, 0.04)';
      g.fillRect(12, y + 3, w - 24, rowH - 6);
    }
    // Dòng nhỏ: ngày · giải · luân lưu.
    const pens = /pen/i.test(m.detail) ? ' · có đá luân lưu' : '';
    g.textAlign = 'center';
    g.font = '500 26px "Be Vietnam Pro", sans-serif';
    g.fillStyle = '#7d8bb0';
    g.fillText(`${formatDay(m.date)} · ${shortLeague(m.league)}${pens}`, mid, y + 28);

    const hs = Number(m.homeScore);
    const as = Number(m.awayScore);
    const cy = y + rowH * 0.64;
    const team = (name, x, align, won) => {
      g.textAlign = align;
      const ours = OUR_TEAMS.has(name);
      g.font = `${ours ? 700 : 500} ${ours ? 40 : 38}px "Be Vietnam Pro", sans-serif`;
      g.fillStyle = ours ? '#ffffff' : '#c9d3ee';
      g.globalAlpha = won === false ? 0.65 : 1;
      g.fillText(name, x, cy);
      g.globalAlpha = 1;
    };
    team(m.home, mid - 90, 'right', hs === as ? null : hs > as);
    team(m.away, mid + 90, 'left', hs === as ? null : as > hs);
    // Ô tỉ số.
    g.fillStyle = BRAND.jersey.trim;
    g.fillRect(mid - 74, cy - 28, 148, 56);
    g.fillStyle = '#1b1b1b';
    g.textAlign = 'center';
    g.font = '800 42px Bitter, Georgia, serif';
    g.fillText(`${m.homeScore} - ${m.awayScore}`, mid, cy + 2);
  });
}

function formatDay(iso) {
  const p = Object.fromEntries(VN_TIME.formatToParts(new Date(iso)).map((x) => [x.type, x.value]));
  return `${p.weekday} ${p.day}/${p.month}`;
}

// Font chỉ dùng trên canvas chưa được trình duyệt tải (kể cả bộ chữ tiếng Việt): tải trước rồi mới vẽ.
let fontsPromise = null;
function canvasFontsReady() {
  fontsPromise ??= Promise.all(
    ['800 58px Bitter', '700 42px "Be Vietnam Pro"', '600 34px "Be Vietnam Pro"', '500 34px "Be Vietnam Pro"'].map((f) =>
      document.fonts.load(f, 'LỊCH THI ĐẤU Việt Agüero Čech').catch(() => {}),
    ),
  );
  return fontsPromise;
}

const POSTER_PHOTO_H = 372;

function clubOf(legend) {
  return CLUBS[legend.club] ?? { name: '', colors: [BRAND.jersey.body, '#0d1a44'], accent: '#fff' };
}

/** Vẽ một tranh chân dung: ảnh thật (nếu có) hoặc bóng người, dải tên, ghi công ảnh. */
function drawPoster(g, w, h, legend, photo) {
  const club = clubOf(legend);
  const credit = LEGEND_PHOTOS[legend.name];
  const PHOTO_H = POSTER_PHOTO_H;
  const grad = g.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, club.colors[0]);
  grad.addColorStop(1, club.colors[1]);
  g.fillStyle = grad;
  g.fillRect(0, 0, w, h);
  g.textAlign = 'center';
  g.textBaseline = 'middle';

  if (photo) {
    // Ảnh thật, cắt kiểu "cover" và ưu tiên phần trên (mặt người).
    const s = Math.max(w / photo.width, PHOTO_H / photo.height);
    const dw = photo.width * s;
    const dh = photo.height * s;
    g.drawImage(photo, (w - dw) / 2, Math.min(0, (PHOTO_H - dh) * 0.25), dw, dh);
    const fade = g.createLinearGradient(0, PHOTO_H - 90, 0, PHOTO_H);
    fade.addColorStop(0, 'rgba(0,0,0,0)');
    fade.addColorStop(1, club.colors[1]);
    g.fillStyle = fade;
    g.fillRect(0, PHOTO_H - 90, w, 90);
    // Huy hiệu số áo ở góc.
    g.fillStyle = club.colors[0];
    g.beginPath();
    g.arc(w - 44, 44, 32, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = club.accent;
    g.font = '800 34px Bitter, Georgia, serif';
    g.fillText(String(legend.number ?? ''), w - 44, 46);
  } else {
    // Chưa có ảnh: bóng người + số áo.
    g.globalAlpha = 0.22;
    g.fillStyle = '#fff';
    g.font = '800 300px Bitter, Georgia, serif';
    g.fillText(String(legend.number ?? ''), w / 2, 200);
    g.globalAlpha = 1;
    g.fillStyle = 'rgba(0, 0, 0, 0.35)';
    g.beginPath();
    g.arc(w / 2, 150, 58, 0, Math.PI * 2);
    g.fill();
    g.beginPath();
    g.moveTo(w / 2 - 120, 360);
    g.quadraticCurveTo(w / 2 - 110, 225, w / 2, 220);
    g.quadraticCurveTo(w / 2 + 110, 225, w / 2 + 120, 360);
    g.fill();
    g.fillStyle = club.accent;
    g.font = '800 64px Bitter, Georgia, serif';
    g.fillText(String(legend.number ?? ''), w / 2, 300);
  }

  // Dải tên phía dưới.
  g.fillStyle = 'rgba(0, 0, 0, 0.6)';
  g.fillRect(0, PHOTO_H, w, h - PHOTO_H);
  g.fillStyle = club.accent;
  g.fillRect(0, PHOTO_H, w, 5);
  g.fillStyle = '#fff';
  let size = 40;
  g.font = `800 ${size}px Bitter, Georgia, serif`;
  while (g.measureText(legend.name).width > w - 30 && size > 24) g.font = `800 ${(size -= 2)}px Bitter, Georgia, serif`;
  g.fillText(legend.name, w / 2, 412);
  g.font = '600 24px "Be Vietnam Pro", sans-serif';
  g.fillStyle = club.accent;
  g.fillText(`${club.name} · ${legend.years ?? ''}`, w / 2, 452);
  if (credit) {
    // Ghi công theo yêu cầu của giấy phép CC.
    let line = `Ảnh: ${credit.artist} · ${credit.license}`;
    g.font = '500 15px "Be Vietnam Pro", sans-serif';
    g.fillStyle = 'rgba(255,255,255,0.7)';
    while (g.measureText(line).width > w - 20 && line.length > 10) line = `${line.slice(0, -4)}…`;
    g.fillText(line, w / 2, 490);
  }
}

/** Tạo texture tranh: vẽ ngay bản tạm, trả về promise xong khi font + ảnh đã tải và đã vẽ lại. */
function makePosterTexture(legend) {
  const tex = textCanvas(384, 512, (g, w, h) => drawPoster(g, w, h, legend, null));
  const credit = LEGEND_PHOTOS[legend.name];
  const photo = credit
    ? new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
        img.src = credit.img;
      })
    : Promise.resolve(null);
  const ready = Promise.all([canvasFontsReady(), photo]).then(([, img]) => {
    drawPoster(tex.image.getContext('2d'), tex.image.width, tex.image.height, legend, img);
    tex.needsUpdate = true;
    return tex;
  });
  return { tex, ready };
}

/** Một khung tranh treo vách; show() lật tranh sang cầu thủ khác. */
function createPoster(scene, legend, angle, r) {
  const first = makePosterTexture(legend);
  // Tự sáng nhẹ để vẫn đọc được tên khi đứng xa đuốc.
  const mat = new THREE.MeshStandardMaterial({ map: first.tex, roughness: 0.7, emissive: '#ffffff', emissiveMap: first.tex, emissiveIntensity: 0.45 });
  const pivot = new THREE.Group();
  pivot.position.set(Math.cos(angle) * r, 3.4, Math.sin(angle) * r);
  pivot.lookAt(0, 3.4, 0);
  const poster = new THREE.Mesh(new THREE.PlaneGeometry(2.1, 2.8), mat);
  const frame = new THREE.Mesh(new THREE.BoxGeometry(2.35, 3.05, 0.08), new THREE.MeshStandardMaterial({ color: '#3a2618' }));
  frame.position.z = -0.05;
  pivot.add(frame, poster);
  scene.add(pivot);

  const FLIP = 0.7; // giây cho cả lượt lật
  let flip = null; // { t, next: texture đã sẵn sàng, swapped }
  return {
    legend,
    get busy() {
      return !!flip;
    },
    async show(next) {
      if (flip) return;
      this.legend = next;
      const { ready } = makePosterTexture(next);
      flip = { t: 0, next: await ready, swapped: false };
    },
    update(dt) {
      if (!flip) return;
      flip.t += dt;
      const k = Math.min(1, flip.t / FLIP);
      // Lật quanh trục dọc: thu về 0 rồi mở ra với tranh mới.
      poster.scale.x = Math.abs(Math.cos(k * Math.PI));
      if (k >= 0.5 && !flip.swapped) {
        const old = mat.map;
        mat.map = flip.next;
        mat.emissiveMap = flip.next;
        mat.needsUpdate = true;
        old.dispose();
        flip.swapped = true;
      }
      if (k >= 1) {
        poster.scale.x = 1;
        flip = null;
      }
    },
  };
}

/** Thay phiên tranh: cứ POSTER_SWAP_MS lại đổi một khung sang cầu thủ chưa treo, cùng CLB với khung đó. */
function createGallery(posters) {
  // Đếm theo đồng hồ thật: dt của khung hình bị giới hạn khi máy chậm, sẽ làm nhịp đổi tranh chậm theo.
  let lastSwap = performance.now();
  return {
    update(dt) {
      for (const p of posters) p.update(dt);
      const now = performance.now();
      if (now - lastSwap < POSTER_SWAP_MS) return;
      lastSwap = now;
      const shown = new Set(posters.map((p) => p.legend.name));
      const idle = posters.filter((p) => !p.busy);
      const slot = idle[Math.floor(Math.random() * idle.length)];
      if (!slot) return;
      const pool = LEGENDS.filter((l) => l.club === slot.legend.club && !shown.has(l.name));
      if (pool.length) slot.show(pool[Math.floor(Math.random() * pool.length)]);
    },
  };
}

function buildScreen(scene, css3dScene, { onVideoError } = {}) {
  const group = new THREE.Group();
  group.position.set(0, 0, SCREEN_Z);
  scene.add(group);

  // Bố cục từ dưới lên: video 16:9, bảng lịch thi đấu.
  const VIDEO_W = 17.6;
  const VIDEO_H = (VIDEO_W * 9) / 16;
  const videoY = 1.6 + VIDEO_H / 2;
  const BOARD_H = 5.6; // lịch thi đấu + dải tỉ lệ bình chọn bên dưới
  const boardY = videoY + VIDEO_H / 2 + 0.4 + BOARD_H / 2;

  const frameH = boardY + BOARD_H / 2 + 0.3 - 1.1;
  const frame = new THREE.Mesh(
    new THREE.BoxGeometry(SCREEN_HALF_W * 2 - 0.4, frameH, 0.4),
    new THREE.MeshStandardMaterial({ color: '#1b1210', roughness: 0.6 }),
  );
  frame.position.set(0, 1.1 + frameH / 2, -0.3);
  group.add(frame);

  const boardTex = textCanvas(2048, 652, (g, w, h) => drawBoard(g, w, h, null, null));
  const boardData = { matches: null, poll: null };
  async function redrawBoard() {
    await canvasFontsReady();
    const canvas = boardTex.image;
    drawBoard(canvas.getContext('2d'), canvas.width, canvas.height, boardData.matches, boardData.poll);
    boardTex.needsUpdate = true;
  }
  const board = new THREE.Mesh(
    new THREE.PlaneGeometry(VIDEO_W, BOARD_H),
    new THREE.MeshBasicMaterial({ map: boardTex, fog: false }),
  );
  board.position.set(0, boardY, 0);
  group.add(board);

  let player = null;

  const idleTexture = (message) =>
    textCanvas(1280, 720, (g, w, h) => {
      const grad = g.createRadialGradient(w / 2, h / 2, 50, w / 2, h / 2, w * 0.6);
      grad.addColorStop(0, '#24345f');
      grad.addColorStop(1, '#0b1020');
      g.fillStyle = grad;
      g.fillRect(0, 0, w, h);
      g.fillStyle = '#f5efe6';
      g.textAlign = 'center';
      g.font = '800 120px Bitter, Georgia, serif';
      g.fillText(BRAND.signMain, w / 2, h / 2);
      g.font = '500 40px "Be Vietnam Pro", sans-serif';
      g.globalAlpha = 0.75;
      g.fillText(message, w / 2, h / 2 + 80);
    });
  const idle = new THREE.Mesh(
    new THREE.PlaneGeometry(VIDEO_W, VIDEO_H),
    new THREE.MeshBasicMaterial({ map: idleTexture('Chưa có video. Điền youtubeIds trong src/config.js') }),
  );
  idle.position.set(0, videoY, 0.02);
  group.add(idle);

  const playlist = [...SCOREBOARD.youtubeIds].sort(() => Math.random() - 0.5);
  const blocked = new Set();
  let current = 0;
  const currentId = () => playlist[current];
  // Chuyển sang video kế tiếp chưa bị chặn; hết thì trả về false.
  function advance() {
    for (let step = 1; step <= playlist.length; step++) {
      const next = (current + step) % playlist.length;
      if (!blocked.has(playlist[next])) {
        current = next;
        return true;
      }
    }
    return false;
  }

  if (playlist.length) {
    // "Lỗ" trong suốt trên canvas WebGL để iframe (lớp CSS3D phía sau) lộ ra.
    idle.visible = false;
    const hole = new THREE.Mesh(
      new THREE.PlaneGeometry(VIDEO_W, VIDEO_H),
      new THREE.MeshBasicMaterial({ color: 0x000000, opacity: 0, transparent: true, blending: THREE.NoBlending }),
    );
    hole.position.set(0, videoY, 0.02);
    group.add(hole);

    // Dùng YouTube IFrame API: nhúng tay bằng URL dễ dính lỗi 153 (thiếu định danh trang).
    const box = el('div', { style: 'width:1280px;height:720px;background:#000' }, el('div'));
    const obj = new CSS3DObject(box);
    loadYouTubeApi().then((YT) => {
      player = new YT.Player(box.firstChild, {
        host: 'https://www.youtube-nocookie.com',
        videoId: currentId(),
        width: 1280,
        height: 720,
        playerVars: {
          autoplay: 1, mute: 1, controls: 0, disablekb: 1, fs: 0, rel: 0,
          playsinline: 1, origin: location.origin,
        },
        events: {
          onReady: (e) => {
            e.target.mute();
            e.target.playVideo();
          },
          onStateChange: (e) => {
            if (e.data === YT.PlayerState.ENDED && advance()) e.target.loadVideoById(currentId());
          },
          // 101/150: chủ video không cho nhúng. Thử video khác; hết video thì hiện thông báo.
          onError: (e) => {
            blocked.add(currentId());
            if (advance()) {
              e.target.loadVideoById(currentId());
              return;
            }
            idle.material.map.dispose();
            idle.material.map = idleTexture(
              e.data === 101 || e.data === 150 ? 'Video này chỉ xem được trên YouTube' : 'Không phát được video',
            );
            idle.visible = true;
            hole.visible = false;
            obj.visible = false;
            onVideoError?.(e.data);
          },
        },
      });
    });
    obj.position.set(0, videoY, SCREEN_Z + 0.02);
    obj.scale.setScalar(VIDEO_W / 1280);
    css3dScene.add(obj);
  }

  const glow = new THREE.PointLight('#8fb0ff', 22, 20, 1.6);
  glow.position.set(0, 8, 4);
  group.add(glow);

  return {
    setFixtures(matches) {
      boardData.matches = matches;
      redrawBoard();
    },
    // poll: { matchId, home, away, options, counts } — vẽ tỉ lệ bình chọn ngay dưới lịch.
    setPoll(poll) {
      boardData.poll = poll;
      redrawBoard();
    },
    setVideoMuted(muted) {
      if (!player?.mute) return;
      if (muted) player.mute();
      else {
        player.unMute();
        player.setVolume(80);
        player.playVideo();
      }
    },
    currentVideoId: currentId,
    dispose() {
      player?.destroy?.();
    },
  };
}

const OUR_TEAMS = new Set(FIXTURE_TEAMS.map((t) => t.name));

function formatKickoff(iso) {
  const p = Object.fromEntries(VN_TIME.formatToParts(new Date(iso)).map((x) => [x.type, x.value]));
  return `${p.weekday} ${p.day}/${p.month} · ${p.hour}:${p.minute}`;
}

/** Vẽ bảng "Lịch thi đấu sắp tới": 2 cột × 5 trận, trận gần nhất được làm nổi. matches = null: đang tải. */
function drawFixtures(g, w, h, matches) {
  g.fillStyle = '#0f1426';
  g.fillRect(0, 0, w, h);
  g.fillStyle = BRAND.jersey.body;
  g.fillRect(0, 0, w, 96);
  g.fillStyle = BRAND.jersey.trim;
  g.fillRect(0, 96, w, 6);

  g.textBaseline = 'middle';
  g.textAlign = 'left';
  g.fillStyle = '#fff';
  g.font = '800 58px Bitter, Georgia, serif';
  g.fillText('📅 LỊCH THI ĐẤU SẮP TỚI', 36, 50);
  g.textAlign = 'right';
  g.font = '500 34px "Be Vietnam Pro", sans-serif';
  g.globalAlpha = 0.85;
  g.fillText('Giờ Việt Nam', w - 36, 52);
  g.globalAlpha = 1;

  if (!matches?.length) {
    g.textAlign = 'center';
    g.font = '600 48px "Be Vietnam Pro", sans-serif';
    g.fillStyle = '#c9d3ee';
    g.fillText(matches ? 'Chưa có lịch thi đấu' : 'Đang tải lịch thi đấu…', w / 2, (h + 100) / 2);
    return;
  }

  const ROWS = 5;
  const top = 112;
  const rowH = (h - top - 10) / ROWS;
  const colW = w / 2;
  matches.slice(0, ROWS * 2).forEach((m, i) => {
    const x = (i < ROWS ? 0 : colW) + 30;
    const y = top + (i % ROWS) * rowH;
    if (i === 0) {
      g.fillStyle = 'rgba(242, 194, 48, 0.18)';
      g.fillRect(x - 14, y + 4, colW - 32, rowH - 8);
      g.fillStyle = BRAND.jersey.trim;
      g.fillRect(x - 14, y + 4, 8, rowH - 8);
    } else if (i % 2 === 0) {
      g.fillStyle = 'rgba(255, 255, 255, 0.04)';
      g.fillRect(x - 14, y + 4, colW - 32, rowH - 8);
    }
    const cy = y + rowH / 2;
    g.textAlign = 'left';
    g.font = '600 34px "Be Vietnam Pro", sans-serif';
    g.fillStyle = i === 0 ? BRAND.jersey.trim : '#9fb0d8';
    g.fillText(formatKickoff(m.date), x + 6, cy);

    // Tên hai đội: đội trong danh sách theo dõi được tô sáng.
    let tx = x + 330;
    const team = (name) => {
      g.font = OUR_TEAMS.has(name) ? '700 42px "Be Vietnam Pro", sans-serif' : '500 40px "Be Vietnam Pro", sans-serif';
      g.fillStyle = OUR_TEAMS.has(name) ? '#ffffff' : '#c9d3ee';
      g.fillText(name, tx, cy);
      tx += g.measureText(name).width;
    };
    team(m.home);
    g.font = '500 34px "Be Vietnam Pro", sans-serif';
    g.fillStyle = '#7d8bb0';
    g.fillText('  vs  ', tx, cy);
    tx += g.measureText('  vs  ').width;
    team(m.away);

    g.textAlign = 'right';
    g.font = '500 26px "Be Vietnam Pro", sans-serif';
    g.fillStyle = '#7d8bb0';
    g.fillText(shortLeague(m.league), x + colW - 56, cy);
  });
}

const FIXTURE_AREA_H = 536;

/** Bảng lớn: lịch thi đấu phía trên, dải tỉ lệ bình chọn trận gần nhất phía dưới. */
function drawBoard(g, w, h, matches, poll) {
  drawFixtures(g, w, FIXTURE_AREA_H, matches);
  drawPollStrip(g, w, FIXTURE_AREA_H, h - FIXTURE_AREA_H, poll);
}

function drawPollStrip(g, w, y0, h, poll) {
  g.fillStyle = '#161d36';
  g.fillRect(0, y0, w, h);
  g.fillStyle = BRAND.jersey.trim;
  g.fillRect(0, y0, w, 4);
  if (!poll?.home) return;

  const counts = poll.counts ?? [];
  const total = counts.reduce((a, b) => a + b, 0);
  const pad = 36;
  const titleY = y0 + 34;
  g.textBaseline = 'middle';
  g.textAlign = 'left';
  g.font = '700 34px "Be Vietnam Pro", sans-serif';
  g.fillStyle = '#fff';
  g.fillText(`🗳️ ANH EM DỰ ĐOÁN · ${poll.home} vs ${poll.away}`, pad, titleY);
  g.textAlign = 'right';
  g.font = '500 30px "Be Vietnam Pro", sans-serif';
  g.fillStyle = '#9fb0d8';
  g.fillText(total ? `${total} phiếu · bấm 1 / 2 / 3 để chọn` : 'Chưa có phiếu · bấm 1 / 2 / 3 để chọn', w - pad, titleY);

  // Thanh chồng 3 màu: đội nhà thắng / hoà / đội khách thắng.
  const barX = pad;
  const barY = y0 + 62;
  const barW = w - pad * 2;
  const barH = 46;
  const colors = [BRAND.jersey.trim, '#7d8bb0', '#4f8cff'];
  const labels = [poll.home, 'Hoà', poll.away];
  const shares = counts.map((c) => (total ? c / total : 1 / counts.length));
  let x = barX;
  shares.forEach((s, i) => {
    const segW = i === shares.length - 1 ? barX + barW - x : Math.round(barW * s);
    if (segW <= 0) return;
    g.fillStyle = colors[i] ?? '#888';
    g.globalAlpha = total ? 1 : 0.35;
    g.fillRect(x, barY, segW, barH);
    g.globalAlpha = 1;
    const pct = total ? `${Math.round(s * 100)}%` : '–';
    const text = `${labels[i] ?? ''} ${pct}`;
    g.font = '700 30px "Be Vietnam Pro", sans-serif';
    g.fillStyle = i === 0 ? '#1b1b1b' : '#fff';
    g.textAlign = 'center';
    // Đoạn hẹp thì chỉ ghi phần trăm.
    const fit = g.measureText(text).width + 20 < segW ? text : g.measureText(pct).width + 10 < segW ? pct : '';
    g.fillText(fit, x + segW / 2, barY + barH / 2 + 1);
    x += segW;
  });
}

function shortLeague(name) {
  const map = {
    'Premier League': 'NHA', LALIGA: 'La Liga', 'UEFA Champions League': 'C1', 'UEFA Europa League': 'C2',
    'Carabao Cup': 'League Cup', 'FA Cup': 'FA Cup', 'Copa del Rey': 'Cúp Nhà Vua',
  };
  return map[name] ?? name;
}

/** setPointerCapture ném lỗi khi chuột đang bị khoá hoặc con trỏ đã nhả; bỏ qua được. */
function capture(node, pointerId) {
  try {
    node.setPointerCapture(pointerId);
  } catch {
    // không bắt được con trỏ thì vẫn nhận pointermove trên chính phần tử
  }
}

/**
 * Nhạc cổ động viên: trình phát YouTube ẩn, phát ngẫu nhiên lần lượt các bài trong FAN_SONGS.
 * Trình duyệt chỉ cho phát tiếng sau khi người chơi bấm/gõ phím, nên start() gọi từ thao tác đầu tiên.
 */
function createFanMusic({ onSong } = {}) {
  const songs = FAN_SONGS.slice();
  const blocked = new Set();
  let current = null;
  let player = null;
  let ready = null;
  let playing = false;
  let volume = 60;
  // Không đặt display:none: một số trình duyệt không phát iframe bị ẩn hẳn.
  const host = el('div', { style: 'position:fixed;left:-10px;top:-10px;width:1px;height:1px;opacity:0;pointer-events:none' }, el('div'));
  document.body.append(host);

  function pick() {
    const pool = songs.filter((s) => s !== current && !blocked.has(s.id));
    return pool.length ? pool[Math.floor(Math.random() * pool.length)] : null;
  }
  function ensure() {
    ready ??= loadYouTubeApi().then(
      (YT) =>
        new Promise((resolve) => {
          player = new YT.Player(host.firstChild, {
            host: 'https://www.youtube-nocookie.com',
            width: 1,
            height: 1,
            playerVars: { autoplay: 0, controls: 0, disablekb: 1, fs: 0, rel: 0, playsinline: 1, origin: location.origin },
            events: {
              onReady: () => resolve(player),
              onStateChange: (e) => e.data === YT.PlayerState.ENDED && playing && next(),
              onError: () => {
                if (current) blocked.add(current.id);
                if (playing) next();
              },
            },
          });
        }),
    );
    return ready;
  }
  async function next() {
    const song = pick();
    if (!song) return;
    current = song;
    const p = await ensure();
    p.loadVideoById(song.id);
    p.unMute();
    p.setVolume(volume);
    onSong?.(song);
  }
  return {
    get playing() {
      return playing;
    },
    async start() {
      if (playing) return;
      playing = true;
      if (current && player) {
        player.playVideo();
        onSong?.(current);
      } else await next();
    },
    stop() {
      playing = false;
      player?.pauseVideo?.();
    },
    next() {
      if (playing) next();
    },
    setVolume(v) {
      volume = Math.round(v * 100); // thanh âm lượng mặc định 0.6 → 60/100
      player?.setVolume?.(volume);
    },
    dispose() {
      player?.destroy?.();
      host.remove();
    },
  };
}

let ytApi = null;
function loadYouTubeApi() {
  ytApi ??= new Promise((resolve) => {
    if (window.YT?.Player) return resolve(window.YT);
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      resolve(window.YT);
    };
    document.head.append(el('script', { src: 'https://www.youtube.com/iframe_api' }));
  });
  return ytApi;
}

// ---------------------------------------------------------------------------
// Pháo giấy khi ăn mừng
// ---------------------------------------------------------------------------

function createConfetti(scene) {
  const bursts = [];
  const colors = [BRAND.jersey.body, BRAND.jersey.trim, '#ffffff', '#ff6b6b', '#4cd97b'].map((c) => new THREE.Color(c));
  return {
    burst(pos) {
      const N = 90;
      const positions = new Float32Array(N * 3);
      const cols = new Float32Array(N * 3);
      const vel = [];
      for (let i = 0; i < N; i++) {
        positions.set([pos.x, 2, pos.z], i * 3);
        const c = colors[i % colors.length];
        cols.set([c.r, c.g, c.b], i * 3);
        const a = Math.random() * Math.PI * 2;
        const s = 1.5 + Math.random() * 2.5;
        vel.push(new THREE.Vector3(Math.cos(a) * s, 5 + Math.random() * 4, Math.sin(a) * s));
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geo.setAttribute('color', new THREE.BufferAttribute(cols, 3));
      const pts = new THREE.Points(geo, new THREE.PointsMaterial({ size: 0.16, vertexColors: true, transparent: true, depthWrite: false }));
      scene.add(pts);
      bursts.push({ pts, vel, life: 2 });
    },
    update(dt) {
      for (let b = bursts.length - 1; b >= 0; b--) {
        const burst = bursts[b];
        burst.life -= dt;
        const p = burst.pts.geometry.attributes.position;
        burst.vel.forEach((v, i) => {
          v.y -= 9.8 * dt;
          v.multiplyScalar(0.985);
          p.setXYZ(i, p.getX(i) + v.x * dt, Math.max(0.05, p.getY(i) + v.y * dt), p.getZ(i) + v.z * dt);
        });
        p.needsUpdate = true;
        burst.pts.material.opacity = Math.min(1, burst.life);
        if (burst.life <= 0) {
          scene.remove(burst.pts);
          burst.pts.geometry.dispose();
          burst.pts.material.dispose();
          bursts.splice(b, 1);
        }
      }
    },
  };
}

// ---------------------------------------------------------------------------
// HUD
// ---------------------------------------------------------------------------

/** Nút có biểu tượng + chữ; trên điện thoại CSS ẩn phần chữ để thanh trên cùng gọn một hàng. */
function setLabel(btn, icon, text) {
  btn.replaceChildren(el('span', { className: 'ico' }, icon), el('span', { className: 'lbl' }, ` ${text}`));
  btn.title = text;
}

function buildHud(app, { onLeave }) {
  const kbd = (k) => el('span', { className: 'kbd' }, k);

  const leave = el('button', { className: 'pill', type: 'button' });
  setLabel(leave, '🚪', 'Ra hang');
  const volume = el('input', { type: 'range', min: 0, max: 1, step: 0.05, value: 0.6, 'aria-label': 'Âm lượng' });
  const muteBtn = el('button', { className: 'pill', type: 'button', style: 'padding:6px 8px' }, '🔊');
  const videoBtn = el('button', { className: 'pill', type: 'button' });
  setLabel(videoBtn, '📺', 'Tiếng video');
  const myHp = el('div', { className: 'pill my-hp', 'aria-label': 'Máu của bạn' });
  const musicBtn = el('button', { className: 'pill', type: 'button' });
  setLabel(musicBtn, '🎵', 'Nhạc CĐV');
  const musicNextBtn = el('button', { className: 'pill', type: 'button', title: 'Bài khác (N)', 'aria-label': 'Bài nhạc khác' }, '⏭');
  const top = el('div', { className: 'hud-top' }, leave, myHp, el('div', { className: 'pill vol' }, muteBtn, volume), videoBtn, musicBtn, musicNextBtn);
  const ghostBanner = el('div', { className: 'ghost-banner' });

  const count = el('span', {}, '…');
  const roomInfo = el('div', { className: 'room-info' }, el('b', {}, BRAND.roomName), count);

  const log = el('div', { className: 'chat-log', role: 'log' });
  const input = el('input', { placeholder: 'Nhấn Enter để nhắn tin…', maxLength: 200 });
  const hideChat = el('button', { className: 'pill', type: 'button' }, 'Ẩn');
  const chat = el('div', { className: 'chat' }, el('div', { className: 'chat-head' }, el('span', {}, 'Chat trong hang'), hideChat), log, input);
  const setChatOpen = (open) => {
    chat.classList.toggle('collapsed', !open);
    hideChat.textContent = open ? 'Ẩn' : '💬 Chat';
  };
  hideChat.addEventListener('click', () => setChatOpen(chat.classList.contains('collapsed')));

  // Bình chọn: mỗi trận sắp đá một cuộc; mũi tên chuyển trận, nút ℹ xem lại toàn bộ.
  const pollQ = el('div', { className: 'poll-q' });
  const pollMeta = el('div', { className: 'poll-meta' });
  const pollOpts = el('div', { className: 'poll-opts' });
  const prevBtn = el('button', { className: 'poll-nav', type: 'button', 'aria-label': 'Trận trước' }, '◀');
  const nextBtn = el('button', { className: 'poll-nav', type: 'button', 'aria-label': 'Trận sau' }, '▶');
  const infoBtn = el('button', { className: 'poll-nav poll-info', type: 'button', 'aria-label': 'Xem lại bình chọn' }, 'ℹ');
  const poll = el('div', { className: 'poll' }, el('div', { className: 'poll-head' }, prevBtn, pollQ, nextBtn, infoBtn), pollMeta, pollOpts);
  let pollBtns = [];
  let onVote = () => {};
  const nav = { prev: () => {}, next: () => {}, info: () => {} };
  prevBtn.addEventListener('click', () => nav.prev());
  nextBtn.addEventListener('click', () => nav.next());
  infoBtn.addEventListener('click', () => nav.info());
  // Màn nhỏ: khung bình chọn thu gọn còn một dòng, chạm vào tiêu đề để mở/đóng nút chọn.
  pollQ.addEventListener('click', () => poll.classList.toggle('folded'));
  function setPoll(p, index = 0, total = 1) {
    pollQ.textContent = `🗳️ ${p.question}`;
    const when = p.kickoff ? `${formatKickoff(p.kickoff)} · ${shortLeague(p.league)}` : '';
    pollMeta.textContent = total > 1 ? `${when} · trận ${index + 1}/${total}` : when;
    prevBtn.disabled = index <= 0;
    nextBtn.disabled = index >= total - 1;
    pollBtns = p.options.map((text, i) => {
      const countEl = el('span', { className: 'count' }, '0');
      const b = el('button', { type: 'button' }, kbd(String(i + 1)), text, countEl);
      b.countEl = countEl;
      b.addEventListener('click', () => onVote(i));
      return b;
    });
    pollOpts.replaceChildren(...pollBtns);
  }
  setPoll({ question: POLL.question, options: POLL.options });

  const celebrate = el('button', { className: 'btn-celebrate', type: 'button', title: 'Ăn mừng' }, el('span', { className: 'ico' }, '🎉'), el('span', { className: 'lbl' }, ' Ăn mừng'), kbd('G'));
  const keysBtn = el('button', { className: 'pill btn-keys', type: 'button' }, 'Phím (H)');
  const hint = el('div', { className: 'hint-bottom' }, 'Bấm vào cảnh để xoay bằng chuột');
  const toast = el('div', { className: 'toast' });
  const punchHint = el('div', { className: 'punch-btn' }, '👊 Nhấn F để đấm');
  const tomatoBtn = el('button', { className: 'btn-tomato', type: 'button', title: 'Ném cà chua (T)' }, el('span', { className: 'ico' }, '🍅'), el('span', { className: 'lbl' }, ' Ném cà chua'), kbd('T'));

  // Điều khiển cảm ứng: cần gạt bên trái, nút đấm bên phải.
  const knob = el('div', { className: 'joy-knob' });
  const joystick = el('div', { className: 'joystick', 'aria-label': 'Cần gạt di chuyển' }, knob);
  const punchTouch = el('button', { className: 'btn-punch', type: 'button', 'aria-label': 'Đấm' }, '👊');

  const isTouch = matchMedia('(pointer: coarse)').matches;
  const hud = el('div', { className: `hud${isTouch ? ' touch' : ''}` }, top, roomInfo, chat, poll, celebrate, keysBtn, hint, toast, punchHint, joystick, punchTouch, ghostBanner, tomatoBtn);
  app.append(hud);
  // Điện thoại (kể cả xoay ngang) và màn hẹp: gọn tối đa để không che cảnh 3D.
  const compact = isTouch || matchMedia('(max-width: 640px)').matches;
  if (compact) {
    hud.classList.add('compact');
    setChatOpen(false);
    poll.classList.add('folded');
  }
  if (isTouch) hint.textContent = 'Vuốt màn hình để xoay góc nhìn';

  const joy = { x: 0, y: 0 };
  let joyPointer = null;
  function joyUpdate(e) {
    const r = joystick.getBoundingClientRect();
    const max = r.width / 2;
    let dx = e.clientX - (r.left + max);
    let dy = e.clientY - (r.top + max);
    const len = Math.hypot(dx, dy);
    if (len > max) {
      dx *= max / len;
      dy *= max / len;
    }
    knob.style.transform = `translate(${dx}px, ${dy}px)`;
    joy.x = dx / max;
    joy.y = dy / max;
  }
  function joyEnd(e) {
    if (e.pointerId !== joyPointer) return;
    joyPointer = null;
    joy.x = joy.y = 0;
    knob.style.transform = '';
  }
  joystick.addEventListener('pointerdown', (e) => {
    joyPointer = e.pointerId;
    capture(joystick, e.pointerId);
    joyUpdate(e);
  });
  joystick.addEventListener('pointermove', (e) => e.pointerId === joyPointer && joyUpdate(e));
  joystick.addEventListener('pointerup', joyEnd);
  joystick.addEventListener('pointercancel', joyEnd);

  leave.addEventListener('click', onLeave);

  let toastTimer = 0;
  function showToast(text) {
    toast.textContent = text;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 1800);
  }

  function addChat(entry) {
    const line = el('div');
    if (entry.sys) {
      line.className = 'sys';
      line.textContent = entry.text;
    } else {
      line.append(el('span', { className: 'who' }, entry.from), entry.text);
    }
    const atBottom = log.scrollHeight - log.scrollTop - log.clientHeight < 30;
    log.append(line);
    while (log.children.length > 80) log.firstChild.remove();
    if (atBottom) log.scrollTop = log.scrollHeight;
  }

  function card(title, body, { closeLabel } = {}) {
    const close = el('button', { className: 'close', type: 'button', 'aria-label': 'Đóng' }, '×');
    const node = el('div', { className: 'card' }, close, el('h3', {}, title), body);
    if (closeLabel) {
      const ok = el('button', { className: 'btn btn-primary', type: 'button' }, closeLabel);
      ok.addEventListener('click', () => node.remove());
      node.append(el('div', { className: 'actions' }, ok));
    }
    close.addEventListener('click', () => node.remove());
    hud.append(node);
    return node;
  }

  let helpCard = null;
  function toggleHelp() {
    if (helpCard?.isConnected) {
      helpCard.remove();
      helpCard = null;
      return;
    }
    const rows = [
      [['W', 'A', 'S', 'D'], 'Đi lại'],
      [['Chuột'], 'Xoay góc nhìn (bấm vào cảnh để khoá chuột, Esc để thả)'],
      [['F', 'Click'], 'Đấm người trong vòng đỏ, hoặc sút bóng khi đứng gần bóng (đi chạm vào bóng là rê)'],
      [['G'], 'Ăn mừng'],
      [['T'], 'Ném cà chua vào cờ đội vừa thua (ở Góc cà chua)'],
      [['Enter'], 'Chat'],
      [['1', '2', '3'], 'Bình chọn trận đang xem'],
      [['Q', 'E'], 'Chuyển sang trận trước / sau'],
      [['I'], 'Xem lại bình chọn các trận'],
      [['M'], 'Tắt / bật tiếng'],
      [['V'], 'Tắt / bật tiếng video bảng tin'],
      [['N'], 'Đổi bài nhạc cổ động viên'],
      [['H'], 'Mở / đóng bảng này'],
    ];
    const grid = el('div', { className: 'keys-grid' });
    for (const [keys, desc] of rows) grid.append(el('div', {}, ...keys.map(kbd)), el('div', {}, desc));
    helpCard = card('Cách điều khiển', grid, { closeLabel: 'Đã hiểu' });
  }
  keysBtn.addEventListener('click', toggleHelp);

  return {
    hud, input, log, volume, muteBtn, videoBtn, musicBtn, musicNextBtn, celebrate, tomatoBtn, punchHint, punchTouch, joy, isTouch,
    get pollBtns() {
      return pollBtns;
    },
    setPoll,
    set onVote(fn) {
      onVote = fn;
    },
    pollNav: nav,
    setCount: (n) => (count.textContent = compact ? `👥 ${n}` : `${n} anh em trong hang`),
    showToast, addChat, card, toggleHelp,
    setMyHp(hp, ghost) {
      myHp.textContent = ghost ? '👻 Ma' : '❤'.repeat(hp) + '♡'.repeat(MAX_HP - hp);
      myHp.classList.toggle('low', !ghost && hp <= 2);
      punchTouch.classList.toggle('disabled', ghost);
    },
    // secondsLeft > 0: đang làm ma, hiện đếm ngược; 0: ẩn.
    setGhostCountdown(secondsLeft) {
      ghostBanner.classList.toggle('show', secondsLeft > 0);
      if (secondsLeft > 0) ghostBanner.textContent = `👻 Bạn đang là ma, không đánh được ai. Hồi sinh sau ${secondsLeft}s`;
    },
  };
}

// ---------------------------------------------------------------------------
// Màn trong hang
// ---------------------------------------------------------------------------

export function mountCave(app, { profile, onLeave }) {
  const stage = el('div', { className: 'stage' });
  const css3dLayer = el('div', { className: 'css3d-layer' });
  const loading = el('div', { className: 'loading' }, 'Đang vào hang…');
  app.append(css3dLayer, stage, loading);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  stage.append(renderer.domElement);

  const labelRenderer = new CSS2DRenderer();
  labelRenderer.domElement.style.cssText = 'position:absolute;inset:0;pointer-events:none';
  stage.append(labelRenderer.domElement);

  const css3d = new CSS3DRenderer();
  css3dLayer.append(css3d.domElement);
  const css3dScene = new THREE.Scene();

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 120);
  const { fire, torches, gallery } = buildCave(scene);
  let videoBlocked = false;
  const screen = buildScreen(scene, css3dScene, {
    onVideoError() {
      videoBlocked = true;
      setLabel(hud.videoBtn, '▶', 'Xem video trên YouTube');
    },
  });
  const resultsBoard = buildResultsBoard(scene);
  // Cờ chiến thắng (đội vừa thắng) và Góc cà chua (đội vừa thua), dựa trên kết quả gần nhất.
  // Quả bóng chung + hai khung thành (vị trí bóng do server quyết định, xem server/ball.js).
  const ballView = BALL.enabled ? createBallView(scene, { fontsReady: canvasFontsReady }) : null;
  const banners = createBanners(scene, {
    ceilingAt: (r) => Math.sqrt(Math.max(0, 1 - (r / DOME_R) ** 2)) * DOME_R * DOME_SY,
    fontsReady: canvasFontsReady,
  });
  const getMatches = (url) =>
    fetch(url)
      .then((r) => r.json())
      .then((j) => j.matches ?? [])
      .catch(() => []);
  async function refreshFixtures() {
    getMatches('/api/fixtures').then(screen.setFixtures);
    getMatches('/api/results').then((matches) => {
      resultsBoard.setResults(matches);
      banners.setOutcomes(latestOutcomes(matches));
    });
  }
  refreshFixtures();
  const fixtureTimer = setInterval(refreshFixtures, 30 * 60 * 1000);
  const confetti = createConfetti(scene);
  const audio = createAudio();

  const hud = buildHud(app, { onLeave });

  // --- Người chơi -----------------------------------------------------------
  /** @type {Map<number, any>} */
  const others = new Map();
  let myId = null;
  const me = {
    avatar: createAvatar(profile.number, profile.club),
    pos: new THREE.Vector3(0, 0, 10),
    ry: Math.PI,
    knock: new THREE.Vector3(),
    moving: false,
  };
  scene.add(me.avatar.root);
  me.avatar.ring.material.color.set(BRAND.jersey.trim);
  me.avatar.ring.material.opacity = 0.5;
  const myLabel = makeLabel(profile.name, profile.number, true);
  me.avatar.root.add(myLabel.obj);

  function makeLabel(name, number, isMe = false) {
    const node = el('div', { className: `nametag${isMe ? ' me' : ''}` });
    if (number) node.append(el('span', { className: 'no' }, String(number)));
    node.append(name);
    const hearts = el('div', { className: 'hearts' });
    const wrap = el('div', { style: 'position:relative' }, node, hearts);
    const obj = new CSS2DObject(wrap);
    obj.position.set(0, 2.15, 0);
    let bubble = null;
    let bubbleTimer = 0;
    return {
      obj,
      setHp(hp, ghost) {
        hearts.textContent = ghost ? '👻' : '❤'.repeat(hp) + '♡'.repeat(MAX_HP - hp);
        wrap.classList.toggle('ghost', ghost);
      },
      say(text) {
        bubble?.remove();
        bubble = el('div', { className: 'bubble' }, text);
        wrap.append(bubble);
        clearTimeout(bubbleTimer);
        bubbleTimer = setTimeout(() => bubble?.remove(), 5000);
      },
    };
  }

  function addOther(p) {
    if (p.id === myId || others.has(p.id)) return;
    const avatar = createAvatar(p.number, p.club);
    const label = makeLabel(p.name, p.number);
    avatar.root.add(label.obj);
    avatar.root.position.set(p.x, 0, p.z);
    avatar.root.rotation.y = p.ry;
    scene.add(avatar.root);
    others.set(p.id, { id: p.id, name: p.name, avatar, label, target: new THREE.Vector3(p.x, 0, p.z), ry: p.ry, a: 0 });
    setHealth(p.id, p.hp ?? MAX_HP, p.ghostLeft ?? 0);
  }

  // --- Máu / ma -------------------------------------------------------------
  let myGhostUntil = 0;
  function setHealth(id, hp, ghostLeft) {
    const ghost = ghostLeft > 0;
    const avatar = avatarOf(id);
    if (avatar && avatar.ghost !== ghost) avatar.setGhost(ghost);
    if (id === myId) {
      myLabel.setHp(hp, ghost);
      myGhostUntil = ghost ? performance.now() + ghostLeft : 0;
      hud.setMyHp(hp, ghost);
    } else {
      others.get(id)?.label.setHp(hp, ghost);
    }
  }

  function removeOther(id) {
    const o = others.get(id);
    if (!o) return;
    o.label.obj.element.remove();
    o.avatar.root.remove(o.label.obj);
    scene.remove(o.avatar.root);
    o.avatar.dispose();
    others.delete(id);
  }

  function updateCount() {
    hud.setCount(others.size + (myId ? 1 : 0));
  }

  function avatarOf(id) {
    return id === myId ? me.avatar : others.get(id)?.avatar;
  }

  function nameOf(id) {
    return id === myId ? profile.name : others.get(id)?.name ?? 'Ai đó';
  }

  // --- Bình chọn ------------------------------------------------------------
  // polls: danh sách theo giờ đá (server gửi); sel: trận đang xem trên HUD và bảng lớn.
  let polls = [];
  let sel = 0;
  const selected = () => polls[sel];
  function renderCounts() {
    const p = selected();
    if (!p) return;
    hud.pollBtns.forEach((b, i) => {
      b.countEl.textContent = p.counts[i] ?? 0;
      b.classList.toggle('mine', p.mine === i);
    });
    screen.setPoll(p);
    if (infoCard?.isConnected) renderInfo();
  }
  function showPoll(index) {
    if (!polls.length) return;
    sel = Math.max(0, Math.min(polls.length - 1, index));
    hud.setPoll(selected(), sel, polls.length);
    renderCounts();
  }
  function applyPolls(list) {
    const keep = selected()?.matchId;
    polls = list;
    const idx = polls.findIndex((p) => p.matchId === keep);
    showPoll(idx >= 0 ? idx : 0);
  }
  hud.onVote = vote;
  hud.pollNav.prev = () => showPoll(sel - 1);
  hud.pollNav.next = () => showPoll(sel + 1);
  hud.pollNav.info = toggleInfo;
  function vote(i) {
    const p = selected();
    if (!p || i >= p.options.length) return;
    net.send({ t: 'vote', v: i, matchId: p.matchId });
  }

  // Bảng xem lại: mọi trận đang mở bình chọn, tỉ lệ và lựa chọn của mình; bấm một dòng để chuyển tới trận đó.
  let infoCard = null;
  const infoList = el('div', { className: 'vote-list' });
  function renderInfo() {
    infoList.replaceChildren(
      ...polls.map((p, i) => {
        const total = p.counts.reduce((a, b) => a + b, 0);
        const pct = (c) => (total ? `${Math.round((c / total) * 100)}%` : '–');
        const short = (o) => o.replace(/ thắng$/, '');
        const row = el(
          'button',
          { type: 'button', className: `vote-row${i === sel ? ' active' : ''}` },
          el('div', { className: 'vote-title' }, p.home ? `${p.home} vs ${p.away}` : p.question),
          el('div', { className: 'vote-when' }, p.kickoff ? `${formatKickoff(p.kickoff)} · ${shortLeague(p.league)}` : ''),
          el('div', { className: 'vote-pcts' }, p.options.map((o, k) => `${short(o)} ${pct(p.counts[k] ?? 0)}`).join('  ·  ') + `  (${total} phiếu)`),
          el('div', { className: 'vote-mine' }, p.mine != null ? `Bạn chọn: ${p.options[p.mine]}` : 'Bạn chưa chọn'),
        );
        row.addEventListener('click', () => showPoll(i));
        return row;
      }),
    );
  }
  function toggleInfo() {
    if (infoCard?.isConnected) {
      infoCard.remove();
      return;
    }
    renderInfo();
    infoCard = hud.card('🗳️ Bình chọn các trận sắp tới', infoList, { closeLabel: 'Đóng' });
    infoCard.classList.add('vote-card');
  }

  // --- Mạng -----------------------------------------------------------------
  const net = connect(profile, {
    status(s) {
      if (s === 'offline') hud.showToast('Mất kết nối, đang nối lại…');
    },
    welcome(msg) {
      for (const id of [...others.keys()]) removeOther(id);
      myId = msg.id;
      const self = msg.players.find((p) => p.id === myId);
      if (self) {
        me.pos.set(self.x, 0, self.z);
        setHealth(myId, self.hp ?? MAX_HP, self.ghostLeft ?? 0);
      }
      // Vừa vào hang: quay mặt về màn hình lớn để thấy ngay video và lịch thi đấu.
      me.ry = Math.atan2(-me.pos.x, SCREEN_Z - me.pos.z);
      camYaw = me.ry + Math.PI;
      msg.players.forEach(addOther);
      hud.log.replaceChildren();
      msg.chat.forEach(hud.addChat);
      banners.setTomatoes(msg.tomatoes ?? {});
      if (msg.ball) {
        ballView?.setState(msg.ball.b);
        ballView?.setScore(msg.ball.score);
      }
      applyPolls(msg.polls ?? []);
      updateCount();
      loading.remove();
      maybeTutorial();
    },
    join(msg) {
      addOther(msg.p);
      updateCount();
    },
    leave(msg) {
      removeOther(msg.id);
      updateCount();
    },
    state(msg) {
      ballView?.setState(msg.b);
      for (const [id, x, z, ry, a] of msg.ps) {
        const o = others.get(id);
        if (!o) continue;
        o.target.set(x, 0, z);
        o.ry = ry;
        o.a = a;
      }
    },
    chat(msg) {
      hud.addChat(msg);
      if (msg.sys) return;
      if (msg.id === myId) myLabel.say(msg.text);
      else others.get(msg.id)?.label.say(msg.text);
    },
    punch(msg) {
      avatarOf(msg.by)?.punch();
      avatarOf(msg.target)?.hit();
      setHealth(msg.target, msg.hp, msg.ghostLeft);
      if (msg.target === myId && msg.ghostLeft > 0) {
        hud.showToast(`👻 ${nameOf(msg.by)} hạ gục bạn, bạn thành ma!`);
        audio.punch();
      } else if (msg.target === myId) {
        const by = others.get(msg.by);
        if (by) {
          const dir = me.pos.clone().sub(by.avatar.root.position).setY(0);
          if (dir.lengthSq() < 1e-4) dir.set(0, 0, 1);
          me.knock.copy(dir.normalize().multiplyScalar(9));
        }
        hud.showToast(`💥 Bạn bị ${nameOf(msg.by)} đấm!`);
        audio.punch();
      } else if (msg.by === myId) {
        audio.punch();
      }
    },
    revive(msg) {
      setHealth(msg.id, msg.hp, 0);
      if (msg.id === myId) hud.showToast('✨ Bạn đã hồi sinh!');
    },
    kick(msg) {
      if (msg.by === myId) return; // tiếng sút của mình đã phát lúc bấm
      const av = others.get(msg.by)?.avatar;
      av?.punch();
      if (av && Math.hypot(av.root.position.x - me.pos.x, av.root.position.z - me.pos.z) < 14) audio.punch();
    },
    goal(msg) {
      ballView?.setScore(msg.score);
      const g = ballView?.goalPosition(msg.side);
      if (g) {
        confetti.burst(g);
        confetti.burst({ x: g.x * 0.94, z: g.z + 1 });
      }
      hud.showToast(`⚽ VÀOOOO! ${nameOf(msg.by)} ghi bàn!`);
      audio.cheer();
      avatarOf(msg.by)?.celebrate();
    },
    tomato(msg) {
      const from = msg.by === myId ? me.pos : avatarOf(msg.by)?.root.position;
      if (!from) return;
      avatarOf(msg.by)?.punch(); // dùng lại động tác vung tay
      banners.throwTomato(from, msg.club, msg.count, () => audio.splat());
    },
    celebrate(msg) {
      const av = avatarOf(msg.id);
      if (!av) return;
      av.celebrate();
      confetti.burst(av.root.position);
      if (msg.id === myId) audio.cheer();
    },
    polls(msg) {
      applyPolls(msg.polls);
    },
    pollcounts(msg) {
      const p = polls.find((x) => x.matchId === msg.matchId);
      if (!p) return;
      p.counts = msg.counts;
      renderCounts();
    },
    myvote(msg) {
      const p = polls.find((x) => x.matchId === msg.matchId);
      if (!p) return;
      p.mine = msg.v;
      renderCounts();
    },
  });

  // --- Hướng dẫn lần đầu ----------------------------------------------------
  function maybeTutorial() {
    let seen = false;
    try {
      seen = localStorage.getItem(TUTORIAL_KEY) === '1';
      localStorage.setItem(TUTORIAL_KEY, '1');
    } catch {
      // bỏ qua
    }
    if (seen) return;
    const p = el('p', {}, 'Đi tới gần ai đó — khi vòng dưới chân họ chuyển ', el('span', { className: 'hl' }, 'đỏ'), ', nhấn ', el('span', { className: 'kbd' }, 'F'), ' (hoặc ', el('span', { className: 'kbd' }, 'Click'), ' khi đã khoá chuột).');
    hud.card('👊 Đấm anh em trong hang!', p);
  }

  // --- Âm thanh / video -----------------------------------------------------
  let videoMuted = true;
  function toggleVideo() {
    if (videoBlocked) {
      open(`https://www.youtube.com/watch?v=${screen.currentVideoId()}`, '_blank', 'noopener');
      return;
    }
    videoMuted = !videoMuted;
    screen.setVideoMuted(videoMuted);
    setLabel(hud.videoBtn, '📺', videoMuted ? 'Tiếng video' : 'Tắt tiếng video');
    // Nghe tiếng video thì tạm dừng nhạc để khỏi chồng tiếng.
    if (!videoMuted && music.playing) stopMusic();
  }

  // Nhạc CĐV: tự bật ở thao tác đầu tiên (trừ khi người chơi từng tắt), nút để bật/tắt, phím N đổi bài.
  const MUSIC_PREF = 'hanguit.music';
  const readPref = () => {
    try {
      return localStorage.getItem(MUSIC_PREF);
    } catch {
      return null;
    }
  };
  const writePref = (v) => {
    try {
      localStorage.setItem(MUSIC_PREF, v);
    } catch {
      // không lưu được thì thôi
    }
  };
  const music = createFanMusic({
    onSong(song) {
      hud.showToast(`🎵 ${song.title} · ${CLUBS[song.club]?.name ?? ''}`);
    },
  });
  music.setVolume(Number(hud.volume.value));
  function startMusic() {
    music.start();
    setLabel(hud.musicBtn, '🎵', 'Tắt nhạc');
    hud.musicBtn.classList.add('on');
  }
  function stopMusic() {
    music.stop();
    setLabel(hud.musicBtn, '🎵', 'Nhạc CĐV');
    hud.musicBtn.classList.remove('on');
  }
  function toggleMusic() {
    if (music.playing) {
      stopMusic();
      writePref('off');
    } else {
      if (!videoMuted) toggleVideo();
      startMusic();
      writePref('on');
    }
  }
  hud.musicBtn.addEventListener('click', toggleMusic);
  hud.musicNextBtn.addEventListener('click', () => (music.playing ? music.next() : toggleMusic()));
  const onFirstGesture = (e) => {
    removeEventListener('pointerdown', onFirstGesture, true);
    removeEventListener('keydown', onFirstGesture, true);
    if (e?.target === hud.musicBtn || e?.target === hud.musicNextBtn) return; // nút nhạc tự xử lý
    if (readPref() !== 'off' && videoMuted && !music.playing) startMusic();
  };
  // Người chơi thường đã bấm "Vào hang" ở màn chào: trang đã được phép phát tiếng, bật nhạc ngay.
  // Chỉ khi vào thẳng bằng đường dẫn (chưa thao tác gì) mới phải chờ cú bấm/phím đầu tiên trong hang.
  if (navigator.userActivation?.hasBeenActive) onFirstGesture();
  else {
    addEventListener('pointerdown', onFirstGesture, true);
    addEventListener('keydown', onFirstGesture, true);
  }
  function toggleMute() {
    const m = audio.toggleMute();
    hud.muteBtn.textContent = m ? '🔇' : '🔊';
  }
  hud.videoBtn.addEventListener('click', toggleVideo);
  hud.muteBtn.addEventListener('click', toggleMute);
  hud.volume.addEventListener('input', () => {
    audio.unlock();
    audio.setVolume(Number(hud.volume.value));
    music.setVolume(Number(hud.volume.value));
    hud.muteBtn.textContent = audio.muted ? '🔇' : '🔊';
  });

  // --- Chat -----------------------------------------------------------------
  hud.input.addEventListener('keydown', (e) => {
    e.stopPropagation();
    if (e.key === 'Enter') {
      const text = hud.input.value.trim();
      if (text) net.send({ t: 'chat', text });
      hud.input.value = '';
      hud.input.blur();
    } else if (e.key === 'Escape') {
      hud.input.blur();
    }
  });

  // --- Điều khiển -----------------------------------------------------------
  const keys = new Set();
  let camYaw = 0;
  let camPitch = -0.25; // máy quay thấp, ngước lên để thấy trọn màn hình lớn và bảng lịch
  let dragging = false;
  const canvas = renderer.domElement;

  function doPunch() {
    if (me.avatar.ghost) {
      hud.showToast('👻 Ma không đánh được ai');
      return;
    }
    const target = punchTarget();
    // Bóng gần hơn người đứng cạnh thì sút bóng, không đấm.
    const bd = ballDistance();
    const td = target ? Math.hypot(target.avatar.root.position.x - me.pos.x, target.avatar.root.position.z - me.pos.z) : Infinity;
    if (bd <= BALL.kickRange && bd < td) {
      const b = ballView.position;
      const dx = (b.x - me.pos.x) / (bd || 1);
      const dz = (b.z - me.pos.z) / (bd || 1);
      me.ry = Math.atan2(dx, dz);
      me.avatar.punch(); // vung chân… bằng tay, cho có động tác
      ballView.nudge(dx, dz);
      audio.punch();
      net.send({ t: 'kick' });
      return;
    }
    if (!target) return;
    me.ry = Math.atan2(target.avatar.root.position.x - me.pos.x, target.avatar.root.position.z - me.pos.z);
    net.send({ t: 'punch', target: target.id });
  }

  // Khoảng cách tới quả bóng (Infinity nếu tắt bóng hoặc đang là ma).
  function ballDistance() {
    if (!ballView || me.avatar.ghost) return Infinity;
    return Math.hypot(ballView.position.x - me.pos.x, ballView.position.z - me.pos.z);
  }

  function doCelebrate() {
    if (!me.avatar.celebrating) net.send({ t: 'celebrate' });
  }
  hud.celebrate.addEventListener('click', doCelebrate);

  // Ném cà chua vào cờ đội vừa thua mà mình đang quay mặt về (theo hướng máy quay).
  function throwTomato() {
    if (!banners.hasLosers) {
      hud.showToast('Chưa có đội nào vừa thua để ném 😎');
      return;
    }
    const forward = { x: -Math.sin(camYaw), z: -Math.cos(camYaw) };
    const club = banners.pickTarget(me.pos, forward);
    if (!club) {
      hud.showToast('🍅 Quay về Góc cà chua (vách sau chỗ xuất hiện) rồi ném');
      return;
    }
    net.send({ t: 'tomato', club });
  }
  hud.tomatoBtn.addEventListener('click', throwTomato);
  hud.punchTouch.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    audio.unlock();
    doPunch();
  });

  function onKeyDown(e) {
    if (e.target instanceof HTMLInputElement) return;
    audio.unlock();
    const k = e.key.toLowerCase();
    if (k === 'enter') {
      e.preventDefault();
      document.exitPointerLock?.();
      hud.input.focus();
      return;
    }
    if (e.repeat) return;
    keys.add(e.code);
    if (k === 'f') doPunch();
    else if (k === 'g') doCelebrate();
    else if (k === 't') throwTomato();
    else if (k === 'h') hud.toggleHelp();
    else if (k === 'm') toggleMute();
    else if (k === 'v') toggleVideo();
    else if (k >= '1' && k <= '9') vote(Number(k) - 1);
    else if (k === 'n') music.next();
    else if (k === 'q') showPoll(sel - 1);
    else if (k === 'e') showPoll(sel + 1);
    else if (k === 'i') toggleInfo();
  }
  const onKeyUp = (e) => keys.delete(e.code);
  const onBlur = () => keys.clear();

  canvas.addEventListener('pointerdown', (e) => {
    audio.unlock();
    if (document.pointerLockElement === canvas) {
      doPunch();
      return;
    }
    if (e.pointerType === 'mouse') {
      // Có trình duyệt/iframe không cho khoá chuột: khi đó vẫn kéo để xoay được.
      Promise.resolve(canvas.requestPointerLock?.()).catch(() => {});
    }
    dragging = true;
    capture(canvas, e.pointerId);
  });
  canvas.addEventListener('pointerup', () => (dragging = false));
  canvas.addEventListener('pointermove', (e) => {
    if (document.pointerLockElement !== canvas && !dragging) return;
    camYaw -= e.movementX * 0.0035;
    camPitch = THREE.MathUtils.clamp(camPitch + e.movementY * 0.0025, -0.45, 1.1);
  });
  addEventListener('keydown', onKeyDown);
  addEventListener('keyup', onKeyUp);
  addEventListener('blur', onBlur);

  function punchTarget() {
    if (me.avatar.ghost) return null;
    let best = null;
    let bestScore = Infinity;
    const fx = Math.sin(me.ry);
    const fz = Math.cos(me.ry);
    for (const o of others.values()) {
      if (o.avatar.ghost) continue;
      const dx = o.avatar.root.position.x - me.pos.x;
      const dz = o.avatar.root.position.z - me.pos.z;
      const d = Math.hypot(dx, dz);
      if (d > PUNCH_RANGE) continue;
      // Ưu tiên người phía trước mặt, nhưng vẫn cho đấm người đứng sát bên.
      const facing = d > 0 ? (dx * fx + dz * fz) / d : 1;
      const score = d - facing;
      if (score < bestScore) {
        bestScore = score;
        best = o;
      }
    }
    return best;
  }

  // --- Vòng lặp -------------------------------------------------------------
  function resize() {
    const w = stage.clientWidth;
    const h = stage.clientHeight;
    renderer.setSize(w, h);
    labelRenderer.setSize(w, h);
    css3d.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  addEventListener('resize', resize);
  resize();

  const move = new THREE.Vector3();
  const camTarget = new THREE.Vector3();
  let sendAcc = 0;
  let lastSent = '';
  let lastSentAt = 0;
  let last = performance.now();
  let raf = 0;
  let t = 0;

  function frame(now) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    t += dt;

    // Di chuyển theo hướng camera.
    const f = (keys.has('KeyW') || keys.has('ArrowUp') ? 1 : 0) - (keys.has('KeyS') || keys.has('ArrowDown') ? 1 : 0) - hud.joy.y;
    const s = (keys.has('KeyD') || keys.has('ArrowRight') ? 1 : 0) - (keys.has('KeyA') || keys.has('ArrowLeft') ? 1 : 0) + hud.joy.x;
    move.set(0, 0, 0);
    // Cần gạt cho tốc độ theo độ đẩy; vùng chết nhỏ để khỏi trôi.
    const amount = Math.min(1, Math.hypot(f, s));
    if (amount > 0.15) {
      const fwdX = -Math.sin(camYaw);
      const fwdZ = -Math.cos(camYaw);
      move.set(fwdX * f - fwdZ * s, 0, fwdZ * f + fwdX * s).normalize().multiplyScalar(WALK_SPEED * amount * dt);
      const want = Math.atan2(move.x, move.z);
      const diff = Math.atan2(Math.sin(want - me.ry), Math.cos(want - me.ry));
      me.ry += diff * Math.min(1, dt * 12);
    }
    me.moving = move.lengthSq() > 0;
    me.pos.add(move).addScaledVector(me.knock, dt);
    me.knock.multiplyScalar(Math.max(0, 1 - dt * 6));

    const r = Math.hypot(me.pos.x, me.pos.z);
    if (r > CAVE_RADIUS) me.pos.multiplyScalar(CAVE_RADIUS / r);
    if (r < FIRE_RADIUS && r > 0) me.pos.multiplyScalar(FIRE_RADIUS / r);
    // Không đi xuyên ra sau màn hình.
    if (Math.abs(me.pos.x) < SCREEN_HALF_W && me.pos.z < SCREEN_Z + 0.8) me.pos.z = SCREEN_Z + 0.8;

    me.avatar.root.position.x = me.pos.x;
    me.avatar.root.position.z = me.pos.z;
    me.avatar.root.rotation.y = me.ry;
    me.avatar.update(dt, me.moving);

    // Người chơi khác: nội suy về vị trí server gửi.
    const k = 1 - Math.exp(-dt * 12);
    const target = punchTarget();
    for (const o of others.values()) {
      const root = o.avatar.root;
      root.position.x += (o.target.x - root.position.x) * k;
      root.position.z += (o.target.z - root.position.z) * k;
      const diff = Math.atan2(Math.sin(o.ry - root.rotation.y), Math.cos(o.ry - root.rotation.y));
      root.rotation.y += diff * k;
      o.avatar.update(dt, o.a === 1);
      const ring = o.avatar.ring.material;
      ring.color.set(o === target ? '#ff3b30' : '#ffffff');
      ring.opacity = o === target ? 0.9 : 0;
    }
    const canKick = ballDistance() <= BALL.kickRange;
    const hintText = canKick ? '⚽ Nhấn F để sút' : '👊 Nhấn F để đấm';
    if (hud.punchHint.textContent !== hintText) hud.punchHint.textContent = hintText;
    hud.punchHint.classList.toggle('show', (!!target || canKick) && !hud.isTouch && document.pointerLockElement !== canvas);
    hud.punchTouch.classList.toggle('ready', !!target || canKick);
    hud.setGhostCountdown(myGhostUntil ? Math.max(1, Math.ceil((myGhostUntil - now) / 1000)) : 0);

    // Gửi vị trí ~15 lần/giây, chỉ khi có thay đổi.
    sendAcc += dt;
    if (sendAcc >= SEND_INTERVAL && myId) {
      sendAcc = 0;
      const payload = { t: 'move', x: +me.pos.x.toFixed(2), z: +me.pos.z.toFixed(2), ry: +me.ry.toFixed(2), a: me.moving ? 1 : 0 };
      const key = `${payload.x},${payload.z},${payload.ry},${payload.a}`;
      // Đứng yên vẫn gửi lại mỗi 30 giây: host miễn phí (Render) tắt server nếu 15 phút không nhận gì.
      if (key !== lastSent || now - lastSentAt > 30000) {
        lastSent = key;
        lastSentAt = now;
        net.send(payload);
      }
    }

    // Camera góc ba, kẹp trong lòng hang.
    // Màn dọc hẹp: lùi máy quay để nhân vật không che màn hình lớn.
    const dist = camera.aspect < 1 ? 8.5 : 6.5;
    camTarget.set(me.pos.x, 2.8, me.pos.z);
    camera.position.set(
      me.pos.x + Math.sin(camYaw) * Math.cos(camPitch) * dist,
      1.6 + Math.sin(camPitch) * dist,
      me.pos.z + Math.cos(camYaw) * Math.cos(camPitch) * dist,
    );
    const cr = Math.hypot(camera.position.x, camera.position.z);
    if (cr > 24) {
      camera.position.x *= 24 / cr;
      camera.position.z *= 24 / cr;
    }
    camera.position.y = Math.max(0.6, camera.position.y);
    camera.lookAt(camTarget);

    fire.update(dt);
    torches.forEach((tc) => tc.update(t));
    gallery.update(dt);
    banners.update(dt);
    ballView?.update(dt);
    confetti.update(dt);

    renderer.render(scene, camera);
    labelRenderer.render(scene, camera);
    css3d.render(css3dScene, camera);
  }
  raf = requestAnimationFrame(frame);

  return () => {
    cancelAnimationFrame(raf);
    clearInterval(fixtureTimer);
    banners.dispose();
    screen.dispose();
    music.dispose();
    removeEventListener('pointerdown', onFirstGesture, true);
    removeEventListener('keydown', onFirstGesture, true);
    net.close();
    audio.close();
    document.exitPointerLock?.();
    removeEventListener('keydown', onKeyDown);
    removeEventListener('keyup', onKeyUp);
    removeEventListener('blur', onBlur);
    removeEventListener('resize', resize);
    for (const id of [...others.keys()]) removeOther(id);
    renderer.dispose();
    scene.traverse((o) => {
      if (o.isMesh || o.isPoints) {
        o.geometry.dispose();
        [].concat(o.material).forEach((m) => {
          m.map?.dispose();
          m.dispose();
        });
      }
    });
    app.replaceChildren();
  };
}

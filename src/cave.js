import * as THREE from 'three';
import { CSS2DObject, CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';
import { CSS3DObject, CSS3DRenderer } from 'three/addons/renderers/CSS3DRenderer.js';
import { BRAND, FIXTURE_TEAMS, LEGENDS, POLL, SCOREBOARD } from './config.js';
import { createAvatar } from './avatar.js';
import { createAudio } from './audio.js';
import { connect } from './net.js';
import { createCampfire, createTorch, rng, rockGeometry, rockMaterial, textCanvas } from './scenery.js';
import { el } from './util.js';

const CAVE_RADIUS = 21;
const FIRE_RADIUS = 1.4;
const WALK_SPEED = 5;
const PUNCH_RANGE = 2.2;
const MAX_HP = 5; // khớp với server/index.js
const SEND_INTERVAL = 1 / 15;
const SCREEN_Z = -17;
const SCREEN_HALF_W = 9.6; // nửa bề ngang khung màn hình, để chặn người chơi đi xuyên
const DOME_R = 27;
const DOME_SY = 0.95; // vòm cao để chứa màn hình lớn và bảng lịch thi đấu
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

  const slots = LEGENDS.length;
  // Chân dung xếp thành cung hai bên màn hình (bỏ trống phía màn hình và phía sau).
  for (let i = 0; i < slots; i++) {
    const side = i % 2 ? 1 : -1;
    const idx = Math.floor(i / 2);
    const a = -Math.PI / 2 + side * (0.62 + idx * 0.28);
    addPoster(scene, LEGENDS[i], a, wallR);
  }
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2 + 0.31;
    const torch = createTorch();
    torch.group.position.set(Math.cos(a) * (wallR + 0.4), 3.2, Math.sin(a) * (wallR + 0.4));
    torch.group.lookAt(0, 3.2, 0);
    scene.add(torch.group);
    torches.push(torch);

    const banner = new THREE.Mesh(new THREE.PlaneGeometry(1, 2), bannerMat);
    const b = a + 0.31;
    banner.position.set(Math.cos(b) * (wallR + 0.6), 5.2, Math.sin(b) * (wallR + 0.6));
    banner.lookAt(0, 5.2, 0);
    scene.add(banner);
  }

  return { fire, torches };
}

function addPoster(scene, legend, angle, r) {
  const tex = textCanvas(256, 340, (g, w, h) => {
    g.fillStyle = '#20160f';
    g.fillRect(0, 0, w, h);
    const grad = g.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, BRAND.jersey.body);
    grad.addColorStop(1, '#0d1a44');
    g.fillStyle = grad;
    g.fillRect(12, 12, w - 24, h - 70);
    // Bóng người
    g.fillStyle = 'rgba(255,255,255,0.18)';
    g.beginPath();
    g.arc(w / 2, 110, 46, 0, Math.PI * 2);
    g.fill();
    g.fillRect(w / 2 - 70, 165, 140, 110);
    g.fillStyle = '#f5efe6';
    g.font = '700 22px Bitter, Georgia, serif';
    g.textAlign = 'center';
    g.fillText(legend.name, w / 2, h - 28);
  });
  const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.7 });
  if (legend.img) {
    new THREE.TextureLoader().load(legend.img, (img) => {
      img.colorSpace = THREE.SRGBColorSpace;
      mat.map = img;
      mat.needsUpdate = true;
    });
  }
  const poster = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 2.1), mat);
  const frame = new THREE.Mesh(new THREE.BoxGeometry(1.8, 2.3, 0.08), new THREE.MeshStandardMaterial({ color: '#3a2618' }));
  frame.position.z = -0.05;
  poster.add(frame);
  poster.position.set(Math.cos(angle) * r, 3.4, Math.sin(angle) * r);
  poster.lookAt(0, 3.4, 0);
  scene.add(poster);
}

function buildScreen(scene, css3dScene, { onVideoError } = {}) {
  const group = new THREE.Group();
  group.position.set(0, 0, SCREEN_Z);
  scene.add(group);

  // Bố cục từ dưới lên: video 16:9, dải chữ, bảng lịch thi đấu.
  const VIDEO_W = 17.6;
  const VIDEO_H = (VIDEO_W * 9) / 16;
  const videoY = 1.6 + VIDEO_H / 2;
  const noteY = videoY + VIDEO_H / 2 + 0.45;
  const BOARD_H = 4.6;
  const boardY = noteY + 0.5 + BOARD_H / 2;

  const frameH = boardY + BOARD_H / 2 + 0.3 - 1.1;
  const frame = new THREE.Mesh(
    new THREE.BoxGeometry(SCREEN_HALF_W * 2 - 0.4, frameH, 0.4),
    new THREE.MeshStandardMaterial({ color: '#1b1210', roughness: 0.6 }),
  );
  frame.position.set(0, 1.1 + frameH / 2, -0.3);
  group.add(frame);

  const boardTex = textCanvas(2048, 536, (g, w, h) => drawFixtures(g, w, h, null));
  const board = new THREE.Mesh(
    new THREE.PlaneGeometry(VIDEO_W, BOARD_H),
    new THREE.MeshBasicMaterial({ map: boardTex, fog: false }),
  );
  board.position.set(0, boardY, 0);
  group.add(board);

  const noteTex = textCanvas(768, 96, (g, w, h) => {
    g.fillStyle = BRAND.jersey.body;
    g.fillRect(0, 0, w, h);
    g.strokeStyle = BRAND.jersey.trim;
    g.lineWidth = 6;
    g.strokeRect(3, 3, w - 6, h - 6);
    g.fillStyle = '#fff';
    g.font = '700 46px "Be Vietnam Pro", sans-serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(SCOREBOARD.note, w / 2, h / 2 + 2);
  });
  const note = new THREE.Mesh(new THREE.PlaneGeometry(6.4, 0.8), new THREE.MeshBasicMaterial({ map: noteTex, fog: false }));
  note.position.set(0, noteY, 0.05);
  group.add(note);

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
    async setFixtures(matches) {
      // Font chỉ dùng trên canvas chưa được trình duyệt tải (kể cả bộ chữ tiếng Việt): tải trước rồi mới vẽ.
      await Promise.all(
        ['800 58px Bitter', '700 42px "Be Vietnam Pro"', '600 34px "Be Vietnam Pro"', '500 34px "Be Vietnam Pro"'].map((f) =>
          document.fonts.load(f, 'LỊCH THI ĐẤU Việt').catch(() => {}),
        ),
      );
      const canvas = boardTex.image;
      drawFixtures(canvas.getContext('2d'), canvas.width, canvas.height, matches);
      boardTex.needsUpdate = true;
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

function shortLeague(name) {
  const map = { 'Premier League': 'NHA', 'UEFA Champions League': 'C1', 'UEFA Europa League': 'C2', 'Carabao Cup': 'League Cup', 'FA Cup': 'FA Cup' };
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

function buildHud(app, { onLeave }) {
  const kbd = (k) => el('span', { className: 'kbd' }, k);

  const leave = el('button', { className: 'pill', type: 'button' }, 'Ra hang');
  const volume = el('input', { type: 'range', min: 0, max: 1, step: 0.05, value: 0.6, 'aria-label': 'Âm lượng' });
  const muteBtn = el('button', { className: 'pill', type: 'button', style: 'padding:6px 8px' }, '🔊');
  const videoBtn = el('button', { className: 'pill', type: 'button' }, '📺 Tiếng video');
  const myHp = el('div', { className: 'pill my-hp', 'aria-label': 'Máu của bạn' });
  const top = el('div', { className: 'hud-top' }, leave, myHp, el('div', { className: 'pill vol' }, muteBtn, volume), videoBtn);
  const ghostBanner = el('div', { className: 'ghost-banner' });

  const count = el('span', {}, '…');
  const roomInfo = el('div', { className: 'room-info' }, el('b', {}, BRAND.roomName), count);

  const log = el('div', { className: 'chat-log', role: 'log' });
  const input = el('input', { placeholder: 'Nhấn Enter để nhắn tin…', maxLength: 200 });
  const hideChat = el('button', { className: 'pill', type: 'button' }, 'Ẩn');
  const chat = el('div', { className: 'chat' }, el('div', { className: 'chat-head' }, el('span', {}, 'Chat trong hang'), hideChat), log, input);
  hideChat.addEventListener('click', () => {
    chat.classList.toggle('collapsed');
    hideChat.textContent = chat.classList.contains('collapsed') ? 'Hiện' : 'Ẩn';
  });

  // Bình chọn: câu hỏi và nút do server gửi (trận sắp đá gần nhất), dựng lại khi đổi trận.
  const pollQ = el('div', { className: 'poll-q' });
  const pollMeta = el('div', { className: 'poll-meta' });
  const pollOpts = el('div', { className: 'poll-opts' });
  const poll = el('div', { className: 'poll' }, pollQ, pollMeta, pollOpts);
  let pollBtns = [];
  let onVote = () => {};
  function setPoll(p) {
    pollQ.textContent = `🗳️ ${p.question}`;
    pollMeta.textContent = p.kickoff ? `${formatKickoff(p.kickoff)} · ${shortLeague(p.league)}` : '';
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

  const celebrate = el('button', { className: 'btn-celebrate', type: 'button' }, '🎉 Ăn mừng', kbd('G'));
  const keysBtn = el('button', { className: 'pill btn-keys', type: 'button' }, 'Phím (H)');
  const hint = el('div', { className: 'hint-bottom' }, 'Bấm vào cảnh để xoay bằng chuột');
  const toast = el('div', { className: 'toast' });
  const punchHint = el('div', { className: 'punch-btn' }, '👊 Nhấn F để đấm');

  // Điều khiển cảm ứng: cần gạt bên trái, nút đấm bên phải.
  const knob = el('div', { className: 'joy-knob' });
  const joystick = el('div', { className: 'joystick', 'aria-label': 'Cần gạt di chuyển' }, knob);
  const punchTouch = el('button', { className: 'btn-punch', type: 'button', 'aria-label': 'Đấm' }, '👊');

  const isTouch = matchMedia('(pointer: coarse)').matches;
  const hud = el('div', { className: `hud${isTouch ? ' touch' : ''}` }, top, roomInfo, chat, poll, celebrate, keysBtn, hint, toast, punchHint, joystick, punchTouch, ghostBanner);
  app.append(hud);
  if (isTouch) {
    chat.classList.add('collapsed');
    hideChat.textContent = 'Hiện';
    hint.textContent = 'Vuốt màn hình để xoay góc nhìn';
  }

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
      [['F', 'Click'], 'Đấm người trong vòng đỏ trước mặt'],
      [['G'], 'Ăn mừng'],
      [['Enter'], 'Chat'],
      [['1', '2', '3'], 'Bình chọn'],
      [['M'], 'Tắt / bật tiếng'],
      [['V'], 'Tắt / bật tiếng video bảng tin'],
      [['H'], 'Mở / đóng bảng này'],
    ];
    const grid = el('div', { className: 'keys-grid' });
    for (const [keys, desc] of rows) grid.append(el('div', {}, ...keys.map(kbd)), el('div', {}, desc));
    helpCard = card('Cách điều khiển', grid, { closeLabel: 'Đã hiểu' });
  }
  keysBtn.addEventListener('click', toggleHelp);

  return {
    hud, input, log, volume, muteBtn, videoBtn, celebrate, punchHint, punchTouch, joy, isTouch,
    get pollBtns() {
      return pollBtns;
    },
    setPoll,
    set onVote(fn) {
      onVote = fn;
    },
    setCount: (n) => (count.textContent = `${n} anh em trong hang`),
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
  const { fire, torches } = buildCave(scene);
  let videoBlocked = false;
  const screen = buildScreen(scene, css3dScene, {
    onVideoError() {
      videoBlocked = true;
      hud.videoBtn.textContent = '▶ Xem video trên YouTube';
    },
  });
  async function refreshFixtures() {
    try {
      const j = await fetch('/api/fixtures').then((r) => r.json());
      screen.setFixtures(j.matches ?? []);
    } catch {
      screen.setFixtures([]);
    }
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
    avatar: createAvatar(profile.number),
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
    const avatar = createAvatar(p.number);
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
  let myVote = null;
  let pollMatchId = null;
  let pollSize = POLL.options.length;
  function renderPoll(counts) {
    hud.pollBtns.forEach((b, i) => {
      b.countEl.textContent = counts[i] ?? 0;
      b.classList.toggle('mine', myVote === i);
    });
  }
  let lastCounts = POLL.options.map(() => 0);
  function applyPoll(p) {
    pollMatchId = p.matchId;
    pollSize = p.options.length;
    myVote = p.mine;
    lastCounts = p.counts;
    hud.setPoll(p);
    renderPoll(lastCounts);
  }
  hud.onVote = vote;
  function vote(i) {
    if (i >= pollSize) return;
    net.send({ t: 'vote', v: i, matchId: pollMatchId });
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
      applyPoll(msg.poll);
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
    celebrate(msg) {
      const av = avatarOf(msg.id);
      if (!av) return;
      av.celebrate();
      confetti.burst(av.root.position);
      if (msg.id === myId) audio.cheer();
    },
    poll(msg) {
      applyPoll(msg);
    },
    pollcounts(msg) {
      if (msg.matchId !== pollMatchId) return;
      lastCounts = msg.counts;
      renderPoll(lastCounts);
    },
    myvote(msg) {
      if (msg.matchId !== pollMatchId) return;
      myVote = msg.v;
      renderPoll(lastCounts);
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
    hud.videoBtn.textContent = videoMuted ? '📺 Tiếng video' : '📺 Tắt tiếng video';
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
    if (!target) return;
    me.ry = Math.atan2(target.avatar.root.position.x - me.pos.x, target.avatar.root.position.z - me.pos.z);
    net.send({ t: 'punch', target: target.id });
  }

  function doCelebrate() {
    if (!me.avatar.celebrating) net.send({ t: 'celebrate' });
  }
  hud.celebrate.addEventListener('click', doCelebrate);
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
    else if (k === 'h') hud.toggleHelp();
    else if (k === 'm') toggleMute();
    else if (k === 'v') toggleVideo();
    else if (k >= '1' && k <= '9') vote(Number(k) - 1);
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
    hud.punchHint.classList.toggle('show', !!target && !hud.isTouch && document.pointerLockElement !== canvas);
    hud.punchTouch.classList.toggle('ready', !!target);
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
    const dist = 6.5;
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
    confetti.update(dt);

    renderer.render(scene, camera);
    labelRenderer.render(scene, camera);
    css3d.render(css3dScene, camera);
  }
  raf = requestAnimationFrame(frame);

  return () => {
    cancelAnimationFrame(raf);
    clearInterval(fixtureTimer);
    screen.dispose();
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

import * as THREE from 'three';
import { BRAND, CLUB_ORDER, CLUBS, QUIZ } from './config.js';
import { createHangingJersey, drawJerseyIcon } from './avatar.js';
import { rockGeometry, rockMaterial, rng, textCanvas } from './scenery.js';
import { el, loadProfile, saveProfile } from './util.js';

function buildScene(scene) {
  scene.background = new THREE.Color('#e9e0d0');
  scene.fog = new THREE.Fog('#e9e0d0', 18, 40);

  scene.add(new THREE.HemisphereLight('#fff6e6', '#9c8a72', 1.6));
  const sun = new THREE.DirectionalLight('#fff1dc', 2.2);
  sun.position.set(6, 12, 8);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, { left: -14, right: 14, top: 14, bottom: -6 });
  scene.add(sun);

  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(60, 48),
    new THREE.MeshStandardMaterial({ color: '#ddd2bf', roughness: 1 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  // Vòm cửa hang: đá xếp theo hình chữ U ngược quanh lỗ tối.
  const rand = rng(7);
  const mat = rockMaterial('#d6c9b2');
  const rocks = new THREE.Group();
  const arch = [];
  for (let i = 0; i <= 18; i++) {
    const a = Math.PI * (i / 18);
    arch.push([Math.cos(a) * 4.7, Math.sin(a) * 4.6]);
  }
  arch.forEach(([x, y], i) => {
    const r = 1.0 + rand() * 0.45;
    const m = new THREE.Mesh(rockGeometry(r, 100 + i, 1, 0.25), mat);
    m.position.set(x * 1.1, y, -0.6 + rand() * 0.5);
    m.rotation.set(rand() * 3, rand() * 3, rand() * 3);
    m.castShadow = m.receiveShadow = true;
    rocks.add(m);
  });
  // Khối núi đá phía sau và hai bên.
  for (let i = 0; i < 26; i++) {
    const r = 2.5 + rand() * 3.5;
    const m = new THREE.Mesh(rockGeometry(r, 300 + i, 1, 0.32), mat);
    const side = i % 2 ? 1 : -1;
    const spread = 4 + rand() * 12;
    m.position.set(side * spread, rand() * 5 + (i < 8 ? 4 : 0), -4 - rand() * 6);
    if (i < 6) {
      m.position.x = (rand() - 0.5) * 8;
      m.position.y = 6 + rand() * 4;
    }
    // Không cho đá chọc vào lòng hang (ống bán kính 3.4 dọc trục z).
    const reach = r * 1.35 + 3.6;
    const dist = Math.hypot(m.position.x, m.position.y);
    if (dist < reach) {
      const k = reach / Math.max(dist, 0.1);
      m.position.x *= k;
      m.position.y *= k;
    }
    m.rotation.set(rand() * 3, rand() * 3, rand() * 3);
    m.castShadow = m.receiveShadow = true;
    rocks.add(m);
  }
  scene.add(rocks);

  // Lòng hang tối, có ánh lửa hắt ra.
  const tunnel = new THREE.Mesh(
    new THREE.CylinderGeometry(3.4, 3.4, 8, 24, 1, true, Math.PI / 2, Math.PI),
    new THREE.MeshStandardMaterial({ color: '#2a1610', side: THREE.BackSide, roughness: 1, flatShading: true, fog: false }),
  );
  tunnel.rotation.x = Math.PI / 2;
  tunnel.rotation.z = Math.PI;
  tunnel.position.set(0, 0, -4);
  scene.add(tunnel);
  const back = new THREE.Mesh(new THREE.CircleGeometry(3.3, 24), new THREE.MeshBasicMaterial({ color: '#0d0504', fog: false }));
  back.position.set(0, 0, -7.6);
  scene.add(back);
  const glow = new THREE.PointLight('#ff4a1f', 14, 9, 1.8);
  glow.position.set(0, 0.8, -6.5);
  scene.add(glow);

  // Biển "Di tích lịch sử" bên trái.
  const signTex = textCanvas(768, 512, (g, w, h) => {
    g.fillStyle = '#efe6d6';
    g.fillRect(0, 0, w, h);
    g.fillStyle = BRAND.jersey.body;
    g.beginPath();
    g.arc(w / 2, 150, 82, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = BRAND.jersey.trim;
    g.lineWidth = 10;
    g.stroke();
    g.fillStyle = BRAND.jersey.trim;
    g.font = '800 70px Bitter, Georgia, serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(BRAND.badge, w / 2, 155);
    g.fillStyle = '#5b5148';
    g.font = '700 34px Bitter, Georgia, serif';
    g.fillText(BRAND.signTop, w / 2, 292);
    g.fillStyle = '#3d342c';
    g.font = '800 92px Bitter, Georgia, serif';
    g.fillText(BRAND.signMain, w / 2, 380);
  });
  const slab = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 0.3, 40), rockMaterial('#cfc2ab'));
  slab.scale.set(2.3, 1, 1.55);
  slab.rotation.x = Math.PI / 2;
  slab.position.set(-4.8, 1.9, 2.4);
  slab.castShadow = true;
  scene.add(slab);
  const face = new THREE.Mesh(new THREE.CircleGeometry(1, 40), new THREE.MeshStandardMaterial({ map: signTex, roughness: 0.9 }));
  face.scale.set(2.15, 1.42, 1);
  face.position.set(-4.8, 1.9, 2.56);
  scene.add(face);
  const base = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.5, 1.2), rockMaterial('#c4b79f'));
  base.position.set(-4.8, 0.25, 2.4);
  base.castShadow = base.receiveShadow = true;
  scene.add(base);

  // Áo đấu treo trên giá gỗ bên phải.
  const wood = new THREE.MeshStandardMaterial({ color: '#6b4a30', roughness: 0.9 });
  const post = new THREE.Mesh(new THREE.BoxGeometry(0.16, 3.6, 0.16), wood);
  post.position.set(5.6, 1.8, 1.8);
  const bar = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.12, 0.12), wood);
  bar.position.set(5.6, 3.45, 1.8);
  post.castShadow = bar.castShadow = true;
  scene.add(post, bar);
  const jersey = createHangingJersey();
  jersey.position.set(5.6, 2.15, 1.95);
  jersey.scale.setScalar(1.25);
  scene.add(jersey);

  return { jersey };
}

function nameDialog(root, onSubmit) {
  const saved = loadProfile();
  const icon = el('canvas', { width: 80, height: 80, style: 'width:40px;height:40px' });
  const name = el('input', { maxLength: 30, placeholder: '', autocomplete: 'off', value: saved.name || '' });
  const num = el('input', { className: 'num-input', inputMode: 'numeric', maxLength: 2, placeholder: '7', value: saved.number ?? '' });
  const counter = el('div', { className: 'counter' });
  const submit = el('button', { className: 'btn btn-primary', type: 'submit' }, 'Vào hang');
  const cancel = el('button', { className: 'btn btn-ghost', type: 'button' }, 'Huỷ');

  function refresh() {
    counter.textContent = `${name.value.length}/30 ký tự`;
    submit.disabled = !name.value.trim();
    num.value = num.value.replace(/\D/g, '');
    drawJerseyIcon(icon, parseNum(num.value), club);
  }
  name.addEventListener('input', refresh);
  num.addEventListener('input', refresh);

  // Chọn CLB cổ vũ: quyết định màu áo nhân vật trong hang. Bỏ trống = áo Hang Chung.
  let club = CLUBS[saved.club] ? saved.club : '';
  const clubBtns = [['', 'Không chọn'], ...CLUB_ORDER.map((k) => [k, CLUBS[k].name])].map(([key, label]) => {
    const dot = el('canvas', { width: 40, height: 40, className: 'club-kit' });
    drawJerseyIcon(dot, null, key);
    const b = el('button', { type: 'button', className: 'club-chip' }, dot, el('span', {}, label));
    b.addEventListener('click', () => {
      club = key;
      clubBtns.forEach((x) => x.classList.toggle('active', x === b));
      refresh();
    });
    if (key === club) b.classList.add('active');
    return b;
  });

  const form = el(
    'form',
    { className: 'modal' },
    el('h2', {}, 'Anh em gọi bạn là gì?'),
    el('label', {}, 'Tên hiện trên đầu nhân vật'),
    name,
    counter,
    el('label', { style: 'margin-top:8px' }, 'Bạn là fan CLB nào?'),
    el('div', { className: 'club-picker' }, ...clubBtns),
    el(
      'div',
      { className: 'row' },
      el('div', { className: 'grow' }, el('label', { style: 'margin:0' }, 'Số áo sau lưng'), el('div', { className: 'hint' }, '1–99, để trống = áo trơn')),
      icon,
      num,
    ),
    el('div', { className: 'actions' }, cancel, submit),
  );
  const backdrop = el('div', { className: 'modal-backdrop' }, form);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!name.value.trim()) return;
    const profile = { name: name.value.trim().slice(0, 30), number: parseNum(num.value), club };
    saveProfile(profile);
    backdrop.remove();
    onSubmit(profile);
  });
  cancel.addEventListener('click', () => backdrop.remove());
  backdrop.addEventListener('pointerdown', (e) => e.target === backdrop && backdrop.remove());

  root.append(backdrop);
  refresh();
  name.focus();
}

function parseNum(v) {
  const n = Number.parseInt(v, 10);
  return n >= 1 && n <= 99 ? n : null;
}

function quizDialog(root, onPass) {
  const item = QUIZ[Math.floor(Math.random() * QUIZ.length)];
  const msg = el('div');
  const go = el('button', { className: 'btn btn-primary', type: 'button', style: 'display:none' }, 'Vào hang');
  const cancel = el('button', { className: 'btn btn-ghost', type: 'button' }, 'Huỷ');
  const opts = item.options.map((text, i) => {
    const b = el('button', { className: 'quiz-opt', type: 'button' }, text);
    b.addEventListener('click', () => {
      opts.forEach((o) => o.classList.remove('wrong'));
      if (i === item.answer) {
        b.classList.add('right');
        opts.forEach((o) => (o.disabled = true));
        msg.className = 'quiz-msg right';
        msg.textContent = 'Chuẩn anh em trong hang! Mời vào.';
        cancel.style.display = 'none';
        go.style.display = '';
        go.focus();
      } else {
        b.classList.add('wrong');
        msg.className = 'quiz-msg wrong';
        msg.textContent = 'Chưa đúng rồi, thử lại nhé.';
      }
    });
    return b;
  });
  const modal = el(
    'div',
    { className: 'modal' },
    el('div', { className: 'eyebrow' }, 'Câu hỏi vui trước khi vào hang'),
    el('h2', {}, item.q),
    ...opts,
    msg,
    el('div', { className: 'actions' }, cancel, go),
  );
  const backdrop = el('div', { className: 'modal-backdrop' }, modal);
  cancel.addEventListener('click', () => backdrop.remove());
  go.addEventListener('click', () => {
    backdrop.remove();
    onPass();
  });
  root.append(backdrop);
}

export function mountLanding(app, { onEnter }) {
  const stage = el('div', { className: 'stage' });
  const online = el('b', {}, '…');
  const enterBtn = el('button', { className: 'btn btn-primary', type: 'button' }, 'Vào hang');
  const panel = el(
    'section',
    { className: 'landing-panel' },
    el('h1', {}, `Di tích lịch sử ${BRAND.name}`),
    el('p', {}, BRAND.tagline),
    el('div', { className: 'online' }, 'Trong hang: ', online, ' anh em'),
    enterBtn,
  );
  const foot = el('div', { className: 'landing-foot' }, BRAND.disclaimer);
  app.append(stage, panel, foot);

  enterBtn.addEventListener('click', () => nameDialog(app, (profile) => quizDialog(app, () => onEnter(profile))));

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  stage.append(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  const { jersey } = buildScene(scene);

  function resize() {
    const w = stage.clientWidth;
    const h = stage.clientHeight;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    // Lùi camera đủ xa để bề ngang luôn thấy biển (trái) và áo (phải), ~±7.5 đơn vị.
    const halfTan = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    camera.position.z = Math.max(16, 7.5 / (halfTan * camera.aspect));
    scene.fog.near = camera.position.z + 2;
    scene.fog.far = camera.position.z + 24;
    camera.updateProjectionMatrix();
  }
  addEventListener('resize', resize);
  resize();

  const mouse = { x: 0, y: 0 };
  const onMove = (e) => {
    mouse.x = (e.clientX / innerWidth) * 2 - 1;
    mouse.y = (e.clientY / innerHeight) * 2 - 1;
  };
  addEventListener('pointermove', onMove);

  let raf = 0;
  function frame(ts) {
    raf = requestAnimationFrame(frame);
    const t = ts / 1000;
    camera.position.x += (mouse.x * 1.2 - camera.position.x) * 0.04;
    camera.position.y = 2.6 + Math.sin(t * 0.4) * 0.15 - mouse.y * 0.4;
    camera.lookAt(0, 2.4, 0);
    jersey.rotation.z = Math.sin(t * 1.3) * 0.04;
    jersey.rotation.y = Math.sin(t * 0.9) * 0.08;
    renderer.render(scene, camera);
  }
  raf = requestAnimationFrame(frame);

  async function poll() {
    try {
      const r = await fetch('/api/stats');
      const j = await r.json();
      online.textContent = j.online;
    } catch {
      online.textContent = '0';
    }
  }
  poll();
  const pollTimer = setInterval(poll, 10000);

  return () => {
    cancelAnimationFrame(raf);
    clearInterval(pollTimer);
    removeEventListener('resize', resize);
    removeEventListener('pointermove', onMove);
    renderer.dispose();
    scene.traverse((o) => {
      if (o.isMesh) {
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

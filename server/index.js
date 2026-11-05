import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { WebSocketServer } from 'ws';
import { FIXTURE_TEAMS, POLL } from '../src/config.js';

// Khi dev, Vite chiếm PORT (nếu có) nên server luôn ở 8787 để khớp proxy trong vite.config.js.
const PORT = process.argv.includes('--dev') ? 8787 : Number(process.env.PORT) || 8787;
const DIST = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../dist');
const TICK_MS = 66; // ~15 lần/giây
const CAVE_RADIUS = 21;
const PUNCH_RANGE = 2.4;
const PUNCH_COOLDOWN_MS = 700;
const CHAT_COOLDOWN_MS = 800;
const CHAT_HISTORY = 30;
const MAX_HP = 5;
const GHOST_MS = 30000; // làm ma 30 giây rồi hồi sinh đầy máu

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.woff2': 'font/woff2',
  '.json': 'application/json',
};

/** @type {Map<number, any>} */
const players = new Map();
const chatLog = [];
const votes = new Map(); // playerId -> option index
let nextId = 1;

function json(res, code, body) {
  res.writeHead(code, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(body));
}

function serveStatic(req, res) {
  const urlPath = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  let file = path.join(DIST, urlPath);
  if (!file.startsWith(DIST)) return json(res, 403, { error: 'forbidden' });
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(DIST, 'index.html');
  if (!fs.existsSync(file)) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end('Chưa build client. Chạy "npm run build" hoặc dùng "npm run dev".');
  }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
}

// --- Lịch thi đấu (ESPN), cache 30 phút; lỗi mạng thì giữ dữ liệu cũ ---------
const FIXTURE_TTL_MS = 30 * 60 * 1000;
const FIXTURE_LIMIT = 10;
let fixtureCache = { at: 0, matches: [] };
let fixtureLoading = null;

async function fetchTeamFixtures(espnId) {
  const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/all/teams/${espnId}/schedule?fixture=true`;
  const r = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!r.ok) throw new Error(`ESPN ${espnId}: ${r.status}`);
  const j = await r.json();
  return (j.events ?? []).map((e) => {
    const c = e.competitions?.[0];
    const side = (h) => c?.competitors?.find((t) => t.homeAway === h)?.team ?? {};
    return {
      id: e.id,
      date: e.date,
      state: c?.status?.type?.state,
      league: e.league?.abbreviation ?? e.league?.name ?? '',
      home: side('home').shortDisplayName ?? '?',
      away: side('away').shortDisplayName ?? '?',
    };
  });
}

async function loadFixtures() {
  if (Date.now() - fixtureCache.at < FIXTURE_TTL_MS) return fixtureCache.matches;
  fixtureLoading ??= (async () => {
    try {
      const lists = await Promise.allSettled(FIXTURE_TEAMS.map((t) => fetchTeamFixtures(t.espnId)));
      const byId = new Map();
      for (const l of lists) if (l.status === 'fulfilled') for (const m of l.value) byId.set(m.id, m);
      const now = Date.now();
      const matches = [...byId.values()]
        .filter((m) => m.state === 'pre' && Date.parse(m.date) > now)
        .sort((a, b) => Date.parse(a.date) - Date.parse(b.date))
        .slice(0, FIXTURE_LIMIT);
      if (matches.length) fixtureCache = { at: Date.now(), matches };
    } catch (err) {
      console.warn('fixtures:', err.message);
    } finally {
      fixtureLoading = null;
    }
    return fixtureCache.matches;
  })();
  return fixtureLoading;
}

const server = http.createServer(async (req, res) => {
  if (req.url.startsWith('/api/stats')) return json(res, 200, { online: players.size });
  if (req.url.startsWith('/api/fixtures')) return json(res, 200, { matches: await loadFixtures() });
  serveStatic(req, res);
});

const wss = new WebSocketServer({ server, path: '/ws' });

function send(ws, msg) {
  if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(msg));
}

function broadcast(msg, exceptId) {
  const data = JSON.stringify(msg);
  for (const p of players.values()) {
    if (p.id !== exceptId && p.ws.readyState === p.ws.OPEN) p.ws.send(data);
  }
}

function pushChat(entry) {
  chatLog.push(entry);
  if (chatLog.length > CHAT_HISTORY) chatLog.shift();
  broadcast({ t: 'chat', ...entry });
}

function pollCounts() {
  const counts = POLL.options.map(() => 0);
  for (const v of votes.values()) counts[v]++;
  return counts;
}

function cleanName(raw) {
  const name = String(raw ?? '').replace(/\s+/g, ' ').trim().slice(0, 30);
  return name || 'Ẩn danh';
}

function cleanNumber(raw) {
  const n = Number.parseInt(raw, 10);
  return n >= 1 && n <= 99 ? n : null;
}

function publicInfo(p) {
  return { id: p.id, name: p.name, number: p.number, x: p.x, z: p.z, ry: p.ry, a: p.a, hp: p.hp, ghostLeft: ghostLeft(p) };
}

// Gửi số ms còn lại thay vì mốc giờ server để khỏi lệch đồng hồ máy người chơi.
function ghostLeft(p) {
  return p.ghostUntil ? Math.max(0, p.ghostUntil - Date.now()) : 0;
}

function spawnPoint() {
  const angle = Math.random() * Math.PI * 2;
  const r = 9 + Math.random() * 4;
  return { x: Math.cos(angle) * r, z: Math.sin(angle) * r };
}

wss.on('connection', (ws) => {
  let me = null;

  ws.on('message', (raw) => {
    let msg;
    try {
      msg = JSON.parse(raw);
    } catch {
      return;
    }

    if (!me) {
      if (msg.t !== 'join') return;
      const spawn = spawnPoint();
      me = {
        id: nextId++,
        ws,
        name: cleanName(msg.name),
        number: cleanNumber(msg.number),
        x: spawn.x,
        z: spawn.z,
        ry: 0,
        a: 0,
        hp: MAX_HP,
        ghostUntil: 0,
        lastPunch: 0,
        lastChat: 0,
      };
      players.set(me.id, me);
      send(ws, {
        t: 'welcome',
        id: me.id,
        players: [...players.values()].map(publicInfo),
        chat: chatLog,
        poll: { counts: pollCounts(), mine: null },
      });
      broadcast({ t: 'join', p: publicInfo(me) }, me.id);
      pushChat({ sys: true, text: `${me.name} vừa vào hang` });
      return;
    }

    const now = Date.now();
    switch (msg.t) {
      case 'move': {
        const x = Number(msg.x);
        const z = Number(msg.z);
        if (!Number.isFinite(x) || !Number.isFinite(z)) return;
        const r = Math.hypot(x, z);
        const k = r > CAVE_RADIUS ? CAVE_RADIUS / r : 1;
        me.x = x * k;
        me.z = z * k;
        me.ry = Number(msg.ry) || 0;
        me.a = msg.a | 0;
        break;
      }
      case 'chat': {
        const text = String(msg.text ?? '').trim().slice(0, 200);
        if (!text || now - me.lastChat < CHAT_COOLDOWN_MS) return;
        me.lastChat = now;
        pushChat({ id: me.id, from: me.name, text });
        break;
      }
      case 'punch': {
        const target = players.get(msg.target);
        if (!target || target === me || now - me.lastPunch < PUNCH_COOLDOWN_MS) return;
        // Ma không đánh được và cũng không bị đánh.
        if (me.ghostUntil || target.ghostUntil) return;
        if (Math.hypot(target.x - me.x, target.z - me.z) > PUNCH_RANGE) return;
        me.lastPunch = now;
        target.hp -= 1;
        if (target.hp <= 0) {
          target.hp = 0;
          target.ghostUntil = now + GHOST_MS;
        }
        broadcast({ t: 'punch', by: me.id, target: target.id, hp: target.hp, ghostLeft: ghostLeft(target) });
        pushChat({ sys: true, text: `${me.name} đã 👊 ${target.name}` });
        if (target.ghostUntil) pushChat({ sys: true, text: `👻 ${target.name} đã thành ma` });
        break;
      }
      case 'celebrate':
        broadcast({ t: 'celebrate', id: me.id });
        break;
      case 'vote': {
        const v = msg.v | 0;
        if (v < 0 || v >= POLL.options.length || votes.get(me.id) === v) return;
        votes.set(me.id, v);
        send(ws, { t: 'myvote', v });
        broadcast({ t: 'poll', counts: pollCounts() });
        pushChat({ sys: true, text: `${me.name} 🗳️ Bình chọn: ${POLL.options[v]}` });
        break;
      }
    }
  });

  ws.on('close', () => {
    if (!me) return;
    players.delete(me.id);
    broadcast({ t: 'leave', id: me.id });
  });
});

setInterval(() => {
  if (players.size === 0) return;
  const now = Date.now();
  for (const p of players.values()) {
    if (p.ghostUntil && now >= p.ghostUntil) {
      p.ghostUntil = 0;
      p.hp = MAX_HP;
      broadcast({ t: 'revive', id: p.id, hp: p.hp });
      pushChat({ sys: true, text: `✨ ${p.name} đã hồi sinh` });
    }
  }
  const ps = [...players.values()].map((p) => [p.id, +p.x.toFixed(2), +p.z.toFixed(2), +p.ry.toFixed(2), p.a]);
  broadcast({ t: 'state', ps });
}, TICK_MS);

server.listen(PORT, () => {
  console.log(`Hang Uit server: http://localhost:${PORT}  (ws: /ws)`);
});

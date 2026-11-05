import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { WebSocketServer } from 'ws';
import { POLL } from '../src/config.js';

// Khi dev, Vite chiếm PORT (nếu có) nên server luôn ở 8787 để khớp proxy trong vite.config.js.
const PORT = process.argv.includes('--dev') ? 8787 : Number(process.env.PORT) || 8787;
const DIST = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../dist');
const TICK_MS = 66; // ~15 lần/giây
const CAVE_RADIUS = 21;
const PUNCH_RANGE = 2.4;
const PUNCH_COOLDOWN_MS = 700;
const CHAT_COOLDOWN_MS = 800;
const CHAT_HISTORY = 30;

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

const server = http.createServer((req, res) => {
  if (req.url.startsWith('/api/stats')) return json(res, 200, { online: players.size });
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
  return { id: p.id, name: p.name, number: p.number, x: p.x, z: p.z, ry: p.ry, a: p.a };
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
        if (Math.hypot(target.x - me.x, target.z - me.z) > PUNCH_RANGE) return;
        me.lastPunch = now;
        broadcast({ t: 'punch', by: me.id, target: target.id });
        pushChat({ sys: true, text: `${me.name} đã 👊 ${target.name}` });
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
  const ps = [...players.values()].map((p) => [p.id, +p.x.toFixed(2), +p.z.toFixed(2), +p.ry.toFixed(2), p.a]);
  broadcast({ t: 'state', ps });
}, TICK_MS);

server.listen(PORT, () => {
  console.log(`Hang Uit server: http://localhost:${PORT}  (ws: /ws)`);
});

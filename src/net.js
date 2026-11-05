/** Kết nối WebSocket tới server, tự nối lại khi rớt mạng. */
export function connect(profile, handlers) {
  let ws = null;
  let closed = false;
  let retry = 0;

  function open() {
    const proto = location.protocol === 'https:' ? 'wss' : 'ws';
    ws = new WebSocket(`${proto}://${location.host}/ws`);
    ws.onopen = () => {
      retry = 0;
      ws.send(JSON.stringify({ t: 'join', name: profile.name, number: profile.number, club: profile.club }));
      handlers.status?.('online');
    };
    ws.onmessage = (e) => {
      let msg;
      try {
        msg = JSON.parse(e.data);
      } catch {
        return;
      }
      handlers[msg.t]?.(msg);
    };
    ws.onclose = () => {
      if (closed) return;
      handlers.status?.('offline');
      setTimeout(open, Math.min(8000, 500 * 2 ** retry++));
    };
  }
  open();

  return {
    send(msg) {
      if (ws?.readyState === WebSocket.OPEN) ws.send(JSON.stringify(msg));
    },
    close() {
      closed = true;
      ws?.close();
    },
  };
}

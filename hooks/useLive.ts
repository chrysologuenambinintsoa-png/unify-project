import { useEffect, useRef, useState, useCallback } from 'react';

type Msg = { type: string; roomId?: string; payload?: any; to?: string; rooms?: any[] };

export function useLive(wsPath = '/ws') {
  const wsRef = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [rooms, setRooms] = useState<any[]>([]);
  const listenersRef = useRef(new Set<(m: Msg) => void>());

  useEffect(() => {
    const loc = window.location;
    const protocol = loc.protocol === 'https:' ? 'wss' : 'ws';
    const url = `${protocol}://${loc.host}${wsPath}`;
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onmessage = (ev) => {
      try {
        const m: Msg = JSON.parse(ev.data);
        if (m.type === 'roomsList') setRooms(m.rooms || []);
        for (const l of listenersRef.current) l(m);
      } catch (e) {}
    };

    const handleOpen = () => { ws.send(JSON.stringify({ type: 'listRooms' })); };
    ws.addEventListener('open', handleOpen);

    return () => {
      ws.removeEventListener('open', handleOpen);
      ws.close();
      wsRef.current = null;
    };
  }, [wsPath]);

  const send = useCallback((msg: Msg) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    }
  }, []);

  const onMessage = useCallback((fn: (m: Msg) => void) => {
    listenersRef.current.add(fn);
    return () => listenersRef.current.delete(fn);
  }, []);

  return { connected, rooms, send, onMessage };
}

export default useLive;

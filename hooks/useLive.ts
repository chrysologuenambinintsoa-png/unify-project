import { useEffect, useRef, useState, useCallback } from 'react';

type Msg = { type: string; roomId?: string; payload?: any; to?: string; rooms?: any[] };

export function useLive(wsPath = '/ws') {
  const wsRef = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [rooms, setRooms] = useState<any[]>([]);
  const listenersRef = useRef(new Set<(m: Msg) => void>());

  useEffect(() => {
    try {
      const loc = window.location;
      const protocol = loc.protocol === 'https:' ? 'wss' : 'ws';

      // Allow overriding the WebSocket URL via NEXT_PUBLIC_LIVE_WS_URL
      // Example: NEXT_PUBLIC_LIVE_WS_URL=wss://my-ws-host.example.com/ws
      const envUrl = (process.env.NEXT_PUBLIC_LIVE_WS_URL as string | undefined) || '';
      const url = envUrl && envUrl.length > 0 ? envUrl : `${protocol}://${loc.host}${wsPath}`;
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('[useLive] WebSocket connected to', url);
        setConnected(true);
        try {
          console.log('[useLive] Sending listRooms message...');
          ws.send(JSON.stringify({ type: 'listRooms' }));
          console.log('[useLive] listRooms message sent successfully');
        } catch (e) {
          console.error('[useLive] Failed to send listRooms:', e);
        }
      };
      ws.onclose = () => {
        console.log('[useLive] WebSocket closed');
        setConnected(false);
      };
      ws.onerror = (ev) => {
        console.warn('[useLive] WebSocket error:', ev);
        setConnected(false);
      };
      ws.onmessage = (ev) => {
        try {
          console.log('[useLive] Message received from server');
          const m: Msg = JSON.parse(ev.data);
          if (m.type === 'roomsList') setRooms(m.rooms || []);
          for (const l of listenersRef.current) l(m);
        } catch (e) {
          console.error('[useLive] Failed to parse message:', e);
        }
      };

      return () => {
        ws.close();
        wsRef.current = null;
      };
    } catch (e) {
      console.error('[useLive] Failed to initialize WebSocket:', e);
    }
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

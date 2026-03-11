import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:5000';

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    // Connect with JWT in handshake auth
    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      console.log('[WS] Connected:', socket.id);
    });

    socket.on('disconnect', (reason) => {
      setConnected(false);
      console.log('[WS] Disconnected:', reason);
    });

    socket.on('connect_error', (err) => {
      console.warn('[WS] Connection error:', err.message);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, []); // only on mount — token is stable per session

  return { socket: socketRef.current, connected };
}

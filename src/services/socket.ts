import { io, Socket } from 'socket.io-client';
import { getApiUrl } from './api';

let socket: Socket | null = null;

export function getSocket() {
  if (!socket) {
    socket = io(getApiUrl(), { transports: ['websocket'], autoConnect: false });
  }
  return socket;
}

export function connectSocket() {
  const s = getSocket();
  if (!s.connected) s.connect();
  return s;
}

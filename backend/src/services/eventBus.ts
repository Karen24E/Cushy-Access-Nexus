import type { Server } from 'socket.io';

export let io: Server | null = null;

export function registerSocketServer(server: Server) {
  io = server;
}

export function emitEvent(event: string, payload: unknown) {
  io?.to('command-center').emit(event, payload);
}

export function broadcast(event: string, payload: unknown) { if (io) io.to('command-center').emit(event, payload); }

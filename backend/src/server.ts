import 'dotenv/config';
import http from 'node:http';
import cors from 'cors';
import express from 'express';
import { Server } from 'socket.io';
import { pool, query } from './db/index.js';
import { registerSocketServer } from './services/eventBus.js';
import { dashboardRouter } from './routes/dashboard.js';
import { ordersRouter } from './routes/orders.js';
import { ridersRouter } from './routes/riders.js';
import { alertsRouter } from './routes/alerts.js';
import { servicesRouter } from './routes/services.js';
import { eventsRouter } from './routes/events.js';
import { authRouter } from './routes/auth.js';
import { incidentsRouter } from './routes/incidents.js';
import { requireAuth } from './middleware/auth.js';
import { startSimulator } from './simulator.js';

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: process.env.CORS_ORIGIN === '*' ? '*' : process.env.CORS_ORIGIN?.split(',') } });

app.use(cors({ origin: process.env.CORS_ORIGIN === '*' ? true : process.env.CORS_ORIGIN?.split(',') }));
app.use(express.json({ limit: '1mb' }));

app.get('/health', async (_req, res) => {
  try { await query('SELECT 1'); res.json({ status: 'ok', database: 'connected', timestamp: new Date().toISOString() }); }
  catch { res.status(503).json({ status: 'degraded', database: 'unavailable' }); }
});

app.use('/api/dashboard', requireAuth, dashboardRouter);
app.use('/api/orders', requireAuth, ordersRouter);
app.use('/api/riders', requireAuth, ridersRouter);
app.use('/api/alerts', requireAuth, alertsRouter);
app.use('/api/services', requireAuth, servicesRouter);
app.use('/api/events', eventsRouter);
app.use('/api/auth', authRouter);
app.use('/api/incidents', incidentsRouter);

io.on('connection', (socket) => {
  socket.join('command-center');
  socket.emit('connection.ready', { connectedAt: new Date().toISOString() });
  socket.on('disconnect', () => undefined);
});
registerSocketServer(io);

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(error);
  const message = error instanceof Error ? error.message : 'Internal server error';
  res.status(400).json({ error: message });
});

const port = Number(process.env.PORT ?? 4000);
server.listen(port, '0.0.0.0', () => {
  console.log(`Ops Command Center API listening on http://0.0.0.0:${port}`);
  if (process.env.ENABLE_SIMULATOR === 'true') startSimulator();
});

const shutdown = async () => {
  await pool.end();
  server.close(() => process.exit(0));
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

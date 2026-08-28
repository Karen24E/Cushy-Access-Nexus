import { Router } from 'express';
import { z } from 'zod';
import { query } from '../db/index.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { broadcast } from '../services/eventBus.js';

export const incidentsRouter = Router();
incidentsRouter.use(requireAuth);

const status = z.enum(['open', 'acknowledged', 'investigating', 'resolved', 'closed']);
const severity = z.enum(['critical', 'high', 'medium', 'low']);

incidentsRouter.get('/', async (req, res) => {
  const result = await query(`SELECT i.*, u.name AS assignee_name FROM incidents i LEFT JOIN users u ON u.id = i.assigned_to WHERE ($1 = 'all' OR i.status = $1) ORDER BY CASE i.severity WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 ELSE 4 END, i.created_at DESC`, [String(req.query.status ?? 'all')]);
  res.json({ data: result.rows });
});

incidentsRouter.post('/', requireRole('super_admin', 'operations_manager', 'dispatcher'), async (req, res) => {
  const body = z.object({ title: z.string().min(3), description: z.string().min(3), severity, vertical: z.enum(['Q-Commerce','Healthtech','Foodtech','Logistics']), source_alert_id: z.string().optional(), assigned_to: z.string().optional() }).parse(req.body);
  const id = `INC-${Date.now()}`;
  const result = await query(`INSERT INTO incidents (id, title, description, severity, vertical, source_alert_id, assigned_to, status, created_by) VALUES ($1,$2,$3,$4,$5,$6,$7,'open',$8) RETURNING *`, [id, body.title, body.description, body.severity, body.vertical, body.source_alert_id ?? null, body.assigned_to ?? null, req.user!.id]);
  await query(`INSERT INTO incident_events (id, incident_id, actor_id, action, metadata) VALUES ($1,$2,$3,'created',$4)`, [`INE-${Date.now()}`, id, req.user!.id, JSON.stringify({ severity: body.severity })]);
  broadcast('incident.created', result.rows[0]);
  res.status(201).json(result.rows[0]);
});

incidentsRouter.patch('/:id/status', requireRole('super_admin', 'operations_manager', 'dispatcher'), async (req, res) => {
  const nextStatus = status.parse(req.body.status);
  const result = await query(`UPDATE incidents SET status = $1, updated_at = NOW(), resolved_at = CASE WHEN $1 IN ('resolved','closed') THEN NOW() ELSE resolved_at END WHERE id = $2 RETURNING *`, [nextStatus, req.params.id]);
  if (!result.rows[0]) return res.status(404).json({ error: 'Incident not found.' });
  await query(`INSERT INTO incident_events (id, incident_id, actor_id, action, metadata) VALUES ($1,$2,$3,$4,$5)`, [`INE-${Date.now()}`, req.params.id, req.user!.id, `status:${nextStatus}`, JSON.stringify({ status: nextStatus })]);
  broadcast('incident.updated', result.rows[0]);
  res.json(result.rows[0]);
});

incidentsRouter.patch('/:id/assign', requireRole('super_admin', 'operations_manager', 'dispatcher'), async (req, res) => {
  const assignedTo = z.string().min(1).parse(req.body.assigned_to);
  const result = await query(`UPDATE incidents SET assigned_to = $1, updated_at = NOW() WHERE id = $2 RETURNING *`, [assignedTo, req.params.id]);
  if (!result.rows[0]) return res.status(404).json({ error: 'Incident not found.' });
  await query(`INSERT INTO incident_events (id, incident_id, actor_id, action, metadata) VALUES ($1,$2,$3,'assigned',$4)`, [`INE-${Date.now()}`, req.params.id, req.user!.id, JSON.stringify({ assigned_to: assignedTo })]);
  broadcast('incident.updated', result.rows[0]);
  res.json(result.rows[0]);
});

incidentsRouter.get('/:id/events', async (req, res) => {
  const result = await query(`SELECT e.*, u.name AS actor_name FROM incident_events e LEFT JOIN users u ON u.id = e.actor_id WHERE e.incident_id = $1 ORDER BY e.created_at DESC`, [req.params.id]);
  res.json({ data: result.rows });
});

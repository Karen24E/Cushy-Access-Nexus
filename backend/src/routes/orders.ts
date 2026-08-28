import { Router } from 'express';
import { z } from 'zod';
import { query } from '../db/index.js';
import { emitEvent } from '../services/eventBus.js';

export const ordersRouter = Router();

const createOrderSchema = z.object({
  vertical: z.enum(['Q-Commerce','Healthtech','Foodtech','Logistics']),
  customerName: z.string().min(2),
  pickupName: z.string().min(2),
  dropoffAddress: z.string().min(4),
  priority: z.enum(['normal','high','critical']).default('normal'),
  slaMinutes: z.number().int().positive().max(240).default(30),
});

ordersRouter.get('/', async (req, res, next) => {
  try {
    const vertical = typeof req.query.vertical === 'string' ? req.query.vertical : undefined;
    const status = typeof req.query.status === 'string' ? req.query.status : undefined;
    const limit = Math.min(Math.max(Number(req.query.limit ?? 50), 1), 200);
    const params: unknown[] = [];
    const conditions: string[] = [];
    if (vertical && vertical !== 'All') { params.push(vertical); conditions.push(`o.vertical=$${params.length}`); }
    if (status && status !== 'All') { params.push(status); conditions.push(`o.status=$${params.length}`); }
    params.push(limit);
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const result = await query(`SELECT o.*, r.name rider_name, r.lat rider_lat, r.lng rider_lng, r.status rider_status FROM orders o LEFT JOIN riders r ON r.id=o.rider_id ${where} ORDER BY o.updated_at DESC LIMIT $${params.length}`, params);
    res.json({ data: result.rows });
  } catch (error) { next(error); }
});

ordersRouter.post('/', async (req, res, next) => {
  try {
    const body = createOrderSchema.parse(req.body);
    const id = `ord_${Date.now()}`;
    const reference = `#${body.vertical === 'Q-Commerce' ? 'QC' : body.vertical === 'Healthtech' ? 'HT' : body.vertical === 'Foodtech' ? 'FD' : 'LG'}-${Math.floor(10000 + Math.random()*89999)}`;
    const result = await query(`INSERT INTO orders (id, reference, vertical, status, customer_name, pickup_name, dropoff_address, priority, sla_minutes) VALUES ($1,$2,$3,'pending',$4,$5,$6,$7,$8) RETURNING *`, [id, reference, body.vertical, body.customerName, body.pickupName, body.dropoffAddress, body.priority, body.slaMinutes]);
    const order = result.rows[0];
    emitEvent('order.created', order);
    res.status(201).json({ data: order });
  } catch (error) { next(error); }
});

const statusSchema = z.object({ status: z.enum(['pending','confirmed','preparing','ready','assigned','picked_up','delivered','cancelled','failed']) });

ordersRouter.patch('/:id/status', async (req, res, next) => {
  try {
    const { status } = statusSchema.parse(req.body);
    const result = await query(`UPDATE orders SET status=$1, updated_at=NOW() WHERE id=$2 RETURNING *`, [status, req.params.id]);
    if (!result.rowCount) return res.status(404).json({ error: 'Order not found' });
    emitEvent('order.updated', result.rows[0]);
    res.json({ data: result.rows[0] });
  } catch (error) { next(error); }
});

const assignSchema = z.object({ riderId: z.string().min(1) });

ordersRouter.post('/:id/assign', async (req, res, next) => {
  try {
    const { riderId } = assignSchema.parse(req.body);
    const riderCheck = await query<{ id: string }>(`SELECT id FROM riders WHERE id=$1 AND status IN ('available','active')`, [riderId]);
    if (!riderCheck.rowCount) return res.status(400).json({ error: 'Rider is unavailable' });
    const result = await query(`UPDATE orders SET rider_id=$1, status='assigned', updated_at=NOW() WHERE id=$2 RETURNING *`, [riderId, req.params.id]);
    if (!result.rowCount) return res.status(404).json({ error: 'Order not found' });
    await query(`UPDATE riders SET order_id=$1, status='active', updated_at=NOW() WHERE id=$2`, [req.params.id, riderId]);
    emitEvent('order.assigned', { order: result.rows[0], riderId });
    emitEvent('rider.updated', { riderId, orderId: req.params.id, status: 'active' });
    res.json({ data: result.rows[0] });
  } catch (error) { next(error); }
});

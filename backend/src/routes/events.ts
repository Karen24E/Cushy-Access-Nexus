import { Request, Router } from 'express';
import { z } from 'zod';
import { query } from '../db/index.js';
import { emitEvent } from '../services/eventBus.js';

export const eventsRouter = Router();

const eventSchema = z.object({
  type: z.enum(['ORDER_CREATED','ORDER_UPDATED','ORDER_STATUS_CHANGED','RIDER_LOCATION','RIDER_STATUS','ALERT_CREATED','SERVICE_HEALTH']),
  source: z.string().min(1),
  payload: z.record(z.string(), z.unknown()),
  occurredAt: z.string().datetime().optional(),
});

function authorized(req: Request) {
  const configured = process.env.EVENT_INGEST_KEY;
  if (!configured) return true;
  return req.header('x-event-key') === configured;
}

eventsRouter.post('/', async (req, res, next) => {
  try {
    if (!authorized(req)) return res.status(401).json({ error: 'Invalid event key' });
    const event = eventSchema.parse(req.body);
    const p = event.payload as Record<string, unknown>;

    switch (event.type) {
      case 'ORDER_CREATED': {
        const required = z.object({
          id: z.string(), reference: z.string(), vertical: z.enum(['Q-Commerce','Healthtech','Foodtech','Logistics']),
          status: z.enum(['pending','confirmed','preparing','ready','assigned','picked_up','delivered','cancelled','failed']),
          customerName: z.string(), pickupName: z.string(), dropoffAddress: z.string(),
          priority: z.enum(['normal','high','critical']).optional(), slaMinutes: z.number().int().positive().optional(),
        }).parse(p);
        const result = await query(`INSERT INTO orders (id,reference,vertical,status,customer_name,pickup_name,dropoff_address,priority,sla_minutes) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT (id) DO UPDATE SET status=EXCLUDED.status, updated_at=NOW() RETURNING *`, [required.id,required.reference,required.vertical,required.status,required.customerName,required.pickupName,required.dropoffAddress,required.priority ?? 'normal',required.slaMinutes ?? 30]);
        emitEvent('order.created', result.rows[0]);
        break;
      }
      case 'ORDER_UPDATED':
      case 'ORDER_STATUS_CHANGED': {
        const required = z.object({ id: z.string(), status: z.enum(['pending','confirmed','preparing','ready','assigned','picked_up','delivered','cancelled','failed']) }).parse(p);
        const result = await query(`UPDATE orders SET status=$1, updated_at=NOW() WHERE id=$2 RETURNING *`, [required.status, required.id]);
        if (!result.rowCount) return res.status(404).json({ error: 'Order not found' });
        emitEvent('order.updated', result.rows[0]);
        break;
      }
      case 'RIDER_LOCATION': {
        const required = z.object({ id: z.string(), lat: z.number(), lng: z.number() }).parse(p);
        const result = await query(`UPDATE riders SET lat=$1,lng=$2,updated_at=NOW() WHERE id=$3 RETURNING *`, [required.lat,required.lng,required.id]);
        if (!result.rowCount) return res.status(404).json({ error: 'Rider not found' });
        emitEvent('rider.location', result.rows[0]);
        break;
      }
      case 'RIDER_STATUS': {
        const required = z.object({ id: z.string(), status: z.enum(['active','available','offline','delayed']) }).parse(p);
        const result = await query(`UPDATE riders SET status=$1,updated_at=NOW() WHERE id=$2 RETURNING *`, [required.status,required.id]);
        if (!result.rowCount) return res.status(404).json({ error: 'Rider not found' });
        emitEvent('rider.updated', result.rows[0]);
        break;
      }
      case 'ALERT_CREATED': {
        const required = z.object({ id: z.string(), severity: z.enum(['critical','warning','info']), title: z.string(), description: z.string(), vertical: z.enum(['Q-Commerce','Healthtech','Foodtech','Logistics']) }).parse(p);
        const result = await query(`INSERT INTO alerts (id,severity,title,description,vertical) VALUES ($1,$2,$3,$4,$5) ON CONFLICT (id) DO UPDATE SET title=EXCLUDED.title, description=EXCLUDED.description, status='open' RETURNING *`, [required.id,required.severity,required.title,required.description,required.vertical]);
        emitEvent('alert.created', result.rows[0]);
        break;
      }
      case 'SERVICE_HEALTH': {
        const required = z.object({ id: z.string(), name: z.string(), status: z.enum(['operational','degraded','outage']), latencyMs: z.number().int().nonnegative(), errorRate: z.number().nonnegative() }).parse(p);
        const result = await query(`INSERT INTO services (id,name,status,latency_ms,error_rate) VALUES ($1,$2,$3,$4,$5) ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name,status=EXCLUDED.status,latency_ms=EXCLUDED.latency_ms,error_rate=EXCLUDED.error_rate,updated_at=NOW() RETURNING *`, [required.id,required.name,required.status,required.latencyMs,required.errorRate]);
        emitEvent('service.health', result.rows[0]);
        break;
      }
    }

    res.status(202).json({ accepted: true, type: event.type, source: event.source, occurredAt: event.occurredAt ?? new Date().toISOString() });
  } catch (error) { next(error); }
});

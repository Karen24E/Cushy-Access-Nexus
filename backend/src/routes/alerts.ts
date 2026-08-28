import { Router } from 'express';
import { query } from '../db/index.js';
import { z } from 'zod';
import { emitEvent } from '../services/eventBus.js';

export const alertsRouter = Router();

alertsRouter.get('/', async (req, res, next) => {
  try {
    const vertical = typeof req.query.vertical === 'string' ? req.query.vertical : undefined;
    const params = vertical && vertical !== 'All' ? [vertical] : [];
    const filter = params.length ? `WHERE a.vertical=$1 AND a.status != 'resolved'` : `WHERE a.status != 'resolved'`;
    const result = await query(`SELECT a.*, EXTRACT(EPOCH FROM (NOW()-a.created_at))/60 AS age_minutes FROM alerts a ${filter} ORDER BY a.created_at DESC LIMIT 50`, params);
    res.json({ data: result.rows });
  } catch (error) { next(error); }
});

const statusSchema = z.object({ status: z.enum(['open','acknowledged','resolved']) });

alertsRouter.patch('/:id', async (req, res, next) => {
  try {
    const { status } = statusSchema.parse(req.body);
    const result = await query(`UPDATE alerts SET status=$1 WHERE id=$2 RETURNING *`, [status, req.params.id]);
    if (!result.rowCount) return res.status(404).json({ error: 'Alert not found' });
    emitEvent('alert.updated', result.rows[0]);
    res.json({ data: result.rows[0] });
  } catch (error) { next(error); }
});

import { Router } from 'express';
import { z } from 'zod';
import { query } from '../db/index.js';
import { emitEvent } from '../services/eventBus.js';

export const ridersRouter = Router();

ridersRouter.get('/', async (_req, res, next) => {
  try {
    const result = await query(`SELECT * FROM riders ORDER BY updated_at DESC`);
    res.json({ data: result.rows });
  } catch (error) { next(error); }
});

const locationSchema = z.object({ lat: z.number(), lng: z.number() });

ridersRouter.patch('/:id/location', async (req, res, next) => {
  try {
    const { lat, lng } = locationSchema.parse(req.body);
    const result = await query(`UPDATE riders SET lat=$1, lng=$2, updated_at=NOW() WHERE id=$3 RETURNING *`, [lat, lng, req.params.id]);
    if (!result.rowCount) return res.status(404).json({ error: 'Rider not found' });
    emitEvent('rider.location', result.rows[0]);
    res.json({ data: result.rows[0] });
  } catch (error) { next(error); }
});

import { Router } from 'express';
import { query } from '../db/index.js';

export const servicesRouter = Router();

servicesRouter.get('/', async (_req, res, next) => {
  try {
    const result = await query(`SELECT id,name,status,latency_ms,error_rate,updated_at FROM services ORDER BY name`);
    res.json({ data: result.rows });
  } catch (error) { next(error); }
});

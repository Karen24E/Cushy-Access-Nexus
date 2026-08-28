import { Router } from 'express';
import { getDashboard } from '../services/dashboard.js';

export const dashboardRouter = Router();

dashboardRouter.get('/', async (req, res, next) => {
  try {
    const vertical = typeof req.query.vertical === 'string' ? req.query.vertical : undefined;
    res.json(await getDashboard(vertical));
  } catch (error) { next(error); }
});

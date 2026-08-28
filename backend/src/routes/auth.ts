import { Router } from 'express';
import { z } from 'zod';
import { query } from '../db/index.js';
import { hashPassword, signToken, verifyPassword } from '../utils/auth.js';
import { requireAuth } from '../middleware/auth.js';

export const authRouter = Router();

const loginSchema = z.object({ email: z.string().email(), password: z.string().min(6) });

const userSelect = `SELECT id, email, name, role, organization_id, password_hash FROM users WHERE email = $1 AND active = TRUE LIMIT 1`;

authRouter.post('/login', async (req, res) => {
  const { email, password } = loginSchema.parse(req.body);
  const result = await query(userSelect, [email.toLowerCase()]);
  const user = result.rows[0] as any;
  if (!user || !(await verifyPassword(password, user.password_hash))) return res.status(401).json({ error: 'Invalid email or password.' });
  const safeUser = { id: user.id, email: user.email, name: user.name, role: user.role, organization_id: user.organization_id };
  res.json({ token: signToken(safeUser), user: safeUser });
});

authRouter.get('/me', requireAuth, async (req, res) => {
  res.json({ user: req.user });
});

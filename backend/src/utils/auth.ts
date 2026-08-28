import crypto from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(crypto.scrypt);
const JWT_SECRET = process.env.JWT_SECRET ?? 'change-this-in-production';

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: string;
  organization_id: string;
};

function b64url(input: string | Buffer) {
  return Buffer.from(input).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

export async function hashPassword(password: string) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${salt}:${derived.toString('hex')}`;
}

export async function verifyPassword(password: string, stored: string) {
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  const derived = (await scryptAsync(password, salt, 64)) as Buffer;
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), derived);
}

export function signToken(user: AuthUser, expiresInHours = 12) {
  const header = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const exp = Math.floor(Date.now() / 1000) + expiresInHours * 60 * 60;
  const payload = b64url(JSON.stringify({ sub: user.id, email: user.email, name: user.name, role: user.role, organization_id: user.organization_id, exp }));
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${payload}`).digest('base64url');
  return `${header}.${payload}.${signature}`;
}

export function verifyToken(token: string): AuthUser | null {
  const [header, payload, signature] = token.split('.');
  if (!header || !payload || !signature) return null;
  const expected = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${payload}`).digest('base64url');
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
  try {
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as AuthUser & { sub: string; exp: number };
    if (!parsed.exp || parsed.exp < Math.floor(Date.now() / 1000)) return null;
    return { id: parsed.sub, email: parsed.email, name: parsed.name, role: parsed.role, organization_id: parsed.organization_id };
  } catch {
    return null;
  }
}

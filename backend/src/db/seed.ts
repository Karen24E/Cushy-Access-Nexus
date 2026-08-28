import 'dotenv/config';
import { pool, query } from './index.js';
import { hashPassword } from '../utils/auth.js';

const run = async () => {
  await query(`CREATE TABLE IF NOT EXISTS organizations (id TEXT PRIMARY KEY, name TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`);
  await query(`CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE, name TEXT NOT NULL, email TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL, role TEXT NOT NULL CHECK (role IN ('super_admin','operations_manager','dispatcher','analyst','viewer')), active BOOLEAN NOT NULL DEFAULT TRUE, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`);
  await query(`CREATE TABLE IF NOT EXISTS incidents (id TEXT PRIMARY KEY, title TEXT NOT NULL, description TEXT NOT NULL, severity TEXT NOT NULL CHECK (severity IN ('critical','high','medium','low')), vertical TEXT NOT NULL CHECK (vertical IN ('Q-Commerce','Healthtech','Foodtech','Logistics')), status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','acknowledged','investigating','resolved','closed')), source_alert_id TEXT REFERENCES alerts(id) ON DELETE SET NULL, assigned_to TEXT REFERENCES users(id) ON DELETE SET NULL, created_by TEXT REFERENCES users(id) ON DELETE SET NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), resolved_at TIMESTAMPTZ)`);
  await query(`CREATE TABLE IF NOT EXISTS incident_events (id TEXT PRIMARY KEY, incident_id TEXT NOT NULL REFERENCES incidents(id) ON DELETE CASCADE, actor_id TEXT REFERENCES users(id) ON DELETE SET NULL, action TEXT NOT NULL, metadata JSONB NOT NULL DEFAULT '{}'::jsonb, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`);

  await query(`INSERT INTO organizations (id,name) VALUES ('org-cushy','Cushy Access') ON CONFLICT (id) DO NOTHING`);
  const password = await hashPassword('Nexus@2026');
  const users = [
    ['USR-001','Karen Bennett','admin@cushyaccess.com','super_admin'],
    ['USR-002','Operations Manager','ops@cushyaccess.com','operations_manager'],
    ['USR-003','Dispatcher','dispatch@cushyaccess.com','dispatcher'],
    ['USR-004','Analyst','analyst@cushyaccess.com','analyst'],
    ['USR-005','Viewer','viewer@cushyaccess.com','viewer'],
  ];
  for (const [id,name,email,role] of users) await query(`INSERT INTO users (id,organization_id,name,email,password_hash,role) VALUES ($1,'org-cushy',$2,$3,$4,$5) ON CONFLICT(email) DO NOTHING`, [id,name,email,password,role]);

  const admins = await query(`SELECT id FROM users WHERE email = 'admin@cushyaccess.com'`);
  const op = await query(`SELECT id FROM users WHERE email = 'ops@cushyaccess.com'`);
  const incidents = [
    ['INC-1001','Q-Commerce rider shortage','Lagos Island dispatch zone has 18 orders waiting for assignment beyond the expected threshold.','high','Q-Commerce','open',op.rows[0]?.id ?? null,admins.rows[0]?.id ?? null],
    ['INC-1002','Payments API degradation','Payment authorization latency has crossed the operational warning threshold for Foodtech checkout.','critical','Foodtech','investigating',admins.rows[0]?.id ?? null,admins.rows[0]?.id ?? null],
    ['INC-1003','Pharmacy fulfilment backlog','Prescription fulfilment queue is above its normal operating range.','medium','Healthtech','acknowledged',op.rows[0]?.id ?? null,admins.rows[0]?.id ?? null],
  ];
  for (const row of incidents) await query(`INSERT INTO incidents (id,title,description,severity,vertical,status,assigned_to,created_by) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT(id) DO NOTHING`, row);
  console.log('Nexus auth + incident seed complete. Demo password for all seeded users: Nexus@2026');
};
run().catch((error) => { console.error(error); process.exit(1); }).finally(() => pool.end());

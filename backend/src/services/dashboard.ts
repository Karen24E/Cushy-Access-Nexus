import { query } from '../db/index.js';

export async function getDashboard(vertical?: string) {
  const values = vertical && vertical !== 'All' ? [vertical] : [];
  const filter = values.length ? ' AND vertical = $1' : '';

  const [orders, activeDeliveries, atRisk, completed, alerts, services] = await Promise.all([
    query<{ count: string }>(`SELECT COUNT(*)::text count FROM orders WHERE 1=1${filter}`, values),
    query<{ count: string }>(`SELECT COUNT(*)::text count FROM orders WHERE status IN ('assigned','picked_up')${filter}`, values),
    query<{ count: string }>(`SELECT COUNT(*)::text count FROM orders WHERE status NOT IN ('delivered','cancelled','failed') AND EXTRACT(EPOCH FROM (NOW()-created_at))/60 > sla_minutes${filter}`, values),
    query<{ count: string }>(`SELECT COUNT(*)::text count FROM orders WHERE status='delivered'${filter}`, values),
    query(`SELECT id, severity, title, description, vertical, EXTRACT(EPOCH FROM (NOW()-created_at))/60 AS age_minutes FROM alerts WHERE status != 'resolved'${values.length ? ' AND vertical = $1' : ''} ORDER BY created_at DESC LIMIT 10`, values),
    query(`SELECT id, name, status, latency_ms, error_rate, updated_at FROM services ORDER BY name`),
  ]);

  const total = Number(orders.rows[0]?.count ?? 0);
  const delivered = Number(completed.rows[0]?.count ?? 0);
  const slaHealth = total ? Number(((delivered / total) * 100).toFixed(1)) : 100;

  return {
    metrics: [
      { label: 'Orders today', value: total.toLocaleString(), delta: '', positive: true, icon: 'receipt-outline' },
      { label: 'Active deliveries', value: Number(activeDeliveries.rows[0]?.count ?? 0).toLocaleString(), delta: '', positive: true, icon: 'navigate-outline' },
      { label: 'At-risk orders', value: Number(atRisk.rows[0]?.count ?? 0).toLocaleString(), delta: '', positive: false, icon: 'warning-outline' },
      { label: 'Completed', value: delivered.toLocaleString(), delta: '', positive: true, icon: 'checkmark-circle-outline' },
    ],
    slaHealth,
    alerts: alerts.rows,
    services: services.rows,
  };
}

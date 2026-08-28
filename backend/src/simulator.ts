import { query } from './db/index.js';
import { emitEvent } from './services/eventBus.js';

export function startSimulator() {
  if (process.env.ENABLE_SIMULATOR !== 'true') return;
  setInterval(async () => {
    try {
      const result = await query<{ id: string; lat: number; lng: number }>(`SELECT id,lat,lng FROM riders WHERE status IN ('active','available') ORDER BY RANDOM() LIMIT 2`);
      for (const rider of result.rows) {
        const nextLat = rider.lat + (Math.random() - 0.5) * 0.002;
        const nextLng = rider.lng + (Math.random() - 0.5) * 0.002;
        const updated = await query(`UPDATE riders SET lat=$1,lng=$2,updated_at=NOW() WHERE id=$3 RETURNING *`, [nextLat, nextLng, rider.id]);
        emitEvent('rider.location', updated.rows[0]);
      }
    } catch (error) {
      console.error('simulator error', error);
    }
  }, 5000);
}

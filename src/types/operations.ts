export type Vertical = 'All' | 'Q-Commerce' | 'Healthtech' | 'Foodtech' | 'Logistics';
export type Severity = 'critical' | 'warning' | 'info';
export type RiderStatus = 'active' | 'available' | 'offline' | 'delayed';
export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'assigned' | 'picked_up' | 'delivered' | 'cancelled' | 'failed';

export interface Metric { label: string; value: string; delta: string; positive: boolean; icon: string; }
export interface AlertItem { id: string; severity: Severity; title: string; description: string; time?: string; age_minutes?: number; vertical: Exclude<Vertical, 'All'>; }
export interface Rider { id: string; name: string; lat: number; lng: number; status: RiderStatus; orderId?: string | null; }
export interface Order {
  id: string; reference: string; vertical: Exclude<Vertical, 'All'>; status: OrderStatus; customer_name: string; pickup_name: string; dropoff_address: string; rider_id?: string | null; rider_name?: string | null; priority: 'normal' | 'high' | 'critical'; sla_minutes: number; created_at: string; updated_at: string;
}
export interface ServiceHealth { id?: string; name: string; status: 'operational' | 'degraded' | 'outage'; latency_ms: number; error_rate: number; updated_at?: string; }
export interface DashboardPayload { metrics: Metric[]; slaHealth: number; alerts: AlertItem[]; services: ServiceHealth[]; }

// New backend API types
export interface CategoryData {
  category: string;
  revenue: number;
  itemsSold: number;
  uniqueProducts: number;
}

export interface OverviewData {
  orders: {
    pending: number;
    inProgress: number;
    completed: number;
    cancelled: number;
    totalToday: number;
  };
  riders: {
    online: number;
    active: number;
    total: number;
  };
  stores: {
    active: number;
    suspended: number;
    total: number;
  };
  system: {
    apiResponseTime: string;
    errorRate: string;
    databaseHealth: boolean;
  };
}

export interface ProductsData {
  allTime: {
    total: number;
    available: number;
    unavailable: number;
    discounted: number;
  };
  today: {
    sold: number;
    uniqueSold: number;
    revenue: number;
  };
}

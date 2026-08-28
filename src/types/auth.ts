export type Role = 'super_admin' | 'operations_manager' | 'dispatcher' | 'analyst' | 'viewer';
export interface AuthUser { id: string; email: string; name: string; role: Role; organization_id: string; }
export interface Session { token: string; user: AuthUser; }
export const ROLE_LABELS: Record<Role, string> = { super_admin: 'Super Admin', operations_manager: 'Operations Manager', dispatcher: 'Dispatcher', analyst: 'Analyst', viewer: 'Viewer' };

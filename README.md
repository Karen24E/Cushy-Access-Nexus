# Cushy Access Nexus

Unified independent operations, monitoring and infrastructure command platform for Cushy Access.

## What is this?

This repository contains the **Cushy Access Nexus** mobile application - a unified operations command platform that connects to an external backend API.

### Mobile modules

- **Command Center** — unified live metrics, SLA health, logistics map, active alerts and infrastructure health
- **Operations** — shared workspace shell for Q-Commerce, Healthtech, Foodtech and Logistics
- **Orders** — live order queue and dispatch workflows
- **Alerts** — operational alerts
- **Incidents** — incident tracking and management
- **More** — platform navigation

### External Backend Integration

- Connects to external backend API via `EXPO_PUBLIC_API_URL`
- Socket.IO client for real-time updates
- JWT authentication support
- REST API integration for orders, riders, alerts, incidents

## Repository structure

```text
cushy-access-nexus/
├── app/                    # Expo Router screens
├── src/                    # shared React Native components, API, sockets, theme
├── scripts/                # Utility scripts (LAN setup)
├── app.json
├── package.json
└── README.md
```

## Command Center ↔ Operations

The two modules are now in the same app and share:

- the same API client
- the same Socket.IO event fabric
- the same alerts and SLA model
- the same orders/dispatch data
- the same royal-purple, white and yellow design system

No back-and-forth between separate projects is required.

## Start the mobile app

From the repository root:

```bash
copy .env.example .env
npm install
npx expo start
```

For Expo Go on an iPhone, use the Windows PC LAN IP rather than localhost:

```env
EXPO_PUBLIC_API_URL=http://192.168.1.20:4000
```

The phone and PC must be on the same network and Windows Firewall must allow TCP port 4000.

## Useful commands

```bash
npm run typecheck
```

## Authentication & RBAC

The mobile application includes an Incident Center and authentication/RBAC layer.

### Demo credentials (for external backend)
- super_admin: admin@cushyaccess.com / Nexus@2026
- operations_manager: ops@cushyaccess.com / Nexus@2026
- dispatcher: dispatch@cushyaccess.com / Nexus@2026
- analyst: analyst@cushyaccess.com / Nexus@2026
- viewer: viewer@cushyaccess.com / Nexus@2026

*Note: These credentials are examples - configure credentials that match your external backend.*

Configure your external backend credentials in the `.env` file with `EXPO_PUBLIC_API_URL`.

### Role model
- `super_admin`: full platform access
- `operations_manager`: operations + incidents + reports
- `dispatcher`: orders/dispatch/logistics + incident control
- `analyst`: monitoring and analytics read access
- `viewer`: read-only command center/monitoring

### API Integration
The mobile app expects these standard API endpoints from your external backend:
- Authentication: `POST /api/auth/login`, `GET /api/auth/me`
- Incidents: `GET /api/incidents`, `POST /api/incidents`, `PATCH /api/incidents/:id/status`, `PATCH /api/incidents/:id/assign`
- Dashboard: `GET /api/dashboard`
- Orders: `GET /api/orders`, `POST /api/orders`, `PATCH /api/orders/:id/status`, `POST /api/orders/:id/assign`
- Riders: `GET /api/riders`, `PATCH /api/riders/:id/location`
- Alerts: `GET /api/alerts`, `PATCH /api/alerts/:id`

The mobile app stores the access token in Expo SecureStore and sends it as a Bearer token to protected endpoints.

## Expo Go LAN setup

From the project root, run:

```powershell
npm install
npm run set:lan
npx expo start -c
```

`npm run set:lan` detects the computer's private IPv4 address and writes `EXPO_PUBLIC_API_URL=http://<LAN-IP>:4000` to `.env`. Keep the phone and computer on the same Wi-Fi network.

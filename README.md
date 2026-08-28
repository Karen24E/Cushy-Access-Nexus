# Cushy Access Nexus

Unified independent operations, monitoring and infrastructure command platform for Cushy Access.

## What is merged here?

This repository combines the latest **Command Center** and **Nexus Operations** work into one Expo application and one backend. You should use this folder as the single VS Code workspace going forward.

### Mobile modules

- **Command Center** — unified live metrics, SLA health, logistics map, active alerts and infrastructure health
- **Operations** — shared workspace shell for Q-Commerce, Healthtech, Foodtech and Logistics
- **Orders** — live order queue and dispatch workflows
- **Alerts** — operational alerts
- **More** — platform navigation

### Backend

- Express + TypeScript REST API
- PostgreSQL persistence
- Socket.IO event stream
- Orders, riders, alerts, services and dashboard endpoints
- Authenticated upstream event ingestion via `POST /api/events`
- Local rider/event simulator for development

## Repository structure

```text
cushy-access-nexus/
├── app/                    # Expo Router screens
├── src/                    # shared React Native components, API, sockets, theme
├── backend/                # API, PostgreSQL, WebSocket/event layer
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

## Start the backend

```bash
cd backend
docker compose up -d
copy .env.example .env
npm install
npm run seed
npm run dev
```

API: `http://localhost:4000`

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
npm run backend:typecheck
npm run backend:dev
npm run backend:seed
```

## Git

Initialize this folder as the single Nexus repository:

```bash
git init
git add .
git commit -m "Merge Command Center and Operations"
```

Then connect the root folder to your GitHub repository and push `main`.

## Nexus Incident & Monitoring + Authentication/RBAC

This unified build now includes an Incident Center and authentication/RBAC layer inside the same mobile application.

### Demo credentials
- super_admin: admin@cushyaccess.com / Nexus@2026
- operations_manager: ops@cushyaccess.com / Nexus@2026
- dispatcher: dispatch@cushyaccess.com / Nexus@2026
- analyst: analyst@cushyaccess.com / Nexus@2026
- viewer: viewer@cushyaccess.com / Nexus@2026

Change all demo credentials before production. Set a strong `JWT_SECRET` in the backend environment.

### Role model
- `super_admin`: full platform access
- `operations_manager`: operations + incidents + reports
- `dispatcher`: orders/dispatch/logistics + incident control
- `analyst`: monitoring and analytics read access
- `viewer`: read-only command center/monitoring

### New API
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/incidents`
- `POST /api/incidents`
- `PATCH /api/incidents/:id/status`
- `PATCH /api/incidents/:id/assign`
- `GET /api/incidents/:id/events`

The mobile app stores the access token in Expo SecureStore and sends it as a Bearer token to protected Nexus endpoints.

## Expo Go LAN setup

From the project root, run:

```powershell
npm install
npm run set:lan
npx expo start -c
```

`npm run set:lan` detects the computer's private IPv4 address and writes `EXPO_PUBLIC_API_URL=http://<LAN-IP>:4000` to `.env`. Keep the phone and computer on the same Wi-Fi network.

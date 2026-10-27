# Cushy Access Nexus

Unified command platform for **Q-Commerce**, **HealthTech**, **FoodTech**, **Logistics**, and **Command & Operations**.

## Features

- **Landing page** with animated module showcase
- **Auth**: Login & Sign Up (local session via AsyncStorage)
- **Home dashboard** with live product/order stats and module grid
- **Separate screens** for each module:
  - Q-Commerce
  - HealthTech
  - FoodTech
  - Logistics
  - Command & Operations (category revenue + live metrics)
  - Email Monitoring (test + logs)
- **Live API integration** with `https://cushyaccessbackend-1.onrender.com`
- Color system: Royal Purple · Yellow · White
- Unique animated **CAN** logo

## Run

```bash
npm install
npx expo start
```

Then open in Expo Go, iOS Simulator, Android Emulator, or web.

### Test with the local backend

1. Start the backend in `C:\Users\HP\cushy-backend` with `npm run start:dev` (it listens on port `4000` unless `PORT` is set).
2. Copy `.env.example` to `.env` in this app folder and set `EXPO_PUBLIC_API_BASE` to the backend host reachable from your device:
  - Physical phone: `http://<your-computer-LAN-IPv4>:4000` (phone and computer must be on the same Wi-Fi; allow Node.js through Windows Firewall).
  - Android emulator: `http://10.0.2.2:4000`.
  - iOS simulator: `http://localhost:4000`.
3. Restart Expo with its cache cleared, sign in against the local backend, allow notifications, then tap **Send to my signup email**. The backend must be running and include the local authenticated `/api/v1/notifications/send-me` route.

The app uses the hosted API by default when `EXPO_PUBLIC_API_BASE` is unset. Expo push delivery itself still goes through Expo's push service, so use a physical device or a supported development build and grant notification permission.

## API Endpoints Used

- `GET /monitoring/operations/products/categories`
- `GET /monitoring/operations/products`
- `GET /monitoring/operations/orders`
- `POST /monitoring/email/test`
- `GET /monitoring/email/logs`

## Remote Push Token Testing

The app uses Expo push tokens (the `ExponentPushToken[...]` or `ExpoPushToken[...]` value), which this backend delivers through the Expo Push API. After signing in and granting notification permission on an Android development build, open **Monitoring Hub → Endpoint Alerts**. The **View Push Token** action displays the registered token; **Refresh Token** requests and registers it again. A raw FCM token is not the token accepted by the backend's current Expo delivery path.

## Tech

- Expo SDK 54 + Expo Router
- React Native
- TypeScript

## Expo EAS Over-the-Air (OTA) updates

This project is configured to use `expo-updates` with the existing EAS project ID. The app checks for a compatible update on launch and uses the cached bundle if an update is not immediately available. OTA updates apply to JavaScript, app screens, and compatible assets; changes to native dependencies, native code, permissions, or native app configuration require a new EAS build and installation.

### One-time setup

1. Use Node.js supported by your Expo SDK and install dependencies:
   ```bash
   npm install
   npx expo install expo-updates
   ```
   `expo-updates` must match the installed Expo SDK. If Expo selects a different compatible version, keep the version selected by `npx expo install`.
2. Sign in to the Expo account that owns the EAS project and verify the project:
   ```bash
   npx eas-cli login
   npx eas-cli project:info
   ```
3. Build and install a new native app after adding `expo-updates` (existing installs without the native update module cannot receive OTA updates):
   ```bash
   npx eas-cli build --platform android --profile preview
   ```
   For a store/release build use `--profile production` instead.

### Publish an update

Publish JavaScript/UI changes to the matching channel:

```bash
# Preview testers
npx eas-cli update --channel preview --message "Describe the change"

# Production users
npx eas-cli update --channel production --message "Describe the change"
```

Only publish to `production` after testing the update on `preview`. The installed app's channel and `runtimeVersion` must match the published update. With `runtimeVersion` set to `appVersion`, bump `expo.version` in `app.json` and create a new native build whenever you intentionally change the app version or need to distribute native changes. Do not publish OTA updates that expect native modules absent from the installed binary.

### Rollback / troubleshooting

Use the EAS dashboard's Updates page to inspect deployments and roll back a bad update, or publish a corrected update to the same channel. Test on a development/preview build before production. OTA updates do not update the web deployment; deploy web changes separately.


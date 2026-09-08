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

## API Endpoints Used

- `GET /monitoring/operations/products/categories`
- `GET /monitoring/operations/products`
- `GET /monitoring/operations/orders`
- `POST /monitoring/email/test`
- `GET /monitoring/email/logs`

## Tech

- Expo SDK 54 + Expo Router
- React Native
- TypeScript

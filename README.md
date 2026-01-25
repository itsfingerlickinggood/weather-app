<div align="center">

# Advanced Weather Intelligence & Climate Insights Portal

Kerala-first climate experience with multi-city dashboards, radar maps, AQI/UV intelligence, and story-driven forecasting — all in a modern React + Vite SPA.

</div>

## Overview
This project is a single-page application focused on Kerala microclimates (coastal, backwater, hill-station). It uses React 18 and Vite with a polished UI, rich analytics, and mockable data sources via MSW. The app can run entirely in the browser with mocks or optionally pull live data from Open-Meteo and IndianAPI.

## Key Capabilities
- **Role-aware auth flows**: in-memory + localStorage tokens, refresh interceptor, and protected/admin routes.
- **Forecast suite**: current, hourly, 3-day and 14-day forecasts with narrative story timeline.
- **Trip intelligence**: best-day picker, packing list, and activity-friendly hour windows.
- **Map intelligence**: MapLibre + OSM tiles with radar/precip layer (optional dependency).
- **Health signals**: AQI + UV guidance with proactive toast alerts and color-coded risk levels.
- **Personalization**: theme, reduced motion, and high-contrast accessibility toggles.
- **Admin telemetry**: usage analytics, API health, feedback sentiments, and location management.
- **Offline-first demo**: MSW mocks for all flows; localStorage cache for weather/AQI/UV.

## Tech Stack
- **UI**: React 18, Vite, Tailwind CSS
- **Routing**: React Router
- **Data**: React Query, Axios
- **Mocking**: MSW (Mock Service Worker)
- **Mapping**: MapLibre GL (optional)
- **Testing**: Vitest + Testing Library

## Project Structure
```
src/
	assets/            UI assets
	components/        Reusable UI building blocks
	context/           Auth and UI state
	hooks/             Query + feature hooks
	lib/               API and integration helpers
	mocks/             MSW handlers and server
	pages/             Route-level pages
	routes/            Auth/role guards
	__tests__/         Unit/integration tests
```

## Quick Start
1) Install dependencies
2) Start the dev server
3) Open the app and login

**Commands**
- `npm install`
- `npm run dev`
- Open http://localhost:5173

**Demo logins**
- User: `user@example.com` / `password`
- Admin: `admin@example.com` / `password`

## Environment Configuration
Copy the example file and update values as needed.

**Required for live data**
- `VITE_INDIANAPI_KEY` — IndianAPI key for Indian cities

**Optional**
- `VITE_USE_LIVE_WEATHER` — set to `false` to force MSW-only mocks
- `VITE_OPENMETEO_BASE` — defaults to https://api.open-meteo.com/v1
- `VITE_API_URL` — custom API base
- `VITE_MAP_TILE_KEY` — optional Map tile key for MapLibre

See `.env.local.example` for the full list.

## Scripts
- `npm run dev` — start development server
- `npm run build` — production build
- `npm run preview` — preview the production build
- `npm run test` — run tests (MSW mocks expected)

## Testing
Tests use MSW to mock all API calls. If you force live data, revert to mocks before running tests.

## Live Data vs. Mock Mode
- **Mock mode (default for tests)**: everything stays in the browser via MSW.
- **Live mode**: pull real data from Open-Meteo and IndianAPI.

To force mocks:
- Set `VITE_USE_LIVE_WEATHER=false`.

## Accessibility
Includes theme switcher, reduced motion, and high-contrast toggles. The UI avoids motion overload and provides visible risk guidance for AQI/UV.

## Security Note
The auth system is frontend-only and for demo purposes. Replace MSW and client-side tokens with a real backend for production.

## Kerala Presets (Included)
Thiruvananthapuram, Kochi, Kozhikode, Idukki (Munnar), Alappuzha, Wayanad.

## Contributing
1) Create a feature branch
2) Run tests
3) Open a PR with a clear description

## License
Specify the license in this file or add a LICENSE file at the root.

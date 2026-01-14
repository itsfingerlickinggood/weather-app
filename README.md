## Advanced Weather Intelligence & Climate Insights Portal

SPA built with React 18, Vite, React Router, React Query, Axios, Tailwind, and MSW. All APIs are mocked with MSW; the app never leaves the browser. The experience is Kerala-first with coastal, backwater, and hill-station presets.

### Features
- Auth context with memory + localStorage tokens, role-aware guards, axios refresh interceptor; auto-login demo enabled.
- City search, trip planner (best day + packing list), activity-friendly hours, and multi-city dashboard focused on Kerala microclimates.
- Weather stack: current/hourly, 3-day and 14-day forecasts, narrative story timeline, dynamic animated backgrounds per conditions.
- Map view: MapLibre + OpenStreetMap tiles; radar/precip intensity layer (install `maplibre-gl`).
- AQI + UV trackers with color-coded health guidance; proactive toasts for high UV/AQI/rain; offline cache for weather/AQI/UV stored in localStorage.
- AI-lite clothing + activity guidance, comparison, alerts, radar (animated precip sweep), seasonal insights.
- Kerala visual board: gauges for humidity, comfort index, cloud cover, sunrise/sunset, sea temps; microclimate strips across coast/backwaters/hills.
- Admin: usage + API health monitoring, feedback with sentiment badges, locations table.
- Mock endpoints (MSW) for all flows; live weather toggle uses IndianAPI/Open-Meteo when enabled.
- Accessibility toggles for theme, reduced motion, and high contrast.

### Run
1) `npm install`
2) `npm run dev`
3) Open http://localhost:5173
4) Login: `user@example.com` / `password` (admin: `admin@example.com` / `password`).

Kerala cities available out of the box: Thiruvananthapuram, Kochi, Kozhikode, Idukki (Munnar), Alappuzha, and Wayanad.

Live data: enabled by default. Provide `VITE_INDIANAPI_KEY` (for Indian cities via https://weather.indianapi.in). `VITE_USE_LIVE_WEATHER` can be set to `false` to force MSW-only mocks (tests expect mocks). `VITE_OPENMETEO_BASE` defaults to https://api.open-meteo.com/v1.

### Test
- `npm run test`

### Environment
See `.env.local.example` for `VITE_API_URL`, live weather toggles, and optional `VITE_MAP_TILE_KEY` (for OpenMap tiles in MapLibre).

### Security note
Frontend-only auth is for demo only; replace MSW and client-side tokens with a real backend for production.

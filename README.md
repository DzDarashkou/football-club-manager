# Nuxt Minimal Starter

## Weather forecasts

Upcoming-match weather is loaded server-side from Open-Meteo; no API key or environment configuration is required. Apply the Supabase migrations before deploying, including `20260904100000_match_weather.sql`.

Venue coordinates are optional. Enter both latitude and longitude to use an exact location; otherwise, enter a city and the server will geocode it once and retain the result. Forecasts are cached in Supabase per match (6 hours at 7–16 days, 3 hours at 2–7 days, and 1 hour within 48 hours). Matches beyond Open-Meteo’s 16-day forecast window show that a forecast is not available yet.

Weather data is provided by [Open-Meteo](https://open-meteo.com/).

Look at the [Nuxt documentation](https://nuxt.com/docs/getting-started/introduction) to learn more.

## Setup

Make sure to install dependencies:

```bash
# npm
npm install

# pnpm
pnpm install

# yarn
yarn install

# bun
bun install
```

## Development Server

Start the development server on `http://localhost:3000`:

```bash
# npm
npm run dev

# pnpm
pnpm dev

# yarn
yarn dev

# bun
bun run dev
```

## Production

Build the application for production:

```bash
# npm
npm run build

# pnpm
pnpm build

# yarn
yarn build

# bun
bun run build
```

Locally preview production build:

```bash
# npm
npm run preview

# pnpm
pnpm preview

# yarn
yarn preview

# bun
bun run preview
```

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.

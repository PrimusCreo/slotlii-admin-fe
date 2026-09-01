# Slotlii Admin Dashboard

React + Vite frontend for the Slotlii platform admin.

## Environment variables

Vite only exposes variables prefixed with `VITE_` to the browser. They are
baked into the bundle at **build time** — changing them on the server after
`npm run build` has no effect.

| Variable | Required | Description |
| --- | --- | --- |
| `VITE_API_BASE_URL` | Production | Full API origin including `/api`, e.g. `https://api.slotlii.com/api`. Leave empty in local dev to use the Vite proxy. |
| `VITE_APP_NAME` | No | Product name shown in the chrome. Defaults to `Slotlii`. |
| `DEV_PROXY_TARGET` | Local only | Backend origin the Vite proxy forwards `/api` and `/health` to. Defaults to `http://localhost:3000`. |
| `DEV_SERVER_PORT` | Local only | Vite dev server port. Defaults to `5173`. |

Copy the templates:

```bash
# local
cp .env.example .env

# production build (or set the same vars in your host)
cp .env.production.example .env.production
```

Then edit `VITE_API_BASE_URL` to your real API host.

## Scripts

```bash
npm run dev      # local, proxies /api → DEV_PROXY_TARGET
npm run build    # production bundle (reads .env.production)
npm run preview  # serve the built dist/
```

/**
 * Frontend env — Vite only exposes `VITE_*` vars to the browser.
 *
 * Local: leave `VITE_API_BASE_URL` empty so axios hits `/api` and Vite
 * proxies it to the backend (`DEV_PROXY_TARGET` in vite.config.js).
 *
 * Production: set `VITE_API_BASE_URL` at build time to the full API
 * origin including `/api`, e.g. `https://api.slotlii.com/api`.
 */

function trimSlash(value) {
  return String(value || '').replace(/\/+$/, '');
}

const rawApiBase = trimSlash(import.meta.env.VITE_API_BASE_URL);

export const APP_NAME = import.meta.env.VITE_APP_NAME || 'Slotlii';
export const APP_MODE = import.meta.env.MODE;
export const IS_PROD = import.meta.env.PROD;

/** Axios base. Relative `/api` in local dev; absolute origin in prod. */
export const API_BASE_URL = rawApiBase || '/api';

/**
 * `/health` lives on the backend origin, not under `/api`.
 * `https://api.example.com/api` → `https://api.example.com/health`
 * `/api` → `/health` (Vite proxy in local dev).
 */
export const HEALTH_URL = API_BASE_URL.startsWith('/')
  ? '/health'
  : `${API_BASE_URL.replace(/\/api$/i, '')}/health`;

if (IS_PROD && !rawApiBase) {
  console.warn(
    `[${APP_NAME} admin] VITE_API_BASE_URL is not set. ` +
      'API calls will go to /api on this origin. Set it before building for production.',
  );
}

/**
 * Hadoku Task Mobile - landing fallback.
 *
 * In production the WebView loads https://hadoku.me/task directly
 * (configured via capacitor.config.ts server.url), so this file is
 * only reached via `pnpm dev` in a browser. Auth + session cookies
 * are handled server-side on hadoku.me.
 */

const TASK_URL = 'https://hadoku.me/task/';
const AUTH_URL = 'https://hadoku.me/auth?return=/task';

window.addEventListener('DOMContentLoaded', () => {
    document.getElementById('signin-btn').addEventListener('click', () => {
        window.location.href = AUTH_URL;
    });
    document.getElementById('skip-btn').addEventListener('click', () => {
        window.location.href = TASK_URL;
    });
});

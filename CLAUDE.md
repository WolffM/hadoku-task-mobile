# hadoku-task-mobile

Android APK wrapper around the hadoku-task UI, built with Capacitor.

## Layout

| Path                      | Purpose                                  |
| ------------------------- | ---------------------------------------- |
| `www/`                    | Static HTML/CSS/JS the WebView loads     |
| `www/js/app.js`           | Entry — auth, fetch wiring, navigation   |
| `android/`                | Capacitor-generated Android project      |
| `capacitor.config.ts`     | Capacitor config (server URL, etc.)      |
| `scripts/`                | Build/sign helpers                       |
| `*.keystore` / `keystore.base64*` | Android signing material (gitignored) |

## Commands

```sh
pnpm dev               # http-server on :8080 (wrapped via dev-vault)
pnpm sync              # capacitor sync www → android/
pnpm open:android      # open Android Studio
pnpm android:build     # gradle assembleDebug
pnpm android:install   # install APK to attached device
pnpm release           # tag + sign release APK
pnpm bump-version      # bump android/app/build.gradle versionCode/versionName
```

## Auth & secrets (hadoku ecosystem)

- **All API fetches** must hit `hadoku.me/{prefix}/*` via edge-router — NEVER `*.hadoku.me` direct subdomains. The `hadoku_session` cookie (`Domain=.hadoku.me`, 30d sliding) is set on `/auth` and resolved server-side into `X-User-Key`. WebView uses the same cookie path as a desktop browser.
- **Secrets**: vault-broker model, NO `.env` file. `.devvault.json` declares which vault keys `pnpm dev` needs; the shim at `../hadoku_site/scripts/secrets/dev-vault.mjs` fetches from the broker and execs `http-server` with them in env. If `pnpm dev` errors, run `node ../hadoku_site/scripts/secrets/dev-vault.mjs --check` for diagnostics.
- **Tutorial**: `../hadoku_site/docs/child-apps/USING_VAULT.md`. Operational reference: `../hadoku_site/docs/operations/SECRETS.md`.
- **Auth model**: 1:1 named user-keys. See `../hadoku_site/docs/planning/next-work.md`.

## Does NOT

- Does NOT contain task-app source (that lives in `../hadoku-task/` and is loaded via mf-loader at runtime)
- Does NOT use a build step for the static web (Capacitor copies `www/` into the APK as-is)
- Does NOT publish to npm (this is a deployable APK, not a package)

## References

- Parent monorepo: `../hadoku_site/`
- The task UI being wrapped: `../hadoku-task/`
- Capacitor docs: https://capacitorjs.com/docs

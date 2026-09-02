# Nexus deployment

## Web production

Nexus is a React SPA. Production deploys must be reproducible and must never depend on a tracked `.env` file.

```bash
npm ci
npm run lint
CI=true npm test
npm audit --omit=dev --audit-level=high
npm run build
```

The dependency lock is committed and must stay synchronized with `package.json`. QR generation is bundled locally through the pinned `qrcodejs` dependency; the catalog no longer requires a third-party QR HTTP service at runtime.

The web server must serve the `build/` directory and fall back application routes to `build/index.html`. A hardened Nginx example lives at `deploy/nginx-nexus.conf`.

## Environment

Create the server-local `.env` from `.env.example`. The canonical variable names are:

- `REACT_APP_API_BASE_URL`
- `REACT_APP_STORAGE_URL`
- `REACT_APP_PUBLIC_URL`
- `REACT_APP_ID`
- `REACT_APP_GOOGLE_CLIENT_ID`

Never commit `.env`, `.env.production` or secrets. Every `REACT_APP_*` value is public because Create React App embeds it in the browser bundle.

## Atomic deployment

Recommended layout:

```text
/var/www/nexus.petertecnet.com.br/
  current -> releases/<release-id>/build
  releases/
  shared/.env
```

Build in a new release directory, validate it, then switch the `current` symlink atomically. Keep the previous release until smoke tests pass so rollback is just a symlink change.

## Production smoke test

After deployment validate:

1. `/`
2. `/login`
3. `/register`
4. `/establishment/my`
5. create and update a company
6. create, update and delete an item
7. `/catalog/:slug` without authentication
8. `/item/:slug` without authentication
9. catalog share/copy/local QR flow
10. logout and expired-session refresh handling
11. an unknown URL renders the Nexus 404 screen
12. Google login succeeds for the production origin
13. a catalog not linked to Nexus is rejected by the API

Legacy `/catalogo/:slug` and `/establishment/view/:slug` routes redirect to `/catalog/:slug`.

## Server verification

Before switching traffic, verify response headers include HSTS, CSP, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` and frame protection. Also verify direct access to a SPA route returns the app rather than an Nginx 404.

## API production

The API production branch is expected to be deployed with Composer's locked dependencies and Laravel caches rebuilt. Keep `JWT_TTL=120` and `JWT_REFRESH_TTL=20160` unless there is a documented operational reason to override them.

After API deployment run the Nexus-specific feature tests together with the regular suite before clearing the maintenance window.

## Android release

Never store signing passwords or a keystore in Git. Nexus release signing reads only these environment variables:

- `NEXUS_RELEASE_STORE_FILE`
- `NEXUS_RELEASE_STORE_PASSWORD`
- `NEXUS_RELEASE_KEY_ALIAS`
- `NEXUS_RELEASE_KEY_PASSWORD`

The old repository credential must not be reused. Generate a dedicated Nexus signing key outside the repository, store it in the release environment/secret manager, run `npx cap sync android`, then `cd android && ./gradlew test assembleRelease`. Publish `/.well-known/assetlinks.json` with the SHA-256 fingerprint of that new certificate before relying on verified Android App Links.

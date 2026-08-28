# Nexus deployment

## Web production

The application is a React SPA built with Create React App.

```bash
npm install
npm run build
```

The web server must serve the `build/` directory and fall back unknown application routes to `build/index.html` so routes such as `/catalog/:slug` work on direct access.

## Environment

Create `.env` from `.env.example` and configure at least:

- `REACT_APP_API_URL`
- `REACT_APP_GOOGLE_CLIENT_ID`

Never commit the production `.env` file.

## Smoke test

After deployment validate:

1. `/`
2. `/login`
3. `/register`
4. `/establishments`
5. `/establishment/my`
6. company create/update
7. item create/update
8. `/catalog/:slug`
9. `/item/view/:slug`
10. catalog QR/share URL

Legacy `/catalogo/:slug` and `/establishment/view/:slug` routes redirect to the canonical `/catalog/:slug` path.

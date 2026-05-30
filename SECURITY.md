# Security

This project is intentionally public so you can verify how your Qualtrics API token is handled.

## Summary

- **We do not store your API token.** It is not written to a database, cookie, `localStorage`, server environment variable, or disk.
- **We do not store your survey data.** Backup files are assembled in your browser and downloaded as a ZIP.
- **The proxy is stateless.** Each request forwards your token to Qualtrics and returns the response. There is no session table and no credential cache.

## How authentication works

1. You enter your Qualtrics datacenter ID and API token in the browser.
2. The browser keeps the token in memory for the current tab session only.
3. When the app calls Qualtrics, it sends a same-origin request to `/api/qualtrics/proxy` with the token in the `X-Qualtrics-Token` header.
4. The proxy route ([`app/api/qualtrics/proxy/route.ts`](app/api/qualtrics/proxy/route.ts)) forwards the request to `https://{datacenter}.qualtrics.com/API/v3/...` with Qualtrics' required `X-API-TOKEN` header.
5. The proxy returns Qualtrics' response without persisting the token or response body.

## What the proxy does **not** do

- No logging of `X-Qualtrics-Token` or request bodies in application code
- No database, Redis, or filesystem writes for user credentials or exports
- No third-party analytics that receive the token

## Platform caveat

If you deploy on Vercel (or any host), the hosting provider may retain standard HTTP access logs (URL path, status code, timestamp). Those logs should **not** include your token because it is sent in a custom request header, not the URL. If you are cautious, rotate your Qualtrics API token after completing a backup.

## Qualtrics token scope

Qualtrics API tokens are account-scoped credentials. Treat them like passwords. This app only implements read/export operations, but the underlying token may allow broader account actions depending on your Qualtrics license and user permissions.

## Reporting issues

If you believe you found a security issue, please open a GitHub issue or contact the repository owner privately.

## Self-hosting

If you do not want any third-party proxy, clone this repository and run it locally (`npm run dev`) or deploy it to your own infrastructure. The proxy code is small and auditable.

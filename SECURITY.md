# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in this project, please **do not open a public issue**.

Instead, contact the maintainer privately by:

- Opening a [GitHub Security Advisory](https://github.com/gartiluigi-blip/dashboard-ultimate/security/advisories/new) (preferred), or
- Sending a message via the repository owner's profile

Please include:

- A description of the vulnerability
- Steps to reproduce
- Potential impact
- Any suggested mitigation

You can expect:

- An acknowledgement within **72 hours**
- A fix or mitigation plan within **14 days** for high-severity issues
- Credit in the changelog (if you wish)

## Supported Versions

Only the `main` branch is supported. Older deployments are not maintained.

## Known security considerations

This project is a **personal dashboard** and was not designed as a multi-tenant or enterprise application. Be aware that:

- Data is stored in `localStorage` and `IndexedDB`, both readable by any script running in the page origin.
- The optional "local API key" mode stores an Anthropic API key in `localStorage`. **This mode is being deprecated** in favor of server-side calls via Netlify Functions.
- The deployed Netlify URL is publicly accessible; there is currently no authentication layer. Do not use this fork for sensitive data without adding auth.
- Backups exported via the in-app "safe export" feature filter out keys matching `token|secret|api_key|anthropic|claude|gh_`. Verify exports manually before sharing.

## Security best practices for users

If you fork or self-host:

1. **Set `CLAUDE_API_KEY` only as a Netlify environment variable**, never in code.
2. **Add an auth layer** (Netlify Identity, Cloudflare Access, basic auth) before deploying to a real domain.
3. **Review `_headers`** before deployment; the default CSP allows `'unsafe-inline'` for backwards compat.
4. **Audit `netlify/functions/coach.js`** for rate-limiting and origin validation before exposing publicly.
5. **Rotate API keys** every 90 days minimum.

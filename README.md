# Dashboard Ultimate

> Personal life-OS dashboard. Single-page, offline-first, no backend required.
> Tracks studies, fitness, nutrition, finances, languages, chess, and more.

[![Netlify Status](https://api.netlify.com/api/v1/badges/PLACEHOLDER/deploy-status)](https://app.netlify.com/sites/ultimatedashboard/deploys)

---

## What

A self-contained personal dashboard built as **one HTML file**. Designed to work entirely client-side (localStorage + IndexedDB) so it runs anywhere — including offline on a flaky train wifi.

Optional integration with the Anthropic API (via a Netlify Function) for an AI coach that reads your recent activity and gives feedback.

## Why

Productivity apps (Notion, Todoist, Strava…) are great in isolation but fragmented. I wanted **one screen** that knows my rotating shifts, my study load (Bachelor in CS starting Sept 2026), my training cycle, and my financial plan — all at once. Most importantly, I wanted full ownership of the data.

## Stack

- **Frontend**: vanilla HTML/CSS/JS — no framework, no build step (yet)
- **Storage**: localStorage (primary) + IndexedDB (mirror)
- **AI**: Anthropic Claude via Netlify Function (or local API key, fallback)
- **Hosting**: Netlify (static + functions)
- **Fonts**: Fraunces, Outfit, JetBrains Mono (Google Fonts)

## Features

### Core dashboard
- **Today** — next action, priorities, current shift, training of the day, day templates
- **Stats** — streak, heatmap, weekly review, monthly aggregates
- **Routine** — rotating shift planner with task completion and conflict detection
- **Command Palette** — keyboard-driven navigation across all modules
- **Bottom nav** — mobile-optimised quick-access navigation

### v4 modules
- **Sport Command Center** — 9-day PPL cycle (push1/pull1/rest/legs1/push2/rest/pull2/legs2/rest), C7-cervical-safe protocol, per-exercise logging with RPE + pain tracking, deload weeks, bodyweight progressions (6 movements × 6 levels), souplesse protocol (5 levels, PNF at level 2+), monthly tests, 30-day consistency stats, full session history
- **Certifications** — full cert roadmap across 7 tracks (PC/IT, Coding, AI, IoT, Linux/Network, Data/Cloud, PM), mock exam scores, status tracking
- **Proofs** — skill proof vault, link/file references, due dates, validation workflow
- **Mission Now** — single-focus mission selector (A-priority → overdue proofs → active certs)
- **Ops Briefing** — daily situation report: mode (full/reduced/survival), risks, top missions
- **Vinted v2** — full reseller P&L (buy price, listing price, sold price, shipping, boost, platform fees), item lifecycle, migration from v1
- **Finance Command** — monthly income/charges/savings dashboard with project buckets
- **Health/Performance** — daily performance logging (energy, sleep, mood, etc.)
- **Weekly Review** — ISO-week structured review form with persistent storage
- **Etude** — 12 study subjects with resource tracking, position/total progress bars
- **Loisir** — chess ELO tracking, book reading progress, bookmarks per subject
- **Argent** — monthly finance with charges and debts, multi-month history
- **Reglages** — export/import, data management, performance settings

## Run locally

```bash
git clone https://github.com/gartiluigi-blip/dashboard-ultimate.git
cd dashboard-ultimate
# Just open index.html in a browser, or:
npx serve .
```

## Check / lint

```bash
node scripts/check.js
```

Runs: JS syntax check on all four assets, no Trading references, no native prompt/alert/confirm.

## localStorage

All data is stored under the `dashv3_` prefix. Key conventions:
- `dashv3_log_YYYY-MM-DD` — daily log
- `dashv3_sport_YYYY-MM-DD` — legacy sport log (kept for backward compat)
- `dashv3_sport_cycle` — 9-day PPL cycle anchor
- `dashv3_sport_sessions` — full session history
- `dashv3_bodyweight_progress` — bodyweight movement levels and bests
- `dashv3_flexibility_progress` — souplesse level, measurements, daily checks
- `dashv3_sport_monthly_tests` — monthly test records
- `dashv3_certifications` — cert list
- `dashv3_proofs` — skill proof vault
- `dashv3_vinted_v2` — Vinted v2 items
- `dashv3_finance_command_YYYY-MM` — monthly finance

No service worker. No backend. No medical claims.

For the AI coach to work, you need either:
- A `CLAUDE_API_KEY` env var on the Netlify deployment (recommended), OR
- A personal Anthropic API key entered in the app's settings (less secure)

## Deploy on Netlify

1. Fork this repo
2. Connect to Netlify ("New site from Git")
3. Build command: *(none)* — Publish directory: `.`
4. Add `CLAUDE_API_KEY` in Site settings → Environment variables
5. Deploy

## Roadmap

- [ ] Modular file structure (split JS/CSS out of HTML)
- [ ] Vite + TypeScript build
- [ ] Service worker (true offline + install)
- [ ] Cloud sync (Netlify Blobs or Supabase)
- [ ] Auth gate (Netlify Identity)
- [ ] Public leaderboard / accountability sharing
- [ ] Mobile companion via Capacitor

## Contributing

This is a personal project, but issues and PRs are welcome if you spot something obvious. For feature requests, please open an issue first to discuss.

## Security

See [SECURITY.md](SECURITY.md) for how to report vulnerabilities.

## License

All Rights Reserved. See [LICENSE](LICENSE).

## Credits

- Built with help from Claude (Anthropic)
- Fonts: Fraunces (David Berlow et al), Outfit (Smich Ko), JetBrains Mono

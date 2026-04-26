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

- 🏠 **Today** — next action, priorities, current shift, training of the day
- 📊 **Stats** — streak, heatmap, weekly review, monthly aggregates
- 📅 **Routine** — rotating shift planner with conflict detection
- 💪 **Sport** — push/pull/legs cycle, C7-cervical-safe
- 🧘 **Flexibility** — progressive stretching protocol
- 🥩 **Nutrition** — supplements + macros tracker
- 🎓 **EPFC** — full Bachelor curriculum mapped to certifications
- 💻 **Code** — coding platforms progression (Codewars, LeetCode, etc.)
- 🤖 **AI** — learning path (post-Python foundations)
- 🛍️ **Vinted** — reseller business tracker (DAC7 compliant)
- 🇳🇱 **Dutch** — language learning timeline
- ♟️ **Chess** — ELO tracking + study plan
- 💰 **Finance** — debt killer + ETF investing plan
- 🤝 **Social** — relationship maintenance reminders
- 📋 **Plan** — exports + backups
- 📈 **Trading** — journaling for prop firm prep
- ⚙️ **Settings** — themes, AI key, perf mode

## Run locally

```bash
git clone https://github.com/gartiluigi-blip/dashboard-ultimate.git
cd dashboard-ultimate
# Just open index.html in a browser, or:
npx serve .
```

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

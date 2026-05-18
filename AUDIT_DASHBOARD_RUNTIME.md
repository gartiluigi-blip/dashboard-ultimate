# AUDIT_DASHBOARD_RUNTIME.md
_Dashboard Ultimate — runtime engine audit · 2026-05-18_

## Active JS Engines (execution order)

| Engine | Location | Scope | Status |
|--------|----------|-------|--------|
| `main.cfc54acb.js` | `/assets/` | Core router, `highlightNow()` tick (1 s), `setNowCard()`, tab switching, `ensurePagesVisible()` | **PRIMARY — do not modify** |
| `ud-v72-godmode-pack.js` | `/assets/` | Backup/restore, PWA install prompt, timers, confetti | Active, safe |
| `dom.js / html.js / router.js` | `/assets/` | DOM helpers, template engine, SPA router | Active, safe |
| `safe-storage.js / store.js / early-stub.js` | `/assets/` | localStorage wrapper, state store, early stubs | Active, safe |
| **Inline IIFE V34** | `index.html` ~ln 9200 | MODULE_LABELS, MODULES object, Routine block engine | Active |
| **Inline IIFE V40** | `index.html` ~ln 9700 | U20 accountability panel | Active |
| **Inline IIFE V54** | `index.html` ~ln 12100 | `cleanTradingText()`, ops-grid shortcut buttons | Active |
| **Inline IIFE V62** | `index.html` ~ln 13400 | Smart routine builder (V1), card generator | Active |
| **Inline IIFE V63** | `index.html` ~ln 13900 | Check-in modal, `label()` helper, routine done state | Active |
| **Inline IIFE V67/V68** | `index.html` ~ln 14100 | Smart routine builder (V2), mode selector, form | Active — **overwrites V62 output** |
| **Inline IIFE V69** | `index.html` ~ln 14198 | EPFC/IoT anti-duplicate, Trading text remover | Active |
| **Inline IIFE V71** | `index.html` ~ln 13022 | Tab label enforcer (Trading → IoT) | Active |
| **Inline IIFE V77** | `index.html` ~ln 15000 | Gamification/grade CONFIG | Active |
| **Inline IIFE V80** | `index.html` ~ln 15600 | Grade tracker UI | Active |

## Dead / Neutralised Code

| Symbol | File | Reason |
|--------|------|--------|
| `renderNutrition()` | `index.html` ~ln 11189 | `return;` added as first statement — was overwriting simplified protein+water HTML on every tab load |
| `UDTradingRoutinePatch` | `index.html` ~ln 12104 | Stubbed to no-ops (V70 neutralisation) |
| `loadTrading()` | `index.html` ~ln 6401 | Empty function, `#p-trading` content is static HTML |
| Trading form spec (Forex/crypto fields) | `index.html` ~ln 9227 | Internal only, never rendered (no trading blocks in schedule) |

## Confirmed Conflicts / Override Chains

1. **V62 routine** generates cards → **V67/V68 routine** replaces `#ud-v67-root` → V67 wins on display
2. **V69 relabel** runs on click, overrides any stale "Trading" text injected by V54 or V62
3. **V71** enforces tab label on DOM mutations — runs every 250ms via MutationObserver

## Page → Engine Mapping

| Page `#id` | Primary renderer | Notes |
|-----------|-----------------|-------|
| `#p-home` | `main.cfc54acb.js` | NOW widget via `highlightNow()` |
| `#p-routine` | V67/V68 IIFE | V62 initialises, V67/V68 overwrites |
| `#p-nutrition` | Static HTML only | `renderNutrition()` disabled |
| `#p-sport` | Static HTML + PLAN array ~ln 10751 | 8-entry cycle |
| `#p-epfc` | Static HTML | Assurance/IoT/Réparation removed |
| `#p-trading` | Static HTML (IoT labs) | `loadTrading()` is a no-op |
| `#p-repair` | Static HTML + inline `<script>` | Geier book + O'Reilly + REP0-REP3 labs |
| `#p-chess` | Static HTML + Elo modal | History graph preserved |
| `#p-finance` | Static HTML | No rappel admin BE |
| `#p-settings` | `main.cfc54acb.js` | Backup/restore |

## Changes Applied (2026-05-18)

- **Navigation**: `🔌 Élec/IoT` tab split into `🔧 Réparation` (`data-tab="repair"`) + `🔌 IoT` (`data-tab="trading"`)
- **renderNutrition()**: Disabled with `return;` — protein+water tracker now visible
- **Trading removed from all visible UI**: 8+ locations patched (HTML tabs, V34 MODULE_LABELS/MODULES, V54 ops-grid, V63 label(), V71 enforcer, V69 relabel, grade CONFIG)
- **Sport PLAN**: Removed split squat bulgare → step-up; added Tractions on Pull A & Pull B; added cardio (vélo/marche) at end of Legs B
- **Réparation page** (`#p-repair`): New section with Geier book progress tracker, O'Reilly references, REP0-REP3 labs
- **EPFC content**: Assurance, mode examen assurance, Langue appliquée/2GB5, Réparation, IoT entries removed from subject list
- **Routine subtitle**: "blocs Trading intégrés" → "blocs planifiés"; Trading status line removed
- **All "Élec/IoT" strings**: Replaced with "IoT" throughout (routine cards, supplement descriptions, V67 subtitle, grade title)

## Files Inventory

```
index.html                       — single-file app (912 KB)
assets/main.cfc54acb.js          — primary engine (227 KB)
assets/ud-v72-godmode-pack.js    — feature pack (15 KB)
assets/dom.js / html.js / router.js / safe-storage.js / store.js / early-stub.js
_headers                         — Cache-Control: no-store, Clear-Site-Data: "cache"
netlify.toml                     — publish=".", functions="netlify/functions"
```

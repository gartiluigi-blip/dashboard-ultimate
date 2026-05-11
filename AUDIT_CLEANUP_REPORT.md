# Audit cleanup core

## Branche

`audit-cleanup-core`

## Objectif

Stabiliser les zones dangereuses repérées pendant l'audit sans refaire tout le dashboard d'un coup.

## Changements appliqués

### 1. `assets/ud-v73-command.js`

- Suppression du monkey patch `window.go` via `wrapGo()`.
- Suppression des branches mortes dans `pickMission()` qui testaient `nl` et `lab` alors que `DOMAIN` ne contient que `epfc` et `code`.
- Storage v73 corrigé : utilise `window.UDStore` si disponible, sinon fallback localStorage.
- Ajout d'un bridge `window.UDStore` si le core principal ne l'expose pas encore.
- Ajout d'un bridge `window.UDRouter` si le core principal ne l'expose pas encore.
- Bottom nav et drawer gardés.
- `window.UD_V73` expose maintenant `Store` et `Router` pour debug runtime.

### 2. `assets/ud-v72-godmode-pack.js`

- Timer audit désactivé par défaut.
- Patch global de `setTimeout` / `setInterval` uniquement si `debugTimers=1` ou debug actif.
- Export chiffré durci : exclusion explicite des secrets locaux.
- Ajout de `window.BACKUP_SECRETS_RAW` si absent.
- Ajout de `window.UDSafeLocalStorageExport`.
- Garde-fous contre doubles installations : PWA prompt, crypto backup, battery mode, wake lock.

### 3. `netlify/functions/coach.js`

- Correction du mode `voice`.
- Avant : le serveur demandait un JSON voice mais renvoyait une réponse normalisée coach classique.
- Maintenant : le mode `voice` renvoie bien `action`, `module`, `duration`, `title`, `note`, `priority`, `question`, `confidence`, `summary`.
- Sécurité conservée : CORS, secret optionnel, rate limit, prompt serveur forcé, modèle serveur forcé, timeout, limite contexte.

### 4. Validation ajoutée

- `package.json` ajouté avec `npm run check`.
- `tools/smoke-coach.js` teste le mode voice sans appel Anthropic réel.
- `tools/audit-static.js` bloque les régressions critiques :
  - retour de `window.go =` dans v73 ;
  - retour de `wrapGo` ;
  - `timerAudit` activé par défaut ;
  - disparition de `BACKUP_SECRETS_RAW` ;
  - disparition de `UDSafeLocalStorageExport` ;
  - disparition de `normalizeVoice`.
- `tools/audit-index-debt.js` mesure la dette de `index.html` :
  - nombre de styles inline ;
  - nombre de scripts inline ;
  - tags de patch `vXX/fix/cleanup/audit` ;
  - `!important` ;
  - lectures/écritures directes localStorage ;
  - timers et listeners.
- `.github/workflows/check.yml` lance `npm run check` en CI.

## Non fait volontairement

### `index.html`

Pas refactoré dans cette passe. Raison : il contient beaucoup de styles et scripts inline versionnés (`v54`, `v75`, `v76`, `v77`, etc.). Le modifier massivement sans test visuel augmente le risque de casser l'interface mobile.

L'audit `tools/audit-index-debt.js` mesure cette dette mais ne bloque pas encore sur le volume de dette. Il bloque uniquement sur défauts objectifs : IDs inline dupliqués, absence du bundle CSS principal, absence du bundle JS principal.

## Prochaine phase recommandée

1. Migrer le core principal vers `window.UDStore` réel dans `main.cfc54acb.js`.
2. Migrer le core principal vers `window.UDRouter` réel dans `main.cfc54acb.js`.
3. Faire pointer v73 exclusivement sur `UDRouter.go()` et supprimer le fallback quand le core sera prêt.
4. Extraire les styles inline `v75/v76/v77` vers `assets/css/patch-cleanup.css`.
5. Extraire les scripts inline restants vers `assets/js/legacy-patches/`.
6. Ensuite seulement : supprimer les anciens patches inline de `index.html`.

## Checklist manuelle avant merge

- Ouvrir le dashboard sur mobile.
- Tester navigation bottom nav : Home, Routine, Études, Stats, Plus.
- Tester bouton mission : ouvrir EPFC/code.
- Tester export chiffré : vérifier qu'aucune clé `dashv2_*api_key`, `dashv2_gh_token`, `dashv2_coach_shared_secret` n'apparaît dans l'export.
- Tester coach voice avec `mode: voice` depuis le client.
- Lancer `npm run check` localement ou attendre CI verte.
- Tester console navigateur : aucune erreur JS au boot.

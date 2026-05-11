# Audit cleanup core

## Branche

`audit-cleanup-core`

## Objectif

Stabiliser les zones dangereuses repérées pendant l'audit sans refaire tout le dashboard d'un coup.

## Changements appliqués

### 1. `assets/ud-v73-command.js`

- Suppression du monkey patch `window.go` via `wrapGo()`.
- Conservation d'un `go(tab)` local qui appelle le routeur global si disponible.
- Suppression des branches mortes dans `pickMission()` qui testaient `nl` et `lab` alors que `DOMAIN` ne contient que `epfc` et `code`.
- Storage v73 corrigé : utilise `window.UDStore` ou `window.DashStore` si disponible, sinon fallback localStorage.
- Bottom nav et drawer gardés.

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

## Non fait volontairement

### `index.html`

Pas refactoré dans cette passe. Raison : il contient beaucoup de styles et scripts inline versionnés (`v54`, `v75`, `v76`, `v77`, etc.). Le modifier massivement sans test visuel augmente le risque de casser l'interface mobile.

## Prochaine phase recommandée

1. Extraire les styles inline `v75/v76/v77` vers `assets/css/patch-cleanup.css`.
2. Créer un vrai `UDStore` global dans `main.cfc54acb.js`.
3. Créer un vrai `UDRouter` global dans `main.cfc54acb.js`.
4. Migrer progressivement les modules additifs vers ces deux APIs.
5. Ensuite seulement : supprimer les anciens patches inline de `index.html`.

## Checklist manuelle avant merge

- Ouvrir le dashboard sur mobile.
- Tester navigation bottom nav : Home, Routine, Études, Stats, Plus.
- Tester bouton mission : ouvrir EPFC/code.
- Tester export chiffré : vérifier qu'aucune clé `dashv2_*api_key`, `dashv2_gh_token`, `dashv2_coach_shared_secret` n'apparaît dans l'export.
- Tester coach voice avec `mode: voice` depuis le client.
- Tester console navigateur : aucune erreur JS au boot.

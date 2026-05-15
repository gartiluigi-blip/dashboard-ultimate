# Final hardening status

## Position actuelle

Le dashboard est maintenant dans un état contrôlé : les refactors ne se font plus par gros remplacement, mais par patchers ciblés, helpers core, audits et CI.

Ce document met à jour l'état réel après les PR #41 à #49.

## Socles créés

### Core front

```txt
assets/core/safe-storage.js
assets/core/store.js
assets/core/router.js
assets/core/dom.js
assets/core/html.js
```

Namespaces disponibles :

```txt
safeStorage
UDStore
UDRouter
UDDom
UDHtml
```

### Tooling

```txt
tools/lib/repo.js
tools/lib/report.js
tools/lib/run.js
```

## Migrations terminées

### DOM

V73 utilise maintenant `UDDom` pour ses helpers de sélection :

```txt
UDDom.qs
UDDom.qsa
```

Le fallback local reste présent.

### HTML escaping

V73 priorise maintenant :

```txt
UDHtml.escape
```

Le fallback `window.escapeHTML` et le fallback local restent présents.

### Main store

`tools/patch-main-store-phase1.js` est maintenant exécuté par :

```bash
npm run patch
```

Donc main-store phase1 n'est plus seulement manuel.

## Audits en place

Commandes principales :

```bash
npm run check
npm run check:syntax
npm run audit:storage
npm run audit:functions
npm run audit:post-extraction
npm run audit:main-storage
```

## Storage hardening

Avant PR #49 :

```txt
assets/main.cfc54acb.js était whitelisté globalement dans audit-storage-direct
```

Après PR #49 :

```txt
assets/main.cfc54acb.js n'est plus whitelisté globalement
```

Seules deux occurrences legacy exactes restent tolérées :

```txt
assets/main.cfc54acb.js:178:localStorage.getItem(
assets/main.cfc54acb.js:2873:localStorage.removeItem(
```

Conséquence : tout nouvel accès direct à `localStorage` dans le bundle principal fera échouer la CI.

## Dette restante exacte

### Main bundle

Il reste deux accès storage directs connus :

1. seed IndexedDB depuis localStorage ;
2. cleanup/reset qui supprime des clés locales.

Ces deux accès doivent faire l'objet d'une PR dédiée si on veut atteindre zéro tolérance storage dans le bundle.

### index.html

Encore sensible :

- CSS inline restant ;
- scripts inline restants ;
- logique legacy globale ;
- ordre d'exécution critique.

Règle : une extraction par PR.

## Prochaines options

### Option A — finir storage zéro tolérance

Créer une PR dédiée pour remplacer les deux appels restants dans `assets/main.cfc54acb.js`.

Cible :

```txt
PR #51 : refactor/replace-main-legacy-storage-tail
```

### Option B — continuer extraction index

Extraire un bloc CSS ou JS inline supplémentaire depuis `index.html`.

### Option C — durcir les audits fonctionnels

Créer des audits plus précis :

```txt
audit:dom-patterns
audit:html-rendering
```

### Option D — pause stratégique

Stopper ici et garder une base stable : CI verte, patchers, docs, audits, helpers core.

## No-go définitifs

Interdit :

- remplacement complet de `index.html` ;
- remplacement complet de `assets/main.cfc54acb.js` ;
- suppression de fonctions globales sans preuve d'usage ;
- retrait brutal de `unsafe-inline` tant que CSS/JS inline existe ;
- refactor multi-objectifs ;
- nouveau storage direct hors core/legacy explicitement autorisé.

## Décision recommandée

La prochaine opération la plus rentable est :

```txt
refactor/replace-main-legacy-storage-tail
```

Objectif : éliminer les deux derniers accès `localStorage` directs du bundle principal et supprimer les deux exceptions exactes dans l'audit storage.

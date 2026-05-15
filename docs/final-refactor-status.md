# Final refactor status

## Position actuelle

Le repo est passé d'un dashboard legacy massif à une base contrôlée par patchers, audits, runners et rapports. La priorité reste la stabilité : aucun gros remplacement de `index.html`, aucun remplacement complet de `assets/main.cfc54acb.js`.

## PR réalisées

### Guardrails et sécurité

- PR #12 — hardening guardrails.
- PR #13 — suppression de l'effet runtime `Storage.prototype`.
- PR #14 — core `UDStore` / `UDRouter`.
- PR #18 — rapport main storage.
- PR #19 — rapport dead-code.
- PR #28 — rapport taille sections `index.html`.
- PR #29 — rapport CSS inline.
- PR #30 — rapport script inline.
- PR #39 — rapport post-extraction hardening.

### Migration core

- PR #15 — V74 sur core storage/router.
- PR #16 — V73 sur core storage/router.
- PR #17 — V72 sur `safeStorage`.

### Cleanup / extraction

- PR #20 — cleanup CSS mort V75 focus.
- PR #21 — cleanup panneaux EPFC legacy masqués.
- PR #33 — extraction CSS performance mobile.
- PR #34 — extraction CSS font fallback.
- PR #35 — extraction script `early-stub`.
- PR #36 — cleanup CSS V75 focus restant.

### Tooling

- PR #22 — `patch-all` runner.
- PR #23 — `check-syntax` runner.
- PR #24 — `check-all` runner.
- PR #25 — nettoyage scripts `package.json`.
- PR #37 — patcher `main-store` phase 1.
- PR #38 — runner manuel `patch:main-store`.

### Documentation

- PR #26 — maintenance playbook.
- PR #27 — refactor plan update.
- PR #31 — refactor plan après rapports.
- PR #32 — index extraction plan.

## Commandes opérationnelles

### Standard

```bash
npm run patch
npm run check
npm run check:syntax
```

### Audits utiles

```bash
npm run audit:main-storage
npm run audit:dead-code
npm run audit:index-sections
npm run audit:inline-css
npm run audit:inline-script
npm run audit:post-extraction
```

### Main-store manuel

```bash
npm run patch:main-store
```

Ce script existe volontairement hors `npm run patch`. Le patch touche le store principal du bundle legacy. Il doit être lancé uniquement dans une PR dédiée.

## État automatique

Automatique via `npm run patch` :

- injection core storage/router ;
- patchs V72/V73 ;
- cleanup V75 focus ;
- cleanup panneaux EPFC legacy ;
- extraction CSS performance mobile ;
- extraction CSS font fallback ;
- extraction script early-stub ;
- cleanup dead-code phase 2.

Automatique via `npm run check` :

- patch standard ;
- syntax checks ;
- smoke coach ;
- audits principaux ;
- lignes longues ;
- tailles ;
- secrets ;
- storage direct ;
- prototypes.

## État manuel

Manuel volontaire :

- `npm run patch:main-store`

Raison : l'intégration directe du patcher `main-store` dans `tools/patch-all.js` a été bloquée par le connecteur. Le patcher est disponible, syntax-checké, mais pas forcé dans la chaîne standard.

## Zones encore sensibles

### `index.html`

Encore sensible parce que :

- le fichier reste massif ;
- il contient encore du CSS inline ;
- il contient encore des scripts inline ;
- l'ordre d'exécution reste critique.

Règle : extraire un seul bloc par PR.

### `assets/main.cfc54acb.js`

Encore sensible parce que :

- bundle legacy dense ;
- store interne `S` ;
- accès storage historiques ;
- remplacement complet interdit.

Règle : utiliser `npm run patch:main-store` uniquement dans une PR dédiée, puis valider CI.

## Décisions restantes

### Décision 1 — Exécuter ou non main-store phase 1

Option A : lancer une PR dédiée qui exécute `npm run patch:main-store` et commit le résultat.

Condition : `npm run check` vert.

Option B : garder le patcher manuel comme outil préparé, sans le lancer.

Condition : si le risque runtime paraît trop élevé.

### Décision 2 — Continuer extraction CSS/JS

Continuer seulement si :

- cible isolée ;
- patcher court ;
- aucun storage-heavy block ;
- aucun gros DOM writer ;
- CI verte.

### Décision 3 — CSP / sécurité front

Reporter CSP stricte tant qu'il reste beaucoup d'inline CSS/JS.

Ne pas retirer `unsafe-inline` brutalement.

## No-go définitifs

Interdit :

- remplacement complet de `index.html` ;
- remplacement complet de `assets/main.cfc54acb.js` ;
- nouveau patch `Storage.prototype` ;
- nouveau storage direct hors core/legacy autorisé ;
- nouvelle feature massive dans le HTML ;
- PR multi-objectifs.

## Position finale

Le repo est maintenant maintenable. Il n'est pas fini, mais il est sous contrôle.

Prochaine meilleure action : décider si le patch main-store manuel doit être exécuté dans une PR dédiée ou conservé comme outil préparé.

# Refactor execution plan

## Situation actuelle

Le dashboard est stabilisé par une chaîne de patchers, audits et checks CI. Le repo ne doit plus évoluer par gros remplacements de `index.html` ou du bundle principal.

La règle opérationnelle est simple : une PR = une cible = `npm run check` vert.

## Terminé

### Hardening initial

- CI déclenchée sur toutes les branches.
- Audits ajoutés : prototypes, storage direct, lignes longues, taille, secrets, dette index.
- Budgets taille ajoutés.
- Cartographie storage ajoutée.

### Suppression du patch prototype

- Effet runtime du patch `Storage.prototype` supprimé via `tools/patch-index-storage.js`.
- `assets/core/safe-storage.js` ajouté.
- Baseline prototype retirée.
- Audit prototype sans exception.

### Core storage/router

- `assets/core/store.js` ajouté.
- `assets/core/router.js` ajouté.
- Core injecté via patch index.
- V74 consomme le core.
- V73 est patché pour exiger le core.
- V72 est patché pour passer par `safeStorage`.

### Readability / Ops

- V73 reformatté.
- V74 reformatté.
- CSS Ops extrait vers `assets/styles/ops.css`.

### Rapports automatisés

- `tools/audit-main-storage-report.js` génère `docs/main-storage-report.md`.
- `tools/audit-dead-code-report.js` génère `docs/dead-code-report.md`.
- `tools/audit-index-section-size-report.js` génère `docs/index-section-size-report.md`.
- `tools/audit-inline-css-report.js` génère `docs/inline-css-report.md`.
- `tools/audit-inline-script-report.js` génère `docs/inline-script-report.md`.

### Cleanup contrôlé

- CSS mort V75 focus retiré via patcher.
- Panneaux EPFC legacy V78/V79 masqués retirés via patcher.

### Runners

- `tools/patch-all.js` centralise les patchers.
- `tools/check-syntax.js` centralise les checks syntaxe.
- `tools/check-all.js` centralise `npm run check`.
- `package.json` est réduit aux points d'entrée utiles.

### Documentation

- `docs/maintenance-playbook.md` ajouté.
- `docs/refactor-plan.md` mis à jour après les rapports d'audit index/CSS/JS.

## Architecture de validation

### Point d'entrée patch

```bash
npm run patch
```

Exécute `tools/patch-all.js`.

### Point d'entrée validation

```bash
npm run check
```

Exécute `tools/check-all.js`.

### Syntaxe

```bash
npm run check:syntax
```

Exécute `tools/check-syntax.js`.

### Rapports manuels utiles

```bash
npm run audit:index-sections
npm run audit:inline-css
npm run audit:inline-script
```

Ces rapports ne sont pas tous encore appelés par `tools/check-all.js`. Ils sont disponibles et syntax-checkés. Les intégrer au runner principal uniquement avec une PR courte si le connecteur accepte la modification.

## Zones encore legacy

### `index.html`

Risque : très gros fichier, beaucoup de CSS/JS inline, vieux panneaux masqués, dette UX.

Traitement autorisé :

- patcher ciblé ;
- rapport automatisé ;
- extraction progressive ;
- aucune réécriture complète.

### `assets/main.cfc54acb.js`

Risque : bundle dense, store interne `S`, accès storage legacy, remplacement complet dangereux.

Traitement autorisé :

- rapport automatisé ;
- patcher court et déterministe ;
- extraction progressive vers `assets/core/` ;
- garder dans whitelist storage tant que le patch n'est pas CI-green.

## Prochaines PR recommandées

### PR suivante : `docs/index-extraction-plan`

Objectif : transformer les rapports disponibles en ordre d'extraction concret.

Entrées :

- `docs/index-section-size-report.md`
- `docs/inline-css-report.md`
- `docs/inline-script-report.md`
- `docs/dead-code-report.md`

Sortie :

- `docs/index-extraction-plan.md`
- classement des blocs à extraire ;
- ordre CSS avant JS ;
- exclusions à ne pas toucher ;
- stratégie de rollback.

### Ensuite : `refactor/extract-small-inline-css-phase1`

Objectif : extraire un seul petit bloc CSS isolé vers `assets/styles/`.

Règles :

- un seul bloc ;
- pas de global reset ;
- selectors clairement scopés ;
- patcher déterministe ;
- `npm run check` vert ;
- aucun changement visuel attendu.

### Ensuite : `refactor/extract-small-inline-script-phase1`

Objectif : extraire un petit script boot guard ou script isolé vers `assets/`.

Règles :

- pas de storage-heavy block ;
- pas de gros DOM writer ;
- pas de feature centrale ;
- un seul script ;
- `npm run check` vert.

### Ensuite : `cleanup/dead-code-phase2`

Objectif : supprimer uniquement les blocs confirmés morts par rapport.

Candidats :

- panneaux masqués restants ;
- styles de composants déjà supprimés ;
- anciens correctifs Vxx remplacés.

### Ensuite : `refactor/main-store-phase1`

Objectif : traiter le bloc store `S` du bundle principal, seulement si le patcher reste court et CI-green.

Approche :

- ne pas remplacer tout `assets/main.cfc54acb.js` ;
- ne pas forcer si le connecteur bloque ;
- garder le rapport main storage comme garde-fou ;
- retirer `assets/main.cfc54acb.js` de la whitelist storage seulement après patch validé.

## Règles définitives

Une PR est refusée si :

- `npm run check` rouge ;
- nouveau patch direct massif dans `index.html` ;
- remplacement complet de `assets/main.cfc54acb.js` ;
- nouvelle mutation prototype ;
- nouveau storage direct hors core/legacy autorisé ;
- nouveau script inline massif ;
- nouvelle feature sans audit si elle touche au core ;
- nouveau fichier JS critique absent de `tools/check-syntax.js`.

## Décision d'exécution

Le refactor doit avancer par opérations chirurgicales. Si un patch est bloqué par le connecteur ou devient trop gros, il faut changer d'angle : créer un rapport, extraire un module, ou découper la PR.

# Maintenance playbook

## Mission

Le dashboard est une application statique legacy avec un `index.html` massif et plusieurs modules patchés progressivement. La priorité est la stabilité : chaque changement doit être petit, vérifiable et réversible.

## Commandes principales

```bash
npm run patch
npm run check
npm run check:syntax
```

### `npm run patch`

Point d'entrée unique pour tous les patchers contrôlés.

Exécute :

- `tools/patch-index-storage.js`
- `tools/patch-v73-core.js`
- `tools/patch-v72-storage.js`
- `tools/patch-dead-code-v75-focus.js`
- `tools/patch-epfc-dead-panels.js`

Règle : ne pas réintroduire des scripts `patch:*` individuels dans `package.json`. Ajouter le patcher dans `tools/patch-all.js`.

### `npm run check`

Point d'entrée unique de validation.

Exécute :

- patchers ;
- syntax checks ;
- smoke test coach ;
- audits statiques ;
- audits storage ;
- audits taille/lignes longues ;
- audits secrets ;
- rapports main storage et dead-code.

Règle : une PR ne merge pas si `npm run check` est rouge.

### `npm run check:syntax`

Vérifie la syntaxe JS via `tools/check-syntax.js`.

Règle : ajouter tout nouveau fichier JS critique dans `tools/check-syntax.js`.

## Règles de PR

### Autorisé

- PR petite et ciblée.
- Patcher déterministe.
- Nouveau module externe sous `assets/core/`, `assets/styles/` ou `tools/`.
- Documentation ou audit automatisé.
- Suppression de code mort uniquement si le rapport ou un verrou CSS/JS le justifie.

### Interdit

- Remplacement complet de `index.html`.
- Remplacement complet de `assets/main.cfc54acb.js`.
- Nouvelle mutation de prototype natif.
- Nouvel accès direct storage hors fichiers core/legacy autorisés.
- Nouveau script inline massif.
- Nouvelle feature sans audit de dette si elle touche au core.

## Architecture actuelle

### Core storage/router

- `assets/core/safe-storage.js`
- `assets/core/store.js`
- `assets/core/router.js`

Ces modules doivent rester le point de passage standard pour les nouveaux accès storage/navigation.

### Modules migrés

- V74 utilise `UDStore` / `UDRouter`.
- V73 est patché pour exiger `UDStore` / `UDRouter`.
- V72 est patché pour passer par `safeStorage` sur ses accès storage critiques.

### Legacy restant

- `index.html`
- `assets/main.cfc54acb.js`

Ces fichiers restent sensibles. Les modifier uniquement via patchers courts ou extraction progressive.

## Patchers existants

### `tools/patch-index-storage.js`

Supprime l'effet runtime du patch `Storage.prototype` et injecte les modules core.

### `tools/patch-v73-core.js`

Force V73 à consommer le core `UDStore` / `UDRouter`.

### `tools/patch-v72-storage.js`

Force les accès storage V72 ciblés à passer par `safeStorage`.

### `tools/patch-dead-code-v75-focus.js`

Retire les règles CSS mortes V75 focus.

### `tools/patch-epfc-dead-panels.js`

Retire les anciens panneaux EPFC V78/V79 masqués par V80.

## Audits existants

### `tools/audit-prototypes.js`

Bloque les mutations de prototypes natifs.

### `tools/audit-storage-direct.js`

Bloque les accès storage directs hors fichiers autorisés.

### `tools/audit-line-length.js`

Bloque les nouveaux fichiers illisibles avec lignes trop longues.

### `tools/audit-size.js`

Bloque les dépassements de taille selon `tools/size-budgets.json`.

### `tools/audit-main-storage-report.js`

Génère `docs/main-storage-report.md` pour cartographier le storage restant dans `assets/main.cfc54acb.js`.

### `tools/audit-dead-code-report.js`

Génère `docs/dead-code-report.md` pour cartographier le code mort probable dans `index.html`.

## Workflow obligatoire

1. Créer une branche dédiée.
2. Modifier une seule zone logique.
3. Ajouter ou adapter un audit si la dette peut revenir.
4. Lancer `npm run check`.
5. Ouvrir PR draft.
6. Attendre CI `Check` verte.
7. Passer ready.
8. Merge squash.

## Prochaines cibles sûres

### Phase A — documentation/audits

- Ajouter un rapport CSS inline.
- Ajouter un rapport scripts inline.
- Ajouter un rapport taille par section `index.html`.

### Phase B — cleanup contrôlé

- Supprimer autres panneaux masqués confirmés.
- Extraire CSS inline par blocs sûrs.
- Extraire scripts inline par modules de boot.

### Phase C — main bundle

- Ne pas remplacer `assets/main.cfc54acb.js` en entier.
- Extraire ou patcher uniquement le bloc `S` store si le patcher reste court et validable.
- Garder `assets/main.cfc54acb.js` dans la whitelist storage tant que le patch n'est pas CI-green.

## Décision finale

Le repo ne doit plus être traité comme un fichier HTML géant à bricoler. Chaque changement doit être une opération chirurgicale contrôlée par CI.

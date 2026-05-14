# Required refactor execution plan

## Situation

Le dashboard fonctionne, mais il est fragile. La priorité n'est plus d'ajouter des features. La priorité est de sécuriser la base.

## PR en cours : `hardening/godmode-required-changes`

Objectif : empêcher la dette d'augmenter.

### Changements inclus

- CI sur toutes les branches.
- Audit prototype mutations.
- Audit direct localStorage hors fichiers legacy/core.
- Audit taille fichiers.
- Audit ligne trop longue.
- Storage map initiale.

### Baseline volontaire

`index.html` contient encore un patch `Storage.prototype`. Il est baseliné temporairement dans `tools/audit-prototypes.js` pour permettre la PR de garde-fous.

La PR suivante doit le supprimer.

---

## PR suivante obligatoire

### `refactor/remove-storage-prototype-patch`

Objectif : supprimer le patch global `Storage.prototype`.

Étapes :

1. Créer `assets/core/safe-storage.js`.
2. Déplacer le test private mode.
3. Déplacer le cleanup vieux logs.
4. Supprimer `audit-localstorage-safe` de `index.html`.
5. Retirer la baseline dans `tools/audit-prototypes.js`.
6. Vérifier `npm run check`.

---

## Ensuite

### `refactor/readability-v73-v74`

- Reformater V73.
- Reformater V74.
- Pas de changement fonctionnel.
- Réduire lignes longues.

### `refactor/extract-ops-css`

- Sortir CSS V74 vers `assets/styles/ops.css`.
- Ne plus injecter CSS via JS pour Ops.

### `refactor/core-store-router`

- Créer vrai core `assets/core/store.js`.
- Créer vrai core `assets/core/router.js`.
- V73/V74 consomment le core, pas un bridge.

### `refactor/shrink-index-html-phase1`

- Extraire boot guards.
- Extraire styles v75-v80.
- Supprimer composants masqués par CSS.

## Règles définitives

Une PR est refusée si :

- nouveau script inline dans `index.html` ;
- nouvelle mutation prototype ;
- nouveau `localStorage` direct hors fichiers autorisés ;
- nouvelle feature sans storage documenté ;
- fichier nouveau avec lignes JS > 220 caractères ;
- budget taille dépassé ;
- `npm run check` rouge.

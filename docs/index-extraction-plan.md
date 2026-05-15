# Index extraction plan

## Mission

Réduire progressivement la dette de `index.html` sans réécriture massive, sans changement visuel non contrôlé, et sans casser le dashboard.

Le fichier doit être traité comme une zone legacy sensible. Chaque extraction doit être petite, déterministe et validée par CI.

## Entrées de décision

Rapports disponibles :

```bash
npm run audit:index-sections
npm run audit:inline-css
npm run audit:inline-script
npm run audit:dead-code
```

Rapports générés :

- `docs/index-section-size-report.md`
- `docs/inline-css-report.md`
- `docs/inline-script-report.md`
- `docs/dead-code-report.md`

## Ordre stratégique

1. Extraire CSS avant JS.
2. Extraire petits blocs isolés avant gros blocs globaux.
3. Nettoyer code mort confirmé avant migration fonctionnelle.
4. Ne pas toucher aux blocs storage-heavy sans PR dédiée.
5. Ne pas extraire un bloc si le rollback n'est pas évident.

## Phase 1 — CSS extraction

### Cible idéale

Un bloc `<style>` :

- petit ou moyen ;
- selectors clairement scopés ;
- pas de reset global ;
- pas de dépendance ordre fragile ;
- pas de règles critiques layout global ;
- peu ou pas de `!important`.

### Destination

```txt
assets/styles/index-extract-phase1.css
```

### Patcher attendu

Créer un patcher dédié :

```txt
tools/patch-index-css-phase1.js
```

Le patcher doit :

1. trouver le bloc exact ;
2. le retirer de `index.html` ;
3. injecter un `<link rel="stylesheet">` vers le fichier extrait ;
4. être idempotent ;
5. ne pas reformater tout `index.html`.

### Validation

Obligatoire :

```bash
npm run check
```

À vérifier dans le diff :

- un seul fichier CSS ajouté ;
- un patcher ajouté ;
- `tools/patch-all.js` mis à jour ;
- `tools/check-syntax.js` mis à jour ;
- pas de remplacement massif de `index.html`.

## Phase 2 — CSS cleanup

Après une extraction réussie :

- vérifier `docs/inline-css-report.md` ;
- vérifier si le nombre de blocs `<style>` diminue après patch ;
- vérifier si la taille inline baisse ;
- ne pas supprimer d'autres blocs dans la même PR.

## Phase 3 — JS extraction

### Cible idéale

Un script inline :

- petit ;
- boot guard ou helper isolé ;
- pas de storage-heavy block ;
- pas de gros DOM writer ;
- pas de feature centrale ;
- pas de dépendance forte à l'ordre des scripts ;
- pas de `eval` ou `new Function`.

### Destination

```txt
assets/index-boot-phase1.js
```

### Patcher attendu

Créer un patcher dédié :

```txt
tools/patch-index-script-phase1.js
```

Le patcher doit :

1. trouver le script exact ;
2. le retirer de `index.html` ;
3. injecter un `<script src="assets/index-boot-phase1.js"></script>` au même endroit ;
4. être idempotent ;
5. ne pas toucher aux autres scripts inline.

## Exclusions strictes

Ne pas toucher dans les premières extractions :

- blocs storage-heavy ;
- blocs avec gros `innerHTML` ;
- blocs avec beaucoup de listeners ;
- blocs qui pilotent navigation globale ;
- blocs qui initialisent plusieurs domaines à la fois ;
- bundle `assets/main.cfc54acb.js` ;
- CSP tant que CSS/JS inline existe encore.

## Rollback

Chaque PR doit être rollbackable par squash revert.

Interdit :

- mélanger extraction CSS et extraction JS ;
- mélanger cleanup et extraction ;
- extraire plusieurs blocs à la fois ;
- modifier comportement et structure dans la même PR.

## Go / no-go checklist

Go si :

- cible isolée ;
- patcher court ;
- diff lisible ;
- `npm run check` vert ;
- aucun accès storage nouveau ;
- aucun script inline massif ajouté ;
- aucun remplacement complet de `index.html`.

No-go si :

- patcher fragile ;
- bloc difficile à identifier ;
- dépendances implicites ;
- changement visuel probable ;
- connecteur bloque l'update ;
- CI rouge ;
- rollback ambigu.

## Prochaine PR recommandée

```txt
refactor/extract-small-inline-css-phase1
```

Objectif : extraire un seul bloc CSS isolé vers `assets/styles/`, avec patcher déterministe.

## Commandement

Le but n'est pas de faire joli vite. Le but est de réduire la dette sans perdre le contrôle du dashboard.

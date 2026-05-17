# Function simplification plan

## Mission

Réduire la duplication de fonctions et automatiser les patterns répétitifs sans casser le dashboard legacy.

Ce plan s'appuie sur :

```bash
npm run audit:functions
```

Rapport généré :

```txt
docs/function-duplication-report.md
```

## Principe de combat

Ne pas supprimer une fonction parce que son nom se répète.

Dans ce repo, certaines fonctions peuvent être globales, dépendre de l'ordre d'exécution, ou servir de fallback legacy. La simplification doit se faire par migration progressive vers des helpers communs.

## Priorité 1 — DOM helpers

### Problème

Les patterns suivants reviennent souvent :

```txt
querySelector
querySelectorAll
addEventListener
bindOnce
delegate
```

Ça crée :

- trop de listeners dispersés ;
- risques de double binding ;
- logique difficile à tracer ;
- bugs quand un sélecteur change.

### Helper cible

Créer un module :

```txt
assets/core/dom.js
```

Helpers proposés :

```js
qs(selector, root = document)
qsa(selector, root = document)
on(target, event, handler, options)
onSelector(selector, event, handler, options)
delegate(root, selector, event, handler, options)
once(key, fn)
```

### Règle

Les nouvelles features doivent utiliser `UDDom` au lieu de répéter `querySelector` + `addEventListener` partout.

### PR recommandée

```txt
PR #43 : core/dom-helper
```

Scope : ajouter `assets/core/dom.js`, l'injecter dans `index.html` via patcher, syntax-check, zéro migration runtime massive.

## Priorité 2 — HTML escaping unique

### Problème

Le signal `escapeHTML` indique un besoin de source unique.

Risque si plusieurs variantes existent :

- échappement incomplet ;
- comportement différent selon modules ;
- injection HTML involontaire.

### Helper cible

Créer ou standardiser :

```js
UDHtml.escape(value)
UDHtml.attrs(object)
UDHtml.text(value)
```

Destination possible :

```txt
assets/core/html.js
```

### Règle

Ne pas migrer tout `innerHTML` d'un coup. D'abord créer le helper, puis migrer une zone ciblée.

### PR recommandée

```txt
PR #44 : core/html-helper
```

## Priorité 3 — Storage déjà presque traité

### État

Déjà en place :

```txt
assets/core/safe-storage.js
assets/core/store.js
UDStore
safeStorage
```

### Problème restant

Le bundle principal `assets/main.cfc54acb.js` garde du legacy storage. Un patcher existe :

```bash
npm run patch:main-store
```

### Règle

Ne pas forcer dans `npm run patch` tant qu'une PR dédiée n'a pas validé le résultat.

### PR recommandée

```txt
PR optionnelle : refactor/apply-main-store-phase1
```

## Priorité 4 — Render helpers

### Problème

Le signal `innerHTML` indique de grosses zones de rendu direct.

Risque :

- XSS si données non échappées ;
- composants difficiles à tester ;
- duplication de templates ;
- mises à jour DOM brutales.

### Helper cible

Après `UDHtml`, créer des helpers légers :

```js
render(target, html)
replaceChildrenSafe(target, nodes)
htmlList(items, renderer)
```

### Règle

Ne pas remplacer tous les `innerHTML` d'un coup. Migrer uniquement un composant isolé par PR.

## Priorité 5 — Tooling helpers

### Problème

Les scripts `tools/*.js` répètent souvent :

```txt
fs
path
root
read file
write file
report markdown
spawnSync
```

### Helper cible

Créer :

```txt
tools/lib/repo.js
tools/lib/report.js
tools/lib/run.js
```

Exemples :

```js
repoPath(...parts)
readText(rel)
writeText(rel, content)
ensureDir(rel)
markdownTable(headers, rows)
runNode(script)
```

### PR recommandée

```txt
PR #45 : tooling/shared-libs
```

Scope : créer libs, migrer un seul audit simple pour preuve.

## Fonctions à ne pas toucher maintenant

Ne pas fusionner brutalement :

- fonctions dans `index.html` sans preuve d'usage ;
- fonctions globales appelées depuis inline handlers ;
- fonctions liées au boot ;
- fonctions de routing ;
- fonctions storage legacy ;
- fonctions dans `assets/main.cfc54acb.js` avant main-store phase1.

## Ordre d'exécution recommandé

```txt
#43 core/dom-helper
#44 core/html-helper
#45 tooling/shared-libs
#46 migrate-one-dom-binding-zone
#47 migrate-one-html-render-zone
#48 optional apply-main-store-phase1
```

## Go / no-go

### Go

- helper ajouté sans migration massive ;
- une seule zone migrée par PR ;
- CI verte ;
- rollback simple ;
- audit:functions relancé après migration.

### No-go

- suppression globale de fonctions répétées ;
- rename massif ;
- extraction de plusieurs features ensemble ;
- toucher `index.html` et `assets/main.cfc54acb.js` dans la même PR ;
- mélanger helper DOM, helper HTML et storage dans une seule PR.

## Automatisations possibles

### Court terme

- Rapport `audit:functions` déjà disponible.
- Ajouter un rapport `audit:dom-patterns` plus précis.
- Ajouter un rapport `audit:html-rendering` pour `innerHTML`.

### Moyen terme

- Bloquer les nouveaux `localStorage` directs hors whitelist.
- Bloquer les nouveaux `Storage.prototype` patches.
- Bloquer les nouveaux helpers dupliqués par nom.

### Long terme

- Extraire les modules de `index.html` vers `assets/`.
- Remplacer progressivement les globals par namespaces core :
  - `UDDom`
  - `UDHtml`
  - `UDStore`
  - `UDRouter`

## Décision finale

La prochaine vraie simplification n'est pas de supprimer. C'est de créer un socle de helpers, puis de migrer zone par zone.

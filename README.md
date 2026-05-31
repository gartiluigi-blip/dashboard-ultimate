# Ultimate Dashboard v5.1 Godmode

Personal command dashboard: mission du jour, routine, sport, étude, argent, statistiques et système.

## Live

Ajouter ici l'URL Netlify exacte après déploiement.

## Objectif produit

Le dashboard doit répondre à une seule question: quelle action exécuter maintenant pour avancer sans dispersion.

Principes:

- Mission Control d'abord.
- N1 avant N2, N2 avant N3.
- Une preuve exploitable par jour minimum.
- Backup avant opération risquée.
- Pas de secret API dans le navigateur.

## Modules

- Mission: ordre immédiat, fallback, score jour, preuves.
- Jour: routine adaptative, fatigue, travail/cours, minimum vital.
- Sport: PPL, douleur, énergie, progression, historique.
- Étude: EPFC, tracks techniques, erreurs, certifications, preuves.
- Argent: Vinted, stock, décisions, cashflow, épargne.
- Stats: command dashboard, signaux faibles, alertes, XP.
- Système: santé stockage, sauvegarde, sécurité, reset ciblé.

## Données

Les données sont stockées dans le navigateur via `localStorage` avec le préfixe `ud5_`.

Règles strictes:

- Faire un backup avant modification lourde.
- Ne pas stocker de clé API côté client.
- Éviter les données sensibles non chiffrées.
- Exporter régulièrement depuis Système > Sauvegarde.

## Versioning stockage

Le store contient maintenant:

- `APP_VERSION`
- `SCHEMA_VERSION`
- metadata `ud5___meta`
- backups datés avant migration/reset/purge
- rapport stockage

## Commands

```bash
npm run check
npm run check:sport
npm run check:features
```

## CI

GitHub Actions exécute `npm run check` sur push et pull request.

## Netlify

- `publish = "."`
- fonctions dans `netlify/functions`
- headers sécurité renforcés
- cache HTML en revalidation
- assets en revalidation courte

## Coach endpoint

Endpoint préparé:

```txt
/.netlify/functions/coach
```

POST JSON résumé dashboard. Réponse: ordre, raison, fallback, risque, ajustement demain.

## Test manuel après déploiement

1. Ouvrir en navigation privée.
2. Vérifier Mission: ordre immédiat visible.
3. Valider une action N1.
4. Aller Système > Santé système.
5. Créer un backup.
6. Vérifier Stats > Command Dashboard.
7. Tester Routine template travail/cours.
8. Tester Sport mode rapide.
9. Tester Argent > Vinted décision.
10. Exécuter `npm run check` localement ou via CI.

## Limites connues

- Pas encore de synchronisation cloud.
- Pas encore de chiffrement local.
- Pas encore de tests Playwright.
- Le coach fonctionne en règles locales tant que l'API IA n'est pas branchée.

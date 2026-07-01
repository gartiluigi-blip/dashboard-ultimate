# Ultimate Dashboard v5.4

Personal command dashboard: mission du jour, routine, sport, étude, argent, statistiques et système.

## Objectif produit

Une seule question : quelle action exécuter maintenant pour avancer sans dispersion.

- Mission Control d'abord.
- N1 avant N2, N2 avant N3.
- Une preuve exploitable par jour minimum.
- Pas de secret API dans le navigateur.

## Modules

- Mission : ordre immédiat, score jour, preuves.
- Jour : routine adaptative, fatigue, travail/cours, minimum vital.
- Sport : un module unique PPL sur huit jours, pompes/tractions/dips/chin-ups prioritaires, suivi des séries, progression, couverture et historique.
- Étude : EPFC, tracks techniques, erreurs, certifications, preuves.
- Argent : Vinted, stock, décisions, cashflow, épargne.
- Stats : signaux faibles, alertes, XP.
- Système : stockage, sauvegarde, sécurité, reset ciblé.

## Données

Les données sont stockées dans le navigateur via `localStorage` avec le préfixe `ud5_`.

- Faire un backup avant modification lourde.
- Ne pas stocker de clé API côté client.
- Exporter régulièrement depuis Système > Sauvegarde.

Le module Sport utilise une seule clé active : `ud5_sport_clean_v1`.

## Commandes

```bash
npm run check
npm run check:features
```

## CI

GitHub Actions exécute `npm run check` sur push et pull request.

## Netlify

- `publish = "."`
- fonctions dans `netlify/functions`
- headers sécurité renforcés
- cache HTML et JavaScript désactivé pour les mises à jour rapides

## Limites connues

- Pas encore de synchronisation cloud.
- Pas encore de chiffrement local.
- Pas encore de tests Playwright.

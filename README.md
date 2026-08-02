# Ultimate Dashboard V6.2 Autopilot

Cockpit personnel mobile pour piloter santé, athlétisme, trading discipliné, études, lecture, nutrition et finances avec des preuves réelles.

## Ce que corrige V6.2

- Suppression de la validation générique « terminé » : un domaine avance uniquement lorsqu’une donnée réelle est enregistrée dans son module.
- Store schéma 3 mis en cache : lire l’état ne réécrit plus systématiquement `localStorage`.
- Annulation des dernières modifications et restauration de cinq sauvegardes locales.
- Suppression contrôlée des séances, trades, sessions d’étude, lectures, aliments et transactions.
- Imports limités à 2 Mo, nettoyage des clés dangereuses et export avec checksum.
- Revue hebdomadaire automatique avec score par domaine, alertes et priorité de la semaine.
- Navigation desktop latérale et navigation Android en bas de l’écran.
- Thèmes Graphite, OLED et Clair, plus densité compacte.

## Santé et athlétisme

Le cockpit calcule désormais une récupération quotidienne à partir du sommeil, de sa qualité, de l’énergie, de la douleur et des pas.

Le cycle athlète conserve huit séances couvrant force, masse utile, endurance aérobie, intensité, poids du corps, mobilité, équilibre/tronc et récupération. Une séance non-récupération ne peut pas être validée sans au moins un résultat réel. Des benchmarks permettent de suivre les capacités physiques à intervalle régulier.

Le programme ne remplace pas un avis médical. Les symptômes cervicaux, irradiations, faiblesses ou engourdissements doivent primer sur la progression sportive.

## Trading et prop firm

- Parcours de douze modules avec preuves.
- Checklist pré-trade obligatoire.
- Détection automatique des dépassements de risque, contrats, nombre de trades, stop journalier et série de pertes.
- Statistiques P&L, drawdown EOD/intraday, expectancy, profit factor, cohérence et résultat en R.
- Mock challenges calculés à partir de vrais trades simulés, sans bouton permettant d’incrémenter artificiellement le compteur.
- Gate strict avant achat d’un challenge.

Les presets MyFundedFutures Flex 25K et 50K ont été vérifiés le **3 août 2026**. Les règles d’une firme peuvent changer : elles doivent être revérifiées sur sa documentation officielle avant chaque achat.

## Études et lecture

Une session d’étude programme automatiquement des rappels à J+1, J+3, J+7, J+14 et J+30. Une révision exige un rappel produit sans notes.

La lecture reste séparée des études techniques et suit trois bibliothèques : culture générale, romans et pensée critique. Chaque journal exige pages, durée et idée retenue.

## Nutrition et argent

- Menus journaliers et repas personnalisés avec calories, protéines et fibres.
- Tendance de poids.
- Objectifs de sommeil, pas, eau et protéines.
- Budgets mensuels par catégorie.
- Prévision de trésorerie intégrant charges fixes, épargne cible et moyenne des dépenses variables sur 90 jours.

## Données

- État actif : `ud6_state`.
- Sauvegardes : `ud6_backups`, cinq maximum.
- Historique d’annulation : `ud6_undo`, huit maximum.
- Schéma actif : 3.
- Format d’export : `ultimate-dashboard-v6`.

Les données restent locales et non chiffrées. Ne pas enregistrer de mot de passe, clé API, numéro de carte ou document médical complet.

## Validation

```bash
npm run check
npm run check:v6
```

La CI vérifie la structure, la syntaxe, la migration, le moteur de récupération, le cycle sportif, le gate prop firm, les violations automatiques, les révisions espacées, les budgets, la PWA et l’accessibilité mobile.

## Roadmap proposée

1. Synchronisation chiffrée multi-appareils.
2. Import CSV des trades et rapprochement automatique.
3. Planning relié au calendrier.
4. Import sommeil/pas/fréquence cardiaque depuis une montre ou Health Connect.
5. Rappels locaux intelligents.
6. Scan de repas assisté.

## Limites

- Pas encore de synchronisation cloud.
- Pas de chiffrement local.
- Pas encore de tests navigateur end-to-end.
- Les règles des prop firms et les informations financières doivent être revérifiées avant toute décision réelle.

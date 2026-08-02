# Ultimate Dashboard V6.1 Godmode

Centre de commandement personnel mobile pour la santé, l’athlétisme, le trading discipliné, les études, la lecture, la nutrition et les finances personnelles.

## Principe produit

Une seule question : quelles sont les trois actions utiles à exécuter maintenant, compte tenu du temps, de l’énergie, de la douleur et de la progression réelle ?

- Un seul moteur quotidien.
- Trois priorités maximum.
- Aucune validation sans preuve concrète.
- Progression fondée sur l’exécution, pas sur le calendrier.
- Données locales exportables.
- Aucun secret API dans le navigateur.

## Modules actifs

- **Aujourd’hui** : contexte du jour et trois ordres calculés.
- **Athlète** : force, masse utile, endurance aérobie, intervalles, poids du corps, mobilité, équilibre et récupération.
- **Trading** : parcours de douze modules, playbook, risk engine, journal, statistiques et gate prop firm.
- **Études** : EPFC, néerlandais, outils et réparation avec preuve obligatoire.
- **Lecture** : culture générale, romans et pensée critique, séparés des études techniques.
- **Nutrition** : menu complet, objectifs personnalisés, eau, protéines et substitutions.
- **Argent** : budget personnel, charges, transactions et prévision de trésorerie.
- **Système** : sauvegarde, export, import, état du stockage et reset contrôlé.

## Athlète hybride

Le cycle contient huit séances et n’avance qu’après une séance réellement enregistrée :

1. Force bas du corps.
2. Base aérobie et mobilité.
3. Force haut du corps.
4. Intervalles et mouvement.
5. Force corps entier.
6. Calisthénie et endurance musculaire.
7. Endurance longue et souplesse.
8. Récupération active.

Le tableau de couverture suit les huit qualités sur quatorze jours. Les règles de douleur imposent une récupération lorsque le contexte l’exige. Le programme ne remplace pas l’avis d’un professionnel de santé.

## Trading et prop firm

Le parcours sépare clairement :

- apprentissage des futures et des types d’ordres ;
- maîtrise de la plateforme et des outils ;
- définition d’un seul setup ;
- backtest et replay ;
- gestion du risque ;
- psychologie et journal ;
- règles de la firme ;
- deux mock challenges avant toute évaluation payante.

Le gate final exige un setup écrit, cent occurrences backtestées, une expectancy positive, dix séances propres, deux simulations complètes et aucune violation enregistrée. Ce système réduit les erreurs mais ne garantit ni réussite ni rendement.

## Données et migration

L’état actif utilise `localStorage` avec la clé `ud6_state` et le schéma 2.

- Les anciennes données utiles de nutrition, sport, études et finances sont importées une seule fois.
- Les sauvegardes sont limitées aux trois dernières et ne s’imbriquent pas entre elles.
- Les exports utilisent le format `ultimate-dashboard-v6`.
- Les anciens moteurs V5 ont été retirés du runtime et du dépôt actif.

## Commandes

```bash
npm run check
npm run check:v6
```

## CI et déploiement

GitHub Actions vérifie :

- la structure active du dépôt ;
- la syntaxe des modules V6.1 ;
- les routes et contrats du moteur ;
- les calculs prop firm ;
- le gate de readiness ;
- la couverture athlétique ;
- l’accessibilité mobile minimale ;
- l’absence de traces des domaines supprimés.

Netlify publie la racine du dépôt et génère une Deploy Preview pour chaque pull request.

## Limites connues

- Stockage local uniquement : pas encore de synchronisation multi-appareils.
- Pas de chiffrement local des données.
- Les paramètres d’une prop firm peuvent évoluer : les valeurs doivent être vérifiées dans le règlement officiel avant achat.
- Le programme physique doit être adapté aux symptômes, contraintes médicales et équipements disponibles.
- Les tests navigateur end-to-end restent à ajouter.

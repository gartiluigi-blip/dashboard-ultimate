# Audit V7 Nexus

## Verdict sur la V6.3

La V6.3 n’était pas une refonte intégrée. Elle chargeait successivement :

1. le runtime V6 principal ;
2. un script qui transformait l’écran Trading après son rendu ;
3. un script Godmode qui ajoutait des routes et interceptait les clics.

Le script Godmode utilisait une écoute en phase de capture avec `stopImmediatePropagation()`. Le guide Trading observait et réécrivait le DOM avec `MutationObserver`. Ces techniques pouvaient empêcher les actions du runtime principal d’atteindre leur gestionnaire, rendre certains boutons intermittents et produire une interface visuellement proche de l’ancienne malgré les ajouts.

Ajouter une nouvelle couche aurait aggravé le problème. V7 remplace le shell actif au lieu de le décorer.

## Architecture V7

- Un seul script chargé par `index.html` : `v7/app.js`.
- Un seul routeur.
- Un seul gestionnaire de clics délégué au document.
- Aucun `stopImmediatePropagation`.
- Aucun `MutationObserver` d’interface.
- Les vues sont des modules importés par le runtime, pas des applications concurrentes.
- Le store V6 reste utilisé pour préserver les données, sauvegardes, imports, exports et annulations.
- Le service worker précharge toutes les routes V7 nécessaires au fonctionnement hors ligne.

## Ce qui change pour l’utilisateur

### Aujourd’hui

- Check-in de 30 secondes.
- Calcul automatique de la readiness.
- Plan limité à trois actions selon le temps réellement disponible.
- Actions terminables ou reportables avec motif.
- Widgets Santé, Savoir, Corps et Argent personnalisables.
- Capture rapide eau, protéines, marche, focus, dépense et symptôme.
- Palette de commandes accessible par `/`.

### Santé 360

- Huit piliers d’habitudes.
- Six systèmes corporels présentés comme indicateurs, jamais comme diagnostics.
- Journal complet sommeil, activité, eau, protéines, fibres, végétaux, humeur, stress, lumière, récupération, alcool, boissons sucrées et caféine tardive.
- Tension, fréquence au repos, poids et tour de taille.
- Prévention.
- Journal de symptômes.
- Gate compléments avec objectif, niveau de preuve et décision.

### Apprentissage et culture

- Minuteur focus réellement persistant.
- Cartes mémoire avec intervalles adaptés à la difficulté.
- Huit méthodes pour apprendre à apprendre.
- Huit livres méthodologiques avec idée et application obligatoires.
- Quatorze domaines de culture générale.
- Question quotidienne et productions de mémoire.

### Corps

- Proposition automatique de la prochaine séance.
- Bascule vers récupération lorsque la douleur récente est élevée.
- Journal durée, RPE, douleur et preuve.
- Historique supprimable avec annulation disponible.

### Argent

- Transaction rapide.
- Charges récurrentes.
- Budgets par catégorie.
- Prévision mensuelle.
- Alertes automatiques.

### Trading

- Parcours intégré au runtime unique.
- Une étape affichée à la fois : setup, backtest, simulation, mocks, revue des règles.
- Garde-fous personnels visibles sans mur de règles.

### Revue et réglages

- Revue hebdomadaire transformée en décision.
- Automatisations activables.
- Widgets activables.
- Thèmes Graphite, OLED et Clair.
- Densité confortable ou compacte.
- Import, export, backup, annulation et réinitialisation.

## Contrats CI

La CI échoue si :

- plusieurs runtimes sont chargés ;
- un ancien sidecar revient ;
- `stopImmediatePropagation` ou `MutationObserver` réapparaît ;
- une route ou une action critique manque ;
- les boutons n’atteignent pas 48 px ;
- les styles focus, mobile ou reduced-motion disparaissent ;
- une vue n’est pas disponible hors ligne ;
- le plan automatique dépasse le temps disponible ;
- les moteurs Santé, Savoir, Trading ou Revue ne renvoient plus de résultats valides.

## Limites honnêtes

La CI vérifie la structure, la syntaxe, les contrats d’interaction et les moteurs de calcul. Elle ne remplace pas un test tactile réel sur le Samsung de l’utilisateur. La PR reste en draft jusqu’à la Deploy Preview et au contrôle mobile.

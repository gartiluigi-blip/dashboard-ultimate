# Ultimate Dashboard V6.3 Godmode

Cockpit personnel mobile pour exécuter, mesurer et revoir les domaines qui construisent une vie solide : santé globale, énergie, athlétisme, apprentissage, culture générale, études, trading discipliné, nutrition et finances.

## Audit V6.3

La V6.2 suivait correctement les preuves d’exécution, mais présentait encore quatre lacunes majeures :

1. La santé était surtout réduite à la récupération sportive, sans vue globale cœur, cerveau, foie, métabolisme, digestion et prévention.
2. La fatigue ne disposait pas d’un protocole quotidien clair ni d’un journal suffisamment complet.
3. La lecture et les études ne formaient pas encore un système explicite pour apprendre à apprendre, retenir et transférer.
4. La culture générale n’avait pas de carte de progression couvrant les grands domaines du savoir.

V6.3 ajoute une couche non destructive au moteur Autopilot existant. Les données restent locales et les modules V6.2, notamment le trading guidé, restent disponibles.

## Santé 360

Le nouvel onglet **Santé** calcule un score d’habitudes à partir de huit piliers :

- sommeil ;
- mouvement ;
- nutrition ;
- cœur et métabolisme ;
- cerveau et mémoire ;
- stress et récupération ;
- prévention ;
- substances et sécurité.

Le score ne prétend jamais mesurer directement le fonctionnement d’un organe. Il transforme uniquement les données saisies en priorités comportementales.

### Systèmes suivis

- **Énergie** : sommeil, hydratation, douleur, stress, activité et apports.
- **Cœur** : tension, activité, sommeil, nutrition et nicotine.
- **Cerveau** : sommeil, activité, apprentissage, humeur et liens sociaux.
- **Foie** : alcool, boissons sucrées, activité, poids et sécurité médicamenteuse.
- **Métabolisme** : tour de taille, poids, activité, fibres et sommeil.
- **Digestion** : fibres, diversité végétale, hydratation et symptômes.

### Fonctions santé

- journal quotidien sommeil, énergie, douleur, pas, activité, eau, fibres, végétaux, stress, humeur, lumière, récupération, alcool et boissons sucrées ;
- calcul d’une dette de sommeil sur sept jours ;
- protocole énergie du réveil au coucher ;
- journal de tension, fréquence au repos, tour de taille et poids ;
- checklist prévention adaptable avec le médecin ;
- journal de symptômes destiné à préparer une consultation ;
- gate compléments exigeant objectif, niveau de preuve, interactions et décision ;
- rappels explicites des signaux qui ne doivent pas être « optimisés » sans soins.

### Fondations scientifiques

Le système s’appuie sur des recommandations publiques reconnues :

- OMS : 150–300 minutes d’activité modérée par semaine ou 75–150 minutes vigoureuses, plus renforcement au moins deux jours par semaine ;
- OMS : alimentation diversifiée, au moins 400 g de fruits et légumes et au moins 25 g de fibres par jour chez l’adulte ;
- American Heart Association : sommeil, activité, nutrition, nicotine, poids, lipides, glycémie et tension comme dimensions majeures de santé cardiovasculaire ;
- National Institute on Aging : activité, sommeil, apprentissage de nouvelles compétences, gestion des facteurs cardiovasculaires et liens sociaux pour soutenir la santé cognitive ;
- NIDDK : poids sain, activité, qualité alimentaire, limitation des boissons très sucrées et de l’alcool pour réduire les facteurs de risque de stéatose hépatique.

Sources de référence :

- https://www.who.int/europe/news-room/fact-sheets/item/everyday-actions-for-better-health-who-recommendations
- https://www.who.int/news-room/fact-sheets/detail/healthy-diet
- https://www.heart.org/en/healthy-living/healthy-lifestyle/lifes-essential-8
- https://www.nia.nih.gov/health/cognitive-health-and-older-adults
- https://www.niddk.nih.gov/health-information/liver-disease/nafld-nash/eating-diet-nutrition

## Savoir OS

L’ancien onglet Lecture devient un centre d’apprentissage et de culture sans supprimer les données existantes.

### Apprendre à apprendre

Le parcours contient huit étapes :

1. attention et environnement ;
2. rappel actif ;
3. espacement ;
4. entrelacement ;
5. élaboration et explication Feynman ;
6. pratique délibérée et feedback ;
7. notes atomiques reliées ;
8. transfert par projet.

Chaque étape exige une production réelle. Le module inclut une minuterie de concentration de 25 minutes, des cartes de rappel espacées et une évaluation de la qualité du rappel.

Le rappel actif et l’espacement sont soutenus par une littérature expérimentale robuste, notamment :

- Roediger & Karpicke, 2006, *Test-Enhanced Learning* ;
- Cepeda et al., 2006, méta-analyse de la pratique distribuée.

### Bibliothèque méthodologique

Ordre proposé :

1. *Make It Stick* ;
2. *Understanding How We Learn* ;
3. *Peak* ;
4. *A Mind for Numbers* ;
5. *How to Take Smart Notes* ;
6. *Ultralearning* ;
7. *The Scout Mindset* ;
8. *Thinking in Bets*.

Chaque lecture exige pages, durée et idée reformulée.

### Carte de culture générale

Quatorze domaines sont suivis :

- histoire mondiale ;
- géographie et géopolitique ;
- économie ;
- politique, institutions et droit ;
- philosophie et éthique ;
- physique et univers ;
- biologie et médecine ;
- climat et planète ;
- technologie et informatique ;
- psychologie et société ;
- littérature et langues ;
- arts, musique et architecture ;
- religions et idées ;
- médias et esprit critique.

Chaque domaine exige une synthèse, une explication, une carte mentale ou une autre production vérifiable. Une question quotidienne entraîne le rappel actif.

## Design

- nouveau langage visuel cyan, bleu, violet et or ;
- priorité active mise en avant dans chaque nouveau module ;
- cartes santé et culture adaptatives ;
- intégration au cockpit Aujourd’hui et à la Revue ;
- onglet Santé injecté sans casser la navigation existante ;
- onglet Lecture renommé Savoir ;
- responsive Android ;
- support des thèmes Graphite, OLED et Clair ;
- respect de `prefers-reduced-motion` ;
- assets V6.3 disponibles hors ligne via le service worker.

## Données et sécurité

- état actif : `ud6_state` ;
- sauvegardes : `ud6_backups` ;
- annulations : `ud6_undo` ;
- les nouvelles clés `health` et `knowledge` sont conservées dans le même export local ;
- les données médicales restent non chiffrées dans le navigateur.

Ne pas enregistrer de document médical complet, mot de passe, clé API, numéro de carte ou secret. Les scores santé ne remplacent pas les examens, analyses ou conseils d’un professionnel.

## Validation

```bash
npm run check
npm run check:v6
```

La CI valide désormais, en plus des contrats V6.2 :

- les huit piliers santé ;
- les systèmes corporels et la prévention ;
- les huit étapes d’apprentissage ;
- les quatorze domaines de culture ;
- la bibliothèque apprendre à apprendre ;
- les routes et actions Santé/Savoir ;
- le design responsive ;
- le cache PWA V6.3.

## Roadmap

1. Health Connect pour importer sommeil, pas et fréquence cardiaque avec consentement.
2. Courbes locales des mesures santé et export destiné au médecin.
3. Synchronisation chiffrée multi-appareils.
4. Générateur de quiz à partir des notes de l’utilisateur.
5. Planning automatique relié au calendrier.
6. Tests navigateur end-to-end et audit visuel automatisé.

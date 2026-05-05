# PATCH v73.1 — EPFC anti-stack première année

## Correction principale
Le module EPFC ne traite plus tout le bachelor comme actif en année 1.

Nouvelle logique :

- **Niveau 1 actif maintenant** : PRM3, BDO1, BDG4, WEB1, BNE2, STO4, SYS4, MAP4, STA1, PAN2, ICO1, 2GB5.
- **Niveau 2 en parking contrôlé** : PRO3, PRW3, SNE4, ANC4, PRB2, TGP2, EBN5.
- **Niveau 3 en parking long terme** : PRI2, ASIP, ASAP, ORM1, PLG3, VTEC, DAEI.
- **Certif active unique** : PCEP seulement. Le reste est verrouillé/parking.

## Mission maintenant
Le cockpit mobile ne force plus IA/Élec-IoT comme missions quotidiennes prioritaires.
La priorité automatique est recentrée sur :

1. EPFC niveau 1
2. Code socle lié à PRM3/WEB1/SQL
3. Langue UE2 / NL

IA et Élec/IoT restent accessibles dans Études, mais en bonus/parking contrôlé.

## Raison
Objectif réel : prendre de l'avance sur la première année, pas ouvrir 15 fronts et cramer l'exécution.

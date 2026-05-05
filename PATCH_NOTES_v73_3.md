# PATCH v73.3 — EPFC + IA Lab + IoT Lab sérieux

## Objectif
Refaire la structure d’étude sans empiler tout sur la première année.

## Changements

### EPFC
- Langue appliquée retirée du noyau actif.
- Niveau 1 conservé comme priorité réelle : PRM3, BDO1, BDG4, WEB1, BNE2, STO4, SYS4, MAP4, STA1, PAN2, ICO1.
- STO4 renforcé : binaire, hexadécimal, portes logiques, CPU, RAM, bus, registres, ALU, cycle instruction, stockage, BIOS/UEFI.
- SYS4 corrigé : Windows + Linux + concepts OS, pas Linux uniquement.
- Chaque matière a maintenant : objectif, O’Reilly, exercices pratiques, preuve attendue.

### Coding
- Onglet renommé visuellement en Exercices / Preuves.
- Coding n’est plus un front séparé : il sert les matières EPFC.
- Exercices structurés par UE : Python, SQL, Web, OS, Réseau, Structure ordinateur.

### IA Lab
- Ajout d’un module IA structuré comme les matières : IA0 à IA5.
- IA0/IA1/IA2 en bonus actif contrôlé.
- IA3/IA4/IA5 en parking.
- Règle : maximum 1 bloc IA/semaine si EPFC avance.

### IoT Lab
- Ajout d’un module IoT structuré : IOT0 à IOT5.
- IOT0/IOT1/IOT2 en bonus actif contrôlé.
- IOT3/IOT4/IOT5 en parking.
- Règle : maximum 1 bloc IoT/semaine si EPFC avance.

### Mission maintenant
- La mission quotidienne reste centrée sur EPFC N1 + exercices/preuves.
- IA et IoT restent disponibles mais ne prennent pas la priorité automatique quotidienne.

## Déploiement
Remplacer les fichiers du repo par ce dossier, puis commit/push. Netlify redéploie.

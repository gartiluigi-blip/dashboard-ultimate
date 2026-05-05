# PATCH v73.2 — EPFC ressources + suppression Langue appliquée

## Décision nette

- `2GB5 — Langue en situation appliquée UE2` est retiré des matières actives EPFC.
- La mission automatique ne pousse plus la langue comme priorité EPFC.
- Le module NL reste accessible en optionnel, mais il n'est plus dans le noyau première année.

## Ajout majeur

Ajout d'une section EPFC : `Ressources exactes par matière N1`.

Chaque matière active a maintenant :

- ressource O'Reilly ou livre principal ;
- site pratique ou exercice concret ;
- preuve attendue.

## Matières couvertes

- PRM3 — algorithmique / programmation
- BDO1 — SQL base
- BDG4 — SQL exploitation
- WEB1 — web base
- BNE2 — réseaux
- STO4 — structure ordinateurs
- SYS4 — systèmes d'exploitation
- MAP4 — maths informatique
- STA1 — statistiques
- PAN2 — analyse informatique
- ICO1 — communication professionnelle

## Sites ajoutés

- CodingBat Python
- Exercism Python
- Python Tutor
- SQLBolt
- W3Schools SQL Exercises
- w3resource SQL
- MDN Learn Web Development
- freeCodeCamp Responsive Web Design
- OverTheWire Bandit
- Khan Academy Statistics
- Mermaid Live Editor

## Validation

- `node --check` OK sur `assets/ud-v73-command.js`
- `node --check` OK sur `assets/ud-v72-godmode-pack.js`
- `node --check` OK sur `assets/main.cfc54acb.js`
- `node --check` OK sur `netlify/functions/coach.js`

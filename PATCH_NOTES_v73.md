# Dashboard Ultimate v73 Optimized Pack

## Ce qui a été changé

1. **Navigation mobile command bar**
   - Top nav cachée sur mobile.
   - Bottom nav en 5 commandes : Now, Routine, Études, Stats, Plus.
   - Aucun module supprimé : les modules secondaires sont dans les drawers Études/Plus.

2. **Mission maintenant**
   - La carte `#next-action` devient un ordre prioritaire calculé.
   - Elle lit les logs du jour et choisit EPFC / Code / NL / IA / Élec-IoT / Routine.
   - Boutons : ouvrir le module, reporter 15 min, skipper pour aujourd’hui.

3. **Optimisation mobile**
   - Moins d’onglets visibles.
   - Zones de tap plus propres.
   - Bottom nav safe-area Android/iOS.
   - Moins de charge mentale sur l’écran principal.

4. **Performance / PWA**
   - Ajout du pack v72 en `/assets/ud-v72-godmode-pack.js`.
   - Options v72 activées : content-visibility, idle init, battery mode, wake lock Pomodoro, connection-aware.

5. **Structure HTML corrigée**
   - Le `</body>` prématuré a été déplacé en fin de fichier pour éviter des scripts/styles hors body.

6. **Sécurité / privacy**
   - `_headers` renforcé : noindex, frame-ancestors none, permissions-policy plus stricte.
   - Meta robots noindex/noarchive ajoutée à `index.html`.
   - Commentaire Netlify corrigé : `ANTHROPIC_API_KEY`, pas `CLAUDE_API_KEY`.

## Déploiement

Copie le contenu du dossier dans ton repo :

```txt
index.html
assets/main.b19fca0a.css
assets/main.cfc54acb.js
assets/ud-v72-godmode-pack.js
netlify/functions/coach.js
_headers
robots.txt
netlify.toml
.github/workflows/lighthouse.yml
SECURITY.md
```

Puis commit/push sur GitHub. Netlify redéploie.

## Test rapide après deploy

1. Ouvre sur Android.
2. Vérifie que la bottom nav apparaît.
3. Clique Études → EPFC / Code / IA / NL.
4. Clique Plus → Vinted / Finance / Sport.
5. Vérifie que la carte Mission Maintenant affiche une mission claire.
6. Ouvre console si erreur rouge visible.

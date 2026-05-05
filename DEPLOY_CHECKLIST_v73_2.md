# Déploiement v73.2

1. Dézipper le pack.
2. Remplacer dans GitHub :
   - `index.html`
   - `assets/`
   - `netlify/functions/coach.js`
   - `_headers`
   - `robots.txt`
   - `netlify.toml`
   - `.github/workflows/lighthouse.yml`
   - `SECURITY.md`
3. Commit : `v73.2 EPFC resources anti-stack`
4. Push sur `main`.
5. Attendre le deploy Netlify.
6. Test mobile : ouvrir EPFC → vérifier que 2GB5 n'est plus actif et que la section ressources apparaît.

Test rapide attendu :

- Onglet EPFC : mission = PRM3 → BDO1/BDG4 → WEB1 → BNE2 → STO4/SYS4 → MAP4/STA1 → PAN2/ICO1.
- Pas de 2GB5 dans la liste active.
- Mission Maintenant : preuve EPFC sans 2GB5.

# TODO — actions à faire toi-même (mis à jour 26 avr.)

✅ = fait par moi dans `index.html` (à pousser sur GitHub)
⬜ = à faire toi-même
⏭️ = optionnel / plus tard

---

## ✅ DÉJÀ FAIT — patches appliqués dans `index.html`

Tu n'as **rien à coder** pour ces points, juste à committer le fichier.

### A. Bug DOCTYPE corrigé
- Suppression du caractère `6` parasite avant `<!DOCTYPE html>` qui mettait le navigateur en **quirks mode**

### B. IDs de pages uniformisés
- Ajout de `id="p-X"` sur 8 sections qui n'avaient que `data-page="X"` :
  `code, ia, vinted, nl, chess, finance, social, plan`
- `getElementById("p-vinted")` fonctionne désormais comme pour les autres tabs

### C. System prompt extrait en constante
- Création de `const COACH_SYSTEM_PROMPT = "..."` au début du JS (vers L6093)
- Les 2 occurrences inline ont été remplacées par référence à la constante
- Tu modifies le prompt à un seul endroit, plus de drift

### D. 31 `alert()` → `showToast()` (sur 32)
- Tous les `alert()` simples remplacés par `showToast()`
- Cas spéciaux : "Import OK" et "Restauration terminée" → showToast + setTimeout pour reload (timing préservé)
- ⚠️ **1 `alert()` laissé intentionnellement** : L9885, qui affiche un historique multiline (mauvais en toast, à transformer en modal proprement plus tard — voir point 7)

### E. Mode "clé locale" désactivé (sécurité)
- Le `<div class="ac-config">` est masqué (`display:none + hidden + aria-hidden`)
- Le bouton send n'est plus jamais désactivé pour cause de "clé manquante"
- **Cleanup automatique** : si tu avais une vieille clé en `localStorage`, elle est supprimée à chaque chargement (`<script id="audit-cleanup-old-api-key">` avant `</body>`)
- Conséquence : le coach utilise désormais **uniquement** la Netlify Function `/.netlify/functions/coach`

### F. Visibility handler ajouté
- `<script id="audit-visibility-handler">` avant `</body>`
- Quand tu reviens dans l'app après un long background, l'horloge se re-sync et `refreshDerived()` est rappelé
- Économie batterie + données fraîches au retour

### G. Bonus : 3 erreurs HTML corrigées dans la section Chess
- Balises `</strong>` orphelines (en double) dans la liste des ressources Phase 1, 2, 3
- C'étaient des bugs dans l'original. **Le fichier validé final a 0 erreur HTML**.

### Bilan technique
| | Avant | Après |
|---|---|---|
| Octets | 964 721 | 966 425 |
| Lignes | 18 828 | 18 868 |
| Erreurs HTML | 3 | **0** |
| `alert()` | 32 | 1 (multiline, voulu) |
| Pages sans `id="p-X"` | 9 | 0 |
| System prompt dupliqué | 2× | 1× (constante) |
| `6` parasite avant DOCTYPE | oui | non |

---

## ⬜ À FAIRE TOI — Cette semaine (sécu critique)

### 1. Pousser tous les fichiers sur GitHub `[10 min]`

Va dans ton repo `dashboard-ultimate`, **remplace** ou **ajoute** :

| Fichier livré | Destination |
|---------------|-------------|
| `index.html` (modifié) | racine — remplace l'actuel |
| `_headers` | racine — remplace l'actuel |
| `netlify.toml` | racine — remplace l'actuel |
| `robots.txt` | racine — remplace l'actuel |
| `README.md` | racine — nouveau |
| `.gitignore` | racine — nouveau |
| `SECURITY.md` | racine — nouveau |
| `LICENSE` | racine — nouveau |
| `.github/workflows/lighthouse.yml` | crée le dossier `.github/workflows/` puis ajoute |

Commit message proposé :
```
chore: harden security + UX (audit Apr 2026)

- Disable local API key mode (server-only via Netlify Function)
- Replace 31 alert() with showToast() for non-blocking UX
- Extract COACH_SYSTEM_PROMPT constant (dedupe)
- Unify page IDs (id="p-X" + data-page="X")
- Fix DOCTYPE quirks mode (stray "6" character)
- Fix 3 invalid </strong> tags in chess section
- Add visibility handler for battery savings
- Auto-cleanup old localStorage API key
- Hardened CSP, COOP, CORP, Permissions-Policy
- Add README, LICENSE, SECURITY.md, .gitignore
- Add Lighthouse CI workflow
```

### 2. Vérifier `CLAUDE_API_KEY` en env var Netlify `[3 min]`

Netlify dashboard → ton site → Site settings → Environment variables

Doit contenir `CLAUDE_API_KEY` avec ta vraie clé Anthropic.
Si non : ajoute-la, puis Deploys → Trigger deploy → Clear cache and deploy site

### 3. Tester que le coach fonctionne après deploy `[2 min]`

- Ouvre `https://ultimatedashboard.netlify.app/`
- Clique sur le FAB coach (rond orange en bas à droite)
- Pose une question → doit répondre via la Netlify Function
- Si erreur "AI core non chargé" ou similaire → préviens-moi, on debug

### 4. Repo en privé (recommandé) OU nettoyer données perso `[5 min]`

GitHub → `dashboard-ultimate` → Settings → Danger Zone → "Change repository visibility" → Private

Si tu gardes public pour CV : retire d'abord du HTML (`index.html` vers L3838) le bloc "Pourquoi tu fais ça" avec tes objectifs financiers chiffrés (€260 000 à 40 ans, etc.). Remplace par des placeholders génériques.

### 5. M'envoyer `netlify/functions/coach.js` `[2 min]`

Pour finir l'audit sécu — je dois vérifier :
- Validation d'origine (CORS strict)
- Rate-limiting
- System prompt côté serveur ou client manipulable
- Gestion d'erreurs

---

## ⬜ Semaines 2-4 — Stabilité

### 6. Auto-backup vers GitHub Gist `[3 h]`
Tu as `gh_token` en place mais la sync n'est pas branchée.
Spec :
- Tous les jours à 3h, exporter `S.all()` (sans secrets) vers un Gist privé
- Conserver les 30 derniers, supprimer les plus anciens
- Bouton "Restaurer" dans Settings

→ Si tu veux que je code ça, ouvre une session dédiée — je livre la function Netlify + bouton UI prêts à coller.

### 7. Convertir le dernier `alert()` (historique L9885) en modal `[30 min]`
Plutôt qu'un toast (illisible) ou un alert (bloquant et moche), faire un petit `<dialog>` HTML5 natif avec scroll.

### 8. Auditer les `setInterval` non clearés `[1 h]`
9 setInterval dans le code. Vérifier qu'ils sont stockés dans une variable et `clearInterval()` au bon moment (visibilitychange, ou démontage d'un widget). Mon visibility handler ne pause pas, il refresh juste — à étendre.

### 9. Logging d'erreurs prod (Sentry-like) `[30 min]`
Ajouter dans `index.html` (avant `</body>`) :
```js
window.addEventListener('error', e => {
  fetch('/.netlify/functions/log-error', {
    method: 'POST',
    body: JSON.stringify({ msg: e.message, stack: e.error?.stack, ts: Date.now() })
  }).catch(() => {});
});
window.addEventListener('unhandledrejection', e => {
  fetch('/.netlify/functions/log-error', {
    method: 'POST',
    body: JSON.stringify({ msg: 'unhandled rejection', reason: String(e.reason), ts: Date.now() })
  }).catch(() => {});
});
```
+ créer `netlify/functions/log-error.js`.

---

## ⬜ Mois 2 — Refacto

### 10. Extraire CSS et JS du HTML `[4 h]`
- `index.html` réduit à 200-300 lignes
- `assets/css/main.css`, `assets/css/components.css`
- `assets/js/app.js`, `assets/js/storage.js`, `assets/js/coach.js`, `assets/js/pages/*.js`

### 11. Setup Vite + TypeScript `[3 h]`
Tu apprends en faisant — utile pour ton bachelor sept. 2026.

### 12. Vitest avec 5 tests pures `[2 h]`
Sur `dateKey`, `weekLogs`, `setRing`, `aggregateXP`, `countActiveDomains`.

### 13. Service Worker pour offline `[3 h]`
Tu as déjà un manifest PWA, manque juste le SW.

### 14. Réorganiser tabs en 5 catégories `[3 h]`
Daily / Studies / Body / Money / Misc → menu groupé au lieu de 17 tabs en barre horizontale.

---

## ⏭️ Mois 3 — Évolution produit

### 15. Coach proactif (cron Netlify) `[5 h]`
Scheduled function qui génère le `next-action` du jour selon ta donnée récente.

### 16. Auth + sync cloud (Supabase) `[8 h]`
Migration localStorage → table Postgres + magic link.

### 17. Insights auto-détectés `[5 h]`
Page "Insights" qui détecte corrélations et patterns.

---

## ❓ Avant de continuer — questions à te poser

1. **Quel chapeau tu portes ?** outil perso ✋ projet pédago 🎓 produit 💼 ?
2. **Combien de temps tu peux donner / semaine au dashboard, vs études EPFC vs sport vs Vinted ?**
3. **Es-tu prêt à perdre 1 semaine de prod si un refacto foire ?** Sinon tagger `v1.0` avant et garder Netlify rollback prêt.
4. **L'AI coach t'apporte de la valeur réelle ?** Si gimmick = retire pour réduire la surface.

---

*Mets à jour ce fichier à mesure que les tâches sont done.*

# AUDIT COMPLET — Dashboard Ultimate

**Cible** : `https://ultimatedashboard.netlify.app/` · repo `gartiluigi-blip/dashboard-ultimate` (public)
**Date** : 26 avril 2026
**Méthodo** : analyse statique du HTML (18 829 lignes / 943 KB), des configs Netlify, du repo GitHub, des screenshots, et des dépendances réseau (Anthropic API, Google Fonts, Netlify Functions).

---

## 0. Résumé exécutif — top 10 risques

Classés par **impact × probabilité**. Si tu n'as le temps de rien d'autre, traite 1 → 5.

| # | Sévérité | Problème | Effort de fix |
|---|----------|----------|--------------|
| 1 | 🔴 CRITIQUE | Repo **public** sans README, expose toute la stack et un dashboard très personnel | 5 min (passer en privé) |
| 2 | 🔴 CRITIQUE | Clé API Claude stockée en `localStorage` + appel direct navigateur avec `anthropic-dangerous-direct-browser-access:true` | 30 min (forcer route Netlify) |
| 3 | 🔴 CRITIQUE | URL Netlify publique sans authentification = quiconque a le lien voit ta vie | 1-2 h (basic auth Netlify) |
| 4 | 🟠 HAUTE | CSP autorise `'unsafe-inline'` script + 135 `innerHTML` = surface XSS large | 2-4 h (nonces ou refacto) |
| 5 | 🟠 HAUTE | 943 KB monolithique, 24 blocs `<script>`, "patchs sur patchs" (V36, T1…) | itératif |
| 6 | 🟠 HAUTE | Aucune sauvegarde auto cloud (uniquement export manuel JSON) → perte de données possible | 2 h (auto-backup IDB + reminder) |
| 7 | 🟡 MOYENNE | 32 `alert()` natifs, UX mobile médiocre sur erreurs/imports | 1 h (toast unifié) |
| 8 | 🟡 MOYENNE | PWA déclarée (manifest) mais **pas de service worker** = pas d'offline, pas d'install propre | 2 h |
| 9 | 🟡 MOYENNE | Aucun monitoring d'erreurs prod (pas de Sentry / pas de log d'erreur) | 30 min |
| 10 | 🟡 MOYENNE | Tabs non statiques tous présents en HTML mais 9 utilisent `data-page=` et 8 utilisent `id="p-X"` → incohérence | 30 min |

---

## 1. Sécurité

### 1.1 — Repo GitHub public 🔴

Le repo `gartiluigi-blip/dashboard-ultimate` est en **public** (visible sur la screen). Conséquences :

- Le code complet du dashboard est lisible → toute logique métier (calcul streak, XP, finances perso, plan financier) est exposée.
- Les commits laissent une **trace temporelle de ta vie** (qui a vu quoi, quand). Combiné aux mémoires partagées entre Claude et toi, c'est une fuite d'identité.
- **Aucun README** = signal "projet abandonné/amateur" pour quiconque arrive dessus, et tu rates un asset CV.
- Les screens montrent qu'`gartiluigi-blip` et `claude` sont contributeurs — claude apparaît comme un compte humain, ce qui est bizarre publiquement.

**Fix (toi)** :
1. Settings → General → Danger Zone → "Change repository visibility" → **Private**
2. Si tu veux garder public pour CV : retire toutes les données perso du code (le bloc "Pourquoi tu fais ça" L3838 contient des objectifs financiers personnels avec montants), sépare le code de la config perso, et ajoute un README pro.

### 1.2 — Clé API Claude en clair dans le navigateur 🔴

L11250 :
```js
localStorage.setItem('dashv2_claude_api_key', JSON.stringify(v));
```

Et L11329 : `anthropic-dangerous-direct-browser-access: true` — Anthropic a littéralement nommé ce header "dangerous" parce que :
- N'importe quel script qui s'exécute dans la page (extension navigateur, XSS futur, devtools sur appareil partagé) peut lire la clé.
- La clé est une clé **de production** avec billing rattaché à toi → un attaquant peut générer des coûts sur ton compte.
- Tu as déjà un fallback Netlify Function (L11647 `/.netlify/functions/coach`) — donc le mode "clé locale" est de la dette inutile.

**Fix (moi, recommandation)** : forcer le mode serveur uniquement, supprimer tout le bloc clé locale. Ça réduit le code et élimine le risque. Voir `TODO.md` pour le détail.

### 1.3 — CSP `'unsafe-inline'` + 135 `innerHTML` 🟠

`_headers` actuel :
```
script-src 'self' 'unsafe-inline'
```

Avec `'unsafe-inline'`, toute injection HTML qui finit dans `innerHTML` peut exécuter du JS inline. Tu en as 135 dans le code. La probabilité réelle d'XSS est faible (peu d'inputs externes), mais :
- Voice input (L8023 `r[0].transcript`) finit dans le DOM → un site malveillant ne peut pas attaquer, mais un bug d'encodage peut casser le rendu.
- Imports JSON (L8868 `alert('Import OK…')`) lisent un fichier user → si tu importes un backup corrompu/forgé, du JS dans une string peut s'exécuter à plusieurs endroits.

**Fix proposé (moi)** : nouveau `_headers` plus strict + ajout de `frame-ancestors`, `base-uri`, `form-action`. Voir fichier livré.

**Fix idéal (toi, plus tard)** : remplacer `innerHTML = …` par `textContent = …` partout où c'est possible (probablement 80% des cas), et utiliser des templates DOM API pour le reste.

### 1.4 — URL publique sans auth 🔴

Netlify déploie sur `ultimatedashboard.netlify.app`. Pas d'auth = quiconque devine/trouve l'URL voit :
- Tes objectifs financiers (€260 000 à 40 ans, crédit en 15-19 mois, achat appart 5-7 ans)
- Ton historique d'humeur, sport, étude (tout est en localStorage côté client → pas exposé en lecture côté visiteur, mais l'app affiche une UI cohérente avec ton plan)
- Tes notes Vinted, finance, etc., **si** tu utilises le même navigateur pour ouvrir l'URL → données chargées localement à toi seul, mais l'**app structure** révèle ta vie.

⚠️ Subtilité : un visiteur tiers verra une **app vide** (localStorage = par-navigateur), donc tes données réelles ne sont pas leakées. Mais :
1. Le **contenu fixe** (objectifs, plan financier, programme sport) est dans le HTML → un visiteur les lit.
2. Si tu te connectes depuis un navigateur partagé → tes données restent là après que tu partes.
3. Demain tu ajoutes un sync cloud → là, l'auth devient obligatoire.

**Fix (toi)** : trois options par ordre croissant de friction
1. **Basic auth Netlify** (gratuit sur Pro, ou via edge function). 1-line fix.
2. **Netlify Identity** + magic link → propre mais nécessite signup.
3. **Cloudflare Access** devant le site → niveau pro.

Je te livre l'option 1 dans `netlify.toml` en commenté (à activer manuellement si tu prends Netlify Pro).

### 1.5 — Headers de sécurité manquants 🟡

Dans `_headers` actuel, manque :
- `Strict-Transport-Security` (HSTS) — Netlify l'ajoute par défaut sur les `.netlify.app`, mais autant le déclarer explicitement
- `Cross-Origin-Opener-Policy: same-origin`
- `Cross-Origin-Resource-Policy: same-origin`
- `Cross-Origin-Embedder-Policy: require-corp` (optionnel, casse parfois Google Fonts)

**Fix (moi)** : nouveau `_headers` livré ci-dessous.

### 1.6 — Netlify function `coach.js` — non auditable 🟡

Je n'ai pas le code de `netlify/functions/coach.js` dans ce que tu m'as uploadé. À auditer :
- Est-ce que la function valide l'origine de la requête (CORS strict) ?
- Est-ce qu'elle a un rate-limit ? (sinon n'importe qui sur internet peut spammer ta clé Anthropic stockée en env var Netlify)
- Est-ce que le system prompt est dans le code de la function (sécurisé) ou envoyé depuis le client (manipulable) ?
- Est-ce qu'elle log les erreurs ? Les inputs ?

**À me partager** : copie de `netlify/functions/coach.js` pour audit complet.

### 1.7 — Filtre secrets dans exports 🟢

Bon point : L18230 filtre bien `token|secret|api[_-]?key|anthropic|claude|gh_` à l'export — donc les backups sont propres. Mais :
- Le filtre est appliqué uniquement à `exportSafeBackup()` (L18226). Vérifier qu'aucun autre `export` ne le contourne.
- Le pattern `gh_` est étrange (token GitHub ?). Si tu syncs vers Gist, attention à ne jamais committer la clé.

---

## 2. Performance

### 2.1 — Fichier monolithique 943 KB 🟠

Mesures :
- Total : 921 327 caractères / **943 KB sur disque**, ~250 KB gzippé estimé
- 24 blocs `<script>` (541 KB de JS, ~58% du fichier)
- 12 blocs `<style>` (176 KB de CSS, ~19%)
- HTML structurel : ~22%

Sur un mobile 4G moyen :
- Téléchargement : ~1-2 s
- Parsing HTML : ~150 ms (énorme document)
- Parsing JS : ~200-400 ms (pas de cache cross-iteration parce que le HTML change à chaque commit)
- Time to Interactive estimé : **2-4 s** sur ton Samsung

Pourquoi c'est important pour toi :
- Tu ouvres ce dashboard plusieurs fois par jour → 2-4 s × N = friction quotidienne
- Chaque commit invalide tout le cache → tu repaies le coût à chaque déploiement
- Le voice input + Pomodoro + AI sont sensibles au TTI

**Stratégies (par effort croissant)** :

a) **Quick win — extraire les CSS/JS dans des fichiers séparés** (1-2 h)
- HTML reste petit, change rarement → cacheable
- JS et CSS isolés → un bug dans le JS n'invalide pas le CSS
- Permet de versionner et précompiler

b) **Code splitting par tab** (3-4 h)
- Charger `p-trading.js` uniquement quand on clique sur l'onglet Trading
- Réduit le TTI initial de ~40%

c) **Build step minimal** (Vite ou esbuild standalone — 2-3 h)
- Minification, tree-shaking, source maps
- Permet TypeScript progressif sans tout casser
- Tu apprends le build moderne en même temps (utile pour ton bachelor sept. 2026)

### 2.2 — Polices Google Fonts en externe 🟡

L28-30 : 3 familles (Fraunces, Outfit, JetBrains Mono) en variable + ital + 6+ poids. Estimé 80-150 KB downloads supplémentaires.

Tu as déjà fait le bon réflexe avec `media="print" onload="this.media='all'"` (rendu non-bloquant) et fallback `size-adjust` pour éviter le CLS. C'est bien.

**Optim** :
- Self-host les fonts (download `.woff2`, sert depuis `/fonts/`) → -1 RTT, plus de privacy (pas d'appel à Google), CSP plus strict possible.
- Réduire les variantes : Fraunces ital + Outfit en 3 poids + JetBrains 1 poids suffit.

### 2.3 — `backdrop-filter: blur(20px) saturate(1.4)` 🟡

L242-244 sur `.masthead`. Sur ton Samsung de gamme moyenne, le blur 20px coûte cher en GPU. Tu as déjà mis un mode `ud-performance-mobile` qui le coupe. **Bonne pratique.**

À vérifier : le mode perf est-il bien activé chez toi ? L3695 active par défaut si `pointer:coarse` détecté. ✅

### 2.4 — `console.log` (2 occurences) 🟢

Très propre. Beaucoup de devs en laissent 50+ en prod. Continue comme ça.

### 2.5 — `setTimeout` (120 occ) + `setInterval` (9 occ) 🟡

À auditer pour leaks :
- `setInterval` doit être `clearInterval` quand l'utilisateur quitte la page (`visibilitychange`).
- Sur mobile background, ces timers continuent de tourner et drainent batterie.

**À ajouter** :
```js
document.addEventListener('visibilitychange', () => {
  if (document.hidden) pauseAllTimers();
  else resumeAllTimers();
});
```

### 2.6 — IndexedDB mirror 🟢

L6136 `idbMirror` — excellente idée pour résilience. Vérifier que la migration localStorage → IDB est testée (que se passe-t-il si localStorage est plein mais IDB pas encore prêt ?).

---

## 3. Architecture / Code quality

### 3.1 — "Patchs sur patchs" 🟠

Indices dans le code :
- L11716 `if (window.__coachApplyIgnoreV2Installed) return;` — V2 patch
- L12033 `T1 · FETCH COACH via XHR (bypass des 7 wrappers empilés sur fetch)` — **7 wrappers sur fetch**
- L16957 `<script id="final-v36-coach-server-force">` — V36 patch
- L16969-71 : 3 `setTimeout` consécutifs pour forcer un état (signe que la séquence d'init est non-déterministe)

**Problème** : chaque "fix" ajoute du code mais ne supprime jamais l'ancien → la complexité grandit, pas la qualité.

**Stratégie de cleanup (toi, à planifier)** :
1. Faire un audit de tous les `__windowSomething` flags (probablement 20+)
2. Identifier les fix V2/V3/V36 qui sont obsolètes (le bug sous-jacent a-t-il été vraiment corrigé ?)
3. Une grosse session de "remove dead code" — viser -100 KB
4. Tagger `v1.0` avant de commencer (rollback safety)

### 3.2 — IDs incohérents 🟡

Tabs déclarés : `home, stats, routine, sport, flex, nutrition, epfc, code, ia, vinted, nl, chess, finance, social, plan, trading, settings`

Sections trouvées :
- 8 utilisent `id="p-X"` (home, stats, routine, sport, flex, nutrition, epfc, trading, settings)
- 9 utilisent `data-page="X"` seules (code, ia, vinted, nl, chess, finance, social, plan)
- 2 utilisent les deux (trading, settings)

C'est probablement le résultat d'une refacto incomplète. Risque : un `getElementById('p-vinted')` retourne `null`, un futur dev (toi dans 6 mois) galère à comprendre pourquoi seul certains tabs marchent avec un sélecteur.

**Fix (moi, livrable)** : je te livre un patch JS court qui ajoute `id="p-X"` à toutes les sections au runtime, en attendant que tu uniformises le HTML.

### 3.3 — `alert()` × 32 🟡

L8868, 8870, 8902, 9885, 11594, 12819, 12834, 12893, 12963, 13454…

Sur mobile, `alert()` est :
- Bloquant (UI freeze)
- Non styleable (UI cassée vs ton design soigné)
- Trappé par certains navigateurs PWA (peut ne pas s'afficher)

Tu as déjà `showToast()` partout ailleurs. Cohérence à finir.

**Fix (toi, 1 h)** : sed-replace `alert(...)` → `showToast(...)`. Risque faible. Liste exacte fournie dans `TODO.md`.

### 3.4 — Duplication système prompt coach 🟡

Le system prompt apparaît 2 fois quasi-identique :
- L11320 (mode "clé locale browser direct")
- L11644 (mode "via Netlify function")

Si tu changes l'un, tu oublies l'autre → drift. **Fix** : extraire dans `const COACH_SYSTEM_PROMPT = ...` au top, réutiliser. Voir `TODO.md`.

### 3.5 — 24 blocs `<script>` séparés 🟡

Pourquoi c'est un souci :
- Ordre d'exécution implicite et fragile
- Variables globales nécessaires pour communiquer (window.__xxx)
- Impossible de tree-shake
- Difficile à débugger (24 origines de stack trace)

**Strat** : à terme, un seul bundle. En attendant, documenter au top du fichier l'ordre logique attendu.

### 3.6 — Pas de TypeScript / pas de tests 🟡

Pour un projet personnel à ce stade, c'est ok. **Mais** :
- Tu pars sur un Bachelor dev en sept. 2026
- Ce dashboard sera ton **portfolio piece** principal
- Sans tests, tu casses des trucs sans le savoir (la dette technique précédente le suggère)

**Recommandation** :
- Ajouter Vitest + 5-10 tests sur les fonctions pures critiques (`weekLogs`, `setRing`, `dateKey`, `aggregateXP`) → 2-3 h, gain énorme en confiance
- Migrer progressivement vers TypeScript en JSDoc d'abord (pas besoin de build) puis fichiers `.ts` quand tu installes Vite

### 3.7 — Pas de gestion d'erreurs centralisée 🟡

Recherche `catch(e)` → souvent vide ou minimaliste. En prod, si une regression survient, tu n'as aucune visibilité.

**Fix proposé (toi, 30 min)** :
```js
window.addEventListener('error', (e) => {
  // Send to a free Sentry/Logtail/your own Netlify function
  fetch('/.netlify/functions/log-error', {
    method: 'POST',
    body: JSON.stringify({
      msg: e.message, stack: e.error?.stack, url: location.href, ts: Date.now()
    })
  });
});
window.addEventListener('unhandledrejection', /* idem */);
```

---

## 4. UX / Mobile

### 4.1 — Bonnes pratiques déjà en place 🟢

- `touch-action: manipulation` partout → no 300ms delay ✅
- Min-height 44px sur tactile → norme Apple/Google ✅
- Safe-area iOS gérée ✅
- `prefers-reduced-motion` respecté (L3665) ✅
- Fallback fonts avec `size-adjust` → no CLS ✅
- Voice input avec haptic feedback ✅
- Mode performance mobile auto-activé ✅
- Confirm-twice sur reset (L8095) ✅

Niveau UX mobile, **t'es au-dessus de la moyenne**. Sérieux.

### 4.2 — 17 tabs en barre horizontale 🟠

Trop de tabs. Sur mobile :
- L'utilisateur (toi) doit scroller dans la tab bar pour atteindre Settings
- La hiérarchie visuelle est plate (tout au même niveau)
- Les tabs `🏠 📊 📅 💪 🧘 🥩 🎓 💻 🤖 🛍️ 🇳🇱 ♟️ 💰 🤝 📋 📈 ⚙️` mélangent vie réelle et études et finance et settings

**Reorg proposée** :
- **Daily** (priorité 1) : Aujourd'hui · Stats · Routine
- **Studies** (priorité 2) : EPFC · Code · IA · NL
- **Body** (priorité 3) : Sport · Flex · Nutrition
- **Money** (priorité 4) : Finance · Vinted · Trading
- **Misc** (priorité 5) : Chess · Social · Plan · Settings

→ 5 catégories, max 4 tabs par catégorie, accessible via un menu hamburger ou des "groupes" dans la tab bar.

### 4.3 — Page Home très chargée 🟡

L3753-4234 (~480 lignes) :
- Search bar
- Next action
- Onboarding (si pas dismissed)
- Hero greeting + date + shift
- Now-card (current time block)
- Stats × 3 (streak, done, total)
- XP widget
- Priorités du jour (liste éditable)
- Pourquoi tu fais ça (motivation)
- Entraînement aujourd'hui
- Tâches imprévues
- Reprendre où t'as arrêté (bookmarks)
- Objectifs du mois

Sur un écran mobile (~640px de haut), tu vois ~5-6 sections avant de scroller. C'est dense.

**Suggestion** : passer la page Home en "mode focus" — n'afficher QUE :
- Greeting + heure + shift
- Next action (LE plus important)
- Stats compact
- Priorités

Le reste va dans des accordéons collapsibles ou est déplacé. Le but du dashboard est de **te faire passer à l'action** en <10 s d'ouverture, pas de te montrer 12 sections.

### 4.4 — Onboarding "compris, ne plus montrer" 🟢

L3786 : geste UX classique et bien fait. 👍

### 4.5 — Search avec ⌘K 🟢

L3759 — bonne idée. À vérifier que ça fonctionne sur mobile (où il n'y a pas de ⌘) → tu as quoi comme déclencheur tactile ? Bouton tap visible ✅, mais peut-être ajouter un swipe-down depuis le top.

### 4.6 — XP/streak/achievements 🟢

L3811 — gamification cohérente. Risque : si tu arrêtes 2 jours, le streak casse → démotivation. À considérer un "streak freeze" (1 par mois, comme Duolingo).

### 4.7 — Pas de dark mode toggle 🟡

Le design est en dark uniquement. C'est cohérent (et beau), mais pas de respect de `prefers-color-scheme: light`. Sur écran mobile en plein jour, le dark peut être moins lisible. **Optionnel**.

---

## 5. Produit / Roadmap

### 5.1 — Le dashboard fait trop de choses 🟠

17 modules. Mémoire utilisateur indique que tu construis aussi un agent job-applications (Playwright + LLM) et un assistant JARVIS-style. Risque de **dilution d'effort**.

**Question stratégique** : ce dashboard est-il :
- (a) Un outil personnel pour toi → stop d'ajouter des features, stabilise et utilise
- (b) Un projet pédagogique pour préparer ton bachelor → refactor, apprends Vite/TS dessus
- (c) Un futur produit / portfolio → ajouter auth, multi-user, monétisation
- (d) Tout ça → choisis ton chapeau du moment, et pose-toi la question avant chaque feature

Mon biais perso : si tu commences le bachelor en sept. 2026 (5 mois), je conseille **(b)** — utilise ce dashboard comme bac à sable pour apprendre :
- Vite + TypeScript (mois 1-2)
- React (mois 3) — réécrire les onglets en composants
- Backend + base de données (mois 4-5) — remplacer localStorage par Postgres + auth
- Tests (en continu)

Au moment où tu rentres en bachelor, tu as déjà 5-6 mois d'expérience dev pro. Énorme avantage.

### 5.2 — Données = ton atout, pas la feature 🟡

Tu logues depuis longtemps. Cette donnée est ton **vrai** asset. Or :
- Aucun export structuré (CSV/parquet) → analyses externes impossibles
- Aucune visu cross-domaine (lien sommeil↔humeur↔perf étude)
- Aucune prédiction (typer "samedi soir je vais skipper le sport" — l'app le sait, ne le dit pas)

**Idées roadmap** (par ordre d'impact) :
1. Export CSV avec tous les logs (1 ligne / jour, 1 colonne / domaine) → analysable dans Excel/Python
2. Dashboard "insights" : corrélations détectées (ex. "les jours où tu dors <6h, ton humeur baisse de 1.3 pts en moyenne")
3. Prédiction + nudge : "tu skips le sport 73% des dimanches → bouge ta séance au samedi"

### 5.3 — IA mal exploitée 🟠

Tu as un bouton coach. Mais :
- Le coach répond à chaque question from scratch → pas de mémoire entre conversations
- Pas de proactivité (le coach pourrait t'envoyer une notif "j'ai vu 3 jours sans EPFC")
- Pas d'apprentissage de tes patterns (ce que tu fais bien vs mal)

**Vision** : transformer le coach en **agent autonome** qui :
- Tourne 1×/jour (cron Netlify) sur tes données récentes
- Te génère le `next-action` automatiquement (au lieu d'une logique hardcodée)
- T'envoie 1 push notif/jour avec une décision concrète

C'est un excellent projet pour préparer le bachelor.

### 5.4 — Pas de version history 🟡

Tu édites tes priorités, tes objectifs mensuels, ton plan financier. Aucun historique. Si tu fais une erreur, no undo persistent. **Fix** : à chaque écriture S.set, garder les 10 derniers diffs dans un `_history_${key}`.

### 5.5 — Pas de partage / accountability 🟡

Si demain tu veux partager ton streak avec un ami / coach humain, no way. Idée : URL partageable read-only (`/share/abc123`) avec uniquement quelques métriques publiques.

---

## 6. Setup repo / déploiement

### 6.1 — Pas de README 🔴

Sur le repo public, **README absent**. Pour un projet que tu peux mettre sur ton CV, c'est dommage.

**Fix (moi, livrable)** : `README.md` pro fourni.

### 6.2 — Pas de LICENSE 🟡

Sans license, légalement personne (toi inclus) ne peut clairement réutiliser le code. Pour un repo public :
- **All Rights Reserved** si tu veux protéger
- **MIT** si tu veux open-source
- **CC BY-NC** pour le contenu (programme sport, plan financier)

### 6.3 — Pas de `.gitignore` propre 🟡

Pas vu sur la screen. Probable que `node_modules/`, `.env`, `.DS_Store`, `.netlify/` ne sont pas ignorés. Risque de leak d'env vars.

**Fix (moi, livrable)** : `.gitignore` complet.

### 6.4 — Pas de `SECURITY.md` 🟡

Pour un repo public qui gère une API key et des données perso, un fichier `SECURITY.md` est attendu (norme GitHub). Indique comment reporter une vuln.

**Fix (moi, livrable)** : `SECURITY.md` fourni.

### 6.5 — `netlify.toml` minimaliste 🟡

Actuel :
```toml
[build]
  publish = "."
  functions = "netlify/functions"

[functions]
  node_bundler = "esbuild"
```

Manque :
- `[build.environment]` avec `NODE_VERSION = "20"`
- `[[redirects]]` pour SPA-like (pas vital ici, mais propre)
- `[[headers]]` (ou rester sur `_headers`, ok)
- Définition explicite des routes des functions
- `[context.production]` / `[context.deploy-preview]` pour différencier prod et previews

**Fix (moi, livrable)** : `netlify.toml` étoffé.

### 6.6 — `robots.txt` 🟢

Actuel : `User-agent: * / Disallow: /`

C'est correct pour bloquer l'indexation Google. **Mais** un attaquant ciblé scrapera quand même. Le seul vrai fix est l'auth (cf 1.4).

À ajouter optionnellement :
```
Sitemap: https://ultimatedashboard.netlify.app/sitemap.xml
```
(non, en fait, vu que tu disallow tout, inutile)

### 6.7 — Pas de CI 🟡

Aucun GitHub Actions. Recommandations légères :
- **Lint** au minimum : ESLint sur push (5 min de setup)
- **HTMLProofer** : check les liens cassés (10 min)
- **Lighthouse CI** : score perf à chaque deploy (30 min) — le plus utile

**Fix (moi)** : workflow GitHub Actions livré pour Lighthouse.

### 6.8 — Pas de Dependabot / renovate 🟡

Le repo a des dépendances (Netlify functions). Activer Dependabot prend 1 clic dans Settings → Security.

---

## 7. Mémoire et données

### 7.1 — Volume localStorage 🟡

Estimation : si tu logues 1 entrée/jour avec ~10 champs depuis 6 mois → ~180 entrées × 500 octets = ~90 KB. Tranquille jusqu'à ~3 ans.

Limite localStorage par origine : **5-10 MB** selon navigateur. Donc pas de panique court terme. Mais :
- Tu as des duplications (`mini_weight`, `mini_elo`, `mini_book`, `mini_debt` qui pourraient être un seul `trackers`)
- Le code crée des clés avec dates (`log_2026-04-26`) → 365/an. Pour une rétention 5 ans = 1825 clés → lent à itérer

**Fix recommandé** : au-delà de 90 jours, agréger en `archive_2025_Q4` (1 clé / trimestre).

### 7.2 — Pas de sync cloud 🟠

Toute ta donnée vit sur **un seul appareil**. Si :
- Tu changes de téléphone → tout est perdu (sauf si tu exportes manuellement)
- Tu effaces les données du navigateur sans le savoir → perdu
- Une mise à jour Brave foire → perdu

**Fix recommandé (par effort croissant)** :
1. Auto-export quotidien dans IDB + reminder hebdo de download
2. Sync GitHub Gist (privé) avec le `gh_token` que tu as déjà
3. Sync Netlify Blobs (gratuit jusqu'à 100MB) si tu mets de l'auth
4. Migration vers Supabase free tier (auth + DB + sync)

Le **(2)** est le compromis effort/sécurité optimal pour toi maintenant. Tu as déjà la plomberie.

---

## 8. Accessibilité

### 8.1 — `aria-live`, `aria-label` présents 🟢

Bon réflexe. À étendre sur tous les boutons icon-only (par ex. `❌` close, `👁` toggle).

### 8.2 — Contraste 🟡

À auditer formellement avec axe DevTools, mais à vue de nez :
- `--text-faint: #8a8aa4` sur `--bg: #08080d` → ratio ~7.2 (AAA) ✅
- `--text-ghost: #555570` sur `--bg` → ratio ~3.9 (AA pour gros texte uniquement) ⚠️
- `--flame: #ff6b35` sur `--bg` → ratio ~5.6 (AA) ✅

**Fix** : éviter `--text-ghost` sur petits textes (<14px).

### 8.3 — Focus visible 🟡

Pas vu de `:focus-visible` style explicite. Sur mobile peu impactant, mais sur desktop (et navigation clavier) ça aide.

### 8.4 — Animations agressives 🟢

Tu respectes `prefers-reduced-motion` (L3665). 👍

---

## 9. Métriques à surveiller (post-fix)

| Métrique | Cible | Comment mesurer |
|----------|-------|-----------------|
| Lighthouse Performance | >85 | DevTools / Lighthouse CI |
| Lighthouse Accessibility | >95 | idem |
| FCP (First Contentful Paint) | <1.5 s | WebPageTest mobile 4G |
| TTI (Time to Interactive) | <3 s | idem |
| Bundle size (HTML+JS+CSS) | <500 KB gzip | `du -h` après build |
| Erreurs JS/jour en prod | <5 | Sentry / log function |
| Taille localStorage | <2 MB | dev console manuel |

---

## 10. Ce que je livre maintenant (créé directement)

Voir les fichiers livrés dans la même session :

1. **`README.md`** — README pro pour le repo
2. **`_headers`** — version durcie de tes headers
3. **`netlify.toml`** — config étoffée (avec basic auth en option commentée)
4. **`robots.txt`** — légèrement amélioré
5. **`.gitignore`** — complet pour Node + Netlify + IDE
6. **`SECURITY.md`** — politique de sécurité standard
7. **`LICENSE`** — All Rights Reserved (à changer si tu veux MIT)
8. **`.github/workflows/lighthouse.yml`** — CI Lighthouse
9. **`TODO.md`** — checklist de ce que toi tu dois faire, priorisée

Je n'ai **pas** modifié `index.html` (943 KB) — trop risqué sans environnement de test, et tu as une logique métier complexe. Les patches concrets sur l'HTML sont listés dans `TODO.md` avec les n° de ligne précis pour faciliter ton intervention.

---

## 11. Plan d'action condensé (3 mois)

**Semaine 1** (cette semaine) :
- Repo en privé OU virer les données perso
- Déployer mes fichiers (10 min)
- Désactiver le mode "clé locale" du coach (45 min)

**Semaine 2-4** :
- Sync Gist auto-backup (3h)
- Fix les 32 alert() (1h)
- Extraire CSS/JS du HTML (4h)
- Mettre Lighthouse CI (30 min)

**Mois 2** :
- Migration Vite + TS partiel (8h)
- Tests Vitest sur fonctions pures (3h)
- Service Worker + offline (3h)

**Mois 3** :
- Reorg tabs en 5 catégories (3h)
- Coach proactif (cron) (5h)
- Auth + sync cloud (8h) → quand tu veux que ce soit accessible depuis plusieurs devices

Total : ~50h sur 3 mois. Compatible avec sick leave + arrivée bachelor.

---

*Audit produit le 26 avril 2026. Mises à jour bienvenues à mesure que le code évolue.*

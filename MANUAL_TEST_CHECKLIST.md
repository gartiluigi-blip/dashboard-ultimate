# Manual mobile test checklist

À faire avant merge de la PR #6.

## 1. Boot

- Ouvrir le dashboard sur téléphone.
- Vérifier qu'aucune barre rouge d'erreur JS ne s'affiche.
- Ouvrir la console navigateur si possible : aucune erreur critique au chargement.

## 2. Navigation

- Bottom nav : cliquer `Now`.
- Bottom nav : cliquer `Routine`.
- Bottom nav : cliquer `Études` puis ouvrir `EPFC`.
- Bottom nav : cliquer `Études` puis ouvrir `Code`.
- Bottom nav : cliquer `Stats`.
- Bottom nav : cliquer `Plus` puis ouvrir `Sport`, `Vinted`, `Settings`.

Résultat attendu : une seule page active, pas de freeze, pas de double scroll incontrôlé.

## 3. Mission maintenant

- Sur Home, vérifier que la carte mission affiche EPFC ou Code.
- Cliquer `Ouvrir ...`.
- Vérifier que le bon onglet s'ouvre.
- Tester `+15 min`.
- Tester `Skipper aujourd'hui`.

Résultat attendu : pas de double action, pas de bouton bloqué.

## 4. Store / persistance

Dans la console :

```js
window.UDStore.set('manual_test', { ok: true });
window.UDStore.get('manual_test');
window.UDStore.del('manual_test');
```

Résultat attendu : set/get/del fonctionnent.

## 5. Router

Dans la console :

```js
window.UDRouter.go('home');
window.UDRouter.current();
window.UDRouter.go('routine');
window.UDRouter.current();
```

Résultat attendu : navigation correcte, current retourne l'onglet actif.

## 6. Backup chiffré

- Aller dans les options/export.
- Tester `Export chiffré`.
- Vérifier que le fichier se télécharge.
- Ne pas merger si le fichier export contient une clé sensible brute :
  - `dashv2_claude_api_key`
  - `dashv2_gh_token`
  - `dashv2_anthropic_api_key`
  - `dashv2_openai_api_key`
  - `dashv2_coach_shared_secret`

## 7. Coach voice

Appeler la fonction Netlify en mode voice depuis le client ou via requête test.

Résultat attendu : réponse JSON contenant :

```json
{
  "mode": "voice",
  "action": "log_session|add_task|add_note|add_bookmark|question",
  "module": "...",
  "duration": 0,
  "confidence": 0.0
}
```

## 8. Validation locale

Lancer :

```bash
npm run check
```

Résultat attendu :

- syntax OK ;
- smoke coach OK ;
- static audit OK ;
- index debt audit OK.

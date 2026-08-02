# Security

Ultimate Dashboard V6.2 est une application locale. L’état actif est stocké sous `ud6_state`, les sauvegardes sous `ud6_backups` et l’historique d’annulation sous `ud6_undo`.

## Données

- Ne pas enregistrer de mot de passe, clé API, numéro de carte, document médical complet ou autre secret.
- Les données locales et les exports JSON ne sont pas chiffrés.
- Toute personne ayant accès au profil navigateur ou à un export peut lire les données.
- Cinq backups locaux et huit points d’annulation maximum sont conservés.
- Conserver les exports dans un emplacement personnel protégé.

## Import et stockage

- Les imports sont limités à 2 Mo.
- Le format `ultimate-dashboard-v6` est obligatoire.
- Les propriétés dangereuses telles que `__proto__`, `prototype` et `constructor` sont retirées avant restauration.
- L’état est normalisé par le schéma 3 avant écriture.
- Lire le store ne déclenche plus une nouvelle écriture systématique.

## Application

- Aucun secret serveur n’est requis par le runtime V6.2.
- La politique de sécurité du contenu n’autorise aucun JavaScript externe.
- Le service worker utilise un cache versionné et supprime les anciens caches.
- L’application ne constitue pas un dispositif médical ni un conseiller financier.

## Signalement

Ouvrir une issue sans publier de données personnelles ni de secret exploitable. Indiquer la version affichée, le navigateur, les étapes de reproduction et l’impact constaté.

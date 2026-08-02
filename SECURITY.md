# Security

Ultimate Dashboard est une application locale. L’état actif est stocké dans le navigateur sous la clé `ud6_state`; les trois sauvegardes locales utilisent `ud6_backups`.

## Données

- Ne pas enregistrer de mot de passe, clé API, numéro de carte, document médical complet ou autre secret.
- Les données locales ne sont pas chiffrées.
- Toute personne ayant accès au profil navigateur ou à un export JSON peut lire les données.
- Faire un export avant un changement important ou une réinitialisation.
- Conserver les exports dans un emplacement personnel protégé.

## Application

- Aucun secret serveur n’est requis par le runtime V6.1.
- Aucune ressource JavaScript externe n’est autorisée par la politique de sécurité du contenu.
- Les imports restaurés sont validés par format puis nettoyés par le schéma actif.
- Le service worker utilise un cache versionné et supprime les anciens caches à l’activation.

## Signalement

Pour signaler un problème de sécurité, ouvrir une issue sans publier de données personnelles ni de secret exploitable. Décrire le comportement, les étapes de reproduction et la version affichée dans l’onglet Système.

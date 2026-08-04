# Security

Ultimate Dashboard V6.3 est une application locale. L’état actif est stocké sous `ud6_state`, les sauvegardes sous `ud6_backups` et l’historique d’annulation sous `ud6_undo`.

## Données

- Ne pas enregistrer de mot de passe, clé API, numéro de carte, document médical complet ou autre secret.
- Les données locales et les exports JSON ne sont pas chiffrés.
- Toute personne ayant accès au profil navigateur ou à un export peut lire les données.
- Les journaux Santé 360 peuvent contenir symptômes, mesures, prévention et décisions sur les compléments : limiter la saisie au strict nécessaire.
- Les notes Savoir OS peuvent contenir des informations personnelles ou professionnelles : ne pas y copier de contenu confidentiel.
- Cinq backups locaux et huit points d’annulation maximum sont conservés.
- Conserver les exports dans un emplacement personnel protégé.

## Import et stockage

- Les imports sont limités à 2 Mo.
- Le format `ultimate-dashboard-v6` est obligatoire.
- Les propriétés dangereuses telles que `__proto__`, `prototype` et `constructor` sont retirées avant restauration.
- L’état est normalisé par le schéma 3 avant écriture.
- Les clés additionnelles `health` et `knowledge` restent intégrées au même état local et au même export.
- Lire le store ne déclenche pas une nouvelle écriture systématique.

## Santé

- Les scores Santé 360 représentent des habitudes et la complétude des données saisies; ils ne mesurent pas réellement un organe.
- L’application ne diagnostique pas une maladie, ne prescrit pas de traitement et ne remplace pas une consultation.
- Une valeur inquiétante, un symptôme sévère ou un signal d’alerte doit être traité selon les recommandations d’un professionnel ou des services d’urgence.
- Le gate compléments est un filtre de sécurité et non une autorisation médicale.

## Application

- Aucun secret serveur n’est requis par le runtime V6.3.
- La politique de sécurité du contenu n’autorise aucun JavaScript externe.
- Le service worker utilise un cache versionné et supprime les anciens caches.
- L’application ne constitue ni un dispositif médical, ni un conseiller financier, ni une garantie de performance.

## Signalement

Ouvrir une issue sans publier de données personnelles ni de secret exploitable. Indiquer la version affichée, le navigateur, les étapes de reproduction et l’impact constaté.

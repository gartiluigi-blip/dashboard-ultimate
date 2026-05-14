# Storage map

But : arrêter les collisions et les formats concurrents. Toute nouvelle clé doit être documentée ici.

## Règles

- Préfixe runtime principal : `dashv2_`.
- Les nouveaux modules doivent passer par `UDStore` ou le futur `assets/core/store.js`.
- Pas de `localStorage.setItem/getItem/removeItem` direct hors core, migration, export/import.
- Toute clé sensible doit être exclue des exports.

## Clés connues

| Key logique | Clé brute | Owner | Type | Exportable | Sensible | Statut |
|---|---|---|---|---:|---:|---|
| `tab` | `dashv2_tab` | core/router | string | oui | non | actif |
| `state` | `dashv2_state` | legacy core | object | oui | non | legacy à inspecter |
| `log_YYYY-MM-DD` | `dashv2_log_YYYY-MM-DD` | logs daily | object | oui | non | actif v73/v74 |
| `logs_YYYY-MM-DD` | `dashv2_logs_YYYY-MM-DD` | legacy logs | object | oui | non | à migrer |
| `logs` | `dashv2_logs` | legacy stats | array | oui | non | à migrer ou canoniser |
| `epfc_proofs_v1` | `dashv2_epfc_proofs_v1` | v74 EPFC | object | oui | non | actif |
| `vinted_items_v1` | `dashv2_vinted_items_v1` | v74 Vinted | array | oui | non | actif |
| `finance_cashflow_v1` | `dashv2_finance_cashflow_v1` | v74 Finance | object | oui | non | actif |
| `v73_snooze_until` | `dashv2_v73_snooze_until` | v73 mission | number | oui | non | actif |
| `v73_skip_YYYY-MM-DD_domain` | `dashv2_v73_skip_YYYY-MM-DD_domain` | v73 mission | boolean | oui | non | actif |
| `v74_brief_YYYY-MM-DD` | `dashv2_v74_brief_YYYY-MM-DD` | v74 briefing | string | oui | non | actif |
| `tasks_YYYY-MM-DD` | `dashv2_tasks_YYYY-MM-DD` | tasks / v74 voice | array | oui | non | actif |
| `notes_module` | `dashv2_notes_module` | notes | array | oui | non | actif |
| `bookmarks` | `dashv2_bookmarks` | bookmarks | object | oui | non | actif |
| `training_anchor` | `dashv2_training_anchor` | sport | ISO date | oui | non | actif |
| `notif_fired_YYYY-MM-DD` | `dashv2_notif_fired_YYYY-MM-DD` | notifications | object | non | non | transient |
| `claude_api_key` | `dashv2_claude_api_key` | legacy client AI | string | non | oui | deprecated |
| `gh_token` | `dashv2_gh_token` | gist backup | string | non | oui | sensitive |
| `anthropic_api_key` | `dashv2_anthropic_api_key` | legacy | string | non | oui | deprecated |
| `openai_api_key` | `dashv2_openai_api_key` | legacy | string | non | oui | deprecated |
| `coach_shared_secret` | `dashv2_coach_shared_secret` | coach auth | string | non | oui | sensitive |

## Décisions à prendre

### Logs

Il faut choisir un canon :

- option A : `log_YYYY-MM-DD` pour lecture rapide par jour ;
- option B : `logs` tableau unique pour stats globales.

Décision recommandée : `log_YYYY-MM-DD` canon, avec index dérivé si besoin.

### Secrets

Tous les secrets doivent être soit :

- dans Netlify environment variables ;
- soit exclus de tous les exports ;
- soit supprimés du client si plus utilisés.

## Migration cible

1. Créer `assets/core/store.js`.
2. Ajouter `store.migrate()`.
3. Migrer `logs_YYYY-MM-DD` vers `log_YYYY-MM-DD`.
4. Arrêter d'écrire `dashv2_logs` si non nécessaire.
5. Supprimer secrets client dépréciés.

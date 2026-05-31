export async function handler(event) {
  if (event.httpMethod !== 'POST') return json(405, { error: 'method_not_allowed' });
  let body = {};
  try { body = JSON.parse(event.body || '{}'); } catch { return json(400, { error: 'invalid_json' }); }
  const summary = summarize(body);
  return json(200, {
    order: summary.order,
    reason: summary.reason,
    fallback: summary.fallback,
    risk: summary.risk,
    tomorrowAdjustment: summary.tomorrowAdjustment,
    source: process.env.ANTHROPIC_API_KEY ? 'local_rules_ready_for_ai' : 'local_rules_no_api_key'
  });
}
function summarize(d) {
  const score = Number(d?.score || d?.today?.score || 0);
  const fuel = d?.fuel || d?.today?.fuel || {};
  const proofCount = Number(d?.proofs?.valid || 0);
  if ((fuel.water || 0) < 1500) return pack('Boire 500 ml maintenant', 'Hydratation sous seuil', '250 ml + log', 'baisse énergie / fausse discipline');
  if ((fuel.protein || 0) < 80) return pack('Sécuriser protéines', 'Protéines sous seuil', 'repas simple ou yaourt/oeufs', 'récupération faible');
  if (proofCount < 1) return pack('Produire une preuve étude', 'Aucune preuve validée', 'note de 5 lignes', 'journée non traçable');
  if (score && score < 50) return pack('Revenir aux N1 uniquement', 'Score global faible', '1 action vitale', 'dispersion');
  return pack('Exécuter la prochaine N1', 'Système stable', 'version 5 minutes', 'empilement inutile');
}
function pack(order, reason, fallback, risk) { return { order, reason, fallback, risk, tomorrowAdjustment: { mode: 'N1_first', reduceOptional: true } }; }
function json(statusCode, data) { return { statusCode, headers: { 'content-type': 'application/json' }, body: JSON.stringify(data) }; }

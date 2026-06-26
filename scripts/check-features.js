import { FEATURES } from '../assets/js/data.js';
const required=['home','routine','sport','sport_hybrid_ppl','sport_bodyweight','sport_coverage','sport_progression','sport_history','study','certifications','proofs','vinted','finance','nutrition','coding','repair_iot','dutch','stats','settings'];
const missing=required.filter(x=>!FEATURES.includes(x));
if(missing.length){console.error('Missing features: '+missing.join(', '));process.exit(1)}
console.log('Feature check OK', FEATURES.length);

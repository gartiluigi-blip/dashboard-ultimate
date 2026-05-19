import { FEATURES } from '../assets/js/data.js';
const required=['home','routine','sport','sport_library','sport_ppl','sport_bodyweight','sport_flexibility','study','certifications','proofs','vinted','finance','nutrition','coding','repair_iot','dutch','stats','settings'];
const missing=required.filter(x=>!FEATURES.includes(x));
if(missing.length){console.error('Missing features: '+missing.join(', '));process.exit(1)}
console.log('Feature check OK', FEATURES.length);

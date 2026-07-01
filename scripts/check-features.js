import { FEATURES } from '../assets/js/data.js';
const required=['home','routine','sport','sport_cycle','sport_session','sport_coverage','sport_progression','sport_history','study','certifications','proofs','vinted','finance','nutrition','coding','repair_iot','dutch','stats','settings'];
const missing=required.filter(feature=>!FEATURES.includes(feature));
if(missing.length){console.error('Missing features: '+missing.join(', '));process.exit(1)}
console.log('Feature check OK',FEATURES.length);

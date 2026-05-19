import { EPFC_YEAR1 } from '../assets/js/epfc-year1.js';
import { EPFC_DAILY_ROTATION } from '../assets/js/practice-catalog.js';
import { BOOKS, EXERCISE_PACKS } from '../assets/js/study-catalog.js';
import { SPORT_CYCLE } from '../assets/js/data.js';
import * as Store from '../assets/js/store.js';
import { el, card, subTabs, toast } from '../assets/js/ui.js';
let mode='ops';
const SUPPS=[
 {id:'creatine',name:'Créatine monohydrate',dose:'3-5 g',when:'matin ou après repas',why:'performance, récupération, soutien cognitif sous fatigue'},
 {id:'caffeine',name:'Caféine',dose:'100-200 mg',when:'30-60 min avant focus/sport, éviter tard',why:'vigilance, énergie, concentration court terme'},
 {id:'theanine',name:'L-théanine',dose:'100-200 mg',when:'avec caféine',why:'focus plus propre, moins de nervosité'},
 {id:'vitaminD',name:'Vitamine D3',dose:'1000-2000 UI',when:'matin/midi avec repas gras',why:'utile surtout si manque soleil ou carence'},
 {id:'omega3',name:'Oméga-3 EPA+DHA',dose:'1-2 g EPA+DHA',when:'avec repas',why:'santé générale, support long terme'},
 {id:'magnesium',name:'Magnésium glycinate',dose:'200-400 mg',when:'soir',why:'sommeil, détente, stress'},
 {id:'zinc',name:'Zinc',dose:'10-15 mg',when:'avec repas, optionnel',why:'utile surtout si apport bas/carence'}
];
export function renderRoutine(root,rr){
 root.append(subTabs([{id:'ops',label:'Ops du jour'},{id:'minimum',label:'Minimum vital'},{id:'deep',label:'Deep work'},{id:'supps',label:'Supplements'},{id:'week',label:'Semaine'}],mode,id=>{mode=id;rr()}));
 if(mode==='minimum')return minimum(root,rr);
 if(mode==='deep')return deep(root,rr);
 if(mode==='supps')return supplements(root,rr);
 if(mode==='week')return week(root,rr);
 ops(root,rr);
}
function dayKey(){return 'routine_'+Store.today()}function state(){return Store.get(dayKey(),{done:{},notes:{}})}function save(s){Store.set(dayKey(),s)}
function ops(root,rr){const s=state();root.append(card('Routine opérationnelle','EPFC = une matière par jour. Coding + IA + IoT + Réparation + NL = blocs quotidiens. Chaque bloc se coche et la reprise vient des parcours Étude.'));const g=el('div',{class:'grid'});blocks().forEach(b=>g.append(block(b,s,rr)));root.append(g);notes(root,rr)}
function blocks(){const epfc=epfcToday();return [
 {id:'brief',title:'Briefing 5 min',desc:'Lire les reprises EPFC + Coding + IA + IoT + Réparation + NL.'},
 {id:'epfc',title:'EPFC du jour',desc:epfc.code+' · '+epfc.title+' → '+epfcResume(epfc.code),main:true},
 {id:'coding',title:'Coding',desc:trackResume('coding')},
 {id:'ai',title:'IA',desc:trackResume('ai')},
 {id:'iot',title:'IoT',desc:trackResume('iot')},
 {id:'repair',title:'Réparation',desc:trackResume('repair')},
 {id:'nl',title:'NL / SELOR',desc:nlResume()},
 {id:'sport',title:'Sport',desc:'Séance cycle: '+sportToday()},
 {id:'proof',title:'Preuve du jour',desc:'Capturer une preuve: note, lien, capture, exercice validé.'},
 {id:'supps',title:'Supplements',desc:'Créatine, D3, oméga-3, caféine/théanine, magnésium, zinc si utile.'},
 {id:'review',title:'Review soir',desc:'Mettre à jour pages/exercices + erreurs + prochaine action.'}
]}
function block(b,s,rr){const c=card(b.title,b.desc,b.main?'span-8':'span-4');const done=!!s.done[b.id];c.className+=' '+(done?'ok':'');c.append(el('div',{class:'row'},[el('button',{class:'btn '+(done?'green':''),onclick:()=>{s.done[b.id]=!done;save(s);toast(s.done[b.id]?'Bloc validé':'Bloc rouvert');rr()}},done?'Validé':'Valider'),el('button',{class:'btn',onclick:()=>{Store.push('study_activity',{domain:'routine',kind:'block',title:b.title,date:Store.today(),status:done?'reopened':'done'});toast('Log ajouté')}},'Logger') ]));return c}
function minimum(root,rr){const s=state();const g=el('div',{class:'grid'});[
 {id:'min_epfc',title:'EPFC 15 min',desc:epfcResume(epfcToday().code)},
 {id:'min_code',title:'Coding 10 min',desc:trackResume('coding')},
 {id:'min_iot',title:'IoT 10 min',desc:trackResume('iot')},
 {id:'min_repair',title:'Réparation 10 min',desc:trackResume('repair')},
 {id:'min_nl',title:'NL 10 min',desc:nlResume()}
].forEach(b=>g.append(block(b,s,rr)));root.append(card('Minimum vital','Journée explosée: tu fais seulement ces blocs.'));root.append(g)}
function deep(root,rr){const c=card('Deep work','Séquence lourde quand tu as du temps.');['90 min EPFC','45 min Coding','45 min IA','45 min IoT','45 min Réparation','30 min NL','20 min review'].forEach(x=>c.append(el('div',{class:'exercise'},x)));root.append(c)}
function supplements(root,rr){const data=Store.get('supplements_'+Store.today(),{});root.append(card('Supplements','Stack sobre. Pas de testobooster bullshit. Objectif: énergie, focus, récupération, sommeil. Vérifier interactions médicales si traitement.'));const g=el('div',{class:'grid'});SUPPS.forEach(s=>{const rec=data[s.id]||{taken:false,dose:s.dose,time:''};const c=card(s.name,s.why+' · Dose: '+s.dose+' · Timing: '+s.when,'span-4');const dose=el('input',{class:'input',placeholder:'dose',value:rec.dose});const time=el('input',{class:'input',type:'time',value:rec.time||''});c.append(el('div',{class:'row'},[dose,time,el('button',{class:'btn '+(rec.taken?'green':''),onclick:()=>{data[s.id]={taken:!rec.taken,dose:dose.value,time:time.value};Store.set('supplements_'+Store.today(),data);toast(data[s.id].taken?'Pris':'Rouvert');rr()}},rec.taken?'Pris':'Marquer pris')]));g.append(c)});root.append(g);const rules=card('Règles','Caféine: éviter tard. Zinc: pas haute dose longue durée. Vitamine D: idéalement bilan si usage long. Oméga-3: prudence anticoagulants. Magnésium: soir. Créatine: 3-5 g tous les jours.');root.append(rules)}
function week(root){const c=card('Semaine','Rotation EPFC + blocs quotidiens.');for(let i=0;i<7;i++){const d=new Date();d.setDate(d.getDate()+i);const idx=dayIndex(d)%EPFC_DAILY_ROTATION.length;const code=EPFC_DAILY_ROTATION[idx];const course=courseByCode(code);c.append(el('div',{class:'exercise'},d.toISOString().slice(0,10)+' · EPFC: '+code+' '+course.title+' · Quotidien: Coding/IA/IoT/Réparation/NL'))}root.append(c)}
function notes(root,rr){const s=state();const c=card('Notes routine','Ce champ sauvegarde où tu t’es arrêté aujourd’hui.');const t=el('textarea',{class:'input',rows:'4',placeholder:'blocage, reprise, énergie, prochaine action'},s.notes.main||'');c.append(t);c.append(el('button',{class:'btn green',onclick:()=>{s.notes.main=t.value;save(s);toast('Notes sauvegardées');rr()}},'Sauver notes'));root.append(c)}
function epfcToday(){return courseByCode(EPFC_DAILY_ROTATION[dayIndex(new Date())%EPFC_DAILY_ROTATION.length])}function dayIndex(d){const start=new Date(d.getFullYear(),0,1);return Math.floor((d-start)/86400000)}function courseByCode(code){return EPFC_YEAR1.find(c=>c.code===code)||EPFC_YEAR1[0]}
function epfcResume(code){const st=Store.get('epfc_y1_state',{})[code]||{};const course=courseByCode(code);const r=course.resources[st.activeIndex||0];if(!r)return 'parcours terminé';const p=st.progress?.[r[0]]||{};return r[1]+' · '+(p.current||0)+'/'+(p.total||'?')+' '+r[3]}
function trackResume(track){const all=Store.get('track_state',{});const s=all[track]||{};const b=(BOOKS[track]||[])[s.bookIndex||0]||'livres terminés';const e=(EXERCISE_PACKS[track]||[])[s.exerciseIndex||0]||'exercices terminés';return 'Livre: '+b+' · Exercice: '+e}
function nlResume(){const d=Store.get('nl_program',{level:'A1',target:'SELOR'});return 'niveau '+d.level+' → '+d.target+' · Anki/écoute/phrases/corrections'}
function sportToday(){const c=Store.sportCycle();const diff=Math.floor((new Date(Store.today())-new Date(c.anchorDate))/86400000);const start=SPORT_CYCLE.indexOf(c.anchorType);return SPORT_CYCLE[((start<0?0:start)+diff%SPORT_CYCLE.length+SPORT_CYCLE.length)%SPORT_CYCLE.length]}

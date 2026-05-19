import * as Store from '../assets/js/store.js';
import { el, card, subTabs, toast } from '../assets/js/ui.js';
let panel='chess';
const BOOKS=[
{id:'dehaene_apprendre',cat:'apprendre',title:'Apprendre !',author:'Stanislas Dehaene',why:'neurosciences cognitives de l apprentissage'},
{id:'dehaene_lecture',cat:'memoire',title:'Les Neurones de la lecture',author:'Stanislas Dehaene',why:'lecture, cerveau, apprentissage'},
{id:'dehaene_bosse',cat:'science',title:'La Bosse des maths',author:'Stanislas Dehaene',why:'cognition numerique'},
{id:'kahneman_s1s2',cat:'psychologie',title:'Systeme 1 / Systeme 2',author:'Daniel Kahneman',why:'biais cognitifs et decision'},
{id:'cialdini_influence',cat:'charisme',title:'Influence et manipulation',author:'Robert Cialdini',why:'psychologie sociale de la persuasion'},
{id:'cialdini_presuasion',cat:'charisme',title:'Pre-suasion',author:'Robert Cialdini',why:'influence avant decision'},
{id:'damasio_descartes',cat:'psychologie',title:'L Erreur de Descartes',author:'Antonio Damasio',why:'emotion, raison, decision'},
{id:'damasio_spinoza',cat:'corps',title:'Spinoza avait raison',author:'Antonio Damasio',why:'emotion, corps, cerveau'},
{id:'thaler_nudge',cat:'argent',title:'Nudge',author:'Richard Thaler, Cass Sunstein',why:'economie comportementale'},
{id:'thaler_misbehaving',cat:'argent',title:'Misbehaving',author:'Richard Thaler',why:'comportements economiques reels'},
{id:'housel_psyargent',cat:'argent',title:'La Psychologie de l argent',author:'Morgan Housel',why:'comportement financier'},
{id:'spiegelhalter_stat',cat:'science',title:'L Art de la statistique',author:'David Spiegelhalter',why:'raisonnement statistique'},
{id:'rosling_factfulness',cat:'science',title:'Factfulness',author:'Hans Rosling',why:'donnees et biais'},
{id:'enders_intestin',cat:'corps',title:'Le Charme discret de l intestin',author:'Giulia Enders',why:'physiologie digestive'},
{id:'walker_sommeil',cat:'corps',title:'Pourquoi nous dormons',author:'Matthew Walker',why:'sommeil et performance'},
{id:'hutchinson_endure',cat:'corps',title:'Endurance',author:'Alex Hutchinson',why:'performance physique'},
{id:'moukheiber_cerveau',cat:'psychologie',title:'Votre cerveau vous joue des tours',author:'Albert Moukheiber',why:'biais cognitifs'},
{id:'bohler_bug',cat:'corps',title:'Le Bug humain',author:'Sebastien Bohler',why:'dopamine et comportement'},
{id:'bohler_sens',cat:'psychologie',title:'Ou est le sens ?',author:'Sebastien Bohler',why:'motivation et sens'},
{id:'taleb_cygne',cat:'argent',title:'Le Cygne noir',author:'Nassim Nicholas Taleb',why:'risque et incertitude'},
{id:'taleb_hasard',cat:'argent',title:'Le Hasard sauvage',author:'Nassim Nicholas Taleb',why:'hasard, finance, decision'},
{id:'sapolsky_comportements',cat:'corps',title:'Pourquoi nous faisons ce que nous faisons',author:'Robert Sapolsky',why:'biologie du comportement'}
];
export function renderLeisure(root,rr){root.append(subTabs([{id:'chess',label:'Échecs'},{id:'reading',label:'Lecture'}],panel,id=>{panel=id;rr()}));const box=el('div');root.append(box);if(panel==='reading')return reading(box,rr);chess(box,rr)}
function chess(root,rr){const h=Store.get('chess_elo_history',[]);const last=h[h.length-1];const c=card('Échecs · ELO tracker',last?'ELO actuel '+last.elo+' · rang '+rank(last.elo):'Aucun ELO loggé');c.append(graph(h));const elo=input('nouvel ELO','number',last?.elo||''),platform=select(['Chess.com','Lichess','OTB','Autre'],last?.platform||'Chess.com'),note=input('note');c.append(el('div',{class:'row'},[elo,platform,note,el('button',{class:'btn green',onclick:()=>{Store.push('chess_elo_history',{date:Store.today(),elo:+elo.value||0,platform:platform.value,note:note.value});toast('ELO sauvegardé');rr()}},'Ajouter ELO')]));root.append(c);root.append(rankingCard(h));root.append(historyCard(h))}
function graph(h){if(!h.length)return el('div',{class:'exercise'},'Graph vide. Ajoute ton premier ELO.');const vals=h.map(x=>+x.elo||0),min=Math.min(...vals),max=Math.max(...vals),range=Math.max(1,max-min),w=320,hg=120;const pts=vals.map((v,i)=>{const x=vals.length===1?w/2:i*(w/(vals.length-1));const y=hg-10-((v-min)/range)*(hg-20);return x+','+y}).join(' ');return el('div',{class:'exercise'},el('svg',{viewBox:'0 0 '+w+' '+hg,style:'width:100%;height:140px'},[el('polyline',{points:pts,fill:'none',stroke:'currentColor','stroke-width':'4'}),el('text',{x:'4',y:'14',fill:'currentColor'},String(max)),el('text',{x:'4',y:String(hg-4),fill:'currentColor'},String(min))]))}
function rank(e){e=+e||0;if(e<800)return'Débutant';if(e<1000)return'Novice';if(e<1200)return'Intermédiaire bas';if(e<1400)return'Intermédiaire';if(e<1600)return'Club';if(e<1800)return'Bon club';if(e<2000)return'Avancé';if(e<2200)return'Expert';return'Maître / très fort'}
function rankingCard(h){const last=h[h.length-1]?.elo||0;const c=card('Ranking ELO','Classement indicatif par tranche.');[['0-799','Débutant'],['800-999','Novice'],['1000-1199','Intermédiaire bas'],['1200-1399','Intermédiaire'],['1400-1599','Club'],['1600-1799','Bon club'],['1800-1999','Avancé'],['2000-2199','Expert'],['2200+','Maître / très fort']].forEach(r=>c.append(el('div',{class:'exercise '+(rank(last)===r[1]?'ok':'')},r[0]+' · '+r[1])));return c}
function historyCard(h){const c=card('Historique ELO','Derniers logs.');h.slice(-15).reverse().forEach(x=>c.append(el('div',{class:'exercise'},x.date+' · '+x.platform+' · '+x.elo+' · '+rank(x.elo)+' · '+(x.note||''))));return c}
function reading(root,rr){const state=Store.get('leisure_books',{});root.append(readingStats(state));const c=card('Lecture scientifique','Liste française sérieuse. Disponibilité Amazon.fr à revérifier avant achat. Suivi par pages.');BOOKS.forEach(b=>{const st=state[b.id]||{};const row=el('div',{class:'exercise '+(st.status==='done'?'ok':'')});row.append(el('b',{},b.title+' · '+b.author));row.append(el('div',{class:'small muted'},b.cat+' · '+b.why+' · Amazon.fr'));const total=input('pages','number',st.total||''),cur=input('lu','number',st.current||'');row.append(el('div',{class:'row'},[cur,total,el('button',{class:'btn',onclick:()=>{state[b.id]={...st,current:+cur.value||0,total:+total.value||0,status:'active',title:b.title,author:b.author,cat:b.cat};Store.set('leisure_books',state);toast('Lecture sauvegardée');rr()}},'Sauver'),el('button',{class:'btn green',onclick:()=>{state[b.id]={...st,current:+total.value||st.total||0,total:+total.value||st.total||0,status:'done',title:b.title,author:b.author,cat:b.cat};Store.set('leisure_books',state);toast('Livre terminé');rr()}},'Terminé')]));c.append(row)});root.append(c)}
function readingStats(state){const vals=Object.values(state),done=vals.filter(x=>x.status==='done').length,active=vals.filter(x=>x.status==='active').length,pages=vals.reduce((a,x)=>a+(+x.current||0),0);return card('Stats lecture','Actifs '+active+' · terminés '+done+' · pages lues '+pages)}
function input(p,t='text',v=''){return el('input',{class:'input',placeholder:p,type:t,value:v,style:'max-width:160px'})}function select(items,v){const s=el('select',{class:'input',style:'max-width:160px'});items.forEach(x=>s.append(el('option',{value:x},x)));s.value=v;return s}

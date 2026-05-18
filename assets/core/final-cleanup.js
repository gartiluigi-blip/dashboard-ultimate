(function(){
'use strict';
if(window.UDFinalCleanup&&window.UDFinalCleanup.version==='v1')return;
function $(s,r){return(r||document).querySelector(s)}
function $$(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))}
function text(el){return(el&&el.textContent||'').replace(/\s+/g,' ').trim()}
function remove(el){if(el&&el.parentNode)el.parentNode.removeChild(el)}
function hide(el){if(el)el.style.display='none'}
function page(id){return $('#p-'+id)||$('[data-page="'+id+'"]')}
function smallBlock(el){var t=text(el);return t&&t.length<900}
function killBlocks(root,patterns){if(!root)return;$$('section,article,div,li,p,button,span,.card,.callout',root).forEach(function(el){var t=text(el);if(!t||t.length>900)return;if(patterns.some(function(re){return re.test(t)})){var n=el.closest('.card,.callout,article,section,li,div')||el;hide(n)}})}
function replaceText(root,re,to){if(!root)return;var w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);var a=[];while(w.nextNode())a.push(w.currentNode);a.forEach(function(n){n.nodeValue=String(n.nodeValue||'').replace(re,to)})}
function cleanNav(){
  $$('[data-tab],[data-go],[data-go-tab],button,a,.tab').forEach(function(el){
    var t=text(el);
    if(/\b(admin|job)\b/i.test(t)&&t.length<80)hide(el);
    if(/trading/i.test(t)&&t.length<80){
      if(/élec|elec|iot|🔌/i.test(t))el.textContent='🔌 Élec/IoT';
      else hide(el);
    }
  });
  $$('[data-tab="trading"]').forEach(function(el){el.textContent='🔌 Élec/IoT'});
}
function cleanHome(){
  var h=page('home');if(!h)return;
  killBlocks(h,[/trading/i,/repas/i,/compl[eé]ments?/i,/meal/i,/supplements?/i]);
  ['#log-meals','.log-meals','#meal-row-meals','#meal-row-supp','#v77-prio-command'].forEach(function(s){$$(s,h).forEach(hide)});
}
function movePrioritiesToRoutine(){
  var home=page('home'),routine=page('routine');if(!routine)return;
  var box=$('#v77-prio-command')||$('.v77-prio-command');
  if(box){
    if(home&&home.contains(box)){
      var target=$('#ud-routine-priority-host',routine);
      if(!target){target=document.createElement('div');target.id='ud-routine-priority-host';target.className='card';target.style.margin='12px 0';var header=$('.page-header',routine)||routine.firstElementChild;header&&header.parentNode?header.parentNode.insertBefore(target,header.nextSibling):routine.insertBefore(target,routine.firstChild)}
      target.appendChild(box);box.style.display='';
    }
  }
  if(!$('#ud-routine-priority-note',routine)){
    var note=document.createElement('div');note.id='ud-routine-priority-note';note.className='callout callout-info';note.innerHTML='<strong>Priorités :</strong> P0 rouge = critique, P1 orange = important, P2 bleu = normal, P3 gris = parking. Pilotage uniquement dans Routine.';var a=$('#ud-routine-priority-host',routine)||$('.page-header',routine)||routine.firstElementChild;a&&a.parentNode?a.parentNode.insertBefore(note,a.nextSibling):routine.insertBefore(note,routine.firstChild)
  }
}
function cleanEpfc(){
  var p=page('epfc');if(!p)return;
  ['#v78-grade-epfc','#v79-grade-epfc','#v79-freeze-badge','.v79-grade-panel','.v80-exam-box'].forEach(function(s){$$(s,p).forEach(hide)});
  killBlocks(p,[/mode examen/i,/assurance/i,/langue appliqu[eé]e/i,/2GB5/i,/v79 freeze guard/i,/15\s*(à|a|-)\s*17/i,/vocal inbox/i,/\br[eè]gles\b/i,/informatique\s*[—-]\s*pas\s*assurance/i]);
  replaceText(p,/Mode examen/gi,'Test blanc');
}
function cleanPlan(){var p=page('plan');if(!p)return;replaceText(p,/lettre\s+mar\s+lettre/gi,'lettre par lettre')}
function cleanElecIot(){var p=page('trading')||$('[data-page="trading"]');if(!p)return;replaceText(p,/reprendre\s+trading/gi,'reprendre électronique / IoT');replaceText(p,/trading/gi,'électronique / IoT')}
function cleanFinance(){killBlocks(page('finance'),[/rappels? admin be/i,/admin be/i])}
function cleanNutrition(){
  var p=page('nutrition');if(!p)return;
  killBlocks(p,[/recette/i,/6\s*repas/i,/repas/i,/protocole/i,/stack/i,/compl[eé]ments?/i,/suppl[eé]ments?/i,/cr[eé]atine/i,/omega/i,/vitamine/i]);
  if(!$('#ud-nutrition-keep-note',p)){
    var n=document.createElement('div');n.id='ud-nutrition-keep-note';n.className='callout callout-info';n.innerHTML='<strong>Nutrition conservée :</strong> tracker protéines + eau uniquement. Les suppléments restent dans Routine.';p.insertBefore(n,p.firstChild)
  }
}
function cleanSport(){
  var p=page('sport');if(!p)return;
  replaceText(p,/split squat(?: bulgare)?\s*(à|a)\s*la\s*barre/gi,'split squat bulgare aux haltères uniquement');
  replaceText(p,/barbell split squat/gi,'split squat bulgare aux haltères uniquement');
  replaceText(p,/barre sur la nuque/gi,'aucune charge sur la nuque');
  if(!$('#ud-sport-cervical-safe',p)){
    var box=document.createElement('div');box.id='ud-sport-cervical-safe';box.className='card';box.innerHTML='<h2 class="section-title jade">Sport · sécurité cervicales + souplesse intégrée</h2><ul class="dlist"><li><span class="k">Interdit</span><span class="v warn">split squat à la barre / charge sur nuque / behind-neck press</span><div class="note">Remplacement : leg press, step-up, hip thrust, goblet squat léger, Bulgarian split squat haltères si toléré.</div></li><li><span class="k">Dos / tirage</span><span class="v pos">tractions obligatoires</span><div class="note">Tractions strictes, assistées ou tirage vertical prise neutre les jours dos/pull.</div></li><li><span class="k">Souplesse</span><span class="v info">intégrée au sport</span><div class="note">Mobilité thoracique, épaules, hanches, ischios, respiration. Stop si douleur cervicale/bras.</div></li></ul>';
    var h=$('.page-header',p)||p.firstElementChild;h&&h.parentNode?h.parentNode.insertBefore(box,h.nextSibling):p.insertBefore(box,p.firstChild)
  }
  $$('[data-tab="flex"],#p-flex').forEach(hide);
}
function cleanOsButton(){
  $$('button,a,li,div').forEach(function(el){var t=text(el);if(!t||t.length>120)return;if(/\bOS\b/i.test(t)||/syst[eè]me/i.test(t)){['trading','admin','job'].forEach(function(w){if(new RegExp('\\b'+w+'\\b','i').test(t)&&smallBlock(el))replaceText(el,new RegExp(w,'gi'),'')})}})
}
function addDiagnostics(){window.UDFinalCleanupStatus={version:'v1',studyHost:!!$('#study-resources-host'),etudes:!!window.UDEtudesTracker,study:!!window.__studyTracker,runAt:new Date().toISOString()}}
function run(){cleanNav();cleanHome();movePrioritiesToRoutine();cleanEpfc();cleanPlan();cleanElecIot();cleanFinance();cleanNutrition();cleanSport();cleanOsButton();addDiagnostics()}
function boot(){run();setTimeout(run,300);setTimeout(run,1000);setTimeout(run,2200);document.addEventListener('click',function(e){if(e.target&&e.target.closest&&e.target.closest('.tab,[data-tab],[data-go],button,a'))setTimeout(run,150)},true)}
window.UDFinalCleanup={version:'v1',run:run};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
/* User patch 2026-05-18: IoT/Réparation + Sport/Études/Loisir design */
(function(){
  'use strict';
  if (window.__UD_USER_REQUEST_20260518__) return;
  window.__UD_USER_REQUEST_20260518__ = true;

  const D = {
    repair:{icon:'🔧',label:'Réparation',short:'Réparation électronique',target:180,color:'var(--amber,#f59e0b)',hint:'How to Diagnose · multimètre · panne alimentation',focus:'Diagnostic panne, mesure, soudure propre, preuve.'},
    iot:{icon:'🌐',label:'IoT',short:'IoT / embarqué',target:150,color:'var(--sapphire,#3b82f6)',hint:'ESP32 · GPIO · capteur · MQTT',focus:'Microcontrôleur, capteur, réseau, test reproductible.'}
  };
  const $=(s,r=document)=>Array.from(r.querySelectorAll(s));
  const one=(s,r=document)=>r.querySelector(s);
  const id=x=>document.getElementById(x);
  const pg=x=>id('p-'+x);
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const pad=n=>String(n).padStart(2,'0');
  const iso=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
  const today=()=>iso(new Date());
  const add=(d,n)=>{const x=new Date(d);x.setDate(x.getDate()+n);return x};
  const get=(k,f)=>{try{const r=localStorage.getItem(k);return r?JSON.parse(r):f}catch(_){return f}};
  const set=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(_){}};
  const logKey=d=>'dashv2_extra_log_'+d;
  const extra=d=>get(logKey(d||today()),{});
  const saveExtra=(d,v)=>set(logKey(d||today()),v||{});

  function style(){
    if(id('ud-v16-style')) return;
    const css=`
    .ud-v16-card{position:relative;background:linear-gradient(135deg,rgba(255,69,0,.10),rgba(255,255,255,.035));border:1px solid rgba(255,255,255,.10);border-left:4px solid var(--flame,#ff4500);border-radius:14px;padding:14px;margin:12px 0;box-shadow:0 18px 42px rgba(0,0,0,.35);overflow:hidden}.ud-v16-card:before{content:"";position:absolute;inset:0;background:radial-gradient(circle at 0 0,rgba(255,106,53,.18),transparent 38%);pointer-events:none}.ud-v16-card>*{position:relative;z-index:1}.ud-v16-k{font:900 9px var(--f-mono,ui-monospace,monospace);letter-spacing:.16em;text-transform:uppercase;color:var(--flame-2,#ff6b35)}.ud-v16-t{font:900 17px var(--f-sans,system-ui,sans-serif);letter-spacing:-.02em;color:#fff;text-transform:uppercase;line-height:1.08}.ud-v16-s{font:600 12px var(--f-sans,system-ui,sans-serif);color:var(--text-dim,#cbd5e1);line-height:1.45;margin-top:4px}.ud-v16-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(185px,1fr));gap:10px;margin-top:10px}.ud-v16-mini{background:rgba(0,0,0,.32);border:1px solid rgba(255,255,255,.08);border-radius:12px;padding:11px}.ud-v16-mini b{display:block;color:#fff;font-size:12px;text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px}.ud-v16-mini span,.ud-v16-mini li{color:var(--text-dim,#cbd5e1);font-size:11.5px;line-height:1.45}.ud-v16-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}.ud-v16-btn{border:1px solid rgba(255,255,255,.14);background:#ff4500;color:#050508;border-radius:9px;padding:8px 10px;font:900 10px var(--f-sans,system-ui,sans-serif);text-transform:uppercase;letter-spacing:.08em;cursor:pointer}.ud-v16-btn.secondary{background:rgba(255,255,255,.06);color:#fff}.ud-v16-resume{display:grid;grid-template-columns:36px 1fr;gap:10px;align-items:flex-start;background:rgba(255,255,255,.035);border:1px solid rgba(255,255,255,.08);border-left:3px solid var(--sapphire,#3b82f6);border-radius:12px;padding:12px;margin:10px 0}.ud-v16-ico{width:36px;height:36px;display:grid;place-items:center;background:#000;border:1px solid rgba(255,255,255,.12);border-radius:10px;font-size:18px}.ud-v16-resume h3{margin:0 0 4px;font:900 14px var(--f-sans,system-ui,sans-serif);text-transform:uppercase;letter-spacing:.04em;color:#fff}.ud-v16-resume textarea,.ud-v16-resume input{width:100%;margin-top:7px;background:rgba(0,0,0,.32)!important;border:1px solid rgba(255,255,255,.10)!important;border-radius:9px!important;padding:8px!important;color:#fff!important;text-align:left!important;font:600 12px var(--f-sans,system-ui,sans-serif)!important}.ud-v16-tabs{display:flex;gap:6px;overflow:auto;padding:2px 0 8px;margin-top:10px;scrollbar-width:none}.ud-v16-tab{white-space:nowrap;border:1px solid rgba(255,255,255,.11);background:rgba(255,255,255,.04);color:#b8b8c8;border-radius:999px;padding:8px 10px;font:900 10px var(--f-sans,system-ui,sans-serif);text-transform:uppercase;letter-spacing:.08em;cursor:pointer}.ud-v16-tab.active{background:var(--flame,#ff4500);color:#000;border-color:transparent}.ud-v16-panel{display:none}.ud-v16-panel.active{display:block}.ud-v16-resource{display:grid;grid-template-columns:1fr auto;gap:8px;align-items:start;padding:10px 0;border-bottom:1px solid rgba(255,255,255,.07)}.ud-v16-resource:last-child{border-bottom:0}.ud-v16-resource b{font-size:12px;color:#fff}.ud-v16-resource small{display:block;color:var(--text-faint,#94a3b8);font-size:10.5px;margin-top:2px}.ud-v16-badge{border:1px solid rgba(255,255,255,.12);background:rgba(0,0,0,.25);border-radius:999px;padding:4px 7px;color:var(--flame-2,#ff6b35);font:900 9px var(--f-mono,ui-monospace,monospace);text-transform:uppercase;white-space:nowrap}.ud-v16-mins{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:10px}.ud-v16-mins div{background:rgba(0,0,0,.28);border:1px solid rgba(255,255,255,.08);border-radius:10px;padding:9px}.ud-v16-mins b{display:block;color:#fff;font-size:12px}.ud-v16-mins span{color:var(--text-faint,#94a3b8);font-size:11px}.ud-v16-split{margin:8px 0 0 0;padding-left:16px}.ud-v16-split li{margin:3px 0}@media(max-width:640px){.ud-v16-grid,.ud-v16-mins{grid-template-columns:1fr}.ud-v16-t{font-size:15px}.ud-v16-resource{grid-template-columns:1fr}.ud-v16-resume{grid-template-columns:30px 1fr}.ud-v16-ico{width:30px;height:30px}}`;
    const st=document.createElement('style');st.id='ud-v16-style';st.textContent=css;document.head.appendChild(st);
  }

  function saveInputs(){
    const data=extra(today());
    Object.keys(D).forEach(k=>{const inp=one('[data-log-input="'+k+'"]'); if(inp) data[k]=Math.max(0,Number(inp.value||0));});
    saveExtra(today(),data); progress(); routineMins();
  }

  function logRows(){
    const grid=one('#p-home .log-grid'); if(!grid) return;
    const anchor=id('log-c7-row')||one('#p-home .log-row-sleep');
    Object.keys(D).forEach(k=>{
      if(one('[data-log="'+k+'"]',grid)) return;
      const d=D[k], row=document.createElement('div');
      row.className='log-row ud-v16-extra-log'; row.dataset.log=k;
      row.innerHTML='<span class="log-row-icon">'+d.icon+'</span><div class="log-row-label"><b>'+esc(d.label)+'</b><em>'+esc(d.short)+'</em></div><input type="number" class="log-input" data-log-input="'+k+'" min="0" max="600" step="5" placeholder="0" inputmode="numeric" pattern="[0-9.]*"><span class="log-unit">min</span>';
      anchor&&anchor.parentNode===grid?grid.insertBefore(row,anchor):grid.appendChild(row);
      const saved=extra(today())[k]; if(saved) one('[data-log-input="'+k+'"]',row).value=saved;
    });
    Object.keys(D).forEach(k=>{const inp=one('[data-log-input="'+k+'"]',grid); if(inp&&!inp.dataset.udv16){inp.dataset.udv16='1'; inp.addEventListener('input',saveInputs); inp.addEventListener('change',saveInputs);}});
    const btn=id('log-save'); if(btn&&!btn.dataset.udv16){btn.dataset.udv16='1'; btn.addEventListener('click',()=>setTimeout(saveInputs,0));}
  }

  function week(k){let t=0,b=new Date(); for(let i=0;i<7;i++) t+=Number(extra(iso(add(b,-i)))[k]||0); return t;}
  function ring(k){const d=D[k];return '<div class="quick-row ud-v16-extra-progress" data-ud-progress="'+k+'"><div class="ring"><svg viewBox="0 0 36 36"><circle class="ring-bg" cx="18" cy="18" r="15.5"/><circle class="ring-fill" cx="18" cy="18" r="15.5" stroke-dasharray="97.4" stroke-dashoffset="97.4" data-ring="'+k+'" style="stroke:'+d.color+'"/></svg><div class="ring-val" data-ring-val="'+k+'">0%</div></div><div class="quick-row-text"><div class="quick-row-label">'+d.icon+' '+esc(d.short)+'</div><div class="quick-row-big">Bloc terrain · <em>progression réelle</em></div><div class="quick-row-desc">Cible : <b>'+d.target+' min / semaine</b>. Visible dans Aujourd’hui, Routine, Focus et Progression.</div><span class="quick-row-meta"><b data-week-val="'+k+'">0 min</b> cette semaine · cible <b>'+d.target+' min</b></span></div></div>';}
  function progressionRows(){
    const home=pg('home'); if(!home||one('[data-ud-progress="repair"]',home)) return;
    const rows=$('.quick-row',home), wrap=document.createElement('div'); wrap.id='ud-v16-extra-progress'; wrap.innerHTML=ring('repair')+ring('iot');
    const anchor=rows.length?rows[rows.length-1].nextSibling:one('.heatmap-wrap',home);
    anchor&&anchor.parentNode?anchor.parentNode.insertBefore(wrap,anchor):home.appendChild(wrap);
  }
  function progress(){Object.keys(D).forEach(k=>{const total=week(k),pct=Math.max(0,Math.min(100,Math.round(total/D[k].target*100)));$('[data-ring-val="'+k+'"]').forEach(e=>e.textContent=pct+'%');$('[data-week-val="'+k+'"]').forEach(e=>e.textContent=total+' min');$('[data-ring="'+k+'"]').forEach(e=>e.style.strokeDashoffset=String(97.4-(97.4*pct/100)));});}

  function resume(){
    const list=id('bookmark-list'); if(!list||id('ud-v16-resume')) return;
    const wrap=document.createElement('div'); wrap.id='ud-v16-resume';
    Object.keys(D).forEach(k=>{const d=D[k], s=get('dashv2_resume_'+k,{});wrap.insertAdjacentHTML('beforeend','<div class="ud-v16-resume" data-resume-domain="'+k+'"><div class="ud-v16-ico">'+d.icon+'</div><div><h3>'+(k==='repair'?'Diagnostic réparation':'Lab IoT')+'</h3><div class="ud-v16-s">Reprise immédiate : ressource, endroit exact, prochaine action.</div><input data-resume-field="resource" placeholder="Ressource · '+esc(d.hint)+'" value="'+esc(s.resource||'')+'"><input data-resume-field="position" placeholder="Position exacte · page / minute / étape" value="'+esc(s.position||'')+'"><textarea data-resume-field="next" rows="2" placeholder="Prochaine action concrète">'+esc(s.next||'')+'</textarea><div class="ud-v16-actions"><button type="button" class="ud-v16-btn" data-focus-domain="'+k+'">Démarrer focus '+esc(d.label)+'</button><button type="button" class="ud-v16-btn secondary" data-clear-resume="'+k+'">Reset</button></div></div></div>');});
    list.prepend(wrap);
    $('[data-resume-domain]',wrap).forEach(card=>{const k=card.dataset.resumeDomain; card.addEventListener('input',()=>{const v={};$('[data-resume-field]',card).forEach(i=>v[i.dataset.resumeField]=i.value||'');set('dashv2_resume_'+k,v);}); const clr=one('[data-clear-resume]',card); if(clr) clr.onclick=()=>{set('dashv2_resume_'+k,{});$('[data-resume-field]',card).forEach(i=>i.value='');};});
  }

  function focus(k){const d=D[k]; if(!d)return; set('dashv2_focus_intent',{domain:k,label:d.label,minutes:25,startedAt:new Date().toISOString(),note:d.focus}); const t=id('na-title'),s=id('na-sub'); if(t)t.textContent=d.icon+' Focus '+d.label+' · 25 min'; if(s)s.textContent=d.focus; const st=id('log-status'); if(st)st.textContent='Focus '+d.label+' armé · Pomodoro 25/5 prêt.'; const p=one('[data-action="pomo-open"]')||id('na-start'); try{p&&p.click()}catch(_){}}
  function focusPanel(){
    if(id('ud-v16-focus')) return; const a=id('next-action')||one('#p-home .hero'); if(!a||!a.parentNode)return;
    const c=document.createElement('div'); c.id='ud-v16-focus'; c.className='ud-v16-card'; c.innerHTML='<div class="ud-v16-k">Focus opérationnel</div><div class="ud-v16-t">Réparation + IoT disponibles en focus</div><div class="ud-v16-s">Deux boutons directs. Ça alimente aussi Reprendre et les minutes/progression.</div><div class="ud-v16-actions"><button type="button" class="ud-v16-btn" data-focus-domain="repair">🔧 Focus réparation</button><button type="button" class="ud-v16-btn" data-focus-domain="iot">🌐 Focus IoT</button></div>'; a.parentNode.insertBefore(c,a.nextSibling);
  }

  function routine(){
    const r=pg('routine'); if(!r)return;
    if(!id('ud-v16-routine')){const host=id('routine-blocks-host')||one('#p-routine .routine-progress')||one('#p-routine .wake-bar')||r.firstElementChild; const c=document.createElement('div'); c.id='ud-v16-routine'; c.className='ud-v16-card'; c.innerHTML='<div class="ud-v16-k">Bloc routine obligatoire</div><div class="ud-v16-t">IoT + Réparation électronique</div><div class="ud-v16-s">À placer en bloc court dans les journées chargées, et en bloc profond les jours libres. Visible en bas dans les minutes.</div><div class="ud-v16-grid"><div class="ud-v16-mini"><b>🔧 Réparation</b><span>Diagnostic panne, multimètre, alimentation, connecteurs, soudure propre, preuve photo.</span></div><div class="ud-v16-mini"><b>🌐 IoT</b><span>ESP32/Raspberry Pi, capteur, GPIO/API, test + log d’erreur.</span></div></div><div class="ud-v16-mins" id="ud-v16-mins"></div><div class="ud-v16-actions"><button type="button" class="ud-v16-btn" data-focus-domain="repair">Focus réparation</button><button type="button" class="ud-v16-btn" data-focus-domain="iot">Focus IoT</button></div>'; host&&host.parentNode?host.parentNode.insertBefore(c,host.nextSibling):r.prepend(c);}
    $('.shift-view .timeline').forEach(tl=>{if(one('.ud-v16-routine-tl',tl))return; const it=document.createElement('div');it.className='tl-item ud-v16-routine-tl';it.dataset.time='flex';it.innerHTML='<div class="tl-dot ai"></div><div class="tl-time">Bloc flexible</div><div class="tl-name">🔧 Réparation + 🌐 IoT</div><div class="tl-desc">25–45 min. Réparation : diagnostic/soudure/mesures. IoT : capteur + microcontrôleur + test. Minutes visibles dans Aujourd’hui et Progression.</div>'; const code=one('.tl-dot.code',tl); const after=code&&code.closest('.tl-item'); after&&after.parentNode?after.parentNode.insertBefore(it,after.nextSibling):tl.appendChild(it);});
    routineMins();
  }
  function routineMins(){const w=id('ud-v16-mins'); if(!w)return; w.innerHTML='<div><b>Réparation : '+week('repair')+' min</b><span>semaine glissante · cible 180</span></div><div><b>IoT : '+week('iot')+' min</b><span>semaine glissante · cible 150</span></div>';}

  function sport(){const s=pg('sport'); if(!s||id('ud-v16-sport'))return; const c=document.createElement('div'); c.id='ud-v16-sport'; c.className='ud-v16-card'; c.innerHTML='<div class="ud-v16-k">Sport upgrade</div><div class="ud-v16-t">Poids du corps + souplesse grand écart</div><div class="ud-v16-s">Force utilisable, mobilité réelle, progression propre. Pas de ego-lift.</div><div class="ud-v16-grid"><div class="ud-v16-mini"><b>Dos / pull</b><span>Tractions assistées/négatives, rowing inversé, scapular pull-ups, dead hang contrôlé.</span></div><div class="ud-v16-mini"><b>Pecs / push</b><span>Pompes inclinées → strictes → dips assistés. Amplitude propre.</span></div><div class="ud-v16-mini"><b>Jambes</b><span>Split squat, squat tempo, fentes arrière, hip thrust une jambe, mollets.</span></div><div class="ud-v16-mini"><b>Core</b><span>Dead bug, hollow hold, side plank, bird-dog.</span></div></div><div class="ud-v16-card" style="margin:12px 0 0;border-left-color:var(--jade,#22c55e)"><div class="ud-v16-k">Souplesse max</div><div class="ud-v16-t">Routine grand écart · 25 min</div><ul class="ud-v16-split"><li>5 min hanches : 90/90 + rotations contrôlées</li><li>5 min ischios : good morning léger + pike stretch</li><li>5 min adducteurs : frog stretch + side lunge hold</li><li>5 min fléchisseurs : couch stretch + fente basse</li><li>5 min PNF doux : contraction 5 sec / relâche 20 sec ×3</li></ul><div class="ud-v16-s">4×/semaine. Stop si douleur nerveuse, engourdissement ou perte de force.</div></div>'; const h=one('#p-sport .page-header')||one('#p-sport .page-title')||s.firstElementChild; h&&h.parentNode?h.parentNode.insertBefore(c,h.nextSibling):s.prepend(c);}

  const STUDY={
    python:['Python / algo',[['Think Python, 3rd Edition','Allen B. Downey · O’Reilly · base Python propre'],['Python Crash Course, 3rd Edition','Eric Matthes · No Starch via O’Reilly Learning · exercices directs'],['Automate the Boring Stuff with Python','Al Sweigart · No Starch via O’Reilly Learning · automatisation pratique']]],
    os:['Systèmes / Linux',[['How Linux Works, 3rd Edition','Brian Ward · No Starch via O’Reilly Learning'],['Learning Modern Linux','Michael Hausenblas · O’Reilly'],['Linux Pocket Guide, 4th Edition','Daniel J. Barrett · O’Reilly']]],
    archi:['Architecture ordinateur',[['Computer Organization and Design RISC-V Edition','Patterson & Hennessy · via O’Reilly Learning'],['Code: The Hidden Language of Computer Hardware and Software','Charles Petzold · via O’Reilly Learning'],['Make: Electronics','Charles Platt · Make/O’Reilly']]],
    repair:['Réparation électronique',[['How to Diagnose and Fix Everything Electronic, 2nd Edition','Michael Jay Geier · via O’Reilly Learning · diagnostic panne'],['Practical Electronics for Inventors, 4th Edition','Scherz & Monk · via O’Reilly Learning'],['Make: Electronics','Charles Platt · Make/O’Reilly']]],
    iot:['IoT / embarqué',[['Arduino Cookbook, 3rd Edition','Margolis, Jepson, Weldin · O’Reilly'],['Raspberry Pi Cookbook, 4th Edition','Simon Monk · O’Reilly'],['Getting Started with the Internet of Things','Cuno Pfister · O’Reilly']]],
    secu:['Sécurité / labs',[['Practical IoT Hacking','Chantzis et al. · via O’Reilly Learning'],['Network Security Assessment, 3rd Edition','Chris McNab · O’Reilly'],['Linux Basics for Hackers','OccupyTheWeb · via O’Reilly Learning']]],
    data:['SQL / data',[['Learning SQL, 3rd Edition','Alan Beaulieu · O’Reilly'],['SQL Cookbook, 2nd Edition','Molinaro & de Graaf · O’Reilly'],['Practical SQL, 2nd Edition','Anthony DeBarros · via O’Reilly Learning']]]
  };
  function study(){const e=pg('etude'); if(!e||id('ud-v16-study'))return; const keys=Object.keys(STUDY), c=document.createElement('div'); c.id='ud-v16-study'; c.className='ud-v16-card'; const tabs=keys.map((k,i)=>'<button type="button" class="ud-v16-tab '+(i?'':'active')+'" data-study-tab="'+k+'">'+esc(STUDY[k][0])+'</button>').join(''); const panels=keys.map((k,i)=>'<div class="ud-v16-panel '+(i?'':'active')+'" data-study-panel="'+k+'">'+STUDY[k][1].map(it=>'<div class="ud-v16-resource"><div><b>'+esc(it[0])+'</b><small>'+esc(it[1])+'</small></div><span class="ud-v16-badge">O’Reilly</span></div>').join('')+'</div>').join(''); c.innerHTML='<div class="ud-v16-k">Études · tri propre</div><div class="ud-v16-t">Ressources séparées par matière</div><div class="ud-v16-s">Liste verrouillée sur O’Reilly Learning / éditeurs disponibles via O’Reilly. Plus de mélange illisible.</div><div class="ud-v16-tabs">'+tabs+'</div>'+panels; const h=one('#p-etude .page-header')||one('#p-etude .page-title')||e.firstElementChild; h&&h.parentNode?h.parentNode.insertBefore(c,h.nextSibling):e.prepend(c); c.onclick=ev=>{const b=ev.target.closest('[data-study-tab]'); if(!b)return; const k=b.dataset.studyTab; $('.ud-v16-tab',c).forEach(x=>x.classList.toggle('active',x===b)); $('.ud-v16-panel',c).forEach(x=>x.classList.toggle('active',x.dataset.studyPanel===k));};}

  function chess(){const l=pg('loisir'); if(!l||id('ud-v16-chess'))return; const c=document.createElement('div'); c.id='ud-v16-chess'; c.className='ud-v16-card'; c.style.borderLeftColor='var(--gold,#facc15)'; c.innerHTML='<div class="ud-v16-k">Loisir propre</div><div class="ud-v16-t">Échecs · cockpit compact</div><div class="ud-v16-s">Fini le gros bloc moche. Puzzles, parties et analyse en format lisible.</div><div class="ud-v16-grid"><div class="ud-v16-mini"><b>10 min tactique</b><span>5 puzzles lents. Calculer avant de bouger.</span></div><div class="ud-v16-mini"><b>1 partie rapide</b><span>10+0 ou 15+10. Pas de bullet débile.</span></div><div class="ud-v16-mini"><b>Analyse</b><span>1 erreur critique notée. Une seule leçon par session.</span></div></div>'; const h=one('#p-loisir .page-header')||one('#p-loisir .page-title')||l.firstElementChild; h&&h.parentNode?h.parentNode.insertBefore(c,h.nextSibling):l.prepend(c);}

  function bind(){if(!document.body||document.body.dataset.udv16Focus)return; document.body.dataset.udv16Focus='1'; document.body.addEventListener('click',e=>{const b=e.target.closest('[data-focus-domain]'); if(!b)return; e.preventDefault(); focus(b.dataset.focusDomain);});}
  function apply(){try{style(); logRows(); progressionRows(); resume(); focusPanel(); routine(); sport(); study(); chess(); bind(); progress(); routineMins();}catch(e){console.warn('[ud-user-request-20260518]',e)}}
  function boot(){apply();[120,400,900,1800,3500].forEach(ms=>setTimeout(apply,ms)); try{new MutationObserver(()=>{clearTimeout(window.__udv16t);window.__udv16t=setTimeout(apply,80)}).observe(document.body,{childList:true,subtree:true})}catch(_){}}
  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',boot,{once:true}):boot();
})();

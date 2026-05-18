/* UD final safe cleanup — no giant repair/iot blocks */
(function(){
  'use strict';
  if (window.__UD_FINAL_SAFE_FIX__) return;
  window.__UD_FINAL_SAFE_FIX__ = true;
  var $ = function(s,r){ return Array.prototype.slice.call((r||document).querySelectorAll(s)); };
  var one = function(s,r){ return (r||document).querySelector(s); };
  var id = function(x){ return document.getElementById(x); };
  var rm = function(n){ if(n && n.parentNode) n.parentNode.removeChild(n); };

  function addCss(){
    if(id('ud-final-safe-css')) return;
    var st=document.createElement('style');
    st.id='ud-final-safe-css';
    st.textContent = `
      html body{background:#020203!important;color:#f7f7fb!important}
      html body .app{background:radial-gradient(circle at 80% 8%,rgba(255,70,22,.16),transparent 30%),linear-gradient(180deg,#020203,#07070c 45%,#030306)!important}
      html body .card,html body .chart-card,html body .review-card,html body .m-review,html body .log-widget,html body .quick-row,html body .mini-card,html body .goal-box,html body .training-status,html body .next-action,html body #next-action,html body .callout,html body .task-wrap,html body .xp-widget,html body .stat,html body .stats-card{background:linear-gradient(180deg,rgba(19,19,29,.97),rgba(5,5,9,.98))!important;border:1px solid rgba(255,255,255,.085)!important;border-left:4px solid #ff4a1c!important;border-radius:22px!important;box-shadow:0 20px 52px rgba(0,0,0,.46),inset 0 1px 0 rgba(255,255,255,.045)!important;overflow:hidden!important}
      html body .page-title{font-size:clamp(34px,12vw,58px)!important;line-height:.92!important;letter-spacing:-.06em!important;text-shadow:0 18px 36px rgba(0,0,0,.65)!important}
      html body .page-title em,html body .section-title em,html body .brand-title em{color:#ff5a24!important;font-style:italic!important;text-shadow:0 0 24px rgba(255,74,28,.28)!important}
      html body .section-title{font-size:12px!important;margin-top:30px!important;padding-top:4px!important;border-top:1px solid rgba(255,255,255,.06)!important;color:#f3f3f8!important;letter-spacing:.2em!important}
      html body .section-title:before{width:24px!important;height:4px!important;background:linear-gradient(90deg,#ff4a1c,#ffb000)!important;border-radius:99px!important;clip-path:none!important;box-shadow:0 0 18px rgba(255,74,28,.42)!important}
      html body .tl-item,html body .log-row,html body .prio-item,html body .task-item,html body .goal-item{background:rgba(255,255,255,.028)!important;border:1px solid rgba(255,255,255,.08)!important;border-radius:18px!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.035)!important}
      html body input,html body textarea,html body select{background:rgba(3,3,7,.78)!important;color:#f7f7fb!important;border:1px solid rgba(255,255,255,.12)!important;border-radius:14px!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.04)!important}
      html body button,html body .btn-primary,html body .save-btn,html body .task-add-btn,html body .goal-add-row button,html body .na-btn.primary,html body .training-cta,html body .pomo-session-chip.active,html body .wake-btn.active{border-radius:14px!important;background:linear-gradient(135deg,#ff8a3d,#ff4018 55%,#e92710)!important;color:#050506!important;border:1px solid rgba(255,255,255,.08)!important;box-shadow:0 14px 30px rgba(255,64,24,.25)!important;font-weight:900!important}
      html body #tabs .tab,html body nav.tabs .tab{border-radius:999px!important;background:rgba(255,255,255,.035)!important;border:1px solid rgba(255,255,255,.07)!important;color:#9b9bad!important;padding:10px 12px!important;margin:0 3px!important}
      html body #tabs .tab.active,html body nav.tabs .tab.active{color:#050506!important;background:linear-gradient(135deg,#ff8a3d,#ff4018)!important;box-shadow:0 12px 26px rgba(255,64,24,.24)!important}
      html body #tabs .tab.active:after,html body nav.tabs .tab.active:after{display:none!important}
      .ud-hide-final{display:none!important}
      @media(max-width:640px){html body .main{padding-left:26px!important;padding-right:26px!important}html body .card,html body .log-widget,html body .goal-box,html body .next-action,html body #next-action,html body .training-status{border-radius:20px!important}}
    `;
    document.head.appendChild(st);
  }

  function removeBadBlocks(){
    ['ud-v16-focus','ud-v16-resume','ud-v16-routine','ud-v16-sport','ud-v16-study','ud-v16-chess','ud-v16-extra-progress','ud-v16-extra-progress-wrap','ud-v17-bookmarks','ud-v17-ppl','ud-v17-study','ud-v18-books','ud-v18-ppl','ud-v18-study'].forEach(function(x){rm(id(x));});
    $('.ud-v16-card,.ud-v16-routine-tl,.ud-v16-extra-progress,.ud-v17-line,.ud-v17-bookmark,.ud-v17-grid,.ud-v18-book').forEach(rm);
    var prio = id('prio-list');
    if(prio){
      $('*',prio).forEach(function(el){
        var t=(el.textContent||'').toLowerCase();
        if(t.includes('réparation') || t.includes('reparation') || t.includes('iot')) rm(el.closest('.prio-item,.task-item,.card,li,div')||el);
      });
    }
  }

  function addSmallBookmarks(){
    var list=id('bookmark-list');
    if(!list || id('ud-final-bookmarks')) return;
    var base=one('.bookmark-item,.bookmark-card,.bookmark-row',list) || one('div',list);
    var wrap=document.createElement('div');
    wrap.id='ud-final-bookmarks';
    [['🔧','RÉPARATION','Ex. page / étape / prochaine action'],['🌐','IOT','Ex. ESP32 / capteur / test']].forEach(function(x){
      var node;
      if(base){
        node=base.cloneNode(true);
        node.querySelectorAll('input,textarea').forEach(function(inp){ inp.value=''; inp.placeholder=x[2]; });
        var b=node.querySelector('b,strong,.bookmark-title,.log-row-label b'); if(b) b.textContent=x[1];
        var ico=node.querySelector('.bookmark-icon,.log-row-icon,.ico'); if(ico) ico.textContent=x[0];
        var small=node.querySelector('small,em,.bookmark-sub'); if(small) small.textContent='jamais mis à jour';
      } else {
        node=document.createElement('div');
        node.className='bookmark-item';
        node.innerHTML='<span class="bookmark-icon">'+x[0]+'</span><div><b>'+x[1]+'</b><input placeholder="'+x[2]+'"><small>jamais mis à jour</small></div>';
      }
      node.setAttribute('data-final-bookmark',x[1]);
      wrap.appendChild(node);
    });
    list.appendChild(wrap);
  }

  function addDayMinutes(){
    var grid=one('#p-home .log-grid');
    if(!grid) return;
    var anchor=id('log-c7-row') || one('[data-log="vinted"]',grid);
    [['repair','🔧','Réparation','diagnostic + électronique'],['iot','🌐','IoT','capteurs + microcontrôleur']].forEach(function(x){
      if(one('[data-log="'+x[0]+'"]',grid)) return;
      var row=document.createElement('div');
      row.className='log-row';
      row.setAttribute('data-log',x[0]);
      row.innerHTML='<span class="log-row-icon">'+x[1]+'</span><div class="log-row-label"><b>'+x[2]+'</b><em>'+x[3]+'</em></div><input type="number" class="log-input" data-log-input="'+x[0]+'" min="0" max="600" step="5" placeholder="0" inputmode="numeric"><span class="log-unit">min</span>';
      if(anchor && anchor.parentNode) anchor.parentNode.insertBefore(row,anchor); else grid.appendChild(row);
    });
  }

  function compactChess(){
    var l=id('p-loisir'); if(!l) return;
    $('*',l).forEach(function(el){
      var t=(el.textContent||'').toLowerCase();
      if(t.includes('elo actuel')){
        var c=el.closest('.card,.chart-card,.log-widget')||el.parentElement;
        if(c){ c.style.maxHeight='260px'; c.style.minHeight='0'; c.style.overflow='hidden'; }
      }
    });
  }

  function apply(){addCss();removeBadBlocks();addSmallBookmarks();addDayMinutes();compactChess();}
  function boot(){apply();[300,900,1800,3500,7000].forEach(function(ms){setTimeout(apply,ms);});try{new MutationObserver(function(){clearTimeout(window.__udfinalt);window.__udfinalt=setTimeout(apply,150);}).observe(document.body,{childList:true,subtree:true});}catch(e){}}
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true}); else boot();
})();
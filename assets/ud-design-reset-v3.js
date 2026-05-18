/* UD DESIGN RESET V3 — neutralize old inline ippo-theme and force final boxing design */
(function(){
  'use strict';
  if (window.__UD_DESIGN_RESET_V3__) return;
  window.__UD_DESIGN_RESET_V3__ = true;

  var $ = function(s,r){ return Array.prototype.slice.call((r||document).querySelectorAll(s)); };
  var id = function(x){ return document.getElementById(x); };
  var rm = function(n){ if(n && n.parentNode) n.parentNode.removeChild(n); };

  function neutralizeLegacyStyles(){
    var old = id('ippo-theme');
    if(old){
      old.disabled = true;
      old.setAttribute('data-disabled-by','ud-design-reset-v3');
      old.textContent = '/* disabled by ud-design-reset-v3 */';
    }
    $('style').forEach(function(st){
      var txt = st.textContent || '';
      if(st.id !== 'ud-design-reset-v3-css' && /border-radius:\s*2px|HAJIME NO IPPO THEME|fight card style/i.test(txt)){
        st.disabled = true;
        st.setAttribute('data-disabled-by','ud-design-reset-v3');
      }
    });
  }

  function forceCss(){
    var existing = id('ud-design-reset-v3-css');
    if(existing) return;
    var st = document.createElement('style');
    st.id = 'ud-design-reset-v3-css';
    st.textContent = `
      :root{
        --ko-red:#f52212!important;--ko-orange:#ff5a18!important;--ko-gold:#ffb000!important;--ko-blue:#2878ff!important;--ko-black:#020203!important;--ko-card:#101018!important;--ko-line:rgba(255,255,255,.10)!important;
        --radius:22px!important;--surface:#101018!important;--surface-2:#151520!important;--bg:#020203!important;--bg-deep:#000!important;
      }
      html,body{background:#020203!important;color:#f8f8fb!important;min-height:100%!important;}
      body .app{background:radial-gradient(circle at 78% 8%,rgba(255,68,18,.22),transparent 29%),radial-gradient(circle at 12% 30%,rgba(40,120,255,.14),transparent 23%),linear-gradient(180deg,#020203 0%,#08080d 48%,#020203 100%)!important;position:relative!important;overflow-x:hidden!important;}
      body .app:before{content:'FIGHTING SPIRIT';position:fixed;right:-84px;top:42%;z-index:0;pointer-events:none;transform:rotate(90deg);font:1000 48px Outfit,system-ui,sans-serif;letter-spacing:.20em;color:rgba(255,90,24,.045);text-shadow:0 0 28px rgba(255,90,24,.16)!important;}
      body .app:after{content:'';position:fixed;left:0;right:0;top:118px;height:3px;z-index:3;pointer-events:none;background:linear-gradient(90deg,transparent,var(--ko-red),var(--ko-gold),var(--ko-blue),transparent)!important;box-shadow:0 0 24px rgba(255,90,24,.45)!important;}
      body .main,body .page{position:relative!important;z-index:1!important;}

      body .masthead,body header.masthead{background:linear-gradient(180deg,#050506,#000)!important;border-bottom:1px solid rgba(255,90,24,.55)!important;box-shadow:0 20px 54px rgba(0,0,0,.72),0 0 44px rgba(255,90,24,.10)!important;backdrop-filter:blur(14px)!important;}
      body .brand-mark{border-radius:50%!important;background:radial-gradient(circle at 35% 30%,#ffcf33 0%,#ff6a18 48%,#c91d0d 100%)!important;box-shadow:0 0 34px rgba(255,90,24,.50),inset 0 0 0 2px rgba(255,255,255,.08)!important;color:#080808!important;}
      body .brand-title{font-family:Fraunces,Georgia,serif!important;text-transform:uppercase!important;letter-spacing:.22em!important;color:#fff!important;text-shadow:0 14px 30px rgba(0,0,0,.85)!important;}
      body .brand-title:after{content:' · RING MODE';color:var(--ko-orange)!important;font:1000 10px JetBrains Mono,ui-monospace,monospace!important;letter-spacing:.18em!important;margin-left:8px!important;}
      body .brand-sub{color:#9bffb5!important;font:900 10px JetBrains Mono,ui-monospace,monospace!important;letter-spacing:.12em!important;text-transform:uppercase!important;}

      body #tabs,body nav.tabs{background:linear-gradient(180deg,#050506,#000)!important;border-bottom:0!important;gap:8px!important;padding:12px 24px!important;}
      body #tabs .tab,body nav.tabs .tab{border-radius:999px!important;background:rgba(255,255,255,.045)!important;border:1px solid rgba(255,255,255,.09)!important;color:#b4b4c7!important;padding:11px 15px!important;margin:0 2px!important;font-weight:900!important;text-transform:none!important;letter-spacing:.01em!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.05)!important;}
      body #tabs .tab.active,body nav.tabs .tab.active{color:#060606!important;background:linear-gradient(135deg,#ffb044 0%,#ff5a18 54%,#e52a10 100%)!important;box-shadow:0 15px 34px rgba(255,70,18,.30)!important;border-color:transparent!important;}
      body #tabs .tab.active:after,body nav.tabs .tab.active:after{display:none!important;content:none!important;}

      body .page-title{font-family:Fraunces,Georgia,serif!important;font-size:clamp(38px,13vw,64px)!important;line-height:.88!important;letter-spacing:-.065em!important;text-transform:none!important;color:#fff!important;text-shadow:0 20px 42px rgba(0,0,0,.74)!important;}
      body .page-title em,body .section-title em,body .brand-title em{color:var(--ko-orange)!important;font-style:italic!important;text-shadow:0 0 24px rgba(255,90,24,.36)!important;}
      body .section-title{font:1000 12px JetBrains Mono,ui-monospace,monospace!important;letter-spacing:.22em!important;text-transform:uppercase!important;color:#fff!important;border-top:1px solid rgba(255,255,255,.07)!important;padding-top:8px!important;margin-top:32px!important;}
      body .section-title:before{width:30px!important;height:5px!important;border-radius:99px!important;clip-path:none!important;background:linear-gradient(90deg,var(--ko-red),var(--ko-gold))!important;box-shadow:0 0 20px rgba(255,90,24,.55)!important;}

      body .card,body .chart-card,body .review-card,body .m-review,body .log-widget,body .quick-row,body .mini-card,body .goal-box,body .training-status,body .next-action,body #next-action,body .callout,body .task-wrap,body .xp-widget,body .stat,body .stats-card,body .ud-card,body .ud-final-card{
        background:linear-gradient(180deg,rgba(20,20,31,.97),rgba(5,5,9,.99))!important;border:1px solid rgba(255,255,255,.09)!important;border-left:4px solid var(--ko-orange)!important;border-radius:24px!important;box-shadow:0 22px 58px rgba(0,0,0,.52),inset 0 1px 0 rgba(255,255,255,.05),0 0 0 1px rgba(255,90,24,.04)!important;overflow:hidden!important;position:relative!important;
      }
      body .card:before,body .log-widget:before,body .next-action:before,body #next-action:before,body .ud-card:before{content:'';position:absolute;inset:0;pointer-events:none;background:radial-gradient(circle at 0 0,rgba(255,90,24,.16),transparent 34%),linear-gradient(90deg,rgba(255,255,255,.024) 1px,transparent 1px);background-size:auto,30px 30px;opacity:.82!important;}

      body .tl-item,body .log-row,body .prio-item,body .task-item,body .goal-item,body .ud-row,body .bookmark-list>div{background:rgba(255,255,255,.032)!important;border:1px solid rgba(255,255,255,.085)!important;border-radius:20px!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.04)!important;}
      body input,body textarea,body select{background:rgba(3,3,7,.82)!important;color:#f7f7fb!important;border:1px solid rgba(255,255,255,.13)!important;border-radius:15px!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.045)!important;}
      body input:focus,body textarea:focus,body select:focus{border-color:rgba(255,90,24,.78)!important;box-shadow:0 0 0 3px rgba(255,90,24,.15)!important;outline:none!important;}
      body button,body .btn-primary,body .save-btn,body .task-add-btn,body .goal-add-row button,body .na-btn.primary,body .training-cta,body .pomo-session-chip.active,body .wake-btn.active{border-radius:15px!important;background:linear-gradient(135deg,#ffb044,#ff4a18 58%,#d7210c)!important;color:#050506!important;border:1px solid rgba(255,255,255,.09)!important;box-shadow:0 15px 32px rgba(255,64,24,.28)!important;font-weight:1000!important;letter-spacing:.05em!important;}

      body .pomo-modal,body .pomo-card,body [class*='pomo']{border-radius:28px!important;}
      body .pomo-time,body [class*='timer']{font-family:Fraunces,Georgia,serif!important;color:#ff7a42!important;text-shadow:0 0 28px rgba(255,90,24,.28)!important;}

      body .log-input{color:#ff7a42!important;font-weight:1000!important;}
      body .ring-fill{filter:drop-shadow(0 0 8px rgba(255,90,24,.50))!important;}
      body [data-shift='sm'],body .ud-hide-final{display:none!important;}

      @media(max-width:640px){body .main{padding-left:24px!important;padding-right:24px!important;}body .card,body .log-widget,body .goal-box,body .next-action,body #next-action,body .training-status{border-radius:22px!important;}body #tabs,body nav.tabs{padding-left:20px!important;padding-right:20px!important;}}
    `;
    document.head.appendChild(st);
  }

  function apply(){
    neutralizeLegacyStyles();
    forceCss();
  }

  function boot(){
    apply();
    [100,400,1000,2500,5000,9000].forEach(function(ms){setTimeout(apply,ms);});
    try{new MutationObserver(function(){clearTimeout(window.__udDesignV3t);window.__udDesignV3t=setTimeout(apply,80);}).observe(document.documentElement,{childList:true,subtree:true});}catch(e){}
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded',boot,{once:true}); else boot();
})();

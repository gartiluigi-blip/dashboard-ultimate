export const $=(s,r=document)=>r.querySelector(s);
export const $$=(s,r=document)=>[...r.querySelectorAll(s)];
export function el(tag,attrs={},children=[]){
  const n=document.createElement(tag);
  Object.entries(attrs||{}).forEach(([k,v])=>{
    if(v===false||v===null||v===undefined)return;
    if(k==='class')n.className=v;
    else if(k==='html')n.innerHTML=v;
    else if(k==='style')n.setAttribute('style',v);
    else if(k.startsWith('on')&&typeof v==='function')n.addEventListener(k.slice(2),v);
    else n.setAttribute(k,v===true?'':v);
  });
  (Array.isArray(children)?children:[children]).filter(x=>x!==null&&x!==undefined).forEach(c=>n.append(c?.nodeType?c:document.createTextNode(c)));
  return n;
}
export function toast(msg){
  const t=$('#toast');
  if(!t)return;
  t.textContent=msg;
  t.classList.add('show');
  clearTimeout(window.__toastTimer);
  window.__toastTimer=setTimeout(()=>t.classList.remove('show'),1900);
}
export function card(title,body='',cls=''){
  const c=el('section',{class:'card '+cls});
  c.append(el('div',{class:'card-head'},el('h2',{},title)));
  if(body)c.append(el('div',{class:'muted'},body));
  return c;
}
export function subTabs(items,active,onClick){
  const w=el('div',{class:'subtabs'});
  items.forEach(it=>w.append(el('button',{class:'subtab '+(it.id===active?'active':''),onclick:()=>onClick(it.id)},it.label)));
  return w;
}
export function pill(text,cls=''){return el('span',{class:'pill '+cls},text)}
export function button(label,onClick,cls=''){return el('button',{class:'btn '+cls,onclick:onClick},label)}
export function progress(value,max=100){const pct=max?Math.min(100,Math.round((+value||0)/(+max||1)*100)):0;return el('div',{class:'progress'},el('div',{class:'bar',style:'width:'+pct+'%'}))}

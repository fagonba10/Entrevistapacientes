/* Cuestionario dietético — lógica de la aplicación (sin dependencias, sin servidor) */
(function(){
"use strict";
const C = window.CONFIG, D = window.DATA, R = window.Report, esc = R.esc;
const $ = (s,r=document)=>r.querySelector(s), $$ = (s,r=document)=>[...r.querySelectorAll(s)];
const params = new URLSearchParams(location.search);
const KEY = "cdp.v1." + (params.get("ref")||"default");
const STEPS = ["Inicio","Datos","Actividad","Comidas","Frecuencia","Preferencias","Firma","Enviar"];
const LAST = STEPS.length-1;

/* ---------------- Estado ---------------- */
function blank(){
  const S={v:1,step:0,data:{nombre:(params.get("n")||"").slice(0,120)},act:{},
    actOtras:Array.from({length:D.actOtrasN},()=>({name:"",lab:{h:"",m:""},fes:{h:"",m:""}})),
    hab:{},habNotas:"",freq:{},freqDone:false,
    freqOtros:Array.from({length:D.freqOtrosN},()=>({name:"",n:"",u:"",marca:"",cant:""})),
    pref:{},consent:{},meta:{inicio:new Date().toISOString()}};
  D.activities.forEach(a=>S.act[a.k]={lab:{h:"",m:""},fes:{h:"",m:""},spec:""});
  D.meals.forEach(m=>S.hab[m.k]={dias:"",hora:"",items:[],otros:""});
  return S;
}
let S, restored=false;
try{
  const raw=localStorage.getItem(KEY);
  if(raw){ const o=JSON.parse(raw); if(o&&o.v===1){ S=Object.assign(blank(),o); restored=!!(o.data&&(o.data.nombre||o.step>0)); } }
}catch(e){}
if(!S) S=blank();
let saveT=null, sent=false;

function getPath(o,p){ return p.split(".").reduce((a,k)=>a==null?a:a[k],o); }
function setPath(o,p,v){
  const ks=p.split("."); let a=o;
  for(let i=0;i<ks.length-1;i++){ if(a[ks[i]]==null) a[ks[i]]={}; a=a[ks[i]]; }
  a[ks[ks.length-1]]=v;
}
const v = p => { const x=getPath(S,p); return esc(x==null?"":x); };
function save(){
  clearTimeout(saveT);
  saveT=setTimeout(()=>{
    try{ localStorage.setItem(KEY,JSON.stringify(S)); const t=new Date(); $("#saved").textContent="✓ Guardado "+t.toLocaleTimeString("es-ES",{hour:"2-digit",minute:"2-digit"}); }
    catch(e){ $("#saved").textContent="No se puede guardar automáticamente"; }
  },250);
}
function toast(msg){ const t=$("#toast"); t.textContent=msg; t.classList.add("on"); clearTimeout(t._t); t._t=setTimeout(()=>t.classList.remove("on"),2200); }

/* ---------------- Validaciones / estados ---------------- */
const emailOk = s => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s);
function datosOk(){ const d=S.data; return (d.nombre||"").trim().length>=3 && !!((d.telefono||"").trim()||(d.email||"").trim()) && (!d.email||emailOk(d.email.trim())); }
function actState(){ const t=R.actTotals(S); return {t, ok:t.lab===1440&&t.fes===1440, any:t.lab>0||t.fes>0}; }
function mealsDone(){ return D.meals.filter(m=>R.mealHas(S.hab[m.k])).length; }
function consentOk(){ const c=S.consent; return !!(c.lopd&&c.veracidad&&c.firma); }
function stepStatus(i){
  switch(i){
    case 0: return S.step>0?"done":"";
    case 1: return datosOk()?"done":((S.data.nombre||S.data.telefono||S.data.email)?"part":"");
    case 2: { const a=actState(); return a.ok?"done":a.any?"part":""; }
    case 3: { const n=mealsDone(); return n>=D.meals.length?"done":n>0?"part":""; }
    case 4: return S.freqDone?"done":(R.freqCount(S)>0?"part":"");
    case 5: return Object.values(S.pref).some(x=>x)?"done":"";
    case 6: return consentOk()?"done":((S.consent.lopd||S.consent.firma)?"part":"");
    case 7: return sent?"done":"";
  }
}
function renderStepper(){
  $("#steps").innerHTML=STEPS.map((n,i)=>`<button class="st ${stepStatus(i)} ${i===S.step?"cur":""}" data-go="${i}" aria-label="${n}" ${i===S.step?'aria-current="step"':""}><i></i><span>${i?i+". ":""}${n}</span></button>`).join("");
}

/* ---------------- Pasos ---------------- */
function stepIntro(){
  return `<div class="card hero">
    ${C.logo?`<img class="hero-logo" src="${esc(C.logo)}" alt="${esc(C.consulta)}">`:""}
    <div class="kicker">${esc(C.consulta)}</div>
    <h1>Cuestionario de hábitos y alimentación</h1>
    <p class="lead">Con esta información prepararé tu primera consulta para que sea mucho más útil. Cuanto más real sea lo que cuentes, mejor será tu plan.</p>
    <ol class="timeline">
      <li><b>Tus datos</b>Solo lo básico: lo demás lo hablamos en consulta.</li>
      <li><b>Actividad física</b>Cuántas horas dedicas a cada cosa en un día normal.</li>
      <li><b>Tus comidas</b>Marca lo que sueles tomar en cada comida.</li>
      <li><b>Frecuencia de consumo</b>Sí o no para cada alimento, y cada cuánto.</li>
      <li><b>Firma y envío</b>Consentimiento y envío directo a tu dietista.</li>
    </ol>
    <div class="callout"><b>Puedes ir poco a poco.</b> Todo lo que escribas se guarda automáticamente en este dispositivo, así que puedes cerrar la página y volver más tarde al mismo enlace. Tus datos solo se envían cuando pulses «Enviar» al final.</div>
    ${restored?`<div class="callout warn">Hemos recuperado lo que ya habías rellenado. <button class="btn ghost sm" id="reset" type="button" style="color:var(--bad)">Empezar de nuevo</button></div>`:""}
  </div>
  <div class="card"><h3>Antes de empezar</h3>
    <ul style="padding-left:18px;margin:0"><li>Tiempo estimado: unos 15–20 minutos.</li>
    <li>No hace falta pesar nada: una idea aproximada es suficiente.</li>
    <li>Responde con lo que haces normalmente, no con lo que te gustaría hacer.</li></ul></div>`;
}
function stepDatos(){
  return `<div class="card"><h2>Tus datos</h2><p class="muted">Solo lo imprescindible. El resto lo completaremos juntos en la entrevista.</p>
  <div class="fld"><label class="f" for="f-nombre">Nombre y apellidos <span class="req">*</span></label><input id="f-nombre" type="text" autocomplete="name" data-path="data.nombre" value="${v("data.nombre")}"></div>
  <div class="grid2">
    <div class="fld"><label class="f" for="f-tel">Teléfono <span class="req">*</span></label><input id="f-tel" type="tel" autocomplete="tel" inputmode="tel" data-path="data.telefono" value="${v("data.telefono")}"></div>
    <div class="fld"><label class="f" for="f-mail">Correo electrónico</label><input id="f-mail" type="email" autocomplete="email" data-path="data.email" value="${v("data.email")}"></div>
  </div>
  <div class="grid2">
    <div class="fld"><label class="f" for="f-nac">Fecha de nacimiento</label><input id="f-nac" type="date" data-path="data.nacimiento" value="${v("data.nacimiento")}"></div>
    <div class="fld"><label class="f" for="f-sexo">Sexo</label><select id="f-sexo" data-path="data.sexo">${["","Mujer","Hombre","Otro / prefiero no indicarlo"].map(o=>`<option ${getPath(S,"data.sexo")===o?"selected":""}>${o}</option>`).join("")}</select></div>
  </div>
  <div class="grid3 keep">
    <div class="fld"><label class="f" for="f-peso">Peso <small>(kg, opcional)</small></label><input id="f-peso" type="number" inputmode="decimal" min="1" max="400" step="0.1" data-path="data.peso" value="${v("data.peso")}"></div>
    <div class="fld"><label class="f" for="f-talla">Talla <small>(cm, opcional)</small></label><input id="f-talla" type="number" inputmode="numeric" min="30" max="250" data-path="data.talla" value="${v("data.talla")}"></div>
    <div class="fld" style="grid-column:span 1"><label class="f" for="f-prof">Profesión</label><input id="f-prof" type="text" data-path="data.profesion" value="${v("data.profesion")}"></div>
  </div>
  <div class="fld"><label class="f" for="f-ale">Alergias o intolerancias alimentarias <small>(si tienes)</small></label><input id="f-ale" type="text" data-path="data.alergias" value="${v("data.alergias")}" placeholder="Ej.: lactosa, frutos secos…"></div>
  <p class="small muted">Fecha de cumplimentación: ${R.hoy()}</p></div>`;
}
const hm = p => `<input type="number" inputmode="numeric" min="0" max="24" placeholder="0" aria-label="horas" data-path="${p}.h" value="${v(p+".h")}"><span>h</span><input type="number" inputmode="numeric" min="0" max="59" placeholder="0" aria-label="minutos" data-path="${p}.m" value="${v(p+".m")}"><span>min</span>`;
function stepAct(){
  let rows=D.activities.map(a=>`<div class="act-row"><div class="nm">${a.l}${a.spec?`<div class="spec"><input type="text" placeholder="${a.spec}" data-path="act.${a.k}.spec" value="${v("act."+a.k+".spec")}"></div>`:""}</div>
    <div><span class="hm-l">Día laborable</span><div class="hm">${hm("act."+a.k+".lab")}</div></div>
    <div><span class="hm-l">Día festivo</span><div class="hm">${hm("act."+a.k+".fes")}</div></div></div>`).join("");
  let other=S.actOtras.map((r,i)=>`<div class="act-other"><input type="text" placeholder="Otra actividad…" data-path="actOtras.${i}.name" value="${v("actOtras."+i+".name")}">
    <div><span class="hm-l">Día laborable</span><div class="hm">${hm("actOtras."+i+".lab")}</div></div>
    <div><span class="hm-l">Día festivo</span><div class="hm">${hm("actOtras."+i+".fes")}</div></div></div>`).join("");
  return `<div class="card"><h2>Actividad física</h2>
  <p class="muted">Indica el tiempo (horas y minutos) que dedicas a cada actividad en un <b>día laborable</b> y en un <b>día festivo</b> típicos. <b>El total de cada día debe sumar 24 horas.</b></p>
  <div class="act-head"><div>Actividad</div><div>Día laborable</div><div>Día festivo</div></div>${rows}
  <h3 style="margin-top:22px">Otras actividades y sus horas</h3>${other}
  <div class="totals" id="totals"></div></div>`;
}
function updateTotals(){
  const a=actState(), el=$("#totals"); if(!el) return;
  const one=(lbl,t)=>{ const d=1440-t, cls=t===1440?"ok":t>1440?"over":"";
    const msg=t===1440?"✓ Suma 24 h":t>1440?`Te pasas ${R.fmt(t-1440)}`:`Faltan ${R.fmt(d)}`;
    return `<div class="tot ${cls}"><div class="small muted">${lbl}</div><b>${R.fmt(t)}</b> <span class="muted small">de 24 h</span><div class="bar"><i style="width:${Math.min(100,t/14.4)}%"></i></div><div class="msg">${msg}</div></div>`; };
  el.innerHTML=one("Día laborable",a.t.lab)+one("Día festivo",a.t.fes);
}

/* --- Comidas habituales --- */
function itemOpts(cat,food){ const e=(D.catalog[cat]||[]).find(x=>x[0]===food); return e||null; }
const selected=(mm,food,group)=>mm.items.some(i=>i.food===food&&(i.group||"")===group);
const chip=(k,food,group,on)=>`<button type="button" class="chip tg ${on?"on":""}" data-tog data-meal="${k}" data-food="${esc(food)}" data-group="${esc(group)}" aria-pressed="${on}">${on?"✓ ":""}${esc(food)}</button>`;
function stepDiary(){
  return `<div class="card"><h2>Tus comidas habituales</h2>
  <p class="muted">Cuéntanos cómo es una <b>semana normal</b>. En cada comida, <b>marca todo lo que sueles tomar</b>: puedes elegir varias opciones. No hace falta que sea exacto, lo afinaremos en la consulta.</p>
  <details class="ins"><summary>Consejos para indicar cantidades</summary><div class="in"><ul style="padding-left:18px;margin:.3em 0">
   <li>Cuando marques un alimento, puedes añadir cuánto sueles tomar: «1 vaso», «2 rebanadas», «un puñado», «plato normal»…</li>
   <li>Si lo recuerdas, escribe la marca o la forma de preparación (frito, plancha, cocido, rebozado…).</li>
   <li>En platos elaborados, di cuál es (por ejemplo «lentejas con verduras»).</li>
   <li>Si no encuentras algo en la lista, escríbelo en «Otros».</li></ul></div></details></div>
  <div id="diaryHost"></div>
  <div class="card"><div class="fld" style="margin:0"><label class="f" for="habNotas">¿Cambia algo los fines de semana, festivos o cuando comes fuera? <small>(opcional)</small></label>
  <textarea id="habNotas" data-path="habNotas" placeholder="Ej.: los domingos como en casa de mis padres; entre semana como en el trabajo…">${v("habNotas")}</textarea></div></div>`;
}
function renderDiary(){
  const h=$("#diaryHost"); if(!h) return;
  h.innerHTML=D.meals.map(m=>{
    const mm=S.hab[m.k], base=`hab.${m.k}`, off=mm.dias==="d0";
    let body="";
    if(!off){
      const chips = m.cat==="main"
        ? D.catalog.main.map(g=>`<div class="grp"><div class="grp-t">${esc(g[0])}</div><div class="chips">${g[1].map(o=>chip(m.k,o,g[0],selected(mm,o,g[0]))).join("")}</div></div>`).join("")
        : `<div class="chips">${D.catalog[m.cat].map(e=>chip(m.k,e[0],"",selected(mm,e[0],""))).join("")}</div>`;
      const rows=mm.items.map((it,idx)=>{ const p=`${base}.items.${idx}`, cat=it.group?null:itemOpts(m.cat,it.food);
        return `<div class="item"><div class="item-h"><b>${esc(it.food)}${it.group?` <span class="muted small">· ${esc(it.group)}</span>`:""}</b><button class="x" type="button" data-rm="${m.k}|${idx}" aria-label="Quitar">×</button></div>
        <div class="item-g ${cat?"":"no-opt"}">${cat?`<select data-path="${p}.opt" aria-label="Tipo"><option value="">Tipo…</option>${cat[1].map(o=>`<option ${it.opt===o?"selected":""}>${o}</option>`).join("")}</select>`:""}
        <input type="text" placeholder="${it.group?"Cuál y cuánto (ej.: lentejas, plato normal)":"Cantidad y marca (opcional)"}" data-path="${p}.qty" value="${esc(it.qty||"")}" aria-label="Cantidad"></div></div>`; }).join("");
      body=`<div class="q2">Marca todo lo que sueles tomar</div>${chips}
        ${rows?`<div class="q2" style="margin-top:16px">Tus elecciones <span class="muted small">(opcional: añade cuánto sueles tomar)</span></div>${rows}`:""}
        <div class="fld" style="margin:14px 0 0"><label class="f" for="o-${m.k}">Otros alimentos o bebidas que no estén en la lista</label><input id="o-${m.k}" type="text" data-path="${base}.otros" value="${esc(mm.otros||"")}"></div>`;
    }
    return `<div class="meal"><div class="meal-h"><span aria-hidden="true">${m.ic}</span><span class="t">${m.l}</span><span class="small muted">${mm.items.length?mm.items.length+" marcados":""}</span></div><div class="meal-b">
      <h3 style="margin:0 0 10px">${D.mealQ[m.k]}</h3>
      <div class="grid2" style="margin-bottom:14px"><select data-path="${base}.dias" aria-label="Días a la semana"><option value="">¿Cuántos días a la semana?</option>${D.diasOpts.map(([c,l])=>`<option value="${c}" ${mm.dias===c?"selected":""}>${l}</option>`).join("")}</select>
      ${off?"":`<div style="display:flex;align-items:center;gap:8px"><label class="small muted" for="h-${m.k}">Hora habitual</label><input id="h-${m.k}" type="time" data-path="${base}.hora" value="${esc(mm.hora||"")}" style="width:auto"></div>`}</div>
      ${off?`<div class="empty">Sin problema, pasamos a la siguiente.</div>`:body}</div></div>`;
  }).join("");
}

/* --- Frecuencia --- */
const freqSel=(p,f)=>`<select data-path="${p}.f" aria-label="Frecuencia"><option value="">¿Con qué frecuencia?</option>${D.freqOpts.map(([k,l])=>`<option value="${k}" ${f===k?"selected":""}>${l}</option>`).join("")}</select>`;
const yn=(p,r)=>`<div class="yn" role="radiogroup"><label class="si ${r==="si"?"on":""}"><input type="radio" name="${p}" value="si" data-path="${p}.r" ${r==="si"?"checked":""}>Sí</label><label class="no ${r==="no"?"on":""}"><input type="radio" name="${p}" value="no" data-path="${p}.r" ${r==="no"?"checked":""}>No</label></div>`;
function stepFreq(){
  const secs=D.freq.map((s,si)=>{
    const rows=s.i.map((name,ii)=>{ const p=`freq.${si}-${ii}`, r=getPath(S,p+".r")||"", f=getPath(S,p+".f")||"";
      return `<div class="fr ${r}" data-name="${esc(name.toLowerCase())}"><div class="fr-top"><div class="nm">${esc(name)}</div>${yn(p,r)}</div>
      <div class="fr-d">${freqSel(p,f)}<input type="text" placeholder="Cantidad por vez (opcional)" data-path="${p}.cant" value="${v(p+".cant")}" aria-label="Cantidad por vez"><input type="text" placeholder="Marca o tipo (opcional)" data-path="${p}.marca" value="${v(p+".marca")}" aria-label="Marca o tipo"></div></div>`; }).join("");
    return `<details class="sec" data-sec="${si}"><summary>${esc(s.t)} <span class="badge" data-badge="${si}"></span></summary><div class="sec-b">
      <div class="sec-tools"><button class="btn ghost sm" type="button" data-never="${si}">Marcar los que faltan como «No»</button></div>${rows}</div></details>`;
  }).join("");
  const otros=S.freqOtros.map((r,i)=>{ const p=`freqOtros.${i}`;
    return `<div class="other-fr"><input type="text" placeholder="Otro alimento…" data-path="${p}.name" value="${v(p+".name")}">${freqSel(p,r.f)}<input type="text" placeholder="Cantidad por vez (opcional)" data-path="${p}.cant" value="${v(p+".cant")}"></div>`; }).join("");
  return `<div class="card"><h2>Frecuencia de consumo</h2>
  <p class="muted">Para cada alimento, marca <b>Sí</b> si lo tomas o <b>No</b> si no. Si marcas Sí, elige cada cuánto lo tomas. La cantidad y la marca son opcionales.</p>
  <div class="callout">Abre cada grupo con un toque. Si de un grupo solo tomas unos pocos alimentos, marca esos con «Sí» y pulsa «Marcar los que faltan como No».</div></div>
  <div class="search"><input type="text" id="fsearch" placeholder="🔍 Buscar alimento (ej.: lentejas, yogur…)" aria-label="Buscar alimento"></div>
  <div id="freqHost">${secs}
  <details class="sec" data-sec="otros"><summary>Otros alimentos <span class="badge" data-badge="otros"></span></summary><div class="sec-b"><p class="small muted" style="padding:0 6px">Alimentos que tomes y no aparezcan en la lista.</p>${otros}</div></details></div>
  <div class="card" style="margin-top:14px"><label class="chk"><input type="checkbox" data-path="freqDone" ${S.freqDone?"checked":""}><span><b>He revisado todos los grupos de alimentos</b><br><span class="small muted" id="freqCount"></span></span></label></div>`;
}
function freqSinFrec(){ let n=0; Object.values(S.freq||{}).forEach(f=>{ if(f&&f.r==="si"&&!f.f) n++; }); return n; }
function updateFreqBadges(){
  D.freq.forEach((s,si)=>{ let n=0; s.i.forEach((_,ii)=>{ if(getPath(S,`freq.${si}-${ii}.r`)) n++; });
    const b=$(`[data-badge="${si}"]`); if(b){ b.textContent=`${n}/${s.i.length}`; b.classList.toggle("full",n===s.i.length); } });
  const o=$('[data-badge="otros"]'); if(o) o.textContent=S.freqOtros.filter(r=>r.name).length+" añadidos";
  const c=$("#freqCount"); if(c){ const sf=freqSinFrec(); c.textContent=`${R.freqCount(S)} de ${R.freqTotal()} alimentos respondidos`+(sf?` · ${sf} con «Sí» sin frecuencia`:""); }
}

/* --- Preferencias --- */
function stepPref(){
  const ta=(p,l,ph)=>`<div class="fld"><label class="f" for="${p}">${l}</label><textarea id="${p}" data-path="pref.${p}" placeholder="${ph||""}">${v("pref."+p)}</textarea></div>`;
  return `<div class="card"><h2>Preferencias y observaciones</h2><p class="muted">Todo opcional, pero muy útil para personalizar tu plan.</p>
   ${ta("favoritos","¿Cuáles son tus alimentos o platos favoritos?","Los que más te gustan y no te gustaría perder")}
   ${ta("noGustan","¿Qué alimentos no te gustan o no toleras bien?")}
   <div class="grid2"><div class="fld"><label class="f" for="quienCocina">¿Quién cocina habitualmente en casa?</label><input id="quienCocina" type="text" data-path="pref.quienCocina" value="${v("pref.quienCocina")}"></div>
   <div class="fld"><label class="f" for="comeFuera">¿Cuántas comidas haces fuera de casa a la semana?</label><input id="comeFuera" type="text" data-path="pref.comeFuera" value="${v("pref.comeFuera")}" placeholder="Ej.: 5 comidas (trabajo)"></div></div>
   ${ta("observaciones","Observaciones o dudas para tu dietista","Cualquier cosa que quieras comentarme")}</div>`;
}

/* --- Consentimiento --- */
function stepConsent(){
  const r=C.responsable||{}, f=x=>x?esc(x):`<mark>[completar]</mark>`;
  return `<div class="card"><h2>Protección de datos y firma</h2>
  <p class="muted">Para poder tratar tus datos de salud necesito tu consentimiento expreso. Es información básica; puedes pedirme el detalle completo cuando quieras.</p>
  <dl class="legal">
   <dt>Responsable del tratamiento</dt><dd>${f(r.nombre)} · NIF ${f(r.nif)} · ${f(r.direccion)} · ${f(r.email)}</dd>
   <dt>Finalidad</dt><dd>Valorar tu estado nutricional, elaborar tu plan dietético personalizado y gestionar la relación asistencial contigo (citas, seguimiento y comunicaciones sobre tu plan).</dd>
   <dt>Legitimación</dt><dd>Tu consentimiento explícito (art. 6.1.a y 9.2.a del RGPD), dado que se tratan datos relativos a la salud y a tus hábitos alimentarios. Puedes retirarlo en cualquier momento sin que afecte a lo ya realizado.</dd>
   <dt>Destinatarios</dt><dd>No se cederán datos a terceros salvo obligación legal. Para enviarme este formulario se utiliza ${esc(C.encargado||"un proveedor de envío de formularios")}, que actúa como encargado del tratamiento y puede alojar datos fuera del Espacio Económico Europeo con las garantías previstas en el RGPD.</dd>
   <dt>Conservación</dt><dd>Mientras dure la relación asistencial y, después, durante los plazos exigidos por la normativa sanitaria y de protección de datos aplicable.</dd>
   <dt>Derechos</dt><dd>Acceso, rectificación, supresión, oposición, limitación del tratamiento y portabilidad, escribiendo a ${f(r.email)}. Si consideras que tus derechos no se han atendido, puedes reclamar ante la Agencia Española de Protección de Datos (www.aepd.es).</dd></dl>
  <label class="chk"><input type="checkbox" data-path="consent.lopd" ${S.consent.lopd?"checked":""}><span><b>Consiento expresamente</b> el tratamiento de mis datos personales y de salud para las finalidades indicadas. <span class="req">*</span></span></label>
  <label class="chk"><input type="checkbox" data-path="consent.veracidad" ${S.consent.veracidad?"checked":""}><span>Declaro que los datos facilitados son veraces y que he sido informado/a de mis derechos. <span class="req">*</span></span></label>
  <div class="fld" style="margin-top:14px"><label class="f" for="firmante">Nombre de quien firma <small>(si firma otra persona en nombre del paciente —por ejemplo, un menor—, indica su nombre y parentesco)</small></label>
   <input id="firmante" type="text" data-path="consent.firmante" value="${v("consent.firmante")}" placeholder="${esc(S.data.nombre||"")}"></div>
  <label class="f">Firma <span class="req">*</span> <small>— dibuja con el dedo o el ratón</small></label>
  <div class="sigwrap ${S.consent.firma?"has":""}" id="sigwrap"><canvas id="sig" aria-label="Zona de firma"></canvas><div class="hint">Firma aquí</div></div>
  <div style="display:flex;justify-content:space-between;align-items:center;margin-top:6px"><span class="small muted">Fecha: ${R.hoy()}</span><button class="btn ghost sm" type="button" id="sigclear">Borrar firma</button></div></div>`;
}
function initSig(){
  const cv=$("#sig"); if(!cv||!cv.parentElement.clientWidth) return;
  const wrap=cv.parentElement, ratio=Math.max(1,window.devicePixelRatio||1), w=wrap.clientWidth, h=170;
  cv.width=w*ratio; cv.height=h*ratio;
  const ctx=cv.getContext("2d"); ctx.scale(ratio,ratio); ctx.lineWidth=2.4; ctx.lineCap="round"; ctx.lineJoin="round"; ctx.strokeStyle="#111";
  if(S.consent.firma){ const im=new Image(); im.onload=()=>ctx.drawImage(im,0,0,w,h); im.src=S.consent.firma; }
  let drawing=false, last=null;
  const pos=e=>{ const r=cv.getBoundingClientRect(); return {x:e.clientX-r.left,y:e.clientY-r.top}; };
  cv.onpointerdown=e=>{ drawing=true; last=pos(e); cv.setPointerCapture(e.pointerId); ctx.beginPath(); ctx.arc(last.x,last.y,1.2,0,7); ctx.fill(); e.preventDefault(); };
  cv.onpointermove=e=>{ if(!drawing) return; const p=pos(e); ctx.beginPath(); ctx.moveTo(last.x,last.y); ctx.lineTo(p.x,p.y); ctx.stroke(); last=p; };
  const end=()=>{ if(!drawing) return; drawing=false;
    const t=document.createElement("canvas"); t.width=520; t.height=Math.round(520*cv.height/cv.width);
    t.getContext("2d").drawImage(cv,0,0,t.width,t.height);
    S.consent.firma=t.toDataURL("image/png"); S.consent.fechaFirma=new Date().toISOString();
    wrap.classList.add("has"); save(); renderStepper(); };
  cv.onpointerup=end; cv.onpointercancel=end;
  $("#sigclear").onclick=()=>{ ctx.clearRect(0,0,w,h); S.consent.firma=""; S.consent.fechaFirma=""; wrap.classList.remove("has"); save(); renderStepper(); };
}

/* --- Revisión y envío --- */
function checks(){
  const a=actState(), n=mealsDone(), fc=R.freqCount(S), L=[];
  L.push({s:datosOk()?"ok":"bad",t:datosOk()?"Datos personales completos":"Faltan datos: nombre y un teléfono o correo válido",go:1,block:!datosOk()});
  L.push({s:a.ok?"ok":"bad",t:a.ok?"Actividad física: ambos días suman 24 h":`Actividad física: cada día debe sumar 24 h (laborable ${R.fmt(a.t.lab)}, festivo ${R.fmt(a.t.fes)})`,go:2,block:!a.ok});
  L.push({s:n>=D.meals.length?"ok":"w",t:n>=D.meals.length?`Comidas habituales completas (${n} de ${D.meals.length})`:`Comidas habituales: has descrito ${n} de ${D.meals.length}. Puedes enviarlo así, pero cuanto más completo, mejor.`,go:3});
  const sf=freqSinFrec();
  L.push({s:S.freqDone&&fc&&!sf?"ok":"w",t:!fc?"Frecuencia de consumo sin rellenar":sf?`Frecuencia de consumo: ${sf} alimentos con «Sí» sin indicar la frecuencia`:S.freqDone?`Frecuencia de consumo revisada (${fc} alimentos)`:`Frecuencia de consumo: ${fc} respondidos; no has marcado que la hayas revisado`,go:4});
  L.push({s:consentOk()?"ok":"bad",t:consentOk()?"Consentimiento y firma recogidos":"Falta el consentimiento y/o la firma",go:6,block:!consentOk()});
  return L;
}
function stepReview(){
  if(sent) return doneHTML();
  const L=checks(), blocked=L.some(x=>x.block), demo=!C.web3formsKey;
  const items=D.meals.reduce((a,m)=>a+S.hab[m.k].items.length,0);
  return `<div class="card"><h2>Revisa y envía</h2>
  <div class="sum"><div><b>${mealsDone()}/${D.meals.length}</b><span>comidas descritas</span></div><div><b>${items}</b><span>alimentos marcados</span></div><div><b>${R.freqCount(S)}</b><span>frecuencias respondidas</span></div></div>
  <ul class="ck">${L.map(x=>`<li class="${x.s}"><span class="ic">${x.s==="ok"?"✓":x.s==="bad"?"!":"•"}</span><span>${x.t}</span>${x.s!=="ok"?`<button class="btn sec sm" data-go="${x.go}" type="button">Ir</button>`:""}</li>`).join("")}</ul>
  ${demo?`<div class="callout warn" style="margin-top:14px"><b>Modo de prueba.</b> El envío por correo todavía no está configurado (falta la clave en <code>js/config.js</code>), así que no se enviará nada.</div>`:""}
  <div class="hp"><label>No rellenar<input type="text" id="hp" tabindex="-1" autocomplete="off"></label></div>
  <div id="sendErr"></div>
  <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:16px"><button class="btn" id="send" ${blocked?"disabled":""}>${demo?"Enviar (modo prueba)":"Enviar a mi dietista"}</button>
  <button class="btn sec" id="pdfBtn" type="button">Guardar una copia en PDF</button></div>
  ${blocked?`<p class="small muted" style="margin-top:10px">Resuelve los puntos marcados con «!» para poder enviar.</p>`:""}</div>`;
}
function doneHTML(){
  const demo=!C.web3formsKey;
  return `<div class="card" style="text-align:center;padding:34px 20px">${C.logo?`<img class="hero-logo" src="${esc(C.logo)}" alt="" style="margin:0 auto 18px">`:""}<div class="done-ic" style="margin-inline:auto">✓</div>
  <h2>${demo?"Prueba completada":"¡Gracias, "+esc((S.data.nombre||"").split(" ")[0])+"!"}</h2>
  <p class="lead" style="margin-inline:auto">${demo?"Esto ha sido una prueba: no se ha enviado ningún correo.":`Tu cuestionario se ha enviado correctamente a ${esc(C.consulta)}. Lo revisaré antes de nuestra consulta.`}</p>
  <p class="small muted">Los datos guardados en este dispositivo se han borrado.</p>
  <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:16px"><button class="btn" id="pdfBtn" type="button">Guardar una copia en PDF</button></div>
  ${demo?`<details class="ins" style="text-align:left;margin-top:20px"><summary>Ver el correo que recibirías</summary><div class="in"><pre style="white-space:pre-wrap;font-size:.8rem">${esc(R.text(S,C))}</pre></div></details>`:""}</div>`;
}
async function send(){
  if($("#hp")&&$("#hp").value) return;
  const btn=$("#send"); btn.disabled=true; btn.textContent="Enviando…"; $("#sendErr").innerHTML="";
  S.meta.fin=new Date().toISOString();
  const d=S.data, subject=`Cuestionario dietético · ${d.nombre} · ${new Date().toLocaleDateString("es-ES")}`;
  try{
    if(C.web3formsKey){
      const body={access_key:C.web3formsKey,subject,from_name:C.consulta||"Cuestionario dietético",paciente:d.nombre,telefono:d.telefono||"",correo_paciente:d.email||"",informe:R.text(S,C),copia_datos_json:JSON.stringify(S)};
      if(d.email&&emailOk(d.email)) body.replyto=d.email;
      const res=await fetch("https://api.web3forms.com/submit",{method:"POST",headers:{"Content-Type":"application/json",Accept:"application/json"},body:JSON.stringify(body)});
      const j=await res.json().catch(()=>({}));
      if(!res.ok||!j.success) throw new Error(j.message||("Error "+res.status));
    }else await new Promise(r=>setTimeout(r,600));
    sent=true; try{ localStorage.removeItem(KEY); }catch(e){}
    $("#nav").style.display="none"; $("#saved").textContent=""; $("#s"+LAST).innerHTML=stepReview(); renderStepper(); scrollTo({top:0});
  }catch(e){
    btn.disabled=false; btn.textContent="Reintentar envío";
    $("#sendErr").innerHTML=`<div class="callout warn" style="margin-top:14px"><b>No se ha podido enviar.</b> ${esc(e.message||"")} Tus respuestas siguen guardadas. Comprueba tu conexión y vuelve a intentarlo, o guarda el PDF y envíalo por otro medio.</div>`;
  }
}
function printReport(){
  $("#printRoot").innerHTML=R.html(S,C);
  const old=document.title; document.title="Cuestionario dietético - "+(S.data.nombre||"paciente");
  document.body.classList.add("printing");
  const done=()=>{ document.body.classList.remove("printing"); document.title=old; window.removeEventListener("afterprint",done); };
  window.addEventListener("afterprint",done); setTimeout(()=>window.print(),60);
}

/* ---------------- Navegación ---------------- */
const RENDER=[stepIntro,stepDatos,stepAct,stepDiary,stepFreq,stepPref,stepConsent,stepReview];
function build(){ $("#host").innerHTML=RENDER.map((f,i)=>`<section class="step" id="s${i}" aria-label="${STEPS[i]}">${f()}</section>`).join(""); }
function go(n){
  n=Math.max(0,Math.min(LAST,n)); S.step=n;
  if(n===LAST) $("#s"+LAST).innerHTML=stepReview();
  $$(".step").forEach((s,i)=>s.classList.toggle("on",i===n));
  $("#prev").style.visibility=n===0?"hidden":"visible";
  const nx=$("#next"); nx.style.display=n===LAST?"none":""; nx.textContent=n===0?"Empezar →":n===LAST-1?"Revisar →":"Siguiente →";
  $("#mid").textContent=n===0?"":`Paso ${n} de ${LAST}`;
  if(n===3) renderDiary();
  if(n===4) updateFreqBadges();
  if(n===2) updateTotals();
  if(n===6) requestAnimationFrame(initSig);
  renderStepper(); save(); window.scrollTo({top:0,behavior:"auto"});
}

/* ---------------- Eventos ---------------- */
function onData(p){
  if(p.startsWith("act")) updateTotals();
  if(p.startsWith("freq.")||p.startsWith("freqOtros")||p==="freqDone") updateFreqBadges();
  renderStepper();
}
function handle(el){
  const p=el.dataset.path; let val=el.type==="checkbox"?el.checked:el.value;
  setPath(S,p,val); save();
  if(/^hab\.\w+\.dias$/.test(p)) renderDiary();
  if(p.startsWith("freq.")&&p.endsWith(".r")){ const row=el.closest(".fr"); if(row){ row.classList.remove("si","no"); row.classList.add(val); $$(".yn label",row).forEach(l=>l.classList.toggle("on",$("input",l).checked)); } }
  onData(p);
}
document.addEventListener("input",e=>{ const el=e.target.closest("[data-path]"); if(el) handle(el); });
document.addEventListener("change",e=>{
  const el=e.target.closest("[data-path]"); if(!el) return;
  if((el.dataset.path.startsWith("act"))&&el.type==="number"){
    const max=el.dataset.path.endsWith(".h")?24:59; let n=parseInt(el.value);
    if(el.value!==""&&(isNaN(n)||n<0)) n=0; if(n>max) n=max; if(el.value!=="") el.value=n;
  }
  handle(el);
});
document.addEventListener("click",e=>{
  const t=e.target;
  let b;
  if((b=t.closest("[data-go]"))){ go(+b.dataset.go); return; }
  if((b=t.closest("[data-tog]"))){
    const mm=S.hab[b.dataset.meal], f=b.dataset.food, g=b.dataset.group, i=mm.items.findIndex(x=>x.food===f&&(x.group||"")===g);
    if(i>=0) mm.items.splice(i,1); else mm.items.push(Object.assign({food:f,opt:"",qty:""},g?{group:g}:{}));
    save(); renderDiary(); renderStepper(); return;
  }
  if((b=t.closest("[data-rm]"))){ const [m,i]=b.dataset.rm.split("|"); S.hab[m].items.splice(+i,1); save(); renderDiary(); renderStepper(); return; }
  if((b=t.closest("[data-never]"))){
    $$(`[data-sec="${b.dataset.never}"] .fr`).forEach(r=>{ if(!$("input:checked",r)){ const n=$('input[value="no"]',r); n.checked=true; handle(n); } }); return;
  }
  if(t.closest("#pdfBtn")){ printReport(); return; }
  if(t.closest("#send")){ send(); return; }
  if(t.closest("#reset")){ if(confirm("Se borrará todo lo que has rellenado en este dispositivo. ¿Continuar?")){ try{localStorage.removeItem(KEY);}catch(e){} location.reload(); } }
});
document.addEventListener("input",e=>{
  if(e.target.id!=="fsearch") return;
  const q=e.target.value.trim().toLowerCase();
  $$("#freqHost details.sec").forEach(sec=>{
    let vis=0; $$(".fr",sec).forEach(r=>{ const m=!q||r.dataset.name.includes(q); r.hidden=!m; if(m) vis++; });
    sec.hidden=q&&!vis&&!sec.dataset.sec.includes("otros"); if(q&&vis) sec.open=true;
  });
});
$("#prev").onclick=()=>go(S.step-1);
$("#next").onclick=()=>go(S.step+1);

/* ---------------- Arranque ---------------- */
document.documentElement.style.setProperty("--accent",C.accent||"#1f6f5c");
if(C.accent){ const m=document.querySelector('meta[name=theme-color]'); m&&m.setAttribute("content",C.accent); }
$("#brandName").textContent=C.nombreCorto||C.consulta||"Cuestionario dietético";
if(C.logo||C.logoIcono){ const lg=$("#brandLogo"); lg.src=C.logoIcono||C.logo; lg.alt=C.logoIcono?"":(C.consulta||""); lg.hidden=false; if(!C.logoIcono) $("#brandName").hidden=true; }
document.title=(C.consulta?C.consulta+" · ":"")+"Cuestionario dietético";
build(); renderDiary(); updateTotals(); updateFreqBadges();
go(restored?S.step:0);
})();

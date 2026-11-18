/* Generación del informe (texto para el correo + HTML imprimible/PDF) */
(function(){
const D = window.DATA;
const esc = s => String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const mins = o => o ? (parseInt(o.h)||0)*60 + (parseInt(o.m)||0) : 0;
const fmt = t => { const h=Math.floor(t/60), m=t%60; return m ? `${h} h ${m} min` : `${h} h`; };
const hm = t => `${Math.floor(t/60)}:${String(t%60).padStart(2,"0")}`;

function actTotals(S){
  let lab=0, fes=0;
  const rows = D.activities.map(a=>S.act&&S.act[a.k]).concat(S.actOtras||[]);
  rows.forEach(r=>{ if(r){ lab+=mins(r.lab); fes+=mins(r.fes); } });
  return {lab, fes};
}
function actRows(S){
  const out=[];
  D.activities.forEach(a=>{
    const r=(S.act&&S.act[a.k])||{}; const l=mins(r.lab), f=mins(r.fes);
    if(l||f) out.push({name:a.l+(r.spec?` (${r.spec})`:""), lab:l, fes:f});
  });
  (S.actOtras||[]).forEach(r=>{
    const l=mins(r.lab), f=mins(r.fes);
    if((l||f)||r.name) out.push({name:r.name||"Otra actividad", lab:l, fes:f});
  });
  return out;
}
function mealHas(mm){ return !!(mm && ((mm.items&&mm.items.length) || (mm.otros||"").trim() || mm.dias==="d0")); }
function diasLabel(c){ const o=D.diasOpts.find(x=>x[0]===c); return o?o[1]:""; }
function itemLine(it){
  const parts=[(it.food||"(sin nombre)")+(it.group?` (${it.group.toLowerCase()})`:"")];
  if(it.opt) parts[0]+=` [${it.opt}]`;
  if(it.det) parts.push(it.det);
  if(it.qty) parts.push(it.qty);
  return parts.join(" — ");
}
function freqRows(S){
  const res=[]; 
  D.freq.forEach((sec,si)=>{
    const rows=[];
    sec.i.forEach((name,ii)=>{
      const f=(S.freq&&S.freq[si+"-"+ii])||{};
      if(f.r) rows.push({name, r:f.r, f:f.f, marca:f.marca, cant:f.cant});
    });
    if(rows.length) res.push({t:sec.t, rows});
  });
  const otros=(S.freqOtros||[]).filter(f=>f&&(f.name||f.f)).map(f=>({name:f.name||"Otro alimento",r:"si",f:f.f,marca:"",cant:f.cant}));
  if(otros.length) res.push({t:"Otros alimentos", rows:otros});
  return res;
}
function freqStr(r){
  if(r.r==="no") return "No";
  const o=D.freqOpts.find(x=>x[0]===r.f);
  return o?o[1]:"Sí (frecuencia sin indicar)";
}
function freqCount(S){ let n=0; Object.values(S.freq||{}).forEach(f=>{ if(f&&f.r) n++; }); return n; }
function freqTotal(){ return D.freq.reduce((a,s)=>a+s.i.length,0); }
function fechaES(iso){ if(!iso) return ""; const d=new Date(iso); return isNaN(d)?iso:d.toLocaleDateString("es-ES",{day:"2-digit",month:"long",year:"numeric"}); }
function hoy(){ return new Date().toLocaleDateString("es-ES",{day:"2-digit",month:"long",year:"numeric"}); }

/* ------------ TEXTO (cuerpo del correo) ------------ */
function text(S,cfg){
  const d=S.data||{}, L=[], hr="────────────────────────────────────────";
  L.push("CUESTIONARIO DIETÉTICO — "+(d.nombre||"(sin nombre)"));
  L.push("Cumplimentado: "+(S.meta&&S.meta.fin?fechaES(S.meta.fin):hoy()));
  L.push(hr,"DATOS DEL PACIENTE",hr);
  [["Nombre y apellidos",d.nombre],["Fecha de nacimiento",d.nacimiento?fechaES(d.nacimiento):""],["Sexo",d.sexo],["Teléfono",d.telefono],["Correo",d.email],
   ["Peso (kg)",d.peso],["Talla (cm)",d.talla],["Profesión",d.profesion],["Alergias / intolerancias",d.alergias]]
   .forEach(([k,v])=>{ if(v) L.push(`${k}: ${v}`); });

  const t=actTotals(S);
  L.push("",hr,"ACTIVIDAD FÍSICA (tiempo por día)",hr);
  actRows(S).forEach(r=>L.push(`· ${r.name}: laborable ${hm(r.lab)} | festivo ${hm(r.fes)}`));
  L.push(`TOTAL: laborable ${hm(t.lab)} | festivo ${hm(t.fes)}`);

  L.push("",hr,"COMIDAS HABITUALES (semana tipo)",hr);
  D.meals.forEach(m=>{
    const mm=(S.hab&&S.hab[m.k])||{};
    const head=[diasLabel(mm.dias), mm.hora&&("hacia las "+mm.hora+" h")].filter(Boolean).join(" · ");
    L.push("", "▌"+m.l.toUpperCase()+(head?" — "+head:""));
    if(mm.dias==="d0"){ L.push("  (casi nunca / no la hace)"); return; }
    if(!(mm.items&&mm.items.length)&&!(mm.otros||"").trim()){ L.push("  (sin datos)"); return; }
    (mm.items||[]).forEach(it=>L.push("  · "+itemLine(it)));
    if((mm.otros||"").trim()) L.push("  · Otros: "+mm.otros.trim());
  });
  if(S.habNotas) L.push("", "Cambios en fin de semana / festivos / comidas fuera: "+S.habNotas);

  L.push("",hr,"FRECUENCIA DE CONSUMO",hr);
  const fr=freqRows(S);
  if(!fr.length) L.push("(sin datos)");
  fr.forEach(sec=>{
    L.push("", sec.t.toUpperCase());
    const nunca=sec.rows.filter(r=>r.r==="no").map(r=>r.name);
    sec.rows.filter(r=>r.r!=="no").forEach(r=>{
      const extra=[r.marca&&("marca/tipo: "+r.marca), r.cant&&("cantidad: "+r.cant)].filter(Boolean).join("; ");
      L.push(`  · ${r.name}: ${freqStr(r)}${extra?"  ("+extra+")":""}`);
    });
    if(nunca.length) L.push("  No consume: "+nunca.join(", "));
  });

  const p=S.pref||{};
  if(p.favoritos||p.noGustan||p.quienCocina||p.comeFuera||p.observaciones){
    L.push("",hr,"PREFERENCIAS Y OBSERVACIONES",hr);
    [["Alimentos favoritos",p.favoritos],["Alimentos que no le gustan",p.noGustan],["Quién cocina en casa",p.quienCocina],["Comidas fuera de casa",p.comeFuera],["Observaciones",p.observaciones]]
      .forEach(([k,v])=>{ if(v) L.push(`${k}: ${v}`); });
  }
  const c=S.consent||{};
  L.push("",hr,"PROTECCIÓN DE DATOS",hr);
  L.push(`Consentimiento explícito RGPD: ${c.lopd?"SÍ":"NO"} · Firma manuscrita: ${c.firma?"SÍ (ver copia de datos al final)":"NO"}`);
  L.push(`Firmante: ${c.firmante||d.nombre||""} · Fecha: ${c.fechaFirma?fechaES(c.fechaFirma):""}`);
  return L.join("\n");
}

/* ------------ HTML (informe imprimible / PDF) ------------ */
function html(S,cfg){
  const d=S.data||{}, c=S.consent||{}, t=actTotals(S);
  let h=`<div class="rep">
  <div class="rep-head"><div><div class="rep-kicker">Informe del paciente</div><h1>Cuestionario dietético</h1></div>
  <div class="rep-brand">${cfg.logo?`<img class="rep-logo" src="${esc(cfg.logo)}" alt="">`:""}<b>${esc(cfg.consulta)}</b><br>${esc(cfg.profesional)}${cfg.colegiado?"<br>Col. "+esc(cfg.colegiado):""}${cfg.telefono?"<br>"+esc(cfg.telefono):""}${cfg.email?"<br>"+esc(cfg.email):""}</div></div>
  <h2>1. Datos del paciente</h2><table class="kv">`;
  [["Nombre y apellidos",d.nombre],["Fecha de nacimiento",d.nacimiento?fechaES(d.nacimiento):""],["Sexo",d.sexo],["Teléfono",d.telefono],["Correo",d.email],
   ["Peso",d.peso?d.peso+" kg":""],["Talla",d.talla?d.talla+" cm":""],["Profesión",d.profesion],["Alergias / intolerancias",d.alergias],
   ["Fecha de cumplimentación",S.meta&&S.meta.fin?fechaES(S.meta.fin):hoy()]]
   .forEach(([k,v])=>{ if(v) h+=`<tr><th>${k}</th><td>${esc(v)}</td></tr>`; });
  h+=`</table><h2>2. Actividad física</h2><table class="grid"><thead><tr><th>Actividad</th><th>Día laborable</th><th>Día festivo</th></tr></thead><tbody>`;
  actRows(S).forEach(r=>h+=`<tr><td>${esc(r.name)}</td><td>${r.lab?fmt(r.lab):"–"}</td><td>${r.fes?fmt(r.fes):"–"}</td></tr>`);
  h+=`<tr class="tot"><td>Total</td><td>${fmt(t.lab)}</td><td>${fmt(t.fes)}</td></tr></tbody></table>`;

  h+=`<h2>3. Comidas habituales (semana tipo)</h2>`;
  D.meals.forEach(m=>{
    const mm=(S.hab&&S.hab[m.k])||{};
    const head=[diasLabel(mm.dias), mm.hora&&(mm.hora+" h")].filter(Boolean).join(" · ");
    h+=`<div class="day"><h3>${m.l}${head?` <span class="muted" style="font-weight:400;font-size:.85em">· ${esc(head)}</span>`:""}</h3>`;
    if(mm.dias==="d0") h+=`<p class="muted">Casi nunca / no hace esta comida.</p>`;
    else if(!(mm.items&&mm.items.length)&&!(mm.otros||"").trim()) h+=`<p class="muted">Sin datos.</p>`;
    else { h+=`<ul>`; (mm.items||[]).forEach(it=>h+=`<li>${esc(itemLine(it))}</li>`); if((mm.otros||"").trim()) h+=`<li>Otros: ${esc(mm.otros.trim())}</li>`; h+=`</ul>`; }
    h+=`</div>`;
  });
  if(S.habNotas) h+=`<p class="note"><b>Fines de semana, festivos, comidas fuera:</b> ${esc(S.habNotas)}</p>`;
  h+=`<h2>4. Frecuencia de consumo</h2>`;
  const fr=freqRows(S);
  if(!fr.length) h+=`<p class="muted">Sin datos.</p>`;
  fr.forEach(sec=>{
    h+=`<h3>${esc(sec.t)}</h3><table class="grid"><thead><tr><th>Alimento</th><th>Frecuencia</th><th>Marca / tipo</th><th>Cantidad por vez</th></tr></thead><tbody>`;
    sec.rows.filter(r=>r.r!=="no").forEach(r=>h+=`<tr><td>${esc(r.name)}</td><td>${esc(freqStr(r))}</td><td>${esc(r.marca||"")}</td><td>${esc(r.cant||"")}</td></tr>`);
    h+=`</tbody></table>`;
    const nunca=sec.rows.filter(r=>r.r==="no").map(r=>r.name);
    if(nunca.length) h+=`<p class="muted small">No consume: ${esc(nunca.join(", "))}</p>`;
  });
  const p=S.pref||{};
  if(p.favoritos||p.noGustan||p.quienCocina||p.comeFuera||p.observaciones){
    h+=`<h2>5. Preferencias y observaciones</h2><table class="kv">`;
    [["Alimentos favoritos",p.favoritos],["No le gustan",p.noGustan],["Quién cocina",p.quienCocina],["Comidas fuera de casa",p.comeFuera],["Observaciones",p.observaciones]]
      .forEach(([k,v])=>{ if(v) h+=`<tr><th>${k}</th><td>${esc(v)}</td></tr>`; });
    h+=`</table>`;
  }
  h+=`<h2>6. Consentimiento y firma</h2><p class="small">El paciente (o su representante) declara haber leído la información sobre protección de datos y consiente expresamente el tratamiento de sus datos personales y de salud.</p>
  <div class="sig">${c.firma?`<img src="${c.firma}" alt="Firma">`:`<div class="nosig">Sin firma</div>`}
  <div class="small">${esc(c.firmante||d.nombre||"")}<br>${c.fechaFirma?fechaES(c.fechaFirma):""}</div></div></div>`;
  return h;
}

window.Report={mins,fmt,hm,actTotals,freqCount,freqTotal,text,html,esc,fechaES,hoy,mealHas};
})();

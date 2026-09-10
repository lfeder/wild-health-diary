(function(root){
 const keys=['calories','protein','carbs','fat'];
 function totals(entries){return entries.filter(e=>e.type==='Food').reduce((a,e)=>{keys.forEach(k=>a[k]+=e[k]*e.servings);return a;},{calories:0,protein:0,carbs:0,fat:0});}
 function valid(data){if(data?.version!==1||!Array.isArray(data.days)||!data.days.length||!Array.isArray(data.foods))return false;const nutrition=e=>keys.every(k=>Number.isFinite(e[k])&&e[k]>=0);return data.foods.every(f=>typeof f.name==='string'&&nutrition(f))&&data.days.every(d=>typeof d.id==='string'&&typeof d.label==='string'&&d.metrics&&Object.entries(d.metrics).every(([k,v])=>['recovery','strain','sleep','rhr'].includes(k)&&Number.isFinite(v)&&v>=0&&(k!=='recovery'||v<=100)&&(k!=='strain'||v<=21)&&(k!=='sleep'||v<=24))&&Array.isArray(d.entries)&&d.entries.every(e=>typeof e.id==='string'&&typeof e.name==='string'&&typeof e.notes==='string'&&/^([01]\d|2[0-3]):[0-5]\d$/.test(e.time)&&['Food','Exercise','Sleep','Glucose','Work','Note'].includes(e.type)&&(e.type!=='Food'||nutrition(e)&&Number.isFinite(e.servings)&&e.servings>0)&&(e.type!=='Glucose'||Number.isFinite(e.glucose)&&e.glucose>0)));}
 function dateImports(data){
 const weekdays=['friday','saturday','sunday','monday','tuesday','wednesday'];
 for(const [i,weekday] of weekdays.entries()){
  const old=data.days.find(d=>d.id==='import-'+weekday);if(!old)continue;
  const id='2026-09-'+String(4+i).padStart(2,'0');
  const existing=data.days.find(d=>d.id===id);
  if(existing){const ids=new Set(existing.entries.map(e=>e.id));old.entries=[...old.entries.filter(e=>!ids.has(e.id)),...existing.entries];old.metrics={...old.metrics,...existing.metrics};data.days=data.days.filter(d=>d!==existing);}
  old.id=id;old.label=weekday[0].toUpperCase()+weekday.slice(1)+' · Sep '+(4+i);old.imported=true;
 }
 // The imported late-work row describes the same Wednesday wake-up event.
 for(const d of data.days){
  const wake=d.entries.find(e=>e.id==='import-wednesday-0');
  const work=d.entries.find(e=>e.id==='import-wednesday-1');
  if(!wake||!work)continue;
  const originalWork=work.name==='Late work the previous night'&&work.notes==='Exact work time and duration not supplied.';
  if(originalWork){
   if(!/late.*work/i.test(wake.notes))wake.notes+=(wake.notes?'\n':'')+'Stayed up late working the previous night.';
  }else{
   wake.notes+=(wake.notes?'\n':'')+[work.name,work.notes].filter(Boolean).join(' — ');
  }
  d.entries=d.entries.filter(e=>e!==work);
 }
 return data;
 }
 // Past entry names of one type, most recent first, for the name autocomplete.
 function suggestions(days,type){
  const seen=new Map();
  for(const d of days.slice().sort((a,b)=>b.id.localeCompare(a.id)))
   for(const e of d.entries.slice().sort((a,b)=>b.time.localeCompare(a.time))){
    const name=e.name?.trim();
    if(e.type===type&&name&&!seen.has(name.toLowerCase()))seen.set(name.toLowerCase(),name);
   }
  return [...seen.values()];
 }
 root.DiaryCore={totals,valid,dateImports,suggestions};
})(globalThis);

const $=id=>document.getElementById(id),key='lenny-daybook-v1',macroKeys=['calories','protein','carbs','fat'];
let data=structuredClone(SEED),selected='import-wednesday',editing=null;
try{const saved=localStorage.getItem(key);if(saved){const parsed=JSON.parse(saved);if(!DiaryCore.valid(parsed))throw Error('Invalid backup');data=parsed;selected=data.days.at(-1).id;}}catch(e){alert('Saved diary could not be read. Your stored copy has not been changed. Export or recover it before saving new entries.');}
DiaryCore.dateImports(data);selected=data.days.at(-1).id;
const day=()=>data.days.find(d=>d.id===selected),escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function notify(s){$('status').textContent=s;$('status').classList.add('visible');setTimeout(()=>$('status').classList.remove('visible'),4000);}
function save(){try{localStorage.setItem(key,JSON.stringify(data));return true;}catch(e){notify('Could not save in this browser. Export a backup now.');return false;}}
const collapsed=new Set();
function metricsText(d){return [['sleep','Sleep',' h'],['rhr','RHR',' bpm']].filter(([k])=>d.metrics[k]!=null).map(([k,label,unit])=>label+' '+d.metrics[k]+unit).join(' · ');}
// Recovery belongs to the wake-up entry, strain to exercise; both are one number per day.
function whoopText(d,type){const bits=[];if((type==null||type==='Sleep')&&d.metrics.recovery!=null)bits.push(d.metrics.recovery+'% rec');if((type==null||type==='Exercise')&&d.metrics.strain!=null)bits.push(d.metrics.strain+' strain');return bits.join(' · ');}
function macroCells(values,estimated=false){return macroKeys.map((k,i)=>`<td class="number">${estimated?'~':''}${Math.round(values[k]).toLocaleString()}${i?'g':''}</td>`).join('');}
function render(){
 const d=day();$('count').textContent=data.days.length+' days · '+data.days.reduce((n,d)=>n+d.entries.length,0)+' entries';
 $('timeline').innerHTML=data.days.slice().sort((a,b)=>b.id.localeCompare(a.id)).map(d=>{
 const open=!collapsed.has(d.id),total=DiaryCore.totals(d.entries),estimated=d.entries.some(e=>e.type==='Food'&&e.estimated);
 const header=`<tr class="date-row"><th scope="row"><button data-toggle="${escape(d.id)}" aria-expanded="${open}">${open?'▾':'▸'} ${escape(d.label)}</button></th><td colspan="2"><span class="day-metrics">${escape(metricsText(d))}</span><span class="day-count">${d.entries.length} entries · daily total</span></td><td class="whoop">${escape(whoopText(d))}</td>${macroCells(total,estimated)}<td><button data-add="${escape(d.id)}" aria-label="Add entry for ${escape(d.label)}">＋</button></td></tr>`;
 if(!open)return header;
 return header+(d.entries.slice().sort((a,b)=>a.time.localeCompare(b.time)).map(e=>{
 const food=e.type==='Food',type={Sleep:'Wake / WHOOP',Exercise:'Exercise / strain'}[e.type]||e.type;
 return `<tr class="entry" data-day="${escape(d.id)}"><td class="type">${escape(type)}</td><td class="time">${escape(e.time)}</td><td class="entry-text"><span>${escape(e.name)}</span>${e.type==='Glucose'?` · ${e.glucose} mg/dL`:''}${food?`<details class="portion"><summary>${e.servings} serving(s)${e.estimated?' · estimated':''} · details</summary><div>${escape(e.notes)}</div></details>`:e.notes?`<span class="context"> — ${escape(e.notes)}</span>`:''}</td><td class="whoop">${escape(whoopText(d,e.type))}</td>${food?macroCells(Object.fromEntries(macroKeys.map(k=>[k,e[k]*e.servings])),e.estimated):'<td></td><td></td><td></td><td></td>'}<td class="actions"><button data-edit="${escape(e.id)}" aria-label="Edit ${escape(e.name)}">Edit</button><button data-delete="${escape(e.id)}" aria-label="Delete ${escape(e.name)}">×</button></td></tr>`;
 }).join('')||'<tr><td></td><td colspan="8" class="muted">No entries yet. Use + to add one.</td></tr>');
 }).join('');
 $('entry-day').innerHTML=data.days.slice().sort((a,b)=>b.id.localeCompare(a.id)).map(d=>`<option value="${escape(d.id)}">${escape(d.label)}</option>`).join('');$('entry-day').value=selected;$('entry-day').disabled=!!editing;
 $('foods').innerHTML=data.foods.map(f=>`<option value="${escape(f.name)}"></option>`).join('');
 for(const k of ['recovery','strain','sleep','rhr'])$('metrics').elements[k].value=d.metrics[k]??'';
 const readings=d.entries.filter(e=>e.type==='Glucose').sort((a,b)=>a.time.localeCompare(b.time));$('glucose-summary').textContent=readings.length?'Latest: '+readings.at(-1).glucose+' mg/dL at '+readings.at(-1).time:'No readings logged.';
}
function openEditor(id){selected=id;reset();render();$('editor').showModal();$('name').focus();}
$('close-editor').onclick=()=>$('editor').close();
$('entry-day').onchange=()=>{selected=$('entry-day').value;render();};
$('expand').onclick=()=>{collapsed.clear();render();};
$('collapse').onclick=()=>{data.days.forEach(d=>collapsed.add(d.id));render();};
// The picker offers these four; Glucose and Note stay editable on entries that already use them.
const entryTypes=[['Sleep','Wake'],['Food','Food'],['Exercise','Exercise'],['Work','Work']];
function renderTypeToggle(type){
 const shown=entryTypes.some(([t])=>t===type)?entryTypes:[...entryTypes,[type,type]];
 $('type-toggle').innerHTML=shown.map(([t,label])=>`<button type="button" role="radio" data-type="${escape(t)}" aria-checked="${t===type}">${escape(label)}</button>`).join('');
}
$('type-toggle').onclick=e=>{const button=e.target.closest('button');if(!button)return;$('type').value=button.dataset.type;setType();};
function setType(){const type=$('type').value,food=type==='Food',glucose=type==='Glucose';$('nutrition').hidden=!food;$('servings-label').hidden=!food;$('servings').required=food;$('glucose-label').hidden=!glucose;$('glucose').required=glucose;macroKeys.forEach(k=>$(k).required=food);
 // Non-food entries autocomplete from what you have already logged of the same type.
 $('suggestions').innerHTML=food?'':DiaryCore.suggestions(data.days,type).map(n=>`<option value="${escape(n)}"></option>`).join('');
 renderTypeToggle(type);
 $('name').setAttribute('list',food?'foods':'suggestions');
 const exercise=type==='Exercise',wake=type==='Sleep';
 $('strain-label').hidden=!exercise;$('recovery-label').hidden=!wake;$('whoop-hint').hidden=!(exercise||wake);
 if(exercise)$('entry-strain').value=day().metrics.strain??'';
 if(wake)$('entry-recovery').value=day().metrics.recovery??'';
 $('name').placeholder=food?'Start typing a favorite…':{Exercise:'Start typing an activity…',Glucose:'Reading label, e.g. Post-lunch…',Sleep:'Wake up…'}[type]||'Start typing…';}
function reset(){editing=null;$('entry-form').reset();$('time').value=new Date().toTimeString().slice(0,5);$('form-title').textContent='Add to your day';$('cancel').hidden=true;setType();}
$('type').onchange=setType;$('cancel').onclick=()=>{reset();render();};
$('name').addEventListener('input',()=>{if($('type').value!=='Food')return;const f=data.foods.find(f=>f.name.toLowerCase()===$('name').value.toLowerCase());if(f){macroKeys.forEach(k=>$(k).value=f[k]);$('notes').value=f.notes||'';$('estimated').checked=!!f.estimated;}});
$('entry-form').onsubmit=e=>{e.preventDefault();const entry={id:editing||crypto.randomUUID(),type:$('type').value,time:$('time').value,name:$('name').value.trim(),notes:$('notes').value};if(!entry.name)return; if(entry.type==='Food'){macroKeys.forEach(k=>entry[k]=Number($(k).value));entry.servings=Number($('servings').value);entry.estimated=$('estimated').checked;const f={name:entry.name,notes:entry.notes,estimated:entry.estimated};macroKeys.forEach(k=>f[k]=entry[k]);const index=data.foods.findIndex(x=>x.name.toLowerCase()===entry.name.toLowerCase());if(index>=0)data.foods[index]=f;else data.foods.push(f);}if(entry.type==='Glucose')entry.glucose=Number($('glucose').value);
 const whoop={Exercise:['strain','entry-strain'],Sleep:['recovery','entry-recovery']}[entry.type];
 if(whoop){const value=$(whoop[1]).value;if(value==='')delete day().metrics[whoop[0]];else day().metrics[whoop[0]]=Number(value);}const i=day().entries.findIndex(x=>x.id===editing);if(i>=0)day().entries[i]=entry;else day().entries.push(entry);const ok=save();collapsed.delete(selected);reset();render();$('editor').close();if(ok)notify('Entry saved');};
$('timeline').onclick=e=>{const button=e.target.closest('button');if(!button)return;const ds=button.dataset;
 if(ds.toggle){collapsed.has(ds.toggle)?collapsed.delete(ds.toggle):collapsed.add(ds.toggle);render();return;}
 if(ds.add){openEditor(ds.add);return;}
 const id=ds.edit||ds.delete;if(!id)return;selected=button.closest('tr').dataset.day;const entry=day().entries.find(x=>x.id===id);
 if(ds.delete){if(confirm('Delete this entry?')){day().entries=day().entries.filter(x=>x.id!==id);save();render();}return;}
 reset();editing=id;render();$('form-title').textContent='Edit entry';$('cancel').hidden=false;for(const k of ['type','time','name','notes','servings','glucose',...macroKeys])$(k).value=entry[k]??(k==='servings'?1:'');$('estimated').checked=!!entry.estimated;setType();$('editor').showModal();};
$('metrics').onsubmit=e=>{e.preventDefault();day().metrics={};for(const k of ['recovery','strain','sleep','rhr']){const value=$('metrics').elements[k].value;if(value!=='')day().metrics[k]=Number(value);}const ok=save();render();if(ok)notify('Metrics saved');};
$('today').onclick=()=>{const now=new Date(),id=[now.getFullYear(),String(now.getMonth()+1).padStart(2,'0'),String(now.getDate()).padStart(2,'0')].join('-');if(!data.days.some(d=>d.id===id))data.days.push({id,label:now.toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'}),metrics:{},entries:[]});selected=id;save();openEditor(id);};
$('export').onclick=()=>{const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='daybook-backup.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
$('import').onchange=async e=>{const file=e.target.files[0];if(!file)return;try{const parsed=JSON.parse(await file.text());if(!DiaryCore.valid(parsed))throw Error('Invalid diary file');if(confirm('Replace the diary in this browser with this backup? Export your current diary first if needed.')){data=DiaryCore.dateImports(parsed);selected=data.days.at(-1).id;save();reset();render();}}catch(error){notify('Could not restore: choose a valid Daybook JSON backup.');}e.target.value='';};
// Every imported food is reusable, including composite meals.
for(const d of data.days)for(const e of d.entries)if(e.type==='Food'&&!data.foods.some(f=>f.name===e.name)){const f={name:e.name,notes:e.notes,estimated:e.estimated};macroKeys.forEach(k=>f[k]=e[k]);data.foods.push(f);}
reset();render();

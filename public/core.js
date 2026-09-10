(function(root){
 const keys=['calories','protein','carbs','fat'];
 function totals(entries){return entries.filter(e=>e.type==='Food').reduce((a,e)=>{keys.forEach(k=>a[k]+=e[k]*e.servings);return a;},{calories:0,protein:0,carbs:0,fat:0});}
 function valid(data){if(data?.version!==1||!Array.isArray(data.days)||!data.days.length||!Array.isArray(data.foods))return false;const nutrition=e=>keys.every(k=>Number.isFinite(e[k])&&e[k]>=0);return data.foods.every(f=>typeof f.name==='string'&&nutrition(f))&&data.days.every(d=>typeof d.id==='string'&&typeof d.label==='string'&&d.metrics&&Object.entries(d.metrics).every(([k,v])=>['recovery','strain','sleep','rhr'].includes(k)&&Number.isFinite(v)&&v>=0&&(k!=='recovery'||v<=100)&&(k!=='strain'||v<=21)&&(k!=='sleep'||v<=24))&&Array.isArray(d.entries)&&d.entries.every(e=>typeof e.id==='string'&&typeof e.name==='string'&&typeof e.notes==='string'&&/^([01]\d|2[0-3]):[0-5]\d$/.test(e.time)&&['Food','Exercise','Sleep','Glucose','Work','Note'].includes(e.type)&&(e.type!=='Food'||nutrition(e)&&Number.isFinite(e.servings)&&e.servings>0)&&(e.type!=='Glucose'||Number.isFinite(e.glucose)&&e.glucose>0)));}
 root.DiaryCore={totals,valid};
})(globalThis);

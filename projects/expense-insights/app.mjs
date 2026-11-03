import { CATEGORIES, dollars, normalizeTransaction, totalsForMonth, toCSV } from './finance.mjs';
const $=id=>document.getElementById(id);
const KEY='ko-expense-insights-v1';
const demo=[
  {id:'s1',merchant:'Campus lunch',category:'Food',date:'2026-11-01',cents:1250},
  {id:'s2',merchant:'Bus pass',category:'Transport',date:'2026-11-02',cents:4200},
  {id:'s3',merchant:'Course materials',category:'School',date:'2026-11-01',cents:2900},
  {id:'s4',merchant:'Coffee with friends',category:'Food',date:'2026-11-02',cents:675}
];
let transactions;
try {const saved=JSON.parse(localStorage.getItem(KEY));transactions=Array.isArray(saved)?saved.map(t=>normalizeTransaction(t)):demo;}
catch{transactions=demo;}
function save(){try{localStorage.setItem(KEY,JSON.stringify(transactions));}catch{$('message').textContent='Browser storage unavailable; changes may not persist.';}}
const now=new Date();
$('month').value=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
$('date').value=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
function render(){
 const month=$('month').value;
 const s=totalsForMonth(transactions,month);
 $('total').textContent=dollars(s.total);$('count').textContent=String(s.count);
 const budget=Math.round(Number($('budget').value||0)*100);
 $('remaining').textContent=dollars(budget-s.total);
 $('remaining').classList.toggle('overspent',s.total>budget);
 $('bar').style.width=budget?`${Math.min(100,s.total/budget*100)}%`:'0%';
 $('bar').setAttribute('aria-valuenow',budget?Math.round(s.total/budget*100):0);
 const chart=$('chart');chart.replaceChildren();
 for(const category of CATEGORIES){
  const wrapper=document.createElement('div');wrapper.className='chart-row';
  const label=document.createElement('span');label.textContent=category;
  const track=document.createElement('div');track.className='track';
  const fill=document.createElement('div');fill.className='fill';fill.style.width=s.total?`${s.byCategory[category]/s.total*100}%`:'0%';track.append(fill);
  const value=document.createElement('strong');value.textContent=dollars(s.byCategory[category]);
  wrapper.append(label,track,value);chart.append(wrapper);
 }
 const rows=$('transactions');rows.replaceChildren();
 for(const t of s.matching){const tr=document.createElement('tr');for(const text of [t.date,t.merchant,t.category,dollars(t.cents)]){const td=document.createElement('td');td.textContent=text;tr.append(td);}const td=document.createElement('td');const btn=document.createElement('button');btn.textContent='Delete';btn.setAttribute('aria-label',`Delete ${t.merchant}`);btn.addEventListener('click',()=>{transactions=transactions.filter(x=>x.id!==t.id);save();render();});td.append(btn);tr.append(td);rows.append(tr);}
 $('empty').hidden=s.matching.length>0;
}
$('form').addEventListener('submit',event=>{
 event.preventDefault();try{
  const draft=Object.fromEntries(new FormData(event.currentTarget));
  transactions.push(normalizeTransaction(draft));save();$('form').reset();$('date').value=new Date().toISOString().slice(0,10);$('message').textContent='Transaction saved locally.';render();
 }catch(e){$('message').textContent=e.message;}
});
$('month').addEventListener('change',render);
$('budget').addEventListener('change',render);
$('export').addEventListener('click',()=>{const blob=new Blob([toCSV(transactions)],{type:'text/csv;charset=utf-8'});const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download='expense-insights.csv';link.click();URL.revokeObjectURL(url);});
$('reset').addEventListener('click',()=>{if(!confirm('Replace your local data with sample transactions?'))return;transactions=structuredClone(demo);save();render();});
render();

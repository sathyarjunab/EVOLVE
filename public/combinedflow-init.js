/* ══════════════════════════════════════════════
   CONSTANTS
══════════════════════════════════════════════ */
const MONTHS=['January','February','March','April','May','June','July','August','September','October','November','December'];
const MONTHS_SHORT=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DAYS_SHORT=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

const CAT_COLORS={'Food & Dining':'#F87171','Rent / EMI':'#7B6EF5','Subscriptions':'#60A5FA','Transport':'#34D399','Entertainment':'#FBBF24','Utilities':'#A78BFA','Medical':'#F472B6','Shopping':'#FB923C','Freelance':'#4ADE80','Salary':'#86EFAC','Investment':'#6EE7B7','Savings':'#C8FF4D','Other':'#9CA3AF'};
const CAT_EMOJIS={'Food & Dining':'🍽️','Rent / EMI':'🏠','Subscriptions':'📺','Transport':'🚌','Entertainment':'🎮','Utilities':'⚡','Medical':'💊','Shopping':'🛍️','Freelance':'💻','Salary':'💼','Investment':'📈','Savings':'💰','Other':'📦'};
const INC_EMOJIS=['💼','💻','🏢','🏠','📈','⚡','🎨','🎵','📦','💰','🛒','🌐'];
const DUE_EMOJIS=['🏠','📺','⚡','💊','🚌','📱','🎵','📦','💳','🌐','🏋️','🐕'];
const GOAL_EMOJIS=['🏠','🏖️','💻','🚗','🎓','✈️','💍','👶','💊','🏋️','📱','🎨','🐕','🌍','🛒','💰'];
const HABIT_EMOJIS=['🧘','💪','📚','💧','🚫','📓','😴','🥗','🏃','🎯','✍️','🎵','🌿','☀️','🧠','💊','🚴','🍎','🛌','🧹','☕','🖊️','🌊','🐾','🎨','🧩','🏋️','🤸'];

/* ══════════════════════════════════════════════
   STATE — read from server-injected JSON
══════════════════════════════════════════════ */
const BDEF={userName:null,currency:'$',incomeSources:[],transactions:[],dues:[],savingsGoals:[],bankBalance:null,bankNote:'',bankBalUpdated:null,tutorialSeen:false};
const HDEF={habits:[],history:{},doneToday:{},lastDate:null,globalStreak:0,bestGlobalStreak:0,totalAllTime:0,userName:null};

function getInjectedState(){
  const el=document.getElementById('combinedflow-data');
  if(!el)return{bState:JSON.parse(JSON.stringify(BDEF)),hState:JSON.parse(JSON.stringify(HDEF))};
  try{return JSON.parse(el.textContent);}catch(e){return{bState:JSON.parse(JSON.stringify(BDEF)),hState:JSON.parse(JSON.stringify(HDEF))};}
}

const injected=getInjectedState();
let bState={...JSON.parse(JSON.stringify(BDEF)),...injected.bState};
let hState={...JSON.parse(JSON.stringify(HDEF)),...injected.hState};

/* ══════════════════════════════════════════════
   TOAST
══════════════════════════════════════════════ */
const showToast=(msg,type='error')=>{
  if(typeof window!=='undefined'&&window.showToast)window.showToast(msg);
  else console.error(msg);
};

/* ══════════════════════════════════════════════
   API HELPERS
══════════════════════════════════════════════ */
async function bApiCall(path,body,method='POST'){
  try{
    const res=await fetch(`/api/budget/${path}`,{method,headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
    const data=await res.json();
    if(!res.ok)throw new Error(data.error||'Request failed');
    if(data.state)bState={...bState,...data.state};
    return data;
  }catch(e){showToast(e.message||'Something went wrong');throw e;}
}

async function hApiCall(path,body,method='POST'){
  try{
    const res=await fetch(`/api/habit/${path}`,{method,headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
    const data=await res.json();
    if(!res.ok)throw new Error(data.error||'Request failed');
    if(data.state)hState={...hState,...data.state};
    return data;
  }catch(e){showToast(e.message||'Something went wrong');throw e;}
}

/* ══════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════ */
const getCurrency=()=>(bState.currency||'$');
const fmt=n=>getCurrency()+Math.abs(n).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
const fmtC=n=>getCurrency()+Math.abs(n).toLocaleString('en-US',{maximumFractionDigits:0});
const todayStr=()=>{const d=new Date();return`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};
const toStr=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const yesterday=()=>{const d=new Date();d.setDate(d.getDate()-1);return toStr(d);};
const daysAgo=n=>{const d=new Date();d.setDate(d.getDate()-n);return toStr(d);};
const getPeriod=()=>({yr:parseInt(document.getElementById('navYear').value),mo:parseInt(document.getElementById('navMonth').value)});
const periodKey=(yr,mo)=>`${yr}-${String(mo+1).padStart(2,'0')}`;
function getMonthTxs(yr,mo){const pk=periodKey(yr,mo);return(bState.transactions||[]).filter(t=>t.date&&t.date.startsWith(pk));}
function getTotalIncome(yr,mo){const recurring=(bState.incomeSources||[]).reduce((a,s)=>a+s.amount,0);const oneTime=getMonthTxs(yr,mo).filter(t=>t.type==='income').reduce((a,t)=>a+t.amount,0);return recurring+oneTime;}
function getMonthSavingsAllocated(yr,mo){return getMonthTxs(yr,mo).filter(t=>t.type==='savings').reduce((a,t)=>a+t.amount,0);}

/* ══════════════════════════════════════════════
   NAV INIT
══════════════════════════════════════════════ */
function initNav(){
  const now=new Date();
  const yearSel=document.getElementById('navYear');
  const monSel=document.getElementById('navMonth');
  if(!yearSel||!monSel)return;
  const cy=now.getFullYear();
  for(let y=cy-1;y<=cy+1;y++){const o=document.createElement('option');o.value=y;o.textContent=y;if(y===cy)o.selected=true;yearSel.appendChild(o);}
  for(let m=0;m<12;m++){const o=document.createElement('option');o.value=m;o.textContent=MONTHS[m];if(m===now.getMonth())o.selected=true;monSel.appendChild(o);}
  syncMobPeriod();updateMonthBadge();
}
function syncMobPeriod(){
  const yr=document.getElementById('navYear').value;
  const mo=document.getElementById('navMonth').value;
  const my=document.getElementById('mobYear');const mm=document.getElementById('mobMonth');
  if(my)my.value=yr;if(mm)mm.value=mo;
}
function onPeriodChange(){updateMonthBadge();syncMobPeriod();refreshAll();}
function updateMonthBadge(){
  const {yr,mo}=getPeriod();
  const lbl=MONTHS[mo]+' '+yr;
  ['monthBadge','monthBadgeBudget'].forEach(id=>{const el=document.getElementById(id);if(el)el.textContent=lbl;});
}
function toggleMobDrawer(){const d=document.getElementById('mobDrawer');d.classList.contains('open')?closeMobDrawer():openMobDrawer();}
function openMobDrawer(){document.getElementById('mobDrawer').classList.add('open');document.getElementById('mobMenuBtn').classList.add('open');requestAnimationFrame(()=>document.getElementById('mobDrawerBackdrop').classList.add('open'));}
function closeMobDrawer(){document.getElementById('mobDrawer').classList.remove('open');document.getElementById('mobMenuBtn').classList.remove('open');document.getElementById('mobDrawerBackdrop').classList.remove('open');}

/* ══════════════════════════════════════════════
   PAGE NAVIGATION
══════════════════════════════════════════════ */
let currentPage='overview';
function showPage(id){
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.ntab').forEach(t=>t.classList.remove('active'));
  document.querySelectorAll('.mob-nav-item').forEach(t=>t.classList.remove('active'));
  const page=document.getElementById('page-'+id);if(page)page.classList.add('active');
  const tab=document.getElementById('tab-'+id);if(tab)tab.classList.add('active');
  const mt=document.getElementById('mob-tab-'+id);if(mt)mt.classList.add('active');
  const fab=document.getElementById('fabBtn');
  if(fab){
    if(id==='budget'||id==='ledger'||id==='overview')fab.style.display='flex';
    else fab.style.display='none';
  }
  currentPage=id;closeMobDrawer();
  if(id==='overview')refreshOverview();
  else if(id==='budget')refreshBudget();
  else if(id==='habits'){renderHabits();updateHabitStats();}
  else if(id==='ledger')renderLedger();
  if(id==='habits'&&window._initHabitCharts){window._initHabitCharts();window._initHabitCharts=null;}
}

/* ══════════════════════════════════════════════
   STATS CALCULATION
══════════════════════════════════════════════ */
function calcStats(yr,mo){
  const txs=getMonthTxs(yr,mo);
  const totalIncome=getTotalIncome(yr,mo);
  const spent=txs.filter(t=>t.type==='expense').reduce((a,t)=>a+t.amount,0);
  const allocated=txs.filter(t=>t.type==='savings').reduce((a,t)=>a+t.amount,0);
  const totalSpent=spent+allocated;
  const leftover=totalIncome-totalSpent;
  const today=new Date();today.setHours(0,0,0,0);
  const in7=new Date(today);in7.setDate(in7.getDate()+7);
  const pk=periodKey(yr,mo);
  const dues=bState.dues||[];
  let weekDueAmt=0,weekDueCount=0;
  dues.forEach(d=>{
    const paid=(d.paidMonths||[]).includes(pk);
    if(paid)return;
    const dueDate=new Date(today.getFullYear(),today.getMonth(),d.dueDay);
    if(dueDate<today){const nm=new Date(today.getFullYear(),today.getMonth()+1,d.dueDay);if(nm<=in7){weekDueAmt+=d.amount;weekDueCount++;return;}}
    if(dueDate>=today&&dueDate<=in7){weekDueAmt+=d.amount;weekDueCount++;}
  });
  return{totalIncome,spent,leftover,savingsRate:totalIncome>0?Math.max(0,Math.round((leftover/totalIncome)*100)):0,weekDueAmt,weekDueCount};
}

/* ══════════════════════════════════════════════
   OVERVIEW PAGE
══════════════════════════════════════════════ */
function refreshOverview(){
  const {yr,mo}=getPeriod();
  const {totalIncome,spent,leftover,savingsRate,weekDueAmt}=calcStats(yr,mo);
  const el=n=>document.getElementById(n);
  if(el('ov-spent'))el('ov-spent').textContent=fmtC(spent);
  if(el('ov-spent-sub'))el('ov-spent-sub').textContent='of '+fmtC(totalIncome)+' income';
  if(el('ov-saved')){el('ov-saved').textContent=fmtC(Math.abs(leftover));el('ov-saved').style.color=leftover>=0?'var(--lime)':'var(--red)';}
  if(el('ov-saved-sub'))el('ov-saved-sub').textContent=leftover>=0?'leftover this month':'overspent';
  const pct=totalIncome>0?Math.min(Math.round(spent/totalIncome*100),100):0;
  const clr=pct>90?'var(--red)':pct>70?'var(--amber)':'var(--lime)';
  const bf=el('ov-bbarFill');if(bf){bf.style.width=pct+'%';bf.style.background=clr;}
  const bp=el('ov-bbarPct');if(bp){bp.textContent=pct+'%';bp.style.color=clr;}
  if(el('ov-bbarSpent'))el('ov-bbarSpent').textContent=fmt(spent)+' spent';
  if(el('ov-bbarIncome'))el('ov-bbarIncome').textContent='of '+fmt(totalIncome)+' total income';
  if(el('ov-week-due'))el('ov-week-due').textContent=fmtC(weekDueAmt);
  const gs=hState.globalStreak||0;const bgs=hState.bestGlobalStreak||0;
  if(el('ov-streak'))el('ov-streak').innerHTML=gs+'<span style="font-size:.72rem;font-weight:500;color:var(--t2);margin-left:3px">days</span>';
  if(el('ov-streak-sub'))el('ov-streak-sub').textContent='best: '+bgs+' days';
  const habits=hState.habits||[];const doneToday=hState.doneToday||{};
  const hTotal=habits.length;const hDone=Object.keys(doneToday).length;
  const hPct=hTotal?Math.round(hDone/hTotal*100):0;
  if(el('ov-hrate'))el('ov-hrate').textContent=hPct+'%';
  if(el('ov-hrate-sub'))el('ov-hrate-sub').textContent=hDone+' of '+hTotal+' done';
  buildOverviewHabits();buildOverviewGoals();buildOvTrend();
  buildDonut(yr,mo,'donutChart','donutCenterVal','donutLegend');
  renderRecentTxs('recentList');
  setWelcomeName(hState.userName||bState.userName||'You');
}

function buildOverviewHabits(){
  const list=document.getElementById('ovHabitsList');
  const empty=document.getElementById('ovHabitsEmpty');
  if(!list)return;
  const habits=(hState.habits||[]).slice(0,6);
  if(!habits.length){if(empty)empty.style.display='block';list.innerHTML='';return;}
  if(empty)empty.style.display='none';
  const doneToday=hState.doneToday||{};
  list.innerHTML=habits.map(h=>{
    const done=!!doneToday[h.id];
    return`<div class="habit-row${done?' done':''}" style="cursor:pointer" onclick="toggleHabit('${h.id}')">
      <div class="hav">${h.icon}</div>
      <div class="h-info"><div class="h-name">${h.name}</div><div class="h-sub">${h.time}</div></div>
      <div class="h-streak">${done?'✓':'○'}</div>
    </div>`;
  }).join('');
}

function buildOverviewGoals(){
  const cont=document.getElementById('ovGoalsMini');
  const empty=document.getElementById('ovGoalsEmpty');
  if(!cont)return;
  const goals=bState.savingsGoals||[];
  if(!goals.length){if(empty)empty.style.display='block';cont.innerHTML='';return;}
  if(empty)empty.style.display='none';
  const sym=getCurrency();
  cont.innerHTML=goals.slice(0,4).map(g=>{
    const pct=g.target>0?Math.min(Math.round(g.current/g.target*100),100):0;
    return`<div style="display:flex;flex-direction:column;gap:4px;cursor:pointer" onclick="showPage('budget')">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <span style="font-size:.73rem;font-weight:600;color:var(--t1)">${g.emoji||'💰'} ${g.name}</span>
        <span style="font-family:'Outfit',sans-serif;font-size:.73rem;font-weight:700;color:var(--lime)">${pct}%</span>
      </div>
      <div style="height:4px;background:var(--s3);border-radius:9px;overflow:hidden">
        <div style="height:100%;width:${pct}%;background:var(--lime);border-radius:9px;transition:width .5s"></div>
      </div>
    </div>`;
  }).join('');
}

/* ══════════════════════════════════════════════
   BUDGET PAGE
══════════════════════════════════════════════ */
function refreshBudget(){
  const {yr,mo}=getPeriod();
  const {totalIncome,spent,leftover}=calcStats(yr,mo);
  updateStatCards();updateBudgetBar(totalIncome,spent);
  buildDonut(yr,mo,'donutChart2','donutCenterVal2','donutLegend2');
  buildFlowBars();buildIncomeSources();buildDueList();
  renderRecentTxs('recentList2');refreshSavingsSection();buildGoalList();
  const wn=document.getElementById('wNameBudget');
  if(wn)wn.innerHTML=(hState.userName||bState.userName||'Your')+'<br><span>Budget</span>';
}

function updateStatCards(){
  const {yr,mo}=getPeriod();
  const {totalIncome,spent,leftover,weekDueAmt,weekDueCount}=calcStats(yr,mo);
  const srcCount=(bState.incomeSources||[]).length+getMonthTxs(yr,mo).filter(t=>t.type==='income').length;
  const el=n=>document.getElementById(n);
  if(el('sv-spent'))el('sv-spent').textContent=fmtC(spent);
  if(el('sd-spent'))el('sd-spent').textContent='of '+fmtC(totalIncome)+' income';
  const savedEl=el('sv-saved');if(savedEl){savedEl.textContent=fmtC(Math.abs(leftover));savedEl.style.color=leftover>=0?'var(--lime)':'var(--red)';}
  if(el('sd-saved'))el('sd-saved').textContent=leftover>=0?'leftover this month':'overspent';
  if(el('sv-week'))el('sv-week').textContent=fmtC(weekDueAmt);
  if(el('sd-week'))el('sd-week').textContent=weekDueCount+' bill'+(weekDueCount!==1?'s':'');
  if(el('sv-income'))el('sv-income').textContent=fmtC(totalIncome);
  if(el('sd-income'))el('sd-income').textContent=srcCount+' source'+(srcCount!==1?'s':'');
}

function updateBudgetBar(income,spent){
  const pct=income>0?Math.min(Math.round(spent/income*100),100):0;
  const fill=document.getElementById('bbarFill');const pctEl=document.getElementById('bbarPct');
  const clr=pct>90?'var(--red)':pct>70?'var(--amber)':'var(--lime)';
  if(fill){fill.style.width=pct+'%';fill.style.background=clr;}
  if(pctEl){pctEl.textContent=pct+'%';pctEl.style.color=clr;}
  const bs=document.getElementById('bbarSpentLbl');if(bs)bs.textContent=fmt(spent)+' spent';
  const bi=document.getElementById('bbarIncomeLbl');if(bi)bi.textContent='of '+fmt(income)+' total income';
}

function refreshSavingsSection(){
  const {yr,mo}=getPeriod();
  const {totalIncome,spent,leftover}=calcStats(yr,mo);
  const allocated=getMonthSavingsAllocated(yr,mo);
  const rate=totalIncome>0?Math.round(Math.max(0,leftover)/totalIncome*100):0;
  const leftEl=document.getElementById('svLeftover');
  if(leftEl){leftEl.textContent=fmtC(Math.abs(leftover));leftEl.style.color=leftover>=0?'var(--lime)':'var(--red)';}
  const allocEl=document.getElementById('svAllocated');if(allocEl)allocEl.textContent=allocated>0?fmtC(allocated):'0';
  const scRate=document.getElementById('scRatePill');
  if(scRate){scRate.textContent=rate+'% savings rate';scRate.className='sv-rate-pill'+(rate<10?' low':'');}
}

/* ══════════════════════════════════════════════
   DONUT CHART
══════════════════════════════════════════════ */
const donutInsts={};
function buildDonut(yr,mo,canvasId,centerValId,legendId){
  if(!yr){const p=getPeriod();yr=p.yr;mo=p.mo;}
  const txs=getMonthTxs(yr,mo).filter(t=>t.type==='expense');
  const canvas=document.getElementById(canvasId);if(!canvas)return;
  const bycat={};txs.forEach(t=>{bycat[t.category]=(bycat[t.category]||0)+t.amount;});
  const labels=Object.keys(bycat),data=Object.values(bycat);
  const colors=labels.map(l=>CAT_COLORS[l]||'#888');
  const total=data.reduce((a,b)=>a+b,0);
  const centerVal=document.getElementById(centerValId);if(centerVal)centerVal.textContent=fmtC(total);
  if(donutInsts[canvasId]){donutInsts[canvasId].destroy();donutInsts[canvasId]=null;}
  if(!labels.length){const legend=document.getElementById(legendId);if(legend)legend.innerHTML='<div style="font-size:.7rem;color:var(--t3);text-align:center;padding:10px 0">No expenses yet</div>';return;}
  const ctx=canvas.getContext('2d');
  donutInsts[canvasId]=new Chart(ctx,{type:'doughnut',data:{labels,datasets:[{data,backgroundColor:colors,borderWidth:0,hoverOffset:4}]},options:{responsive:true,maintainAspectRatio:true,cutout:'72%',plugins:{legend:{display:false},tooltip:{backgroundColor:'rgba(27,27,31,.95)',borderColor:'rgba(56,56,63,.8)',borderWidth:1,titleColor:'#9898A5',bodyColor:'#fff',padding:9,cornerRadius:9}}}});
  const legend=document.getElementById(legendId);
  if(legend)legend.innerHTML=labels.slice(0,5).map((l,i)=>`<div class="dl-item"><div class="dl-dot" style="background:${colors[i]}"></div><span class="dl-name">${l}</span><span class="dl-pct">${total>0?Math.round(data[i]/total*100):0}%</span></div>`).join('');
}

/* ══════════════════════════════════════════════
   FLOW BARS
══════════════════════════════════════════════ */
function buildFlowBars(){
  const {yr,mo}=getPeriod();
  const txs=getMonthTxs(yr,mo).filter(t=>t.type==='expense');
  const bycat={};txs.forEach(t=>{bycat[t.category]=(bycat[t.category]||0)+t.amount;});
  const sorted=Object.entries(bycat).sort((a,b)=>b[1]-a[1]);
  const maxAmt=sorted[0]?sorted[0][1]:1;
  const wrap=document.getElementById('flowBars');if(!wrap)return;
  if(!sorted.length){wrap.innerHTML='<div style="font-size:.7rem;color:var(--t3);text-align:center;padding:20px 0">No expenses yet</div>';return;}
  wrap.innerHTML=sorted.slice(0,8).map(([cat,amt])=>{
    const pct=Math.round(amt/maxAmt*100);const clr=CAT_COLORS[cat]||'#888';
    return`<div class="flow-item"><div class="flow-item-top"><span class="flow-cat">${CAT_EMOJIS[cat]||'📦'} ${cat}</span><span class="flow-amt" style="color:${clr}">${fmt(amt)}</span></div><div class="flow-bar-bg"><div class="flow-bar-fill" style="width:${pct}%;background:${clr}"></div></div></div>`;
  }).join('');
}

/* ══════════════════════════════════════════════
   INCOME SOURCES
══════════════════════════════════════════════ */
function buildIncomeSources(){
  const {yr,mo}=getPeriod();
  const total=getTotalIncome(yr,mo);
  const el=document.getElementById('incomeTotalVal');if(el)el.textContent=fmtC(total);
  const list=document.getElementById('srcList');if(!list)return;
  const sources=bState.incomeSources||[];
  const oneTime=getMonthTxs(yr,mo).filter(t=>t.type==='income');
  if(!sources.length&&!oneTime.length){list.innerHTML='<div style="font-size:.7rem;color:var(--t3);text-align:center;padding:14px 0">Add your income sources</div>';return;}
  list.innerHTML=[
    ...sources.map(s=>`<div class="src-row" onclick="openIncomeModal('${s.id}')"><div class="src-icon">${s.emoji||'💼'}</div><div class="src-info"><div class="src-name">${s.name}</div><div class="src-tag">${s.type} · recurring</div></div><span class="src-amt">+${fmt(s.amount)}</span></div>`),
    ...oneTime.map(t=>`<div class="src-row" onclick="openTxModal('${t.id}')"><div class="src-icon">💵</div><div class="src-info"><div class="src-name">${t.name}</div><div class="src-tag">one-time · ${t.date.slice(5).replace('-','/')}</div></div><span class="src-amt">+${fmt(t.amount)}</span></div>`)
  ].join('');
}

/* ══════════════════════════════════════════════
   DUE LIST
══════════════════════════════════════════════ */
function buildDueList(){
  const list=document.getElementById('dueList');if(!list)return;
  const dues=bState.dues||[];
  if(!dues.length){list.innerHTML='<div style="font-size:.7rem;color:var(--t3);text-align:center;padding:14px 0">No fixed dues yet</div>';return;}
  const today=new Date();today.setHours(0,0,0,0);
  const in7=new Date(today);in7.setDate(in7.getDate()+7);
  const {yr,mo}=getPeriod();const pk=periodKey(yr,mo);
  list.innerHTML=dues.map(d=>{
    const paid=(d.paidMonths||[]).includes(pk);
    const dueDate=new Date(today.getFullYear(),today.getMonth(),d.dueDay);
    const overdue=!paid&&dueDate<today;
    const soon=!paid&&!overdue&&dueDate<=in7;
    let cls='due-row';if(paid)cls+=' paid';else if(overdue)cls+=' overdue';else if(soon)cls+=' due-soon';
    const sub=paid?'Paid':overdue?'Overdue':soon?`Due ${dueDate.getDate()} ${MONTHS_SHORT[dueDate.getMonth()]}`:`Day ${d.dueDay}`;
    const subCls=overdue?'due-sub overdue-lbl':soon?'due-sub soon-lbl':'due-sub';
    return`<div class="${cls}" onclick="toggleDuePaid('${d.id}')">
      <div class="due-icon">${d.emoji||'📦'}</div>
      <div class="due-info"><div class="due-name">${d.name}</div><div class="${subCls}">${sub}</div></div>
      <span class="due-amt">${fmt(d.amount)}</span>
      <div class="due-check"><svg viewBox="0 0 9 9" fill="none"><path d="M1.5 4.5l2 2 4-4" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
    </div>`;
  }).join('');
}

async function toggleDuePaid(id){
  const {yr,mo}=getPeriod();const pk=periodKey(yr,mo);
  const d=(bState.dues||[]).find(d=>d.id===id);if(!d)return;
  const paid=!(d.paidMonths||[]).includes(pk);
  try{
    await bApiCall('due/togglePaid',{dueId:id,periodKey:pk,paid},'PATCH');
    refreshAll();
  }catch(e){}
}

/* ══════════════════════════════════════════════
   RECENT TRANSACTIONS
══════════════════════════════════════════════ */
function renderRecentTxs(listId){
  const {yr,mo}=getPeriod();
  const txs=getMonthTxs(yr,mo).slice().sort((a,b)=>b.date.localeCompare(a.date)).slice(0,8);
  const list=document.getElementById(listId);if(!list)return;
  if(!txs.length){list.innerHTML='<div style="font-size:.7rem;color:var(--t3);text-align:center;padding:20px 0">No transactions yet</div>';return;}
  list.innerHTML=txs.map(t=>txRow(t)).join('');
}

function txRow(t){
  const clr=CAT_COLORS[t.category]||'#888';
  const sign=t.type==='income'?'+':'-';
  const amtClass=t.type==='income'?'income':'expense';
  return`<div class="tx-row" onclick="openTxModal('${t.id}')">
    <div class="tx-icon" style="background:${clr}22">${CAT_EMOJIS[t.category]||'📦'}</div>
    <div class="tx-info"><div class="tx-name">${t.name}</div><div class="tx-cat">${t.category}${t.note?' · '+t.note:''}</div></div>
    <span class="tx-date">${t.date.slice(5).replace('-','/')}</span>
    <span class="tx-amt ${amtClass}">${sign}${fmt(t.amount)}</span>
    <button class="tx-edit" onclick="event.stopPropagation();openTxModal('${t.id}')">
      <svg width="10" height="10" viewBox="0 0 11 11" fill="none"><path d="M8 1.5l1.5 1.5-7 7-2 .5.5-2 7-7Z" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </button>
  </div>`;
}

/* ══════════════════════════════════════════════
   SAVINGS GOALS
══════════════════════════════════════════════ */
function buildGoalList(){
  const goals=bState.savingsGoals||[];
  const list=document.getElementById('goalList');if(!list)return;
  const addTile=`<button class="add-goal-tile" onclick="openGoalModal()"><svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M7 1.5v11M1.5 7h11" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>Add a goal</button>`;
  if(!goals.length){list.innerHTML=addTile;return;}
  const sym=getCurrency();
  list.innerHTML=goals.map(g=>{
    const pct=g.target>0?Math.min(Math.round(g.current/g.target*100),100):0;
    const cur=sym+Math.round(g.current).toLocaleString('en-US');
    const remaining=Math.max(0,g.target-g.current);
    const remStr=remaining>0?sym+Math.round(remaining).toLocaleString('en-US')+' to go':'✓ Reached!';
    return`<div class="goal-item" onclick="openGoalModal('${g.id}')">
      <div class="goal-item-top"><span class="goal-emoji">${g.emoji||'💰'}</span><span class="goal-item-name">${g.name}</span><span class="goal-item-pct">${pct}%</span></div>
      <div class="goal-bar-bg"><div class="goal-bar-fill" style="width:${pct}%${pct>=100?';background:var(--grn)':''}"></div></div>
      <div class="goal-item-amounts"><span>${cur} saved</span><span>${remStr}</span></div>
    </div>`;
  }).join('')+addTile;
}

/* ══════════════════════════════════════════════
   LEDGER
══════════════════════════════════════════════ */
let ledgerFilter='all';
function setLedgerFilter(f){
  ledgerFilter=f;
  document.querySelectorAll('.fpill').forEach(p=>p.classList.toggle('active',p.dataset.lf===f));
  renderLedger();
}
function renderLedger(){
  const {yr,mo}=getPeriod();
  const q=(document.getElementById('ledgerSearch').value||'').toLowerCase();
  let txs=getMonthTxs(yr,mo).slice().sort((a,b)=>b.date.localeCompare(a.date));
  if(ledgerFilter==='income')txs=txs.filter(t=>t.type==='income');
  else if(ledgerFilter==='expense')txs=txs.filter(t=>t.type==='expense');
  if(q)txs=txs.filter(t=>t.name.toLowerCase().includes(q)||t.category.toLowerCase().includes(q)||(t.note||'').toLowerCase().includes(q));
  const list=document.getElementById('ledgerList');if(!list)return;
  if(!txs.length){list.innerHTML='<div style="font-size:.7rem;color:var(--t3);text-align:center;padding:30px 0">No transactions found</div>';return;}
  const grouped={};txs.forEach(t=>{if(!grouped[t.date])grouped[t.date]=[];grouped[t.date].push(t);});
  list.innerHTML=Object.entries(grouped).sort((a,b)=>b[0].localeCompare(a[0])).map(([date,rows])=>{
    const sum=rows.reduce((a,t)=>a+(t.type==='income'?t.amount:-t.amount),0);
    const d=new Date(date+'T00:00:00');
    const lbl=d.toLocaleDateString('en-US',{weekday:'short',day:'numeric',month:'short'});
    return`<div class="ledger-group"><div class="ldg-hdr"><span class="ldg-date">${lbl}</span><span class="ldg-sum${sum>=0?' pos':''}">${sum>=0?'+':''}${fmt(sum)}</span></div>${rows.map(t=>txRow(t)).join('')}</div>`;
  }).join('');
}

/* ══════════════════════════════════════════════
   TRANSACTION MODAL
══════════════════════════════════════════════ */
let txEditId=null,txType='expense';
function openTxModal(id){
  txEditId=id||null;const isEdit=!!id;
  document.getElementById('txModalTitle').textContent=isEdit?'Edit Transaction':'Add Transaction';
  document.getElementById('txSaveTxt').textContent=isEdit?'Save':'Add';
  document.getElementById('txDelBtn').style.display=isEdit?'flex':'none';
  if(isEdit){
    const t=(bState.transactions||[]).find(t=>t.id===id);if(!t)return;
    setTxType(t.type);
    document.getElementById('txName').value=t.name;
    document.getElementById('txAmt').value=t.amount;
    document.getElementById('txCat').value=t.category||'Other';
    document.getElementById('txDate').value=t.date;
    document.getElementById('txNote').value=t.note||'';
    if(t.type==='savings'&&t.goalId){populateGoalSelect();document.getElementById('txGoalSel').value=t.goalId;}
  }else{
    setTxType('expense');
    ['txName','txNote'].forEach(i=>document.getElementById(i).value='');
    document.getElementById('txAmt').value='';
    document.getElementById('txCat').value='Food & Dining';
    document.getElementById('txDate').value=todayStr();
  }
  document.getElementById('txOverlay').classList.add('open');
}
function setTxType(type){
  txType=type;
  document.getElementById('typeExpense').className='m-type-btn'+(type==='expense'?' sel-expense':'');
  document.getElementById('typeIncome').className='m-type-btn'+(type==='income'?' sel-income':'');
  document.getElementById('typeSavings').className='m-type-btn'+(type==='savings'?' sel-savings':'');
  const goalRow=document.getElementById('savingsGoalRow');
  const catGroup=document.getElementById('txCatGroup');
  if(type==='savings'){if(goalRow)goalRow.style.display='block';if(catGroup)catGroup.style.display='none';populateGoalSelect();updateSavingsAllocHint();}
  else{if(goalRow)goalRow.style.display='none';if(catGroup)catGroup.style.display='block';}
  const lbl=document.getElementById('txNameLabel');if(lbl)lbl.textContent=type==='savings'?'Label (e.g. SIP, Emergency…)':'Description';
}
function populateGoalSelect(){
  const sel=document.getElementById('txGoalSel');if(!sel)return;
  const goals=bState.savingsGoals||[];
  sel.innerHTML='<option value="">General savings</option>'+goals.map(g=>`<option value="${g.id}">${g.emoji||'💰'} ${g.name} (${getCurrency()}${Math.round(g.current).toLocaleString()}/${getCurrency()}${Math.round(g.target).toLocaleString()})</option>`).join('');
}
function updateSavingsAllocHint(){
  const {yr,mo}=getPeriod();
  const inc=getTotalIncome(yr,mo);
  const exp=getMonthTxs(yr,mo).filter(t=>t.type==='expense').reduce((a,t)=>a+t.amount,0);
  const leftover=inc-exp;
  const hint=document.getElementById('savAllocHint');
  if(hint)hint.textContent=leftover>0?`↑ ${fmtC(leftover)} available to allocate this month`:'';
}
async function submitTx(){
  const name=document.getElementById('txName').value.trim();
  const amt=parseFloat(document.getElementById('txAmt').value);
  const date=document.getElementById('txDate').value;
  const note=document.getElementById('txNote').value.trim();
  if(!name||!amt||amt<=0||!date)return;
  const cat=txType==='savings'?'Savings':document.getElementById('txCat').value;
  const goalId=txType==='savings'?(document.getElementById('txGoalSel').value||null):null;
  const btn=document.getElementById('txOverlay').querySelector('.m-btn.save');
  if(btn){btn.disabled=true;btn.textContent='Saving…';}
  try{
    if(txEditId){
      await bApiCall('transaction',{id:txEditId,type:txType,name,amount:amt,category:cat,date,note,goalId},'PUT');
    }else{
      await bApiCall('transaction',{type:txType,name,amount:amt,category:cat,date,note,goalId},'POST');
    }
    closeModal('txOverlay');refreshAll();
  }catch(e){}finally{if(btn){btn.disabled=false;document.getElementById('txSaveTxt').textContent=txEditId?'Save':'Add';}}
}
async function deleteTx(){
  if(!txEditId)return;
  const btn=document.getElementById('txDelBtn');if(btn)btn.disabled=true;
  try{await bApiCall('transaction',{id:txEditId},'DELETE');closeModal('txOverlay');refreshAll();}
  catch(e){}finally{if(btn)btn.disabled=false;}
}

/* ══════════════════════════════════════════════
   INCOME MODAL
══════════════════════════════════════════════ */
let incEditId=null,incSelEmoji='💼';
function buildIncEmojiGrid(){document.getElementById('incEmojiGrid').innerHTML=INC_EMOJIS.map(e=>`<button class="em-btn${e===incSelEmoji?' sel':''}" onclick="selectIncEmoji('${e}')">${e}</button>`).join('');}
function selectIncEmoji(e){incSelEmoji=e;document.querySelectorAll('#incEmojiGrid .em-btn').forEach(b=>b.classList.toggle('sel',b.textContent===e));}
function openIncomeModal(id){
  incEditId=id||null;const isEdit=!!id;
  document.getElementById('incModalTitle').textContent=isEdit?'Edit Income Source':'Add Income Source';
  document.getElementById('incSaveTxt').textContent=isEdit?'Save':'Add Source';
  document.getElementById('incDelBtn').style.display=isEdit?'flex':'none';
  if(isEdit){const s=(bState.incomeSources||[]).find(s=>s.id===id);if(!s)return;document.getElementById('incName').value=s.name;document.getElementById('incAmt').value=s.amount;document.getElementById('incType').value=s.type;incSelEmoji=s.emoji||'💼';}
  else{document.getElementById('incName').value='';document.getElementById('incAmt').value='';document.getElementById('incType').value='Salary';incSelEmoji='💼';}
  buildIncEmojiGrid();document.getElementById('incOverlay').classList.add('open');
}
async function submitIncome(){
  const name=document.getElementById('incName').value.trim();
  const amt=parseFloat(document.getElementById('incAmt').value);
  const type=document.getElementById('incType').value;
  if(!name||!amt||amt<=0)return;
  const btn=document.getElementById('incOverlay').querySelector('.m-btn.save');
  if(btn){btn.disabled=true;}
  try{
    if(incEditId){await bApiCall('income',{id:incEditId,name,amount:amt,emoji:incSelEmoji,type},'PUT');}
    else{await bApiCall('income',{name,amount:amt,emoji:incSelEmoji,type},'POST');}
    closeModal('incOverlay');refreshAll();
  }catch(e){}finally{if(btn)btn.disabled=false;}
}
async function deleteIncome(){
  if(!incEditId)return;
  const btn=document.getElementById('incDelBtn');if(btn)btn.disabled=true;
  try{await bApiCall('income',{id:incEditId},'DELETE');closeModal('incOverlay');refreshAll();}
  catch(e){}finally{if(btn)btn.disabled=false;}
}

/* ══════════════════════════════════════════════
   DUE MODAL
══════════════════════════════════════════════ */
let dueEditId=null,dueSelEmoji='📦';
function buildDueEmojiGrid(){document.getElementById('dueEmojiGrid').innerHTML=DUE_EMOJIS.map(e=>`<button class="em-btn${e===dueSelEmoji?' sel':''}" onclick="selectDueEmoji('${e}')">${e}</button>`).join('');}
function selectDueEmoji(e){dueSelEmoji=e;document.querySelectorAll('#dueEmojiGrid .em-btn').forEach(b=>b.classList.toggle('sel',b.textContent===e));}
function openDueModal(id){
  dueEditId=id||null;const isEdit=!!id;
  document.getElementById('dueModalTitle').textContent=isEdit?'Edit Due':'Add Fixed Due';
  document.getElementById('dueSaveTxt').textContent=isEdit?'Save':'Add Due';
  document.getElementById('dueDelBtn').style.display=isEdit?'flex':'none';
  if(isEdit){const d=(bState.dues||[]).find(d=>d.id===id);if(!d)return;document.getElementById('dueName').value=d.name;document.getElementById('dueAmt').value=d.amount;document.getElementById('dueDay').value=d.dueDay;document.getElementById('dueCat').value=d.category;dueSelEmoji=d.emoji||'📦';}
  else{document.getElementById('dueName').value='';document.getElementById('dueAmt').value='';document.getElementById('dueDay').value='';document.getElementById('dueCat').value='Subscriptions';dueSelEmoji='📦';}
  buildDueEmojiGrid();document.getElementById('dueOverlay').classList.add('open');
}
async function submitDue(){
  const name=document.getElementById('dueName').value.trim();
  const amt=parseFloat(document.getElementById('dueAmt').value);
  const day=parseInt(document.getElementById('dueDay').value);
  const cat=document.getElementById('dueCat').value;
  if(!name||!amt||amt<=0||!day||day<1||day>31)return;
  const btn=document.getElementById('dueOverlay').querySelector('.m-btn.save');
  if(btn)btn.disabled=true;
  try{
    if(dueEditId){await bApiCall('due',{id:dueEditId,name,amount:amt,dueDay:day,category:cat,emoji:dueSelEmoji},'PUT');}
    else{await bApiCall('due',{name,amount:amt,dueDay:day,category:cat,emoji:dueSelEmoji},'POST');}
    closeModal('dueOverlay');refreshAll();
  }catch(e){}finally{if(btn)btn.disabled=false;}
}
async function deleteDue(){
  if(!dueEditId)return;
  const btn=document.getElementById('dueDelBtn');if(btn)btn.disabled=true;
  try{await bApiCall('due',{id:dueEditId},'DELETE');closeModal('dueOverlay');refreshAll();}
  catch(e){}finally{if(btn)btn.disabled=false;}
}

/* ══════════════════════════════════════════════
   GOAL MODAL
══════════════════════════════════════════════ */
let goalEditId=null,goalSelEmoji='💰';
function buildGoalEmojiGrid(){document.getElementById('goalEmojiGrid').innerHTML=GOAL_EMOJIS.map(e=>`<button class="em-btn${e===goalSelEmoji?' sel':''}" onclick="selectGoalEmoji('${e}')">${e}</button>`).join('');}
function selectGoalEmoji(e){goalSelEmoji=e;document.querySelectorAll('#goalEmojiGrid .em-btn').forEach(b=>b.classList.toggle('sel',b.textContent===e));}
function openGoalModal(id){
  goalEditId=id||null;const isEdit=!!id;
  document.getElementById('goalModalTitle').textContent=isEdit?'Edit Goal':'Add Savings Goal';
  document.getElementById('goalSaveTxt').textContent=isEdit?'Save':'Add Goal';
  document.getElementById('goalDelBtn').style.display=isEdit?'flex':'none';
  if(isEdit){const g=(bState.savingsGoals||[]).find(g=>g.id===id);if(!g)return;document.getElementById('goalName').value=g.name;document.getElementById('goalTarget').value=g.target;document.getElementById('goalCurrent').value=g.current;goalSelEmoji=g.emoji||'💰';}
  else{document.getElementById('goalName').value='';document.getElementById('goalTarget').value='';document.getElementById('goalCurrent').value='';goalSelEmoji='💰';}
  buildGoalEmojiGrid();document.getElementById('goalOverlay').classList.add('open');
}
async function submitGoal(){
  const name=document.getElementById('goalName').value.trim();
  const target=parseFloat(document.getElementById('goalTarget').value);
  const current=parseFloat(document.getElementById('goalCurrent').value)||0;
  if(!name||!target||target<=0)return;
  const btn=document.getElementById('goalOverlay').querySelector('.m-btn.save');
  if(btn)btn.disabled=true;
  try{
    if(goalEditId){await bApiCall('goal',{id:goalEditId,name,target,current,emoji:goalSelEmoji},'PUT');}
    else{await bApiCall('goal',{name,target,current,emoji:goalSelEmoji},'POST');}
    closeModal('goalOverlay');refreshAll();
  }catch(e){}finally{if(btn)btn.disabled=false;}
}
async function deleteGoal(){
  if(!goalEditId)return;
  const btn=document.getElementById('goalDelBtn');if(btn)btn.disabled=true;
  try{await bApiCall('goal',{id:goalEditId},'DELETE');closeModal('goalOverlay');refreshAll();}
  catch(e){}finally{if(btn)btn.disabled=false;}
}

/* ══════════════════════════════════════════════
   CURRENCY
══════════════════════════════════════════════ */
async function onCurrencyChange(){
  const currency=document.getElementById('navCurrency').value;
  try{await bApiCall('settings',{currency},'PATCH');refreshAll();}catch(e){}
}

/* ══════════════════════════════════════════════
   EXPORT
══════════════════════════════════════════════ */
function exportCSV(){
  const {yr,mo}=getPeriod();const txs=getMonthTxs(yr,mo);
  const rows=[['Date','Type','Description','Category','Amount','Note']];
  txs.forEach(t=>rows.push([t.date,t.type,t.name,t.category||'',t.amount.toFixed(2),t.note||'']));
  const csv=rows.map(r=>r.map(c=>'"'+String(c).replace(/"/g,'""')+'"').join(',')).join('\n');
  const a=document.createElement('a');a.href='data:text/csv;charset=utf-8,'+encodeURIComponent(csv);
  a.download=`lifeflow-${MONTHS_SHORT[mo]}-${yr}.csv`;a.click();
}
function exportHabitData(){
  const rows=[['Habit','Streak','Best Streak','Time']];(hState.habits||[]).forEach(h=>rows.push([h.name,h.streak||0,h.bestStreak||0,h.time]));
  const csv=rows.map(r=>r.map(c=>'"'+String(c).replace(/"/g,'""')+'"').join(',')).join('\n');
  const a=document.createElement('a');a.href='data:text/csv;charset=utf-8,'+encodeURIComponent(csv);a.download='lifeflow-habits.csv';a.click();
}

/* ══════════════════════════════════════════════
   HABITS PAGE
══════════════════════════════════════════════ */
let activeFilter='all';

function renderHabits(){
  const list=document.getElementById('habitsList');if(!list)return;
  const q=(document.getElementById('searchInp').value||'').toLowerCase();
  const {yr,mo}=getPeriod();
  const today=todayStr();
  const isToday=isCurrentMonth(yr,mo)&&new Date(yr,mo,new Date().getDate()).toISOString().slice(0,10)===today;
  let habits=(hState.habits||[]).filter(h=>{
    if(activeFilter!=='all'&&h.time.toLowerCase()!==activeFilter)return false;
    if(q&&!h.name.toLowerCase().includes(q))return false;
    return true;
  });
  if(!habits.length){list.innerHTML='<div style="font-size:.7rem;color:var(--t3);text-align:center;padding:20px 0">No habits yet. Add one with +</div>';return;}
  const doneToday=hState.doneToday||{};
  list.innerHTML=habits.map(h=>{
    const done=!!doneToday[h.id];
    return`<div class="habit-row${done?' done':''}" data-id="${h.id}" draggable="true" onclick="toggleHabit('${h.id}')">
      <div class="drag-handle" onclick="event.stopPropagation()">⠿</div>
      <div class="hav">${h.icon}</div>
      <div class="h-info"><div class="h-name">${h.name}</div><div class="h-sub">${h.time} · ${h.streak||0} day streak</div></div>
      <div class="h-actions">
        <button class="h-edit" title="Edit" onclick="event.stopPropagation();openHabitModal('${h.id}')"><svg width="10" height="10" viewBox="0 0 11 11" fill="none"><path d="M7.5 1.5l2 2-6 6H1.5v-2l6-6Z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/></svg></button>
        <div class="h-check"><svg viewBox="0 0 9 9" fill="none"><path d="M1.5 4.5l2 2 4-4" stroke="#111" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
      </div>
    </div>`;
  }).join('');
  // Drag & drop
  setupDragDrop();
}

function renderHabitsForPeriod(yr,mo){
  // Used for non-current-month view — shows completion % per habit for that period
  const list=document.getElementById('habitsList');if(!list)return;
  if(isCurrentMonth(yr,mo)){renderHabits();return;}
  const habits=hState.habits||[];
  if(!habits.length){list.innerHTML='<div style="font-size:.7rem;color:var(--t3);text-align:center;padding:20px 0">No habits yet.</div>';return;}
  const history=hState.history||{};
  const daysInMonth=new Date(yr,mo+1,0).getDate();
  list.innerHTML=habits.map(h=>{
    let done=0,total=0;
    for(let d=1;d<=daysInMonth;d++){
      const ds=`${yr}-${String(mo+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      const future=new Date(yr,mo,d)>new Date();if(future)break;
      total++;
      const dayData=history[ds];
      if(dayData&&dayData.done>0)done++;
    }
    const rate=total>0?Math.round(done/total*100):0;
    return`<div class="habit-row" data-id="${h.id}">
      <div class="hav">${h.icon}</div>
      <div class="h-info"><div class="h-name">${h.name}</div><div class="h-sub">${h.time} · ${MONTHS_SHORT[mo]} ${yr}</div></div>
      <div class="h-streak" style="color:${rate>=70?'var(--lime)':rate>=40?'var(--t2)':'var(--red)'}">${rate}%</div>
      <button class="h-edit" title="Edit" onclick="openHabitModal('${h.id}');event.stopPropagation()"><svg width="10" height="10" viewBox="0 0 11 11" fill="none"><path d="M7.5 1.5l2 2-6 6H1.5v-2l6-6Z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/></svg></button>
    </div>`;
  }).join('');
}

function setupDragDrop(){
  const rows=document.querySelectorAll('.habit-row[draggable]');
  let dragId=null;
  rows.forEach(row=>{
    row.addEventListener('dragstart',e=>{dragId=row.dataset.id;row.style.opacity='.4';});
    row.addEventListener('dragend',e=>{row.style.opacity='1';});
    row.addEventListener('dragover',e=>{e.preventDefault();row.classList.add('drag-over');});
    row.addEventListener('dragleave',()=>row.classList.remove('drag-over'));
    row.addEventListener('drop',e=>{e.preventDefault();row.classList.remove('drag-over');if(dragId&&dragId!==row.dataset.id)reorderHabit(dragId,row.dataset.id);});
  });
}

async function toggleHabit(id){
  const doneToday=hState.doneToday||{};
  const done=!doneToday[id];
  // Optimistic update
  if(done){hState.doneToday={...doneToday,[id]:true};}
  else{const nd={...doneToday};delete nd[id];hState.doneToday=nd;}
  renderHabits();updateHabitStats();if(currentPage==='overview')refreshOverview();
  try{
    await hApiCall('toggleHabit',{id,done},'PATCH');
    renderHabits();updateHabitStats();if(currentPage==='overview')refreshOverview();
    if(barChart)refreshCurrentBar();if(lineChart)updateLineChartToday();
  }catch(e){
    // Revert optimistic update
    if(done){const nd={...hState.doneToday};delete nd[id];hState.doneToday=nd;}
    else{hState.doneToday={...hState.doneToday,[id]:true};}
    renderHabits();updateHabitStats();
  }
}

async function reorderHabit(fromId,toId){
  const habits=hState.habits||[];
  const from=habits.findIndex(h=>h.id===fromId);const to=habits.findIndex(h=>h.id===toId);
  if(from<0||to<0)return;
  // Optimistic
  const newHabits=[...habits];const [item]=newHabits.splice(from,1);newHabits.splice(to,0,item);
  hState.habits=newHabits;renderHabits();
  try{await hApiCall('reorderHabit',{habitIds:newHabits.map(h=>h.id)},'PATCH');}
  catch(e){hState.habits=habits;renderHabits();}
}

/* ══════════════════════════════════════════════
   HABIT FILTER TABS
══════════════════════════════════════════════ */
function initFilterTabs(){
  document.querySelectorAll('.ftab').forEach(btn=>{
    btn.addEventListener('click',()=>{
      activeFilter=btn.dataset.filter;
      document.querySelectorAll('.ftab').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');renderHabits();
    });
  });
}

/* ══════════════════════════════════════════════
   HABIT MODAL
══════════════════════════════════════════════ */
let hEditId=null,hSelEmoji='🧘';
function buildHabitEmojiGrid(){document.getElementById('emojiGrid').innerHTML=HABIT_EMOJIS.map(e=>`<button class="em-btn${e===hSelEmoji?' sel':''}" onclick="selectHabitEmoji('${e}')">${e}</button>`).join('');}
function selectHabitEmoji(e){hSelEmoji=e;document.querySelectorAll('#emojiGrid .em-btn').forEach(b=>b.classList.toggle('sel',b.textContent===e));}
function openHabitModal(id){
  hEditId=id||null;const isEdit=!!id;
  document.getElementById('habitModalTitle').textContent=isEdit?'Edit Habit':'New Habit';
  document.getElementById('mSaveTxt').textContent=isEdit?'Save':'Add Habit';
  document.getElementById('mDelBtn').style.display=isEdit?'flex':'none';
  if(isEdit){const h=(hState.habits||[]).find(h=>h.id===id);if(!h)return;document.getElementById('mName').value=h.name;document.getElementById('mTime').value=h.time;hSelEmoji=h.icon||'🧘';}
  else{document.getElementById('mName').value='';document.getElementById('mTime').value='Morning';hSelEmoji='🧘';}
  buildHabitEmojiGrid();document.getElementById('habitOverlay').classList.add('open');
}
async function submitHabitModal(){
  const name=document.getElementById('mName').value.trim();const time=document.getElementById('mTime').value;
  if(!name)return;
  const btn=document.getElementById('habitOverlay').querySelector('.m-btn.save');
  if(btn)btn.disabled=true;
  try{
    if(hEditId){await hApiCall('updateHabit',{id:hEditId,name,icon:hSelEmoji,time},'PUT');}
    else{await hApiCall('createHabit',{name,icon:hSelEmoji,time},'POST');}
    closeModal('habitOverlay');renderHabits();updateHabitStats();
    if(currentPage==='overview')refreshOverview();
  }catch(e){}finally{if(btn)btn.disabled=false;}
}
function confirmDeleteHabit(){closeModal('habitOverlay');document.getElementById('habitConfirmOverlay').classList.add('open');}
async function doDeleteHabit(){
  if(!hEditId)return;
  const btn=document.querySelector('#habitConfirmOverlay .m-btn.del');if(btn)btn.disabled=true;
  try{
    await hApiCall('deleteHabit',{id:hEditId},'DELETE');
    closeModal('habitConfirmOverlay');renderHabits();updateHabitStats();
    if(currentPage==='overview')refreshOverview();
  }catch(e){}finally{if(btn)btn.disabled=false;}
}
function overlayCloseHabit(e){if(e.target.id==='habitOverlay')closeModal('habitOverlay');}

/* ══════════════════════════════════════════════
   HABIT STATS
══════════════════════════════════════════════ */
function isCurrentMonth(yr,mo){const now=new Date();return yr===now.getFullYear()&&mo===now.getMonth();}
function updateHabitStats(){
  const {yr,mo}=getPeriod();
  const now=new Date();const viewingCurrent=isCurrentMonth(yr,mo);
  const daysInMonth=new Date(yr,mo+1,0).getDate();
  const history=hState.history||{};
  const doneToday=hState.doneToday||{};
  const habits=hState.habits||[];
  let monthDone=0,monthDays=0,dayPcts=[];
  for(let d=1;d<=daysInMonth;d++){
    const ds=`${yr}-${String(mo+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const dateObj=new Date(yr,mo,d);if(dateObj>now)break;
    if(ds===todayStr()){const td=Object.keys(doneToday).length,tot=habits.length;if(tot>0){monthDone+=td;dayPcts.push(Math.round(td/tot*100));monthDays++;}}
    else if(history[ds]){const h=history[ds];monthDone+=h.done||0;dayPcts.push(h.pct||0);monthDays++;}
  }
  const monthAvgPct=dayPcts.length?Math.round(dayPcts.reduce((a,b)=>a+b,0)/dayPcts.length):0;
  const el=n=>document.getElementById(n);
  if(viewingCurrent){
    if(el('sv1'))el('sv1').textContent=(hState.totalAllTime||0).toLocaleString();
    if(el('sd1'))el('sd1').innerHTML='<span class="delta-pos">all time</span>';
    if(el('sv2'))el('sv2').innerHTML=(hState.globalStreak||0)+'<span style="font-size:.75rem;font-weight:500;color:var(--t2);margin-left:4px">days</span>';
    if(el('sd2'))el('sd2').innerHTML='Best: <span id="bestStreakVal">'+(hState.bestGlobalStreak||0)+'</span> days';
    const total=habits.length,done=Object.keys(doneToday).length;
    const pct=total?Math.round(done/total*100):0;
    if(el('sv3'))el('sv3').textContent=pct+'%';
    if(el('sd3'))el('sd3').textContent=done+' of '+total+' done';
    const labelEl=document.querySelector('.scard.lime .scard-label');if(labelEl)labelEl.textContent="Today's Rate";
  }else{
    if(el('sv1'))el('sv1').textContent=monthDone.toLocaleString();
    if(el('sd1'))el('sd1').innerHTML='<span class="delta-pos">'+MONTHS_SHORT[mo]+' '+yr+'</span>';
    let maxStreak=0,curStreak=0;
    for(let d=1;d<=daysInMonth;d++){const ds=`${yr}-${String(mo+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;const h=history[ds];if(h&&h.pct>0){curStreak++;maxStreak=Math.max(maxStreak,curStreak);}else curStreak=0;}
    if(el('sv2'))el('sv2').innerHTML=maxStreak+'<span style="font-size:.75rem;font-weight:500;color:var(--t2);margin-left:4px">days</span>';
    if(el('sd2'))el('sd2').innerHTML='Best streak in '+MONTHS_SHORT[mo];
    if(el('sv3'))el('sv3').textContent=monthAvgPct+'%';
    if(el('sd3'))el('sd3').textContent=monthDays+' active day'+(monthDays!==1?'s':'')+' tracked';
    const labelEl=document.querySelector('.scard.lime .scard-label');if(labelEl)labelEl.textContent='Avg Rate';
  }
  const panelTitle=document.getElementById('habitsPanelTitle');
  if(panelTitle){
    const svg='<svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M3 4h8M3 7h6M3 10h4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" opacity=".6"/></svg>';
    panelTitle.innerHTML=svg+(viewingCurrent?" Today's Habits":` ${MONTHS_SHORT[mo]} ${yr} Habits`);
  }
  renderHabitsForPeriod(yr,mo);
}

/* ══════════════════════════════════════════════
   HABIT CHARTS
══════════════════════════════════════════════ */
let barChart=null,hatchPat=null,selBar=4,activePeriod='annually';
function makeHatch(ctx){const c=document.createElement('canvas');c.width=8;c.height=8;const p=c.getContext('2d');p.fillStyle='rgba(123,110,245,.15)';p.fillRect(0,0,8,8);p.strokeStyle='rgba(123,110,245,.65)';p.lineWidth=1.4;p.beginPath();p.moveTo(0,8);p.lineTo(8,0);p.stroke();p.beginPath();p.moveTo(-4,8);p.lineTo(8,-4);p.stroke();p.beginPath();p.moveTo(0,16);p.lineTo(16,0);p.stroke();return ctx.createPattern(c,'repeat');}

function getBarData(){
  const history=hState.history||{};
  const now=new Date();
  if(activePeriod==='annually'){
    const labels=[],data=[];
    for(let i=11;i>=0;i--){const d=new Date(now.getFullYear(),now.getMonth()-i,1);const yr=d.getFullYear(),mo=d.getMonth();const daysInM=new Date(yr,mo+1,0).getDate();let total=0,cnt=0;for(let day=1;day<=daysInM;day++){const ds=`${yr}-${String(mo+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;if(new Date(yr,mo,day)>now)break;const h=history[ds];if(h){total+=h.pct||0;cnt++;}}labels.push(MONTHS_SHORT[mo]);data.push(cnt>0?Math.round(total/cnt):0);}
    return{labels,data};
  }else{
    const {yr,mo}=getPeriod();const daysInM=new Date(yr,mo+1,0).getDate();const labels=[],data=[];
    for(let d=1;d<=daysInM;d++){const ds=`${yr}-${String(mo+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;if(new Date(yr,mo,d)>now)break;labels.push(d%5===1?String(d):'');const h=history[ds];data.push(h?h.pct||0:0);}
    return{labels,data};
  }
}

function initBarChart(){
  const wrap=document.getElementById('habitChartWrap');const canvas=document.getElementById('barChart');if(!wrap||!canvas)return;
  canvas.width=wrap.offsetWidth;canvas.height=wrap.offsetHeight;
  const ctx=canvas.getContext('2d');hatchPat=makeHatch(ctx);
  const {labels,data}=getBarData();
  barChart=new Chart(ctx,{type:'bar',data:{labels,datasets:[{data,backgroundColor:data.map((_,i)=>i===selBar?'#7B6EF5':hatchPat),borderRadius:4,borderSkipped:false}]},options:{responsive:false,animation:{duration:400},scales:{x:{grid:{display:false},border:{display:false},ticks:{color:'#55555F',font:{size:9},maxRotation:0}},y:{grid:{color:'rgba(56,56,63,.4)',drawBorder:false},border:{display:false},ticks:{color:'#55555F',font:{size:9},maxTicksLimit:4,callback:v=>v+'%'},min:0,max:100}},plugins:{legend:{display:false},tooltip:{enabled:false}}}});
  canvas.addEventListener('click',e=>{const pts=barChart.getElementsAtEventForMode(e,'nearest',{intersect:true},false);if(pts.length){selBar=pts[0].index;refreshBarColors();showBarTip(selBar);}});
  showBarTip(selBar);
}
function refreshBarColors(){if(!barChart||!hatchPat)return;const {data}=getBarData();barChart.data.datasets[0].backgroundColor=data.map((_,i)=>i===selBar?'#7B6EF5':hatchPat);barChart.update('none');}
function refreshCurrentBar(){if(!barChart)return;const {labels,data}=getBarData();barChart.data.labels=labels;barChart.data.datasets[0].data=data;barChart.data.datasets[0].backgroundColor=data.map((_,i)=>i===selBar?'#7B6EF5':hatchPat);barChart.update('none');showBarTip(selBar);}
function showBarTip(idx){
  const {labels,data}=getBarData();const tip=document.getElementById('chartTip');if(!tip||!barChart)return;
  const val=data[idx]||0;const prev=idx>0?data[idx-1]:null;
  const diff=prev!==null?val-prev:null;
  tip.style.display='block';
  document.getElementById('tipLabel').textContent=labels[idx]||'';
  document.getElementById('tipVal').textContent=val+'%';
  const badge=document.getElementById('tipBadge');if(badge){badge.textContent=diff!==null?(diff>=0?'+':'')+diff+'%':'';badge.style.background=diff>=0?'var(--lime)':'var(--red)';}
  const meta=barChart.getDatasetMeta(0);if(meta.data[idx]){const bar=meta.data[idx];const bRect=barChart.canvas.getBoundingClientRect();const wRect=document.getElementById('habitChartWrap').getBoundingClientRect();tip.style.left=(bar.x-wRect.left+bRect.left-tip.offsetWidth/2)+'px';tip.style.top=(bar.y-wRect.top+bRect.top-tip.offsetHeight-8)+'px';}
}
function setPeriod(p){
  activePeriod=p;selBar=p==='annually'?4:new Date().getDate()-1;
  document.querySelectorAll('.tgl[data-period]').forEach(t=>t.classList.toggle('active',t.dataset.period===p));
  if(barChart){const {labels,data}=getBarData();barChart.data.labels=labels;barChart.data.datasets[0].data=data;barChart.data.datasets[0].backgroundColor=data.map((_,i)=>i===selBar?'#7B6EF5':hatchPat);barChart.update('none');}
  showBarTip(selBar);const {yr,mo}=getPeriod();buildHeatmapForPeriod(yr,mo);
}

/* ══════════════════════════════════════════════
   HEATMAP  (uses history[dateStr].pct)
══════════════════════════════════════════════ */
function hmColor(pct){
  if(pct===0)return'#2A2A32';if(pct<25)return'#2D4A1A';if(pct<50)return'#3A5E1E';if(pct<75)return'#5A8E2E';if(pct<90)return'#90C840';return'#C8FF4D';
}
function buildHeatmapForPeriod(yr,mo){
  const history=hState.history||{};
  const labX=document.getElementById('hmLabX');const body=document.getElementById('hmBody');if(!labX||!body)return;
  const firstDay=new Date(yr,mo,1).getDay();const adj=(firstDay+6)%7;
  const daysInMonth=new Date(yr,mo+1,0).getDate();
  const weeks=Math.ceil((adj+daysInMonth)/7);
  labX.style.gridTemplateColumns=`26px repeat(${weeks},1fr)`;
  labX.innerHTML='<span></span>'+Array.from({length:weeks},(_,w)=>`<span>W${w+1}</span>`).join('');
  body.innerHTML=DAYS_SHORT.map((_,di)=>{
    let cells='<div class="hm-row-label">'+DAYS_SHORT[di]+'</div>';
    for(let w=0;w<weeks;w++){
      const dayNum=w*7+di-adj+1;
      if(dayNum<1||dayNum>daysInMonth){cells+='<div></div>';continue;}
      const ds=`${yr}-${String(mo+1).padStart(2,'0')}-${String(dayNum).padStart(2,'0')}`;
      const h=history[ds];const pct=h?h.pct||0:0;
      const future=new Date(yr,mo,dayNum)>new Date();
      cells+=`<div class="hm-cell" style="background:${future?'transparent':hmColor(pct)};${future?'border:1px dashed rgba(56,56,63,.4)':''}" title="${ds}: ${pct}%"></div>`;
    }
    return`<div class="hm-row" style="grid-template-columns:26px repeat(${weeks},1fr)">${cells}</div>`;
  }).join('');
}

/* ══════════════════════════════════════════════
   LINE CHART
══════════════════════════════════════════════ */
let lineChart=null,lineView='month';
function getLineData(){
  const history=hState.history||{};const {yr,mo}=getPeriod();const now=new Date();
  const labels=[],data=[],pointColors=[];
  if(lineView==='month'){
    const daysInMonth=new Date(yr,mo+1,0).getDate();
    for(let d=1;d<=daysInMonth;d++){
      const ds=`${yr}-${String(mo+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      if(new Date(yr,mo,d)>now){labels.push(String(d));data.push(null);pointColors.push('transparent');continue;}
      labels.push(d%5===1?String(d):'');
      const h=history[ds];const pct=h?h.pct||0:0;
      data.push(pct);pointColors.push(pct>=100?'#C8FF4D':pct>0?'#7B6EF5':'transparent');
    }
  }else{
    for(let i=11;i>=0;i--){const d=new Date(now.getFullYear(),now.getMonth()-i,1);const yr2=d.getFullYear(),mo2=d.getMonth();const daysInM=new Date(yr2,mo2+1,0).getDate();let total=0,cnt=0;for(let day=1;day<=daysInM;day++){const ds=`${yr2}-${String(mo2+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;if(new Date(yr2,mo2,day)>now)break;const h=history[ds];if(h){total+=h.pct||0;cnt++;}}const avg=cnt>0?Math.round(total/cnt):0;labels.push(MONTHS_SHORT[mo2]);data.push(avg);pointColors.push(avg>=100?'#C8FF4D':avg>0?'#7B6EF5':'transparent');}
  }
  return{labels,data,pointColors};
}
function initLineChart(){
  const wrap=document.querySelector('.line-wrap');const canvas=document.getElementById('lineChart');if(!wrap||!canvas)return;
  const ctx=canvas.getContext('2d');
  const grad=ctx.createLinearGradient(0,0,0,200);grad.addColorStop(0,'rgba(123,110,245,.2)');grad.addColorStop(1,'rgba(123,110,245,.01)');
  const {labels,data,pointColors}=getLineData();
  lineChart=new Chart(ctx,{type:'line',data:{labels,datasets:[{data,borderColor:'#7B6EF5',borderWidth:2,pointRadius:3,pointHoverRadius:5,pointBackgroundColor:pointColors,tension:.4,fill:true,backgroundColor:grad,spanGaps:false}]},options:{responsive:true,maintainAspectRatio:false,animation:{duration:400},scales:{x:{grid:{display:false},border:{display:false},ticks:{color:'#55555F',font:{size:9},maxRotation:0}},y:{grid:{color:'rgba(56,56,63,.4)',drawBorder:false},border:{display:false},ticks:{color:'#55555F',font:{size:9},maxTicksLimit:4,callback:v=>v+'%'},min:0,max:100}},plugins:{legend:{display:false},tooltip:{backgroundColor:'rgba(27,27,31,.95)',borderColor:'rgba(56,56,63,.8)',borderWidth:1,titleColor:'#9898A5',bodyColor:'#fff',padding:9,cornerRadius:9,callbacks:{label:c=>` ${c.parsed.y??0}% completion`}}}}});
}
function updateLineChartToday(){if(!lineChart)return;const {labels,data,pointColors}=getLineData();lineChart.data.labels=labels;lineChart.data.datasets[0].data=data;lineChart.data.datasets[0].pointBackgroundColor=pointColors;lineChart.update('none');}
function setLineView(v){lineView=v;document.querySelectorAll('.tgl[data-lv]').forEach(t=>t.classList.toggle('active',t.dataset.lv===v));updateLineChartToday();}

/* ══════════════════════════════════════════════
   OVERVIEW HABIT TREND CHART (uses history[dateStr].pct)
══════════════════════════════════════════════ */
let ovTrendMode='month',ovTrendInst=null;
function switchTrend(mode){
  ovTrendMode=mode;
  document.querySelectorAll('.ov-ttgl').forEach(b=>b.classList.toggle('active',b.dataset.trend===mode));
  buildOvTrend();
}
function buildOvTrend(){
  const canvas=document.getElementById('ovTrendCanvas');const empty=document.getElementById('ovTrendEmpty');if(!canvas)return;
  if(ovTrendInst){ovTrendInst.destroy();ovTrendInst=null;}
  const habits=hState.habits||[];const history=hState.history||{};
  if(!habits.length){canvas.style.display='none';if(empty)empty.style.display='block';return;}
  canvas.style.display='block';if(empty)empty.style.display='none';
  const labels=[],data=[];const today=new Date();
  if(ovTrendMode==='month'){
    const {yr,mo}=getPeriod();const daysInMonth=new Date(yr,mo+1,0).getDate();
    for(let d=1;d<=daysInMonth;d++){const ds=`${yr}-${String(mo+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;labels.push(d%5===1||d===1?String(d):'');const h=history[ds];data.push(h?h.pct||0:0);}
  }else{
    for(let i=11;i>=0;i--){const d=new Date(today.getFullYear(),today.getMonth()-i,1);const yr=d.getFullYear(),mo=d.getMonth();const daysInM=new Date(yr,mo+1,0).getDate();let total=0,cnt=0;for(let day=1;day<=daysInM;day++){const ds=`${yr}-${String(mo+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;if(new Date(yr,mo,day)>today)break;const h=history[ds];if(h){total+=h.pct||0;cnt++;}}labels.push(MONTHS_SHORT[mo]);data.push(cnt>0?Math.round(total/cnt):0);}
  }
  const ctx=canvas.getContext('2d');const grad=ctx.createLinearGradient(0,0,0,100);grad.addColorStop(0,'rgba(200,255,77,.22)');grad.addColorStop(1,'rgba(200,255,77,.01)');
  ovTrendInst=new Chart(ctx,{type:'line',data:{labels,datasets:[{data,borderColor:'#C8FF4D',borderWidth:2,pointRadius:0,pointHoverRadius:4,pointHoverBackgroundColor:'#C8FF4D',tension:.4,fill:true,backgroundColor:grad}]},options:{responsive:true,maintainAspectRatio:false,animation:{duration:500},scales:{x:{grid:{display:false},border:{display:false},ticks:{color:'#55555F',font:{size:9},maxRotation:0}},y:{grid:{color:'rgba(56,56,63,.4)',drawBorder:false},border:{display:false},ticks:{color:'#55555F',font:{size:9},maxTicksLimit:4,callback:v=>v+'%'},min:0,max:100}},plugins:{legend:{display:false},tooltip:{backgroundColor:'rgba(27,27,31,.95)',borderColor:'rgba(56,56,63,.8)',borderWidth:1,titleColor:'#9898A5',bodyColor:'#fff',padding:9,cornerRadius:9,callbacks:{label:c=>` ${c.parsed.y}% completion`}}}}});
}

/* ══════════════════════════════════════════════
   MODAL UTILS
══════════════════════════════════════════════ */
function closeModal(id){document.getElementById(id).classList.remove('open');}
function overlayClose(e,id){if(e.target.id===id)closeModal(id);}

/* ══════════════════════════════════════════════
   REFRESH ALL
══════════════════════════════════════════════ */
function refreshAll(){
  if(currentPage==='overview')refreshOverview();
  else if(currentPage==='budget')refreshBudget();
  else if(currentPage==='habits'){renderHabits();updateHabitStats();}
  else if(currentPage==='ledger')renderLedger();
  if(barChart)refreshCurrentBar();
  if(lineChart)updateLineChartToday();
}

/* ══════════════════════════════════════════════
   WELCOME NAME
══════════════════════════════════════════════ */
function setWelcomeName(name){
  const firstName=name?name.split(' ')[0]:'You';
  const wn=document.getElementById('welcomeName');if(wn)wn.textContent=firstName;
  const wh=document.getElementById('wNameHabits');if(wh)wh.innerHTML=firstName+'<br><span>Habits</span>';
  const wb=document.getElementById('wNameBudget');if(wb)wb.innerHTML=firstName+'<br><span>Budget</span>';
}

/* ══════════════════════════════════════════════
   ONBOARDING  (show if no income sources yet)
══════════════════════════════════════════════ */
function checkOnboarding(){
  const hasIncome=(bState.incomeSources||[]).length>0;
  const hasTxs=(bState.transactions||[]).length>0;
  if(!hasIncome&&!hasTxs&&!bState.tutorialSeen){
    // Pre-fill name from DB
    const nameInput=document.getElementById('obName');
    if(nameInput&&(hState.userName||bState.userName))nameInput.value=hState.userName||bState.userName||'';
    document.getElementById('onboardOverlay').classList.add('open');
    setTimeout(()=>{const n=document.getElementById('obName');if(n&&!n.value)n.focus();},80);
  }
}
async function submitOnboard(){
  const name=document.getElementById('obName').value.trim();
  if(!name){const err=document.getElementById('obErr');if(err)err.style.display='block';return;}
  const incomeAmt=parseFloat(document.getElementById('obIncome').value)||0;
  document.getElementById('onboardOverlay').classList.remove('open');
  if(incomeAmt>0){
    try{await bApiCall('income',{name:'Primary Income',amount:incomeAmt,emoji:'💼',type:'Salary'},'POST');}catch(e){}
  }
  refreshAll();
  checkTutorial();
}

/* ══════════════════════════════════════════════
   TUTORIAL
══════════════════════════════════════════════ */
const TUT_KEY='lifeflow_tut_v1';
const tutSteps=[
  {target:null,icon:'👋',title:'Welcome to LifeFlow',body:'Your all-in-one dashboard for budget, habits, and savings. Let\'s take a quick tour.'},
  {target:'#tab-overview',icon:'📊',title:'Overview',body:'The <strong>Overview</strong> tab shows your combined financial and habit summary at a glance.'},
  {target:'#tab-budget',icon:'💰',title:'Budget Tab',body:'Track income, expenses, fixed dues, and savings goals. See exactly where your money goes.'},
  {target:'#tab-habits',icon:'🏃',title:'Habits Tab',body:'Full habit tracker with completion chart, activity heatmap, and daily progress chart.'},
  {target:'#tab-ledger',icon:'📋',title:'Ledger',body:'All transactions in one place. Filter, search, and export to CSV anytime.'},
  {target:'.fab',icon:'➕',title:'Add Transactions',body:'Tap the <strong>+</strong> button to add expenses, income, or savings allocations.'},
];
let tutStep=0,tutActive=false;
function tutViewport(){return window.innerWidth<520?'mobile':'desktop';}
function startTutorial(){tutStep=0;tutActive=true;document.getElementById('tutBackdrop').classList.add('active');const ct=document.querySelector('.content');if(ct)ct.scrollTop=0;renderTutStep();}
async function endTutorial(){
  document.getElementById('tutBackdrop').classList.remove('active');
  document.getElementById('tutHole').style.display='none';
  document.getElementById('tutCard').style.display='none';
  tutActive=false;
  try{await bApiCall('settings',{tutorialSeen:true},'PATCH');}catch(e){}
}
function tutNext(){tutStep++;if(tutStep>=tutSteps.length){endTutorial();return;}renderTutStep();}
function checkTutorial(){if(bState.tutorialSeen)return;setTimeout(startTutorial,750);}
function renderTutStep(){
  const step=tutSteps[tutStep];const card=document.getElementById('tutCard');const hole=document.getElementById('tutHole');
  document.getElementById('tutPips').innerHTML=tutSteps.map((_,i)=>`<div class="tut-pip${i===tutStep?' on':''}"></div>`).join('');
  document.getElementById('tutIcon').textContent=step.icon;
  document.getElementById('tutTitle').textContent=step.title;
  document.getElementById('tutBody').innerHTML=step.body;
  const isLast=tutStep===tutSteps.length-1;const btn=document.getElementById('tutNextBtn');
  btn.className='tut-next'+(isLast?' finish':'');
  btn.innerHTML=isLast?'<svg width="10" height="10" viewBox="0 0 11 11" fill="none"><path d="M2 5.5l2.5 2.5 4.5-4.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg> Got it!':'Next <svg width="10" height="10" viewBox="0 0 11 11" fill="none"><path d="M2.5 5.5h6M6 3l2.5 2.5L6 8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  card.style.display='block';card.style.visibility='hidden';hole.style.display='none';
  if(!step.target){applyCardPosition(card,null);showTutCard(card);return;}
  const el=document.querySelector(step.target);
  if(!el){applyCardPosition(card,null);showTutCard(card);return;}
  scrollToTarget(el,()=>{
    const r=el.getBoundingClientRect();const PAD=8;
    hole.style.left=(r.left-PAD)+'px';hole.style.top=(r.top-PAD)+'px';hole.style.width=(r.width+PAD*2)+'px';hole.style.height=(r.height+PAD*2)+'px';hole.style.display='block';
    applyCardPosition(card,r);showTutCard(card);
  });
}
function showTutCard(card){card.style.animation='none';card.offsetHeight;card.style.animation='';card.style.visibility='visible';}
function scrollToTarget(el,cb){
  const container=document.querySelector('.content');if(!container){cb();return;}
  let offsetTop=0,node=el;while(node&&node!==container){offsetTop+=node.offsetTop;node=node.offsetParent;}
  const elH=el.offsetHeight,ctH=container.clientHeight,PAD=24;
  let target=offsetTop-PAD;if(elH<ctH*0.5)target=offsetTop-Math.max(PAD,(ctH-elH)/3);target=Math.max(0,target);
  const already=Math.abs(container.scrollTop-target)<4;if(already){cb();return;}
  container.scrollTo({top:target,behavior:'smooth'});
  let last=-1,ticks=0;
  function poll(){if(container.scrollTop===last){ticks++;if(ticks>=3){cb();return;}}else{ticks=0;last=container.scrollTop;}requestAnimationFrame(poll);}
  requestAnimationFrame(poll);
}
function applyCardPosition(card,r){
  const mob=tutViewport()==='mobile';
  if(!r){if(mob){card.style.top='auto';card.style.bottom='90px';card.style.left='50%';card.style.transform='translateX(-50%)';}else{card.style.top='50%';card.style.bottom='';card.style.left='50%';card.style.transform='translate(-50%,-50%)';}return;}
  if(mob){card.style.top='auto';card.style.bottom='90px';card.style.left='50%';card.style.transform='translateX(-50%)';return;}
  card.style.top='-9999px';card.style.left='-9999px';card.style.bottom='';card.style.transform='none';
  const cw=card.offsetWidth||310,ch=card.offsetHeight||220,vw=window.innerWidth,vh=window.innerHeight,M=16,GAP=12,PAD=8;
  const hT=r.top-PAD,hB=r.bottom+PAD,hL=r.left-PAD,hR=r.right+PAD;
  let top,left;const below=vh-hB-GAP-M,above=hT-GAP-M,right=vw-hR-GAP-M,toLeft=hL-GAP-M;
  function clamp(v,lo,hi){return Math.min(Math.max(v,lo),hi);}
  if(below>=ch){top=hB+GAP;left=clamp(hL,M,vw-cw-M);}
  else if(above>=ch){top=hT-GAP-ch;left=clamp(hL,M,vw-cw-M);}
  else if(right>=cw){left=hR+GAP;top=clamp(hT,M,vh-ch-M);}
  else if(toLeft>=cw){left=hL-GAP-cw;top=clamp(hT,M,vh-ch-M);}
  else{top=(vh-ch)/2;left=(vw-cw)/2;}
  top=clamp(top,M,vh-ch-M);left=clamp(left,M,vw-cw-M);
  card.style.top=top+'px';card.style.left=left+'px';card.style.bottom='';card.style.transform='none';
}
window.addEventListener('resize',()=>{if(tutActive)renderTutStep();});

/* ══════════════════════════════════════════════
   BOOT
══════════════════════════════════════════════ */
initNav();
setWelcomeName(hState.userName||bState.userName||'You');
document.getElementById('navCurrency').value=bState.currency||'$';
refreshOverview();

/* ── POST-BOOT INIT ─────────────────────────────────────────────
   This script runs after page becomes interactive (afterInteractive
   strategy), so window.load has already fired. Execute init directly.
──────────────────────────────────────────────────────────────── */
(function(){
  activePeriod='annually';
  document.querySelectorAll('.tgl[data-period]').forEach(t=>t.classList.toggle('active',t.dataset.period==='annually'));
  let habitsChartsInited=false;
  window._initHabitCharts=function(){
    if(habitsChartsInited)return;habitsChartsInited=true;
    setTimeout(()=>{
      initBarChart();initLineChart();
      const {yr,mo}=getPeriod();buildHeatmapForPeriod(yr,mo);
    },60);
  };
  window.addEventListener('resize',()=>{
    if(barChart){const w=document.getElementById('habitChartWrap');const c=document.getElementById('barChart');if(w&&c&&w.offsetWidth>0&&w.offsetHeight>0){c.width=w.offsetWidth;c.height=w.offsetHeight;barChart.resize();setTimeout(()=>showBarTip(selBar),150);}}
    if(lineChart){const w=document.querySelector('.line-wrap');const c=document.getElementById('lineChart');if(w&&c&&w.offsetWidth>0&&w.offsetHeight>0){c.width=w.offsetWidth;c.height=w.offsetHeight;lineChart.resize();}}
  });
  initFilterTabs();
  checkOnboarding();
  if(!bState.tutorialSeen)setTimeout(()=>{if(!document.getElementById('onboardOverlay').classList.contains('open'))checkTutorial();},800);
})();

/* NOTE: window.showPage is NOT explicitly reassigned here.
   In non-module scripts, top-level function declarations are already
   properties of window (window.showPage === showPage). Reassigning
   window.showPage to a wrapper that calls showPage() would cause
   infinite recursion because inside the wrapper, the name 'showPage'
   resolves back to window.showPage (the wrapper itself).
   The showPage() function already handles _initHabitCharts internally. */
window.overlayClose=overlayClose;

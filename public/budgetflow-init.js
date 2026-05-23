/* ══ CONSTANTS ══ */
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const CAT_COLORS = {
  'Food & Dining':'#F87171','Rent / EMI':'#7B6EF5','Subscriptions':'#60A5FA',
  'Transport':'#34D399','Entertainment':'#FBBF24','Utilities':'#A78BFA',
  'Medical':'#F472B6','Shopping':'#FB923C','Freelance':'#4ADE80',
  'Salary':'#86EFAC','Investment':'#6EE7B7','Other':'#9CA3AF'
};
const CAT_EMOJIS = {
  'Food & Dining':'🍽️','Rent / EMI':'🏠','Subscriptions':'📺','Transport':'🚌',
  'Entertainment':'🎮','Utilities':'⚡','Medical':'💊','Shopping':'🛍️',
  'Freelance':'💻','Salary':'💼','Investment':'📈','Other':'📦'
};
const INC_EMOJIS = ['💼','💻','🏢','🏠','📈','⚡','🎨','🎵','📦','💰','🛒','🌐'];
const DUE_EMOJIS = ['🏠','📺','⚡','💊','🚌','📱','🎵','📦','💳','🌐','🏋️','🐕'];
const GOAL_EMOJIS = ['🏠','🏖️','💻','🚗','🎓','✈️','💍','👶','💊','🏋️','📱','🎨','🐕','🌍','🛒','💰'];

/* ══ STATE — loaded from server via #budgetflow-data script tag ══ */
const DEF = {
  userName: null,
  currency: '$',
  incomeSources: [],
  transactions: [],
  dues: [],
  savingsGoals: [],
  bankBalance: null,
  bankNote: '',
  bankBalUpdated: null,
  tutorialSeen: false,
};

function getInjectedState() {
  const el = document.getElementById('budgetflow-data');
  if (!el) return null;
  try { return JSON.parse(el.textContent); } catch(e) { return null; }
}

let state = (() => {
  const injected = getInjectedState();
  if (injected && Object.keys(injected).length > 0) {
    return { ...JSON.parse(JSON.stringify(DEF)), ...injected };
  }
  return JSON.parse(JSON.stringify(DEF));
})();

let donutChart = null;
let txEditId = null, dueEditId = null, incEditId = null, goalEditId = null;
let txType = 'expense', ledgerFilter = 'all';
let dueSelEmoji = '📦', incSelEmoji = '💼', goalSelEmoji = '💰';

/* ══ API HELPER ══ */
async function apiFetch(url, method, body) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (body !== undefined) opts.body = JSON.stringify(body);
  const res = await fetch(url, opts);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'API error ' + res.status);
  return data;
}

function applyState(data) {
  if (data && data.success && data.state) {
    Object.assign(state, data.state);
    return true;
  }
  return false;
}

/* ══ HELPERS ══ */
const getCurrency = () => (state.currency || '$');
const fmt = n => getCurrency() + Math.abs(n).toLocaleString('en-US', {minimumFractionDigits:2, maximumFractionDigits:2});
const fmtC = n => getCurrency() + Math.abs(n).toLocaleString('en-US', {maximumFractionDigits:0});
const todayStr = () => new Date().toISOString().slice(0,10);
const getPeriod = () => ({ yr: parseInt(document.getElementById('navYear').value), mo: parseInt(document.getElementById('navMonth').value) });
const periodKey = (yr,mo) => `${yr}-${String(mo+1).padStart(2,'0')}`;

function getMonthTxs(yr, mo) {
  const pk = periodKey(yr, mo);
  return state.transactions.filter(t => t.date && t.date.startsWith(pk));
}

function getTotalIncome(yr, mo) {
  const recurring = state.incomeSources.reduce((a,s)=>a+s.amount, 0);
  const oneTime = getMonthTxs(yr, mo).filter(t=>t.type==='income').reduce((a,t)=>a+t.amount, 0);
  return recurring + oneTime;
}

function getMonthSavingsAllocated(yr, mo) {
  return getMonthTxs(yr, mo).filter(t=>t.type==='savings').reduce((a,t)=>a+t.amount, 0);
}

/* ══ NAV INIT ══ */
function initNav() {
  const now = new Date();
  document.getElementById('navMonth').value = now.getMonth();
  document.getElementById('navYear').value = now.getFullYear();
  document.getElementById('mobMonth').value = now.getMonth();
  document.getElementById('mobYear').value = now.getFullYear();
  updateMonthBadge();
}

function syncMobPeriod() {
  document.getElementById('navMonth').value = document.getElementById('mobMonth').value;
  document.getElementById('navYear').value = document.getElementById('mobYear').value;
  onPeriodChange();
  closeMobDrawer();
}

function onPeriodChange() {
  document.getElementById('mobMonth').value = document.getElementById('navMonth').value;
  document.getElementById('mobYear').value = document.getElementById('navYear').value;
  updateMonthBadge();
  refreshAll();
}

function updateMonthBadge() {
  const {yr,mo} = getPeriod();
  document.getElementById('monthBadge').textContent = MONTHS[mo] + ' ' + yr;
}

/* ══ MOBILE DRAWER ══ */
function toggleMobDrawer() {
  const d = document.getElementById('mobDrawer');
  d.classList.contains('open') ? closeMobDrawer() : openMobDrawer();
}
function openMobDrawer() {
  document.getElementById('mobDrawer').classList.add('open');
  document.getElementById('mobMenuBtn').classList.add('open');
  requestAnimationFrame(() => document.getElementById('mobDrawerBackdrop').classList.add('open'));
}
function closeMobDrawer() {
  document.getElementById('mobDrawer').classList.remove('open');
  document.getElementById('mobMenuBtn').classList.remove('open');
  document.getElementById('mobDrawerBackdrop').classList.remove('open');
}

/* ══ PAGE NAV ══ */
function showPage(id) {
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.ntab').forEach(t=>t.classList.remove('active'));
  document.getElementById('page-'+id).classList.add('active');
  const tab = document.getElementById('tab-'+id);
  if(tab) tab.classList.add('active');
  document.querySelectorAll('.mob-nav-item').forEach(t=>t.classList.remove('active'));
  const mobTab = document.getElementById('mob-tab-'+id);
  if(mobTab) mobTab.classList.add('active');
  if(id==='ledger') renderLedger();
  else if(id==='overview') refreshAll();
}

/* ══ STATS ══ */
function calcStats(yr, mo) {
  const txs = getMonthTxs(yr, mo);
  const totalIncome = getTotalIncome(yr, mo);
  const spent = txs.filter(t=>t.type==='expense').reduce((a,t)=>a+t.amount, 0);
  const allocated = txs.filter(t=>t.type==='savings').reduce((a,t)=>a+t.amount, 0);
  const totalSpent = spent + allocated;
  const leftover = totalIncome - totalSpent;
  const savingsRate = totalIncome > 0 ? Math.max(0, Math.round((leftover/totalIncome)*100)) : 0;

  const today = new Date(); today.setHours(0,0,0,0);
  const in7 = new Date(today); in7.setDate(in7.getDate()+7);
  const pk = periodKey(yr, mo);
  const dueThisWeek = state.dues.filter(d => {
    if((d.paidMonths||[]).includes(pk)) return false;
    const dueDate = new Date(today.getFullYear(), today.getMonth(), d.dueDay);
    if(dueDate < today) { const nm = new Date(today.getFullYear(), today.getMonth()+1, d.dueDay); return nm <= in7; }
    return dueDate <= in7;
  });

  return { totalIncome, spent: totalSpent, leftover, allocated, savingsRate,
    weekDueAmt: dueThisWeek.reduce((a,d)=>a+d.amount, 0),
    weekDueCount: dueThisWeek.length };
}

function updateStatCards() {
  const {yr,mo} = getPeriod();
  const {totalIncome, spent, leftover, savingsRate, weekDueAmt, weekDueCount} = calcStats(yr, mo);
  const srcCount = state.incomeSources.length + getMonthTxs(yr,mo).filter(t=>t.type==='income').length;

  document.getElementById('sv-spent').textContent = fmtC(spent);
  document.getElementById('sd-spent').textContent = 'of ' + fmtC(totalIncome) + ' income';

  const savedEl = document.getElementById('sv-saved');
  savedEl.textContent = fmtC(Math.abs(leftover));
  savedEl.style.color = leftover >= 0 ? 'var(--lime)' : 'var(--red)';
  document.getElementById('sd-saved').textContent = leftover >= 0 ? 'leftover this month' : 'overspent';

  document.getElementById('sv-week').textContent = fmtC(weekDueAmt);
  document.getElementById('sd-week').textContent = weekDueCount + ' bill' + (weekDueCount!==1?'s':'');

  document.getElementById('sv-income').textContent = fmtC(totalIncome);
  document.getElementById('sd-income').textContent = srcCount + ' source' + (srcCount!==1?'s':'');

  updateBudgetBar(totalIncome, spent);
  refreshSavingsSection(yr, mo, totalIncome, spent, leftover);
}

function updateBudgetBar(income, spent) {
  const pct = income > 0 ? Math.min(Math.round((spent/income)*100), 100) : 0;
  const fill = document.getElementById('bbarFill');
  const pctEl = document.getElementById('bbarPct');
  const clr = pct>90?'var(--red)':pct>70?'var(--amber)':'var(--lime)';
  fill.style.width = pct+'%'; fill.style.background = clr;
  pctEl.textContent = pct+'%'; pctEl.style.color = clr;
  document.getElementById('bbarSpentLbl').textContent = fmt(spent)+' spent';
  document.getElementById('bbarIncomeLbl').textContent = 'of '+fmt(income)+' total income';
}

/* ══ SAVINGS SECTION REFRESH ══ */
function refreshSavingsSection(yr, mo, income, spent, leftover) {
  const allocated = getMonthSavingsAllocated(yr, mo);
  const rate = income > 0 ? Math.round(Math.max(0,leftover)/income*100) : 0;

  const leftEl = document.getElementById('svLeftover');
  if(leftEl) {
    leftEl.textContent = income > 0 || spent > 0 ? fmtC(Math.abs(leftover)) : '0';
    leftEl.style.color = leftover >= 0 ? 'var(--lime)' : 'var(--red)';
  }
  const allocEl = document.getElementById('svAllocated');
  if(allocEl) allocEl.textContent = allocated > 0 ? fmtC(allocated) : '0';

  const scRate = document.getElementById('scRatePill');
  if(scRate) {
    scRate.textContent = rate + '% savings rate' + (leftover < 0 ? ' (overspent)' : '');
    scRate.className = 'sv-rate-pill' + (rate < 10 ? ' low' : '');
  }

  buildGoalList();
}

/* ══ DONUT ══ */
function buildDonut() {
  const {yr,mo} = getPeriod();
  const txs = getMonthTxs(yr,mo).filter(t=>t.type==='expense');
  const catMap = {};
  txs.forEach(t => { catMap[t.category]=(catMap[t.category]||0)+t.amount; });
  const cats = Object.entries(catMap).sort((a,b)=>b[1]-a[1]);
  const total = cats.reduce((a,[,v])=>a+v,0);

  document.getElementById('donutCenterVal').textContent = fmtC(total);
  const leg = document.getElementById('donutLegend');

  if(cats.length===0) {
    if(donutChart){ donutChart.destroy(); donutChart=null; }
    leg.innerHTML='<div style="font-size:.72rem;color:var(--t3);text-align:center;padding:8px 0">No expenses this month</div>';
    return;
  }

  leg.innerHTML = cats.slice(0,5).map(([k,v])=>`
    <div class="dl-item">
      <div class="dl-dot" style="background:${CAT_COLORS[k]||'#888'}"></div>
      <span class="dl-name">${k}</span>
      <span class="dl-pct">${total>0?Math.round(v/total*100):0}%</span>
    </div>`).join('');

  const ctx = document.getElementById('donutChart').getContext('2d');
  if(donutChart) donutChart.destroy();
  donutChart = new Chart(ctx, {
    type:'doughnut',
    data:{labels:cats.map(([k])=>k),datasets:[{data:cats.map(([,v])=>v),backgroundColor:cats.map(([k])=>CAT_COLORS[k]||'#888'),borderWidth:0,hoverOffset:4}]},
    options:{responsive:true,maintainAspectRatio:true,cutout:'72%',plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>' '+fmt(c.raw)}}},animation:{duration:500}}
  });
}

/* ══ FLOW BARS ══ */
function buildFlowBars() {
  const {yr,mo} = getPeriod();
  const txs = getMonthTxs(yr,mo).filter(t=>t.type==='expense');
  const catMap = {};
  txs.forEach(t=>{catMap[t.category]=(catMap[t.category]||0)+t.amount;});
  const sorted = Object.entries(catMap).sort((a,b)=>b[1]-a[1]);
  const total = sorted.reduce((a,[,v])=>a+v,0);
  const c = document.getElementById('flowBars');
  c.innerHTML = sorted.length===0
    ? '<div style="font-size:.72rem;color:var(--t3);text-align:center;padding:20px 0">No expenses yet</div>'
    : sorted.map(([cat,amt])=>{
        const pct = total>0?Math.round(amt/total*100):0;
        const clr = CAT_COLORS[cat]||'#888';
        return `<div class="flow-item">
          <div class="flow-item-top">
            <span class="flow-cat">${CAT_EMOJIS[cat]||'📦'} ${cat}</span>
            <span class="flow-amt" style="color:${clr}">${fmtC(amt)}</span>
          </div>
          <div class="flow-bar-bg"><div class="flow-bar-fill" style="width:${pct}%;background:${clr}"></div></div>
        </div>`;
      }).join('');
}

/* ══ INCOME SOURCES ══ */
function buildIncomeSources() {
  const {yr,mo} = getPeriod();
  const totalR = state.incomeSources.reduce((a,s)=>a+s.amount,0);
  const totalOT = getMonthTxs(yr,mo).filter(t=>t.type==='income').reduce((a,t)=>a+t.amount,0);
  document.getElementById('incomeTotalVal').textContent = fmtC(totalR + totalOT);
  const list = document.getElementById('srcList');
  if(state.incomeSources.length===0 && totalOT===0) {
    list.innerHTML='<div style="font-size:.72rem;color:var(--t3);text-align:center;padding:16px 0">Add your income sources</div>'; return;
  }
  let html = state.incomeSources.map(s=>`
    <div class="src-row" onclick="openIncomeModal('${s.id}')">
      <div class="src-icon">${s.emoji||'💼'}</div>
      <div class="src-info">
        <div class="src-name">${s.name}</div>
        <div class="src-tag">${s.type} · monthly</div>
      </div>
      <span class="src-amt">${fmt(s.amount)}</span>
      <button class="src-edit" onclick="event.stopPropagation();openIncomeModal('${s.id}')">
        <svg width="10" height="10" viewBox="0 0 11 11" fill="none"><path d="M8 1.5l1.5 1.5-7 7-2 .5.5-2 7-7Z" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>
    </div>`).join('');
  const oneTimeTxs = getMonthTxs(yr,mo).filter(t=>t.type==='income');
  if(oneTimeTxs.length>0) {
    html += `<div style="font-size:.65rem;font-weight:700;color:var(--t3);text-transform:uppercase;letter-spacing:.05em;padding:8px 6px 4px">One-time</div>`;
    html += oneTimeTxs.slice(0,3).map(t=>`
      <div class="src-row" onclick="openTxModal('${t.id}')">
        <div class="src-icon" style="background:rgba(74,222,128,.07)">${CAT_EMOJIS[t.category]||'💰'}</div>
        <div class="src-info">
          <div class="src-name">${t.name}</div>
          <div class="src-tag">${t.date.slice(5).replace('-','/')}</div>
        </div>
        <span class="src-amt">${fmt(t.amount)}</span>
      </div>`).join('');
  }
  list.innerHTML = html;
}

/* ══ DUES ══ */
function buildDueList() {
  const {yr,mo} = getPeriod();
  const pk = periodKey(yr, mo);
  const today = new Date(); today.setHours(0,0,0,0);
  const in7 = new Date(today); in7.setDate(today.getDate()+7);
  const list = document.getElementById('dueList');
  if(state.dues.length===0) {
    list.innerHTML='<div style="font-size:.72rem;color:var(--t3);text-align:center;padding:16px 0">No fixed dues yet.<br>Add rent, subscriptions…</div>'; return;
  }
  const sorted = [...state.dues].sort((a,b)=>{
    const pa=(a.paidMonths||[]).includes(pk), pb=(b.paidMonths||[]).includes(pk);
    if(pa!==pb) return pa?1:-1;
    return a.dueDay - b.dueDay;
  });
  list.innerHTML = sorted.map(d=>{
    const paid = (d.paidMonths||[]).includes(pk);
    const dueDate = new Date(today.getFullYear(), today.getMonth(), d.dueDay);
    const overdue = !paid && dueDate < today;
    const soon = !paid && !overdue && dueDate <= in7;
    const dayLabel = d.dueDay + (d.dueDay===1?'st':d.dueDay===2?'nd':d.dueDay===3?'rd':'th');
    const subLabel = paid ? '✓ Paid this month'
      : overdue ? `⚠ Overdue, due ${dayLabel}`
      : soon ? `Due in ${Math.ceil((dueDate-today)/86400000)} day${Math.ceil((dueDate-today)/86400000)!==1?'s':''}`
      : `Due ${dayLabel} every month`;
    const subClass = overdue?'due-sub overdue-lbl':soon?'due-sub soon-lbl':'due-sub';
    return `<div class="due-row ${overdue&&!paid?'overdue':''} ${soon&&!paid?'due-soon':''} ${paid?'paid':''}" onclick="openDueModal('${d.id}')">
      <div class="due-icon">${d.emoji||'📦'}</div>
      <div class="due-info">
        <div class="due-name">${d.name}</div>
        <div class="${subClass}">${subLabel}</div>
      </div>
      <span class="due-amt">${fmt(d.amount)}</span>
      <div class="due-check" onclick="event.stopPropagation();toggleDuePaid('${d.id}')">
        <svg viewBox="0 0 9 9" fill="none"><path d="M1.5 4.5l2 2 3.5-3.5" stroke="#111" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </div>
    </div>`;
  }).join('');
}

async function toggleDuePaid(id) {
  const {yr,mo} = getPeriod();
  const pk = periodKey(yr, mo);
  const d = state.dues.find(d=>d.id===id);
  if(!d) return;
  if(!d.paidMonths) d.paidMonths = [];
  const wasPaid = d.paidMonths.includes(pk);
  const nowPaid = !wasPaid;

  // Optimistic update
  if(nowPaid) { d.paidMonths.push(pk); } else { d.paidMonths = d.paidMonths.filter(m=>m!==pk); }
  refreshAll();

  try {
    const data = await apiFetch('/api/budget/due/togglePaid', 'PATCH', { dueId: id, periodKey: pk, paid: nowPaid });
    applyState(data);
    refreshAll();
  } catch(e) {
    // Revert optimistic update
    if(nowPaid) { d.paidMonths = d.paidMonths.filter(m=>m!==pk); } else { d.paidMonths.push(pk); }
    refreshAll();
  }
}

/* ══ RECENT TX ══ */
function renderRecentTxs() {
  const {yr,mo} = getPeriod();
  const txs = getMonthTxs(yr,mo).filter(t=>t.type!=='savings').slice().sort((a,b)=>b.date.localeCompare(a.date)).slice(0,8);
  const list = document.getElementById('recentList');
  if(txs.length===0){list.innerHTML='<div style="font-size:.72rem;color:var(--t3);text-align:center;padding:20px 0">No transactions this month</div>';return;}
  list.innerHTML = txs.map(t=>txRow(t)).join('');
}

function txRow(t) {
  const clr = CAT_COLORS[t.category]||'#888';
  const sign = t.type==='income'?'+':'-';
  const amtClass = t.type==='income'?'income':'expense';
  return `<div class="tx-row" onclick="openTxModal('${t.id}')">
    <div class="tx-icon" style="background:${clr}22">${CAT_EMOJIS[t.category]||'📦'}</div>
    <div class="tx-info">
      <div class="tx-name">${t.name}</div>
      <div class="tx-cat">${t.category}${t.note?' · '+t.note:''}</div>
    </div>
    <span class="tx-date">${t.date.slice(5).replace('-','/')}</span>
    <span class="tx-amt ${amtClass}">${sign}${fmt(t.amount)}</span>
    <button class="tx-edit" onclick="event.stopPropagation();openTxModal('${t.id}')">
      <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M8 1.5l1.5 1.5-7 7-2 .5.5-2 7-7Z" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </button>
  </div>`;
}

/* ══ GOALS ══ */
function buildGoalList() {
  const goals = state.savingsGoals || [];
  const list = document.getElementById('goalList');
  if(!list) return;
  const addTile = `<button class="add-goal-tile" onclick="openGoalModal()">
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1.5v11M1.5 7h11" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
    Add a goal
  </button>`;
  if(goals.length === 0) { list.innerHTML = addTile; return; }
  const sym = getCurrency();
  list.innerHTML = goals.map(g => {
    const pct = g.target > 0 ? Math.min(Math.round(g.current / g.target * 100), 100) : 0;
    const cur = sym + Math.round(g.current).toLocaleString('en-US');
    const remaining = Math.max(0, g.target - g.current);
    const remStr = remaining > 0 ? sym + Math.round(remaining).toLocaleString('en-US') + ' to go' : '✓ Reached!';
    return `<div class="goal-item" onclick="openGoalModal('${g.id}')">
      <div class="goal-item-top">
        <span class="goal-emoji">${g.emoji||'💰'}</span>
        <span class="goal-item-name">${g.name}</span>
        <span class="goal-item-pct">${pct}%</span>
      </div>
      <div class="goal-bar-bg"><div class="goal-bar-fill" style="width:${pct}%${pct>=100?';background:var(--grn)':''}"></div></div>
      <div class="goal-item-amounts"><span>${cur} saved</span><span>${remStr}</span></div>
    </div>`;
  }).join('') + addTile;
}

function buildGoalEmojiGrid() {
  document.getElementById('goalEmojiGrid').innerHTML = GOAL_EMOJIS.map(e =>
    `<button class="em-btn ${e===goalSelEmoji?'sel':''}" onclick="selectGoalEmoji('${e}')">${e}</button>`).join('');
}
function selectGoalEmoji(e) {
  goalSelEmoji = e;
  document.querySelectorAll('#goalEmojiGrid .em-btn').forEach(b=>b.classList.toggle('sel', b.textContent===e));
}

function openGoalModal(id) {
  goalEditId = id || null; const isEdit = !!id;
  document.getElementById('goalModalTitle').textContent = isEdit ? 'Edit Goal' : 'Add Savings Goal';
  document.getElementById('goalSaveTxt').textContent = isEdit ? 'Save' : 'Add Goal';
  document.getElementById('goalDelBtn').style.display = isEdit ? 'flex' : 'none';
  if(isEdit) {
    const g = (state.savingsGoals||[]).find(g=>g.id===id); if(!g) return;
    document.getElementById('goalName').value = g.name;
    document.getElementById('goalTarget').value = g.target;
    document.getElementById('goalCurrent').value = g.current;
    goalSelEmoji = g.emoji || '💰';
  } else {
    document.getElementById('goalName').value = '';
    document.getElementById('goalTarget').value = '';
    document.getElementById('goalCurrent').value = '';
    goalSelEmoji = '💰';
  }
  buildGoalEmojiGrid();
  document.getElementById('goalOverlay').classList.add('open');
}

async function submitGoal() {
  const name = document.getElementById('goalName').value.trim();
  const target = parseFloat(document.getElementById('goalTarget').value);
  const current = parseFloat(document.getElementById('goalCurrent').value) || 0;
  if(!name || !target || target <= 0) return;

  try {
    let data;
    if(goalEditId) {
      data = await apiFetch('/api/budget/goal', 'PUT', { id: goalEditId, name, target, current, emoji: goalSelEmoji });
    } else {
      data = await apiFetch('/api/budget/goal', 'POST', { name, target, current, emoji: goalSelEmoji });
    }
    applyState(data);
    closeModal('goalOverlay');
    refreshAll();
  } catch(e) {
    console.error('submitGoal error:', e);
  }
}

async function deleteGoal() {
  if(!goalEditId) return;
  try {
    const data = await apiFetch('/api/budget/goal', 'DELETE', { id: goalEditId });
    applyState(data);
    closeModal('goalOverlay');
    refreshAll();
  } catch(e) {
    console.error('deleteGoal error:', e);
  }
}

/* ══ LEDGER ══ */
function setLedgerFilter(f) {
  ledgerFilter=f;
  document.querySelectorAll('.fpill').forEach(p=>p.classList.toggle('active',p.dataset.lf===f));
  renderLedger();
}

function renderLedger() {
  const {yr,mo} = getPeriod();
  const q = document.getElementById('ledgerSearch').value.toLowerCase();
  let txs = getMonthTxs(yr,mo).slice().sort((a,b)=>b.date.localeCompare(a.date));
  if(ledgerFilter==='income') txs=txs.filter(t=>t.type==='income');
  else if(ledgerFilter==='expense') txs=txs.filter(t=>t.type==='expense');
  if(q) txs=txs.filter(t=>t.name.toLowerCase().includes(q)||t.category.toLowerCase().includes(q)||(t.note||'').toLowerCase().includes(q));

  const list = document.getElementById('ledgerList');
  if(txs.length===0){list.innerHTML='<div style="font-size:.72rem;color:var(--t3);text-align:center;padding:30px 0">No transactions found</div>';return;}

  const grouped = {};
  txs.forEach(t=>{if(!grouped[t.date])grouped[t.date]=[];grouped[t.date].push(t);});
  list.innerHTML = Object.entries(grouped).sort((a,b)=>b[0].localeCompare(a[0])).map(([date,rows])=>{
    const sum = rows.reduce((a,t)=>a+(t.type==='income'?t.amount:-t.amount),0);
    const d = new Date(date+'T00:00:00');
    const lbl = d.toLocaleDateString('en-US',{weekday:'short',day:'numeric',month:'short'});
    return `<div class="ledger-group">
      <div class="ldg-hdr"><span class="ldg-date">${lbl}</span><span class="ldg-sum ${sum>=0?'pos':''}">${sum>=0?'+':''}${fmt(sum)}</span></div>
      ${rows.map(t=>txRow(t)).join('')}
    </div>`;
  }).join('');
}

/* ══ TX MODAL ══ */
function openTxModal(id) {
  txEditId = id || null; const isEdit = !!id;
  document.getElementById('txModalTitle').textContent = isEdit ? 'Edit Transaction' : 'Add Transaction';
  document.getElementById('txSaveTxt').textContent = isEdit ? 'Save' : 'Add';
  document.getElementById('txDelBtn').style.display = isEdit ? 'flex' : 'none';
  if(isEdit) {
    const t = state.transactions.find(t=>t.id===id); if(!t) return;
    setTxType(t.type);
    document.getElementById('txName').value = t.name;
    document.getElementById('txAmt').value = t.amount;
    document.getElementById('txCat').value = t.category || 'Other';
    document.getElementById('txDate').value = t.date;
    document.getElementById('txNote').value = t.note || '';
    if(t.type==='savings' && t.goalId) document.getElementById('txGoalSel').value = t.goalId;
  } else {
    setTxType('expense');
    ['txName','txNote'].forEach(i=>document.getElementById(i).value='');
    document.getElementById('txAmt').value='';
    document.getElementById('txCat').value='Food & Dining';
    document.getElementById('txDate').value=todayStr();
  }
  document.getElementById('txOverlay').classList.add('open');
}

function setTxType(type) {
  txType = type;
  document.getElementById('typeExpense').className = 'm-type-btn'+(type==='expense'?' sel-expense':'');
  document.getElementById('typeIncome').className = 'm-type-btn'+(type==='income'?' sel-income':'');
  document.getElementById('typeSavings').className = 'm-type-btn'+(type==='savings'?' sel-savings':'');
  const goalRow = document.getElementById('savingsGoalRow');
  const catGroup = document.getElementById('txCatGroup');
  if(type === 'savings') {
    goalRow.style.display = 'block';
    catGroup.style.display = 'none';
    populateGoalSelect();
    updateSavingsAllocHint();
  } else {
    goalRow.style.display = 'none';
    catGroup.style.display = 'block';
  }
  document.getElementById('txNameLabel').textContent = type === 'savings' ? 'Label (e.g. SIP, Emergency…)' : 'Description';
}

function populateGoalSelect() {
  const sel = document.getElementById('txGoalSel');
  const goals = state.savingsGoals || [];
  sel.innerHTML = '<option value="">General savings</option>' +
    goals.map(g=>`<option value="${g.id}">${g.emoji||'💰'} ${g.name} (${getCurrency()}${Math.round(g.current).toLocaleString()}/${getCurrency()}${Math.round(g.target).toLocaleString()})</option>`).join('');
}

function updateSavingsAllocHint() {
  const {yr,mo} = getPeriod();
  const inc = getTotalIncome(yr, mo);
  const exp = getMonthTxs(yr,mo).filter(t=>t.type==='expense').reduce((a,t)=>a+t.amount,0);
  const leftover = inc - exp;
  const hint = document.getElementById('savAllocHint');
  if(hint) hint.textContent = leftover > 0 ? `↑ ${fmtC(leftover)} available to allocate this month` : '';
}

async function submitTx() {
  const name = document.getElementById('txName').value.trim();
  const amt = parseFloat(document.getElementById('txAmt').value);
  const date = document.getElementById('txDate').value;
  const note = document.getElementById('txNote').value.trim();
  if(!name || !amt || amt<=0 || !date) return;
  const cat = txType === 'savings' ? 'Savings' : document.getElementById('txCat').value;
  const goalId = txType === 'savings' ? (document.getElementById('txGoalSel').value || null) : null;

  try {
    let data;
    if(txEditId) {
      data = await apiFetch('/api/budget/transaction', 'PUT', { id: txEditId, type: txType, name, amount: amt, category: cat, date, note, goalId });
    } else {
      data = await apiFetch('/api/budget/transaction', 'POST', { type: txType, name, amount: amt, category: cat, date, note, goalId });
    }
    applyState(data);
    closeModal('txOverlay');
    refreshAll();
  } catch(e) {
    console.error('submitTx error:', e);
  }
}

async function deleteTx() {
  if(!txEditId) return;
  try {
    const data = await apiFetch('/api/budget/transaction', 'DELETE', { id: txEditId });
    applyState(data);
    closeModal('txOverlay');
    refreshAll();
  } catch(e) {
    console.error('deleteTx error:', e);
  }
}

/* ══ INCOME SOURCE MODAL ══ */
function buildIncEmojiGrid() {
  document.getElementById('incEmojiGrid').innerHTML = INC_EMOJIS.map(e=>
    `<button class="em-btn ${e===incSelEmoji?'sel':''}" onclick="selectIncEmoji('${e}')">${e}</button>`).join('');
}
function selectIncEmoji(e){incSelEmoji=e;document.querySelectorAll('#incEmojiGrid .em-btn').forEach(b=>b.classList.toggle('sel',b.textContent===e));}

function openIncomeModal(id) {
  incEditId=id||null; const isEdit=!!id;
  document.getElementById('incModalTitle').textContent=isEdit?'Edit Income Source':'Add Income Source';
  document.getElementById('incSaveTxt').textContent=isEdit?'Save':'Add Source';
  document.getElementById('incDelBtn').style.display=isEdit?'flex':'none';
  if(isEdit){
    const s=state.incomeSources.find(s=>s.id===id); if(!s)return;
    document.getElementById('incName').value=s.name;
    document.getElementById('incAmt').value=s.amount;
    document.getElementById('incType').value=s.type;
    incSelEmoji=s.emoji||'💼';
  } else {
    document.getElementById('incName').value='';
    document.getElementById('incAmt').value='';
    document.getElementById('incType').value='Salary';
    incSelEmoji='💼';
  }
  buildIncEmojiGrid();
  document.getElementById('incOverlay').classList.add('open');
}

async function submitIncome() {
  const name=document.getElementById('incName').value.trim();
  const amt=parseFloat(document.getElementById('incAmt').value);
  const type=document.getElementById('incType').value;
  if(!name||!amt||amt<=0)return;

  try {
    let data;
    if(incEditId){
      data = await apiFetch('/api/budget/income', 'PUT', { id: incEditId, name, amount: amt, type, emoji: incSelEmoji });
    } else {
      data = await apiFetch('/api/budget/income', 'POST', { name, amount: amt, type, emoji: incSelEmoji });
    }
    applyState(data);
    closeModal('incOverlay');
    refreshAll();
  } catch(e) {
    console.error('submitIncome error:', e);
  }
}

async function deleteIncome() {
  if(!incEditId)return;
  try {
    const data = await apiFetch('/api/budget/income', 'DELETE', { id: incEditId });
    applyState(data);
    closeModal('incOverlay');
    refreshAll();
  } catch(e) {
    console.error('deleteIncome error:', e);
  }
}

/* ══ DUE MODAL ══ */
function buildDueEmojiGrid(){
  document.getElementById('dueEmojiGrid').innerHTML=DUE_EMOJIS.map(e=>
    `<button class="em-btn ${e===dueSelEmoji?'sel':''}" onclick="selectDueEmoji('${e}')">${e}</button>`).join('');
}
function selectDueEmoji(e){dueSelEmoji=e;document.querySelectorAll('#dueEmojiGrid .em-btn').forEach(b=>b.classList.toggle('sel',b.textContent===e));}

function openDueModal(id) {
  dueEditId=id||null; const isEdit=!!id;
  document.getElementById('dueModalTitle').textContent=isEdit?'Edit Due':'Add Fixed Due';
  document.getElementById('dueSaveTxt').textContent=isEdit?'Save':'Add Due';
  document.getElementById('dueDelBtn').style.display=isEdit?'flex':'none';
  if(isEdit){
    const d=state.dues.find(d=>d.id===id); if(!d)return;
    document.getElementById('dueName').value=d.name;
    document.getElementById('dueAmt').value=d.amount;
    document.getElementById('dueDay').value=d.dueDay;
    document.getElementById('dueCat').value=d.category;
    dueSelEmoji=d.emoji||'📦';
  } else {
    document.getElementById('dueName').value='';
    document.getElementById('dueAmt').value='';
    document.getElementById('dueDay').value='';
    document.getElementById('dueCat').value='Subscriptions';
    dueSelEmoji='📦';
  }
  buildDueEmojiGrid();
  document.getElementById('dueOverlay').classList.add('open');
}

async function submitDue() {
  const name=document.getElementById('dueName').value.trim();
  const amt=parseFloat(document.getElementById('dueAmt').value);
  const day=parseInt(document.getElementById('dueDay').value);
  const cat=document.getElementById('dueCat').value;
  if(!name||!amt||amt<=0||!day||day<1||day>31)return;

  try {
    let data;
    if(dueEditId){
      data = await apiFetch('/api/budget/due', 'PUT', { id: dueEditId, name, amount: amt, dueDay: day, category: cat, emoji: dueSelEmoji });
    } else {
      data = await apiFetch('/api/budget/due', 'POST', { name, amount: amt, dueDay: day, category: cat, emoji: dueSelEmoji });
    }
    applyState(data);
    closeModal('dueOverlay');
    refreshAll();
  } catch(e) {
    console.error('submitDue error:', e);
  }
}

async function deleteDue() {
  if(!dueEditId)return;
  try {
    const data = await apiFetch('/api/budget/due', 'DELETE', { id: dueEditId });
    applyState(data);
    closeModal('dueOverlay');
    refreshAll();
  } catch(e) {
    console.error('deleteDue error:', e);
  }
}

/* ══ BANK BALANCE MODAL ══ */
function openBankModal() {
  document.getElementById('bankBalInput').value = state.bankBalance != null ? state.bankBalance : '';
  document.getElementById('bankBalNote').value = state.bankNote || '';
  document.getElementById('bankOverlay').classList.add('open');
  setTimeout(()=>document.getElementById('bankBalInput').focus(), 80);
}

async function saveBankModal() {
  const val = parseFloat(document.getElementById('bankBalInput').value);
  if(isNaN(val) || val < 0) return;

  try {
    const data = await apiFetch('/api/budget/settings', 'PATCH', {
      bankBalance: val,
      bankNote: document.getElementById('bankBalNote').value.trim()
    });
    applyState(data);
    closeModal('bankOverlay');
    refreshAll();
  } catch(e) {
    console.error('saveBankModal error:', e);
  }
}

/* ══ MODAL UTILS ══ */
function closeModal(id){document.getElementById(id).classList.remove('open');}
function overlayClose(e,id){if(e.target.id===id)closeModal(id);}

/* ══ EXPORT ══ */
function exportCSV() {
  const {yr,mo} = getPeriod();
  const txs = getMonthTxs(yr,mo);
  const rows=[['Date','Type','Description','Category','Amount','Note']];
  txs.forEach(t=>rows.push([t.date,t.type,t.name,t.category||'',t.amount.toFixed(2),t.note||'']));
  const csv=rows.map(r=>r.map(c=>'"'+String(c).replace(/"/g,'""')+'"').join(',')).join('\n');
  const a=document.createElement('a');
  a.href='data:text/csv;charset=utf-8,'+encodeURIComponent(csv);
  a.download=`budgetflow-${MONTHS_SHORT[mo]}-${yr}.csv`; a.click();
}

/* ══ CURRENCY ══ */
async function onCurrencyChange() {
  const currency = document.getElementById('navCurrency').value;
  state.currency = currency; // optimistic update
  refreshAll();
  try {
    const data = await apiFetch('/api/budget/settings', 'PATCH', { currency });
    applyState(data);
  } catch(e) {
    console.error('onCurrencyChange error:', e);
  }
}

/* ══ REFRESH ══ */
function refreshAll() {
  updateStatCards();
  buildDonut();
  buildFlowBars();
  buildIncomeSources();
  buildDueList();
  renderRecentTxs();
  if(document.getElementById('page-ledger').classList.contains('active')) renderLedger();
}

/* ══ ONBOARDING ══ */
async function submitOnboard() {
  const income = parseFloat(document.getElementById('obIncome').value);
  if (!income || income <= 0) {
    const err = document.getElementById('obErr');
    if (err) { err.textContent = 'Please enter a valid income.'; err.style.display = 'block'; }
    document.getElementById('obIncome').focus();
    return;
  }

  try {
    const data = await apiFetch('/api/budget/income', 'POST', {
      name: 'Primary Income', amount: income, emoji: '💼', type: 'monthly'
    });
    applyState(data);
    setWelcomeName(state.userName || 'Friend');
    document.getElementById('onboardOverlay').classList.remove('open');
    refreshAll();
  } catch(e) {
    const err = document.getElementById('obErr');
    if (err) { err.textContent = 'Failed to save. Please try again.'; err.style.display = 'block'; }
  }
}

function setWelcomeName(name) {
  const parts = (name || 'Friend').trim().split(' ');
  document.getElementById('wName').innerHTML = parts[0]+'<br><span>'+(parts[1]||'Budget')+'</span>';
}

function checkOnboarding() {
  if (!state.userName || state.incomeSources.length === 0) {
    document.getElementById('onboardOverlay').classList.add('open');
    setTimeout(() => document.getElementById('obIncome').focus(), 80);
  } else {
    setWelcomeName(state.userName);
    if(state.currency){
      const sel=document.getElementById('navCurrency');
      for(let o of sel.options){ if(o.value===state.currency){o.selected=true;break;} }
    }
    refreshAll();
  }
}

/* ══ TUTORIAL ══ */

const TUT_STEPS_DESKTOP = [
  { icon:'🗺️', title:'Welcome to BudgetFlow!',
    body:'This quick tour shows you around the dashboard. Takes about a minute. Skip anytime.',
    target:null },
  { icon:'📊', title:'Your Stat Cards',
    body:'Four live snapshots: <strong>Spent</strong> this month, <strong>Saved</strong> (leftover), bills <strong>Due This Week</strong>, and <strong>Total Income</strong>.',
    target:'.stat-cards' },
  { icon:'📈', title:'Monthly Budget Bar',
    body:'Shows how much of your income is used. Turns <strong>amber above 70%</strong> and <strong>red above 90%</strong> for a quick health check.',
    target:'.bbar-wrap' },
  { icon:'🍩', title:'Spending Breakdown',
    body:'The <strong>donut chart</strong> splits expenses by category. <strong>Money Flow bars</strong> rank each category so you spot where money goes.',
    target:'.chart-panel' },
  { icon:'💼', title:'Income Sources',
    body:'Add your monthly income streams here. Hit the <strong>plus button</strong> to add a source. They repeat every month automatically.',
    target:'.income-panel' },
  { icon:'🔔', title:'Fixed Dues',
    body:'Track recurring bills like rent, subscriptions, or EMIs. Tap the circle next to any due to mark it paid for the month.',
    target:'.dues-panel' },
  { icon:'➕', title:'Adding Transactions',
    body:'Use the <strong>lime plus button</strong> (bottom-right) to log any income, expense, or savings transfer instantly.',
    target:'.fab' },
  { icon:'🏦', title:'Ledger',
    body:'The <strong>Ledger tab</strong> lists every transaction. Search, filter by type, and export to CSV for month-end reviews.',
    target:'#tab-ledger' },
  { icon:'🎯', title:'Savings Goals',
    body:'Below the transactions you will find <strong>Savings Goals</strong>. Add a target like a holiday or emergency fund and track your progress.',
    target:'.savings-section-head' },
  { icon:'🚀', title:"You're all set!",
    body:'Start by adding your <strong>income sources</strong>, then log your first expense. Everything is <strong>synced to your account</strong>.',
    target:null },
];

const TUT_STEPS_MOBILE = [
  { icon:'🗺️', title:'Welcome to BudgetFlow!',
    body:'This quick tour shows you around the app. Takes about a minute. Skip anytime.',
    target:null },
  { icon:'📊', title:'Your Stat Cards',
    body:'Four live snapshots at the top: <strong>Spent</strong>, <strong>Saved</strong>, bills <strong>Due This Week</strong>, and <strong>Total Income</strong>.',
    target:'.stat-cards' },
  { icon:'📈', title:'Budget Bar',
    body:'Shows how much of your income is used. Turns <strong>amber</strong> then <strong>red</strong> as you approach your limit.',
    target:'.bbar-wrap' },
  { icon:'💼', title:'Income Sources',
    body:'The Income Sources panel tracks your monthly streams. Hit the <strong>plus button</strong> to add a source.',
    target:'.income-panel' },
  { icon:'🔔', title:'Fixed Dues',
    body:'Track recurring bills here. Tap the circle next to a due to mark it paid for the month.',
    target:'.dues-panel' },
  { icon:'➕', title:'Adding Transactions',
    body:'Tap the <strong>lime plus button</strong> in the centre of the bottom bar to log any income, expense, or savings.',
    target:'.mob-fab' },
  { icon:'🏦', title:'Ledger',
    body:'Tap <strong>Ledger</strong> in the bottom nav to see every transaction. Search, filter, and export to CSV.',
    target:'#mob-tab-ledger' },
  { icon:'🎯', title:'Savings Goals',
    body:'Scroll down past the transactions to find <strong>Savings Goals</strong>. Add a target and watch your progress grow.',
    target:'.savings-section-head' },
  { icon:'🚀', title:"You're all set!",
    body:'Add your <strong>income sources</strong> first, then log your first expense. Everything is <strong>synced to your account</strong>.',
    target:null },
];

let tutStep = 0;
let tutSteps = [];

function tutViewport() {
  const w = window.innerWidth;
  if (w <= 720) return 'mobile';
  return 'desktop';
}

function startTutorial() {
  tutStep = 0;
  tutSteps = tutViewport() === 'mobile' ? TUT_STEPS_MOBILE : TUT_STEPS_DESKTOP;
  document.getElementById('tutBackdrop').classList.add('active');
  const ct = document.querySelector('.content');
  if (ct) ct.scrollTop = 0;
  renderTutStep();
}

async function endTutorial() {
  document.getElementById('tutBackdrop').classList.remove('active');
  document.getElementById('tutHole').style.display = 'none';
  document.getElementById('tutCard').style.display = 'none';
  state.tutorialSeen = true;
  try {
    await apiFetch('/api/budget/settings', 'PATCH', { tutorialSeen: true });
  } catch(e) {
    // Non-critical — tutorial state is cosmetic
  }
}

function tutNext() {
  tutStep++;
  if (tutStep >= tutSteps.length) { endTutorial(); return; }
  renderTutStep();
}

/* ── Core render ── */
function renderTutStep() {
  const step = tutSteps[tutStep];
  const card = document.getElementById('tutCard');
  const hole = document.getElementById('tutHole');

  document.getElementById('tutPips').innerHTML =
    tutSteps.map((_,i) => `<div class="tut-pip ${i===tutStep?'on':''}"></div>`).join('');

  document.getElementById('tutIcon').textContent  = step.icon;
  document.getElementById('tutTitle').textContent = step.title;
  document.getElementById('tutBody').innerHTML    = step.body;
  const btn = document.getElementById('tutNextBtn');
  const isLast = tutStep === tutSteps.length - 1;
  btn.className = 'tut-next' + (isLast ? ' finish' : '');
  btn.innerHTML = isLast
    ? '<svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M2 5.5l2.5 2.5 4.5-4.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg> Got it!'
    : 'Next <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M2.5 5.5h6M6 3l2.5 2.5L6 8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  card.style.display    = 'block';
  card.style.visibility = 'hidden';
  hole.style.display    = 'none';

  if (!step.target) {
    applyCardPosition(card, null);
    showCard(card);
    return;
  }

  const el = document.querySelector(step.target);
  if (!el) {
    applyCardPosition(card, null);
    showCard(card);
    return;
  }

  scrollToTarget(el, () => {
    const r = el.getBoundingClientRect();
    const PAD = 8;
    hole.style.left   = (r.left   - PAD) + 'px';
    hole.style.top    = (r.top    - PAD) + 'px';
    hole.style.width  = (r.width  + PAD*2) + 'px';
    hole.style.height = (r.height + PAD*2) + 'px';
    hole.style.display = 'block';
    applyCardPosition(card, r);
    showCard(card);
  });
}

function showCard(card) {
  card.style.animation = 'none';
  card.offsetHeight;
  card.style.animation = '';
  card.style.visibility = 'visible';
}

function scrollToTarget(el, cb) {
  const container = document.querySelector('.content');
  if (!container) { cb(); return; }

  let offsetTop = 0;
  let node = el;
  while (node && node !== container) {
    offsetTop += node.offsetTop;
    node = node.offsetParent;
  }

  const elH   = el.offsetHeight;
  const ctH   = container.clientHeight;
  const PAD   = 24;

  let target = offsetTop - PAD;
  if (elH < ctH * 0.5) {
    target = offsetTop - Math.max(PAD, (ctH - elH) / 3);
  }
  target = Math.max(0, target);

  const already = Math.abs(container.scrollTop - target) < 4;
  if (already) { cb(); return; }

  container.scrollTo({ top: target, behavior: 'smooth' });

  let last = -1, ticks = 0;
  function poll() {
    if (container.scrollTop === last) {
      ticks++;
      if (ticks >= 3) { cb(); return; }
    } else {
      ticks = 0;
      last = container.scrollTop;
    }
    requestAnimationFrame(poll);
  }
  requestAnimationFrame(poll);
}

/* ── Card placement ── */
function applyCardPosition(card, targetRect) {
  const mob = tutViewport() === 'mobile';

  if (!targetRect) {
    if (mob) {
      card.style.top       = 'auto';
      card.style.bottom    = '90px';
      card.style.left      = '50%';
      card.style.transform = 'translateX(-50%)';
    } else {
      card.style.top       = '50%';
      card.style.bottom    = '';
      card.style.left      = '50%';
      card.style.transform = 'translate(-50%, -50%)';
    }
    return;
  }

  if (mob) {
    card.style.top       = 'auto';
    card.style.bottom    = '90px';
    card.style.left      = '50%';
    card.style.transform = 'translateX(-50%)';
    return;
  }

  card.style.top       = '-9999px';
  card.style.left      = '-9999px';
  card.style.bottom    = '';
  card.style.transform = 'none';
  const cw = card.offsetWidth  || 316;
  const ch = card.offsetHeight || 220;

  const vw  = window.innerWidth;
  const vh  = window.innerHeight;
  const M   = 16;
  const GAP = 12;
  const r   = targetRect;
  const PAD = 8;

  const holeTop    = r.top    - PAD;
  const holeBottom = r.bottom + PAD;
  const holeLeft   = r.left   - PAD;
  const holeRight  = r.right  + PAD;

  let top, left;

  const below = vh - holeBottom - GAP - M;
  const above = holeTop         - GAP - M;
  const right = vw - holeRight  - GAP - M;
  const toLeft = holeLeft       - GAP - M;

  if (below >= ch) {
    top  = holeBottom + GAP;
    left = clamp(holeLeft, M, vw - cw - M);
  } else if (above >= ch) {
    top  = holeTop - GAP - ch;
    left = clamp(holeLeft, M, vw - cw - M);
  } else if (right >= cw) {
    left = holeRight + GAP;
    top  = clamp(holeTop, M, vh - ch - M);
  } else if (toLeft >= cw) {
    left = holeLeft - GAP - cw;
    top  = clamp(holeTop, M, vh - ch - M);
  } else {
    top  = (vh - ch) / 2;
    left = (vw - cw) / 2;
  }

  top  = clamp(top,  M, vh - ch - M);
  left = clamp(left, M, vw - cw - M);

  card.style.top       = top  + 'px';
  card.style.left      = left + 'px';
  card.style.bottom    = '';
  card.style.transform = 'none';
}

function clamp(v, lo, hi) { return Math.min(Math.max(v, lo), hi); }

/* ══ BOOT ══ */
initNav();
checkOnboarding();

// Expose to window for React interop
window.budgetflow = {
  refreshAll,
  openTxModal,
  exportCSV,
  startTutorial,
};

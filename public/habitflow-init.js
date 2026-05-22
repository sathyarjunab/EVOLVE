/* ══════════════════════════════════════════════
   CONSTANTS
══════════════════════════════════════════════ */
const SK = 'hf_v5';
const EMOJIS = ['🧘', '💪', '📚', '💧', '🚫', '📓', '😴', '🥗', '🏃', '🎯', '✍️', '🎵', '🌿', '☀️', '🧠', '💊', '🚴', '🍎', '🛌', '🧹', '☕', '🖊️', '🌊', '🐾', '🎨', '🧩', '🏋️', '🤸'];

// Add a keyframe for the loader spinner if it doesn't exist
if (!document.getElementById('hf-loader-style')) {
  const style = document.createElement('style');
  style.id = 'hf-loader-style';
  style.innerHTML = `@keyframes rotation { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`;
  document.head.appendChild(style);
}
const DAYS_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/* ══════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════ */
const toStr = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const todayStr = () => toStr(new Date());
const yesterday = () => { const d = new Date(); d.setDate(d.getDate() - 1); return toStr(d); };
const daysAgo = n => { const d = new Date(); d.setDate(d.getDate() - n); return toStr(d); };

/* ══════════════════════════════════════════════
   STATE
══════════════════════════════════════════════ */
const DEF = {
  habits: [],
  history: {},
  doneToday: {},
  lastDate: null,
  globalStreak: 0,
  bestGlobalStreak: 0,
  totalAllTime: 0,
  userName: null,
};
function getInjectedState() {
  const el = document.getElementById('habitflow-data');

  if (!el) {
    return structuredClone(DEF);
  }

  try {
    return {
      ...structuredClone(DEF),
      ...JSON.parse(el.textContent)
    };
  } catch (err) {
    console.error('Failed parsing injected state', err);
    return structuredClone(DEF);
  }
}

// let state = (() => {
//   try { const r = localStorage.getItem(SK); if (r) return JSON.parse(r); } catch (e) { }
//   return JSON.parse(JSON.stringify(DEF));
// })();

let state = getInjectedState();

const showToast = (message) => {
  if (typeof window !== 'undefined' && window.showToast) {
    window.showToast(message);
  } else {
    console.error(message);
  }
};

const save = async (url, body, method) => {
  try {
    const res = await fetch(`/api/${url}`, {
      method: method,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.state) {
        state = data.state;
      }
    } else {
      let errMsg = "";
      try {
        const data = await res.json();
        errMsg = data.error || data.message || "";
      } catch (jsonErr) {
        // failed to parse json
      }
      throw new Error(errMsg);
    }
  } catch (e) {
    console.log(e);
    const msg = (e && e.message && e.message.trim()) ? e.message : "Something went wrong";
    showToast(msg);
  }
};

/* ══════════════════════════════════════════════
   DAILY RESET
══════════════════════════════════════════════ */
// This will be in the server side (WHILE FETCHING THE DATA FIRST TIME)
// function checkDailyReset() {
//   const today = todayStr();
//   if (state.lastDate && state.lastDate !== today) {
//     const prev = state.lastDate;
//     const total = state.habits.length;
//     const done = Object.keys(state.doneToday).length;
//     const pct = total ? Math.round((done / total) * 100) : 0;
//     if (!state.history[prev]) {
//       state.history[prev] = { pct, done, total };
//     }
//     state.doneToday = {};
//     state.habits.forEach(h => {
//       const wasDone = state.history[prev]?.done > 0;
//       if (!wasDone && h.streak > 0) {
//         const yest = yesterday();
//         const prevHist = state.history[yest];
//         if (!prevHist || prevHist.pct === 0) {
//           h.streak = 0;
//         }
//       }
//     });
//     calcGlobalStreak();
//   }
//   state.lastDate = today;
//   save();
// }

/* ══════════════════════════════════════════════
   STREAKS
══════════════════════════════════════════════ */
// function calcGlobalStreak() {
//   let streak = 0;
//   if (Object.keys(state.doneToday).length > 0) streak = 1;
//   for (let i = 1; i <= 365; i++) {
//     const ds = daysAgo(i);
//     const hist = state.history[ds];
//     if (hist && hist.pct > 0) { streak++; }
//     else if (i > 1) break;
//   }
//   state.globalStreak = streak;
//   if (streak > (state.bestGlobalStreak || 0)) state.bestGlobalStreak = streak;
// }

// function saveToday() {
//   // CALL THE API FOR ADDING THE DAILY SUMMARY HISTORY 
//   const today = todayStr();
//   const total = state.habits.length;
//   const done = Object.keys(state.doneToday).length;
//   const pct = total ? Math.round((done / total) * 100) : 0;
//   state.history[today] = { pct, done, total };
//   calcGlobalStreak();
//   save();
// }

/* ══════════════════════════════════════════════
   STATS UI
══════════════════════════════════════════════ */
function isCurrentMonth(yr, mo) {
  const now = new Date();
  return yr === now.getFullYear() && mo === now.getMonth();
}

function getNavPeriod() {
  const yr = parseInt(document.getElementById('navYear').value);
  const mo = parseInt(document.getElementById('navMonth').value);
  return { yr, mo };
}

function updateStats() {
  const { yr, mo } = getNavPeriod();
  updateStatsForPeriod(yr, mo);
  refreshCurrentBar();
  updateLineChartToday();
}

function updateStatsForPeriod(yr, mo) {
  const now = new Date();
  const viewingCurrent = isCurrentMonth(yr, mo);
  const daysInMonth = new Date(yr, mo + 1, 0).getDate();
  let monthDone = 0, monthDays = 0;
  let dayPcts = [];

  for (let d = 1; d <= daysInMonth; d++) {
    const ds = yr + '-' + String(mo + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0');
    const dateObj = new Date(yr, mo, d);
    if (dateObj > now) break;
    if (ds === todayStr()) {
      const todayDone = Object.keys(state.doneToday).length;
      const todayTotal = state.habits.length;
      if (todayTotal > 0) {
        monthDone += todayDone;
        dayPcts.push(Math.round(todayDone / todayTotal * 100));
        monthDays++;
      }
    } else if (state.history[ds]) {
      const h = state.history[ds];
      monthDone += h.done || 0;
      dayPcts.push(h.pct || 0);
      monthDays++;
    }
  }
  const monthAvgPct = dayPcts.length ? Math.round(dayPcts.reduce((a, b) => a + b, 0) / dayPcts.length) : 0;

  const sv1 = document.getElementById('sv1');
  const sd1 = document.getElementById('sd1');
  if (viewingCurrent) {
    sv1.textContent = (state.totalAllTime || 0).toLocaleString();
    sd1.innerHTML = '<span class="delta-pos">all time</span>';
  } else {
    sv1.textContent = monthDone.toLocaleString();
    sd1.innerHTML = '<span class="delta-pos">' + MONTHS_SHORT[mo] + ' ' + yr + '</span>';
  }

  const sv2 = document.getElementById('sv2');
  const sd2 = document.getElementById('sd2');
  if (viewingCurrent) {
    sv2.innerHTML = (state.globalStreak || 0) + '<span style="font-size:.8rem;font-weight:500;color:var(--t2);margin-left:4px">days</span>';
    sd2.innerHTML = 'Best: <span id="bestStreakVal">' + (state.bestGlobalStreak || 0) + '</span> days';
  } else {
    let maxStreak = 0, curStreak = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      const ds = yr + '-' + String(mo + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0');
      const h = state.history[ds];
      if (h && h.pct > 0) { curStreak++; maxStreak = Math.max(maxStreak, curStreak); }
      else { curStreak = 0; }
    }
    sv2.innerHTML = maxStreak + '<span style="font-size:.8rem;font-weight:500;color:var(--t2);margin-left:4px">days</span>';
    sd2.innerHTML = 'Best streak in ' + MONTHS_SHORT[mo] + ' <span id="bestStreakVal" style="display:none"></span>';
  }

  const sv3 = document.getElementById('sv3');
  const sd3 = document.getElementById('sd3');
  const labelEl = document.querySelector('.scard.lime .scard-label');
  if (viewingCurrent) {
    const total = state.habits.length;
    const done = Object.keys(state.doneToday).length;
    const pct = total ? Math.round((done / total) * 100) : 0;
    if (labelEl) labelEl.textContent = "Today's Rate";
    sv3.textContent = pct + '%';
    sd3.textContent = done + ' of ' + total + ' done';
  } else {
    if (labelEl) labelEl.textContent = 'Avg Rate';
    sv3.textContent = monthAvgPct + '%';
    sd3.textContent = monthDays + ' active day' + (monthDays !== 1 ? 's' : '') + ' tracked';
  }

  const ac = document.getElementById('analyticsCount');
  if (ac) ac.textContent = viewingCurrent ? Object.keys(state.doneToday).length : monthDone;

  renderHabitsForPeriod(yr, mo);

  const panelTitle = document.querySelector('.panel-habits-tall .panel-title');
  if (panelTitle) {
    if (viewingCurrent) {
      panelTitle.innerHTML = `<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 4h8M3 7h6M3 10h4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" opacity=".6"/></svg> Today's Habits`;
    } else {
      panelTitle.innerHTML = `<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 4h8M3 7h6M3 10h4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" opacity=".6"/></svg> ${MONTHS_SHORT[mo]} ${yr} Habits`;
    }
  }
}

/* ══════════════════════════════════════════════
   BAR CHART
══════════════════════════════════════════════ */
let barChart = null, hatchPat = null, selBar = 4, activePeriod = 'annually';

function makeHatch(ctx) {
  const c = document.createElement('canvas'); c.width = 8; c.height = 8;
  const p = c.getContext('2d');
  p.fillStyle = 'rgba(123,110,245,.15)'; p.fillRect(0, 0, 8, 8);
  p.strokeStyle = 'rgba(123,110,245,.65)'; p.lineWidth = 1.4;
  p.beginPath(); p.moveTo(0, 8); p.lineTo(8, 0); p.stroke();
  p.beginPath(); p.moveTo(-4, 8); p.lineTo(8, -4); p.stroke();
  p.beginPath(); p.moveTo(0, 16); p.lineTo(16, 0); p.stroke();
  return ctx.createPattern(c, 'repeat');
}

function getBarData() {
  const now = new Date();
  const navYrEl = document.getElementById('navYear');
  const navMoEl = document.getElementById('navMonth');
  const navYr = navYrEl ? parseInt(navYrEl.value) : now.getFullYear();
  const navMo = navMoEl ? parseInt(navMoEl.value) : now.getMonth();

  if (activePeriod === 'annually') {
    const labels = [], data = [];
    for (let i = 5; i >= 0; i--) {
      const m = new Date(navYr, navMo - i, 1);
      labels.push(MONTHS_SHORT[m.getMonth()]);
      let sum = 0, cnt = 0;
      const yr = m.getFullYear(), mo = m.getMonth();
      Object.entries(state.history).forEach(([ds, v]) => {
        const dd = new Date(ds);
        if (dd.getFullYear() === yr && dd.getMonth() === mo) { sum += v.pct; cnt++; }
      });
      if (yr === now.getFullYear() && mo === now.getMonth()) {
        const td = Object.keys(state.doneToday).length;
        const tot = state.habits.length;
        if (tot > 0) { sum += Math.round(td / tot * 100); cnt++; }
      }
      data.push(cnt ? Math.round(sum / cnt) : 0);
    }
    selBar = Math.min(selBar, data.length - 1);
    return { labels, data };
  } else {
    const yr = navYr, mo = navMo;
    const daysInMonth = new Date(yr, mo + 1, 0).getDate();
    const labels = [], data = [];
    let weekNum = 1;
    let d = 1;
    while (d <= daysInMonth) {
      const weekEnd = Math.min(d + 6, daysInMonth);
      let sum = 0, cnt = 0;
      for (let day = d; day <= weekEnd; day++) {
        const ds = `${yr}-${String(mo + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        if (ds === todayStr()) {
          const td = Object.keys(state.doneToday).length, tot = state.habits.length;
          if (tot > 0) { sum += Math.round(td / tot * 100); cnt++; }
        } else if (state.history[ds]) {
          sum += state.history[ds].pct; cnt++;
        }
      }
      labels.push('W' + weekNum);
      data.push(cnt ? Math.round(sum / cnt) : 0);
      weekNum++;
      d = weekEnd + 1;
    }
    const isCurrentMonth = (yr === now.getFullYear() && mo === now.getMonth());
    selBar = isCurrentMonth ? Math.min(Math.ceil(now.getDate() / 7) - 1, data.length - 1) : data.length - 1;
    return { labels, data };
  }
}

function initBarChart() {
  const canvas = document.getElementById('barChart');
  const wrap = document.getElementById('chartWrap');
  canvas.width = wrap.offsetWidth; canvas.height = wrap.offsetHeight;
  const ctx = canvas.getContext('2d');
  hatchPat = makeHatch(ctx);
  const { labels, data } = getBarData();
  const bgColors = data.map((_, i) => i === selBar ? '#7B6EF5' : hatchPat);
  if (barChart) {
    barChart.destroy();
  }
  barChart = new Chart(ctx, {
    type: 'bar',
    data: { labels, datasets: [{ data, backgroundColor: bgColors, borderRadius: 8, borderSkipped: false, barPercentage: .6, categoryPercentage: .7 }] },
    options: {
      responsive: false, maintainAspectRatio: false, animation: { duration: 400 },
      plugins: { legend: { display: false }, tooltip: { enabled: false } },
      scales: {
        y: {
          beginAtZero: true, max: 100, grid: { color: 'rgba(255,255,255,.04)', drawBorder: false },
          ticks: { color: '#666672', font: { family: 'Manrope', size: 10 }, callback: v => v + '%', maxTicksLimit: 5 }, border: { display: false }
        },
        x: { grid: { display: false }, ticks: { color: '#666672', font: { family: 'Manrope', size: 10, weight: '600' }, maxTicksLimit: 12 }, border: { display: false } }
      },
      onClick(_, els) { if (els.length) { selBar = els[0].index; refreshBarColors(); showBarTip(selBar); } },
      onHover(_, els) { canvas.style.cursor = els.length ? 'pointer' : 'default'; }
    }
  });
  showBarTip(selBar);
}

function refreshBarColors() {
  if (!barChart || !hatchPat) return;
  const { data } = getBarData();
  barChart.data.datasets[0].backgroundColor = data.map((_, i) => i === selBar ? '#7B6EF5' : hatchPat);
  barChart.update('none');
}

function refreshCurrentBar() {
  if (!barChart) return;
  const { labels, data } = getBarData();
  barChart.data.labels = labels;
  barChart.data.datasets[0].data = data;
  barChart.data.datasets[0].backgroundColor = data.map((_, i) => i === selBar ? '#7B6EF5' : hatchPat);
  barChart.update('none');
  showBarTip(selBar);
}

function showBarTip(idx) {
  if (!barChart) return;
  const { labels, data } = getBarData();
  const meta = barChart.getDatasetMeta(0);
  const bar = meta.data[idx]; if (!bar) return;
  const val = data[idx]; const prev = data[idx - 1] ?? data[idx + 1] ?? val;
  const delta = prev ? Math.round(((val - prev) / Math.max(prev, 1)) * 100) : 0;
  const yr = parseInt(document.getElementById('navYear').value);
  const suffix = activePeriod === 'annually' ? '' : (' ' + MONTHS_SHORT[parseInt(document.getElementById('navMonth').value)] + ' ' + yr);
  document.getElementById('tipLabel').textContent = labels[idx] + suffix;
  document.getElementById('tipVal').textContent = val + '%';
  document.getElementById('tipBadge').textContent = (delta >= 0 ? '+' : '') + delta + '%';
  document.getElementById('tipBadge').style.background = delta >= 0 ? 'var(--lime)' : 'var(--red)';
  document.getElementById('tipBadge').style.color = delta >= 0 ? '#111' : '#fff';
  const tip = document.getElementById('chartTip');
  tip.style.display = 'block';
  tip.style.left = Math.max(0, bar.x - tip.offsetWidth / 2) + 'px';
  tip.style.top = Math.max(0, bar.y - tip.offsetHeight - 10) + 'px';
}

function setPeriod(p) {
  activePeriod = p;
  document.querySelectorAll('.tgl[data-period]').forEach(t => t.classList.toggle('active', t.dataset.period === p));
  if (barChart) {
    const { labels, data } = getBarData();
    barChart.data.labels = labels;
    barChart.data.datasets[0].data = data;
    selBar = Math.min(selBar, data.length - 1);
    barChart.data.datasets[0].backgroundColor = data.map((_, i) => i === selBar ? '#7B6EF5' : hatchPat);
    barChart.update();
    setTimeout(() => showBarTip(selBar), 420);
  }
}

/* ══════════════════════════════════════════════
   HEATMAP
══════════════════════════════════════════════ */
function hmColor(pct) {
  if (pct === undefined || pct === null) return '#2A2A32';
  if (pct >= 90) return '#C8FF4D'; if (pct >= 70) return '#90C840';
  if (pct >= 50) return '#5A8E2E'; if (pct >= 30) return '#3A5E1E';
  if (pct > 0) return '#2D4A1A'; return '#2A2A32';
}

function buildHeatmap() {
  const labX = document.getElementById('hmLabX');
  labX.innerHTML = '<div></div>' + DAYS_SHORT.map(d => `<div>${d}</div>`).join('');
  labX.style.gridTemplateColumns = '26px repeat(7,1fr)';
  const body = document.getElementById('hmBody');
  body.innerHTML = '';
  const today = new Date();
  const todayDow = (today.getDay() + 6) % 7;
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - todayDow - (8 * 7));
  for (let w = 0; w < 9; w++) {
    const row = document.createElement('div');
    row.className = 'hm-row';
    row.style.gridTemplateColumns = '26px repeat(7,1fr)';
    const lbl = document.createElement('div');
    lbl.className = 'hm-row-label';
    lbl.textContent = w === 8 ? 'Now' : `-${8 - w}w`;
    row.appendChild(lbl);
    for (let d = 0; d < 7; d++) {
      const cell = document.createElement('div');
      cell.className = 'hm-cell';
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + w * 7 + d);
      const ds = toStr(date);
      const isFuture = date > today;
      const isToday = ds === todayStr();
      const hist = isToday
        ? { pct: state.habits.length ? Math.round(Object.keys(state.doneToday).length / state.habits.length * 100) : 0 }
        : state.history[ds];
      cell.style.background = isFuture ? 'rgba(56,56,63,.3)' : hmColor(hist?.pct);
      cell.style.opacity = isFuture ? '0.3' : '1';
      if (isToday) { cell.style.outline = '1.5px solid var(--lime)'; cell.style.outlineOffset = '1px'; }
      const fmt = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      cell.title = `${fmt}: ${isFuture ? 'Future' : hist?.pct !== undefined ? hist.pct + '%' : 'No data'}`;
      row.appendChild(cell);
    }
    body.appendChild(row);
  }
}

/* ══════════════════════════════════════════════
   LINE CHART
══════════════════════════════════════════════ */
let lineChart = null, lineView = 'month';

function getLineData() {
  const now = new Date();
  const navYrEl = document.getElementById('navYear');
  const navMoEl = document.getElementById('navMonth');
  const navYr = navYrEl ? parseInt(navYrEl.value) : now.getFullYear();
  const navMo = navMoEl ? parseInt(navMoEl.value) : now.getMonth();

  if (lineView === 'month') {
    const yr = navYr, mo = navMo;
    const dim = new Date(yr, mo + 1, 0).getDate();
    const labels = [], data = [], pointColors = [];
    for (let d = 1; d <= dim; d++) {
      const ds = `${yr}-${String(mo + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      labels.push(d % 5 === 0 || d === 1 || d === dim ? d : '');
      const dateObj = new Date(yr, mo, d);
      if (ds === todayStr()) {
        const td = Object.keys(state.doneToday).length, tot = state.habits.length;
        const pct = tot ? Math.round(td / tot * 100) : 0;
        data.push(pct); pointColors.push('var(--lime)');
      } else if (dateObj > now) {
        data.push(null); pointColors.push('transparent');
      } else {
        const p = state.history[ds]?.pct ?? null;
        data.push(p); pointColors.push(p !== null ? 'rgba(200,255,77,.7)' : 'transparent');
      }
    }
    const label = new Date(yr, mo, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    document.getElementById('lineViewLabel').textContent = label;
    return { labels, data, pointColors };
  } else {
    const yr = navYr;
    const labels = [], data = [], pointColors = [];
    for (let i = 0; i < 12; i++) {
      const m = new Date(yr, i, 1);
      labels.push(MONTHS_SHORT[i]);
      if (m > now) { data.push(null); pointColors.push('transparent'); continue; }
      let sum = 0, cnt = 0;
      Object.entries(state.history).forEach(([ds, v]) => {
        const dd = new Date(ds);
        if (dd.getFullYear() === yr && dd.getMonth() === i) { sum += v.pct; cnt++; }
      });
      if (yr === now.getFullYear() && i === now.getMonth()) {
        const td = Object.keys(state.doneToday).length, tot = state.habits.length;
        if (tot > 0) { sum += Math.round(td / tot * 100); cnt++; }
      }
      data.push(cnt ? Math.round(sum / cnt) : null);
      pointColors.push('rgba(200,255,77,.7)');
    }
    document.getElementById('lineViewLabel').textContent = yr;
    return { labels, data, pointColors };
  }
}

function initLineChart() {
  const canvas = document.getElementById('lineChart');
  const wrap = document.querySelector('.line-wrap');
  canvas.width = wrap.offsetWidth; canvas.height = wrap.offsetHeight;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createLinearGradient(0, 0, 0, wrap.offsetHeight);
  grad.addColorStop(0, 'rgba(200,255,77,.22)');
  grad.addColorStop(0.7, 'rgba(200,255,77,.04)');
  grad.addColorStop(1, 'rgba(200,255,77,0)');
  const { labels, data, pointColors } = getLineData();
  if (lineChart) {
    lineChart.destroy();
  }
  lineChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels, datasets: [{
        data, label: 'Completion %',
        borderColor: '#C8FF4D', borderWidth: 2,
        backgroundColor: grad, fill: true,
        tension: .4,
        pointRadius: data.map(v => v !== null ? 3 : 0),
        pointBackgroundColor: pointColors,
        pointBorderColor: 'transparent',
        spanGaps: false,
      }]
    },
    options: {
      responsive: false, maintainAspectRatio: false, animation: { duration: 500 },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(35,35,39,.95)',
          borderColor: 'rgba(56,56,63,.8)', borderWidth: 1,
          titleColor: '#fff', bodyColor: '#9898A5',
          padding: 10, cornerRadius: 10,
          callbacks: { label: c => ` ${c.parsed.y ?? 0}% completed` }
        }
      },
      scales: {
        y: {
          beginAtZero: true, max: 100,
          grid: { color: 'rgba(255,255,255,.04)', drawBorder: false },
          ticks: { color: '#666672', font: { family: 'Manrope', size: 10 }, callback: v => v + '%', maxTicksLimit: 5 },
          border: { display: false }
        },
        x: {
          grid: { display: false },
          ticks: { color: '#666672', font: { family: 'Manrope', size: 10 }, maxRotation: 0 },
          border: { display: false }
        }
      }
    }
  });
}

function updateLineChartToday() {
  if (!lineChart) return;
  const { labels, data, pointColors } = getLineData();
  lineChart.data.labels = labels;
  lineChart.data.datasets[0].data = data;
  lineChart.data.datasets[0].pointBackgroundColor = pointColors;
  lineChart.update('none');
}

function setLineView(v) {
  lineView = v;
  document.querySelectorAll('.tgl[data-lv]').forEach(t => t.classList.toggle('active', t.dataset.lv === v));
  updateLineChartToday();
}

/* ══════════════════════════════════════════════
   HABIT RENDER
══════════════════════════════════════════════ */
let activeFilter = 'all', dragSrcId = null;

function renderHabits() {
  const list = document.getElementById('habitsList');
  const q = document.getElementById('searchInp').value.toLowerCase();
  const sorted = [...state.habits].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const filtered = sorted.filter(h => {
    const mf = activeFilter === 'all' || h.time.toLowerCase() === activeFilter.toLowerCase();
    const ms = !q || h.name.toLowerCase().includes(q);
    return mf && ms;
  });
  list.innerHTML = '';
  if (!filtered.length) {
    const isEmpty = state.habits.length === 0;
    list.innerHTML = `<div style="color:var(--t3);font-size:.75rem;text-align:center;padding:20px 8px;line-height:1.6">${isEmpty ? '✦ No habits yet<br><span style="color:var(--t2)">Tap + to add your first habit</span>' : 'No habits found'}</div>`;
    return;
  }
  filtered.forEach(h => {
    const done = !!state.doneToday[h.id];
    const row = document.createElement('div');
    row.className = 'habit-row' + (done ? ' done' : '');
    row.draggable = true;
    row.dataset.id = h.id;
    row.innerHTML = `
      <div class="drag-handle" title="Drag to reorder">⠿</div>
      <div class="hav">${h.icon}</div>
      <div class="h-info">
        <div class="h-name">${h.name}</div>
        <div class="h-sub">${h.time} · 🔥 ${h.streak} day streak</div>
      </div>
      <div class="h-streak">${done ? '✓ Done' : 'Pending'}</div>
      <button class="h-edit" title="Edit" onclick="openModal('${h.id}');event.stopPropagation()">
        <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M7.5 1.5l2 2-6 6H1.5v-2l6-6Z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/></svg>
      </button>
      <div class="h-check">
        <svg viewBox="0 0 9 9" fill="none"><path d="M1.5 4.5l2 2 4-4" stroke="#111" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </div>
    `;
    row.addEventListener('click', e => {
      if (e.target.closest('.h-edit') || e.target.closest('.drag-handle')) return;
      toggleHabit(h.id, done);
    });
    row.addEventListener('dragstart', e => { dragSrcId = h.id; e.dataTransfer.effectAllowed = 'move'; row.style.opacity = '.5'; });
    row.addEventListener('dragend', () => { row.style.opacity = '1'; document.querySelectorAll('.habit-row').forEach(r => r.classList.remove('drag-over')); });
    row.addEventListener('dragover', e => { e.preventDefault(); row.classList.add('drag-over'); });
    row.addEventListener('dragleave', () => row.classList.remove('drag-over'));
    row.addEventListener('drop', e => { e.preventDefault(); row.classList.remove('drag-over'); if (dragSrcId !== h.id) reorderHabit(dragSrcId, h.id); });
    list.appendChild(row);
  });
}

function renderHabitsForPeriod(yr, mo) {
  const now = new Date();
  if (isCurrentMonth(yr, mo)) { renderHabits(); return; }
  const list = document.getElementById('habitsList');
  const q = document.getElementById('searchInp').value.toLowerCase();
  const sorted = [...state.habits].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const filtered = sorted.filter(h => {
    const mf = activeFilter === 'all' || h.time.toLowerCase() === activeFilter.toLowerCase();
    const ms = !q || h.name.toLowerCase().includes(q);
    return mf && ms;
  });
  list.innerHTML = '';
  if (!filtered.length) {
    const isEmpty = state.habits.length === 0;
    list.innerHTML = `<div style="color:var(--t3);font-size:.75rem;text-align:center;padding:20px 8px;line-height:1.6">${isEmpty ? '✦ No habits yet<br><span style="color:var(--t2)">Tap + to add your first habit</span>' : 'No habits found'}</div>`;
    return;
  }
  const daysInMonth = new Date(yr, mo + 1, 0).getDate();
  filtered.forEach(h => {
    let doneCount = 0, trackedDays = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      const ds = yr + '-' + String(mo + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0');
      const dateObj = new Date(yr, mo, d);
      if (dateObj > now) break;
      if (state.history[ds]) {
        trackedDays++;
        if (state.history[ds].done > 0) doneCount++;
      }
    }
    const rate = trackedDays ? Math.round(doneCount / trackedDays * 100) : 0;
    const row = document.createElement('div');
    const mostlyDone = rate >= 50;
    row.className = 'habit-row' + (mostlyDone ? ' done' : '');
    row.innerHTML = `
      <div class="hav">${h.icon}</div>
      <div class="h-info">
        <div class="h-name">${h.name}</div>
        <div class="h-sub">${h.time} · ${MONTHS_SHORT[mo]} ${yr}</div>
      </div>
      <div class="h-streak" style="color:${rate >= 70 ? 'var(--lime)' : rate >= 40 ? 'var(--t2)' : 'var(--red)'}">${rate}%</div>
      <button class="h-edit" title="Edit" onclick="openModal('${h.id}');event.stopPropagation()">
        <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M7.5 1.5l2 2-6 6H1.5v-2l6-6Z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/></svg>
      </button>
    `;
    list.appendChild(row);
  });
}

async function toggleHabit(id, done) {
  const row = document.querySelector(`.habit-row[data-id="${id}"]`);
  if (row) {
    row.style.opacity = '0.5';
    row.style.pointerEvents = 'none';
  }

  // 'done' from parameter is current status, so send !done to toggle
  await save('habit/toggleHabit', { id, done: !done }, 'PATCH')
  renderHabits();
  updateStats();
  const yr = parseInt(document.getElementById('navYear').value);
  const mo = parseInt(document.getElementById('navMonth').value);
  buildHeatmapForPeriod(yr, mo);
}

async function reorderHabit(fromId, toId) {
  const list = document.getElementById('habitsList');
  if (list) list.style.opacity = '0.5';

  await save('habit/reorderHabit', { fromId, toId }, 'PATCH');

  if (list) list.style.opacity = '1';
  renderHabits();
}

/* ══════════════════════════════════════════════
   MODAL
══════════════════════════════════════════════ */
let editId = null, selEmoji = '🎯';

function buildEmojiGrid(current = '🎯') {
  selEmoji = current;
  const g = document.getElementById('emojiGrid');
  g.innerHTML = '';
  EMOJIS.forEach(em => {
    const b = document.createElement('button');
    b.className = 'em-btn' + (em === selEmoji ? ' sel' : '');
    b.textContent = em; b.type = 'button';
    b.onclick = () => { selEmoji = em; g.querySelectorAll('.em-btn').forEach(x => x.classList.remove('sel')); b.classList.add('sel'); };
    g.appendChild(b);
  });
}

function openModal(id) {
  console.log("openModal")
  editId = id ?? null;
  const isEdit = !!editId;
  document.getElementById('mTitleText').textContent = isEdit ? 'Edit Habit' : 'New Habit';
  document.getElementById('mSaveTxt').textContent = isEdit ? 'Save Changes' : 'Add Habit';
  document.getElementById('mDelBtn').style.display = isEdit ? '' : 'none';
  if (isEdit) {
    const h = state.habits.find(x => x.id === id);
    document.getElementById('mName').value = h.name;
    document.getElementById('mTime').value = h.time;
    buildEmojiGrid(h.icon);
  } else {
    document.getElementById('mName').value = '';
    document.getElementById('mTime').value = 'Morning';
    buildEmojiGrid('🎯');
  }
  document.getElementById('mOverlay').classList.add('open');
  setTimeout(() => document.getElementById('mName').focus(), 80);
}

function closeModal() { document.getElementById('mOverlay').classList.remove('open') }
function overlayClose(e) { if (e.target === e.currentTarget) e.currentTarget.classList.remove('open') }

async function submitModal() {
  const name = document.getElementById('mName').value.trim();
  if (!name) { document.getElementById('mName').focus(); document.getElementById('mName').style.borderColor = 'var(--red)'; return; }
  document.getElementById('mName').style.borderColor = '';
  const time = document.getElementById('mTime').value;

  const saveBtn = document.querySelector('.m-btn.save');
  const originalHtml = saveBtn.innerHTML;
  saveBtn.innerHTML = '<span class="loader" style="width: 14px; height: 14px; border: 2px solid #111; border-bottom-color: transparent; border-radius: 50%; display: inline-block; animation: rotation 1s linear infinite;"></span> Saving...';
  saveBtn.disabled = true;

  if (editId) {
    await save('habit/updateHabit', { id: editId, name, icon: selEmoji, time }, 'PUT');
  } else {
    await save('habit/createHabit', { name, icon: selEmoji, time }, 'POST');
  }

  saveBtn.innerHTML = originalHtml;
  saveBtn.disabled = false;

  closeModal();
  renderHabits();
  updateStats();
}

function confirmDelete() { document.getElementById('mOverlay').classList.remove('open'); document.getElementById('cOverlay').classList.add('open'); }
function closeConfirm() { document.getElementById('cOverlay').classList.remove('open'); }
async function doDelete() {
  if (!editId) return;

  const delBtn = document.querySelector('#cOverlay .m-btn.del');
  const originalHtml = delBtn.innerHTML;
  delBtn.innerHTML = 'Deleting...';
  delBtn.disabled = true;

  await save('habit/deleteHabit', { id: editId }, 'DELETE');

  delBtn.innerHTML = originalHtml;
  delBtn.disabled = false;

  closeConfirm();
  renderHabits();
  updateStats();
}
/* ══════════════════════════════════════════════
   NAV FILTER
══════════════════════════════════════════════ */
function initNavDropdowns() {
  const now = new Date();
  const yearSel = document.getElementById('navYear');
  const monthSel = document.getElementById('navMonth');
  const curYear = now.getFullYear().toString();
  if ([...yearSel.options].some(o => o.value === curYear)) {
    yearSel.value = curYear;
  }
  monthSel.value = now.getMonth();
  const mobileYearSel = document.getElementById('navYearMobile');
  const mobileMonthSel = document.getElementById('navMonthMobile');
  if (mobileYearSel && [...mobileYearSel.options].some(o => o.value === curYear)) {
    mobileYearSel.value = curYear;
  }
  if (mobileMonthSel) { mobileMonthSel.value = now.getMonth(); }
  updateNavPeriodBadge();
}

function updateNavPeriodBadge() {
  const yr = document.getElementById('navYear').value;
  const mo = parseInt(document.getElementById('navMonth').value);
  const badge = document.getElementById('navPeriodBadge');
  if (badge) badge.textContent = MONTHS_SHORT[mo] + ' ' + yr;
}

function onNavFilterChange() {
  updateNavPeriodBadge();
  const yr = parseInt(document.getElementById('navYear').value);
  const mo = parseInt(document.getElementById('navMonth').value);
  activePeriod = 'monthly';
  document.querySelectorAll('.tgl[data-period]').forEach(t =>
    t.classList.toggle('active', t.dataset.period === 'monthly')
  );
  lineView = 'month';
  document.querySelectorAll('.tgl[data-lv]').forEach(t =>
    t.classList.toggle('active', t.dataset.lv === 'month')
  );
  if (barChart) {
    const { labels, data } = getBarData();
    barChart.data.labels = labels;
    barChart.data.datasets[0].data = data;
    barChart.data.datasets[0].backgroundColor = data.map((_, i) => i === selBar ? '#7B6EF5' : hatchPat);
    barChart.update();
    setTimeout(() => showBarTip(selBar), 420);
  }
  if (lineChart) {
    const { labels, data, pointColors } = getLineData();
    lineChart.data.labels = labels;
    lineChart.data.datasets[0].data = data;
    lineChart.data.datasets[0].pointBackgroundColor = pointColors;
    lineChart.data.datasets[0].pointRadius = data.map(v => v !== null ? 3 : 0);
    lineChart.update('none');
  }
  buildHeatmapForPeriod(yr, mo);
  updateStatsForPeriod(yr, mo);
}

function buildHeatmapForPeriod(yr, mo) {
  const labX = document.getElementById('hmLabX');
  labX.innerHTML = '<div></div>' + DAYS_SHORT.map(d => `<div>${d}</div>`).join('');
  labX.style.gridTemplateColumns = '26px repeat(7,1fr)';
  const body = document.getElementById('hmBody');
  body.innerHTML = '';
  const firstDay = new Date(yr, mo, 1);
  const firstDow = (firstDay.getDay() + 6) % 7;
  const start = new Date(firstDay);
  start.setDate(firstDay.getDate() - firstDow);
  const weeksNeeded = Math.ceil((firstDow + new Date(yr, mo + 1, 0).getDate()) / 7);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  for (let w = 0; w < weeksNeeded; w++) {
    const row = document.createElement('div');
    row.className = 'hm-row';
    row.style.gridTemplateColumns = '26px repeat(7,1fr)';
    const lbl = document.createElement('div');
    lbl.className = 'hm-row-label';
    lbl.textContent = 'W' + (w + 1);
    row.appendChild(lbl);
    for (let d = 0; d < 7; d++) {
      const cell = document.createElement('div');
      cell.className = 'hm-cell';
      const date = new Date(start); date.setDate(start.getDate() + w * 7 + d);
      const ds = toStr(date);
      const isFuture = date > today;
      const isToday = ds === todayStr();
      const isThisMonth = date.getMonth() === mo && date.getFullYear() === yr;
      const hist = isToday
        ? { pct: state.habits.length ? Math.round(Object.keys(state.doneToday).length / state.habits.length * 100) : 0 }
        : state.history[ds];
      cell.style.background = isFuture ? 'rgba(56,56,63,.3)' : hmColor(hist?.pct);
      cell.style.opacity = (isFuture || !isThisMonth) ? '0.25' : '1';
      if (isToday) { cell.style.outline = '1.5px solid var(--lime)'; cell.style.outlineOffset = '1px'; }
      const fmt = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      cell.title = `${fmt}: ${isFuture ? 'Future' : hist?.pct !== undefined ? hist.pct + '%' : 'No data'}`;
      row.appendChild(cell);
    }
    body.appendChild(row);
  }
}

document.querySelectorAll('.ftab').forEach(t => t.addEventListener('click', () => {
  document.querySelectorAll('.ftab').forEach(x => x.classList.remove('active'));
  t.classList.add('active'); activeFilter = t.dataset.filter; renderHabits();
}));
function setNav(el) { document.querySelectorAll('.ntab').forEach(x => x.classList.remove('active')); el.classList.add('active'); }

/* ══════════════════════════════════════════════
   KEYBOARD
══════════════════════════════════════════════ */
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { closeModal(); closeConfirm(); }
  if (e.key === 'Enter') {
    // if (document.getElementById('onboardOverlay').classList.contains('open')) submitOnboard();
    if (document.getElementById('mOverlay').classList.contains('open')) submitModal();
  }
});

/* ══════════════════════════════════════════════
   MOBILE DRAWER
══════════════════════════════════════════════ */
function toggleDrawer() {
  const drawer = document.getElementById('mobileDrawer');
  const btn = document.getElementById('navHamburger');
  const icon = document.getElementById('hamburgerIcon');
  const isOpen = drawer.classList.contains('open');
  if (isOpen) {
    closeDrawer();
  } else {
    drawer.classList.add('open');
    btn.classList.add('open');
    icon.innerHTML = '<path d="M3 3l10 10M13 3L3 13" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>';
    const yr = document.getElementById('navYear');
    const mo = document.getElementById('navMonth');
    if (yr) document.getElementById('navYearMobile').value = yr.value;
    if (mo) document.getElementById('navMonthMobile').value = mo.value;
  }
}
function closeDrawer() {
  const drawer = document.getElementById('mobileDrawer');
  const btn = document.getElementById('navHamburger');
  const icon = document.getElementById('hamburgerIcon');
  drawer.classList.remove('open');
  btn.classList.remove('open');
  icon.innerHTML = '<path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>';
}
function syncDrawerToNav(type, val) {
  const navEl = document.getElementById(type === 'year' ? 'navYear' : 'navMonth');
  if (navEl) { navEl.value = val; onNavFilterChange(); }
  const yr = document.getElementById('navYear');
  const mo = document.getElementById('navMonth');
  const mYr = document.getElementById('navYearMobile');
  const mMo = document.getElementById('navMonthMobile');
  if (yr && mYr) mYr.value = yr.value;
  if (mo && mMo) mMo.value = mo.value;
  closeDrawer();
}
document.addEventListener('click', e => {
  const drawer = document.getElementById('mobileDrawer');
  const btn = document.getElementById('navHamburger');
  if (drawer && drawer.classList.contains('open') && !drawer.contains(e.target) && !btn.contains(e.target)) {
    closeDrawer();
  }
});

function exportData() {
  const rows = [['Date', 'Completion %', 'Habits Done', 'Total Habits']];
  Object.entries(state.history).sort().forEach(([ds, v]) => {
    rows.push([ds, v.pct + '%', v.done, v.total]);
  });
  const csv = rows.map(r => r.join(',')).join('\n');
  const a = document.createElement('a');
  a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
  a.download = 'habitflow-report.csv'; a.click();
}

/* ══════════════════════════════════════════════
   ONBOARDING
══════════════════════════════════════════════ */
function formatWelcomeName(name) {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return parts[0] + '<br>' + parts.slice(1).join(' ');
  return parts[0];
}
function setWelcomeName(name) {
  const el = document.getElementById('wName');
  if (el) el.innerHTML = formatWelcomeName(name);
  const sub = el?.previousElementSibling;
  if (sub) sub.textContent = 'Welcome back,';
}
function onboardNameInput() {
  document.getElementById('onboardErr').style.display = 'none';
  document.getElementById('onboardName').style.borderColor = '';
}
// function submitOnboard() {
//   const name = document.getElementById('onboardName').value.trim();
//   if (!name) {
//     document.getElementById('onboardErr').style.display = 'block';
//     document.getElementById('onboardName').style.borderColor = 'var(--red)';
//     document.getElementById('onboardName').focus();
//     return;
//   }
//   state.userName = name;
//   save();
//   setWelcomeName(name);
//   document.getElementById('onboardOverlay').classList.remove('open');
// }
function checkOnboarding() {
  if (!state.userName) {
    setWelcomeName('Friend');
  } else {
    setWelcomeName(state.userName);
  }
}

/* ══════════════════════════════════════════════
   BOOT
══════════════════════════════════════════════ */
// checkDailyReset();
initNavDropdowns();
checkOnboarding();
renderHabits();
updateStats();

function bootCharts() {
  activePeriod = 'monthly';
  document.querySelectorAll('.tgl[data-period]').forEach(t =>
    t.classList.toggle('active', t.dataset.period === 'monthly')
  );
  initBarChart();
  initLineChart();
  const yr = parseInt(document.getElementById('navYear').value);
  const mo = parseInt(document.getElementById('navMonth').value);
  buildHeatmapForPeriod(yr, mo);
  window.addEventListener('resize', () => {
    if (barChart) {
      const w = document.getElementById('chartWrap');
      const c = document.getElementById('barChart');
      if (w.offsetWidth > 0 && w.offsetHeight > 0) {
        c.width = w.offsetWidth; c.height = w.offsetHeight;
        barChart.resize(); setTimeout(() => showBarTip(selBar), 150);
      }
    }
    if (lineChart) {
      const w = document.querySelector('.line-wrap');
      const c = document.getElementById('lineChart');
      if (w.offsetWidth > 0 && w.offsetHeight > 0) {
        c.width = w.offsetWidth; c.height = w.offsetHeight;
        lineChart.resize();
      }
    }
  });
}

// Chart.js may still be loading — wait for it
if (typeof Chart !== 'undefined') {
  bootCharts();
} else {
  let attempts = 0;
  const waitChart = setInterval(() => {
    attempts++;
    if (typeof Chart !== 'undefined') { clearInterval(waitChart); bootCharts(); }
    else if (attempts > 200) clearInterval(waitChart);
  }, 50);
}

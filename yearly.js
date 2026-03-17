// ============================================================
//  yearly.js — Tab รายปี
// ============================================================

const MONTH_LABELS = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.',
                      'ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
let barChart  = null;
let lineChart = null;

function initYearSelect() {
  const sel = document.getElementById('year-select');
  const now = new Date().getFullYear();
  for (let i = 0; i < 3; i++) {
    const y   = now - i;
    const opt = document.createElement('option');
    opt.value       = y;
    opt.textContent = 'พ.ศ. ' + (y + 543) + '  (ค.ศ. ' + y + ')';
    if (i === 0) opt.selected = true;
    sel.appendChild(opt);
  }
}

async function loadYearly() {
  const year = document.getElementById('year-select').value;
  try {
    const data = await callGAS('getYearCompareData', { year: Number(year) });
    renderYearCharts(data, year);
    renderCompareTable(data, year);
  } catch(err) {
    showToast('❌ โหลดข้อมูลไม่ได้: ' + err.message, 'error');
  }
}

function renderYearCharts(data, year) {
  const thYear     = Number(year) + 543;
  const thYearPrev = Number(year) - 1 + 543;
  const cur  = data.current;
  const prev = data.prev;

  function toArr(md, key) {
    const m = {};
    if (md) md.forEach(x => { m[x.month] = x[key] || 0; });
    return MONTH_LABELS.map(l => m[l] || 0);
  }

  const curIncome  = toArr(cur?.monthlyData,  'income');
  const curExpense = toArr(cur?.monthlyData,  'expense');
  const curProfit  = toArr(cur?.monthlyData,  'profit');
  const prevProfit = toArr(prev?.monthlyData, 'profit');

  const bCtx = document.getElementById('year-bar-chart').getContext('2d');
  if (barChart) barChart.destroy();
  barChart = new Chart(bCtx, {
    type: 'bar',
    data: {
      labels: MONTH_LABELS,
      datasets: [
        { label: 'รายรับ',  data: curIncome,  backgroundColor: 'rgba(22,163,74,0.7)',  borderRadius: 4 },
        { label: 'รายจ่าย', data: curExpense, backgroundColor: 'rgba(220,38,38,0.7)',  borderRadius: 4 },
        { label: 'กำไร',    data: curProfit,  backgroundColor: 'rgba(29,78,216,0.7)',  borderRadius: 4 }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'top', labels: { font: { family: 'Sarabun', size: 13 } } },
        tooltip: { callbacks: { label: ctx => ctx.dataset.label + ': ' + Number(ctx.raw).toLocaleString('th-TH') + ' บาท' } }
      },
      scales: {
        x: { ticks: { font: { family: 'Sarabun', size: 12 } } },
        y: { ticks: { font: { family: 'Sarabun', size: 11 }, callback: v => Number(v).toLocaleString('th-TH') } }
      }
    }
  });

  const lCtx = document.getElementById('year-line-chart').getContext('2d');
  if (lineChart) lineChart.destroy();
  lineChart = new Chart(lCtx, {
    type: 'line',
    data: {
      labels: MONTH_LABELS,
      datasets: [
        { label: 'กำไร พ.ศ. ' + thYear,     data: curProfit,  borderColor: '#1D4ED8', backgroundColor: 'rgba(29,78,216,0.1)',   borderWidth: 2, pointRadius: 4, tension: 0.3, fill: true },
        { label: 'กำไร พ.ศ. ' + thYearPrev, data: prevProfit, borderColor: '#9CA3AF', backgroundColor: 'rgba(156,163,175,0.1)', borderWidth: 2, pointRadius: 4, tension: 0.3, borderDash: [5,5], fill: false }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'top', labels: { font: { family: 'Sarabun', size: 13 } } },
        tooltip: { callbacks: { label: ctx => ctx.dataset.label + ': ' + Number(ctx.raw).toLocaleString('th-TH') + ' บาท' } }
      },
      scales: {
        x: { ticks: { font: { family: 'Sarabun', size: 12 } } },
        y: { ticks: { font: { family: 'Sarabun', size: 11 }, callback: v => Number(v).toLocaleString('th-TH') } }
      }
    }
  });
}

function renderCompareTable(data, year) {
  const thYear     = Number(year) + 543;
  const thYearPrev = Number(year) - 1 + 543;
  const cur  = data.current;
  const prev = data.prev;

  document.getElementById('th-cur-income').textContent   = 'รับ '   + thYear;
  document.getElementById('th-prev-income').textContent  = 'รับ '   + thYearPrev;
  document.getElementById('th-cur-expense').textContent  = 'จ่าย '  + thYear;
  document.getElementById('th-prev-expense').textContent = 'จ่าย '  + thYearPrev;
  document.getElementById('th-cur-profit').textContent   = 'กำไร '  + thYear;
  document.getElementById('th-prev-profit').textContent  = 'กำไร '  + thYearPrev;

  function toMap(md, key) {
    const m = {};
    if (md) md.forEach(x => { m[x.month] = x[key] || 0; });
    return m;
  }

  const cI = toMap(cur?.monthlyData,  'income');
  const cE = toMap(cur?.monthlyData,  'expense');
  const cP = toMap(cur?.monthlyData,  'profit');
  const pI = toMap(prev?.monthlyData, 'income');
  const pE = toMap(prev?.monthlyData, 'expense');
  const pP = toMap(prev?.monthlyData, 'profit');

  const fmt = n => n ? Number(n).toLocaleString('th-TH') : '-';
  const pc  = n => n > 0 ? '#16A34A' : n < 0 ? '#DC2626' : '#6B7280';

  const tbody      = document.getElementById('compare-tbody');
  tbody.innerHTML  = '';
  const all        = new Set([...Object.keys(cI), ...Object.keys(pI)]);
  const sorted     = MONTH_LABELS.filter(m => all.has(m));
  let tCI=0,tPI=0,tCE=0,tPE=0,tCP=0,tPP=0;

  sorted.forEach(m => {
    const ci=cI[m]||0,pi=pI[m]||0,ce=cE[m]||0,pe=pE[m]||0,cp=cP[m]||0,pp=pP[m]||0;
    tCI+=ci;tPI+=pi;tCE+=ce;tPE+=pe;tCP+=cp;tPP+=pp;
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${m}</td>
      <td class="text-income">${fmt(ci)}</td>
      <td style="color:#6B7280">${fmt(pi)}</td>
      <td class="text-expense">${fmt(ce)}</td>
      <td style="color:#9CA3AF">${fmt(pe)}</td>
      <td style="color:${pc(cp)}">${fmt(cp)}</td>
      <td style="color:${pc(pp)}">${fmt(pp)}</td>`;
    tbody.appendChild(tr);
  });

  const tfr = document.createElement('tr');
  tfr.style.background = '#F9FAFB';
  tfr.innerHTML = `
    <td>รวม</td>
    <td class="text-income">${fmt(tCI)}</td>
    <td style="color:#6B7280">${fmt(tPI)}</td>
    <td class="text-expense">${fmt(tCE)}</td>
    <td style="color:#9CA3AF">${fmt(tPE)}</td>
    <td style="color:${pc(tCP)}">${fmt(tCP)}</td>
    <td style="color:${pc(tPP)}">${fmt(tPP)}</td>`;
  tbody.appendChild(tfr);
}

// ============================================================
//  dashboard.js — Tab Dashboard
// ============================================================

function initMonthSelect() {
  const sel = document.getElementById('month-select');
  const now = new Date();
  const th  = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน',
               'กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
  for (let i = 0; i < 12; i++) {
    const d   = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const val = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
    const opt = document.createElement('option');
    opt.value       = val;
    opt.textContent = th[d.getMonth()] + ' ' + (d.getFullYear() + 543);
    if (i === 0) opt.selected = true;
    sel.appendChild(opt);
  }
}

async function loadDashboard() {
  const month = document.getElementById('month-select').value;
  ['d-total','d-paid','d-unpaid','d-percent','d-active','d-vacant','d-moveout','d-net-profit']
    .forEach(id => { document.getElementById(id).textContent = '...'; });
  try {
    const data = await callGAS('getDashboardData', { monthKey: month });
    const fmt  = n => Number(n).toLocaleString('th-TH') + ' บาท';

    document.getElementById('d-total').textContent    = fmt(data.total);
    document.getElementById('d-paid').textContent     = fmt(data.paid);
    document.getElementById('d-unpaid').textContent   = fmt(data.unpaid);
    document.getElementById('d-percent').textContent  = data.percent + '%';
    document.getElementById('d-progress').style.width = data.percent + '%';
    document.getElementById('d-active').textContent   = data.activeRooms + ' ห้อง';
    document.getElementById('d-vacant').textContent   = data.vacantRooms + ' ห้อง';

    const moveoutEl = document.getElementById('d-moveout');
    moveoutEl.textContent = data.moveOutRooms + ' ห้อง';
    moveoutEl.className   = data.moveOutRooms > 0 ? 'card-value red' : 'card-value';

    document.getElementById('d-exp-water').textContent    = fmt(data.expWater);
    document.getElementById('d-exp-elec').textContent     = fmt(data.expElec);
    document.getElementById('d-exp-internet').textContent = fmt(data.internet);
    document.getElementById('d-exp-mgmt').textContent     = fmt(data.mgmt);
    document.getElementById('d-exp-supplies').textContent = fmt(data.supplies);
    document.getElementById('d-exp-profit').textContent   = fmt(data.profitShare);
    document.getElementById('d-exp-total').textContent    = fmt(data.totalExpense);

    const profitEl = document.getElementById('d-net-profit');
    profitEl.textContent = fmt(data.netProfit);
    profitEl.className   = 'card-value ' + (data.netProfit >= 0 ? 'green' : 'red');

    document.getElementById('d-dep-in').textContent  = fmt(data.depIn);
    document.getElementById('d-dep-out').textContent = fmt(data.depOut);
  } catch(err) {
    showToast('❌ โหลดข้อมูลไม่ได้: ' + err.message, 'error');
  }
}

// ============================================================
//  meter.js — Tab มิเตอร์
// ============================================================

const ROOMS = {
  1: [101,102,103,104,105,106,107,108,109,110],
  2: [201,202,203,204,205,206,207,208,209,210],
  3: [301,302,303,304,305,306,307,308,309,310]
};
const savedRooms = { 1: new Set(), 2: new Set(), 3: new Set() };
let meterOldMap  = {};
let currentFloor = 1;

async function loadMeterData() {
  document.getElementById('meter-month').textContent = '⏳';
  try {
    const result = await callGAS('getMeterData');
    if (!result.success) return;
    const monthKey = (result.sheetName || '').replace('BILL_', '').replace('_', '-');
    document.getElementById('meter-month').textContent = formatThaiMonth(monthKey);
    meterOldMap = {};
    result.data.forEach(r => { meterOldMap[r.room] = r; });
    renderTable(currentFloor);
  } catch(e) {
    document.getElementById('meter-month').textContent = '-';
  }
}

function switchFloor(floor) {
  currentFloor = floor;
  [1,2,3].forEach(f => document.getElementById('tab' + f).classList.toggle('active', f === floor));
  renderTable(floor);
  updateProgress(floor);
  document.getElementById('result-box').classList.remove('show');
}

function renderTable(floor) {
  const tbody = document.getElementById('meter-table');
  tbody.innerHTML = '';
  ROOMS[floor].forEach(room => {
    const isSaved = savedRooms[floor].has(room);
    const d       = meterOldMap[String(room)] || { waterOld: '?', elecOld: '?', waterNew: 0, elecNew: 0 };
    const hasNew  = d.waterNew > 0 || d.elecNew > 0;
    const tr      = document.createElement('tr');
    tr.className  = 'room-row' + (isSaved ? ' saved' : '');
    tr.id         = 'row_' + room;

    if (isSaved) {
      tr.innerHTML = `
        <td>${room}<div class="saved-badge">✓</div></td>
        <td class="old-val">${d.waterOld}</td>
        <td><input type="number" id="w_${room}" class="saved-input" placeholder="✓" disabled></td>
        <td class="old-val">${d.elecOld}</td>
        <td><input type="number" id="e_${room}" class="saved-input" placeholder="✓" disabled></td>
        <td>${room}<div class="saved-badge">✓</div></td>`;
    } else {
      tr.innerHTML = `
        <td>${room}${hasNew ? '<div class="has-val-badge">มีค่า</div>' : ''}</td>
        <td class="old-val">${d.waterOld}</td>
        <td><input type="number" id="w_${room}" placeholder="ใหม่" inputmode="numeric" oninput="validateMeter(this,${d.waterOld})"></td>
        <td class="old-val">${d.elecOld}</td>
        <td><input type="number" id="e_${room}" placeholder="ใหม่" inputmode="numeric" oninput="validateMeter(this,${d.elecOld})"></td>
        <td>${room}${hasNew ? '<div class="has-val-badge">มีค่า</div>' : ''}</td>`;
    }
    tbody.appendChild(tr);
  });
}

function validateMeter(input, oldVal) {
  const val = Number(input.value);
  if (input.value !== '' && val < Number(oldVal)) {
    input.classList.add('error-input');
    input.title = 'ต้องมากกว่าค่าเก่า (' + oldVal + ')';
  } else {
    input.classList.remove('error-input');
    input.title = '';
  }
}

function updateProgress(floor) {
  const total = ROOMS[floor].length;
  const done  = savedRooms[floor].size;
  const pct   = Math.round(done / total * 100);
  document.getElementById('prog-label').textContent = `กรอกแล้ว ${done} / ${total} ห้อง`;
  document.getElementById('prog-pct').textContent   = pct + '%';
  document.getElementById('prog-fill').style.width  = pct + '%';
  [1,2,3].forEach(f => {
    const cnt = savedRooms[f].size;
    document.getElementById('tab' + f).innerHTML =
      `ชั้น ${f}` + (cnt > 0 ? ` <span class="done-count">${cnt}</span>` : '');
  });
}

async function saveMeter() {
  const btn    = document.getElementById('btn-save');
  const meters = [];
  let hasError = false;

  ROOMS[currentFloor].forEach(room => {
    if (savedRooms[currentFloor].has(room)) return;
    const wEl = document.getElementById('w_' + room);
    const eEl = document.getElementById('e_' + room);
    if (wEl?.classList.contains('error-input') || eEl?.classList.contains('error-input')) { hasError = true; return; }
    const w = wEl?.value, e = eEl?.value;
    if (w || e) meters.push({ room: String(room), water: w || "0", electric: e || "0" });
  });

  if (hasError) { showToast('⚠️ มีค่ามิเตอร์ต่ำกว่าค่าเก่า กรุณาตรวจสอบค่ะ', 'error'); return; }
  if (!meters.length) { showToast('⚠️ ไม่มีข้อมูลใหม่ที่ต้องบันทึกค่ะ', 'error'); return; }

  btn.disabled    = true;
  btn.textContent = '⏳ กำลังบันทึก...';

  try {
    const result = await callGAS('saveMeterData', { floor: currentFloor, meters });
    result.saved.forEach(s => {
      savedRooms[currentFloor].add(Number(s.room));
      if (meterOldMap[s.room]) { meterOldMap[s.room].waterNew = s.waterNew; meterOldMap[s.room].elecNew = s.elecNew; }
      const row = document.getElementById('row_' + s.room);
      if (row) {
        row.classList.add('saved');
        row.cells[0].innerHTML = `${s.room}<div class="saved-badge">✓</div>`;
        row.cells[5].innerHTML = `${s.room}<div class="saved-badge">✓</div>`;
        ['w_', 'e_'].forEach(p => {
          const el = document.getElementById(p + s.room);
          if (el) { el.classList.add('saved-input'); el.disabled = true; el.placeholder = '✓'; el.value = ''; }
        });
      }
    });

    updateProgress(currentFloor);
    const box = document.getElementById('result-box');
    box.classList.add('show');
    let html = `<div class="result-title">✅ บันทึกแล้ว ${result.saved.length} ห้อง</div>`;
    result.saved.forEach(s => {
      html += `<div class="result-item">🏠 ห้อง ${s.room} 💧 ${s.waterOld}→${s.waterNew} <span class="unit-badge">+${s.wUnit}</span> ⚡ ${s.elecOld}→${s.elecNew} <span class="unit-badge">+${s.eUnit}</span></div>`;
    });
    result.errors.forEach(e => { html += `<div class="result-item err">❌ ${e}</div>`; });
    box.innerHTML = html;
    showToast(`✅ บันทึก ${result.saved.length} ห้องเรียบร้อยค่ะ`);
  } catch(err) {
    showToast('❌ ' + (err.message || err), 'error', 4000);
  }

  btn.disabled    = false;
  btn.textContent = '💾 บันทึกชั้นนี้';
}

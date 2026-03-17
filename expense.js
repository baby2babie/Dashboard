// ============================================================
//  expense.js — Tab Expense
// ============================================================

function initExpenseDate() {
  const today = new Date();
  document.getElementById('exp-date').value =
    today.getFullYear() + '-' +
    String(today.getMonth() + 1).padStart(2, '0') + '-' +
    String(today.getDate()).padStart(2, '0');
}

async function saveExpense() {
  const date     = document.getElementById('exp-date').value;
  const category = document.getElementById('exp-category').value;
  const item     = document.getElementById('exp-item').value.trim();
  const amount   = document.getElementById('exp-amount').value;
  const note     = document.getElementById('exp-note').value.trim();
  const who      = document.getElementById('admin-name').textContent.replace('สวัสดีค่ะ คุณ', '').trim();

  if (!date || !category || !item || !amount) {
    showToast('⚠️ กรุณากรอกข้อมูลให้ครบค่ะ', 'error'); return;
  }

  const month = date.substring(0, 7);
  const btn   = document.getElementById('btn-expense');
  btn.disabled    = true;
  btn.textContent = '⏳ กำลังบันทึก...';

  try {
    const result = await callGAS('saveExpenseData', { date, month, category, item, amount, note, who });
    if (result.success) {
      showToast('✅ บันทึก Expense เรียบร้อยค่ะ');
      document.getElementById('exp-item').value   = '';
      document.getElementById('exp-amount').value = '';
      document.getElementById('exp-note').value   = '';
    } else {
      showToast('❌ ' + result.message, 'error');
    }
  } catch(err) {
    showToast('❌ เกิดข้อผิดพลาด: ' + err.message, 'error');
  }
  btn.disabled    = false;
  btn.textContent = '💾 บันทึก Expense';
}

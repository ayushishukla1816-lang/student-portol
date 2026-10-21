/* ==========================================================
   fees.js — Fee management
   ========================================================== */
document.addEventListener('DOMContentLoaded', () => {
  const isStudent = App.isStudent();
  const myId = App.myId();
  const isAdmin = App.isAdmin();

  App.init({ active:'fees.html', title: isStudent ? 'My Fees' : 'Fee Management',
    subtitle: isStudent ? 'Fee structure, payments and receipts' : 'Track collections, dues and receipts' });

  const c = $('#content');

  if (isStudent) return renderStudent(c, myId);

  const collected = DB.fees.reduce((s, f) => s + f.paid, 0);
  const pending   = DB.fees.reduce((s, f) => s + f.balance, 0);
  const total     = DB.fees.reduce((s, f) => s + f.total, 0);

  c.innerHTML = `
    <div class="stat-grid">
      ${miniStat('Total Fees', inr(total), 'fa-file-invoice-dollar', 'blue')}
      ${miniStat('Collected', inr(collected), 'fa-circle-check', 'green')}
      ${miniStat('Outstanding', inr(pending), 'fa-triangle-exclamation', 'red')}
      ${miniStat('Collection Rate', pct(collected, total) + '%', 'fa-chart-line', 'orange')}
    </div>

    <div class="card">
      <div class="card-head">
        <h2><i class="fa-solid fa-receipt"></i>Fee Records</h2>
        <div class="btn-group no-print">
          <button class="btn ghost sm" id="expFee"><i class="fa-solid fa-file-csv"></i>Export</button>
          <button class="btn ghost sm" onclick="window.print()"><i class="fa-solid fa-print"></i>Print</button>
        </div>
      </div>
      <div class="filter-bar">
        <label class="field grow"><span>Search</span><input id="fSearch" placeholder="Search by name or ID…"></label>
        <label class="field"><span>Department</span><select id="fDept"><option value="">All</option>${DEPARTMENTS.map(d => `<option>${d}</option>`).join('')}</select></label>
        <label class="field"><span>Status</span><select id="fStatus"><option value="">All</option><option>Paid</option><option>Partial</option><option>Unpaid</option></select></label>
      </div>
      <div class="card-body tight"><div id="feeTable"></div></div>
    </div>`;

  let view = DB.students.slice();

  function apply(){
    const q = $('#fSearch').value.trim().toLowerCase();
    const d = $('#fDept').value, st = $('#fStatus').value;
    view = DB.students.filter(s => {
      const f = DB.fees.find(x => x.studentId === s.id) || {};
      const status = f.balance <= 0 ? 'Paid' : (f.paid > 0 ? 'Partial' : 'Unpaid');
      return (!q || s.name.toLowerCase().includes(q) || s.id.toLowerCase().includes(q)) &&
             (!d || s.dept === d) && (!st || status === st);
    });
    render();
  }

  function render(){
    const box = $('#feeTable');
    if (!view.length){ box.innerHTML = App.emptyState('fa-receipt','No records','Adjust the filters.'); return; }

    box.innerHTML = `<div class="table-wrap"><table class="data-table" id="feeTbl">
      <thead><tr>
        <th class="sortable" data-col="0">Student</th><th>ID</th><th>Dept</th>
        <th class="sortable" data-col="3">Total</th><th class="sortable" data-col="4">Paid</th>
        <th class="sortable" data-col="5">Balance</th><th>Progress</th><th>Status</th><th>Actions</th>
      </tr></thead>
      <tbody>${view.map(s => {
        const f = DB.fees.find(x => x.studentId === s.id) || { total:0, paid:0, balance:0, payments:[] };
        const pctPaid = pct(f.paid, f.total);
        const status = f.balance <= 0 ? 'Paid' : (f.paid > 0 ? 'Partial' : 'Unpaid');
        return `<tr>
          <td><div class="td-user"><img src="${s.img}" onerror="this.src='https://i.pravatar.cc/60?u=${s.id}'">
            <div><strong>${esc(s.name)}</strong><span>${esc(s.email)}</span></div></div></td>
          <td class="mono">${s.id}</td><td>${s.dept}</td>
          <td>${inr(f.total)}</td>
          <td style="color:var(--ok);font-weight:600">${inr(f.paid)}</td>
          <td style="color:${f.balance > 0 ? 'var(--bad)' : 'var(--ok)'};font-weight:600">${inr(f.balance)}</td>
          <td><div class="progress-row"><div class="progress ${pctPaid < 50 ? 'bad' : (pctPaid < 100 ? 'warn' : '')}"><i style="width:${pctPaid}%"></i></div><b>${pctPaid}%</b></div></td>
          <td>${App.statusBadge(status)}</td>
          <td><div class="td-actions">
            <button class="btn-icon" data-pay="${s.id}" title="Add Payment"><i class="fa-solid fa-plus"></i></button>
            <button class="btn-icon" data-hist="${s.id}" title="History"><i class="fa-solid fa-clock-rotate-left"></i></button>
            <button class="btn-icon" data-rcpt="${s.id}" title="Receipt"><i class="fa-solid fa-receipt"></i></button>
          </div></td>
        </tr>`; }).join('')}</tbody></table></div>`;

    App.makeSortable($('#feeTbl'));
    $$('[data-pay]', box).forEach(b => b.onclick = () => addPayment(b.dataset.pay));
    $$('[data-hist]', box).forEach(b => b.onclick = () => history(b.dataset.hist));
    $$('[data-rcpt]', box).forEach(b => b.onclick = () => receipt(b.dataset.rcpt));
  }

  function addPayment(id){
    const s = studentById(id);
    const f = DB.fees.find(x => x.studentId === id);
    App.modal({
      title:'Record Payment — ' + s.name, okText:'Save Payment',
      body:`
        <div class="info-item"><span>Outstanding Balance</span><strong style="color:var(--bad)">${inr(f.balance)}</strong></div>
        <label class="field"><span>Amount (₹) *</span><input id="pAmt" type="number" min="1" max="${f.balance}" value="${f.balance}"></label>
        <div class="form-grid two">
          <label class="field"><span>Payment Mode</span><select id="pMode"><option>Net Banking</option><option>UPI</option><option>Debit Card</option><option>Credit Card</option><option>Cash</option><option>Cheque</option></select></label>
          <label class="field"><span>Date</span><input id="pDate" type="date" value="${todayISO()}"></label>
        </div>
        <label class="field"><span>Reference / Note</span><input id="pRef" placeholder="TXN123456"></label>`,
      onOk:(back) => {
        const amt = Number($('#pAmt', back).value);
        if (!amt || amt <= 0){ App.toast('Enter a valid amount.', 'error', 'Validation'); return false; }
        if (amt > f.balance){ App.toast('Amount exceeds the outstanding balance.', 'error', 'Validation'); return false; }
        f.paid += amt;
        f.balance = f.total - f.paid;
        f.status = f.balance <= 0 ? 'Paid' : 'Partial';
        f.payments = f.payments || [];
        f.payments.push({
          id: uid('PAY'), date: $('#pDate', back).value, amount: amt,
          mode: $('#pMode', back).value,
          ref: $('#pRef', back).value.trim() || uid('TXN'),
          note: 'Recorded via portal'
        });
        saveDB();
        App.logActivity(`Recorded payment of ${inr(amt)} for ${s.name}`);
        App.toast(`Payment of ${inr(amt)} recorded.`, 'success', 'Payment Saved');
        apply();
      }
    });
  }

  function history(id){
    const s = studentById(id);
    const f = DB.fees.find(x => x.studentId === id);
    App.modal({
      title:'Payment History — ' + s.name, wide:true, okText:'Close', hideCancel:true,
      body: (f.payments && f.payments.length)
        ? `<div class="table-wrap"><table class="data-table" style="min-width:0">
            <thead><tr><th>Date</th><th>Amount</th><th>Mode</th><th>Reference</th></tr></thead>
            <tbody>${f.payments.map(p => `<tr><td>${fmtDate(p.date)}</td>
              <td style="color:var(--ok);font-weight:700">${inr(p.amount)}</td>
              <td><span class="badge grey">${esc(p.mode)}</span></td>
              <td class="mono">${esc(p.ref)}</td></tr>`).join('')}</tbody>
            <tfoot><tr style="background:var(--bg);font-weight:800">
              <td>Total Paid</td><td colspan="3">${inr(f.paid)} of ${inr(f.total)}</td></tr></tfoot>
          </table></div>`
        : App.emptyState('fa-receipt','No payments','No payment has been recorded for this student yet.')
    });
  }

  function receipt(id){
    const s = studentById(id);
    const f = DB.fees.find(x => x.studentId === id);
    App.modal({
      title:'Fee Receipt (Demo)', okText:'Print Receipt', cancelText:'Close',
      onOk:() => setTimeout(() => window.print(), 200),
      body:`
        <div style="border:2px dashed var(--border-2);border-radius:12px;padding:20px">
          <div style="text-align:center;border-bottom:1px solid var(--border);padding-bottom:12px;margin-bottom:14px">
            <h3 style="font-size:16px">Smart Student Portal</h3>
            <p style="font-size:11.5px;color:var(--muted)">DEMO RECEIPT — NOT A VALID PAYMENT DOCUMENT</p>
          </div>
          <div class="info-item"><span>Student</span><strong>${esc(s.name)}</strong></div>
          <div class="info-item"><span>Student ID</span><strong class="mono">${s.id}</strong></div>
          <div class="info-item"><span>Department</span><strong>${DEPT_FULL[s.dept]}</strong></div>
          <div class="section-title">Fee Breakdown</div>
          <div class="info-item"><span>Tuition Fee</span><strong>${inr(f.tuition)}</strong></div>
          <div class="info-item"><span>Examination Fee</span><strong>${inr(f.exam)}</strong></div>
          <div class="info-item"><span>Library Fee</span><strong>${inr(f.library)}</strong></div>
          <div class="info-item"><span>Other Charges</span><strong>${inr(f.other)}</strong></div>
          <div class="info-item"><span>Total</span><strong>${inr(f.total)}</strong></div>
          <div class="info-item"><span>Paid</span><strong style="color:var(--ok)">${inr(f.paid)}</strong></div>
          <div class="info-item"><span>Balance</span><strong style="color:var(--bad)">${inr(f.balance)}</strong></div>
          <p style="margin-top:16px;font-size:11px;color:var(--muted);text-align:center">
            Generated on ${fmtDate(todayISO())} · This is a demonstration record.</p>
        </div>`
    });
  }

  ['fSearch','fDept','fStatus'].forEach(i => $('#' + i).addEventListener('input', apply));
  $('#expFee').onclick = () => {
    const rows = [['Student ID','Name','Department','Total','Paid','Balance','Status']];
    view.forEach(s => {
      const f = DB.fees.find(x => x.studentId === s.id) || {};
      rows.push([s.id, s.name, s.dept, f.total, f.paid, f.balance,
        f.balance <= 0 ? 'Paid' : (f.paid > 0 ? 'Partial' : 'Unpaid')]);
    });
    App.downloadCSV('fees.csv', rows);
  };

  apply();
});

function renderStudent(c, myId){
  const s = studentById(myId);
  const f = DB.fees.find(x => x.studentId === myId) || { tuition:0, exam:0, library:0, other:0, total:0, paid:0, balance:0, payments:[], dueDate:'—' };
  const pctPaid = pct(f.paid, f.total);

  c.innerHTML = `
    <div class="stat-grid">
      ${miniStat('Total Fees', inr(f.total), 'fa-file-invoice-dollar', 'blue')}
      ${miniStat('Paid', inr(f.paid), 'fa-circle-check', 'green')}
      ${miniStat('Balance', inr(f.balance), 'fa-triangle-exclamation', f.balance > 0 ? 'red' : 'green')}
      ${miniStat('Paid %', pctPaid + '%', 'fa-chart-pie', 'orange')}
    </div>

    ${f.balance > 0 ? `<div style="padding:14px 18px;border-radius:12px;background:var(--warn-soft);color:#b45309;font-size:13.4px;font-weight:600;margin-bottom:22px">
      <i class="fa-solid fa-triangle-exclamation"></i> You have an outstanding balance of ${inr(f.balance)} due by ${fmtDate(f.dueDate)}.</div>` : ''}

    <div class="dash-grid eq">
      <div class="card" style="margin:0">
        <div class="card-head"><h2><i class="fa-solid fa-list"></i>Fee Breakdown</h2></div>
        <div class="card-body">
          <div class="info-item"><span>Tuition Fee</span><strong>${inr(f.tuition)}</strong></div>
          <div class="info-item"><span>Examination Fee</span><strong>${inr(f.exam)}</strong></div>
          <div class="info-item"><span>Library Fee</span><strong>${inr(f.library)}</strong></div>
          <div class="info-item"><span>Other Charges</span><strong>${inr(f.other)}</strong></div>
          <div class="info-item" style="border-top:2px solid var(--border);padding-top:14px">
            <span>Total Payable</span><strong style="font-size:15px">${inr(f.total)}</strong></div>
          <div class="progress-row" style="margin-top:12px">
            <div class="progress ${pctPaid < 50 ? 'bad' : (pctPaid < 100 ? 'warn' : '')}"><i style="width:${pctPaid}%"></i></div>
            <b>${pctPaid}%</b>
          </div>
        </div>
      </div>

      <div class="card" style="margin:0">
        <div class="card-head"><h2><i class="fa-solid fa-clock-rotate-left"></i>Payment History</h2></div>
        <div class="card-body tight">
          ${(f.payments && f.payments.length) ? `<div class="table-wrap"><table class="data-table" style="min-width:0">
            <thead><tr><th>Date</th><th>Amount</th><th>Mode</th><th>Reference</th></tr></thead>
            <tbody>${f.payments.map(p => `<tr><td>${fmtDate(p.date)}</td>
              <td style="color:var(--ok);font-weight:700">${inr(p.amount)}</td>
              <td><span class="badge grey">${esc(p.mode)}</span></td>
              <td class="mono">${esc(p.ref)}</td></tr>`).join('')}</tbody></table></div>`
          : App.emptyState('fa-receipt','No payments yet','Your payment history will appear here.')}
        </div>
      </div>
    </div>

    <div class="card no-print">
      <div class="card-head"><h2><i class="fa-solid fa-download"></i>Download Receipt</h2></div>
      <div class="card-body">
        <button class="btn primary" id="myRcpt"><i class="fa-solid fa-receipt"></i>View Fee Receipt</button>
      </div>
    </div>`;

  $('#myRcpt').onclick = () => {
    App.modal({
      title:'Fee Receipt (Demo)', okText:'Print', cancelText:'Close',
      onOk:() => setTimeout(() => window.print(), 200),
      body:`<div style="border:2px dashed var(--border-2);border-radius:12px;padding:20px">
        <div style="text-align:center;border-bottom:1px solid var(--border);padding-bottom:12px;margin-bottom:14px">
          <h3 style="font-size:16px">Smart Student Portal</h3>
          <p style="font-size:11.5px;color:var(--muted)">DEMO RECEIPT — NOT A VALID PAYMENT DOCUMENT</p></div>
        <div class="info-item"><span>Student</span><strong>${esc(s.name)}</strong></div>
        <div class="info-item"><span>Student ID</span><strong class="mono">${s.id}</strong></div>
        <div class="info-item"><span>Total Fees</span><strong>${inr(f.total)}</strong></div>
        <div class="info-item"><span>Paid</span><strong style="color:var(--ok)">${inr(f.paid)}</strong></div>
        <div class="info-item"><span>Balance</span><strong style="color:var(--bad)">${inr(f.balance)}</strong></div>
      </div>`
    });
  };
}

function miniStat(label, value, icon, cls){
  return `<div class="stat-card"><div class="stat-top"><div class="stat-icon ${cls}"><i class="fa-solid ${icon}"></i></div></div>
    <div class="stat-label">${label}</div><div class="stat-value">${value}</div></div>`;
}
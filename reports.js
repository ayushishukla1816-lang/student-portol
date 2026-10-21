/* ==========================================================
   reports.js — Reports & analytics
   ========================================================== */
document.addEventListener('DOMContentLoaded', () => {
  App.init({ active:'reports.html', title:'Reports & Analytics', subtitle:'Institution-wide insights and exports' });

  const c = $('#content');

  c.innerHTML = `
    <div class="card no-print">
      <div class="filter-bar">
        <label class="field"><span>Department</span><select id="rpDept"><option value="">All Departments</option>${DEPARTMENTS.map(d => `<option>${d}</option>`).join('')}</select></label>
        <label class="field"><span>Semester</span><select id="rpSem"><option value="">All Semesters</option>${[1,2,3,4,5,6,7,8].map(s => `<option>${s}</option>`).join('')}</select></label>
        <label class="field"><span>Report Type</span><select id="rpType">
          <option value="all">All Reports</option>
          <option value="attendance">Attendance Report</option>
          <option value="performance">Academic Performance</option>
          <option value="fees">Fee Collection</option>
          <option value="enrolment">Enrolment Statistics</option>
        </select></label>
        <button class="btn primary" id="rpExport"><i class="fa-solid fa-file-csv"></i>Export CSV</button>
        <button class="btn ghost" onclick="window.print()"><i class="fa-solid fa-print"></i>Print</button>
      </div>
    </div>

    <div class="print-header">
      <h2 style="margin-bottom:4px">Smart Student Portal — Analytics Report</h2>
      <p style="font-size:12px">Generated on ${fmtDate(todayISO())}</p>
    </div>

    <div class="stat-grid" id="rpStats"></div>

    <div class="chart-grid">
      <div class="card" style="margin:0">
        <div class="card-head"><h2><i class="fa-solid fa-chart-column"></i>Attendance by Department</h2></div>
        <div class="card-body"><div class="chart-box"><canvas id="cAtt"></canvas></div></div>
      </div>
      <div class="card" style="margin:0">
        <div class="card-head"><h2><i class="fa-solid fa-chart-line"></i>Average Marks by Department</h2></div>
        <div class="card-body"><div class="chart-box"><canvas id="cPerf"></canvas></div></div>
      </div>
    </div>

    <div class="chart-grid">
      <div class="card" style="margin:0">
        <div class="card-head"><h2><i class="fa-solid fa-indian-rupee-sign"></i>Fee Collection Status</h2></div>
        <div class="card-body"><div class="chart-box"><canvas id="cFee"></canvas></div></div>
      </div>
      <div class="card" style="margin:0">
        <div class="card-head"><h2><i class="fa-solid fa-users"></i>Enrolment Distribution</h2></div>
        <div class="card-body"><div class="chart-box"><canvas id="cEnrol"></canvas></div></div>
      </div>
    </div>

    <div class="card">
      <div class="card-head"><h2><i class="fa-solid fa-list-ol"></i>Department Summary</h2></div>
      <div class="card-body tight"><div id="deptSummary"></div></div>
    </div>

    <div class="card">
      <div class="card-head"><h2><i class="fa-solid fa-table"></i>Detailed Student Report</h2></div>
      <div class="card-body tight"><div id="detailTable"></div></div>
    </div>`;

  let charts = {};

  function filtered(){
    const d = $('#rpDept').value, s = $('#rpSem').value;
    return DB.students.filter(x => (!d || x.dept === d) && (!s || String(x.sem) === s));
  }

  function render(){
    const list = filtered();

    /* stats */
    const avgAtt = list.length ? Math.round(list.reduce((a, s) => a + studentAttendancePct(s.id), 0) / list.length) : 0;
    const avgMk  = list.length ? Math.round(list.reduce((a, s) => a + studentAvgMarks(s.id), 0) / list.length) : 0;
    const totalFees = DB.fees.filter(f => list.some(s => s.id === f.studentId)).reduce((a, f) => a + f.total, 0);
    const collected = DB.fees.filter(f => list.some(s => s.id === f.studentId)).reduce((a, f) => a + f.paid, 0);

    $('#rpStats').innerHTML = `
      ${miniStat('Students in Scope', list.length, 'fa-users', 'blue')}
      ${miniStat('Average Attendance', avgAtt + '%', 'fa-calendar-check', avgAtt >= 75 ? 'green' : 'red')}
      ${miniStat('Average Marks', avgMk + '/100', 'fa-chart-line', 'orange')}
      ${miniStat('Fee Collected', inr(collected), 'fa-indian-rupee-sign', 'green')}
      ${miniStat('Outstanding', inr(totalFees - collected), 'fa-triangle-exclamation', 'red')}`;

    /* charts */
    Object.values(charts).forEach(ch => ch.destroy());

    const attByDept = DEPARTMENTS.map(d => {
      const ss = list.filter(s => s.dept === d);
      return ss.length ? Math.round(ss.reduce((a, s) => a + studentAttendancePct(s.id), 0) / ss.length) : 0;
    });
    const perfByDept = DEPARTMENTS.map(d => {
      const ss = list.filter(s => s.dept === d);
      return ss.length ? Math.round(ss.reduce((a, s) => a + studentAvgMarks(s.id), 0) / ss.length) : 0;
    });

    charts.att = new Chart($('#cAtt'), {
      type:'bar',
      data:{ labels:DEPARTMENTS, datasets:[{ label:'Attendance %', data:attByDept,
        backgroundColor:['#0ea5a4','#2563eb','#f59e0b','#a855f7'], borderRadius:8, maxBarThickness:52 }]},
      options:{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ display:false } },
        scales:{ y:{ beginAtZero:true, max:100, grid:{ color:'rgba(148,163,184,.18)' } }, x:{ grid:{ display:false } } } }
    });

    charts.perf = new Chart($('#cPerf'), {
      type:'line',
      data:{ labels:DEPARTMENTS, datasets:[{ label:'Avg marks', data:perfByDept,
        borderColor:'#0ea5a4', backgroundColor:'rgba(20,184,166,.15)', fill:true, tension:.4,
        pointRadius:6, pointBackgroundColor:'#0ea5a4', borderWidth:3 }]},
      options:{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ display:false } },
        scales:{ y:{ beginAtZero:true, max:100, grid:{ color:'rgba(148,163,184,.18)' } }, x:{ grid:{ display:false } } } }
    });

    const feeList = DB.fees.filter(f => list.some(s => s.id === f.studentId));
    const paidC   = feeList.filter(f => f.balance <= 0).length;
    const partialC= feeList.filter(f => f.balance > 0 && f.paid > 0).length;
    const unpaidC = feeList.filter(f => f.paid === 0).length;

    charts.fee = new Chart($('#cFee'), {
      type:'doughnut',
      data:{ labels:['Fully Paid','Partially Paid','Unpaid'], datasets:[{
        data:[paidC, partialC, unpaidC], backgroundColor:['#16a34a','#f59e0b','#dc2626'], borderWidth:0, hoverOffset:8 }]},
      options:{ responsive:true, maintainAspectRatio:false, cutout:'62%',
        plugins:{ legend:{ position:'bottom', labels:{ boxWidth:12, padding:14, font:{ size:11.5 } } } } }
    });

    charts.enrol = new Chart($('#cEnrol'), {
      type:'polarArea',
      data:{ labels:DEPARTMENTS.map(d => DEPT_FULL[d]), datasets:[{
        data:DEPARTMENTS.map(d => list.filter(s => s.dept === d).length),
        backgroundColor:['rgba(14,165,164,.75)','rgba(37,99,235,.75)','rgba(245,158,11,.75)','rgba(168,85,247,.75)'],
        borderWidth:0 }]},
      options:{ responsive:true, maintainAspectRatio:false,
        plugins:{ legend:{ position:'bottom', labels:{ boxWidth:12, padding:12, font:{ size:11 } } } },
        scales:{ r:{ grid:{ color:'rgba(148,163,184,.18)' }, ticks:{ display:false } } } }
    });

    /* department summary */
    $('#deptSummary').innerHTML = `<div class="table-wrap"><table class="data-table">
      <thead><tr><th>Department</th><th>Students</th><th>Avg Attendance</th><th>Avg Marks</th><th>Total Fees</th><th>Collected</th><th>Outstanding</th></tr></thead>
      <tbody>${DEPARTMENTS.map(d => {
        const ss = list.filter(s => s.dept === d);
        if (!ss.length) return `<tr><td><strong>${d}</strong></td><td colspan="6" style="color:var(--muted)">No students in scope</td></tr>`;
        const a = Math.round(ss.reduce((x, s) => x + studentAttendancePct(s.id), 0) / ss.length);
        const m = Math.round(ss.reduce((x, s) => x + studentAvgMarks(s.id), 0) / ss.length);
        const fs = DB.fees.filter(f => ss.some(s => s.id === f.studentId));
        const t = fs.reduce((x, f) => x + f.total, 0);
        const p = fs.reduce((x, f) => x + f.paid, 0);
        return `<tr>
          <td><strong>${d}</strong><div style="font-size:11.4px;color:var(--muted)">${DEPT_FULL[d]}</div></td>
          <td>${ss.length}</td>
          <td>${App.attendanceBadge(a)}</td>
          <td><strong>${m}</strong></td>
          <td>${inr(t)}</td>
          <td style="color:var(--ok);font-weight:600">${inr(p)}</td>
          <td style="color:var(--bad);font-weight:600">${inr(t - p)}</td>
        </tr>`; }).join('')}</tbody></table></div>`;

    /* detail table */
    $('#detailTable').innerHTML = list.length
      ? `<div class="table-wrap"><table class="data-table">
          <thead><tr><th>Student</th><th>ID</th><th>Dept</th><th>Sem</th><th>Attendance</th><th>Avg Marks</th><th>CGPA</th><th>Fee Balance</th><th>Result</th></tr></thead>
          <tbody>${list.map(s => {
            const f = DB.fees.find(x => x.studentId === s.id) || { balance:0 };
            const fail = DB.marks.filter(m => m.studentId === s.id).some(m => m.status === 'Fail');
            return `<tr>
              <td><div class="td-user"><img src="${s.img}" onerror="this.src='https://i.pravatar.cc/60?u=${s.id}'">
                <div><strong>${esc(s.name)}</strong><span>${esc(s.email)}</span></div></div></td>
              <td class="mono">${s.id}</td><td>${s.dept}</td><td>${s.sem}</td>
              <td>${App.attendanceBadge(studentAttendancePct(s.id))}</td>
              <td><strong>${studentAvgMarks(s.id)}</strong></td>
              <td>${studentCGPA(s.id)}</td>
              <td style="color:${f.balance > 0 ? 'var(--bad)' : 'var(--ok)'};font-weight:600">${inr(f.balance)}</td>
              <td>${fail ? '<span class="badge bad">Fail</span>' : '<span class="badge ok">Pass</span>'}</td>
            </tr>`; }).join('')}</tbody></table></div>`
      : App.emptyState('fa-chart-pie','No data','Adjust the filters to generate a report.');
  }

  ['rpDept','rpSem'].forEach(i => $('#' + i).addEventListener('input', render));
  $('#rpType').onchange = () => {
    const t = $('#rpType').value;
    const map = { attendance:'.chart-grid:first-of-type', performance:'.chart-grid:first-of-type',
      fees:'#cFee', enrolment:'#cEnrol', all:null };
    App.toast('Showing report: ' + (t === 'all' ? 'All' : t), 'info', 'Report Filter');
    render();
  };

  $('#rpExport').onclick = () => {
    const list = filtered();
    const rows = [['Student ID','Name','Department','Semester','Attendance %','Avg Marks','CGPA','Total Fees','Paid','Balance','Result']];
    list.forEach(s => {
      const f = DB.fees.find(x => x.studentId === s.id) || { total:0, paid:0, balance:0 };
      const fail = DB.marks.filter(m => m.studentId === s.id).some(m => m.status === 'Fail');
      rows.push([s.id, s.name, s.dept, s.sem, studentAttendancePct(s.id), studentAvgMarks(s.id),
        studentCGPA(s.id), f.total, f.paid, f.balance, fail ? 'Fail' : 'Pass']);
    });
    App.downloadCSV('analytics-report.csv', rows);
  };

  render();
});

function miniStat(label, value, icon, cls){
  return `<div class="stat-card"><div class="stat-top"><div class="stat-icon ${cls}"><i class="fa-solid ${icon}"></i></div></div>
    <div class="stat-label">${label}</div><div class="stat-value">${value}</div></div>`;
}
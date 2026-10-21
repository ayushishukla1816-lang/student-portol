/* ==========================================================
   attendance.js — Mark & review attendance
   ========================================================== */
document.addEventListener('DOMContentLoaded', () => {
  const isStudent = App.isStudent();
  const myId = App.myId();

  App.init({ active:'attendance.html', title: isStudent ? 'My Attendance' : 'Attendance Management',
    subtitle: isStudent ? 'Your day-wise attendance record' : 'Mark daily attendance and track percentages' });

  const c = $('#content');

  if (isStudent) return renderStudent(c, myId);

  c.innerHTML = `
    <div class="card no-print">
      <div class="card-head"><h2><i class="fa-solid fa-clipboard-check"></i>Mark Attendance</h2></div>
      <div class="filter-bar">
        <label class="field"><span>Date</span><input type="date" id="aDate" value="${todayISO()}"></label>
        <label class="field"><span>Department</span><select id="aDept">${DEPARTMENTS.map(d => `<option value="${d}">${d}</option>`).join('')}</select></label>
        <label class="field"><span>Semester</span><select id="aSem">${[1,2,3,4,5,6,7,8].map(s => `<option value="5" ${s===5?'selected':''}>Semester ${s}</option>`).join('')}</select></label>
        <label class="field grow"><span>Subject</span><select id="aSub"></select></label>
        <button class="btn primary" id="saveAtt"><i class="fa-solid fa-floppy-disk"></i>Save Attendance</button>
      </div>
      <div class="card-body tight"><div id="markArea"></div></div>
    </div>

    <div class="card">
      <div class="card-head"><h2><i class="fa-solid fa-chart-simple"></i>Attendance Summary</h2>
        <button class="btn ghost sm no-print" id="expAtt"><i class="fa-solid fa-file-csv"></i>Export CSV</button></div>
      <div class="card-body tight"><div id="summary"></div></div>
    </div>

    <div class="card">
      <div class="card-head"><h2><i class="fa-solid fa-calendar-days"></i>Monthly Calendar</h2></div>
      <div class="filter-bar">
        <label class="field"><span>Student</span><select id="calStu">${DB.students.map(s => `<option value="${s.id}">${esc(s.name)} (${s.id})</option>`).join('')}</select></label>
        <label class="field"><span>Month</span><input type="month" id="calMonth" value="${todayISO().slice(0,7)}"></label>
      </div>
      <div class="card-body"><div id="calArea"></div></div>
    </div>
  `;

  const deptSel = $('#aDept'), semSel = $('#aSem'), subSel = $('#aSub');

  function refreshSubjects(){
    const d = deptSel.value;
    subSel.innerHTML = SUBJECTS[d].map(s => `<option value="${s.code}">${s.code} — ${s.name}</option>`).join('');
    renderMarkArea();
  }
  function refreshStudents(){ renderMarkArea(); }

  deptSel.onchange = refreshSubjects;
  semSel.onchange = refreshStudents;
  subSel.onchange = renderMarkArea;
  $('#aDate').onchange = renderMarkArea;

  let draft = {};

  function renderMarkArea(){
    const d = deptSel.value, sem = semSel.value, sub = subSel.value, date = $('#aDate').value;
    const list = DB.students.filter(s => s.dept === d && String(s.sem) === sem);
    const area = $('#markArea');
    if (!list.length){ area.innerHTML = App.emptyState('fa-user-slash','No students','No students in this department/semester combination.'); return; }

    /* preload existing */
    list.forEach(s => {
      const key = s.id + '|' + sub + '|' + date;
      if (draft[key] === undefined){
        const existing = DB.attendance.find(a => a.studentId === s.id && a.subject === sub && a.date === date);
        draft[key] = existing ? existing.status : 'Present';
      }
    });

    area.innerHTML = `<div class="table-wrap"><table class="data-table">
      <thead><tr><th>Student</th><th>ID</th><th>Overall %</th><th style="text-align:center">Present</th><th style="text-align:center">Absent</th><th style="text-align:center">Leave</th></tr></thead>
      <tbody>${list.map(s => {
        const key = s.id + '|' + sub + '|' + date;
        const cur = draft[key];
        const p = studentAttendancePct(s.id);
        return `<tr>
          <td><div class="td-user"><img src="${s.img}" onerror="this.src='https://i.pravatar.cc/60?u=${s.id}'">
            <div><strong>${esc(s.name)}</strong><span>${esc(s.email)}</span></div></div></td>
          <td class="mono">${s.id}</td>
          <td>${App.attendanceBadge(p)}</td>
          ${['Present','Absent','Leave'].map(st => `<td style="text-align:center">
            <label class="check" style="justify-content:center">
              <input type="radio" name="att_${s.id}" value="${st}" ${cur === st ? 'checked' : ''} data-key="${key}">
            </label></td>`).join('')}
        </tr>`; }).join('')}
      </tbody></table></div>`;

    $$('input[type=radio]', area).forEach(r => r.onchange = () => { draft[r.dataset.key] = r.value; });
  }

  $('#saveAtt').onclick = () => {
    const sub = subSel.value, date = $('#aDate').value;
    const subjectObj = Object.values(SUBJECTS).flat().find(x => x.code === sub);
    let count = 0;
    Object.keys(draft).forEach(key => {
      const [sid, s, d] = key.split('|');
      if (s !== sub || d !== date) return;
      const status = draft[key];
      const existing = DB.attendance.find(a => a.studentId === sid && a.subject === sub && a.date === date);
      if (existing){ existing.status = status; }
      else {
        DB.attendance.push({
          id: uid('ATT'), studentId: sid, subject: sub,
          subjectName: subjectObj ? subjectObj.name : sub,
          date, status, period:'P1'
        });
      }
      count++;
    });
    saveDB();
    App.logActivity(`Marked attendance for ${sub} on ${fmtDate(date)} (${count} students)`);
    App.toast(`Attendance saved for ${count} students.`, 'success', 'Attendance Saved');
    renderSummary();
    renderCalendar();
  };

  function renderSummary(){
    const box = $('#summary');
    const rows = DB.students.map(s => {
      const recs = DB.attendance.filter(a => a.studentId === s.id);
      const p = recs.filter(r => r.status === 'Present').length;
      const a = recs.filter(r => r.status === 'Absent').length;
      const l = recs.filter(r => r.status === 'Leave').length;
      const total = recs.length;
      const pctv = pct(p, total);
      return { s, p, a, l, total, pct: pctv };
    }).sort((x, y) => x.pct - y.pct);

    box.innerHTML = `<div class="table-wrap"><table class="data-table">
      <thead><tr><th>Student</th><th>Department</th><th>Sem</th><th>Sessions</th><th>Present</th><th>Absent</th><th>Leave</th><th>Percentage</th><th>Status</th></tr></thead>
      <tbody>${rows.map(r => `<tr>
        <td><div class="td-user"><img src="${r.s.img}" onerror="this.src='https://i.pravatar.cc/60?u=${r.s.id}'">
          <div><strong>${esc(r.s.name)}</strong><span>${r.s.id}</span></div></div></td>
        <td>${r.s.dept}</td><td>${r.s.sem}</td><td>${r.total}</td>
        <td style="color:var(--ok);font-weight:600">${r.p}</td>
        <td style="color:var(--bad);font-weight:600">${r.a}</td>
        <td style="color:#b45309;font-weight:600">${r.l}</td>
        <td><div class="progress-row"><div class="progress ${r.pct < 75 ? 'bad' : (r.pct < 85 ? 'warn' : '')}"><i style="width:${r.pct}%"></i></div><b>${r.pct}%</b></div></td>
        <td>${r.pct >= 75 ? '<span class="badge ok">Good</span>' : '<span class="badge bad">Low</span>'}</td>
      </tr>`).join('')}</tbody></table></div>`;
  }

  function renderCalendar(){
    const sid = $('#calStu').value;
    const month = $('#calMonth').value;
    if (!month) return;
    const [y, m] = month.split('-').map(Number);
    const first = new Date(y, m - 1, 1);
    const daysInMonth = new Date(y, m, 0).getDate();
    const startDay = first.getDay();
    const recs = DB.attendance.filter(a => a.studentId === sid);

    const byDate = {};
    recs.forEach(r => {
      if (!byDate[r.date]) byDate[r.date] = [];
      byDate[r.date].push(r.status);
    });

    let html = `<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:8px;margin-bottom:10px">
      ${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => `<div style="text-align:center;font-size:11px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:1px">${d}</div>`).join('')}
    </div><div style="display:grid;grid-template-columns:repeat(7,1fr);gap:8px">`;

    for (let i = 0; i < startDay; i++) html += '<div></div>';

    for (let day = 1; day <= daysInMonth; day++){
      const iso = `${y}-${String(m).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
      const statuses = byDate[iso] || [];
      let bg = 'var(--bg)', fg = 'var(--text)', label = '';
      if (statuses.length){
        if (statuses.includes('Absent')){ bg = 'var(--bad-soft)'; fg = 'var(--bad)'; label = 'A'; }
        else if (statuses.includes('Leave')){ bg = 'var(--warn-soft)'; fg = '#b45309'; label = 'L'; }
        else { bg = 'var(--ok-soft)'; fg = 'var(--ok)'; label = 'P'; }
      }
      html += `<div style="border-radius:10px;padding:9px 6px;text-align:center;background:${bg};border:1px solid var(--border)">
        <div style="font-size:12.5px;font-weight:700;color:${fg}">${day}</div>
        <div style="font-size:10.5px;color:${fg};opacity:.85;font-weight:600">${label}</div>
      </div>`;
    }
    html += '</div>';
    html += `<div style="display:flex;gap:18px;margin-top:16px;font-size:12px;color:var(--muted);flex-wrap:wrap">
      <span><span style="display:inline-block;width:11px;height:11px;background:var(--ok-soft);border-radius:3px;margin-right:5px;vertical-align:middle"></span>Present</span>
      <span><span style="display:inline-block;width:11px;height:11px;background:var(--bad-soft);border-radius:3px;margin-right:5px;vertical-align:middle"></span>Absent</span>
      <span><span style="display:inline-block;width:11px;height:11px;background:var(--warn-soft);border-radius:3px;margin-right:5px;vertical-align:middle"></span>Leave</span>
    </div>`;
    $('#calArea').innerHTML = html;
  }

  $('#calStu').onchange = renderCalendar;
  $('#calMonth').onchange = renderCalendar;

  $('#expAtt').onclick = () => {
    const rows = [['Student ID','Name','Department','Semester','Sessions','Present','Absent','Leave','Percentage']];
    DB.students.forEach(s => {
      const recs = DB.attendance.filter(a => a.studentId === s.id);
      const p = recs.filter(r => r.status === 'Present').length;
      const a = recs.filter(r => r.status === 'Absent').length;
      const l = recs.filter(r => r.status === 'Leave').length;
      rows.push([s.id, s.name, s.dept, s.sem, recs.length, p, a, l, pct(p, recs.length) + '%']);
    });
    App.downloadCSV('attendance-report.csv', rows);
  };

  refreshSubjects();
  renderSummary();
  renderCalendar();
});

/* ---------------- Student view ---------------- */
function renderStudent(c, myId){
  const st = studentById(myId);
  const recs = DB.attendance.filter(a => a.studentId === myId);
  const p = recs.filter(r => r.status === 'Present').length;
  const a = recs.filter(r => r.status === 'Absent').length;
  const l = recs.filter(r => r.status === 'Leave').length;
  const overall = pct(p, recs.length);

  /* per-subject */
  const subs = SUBJECTS[st.dept];
  const subRows = subs.map(s => {
    const r = recs.filter(x => x.subject === s.code);
    const pp = r.filter(x => x.status === 'Present').length;
    return { code:s.code, name:s.name, total:r.length, present:pp, pct: pct(pp, r.length) };
  });

  c.innerHTML = `
    <div class="stat-grid">
      ${miniStat('Overall Attendance', overall + '%', 'fa-calendar-check', overall >= 75 ? 'green' : 'red')}
      ${miniStat('Present', p, 'fa-circle-check', 'green')}
      ${miniStat('Absent', a, 'fa-circle-xmark', 'red')}
      ${miniStat('Leave', l, 'fa-plane-departure', 'orange')}
    </div>

    ${overall < 75 ? `<div style="padding:14px 18px;border-radius:12px;background:var(--bad-soft);color:var(--bad);font-size:13.4px;font-weight:600;margin-bottom:22px">
      <i class="fa-solid fa-triangle-exclamation"></i> Your attendance is below the 75% requirement. Please attend classes regularly.</div>` : ''}

    <div class="card">
      <div class="card-head"><h2><i class="fa-solid fa-book"></i>Subject-wise Attendance</h2></div>
      <div class="card-body tight">
        <div class="table-wrap"><table class="data-table">
          <thead><tr><th>Code</th><th>Subject</th><th>Sessions</th><th>Present</th><th>Percentage</th><th>Status</th></tr></thead>
          <tbody>${subRows.map(r => `<tr>
            <td class="mono">${r.code}</td><td>${esc(r.name)}</td><td>${r.total}</td>
            <td style="color:var(--ok);font-weight:600">${r.present}</td>
            <td><div class="progress-row"><div class="progress ${r.pct < 75 ? 'bad' : ''}"><i style="width:${r.pct}%"></i></div><b>${r.pct}%</b></div></td>
            <td>${r.pct >= 75 ? '<span class="badge ok">Good</span>' : '<span class="badge bad">Low</span>'}</td>
          </tr>`).join('')}</tbody></table></div>
      </div>
    </div>

    <div class="card">
      <div class="card-head"><h2><i class="fa-solid fa-list"></i>Attendance History</h2>
        <button class="btn ghost sm no-print" id="expMy"><i class="fa-solid fa-file-csv"></i>Export</button></div>
      <div class="card-body tight">
        ${recs.length ? `<div class="table-wrap"><table class="data-table">
          <thead><tr><th>Date</th><th>Subject</th><th>Period</th><th>Status</th></tr></thead>
          <tbody>${recs.slice().sort((x,y) => new Date(y.date) - new Date(x.date)).map(r => `<tr>
            <td>${fmtDate(r.date)}</td><td>${esc(r.subjectName)}</td><td>${r.period}</td>
            <td>${App.statusBadge(r.status)}</td></tr>`).join('')}</tbody></table></div>`
        : App.emptyState('fa-calendar','No records','Your attendance history will appear here.')}
      </div>
    </div>`;

  const b = $('#expMy');
  if (b) b.onclick = () => {
    const rows = [['Date','Subject','Period','Status']];
    recs.forEach(r => rows.push([r.date, r.subjectName, r.period, r.status]));
    App.downloadCSV('my-attendance.csv', rows);
  };
}
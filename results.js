/* ==========================================================
   results.js — Examination & Results
   ========================================================== */
document.addEventListener('DOMContentLoaded', () => {
  const isStudent = App.isStudent();
  const myId = App.myId();

  App.init({ active:'results.html', title: isStudent ? 'My Results' : 'Examinations & Results',
    subtitle: isStudent ? 'Subject-wise marks and grades' : 'Marks, grades and report cards' });

  const c = $('#content');

  if (isStudent){ renderReportCard(c, myId, true); return; }

  c.innerHTML = `
    <div class="card no-print">
      <div class="card-head"><h2><i class="fa-solid fa-table-list"></i>Result Overview</h2>
        <div class="btn-group">
          <button class="btn ghost sm" id="expRes"><i class="fa-solid fa-file-csv"></i>Export CSV</button>
          <button class="btn ghost sm" onclick="window.print()"><i class="fa-solid fa-print"></i>Print</button>
        </div></div>
      <div class="filter-bar">
        <label class="field grow"><span>Search</span><input id="rSearch" placeholder="Search by name or ID…"></label>
        <label class="field"><span>Department</span><select id="rDept"><option value="">All</option>${DEPARTMENTS.map(d => `<option>${d}</option>`).join('')}</select></label>
        <label class="field"><span>Semester</span><select id="rSem"><option value="">All</option>${[1,2,3,4,5,6,7,8].map(s => `<option>${s}</option>`).join('')}</select></label>
        <label class="field"><span>Result</span><select id="rStatus"><option value="">All</option><option>Pass</option><option>Fail</option></select></label>
      </div>
      <div class="card-body tight"><div id="resTable"></div></div>
    </div>`;

  let view = DB.students.slice();

  function apply(){
    const q = $('#rSearch').value.trim().toLowerCase();
    const d = $('#rDept').value, s = $('#rSem').value, st = $('#rStatus').value;
    view = DB.students.filter(x =>
      (!q || x.name.toLowerCase().includes(q) || x.id.toLowerCase().includes(q)) &&
      (!d || x.dept === d) && (!s || String(x.sem) === s));
    if (st){
      view = view.filter(x => {
        const m = DB.marks.filter(mk => mk.studentId === x.id);
        return st === 'Pass' ? m.every(mk => mk.status === 'Pass') : m.some(mk => mk.status === 'Fail');
      });
    }
    render();
  }

  function render(){
    const box = $('#resTable');
    if (!view.length){ box.innerHTML = App.emptyState('fa-file-circle-xmark','No results found','Adjust the filters to see records.'); return; }

    box.innerHTML = `<div class="table-wrap"><table class="data-table" id="resTbl">
      <thead><tr>
        <th class="sortable" data-col="0">Student</th>
        <th class="sortable" data-col="1">ID</th>
        <th class="sortable" data-col="2">Dept</th>
        <th class="sortable" data-col="3">Sem</th>
        <th>Subjects</th>
        <th class="sortable" data-col="5">Total</th>
        <th class="sortable" data-col="6">Avg</th>
        <th class="sortable" data-col="7">CGPA</th>
        <th>Result</th>
        <th>Actions</th>
      </tr></thead>
      <tbody>${view.map(s => {
        const m = DB.marks.filter(x => x.studentId === s.id);
        const total = m.reduce((a, b) => a + b.total, 0);
        const avg = m.length ? Math.round(total / m.length) : 0;
        const fail = m.some(x => x.status === 'Fail');
        const cg = studentCGPA(s.id);
        return `<tr>
          <td><div class="td-user"><img src="${s.img}" onerror="this.src='https://i.pravatar.cc/60?u=${s.id}'">
            <div><strong>${esc(s.name)}</strong><span>${esc(s.email)}</span></div></div></td>
          <td class="mono">${s.id}</td><td>${s.dept}</td><td>${s.sem}</td>
          <td>${m.length}</td><td><strong>${total}</strong></td>
          <td>${avg}</td><td><strong>${cg}</strong></td>
          <td>${fail ? '<span class="badge bad">Fail</span>' : '<span class="badge ok">Pass</span>'}</td>
          <td><div class="td-actions">
            <button class="btn-icon" data-view="${s.id}" title="Report Card"><i class="fa-solid fa-file-lines"></i></button>
            <button class="btn-icon" data-edit="${s.id}" title="Edit Marks"><i class="fa-solid fa-pen"></i></button>
          </div></td>
        </tr>`; }).join('')}
      </tbody></table></div>`;

    App.makeSortable($('#resTbl'));
    $$('[data-view]', box).forEach(b => b.onclick = () => viewReport(b.dataset.view));
    $$('[data-edit]', box).forEach(b => b.onclick = () => editMarks(b.dataset.edit));
  }

  function viewReport(id){
    const s = studentById(id);
    const m = DB.marks.filter(x => x.studentId === id);
    const total = m.reduce((a, b) => a + b.total, 0);
    const avg = m.length ? Math.round(total / m.length) : 0;
    App.modal({
      title:'Report Card — ' + s.name, wide:true, okText:'Print', cancelText:'Close',
      onOk: () => { setTimeout(() => window.print(), 200); },
      body:`
        <div class="print-header"><h2>Smart Student Portal — Report Card</h2>
          <p>${esc(s.name)} · ${s.id} · Semester ${s.sem} · ${DEPT_FULL[s.dept]}</p></div>
        <div style="display:flex;gap:16px;align-items:center;margin-bottom:18px;flex-wrap:wrap">
          <img src="${s.img}" class="avatar lg" onerror="this.src='https://i.pravatar.cc/150?u=${s.id}'">
          <div><strong style="font-size:16px">${esc(s.name)}</strong>
            <div style="font-size:12.5px;color:var(--muted)">${s.id} · Semester ${s.sem} · Section ${s.section}</div>
            <div style="margin-top:7px;display:flex;gap:8px;flex-wrap:wrap">
              <span class="badge teal">CGPA ${studentCGPA(id)}</span>
              <span class="badge info">Average ${avg}/100</span>
              ${m.some(x => x.status === 'Fail') ? '<span class="badge bad">Fail</span>' : '<span class="badge ok">Pass</span>'}
            </div></div>
        </div>
        <div class="table-wrap"><table class="data-table" style="min-width:0">
          <thead><tr><th>Code</th><th>Subject</th><th>Int /20</th><th>Prac /20</th><th>Asg /10</th><th>Final /50</th><th>Total</th><th>Grade</th></tr></thead>
          <tbody>${m.map(x => `<tr><td class="mono">${x.subject}</td><td>${esc(x.subjectName)}</td>
            <td>${x.internal}</td><td>${x.practical}</td><td>${x.assignment}</td><td>${x.final}</td>
            <td><strong>${x.total}</strong></td><td><span class="badge teal">${x.grade}</span></td></tr>`).join('')}</tbody>
          <tfoot><tr style="background:var(--bg);font-weight:800">
            <td colspan="6" style="text-align:right">AGGREGATE</td><td>${total}</td><td>${avg}%</td></tr></tfoot>
        </table></div>`
    });
  }

  function editMarks(id){
    const s = studentById(id);
    const rows = DB.marks.filter(x => x.studentId === id);
    App.modal({
      title:'Edit Marks — ' + s.name, wide:true, okText:'Save Marks',
      body:`<div style="max-height:52vh;overflow-y:auto">
        ${rows.map(m => `<div style="border:1px solid var(--border);border-radius:11px;padding:14px;margin-bottom:12px">
          <div style="font-weight:700;font-size:13.4px;margin-bottom:11px">${m.subject} — ${esc(m.subjectName)}</div>
          <div class="form-grid" style="gap:0 12px">
            <label class="field" style="margin-bottom:0"><span>Internal /20</span><input type="number" min="0" max="20" value="${m.internal}" data-f="internal" data-m="${m.id}"></label>
            <label class="field" style="margin-bottom:0"><span>Practical /20</span><input type="number" min="0" max="20" value="${m.practical}" data-f="practical" data-m="${m.id}"></label>
            <label class="field" style="margin-bottom:0"><span>Assignment /10</span><input type="number" min="0" max="10" value="${m.assignment}" data-f="assignment" data-m="${m.id}"></label>
            <label class="field" style="margin-bottom:0"><span>Final /50</span><input type="number" min="0" max="50" value="${m.final}" data-f="final" data-m="${m.id}"></label>
          </div></div>`).join('')}
      </div>`,
      onOk:(back) => {
        $$('input[data-m]', back).forEach(inp => {
          const m = DB.marks.find(x => x.id === inp.dataset.m);
          if (!m) return;
          let v = Number(inp.value);
          const max = { internal:20, practical:20, assignment:10, final:50 }[inp.dataset.f];
          if (isNaN(v) || v < 0 || v > max){ v = Math.min(Math.max(0, v || 0), max); }
          m[inp.dataset.f] = v;
          m.total = m.internal + m.practical + m.assignment + m.final;
          m.grade = gradeFor(m.total);
          m.status = m.total >= 40 ? 'Pass' : 'Fail';
        });
        saveDB();
        App.logActivity('Updated marks for ' + s.name);
        App.toast('Marks updated for ' + s.name, 'success', 'Saved');
        apply();
      }
    });
  }

  ['rSearch','rDept','rSem','rStatus'].forEach(i => $('#' + i).addEventListener('input', apply));
  $('#expRes').onclick = () => {
    const rows = [['ID','Name','Department','Semester','Subject Code','Subject','Internal','Practical','Assignment','Final','Total','Grade','Result']];
    view.forEach(s => {
      DB.marks.filter(m => m.studentId === s.id).forEach(m => {
        rows.push([s.id, s.name, s.dept, s.sem, m.subject, m.subjectName, m.internal, m.practical, m.assignment, m.final, m.total, m.grade, m.status]);
      });
    });
    App.downloadCSV('results.csv', rows);
  };

  apply();
});

/* ---------------- Student report card ---------------- */
function renderReportCard(c, myId, own){
  const s = studentById(myId);
  if (!s){ c.innerHTML = App.emptyState('fa-user-slash','Profile not found',''); return; }
  const m = DB.marks.filter(x => x.studentId === myId);
  const total = m.reduce((a, b) => a + b.total, 0);
  const avg = m.length ? Math.round(total / m.length) : 0;
  const cg = studentCGPA(myId);
  const fail = m.some(x => x.status === 'Fail');

  c.innerHTML = `
    <div class="profile-hero no-print">
      <img class="avatar xl" src="${s.img}" onerror="this.src='https://i.pravatar.cc/300?u=${s.id}'">
      <div class="profile-hero-info">
        <h2>${esc(s.name)}</h2>
        <div class="ph-roll">${s.id} · Semester ${s.sem} · ${DEPT_FULL[s.dept]}</div>
        <div class="ph-meta">
          <span><i class="fa-solid fa-award"></i>CGPA ${cg}</span>
          <span><i class="fa-solid fa-chart-line"></i>Average ${avg}/100</span>
          <span><i class="fa-solid fa-flag-checkered"></i>${fail ? 'Backlog present' : 'All clear'}</span>
        </div>
      </div>
      <div class="ph-actions">
        <button class="btn primary" onclick="window.print()"><i class="fa-solid fa-print"></i>Print Report Card</button>
      </div>
    </div>

    <div class="print-header">
      <h2 style="margin-bottom:4px">Smart Student Portal — Official Report Card</h2>
      <p style="font-size:12px">${esc(s.name)} · ${s.id} · Semester ${s.sem} · ${DEPT_FULL[s.dept]}</p>
    </div>

    <div class="card">
      <div class="card-head"><h2><i class="fa-solid fa-file-lines"></i>Subject-wise Performance</h2></div>
      <div class="card-body tight">
        <div class="table-wrap"><table class="data-table">
          <thead><tr><th>Code</th><th>Subject</th><th>Credits</th><th>Internal /20</th><th>Practical /20</th><th>Assign /10</th><th>Final /50</th><th>Total</th><th>Grade</th><th>Result</th></tr></thead>
          <tbody>${m.map(x => `<tr>
            <td class="mono">${x.subject}</td><td>${esc(x.subjectName)}</td><td>${x.credits}</td>
            <td>${x.internal}</td><td>${x.practical}</td><td>${x.assignment}</td><td>${x.final}</td>
            <td><strong>${x.total}</strong></td>
            <td><span class="badge teal">${x.grade}</span></td>
            <td>${App.statusBadge(x.status)}</td></tr>`).join('')}</tbody>
          <tfoot><tr style="background:var(--bg);font-weight:800">
            <td colspan="7" style="text-align:right">AGGREGATE</td><td>${total}</td><td colspan="2">${avg}% · CGPA ${cg}</td></tr></tfoot>
        </table></div>
      </div>
    </div>

    <div class="card">
      <div class="card-head"><h2><i class="fa-solid fa-medal"></i>Grade Scale</h2></div>
      <div class="card-body">
        <div style="display:flex;gap:10px;flex-wrap:wrap">
          ${[['O','90-100','10'],['A+','80-89','9'],['A','70-79','8'],['B+','60-69','7'],['B','50-59','6'],['C','40-49','5'],['F','Below 40','0']]
            .map(g => `<div style="padding:9px 15px;border-radius:9px;background:var(--bg);border:1px solid var(--border);font-size:12.4px">
              <strong style="color:var(--teal)">${g[0]}</strong> · ${g[1]} · GP ${g[2]}</div>`).join('')}
        </div>
      </div>
    </div>`;
}
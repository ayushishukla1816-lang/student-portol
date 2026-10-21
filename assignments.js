/* ==========================================================
   assignments.js — Assignment management
   ========================================================== */
document.addEventListener('DOMContentLoaded', () => {
  const isStudent = App.isStudent();
  const myId = App.myId();
  const myDept = isStudent ? (studentById(myId) || {}).dept : null;

  App.init({ active:'assignments.html', title: isStudent ? 'My Assignments' : 'Assignment Management',
    subtitle: isStudent ? 'Track deadlines and submission status' : 'Create, grade and track assignments' });

  const c = $('#content');
  const isAdmin = App.isAdmin();

  c.innerHTML = `
    <div class="stat-grid" id="asgStats"></div>

    <div class="card">
      <div class="card-head">
        <h2><i class="fa-solid fa-clipboard-list"></i>Assignments</h2>
        <div class="btn-group no-print">
          <button class="btn ghost sm" id="expAsg"><i class="fa-solid fa-file-csv"></i>Export</button>
          ${isAdmin ? '<button class="btn primary sm" id="addAsg"><i class="fa-solid fa-plus"></i>New Assignment</button>' : ''}
        </div>
      </div>
      <div class="filter-bar">
        <label class="field grow"><span>Search</span><input id="aSearch" placeholder="Search by title or subject…"></label>
        <label class="field"><span>Status</span><select id="aStatus"><option value="">All</option><option>Pending</option><option>Submitted</option><option>Graded</option></select></label>
        <label class="field"><span>Subject</span><select id="aSubject"><option value="">All Subjects</option>
          ${Object.keys(SUBJECTS).flatMap(d => SUBJECTS[d]).map(s => `<option value="${s.code}">${s.code} — ${s.name}</option>`).join('')}
        </select></label>
      </div>
      <div class="card-body tight"><div id="asgTable"></div></div>
    </div>`;

  function list(){
    let arr = DB.assignments.slice();
    if (isStudent) arr = arr.filter(a => a.submissions && a.submissions[myId] !== undefined);
    const q = $('#aSearch').value.trim().toLowerCase();
    const st = $('#aStatus').value;
    const sub = $('#aSubject').value;
    return arr.filter(a => {
      const status = isStudent ? a.submissions[myId] : null;
      return (!q || a.title.toLowerCase().includes(q) || subjectName(a.subject).toLowerCase().includes(q)) &&
             (!st || status === st || (!isStudent && st === 'Pending' && Object.values(a.submissions).includes('Pending'))) &&
             (!sub || a.subject === sub);
    }).sort((x, y) => new Date(x.deadline) - new Date(y.deadline));
  }

  function renderStats(){
    const arr = isStudent ? DB.assignments.filter(a => a.submissions && a.submissions[myId]) : DB.assignments;
    let pending, submitted, graded, overdue;
    if (isStudent){
      pending = arr.filter(a => a.submissions[myId] === 'Pending').length;
      submitted = arr.filter(a => a.submissions[myId] === 'Submitted').length;
      graded = arr.filter(a => a.submissions[myId] === 'Graded').length;
      overdue = arr.filter(a => a.submissions[myId] === 'Pending' && new Date(a.deadline) < new Date()).length;
    } else {
      const all = Object.values(arr.reduce((o, a) => { Object.entries(a.submissions).forEach(([k, v]) => o[k + a.id] = v); return o; }, {}));
      pending = all.filter(v => v === 'Pending').length;
      submitted = all.filter(v => v === 'Submitted').length;
      graded = all.filter(v => v === 'Graded').length;
      overdue = arr.filter(a => new Date(a.deadline) < new Date()).length;
    }
    $('#asgStats').innerHTML = `
      ${miniStat('Total', arr.length, 'fa-clipboard-list', 'blue')}
      ${miniStat('Pending', pending, 'fa-hourglass-half', 'orange')}
      ${miniStat('Submitted', submitted, 'fa-paper-plane', 'blue')}
      ${miniStat('Graded', graded, 'fa-circle-check', 'green')}
      ${miniStat('Overdue', overdue, 'fa-triangle-exclamation', overdue > 0 ? 'red' : 'green')}`;
  }

  function render(){
    renderStats();
    const rows = list();
    const box = $('#asgTable');
    if (!rows.length){ box.innerHTML = App.emptyState('fa-clipboard','No assignments','Nothing matches your filters.'); return; }

    box.innerHTML = `<div class="table-wrap"><table class="data-table">
      <thead><tr>
        <th>Title</th><th>Subject</th>${isStudent ? '' : '<th>Department</th>'}
        <th>Deadline</th><th>Max Marks</th>${isStudent ? '<th>My Status</th>' : '<th>Submissions</th>'}<th>Actions</th>
      </tr></thead>
      <tbody>${rows.map(a => {
        const overdue = new Date(a.deadline) < new Date();
        const myStatus = isStudent ? a.submissions[myId] : null;
        const counts = { Pending:0, Submitted:0, Graded:0 };
        Object.values(a.submissions).forEach(v => counts[v]++);
        return `<tr>
          <td><strong style="font-size:13.3px">${esc(a.title)}</strong>
            <div style="font-size:11.6px;color:var(--muted);max-width:320px">${esc(a.desc.slice(0, 72))}${a.desc.length > 72 ? '…' : ''}</div></td>
          <td class="mono">${a.subject}</td>
          ${isStudent ? '' : `<td><span class="badge grey">${a.dept}</span></td>`}
          <td>${fmtDate(a.deadline)} ${overdue ? '<span class="badge bad" style="margin-left:5px">Overdue</span>' : ''}</td>
          <td>${a.maxMarks}</td>
          ${isStudent
            ? `<td>${App.statusBadge(myStatus)}</td>`
            : `<td style="font-size:12.4px"><span class="badge ok">${counts.Graded}</span> <span class="badge info">${counts.Submitted}</span> <span class="badge warn">${counts.Pending}</span></td>`}
          <td><div class="td-actions">
            <button class="btn-icon" data-view="${a.id}" title="Details"><i class="fa-solid fa-eye"></i></button>
            ${isAdmin ? `<button class="btn-icon" data-edit="${a.id}" title="Edit"><i class="fa-solid fa-pen"></i></button>
            <button class="btn-icon danger" data-del="${a.id}" title="Delete"><i class="fa-solid fa-trash"></i></button>` : ''}
          </div></td>
        </tr>`; }).join('')}</tbody></table></div>`;

    $$('[data-view]', box).forEach(b => b.onclick = () => details(b.dataset.view));
    $$('[data-edit]', box).forEach(b => b.onclick = () => openForm(DB.assignments.find(x => x.id === b.dataset.edit)));
    $$('[data-del]', box).forEach(b => b.onclick = () => del(b.dataset.del));
  }

  function details(id){
    const a = DB.assignments.find(x => x.id === id);
    if (isStudent){
      App.modal({
        title: a.title, okText:'Mark as Submitted', cancelText:'Close',
        onOk:() => {
          a.submissions[myId] = 'Submitted';
          saveDB();
          App.logActivity('Submitted assignment: ' + a.title);
          App.toast('Assignment marked as submitted.', 'success', 'Submitted');
          render();
        },
        body:`<div class="info-item"><span>Subject</span><strong>${a.subject} — ${esc(subjectName(a.subject))}</strong></div>
          <div class="info-item"><span>Deadline</span><strong>${fmtDate(a.deadline)}</strong></div>
          <div class="info-item"><span>Max Marks</span><strong>${a.maxMarks}</strong></div>
          <div class="info-item"><span>Status</span><strong>${App.statusBadge(a.submissions[myId])}</strong></div>
          <div class="section-title">Description</div>
          <p style="font-size:13.4px;line-height:1.7;color:var(--muted)">${esc(a.desc)}</p>`
      });
    } else {
      App.modal({
        title: a.title, wide:true, okText:'Save Statuses',
        body:`
          <div class="info-item"><span>Subject</span><strong>${a.subject} — ${esc(subjectName(a.subject))}</strong></div>
          <div class="info-item"><span>Deadline</span><strong>${fmtDate(a.deadline)} · Max ${a.maxMarks} marks</strong></div>
          <div class="section-title">Description</div>
          <p style="font-size:13.4px;line-height:1.7;color:var(--muted);margin-bottom:18px">${esc(a.desc)}</p>
          <div class="section-title">Submission Status</div>
          <div class="table-wrap"><table class="data-table" style="min-width:0">
            <thead><tr><th>Student</th><th>Status</th></tr></thead>
            <tbody>${Object.keys(a.submissions).map(sid => {
              const s = studentById(sid); if (!s) return '';
              return `<tr><td><div class="td-user" style="min-width:0"><img src="${s.img}" style="width:30px;height:30px;border-radius:50%" onerror="this.src='https://i.pravatar.cc/40?u=${sid}'">
                <div><strong style="font-size:12.8px">${esc(s.name)}</strong><span>${sid}</span></div></div></td>
                <td><select data-sid="${sid}" style="padding:5px 9px;border-radius:7px;border:1px solid var(--border);background:var(--card);font-size:12.3px">
                  ${['Pending','Submitted','Graded'].map(v => `<option ${a.submissions[sid] === v ? 'selected' : ''}>${v}</option>`).join('')}
                </select></td></tr>`;
            }).join('')}</tbody></table></div>`,
        onOk:(back) => {
          $$('select[data-sid]', back).forEach(sel => { a.submissions[sel.dataset.sid] = sel.value; });
          saveDB();
          App.toast('Submission statuses updated.', 'success', 'Saved');
          render();
        }
      });
    }
  }

  function openForm(a){
    const isEdit = !!a;
    a = a || { id:'', title:'', subject:'CS501', dept:'CSE', desc:'', maxMarks:20, deadline:todayISO(), submissions:{} };

    App.modal({
      title: isEdit ? 'Edit Assignment' : 'New Assignment', wide:true,
      okText: isEdit ? 'Update' : 'Create',
      body:`
        <label class="field"><span>Title *</span><input id="gTitle" value="${esc(a.title)}"></label>
        <div class="form-grid two">
          <label class="field"><span>Department</span><select id="gDept">${DEPARTMENTS.map(d => `<option ${d === a.dept ? 'selected' : ''}>${d}</option>`).join('')}</select></label>
          <label class="field"><span>Subject</span><select id="gSub"></select></label>
          <label class="field"><span>Max Marks</span><input id="gMax" type="number" value="${a.maxMarks}"></label>
          <label class="field"><span>Deadline</span><input id="gDue" type="date" value="${a.deadline}"></label>
        </div>
        <label class="field"><span>Description</span><textarea id="gDesc">${esc(a.desc)}</textarea></label>
      `,
      onOk:(back) => {
        const title = $('#gTitle', back).value.trim();
        if (!title){ App.toast('Title is required.', 'error', 'Validation'); return false; }
        const dept = $('#gDept', back).value;
        const sub = $('#gSub', back).value;
        const subs = a.submissions || {};
        DB.students.filter(s => s.dept === dept).forEach(s => { if (subs[s.id] === undefined) subs[s.id] = 'Pending'; });
        const obj = {
          id: isEdit ? a.id : uid('ASG'),
          title, subject: sub, dept,
          desc: $('#gDesc', back).value.trim(),
          maxMarks: Number($('#gMax', back).value) || 10,
          deadline: $('#gDue', back).value,
          created: a.created || todayISO(),
          submissions: subs
        };
        if (isEdit) DB.assignments[DB.assignments.findIndex(x => x.id === a.id)] = obj;
        else DB.assignments.push(obj);
        saveDB();
        App.logActivity((isEdit ? 'Updated' : 'Created') + ' assignment: ' + title);
        App.toast('Assignment ' + (isEdit ? 'updated' : 'created') + '.', 'success', 'Saved');
        render();
      }
    });

    setTimeout(() => {
      const back = $('.modal-backdrop');
      const dSel = $('#gDept', back), sSel = $('#gSub', back);
      const fill = () => {
        sSel.innerHTML = SUBJECTS[dSel.value].map(s => `<option value="${s.code}" ${s.code === a.subject ? 'selected' : ''}>${s.code} — ${s.name}</option>`).join('');
      };
      dSel.onchange = fill;
      fill();
    }, 30);
  }

  function del(id){
    const a = DB.assignments.find(x => x.id === id);
    App.confirm(`Delete the assignment <strong>${esc(a.title)}</strong>?`, () => {
      DB.assignments = DB.assignments.filter(x => x.id !== id);
      saveDB();
      App.logActivity('Deleted assignment: ' + a.title);
      App.toast('Assignment deleted.', 'warn', 'Deleted');
      render();
    }, { title:'Delete Assignment', okText:'Yes, Delete' });
  }

  ['aSearch','aStatus','aSubject'].forEach(i => $('#' + i).addEventListener('input', render));
  const aa = $('#addAsg');
  if (aa) aa.onclick = () => openForm(null);
  $('#expAsg').onclick = () => {
    const rows = [['ID','Title','Subject','Department','Deadline','Max Marks']];
    list().forEach(a => rows.push([a.id, a.title, a.subject, a.dept, a.deadline, a.maxMarks]));
    App.downloadCSV('assignments.csv', rows);
  };

  render();
});

function miniStat(label, value, icon, cls){
  return `<div class="stat-card"><div class="stat-top"><div class="stat-icon ${cls}"><i class="fa-solid ${icon}"></i></div></div>
    <div class="stat-label">${label}</div><div class="stat-value">${value}</div></div>`;
}
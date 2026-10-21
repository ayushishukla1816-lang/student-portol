/* ==========================================================
   courses.js — Courses & Subjects
   ========================================================== */
document.addEventListener('DOMContentLoaded', () => {
  App.init({ active:'courses.html', title:'Courses & Subjects', subtitle:'Programmes, subjects, credits and faculty' });

  const c = $('#content');
  const isAdmin = App.isAdmin();

  c.innerHTML = `
    <div class="tabs">
      <button class="tab active" data-tab="programmes">Programmes</button>
      <button class="tab" data-tab="subjects">Subjects</button>
    </div>

    <div class="tab-panel active" id="panel-programmes">
      <div class="card">
        <div class="card-head">
          <h2><i class="fa-solid fa-book"></i>All Programmes</h2>
          ${isAdmin ? '<button class="btn primary sm" id="addCourse"><i class="fa-solid fa-plus"></i>Add Programme</button>' : ''}
        </div>
        <div class="filter-bar">
          <label class="field grow"><span>Search</span><input id="cSearch" placeholder="Search programmes…"></label>
          <label class="field"><span>Department</span><select id="cDept"><option value="">All</option>${DEPARTMENTS.map(d => `<option>${d}</option>`).join('')}</select></label>
        </div>
        <div class="card-body"><div class="report-grid" id="courseGrid"></div></div>
      </div>
    </div>

    <div class="tab-panel" id="panel-subjects">
      <div class="card">
        <div class="card-head"><h2><i class="fa-solid fa-list-check"></i>Subject Catalogue</h2>
          <span class="badge teal">${Object.values(SUBJECTS).flat().length} subjects</span></div>
        <div class="card-body tight">
          <div class="table-wrap"><table class="data-table">
            <thead><tr><th>Code</th><th>Subject</th><th>Department</th><th>Credits</th><th>Faculty</th><th>Enrolled</th></tr></thead>
            <tbody>${Object.keys(SUBJECTS).flatMap(d => SUBJECTS[d].map(s => `<tr>
              <td class="mono">${s.code}</td><td>${esc(s.name)}</td>
              <td><span class="badge grey">${d}</span></td><td>${s.credits}</td>
              <td>${esc(facultyName(s.faculty))}</td>
              <td>${deptCount(d)}</td>
            </tr>`)).join('')}</tbody></table></div>
        </div>
      </div>
    </div>
  `;

  $$('.tab').forEach(t => t.onclick = () => {
    $$('.tab').forEach(x => x.classList.remove('active'));
    $$('.tab-panel').forEach(x => x.classList.remove('active'));
    t.classList.add('active');
    $('#panel-' + t.dataset.tab).classList.add('active');
  });

  let view = DB.courses.slice();

  function apply(){
    const q = $('#cSearch').value.trim().toLowerCase();
    const d = $('#cDept').value;
    view = DB.courses.filter(x =>
      (!q || x.name.toLowerCase().includes(q) || x.code.toLowerCase().includes(q)) &&
      (!d || x.dept === d));
    render();
  }

  function render(){
    const g = $('#courseGrid');
    if (!view.length){ g.innerHTML = App.emptyState('fa-book','No programmes found','Try a different search.'); return; }
    g.innerHTML = view.map(co => `
      <div class="card" style="margin:0">
        <div class="card-head">
          <h3 style="font-size:14.5px"><i class="fa-solid fa-graduation-cap"></i>${esc(co.name)}</h3>
          <span class="badge teal">${co.code}</span>
        </div>
        <div class="card-body">
          <p style="font-size:13px;color:var(--muted);line-height:1.65;margin-bottom:14px">${esc(co.desc)}</p>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;font-size:12.6px;margin-bottom:14px">
            <div><span style="color:var(--muted)">Department</span><br><strong>${co.dept}</strong></div>
            <div><span style="color:var(--muted)">Duration</span><br><strong>${co.duration}</strong></div>
            <div><span style="color:var(--muted)">Total Credits</span><br><strong>${co.credits}</strong></div>
            <div><span style="color:var(--muted)">Intake</span><br><strong>${co.seats} seats</strong></div>
            <div><span style="color:var(--muted)">Annual Fee</span><br><strong>${inr(co.fee)}</strong></div>
            <div><span style="color:var(--muted)">Enrolled</span><br><strong>${deptCount(co.dept)} students</strong></div>
          </div>
          <div class="section-title" style="margin-top:0">Learning Objectives</div>
          <ul style="list-style:none;display:flex;flex-direction:column;gap:7px">
            ${co.objectives.map(o => `<li style="display:flex;gap:9px;font-size:12.6px;align-items:flex-start">
              <i class="fa-solid fa-check" style="color:var(--teal);margin-top:3px;font-size:11px"></i>${esc(o)}</li>`).join('')}
          </ul>
        </div>
        ${isAdmin ? `<div class="card-head" style="border-top:1px solid var(--border);border-bottom:none;justify-content:flex-end">
          <div class="btn-group">
            <button class="btn ghost sm" data-edit="${co.id}"><i class="fa-solid fa-pen"></i>Edit</button>
            <button class="btn danger sm" data-del="${co.id}"><i class="fa-solid fa-trash"></i>Delete</button>
          </div></div>` : ''}
      </div>`).join('');

    $$('[data-edit]', g).forEach(b => b.onclick = () => openForm(DB.courses.find(x => x.id === b.dataset.edit)));
    $$('[data-del]', g).forEach(b => b.onclick = () => del(b.dataset.del));
  }

  function openForm(co){
    const isEdit = !!co;
    co = co || { id:'', code:'', name:'', dept:'CSE', duration:'4 Years', credits:160,
      semesters:8, seats:60, fee:80000, desc:'', objectives:[] };

    App.modal({
      title: isEdit ? 'Edit Programme' : 'Add Programme', wide:true,
      okText: isEdit ? 'Update' : 'Create',
      body:`
        <div class="form-grid two">
          <label class="field"><span>Programme Code *</span><input id="kCode" value="${esc(co.code)}" placeholder="BT-CSE"></label>
          <label class="field"><span>Department</span><select id="kDept">${DEPARTMENTS.map(d => `<option ${d === co.dept ? 'selected' : ''}>${d}</option>`).join('')}</select></label>
        </div>
        <label class="field"><span>Programme Name *</span><input id="kName" value="${esc(co.name)}"></label>
        <div class="form-grid three">
          <label class="field"><span>Duration</span><input id="kDur" value="${esc(co.duration)}"></label>
          <label class="field"><span>Total Credits</span><input id="kCr" type="number" value="${co.credits}"></label>
          <label class="field"><span>Intake Seats</span><input id="kSeats" type="number" value="${co.seats}"></label>
        </div>
        <label class="field"><span>Annual Fee (₹)</span><input id="kFee" type="number" value="${co.fee}"></label>
        <label class="field"><span>Description</span><textarea id="kDesc">${esc(co.desc)}</textarea></label>
        <label class="field"><span>Learning Objectives (one per line)</span><textarea id="kObj">${esc((co.objectives || []).join('\n'))}</textarea></label>
      `,
      onOk:(back) => {
        const code = $('#kCode', back).value.trim();
        const name = $('#kName', back).value.trim();
        if (!code || !name){ App.toast('Code and name are required.', 'error', 'Validation'); return false; }
        const obj = {
          id: isEdit ? co.id : uid('C'),
          code, name,
          dept:$('#kDept', back).value, duration:$('#kDur', back).value.trim(),
          credits:Number($('#kCr', back).value) || 0,
          semesters:8, seats:Number($('#kSeats', back).value) || 0,
          fee:Number($('#kFee', back).value) || 0,
          desc:$('#kDesc', back).value.trim(),
          objectives:$('#kObj', back).value.split('\n').map(x => x.trim()).filter(Boolean)
        };
        if (isEdit){ DB.courses[DB.courses.findIndex(x => x.id === co.id)] = obj; }
        else DB.courses.push(obj);
        saveDB();
        App.logActivity((isEdit ? 'Updated' : 'Added') + ' programme: ' + name);
        App.toast('Programme ' + (isEdit ? 'updated' : 'created') + '.', 'success', 'Saved');
        apply();
      }
    });
  }

  function del(id){
    const co = DB.courses.find(x => x.id === id);
    App.confirm(`Delete the programme <strong>${esc(co.name)}</strong>?`, () => {
      DB.courses = DB.courses.filter(x => x.id !== id);
      saveDB();
      App.logActivity('Deleted programme: ' + co.name);
      App.toast('Programme deleted.', 'warn', 'Deleted');
      apply();
    }, { title:'Delete Programme', okText:'Yes, Delete' });
  }

  ['cSearch','cDept'].forEach(i => $('#' + i).addEventListener('input', apply));
  const ac = $('#addCourse');
  if (ac) ac.onclick = () => openForm(null);

  apply();
});
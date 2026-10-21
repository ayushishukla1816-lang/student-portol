/* ==========================================================
   faculty.js — Faculty management
   ========================================================== */
document.addEventListener('DOMContentLoaded', () => {
  App.init({ active:'faculty.html', title:'Faculty Management', subtitle:'Teaching staff profiles and assignments' });

  const c = $('#content');
  const isAdmin = App.isAdmin();

  c.innerHTML = `
    <div class="card">
      <div class="card-head">
        <h2><i class="fa-solid fa-chalkboard-user"></i>Faculty Members <span class="badge teal" id="facCount"></span></h2>
        ${isAdmin ? '<button class="btn primary sm" id="addFac"><i class="fa-solid fa-plus"></i>Add Faculty</button>' : ''}
      </div>
      <div class="filter-bar">
        <label class="field grow"><span>Search</span><input id="faSearch" placeholder="Search by name, email or department…"></label>
        <label class="field"><span>Department</span><select id="faDept"><option value="">All</option>${DEPARTMENTS.map(d => `<option>${d}</option>`).join('')}</select></label>
      </div>
      <div class="card-body"><div class="report-grid" id="facGrid"></div></div>
    </div>

    <div class="card">
      <div class="card-head"><h2><i class="fa-solid fa-table"></i>Faculty Directory</h2></div>
      <div class="card-body tight"><div id="facTable"></div></div>
    </div>`;

  let view = DB.faculty.slice();

  function apply(){
    const q = $('#faSearch').value.trim().toLowerCase();
    const d = $('#faDept').value;
    view = DB.faculty.filter(f =>
      (!q || f.name.toLowerCase().includes(q) || f.email.toLowerCase().includes(q) || f.dept.toLowerCase().includes(q)) &&
      (!d || f.dept === d));
    render();
  }

  function render(){
    $('#facCount').textContent = view.length + ' of ' + DB.faculty.length;
    const g = $('#facGrid');
    if (!view.length){ g.innerHTML = App.emptyState('fa-chalkboard-user','No faculty found','Try adjusting your filters.'); }
    else {
      g.innerHTML = view.map(f => `
        <div class="card" style="margin:0">
          <div class="card-body" style="text-align:center">
            <img src="${f.img}" class="avatar lg" style="margin:0 auto 12px" onerror="this.src='https://i.pravatar.cc/150?u=${f.id}'">
            <h3 style="font-size:14.5px;font-weight:700">${esc(f.name)}</h3>
            <p style="font-size:12.3px;color:var(--teal);font-weight:600;margin-bottom:3px">${esc(f.designation)}</p>
            <p style="font-size:12px;color:var(--muted);margin-bottom:12px">${DEPT_FULL[f.dept]}</p>
            <div style="display:flex;gap:7px;justify-content:center;flex-wrap:wrap;margin-bottom:14px">
              <span class="badge grey">${esc(f.qual)}</span>
              <span class="badge teal">${f.exp} yrs exp</span>
            </div>
            <div style="font-size:12.4px;color:var(--muted);text-align:left;border-top:1px solid var(--border);padding-top:12px">
              <div style="margin-bottom:6px"><i class="fa-solid fa-envelope" style="width:16px;color:var(--teal)"></i>${esc(f.email)}</div>
              <div style="margin-bottom:6px"><i class="fa-solid fa-phone" style="width:16px;color:var(--teal)"></i>${esc(f.phone)}</div>
              <div><i class="fa-solid fa-book" style="width:16px;color:var(--teal)"></i>${f.subjects.map(s => s).join(', ')}</div>
            </div>
            ${isAdmin ? `<div class="btn-group" style="margin-top:14px;justify-content:center">
              <button class="btn ghost sm" data-edit="${f.id}"><i class="fa-solid fa-pen"></i>Edit</button>
              <button class="btn danger sm" data-del="${f.id}"><i class="fa-solid fa-trash"></i>Delete</button>
            </div>` : ''}
          </div>
        </div>`).join('');
    }

    const box = $('#facTable');
    if (!view.length){ box.innerHTML = App.emptyState('fa-table','No records',''); }
    else {
      box.innerHTML = `<div class="table-wrap"><table class="data-table">
        <thead><tr><th>Faculty</th><th>ID</th><th>Department</th><th>Designation</th><th>Qualification</th><th>Subjects</th><th>Experience</th></tr></thead>
        <tbody>${view.map(f => `<tr>
          <td><div class="td-user"><img src="${f.img}" onerror="this.src='https://i.pravatar.cc/60?u=${f.id}'">
            <div><strong>${esc(f.name)}</strong><span>${esc(f.email)}</span></div></div></td>
          <td class="mono">${f.id}</td><td><span class="badge grey">${f.dept}</span></td>
          <td>${esc(f.designation)}</td><td>${esc(f.qual)}</td>
          <td style="font-size:12.3px">${f.subjects.map(s => `<span class="badge teal" style="margin-right:4px">${s}</span>`).join('')}</td>
          <td>${f.exp} years</td>
        </tr>`).join('')}</tbody></table></div>`;
    }

    $$('[data-edit]', g).forEach(b => b.onclick = () => openForm(DB.faculty.find(x => x.id === b.dataset.edit)));
    $$('[data-del]', g).forEach(b => b.onclick = () => del(b.dataset.del));
  }

  function openForm(f){
    const isEdit = !!f;
    f = f || { id:'', name:'', dept:'CSE', qual:'', designation:'Assistant Professor',
      email:'', phone:'', exp:0, img:'', subjects:[] };

    const deptSubjects = SUBJECTS[f.dept] || [];

    App.modal({
      title: isEdit ? 'Edit Faculty' : 'Add Faculty', wide:true,
      okText: isEdit ? 'Update' : 'Create',
      body:`
        <div class="form-grid two">
          <label class="field"><span>Full Name *</span><input id="qName" value="${esc(f.name)}"></label>
          <label class="field"><span>Faculty ID</span><input id="qId" value="${esc(f.id)}" ${isEdit ? 'disabled' : ''} placeholder="F007"></label>
          <label class="field"><span>Email *</span><input id="qEmail" value="${esc(f.email)}"></label>
          <label class="field"><span>Phone</span><input id="qPhone" value="${esc(f.phone)}"></label>
          <label class="field"><span>Department</span><select id="qDept">${DEPARTMENTS.map(d => `<option ${d === f.dept ? 'selected' : ''}>${d}</option>`).join('')}</select></label>
          <label class="field"><span>Designation</span><select id="qDesig">${['Professor','Associate Professor','Assistant Professor','Visiting Faculty','Lab Instructor'].map(d => `<option ${d === f.designation ? 'selected' : ''}>${d}</option>`).join('')}</select></label>
          <label class="field"><span>Qualification</span><input id="qQual" value="${esc(f.qual)}" placeholder="Ph.D. (IIT Delhi)"></label>
          <label class="field"><span>Experience (years)</span><input id="qExp" type="number" value="${f.exp}"></label>
        </div>
        <label class="field"><span>Profile Image URL</span><input id="qImg" value="${esc(f.img)}"></label>
        <label class="field"><span>Subjects Taught (comma separated codes)</span><input id="qSubs" value="${(f.subjects || []).join(', ')}" placeholder="CS501, CS503"></label>
      `,
      onOk:(back) => {
        const name = $('#qName', back).value.trim();
        if (!name){ App.toast('Name is required.', 'error', 'Validation'); return false; }
        const id = $('#qId', back).value.trim() || uid('F');
        if (!isEdit && DB.faculty.some(x => x.id === id)){ App.toast('Faculty ID already exists.', 'error', 'Duplicate'); return false; }
        const obj = {
          id, name,
          dept: $('#qDept', back).value,
          qual: $('#qQual', back).value.trim(),
          designation: $('#qDesig', back).value,
          email: $('#qEmail', back).value.trim(),
          phone: $('#qPhone', back).value.trim(),
          exp: Number($('#qExp', back).value) || 0,
          img: $('#qImg', back).value.trim() || 'https://i.pravatar.cc/300?u=' + encodeURIComponent(name),
          subjects: $('#qSubs', back).value.split(',').map(x => x.trim()).filter(Boolean)
        };
        if (isEdit) DB.faculty[DB.faculty.findIndex(x => x.id === f.id)] = obj;
        else DB.faculty.push(obj);
        saveDB();
        App.logActivity((isEdit ? 'Updated' : 'Added') + ' faculty: ' + name);
        App.toast('Faculty ' + (isEdit ? 'updated' : 'added') + '.', 'success', 'Saved');
        apply();
      }
    });
  }

  function del(id){
    const f = DB.faculty.find(x => x.id === id);
    App.confirm(`Delete faculty member <strong>${esc(f.name)}</strong>?`, () => {
      DB.faculty = DB.faculty.filter(x => x.id !== id);
      saveDB();
      App.logActivity('Deleted faculty: ' + f.name);
      App.toast('Faculty deleted.', 'warn', 'Deleted');
      apply();
    }, { title:'Delete Faculty', okText:'Yes, Delete' });
  }

  ['faSearch','faDept'].forEach(i => $('#' + i).addEventListener('input', apply));
  const af = $('#addFac');
  if (af) af.onclick = () => openForm(null);

  apply();
});
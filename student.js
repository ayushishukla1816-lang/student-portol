/* ==========================================================
   students.js — Student Directory CRUD
   ========================================================== */
document.addEventListener('DOMContentLoaded', () => {
  App.init({ active:'students.html', title:'Student Directory', subtitle:'Manage all enrolled students' });

  const c = $('#content');
  c.innerHTML = `
    <div class="card">
      <div class="card-head">
        <h2><i class="fa-solid fa-user-graduate"></i>All Students <span class="badge teal" id="stuCount"></span></h2>
        <div class="btn-group no-print">
          <button class="btn ghost sm" id="exportStu"><i class="fa-solid fa-file-csv"></i>Export CSV</button>
          <button class="btn primary sm" id="addStu"><i class="fa-solid fa-plus"></i>Add Student</button>
        </div>
      </div>
      <div class="filter-bar">
        <label class="field grow"><span>Search</span>
          <input type="text" id="fSearch" placeholder="Search by name, ID or email…"></label>
        <label class="field"><span>Department</span>
          <select id="fDept"><option value="">All Departments</option>${DEPARTMENTS.map(d => `<option value="${d}">${d} — ${DEPT_FULL[d]}</option>`).join('')}</select></label>
        <label class="field"><span>Semester</span>
          <select id="fSem"><option value="">All Semesters</option>${[1,2,3,4,5,6,7,8].map(s => `<option value="${s}">Semester ${s}</option>`).join('')}</select></label>
        <label class="field"><span>Status</span>
          <select id="fStatus"><option value="">All Status</option><option>Active</option><option>Inactive</option></select></label>
        <button class="btn ghost" id="clearF"><i class="fa-solid fa-rotate-left"></i>Reset</button>
      </div>
      <div class="card-body tight"><div id="stuTable"></div></div>
    </div>`;

  let view = DB.students.slice();

  function apply(){
    const q = $('#fSearch').value.trim().toLowerCase();
    const d = $('#fDept').value, s = $('#fSem').value, st = $('#fStatus').value;
    view = DB.students.filter(x =>
      (!q || x.name.toLowerCase().includes(q) || x.id.toLowerCase().includes(q) || x.email.toLowerCase().includes(q)) &&
      (!d || x.dept === d) && (!s || String(x.sem) === s) && (!st || x.status === st));
    render();
  }

  function render(){
    $('#stuCount').textContent = view.length + ' of ' + DB.students.length;
    const box = $('#stuTable');
    if (!view.length){ box.innerHTML = App.emptyState('fa-user-slash','No students found','Try adjusting your search or filters.'); return; }

    box.innerHTML = `<div class="table-wrap"><table class="data-table" id="stuTbl">
      <thead><tr>
        <th class="sortable" data-col="0">Student</th>
        <th class="sortable" data-col="1">ID</th>
        <th class="sortable" data-col="2">Department</th>
        <th class="sortable" data-col="3">Sem</th>
        <th>Contact</th>
        <th class="sortable" data-col="5">Attendance</th>
        <th class="sortable" data-col="6">Avg</th>
        <th class="sortable" data-col="7">Status</th>
        <th>Actions</th>
      </tr></thead>
      <tbody>${view.map(s => {
        const a = studentAttendancePct(s.id), m = studentAvgMarks(s.id);
        return `<tr>
          <td><div class="td-user"><img src="${s.img}" onerror="this.src='https://i.pravatar.cc/60?u=${s.id}'">
            <div><strong>${esc(s.name)}</strong><span>${esc(s.email)}</span></div></div></td>
          <td class="mono">${s.id}</td>
          <td><span class="badge grey">${s.dept}</span></td>
          <td>${s.sem}</td>
          <td style="font-size:12.3px">${esc(s.phone)}</td>
          <td>${App.attendanceBadge(a)}</td>
          <td><strong>${m}</strong></td>
          <td>${App.statusBadge(s.status)}</td>
          <td><div class="td-actions">
            <a class="btn-icon" href="student-profile.html?id=${s.id}" title="View"><i class="fa-solid fa-eye"></i></a>
            <button class="btn-icon" data-edit="${s.id}" title="Edit"><i class="fa-solid fa-pen"></i></button>
            <button class="btn-icon danger" data-del="${s.id}" title="Delete"><i class="fa-solid fa-trash"></i></button>
          </div></td>
        </tr>`; }).join('')}
      </tbody></table></div>`;

    App.makeSortable($('#stuTbl'));

    $$('[data-edit]', box).forEach(b => b.onclick = () => openForm(studentById(b.dataset.edit)));
    $$('[data-del]', box).forEach(b => b.onclick = () => del(b.dataset.del));
  }

  function openForm(s){
    const isEdit = !!s;
    s = s || { id:'', name:'', dept:'CSE', sem:5, section:'A', gender:'Male', email:'', phone:'',
      img:'', dob:'', blood:'B+', status:'Active', admission:todayISO(), address:'',
      guardian:'', guardianPhone:'', emergency:'', achievements:[] };

    App.modal({
      title: isEdit ? 'Edit Student — ' + s.id : 'Add New Student',
      wide: true,
      okText: isEdit ? 'Update Student' : 'Create Student',
      body: `
        <div class="form-grid two">
          <label class="field"><span>Full Name *</span><input id="mName" value="${esc(s.name)}" placeholder="e.g. Aarav Sharma"></label>
          <label class="field"><span>Student ID *</span><input id="mId" value="${esc(s.id)}" ${isEdit ? 'disabled' : ''} placeholder="e.g. CSE2021011"></label>
          <label class="field"><span>Email *</span><input id="mEmail" type="email" value="${esc(s.email)}" placeholder="name@campus.edu"></label>
          <label class="field"><span>Phone</span><input id="mPhone" value="${esc(s.phone)}" placeholder="+91 98xxx xxxxx"></label>
          <label class="field"><span>Department</span><select id="mDept">${DEPARTMENTS.map(d => `<option ${d === s.dept ? 'selected' : ''}>${d}</option>`).join('')}</select></label>
          <label class="field"><span>Semester</span><select id="mSem">${[1,2,3,4,5,6,7,8].map(n => `<option ${n === s.sem ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
          <label class="field"><span>Section</span><select id="mSec">${['A','B','C'].map(x => `<option ${x === s.section ? 'selected' : ''}>${x}</option>`).join('')}</select></label>
          <label class="field"><span>Gender</span><select id="mGender">${['Male','Female','Other'].map(x => `<option ${x === s.gender ? 'selected' : ''}>${x}</option>`).join('')}</select></label>
          <label class="field"><span>Date of Birth</span><input id="mDob" type="date" value="${s.dob}"></label>
          <label class="field"><span>Blood Group</span><select id="mBlood">${['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(x => `<option ${x === s.blood ? 'selected' : ''}>${x}</option>`).join('')}</select></label>
          <label class="field"><span>Status</span><select id="mStatus">${['Active','Inactive'].map(x => `<option ${x === s.status ? 'selected' : ''}>${x}</option>`).join('')}</select></label>
          <label class="field"><span>Admission Date</span><input id="mAdm" type="date" value="${s.admission}"></label>
        </div>
        <label class="field"><span>Profile Image URL</span><input id="mImg" value="${esc(s.img)}" placeholder="https://i.pravatar.cc/300?img=12"></label>
        <label class="field"><span>Address</span><textarea id="mAddr">${esc(s.address)}</textarea></label>
        <div class="form-grid two">
          <label class="field"><span>Guardian Name</span><input id="mGrd" value="${esc(s.guardian)}"></label>
          <label class="field"><span>Guardian Phone</span><input id="mGrdPh" value="${esc(s.guardianPhone)}"></label>
        </div>
        <label class="field"><span>Emergency Contact</span><input id="mEmg" value="${esc(s.emergency)}"></label>
      `,
      onOk: (back) => {
        const name = $('#mName', back).value.trim();
        const id   = $('#mId', back).value.trim();
        const email= $('#mEmail', back).value.trim();
        if (!name || !id || !email){ App.toast('Name, Student ID and Email are required.', 'error', 'Validation'); return false; }
        if (!isEdit && DB.students.some(x => x.id.toLowerCase() === id.toLowerCase())){
          App.toast('A student with this ID already exists.', 'error', 'Duplicate ID'); return false;
        }
        const obj = {
          id, name, dept:$('#mDept', back).value, sem:Number($('#mSem', back).value),
          section:$('#mSec', back).value, gender:$('#mGender', back).value,
          email, phone:$('#mPhone', back).value.trim(),
          img:$('#mImg', back).value.trim() || 'https://i.pravatar.cc/300?u=' + encodeURIComponent(id),
          dob:$('#mDob', back).value, blood:$('#mBlood', back).value,
          status:$('#mStatus', back).value, admission:$('#mAdm', back).value,
          address:$('#mAddr', back).value.trim(), guardian:$('#mGrd', back).value.trim(),
          guardianPhone:$('#mGrdPh', back).value.trim(), emergency:$('#mEmg', back).value.trim(),
          achievements: s.achievements || []
        };
        if (isEdit){
          const i = DB.students.findIndex(x => x.id === id);
          DB.students[i] = obj;
          App.logActivity('Updated student record: ' + name);
          App.toast(name + ' updated successfully.', 'success', 'Student Updated');
        } else {
          DB.students.push(obj);
          /* initialise fee record */
          DB.fees.push({ studentId:id, tuition:85000, exam:4500, library:1500, other:2000,
            total:93000, paid:0, balance:93000, dueDate:'2025-01-31', status:'Unpaid', payments:[] });
          App.logActivity('Added new student: ' + name);
          App.toast(name + ' added to the directory.', 'success', 'Student Added');
        }
        saveDB(); apply();
      }
    });
  }

  function del(id){
    const s = studentById(id);
    App.confirm(`Are you sure you want to permanently delete <strong>${esc(s.name)}</strong> (${id})?<br><br>This will also remove their attendance, marks and fee records.`,
      () => {
        DB.students = DB.students.filter(x => x.id !== id);
        DB.attendance = DB.attendance.filter(x => x.studentId !== id);
        DB.marks = DB.marks.filter(x => x.studentId !== id);
        DB.fees = DB.fees.filter(x => x.studentId !== id);
        DB.issues = DB.issues.filter(x => x.studentId !== id);
        DB.feedback = DB.feedback.filter(x => x.studentId !== id);
        saveDB();
        App.logActivity('Deleted student: ' + s.name);
        App.toast(s.name + ' has been deleted.', 'warn', 'Record Deleted');
        apply();
      }, { title:'Delete Student', okText:'Yes, Delete' });
  }

  /* events */
  ['fSearch','fDept','fSem','fStatus'].forEach(id => $('#' + id).addEventListener('input', apply));
  $('#clearF').onclick = () => { $('#fSearch').value = ''; $('#fDept').value = ''; $('#fSem').value = ''; $('#fStatus').value = ''; apply(); };
  $('#addStu').onclick = () => openForm(null);
  $('#exportStu').onclick = () => {
    const rows = [['ID','Name','Email','Phone','Department','Semester','Section','Status','Attendance %','Avg Marks','CGPA']];
    view.forEach(s => rows.push([s.id, s.name, s.email, s.phone, s.dept, s.sem, s.section, s.status,
      studentAttendancePct(s.id), studentAvgMarks(s.id), studentCGPA(s.id)]));
    App.downloadCSV('students.csv', rows);
  };

  apply();
});
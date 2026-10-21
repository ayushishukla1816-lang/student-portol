/* ==========================================================
   student-profile.js — Detailed student profile
   ========================================================== */
document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(location.search);
  const id = params.get('id') || (App.isStudent() ? App.myId() : null);
  const st = studentById(id);

  App.init({ active:'__profile', title:'Student Profile', subtitle: st ? st.name + ' · ' + st.id : 'Not found' });

  const c = $('#content');
  if (!st){ c.innerHTML = App.emptyState('fa-user-slash','Student not found','The requested profile does not exist.'); return; }

  const att  = studentAttendancePct(id);
  const avg  = studentAvgMarks(id);
  const cgpa = studentCGPA(id);
  const fee  = DB.fees.find(f => f.studentId === id) || { total:0, paid:0, balance:0, payments:[] };
  const marks = DB.marks.filter(m => m.studentId === id);
  const recs  = DB.attendance.filter(a => a.studentId === id);
  const p = recs.filter(r => r.status === 'Present').length;
  const ab = recs.filter(r => r.status === 'Absent').length;
  const lv = recs.filter(r => r.status === 'Leave').length;
  const issues = DB.issues.filter(x => x.studentId === id);
  const canEdit = App.isAdmin();

  c.innerHTML = `
    <div class="profile-hero no-print">
      <img class="avatar xl" src="${st.img}" onerror="this.src='https://i.pravatar.cc/300?u=${st.id}'">
      <div class="profile-hero-info">
        <h2>${esc(st.name)}</h2>
        <div class="ph-roll">${st.id} · Semester ${st.sem} · Section ${st.section}</div>
        <div class="ph-meta">
          <span><i class="fa-solid fa-building-columns"></i>${DEPT_FULL[st.dept]}</span>
          <span><i class="fa-solid fa-envelope"></i>${esc(st.email)}</span>
          <span><i class="fa-solid fa-phone"></i>${esc(st.phone)}</span>
          <span><i class="fa-solid fa-droplet"></i>${esc(st.blood)}</span>
        </div>
      </div>
      <div class="ph-actions">
        ${canEdit ? `<button class="btn primary" id="editBtn"><i class="fa-solid fa-pen"></i>Edit Profile</button>` : ''}
        <button class="btn ghost" id="printBtn"><i class="fa-solid fa-print"></i>Print</button>
        <a class="btn ghost" href="students.html"><i class="fa-solid fa-arrow-left"></i>Back</a>
      </div>
    </div>

    <div class="print-header">
      <h2 style="margin-bottom:4px">Smart Student Portal — Student Record</h2>
      <p style="font-size:12px">${esc(st.name)} · ${st.id} · Generated on ${fmtDate(todayISO())}</p>
    </div>

    <div class="stat-grid no-print">
      ${miniStat('Attendance', att + '%', 'fa-calendar-check', att >= 75 ? 'green' : 'red')}
      ${miniStat('Average Marks', avg + '/100', 'fa-chart-line', 'orange')}
      ${miniStat('CGPA', cgpa, 'fa-award', 'blue')}
      ${miniStat('Fee Balance', inr(fee.balance), 'fa-indian-rupee-sign', fee.balance > 0 ? 'red' : 'green')}
    </div>

    <div class="dash-grid eq">
      <div class="card" style="margin:0">
        <div class="card-head"><h3><i class="fa-solid fa-user"></i>Personal Information</h3></div>
        <div class="card-body">
          <div class="info-item"><span>Full Name</span><strong>${esc(st.name)}</strong></div>
          <div class="info-item"><span>Student ID</span><strong class="mono">${st.id}</strong></div>
          <div class="info-item"><span>Date of Birth</span><strong>${fmtDate(st.dob)}</strong></div>
          <div class="info-item"><span>Gender</span><strong>${esc(st.gender)}</strong></div>
          <div class="info-item"><span>Blood Group</span><strong>${esc(st.blood)}</strong></div>
          <div class="info-item"><span>Status</span><strong>${App.statusBadge(st.status)}</strong></div>
          <div class="info-item"><span>Address</span><strong>${esc(st.address)}</strong></div>
        </div>
      </div>

      <div class="card" style="margin:0">
        <div class="card-head"><h3><i class="fa-solid fa-address-book"></i>Guardian &amp; Emergency</h3></div>
        <div class="card-body">
          <div class="info-item"><span>Guardian Name</span><strong>${esc(st.guardian)}</strong></div>
          <div class="info-item"><span>Guardian Phone</span><strong>${esc(st.guardianPhone)}</strong></div>
          <div class="info-item"><span>Emergency Contact</span><strong>${esc(st.emergency)}</strong></div>
          <div class="info-item"><span>Email</span><strong>${esc(st.email)}</strong></div>
          <div class="info-item"><span>Phone</span><strong>${esc(st.phone)}</strong></div>
          <div class="info-item"><span>Admission Date</span><strong>${fmtDate(st.admission)}</strong></div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-head"><h3><i class="fa-solid fa-graduation-cap"></i>Academic Record</h3>
        <span class="badge teal">Semester ${st.sem}</span></div>
      <div class="card-body tight">
        <div class="table-wrap"><table class="data-table">
          <thead><tr><th>Code</th><th>Subject</th><th>Credits</th><th>Internal /20</th><th>Practical /20</th><th>Assign /10</th><th>Final /50</th><th>Total</th><th>Grade</th><th>Result</th></tr></thead>
          <tbody>${marks.map(m => `<tr>
            <td class="mono">${m.subject}</td><td>${esc(m.subjectName)}</td><td>${m.credits}</td>
            <td>${m.internal}</td><td>${m.practical}</td><td>${m.assignment}</td><td>${m.final}</td>
            <td><strong>${m.total}</strong></td>
            <td><span class="badge teal">${m.grade}</span></td>
            <td>${App.statusBadge(m.status)}</td>
          </tr>`).join('')}</tbody>
          <tfoot><tr style="background:var(--bg);font-weight:700">
            <td colspan="7" style="text-align:right">Aggregate</td>
            <td>${avg}/100</td><td colspan="2">CGPA ${cgpa}</td>
          </tr></tfoot>
        </table></div>
      </div>
    </div>

    <div class="dash-grid eq">
      <div class="card" style="margin:0">
        <div class="card-head"><h3><i class="fa-solid fa-calendar-check"></i>Attendance Summary</h3></div>
        <div class="card-body">
          <div class="progress-row" style="margin-bottom:12px">
            <span style="font-size:12.5px;color:var(--muted);min-width:78px">Overall</span>
            <div class="progress ${att < 75 ? 'bad' : (att < 85 ? 'warn' : '')}"><i style="width:${att}%"></i></div>
            <b>${att}%</b>
          </div>
          <div class="stat-grid" style="grid-template-columns:1fr 1fr 1fr;gap:10px;margin:0">
            <div style="text-align:center;padding:12px;border-radius:10px;background:var(--ok-soft)">
              <div style="font-size:19px;font-weight:800;color:var(--ok)">${p}</div>
              <div style="font-size:11px;color:var(--muted)">Present</div></div>
            <div style="text-align:center;padding:12px;border-radius:10px;background:var(--bad-soft)">
              <div style="font-size:19px;font-weight:800;color:var(--bad)">${ab}</div>
              <div style="font-size:11px;color:var(--muted)">Absent</div></div>
            <div style="text-align:center;padding:12px;border-radius:10px;background:var(--warn-soft)">
              <div style="font-size:19px;font-weight:800;color:#b45309">${lv}</div>
              <div style="font-size:11px;color:var(--muted)">Leave</div></div>
          </div>
          ${att < 75 ? `<div style="margin-top:14px;padding:11px;border-radius:10px;background:var(--bad-soft);color:var(--bad);font-size:12.6px;font-weight:600">
            <i class="fa-solid fa-triangle-exclamation"></i> Attendance below the 75% requirement. Detention risk.</div>` : ''}
        </div>
      </div>

      <div class="card" style="margin:0">
        <div class="card-head"><h3><i class="fa-solid fa-indian-rupee-sign"></i>Fee Status</h3></div>
        <div class="card-body">
          <div class="info-item"><span>Total Fees</span><strong>${inr(fee.total)}</strong></div>
          <div class="info-item"><span>Amount Paid</span><strong style="color:var(--ok)">${inr(fee.paid)}</strong></div>
          <div class="info-item"><span>Balance Due</span><strong style="color:${fee.balance > 0 ? 'var(--bad)' : 'var(--ok)'}">${inr(fee.balance)}</strong></div>
          <div class="info-item"><span>Due Date</span><strong>${fmtDate(fee.dueDate)}</strong></div>
          <div class="info-item"><span>Status</span><strong>${App.statusBadge(fee.status || (fee.balance > 0 ? 'Unpaid' : 'Paid'))}</strong></div>
        </div>
      </div>
    </div>

    <div class="dash-grid eq">
      <div class="card" style="margin:0">
        <div class="card-head"><h3><i class="fa-solid fa-trophy"></i>Achievements</h3></div>
        <div class="card-body">
          ${(st.achievements && st.achievements.length)
            ? `<ul style="list-style:none;display:flex;flex-direction:column;gap:11px">
                ${st.achievements.map(a => `<li style="display:flex;gap:11px;align-items:flex-start">
                  <i class="fa-solid fa-medal" style="color:#f59e0b;margin-top:3px"></i>
                  <span style="font-size:13.4px">${esc(a)}</span></li>`).join('')}
              </ul>`
            : App.emptyState('fa-medal','No achievements yet','Achievements will be listed here.')}
        </div>
      </div>

      <div class="card" style="margin:0">
        <div class="card-head"><h3><i class="fa-solid fa-book-open"></i>Library Records</h3></div>
        <div class="card-body tight">
          ${issues.length ? `<div class="table-wrap"><table class="data-table" style="min-width:0">
            <thead><tr><th>Book</th><th>Issued</th><th>Due</th><th>Status</th></tr></thead>
            <tbody>${issues.map(i => {
              const b = bookById(i.bookId) || {title:i.bookId};
              const over = i.status === 'Issued' && new Date(i.dueDate) < new Date();
              return `<tr><td>${esc(b.title)}</td><td>${fmtDateShort(i.issueDate)}</td>
                <td>${fmtDateShort(i.dueDate)}</td>
                <td>${over ? '<span class="badge bad">Overdue</span>' : App.statusBadge(i.status)}</td></tr>`;
            }).join('')}</tbody></table></div>`
            : App.emptyState('fa-book','No borrowed books','This student has no active library records.')}
        </div>
      </div>
    </div>

    <div class="card no-print">
      <div class="card-head"><h3><i class="fa-solid fa-folder-open"></i>Uploaded Documents</h3></div>
      <div class="card-body">
        <div class="quick-actions">
          ${['Aadhaar Card','10th Marksheet','12th Marksheet','Transfer Certificate','Medical Certificate','Passport Photo']
            .map(d => `<div class="qa-btn" style="cursor:default">
              <i class="fa-solid fa-file-pdf"></i>${d}<span style="font-size:10.5px;color:var(--muted)">Placeholder</span></div>`).join('')}
        </div>
      </div>
    </div>
  `;

  $('#printBtn').onclick = () => window.print();
  const eb = $('#editBtn');
  if (eb) eb.onclick = () => editProfile(st);
});

function miniStat(label, value, icon, cls){
  return `<div class="stat-card"><div class="stat-top"><div class="stat-icon ${cls}"><i class="fa-solid ${icon}"></i></div></div>
    <div class="stat-label">${label}</div><div class="stat-value">${value}</div></div>`;
}

function editProfile(s){
  App.modal({
    title:'Edit Profile — ' + s.id, wide:true, okText:'Save Changes',
    body:`
      <div class="form-grid two">
        <label class="field"><span>Full Name</span><input id="pName" value="${esc(s.name)}"></label>
        <label class="field"><span>Email</span><input id="pEmail" value="${esc(s.email)}"></label>
        <label class="field"><span>Phone</span><input id="pPhone" value="${esc(s.phone)}"></label>
        <label class="field"><span>Blood Group</span><input id="pBlood" value="${esc(s.blood)}"></label>
        <label class="field"><span>Date of Birth</span><input id="pDob" type="date" value="${s.dob}"></label>
        <label class="field"><span>Semester</span><select id="pSem">${[1,2,3,4,5,6,7,8].map(n => `<option ${n === s.sem ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
        <label class="field"><span>Guardian</span><input id="pGrd" value="${esc(s.guardian)}"></label>
        <label class="field"><span>Guardian Phone</span><input id="pGrdPh" value="${esc(s.guardianPhone)}"></label>
      </div>
      <label class="field"><span>Address</span><textarea id="pAddr">${esc(s.address)}</textarea></label>
      <label class="field"><span>Emergency Contact</span><input id="pEmg" value="${esc(s.emergency)}"></label>
      <label class="field"><span>Achievements (one per line)</span><textarea id="pAch">${esc((s.achievements || []).join('\n'))}</textarea></label>
    `,
    onOk:(back) => {
      const st = studentById(s.id);
      st.name = $('#pName', back).value.trim() || st.name;
      st.email = $('#pEmail', back).value.trim();
      st.phone = $('#pPhone', back).value.trim();
      st.blood = $('#pBlood', back).value.trim();
      st.dob = $('#pDob', back).value;
      st.sem = Number($('#pSem', back).value);
      st.guardian = $('#pGrd', back).value.trim();
      st.guardianPhone = $('#pGrdPh', back).value.trim();
      st.address = $('#pAddr', back).value.trim();
      st.emergency = $('#pEmg', back).value.trim();
      st.achievements = $('#pAch', back).value.split('\n').map(x => x.trim()).filter(Boolean);
      saveDB();
      App.logActivity('Updated profile for ' + st.name);
      App.toast('Profile updated successfully.', 'success', 'Saved');
      setTimeout(() => location.reload(), 700);
    }
  });
}
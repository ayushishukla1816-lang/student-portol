/* ==========================================================
   dashboard.js — Role-aware dashboard
   ========================================================== */
document.addEventListener('DOMContentLoaded', () => {
  const isStudent = App.isStudent();
  const myId = App.myId();

  App.init({
    active: 'dashboard.html',
    title: isStudent ? 'My Dashboard' : 'Administrator Dashboard',
    subtitle: isStudent
      ? 'Your academic snapshot for the current semester'
      : 'Institution-wide overview · ' + new Date().toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long', year:'numeric' })
  });

  const c = $('#content');

  if (isStudent) renderStudentDashboard(c, myId);
  else renderAdminDashboard(c);

  /* -------- quick actions -------- */
  $$('.qa-btn').forEach(b => b.addEventListener('click', () => { location.href = b.dataset.href; }));
});

/* ==========================================================
   ADMIN DASHBOARD
   ========================================================== */
function renderAdminDashboard(c){
  const totalStudents = DB.students.length;
  const totalCourses  = DB.courses.length;
  const avgAtt        = classAverageAttendance();
  const avgMarks      = classAverageMarks();
  const pending       = totalPendingFees();

  c.innerHTML = `
    <div class="stat-grid">
      ${statCard('Total Students', totalStudents, 'fa-user-graduate', '', '+2 this semester', 'up')}
      ${statCard('Enrolled Courses', totalCourses, 'fa-book', 'blue', '4 departments', 'up')}
      ${statCard('Avg. Attendance', avgAtt + '%', 'fa-calendar-check', 'green', 'Target 75%', avgAtt >= 75 ? 'up' : 'down')}
      ${statCard('Average Marks', avgMarks + '/100', 'fa-chart-line', 'orange', 'Across all subjects', 'up')}
      ${statCard('Pending Fees', inr(pending), 'fa-indian-rupee-sign', 'red', DB.fees.filter(f => f.balance > 0).length + ' students pending', 'down')}
    </div>

    <div class="chart-grid">
      <div class="card" style="margin:0">
        <div class="card-head"><h2><i class="fa-solid fa-chart-area"></i>Attendance Trend</h2><span class="badge teal">Last 8 weeks</span></div>
        <div class="card-body"><div class="chart-box"><canvas id="attChart"></canvas></div></div>
      </div>
      <div class="card" style="margin:0">
        <div class="card-head"><h2><i class="fa-solid fa-chart-pie"></i>Department Distribution</h2></div>
        <div class="card-body"><div class="chart-box"><canvas id="deptChart"></canvas></div></div>
      </div>
    </div>

    <div class="dash-grid">
      <div class="card" style="margin:0">
        <div class="card-head"><h2><i class="fa-solid fa-chart-column"></i>Average Marks by Subject</h2></div>
        <div class="card-body"><div class="chart-box sm"><canvas id="subChart"></canvas></div></div>
      </div>
      <div class="card" style="margin:0">
        <div class="card-head"><h3><i class="fa-solid fa-bolt"></i>Quick Actions</h3></div>
        <div class="card-body">
          <div class="quick-actions">
            ${qa('students.html','fa-user-plus','Add Student')}
            ${qa('attendance.html','fa-calendar-check','Mark Attendance')}
            ${qa('results.html','fa-file-pen','Enter Marks')}
            ${qa('fees.html','fa-indian-rupee-sign','Record Payment')}
            ${qa('notices.html','fa-bullhorn','Publish Notice')}
            ${qa('reports.html','fa-chart-pie','View Reports')}
          </div>
        </div>
      </div>
    </div>

    <div class="dash-grid">
      <div class="card" style="margin:0">
        <div class="card-head"><h2><i class="fa-solid fa-clock-rotate-left"></i>Recent Activities</h2></div>
        <div class="card-body tight"><ul class="activity-list" id="actList"></ul></div>
      </div>
      <div class="card" style="margin:0">
        <div class="card-head"><h3><i class="fa-solid fa-calendar-day"></i>Upcoming Examinations</h3></div>
        <div class="card-body tight">
          ${DB.exams.map(e => `
            <div class="exam-item">
              <div class="exam-date"><b>${new Date(e.date).getDate()}</b><span>${new Date(e.date).toLocaleDateString('en-IN',{month:'short'})}</span></div>
              <div class="exam-info"><strong>${esc(e.name)}</strong><span>${e.time} · ${e.room} · ${e.type}</span></div>
            </div>`).join('')}
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-head"><h2><i class="fa-solid fa-triangle-exclamation"></i>Low Attendance Alerts (&lt; 75%)</h2>
        <a href="attendance.html" class="btn ghost sm">Manage Attendance</a></div>
      <div class="card-body tight">
        ${lowAttendanceTable()}
      </div>
    </div>

    <div class="card">
      <div class="card-head"><h2><i class="fa-solid fa-bullhorn"></i>Latest Announcements</h2>
        <a href="notices.html" class="btn ghost sm">All Notices</a></div>
      <div class="card-body tight">
        ${DB.notices.slice(0,4).map(noticeRow).join('')}
      </div>
    </div>
  `;

  renderActivities();
  drawAdminCharts();
}

function statCard(label, value, icon, cls, trend, dir){
  return `<div class="stat-card">
    <div class="stat-top"><div class="stat-icon ${cls}"><i class="fa-solid ${icon}"></i></div></div>
    <div class="stat-label">${label}</div>
    <div class="stat-value">${value}</div>
    <div class="stat-trend ${dir}"><i class="fa-solid fa-arrow-${dir === 'up' ? 'up' : 'down'}"></i>${trend}</div>
  </div>`;
}
function qa(href, icon, label){
  return `<a class="qa-btn" href="${href}"><i class="fa-solid ${icon}"></i>${label}</a>`;
}
function noticeRow(n){
  const cls = { Examination:'exam', Events:'event', Holiday:'holiday', General:'general', Academic:'' }[n.category] || '';
  const ico = { Examination:'fa-file-pen', Events:'fa-calendar-star', Holiday:'fa-umbrella-beach', General:'fa-circle-info', Academic:'fa-graduation-cap' }[n.category] || 'fa-bullhorn';
  return `<div class="notice-item">
    <div class="notice-ico ${cls}"><i class="fa-solid ${ico}"></i></div>
    <div class="notice-body">
      <h4>${esc(n.title)} ${n.pinned ? '<span class="pin-flag">PINNED</span>' : ''}</h4>
      <p>${esc(n.body.slice(0, 130))}${n.body.length > 130 ? '…' : ''}</p>
      <div class="notice-meta"><span><i class="fa-regular fa-calendar"></i>${fmtDate(n.date)}</span>
        <span><i class="fa-solid fa-user"></i>${esc(n.author)}</span>
        <span>${App.statusBadge(n.priority)}</span></div>
    </div>
  </div>`;
}
function lowAttendanceTable(){
  const low = DB.students.map(s => ({ s, p: studentAttendancePct(s.id) })).filter(x => x.p < 75).sort((a,b) => a.p - b.p);
  if (!low.length) return App.emptyState('fa-circle-check','All Good!','Every student is above the 75% attendance threshold.');
  return `<div class="table-wrap"><table class="data-table">
    <thead><tr><th>Student</th><th>Department</th><th>Semester</th><th>Attendance</th><th>Action</th></tr></thead>
    <tbody>${low.map(x => `<tr>
      <td><div class="td-user"><img src="${x.s.img}" onerror="this.src='https://i.pravatar.cc/60?u=${x.s.id}'">
        <div><strong>${esc(x.s.name)}</strong><span>${x.s.id}</span></div></div></td>
      <td>${x.s.dept}</td><td>Sem ${x.s.sem}</td>
      <td>${App.attendanceBadge(x.p)}</td>
      <td><a class="btn ghost sm" href="student-profile.html?id=${x.s.id}">View</a></td>
    </tr>`).join('')}</tbody></table></div>`;
}
function renderActivities(){
  const list = $('#actList');
  if (!list) return;
  const acts = App.getActivities();
  if (!acts.length){
    list.innerHTML = `<li>${App.emptyState('fa-clock','No activity yet','Actions you perform will appear here.')}</li>`;
    return;
  }
  list.innerHTML = acts.slice(0, 7).map(a => `<li class="activity-item">
    <div class="act-dot"><i class="fa-solid fa-bolt"></i></div>
    <div class="act-body"><strong>${esc(a.text)}</strong>
      <span>${new Date(a.time).toLocaleString('en-IN', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' })}</span></div>
  </li>`).join('');
}

function drawAdminCharts(){
  /* Attendance trend (simulated weekly) */
  const base = classAverageAttendance();
  const labels = ['W1','W2','W3','W4','W5','W6','W7','W8'];
  const data = labels.map((_, i) => Math.min(99, Math.max(60, base + [ -4,-1,2,3,1,-2,2,4 ][i])));

  new Chart($('#attChart'), {
    type:'line',
    data:{ labels, datasets:[{
      label:'Attendance %', data, borderColor:'#14b8a6', backgroundColor:'rgba(20,184,166,.14)',
      fill:true, tension:.4, pointRadius:4, pointBackgroundColor:'#14b8a6', borderWidth:2.5
    }]},
    options:{ responsive:true, maintainAspectRatio:false,
      plugins:{ legend:{ display:false } },
      scales:{ y:{ beginAtZero:false, min:50, max:100, grid:{ color:'rgba(148,163,184,.18)' } },
               x:{ grid:{ display:false } } } }
  });

  /* Department doughnut */
  const labels2 = DEPARTMENTS;
  const data2 = labels2.map(d => deptCount(d));
  new Chart($('#deptChart'), {
    type:'doughnut',
    data:{ labels:labels2.map(d => DEPT_FULL[d]), datasets:[{
      data:data2, backgroundColor:['#0ea5a4','#2563eb','#f59e0b','#a855f7'], borderWidth:0, hoverOffset:8
    }]},
    options:{ responsive:true, maintainAspectRatio:false, cutout:'62%',
      plugins:{ legend:{ position:'bottom', labels:{ boxWidth:12, padding:14, font:{ size:11.5 } } } } }
  });

  /* Subject averages */
  const codes = Object.values(SUBJECTS).flat().map(s => s.code);
  const avgs = codes.map(code => {
    const m = DB.marks.filter(x => x.subject === code);
    return m.length ? Math.round(m.reduce((s,x) => s + x.total, 0) / m.length) : 0;
  });
  new Chart($('#subChart'), {
    type:'bar',
    data:{ labels:codes, datasets:[{
      label:'Avg marks', data:avgs, backgroundColor:'rgba(14,165,164,.75)',
      borderRadius:7, maxBarThickness:34
    }]},
    options:{ responsive:true, maintainAspectRatio:false,
      plugins:{ legend:{ display:false } },
      scales:{ y:{ beginAtZero:true, max:100, grid:{ color:'rgba(148,163,184,.18)' } },
               x:{ grid:{ display:false }, ticks:{ font:{ size:10 } } } } }
  });
}

/* ==========================================================
   STUDENT DASHBOARD
   ========================================================== */
function renderStudentDashboard(c, myId){
  const st = studentById(myId);
  if (!st){ c.innerHTML = App.emptyState('fa-user-slash','Profile Not Found','Contact the administrator.'); return; }

  const att = studentAttendancePct(myId);
  const avg = studentAvgMarks(myId);
  const cgpa = studentCGPA(myId);
  const fee = DB.fees.find(f => f.studentId === myId) || { balance:0, total:0, paid:0, dueDate:'—' };
  const myAssign = DB.assignments.filter(a => a.submissions && a.submissions[myId]);
  const pendingAssign = myAssign.filter(a => a.submissions[myId] === 'Pending').length;

  c.innerHTML = `
    <div class="profile-hero">
      <img class="avatar xl" src="${st.img}" onerror="this.src='https://i.pravatar.cc/300?u=${st.id}'">
      <div class="profile-hero-info">
        <h2>Welcome back, ${esc(st.name.split(' ')[0])} 👋</h2>
        <div class="ph-roll">${st.id} · Semester ${st.sem} · Section ${st.section}</div>
        <div class="ph-meta">
          <span><i class="fa-solid fa-building-columns"></i>${DEPT_FULL[st.dept]}</span>
          <span><i class="fa-solid fa-envelope"></i>${esc(st.email)}</span>
          <span><i class="fa-solid fa-phone"></i>${esc(st.phone)}</span>
        </div>
      </div>
      <div class="ph-actions">
        <a class="btn primary" href="student-profile.html?id=${st.id}"><i class="fa-solid fa-id-card"></i>My Profile</a>
        <a class="btn ghost" href="results.html"><i class="fa-solid fa-file-pen"></i>My Results</a>
      </div>
    </div>

    <div class="stat-grid">
      ${statCard('My Attendance', att + '%', 'fa-calendar-check', att >= 75 ? 'green' : 'red', att >= 75 ? 'Above threshold' : 'Below 75%', att >= 75 ? 'up' : 'down')}
      ${statCard('Average Marks', avg + '/100', 'fa-chart-line', 'orange', 'Across ' + DB.marks.filter(m => m.studentId === myId).length + ' subjects', 'up')}
      ${statCard('Current CGPA', cgpa, 'fa-award', 'blue', 'Out of 10.00', 'up')}
      ${statCard('Fee Balance', inr(fee.balance), 'fa-indian-rupee-sign', fee.balance > 0 ? 'red' : 'green', fee.balance > 0 ? 'Due ' + fmtDate(fee.dueDate) : 'Fully paid', fee.balance > 0 ? 'down' : 'up')}
      ${statCard('Pending Assignments', pendingAssign, 'fa-clipboard-list', pendingAssign > 0 ? 'orange' : 'green', myAssign.length + ' total assigned', pendingAssign > 0 ? 'down' : 'up')}
    </div>

    <div class="chart-grid">
      <div class="card" style="margin:0">
        <div class="card-head"><h2><i class="fa-solid fa-chart-column"></i>My Marks by Subject</h2></div>
        <div class="card-body"><div class="chart-box"><canvas id="myMarks"></canvas></div></div>
      </div>
      <div class="card" style="margin:0">
        <div class="card-head"><h2><i class="fa-solid fa-chart-pie"></i>Attendance Breakdown</h2></div>
        <div class="card-body"><div class="chart-box"><canvas id="myAtt"></canvas></div></div>
      </div>
    </div>

    <div class="dash-grid">
      <div class="card" style="margin:0">
        <div class="card-head"><h2><i class="fa-solid fa-calendar-day"></i>Today's Classes</h2>
          <a href="timetable.html" class="btn ghost sm">Full Timetable</a></div>
        <div class="card-body tight">${todayClasses(st.dept)}</div>
      </div>
      <div class="card" style="margin:0">
        <div class="card-head"><h3><i class="fa-solid fa-clock"></i>Upcoming Deadlines</h3></div>
        <div class="card-body tight">
          ${myAssign.length ? myAssign.slice(0,5).map(a => {
            const over = new Date(a.deadline) < new Date() && a.submissions[myId] === 'Pending';
            return `<div class="exam-item">
              <div class="exam-date" style="background:${over ? 'var(--bad)' : 'var(--navy-2)'}">
                <b>${new Date(a.deadline).getDate()}</b><span>${new Date(a.deadline).toLocaleDateString('en-IN',{month:'short'})}</span></div>
              <div class="exam-info"><strong>${esc(a.title)}</strong>
                <span>${subjectName(a.subject)} · ${a.maxMarks} marks</span></div>
              <div>${App.statusBadge(a.submissions[myId])}</div>
            </div>`;
          }).join('') : App.emptyState('fa-clipboard','No assignments','Nothing pending right now.')}
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-head"><h2><i class="fa-solid fa-bullhorn"></i>Notices for You</h2>
        <a href="notices.html" class="btn ghost sm">All Notices</a></div>
      <div class="card-body tight">${DB.notices.slice(0,3).map(noticeRow).join('')}</div>
    </div>
  `;

  /* Student charts */
  const myMarks = DB.marks.filter(m => m.studentId === myId);
  new Chart($('#myMarks'), {
    type:'bar',
    data:{ labels: myMarks.map(m => m.subject),
      datasets:[
        { label:'Internal', data: myMarks.map(m => m.internal), backgroundColor:'#0ea5a4', borderRadius:5, stack:'s' },
        { label:'Practical', data: myMarks.map(m => m.practical), backgroundColor:'#2563eb', borderRadius:5, stack:'s' },
        { label:'Assignment', data: myMarks.map(m => m.assignment), backgroundColor:'#f59e0b', borderRadius:5, stack:'s' },
        { label:'Final', data: myMarks.map(m => m.final), backgroundColor:'#a855f7', borderRadius:5, stack:'s' }
      ]},
    options:{ responsive:true, maintainAspectRatio:false,
      plugins:{ legend:{ position:'bottom', labels:{ boxWidth:11, padding:10, font:{ size:11 } } } },
      scales:{ x:{ stacked:true, grid:{ display:false } }, y:{ stacked:true, max:100, grid:{ color:'rgba(148,163,184,.18)' } } } }
  });

  const recs = DB.attendance.filter(a => a.studentId === myId);
  const p = recs.filter(r => r.status === 'Present').length;
  const ab = recs.filter(r => r.status === 'Absent').length;
  const lv = recs.filter(r => r.status === 'Leave').length;
  new Chart($('#myAtt'), {
    type:'doughnut',
    data:{ labels:['Present','Absent','Leave'], datasets:[{
      data:[p, ab, lv], backgroundColor:['#16a34a','#dc2626','#f59e0b'], borderWidth:0, hoverOffset:8 }]},
    options:{ responsive:true, maintainAspectRatio:false, cutout:'62%',
      plugins:{ legend:{ position:'bottom', labels:{ boxWidth:12, padding:14, font:{ size:11.5 } } } } }
  });
}

function todayClasses(dept){
  const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const today = days[new Date().getDay()];
  if (today === 'Sunday') return App.emptyState('fa-mug-hot','Holiday','No classes scheduled on Sunday.');
  const list = DB.timetable.filter(t => t.dept === dept && t.day === today).slice(0, 5);
  if (!list.length) return App.emptyState('fa-calendar-xmark','No classes','No classes scheduled for today.');
  return list.map(t => `<div class="exam-item">
    <div class="exam-date" style="background:var(--teal);color:#04231f"><b>${t.slot.slice(0,2)}</b><span>${t.slot.slice(3,5)}</span></div>
    <div class="exam-info"><strong>${esc(t.subjectName)}</strong><span>${esc(facultyName(t.faculty))} · Room ${t.room}</span></div>
    <div><span class="badge teal">${t.slot}</span></div>
  </div>`).join('');
}
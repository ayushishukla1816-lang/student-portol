/* ==========================================================
   app.js — Shared UI shell, helpers, toast, modal, nav
   ========================================================== */
const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

/* ---------------- Session / Theme store ---------------- */
const Store = {
  session: () => { try { return JSON.parse(localStorage.getItem(SESSION_KEY)); } catch(e){ return null; } },
  setSession: s => localStorage.setItem(SESSION_KEY, JSON.stringify(s)),
  clearSession: () => localStorage.removeItem(SESSION_KEY),
  theme: () => localStorage.getItem(THEME_KEY) || 'light',
  setTheme: t => localStorage.setItem(THEME_KEY, t)
};

/* ---------------- Navigation config ---------------- */
const NAV_ADMIN = [
  { group:'Overview', items:[
    { href:'dashboard.html', icon:'fa-gauge-high', label:'Dashboard' }
  ]},
  { group:'Academics', items:[
    { href:'students.html',   icon:'fa-user-graduate',   label:'Student Directory' },
    { href:'attendance.html', icon:'fa-calendar-check',  label:'Attendance' },
    { href:'results.html',    icon:'fa-file-pen',        label:'Exams & Results' },
    { href:'courses.html',    icon:'fa-book',            label:'Courses & Subjects' },
    { href:'timetable.html',  icon:'fa-table-cells',     label:'Timetable' },
    { href:'assignments.html',icon:'fa-clipboard-list',  label:'Assignments' }
  ]},
  { group:'Administration', items:[
    { href:'fees.html',    icon:'fa-indian-rupee-sign', label:'Fee Management' },
    { href:'faculty.html', icon:'fa-chalkboard-user',   label:'Faculty' },
    { href:'library.html', icon:'fa-book-open',         label:'Library' },
    { href:'notices.html', icon:'fa-bullhorn',          label:'Notices' },
    { href:'feedback.html',icon:'fa-comment-dots',      label:'Feedback' },
    { href:'reports.html', icon:'fa-chart-pie',         label:'Reports & Analytics' }
  ]},
  { group:'System', items:[
    { href:'settings.html', icon:'fa-gear',           label:'Settings' },
    { href:'support.html',  icon:'fa-circle-question',label:'Help & Support' }
  ]}
];

const NAV_STUDENT = [
  { group:'Overview', items:[
    { href:'dashboard.html', icon:'fa-gauge-high', label:'My Dashboard' }
  ]},
  { group:'My Academics', items:[
    { href:'__profile',       icon:'fa-id-card',        label:'My Profile' },
    { href:'attendance.html', icon:'fa-calendar-check', label:'My Attendance' },
    { href:'results.html',    icon:'fa-file-pen',       label:'My Results' },
    { href:'timetable.html',  icon:'fa-table-cells',    label:'Timetable' },
    { href:'assignments.html',icon:'fa-clipboard-list', label:'My Assignments' }
  ]},
  { group:'Services', items:[
    { href:'fees.html',    icon:'fa-indian-rupee-sign', label:'My Fees' },
    { href:'library.html', icon:'fa-book-open',         label:'Library' },
    { href:'notices.html', icon:'fa-bullhorn',          label:'Notices' },
    { href:'feedback.html',icon:'fa-comment-dots',      label:'Give Feedback' }
  ]},
  { group:'System', items:[
    { href:'settings.html', icon:'fa-gear',           label:'Settings' },
    { href:'support.html',  icon:'fa-circle-question',label:'Help & Support' }
  ]}
];

/* ---------------- Helpers ---------------- */
function fmtDate(iso, opts){
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d)) return iso;
  return d.toLocaleDateString('en-IN', opts || { day:'2-digit', month:'short', year:'numeric' });
}
function fmtDateShort(iso){
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day:'2-digit', month:'short' });
}
function todayISO(){ return new Date().toISOString().slice(0,10); }
function inr(n){ return '₹' + Number(n || 0).toLocaleString('en-IN'); }
function pct(a, b){ return b === 0 ? 0 : Math.round((a / b) * 100); }
function uid(prefix){ return prefix + Date.now().toString(36).toUpperCase() + Math.floor(Math.random()*900+100); }
function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function initials(name){ return name.split(' ').map(w => w[0]).slice(0,2).join('').toUpperCase(); }

/* ==========================================================
   APP OBJECT
   ========================================================== */
const App = {

  /* -------- session guards -------- */
  isStudent(){ const s = Store.session(); return s && s.role === 'student'; },
  isAdmin(){ const s = Store.session(); return s && s.role === 'admin'; },
  myId(){ const s = Store.session(); return s ? s.studentId : null; },

  /* -------- activity log -------- */
  logActivity(text){
    let arr = [];
    try { arr = JSON.parse(localStorage.getItem(ACTIVITY_KEY)) || []; } catch(e){ arr = []; }
    arr.unshift({ text, time: new Date().toISOString() });
    arr = arr.slice(0, 25);
    localStorage.setItem(ACTIVITY_KEY, JSON.stringify(arr));
  },
  getActivities(){
    try { return JSON.parse(localStorage.getItem(ACTIVITY_KEY)) || []; } catch(e){ return []; }
  },

  /* -------- Toast -------- */
  toast(msg, type = 'success', title){
    let wrap = $('#toastWrap');
    if (!wrap){
      wrap = document.createElement('div');
      wrap.id = 'toastWrap';
      wrap.className = 'toast-wrap';
      document.body.appendChild(wrap);
    }
    const icons = { success:'fa-circle-check', error:'fa-circle-exclamation', warn:'fa-triangle-exclamation', info:'fa-circle-info' };
    const el = document.createElement('div');
    el.className = 'toast ' + type;
    el.innerHTML = `<i class="fa-solid ${icons[type] || icons.info}"></i>
      <div class="toast-body"><strong>${esc(title || (type[0].toUpperCase() + type.slice(1)))}</strong><span>${esc(msg)}</span></div>
      <button class="toast-x"><i class="fa-solid fa-xmark"></i></button>`;
    wrap.appendChild(el);
    requestAnimationFrame(() => el.classList.add('in'));
    const close = () => { el.classList.remove('in'); setTimeout(() => el.remove(), 320); };
    el.querySelector('.toast-x').onclick = close;
    setTimeout(close, 4200);
  },

  /* -------- Modal -------- */
  modal({ title, body, okText = 'Save', cancelText = 'Cancel', onOk, wide = false, hideCancel = false }){
    const back = document.createElement('div');
    back.className = 'modal-backdrop';
    back.innerHTML = `<div class="modal ${wide ? 'wide' : ''}">
      <div class="modal-head"><h3>${esc(title)}</h3><button class="modal-x"><i class="fa-solid fa-xmark"></i></button></div>
      <div class="modal-body">${body}</div>
      <div class="modal-foot">
        ${hideCancel ? '' : `<button class="btn ghost" data-cancel>${esc(cancelText)}</button>`}
        <button class="btn primary" data-ok>${esc(okText)}</button>
      </div></div>`;
    document.body.appendChild(back);
    requestAnimationFrame(() => back.classList.add('in'));
    const close = () => { back.classList.remove('in'); setTimeout(() => back.remove(), 260); };
    back.querySelector('.modal-x').onclick = close;
    const c = back.querySelector('[data-cancel]');
    if (c) c.onclick = close;
    back.querySelector('[data-ok]').onclick = () => { if (!onOk || onOk(back) !== false) close(); };
    back.addEventListener('click', e => { if (e.target === back) close(); });
    return { close, el: back };
  },

  confirm(msg, onYes, opts = {}){
    App.modal({
      title: opts.title || 'Please Confirm',
      body: `<p class="confirm-msg">${msg}</p>`,
      okText: opts.okText || 'Yes, Confirm',
      cancelText: 'Cancel',
      onOk: () => { onYes(); }
    });
  },

  /* -------- CSV export -------- */
  downloadCSV(filename, rows){
    const csv = rows.map(r => r.map(c => `"${String(c == null ? '' : c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type:'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
    App.toast('Report exported as ' + filename, 'success', 'Export Complete');
  },

  /* -------- Badge helpers -------- */
  attendanceBadge(p){
    if (p >= 85) return `<span class="badge ok">${p}%</span>`;
    if (p >= 75) return `<span class="badge warn">${p}%</span>`;
    return `<span class="badge bad">${p}%</span>`;
  },
  statusBadge(s){
    const map = { Active:'ok', Inactive:'grey', Paid:'ok', Partial:'warn', Unpaid:'bad',
      Present:'ok', Absent:'bad', Leave:'warn', Pass:'ok', Fail:'bad',
      Pending:'warn', Submitted:'info', Graded:'ok', Issued:'info', Returned:'ok',
      Reviewed:'ok', 'In Progress':'warn', High:'bad', Medium:'warn', Low:'grey' };
    return `<span class="badge ${map[s] || 'grey'}">${esc(s)}</span>`;
  },

  /* -------- Table sorting -------- */
  makeSortable(table){
    $$('th.sortable', table).forEach((th, idx) => {
      th.innerHTML += ' <i class="fa-solid fa-sort"></i>';
      th.addEventListener('click', () => {
        const tbody = table.tBodies[0];
        const rows = Array.from(tbody.rows);
        const asc = th.dataset.asc !== 'true';
        $$('th', table).forEach(x => { x.dataset.asc = ''; const ic = x.querySelector('i'); if (ic) ic.className = 'fa-solid fa-sort'; });
        th.dataset.asc = asc;
        const ic = th.querySelector('i');
        if (ic) ic.className = 'fa-solid ' + (asc ? 'fa-sort-up' : 'fa-sort-down');
        const col = Number(th.dataset.col != null ? th.dataset.col : idx);
        rows.sort((a, b) => {
          const av = (a.cells[col] ? a.cells[col].innerText : '').trim();
          const bv = (b.cells[col] ? b.cells[col].innerText : '').trim();
          const an = parseFloat(av.replace(/[^0-9.\-]/g, ''));
          const bn = parseFloat(bv.replace(/[^0-9.\-]/g, ''));
          if (!isNaN(an) && !isNaN(bn)) return asc ? an - bn : bn - an;
          return asc ? av.localeCompare(bv) : bv.localeCompare(av);
        });
        rows.forEach(r => tbody.appendChild(r));
      });
    });
  },

  /* -------- Empty state -------- */
  emptyState(icon, title, msg){
    return `<div class="empty"><i class="fa-solid ${icon}"></i><h4>${esc(title)}</h4><p>${esc(msg || '')}</p></div>`;
  },

  /* ======================================================
     RENDER SHELL (sidebar + topbar + footer)
     ====================================================== */
  init({ active = '', title = 'Dashboard', subtitle = '', actions = '' } = {}){
    const session = Store.session();
    if (!session){ location.replace('index.html'); return; }

    /* theme */
    document.documentElement.setAttribute('data-theme', Store.theme());

    /* ---------- Sidebar ---------- */
    const nav = session.role === 'admin' ? NAV_ADMIN : NAV_STUDENT;
    let navHTML = '';
    nav.forEach(g => {
      navHTML += `<div class="sb-group"><div class="sb-group-title">${g.group}</div>`;
      g.items.forEach(it => {
        let href = it.href;
        if (href === '__profile') href = 'student-profile.html?id=' + session.studentId;
        const isActive = active === it.href || active === href;
        navHTML += `<a class="sb-link ${isActive ? 'active' : ''}" href="${href}">
          <i class="fa-solid ${it.icon}"></i><span>${it.label}</span></a>`;
      });
      navHTML += `</div>`;
    });

    const avatar = session.role === 'admin'
      ? (DB.users[0] ? DB.users[0].avatar : 'https://i.pravatar.cc/150?img=60')
      : (DB.students.find(s => s.id === session.studentId) || {}).img || `https://i.pravatar.cc/150?u=${session.email}`;

    const sb = $('#sidebar');
    if (sb){
      sb.innerHTML = `
        <div class="sb-brand">
          <div class="brand-mark">SP</div>
          <div class="sb-brand-txt"><strong>Smart Portal</strong><span>Management System</span></div>
        </div>
        <nav class="sb-nav">${navHTML}</nav>
        <div class="sb-user">
          <img src="${avatar}" alt="user" onerror="this.src='https://i.pravatar.cc/150?u=${encodeURIComponent(session.email)}'">
          <div class="sb-user-info"><strong>${esc(session.name)}</strong><span>${esc(session.role)}</span></div>
          <button class="sb-logout" id="logoutBtn" title="Logout"><i class="fa-solid fa-right-from-bracket"></i></button>
        </div>`;
    }

    /* ---------- Topbar ---------- */
    const tb = $('#topbar');
    if (tb){
      tb.innerHTML = `
        <button class="icon-btn menu-btn" id="menuBtn"><i class="fa-solid fa-bars"></i></button>
        <div class="page-title"><h1>${esc(title)}</h1><p>${esc(subtitle)}</p></div>
        <div class="tb-search">
          <i class="fa-solid fa-magnifying-glass"></i>
          <input type="text" id="globalSearch" placeholder="Search students, courses, notices…" autocomplete="off">
          <div class="search-drop" id="searchResults"></div>
        </div>
        <div class="tb-actions">
          <button class="icon-btn" id="themeBtn" title="Toggle theme"><i class="fa-solid fa-moon"></i></button>
          <div class="notif-wrap">
            <button class="icon-btn" id="notifBtn" title="Notifications"><i class="fa-solid fa-bell"></i><span class="notif-dot"></span></button>
            <div class="dropdown" id="notifDrop">
              <div class="dd-head"><span>Notifications</span><a href="notices.html">View all</a></div>
              <div class="dd-body" id="notifBody"></div>
            </div>
          </div>
          <div class="prof-wrap">
            <button class="prof-btn" id="profBtn">
              <img src="${avatar}" onerror="this.src='https://i.pravatar.cc/150?u=${encodeURIComponent(session.email)}'">
              <span class="pb-txt"><strong>${esc(session.name.split(' ')[0])}</strong><span>${esc(session.role)}</span></span>
              <i class="fa-solid fa-chevron-down" style="font-size:10px;color:var(--muted)"></i>
            </button>
            <div class="dropdown prof-menu" id="profDrop">
              ${session.role === 'student'
                ? `<a href="student-profile.html?id=${session.studentId}"><i class="fa-solid fa-id-card"></i>My Profile</a>` : ''}
              <a href="settings.html"><i class="fa-solid fa-gear"></i>Settings</a>
              <a href="support.html"><i class="fa-solid fa-circle-question"></i>Help &amp; Support</a>
              <div class="sep"></div>
              <a href="#" class="danger" id="logoutBtn2"><i class="fa-solid fa-right-from-bracket"></i>Logout</a>
            </div>
          </div>
        </div>`;
    }

    /* ---------- Footer ---------- */
    const ft = $('#footer');
    if (ft){
      ft.innerHTML = `<span>© ${new Date().getFullYear()} Smart Student Portal · B.Tech CSE Major Project</span>
        <span>Front-end demo · Data stored locally in your browser</span>`;
    }

    /* ---------- Overlay for mobile ---------- */
    if (!$('#sidebarOverlay')){
      const ov = document.createElement('div');
      ov.className = 'sidebar-overlay';
      ov.id = 'sidebarOverlay';
      document.body.appendChild(ov);
    }

    /* ---------- Wire events ---------- */
    App._wireShell(session, avatar);
  },

  _wireShell(session, avatar){
    const sidebar = $('#sidebar');
    const overlay = $('#sidebarOverlay');

    const closeSb = () => { if (sidebar) sidebar.classList.remove('open'); if (overlay) overlay.classList.remove('show'); };

    const mb = $('#menuBtn');
    if (mb) mb.onclick = () => { sidebar.classList.toggle('open'); overlay.classList.toggle('show'); };
    if (overlay) overlay.onclick = closeSb;

    /* theme */
    const themeBtn = $('#themeBtn');
    const applyThemeIcon = () => {
      if (!themeBtn) return;
      const t = Store.theme();
      themeBtn.innerHTML = `<i class="fa-solid ${t === 'dark' ? 'fa-sun' : 'fa-moon'}"></i>`;
    };
    applyThemeIcon();
    if (themeBtn) themeBtn.onclick = () => {
      const t = Store.theme() === 'dark' ? 'light' : 'dark';
      Store.setTheme(t);
      document.documentElement.setAttribute('data-theme', t);
      applyThemeIcon();
      App.toast('Switched to ' + t + ' mode', 'info', 'Theme');
    };

    /* logout */
    const doLogout = () => {
      App.confirm('Are you sure you want to log out of the portal?', () => {
        App.logActivity(session.name + ' logged out');
        Store.clearSession();
        location.href = 'index.html';
      }, { okText:'Logout', title:'Confirm Logout' });
    };
    const lb = $('#logoutBtn'); if (lb) lb.onclick = doLogout;
    const lb2 = $('#logoutBtn2'); if (lb2) lb2.onclick = e => { e.preventDefault(); doLogout(); };

    /* notifications */
    const nBtn = $('#notifBtn'), nDrop = $('#notifDrop');
    if (nBtn && nDrop){
      nBtn.onclick = e => {
        e.stopPropagation();
        nDrop.classList.toggle('show');
        if (nDrop.classList.contains('show')) App._renderNotifications();
      };
    }

    /* profile dropdown */
    const pBtn = $('#profBtn'), pDrop = $('#profDrop');
    if (pBtn && pDrop){
      pBtn.onclick = e => { e.stopPropagation(); pDrop.classList.toggle('show'); };
    }

    document.addEventListener('click', () => {
      if (nDrop) nDrop.classList.remove('show');
      if (pDrop) pDrop.classList.remove('show');
    });

    /* global search */
    const gs = $('#globalSearch'), sr = $('#searchResults');
    if (gs && sr){
      gs.addEventListener('input', () => {
        const q = gs.value.trim().toLowerCase();
        if (q.length < 2){ sr.classList.remove('show'); return; }
        const results = [];

        DB.students.filter(s =>
          s.name.toLowerCase().includes(q) || s.id.toLowerCase().includes(q) || s.email.toLowerCase().includes(q)
        ).slice(0, 5).forEach(s => results.push({
          img: s.img, title: s.name, sub: s.id + ' · ' + DEPT_FULL[s.dept],
          href: 'student-profile.html?id=' + s.id
        }));

        DB.courses.filter(c =>
          c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)
        ).slice(0, 3).forEach(c => results.push({
          img: null, icon:'fa-book', title: c.name, sub: c.code + ' · ' + c.dept,
          href: 'courses.html'
        }));

        DB.faculty.filter(f =>
          f.name.toLowerCase().includes(q) || f.dept.toLowerCase().includes(q)
        ).slice(0, 3).forEach(f => results.push({
          img: f.img, title: f.name, sub: f.designation + ' · ' + f.dept,
          href: 'faculty.html'
        }));

        DB.notices.filter(n =>
          n.title.toLowerCase().includes(q)
        ).slice(0, 3).forEach(n => results.push({
          img: null, icon:'fa-bullhorn', title: n.title, sub: n.category + ' · ' + fmtDate(n.date),
          href: 'notices.html'
        }));

        if (!results.length){
          sr.innerHTML = `<div class="search-empty"><i class="fa-solid fa-magnifying-glass"></i> No results for "${esc(gs.value)}"</div>`;
        } else {
          sr.innerHTML = results.map(r => `
            <div class="search-item" data-href="${r.href}">
              ${r.img
                ? `<img src="${r.img}" onerror="this.src='https://i.pravatar.cc/60?u=${encodeURIComponent(r.title)}'">`
                : `<div class="act-dot" style="width:32px;height:32px;border:none"><i class="fa-solid ${r.icon}"></i></div>`}
              <div class="si-txt"><strong>${esc(r.title)}</strong><span>${esc(r.sub)}</span></div>
            </div>`).join('');
          $$('.search-item', sr).forEach(el => el.onclick = () => { location.href = el.dataset.href; });
        }
        sr.classList.add('show');
      });

      document.addEventListener('click', e => {
        if (!sr.contains(e.target) && e.target !== gs) sr.classList.remove('show');
      });
    }
  },

  _renderNotifications(){
    const body = $('#notifBody');
    if (!body) return;
    const items = [];

    /* pinned / latest notices */
    DB.notices.slice().sort((a, b) => (b.pinned - a.pinned) || (new Date(b.date) - new Date(a.date)))
      .slice(0, 3).forEach(n => items.push({
        icon:'fa-bullhorn', title:n.title, sub:n.category + ' · ' + fmtDate(n.date)
      }));

    /* low attendance alerts (admin) */
    if (App.isAdmin()){
      DB.students.forEach(s => {
        const a = DB.attendance.filter(x => x.studentId === s.id);
        const p = pct(a.filter(x => x.status === 'Present').length, a.length);
        if (p < 75) items.push({ icon:'fa-triangle-exclamation', title:'Low attendance: ' + s.name, sub: p + '% — below 75% threshold' });
      });
    }

    /* pending fees */
    if (App.isStudent()){
      const f = DB.fees.find(x => x.studentId === App.myId());
      if (f && f.balance > 0) items.push({ icon:'fa-indian-rupee-sign', title:'Fee balance pending', sub: inr(f.balance) + ' due by ' + fmtDate(f.dueDate) });
    }

    body.innerHTML = items.length
      ? items.slice(0, 8).map(i => `<div class="dd-item"><i class="fa-solid ${i.icon}"></i>
          <div><strong>${esc(i.title)}</strong><span>${esc(i.sub)}</span></div></div>`).join('')
      : `<div class="search-empty">You're all caught up 🎉</div>`;
  }
};

/* ==========================================================
   Shared computed helpers used across pages
   ========================================================== */
function studentAttendancePct(studentId){
  const recs = DB.attendance.filter(a => a.studentId === studentId);
  if (!recs.length) return 0;
  return pct(recs.filter(r => r.status === 'Present').length, recs.length);
}
function studentAvgMarks(studentId){
  const m = DB.marks.filter(x => x.studentId === studentId);
  if (!m.length) return 0;
  return Math.round(m.reduce((s, x) => s + x.total, 0) / m.length);
}
function studentCGPA(studentId){
  const m = DB.marks.filter(x => x.studentId === studentId);
  if (!m.length) return 0;
  let pts = 0, cr = 0;
  m.forEach(x => { pts += gradePointFor(x.grade) * (x.credits || 3); cr += (x.credits || 3); });
  return cr ? (pts / cr).toFixed(2) : '0.00';
}
function classAverageAttendance(){
  if (!DB.students.length) return 0;
  const sum = DB.students.reduce((s, st) => s + studentAttendancePct(st.id), 0);
  return Math.round(sum / DB.students.length);
}
function classAverageMarks(){
  if (!DB.students.length) return 0;
  const sum = DB.students.reduce((s, st) => s + studentAvgMarks(st.id), 0);
  return Math.round(sum / DB.students.length);
}
function totalPendingFees(){
  return DB.fees.reduce((s, f) => s + (f.balance || 0), 0);
}
function deptCount(dept){
  return DB.students.filter(s => s.dept === dept).length;
}
function subjectName(code){
  for (const d in SUBJECTS){
    const s = SUBJECTS[d].find(x => x.code === code);
    if (s) return s.name;
  }
  return code;
}
function facultyName(id){
  const f = DB.faculty.find(x => x.id === id);
  return f ? f.name : id;
}
function studentById(id){ return DB.students.find(s => s.id === id); }
function bookById(id){ return DB.books.find(b => b.id === id); }
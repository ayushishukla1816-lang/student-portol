/* ==========================================================
   settings.js — Profile, appearance, data management
   ========================================================== */
document.addEventListener('DOMContentLoaded', () => {
  App.init({ active:'settings.html', title:'Settings', subtitle:'Profile, appearance and data management' });

  const c = $('#content');
  const session = Store.session();
  const isStudent = App.isStudent();

  c.innerHTML = `
    <div class="tabs">
      <button class="tab active" data-tab="profile">Profile</button>
      <button class="tab" data-tab="appearance">Appearance</button>
      <button class="tab" data-tab="data">Data Management</button>
      <button class="tab" data-tab="about">About</button>
    </div>

    <!-- PROFILE -->
    <div class="tab-panel active" id="panel-profile">
      <div class="card">
        <div class="card-head"><h2><i class="fa-solid fa-user"></i>Account Profile</h2></div>
        <div class="card-body">
          <div style="display:flex;gap:20px;align-items:center;margin-bottom:24px;flex-wrap:wrap">
            <img class="avatar xl" id="setAvatar" src="${isStudent ? ((studentById(App.myId())||{}).img || 'https://i.pravatar.cc/150?img=1') : 'https://i.pravatar.cc/150?img=60'}"
              onerror="this.src='https://i.pravatar.cc/150?u=${encodeURIComponent(session.email)}'">
            <div>
              <h3 style="font-size:17px;font-weight:800">${esc(session.name)}</h3>
              <p style="font-size:13px;color:var(--muted);margin-bottom:5px">${esc(session.email)}</p>
              <span class="badge teal" style="text-transform:capitalize">${esc(session.role)}</span>
              ${isStudent ? `<span class="badge grey" style="margin-left:6px">${App.myId()}</span>` : ''}
            </div>
          </div>

          <div class="form-grid two">
            <label class="field"><span>Display Name</span><input id="setName" value="${esc(session.name)}"></label>
            <label class="field"><span>Email</span><input id="setEmail" value="${esc(session.email)}"></label>
            <label class="field"><span>Role</span><input value="${esc(session.role)}" disabled></label>
            <label class="field"><span>Session Started</span><input value="${new Date().toLocaleString('en-IN')}" disabled></label>
          </div>

          ${isStudent ? `<label class="field"><span>Profile Picture URL</span>
            <input id="setImg" value="${esc((studentById(App.myId())||{}).img || '')}"></label>` : ''}

          <button class="btn primary" id="saveProfile"><i class="fa-solid fa-floppy-disk"></i>Save Profile</button>
        </div>
      </div>

      <div class="card">
        <div class="card-head"><h2><i class="fa-solid fa-lock"></i>Change Password</h2></div>
        <div class="card-body">
          <p style="font-size:12.8px;color:var(--muted);margin-bottom:16px">
            <i class="fa-solid fa-circle-info"></i> Demo passwords are fixed for this academic project.
            Admin password: <code>admin123</code> · Student password: <code>student123</code>
          </p>
          <div class="form-grid three">
            <label class="field"><span>Current Password</span><input type="password" id="pwCur" placeholder="••••••••"></label>
            <label class="field"><span>New Password</span><input type="password" id="pwNew" placeholder="••••••••"></label>
            <label class="field"><span>Confirm Password</span><input type="password" id="pwCon" placeholder="••••••••"></label>
          </div>
          <button class="btn navy" id="changePw"><i class="fa-solid fa-key"></i>Update Password</button>
        </div>
      </div>
    </div>

    <!-- APPEARANCE -->
    <div class="tab-panel" id="panel-appearance">
      <div class="card">
        <div class="card-head"><h2><i class="fa-solid fa-palette"></i>Interface Preferences</h2></div>
        <div class="card-body">
          <div class="section-title">Colour Theme</div>
          <div style="display:flex;gap:14px;flex-wrap:wrap;margin-bottom:26px">
            <button class="theme-pick" data-theme="light" style="padding:16px 26px;border-radius:12px;border:2px solid var(--border);background:#fff;color:#0f172a;font-weight:700">
              <i class="fa-solid fa-sun"></i> Light Mode</button>
            <button class="theme-pick" data-theme="dark" style="padding:16px 26px;border-radius:12px;border:2px solid var(--border);background:#111c2f;color:#e8eefb;font-weight:700">
              <i class="fa-solid fa-moon"></i> Dark Mode</button>
          </div>

          <div class="section-title">Portal Preferences</div>
          <label class="check" style="margin-bottom:13px"><input type="checkbox" id="prefNotif" checked><span>Show notification alerts in the top bar</span></label>
          <label class="check" style="margin-bottom:13px"><input type="checkbox" id="prefCompact"><span>Use compact table density</span></label>
          <label class="check" style="margin-bottom:22px"><input type="checkbox" id="prefAnimate" checked><span>Enable interface animations</span></label>

          <button class="btn primary" id="savePrefs"><i class="fa-solid fa-floppy-disk"></i>Save Preferences</button>
        </div>
      </div>
    </div>

    <!-- DATA -->
    <div class="tab-panel" id="panel-data">
      <div class="card">
        <div class="card-head"><h2><i class="fa-solid fa-database"></i>Data Management</h2></div>
        <div class="card-body">
          <div style="padding:14px 16px;border-radius:11px;background:var(--warn-soft);color:#b45309;font-size:13px;margin-bottom:22px">
            <strong><i class="fa-solid fa-triangle-exclamation"></i> Important:</strong>
            All data is stored in your browser's LocalStorage. Clearing browser data will erase everything.
            Always take a backup before resetting.
          </div>

          <div class="section-title">Backup &amp; Restore</div>
          <div class="btn-group" style="margin-bottom:22px">
            <button class="btn primary" id="backup"><i class="fa-solid fa-download"></i>Download Backup (JSON)</button>
            <label class="btn ghost" style="cursor:pointer">
              <i class="fa-solid fa-upload"></i>Restore from Backup
              <input type="file" id="restoreFile" accept=".json" hidden>
            </label>
          </div>

          <div class="section-title">Storage Statistics</div>
          <div class="stat-grid" id="storageStats" style="margin-bottom:22px"></div>

          <div class="section-title">Danger Zone</div>
          <div style="padding:16px;border:1px solid var(--bad);border-radius:11px;background:var(--bad-soft)">
            <strong style="font-size:13.5px;color:var(--bad)">Reset Demo Data</strong>
            <p style="font-size:12.6px;color:var(--muted);margin:6px 0 14px">
              This will erase all your changes and restore the original 10 sample students, courses,
              attendance, marks, fees and notices.</p>
            <button class="btn danger" id="resetBtn"><i class="fa-solid fa-rotate-left"></i>Reset to Demo Data</button>
          </div>
        </div>
      </div>
    </div>

    <!-- ABOUT -->
    <div class="tab-panel" id="panel-about">
      <div class="card">
        <div class="card-head"><h2><i class="fa-solid fa-circle-info"></i>About This Project</h2></div>
        <div class="card-body">
          <div style="display:flex;gap:16px;align-items:center;margin-bottom:22px">
            <div class="brand-mark" style="width:56px;height:56px;border-radius:16px;font-size:20px">SP</div>
            <div>
              <h3 style="font-size:17px;font-weight:800">Smart Student Portal Management System</h3>
              <p style="font-size:12.8px;color:var(--muted)">Version 2.0 · B.Tech Computer Science &amp; Engineering Major Project</p>
            </div>
          </div>

          <div class="section-title">Technology Stack</div>
          <div style="display:flex;gap:9px;flex-wrap:wrap;margin-bottom:22px">
            ${['HTML5','CSS3','Vanilla JavaScript','LocalStorage','Chart.js','Font Awesome']
              .map(t => `<span class="badge teal" style="padding:6px 14px;font-size:12px">${t}</span>`).join('')}
          </div>

          <div class="section-title">Modules</div>
          <ul style="list-style:none;display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:10px;margin-bottom:22px">
            ${['Login & Authentication','Admin Dashboard','Student Directory','Student Profiles','Attendance Management',
               'Examinations & Results','Courses & Subjects','Timetable','Assignments','Fee Management','Faculty Management',
               'Library Management','Notices & Announcements','Student Feedback','Reports & Analytics','Settings & Backup']
              .map(m => `<li style="display:flex;gap:9px;font-size:13.2px;align-items:flex-start">
                <i class="fa-solid fa-circle-check" style="color:var(--teal);margin-top:3px;font-size:11px"></i>${m}</li>`).join('')}
          </ul>

          <div class="section-title">Academic Disclaimer</div>
          <p style="font-size:13.2px;line-height:1.75;color:var(--muted)">
            This is a <strong>front-end academic demonstration project</strong>. Authentication is simulated using
            browser LocalStorage and is <strong>not secure for real student information</strong>. All student
            records, fee amounts, payment references and notices are <strong>fictional</strong>. No real payments,
            emails or server-side processing occur. This project must not be deployed as a production
            university management system.
          </p>
        </div>
      </div>
    </div>`;

  /* tabs */
  $$('.tab').forEach(t => t.onclick = () => {
    $$('.tab').forEach(x => x.classList.remove('active'));
    $$('.tab-panel').forEach(x => x.classList.remove('active'));
    t.classList.add('active');
    $('#panel-' + t.dataset.tab).classList.add('active');
  });

  /* theme picker */
  $$('.theme-pick').forEach(b => b.onclick = () => {
    Store.setTheme(b.dataset.theme);
    document.documentElement.setAttribute('data-theme', b.dataset.theme);
    App.toast('Theme changed to ' + b.dataset.theme + ' mode.', 'success', 'Appearance Updated');
    setTimeout(() => location.reload(), 500);
  });

  /* save profile */
  $('#saveProfile').onclick = () => {
    const name = $('#setName').value.trim();
    const email = $('#setEmail').value.trim();
    if (!name || !email){ App.toast('Name and email are required.', 'error', 'Validation'); return; }
    const s = Store.session();
    s.name = name; s.email = email;
    Store.setSession(s);
    if (isStudent){
      const st = studentById(App.myId());
      st.name = name; st.email = email;
      const img = $('#setImg');
      if (img && img.value.trim()) st.img = img.value.trim();
      saveDB();
    }
    App.logActivity('Updated account profile');
    App.toast('Profile saved successfully.', 'success', 'Saved');
    setTimeout(() => location.reload(), 800);
  };

  /* password */
  $('#changePw').onclick = () => {
    const cur = $('#pwCur').value, nw = $('#pwNew').value, cn = $('#pwCon').value;
    const expected = App.isAdmin() ? 'admin123' : 'student123';
    if (cur !== expected){ App.toast('Current password is incorrect.', 'error', 'Error'); return; }
    if (nw.length < 6){ App.toast('New password must be at least 6 characters.', 'error', 'Validation'); return; }
    if (nw !== cn){ App.toast('Passwords do not match.', 'error', 'Validation'); return; }
    App.toast('Password change is disabled in this academic demo.', 'info', 'Not Available');
    $('#pwCur').value = $('#pwNew').value = $('#pwCon').value = '';
  };

  /* prefs */
  const prefs = JSON.parse(localStorage.getItem('ssp_prefs') || '{}');
  if (prefs.compact) $('#prefCompact').checked = true;
  if (prefs.noAnim) $('#prefAnimate').checked = false;
  if (prefs.noNotif) $('#prefNotif').checked = false;

  $('#savePrefs').onclick = () => {
    localStorage.setItem('ssp_prefs', JSON.stringify({
      compact: $('#prefCompact').checked,
      noAnim: !$('#prefAnimate').checked,
      noNotif: !$('#prefNotif').checked
    }));
    App.toast('Preferences saved.', 'success', 'Saved');
  };

  /* storage stats */
  function renderStorage(){
    const bytes = new Blob([localStorage.getItem(DB_KEY) || '']).size;
    const acts = App.getActivities().length;
    $('#storageStats').innerHTML = `
      <div class="stat-card"><div class="stat-top"><div class="stat-icon blue"><i class="fa-solid fa-database"></i></div></div>
        <div class="stat-label">Storage Used</div><div class="stat-value">${(bytes/1024).toFixed(1)}<small> KB</small></div></div>
      <div class="stat-card"><div class="stat-top"><div class="stat-icon green"><i class="fa-solid fa-users"></i></div></div>
        <div class="stat-label">Students</div><div class="stat-value">${DB.students.length}</div></div>
      <div class="stat-card"><div class="stat-top"><div class="stat-icon orange"><i class="fa-solid fa-calendar-check"></i></div></div>
        <div class="stat-label">Attendance Records</div><div class="stat-value">${DB.attendance.length}</div></div>
      <div class="stat-card"><div class="stat-top"><div class="stat-icon red"><i class="fa-solid fa-clock-rotate-left"></i></div></div>
        <div class="stat-label">Activity Logs</div><div class="stat-value">${acts}</div></div>`;
  }
  renderStorage();

  /* backup */
  $('#backup').onclick = () => {
    const data = localStorage.getItem(DB_KEY) || '{}';
    const blob = new Blob([data], { type:'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'smart-portal-backup-' + todayISO() + '.json';
    a.click();
    URL.revokeObjectURL(a.href);
    App.logActivity('Downloaded data backup');
    App.toast('Backup downloaded successfully.', 'success', 'Backup Complete');
  };

  /* restore */
  $('#restoreFile').onchange = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const parsed = JSON.parse(ev.target.result);
        if (!parsed.students || !Array.isArray(parsed.students)) throw new Error('bad');
        App.confirm('Restoring this backup will replace all current data. Continue?', () => {
          localStorage.setItem(DB_KEY, JSON.stringify(parsed));
          App.logActivity('Restored data from backup');
          App.toast('Backup restored. Reloading…', 'success', 'Restore Complete');
          setTimeout(() => location.reload(), 1000);
        }, { title:'Confirm Restore', okText:'Yes, Restore' });
      } catch (err){
        App.toast('Invalid backup file. Please select a valid JSON backup.', 'error', 'Restore Failed');
      }
    };
    reader.readAsText(file);
  };

  /* reset */
  $('#resetBtn').onclick = () => {
    App.confirm('This will permanently erase all your changes and restore the original demo data.<br><br>Continue?',
      () => {
        resetDB();
        App.toast('Demo data restored. Reloading…', 'success', 'Data Reset');
        setTimeout(() => location.reload(), 900);
      }, { title:'Reset Demo Data', okText:'Yes, Reset Everything' });
  };
});
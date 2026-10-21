/* ==========================================================
   support.js — Help centre & FAQ
   ========================================================== */
document.addEventListener('DOMContentLoaded', () => {
  App.init({ active:'support.html', title:'Help & Support', subtitle:'Guides, FAQs and contact information' });

  const c = $('#content');

  const FAQS = [
    { q:'How do I log in to the portal?',
      a:'Use the demo credentials shown on the login page. Administrators sign in with <strong>admin@campus.edu / admin123</strong>. Students sign in with their roll number (for example <strong>CSE2021001</strong>) and the password <strong>student123</strong>. Select the correct role tab before signing in.' },
    { q:'Where is my data stored?',
      a:'All records are stored in your browser using <strong>LocalStorage</strong>. Nothing is sent to a server. This means your data stays on this device, and clearing your browser data will erase it. Always use Settings → Data Management → Download Backup before clearing your browser.' },
    { q:'How is attendance percentage calculated?',
      a:'Attendance percentage = (number of sessions marked <em>Present</em>) ÷ (total sessions recorded) × 100. Students below <strong>75%</strong> are flagged with a red alert on the dashboard, attendance page and their profile.' },
    { q:'How are grades and CGPA computed?',
      a:'Each subject totals 100 marks: Internal (20) + Practical (20) + Assignment (10) + Final Examination (50). The grade is derived from the total — O (90+), A+ (80-89), A (70-79), B+ (60-69), B (50-59), C (40-49), F (below 40). CGPA is the credit-weighted average of grade points on a 10-point scale.' },
    { q:'Can I add or delete students?',
      a:'Yes — administrators can add, edit and delete student records from the <strong>Student Directory</strong>. A confirmation dialog always appears before deletion. Deleting a student also removes their attendance, marks, fee and library records.' },
    { q:'How do I mark attendance?',
      a:'Open <strong>Attendance Management</strong>, choose the date, department, semester and subject, then select Present / Absent / Leave for each student. Click <em>Save Attendance</em>. Existing records for the same date and subject are updated rather than duplicated.' },
    { q:'How do I record a fee payment?',
      a:'Go to <strong>Fee Management</strong> and click the <em>+</em> button on a student row. Enter the amount, mode and reference. The balance, status and payment history update automatically. You can also print a demo receipt.' },
    { q:'What happens when I click "Reset Demo Data"?',
      a:'This restores the original sample dataset — 10 students, 8 courses, 6 faculty members, attendance records, marks, fees, assignments, library books and notices. All your custom changes will be lost, so take a backup first.' },
    { q:'Is this system secure enough for real student data?',
      a:'<strong>No.</strong> This is an academic front-end demonstration. Authentication is simulated in the browser and there is no server, database or encryption. It must not be used for real student information.' },
    { q:'How do I export a report?',
      a:'Most pages have an <em>Export CSV</em> button. On the Reports page you can filter by department and semester, then export the complete analytics table. Use <em>Print</em> for a printable version of any page.' },
    { q:'Can I use the portal on my phone?',
      a:'Yes. The layout is fully responsive. On smaller screens the sidebar collapses into a hamburger menu in the top-left corner, and all tables scroll horizontally.' },
    { q:'The page looks broken — what should I do?',
      a:'Try a hard refresh (Ctrl + Shift + R / Cmd + Shift + R). If the problem persists, open Settings → Data Management → Reset to Demo Data. This rebuilds the LocalStorage dataset with valid sample records.' }
  ];

  c.innerHTML = `
    <div class="stat-grid">
      <div class="stat-card"><div class="stat-top"><div class="stat-icon blue"><i class="fa-solid fa-book-open"></i></div></div>
        <div class="stat-label">Documentation</div><div class="stat-value">17<small> pages</small></div></div>
      <div class="stat-card"><div class="stat-top"><div class="stat-icon green"><i class="fa-solid fa-circle-question"></i></div></div>
        <div class="stat-label">FAQ Articles</div><div class="stat-value">${FAQS.length}</div></div>
      <div class="stat-card"><div class="stat-top"><div class="stat-icon orange"><i class="fa-solid fa-code"></i></div></div>
        <div class="stat-label">Tech Stack</div><div class="stat-value" style="font-size:16px">HTML · CSS · JS</div></div>
      <div class="stat-card"><div class="stat-top"><div class="stat-icon red"><i class="fa-solid fa-shield-halved"></i></div></div>
        <div class="stat-label">Security Level</div><div class="stat-value" style="font-size:16px">Demo Only</div></div>
    </div>

    <div class="card">
      <div class="card-head">
        <h2><i class="fa-solid fa-circle-question"></i>Frequently Asked Questions</h2>
        <div style="position:relative;width:260px">
          <i class="fa-solid fa-magnifying-glass" style="position:absolute;left:12px;top:50%;transform:translateY(-50%);color:var(--muted);font-size:12px"></i>
          <input id="faqSearch" placeholder="Search FAQs…" style="width:100%;padding:9px 12px 9px 34px;border-radius:10px;border:1px solid var(--border);background:var(--bg);outline:none;font-size:13px">
        </div>
      </div>
      <div class="card-body" id="faqList"></div>
    </div>

    <div class="dash-grid eq">
      <div class="card" style="margin:0">
        <div class="card-head"><h3><i class="fa-solid fa-headset"></i>Contact Support</h3></div>
        <div class="card-body">
          <div class="info-item"><span>Helpdesk Email</span><strong>support@campus.edu</strong></div>
          <div class="info-item"><span>Phone</span><strong>+91 11 4567 8900</strong></div>
          <div class="info-item"><span>Office Hours</span><strong>Mon – Sat · 9:00 AM to 5:00 PM</strong></div>
          <div class="info-item"><span>Location</span><strong>Block A, Room 104 — IT Helpdesk</strong></div>
          <div class="info-item"><span>Response Time</span><strong>Within 24 working hours</strong></div>
        </div>
      </div>

      <div class="card" style="margin:0">
        <div class="card-head"><h3><i class="fa-solid fa-compass"></i>Quick Navigation</h3></div>
        <div class="card-body">
          <div class="quick-actions">
            <a class="qa-btn" href="dashboard.html"><i class="fa-solid fa-gauge-high"></i>Dashboard</a>
            <a class="qa-btn" href="students.html"><i class="fa-solid fa-user-graduate"></i>Students</a>
            <a class="qa-btn" href="attendance.html"><i class="fa-solid fa-calendar-check"></i>Attendance</a>
            <a class="qa-btn" href="results.html"><i class="fa-solid fa-file-pen"></i>Results</a>
            <a class="qa-btn" href="fees.html"><i class="fa-solid fa-indian-rupee-sign"></i>Fees</a>
            <a class="qa-btn" href="settings.html"><i class="fa-solid fa-gear"></i>Settings</a>
          </div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-head"><h3><i class="fa-solid fa-keyboard"></i>Keyboard Shortcuts &amp; Tips</h3></div>
      <div class="card-body">
        <div class="table-wrap"><table class="data-table" style="min-width:0">
          <thead><tr><th>Action</th><th>How</th></tr></thead>
          <tbody>
            <tr><td>Toggle dark mode</td><td>Click the moon/sun icon in the top bar</td></tr>
            <tr><td>Global search</td><td>Type in the top search bar (students, courses, faculty, notices)</td></tr>
            <tr><td>Sort any table</td><td>Click a column header with the sort icon</td></tr>
            <tr><td>Close any dialog</td><td>Press <code>Esc</code> or click outside the modal</td></tr>
            <tr><td>Print a page</td><td>Use the Print button, or Ctrl + P / Cmd + P</td></tr>
            <tr><td>Mobile sidebar</td><td>Tap the hamburger icon in the top-left corner</td></tr>
          </tbody></table></div>
      </div>
    </div>`;

  function renderFaq(q = ''){
    const list = FAQS.filter(f =>
      !q || f.q.toLowerCase().includes(q.toLowerCase()) || f.a.toLowerCase().includes(q.toLowerCase()));
    const box = $('#faqList');
    if (!list.length){ box.innerHTML = App.emptyState('fa-circle-question','No matching FAQs','Try a different keyword.'); return; }
    box.innerHTML = list.map((f, i) => `
      <div class="faq" data-i="${i}">
        <div class="faq-q"><span>${esc(f.q)}</span><i class="fa-solid fa-chevron-down"></i></div>
        <div class="faq-a"><div>${f.a}</div></div>
      </div>`).join('');

    $$('.faq-q', box).forEach(el => el.onclick = () => {
      const faq = el.parentElement;
      const open = faq.classList.contains('open');
      $$('.faq', box).forEach(x => x.classList.remove('open'));
      if (!open) faq.classList.add('open');
    });
  }

  $('#faqSearch').addEventListener('input', e => renderFaq(e.target.value.trim()));

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') $$('.modal-backdrop').forEach(m => m.querySelector('.modal-x') && m.querySelector('.modal-x').click());
  });

  renderFaq();
});
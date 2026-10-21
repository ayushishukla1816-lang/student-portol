/* ==========================================================
   feedback.js — Student feedback system
   ========================================================== */
document.addEventListener('DOMContentLoaded', () => {
  const isStudent = App.isStudent();
  const myId = App.myId();
  const isAdmin = App.isAdmin();

  App.init({ active:'feedback.html', title: isStudent ? 'Give Feedback' : 'Student Feedback',
    subtitle: isStudent ? 'Share your experience and suggestions' : 'Review and respond to student feedback' });

  const c = $('#content');

  c.innerHTML = `
    ${isStudent ? `
    <div class="card no-print">
      <div class="card-head"><h2><i class="fa-solid fa-pen-to-square"></i>Submit New Feedback</h2></div>
      <div class="card-body">
        <form id="fbForm">
          <div class="form-grid two">
            <label class="field"><span>Category *</span><select id="fbCat" required>
              <option value="">Select category…</option>
              ${['Teaching Quality','Infrastructure','Library','Hostel','Canteen','Examination','Administration','Other'].map(x => `<option>${x}</option>`).join('')}
            </select></label>
            <label class="field"><span>Subject (optional)</span><select id="fbSub"><option value="General">General</option>
              ${SUBJECTS[(studentById(myId) || {}).dept || 'CSE'].map(s => `<option value="${s.code}">${s.code} — ${s.name}</option>`).join('')}
            </select></label>
          </div>
          <label class="field"><span>Rating *</span>
            <div class="rating" id="fbRating">
              ${[1,2,3,4,5].map(i => `<i class="fa-solid fa-star" data-v="${i}"></i>`).join('')}
            </div>
          </label>
          <label class="field"><span>Your Feedback *</span>
            <textarea id="fbMsg" placeholder="Describe your experience in detail (minimum 15 characters)…" required></textarea>
          </label>
          <button type="submit" class="btn primary"><i class="fa-solid fa-paper-plane"></i>Submit Feedback</button>
        </form>
      </div>
    </div>` : ''}

    <div class="card">
      <div class="card-head"><h2><i class="fa-solid fa-comments"></i>${isStudent ? 'My Feedback History' : 'All Feedback'}</h2>
        ${isAdmin ? `<select id="fbFilter" style="padding:8px 12px;border-radius:9px;border:1px solid var(--border);background:var(--card);font-size:13px">
          <option value="">All Status</option><option>Pending</option><option>In Progress</option><option>Reviewed</option></select>` : ''}
      </div>
      <div class="card-body tight"><div id="fbList"></div></div>
    </div>`;

  let rating = 0;

  if (isStudent){
    $$('#fbRating i').forEach(star => {
      star.onclick = () => {
        rating = Number(star.dataset.v);
        $$('#fbRating i').forEach(s => s.classList.toggle('on', Number(s.dataset.v) <= rating));
      };
      star.onmouseenter = () => $$('#fbRating i').forEach(s => s.classList.toggle('on', Number(s.dataset.v) <= Number(star.dataset.v)));
    });
    $('#fbRating').onmouseleave = () => $$('#fbRating i').forEach(s => s.classList.toggle('on', Number(s.dataset.v) <= rating));

    $('#fbForm').addEventListener('submit', e => {
      e.preventDefault();
      const cat = $('#fbCat').value;
      const msg = $('#fbMsg').value.trim();
      if (!cat){ App.toast('Please select a category.', 'error', 'Validation'); return; }
      if (rating === 0){ App.toast('Please provide a rating.', 'error', 'Validation'); return; }
      if (msg.length < 15){ App.toast('Feedback must be at least 15 characters.', 'error', 'Validation'); return; }

      DB.feedback.unshift({
        id: uid('FB'), studentId: myId, category: cat,
        subject: $('#fbSub').value, rating, message: msg,
        date: todayISO(), status:'Pending', reply:''
      });
      saveDB();
      App.logActivity('Submitted feedback: ' + cat);
      App.toast('Thank you! Your feedback has been submitted.', 'success', 'Feedback Submitted');
      $('#fbForm').reset();
      rating = 0;
      $$('#fbRating i').forEach(s => s.classList.remove('on'));
      renderList();
    });
  }

  function renderList(){
    let list = DB.feedback.slice();
    if (isStudent) list = list.filter(f => f.studentId === myId);
    if (isAdmin && $('#fbFilter')) {
      const f = $('#fbFilter').value;
      if (f) list = list.filter(x => x.status === f);
    }
    list.sort((a, b) => new Date(b.date) - new Date(a.date));

    const box = $('#fbList');
    if (!list.length){ box.innerHTML = App.emptyState('fa-comment-slash','No feedback yet','Feedback submissions will appear here.'); return; }

    box.innerHTML = list.map(f => {
      const s = studentById(f.studentId);
      return `<div class="notice-item">
        <div class="notice-ico"><i class="fa-solid fa-comment-dots"></i></div>
        <div class="notice-body">
          <h4>${esc(f.category)} <span class="badge grey">${esc(f.subject)}</span> ${App.statusBadge(f.status)}</h4>
          <div style="display:flex;gap:4px;margin:5px 0 7px;font-size:14px;color:#f59e0b">
            ${Array.from({length:5}, (_, i) => `<i class="fa-solid fa-star" style="opacity:${i < f.rating ? 1 : .22}"></i>`).join('')}
            <span style="font-size:11.5px;color:var(--muted);margin-left:5px">${f.rating}/5</span>
          </div>
          <p>${esc(f.message)}</p>
          ${f.reply ? `<div style="margin-top:10px;padding:11px 14px;border-radius:10px;background:var(--teal-soft);border-left:3px solid var(--teal);font-size:12.8px">
            <strong style="color:var(--teal)">Admin Reply:</strong> ${esc(f.reply)}</div>` : ''}
          <div class="notice-meta">
            ${isAdmin && s ? `<span><i class="fa-solid fa-user"></i>${esc(s.name)} (${f.studentId})</span>` : ''}
            <span><i class="fa-regular fa-calendar"></i>${fmtDate(f.date)}</span>
          </div>
          ${isAdmin ? `<div class="btn-group" style="margin-top:11px">
            <button class="btn ghost sm" data-reply="${f.id}"><i class="fa-solid fa-reply"></i>Reply &amp; Update</button>
            <button class="btn danger sm" data-delfb="${f.id}"><i class="fa-solid fa-trash"></i>Delete</button>
          </div>` : ''}
        </div>
      </div>`;
    }).join('');

    $$('[data-reply]', box).forEach(b => b.onclick = () => reply(b.dataset.reply));
    $$('[data-delfb]', box).forEach(b => b.onclick = () => del(b.dataset.delfb));
  }

  function reply(id){
    const f = DB.feedback.find(x => x.id === id);
    const s = studentById(f.studentId);
    App.modal({
      title:'Respond to Feedback', wide:true, okText:'Save Response',
      body:`
        <div class="info-item"><span>Student</span><strong>${esc(s ? s.name : f.studentId)}</strong></div>
        <div class="info-item"><span>Category</span><strong>${esc(f.category)} · ${esc(f.subject)}</strong></div>
        <div class="info-item"><span>Rating</span><strong>${f.rating}/5</strong></div>
        <div class="section-title">Student Message</div>
        <p style="font-size:13.4px;line-height:1.7;color:var(--muted);margin-bottom:18px">${esc(f.message)}</p>
        <label class="field"><span>Status</span><select id="rpStatus">
          ${['Pending','In Progress','Reviewed'].map(x => `<option ${x === f.status ? 'selected' : ''}>${x}</option>`).join('')}</select></label>
        <label class="field"><span>Admin Reply</span><textarea id="rpReply" placeholder="Write your response…">${esc(f.reply)}</textarea></label>
      `,
      onOk:(back) => {
        f.status = $('#rpStatus', back).value;
        f.reply = $('#rpReply', back).value.trim();
        saveDB();
        App.logActivity('Responded to feedback ' + f.id);
        App.toast('Response saved.', 'success', 'Saved');
        renderList();
      }
    });
  }

  function del(id){
    App.confirm('Delete this feedback entry?', () => {
      DB.feedback = DB.feedback.filter(x => x.id !== id);
      saveDB();
      App.toast('Feedback deleted.', 'warn', 'Deleted');
      renderList();
    }, { title:'Delete Feedback', okText:'Yes, Delete' });
  }

  const ff = $('#fbFilter');
  if (ff) ff.onchange = renderList;

  renderList();
});
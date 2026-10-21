/* ==========================================================
   notices.js — Notices & announcements
   ========================================================== */
document.addEventListener('DOMContentLoaded', () => {
  App.init({ active:'notices.html', title:'Notices & Announcements', subtitle:'Circulars, events and important updates' });

  const c = $('#content');
  const isAdmin = App.isAdmin();

  c.innerHTML = `
    <div class="card">
      <div class="card-head">
        <h2><i class="fa-solid fa-bullhorn"></i>Notice Board</h2>
        ${isAdmin ? '<button class="btn primary sm" id="addNotice"><i class="fa-solid fa-plus"></i>Publish Notice</button>' : ''}
      </div>
      <div class="filter-bar">
        <label class="field grow"><span>Search</span><input id="nSearch" placeholder="Search notices…"></label>
        <label class="field"><span>Category</span><select id="nCat"><option value="">All Categories</option>
          ${['Academic','Examination','Events','Holiday','General'].map(x => `<option>${x}</option>`).join('')}</select></label>
        <label class="field"><span>Priority</span><select id="nPri"><option value="">All Priorities</option>
          <option>High</option><option>Medium</option><option>Low</option></select></label>
      </div>
      <div class="card-body tight"><div id="noticeList"></div></div>
    </div>`;

  function apply(){
    const q = $('#nSearch').value.trim().toLowerCase();
    const cat = $('#nCat').value, pri = $('#nPri').value;
    let list = DB.notices.filter(n =>
      (!q || n.title.toLowerCase().includes(q) || n.body.toLowerCase().includes(q)) &&
      (!cat || n.category === cat) && (!pri || n.priority === pri));
    list.sort((a, b) => (b.pinned - a.pinned) || (new Date(b.date) - new Date(a.date)));
    render(list);
  }

  function render(list){
    const box = $('#noticeList');
    if (!list.length){ box.innerHTML = App.emptyState('fa-bullhorn','No notices','Nothing matches your filters.'); return; }

    const icons = { Examination:'fa-file-pen', Events:'fa-calendar-star', Holiday:'fa-umbrella-beach', General:'fa-circle-info', Academic:'fa-graduation-cap' };
    const classes = { Examination:'exam', Events:'event', Holiday:'holiday', General:'general', Academic:'' };

    box.innerHTML = list.map(n => `
      <div class="notice-item">
        <div class="notice-ico ${classes[n.category] || ''}"><i class="fa-solid ${icons[n.category] || 'fa-bullhorn'}"></i></div>
        <div class="notice-body">
          <h4>${esc(n.title)} ${n.pinned ? '<span class="pin-flag">📌 PINNED</span>' : ''}</h4>
          <p>${esc(n.body)}</p>
          <div class="notice-meta">
            <span><i class="fa-regular fa-calendar"></i>${fmtDate(n.date)}</span>
            <span><i class="fa-solid fa-user"></i>${esc(n.author)}</span>
            <span><i class="fa-solid fa-tag"></i>${n.category}</span>
            <span>${App.statusBadge(n.priority)}</span>
          </div>
          ${isAdmin ? `<div class="btn-group" style="margin-top:11px">
            <button class="btn ghost sm" data-pin="${n.id}"><i class="fa-solid fa-thumbtack"></i>${n.pinned ? 'Unpin' : 'Pin'}</button>
            <button class="btn ghost sm" data-editn="${n.id}"><i class="fa-solid fa-pen"></i>Edit</button>
            <button class="btn danger sm" data-deln="${n.id}"><i class="fa-solid fa-trash"></i>Delete</button>
          </div>` : ''}
        </div>
      </div>`).join('');

    $$('[data-pin]', box).forEach(b => b.onclick = () => {
      const n = DB.notices.find(x => x.id === b.dataset.pin);
      n.pinned = !n.pinned;
      saveDB();
      App.toast(n.pinned ? 'Notice pinned to top.' : 'Notice unpinned.', 'info', 'Updated');
      apply();
    });
    $$('[data-editn]', box).forEach(b => b.onclick = () => openForm(DB.notices.find(x => x.id === b.dataset.editn)));
    $$('[data-deln]', box).forEach(b => b.onclick = () => del(b.dataset.deln));
  }

  function openForm(n){
    const isEdit = !!n;
    n = n || { id:'', title:'', body:'', category:'General', priority:'Medium', pinned:false, date:todayISO(), author:'Administration' };
    App.modal({
      title: isEdit ? 'Edit Notice' : 'Publish Notice', wide:true,
      okText: isEdit ? 'Update' : 'Publish',
      body:`
        <label class="field"><span>Title *</span><input id="nTitle" value="${esc(n.title)}"></label>
        <div class="form-grid three">
          <label class="field"><span>Category</span><select id="nCatF">${['Academic','Examination','Events','Holiday','General'].map(x => `<option ${x === n.category ? 'selected' : ''}>${x}</option>`).join('')}</select></label>
          <label class="field"><span>Priority</span><select id="nPriF">${['High','Medium','Low'].map(x => `<option ${x === n.priority ? 'selected' : ''}>${x}</option>`).join('')}</select></label>
          <label class="field"><span>Date</span><input id="nDateF" type="date" value="${n.date}"></label>
        </div>
        <label class="field"><span>Author / Department</span><input id="nAuthorF" value="${esc(n.author)}"></label>
        <label class="field"><span>Notice Content *</span><textarea id="nBodyF" style="min-height:140px">${esc(n.body)}</textarea></label>
        <label class="check"><input type="checkbox" id="nPinF" ${n.pinned ? 'checked' : ''}><span>Pin this notice to the top of the board</span></label>
      `,
      onOk:(back) => {
        const title = $('#nTitle', back).value.trim();
        const body = $('#nBodyF', back).value.trim();
        if (!title || !body){ App.toast('Title and content are required.', 'error', 'Validation'); return false; }
        const obj = {
          id: isEdit ? n.id : uid('N'),
          title, body,
          category:$('#nCatF', back).value,
          priority:$('#nPriF', back).value,
          date:$('#nDateF', back).value,
          author:$('#nAuthorF', back).value.trim() || 'Administration',
          pinned:$('#nPinF', back).checked
        };
        if (isEdit) DB.notices[DB.notices.findIndex(x => x.id === n.id)] = obj;
        else DB.notices.unshift(obj);
        saveDB();
        App.logActivity((isEdit ? 'Updated' : 'Published') + ' notice: ' + title);
        App.toast('Notice ' + (isEdit ? 'updated' : 'published') + '.', 'success', 'Saved');
        apply();
      }
    });
  }

  function del(id){
    const n = DB.notices.find(x => x.id === id);
    App.confirm(`Delete the notice <strong>${esc(n.title)}</strong>?`, () => {
      DB.notices = DB.notices.filter(x => x.id !== id);
      saveDB();
      App.logActivity('Deleted notice: ' + n.title);
      App.toast('Notice deleted.', 'warn', 'Deleted');
      apply();
    }, { title:'Delete Notice', okText:'Yes, Delete' });
  }

  ['nSearch','nCat','nPri'].forEach(i => $('#' + i).addEventListener('input', apply));
  const an = $('#addNotice');
  if (an) an.onclick = () => openForm(null);

  apply();
});
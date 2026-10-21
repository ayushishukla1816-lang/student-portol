/* ==========================================================
   library.js — Library management
   ========================================================== */
document.addEventListener('DOMContentLoaded', () => {
  App.init({ active:'library.html', title:'Library Management', subtitle:'Book catalogue, issue and return' });

  const c = $('#content');
  const isAdmin = App.isAdmin();
  const isStudent = App.isStudent();
  const myId = App.myId();

  const totalBooks = DB.books.reduce((s, b) => s + b.copies, 0);
  const available  = DB.books.reduce((s, b) => s + b.available, 0);
  const activeIssues = DB.issues.filter(i => i.status === 'Issued').length;
  const overdueCount = DB.issues.filter(i => i.status === 'Issued' && new Date(i.dueDate) < new Date()).length;

  c.innerHTML = `
    <div class="stat-grid">
      ${miniStat('Total Books', totalBooks, 'fa-book', 'blue')}
      ${miniStat('Available', available, 'fa-circle-check', 'green')}
      ${miniStat('Issued', activeIssues, 'fa-book-open-reader', 'orange')}
      ${miniStat('Overdue', overdueCount, 'fa-triangle-exclamation', overdueCount > 0 ? 'red' : 'green')}
    </div>

    <div class="card">
      <div class="card-head">
        <h2><i class="fa-solid fa-book"></i>Book Catalogue</h2>
        <div class="btn-group no-print">
          <button class="btn ghost sm" id="expLib"><i class="fa-solid fa-file-csv"></i>Export</button>
          ${isAdmin ? '<button class="btn primary sm" id="addBook"><i class="fa-solid fa-plus"></i>Add Book</button>' : ''}
        </div>
      </div>
      <div class="filter-bar">
        <label class="field grow"><span>Search</span><input id="lSearch" placeholder="Search by title, author or ISBN…"></label>
        <label class="field"><span>Category</span><select id="lCat"><option value="">All</option>${[...new Set(DB.books.map(b => b.category))].map(x => `<option>${x}</option>`).join('')}</select></label>
        <label class="field"><span>Availability</span><select id="lAvail"><option value="">All</option><option value="yes">Available</option><option value="no">Out of stock</option></select></label>
      </div>
      <div class="card-body tight"><div id="bookTable"></div></div>
    </div>

    <div class="card">
      <div class="card-head"><h2><i class="fa-solid fa-book-open-reader"></i>${isStudent ? 'My Issued Books' : 'Issue Records'}</h2></div>
      <div class="card-body tight"><div id="issueTable"></div></div>
    </div>`;

  function apply(){
    const q = $('#lSearch').value.trim().toLowerCase();
    const cat = $('#lCat').value;
    const av = $('#lAvail').value;
    const view = DB.books.filter(b =>
      (!q || b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q) || b.isbn.includes(q)) &&
      (!cat || b.category === cat) &&
      (!av || (av === 'yes' ? b.available > 0 : b.available === 0)));
    renderBooks(view);
  }

  function renderBooks(view){
    const box = $('#bookTable');
    if (!view.length){ box.innerHTML = App.emptyState('fa-book','No books found','Try different search terms.'); return; }
    box.innerHTML = `<div class="table-wrap"><table class="data-table">
      <thead><tr><th>Title</th><th>Author</th><th>ISBN</th><th>Category</th><th>Shelf</th><th>Available</th><th>Actions</th></tr></thead>
      <tbody>${view.map(b => `<tr>
        <td><strong style="font-size:13.3px">${esc(b.title)}</strong></td>
        <td>${esc(b.author)}</td>
        <td class="mono">${b.isbn}</td>
        <td><span class="badge grey">${esc(b.category)}</span></td>
        <td>${b.shelf}</td>
        <td>${b.available > 0 ? `<span class="badge ok">${b.available} / ${b.copies}</span>` : '<span class="badge bad">Out of stock</span>'}</td>
        <td><div class="td-actions">
          ${isAdmin ? `<button class="btn-icon" data-issue="${b.id}" title="Issue" ${b.available === 0 ? 'disabled' : ''}><i class="fa-solid fa-arrow-right-from-bracket"></i></button>
            <button class="btn-icon" data-editb="${b.id}" title="Edit"><i class="fa-solid fa-pen"></i></button>
            <button class="btn-icon danger" data-delb="${b.id}" title="Delete"><i class="fa-solid fa-trash"></i></button>` : ''}
        </div></td>
      </tr>`).join('')}</tbody></table></div>`;

    $$('[data-issue]', box).forEach(b => b.onclick = () => issueBook(b.dataset.issue));
    $$('[data-editb]', box).forEach(b => b.onclick = () => bookForm(DB.books.find(x => x.id === b.dataset.editb)));
    $$('[data-delb]', box).forEach(b => b.onclick = () => delBook(b.dataset.delb));
  }

  function renderIssues(){
    let list = DB.issues.slice();
    if (isStudent) list = list.filter(i => i.studentId === myId);
    list.sort((a, b) => new Date(b.issueDate) - new Date(a.issueDate));

    const box = $('#issueTable');
    if (!list.length){ box.innerHTML = App.emptyState('fa-book-open','No issue records','Nothing to display.'); return; }

    box.innerHTML = `<div class="table-wrap"><table class="data-table">
      <thead><tr><th>Book</th>${isStudent ? '' : '<th>Student</th>'}<th>Issued</th><th>Due</th><th>Returned</th><th>Status</th>${isAdmin ? '<th>Actions</th>' : ''}</tr></thead>
      <tbody>${list.map(i => {
        const b = bookById(i.bookId) || { title:i.bookId };
        const s = studentById(i.studentId) || { name:i.studentId };
        const overdue = i.status === 'Issued' && new Date(i.dueDate) < new Date();
        return `<tr>
          <td><strong style="font-size:13.2px">${esc(b.title)}</strong></td>
          ${isStudent ? '' : `<td><div class="td-user" style="min-width:0"><img src="${s.img}" style="width:30px;height:30px" onerror="this.src='https://i.pravatar.cc/40?u=${i.studentId}'">
            <div><strong style="font-size:12.8px">${esc(s.name)}</strong><span>${i.studentId}</span></div></div></td>`}
          <td>${fmtDate(i.issueDate)}</td>
          <td>${fmtDate(i.dueDate)}</td>
          <td>${i.returnDate ? fmtDate(i.returnDate) : '—'}</td>
          <td>${overdue ? '<span class="badge bad">Overdue</span>' : App.statusBadge(i.status)}</td>
          ${isAdmin ? `<td>${i.status === 'Issued' ? `<button class="btn ghost sm" data-return="${i.id}"><i class="fa-solid fa-rotate-left"></i>Return</button>` : '—'}</td>` : ''}
        </tr>`; }).join('')}</tbody></table></div>`;

    $$('[data-return]', box).forEach(b => b.onclick = () => returnBook(b.dataset.return));
  }

  function issueBook(bookId){
    const b = bookById(bookId);
    App.modal({
      title:'Issue Book — ' + b.title, okText:'Issue Book',
      body:`
        <label class="field"><span>Student *</span><select id="iStu">
          ${DB.students.map(s => `<option value="${s.id}">${esc(s.name)} (${s.id})</option>`).join('')}</select></label>
        <div class="form-grid two">
          <label class="field"><span>Issue Date</span><input id="iDate" type="date" value="${todayISO()}"></label>
          <label class="field"><span>Due Date</span><input id="iDue" type="date" value="${new Date(Date.now() + 14*864e5).toISOString().slice(0,10)}"></label>
        </div>`,
      onOk:(back) => {
        const sid = $('#iStu', back).value;
        DB.issues.push({
          id: uid('ISS'), bookId, studentId: sid,
          issueDate: $('#iDate', back).value,
          dueDate: $('#iDue', back).value,
          returnDate: null, status:'Issued'
        });
        b.available = Math.max(0, b.available - 1);
        saveDB();
        App.logActivity('Issued "' + b.title + '" to ' + sid);
        App.toast('Book issued successfully.', 'success', 'Issued');
        apply(); renderIssues();
      }
    });
  }

  function returnBook(issueId){
    const i = DB.issues.find(x => x.id === issueId);
    const b = bookById(i.bookId);
    App.confirm(`Confirm return of <strong>${esc(b.title)}</strong>?`, () => {
      i.status = 'Returned';
      i.returnDate = todayISO();
      b.available = Math.min(b.copies, b.available + 1);
      saveDB();
      App.logActivity('Returned "' + b.title + '"');
      App.toast('Book returned successfully.', 'success', 'Returned');
      apply(); renderIssues();
    }, { title:'Confirm Return', okText:'Yes, Return' });
  }

  function bookForm(b){
    const isEdit = !!b;
    b = b || { id:'', title:'', author:'', isbn:'', category:'Computer Science', copies:1, available:1, shelf:'' };
    App.modal({
      title: isEdit ? 'Edit Book' : 'Add Book', wide:true,
      okText: isEdit ? 'Update' : 'Add',
      body:`
        <label class="field"><span>Title *</span><input id="bTitle" value="${esc(b.title)}"></label>
        <div class="form-grid two">
          <label class="field"><span>Author *</span><input id="bAuthor" value="${esc(b.author)}"></label>
          <label class="field"><span>ISBN</span><input id="bIsbn" value="${esc(b.isbn)}"></label>
          <label class="field"><span>Category</span><input id="bCat" value="${esc(b.category)}"></label>
          <label class="field"><span>Shelf</span><input id="bShelf" value="${esc(b.shelf)}"></label>
          <label class="field"><span>Total Copies</span><input id="bCopies" type="number" min="1" value="${b.copies}"></label>
          <label class="field"><span>Available</span><input id="bAvail" type="number" min="0" value="${b.available}"></label>
        </div>`,
      onOk:(back) => {
        const title = $('#bTitle', back).value.trim();
        if (!title){ App.toast('Title is required.', 'error', 'Validation'); return false; }
        const copies = Number($('#bCopies', back).value) || 1;
        const obj = {
          id: isEdit ? b.id : uid('B'),
          title, author:$('#bAuthor', back).value.trim(),
          isbn:$('#bIsbn', back).value.trim(),
          category:$('#bCat', back).value.trim(),
          shelf:$('#bShelf', back).value.trim(),
          copies,
          available: Math.min(Number($('#bAvail', back).value) || 0, copies)
        };
        if (isEdit) DB.books[DB.books.findIndex(x => x.id === b.id)] = obj;
        else DB.books.push(obj);
        saveDB();
        App.toast('Book ' + (isEdit ? 'updated' : 'added') + '.', 'success', 'Saved');
        apply();
      }
    });
  }

  function delBook(id){
    const b = bookById(id);
    App.confirm(`Delete <strong>${esc(b.title)}</strong> from the catalogue?`, () => {
      DB.books = DB.books.filter(x => x.id !== id);
      saveDB();
      App.toast('Book deleted.', 'warn', 'Deleted');
      apply();
    }, { title:'Delete Book', okText:'Yes, Delete' });
  }

  ['lSearch','lCat','lAvail'].forEach(i => $('#' + i).addEventListener('input', apply));
  const ab = $('#addBook');
  if (ab) ab.onclick = () => bookForm(null);
  $('#expLib').onclick = () => {
    const rows = [['ID','Title','Author','ISBN','Category','Shelf','Copies','Available']];
    DB.books.forEach(b => rows.push([b.id, b.title, b.author, b.isbn, b.category, b.shelf, b.copies, b.available]));
    App.downloadCSV('library-catalogue.csv', rows);
  };

  apply();
  renderIssues();
});

function miniStat(label, value, icon, cls){
  return `<div class="stat-card"><div class="stat-top"><div class="stat-icon ${cls}"><i class="fa-solid ${icon}"></i></div></div>
    <div class="stat-label">${label}</div><div class="stat-value">${value}</div></div>`;
}
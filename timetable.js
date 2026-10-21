/* ==========================================================
   timetable.js — Weekly class timetable
   ========================================================== */
document.addEventListener('DOMContentLoaded', () => {
  const isStudent = App.isStudent();
  const st = isStudent ? studentById(App.myId()) : null;
  const defaultDept = st ? st.dept : 'CSE';

  App.init({ active:'timetable.html', title:'Timetable', subtitle:'Weekly class schedule (Monday – Saturday)' });

  const c = $('#content');
  const isAdmin = App.isAdmin();

  c.innerHTML = `
    <div class="card">
      <div class="card-head">
        <h2><i class="fa-solid fa-table-cells"></i>Weekly Schedule</h2>
        <div class="btn-group no-print">
          <select id="ttDept" style="padding:8px 12px;border-radius:9px;border:1px solid var(--border);background:var(--card);font-size:13px;font-weight:600">
            ${DEPARTMENTS.map(d => `<option value="${d}" ${d === defaultDept ? 'selected' : ''}>${d} — ${DEPT_FULL[d]}</option>`).join('')}
          </select>
          <button class="btn ghost sm" onclick="window.print()"><i class="fa-solid fa-print"></i>Print</button>
          ${isAdmin ? '<button class="btn primary sm" id="addTT"><i class="fa-solid fa-plus"></i>Add Entry</button>' : ''}
        </div>
      </div>
      <div class="card-body"><div id="ttArea"></div></div>
    </div>

    <div class="card">
      <div class="card-head"><h2><i class="fa-solid fa-sun"></i>Today's Classes</h2></div>
      <div class="card-body tight" id="todayArea"></div>
    </div>
  `;

  const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const SLOTS = ['09:00 - 10:00','10:00 - 11:00','11:15 - 12:15','12:15 - 13:15','14:00 - 15:00'];

  function render(){
    const dept = $('#ttDept').value;
    const rows = DB.timetable.filter(t => t.dept === dept);

    let html = `<div class="tt-grid"><table class="tt-table"><thead><tr><th>Time</th>`;
    DAYS.forEach(d => html += `<th>${d}</th>`);
    html += `</tr></thead><tbody>`;

    SLOTS.forEach(slot => {
      html += `<tr><th style="text-align:right;padding-right:12px;font-size:11.5px;white-space:nowrap">${slot}</th>`;
      DAYS.forEach(day => {
        const e = rows.find(r => r.day === day && r.slot === slot);
        if (e){
          const idx = SLOTS.indexOf(slot) % 6 + 1;
          html += `<td><div class="tt-cell c${idx}" data-tt="${e.id}">
            <strong>${esc(e.subjectName)}</strong>
            <span>${esc(facultyName(e.faculty))}</span>
            <span style="margin-top:5px"><i class="fa-solid fa-location-dot"></i> ${e.room}</span>
          </div></td>`;
        } else {
          html += `<td><div class="tt-empty">—</div></td>`;
        }
      });
      html += `</tr>`;
    });
    html += `</tbody></table></div>`;
    $('#ttArea').innerHTML = html;

    if (isAdmin){
      $$('[data-tt]').forEach(el => el.onclick = () => editEntry(DB.timetable.find(x => x.id === el.dataset.tt)));
    }

    renderToday(dept);
  }

  function renderToday(dept){
    const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    const today = days[new Date().getDay()];
    const list = DB.timetable.filter(t => t.dept === dept && t.day === today).sort((a, b) => a.slot.localeCompare(b.slot));
    const box = $('#todayArea');
    if (today === 'Sunday'){ box.innerHTML = App.emptyState('fa-mug-hot','Holiday','No classes scheduled today.'); return; }
    if (!list.length){ box.innerHTML = App.emptyState('fa-calendar-xmark','No classes','No classes scheduled for today.'); return; }
    box.innerHTML = list.map(t => `<div class="exam-item">
      <div class="exam-date" style="background:var(--teal);color:#04231f">
        <b>${t.slot.slice(0,2)}</b><span>${t.slot.slice(3,5)}</span></div>
      <div class="exam-info"><strong>${esc(t.subjectName)}</strong>
        <span>${esc(facultyName(t.faculty))} · Room ${t.room} · ${t.subject}</span></div>
      <span class="badge teal">${t.slot}</span>
    </div>`).join('');
  }

  function editEntry(e){
    const isEdit = !!e;
    e = e || { id:'', dept:$('#ttDept').value, day:'Monday', slot:SLOTS[0], subject:'', subjectName:'', faculty:'', room:'' };
    const dept = e.dept || 'CSE';

    App.modal({
      title: isEdit ? 'Edit Timetable Entry' : 'Add Timetable Entry', wide:true,
      okText: isEdit ? 'Update' : 'Add',
      body:`
        <div class="form-grid two">
          <label class="field"><span>Department</span><select id="tDept">${DEPARTMENTS.map(d => `<option ${d === dept ? 'selected' : ''}>${d}</option>`).join('')}</select></label>
          <label class="field"><span>Day</span><select id="tDay">${DAYS.map(d => `<option ${d === e.day ? 'selected' : ''}>${d}</option>`).join('')}</select></label>
          <label class="field"><span>Time Slot</span><select id="tSlot">${SLOTS.map(s => `<option ${s === e.slot ? 'selected' : ''}>${s}</option>`).join('')}</select></label>
          <label class="field"><span>Room</span><input id="tRoom" value="${esc(e.room)}" placeholder="A-101"></label>
        </div>
        <label class="field"><span>Subject</span><select id="tSub"></select></label>
        <label class="field"><span>Faculty</span><select id="tFac">${DB.faculty.map(f => `<option value="${f.id}" ${f.id === e.faculty ? 'selected' : ''}>${esc(f.name)} (${f.dept})</option>`).join('')}</select></label>
      `,
      onOk:(back) => {
        const deptV = $('#tDept', back).value;
        const subCode = $('#tSub', back).value;
        const subj = SUBJECTS[deptV].find(s => s.code === subCode);
        const obj = {
          id: isEdit ? e.id : uid('TT'),
          dept: deptV,
          day: $('#tDay', back).value,
          slot: $('#tSlot', back).value,
          subject: subCode,
          subjectName: subj ? subj.name : subCode,
          faculty: $('#tFac', back).value,
          room: $('#tRoom', back).value.trim() || 'TBA'
        };
        if (isEdit) DB.timetable[DB.timetable.findIndex(x => x.id === e.id)] = obj;
        else DB.timetable.push(obj);
        saveDB();
        App.logActivity((isEdit ? 'Updated' : 'Added') + ' timetable entry: ' + obj.subjectName);
        App.toast('Timetable ' + (isEdit ? 'updated' : 'added') + '.', 'success', 'Saved');
        $('#ttDept').value = deptV;
        render();
      }
    });

    /* dynamic subject list */
    setTimeout(() => {
      const back = $('.modal-backdrop');
      const dSel = $('#tDept', back), sSel = $('#tSub', back);
      const fill = () => {
        sSel.innerHTML = SUBJECTS[dSel.value].map(s => `<option value="${s.code}" ${s.code === e.subject ? 'selected' : ''}>${s.code} — ${s.name}</option>`).join('');
      };
      dSel.onchange = fill;
      fill();
      /* edit delete button */
      if (isEdit){
        const foot = $('.modal-foot', back);
        const del = document.createElement('button');
        del.className = 'btn danger';
        del.innerHTML = '<i class="fa-solid fa-trash"></i>Delete';
        del.style.marginRight = 'auto';
        del.onclick = () => {
          back.remove();
          App.confirm('Delete this timetable entry?', () => {
            DB.timetable = DB.timetable.filter(x => x.id !== e.id);
            saveDB();
            App.toast('Entry deleted.', 'warn', 'Deleted');
            render();
          }, { title:'Delete Entry', okText:'Yes, Delete' });
        };
        foot.insertBefore(del, foot.firstChild);
      }
    }, 30);
  }

  $('#ttDept').onchange = render;
  const at = $('#addTT');
  if (at) at.onclick = () => editEntry(null);

  render();
});
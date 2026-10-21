# Smart Student Portal Management System

**B.Tech Computer Science & Engineering — Major Project**

A complete, professional, multi-page **Student Portal Management System** built entirely with
**HTML5, CSS3 and Vanilla JavaScript** — no frameworks, no backend, no paid APIs.

---

## 1. Project Overview

The Smart Student Portal is a front-end academic management system that simulates a real
university portal. It provides two role-based experiences:

- **Administrator** — manage students, attendance, results, courses, timetable, assignments,
  fees, faculty, library, notices, feedback and analytics.
- **Student** — view a personal dashboard, profile, attendance, results, timetable, assignments,
  fees, notices and submit feedback.

All data is stored in the browser's **LocalStorage**, seeded with realistic sample data for
**10 fictional students**, 8 courses, 6 faculty members, a full weekly timetable, assignments,
library records, notices and feedback.

---

## 2. Objectives

1. Build a realistic, multi-page academic management system without a backend.
2. Demonstrate mastery of HTML5 semantic structure, advanced CSS3 and Vanilla JavaScript.
3. Implement full CRUD operations with persistent client-side storage.
4. Apply professional UI/UX principles — responsive layout, dark mode, accessible forms.
5. Derive dashboard statistics from a single consistent data model.
6. Provide data backup, restore and reset utilities.

---

## 3. Technology Stack

| Layer | Technology |
|---|---|
| Structure | HTML5 |
| Styling | CSS3 (custom properties, grid, flexbox, animations) |
| Behaviour | Vanilla JavaScript (ES6+) |
| Persistence | Browser LocalStorage |
| Charts | Chart.js 4 (CDN) |
| Icons | Font Awesome 6 (CDN) |
| Images | pravatar.cc (public placeholder avatars) |

**No** React, Angular, Vue, Bootstrap, Tailwind, PHP or backend of any kind.

---

## 4. Folder Structure

---

## 5. Installation & Running

### Requirements
- Visual Studio Code
- Live Server extension (by Ritwick Dey)

### Steps
1. Extract the project folder anywhere on your machine.
2. Open the folder in VS Code: `File → Open Folder…`
3. Install the **Live Server** extension from the Extensions marketplace.
4. Right-click `index.html` → **Open with Live Server**.
5. The browser opens at `http://127.0.0.1:5500/index.html`.

> Do **not** open the HTML files by double-clicking them. LocalStorage behaves
> inconsistently with the `file://` protocol; always use Live Server.

---

## 6. Demo Credentials

| Role | Username | Password |
|---|---|---|
| Administrator | `admin@campus.edu` | `admin123` |
| Student | `CSE2021001` (or any student ID) | `student123` |

The login page has **"Use"** buttons that fill the credentials automatically.

Valid student IDs: `CSE2021001` – `CSE2021004`, `ECE2021005` – `ECE2021006`,
`ME2021007` – `ME2021008`, `IT2021009` – `IT2021010`.

---

## 7. Modules & Features

### 7.1 Login (`index.html`)
- Role tabs for Administrator / Student
- Show/hide password toggle
- Form validation with inline error messages
- Demo credential quick-fill
- Session persisted in LocalStorage, redirects to `dashboard.html`

### 7.2 Dashboard (`dashboard.html`)
**Admin:** total students, courses, average attendance, average marks, pending fees,
attendance trend line chart, department doughnut chart, subject performance bar chart,
quick actions, recent activity feed, upcoming examinations, low-attendance alerts, latest notices.

**Student:** personal hero banner, attendance, average marks, CGPA, fee balance,
pending assignments, marks-by-subject stacked chart, attendance breakdown doughnut,
today's classes, upcoming deadlines, notices.

### 7.3 Student Directory (`students.html`)
Search, filter by department / semester / status, sortable table, add / edit / view / delete,
confirmation modal before deletion, CSV export.

### 7.4 Student Profile (`student-profile.html`)
Hero banner, personal information, guardian & emergency contacts, full academic record table,
attendance summary with progress bar, fee status, achievements, library records,
document placeholders, profile editing, print-friendly layout.

### 7.5 Attendance (`attendance.html`)
Date / department / semester / subject selectors, Present–Absent–Leave radio marking,
bulk save, summary table with percentages and progress bars, monthly colour-coded calendar,
low-attendance alert, CSV export, student-specific read-only view.

### 7.6 Results (`results.html`)
Subject-wise marks table (Internal / Practical / Assignment / Final), automatic total,
percentage, grade and pass/fail, CGPA calculation, report-card modal, mark editing,
CSV export, printable report card.

### 7.7 Courses (`courses.html`)
Programme cards with description, credits, duration, seats, fee, learning objectives;
subject catalogue table; full CRUD for administrators.

### 7.8 Timetable (`timetable.html`)
Colour-coded weekly grid (Monday–Saturday), today's classes panel, admin CRUD
with day/slot/subject/faculty/room, printable.

### 7.9 Assignments (`assignments.html`)
Assignment cards with deadline indicators and overdue badges, submission status tracking
(Pending / Submitted / Graded), per-student status editor for admins, CRUD, CSV export.

### 7.10 Fees (`fees.html`)
Fee breakdown (tuition, exam, library, other), paid / balance / status,
payment recording modal, payment history, demo receipt printing, CSV export,
student-specific read-only view.

### 7.11 Faculty (`faculty.html`)
Faculty profile cards with photos, qualification, experience, subjects taught;
directory table; CRUD for admins.

### 7.12 Library (`library.html`)
Book catalogue with availability, category filter, issue / return workflow,
issue records with overdue indicators, CRUD, CSV export.

### 7.13 Notices (`notices.html`)
Category-coloured notice board (Academic / Examination / Events / Holiday / General),
priority badges, pin to top, search & filter, CRUD.

### 7.14 Feedback (`feedback.html`)
Star-rating form with validation, feedback history, admin reply & status update
(Pending / In Progress / Reviewed), delete.

### 7.15 Reports (`reports.html`)
Filter by department and semester; attendance-by-department bar chart,
average-marks line chart, fee-collection doughnut, enrolment polar area,
department summary table, detailed student report, CSV export, printable.

### 7.16 Settings (`settings.html`)
Profile editing, appearance/theme preferences, data backup (JSON download),
restore from backup, storage statistics, reset demo data, project information
and academic disclaimer.

### 7.17 Support (`support.html`)
Searchable FAQ accordion, contact information, quick navigation,
keyboard shortcuts reference.

---

## 8. Data Model

All records live inside a single LocalStorage key `ssp_db_v2`:

```js
{
  users:      [{ id, name, email, password, role, avatar }],
  students:   [{ id, name, dept, sem, section, gender, email, phone, img,
                 dob, blood, status, admission, address, guardian,
                 guardianPhone, emergency, achievements[] }],
  faculty:    [{ id, name, dept, qual, designation, email, phone, exp,
                 img, subjects[] }],
  courses:    [{ id, code, name, dept, duration, credits, semesters,
                 seats, fee, desc, objectives[] }],
  attendance: [{ id, studentId, subject, subjectName, date, status, period }],
  marks:      [{ id, studentId, subject, subjectName, credits,
                 internal, practical, assignment, final, total, grade, status }],
  fees:       [{ studentId, tuition, exam, library, other, total, paid,
                 balance, dueDate, status, payments[] }],
  assignments:[{ id, title, subject, dept, desc, maxMarks, deadline,
                 created, submissions: { studentId: 'Pending'|'Submitted'|'Graded' } }],
  timetable:  [{ id, dept, day, slot, subject, subjectName, faculty, room }],
  books:      [{ id, title, author, isbn, category, copies, available, shelf }],
  issues:     [{ id, bookId, studentId, issueDate, dueDate, returnDate, status }],
  notices:    [{ id, title, category, priority, pinned, date, author, body }],
  feedback:   [{ id, studentId, category, subject, rating, message,
                 date, status, reply }],
  exams:      [{ id, subject, name, date, time, room, type }]
}
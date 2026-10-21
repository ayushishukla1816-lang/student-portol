/* ==========================================================
   data.js — Central demo data layer (LocalStorage backed)
   ========================================================== */
const SESSION_KEY  = 'ssp_session_v2';
const THEME_KEY    = 'ssp_theme_v2';
const DB_KEY       = 'ssp_db_v2';
const ACTIVITY_KEY = 'ssp_activity_v2';

/* ---------- Deterministic PRNG (stable demo data) ---------- */
function seededRandom(seed){
  let s = seed;
  return function(){ s = (s * 9301 + 49297) % 233280; return s / 233280; };
}

/* ---------- Constants ---------- */
const DEPARTMENTS = ['CSE','ECE','ME','IT'];

const DEPT_FULL = {
  CSE:'Computer Science & Engineering',
  ECE:'Electronics & Communication Engineering',
  ME :'Mechanical Engineering',
  IT :'Information Technology'
};

const SUBJECTS = {
  CSE:[
    {code:'CS501',name:'Data Structures & Algorithms',credits:4,faculty:'F001'},
    {code:'CS502',name:'Database Management Systems',credits:4,faculty:'F002'},
    {code:'CS503',name:'Operating Systems',credits:3,faculty:'F001'},
    {code:'CS504',name:'Computer Networks',credits:3,faculty:'F002'},
    {code:'CS505',name:'Web Technologies',credits:3,faculty:'F006'}
  ],
  ECE:[
    {code:'EC501',name:'Digital Electronics',credits:4,faculty:'F003'},
    {code:'EC502',name:'Signals & Systems',credits:4,faculty:'F003'},
    {code:'EC503',name:'Microprocessors',credits:3,faculty:'F004'},
    {code:'EC504',name:'Communication Systems',credits:3,faculty:'F004'},
    {code:'EC505',name:'VLSI Design',credits:3,faculty:'F003'}
  ],
  ME :[
    {code:'ME501',name:'Thermodynamics',credits:4,faculty:'F005'},
    {code:'ME502',name:'Fluid Mechanics',credits:4,faculty:'F005'},
    {code:'ME503',name:'Machine Design',credits:3,faculty:'F005'},
    {code:'ME504',name:'Manufacturing Processes',credits:3,faculty:'F005'},
    {code:'ME505',name:'Heat Transfer',credits:3,faculty:'F005'}
  ],
  IT :[
    {code:'IT501',name:'Web Programming',credits:4,faculty:'F006'},
    {code:'IT502',name:'Information Security',credits:4,faculty:'F006'},
    {code:'IT503',name:'Cloud Computing',credits:3,faculty:'F006'},
    {code:'IT504',name:'Data Mining',credits:3,faculty:'F002'},
    {code:'IT505',name:'Mobile Application Development',credits:3,faculty:'F006'}
  ]
};

/* ---------- Empty DB shell ---------- */
const DB = {
  users      : [],
  students   : [],
  faculty    : [],
  courses    : [],
  departments: DEPARTMENTS,
  subjects   : SUBJECTS,
  attendance : [],
  marks      : [],
  fees       : [],
  assignments: [],
  timetable  : [],
  books      : [],
  issues     : [],
  notices    : [],
  feedback   : [],
  exams      : []
};

/* ==========================================================
   SEED BUILDERS
   ========================================================== */
function buildUsers(){
  return [
    {id:'U1',name:'Dr. Rajesh Kumar',email:'admin@campus.edu',password:'admin123',role:'admin',avatar:'https://i.pravatar.cc/150?img=60'}
  ];
}

function buildStudents(){
  return [
    {id:'CSE2021001',name:'Aarav Sharma',dept:'CSE',sem:5,section:'A',gender:'Male',
     email:'aarav.sharma@campus.edu',phone:'+91 98110 24501',img:'https://i.pravatar.cc/300?img=12',
     dob:'2003-04-12',blood:'B+',status:'Active',admission:'2021-08-01',
     address:'42, Green Park Colony, New Delhi - 110016',
     guardian:'Mr. Vikram Sharma',guardianPhone:'+91 98110 24500',
     emergency:'Mrs. Sunita Sharma · +91 98110 24502',
     achievements:['Winner — Inter-College Hackathon 2024','Best Project Award — DBMS','NPTEL Gold — DSA']},
    {id:'CSE2021002',name:'Diya Patel',dept:'CSE',sem:5,section:'A',gender:'Female',
     email:'diya.patel@campus.edu',phone:'+91 99204 11882',img:'https://i.pravatar.cc/300?img=45',
     dob:'2003-07-25',blood:'O+',status:'Active',admission:'2021-08-01',
     address:'17, Satellite Road, Ahmedabad - 380015',
     guardian:'Mr. Nilesh Patel',guardianPhone:'+91 99204 11880',
     emergency:'Mrs. Bhavna Patel · +91 99204 11881',
     achievements:['Dean\'s List 2023-24','Technical Paper Published — IEEE Student Chapter']},
    {id:'CSE2021003',name:'Rohan Verma',dept:'CSE',sem:5,section:'B',gender:'Male',
     email:'rohan.verma@campus.edu',phone:'+91 90045 77321',img:'https://i.pravatar.cc/300?img=33',
     dob:'2003-01-08',blood:'A+',status:'Active',admission:'2021-08-01',
     address:'88, Civil Lines, Lucknow - 226001',
     guardian:'Mr. Alok Verma',guardianPhone:'+91 90045 77320',
     emergency:'Mrs. Rekha Verma · +91 90045 77322',
     achievements:['Runner-up — Coding Contest 2024']},
    {id:'CSE2021004',name:'Ananya Iyer',dept:'CSE',sem:3,section:'A',gender:'Female',
     email:'ananya.iyer@campus.edu',phone:'+91 94440 66129',img:'https://i.pravatar.cc/300?img=47',
     dob:'2004-11-02',blood:'AB+',status:'Active',admission:'2022-08-01',
     address:'5, Anna Nagar West, Chennai - 600040',
     guardian:'Mr. Suresh Iyer',guardianPhone:'+91 94440 66120',
     emergency:'Mrs. Latha Iyer · +91 94440 66121',
     achievements:['Class Topper — Semester 2','Cultural Secretary']},
    {id:'ECE2021005',name:'Kabir Singh',dept:'ECE',sem:5,section:'A',gender:'Male',
     email:'kabir.singh@campus.edu',phone:'+91 98765 44210',img:'https://i.pravatar.cc/300?img=15',
     dob:'2003-03-19',blood:'B-',status:'Active',admission:'2021-08-01',
     address:'210, Sector 22, Chandigarh - 160022',
     guardian:'Mr. Harpreet Singh',guardianPhone:'+91 98765 44200',
     emergency:'Mrs. Simran Kaur · +91 98765 44201',
     achievements:['Robotics Club Lead','IEEE Student Member']},
    {id:'ECE2021006',name:'Meera Nair',dept:'ECE',sem:3,section:'A',gender:'Female',
     email:'meera.nair@campus.edu',phone:'+91 98950 33471',img:'https://i.pravatar.cc/300?img=44',
     dob:'2004-06-14',blood:'O-',status:'Active',admission:'2022-08-01',
     address:'31, Marine Drive, Kochi - 682031',
     guardian:'Mr. Ramesh Nair',guardianPhone:'+91 98950 33470',
     emergency:'Mrs. Geeta Nair · +91 98950 33472',
     achievements:['Best Paper — Student Symposium']},
    {id:'ME2021007',name:'Arjun Reddy',dept:'ME',sem:7,section:'A',gender:'Male',
     email:'arjun.reddy@campus.edu',phone:'+91 99490 55218',img:'https://i.pravatar.cc/300?img=51',
     dob:'2002-09-30',blood:'A-',status:'Active',admission:'2020-08-01',
     address:'77, Jubilee Hills, Hyderabad - 500033',
     guardian:'Mr. Prasad Reddy',guardianPhone:'+91 99490 55210',
     emergency:'Mrs. Anitha Reddy · +91 99490 55211',
     achievements:['SAE Baja Team Captain','Internship — Tata Motors']},
    {id:'ME2021008',name:'Ishita Bose',dept:'ME',sem:5,section:'A',gender:'Female',
     email:'ishita.bose@campus.edu',phone:'+91 98300 77145',img:'https://i.pravatar.cc/300?img=26',
     dob:'2003-12-05',blood:'B+',status:'Active',admission:'2021-08-01',
     address:'12, Salt Lake Sector 2, Kolkata - 700091',
     guardian:'Mr. Subrata Bose',guardianPhone:'+91 98300 77140',
     emergency:'Mrs. Mitali Bose · +91 98300 77141',
     achievements:['CAD Design Competition Winner']},
    {id:'IT2021009',name:'Vivaan Gupta',dept:'IT',sem:3,section:'A',gender:'Male',
     email:'vivaan.gupta@campus.edu',phone:'+91 97110 88023',img:'https://i.pravatar.cc/300?img=68',
     dob:'2004-02-21',blood:'AB-',status:'Active',admission:'2022-08-01',
     address:'9, Vaishali Nagar, Jaipur - 302021',
     guardian:'Mr. Deepak Gupta',guardianPhone:'+91 97110 88020',
     emergency:'Mrs. Pooja Gupta · +91 97110 88021',
     achievements:['Open Source Contributor — 12 PRs']},
    {id:'IT2021010',name:'Sara Khan',dept:'IT',sem:5,section:'A',gender:'Female',
     email:'sara.khan@campus.edu',phone:'+91 98220 44916',img:'https://i.pravatar.cc/300?img=32',
     dob:'2003-08-17',blood:'O+',status:'Active',admission:'2021-08-01',
     address:'56, Banjara Hills Road 12, Hyderabad - 500034',
     guardian:'Mr. Imran Khan',guardianPhone:'+91 98220 44910',
     emergency:'Mrs. Farah Khan · +91 98220 44911',
     achievements:['Google Cloud Study Jam — Top 10','Cyber Security CTF Finalist']}
  ];
}

function buildFaculty(){
  return [
    {id:'F001',name:'Dr. Rajesh Kumar',dept:'CSE',qual:'Ph.D. (IIT Delhi)',designation:'Professor & HOD',
     email:'rajesh.kumar@campus.edu',phone:'+91 98100 10001',exp:18,img:'https://i.pravatar.cc/300?img=60',
     subjects:['CS501','CS503']},
    {id:'F002',name:'Prof. Anita Desai',dept:'CSE',qual:'M.Tech (IISc Bangalore)',designation:'Associate Professor',
     email:'anita.desai@campus.edu',phone:'+91 98100 10002',exp:12,img:'https://i.pravatar.cc/300?img=49',
     subjects:['CS502','CS504']},
    {id:'F003',name:'Dr. Suresh Menon',dept:'ECE',qual:'Ph.D. (NIT Trichy)',designation:'Professor',
     email:'suresh.menon@campus.edu',phone:'+91 98100 10003',exp:16,img:'https://i.pravatar.cc/300?img=52',
     subjects:['EC501','EC502','EC505']},
    {id:'F004',name:'Prof. Kavita Rao',dept:'ECE',qual:'M.E. (BITS Pilani)',designation:'Assistant Professor',
     email:'kavita.rao@campus.edu',phone:'+91 98100 10004',exp:8,img:'https://i.pravatar.cc/300?img=41',
     subjects:['EC503','EC504']},
    {id:'F005',name:'Dr. Manoj Tiwari',dept:'ME',qual:'Ph.D. (IIT Kanpur)',designation:'Professor',
     email:'manoj.tiwari@campus.edu',phone:'+91 98100 10005',exp:20,img:'https://i.pravatar.cc/300?img=59',
     subjects:['ME501','ME502','ME503','ME504','ME505']},
    {id:'F006',name:'Prof. Neha Joshi',dept:'IT',qual:'M.Tech (IIIT Hyderabad)',designation:'Associate Professor',
     email:'neha.joshi@campus.edu',phone:'+91 98100 10006',exp:10,img:'https://i.pravatar.cc/300?img=38',
     subjects:['IT501','IT502','IT503','IT505','CS505']}
  ];
}

function buildCourses(){
  return [
    {id:'C001',code:'BT-CSE',name:'B.Tech Computer Science & Engineering',dept:'CSE',duration:'4 Years',credits:160,semesters:8,seats:120,fee:85000,
     desc:'A comprehensive programme covering algorithms, systems, AI and software engineering with strong industry exposure.',
     objectives:['Build strong programming foundations','Master core CS theory','Apply AI/ML to real problems','Develop research aptitude']},
    {id:'C002',code:'BT-ECE',name:'B.Tech Electronics & Communication Engineering',dept:'ECE',duration:'4 Years',credits:160,semesters:8,seats:90,fee:82000,
     desc:'Focuses on electronics, signal processing, embedded systems and modern communication technologies.',
     objectives:['Design analog & digital circuits','Understand communication systems','Build embedded solutions']},
    {id:'C003',code:'BT-ME',name:'B.Tech Mechanical Engineering',dept:'ME',duration:'4 Years',credits:160,semesters:8,seats:90,fee:80000,
     desc:'Covers thermodynamics, design, manufacturing and modern CAD/CAM tools for mechanical systems.',
     objectives:['Analyse thermal systems','Design machine components','Apply CAD/CAM in manufacturing']},
    {id:'C004',code:'BT-IT',name:'B.Tech Information Technology',dept:'IT',duration:'4 Years',credits:160,semesters:8,seats:60,fee:83000,
     desc:'Specialises in web technologies, cyber security, cloud computing and data-driven systems.',
     objectives:['Build full-stack applications','Secure information systems','Deploy cloud-native solutions']},
    {id:'C005',code:'MT-CSE',name:'M.Tech Computer Science & Engineering',dept:'CSE',duration:'2 Years',credits:80,semesters:4,seats:30,fee:95000,
     desc:'Advanced postgraduate programme with specialisations in AI, data science and distributed systems.',
     objectives:['Conduct independent research','Master advanced algorithms','Publish technical work']},
    {id:'C006',code:'CERT-AIML',name:'Certificate in AI & Machine Learning',dept:'CSE',duration:'6 Months',credits:20,semesters:2,seats:50,fee:24000,
     desc:'Hands-on certification covering Python, supervised learning, deep learning and deployment.',
     objectives:['Build ML models end-to-end','Understand neural networks','Deploy models to production']},
    {id:'C007',code:'CERT-CYBER',name:'Certificate in Cyber Security',dept:'IT',duration:'6 Months',credits:20,semesters:2,seats:40,fee:26000,
     desc:'Practical security training covering network defence, ethical hacking and forensics.',
     objectives:['Perform vulnerability assessment','Understand cryptography','Respond to incidents']},
    {id:'C008',code:'CERT-DS',name:'Certificate in Data Science',dept:'IT',duration:'6 Months',credits:20,semesters:2,seats:45,fee:25000,
     desc:'Covers statistics, data wrangling, visualisation and predictive analytics with real datasets.',
     objectives:['Analyse real-world datasets','Build predictive models','Communicate insights visually']}
  ];
}

/* ---------- Attendance ---------- */
function buildAttendance(students){
  const rnd = seededRandom(20240412);
  const recs = [];
  const today = new Date();
  students.forEach(st => {
    SUBJECTS[st.dept].forEach((sub, si) => {
      for (let i = 0; i < 12; i++){
        const d = new Date(today);
        d.setDate(d.getDate() - (i * 2 + si + 1));
        if (d.getDay() === 0) d.setDate(d.getDate() - 1);
        const r = rnd();
        const status = r < 0.83 ? 'Present' : (r < 0.94 ? 'Absent' : 'Leave');
        recs.push({
          id:'ATT' + (recs.length + 1),
          studentId: st.id,
          subject: sub.code,
          subjectName: sub.name,
          date: d.toISOString().slice(0,10),
          status,
          period: 'P' + ((i % 6) + 1)
        });
      }
    });
  });
  return recs;
}

/* ---------- Marks ---------- */
function buildMarks(students){
  const rnd = seededRandom(777);
  const out = [];
  students.forEach(st => {
    SUBJECTS[st.dept].forEach(sub => {
      const internal   = 12 + Math.round(rnd() * 8);
      const practical  = 12 + Math.round(rnd() * 8);
      const assignment = 6  + Math.round(rnd() * 4);
      const final      = 28 + Math.round(rnd() * 22);
      const total = internal + practical + assignment + final;
      out.push({
        id:'MRK' + st.id + sub.code,
        studentId: st.id,
        subject: sub.code,
        subjectName: sub.name,
        credits: sub.credits,
        internal, practical, assignment, final, total,
        grade: gradeFor(total),
        status: total >= 40 ? 'Pass' : 'Fail'
      });
    });
  });
  return out;
}

function gradeFor(total){
  if (total >= 90) return 'O';
  if (total >= 80) return 'A+';
  if (total >= 70) return 'A';
  if (total >= 60) return 'B+';
  if (total >= 50) return 'B';
  if (total >= 40) return 'C';
  return 'F';
}

function gradePointFor(g){
  return {'O':10,'A+':9,'A':8,'B+':7,'B':6,'C':5,'F':0}[g] || 0;
}

/* ---------- Fees ---------- */
function buildFees(students){
  const ratios = [1, 0.6, 1, 0.35, 0.8, 1, 0.5, 1, 0.75, 0.45];
  return students.map((st, i) => {
    const tuition = 85000, exam = 4500, library = 1500, other = 2000;
    const total = tuition + exam + library + other;
    const paid = Math.round(total * ratios[i]);
    const payments = [];
    if (paid > 0){
      payments.push({
        id:'PAY' + (i * 2 + 1), date:'2024-07-15',
        amount: Math.round(paid * 0.6), mode:'Net Banking',
        ref:'TXN' + (100000 + i * 37), note:'Semester installment 1'
      });
    }
    if (ratios[i] === 1){
      payments.push({
        id:'PAY' + (i * 2 + 2), date:'2024-10-05',
        amount: paid - Math.round(paid * 0.6), mode:'UPI',
        ref:'TXN' + (200000 + i * 41), note:'Semester installment 2'
      });
    }
    return {
      studentId: st.id,
      tuition, exam, library, other, total, paid,
      balance: total - paid,
      dueDate: '2025-01-31',
      status: paid >= total ? 'Paid' : (paid > 0 ? 'Partial' : 'Unpaid'),
      payments
    };
  });
}

/* ---------- Assignments ---------- */
function buildAssignments(students){
  const rnd = seededRandom(5150);
  const defs = [
    {title:'AVL Tree Implementation',subject:'CS501',max:20,days:-8,  desc:'Implement AVL tree with insert, delete and rotation operations. Submit source + report.'},
    {title:'Normalization Case Study',subject:'CS502',max:20,days:-5, desc:'Normalize the given retail schema up to 3NF and justify each step.'},
    {title:'CPU Scheduling Simulation',subject:'CS503',max:20,days:3,  desc:'Simulate FCFS, SJF and Round Robin. Compare average waiting time.'},
    {title:'Socket Programming Lab',subject:'CS504',max:20,days:6,     desc:'Build a TCP chat application using sockets in Python or Java.'},
    {title:'Responsive Portfolio Website',subject:'CS505',max:25,days:9,desc:'Build a responsive personal portfolio using HTML, CSS and JS only.'},
    {title:'ADC Interfacing Report',subject:'EC503',max:20,days:-3,    desc:'Interface an 8-bit ADC with 8051 and document the timing diagram.'},
    {title:'Thermodynamics Problem Set',subject:'ME501',max:20,days:5, desc:'Solve 10 numerical problems on Rankine and Brayton cycles.'},
    {title:'Cloud Deployment Mini-Project',subject:'IT503',max:30,days:12,desc:'Deploy a 3-tier app on any public cloud and submit architecture diagram.'}
  ];
  const today = new Date();
  const out = [];
  defs.forEach((d, i) => {
    const deadline = new Date(today);
    deadline.setDate(deadline.getDate() + d.days);
    const dept = Object.keys(SUBJECTS).find(k => SUBJECTS[k].some(s => s.code === d.subject));
    const subs = {};
    students.filter(s => s.dept === dept).forEach(s => {
      const r = rnd();
      subs[s.id] = r < 0.55 ? 'Graded' : (r < 0.8 ? 'Submitted' : 'Pending');
    });
    out.push({
      id:'ASG' + (i + 1),
      title: d.title,
      subject: d.subject,
      dept,
      desc: d.desc,
      maxMarks: d.max,
      deadline: deadline.toISOString().slice(0,10),
      created: '2024-09-01',
      submissions: subs
    });
  });
  return out;
}

/* ---------- Timetable ---------- */
function buildTimetable(){
  const days  = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const slots = ['09:00 - 10:00','10:00 - 11:00','11:15 - 12:15','12:15 - 13:15','14:00 - 15:00'];
  const rooms = ['A-101','A-102','B-201','B-202','Lab-1'];
  const out = [];
  let n = 1;
  DEPARTMENTS.forEach(dept => {
    const subs = SUBJECTS[dept];
    days.forEach((day, di) => {
      slots.forEach((slot, si) => {
        const sub = subs[(di + si) % subs.length];
        out.push({
          id:'TT' + (n++),
          dept, day, slot,
          subject: sub.code,
          subjectName: sub.name,
          faculty: sub.faculty,
          room: rooms[(di + si) % rooms.length]
        });
      });
    });
  });
  return out;
}

/* ---------- Library ---------- */
function buildBooks(){
  return [
    {id:'B001',title:'Introduction to Algorithms',author:'Cormen, Leiserson, Rivest',isbn:'978-0262033848',category:'Computer Science',copies:6,available:4,shelf:'CS-A1'},
    {id:'B002',title:'Database System Concepts',author:'Silberschatz, Korth',isbn:'978-0078022159',category:'Computer Science',copies:5,available:3,shelf:'CS-A2'},
    {id:'B003',title:'Operating System Concepts',author:'Silberschatz, Galvin',isbn:'978-1118063330',category:'Computer Science',copies:4,available:2,shelf:'CS-A3'},
    {id:'B004',title:'Computer Networking: A Top-Down Approach',author:'Kurose & Ross',isbn:'978-0133594140',category:'Networking',copies:5,available:5,shelf:'NW-B1'},
    {id:'B005',title:'Digital Design',author:'M. Morris Mano',isbn:'978-0132774208',category:'Electronics',copies:6,available:4,shelf:'EC-C1'},
    {id:'B006',title:'Signals and Systems',author:'Oppenheim & Willsky',isbn:'978-0138147570',category:'Electronics',copies:4,available:3,shelf:'EC-C2'},
    {id:'B007',title:'Engineering Thermodynamics',author:'P.K. Nag',isbn:'978-9332902817',category:'Mechanical',copies:5,available:4,shelf:'ME-D1'},
    {id:'B008',title:'Fluid Mechanics',author:'Frank M. White',isbn:'978-1259696534',category:'Mechanical',copies:4,available:2,shelf:'ME-D2'},
    {id:'B009',title:'Clean Code',author:'Robert C. Martin',isbn:'978-0132350884',category:'Software Engineering',copies:3,available:1,shelf:'SE-E1'},
    {id:'B010',title:'Cloud Computing: Concepts & Practice',author:'Thomas Erl',isbn:'978-0133387520',category:'Computer Science',copies:3,available:3,shelf:'CS-A4'},
    {id:'B011',title:'Cryptography and Network Security',author:'William Stallings',isbn:'978-0134444284',category:'Security',copies:4,available:2,shelf:'SE-E2'},
    {id:'B012',title:'Artificial Intelligence: A Modern Approach',author:'Russell & Norvig',isbn:'978-0134610993',category:'Computer Science',copies:4,available:3,shelf:'CS-A5'}
  ];
}

function buildIssues(students){
  const rnd = seededRandom(3131);
  const today = new Date();
  const books = ['B001','B002','B003','B004','B005','B007','B009','B011'];
  const out = [];
  students.slice(0, 7).forEach((st, i) => {
    const bookId = books[i % books.length];
    const issueDate = new Date(today);
    issueDate.setDate(issueDate.getDate() - (12 + i * 3));
    const dueDate = new Date(issueDate);
    dueDate.setDate(dueDate.getDate() + 14);
    const returned = rnd() < 0.35;
    out.push({
      id:'ISS' + (i + 1),
      bookId,
      studentId: st.id,
      issueDate: issueDate.toISOString().slice(0,10),
      dueDate: dueDate.toISOString().slice(0,10),
      returnDate: returned ? new Date().toISOString().slice(0,10) : null,
      status: returned ? 'Returned' : 'Issued'
    });
  });
  return out;
}

/* ---------- Notices ---------- */
function buildNotices(){
  const today = new Date();
  const d = n => { const x = new Date(today); x.setDate(x.getDate() + n); return x.toISOString().slice(0,10); };
  return [
    {id:'N001',title:'Mid-Semester Examination Schedule Released',category:'Examination',priority:'High',pinned:true,
     date:d(-2),author:'Examination Cell',
     body:'The mid-semester examinations for all departments will commence from the 18th of this month. Students must carry their hall tickets and college ID cards without fail. Reporting time is 09:15 AM. Detailed subject-wise datesheet is available on the notice board.'},
    {id:'N002',title:'Library Extended Hours During Exam Period',category:'Academic',priority:'Medium',pinned:false,
     date:d(-4),author:'Central Library',
     body:'The central library will remain open from 08:00 AM to 10:00 PM throughout the examination period. Reading rooms on the second floor have been reserved for group study. Please maintain silence and return borrowed books on time.'},
    {id:'N003',title:'Annual Tech Fest "Innovate 2025" — Registration Open',category:'Events',priority:'High',pinned:true,
     date:d(-6),author:'Cultural Committee',
     body:'Registrations are now open for Innovate 2025 scheduled on 14-16 February. Events include hackathon, robotics, paper presentation, and coding contests. Register through the student portal before 5th February. Exciting prizes worth ₹2,00,000 to be won.'},
    {id:'N004',title:'Holiday Notice — Regional Festival',category:'Holiday',priority:'Low',pinned:false,
     date:d(-8),author:'Administration',
     body:'The institute will remain closed on account of the regional festival. Hostel mess will operate on a limited schedule. Classes will resume as per the regular timetable the following day.'},
    {id:'N005',title:'Fee Payment Deadline Extended to 31 January',category:'General',priority:'High',pinned:false,
     date:d(-10),author:'Accounts Department',
     body:'The last date for payment of semester fees has been extended to 31 January. A late fee of ₹500 per week will apply thereafter. Payments can be made through net banking, UPI or at the accounts counter between 10 AM and 3 PM.'},
    {id:'N006',title:'Placement Drive — Infosys & TCS',category:'Academic',priority:'High',pinned:false,
     date:d(-12),author:'Training & Placement Cell',
     body:'Infosys and TCS will conduct a combined campus placement drive for final year students. Eligible students must register with updated resumes by 25 January. Pre-placement talks will be held in the main auditorium.'},
    {id:'N007',title:'Sports Meet 2025 — Trials Begin',category:'Events',priority:'Medium',pinned:false,
     date:d(-14),author:'Sports Council',
     body:'Trials for cricket, basketball, badminton and athletics will begin next week at the main ground. Interested students should report to the sports office with their ID cards. Selected players will represent the college at the university level.'},
    {id:'N008',title:'Anti-Ragging Committee Awareness Session',category:'General',priority:'Medium',pinned:false,
     date:d(-16),author:'Student Welfare',
     body:'A mandatory awareness session on anti-ragging policies will be conducted for all first and second year students. Attendance is compulsory and will be recorded. The session will be led by the Dean of Student Welfare.'}
  ];
}

/* ---------- Feedback ---------- */
function buildFeedback(){
  const today = new Date();
  const d = n => { const x = new Date(today); x.setDate(x.getDate() - n); return x.toISOString().slice(0,10); };
  return [
    {id:'FB001',studentId:'CSE2021001',category:'Teaching Quality',subject:'CS501',rating:5,
     message:'The DSA lectures are extremely well-structured. The professor uses excellent real-world examples which made tree and graph algorithms much easier to grasp.',
     date:d(6),status:'Reviewed',reply:'Thank you for your kind words. We will continue to improve the lab sessions.'},
    {id:'FB002',studentId:'CSE2021002',category:'Infrastructure',subject:'General',rating:3,
     message:'The computer lab needs more systems. During practical hours many students have to share a single machine which slows down the lab work considerably.',
     date:d(9),status:'Pending',reply:''},
    {id:'FB003',studentId:'ECE2021005',category:'Library',subject:'General',rating:4,
     message:'Good collection of electronics reference books, but the latest editions of a few titles are missing. Requesting an update to the catalogue.',
     date:d(12),status:'In Progress',reply:'We have placed orders for the new editions; they should arrive within two weeks.'}
  ];
}

/* ---------- Exams ---------- */
function buildExams(){
  const today = new Date();
  const d = n => { const x = new Date(today); x.setDate(x.getDate() + n); return x.toISOString().slice(0,10); };
  return [
    {id:'E1',subject:'CS501',name:'Data Structures & Algorithms',date:d(9),  time:'09:30 AM',room:'Exam Hall A',type:'Mid-Semester'},
    {id:'E2',subject:'CS502',name:'Database Management Systems',date:d(11), time:'09:30 AM',room:'Exam Hall A',type:'Mid-Semester'},
    {id:'E3',subject:'CS503',name:'Operating Systems',date:d(13), time:'02:00 PM',room:'Exam Hall B',type:'Mid-Semester'},
    {id:'E4',subject:'CS504',name:'Computer Networks',date:d(16), time:'09:30 AM',room:'Exam Hall B',type:'Mid-Semester'}
  ];
}

/* ==========================================================
   SEED / LOAD / SAVE
   ========================================================== */
function seedDB(){
  const students = buildStudents();
  const db = {
    users      : buildUsers(),
    students,
    faculty    : buildFaculty(),
    courses    : buildCourses(),
    departments: DEPARTMENTS,
    subjects   : SUBJECTS,
    attendance : buildAttendance(students),
    marks      : buildMarks(students),
    fees       : buildFees(students),
    assignments: buildAssignments(students),
    timetable  : buildTimetable(),
    books      : buildBooks(),
    issues     : buildIssues(students),
    notices    : buildNotices(),
    feedback   : buildFeedback(),
    exams      : buildExams()
  };
  localStorage.setItem(DB_KEY, JSON.stringify(db));
  return db;
}

function loadDB(){
  let raw = null;
  try { raw = JSON.parse(localStorage.getItem(DB_KEY)); } catch(e){ raw = null; }
  if (!raw || !raw.students || !raw.students.length){
    raw = seedDB();
  }
  /* Hydrate the global DB object */
  Object.keys(raw).forEach(k => { DB[k] = raw[k]; });
  return DB;
}

function saveDB(){
  localStorage.setItem(DB_KEY, JSON.stringify(DB));
}

function resetDB(){
  localStorage.removeItem(DB_KEY);
  localStorage.removeItem(ACTIVITY_KEY);
  seedDB();
}

/* Auto-load on every page */
loadDB();
/*
 * data.js, everything the game shows, as data (no DOM here).
 *  EVIDENCE : readable documents (desk + board)
 *  DESK     : which evidence lies on the desk, and what it looks like
 *  BOARD    : pinned evidence on the cork board + the red strings (each with a reason)
 *  CASES    : the four case folders (About me, Skills, Works, Achievements) and what is inside them
 * Real facts come from content.js. Nothing here invents awards, jobs or skill levels.
 * Every visible string is written twice with L(mn, en) (see i18n.js).
 */
(function () {
  "use strict";
  var C = window.CONTENT, L = window.L;
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function photo(src, cap) { return '<img class="ev-photo" src="' + src + '" alt="' + esc(cap) + '">' + (cap ? '<p class="small">' + esc(cap) + "</p>" : ""); }
  function rows(list) { return '<table class="kv">' + list.map(function (r) { return "<tr><th>" + esc(r[0]) + "</th><td>" + esc(r[1]) + "</td></tr>"; }).join("") + "</table>"; }
  function para(arr) { return arr.map(function (t) { return "<p>" + esc(t) + "</p>"; }).join(""); }
  function proj(id) { return C.projects.filter(function (p) { return p.id === id; })[0]; }
  var WORKS_LINK = '<a class="lnk works-link" href="#works">' + L("Бүтээлүүдийг зурагтай нь үзэх", "Browse the works with pictures") + "</a>";
  function projBlock(p) {
    var l = "";
    if (p.link) l += '<a class="lnk" href="' + esc(p.link) + '" target="_blank" rel="noopener">' + esc(p.linkLabel || L("Сайт нээх", "Open site")) + "</a>";
    if (p.repo) l += '<a class="lnk" href="' + esc(p.repo) + '" target="_blank" rel="noopener">GitHub</a>';
    var img = p.image ? '<img class="ev-photo" src="' + esc(p.image) + '" alt="' + esc(p.title) + '" loading="lazy" onerror="this.remove()">' : "";
    return '<div class="proj">' + img + "<h4>" + esc(p.title) + '</h4><span class="mono">' + esc(p.year) + ", " + esc(p.type) + "</span><p>" + esc(p.desc) + "</p>" +
      (p.tech.length ? '<p class="mono">' + esc(p.tech.join(", ")) + "</p>" : "") + l + "</div>";
  }
  // skill level bars, grouped (HTML; the 3D folder page draws the same thing on canvas)
  function skillGroups() {
    var g = C.skillGroups;
    return Object.keys(g).map(function (k) { return { key: k, title: g[k], items: C.skills.filter(function (s) { return s.group === k; }) }; }).filter(function (x) { return x.items.length; });
  }
  function barsHTML() {
    return '<div class="skillbars">' + skillGroups().map(function (g) {
      return "<h4>" + esc(g.title) + "</h4>" + g.items.map(function (s) {
        var v = Math.max(0, Math.min(100, +s.level || 0));
        return '<div class="sbar"><span class="sbar-l">' + esc(s.label) + '</span><span class="sbar-t" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + v + '" aria-label="' + esc(s.label) + '"><i style="width:' + v + '%"></i></span><b>' + v + "%</b></div>";
      }).join("");
    }).join("") + '<p class="small">' + esc(L("Түвшинг өөрөө үнэлсэн: төсөл, хичээл дээр хэр бие даан ашиглаж чаддагаар.", "Levels are self-assessed: how independently I can use each one in projects and coursework.")) + "</p></div>";
  }
  function itemsHTML(items) {
    return '<ul class="items">' + items.map(function (i) { return '<li><b class="mono">' + esc(i.k) + "</b><span>" + esc(i.t) + (i.n ? "<small>" + esc(i.n) + "</small>" : "") + "</span></li>"; }).join("") + "</ul>";
  }
  var lead = C.about.leadership;
  var P = C.person;

  /* ---------------- evidence ---------------- */
  var E = {};
  function ev(id, o) { o.id = id; E[id] = o; }

  ev("edu", { file: L("ФАЙЛ-01", "FILE-01"), title: L("СЭЗИС оюутны бүртгэл", "UFE student record"), html: photo("assets/photo/ufe.jpg", L("СЭЗИС-ийн байр, Улаанбаатар", "UFE building, Ulaanbaatar")) +
    rows([[L("Сургууль", "University"), L("СЭЗИС (UFE)", "University of Finance and Economics (UFE)")], [L("Хөтөлбөр", "Programme"), L("Мэдээллийн системийн менежмент", "Information Systems Management")], [L("Он", "Years"), "2024-2028"], [L("Курс", "Year"), L("3-р курс", "3rd year")], [L("Өмнөх сургууль", "Previous school"), L("«Цэгцбилиг», Дундговь (2012-2024), математикийн чиглэл", "Tsegtsbilig, Dundgovi (2012-2024), mathematics track")]]) +
    '<p class="hand">' + L("Боловсролын хэрэг.", "The education file.") + "</p>" });

  ev("wh", { file: L("ФАЙЛ-02", "FILE-02"), title: L("Whitehats клубийн тайлан", "Whitehats club report"), stamp: L("ИТГЭМЖЛЭГДСЭН", "ACCREDITED"), html: photo("assets/photo/pwday.jpg", L("Password Day, KPMG Mongolia-тай хамт", "Password Day, with KPMG Mongolia")) +
    rows([[L("Статус", "Status"), L("Итгэмжлэгдсэн клуб", "Accredited club")], [L("Гишүүдийн тоо", "Members"), "43"], ["UFE CS2 Tournament", L("22 баг, 130 тамирчин", "22 teams, 130 players")], ["Password Day", L("KPMG Mongolia-тай, 2 дахь жил", "with KPMG Mongolia, 2nd year")], [L("Бусад", "Other"), L("M Bank-ны оффис аялал; долоо хоног бүрийн төгсөгчдийн яриа", "M Bank office visit; weekly alumni talks")], [L("Тэргүүн", "President"), P.name + " (2025-26)"]]) });

  ev("econ", { file: L("ФАЙЛ-03", "FILE-03"), title: L("Эконометрик судалгааны хураангуй", "Econometrics study summary"), html:
    rows([[L("Хугацаа", "Period"), "2015Q1-2021Q4"], [L("Ажиглалтын тоо", "Observations"), "28"], [L("Хувьсагч", "Variables"), "UNEMP, GDP, INFLA"], [L("Хэрэгсэл", "Tools"), "Excel, EViews"], [L("Баг", "Team"), L("4 хүн", "4 people")], [L("Огноо", "Date"), "2026.11.12"]]) + "<p>" + esc(proj("econ").desc) + "</p>" });

  ev("sl", { file: L("ФАЙЛ-04", "FILE-04"), title: L("Student Led 2026 бүртгэл", "Student Led 2026 record"), stamp: L("ТУСГАЙ БАЙР", "SPECIAL PRIZE"), html: photo("assets/photo/studentled.jpg", L("Student Led 2026, «Evergreen» баг, «Био сав»", "Student Led 2026, team “Evergreen”, “Bio Sav”")) +
    rows([[L("Тэмцээн", "Competition"), "Student Led 2026"], [L("Баг", "Team"), "Evergreen"], [L("Төсөл", "Project"), L("«Био сав»", "“Bio Sav”")], [L("Оролцсон баг", "Teams"), "147"], [L("Сургуулийн тоо", "Schools"), "20"], [L("Огноо", "Date"), "2026.04.03"], [L("Үр дүн", "Result"), L("Тусгай байр", "Special prize")]]) });

  ev("kl", { file: L("ФАЙЛ-05", "FILE-05"), title: L("KadrLink техникийн баримт", "KadrLink technical sheet"), html: photo("assets/photo/kadrlink.jpg", L("KadrLink, вэб хувилбар", "KadrLink, web version")) +
    '<p class="mono">' + L("Технологи (дарааллаар):", "Technology (in order):") + '</p><p class="big">' + esc(proj("kadrlink").tech.join(", ")) + "</p>" +
    "<p>" + esc(proj("kadrlink").desc) + "</p>" + WORKS_LINK });

  ev("sm", { file: L("ФАЙЛ-06", "FILE-06"), title: L("StudyMate AI техникийн баримт", "StudyMate AI technical sheet"), html:
    '<p class="mono">' + L("Технологи (дарааллаар):", "Technology (in order):") + '</p><p class="big">' + esc(proj("studymate").tech.join(", ")) + "</p><p>" + esc(proj("studymate").desc) + "</p>" });

  ev("su", { file: L("ФАЙЛ-07", "FILE-07"), title: L("Оюутны холбооны мэдэгдэл", "Student Union notice"), html: photo("assets/photo/networking.jpg", "UFE Networking 2026") +
    rows([[L("Албан тушаал", "Position"), L("Оюутны холбоо ТББ-ын тэргүүн (2026.09 -)", "President of the Student Union NGO (2026.09 -)")], [L("Төлөөлөх оюутан", "Students represented"), "~6000"], [L("Өмнө нь", "Before"), L("Хүний нөөцийн албан хаагч (2025-26)", "HR officer (2025-26)")], [L("Зохион байгуулсан", "Organised"), L("UFE Networking, Job Fair, Volunteer Fair, Өв соёлын өдөрлөг, төгсөх курсийн урлагийн наадам", "UFE Networking, Job Fair, Volunteer Fair, Heritage Day, graduates’ art festival")], [L("Сайн дурын ажил", "Volunteering"), L("24 цаг, Эдийн засаг, санхүүгийн албатай (2026.11.16-21)", "24 hours with the Economics and Finance Office (2026.11.16-21)")]]) });

  ev("vb", { file: L("СОНИН", "NEWS"), title: L("СЭЗИС-ийн волейболын аварга", "UFE volleyball champions"), kind: "news", html:
    "<h4>" + L("Амжилт, шагнал", "Achievements, awards") + "</h4>" + C.awards.map(function (a) { return '<p><b class="mono">[' + esc(a.stamp) + "]</b> " + esc(a.title) + ", " + esc(a.when) + (a.note ? ". " + esc(a.note) : "") + "</p>"; }).join("") });

  ev("about", { file: L("ЗАХИДАЛ", "LETTER"), title: L("Битүүмжилсэн захидал", "Sealed letter"), html: para(C.about.text) });

  ev("usb", { file: "USB-03", title: L("Ур чадварын түвшин", "Skill levels"), html: barsHTML() });

  ev("hint1", { file: L("НОТ", "NOTE"), title: L("Наалтан тэмдэглэл", "Sticky note"), note: true, html: '<p class="hand big">' + L("Код хэрэгтэй юу? Тоонууд нь Whitehats-ийн тайлан болон бусад баримтад байгаа.", "Need a code? The numbers are in the Whitehats report and the other documents.") + "</p>" });
  ev("hid1", { file: L("НУУЦ НОТ", "SECRET NOTE"), title: L("Далд тэмдэглэл", "Hidden note"), note: true, hidden: true, html: '<p class="hand big">' + L("Deep Learning UB 2025 (06.23-28): LLM ба post-training, 100 оролцогчтой, сайн дурын ажилтнаар оролцсон.", "Deep Learning UB 2025 (06.23-28): LLMs and post-training, 100 participants. I was a volunteer.") + "</p>" });

  ev("ph1", { file: L("ЗУРАГ-01", "PHOTO-01"), title: L("Хэргийн хүн", "Person of interest"), kind: "photo", html:
    (P.photoFull ? '<img class="ev-photo" src="' + esc(P.photoFull) + '" alt="' + esc(P.name) + ', mug shot">' : '<div class="portrait">' + (P.photo ? '<img src="' + esc(P.photo) + '" alt="' + esc(P.name) + '">' : "<span>" + esc(P.monogram) + "</span>") + "</div>") + "<h4>" + esc(P.name) + '</h4><p class="mono">' + esc(P.role) + "</p><p>" + esc(P.line) + "</p>" });
  ev("ph2", { file: L("ЗУРАГ-02", "PHOTO-02"), title: L("Волейбол", "Volleyball"), kind: "photo", html:
    '<img class="ev-photo" src="assets/photo/vb_team2.jpg" alt="' + esc(L("СЭЗИС-ийн волейболын баг", "UFE volleyball team")) + '"><p class="small">' + L("СЭЗИС-ийн волейболын баг.", "UFE volleyball team.") + "</p><h4>" + L("Волейбол", "Volleyball") + "</h4><p>" +
    L("Спортын 1-р зэрэгтэй. СЭЗИС-ийн аварга (2024-25, 2025-26); клубүүдийн аварга шалгаруулах тэмцээнд 1-р байр (2026.03.29).", "1st-grade sports ranking. UFE champion (2024-25, 2025-26); 1st place in the inter-club championship (2026.03.29).") + "</p>" });

  ev("fp", { file: L("ХЭЭ-01", "PRINT-01"), title: L("Хурууны хээний карт", "Fingerprint card"), kind: "print", html:
    '<img class="fp-img" src="assets/fingerprint.png" alt="' + esc(L("Хурууны хээний карт", "Fingerprint card")) + '"><p class="mono">' + L("ХЭЭНИЙ ТАНИЛТ", "PRINT MATCH") + "</p><p>" + L("Энэ хээ хэнийх вэ? Улаан утсыг дагаж «Хэргийн хүн»-ий зураг руу оч.", "Whose prints are these? Follow the red string to the “Person of interest” photo.") + "</p>" });

  ev("ubph", { file: L("ЗУРАГ-03", "PHOTO-03"), title: L("Улаанбаатар, Сүхбаатарын талбай", "Ulaanbaatar, Sükhbaatar Square"), kind: "photo", html:
    '<img class="ev-photo" src="assets/photo/ub.jpg" alt="' + esc(L("Сүхбаатарын талбай, Улаанбаатар", "Sükhbaatar Square, Ulaanbaatar")) + '"><p class="small">' + L("Зураг: Wikimedia Commons «Sükhbaatar Square» (CC0).", "Photo: Wikimedia Commons “Sükhbaatar Square” (CC0).") + "</p><p>" + L("Хэргийн хүн Улаанбаатар дахь СЭЗИС-д (UFE) 2024 оноос суралцаж байна. Газрын зураг дээрх зүүг үзээрэй.", "The person of interest has studied at UFE in Ulaanbaatar since 2024. Check the pin on the map.") + "</p>" });

  ev("projects", { file: L("ХАВТАС", "FILE"), title: L("Бүтээлүүдийн жагсаалт", "List of works"), html: WORKS_LINK + C.projects.map(projBlock).join("") });
  ev("goal", { file: L("ЗОРИЛГО", "GOAL"), title: L("Зорилго", "Goal"), html: "<p>" + L("Мэдээллийн системийн төслийн менежер болох.", "To become an information systems project manager.") + "</p><p>" + L("Үүний тулд: системийн шинжилгээ (As-is / To-be), багийн удирдлага, илтгэл тавих чадварыг хөгжүүлж байна.", "To get there I am building systems analysis (As-is / To-be), team leadership and public speaking.") + "</p>" });
  ev("hobby", { file: L("ХОББИ", "HOBBY"), title: L("Хобби", "Hobby"), note: true, html: '<p class="hand big">' + L("Волейбол. Англи хэл: B1.", "Volleyball. English: B1.") + "</p>" });
  ev("lead", { file: L("ФАЙЛ-08", "FILE-08"), title: L("Удирдлага, нийгмийн оролцоо", "Leadership and community"), html:
    lead.map(function (l) { return '<div class="proj"><h4>' + esc(l.org) + ", " + esc(l.role) + '</h4><span class="mono">' + esc(l.when) + "</span><p>" + esc(l.note) + "</p></div>"; }).join("") +
    "<h4>" + L("Сайн дурын ажил", "Volunteering") + "</h4>" + itemsHTML(C.community.map(function (c) { return { k: c.when, t: c.title, n: c.note }; })) });

  /* ---------------- desk ---------------- */
  // kind decides how the object looks. w/h are in room pixels.
  var DESK = [
    { ev: "wh",   kind: "paper", w: 190, h: 245 },
    { ev: "edu",  kind: "paper", w: 190, h: 245 },
    { ev: "econ", kind: "paper", w: 190, h: 245 },
    { ev: "kl",   kind: "paper", w: 190, h: 245 },
    { ev: "sm",   kind: "paper", w: 190, h: 245 },
    { ev: "su",   kind: "paper", w: 190, h: 245 },
    { ev: "vb",   kind: "news",  w: 210, h: 250 },
    { ev: "about", kind: "env",  w: 210, h: 140 },
    { ev: "usb",  kind: "usb",   w: 110, h: 44 },
    { ev: "ph1",  kind: "photo", w: 140, h: 165 },
    { ev: "ph2",  kind: "photo", w: 140, h: 165 }
  ];

  /* ---------------- board ---------------- */
  var BOARD = {
    nodes: [
      { id: "b-id",     ev: "ph1",   kind: "photo", x: 70,  y: 70,  w: 130, h: 155, rot: -4 },
      { id: "b-edu",    ev: "edu",   kind: "paper", x: 250, y: 60,  w: 150, h: 185, rot: 3 },
      { id: "b-skills", ev: "usb",   kind: "paper", x: 450, y: 90,  w: 150, h: 185, rot: -2, label: L("Ур чадвар", "Skills") },
      { id: "b-proj",   ev: "projects", kind: "paper", x: 650, y: 60, w: 150, h: 185, rot: 3, label: L("Бүтээлүүд", "Works") },
      { id: "b-goal",   ev: "goal",  kind: "note",  x: 830, y: 120, w: 130, h: 130, rot: -3 },
      { id: "b-hobby",  ev: "hobby", kind: "note",  x: 90,  y: 330, w: 125, h: 125, rot: 4 },
      { id: "b-vb",     ev: "ph2",   kind: "photo", x: 270, y: 300, w: 130, h: 155, rot: -3 },
      { id: "b-champ",  ev: "vb",    kind: "news",  x: 470, y: 320, w: 160, h: 170, rot: 2 },
      { id: "b-lead",   ev: "lead",  kind: "paper", x: 690, y: 310, w: 150, h: 185, rot: -2, label: L("Удирдлага", "Leadership") }
    ],
    // each string connects two nodes and says why
    edges: [
      { a: "b-id", b: "b-edu", why: L("Хэргийн хүн ба түүний сургууль.", "The person and the university.") },
      { a: "b-edu", b: "b-skills", why: L("Боловсрол ур чадварыг бий болгосон.", "Education built the skills.") },
      { a: "b-skills", b: "b-proj", why: L("Ур чадвараа бүтээлүүддээ ашигласан.", "The skills went into the works.") },
      { a: "b-proj", b: "b-goal", why: L("Бүтээлүүд мэргэжлийн зорилготой холбогдоно.", "The works lead to the career goal.") },
      { a: "b-id", b: "b-hobby", why: L("Хэргийн хүний хобби.", "The person’s hobby.") },
      { a: "b-hobby", b: "b-vb", why: L("Хамгийн дуртай спорт нь волейбол.", "Favourite sport: volleyball.") },
      { a: "b-vb", b: "b-champ", why: L("Волейболоор аварга болсон.", "Became champion in volleyball.") },
      { a: "b-champ", b: "b-lead", why: L("Багийн тоглолтоос удирдлага сурсан.", "Team play taught leadership.") },
      { a: "b-lead", b: "b-goal", why: L("Удирдлагын туршлага нь төслийн менежер болох зорилготой холбоотой.", "Leadership experience serves the goal of becoming a project manager.") }
    ]
  };

  // second cork board (right of the main board)
  var EXTRA = [
    { id: "x-fp", ev: "fp", kind: "print", board: 2 },
    { id: "x-hint", ev: "hint1", kind: "note", board: 2 },
    { id: "x-sl", ev: "sl", kind: "paper", board: 2 },
    { id: "x-ub", ev: "ubph", kind: "photo", board: 1 }
  ];

  /* ---------------- case folders ---------------- */
  // four folders. Inside each: an ID card with a clipped photo, the detective's note, a report page with
  // `sections` (facts / skill bars / works / achievements) and the interview transcript from content.js
  var IV = C.interview;
  function iv(note, qa) { return { note: note, qa: qa }; }
  var CASES = [
    { id: "c1", no: "001", title: L("Миний тухай", "About me"), puzzle: "code", photo: P.photo || "assets/fingerprint.png", caption: L("Хэргийн хүн", "Person of interest"),
      iv: iv(IV.who.note, IV.who.qa.concat([IV.edu.qa[0], IV.edu.qa[2]], IV.future.qa)),
      sections: [
        { kind: "text", title: L("Товч танилцуулга", "In short"), text: [P.line].concat(C.about.text) },
        { kind: "rows", title: L("Үндсэн мэдээлэл", "Key facts"), rows: C.about.facts }
      ] },
    { id: "c2", no: "002", title: L("Ур чадвар", "Skills"), puzzle: "cipher", photo: "assets/photo/dl_code.jpg", caption: "Deep Learning UB 2025",
      iv: iv(IV.learn.note, IV.learn.qa.concat([IV.edu.qa[1]])),
      sections: [{ kind: "bars", title: L("Ур чадварын түвшин (өөрийн үнэлгээ)", "Skill levels (self-assessed)"), groups: skillGroups() }] },
    { id: "c3", no: "003", title: L("Бүтээлүүд", "Works"), puzzle: "connect", photo: "assets/photo/kadrlink.jpg", caption: "KadrLink", works: true,
      iv: IV.proj,
      sections: [{ kind: "items", title: L("Бүтээлүүд", "Works"), items: C.projects.map(function (p) { return { k: p.year, t: p.title + ", " + p.type, n: p.tech.join(", ") }; }) }] },
    { id: "c4", no: "004", title: L("Амжилт, нийгмийн оролцоо", "Achievements, community"), puzzle: "match", photo: "assets/photo/vb_team.jpg", caption: L("Волейболын баг", "Volleyball team"),
      iv: IV.sport,
      sections: [
        { kind: "items", title: L("Амжилт, шагнал", "Achievements"), items: C.awards.map(function (a) { return { k: a.stamp, t: a.title, n: a.when }; }) },
        { kind: "items", title: L("Нийгэмд оруулсан хувь нэмэр", "Community and volunteering"), items: C.community.map(function (c) { return { k: c.when, t: c.title, n: "" }; }) }
      ] }
  ];
  function sectionsHTML(cs) {
    return (cs.sections || []).map(function (s) {
      var h = '<p class="rp-sec typed small-caps">' + esc(s.title) + "</p>";
      if (s.kind === "text") return h + para(s.text);
      if (s.kind === "rows") return h + rows(s.rows);
      if (s.kind === "bars") return h + barsHTML();
      if (s.kind === "items") return h + itemsHTML(s.items);
      return "";
    }).join("") + (cs.works ? WORKS_LINK : "");
  }

  /* ---------------- puzzle building blocks (facts the puzzles are generated from) ---------------- */
  var FACTS = {
    // 2-digit numbers that really appear in a desk document
    numbers: [
      { label: L("Whitehats клубийн гишүүдийн тоо", "number of Whitehats club members"), n: 43, doc: "wh" },
      { label: L("UFE CS2 Tournament-ын багийн тоо", "number of teams at the UFE CS2 Tournament"), n: 22, doc: "wh" },
      { label: L("Эконометрик судалгааны ажиглалтын тоо", "number of observations in the econometrics study"), n: 28, doc: "econ" },
      { label: L("Student Led 2026-д оролцсон сургуулийн тоо", "number of schools at Student Led 2026"), n: 20, doc: "sl" }
    ],
    pairs: [
      [L("Whitehats клуб", "Whitehats club"), L("UFE CS2 Tournament, 22 баг", "UFE CS2 Tournament, 22 teams"), "wh"],
      ["KadrLink", L("ДАН / e-Mongolia баталгаажуулалт", "DAN / e-Mongolia identity check"), "kl"],
      [L("Эконометрик судалгаа", "Econometrics study"), L("EViews, 28 ажиглалт", "EViews, 28 observations"), "econ"],
      ["Student Led 2026", L("«Био сав», 147 баг", "“Bio Sav”, 147 teams"), "sl"],
      [L("Оюутны холбоо", "Student Union"), L("~6000 оюутан", "~6000 students"), "su"]
    ],
    techChains: [
      { project: "KadrLink", doc: "kl", chain: proj("kadrlink").tech },
      { project: "StudyMate AI", doc: "sm", chain: proj("studymate").tech }
    ],
    words: ["SUPABASE", "NEXTJS", "REACT", "EXPO", "EVIEWS", "MSSQL", "BIGQUERY"],
    events: (function () {
      // one event per distinct start year, so the order is unambiguous
      var by = {};
      C.timeline.forEach(function (t) { var y = parseInt(t.when, 10); (by[y] = by[y] || []).push(t); });
      return Object.keys(by).sort().map(function (y) { return by[y]; });
    })()
  };

  window.LC = window.LC || {};
  window.LC.data = { EVIDENCE: E, DESK: DESK, BOARD: BOARD, EXTRA: EXTRA, CASES: CASES, FACTS: FACTS, esc: esc,
    skillGroups: skillGroups, barsHTML: barsHTML, itemsHTML: itemsHTML, sectionsHTML: sectionsHTML, projBlock: projBlock };
})();

/*
 * data.js, everything the game shows, as data (no DOM here).
 *  EVIDENCE : readable documents (desk + board)
 *  DESK     : which evidence lies on the desk, and what it looks like
 *  BOARD    : pinned evidence on the cork board + the red strings (each with a reason)
 *  CASES    : the six case folders and the text inside them
 * Real facts come from content.js. Nothing here invents awards, jobs or skill levels.
 */
(function () {
  "use strict";
  var C = window.CONTENT;
  function photo(src, cap) { return '<img class="ev-photo" src="' + src + '" alt="' + cap + '">' + (cap ? '<p class="small">' + cap + "</p>" : ""); }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function rows(list) { return '<table class="kv">' + list.map(function (r) { return "<tr><th>" + esc(r[0]) + "</th><td>" + esc(r[1]) + "</td></tr>"; }).join("") + "</table>"; }
  function para(arr) { return arr.map(function (t) { return "<p>" + esc(t) + "</p>"; }).join(""); }
  function proj(id) { return C.projects.filter(function (p) { return p.id === id; })[0]; }
  function projBlock(p) {
    var l = "";
    if (p.link) l += '<a class="lnk" href="' + esc(p.link) + '" target="_blank" rel="noopener">' + esc(p.linkLabel || "Сайт нээх") + '</a>';
    if (p.repo) l += '<a class="lnk" href="' + esc(p.repo) + '" target="_blank" rel="noopener">GitHub</a>';
    var img = p.image ? '<img class="ev-photo" src="' + esc(p.image) + '" alt="' + esc(p.title) + '" loading="lazy" onerror="this.remove()">' : "";
    return '<div class="proj">' + img + '<h4>' + esc(p.title) + '</h4><span class="mono">' + esc(p.year) + ", " + esc(p.type) + "</span><p>" + esc(p.desc) + '</p><p class="mono">' + esc(p.tech.join(", ")) + "</p>" + l + "</div>";
  }
  var lead = C.about.leadership;
  var P = C.person;

  /* ---------------- evidence ---------------- */
  var E = {};
  function ev(id, o) { o.id = id; E[id] = o; }

  ev("edu", { file: "ФАЙЛ-01", title: "СЭЗИС оюутны бүртгэл", html: photo("assets/photo/ufe.jpg", "СЭЗИС-ийн байр, Улаанбаатар") +
    rows([["Сургууль", "СЭЗИС (UFE)"], ["Хөтөлбөр", "Мэдээллийн системийн менежмент"], ["Он", "2024-2028"], ["Курс", "3-р курс"], ["Өмнөх сургууль", "«Цэгцбилиг», Дундговь (2012-2024), математикийн чиглэл"]]) +
    '<p class="hand">Боловсролын хэрэг.</p>' });

  ev("wh", { file: "ФАЙЛ-02", title: "Whitehats клубийн тайлан", stamp: "ИТГЭМЖЛЭГДСЭН", html: photo("assets/photo/pwday.jpg", "Password Day, KPMG Mongolia-тай хамт") +
    rows([["Статус", "Итгэмжлэгдсэн клуб"], ["Гишүүдийн тоо", "43"], ["UFE CS2 Tournament", "22 баг, 130 тамирчин"], ["Password Day", "KPMG Mongolia-тай, 2 дахь жил"], ["Бусад", "M Bank-ны оффис аялал; долоо хоног бүрийн төгсөгчдийн яриа"], ["Тэргүүн", "Ганбатын Энхбаясгалан (2025-26)"]]) });

  ev("econ", { file: "ФАЙЛ-03", title: "Эконометрик судалгааны хураангуй", html:
    rows([["Хугацаа", "2015Q1-2021Q4"], ["Ажиглалтын тоо", "28"], ["Хувьсагч", "UNEMP, GDP, INFLA"], ["Хэрэгсэл", "Excel, EViews"], ["Баг", "4 хүн"], ["Огноо", "2026.11.12"]]) + "<p>" + esc(proj("econ").desc) + "</p>" });

  ev("sl", { file: "ФАЙЛ-04", title: "Student Led 2026 бүртгэл", stamp: "ТУСГАЙ БАЙР", html: photo("assets/photo/studentled.jpg", "Student Led 2026, «Био сав» баг") +
    rows([["Тэмцээн", "Student Led 2026"], ["Төсөл", "«Био сав»"], ["Оролцсон баг", "147"], ["Сургуулийн тоо", "20"], ["Үр дүн", "Тусгай байр"]]) });

  ev("kl", { file: "ФАЙЛ-05", title: "KadrLink техникийн баримт", html: photo("assets/photo/kadrlink.jpg", "KadrLink, вэб хувилбар") +
    '<p class="mono">Технологи (дарааллаар):</p><p class="big">' + esc(proj("kadrlink").tech.join(", ")) + "</p>" +
    "<p>Арга хэмжээний зурагчныг захиалах платформ: ДАН / e-Mongolia баталгаажуулалт, цахим гэрээ, 30%/70% төлбөрийн урсгал, AI-аар царай хайх.</p>" });

  ev("sm", { file: "ФАЙЛ-06", title: "StudyMate AI техникийн баримт", html:
    '<p class="mono">Технологи (дарааллаар):</p><p class="big">' + esc(proj("studymate").tech.join(", ")) + "</p><p>" + esc(proj("studymate").desc) + "</p>" });

  ev("su", { file: "ФАЙЛ-07", title: "Оюутны холбооны мэдэгдэл", html: photo("assets/photo/networking.jpg", "UFE Networking 2026") +
    rows([["Албан тушаал", "Оюутны холбоо ТББ-ын тэргүүн (2026 -)"], ["Төлөөлөх оюутан", "~6000"], ["Өмнө нь", "Хүний нөөцийн албан хаагч (2025-26)"], ["Зохион байгуулсан", "UFE Networking, Job Fair, Volunteer Fair, Өв соёлын өдөрлөг, төгсөх ангийн урлагийн наадам"]]) });

  ev("vb", { file: "СОНИН", title: "СЭЗИС-ийн волейболын аварга", kind: "news", html:
    "<h4>Амжилт, шагнал</h4>" + C.awards.map(function (a) { return '<p><b class="mono">[' + esc(a.stamp) + "]</b> " + esc(a.title) + ", " + esc(a.when) + (a.note ? ". " + esc(a.note) : "") + "</p>"; }).join("") });

  ev("about", { file: "ЗАХИДАЛ", title: "Битүүмжилсэн захидал", html: para(C.about.text) });

  ev("usb", { file: "USB-03", title: "USB техникийн баримт бичиг", html:
    "<p>Дараах ур чадварууд CV-д бүртгэгдсэн:</p><ul class='sk'>" + C.skills.map(function (s) { return "<li>" + esc(s.label) + "</li>"; }).join("") + "</ul>" });

  ev("hint1", { file: "НОТ", title: "Наалтан тэмдэглэл", note: true, html: '<p class="hand big">Код хэрэгтэй юу? Тоонууд нь Whitehats-ийн тайлан болон бусад баримтад байгаа.</p>' });
  ev("hid1", { file: "НУУЦ НОТ", title: "Далд тэмдэглэл", note: true, hidden: true, html: '<p class="hand big">Deep Learning UB 2025 (06.23-28): LLM ба post-training, 100 оролцогчтой, сайн дурын ажилтнаар оролцсон.</p>' });

  ev("ph1", { file: "ЗУРАГ-01", title: "Хэргийн хүн", kind: "photo", html:
    (P.photoFull ? '<img class="ev-photo" src="' + esc(P.photoFull) + '" alt="' + esc(P.name) + ', mug shot">' : '<div class="portrait">' + (P.photo ? '<img src="' + esc(P.photo) + '" alt="' + esc(P.name) + '">' : "<span>" + esc(P.monogram) + "</span>") + "</div>") + "<h4>" + esc(P.name) + '</h4><p class="mono">' + esc(P.role) + "</p><p>" + esc(P.line) + "</p>" });
  ev("ph2", { file: "ЗУРАГ-02", title: "Волейбол", kind: "photo", html:
    '<img class="ev-photo" src="assets/photo/vb_team2.jpg" alt="СЭЗИС-ийн волейболын баг"><p class="small">СЭЗИС-ийн волейболын баг.</p><h4>Волейбол</h4><p>Спортын 1-р зэрэгтэй. СЭЗИС-ийн аварга (2024-25, 2025-26); 29 клубийн тэмцээнд 1-р байр (2026).</p>' });

  ev("fp", { file: "ХЭЭ-01", title: "Хурууны хээний карт", kind: "print", html:
    '<img class="fp-img" src="assets/fingerprint.png" alt="Хурууны хээний карт"><p class="mono">ХЭЭНИЙ ТАНИЛТ</p><p>Энэ хээ хэнийх вэ? Улаан утсыг дагаж «Хэргийн хүн»-ий зураг руу оч.</p>' });

  ev("ubph", { file: "ЗУРАГ-03", title: "Улаанбаатар, Сүхбаатарын талбай", kind: "photo", html:
    '<img class="ev-photo" src="assets/photo/ub.jpg" alt="Сүхбаатарын талбай, Улаанбаатар"><p class="small">Зураг: Wikimedia Commons «Sükhbaatar Square» (CC0).</p><p>Хэргийн хүн Улаанбаатар дахь СЭЗИС-д (UFE) 2024 оноос суралцаж байна. Газрын зураг дээрх зүүг үзээрэй.</p>' });

  ev("projects", { file: "ХАВТАС", title: "Төслүүдийн жагсаалт", html: C.projects.map(projBlock).join("") });
  ev("goal", { file: "ЗОРИЛГО", title: "Зорилго", html: "<p>Мэдээллийн системийн төслийн менежер болох.</p><p>Үүний тулд: системийн шинжилгээ (As-is / To-be), багийн удирдлага, илтгэл тавих чадварыг хөгжүүлж байна.</p>" });
  ev("hobby", { file: "ХОББИ", title: "Хобби", note: true, html: '<p class="hand big">Волейбол. Англи хэл: B1.</p>' });
  ev("lead", { file: "ФАЙЛ-08", title: "Багийн удирдлага", html: lead.map(function (l) { return '<div class="proj"><h4>' + esc(l.org) + ", " + esc(l.role) + '</h4><span class="mono">' + esc(l.when) + "</span><p>" + esc(l.note) + "</p></div>"; }).join("") });

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
      { id: "b-skills", ev: "usb",   kind: "paper", x: 450, y: 90,  w: 150, h: 185, rot: -2, label: "Ур чадвар" },
      { id: "b-proj",   ev: "projects", kind: "paper", x: 650, y: 60, w: 150, h: 185, rot: 3, label: "Төслүүд" },
      { id: "b-goal",   ev: "goal",  kind: "note",  x: 830, y: 120, w: 130, h: 130, rot: -3 },
      { id: "b-hobby",  ev: "hobby", kind: "note",  x: 90,  y: 330, w: 125, h: 125, rot: 4 },
      { id: "b-vb",     ev: "ph2",   kind: "photo", x: 270, y: 300, w: 130, h: 155, rot: -3 },
      { id: "b-champ",  ev: "vb",    kind: "news",  x: 470, y: 320, w: 160, h: 170, rot: 2 },
      { id: "b-lead",   ev: "lead",  kind: "paper", x: 690, y: 310, w: 150, h: 185, rot: -2, label: "Багийн удирдлага" }
    ],
    // each string connects two nodes and says why
    edges: [
      { a: "b-id", b: "b-edu", why: "Хэргийн хүн ба түүний сургууль." },
      { a: "b-edu", b: "b-skills", why: "Боловсрол ур чадварыг бий болгосон." },
      { a: "b-skills", b: "b-proj", why: "Ур чадвараа төслүүдэд ашигласан." },
      { a: "b-proj", b: "b-goal", why: "Төслүүд мэргэжлийн зорилготой холбогдоно." },
      { a: "b-id", b: "b-hobby", why: "Хэргийн хүний хобби." },
      { a: "b-hobby", b: "b-vb", why: "Хамгийн дуртай спорт нь волейбол." },
      { a: "b-vb", b: "b-champ", why: "Волейболоор аварга болсон." },
      { a: "b-champ", b: "b-lead", why: "Багийн тоглолтоос удирдлага сурсан." },
      { a: "b-lead", b: "b-goal", why: "Удирдлагын туршлага нь төслийн менежер болох зорилготой холбоотой." }
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
  // what lies inside each folder: a clipped photo (real image) + the interview transcript from content.js
  var CASES = [
    { id: "c1", no: "001", title: "Хувийн мэдээлэл", puzzle: "code",     photo: P.photo || "assets/fingerprint.png", caption: "Хэргийн хүн" },
    { id: "c2", no: "002", title: "Боловсрол",       puzzle: "timeline", photo: "assets/photo/ufe.jpg", caption: "СЭЗИС" },
    { id: "c3", no: "003", title: "Техникийн чадвар", puzzle: "cipher",   photo: "assets/photo/dl_code.jpg", caption: "Deep Learning UB 2025" },
    { id: "c4", no: "004", title: "Төслүүд",         puzzle: "connect",  photo: "assets/photo/kadrlink.jpg", caption: "KadrLink" },
    { id: "c5", no: "005", title: "Хобби, сонирхол", puzzle: "pattern",  photo: "assets/photo/vb_team.jpg", caption: "Волейболын баг" },
    { id: "c6", no: "006", title: "Ирээдүйн зорилго", puzzle: "match",    photo: "assets/photo/networking.jpg", caption: "UFE Networking 2026" }
  ];
  CASES.forEach(function (c) { c.iv = (C.interview && C.interview[c.id]) || { note: "", qa: [] }; });

  /* ---------------- puzzle building blocks (facts the puzzles are generated from) ---------------- */
  var FACTS = {
    // 2-digit numbers that really appear in a desk document
    numbers: [
      { label: "Whitehats клубийн гишүүдийн тоо", n: 43, doc: "wh" },
      { label: "UFE CS2 Tournament-ын багийн тоо", n: 22, doc: "wh" },
      { label: "Эконометрик судалгааны ажиглалтын тоо", n: 28, doc: "econ" },
      { label: "Student Led 2026-д оролцсон сургуулийн тоо", n: 20, doc: "sl" }
    ],
    pairs: [
      ["Whitehats клуб", "UFE CS2 Tournament, 22 баг", "wh"],
      ["KadrLink", "ДАН / e-Mongolia баталгаажуулалт", "kl"],
      ["Эконометрик судалгаа", "EViews, 28 ажиглалт", "econ"],
      ["Student Led 2026", "«Био сав», 147 баг", "sl"],
      ["Оюутны холбоо", "~6000 оюутан", "su"]
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
  window.LC.data = { EVIDENCE: E, DESK: DESK, BOARD: BOARD, EXTRA: EXTRA, CASES: CASES, FACTS: FACTS, esc: esc };
})();

/*
 * app.js, THE LAST CASE (game logic + paper dialogs)
 * The 3D room lives in scene3d.js (three.js). This file owns the state, the readers, the four case folders
 * (puzzles), the HUD, the works carousel, the guide, CV + language buttons and the final report. The scene calls LC.ui.* when something is clicked.
 * Progress + random seed live in sessionStorage, so one visit = one investigation; "Reset" makes a new one.
 */
(function () {
  "use strict";

  var LC = window.LC, D = LC.data, C = window.CONTENT, G = window.MN_GEO, esc = D.esc, L = window.L;
  var $ = function (s) { return document.querySelector(s); };
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  /* ============================== state ============================== */
  var KEY = "lastcase-state";
  var state;
  try { state = JSON.parse(sessionStorage.getItem(KEY)); } catch (e) { state = null; }
  if (!state || !state.seed) state = { seed: String(Math.random()).slice(2, 10), found: {}, unlocked: {}, pos: {} };
  function save() { try { sessionStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* storage blocked: game still works */ } }
  save();

  /* ============================== helpers ============================== */
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function div(cls, html) { var d = document.createElement("div"); if (cls) d.className = cls; if (html !== undefined) d.innerHTML = html; return d; }
  var toastTimer;
  function toast(msg) {
    var t = $("#toast"); t.textContent = msg; t.classList.add("show");
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { t.classList.remove("show"); }, 3200);
  }
  function count(o) { return Object.keys(o).length; }

  /* ============================== Mongolia map (real relief map, Wikimedia Commons) ============================== */
  // Relief_map_of_Mongolia.png: equirectangular, N 52.5° S 41.3° W 87.4° E 120.5° (from the file description)
  var MAPB = { n: 52.5, s: 41.3, w: 87.4, e: 120.5 };
  function mapXY(p) { return { x: (p.lon - MAPB.w) / (MAPB.e - MAPB.w), y: (MAPB.n - p.lat) / (MAPB.n - MAPB.s) }; }
  function km(a, b) {
    var R = 6371, r = Math.PI / 180, dLat = (b.lat - a.lat) * r, dLon = (b.lon - a.lon) * r;
    var h = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return Math.round(2 * R * Math.asin(Math.sqrt(h)));
  }
  function placeHTML(id) {
    var ub = G.places.ub, dg = G.places.dg;
    if (id === "ub") return "<h4>" + L("Улаанбаатар", "Ulaanbaatar") + "</h4>" + rowsHTML([[L("Статус", "Status"), L("Монгол улсын нийслэл", "Capital of Mongolia")], [L("Координат", "Coordinates"), ub.lat.toFixed(2) + "°N, " + ub.lon.toFixed(2) + "°E"], [L("Хэргийн холбоо", "Link to the case"), L("Одоо суралцаж буй сургууль, СЭЗИС (UFE)", "Current university, UFE")]]);
    if (id === "dg") return "<h4>" + L("Дундговь аймаг", "Dundgovi province") + "</h4>" + rowsHTML([[L("Аймгийн төв", "Centre"), "Mandalgovi"], [L("Координат (төв)", "Coordinates (centre)"), dg.lat.toFixed(2) + "°N, " + dg.lon.toFixed(2) + "°E"], [L("Хэргийн холбоо", "Link to the case"), L("Сайнцагаан суманд төрсөн; «Цэгцбилиг» сургуульд 2012-2024 онд суралцсан", "Born in Saintsagaan; studied at Tsegtsbilig school, 2012-2024")]]);
    return "<h4>" + L("Дундговь, Улаанбаатар", "Dundgovi, Ulaanbaatar") + "</h4><p>" + L("Төрсөн аймаг ба одоо суралцаж буй хот.", "Home province and the city of study.") + "</p>" + rowsHTML([[L("Шулуун зай (ойролцоо)", "Straight-line distance (approx.)"), "≈ " + km(dg, ub) + L(" км", " km")]]) + '<p class="small">' + L("Зай нь аймгийн төв ба нийслэлийн координатаас тооцоолсон.", "Computed from the coordinates of the province centre and the capital.") + "</p>";
  }
  function rowsHTML(r) { return '<table class="kv">' + r.map(function (x) { return "<tr><th>" + esc(x[0]) + "</th><td>" + esc(x[1]) + "</td></tr>"; }).join("") + "</table>"; }
  function bigMapHTML() {
    var u = mapXY(G.places.ub), d = mapXY(G.places.dg);
    function pin(id, p, label) { return '<button type="button" class="mpin2" data-place="' + id + '" style="left:' + (p.x * 100).toFixed(2) + '%;top:' + (p.y * 100).toFixed(2) + '%" aria-label="' + esc(label) + '"><i></i><span>' + esc(label) + "</span></button>"; }
    return '<div class="bigmap2"><img src="assets/photo/mongolia_map.jpg" alt="' + esc(L("Монгол улсын рельефийн газрын зураг", "Relief map of Mongolia")) + '" width="1200" height="568">' +
      '<svg viewBox="0 0 1000 1000" preserveAspectRatio="none" aria-hidden="true"><path data-string="1" d="M' + (u.x * 1000) + " " + (u.y * 1000) + " Q" + ((u.x + d.x) * 500 + 30) + " " + ((u.y + d.y) * 500) + " " + (d.x * 1000) + " " + (d.y * 1000) + '"/></svg>' +
      pin("ub", u, L("Улаанбаатар", "Ulaanbaatar")) + pin("dg", d, L("Дундговь", "Dundgovi")) + "</div>" +
      '<p class="small">' + L("Зүү эсвэл улаан утсан дээр дарна уу. Газрын зураг: Wikimedia Commons «Relief map of Mongolia» (CC BY-SA 3.0).", "Click a pin or the red string. Map: Wikimedia Commons “Relief map of Mongolia” (CC BY-SA 3.0).") + "</p>";
  }
  function bindMap(container) {
    container.addEventListener("click", function (e) {
      var pin = e.target.closest("[data-place]"), str = e.target.closest("[data-string]");
      if (pin) { e.stopPropagation(); openPlace(pin.dataset.place); }
      else if (str) { e.stopPropagation(); openPlace("link"); }
    });
  }
  function openPlace(id) {
    showReader({ file: L("ГАЗАР ЗҮЙ", "GEOGRAPHY"), title: id === "ub" ? L("Улаанбаатар", "Ulaanbaatar") : id === "dg" ? L("Дундговь", "Dundgovi") : L("Улаан утас", "Red string"), html: placeHTML(id) }, "map", true);
    markFound("map-" + id);
  }
  function openMapBig() { showReader({ file: L("ГАЗАР ЗҮЙ", "GEOGRAPHY"), title: L("Монгол улсын газрын зураг", "Map of Mongolia"), html: bigMapHTML(), wide: true }, "map"); }

  /* ============================== reader (zoom into a document) ============================== */
  var readerOpener = null;
  function showReader(o, kind, keepOpener) {
    var r = $("#reader"), sheet = $("#readerSheet");
    if (!keepOpener) readerOpener = document.activeElement;
    sheet.className = "sheet " + (o.kind === "news" ? "sheet-news " : "") + (o.kind === "photo" ? "sheet-photo " : "") + (o.note ? "sheet-note " : "") + (o.wide ? "sheet-wide" : "");
    $("#readerFile").textContent = o.file || "";
    $("#readerTitle").textContent = o.title;
    $("#readerBody").innerHTML = o.html;
    $("#readerStamp").textContent = o.stamp || "";
    $("#readerStamp").style.display = o.stamp ? "block" : "none";
    r.hidden = false; r.classList.remove("in"); void r.offsetWidth; r.classList.add("in");
    LC.audio.sfx("open"); $("#readerClose").focus();
  }
  var onReaderClose = null;
  function closeReader() {
    $("#reader").hidden = true;
    var v = $("#readerBody video"); if (v) v.pause();
    if (onReaderClose) { var f = onReaderClose; onReaderClose = null; f(); }
    if (readerOpener && readerOpener.focus && readerOpener !== document.body) readerOpener.focus({ preventScroll: true });
  }
  function markFound(id) {
    if (state.found[id]) return;
    state.found[id] = true; save(); hud(); LC.audio.sfx("found");
    toast(L("Нотлох баримт цугларлаа: ", "Evidence collected: ") + count(state.found));
  }
  function openEvidence(id) {
    var ev = D.EVIDENCE[id]; if (!ev) return;
    showReader(ev); markFound(id);
    if (ev.hidden) toast(L("Далд тэмдэглэл олдлоо!", "You found a hidden note!"));
  }
  bindMap($("#readerBody"));
  $("#readerClose").addEventListener("click", closeReader);
  $("#reader").addEventListener("click", function (e) { if (e.target.id === "reader") closeReader(); });

  // the tape on the TV, opened big with sound and controls
  function openVideo(src, t, onClose) {
    showReader({ file: L("БИЧЛЭГ № 334", "TAPE No. 334"), title: L("Видео бичлэг", "Video tape"), wide: true, html: '<video class="ev-video" controls playsinline preload="auto" src="' + esc(src) + '"></video><p class="small">' + L("Хаахад зурагт дээр үргэлжлэн тоглоно.", "When you close this, it keeps playing on the TV.") + "</p>" });
    var v = $("#readerBody video"); try { v.currentTime = t || 0; } catch (e) { /* not ready */ }
    var a = LC.audio.get(); v.muted = a.muted; v.volume = a.volume;
    var p = v.play(); if (p && p.catch) p.catch(function () { /* user can press play */ });
    onReaderClose = function () { if (onClose) onClose(v.currentTime, v.ended); };
    markFound("tape");
  }

  /* ============================== case folders: a real manila folder that opens ============================== */
  // closed: the cover with a typed label and a puzzle slip taped on it. solved: a stamp, then the cover swings open:
  // left = inside of the cover (clipped photo + the detective's handwritten note), right = the interview transcript.
  var pzCase = null, pzOpener = null, hintLevel = 0, wrongs = 0, pzObj = null;
  var dossier = $("#dossier"), dFront = $("#dFront"), dInside = $("#dInside"), dPage = $("#dPage");
  function caseById(id) { return D.CASES.filter(function (c) { return c.id === id; })[0]; }
  // 3D mode: the folder comes up in the room (scene3d.js); the puzzle sits on a paper slip beside it.
  var in3d = false;
  function use3d() { return !!(window.__sceneOK && LC.scene && LC.scene.openCase); }
  function caseNav() {
    var i = D.CASES.indexOf(pzCase), prev = D.CASES[i - 1], next = D.CASES[i + 1];
    $("#cbPrev").hidden = !prev; $("#cbNext").hidden = !next;
    $("#cbPrev").textContent = prev ? "CASE " + prev.no : ""; $("#cbNext").textContent = next ? "CASE " + next.no : "";
    $("#cbPrev").dataset.go = prev ? prev.id : ""; $("#cbNext").dataset.go = next ? next.id : "";
    $("#cbWorks").hidden = !pzCase.works;
  }
  function markViewed() { state.viewed = state.viewed || {}; if (!state.viewed[pzCase.id]) { state.viewed[pzCase.id] = true; save(); hud(); } }
  function openFolder(id, opener, textMode) {
    if (!textMode && use3d()) {
      pzCase = caseById(id); pzOpener = opener || document.activeElement;
      if (LC.scene.openCase(pzCase, !!state.unlocked[id])) {
        in3d = true; caseNav(); LC.audio.sfx("open");
        if (!state.unlocked[id]) { $("#pzPanel").hidden = false; showPuzzle($("#slip3")); }
        else setTimeout(markViewed, 1200);
        return;
      }
    }
    pzCase = caseById(id); pzOpener = opener || document.activeElement;
    var box = $("#folder"); box.hidden = false;
    dossier.className = "dossier"; void dossier.offsetWidth; dossier.classList.add("in");
    LC.audio.sfx("open");
    drawCover();
    if (state.unlocked[id]) { drawInside(); setTimeout(function () { flipOpen(); }, reduceMotion ? 0 : 420); }
    else showPuzzle();
  }
  function closeCase3d(after) {
    if (!in3d) { if (after) after(); return; }
    LC.scene.endInspect(function () { in3d = false; checkAllRead(); if (after) after(); });
  }
  function closeFolder() {
    if (in3d) { closeCase3d(); return; }
    if (dossier.classList.contains("open") && !reduceMotion) {
      dossier.classList.remove("open"); LC.audio.sfx("drop");
      setTimeout(hideFolder, 650);
    } else hideFolder();
  }
  function hideFolder() {
    $("#folder").hidden = true;
    if (pzOpener && pzOpener.focus && pzOpener !== document.body) pzOpener.focus({ preventScroll: true });
    checkAllRead();
  }
  function drawCover() {
    var cs = pzCase, open = !!state.unlocked[cs.id];
    dFront.innerHTML =
      '<div class="d-tab">CASE ' + cs.no + "</div>" +
      '<div class="d-label"><span class="typed small-caps">' + L("Хэргийн хавтас № 2026-334-", "Case file No. 2026-334-") + cs.no + '</span><b class="hand">' + esc(cs.title) + "</b></div>" +
      '<div class="ink-stamp ' + (open ? "green" : "") + '" id="coverStamp">' + (open ? L("НЭЭГДСЭН", "OPENED") : L("НУУЦ", "SECRET")) + "</div>" +
      '<div class="slip" id="slip"></div>';
  }
  function showPuzzle(slipEl) {
    var cs = pzCase, slip = slipEl || $("#slip");
    pzObj = LC.puzzles[cs.puzzle](LC.makeRng("pz:" + state.seed + ":" + cs.id));
    hintLevel = 0; wrongs = 0;
    slip.classList.remove("done");
    [$("#slip"), $("#slip3")].forEach(function (o) { if (o && o !== slip) o.innerHTML = ""; });
    slip.innerHTML = '<div class="tape"></div><p class="typed slip-h">' + L("ЗӨВШӨӨРӨЛ АВАХ, ", "CLEARANCE REQUIRED, ") + esc(pzObj.title).toUpperCase() + "</p>" +
      '<p class="typed slip-i">' + pzObj.intro + '</p><div id="pzBox"></div><p class="pz-msg hand" id="pzMsg" aria-live="polite"></p>' +
      '<div class="pz-ctl"><button type="button" id="pzHint" class="pencil">' + L("сануулга авах", "get a hint") + '</button><button type="button" id="pzSkip" class="pencil">' + L("оньсогыг алгасах", "skip the puzzle") + "</button></div>";
    var api = {
      solve: function () { LC.audio.sfx("unlock"); unlock(cs); },
      wrong: function () { LC.audio.sfx("wrong"); wrongs++; say(L("Буруу. Дахин нэг харъя.", "Wrong. Take another look.")); if (wrongs === 2) revealHint(); },
      say: say
    };
    pzObj.render($("#pzBox"), api);
    $("#pzHint").addEventListener("click", revealHint);
    $("#pzSkip").addEventListener("click", function () { say(L("Алгаслаа.", "Skipped.")); unlock(cs, true); });
  }
  function say(t) { var m = $("#pzMsg"); if (m) m.textContent = t; }
  function revealHint() {
    if (!pzObj) return;
    var h = pzObj.hints[Math.min(hintLevel, pzObj.hints.length - 1)]; hintLevel++;
    say(L("Сануулга: ", "Hint: ") + h);
  }
  function unlock(cs, skipped) {
    if (!state.unlocked[cs.id]) { state.unlocked[cs.id] = true; save(); hud(); }
    if (LC.scene && LC.scene.refreshFolder) LC.scene.refreshFolder(cs.id);
    toast(L("Хавтас ", "Folder ") + cs.no + L(" нээгдлээ", " is open") + (skipped ? L(" (оньсого алгассан).", " (puzzle skipped).") : "."));
    LC.audio.sfx("closed");
    if (in3d) { $("#slip3").classList.add("done"); LC.scene.caseUnlocked(cs); setTimeout(markViewed, 1800); return; }
    var st = $("#coverStamp"); if (st) { st.textContent = L("НЭЭГДСЭН", "OPENED"); st.classList.add("green", "slam"); }
    var slip = $("#slip"); if (slip) slip.classList.add("done");
    drawInside();
    setTimeout(flipOpen, reduceMotion ? 50 : 1000);
  }
  function answered(cs) { return cs.iv.qa.filter(function (x) { return x[1] && String(x[1]).trim(); }); }
  // the open folder looks like a spread of real case ephemera:
  // left  = ID card of the person (photo, fingerprints, round seal) + a kraft evidence envelope with a string-and-button
  //         closure and the detective's notes tag sticking out of it
  // right = a typed case report form + the interview on ruled lines, signed and stamped
  function today() { var d = new Date(); return d.getFullYear() + "." + String(d.getMonth() + 1).padStart(2, "0") + "." + String(d.getDate()).padStart(2, "0"); }
  function drawInside() {
    var cs = pzCase, qa = answered(cs), P = C.person;
    var note = cs.iv.note || (qa[0] ? qa[0][1] : "");
    var photo = cs.photo || "assets/fingerprint.png";
    var idCard =
      '<div class="id-card">' +
        '<div class="id-top"><span class="typed">' + L("ХЭРГИЙН ХҮНИЙ ҮНЭМЛЭХ", "PERSON OF INTEREST ID") + '</span><span class="typed">№ 334-' + cs.no + "</span></div>" +
        '<div class="id-body">' +
          '<figure class="id-photo"><img src="' + esc(photo) + '" alt="' + esc(cs.caption || L("Хурууны хээ", "Fingerprint")) + '"><figcaption class="hand">' + esc(cs.caption || L("Хэргийн хүн", "Person of interest")) + "</figcaption></figure>" +
          '<dl class="id-fields">' +
            "<dt>" + L("Овог нэр", "Name") + "</dt><dd>" + esc(P.name) + "</dd>" +
            "<dt>" + L("Төрсөн газар", "Born in") + "</dt><dd>" + esc(P.born) + "</dd>" +
            "<dt>" + L("Сургууль", "School") + "</dt><dd>" + esc(P.school) + "</dd>" +
            "<dt>" + L("Ангилал", "Section") + "</dt><dd>" + esc(cs.title) + "</dd>" +
          "</dl>" +
        "</div>" +
        '<div class="id-prints" aria-hidden="true"><i></i><i></i><i></i><i></i></div>' +
        '<div class="seal" aria-hidden="true"><span>THE LAST CASE</span><b>334</b></div>' +
      "</div>";
    var envelope =
      '<div class="env">' +
        '<div class="env-tag"><span class="eyelet"></span><p class="typed small-caps">' + L("Мөрдөгчийн тэмдэглэл", "Detective’s note") + '</p>' +
          (note ? '<p class="hand">' + esc(note) + "</p>" : '<p class="hand faint">' + L("хоосон", "empty") + "</p>") + "</div>" +
        '<div class="env-flap"></div><span class="env-btn b1"></span><span class="env-btn b2"></span><span class="env-string"></span>' +
        '<div class="env-body">' +
          '<p class="env-title">' + L("НОТЛОХ БАРИМТ", "EVIDENCE") + '</p>' +
          '<p class="env-line"><span>' + L("Хэргийн №", "Case No.") + '</span><b>2026-334-' + cs.no + "</b></p>" +
          '<p class="env-line"><span>' + L("Огноо", "Date") + '</span><b>' + today() + "</b></p>" +
          '<p class="env-line"><span>' + L("Агуулга", "Content") + '</span><b>' + esc(cs.title) + "</b></p>" +
          '<div class="ink-stamp env-stamp">' + L("НУУЦ", "SECRET") + '</div>' +
        "</div>" +
      "</div>";
    dInside.innerHTML = idCard + envelope;
    var i = D.CASES.indexOf(cs), prev = D.CASES[i - 1], next = D.CASES[i + 1];
    dPage.innerHTML =
      '<div class="report">' +
        '<header class="rp-head"><div class="seal small" aria-hidden="true"><span>' + L("МӨРДӨН БАЙЦААЛТ", "INVESTIGATION") + '</span><b>' + cs.no + "</b></div>" +
          '<div><p class="typed small-caps">' + L("Хэргийн хавтас № 2026-334-", "Case file No. 2026-334-") + cs.no + '</p><h3 class="rp-title">' + esc(cs.title.toUpperCase()) + '</h3><p class="typed small-caps">' + L("Хэргийн тайлан", "Case report") + '</p></div></header>' +
        '<div class="rp-grid">' +
          '<p><span>' + L("Хэргийн хүн", "Person") + '</span><b>' + esc(P.name) + "</b></p>" +
          '<p><span>' + L("Ангилал", "Section") + '</span><b>' + esc(cs.title) + "</b></p>" +
          '<p><span>' + L("Байцаасан", "Interviewed by") + '</span><b>' + L("мөрдөгч (та)", "the detective (you)") + '</b></p>' +
          '<p><span>' + L("Огноо", "Date") + '</span><b>' + today() + "</b></p>" +
        "</div>" +
        '<div class="mob-inside">' + idCard + "</div>" +
        '<div class="rp-sections">' + D.sectionsHTML(cs) + "</div>" +
        '<p class="rp-sec typed small-caps">' + L("Мэдүүлэг", "Interview") + '</p>' +
        (qa.length ? '<ol class="qa">' + qa.map(function (x, n) { return '<li><p class="typed qa-q"><b>' + L("А", "Q") + (n + 1) + ".</b> " + esc(x[0]) + '</p><p class="typed qa-a"><b>' + L("Х.", "A.") + '</b> ' + esc(x[1]) + "</p></li>"; }).join("") + "</ol>"
          : '<p class="typed faint ruled">' + L("Мэдүүлэг хараахан бүртгэгдээгүй байна.", "No statement recorded yet.") + "</p>") +
        '<div class="rp-foot"><div class="pg-sign"><span class="hand">' + esc(L(P.name.split(" ").pop(), P.name.split(" ")[0])) + '</span><small class="typed">' + L("мэдүүлэг өгсөн хүний гарын үсэг", "signature of the person interviewed") + '</small></div>' +
          '<div class="ink-stamp green pg-stamp">' + L("НЭЭГДСЭН", "OPENED") + '</div></div>' +
        '<div class="ink-stamp rp-diag" aria-hidden="true">CONFIDENTIAL</div>' +
      "</div>" +
      '<nav class="pg-nav">' + (prev ? '<button type="button" class="paper-tab" data-go="' + prev.id + '">CASE ' + prev.no + "</button>" : "<span></span>") +
      '<button type="button" class="paper-tab" data-close="1">' + L("Хавтсыг хаах", "Close the folder") + '</button>' +
      (next ? '<button type="button" class="paper-tab" data-go="' + next.id + '">CASE ' + next.no + "</button>" : "<span></span>") + "</nav>";
  }
  function flipOpen() {
    dossier.classList.add("open"); LC.audio.sfx("open");
    state.viewed = state.viewed || {}; if (!state.viewed[pzCase.id]) { state.viewed[pzCase.id] = true; save(); hud(); }
    setTimeout(function () { dPage.focus({ preventScroll: true }); dPage.scrollTop = 0; }, 500);
  }
  dPage.addEventListener("click", function (e) {
    var b = e.target.closest("button"); if (!b) return;
    if (b.dataset.close) closeFolder();
    else if (b.dataset.go) { var id = b.dataset.go; dossier.classList.remove("open"); setTimeout(function () { openFolder(id, pzOpener); }, reduceMotion ? 0 : 450); }
  });
  $("#folderClose").addEventListener("click", closeFolder);
  // the bar under a 3D folder
  function goCase(id) { closeCase3d(function () { openFolder(id, pzOpener); }); }
  $("#cbPrev").addEventListener("click", function () { goCase(this.dataset.go); });
  $("#cbNext").addEventListener("click", function () { goCase(this.dataset.go); });
  $("#cbClose").addEventListener("click", function () { closeFolder(); });
  $("#cbText").addEventListener("click", function () { var id = pzCase.id; closeCase3d(function () { openFolder(id, pzOpener, true); }); });
  $("#cbWorks").addEventListener("click", function () { closeCase3d(function () { openWorks(0); }); });
  $("#cbLeft").addEventListener("click", function () { LC.scene.showSide("left"); });
  $("#cbRight").addEventListener("click", function () { LC.scene.showSide("right"); });
  // the bar under a document in your hands
  $("#inspBack").addEventListener("click", function () { LC.scene.endInspect(); });
  $("#inspText").addEventListener("click", function () { var id = $("#inspBar").dataset.ev; LC.scene.endInspect(function () { openEvidence(id); }); });
  $("#folder").addEventListener("click", function (e) { if (e.target.id === "folder") closeFolder(); });

  /* ---- all folders read, the "close the case" button appears ---- */
  function allRead() { return D.CASES.every(function (c) { return state.unlocked[c.id] && state.viewed && state.viewed[c.id]; }); }
  function checkAllRead() {
    var ok = allRead(); $("#btnCloseCase").hidden = !ok;
    if (ok && !state.readyToClose) { state.readyToClose = true; save(); if (LC.scene && LC.scene.finale) LC.scene.finale(); toast(L("Бүх хавтастай танилцлаа. Одоо хэргийг хааж болно.", "You have read every folder. You can close the case now.")); }
  }

  /* ============================== HUD ============================== */
  function hud() {
    var u = count(state.unlocked), v = state.viewed || {};
    $("#caseTabs").innerHTML = D.CASES.map(function (c) {
      var st = state.unlocked[c.id] ? (v[c.id] ? "read" : "open") : "locked";
      return '<button type="button" class="ctab ' + st + '" data-case="' + c.id + '" title="CASE ' + c.no + ", " + esc(c.title) + '" aria-label="CASE ' + c.no + ", " + esc(c.title) + ", " + (st === "locked" ? L("түгжээтэй", "locked") : L("нээгдсэн", "open")) + '"><span>' + c.no + "</span><i></i></button>";
    }).join("");
    $("#evTag").innerHTML = '<small>' + L("Нотлох баримт", "Evidence") + '</small><b>' + String(count(state.found)).padStart(2, "0") + "</b>";
    var left = D.CASES.length - u, hint;
    if (left === D.CASES.length) hint = L("Баримт дээр дарж унш. Доод талын 4 хавтсыг (эсвэл дээрх 001-004) нээ. «?» = заавар.", "Click documents to read them. Open the 4 folders at the front (or 001-004 above). “?” = guide.");
    else if (left > 0) hint = u + "/" + D.CASES.length + L(" хавтас нээгдсэн. Сэжүүр самбар, ширээ хоёрт бий, улаан утсыг дага.", " folders open. The clues are on the board and the desk; follow the red string.");
    else if (!allRead()) hint = L("Бүх хавтас нээгдсэн. Үлдсэн хавтасныхаа тайланг уншаарай.", "All folders are open. Read the reports you have not read yet.");
    else hint = L("Хэрэг бүрэн. «Хэргийг хаах» товчийг дар.", "The case is complete. Press “Close the case”.");
    $("#footHint").textContent = hint;
  }
  $("#caseTabs").addEventListener("click", function (e) { var b = e.target.closest("[data-case]"); if (b) openFolder(b.dataset.case, b); });

  function contactHTML() {
    var c = C.contact, l = [];
    if (c.email) l.push([L("И-МЭЙЛ", "EMAIL"), c.email, "mailto:" + c.email]);
    if (c.phone) l.push([L("УТАС", "PHONE"), c.phone, "tel:" + c.phone.replace(/\s/g, "")]);
    if (c.github) l.push(["GITHUB", c.github.replace(/^https?:\/\//, ""), c.github]);
    if (c.linkedin) l.push(["LINKEDIN", c.linkedin.replace(/^https?:\/\/(www\.)?/, ""), c.linkedin]);
    if (c.facebook) l.push(["FACEBOOK", c.facebook.replace(/^https?:\/\/(www\.)?/, ""), c.facebook]);
    return '<div class="contacts">' + l.map(function (x) { return '<a href="' + esc(x[2]) + '"' + (/^http/.test(x[2]) ? ' target="_blank" rel="noopener"' : "") + "><small>" + x[0] + "</small>" + esc(x[1]) + "</a>"; }).join("") + "</div>";
  }
  $("#btnContact").addEventListener("click", function () { showReader({ file: L("ХОЛБОО", "CONTACT"), title: L("Холбоо барих", "Contact"), html: "<p>" + L("Хэрэгтэй үед шууд холбогдоорой.", "Feel free to get in touch.") + "</p>" + contactHTML() + cvLinkHTML() }); });
  /* ============================== closing the case: leave the room, the door shuts, the stamp falls ============================== */
  function closeCase() {
    $("#btnCloseCase").disabled = true;
    var go = function () { showClosed(); $("#btnCloseCase").disabled = false; };
    if (LC.scene && LC.scene.exitRoom) LC.scene.exitRoom(go); else go();
  }
  function showClosed() {
    var c = $("#closed"); c.hidden = false; c.classList.remove("stamped");
    state.closed = true; save();
    setTimeout(function () { c.classList.add("stamped"); LC.audio.sfx("closed"); }, reduceMotion ? 0 : 900);
    setTimeout(function () { $("#closedReport").focus(); }, 1600);
  }
  $("#btnCloseCase").addEventListener("click", closeCase);
  $("#closedReport").addEventListener("click", function () { showFinal(); });
  $("#closedBack").addEventListener("click", function () { $("#closed").hidden = true; if (LC.scene && LC.scene.backInRoom) LC.scene.backInRoom(); });
  function showFinal() {
    var P = C.person;
    $("#finalBody").innerHTML =
      '<p class="mono stamp-line">CASE CLOSED</p><h2>' + esc(P.name) + "</h2><p class='mono'>" + esc(P.role) + "</p><p>" + esc(P.line) + "</p>" + cvLinkHTML() +
      "<h4>" + L("Боловсрол", "Education") + "</h4><p>" + L("СЭЗИС, Мэдээллийн системийн менежмент (2024-2028). «Цэгцбилиг», Дундговь (2012-2024).", "UFE, Information Systems Management (2024-2028). Tsegtsbilig school, Dundgovi (2012-2024).") + "</p>" +
      "<h4>" + L("Ур чадвар", "Skills") + "</h4>" + D.barsHTML() +
      "<h4>" + L("Бүтээлүүд", "Works") + '</h4><p><a class="lnk" href="#works">' + L("Зурагтай нь үзэх", "See them with pictures") + "</a></p>" + C.projects.map(function (p) { return "<p><b>" + esc(p.title) + "</b>, " + esc(p.type) + (p.link ? ', <a href="' + esc(p.link) + '" target="_blank" rel="noopener">' + esc(p.linkLabel || L("сайт", "site")) + "</a>" : "") + (p.repo ? ', <a href="' + esc(p.repo) + '" target="_blank" rel="noopener">GitHub</a>' : "") + "</p>"; }).join("") +
      "<h4>" + L("Амжилт, шагнал", "Achievements") + "</h4>" + D.itemsHTML(C.awards.map(function (a) { return { k: a.stamp, t: a.title, n: a.when }; })) +
      "<h4>" + L("Нийгэмд оруулсан хувь нэмэр", "Community and volunteering") + "</h4>" + D.itemsHTML(C.community.map(function (c) { return { k: c.when, t: c.title, n: c.note }; })) +
      "<h4>" + L("Мэргэжлийн зорилго", "Career goal") + "</h4><p>" + L("Мэдээллийн системийн төслийн менежер болох. Төгсөөд Монголдоо 5 жил ажиллаж туршлага хуримтлуулаад, гадаадад магистраар суралцах төлөвлөгөөтэй.", "To become an information systems project manager. After graduating, 5 years of work in Mongolia, then a master’s degree abroad.") + "</p>" +
      "<h4>" + L("Холбоо барих", "Contact") + "</h4>" + contactHTML() + '<p class="quote">Every clue tells a story. This was mine.</p>';
    $("#final").hidden = false; $("#finalClose").focus();
  }
  $("#finalClose").addEventListener("click", function () { $("#final").hidden = true; });
  /* ============================== sound + controls ============================== */
  var snd = $("#btnSound"), vol = $("#vol");
  function syncSound() { var a = LC.audio.get(); snd.setAttribute("aria-pressed", String(!a.muted)); vol.value = a.volume; }
  document.addEventListener("pointerdown", function first() { LC.audio.init(); if (!LC.audio.get().muted) LC.audio.ambient(true); document.removeEventListener("pointerdown", first); }, { once: true });
  snd.addEventListener("click", function () { LC.audio.init(); var m = !LC.audio.get().muted; LC.audio.setMuted(m); LC.audio.ambient(!m); syncSound(); });
  vol.addEventListener("input", function () { LC.audio.init(); LC.audio.setVolume(+vol.value); });
  $("#btnRestart").addEventListener("click", function () {
    if (!confirm(L("Мөрдөн байцаалтыг шинээр эхлүүлэх үү? Одоогийн ахиц арилна.", "Start the investigation again? Your progress will be lost."))) return;
    try { sessionStorage.removeItem(KEY); } catch (e) { /* ignore */ }
    location.reload();
  });
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    if (LC.scene && LC.scene.inspecting && LC.scene.inspecting() && $("#reader").hidden) { if (in3d) closeFolder(); else LC.scene.endInspect(); return; }
    if (!$("#works").hidden) closeWorks();
    else if (!$("#guide").hidden) closeGuide();
    else if (!$("#final").hidden) $("#final").hidden = true;
    else if (!$("#folder").hidden) closeFolder();
    else if (!$("#reader").hidden) closeReader();
    else if (!$("#list").hidden) $("#list").hidden = true;
    else if (!$("#closed").hidden) $("#closedBack").click();
    else if (LC.scene && LC.scene.skipIntro) LC.scene.skipIntro();
  });


  /* ============================== evidence list (keyboard / phone / no-WebGL path) ============================== */
  function listHTML() {
    var seen = {}, ev = [];
    D.DESK.concat(D.BOARD.nodes, D.EXTRA || []).forEach(function (d) { if (!seen[d.ev] && D.EVIDENCE[d.ev] && !D.EVIDENCE[d.ev].hidden) { seen[d.ev] = 1; ev.push(d.ev); } });
    return '<div class="lst"><h4>' + L("Хэргийн хавтаснууд", "Case folders") + '</h4>' + D.CASES.map(function (c) {
      return '<button type="button" data-case="' + c.id + '"><b>CASE ' + c.no + "</b> " + esc(c.title) + "<small>" + (state.unlocked[c.id] ? L("НЭЭГДСЭН", "OPEN") : L("НУУЦ", "SECRET")) + "</small></button>";
    }).join("") + '<h4>' + L("Шууд үзэх", "Quick view") + '</h4><button type="button" data-works="1"><b>' + L("БҮТЭЭЛ", "WORKS") + "</b> " + L("Бүтээлүүд (зурагтай, линктэй)", "Works (pictures and links)") + '</button><button type="button" data-skills="1"><b>' + L("УР ЧАДВАР", "SKILLS") + "</b> " + L("Ур чадварын түвшин", "Skill levels") + "</button>" + (C.cv && C.cv.src ? '<a class="lst-a" href="' + esc(C.cv.src) + '" download="' + esc(C.cv.name || "CV.pdf") + '" data-cv="1"><b>CV</b> ' + L("Албан CV татах (PDF)", "Download the official CV (PDF)") + "</a>" : "") + "<h4>" + L("Нотлох баримт", "Evidence") + "</h4>" + ev.map(function (id) {
      var e = D.EVIDENCE[id];
      return '<button type="button" data-ev="' + id + '"><b>' + esc(e.file) + "</b> " + esc(e.title) + (state.found[id] ? "<small>" + L("ҮЗСЭН", "SEEN") + "</small>" : "") + "</button>";
    }).join("") + '<button type="button" data-map="1"><b>' + L("ГАЗАР ЗҮЙ", "GEOGRAPHY") + "</b> " + L("Монгол улсын газрын зураг", "Map of Mongolia") + "</button></div>";
  }
  function openList() { $("#listBody").innerHTML = listHTML(); $("#list").hidden = false; $("#listClose").focus(); }
  $("#btnList").addEventListener("click", openList);
  $("#listClose").addEventListener("click", function () { $("#list").hidden = true; });
  $("#list").addEventListener("click", function (e) {
    if (e.target.id === "list") { $("#list").hidden = true; return; }
    var b = e.target.closest("button"); if (!b || b.id === "listClose") return;
    $("#list").hidden = true;
    if (b.dataset.case) openFolder(b.dataset.case, $("#btnList"));
    else if (b.dataset.ev) openEvidence(b.dataset.ev);
    else if (b.dataset.map) openMapBig();
    else if (b.dataset.works) openWorks(0);
    else if (b.dataset.skills) openEvidence("usb");
  });

  /* ============================== CV download ============================== */
  function cvLinkHTML() {
    if (!C.cv || !C.cv.src) return "";
    return '<p><a class="lnk cv-link" href="' + esc(C.cv.src) + '" download="' + esc(C.cv.name || "CV.pdf") + '" data-cv="1">' + L("Албан CV татах (PDF)", "Download the official CV (PDF)") + "</a></p>";
  }
  var cvOK = null;   // checked once: is the CV file really there?
  function checkCV(cb) {
    if (cvOK !== null) { cb(cvOK); return; }
    if (!C.cv || !C.cv.src || location.protocol === "file:") { cvOK = !!(C.cv && C.cv.src); cb(cvOK); return; }
    fetch(C.cv.src, { method: "HEAD", cache: "no-store" }).then(function (r) { cvOK = r.ok && !/text\/html/.test(r.headers.get("content-type") || ""); cb(cvOK); }).catch(function () { cvOK = false; cb(false); });
  }
  document.addEventListener("click", function (e) {
    var a = e.target.closest("a[data-cv]"); if (!a || cvOK === true) return;
    e.preventDefault();
    checkCV(function (ok) {
      if (!ok) { toast(L("CV файл одоогоор байршаагүй байна.", "The CV file is not uploaded yet.")); return; }
      var t = document.createElement("a"); t.href = a.getAttribute("href"); t.download = a.getAttribute("download") || ""; document.body.appendChild(t); t.click(); t.remove();
    });
  });
  (function () { var b = $("#btnCV"); if (b && C.cv) { b.href = C.cv.src; b.setAttribute("download", C.cv.name || "CV.pdf"); } })();

  /* ============================== works: a carousel of the projects with pictures and links ============================== */
  var wk = { i: 0, n: 0, opener: null };
  function initials(t) { return t.split(/\s+/).slice(0, 2).map(function (w) { return w.charAt(0); }).join("").toUpperCase(); }
  function worksHTML() {
    return C.projects.map(function (p, k) {
      var imgs = (p.images && p.images.length ? p.images : (p.image ? [p.image] : []));
      var fig = imgs.length
        ? '<img src="' + esc(imgs[0]) + '" alt="' + esc(p.title) + '" loading="lazy">' + (imgs.length > 1 ? '<div class="wk-thumbs">' + imgs.map(function (src, j) { return '<button type="button" data-img="' + esc(src) + '"' + (j ? "" : ' class="on"') + ' aria-label="' + esc(p.title) + " " + (j + 1) + '"><img src="' + esc(src) + '" alt=""></button>'; }).join("") + "</div>" : "")
        : '<div class="wk-ph" style="--h:' + (p.hue || 30) + '"><b>' + esc(initials(p.title)) + "</b><span>" + esc(p.title) + "</span></div>";
      var links = (p.link ? '<a class="wk-btn" href="' + esc(p.link) + '" target="_blank" rel="noopener">' + esc(p.linkLabel || L("Сайт нээх", "Open site")) + " ↗</a>" : "") +
        (p.repo ? '<a class="wk-btn ghost" href="' + esc(p.repo) + '" target="_blank" rel="noopener">GitHub ↗</a>' : "");
      if (!links) links = '<span class="wk-none">' + L("Холбоос удахгүй нэмэгдэнэ", "Link coming soon") + "</span>";
      return '<article class="wk-slide" aria-roledescription="slide" aria-label="' + (k + 1) + " / " + C.projects.length + ", " + esc(p.title) + '">' +
        '<figure class="wk-fig">' + fig + "</figure>" +
        '<div class="wk-info"><p class="mono wk-no">' + String(k + 1).padStart(2, "0") + " / " + String(C.projects.length).padStart(2, "0") + "</p><h4>" + esc(p.title) + '</h4><p class="mono wk-meta">' + esc(p.year) + " · " + esc(p.type) + "</p><p>" + esc(p.desc) + "</p>" +
        (p.tech.length ? '<p class="wk-tech">' + p.tech.map(function (t) { return "<span>" + esc(t) + "</span>"; }).join("") + "</p>" : "") +
        '<p class="wk-links">' + links + "</p></div></article>";
    }).join("");
  }
  function wkGo(i) {
    wk.i = (i + wk.n) % wk.n;
    $("#wkTrack").style.transform = "translateX(" + (-100 * wk.i) + "%)";
    [].forEach.call($("#wkDots").children, function (d, k) { d.classList.toggle("on", k === wk.i); d.setAttribute("aria-current", k === wk.i ? "true" : "false"); });
    [].forEach.call($("#wkTrack").children, function (sl, k) { sl.setAttribute("aria-hidden", k === wk.i ? "false" : "true"); sl.querySelectorAll("a,button").forEach(function (x) { x.tabIndex = k === wk.i ? 0 : -1; }); });
  }
  function openWorks(i) {
    if (LC.scene && LC.scene.inspecting && LC.scene.inspecting()) { LC.scene.endInspect(function () { openWorks(i); }); return; }
    wk.opener = document.activeElement; wk.n = C.projects.length;
    $("#wkTrack").innerHTML = worksHTML();
    $("#wkDots").innerHTML = C.projects.map(function (p, k) { return '<button type="button" data-go="' + k + '" aria-label="' + esc(p.title) + '"></button>'; }).join("");
    $("#works").hidden = false; wkGo(i || 0); LC.audio.sfx("open"); markFound("works");
    $("#worksClose").focus();
  }
  function closeWorks() { $("#works").hidden = true; if (wk.opener && wk.opener.focus && wk.opener !== document.body) wk.opener.focus({ preventScroll: true }); }
  $("#wkPrev").addEventListener("click", function () { wkGo(wk.i - 1); LC.audio.sfx("click"); });
  $("#wkNext").addEventListener("click", function () { wkGo(wk.i + 1); LC.audio.sfx("click"); });
  $("#wkDots").addEventListener("click", function (e) { var b = e.target.closest("[data-go]"); if (b) wkGo(+b.dataset.go); });
  $("#worksClose").addEventListener("click", closeWorks);
  $("#works").addEventListener("click", function (e) {
    if (e.target.id === "works") { closeWorks(); return; }
    var t = e.target.closest("[data-img]"); if (!t) return;
    var fig = t.closest(".wk-fig"); fig.querySelector(":scope > img").src = t.dataset.img;
    fig.querySelectorAll("[data-img]").forEach(function (x) { x.classList.toggle("on", x === t); });
  });
  $("#works").addEventListener("keydown", function (e) { if (e.key === "ArrowLeft") wkGo(wk.i - 1); else if (e.key === "ArrowRight") wkGo(wk.i + 1); });
  (function swipe() {   // finger / mouse swipe on the slides
    var x0 = null, el = $("#wkTrack");
    el.addEventListener("pointerdown", function (e) { x0 = e.clientX; });
    el.addEventListener("pointerup", function (e) { if (x0 === null) return; var d = e.clientX - x0; x0 = null; if (Math.abs(d) > 50) wkGo(wk.i + (d < 0 ? 1 : -1)); });
    el.addEventListener("pointercancel", function () { x0 = null; });
  })();
  $("#btnWorks").addEventListener("click", function () { openWorks(0); });
  // any link to #works (desk documents, folder 003, the final report) opens the carousel
  document.addEventListener("click", function (e) {
    var a = e.target.closest('a[href="#works"]'); if (!a) return;
    e.preventDefault(); e.stopPropagation();
    var go = function () { openWorks(0); };
    if (!$("#reader").hidden) closeReader();
    if (!$("#final").hidden) $("#final").hidden = true;
    if (!$("#folder").hidden) hideFolder();
    if (in3d) { closeCase3d(go); return; }
    go();
  }, true);

  /* ============================== guide: who this is + how to use the room ============================== */
  var GUIDE_KEY = "lastcase-guide";
  function guideHTML() {
    var P = C.person;
    var steps = [
      ["1", L("Баримт дээр дар", "Click a document"), L("Ширээ, самбар дээрх цаас, зураг дээр дарахад нүдний өмнө ирнэ. Доорх «Текстээр унших» товчоор энгийн текстээр уншина.", "Papers and photos on the desk and the boards come up in front of you. “Read as text” shows the plain text.")],
      ["2", L("4 хавтсыг нээ", "Open the 4 folders"), L("Ширээний урд байгаа хавтас (эсвэл дээрх 001-004 таб): Миний тухай · Ур чадвар · Бүтээлүүд · Амжилт. Жижиг оньсого бодож нээнэ, хүсвэл алгасаж болно.", "The folders at the front of the desk (or the 001-004 tabs above): About me · Skills · Works · Achievements. Each opens with a small puzzle; you can skip it.")],
      ["3", L("Шууд үзэх товчнууд", "Shortcuts"), L("<b>▦ Бүтээл</b> бүтээлүүдийг зурагтай нь, <b>↓ CV</b> албан CV татах, <b>@ Холбоо</b> холбоо барих, <b>≡ Жагсаалт</b> бүх мэдээллийг энгийн текстээр. <b>EN</b> англи хэл рүү шилжинэ.", "<b>▦ Works</b> the projects with pictures, <b>↓ CV</b> download the CV, <b>@ Contact</b> get in touch, <b>≡ List</b> everything as plain text. <b>MN</b> switches to Mongolian.")],
      ["4", L("Удирдлага", "Controls"), L("Хоосон газрыг чирч эргэн тойрноо харна, дугуй эсвэл хоёр хуруугаар ойртуулна. <b>M</b> томруулдаг шил, <b>L</b> жагсаалт, <b>Esc</b> хаах. Бүх хавтсыг уншсаны дараа «Хэргийг хаах» товч гарна.", "Drag empty space to look around; wheel or pinch to zoom. <b>M</b> magnifier, <b>L</b> list, <b>Esc</b> close. After every folder is read, “Close the case” appears.")]
    ];
    return '<div class="g-hero"><img src="' + esc(P.photo) + '" alt="' + esc(P.name) + '"><div><p class="mono g-k">' + L("ХЭРГИЙН ХҮН", "PERSON OF INTEREST") + "</p><h2>" + esc(P.name) + '</h2><p class="mono g-role">' + esc(P.role) + "</p><p>" + esc(P.line) + "</p></div></div>" +
      '<h3 id="guideTitle">' + L("Хэрхэн үзэх вэ?", "How to explore") + "</h3>" +
      '<ol class="g-steps">' + steps.map(function (s) { return '<li><b class="g-n">' + s[0] + "</b><div><h4>" + s[1] + "</h4><p>" + s[2] + "</p></div></li>"; }).join("") + "</ol>" +
      '<div class="g-ctl"><button type="button" class="wk-btn" data-g="start">' + L("Мөрдөн байцаалтыг эхлэх", "Start the investigation") + '</button><button type="button" class="wk-btn ghost" data-g="works">' + L("Бүтээлүүдийг үзэх", "See the works") + '</button><button type="button" class="wk-btn ghost" data-g="list">' + L("Бүгдийг жагсаалтаар", "Everything as a list") + "</button>" +
      (C.cv && C.cv.src ? '<a class="wk-btn ghost" href="' + esc(C.cv.src) + '" download="' + esc(C.cv.name || "CV.pdf") + '" data-cv="1">↓ CV</a>' : "") + "</div>";
  }
  function showGuide(force) {
    var seen = false; try { seen = !!localStorage.getItem(GUIDE_KEY); } catch (e) { /* ignore */ }
    if (seen && !force) return false;
    $("#guideBody").innerHTML = guideHTML();
    $("#guide").hidden = false; LC.audio.sfx("open");
    try { localStorage.setItem(GUIDE_KEY, "1"); } catch (e) { /* ignore */ }
    setTimeout(function () { var b = $('#guide [data-g="start"]'); if (b) b.focus({ preventScroll: true }); $("#guide .sheet").scrollTop = 0; }, 60);
    return true;
  }
  function closeGuide() { $("#guide").hidden = true; }
  $("#guideClose").addEventListener("click", closeGuide);
  $("#guide").addEventListener("click", function (e) {
    if (e.target.id === "guide") { closeGuide(); return; }
    var b = e.target.closest("[data-g]"); if (!b) return;
    closeGuide();
    if (b.dataset.g === "works") openWorks(0);
    else if (b.dataset.g === "list") openList();
  });
  $("#btnGuide").addEventListener("click", function () { showGuide(true); });

  /* ============================== language ============================== */
  (function () {
    var b = $("#btnLang"); if (!b) return;
    b.querySelector("i").textContent = window.LANG === "en" ? "MN" : "EN";
    b.querySelector("span").textContent = window.LANG === "en" ? "Монгол" : "English";
    b.setAttribute("aria-label", window.LANG === "en" ? "Монгол хэл рүү шилжих" : "Switch to English");
    b.addEventListener("click", function () { window.setLang(window.LANG === "en" ? "mn" : "en"); });
  })();

  /* ============================== hooks for the 3D scene ============================== */
  LC.ui = {
    state: state, save: save, toast: toast, hud: hud, reduceMotion: reduceMotion,
    openEvidence: openEvidence, openFolder: openFolder, openMapBig: openMapBig, openPlace: openPlace, openList: openList,
    markFound: markFound, mapXY: mapXY, openVideo: openVideo, closeCase: function () { closeFolder(); },
    showGuide: showGuide, openWorks: openWorks,
    isOpen: function () { return !$("#reader").hidden || !$("#folder").hidden || !$("#final").hidden || !$("#list").hidden || !$("#closed").hidden || !$("#works").hidden || !$("#guide").hidden; }
  };

  /* ============================== start ============================== */
  document.title = "THE LAST CASE, " + C.person.name;
  if (window.translateDOM) window.translateDOM(document.body);
  hud(); syncSound(); checkAllRead();
  $("#btnCredits").addEventListener("click", function () { openList(); setTimeout(function () { var c = document.querySelector("#list .credits"); if (c) c.scrollIntoView({ block: "center" }); }, 60); });
  // hook for tests
  LC.debug = { state: state, openFolder: openFolder, unlock: function (id) { openFolder(id); unlock(D.CASES.filter(function (c) { return c.id === id; })[0], true); } };
})();

/*
 * app.js, THE LAST CASE (game logic + paper dialogs)
 * The 3D room lives in scene3d.js (three.js). This file owns the state, the readers, the six case folders
 * (puzzles), the HUD, sound controls and the final report. The scene calls LC.ui.* when something is clicked.
 * Progress + random seed live in sessionStorage, so one visit = one investigation; "Шинэ" makes a new one.
 */
(function () {
  "use strict";

  var LC = window.LC, D = LC.data, C = window.CONTENT, G = window.MN_GEO, esc = D.esc;
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
    if (id === "ub") return "<h4>Улаанбаатар</h4>" + rowsHTML([["Статус", "Монгол улсын нийслэл"], ["Координат", ub.lat.toFixed(2) + "°N, " + ub.lon.toFixed(2) + "°E"], ["Хэргийн холбоо", "Одоо суралцаж буй сургууль, СЭЗИС (UFE)"]]);
    if (id === "dg") return "<h4>Дундговь аймаг</h4>" + rowsHTML([["Аймгийн төв", "Мандалговь"], ["Координат (төв)", dg.lat.toFixed(2) + "°N, " + dg.lon.toFixed(2) + "°E"], ["Хэргийн холбоо", "Сайнцагаан суманд төрсөн; «Цэгцбилиг» сургуульд 2012-2024 онд суралцсан"]]);
    return "<h4>Дундговь, Улаанбаатар</h4><p>Төрсөн аймаг ба одоо суралцаж буй хот.</p>" + rowsHTML([["Шулуун зай (ойролцоо)", "≈ " + km(dg, ub) + " км"]]) + '<p class="small">Зай нь аймгийн төв ба нийслэлийн координатаас тооцоолсон.</p>';
  }
  function rowsHTML(r) { return '<table class="kv">' + r.map(function (x) { return "<tr><th>" + esc(x[0]) + "</th><td>" + esc(x[1]) + "</td></tr>"; }).join("") + "</table>"; }
  function bigMapHTML() {
    var u = mapXY(G.places.ub), d = mapXY(G.places.dg);
    function pin(id, p, label) { return '<button type="button" class="mpin2" data-place="' + id + '" style="left:' + (p.x * 100).toFixed(2) + '%;top:' + (p.y * 100).toFixed(2) + '%" aria-label="' + esc(label) + '"><i></i><span>' + esc(label) + "</span></button>"; }
    return '<div class="bigmap2"><img src="assets/photo/mongolia_map.jpg" alt="Монгол улсын рельефийн газрын зураг" width="1200" height="568">' +
      '<svg viewBox="0 0 1000 1000" preserveAspectRatio="none" aria-hidden="true"><path data-string="1" d="M' + (u.x * 1000) + " " + (u.y * 1000) + " Q" + ((u.x + d.x) * 500 + 30) + " " + ((u.y + d.y) * 500) + " " + (d.x * 1000) + " " + (d.y * 1000) + '"/></svg>' +
      pin("ub", u, "Улаанбаатар") + pin("dg", d, "Дундговь") + "</div>" +
      '<p class="small">Зүү эсвэл улаан утсан дээр дарна уу. Газрын зураг: Wikimedia Commons «Relief map of Mongolia» (CC BY-SA 3.0).</p>';
  }
  function bindMap(container) {
    container.addEventListener("click", function (e) {
      var pin = e.target.closest("[data-place]"), str = e.target.closest("[data-string]");
      if (pin) { e.stopPropagation(); openPlace(pin.dataset.place); }
      else if (str) { e.stopPropagation(); openPlace("link"); }
    });
  }
  function openPlace(id) {
    showReader({ file: "ГАЗАР ЗҮЙ", title: id === "ub" ? "Улаанбаатар" : id === "dg" ? "Дундговь" : "Улаан утас", html: placeHTML(id) }, "map", true);
    markFound("map-" + id);
  }
  function openMapBig() { showReader({ file: "ГАЗАР ЗҮЙ", title: "Монгол улсын газрын зураг", html: bigMapHTML(), wide: true }, "map"); }

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
    toast("Нотлох баримт цугларлаа: " + count(state.found));
  }
  function openEvidence(id) {
    var ev = D.EVIDENCE[id]; if (!ev) return;
    showReader(ev); markFound(id);
    if (ev.hidden) toast("Далд тэмдэглэл олдлоо!");
  }
  bindMap($("#readerBody"));
  $("#readerClose").addEventListener("click", closeReader);
  $("#reader").addEventListener("click", function (e) { if (e.target.id === "reader") closeReader(); });

  // the tape on the TV, opened big with sound and controls
  function openVideo(src, t, onClose) {
    showReader({ file: "БИЧЛЭГ № 334", title: "Видео бичлэг", wide: true, html: '<video class="ev-video" controls playsinline preload="auto" src="' + esc(src) + '"></video><p class="small">Хаахад зурагт дээр үргэлжлэн тоглоно.</p>' });
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
      '<div class="d-label"><span class="typed small-caps">Хэргийн хавтас № 2026-334-' + cs.no + '</span><b class="hand">' + esc(cs.title) + "</b></div>" +
      '<div class="ink-stamp ' + (open ? "green" : "") + '" id="coverStamp">' + (open ? "НЭЭГДСЭН" : "НУУЦ") + "</div>" +
      '<div class="slip" id="slip"></div>';
  }
  function showPuzzle(slipEl) {
    var cs = pzCase, slip = slipEl || $("#slip");
    pzObj = LC.puzzles[cs.puzzle](LC.makeRng("pz:" + state.seed + ":" + cs.id));
    hintLevel = 0; wrongs = 0;
    slip.classList.remove("done");
    [$("#slip"), $("#slip3")].forEach(function (o) { if (o && o !== slip) o.innerHTML = ""; });
    slip.innerHTML = '<div class="tape"></div><p class="typed slip-h">ЗӨВШӨӨРӨЛ АВАХ, ' + esc(pzObj.title).toUpperCase() + "</p>" +
      '<p class="typed slip-i">' + pzObj.intro + '</p><div id="pzBox"></div><p class="pz-msg hand" id="pzMsg" aria-live="polite"></p>' +
      '<div class="pz-ctl"><button type="button" id="pzHint" class="pencil">сануулга авах</button><button type="button" id="pzSkip" class="pencil">оньсогыг алгасах</button></div>';
    var api = {
      solve: function () { LC.audio.sfx("unlock"); unlock(cs); },
      wrong: function () { LC.audio.sfx("wrong"); wrongs++; say("Буруу. Дахин нэг харъя."); if (wrongs === 2) revealHint(); },
      say: say
    };
    pzObj.render($("#pzBox"), api);
    $("#pzHint").addEventListener("click", revealHint);
    $("#pzSkip").addEventListener("click", function () { say("Алгаслаа."); unlock(cs, true); });
  }
  function say(t) { var m = $("#pzMsg"); if (m) m.textContent = t; }
  function revealHint() {
    if (!pzObj) return;
    var h = pzObj.hints[Math.min(hintLevel, pzObj.hints.length - 1)]; hintLevel++;
    say("Сануулга: " + h);
  }
  function unlock(cs, skipped) {
    if (!state.unlocked[cs.id]) { state.unlocked[cs.id] = true; save(); hud(); }
    if (LC.scene && LC.scene.refreshFolder) LC.scene.refreshFolder(cs.id);
    toast("Хавтас " + cs.no + " нээгдлээ" + (skipped ? " (оньсого алгассан)." : "."));
    LC.audio.sfx("closed");
    if (in3d) { $("#slip3").classList.add("done"); LC.scene.caseUnlocked(cs); setTimeout(markViewed, 1800); return; }
    var st = $("#coverStamp"); if (st) { st.textContent = "НЭЭГДСЭН"; st.classList.add("green", "slam"); }
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
        '<div class="id-top"><span class="typed">ХЭРГИЙН ХҮНИЙ ҮНЭМЛЭХ</span><span class="typed">№ 334-' + cs.no + "</span></div>" +
        '<div class="id-body">' +
          '<figure class="id-photo"><img src="' + esc(photo) + '" alt="' + esc(cs.caption || "Хурууны хээ") + '"><figcaption class="hand">' + esc(cs.caption || "Хэргийн хүн") + "</figcaption></figure>" +
          '<dl class="id-fields">' +
            "<dt>Овог нэр</dt><dd>" + esc(P.name) + "</dd>" +
            "<dt>Төрсөн газар</dt><dd>Дундговь, Сайнцагаан</dd>" +
            "<dt>Сургууль</dt><dd>СЭЗИС, МСМТ, 3-р курс</dd>" +
            "<dt>Ангилал</dt><dd>" + esc(cs.title) + "</dd>" +
          "</dl>" +
        "</div>" +
        '<div class="id-prints" aria-hidden="true"><i></i><i></i><i></i><i></i></div>' +
        '<div class="seal" aria-hidden="true"><span>THE LAST CASE</span><b>334</b></div>' +
      "</div>";
    var envelope =
      '<div class="env">' +
        '<div class="env-tag"><span class="eyelet"></span><p class="typed small-caps">Мөрдөгчийн тэмдэглэл</p>' +
          (note ? '<p class="hand">' + esc(note) + "</p>" : '<p class="hand faint">хоосон</p>') + "</div>" +
        '<div class="env-flap"></div><span class="env-btn b1"></span><span class="env-btn b2"></span><span class="env-string"></span>' +
        '<div class="env-body">' +
          '<p class="env-title">НОТЛОХ БАРИМТ</p>' +
          '<p class="env-line"><span>Хэргийн №</span><b>2026-334-' + cs.no + "</b></p>" +
          '<p class="env-line"><span>Огноо</span><b>' + today() + "</b></p>" +
          '<p class="env-line"><span>Агуулга</span><b>' + esc(cs.title) + "</b></p>" +
          '<div class="ink-stamp env-stamp">НУУЦ</div>' +
        "</div>" +
      "</div>";
    dInside.innerHTML = idCard + envelope;
    var i = D.CASES.indexOf(cs), prev = D.CASES[i - 1], next = D.CASES[i + 1];
    dPage.innerHTML =
      '<div class="report">' +
        '<header class="rp-head"><div class="seal small" aria-hidden="true"><span>МӨРДӨН БАЙЦААЛТ</span><b>' + cs.no + "</b></div>" +
          '<div><p class="typed small-caps">Хэргийн хавтас № 2026-334-' + cs.no + '</p><h3 class="rp-title">ХЭРГИЙН ТАЙЛАН</h3><p class="typed small-caps">Байцаалтын тэмдэглэл</p></div></header>' +
        '<div class="rp-grid">' +
          '<p><span>Хэргийн хүн</span><b>' + esc(P.name) + "</b></p>" +
          '<p><span>Ангилал</span><b>' + esc(cs.title) + "</b></p>" +
          '<p><span>Байцаасан</span><b>мөрдөгч (та)</b></p>' +
          '<p><span>Огноо</span><b>' + today() + "</b></p>" +
        "</div>" +
        '<div class="mob-inside">' + idCard + "</div>" +
        '<p class="rp-sec typed small-caps">Мэдүүлэг</p>' +
        (qa.length ? '<ol class="qa">' + qa.map(function (x, n) { return '<li><p class="typed qa-q"><b>А' + (n + 1) + ".</b> " + esc(x[0]) + '</p><p class="typed qa-a"><b>Х.</b> ' + esc(x[1]) + "</p></li>"; }).join("") + "</ol>"
          : '<p class="typed faint ruled">Мэдүүлэг хараахан бүртгэгдээгүй байна.</p>') +
        '<div class="rp-foot"><div class="pg-sign"><span class="hand">' + esc(P.name.split(" ").pop()) + '</span><small class="typed">мэдүүлэг өгсөн хүний гарын үсэг</small></div>' +
          '<div class="ink-stamp green pg-stamp">НЭЭГДСЭН</div></div>' +
        '<div class="ink-stamp rp-diag" aria-hidden="true">CONFIDENTIAL</div>' +
      "</div>" +
      '<nav class="pg-nav">' + (prev ? '<button type="button" class="paper-tab" data-go="' + prev.id + '">CASE ' + prev.no + "</button>" : "<span></span>") +
      '<button type="button" class="paper-tab" data-close="1">Хавтсыг хаах</button>' +
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
    if (ok && !state.readyToClose) { state.readyToClose = true; save(); if (LC.scene && LC.scene.finale) LC.scene.finale(); toast("Бүх хавтастай танилцлаа. Одоо хэргийг хааж болно."); }
  }

  /* ============================== HUD ============================== */
  function hud() {
    var u = count(state.unlocked), v = state.viewed || {};
    $("#caseTabs").innerHTML = D.CASES.map(function (c) {
      var st = state.unlocked[c.id] ? (v[c.id] ? "read" : "open") : "locked";
      return '<button type="button" class="ctab ' + st + '" data-case="' + c.id + '" title="CASE ' + c.no + ", " + esc(c.title) + '" aria-label="CASE ' + c.no + ", " + esc(c.title) + ", " + (st === "locked" ? "түгжээтэй" : "нээгдсэн") + '"><span>' + c.no + "</span><i></i></button>";
    }).join("");
    $("#evTag").innerHTML = '<small>Нотлох баримт</small><b>' + String(count(state.found)).padStart(2, "0") + "</b>";
    var left = D.CASES.length - u, hint;
    if (left === D.CASES.length) hint = "Ширээн дээрх баримтуудыг уншаад, хавтаснуудын түгжээг тайл.";
    else if (left > 0) hint = u + "/" + D.CASES.length + " хавтас нээгдсэн. Сэжүүр самбар, ширээ хоёрт бий, улаан утсыг дага.";
    else if (!allRead()) hint = "Бүх хавтас нээгдсэн. Үлдсэн хавтасныхаа мэдүүлгийг уншаарай.";
    else hint = "Хэрэг бүрэн. «Хэргийг хаах» товчийг дар.";
    $("#footHint").textContent = hint;
  }
  $("#caseTabs").addEventListener("click", function (e) { var b = e.target.closest("[data-case]"); if (b) openFolder(b.dataset.case, b); });

  function contactHTML() {
    var c = C.contact, l = [];
    if (c.email) l.push(["И-МЭЙЛ", c.email, "mailto:" + c.email]);
    if (c.phone) l.push(["УТАС", c.phone, "tel:" + c.phone.replace(/\s/g, "")]);
    if (c.github) l.push(["GITHUB", c.github.replace(/^https?:\/\//, ""), c.github]);
    if (c.linkedin) l.push(["LINKEDIN", c.linkedin.replace(/^https?:\/\/(www\.)?/, ""), c.linkedin]);
    if (c.facebook) l.push(["FACEBOOK", c.facebook.replace(/^https?:\/\/(www\.)?/, ""), c.facebook]);
    return '<div class="contacts">' + l.map(function (x) { return '<a href="' + esc(x[2]) + '"' + (/^http/.test(x[2]) ? ' target="_blank" rel="noopener"' : "") + "><small>" + x[0] + "</small>" + esc(x[1]) + "</a>"; }).join("") + "</div>";
  }
  $("#btnContact").addEventListener("click", function () { showReader({ file: "ХОЛБОО", title: "Холбоо барих", html: "<p>Хэрэгтэй үед шууд холбогдоорой.</p>" + contactHTML() }); });
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
    var A = C.about, P = C.person;
    $("#finalBody").innerHTML =
      '<p class="mono stamp-line">CASE CLOSED</p><h2>' + esc(P.name) + "</h2><p class='mono'>" + esc(P.role) + "</p><p>" + esc(P.line) + "</p>" +
      "<h4>Боловсрол</h4><p>СЭЗИС, Мэдээллийн системийн менежмент (2024-2028). «Цэгцбилиг», Дундговь (2012-2024).</p>" +
      "<h4>Техникийн чадвар</h4><p>" + C.skills.map(function (s) { return esc(s.label); }).join(", ") + "</p>" +
      "<h4>Төслүүд</h4>" + C.projects.map(function (p) { return '<p><b>' + esc(p.title) + "</b>, " + esc(p.type) + (p.link ? ', <a href="' + esc(p.link) + '" target="_blank" rel="noopener">' + esc(p.linkLabel || "сайт") + '</a>' : "") + (p.repo ? ', <a href="' + esc(p.repo) + '" target="_blank" rel="noopener">GitHub</a>' : "") + "</p>"; }).join("") +
      "<h4>Хобби</h4><p>Волейбол, 9-р ангиасаа хойш (спортын 1-р зэрэг). СЭЗИС-ийн аварга 2024-25, 2025-26.</p>" +
      "<h4>Мэргэжлийн зорилго</h4><p>Мэдээллийн системийн төслийн менежер болох. Төгсөөд Монголдоо 5 жил ажиллаж туршлага хуримтлуулаад, гадаадад магистраар суралцах төлөвлөгөөтэй.</p>" +
      "<h4>Холбоо барих</h4>" + contactHTML() + '<p class="quote">Every clue tells a story. This was mine.</p>';
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
    if (!confirm("Мөрдөн байцаалтыг шинээр эхлүүлэх үү? Одоогийн ахиц арилна.")) return;
    try { sessionStorage.removeItem(KEY); } catch (e) { /* ignore */ }
    location.reload();
  });
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    if (LC.scene && LC.scene.inspecting && LC.scene.inspecting() && $("#reader").hidden) { if (in3d) closeFolder(); else LC.scene.endInspect(); return; }
    if (!$("#final").hidden) $("#final").hidden = true;
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
    return '<div class="lst"><h4>Хэргийн хавтаснууд</h4>' + D.CASES.map(function (c) {
      return '<button type="button" data-case="' + c.id + '"><b>CASE ' + c.no + "</b> " + esc(c.title) + "<small>" + (state.unlocked[c.id] ? "НЭЭГДСЭН" : "НУУЦ") + "</small></button>";
    }).join("") + "<h4>Нотлох баримт</h4>" + ev.map(function (id) {
      var e = D.EVIDENCE[id];
      return '<button type="button" data-ev="' + id + '"><b>' + esc(e.file) + "</b> " + esc(e.title) + (state.found[id] ? "<small>ҮЗСЭН</small>" : "") + "</button>";
    }).join("") + '<button type="button" data-map="1"><b>ГАЗАР ЗҮЙ</b> Монгол улсын газрын зураг</button></div>';
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
  });

  /* ============================== hooks for the 3D scene ============================== */
  LC.ui = {
    state: state, save: save, toast: toast, hud: hud, reduceMotion: reduceMotion,
    openEvidence: openEvidence, openFolder: openFolder, openMapBig: openMapBig, openPlace: openPlace, openList: openList,
    markFound: markFound, mapXY: mapXY, openVideo: openVideo, closeCase: function () { closeFolder(); },
    isOpen: function () { return !$("#reader").hidden || !$("#folder").hidden || !$("#final").hidden || !$("#list").hidden || !$("#closed").hidden; }
  };

  /* ============================== start ============================== */
  document.title = "THE LAST CASE, " + C.person.name;
  hud(); syncSound(); checkAllRead();
  $("#btnCredits").addEventListener("click", function () { openList(); setTimeout(function () { var c = document.querySelector("#list .credits"); if (c) c.scrollIntoView({ block: "center" }); }, 60); });
  // hook for tests
  LC.debug = { state: state, openFolder: openFolder, unlock: function (id) { openFolder(id); unlock(D.CASES.filter(function (c) { return c.id === id; })[0], true); } };
})();

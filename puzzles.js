/*
 * puzzles.js, the six folder puzzles + the seeded random generator.
 *
 * Every puzzle is generated from (session seed + folder id), so:
 *   - reopening the folder in the same session gives the SAME puzzle,
 *   - a new session (or "restart") gives a DIFFERENT but always solvable one,
 *   - the answer is built together with the puzzle, so it can never be unsolvable.
 * Each puzzle: { title, intro, hints[], render(el, api) }.  api = { solve(), wrong(), say(text) }
 */
(function () {
  "use strict";
  var D = window.LC.data, esc = D.esc;

  /* ---------- seeded random numbers (cyrb128 hash -> mulberry32) ---------- */
  function makeRng(str) {
    var h1 = 1779033703, h2 = 3144134277, h3 = 1013904242, h4 = 2773480762, k;
    for (var i = 0; i < str.length; i++) {
      k = str.charCodeAt(i);
      h1 = h2 ^ Math.imul(h1 ^ k, 597399067); h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
      h3 = h4 ^ Math.imul(h3 ^ k, 951274213); h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
    }
    var a = (h1 ^ h2 ^ h3 ^ h4) >>> 0;
    return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  }
  function int(rng, n) { return Math.floor(rng() * n); }
  function shuffle(rng, arr) { var a = arr.slice(); for (var i = a.length - 1; i > 0; i--) { var j = int(rng, i + 1), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function evTitle(id) { return "«" + D.EVIDENCE[id].file + ", " + D.EVIDENCE[id].title + "»"; }
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html !== undefined) e.innerHTML = html; return e; }

  var P = {};

  /* ---------- A. CODE: a 4-digit code built from two numbers found in desk documents ---------- */
  P.code = function (rng) {
    var N = D.FACTS.numbers, i = int(rng, N.length), j;
    do { j = int(rng, N.length); } while (j === i);
    var a = N[i], b = N[j], code = String(a.n) + String(b.n);
    return {
      answer: code,
      title: "Нууц код",
      intro: "Хавтас 4 оронтой кодоор түгжигдсэн. <b>Эхний 2 орон</b>, " + esc(a.label) + ". <b>Сүүлийн 2 орон</b>, " + esc(b.label) + ".",
      hints: ["Тоонууд ширэн дээрх баримтуудад бичигдсэн байгаа.", "Хараарай: " + evTitle(a.doc) + (a.doc !== b.doc ? " ба " + evTitle(b.doc) : "") + "."],
      render: function (box, api) {
        var row = el("div", "code-row"), ins = [];
        for (var k = 0; k < 4; k++) {
          var inp = el("input"); inp.type = "text"; inp.inputMode = "numeric"; inp.maxLength = 1; inp.setAttribute("aria-label", (k + 1) + "-р орон"); inp.autocomplete = "off";
          (function (idx, input) {
            input.addEventListener("input", function () { input.value = input.value.replace(/\D/g, ""); if (input.value && ins[idx + 1]) ins[idx + 1].focus(); });
            input.addEventListener("keydown", function (e) { if (e.key === "Backspace" && !input.value && ins[idx - 1]) ins[idx - 1].focus(); if (e.key === "Enter") check(); });
          })(k, inp);
          ins.push(inp); row.appendChild(inp);
        }
        var btn = el("button", "pz-btn", "Нээх"); btn.type = "button"; btn.addEventListener("click", check);
        function check() {
          var v = ins.map(function (x) { return x.value; }).join("");
          if (v === code) api.solve(); else { api.wrong(); row.classList.remove("shake"); void row.offsetWidth; row.classList.add("shake"); }
        }
        box.appendChild(row); box.appendChild(btn);
        setTimeout(function () { ins[0].focus(); }, 50);
      }
    };
  };

  /* ---------- F. TIMELINE: put 4 events in order ---------- */
  P.timeline = function (rng) {
    var evs = D.FACTS.events.map(function (g) { return g[int(rng, g.length)]; });   // one event per distinct year
    var sorted = evs.slice().sort(function (x, y) { return parseInt(x.when, 10) - parseInt(y.when, 10); });
    var order;
    do { order = shuffle(rng, evs); } while (order.every(function (e, i) { return e === sorted[i]; }));
    return {
      answer: sorted.map(function (e) { return e.title; }),
      title: "Хугацааны дараалал",
      intro: "Үйл явдлуудыг <b>хамгийн эрт</b> нь дээр, <b>хамгийн сүүлд</b> нь доор байхаар ↑ ↓ товчоор эрэмбэл.",
      hints: ["Карт бүр дээр он бичигдсэн байгаа. Жижиг оноос том он руу.", "Эхнийх нь: «" + sorted[0].title + "»."],
      render: function (box, api) {
        var list = el("ol", "tl-list"); box.appendChild(list);
        function draw() {
          list.innerHTML = "";
          order.forEach(function (e, i) {
            var li = el("li", "tl-item");
            li.innerHTML = '<span class="tl-when">' + esc(e.when) + '</span><span class="tl-t">' + esc(e.title) + "</span>";
            var up = el("button", "tl-mv", "↑"), dn = el("button", "tl-mv", "↓");
            up.type = dn.type = "button"; up.setAttribute("aria-label", "Дээш"); dn.setAttribute("aria-label", "Доош");
            up.disabled = i === 0; dn.disabled = i === order.length - 1;
            up.addEventListener("click", function () { move(i, -1); }); dn.addEventListener("click", function () { move(i, 1); });
            li.appendChild(up); li.appendChild(dn); list.appendChild(li);
          });
        }
        function move(i, d) { var t = order[i]; order[i] = order[i + d]; order[i + d] = t; draw(); window.LC.audio.sfx("click"); }
        var btn = el("button", "pz-btn", "Шалгах"); btn.type = "button";
        btn.addEventListener("click", function () {
          if (order.every(function (e, i) { return e === sorted[i]; })) api.solve(); else { api.wrong(); list.classList.remove("shake"); void list.offsetWidth; list.classList.add("shake"); }
        });
        box.appendChild(btn); draw();
      }
    };
  };

  /* ---------- E. CIPHER: Caesar shift, with the key shown ---------- */
  P.cipher = function (rng) {
    var word = D.FACTS.words[int(rng, D.FACTS.words.length)], shift = 1 + int(rng, 5);
    var A = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    var enc = word.split("").map(function (c) { return A[(A.indexOf(c) + shift) % 26]; }).join("");
    return {
      answer: word,
      title: "Шифрлэсэн мессеж",
      intro: "Нэг хэрэгслийн нэрийг шифрлэсэн. Үсэг бүрийг цагийн зүүний дагуу <b>" + shift + "</b> байраар шилжүүлсэн (жишээ: A, " + A[shift] + "). Доорх хүснэгтээр буцаан тайл.",
      hints: ["Дээд мөрөөс шифрлэсэн үсгээ ол, яг доорх үсэг нь жинхэнэ үсэг.", "Эхний үсэг нь «" + word[0] + "». Энэ бол техникийн хэрэгслийн нэр."],
      render: function (box, api) {
        box.appendChild(el("div", "cipher-text", esc(enc)));
        var t = el("div", "cipher-map");
        var top = "", bot = "";
        for (var i = 0; i < 26; i++) { top += "<span>" + A[i] + "</span>"; bot += "<span>" + A[(i - shift + 26) % 26] + "</span>"; }
        t.innerHTML = '<div class="row"><small>шифр</small>' + top + '</div><div class="row"><small>жинхэнэ</small>' + bot + "</div>";
        box.appendChild(t);
        var inp = el("input", "word-in"); inp.type = "text"; inp.autocomplete = "off"; inp.setAttribute("aria-label", "Тайлсан үг"); inp.maxLength = 12;
        var btn = el("button", "pz-btn", "Шалгах"); btn.type = "button";
        function check() { if (inp.value.trim().toUpperCase() === word) api.solve(); else { api.wrong(); inp.classList.remove("shake"); void inp.offsetWidth; inp.classList.add("shake"); } }
        btn.addEventListener("click", check); inp.addEventListener("keydown", function (e) { if (e.key === "Enter") check(); });
        box.appendChild(inp); box.appendChild(btn);
      }
    };
  };

  /* ---------- C. CONNECT: tap the dots in the order written in a desk document ---------- */
  P.connect = function (rng) {
    var f = D.FACTS.techChains[int(rng, D.FACTS.techChains.length)], chain = f.chain;
    var slots = shuffle(rng, [[60, 50], [250, 40], [70, 170], [260, 160], [160, 105]]).slice(0, chain.length);
    return {
      answer: chain,
      title: "Холболтыг зур",
      intro: "«" + esc(f.project) + "» төслийн технологийг баримтад бичигдсэн <b>дарааллаар нь</b> дарж, цэгүүдийг холбо.",
      hints: ["Дарааллыг ширэн дээрх " + evTitle(f.doc) + " баримтаас ол.", "Эхний цэг нь «" + chain[0] + "»."],
      render: function (box, api) {
        var wrap = el("div", "conn"); wrap.style.width = "320px"; wrap.style.height = "210px";
        var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg"); svg.setAttribute("viewBox", "0 0 320 210"); wrap.appendChild(svg);
        var next = 0, dots = [];
        chain.forEach(function (name, idx) {
          var b = el("button", "dot", "<i></i><span>" + esc(name) + "</span>"); b.type = "button";
          b.style.left = slots[idx][0] + "px"; b.style.top = slots[idx][1] + "px";
          b.addEventListener("click", function () {
            if (idx === next) {
              b.classList.add("on");
              if (next > 0) { var p = slots[next - 1], l = document.createElementNS("http://www.w3.org/2000/svg", "line"); l.setAttribute("x1", p[0]); l.setAttribute("y1", p[1]); l.setAttribute("x2", slots[idx][0]); l.setAttribute("y2", slots[idx][1]); svg.appendChild(l); }
              next++; window.LC.audio.sfx("click");
              if (next === chain.length) api.solve();
            } else if (!b.classList.contains("on")) {
              api.wrong(); next = 0; dots.forEach(function (d) { d.classList.remove("on"); }); svg.innerHTML = "";
              wrap.classList.remove("shake"); void wrap.offsetWidth; wrap.classList.add("shake");
            }
          });
          dots.push(b); wrap.appendChild(b);
        });
        box.appendChild(wrap);
      }
    };
  };

  /* ---------- B. PATTERN: which shape comes next ---------- */
  var SHAPES = {
    circle: '<circle cx="20" cy="20" r="13" />',
    diamond: '<path d="M20 5 35 20 20 35 5 20Z" />',
    triangle: '<path d="M20 6 35 33H5Z" />',
    square: '<rect x="8" y="8" width="24" height="24" />',
    plus: '<path d="M16 6h8v10h10v8H24v10h-8V24H6v-8h10Z" />'
  };
  function shape(name, cls) { return '<svg class="' + (cls || "shp") + '" viewBox="0 0 40 40" aria-label="' + name + '">' + SHAPES[name] + "</svg>"; }
  P.pattern = function (rng) {
    var names = shuffle(rng, Object.keys(SHAPES));
    var units = ["AB", "ABC", "AAB", "ABB"], unit = units[int(rng, units.length)], u = unit.length;
    var map = { A: names[0], B: names[1], C: names[2] };
    var seq = [], total = 2 * u + 1;
    for (var i = 0; i < total; i++) seq.push(map[unit[i % u]]);
    var answer = map[unit[total % u]];
    var opts = shuffle(rng, names.slice(0, 4).concat([]));
    if (opts.indexOf(answer) < 0) opts[0] = answer;
    opts = shuffle(rng, opts);
    return {
      answer: answer,
      title: "Дараалал",
      intro: "Дараалал давтагдаж байна. <b>Дараагийн дүрс</b> аль нь вэ?",
      hints: ["Нэг давтагдаж буй багц хэдэн дүрстэйг ол.", "Давтагдах багц: " + unit.split("").map(function (c) { return map[c]; }).join(", ") + " (" + u + " дүрс)."],
      render: function (box, api) {
        var row = el("div", "shape-row", seq.map(function (s) { return shape(s); }).join("") + '<span class="q">?</span>');
        var o = el("div", "shape-opts");
        opts.forEach(function (n) {
          var b = el("button", "shape-opt", shape(n, "shp lg")); b.type = "button"; b.setAttribute("aria-label", n);
          b.addEventListener("click", function () { if (n === answer) api.solve(); else { api.wrong(); b.classList.add("bad"); setTimeout(function () { b.classList.remove("bad"); }, 500); } });
          o.appendChild(b);
        });
        box.appendChild(row); box.appendChild(o);
      }
    };
  };

  /* ---------- D. MATCH: pair each topic with its evidence ---------- */
  P.match = function (rng) {
    var pairs = shuffle(rng, D.FACTS.pairs).slice(0, 3);
    var right = shuffle(rng, pairs.map(function (p) { return p[1]; }));
    return {
      answer: pairs,
      title: "Баримт тааруулах",
      intro: "Зүүн талын сэдэв бүрийг тохирох баримттай нь холбо. Эхлээд зүүн талаас, дараа нь баруун талаас дар.",
      hints: ["Хариултууд ширэн дээрх баримтуудад бичигдсэн.", "Хараарай: " + pairs.map(function (p) { return evTitle(p[2]); }).join(", ") + "."],
      render: function (box, api) {
        var wrap = el("div", "match"), L = el("div", "mcol"), R = el("div", "mcol"), sel = null, done = 0;
        pairs.forEach(function (p) {
          var b = el("button", "mbtn", esc(p[0])); b.type = "button"; b.dataset.k = p[1];
          b.addEventListener("click", function () { if (b.classList.contains("ok")) return; L.querySelectorAll(".sel").forEach(function (x) { x.classList.remove("sel"); }); b.classList.add("sel"); sel = b; });
          L.appendChild(b);
        });
        right.forEach(function (t) {
          var b = el("button", "mbtn", esc(t)); b.type = "button";
          b.addEventListener("click", function () {
            if (!sel || b.classList.contains("ok")) { return; }
            if (sel.dataset.k === t) { sel.classList.remove("sel"); sel.classList.add("ok"); b.classList.add("ok"); sel = null; window.LC.audio.sfx("found"); if (++done === pairs.length) api.solve(); }
            else { api.wrong(); b.classList.add("bad"); setTimeout(function () { b.classList.remove("bad"); }, 500); }
          });
          R.appendChild(b);
        });
        wrap.appendChild(L); wrap.appendChild(R); box.appendChild(wrap);
      }
    };
  };

  window.LC.makeRng = makeRng; window.LC.int = int; window.LC.shuffle = shuffle;
  window.LC.puzzles = P;
})();

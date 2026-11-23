/*
 * i18n.js, Mongolian / English switch.
 * - window.LANG is "mn" (default) or "en", remembered in localStorage.
 * - L(mn, en) picks the right string inside the code.
 * - translateDOM() swaps the fixed texts written in index.html (exact match from DICT below).
 * - setLang() saves the choice and reloads, so every canvas, folder and document is drawn again in that language.
 */
(function () {
  "use strict";
  var KEY = "lastcase-lang", lang = "mn";
  try { lang = localStorage.getItem(KEY) || "mn"; } catch (e) { /* storage blocked */ }
  if (lang !== "en") lang = "mn";
  window.LANG = lang;
  document.documentElement.lang = lang;
  window.L = function (mn, en) { return lang === "en" && en !== undefined ? en : mn; };
  window.setLang = function (l) { try { localStorage.setItem(KEY, l); } catch (e) { /* ignore */ } location.reload(); };

  // fixed texts of index.html: Mongolian -> English
  var DICT = {
    "Хэрэг № 2026-334": "Case No. 2026-334",
    "THE LAST CASE, хэрэг № 2026-334": "THE LAST CASE, case no. 2026-334",
    "Хэргийн хавтаснууд": "Case folders",
    "Холбоо барих": "Contact",
    "Холбоо": "Contact",
    "Бүх баримтын жагсаалт (L)": "List of all documents (L)",
    "Жагсаалт": "List",
    "Томруулдаг шил (M)": "Magnifying glass (M)",
    "Луп": "Lens",
    "Дуу асаах/унтраах": "Sound on/off",
    "Дуу": "Sound",
    "Дууны хүч": "Volume",
    "Танилцуулгыг дахин үзэх": "Replay the intro",
    "Интро": "Intro",
    "Мөрдөн байцаалтыг дахин эхлэх": "Start the investigation again",
    "Шинэ": "Reset",
    "Тэмдэглэл:": "Note:",
    "Хэргийг хаах": "Close the case",
    "Эх сурвалж": "Credits",
    "Текстээр унших": "Read as text",
    "Буцааж тавих": "Put it back",
    "Зүүн тал": "Left side",
    "Баруун тал": "Right side",
    "Хавтсыг хаах": "Close the folder",
    "Өрөөг бэлдэж байна…": "Preparing the room…",
    "Алгасах": "Skip",
    "Хэргийн хавтас № 2026-334": "Case file No. 2026-334",
    "Хэргийн хүн: Ганбатын Энхбаясгалан": "Person of interest: Enkhbaysgalan Ganbat",
    "Нээгдсэн хавтас: 4 / 4": "Folders opened: 4 / 4",
    "CV татах": "Download CV",
    "ХЭРЭГ ХААГДСАН": "CASE CLOSED",
    "Тайлан ба холбоо барих": "Report and contact",
    "Өрөө рүү буцах": "Back to the room",
    "Хаах": "Close",
    "Хэргийн хавтас": "Case folder",
    "Эцсийн тайлан": "Final report",
    "ХЭРГИЙН БҮРТГЭЛ": "CASE REGISTER",
    "Бүх баримт": "All documents",
    "3D өрөөг ачаалж чадсангүй": "The 3D room could not load",
    "Хөтөч WebGL дэмжихгүй, эсвэл файлыг шууд (file://) нээсэн байна. VS Code-ийн Live Server эсвэл Netlify/Vercel-ээр нээнэ үү.": "The browser does not support WebGL, or the file was opened directly (file://). Open it with VS Code Live Server or from Netlify/Vercel.",
    "Доорх жагсаалтаар бүх баримт, хавтсыг үзэж болно.": "You can still see every document and folder in the list below.",
    "Жагсаалт нээх": "Open the list",
    "Энэ портфолио JavaScript шаардлагатай.": "This portfolio needs JavaScript.",
    "Бүтээлүүд": "Works",
    "Бүтээл": "Works",
    "Бүтээлүүдийг үзэх": "Browse the works",
    "Заавар": "Guide",
    "Хэрхэн үзэх вэ?": "How to explore",
    "Хэл солих": "Switch language",
    "Өмнөх": "Previous",
    "Дараах": "Next",
    "Зураг, 3D: Poly Haven (CC0), CRT зурагт, кассет тоглуулагч, ширээний чийдэн, томруулдаг шил, нүдний шил, халаасны цаг, мод ба шавардлагын бүтэц. Wikimedia Commons, Монголын рельеф газрын зураг (CC BY-SA 3.0), Сүхбаатарын талбай (CC0), волейбол (нийтийн өмч), корк самбар (CC BY-SA 4.0), хуучин цаас ба крафт цаас (нийтийн өмч). Сүүдрийн хүний силуэт, mug shot, хурууны хээний карт: өөрийн зураг.":
      "Images, 3D: Poly Haven (CC0): CRT television, cassette player, desk lamp, magnifying glass, spectacles, pocket watch, wood and plaster textures. Wikimedia Commons: relief map of Mongolia (CC BY-SA 3.0), Sükhbaatar Square (CC0), volleyball (public domain), cork board (CC BY-SA 4.0), old paper and kraft paper (public domain). Shadow silhouette, mug shot, fingerprint card: my own images.",
    "Дуу: Wikimedia Commons. Хаалга шажигнах, хаалга хаах, хуудас эргүүлэх, толь бичиг, кассет тоглуулагч, унтраалга, бөмбөр цохих чимээ, бороо цонхонд, ханын цаг (нийтийн өмч). Бичгийн машины хонх (CC0, _stubb). Бичгийн машин (CC BY 4.0, Work With Sounds / Konrad Gutkowski). Тамга дарах (CC BY 3.0, Subhashish Panigrahi). Алхаа (CC BY-SA 4.0, MaksimPinigin).":
      "Sound: Wikimedia Commons. Squeaky door, closing door, page turn, dictionary, tape deck, switch, thud, rain on the window, clock (public domain). Typewriter bell (CC0, _stubb). Typewriter (CC BY 4.0, Work With Sounds / Konrad Gutkowski). Rubber stamp (CC BY 3.0, Subhashish Panigrahi). Footsteps (CC BY-SA 4.0, MaksimPinigin).",
    "Коридор: Poly Haven (CC0) их цаг, толь, зургийн жааз, сандал, ширээ, модон хавтан, шал. Ханын цаас: Damask pattern grey wallpaper (Wikimedia Commons, CC BY-SA 4.0), Alfred Peats Prize Wallpaper, ca. 1910 (Cooper Hewitt, нийтийн өмч). Кассетийн хөгжим: Erik Satie, Gymnopédie No. 1, Robin Alciatore (Musopen, нийтийн өмч). 2 дахь кассет: J. S. Bach, Toccata and Fugue in D minor, BWV 565-ын эхлэл (нийтийн өмч), органы дууг кодоор нийлэгжүүлсэн.":
      "Corridor: Poly Haven (CC0) grandfather clock, mirror, picture frames, armchair, nightstand, wood panels, floor. Wallpaper: Damask pattern grey wallpaper (Wikimedia Commons, CC BY-SA 4.0), Alfred Peats Prize Wallpaper, ca. 1910 (Cooper Hewitt, public domain). Tape music: Erik Satie, Gymnopédie No. 1, Robin Alciatore (Musopen, public domain). Second tape: J. S. Bach, opening of the Toccata and Fugue in D minor, BWV 565 (public domain), organ sound synthesized in code.",
    "Хэргийн гэрэл зургууд (СЭЗИС, волейболын баг, Deep Learning UB, KadrLink, Networking, Password Day): өөрийн архиваас. Эконометрик судалгааны слайд: «Статистик-2026» ЭШБХ-ын илтгэл (4 хүний баг).":
      "Case photos (UFE, volleyball team, Deep Learning UB, KadrLink, Networking, Password Day): my own archive. Econometrics slide: from our 4-person talk at the “Statistics-2026” student research conference."
  };
  window.translateDOM = function (root) {
    if (lang !== "en") return;
    var w = document.createTreeWalker(root || document.body, NodeFilter.SHOW_TEXT), n, list = [];
    while ((n = w.nextNode())) list.push(n);
    list.forEach(function (t) { var k = t.nodeValue.trim(); if (k && DICT[k] !== undefined) t.nodeValue = t.nodeValue.replace(k, DICT[k]); });
    (root || document).querySelectorAll("[aria-label],[title]").forEach(function (e) {
      ["aria-label", "title"].forEach(function (a) { var v = e.getAttribute(a); if (v && DICT[v] !== undefined) e.setAttribute(a, DICT[v]); });
    });
  };
})();

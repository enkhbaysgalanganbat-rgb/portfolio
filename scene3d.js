/*
 * scene3d.js, the investigation room in real 3D (three.js r170, ES module).
 *
 *  wall (plaster) ─ main cork board: case photos, papers, sticky notes, the relief map of Mongolia, red yarn
 *                 └ second cork board: fingerprint card, Student Led paper, a note
 *  desk (worn wood) ─ papers, newspaper, envelope, photos, USB, six manila case folders
 *                   └ real 3D props (Poly Haven, CC0): arm desk lamp, magnifying glass, spectacles, pocket watch
 *
 *  Interaction: hover = the object lifts toward you; click = open; drag = move papers on the desk;
 *  magnifier (M) = a real loupe that follows the mouse and shows the room 2.6x bigger;
 *  drag empty space = look around, wheel / pinch = zoom.
 *  Intro: dark room, the door opens behind you, its light falls on the wall and the shadow of a man in a hat
 *  stands over the board. Then the desk lamp clicks on.
 *
 *  Every document texture is drawn at run time on a <canvas> from the real data in content.js/data.js,
 *  on top of real paper/kraft photos. Nothing here invents facts.
 */
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const LC = window.LC, D = LC.data, UI = LC.ui, C = window.CONTENT, G = window.MN_GEO;
const reduceMotion = UI.reduceMotion;
const $ = (s) => document.querySelector(s);
const touchFirst = window.matchMedia("(hover: none)").matches;

/* ============================== renderer, scene, camera ============================== */
const stage = $("#stage");
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, touchFirst ? 1.5 : 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.domElement.setAttribute("aria-label", "Мөрдөн байцаалтын өрөө: ширээ, самбар, баримтууд. Гараар ажиллах бол «Жагсаалт» товчийг ашиглана уу.");
renderer.domElement.setAttribute("role", "img");
stage.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x050302);
scene.fog = new THREE.Fog(0x050302, 6, 12);
const camera = new THREE.PerspectiveCamera(44, 1, 0.03, 30);

const DESK_Y = 0.762;                       // desk top height (m)
const ANISO = renderer.capabilities.getMaxAnisotropy();

/* ============================== loading ============================== */
const manager = new THREE.LoadingManager();
const bar = $("#loadBar"), loadText = $("#loadText");
manager.onProgress = (url, done, total) => { bar.style.width = Math.round(done / total * 100) + "%"; loadText.textContent = "Нотлох баримт цуглуулж байна… " + done + "/" + total; };
const texLoader = new THREE.TextureLoader(manager);
const imgLoader = new THREE.ImageLoader(manager);
const gltfLoader = new GLTFLoader(manager);

function tex(url, { repeat = [1, 1], srgb = true } = {}) {
  const t = texLoader.load(url);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]);
  t.anisotropy = ANISO; if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
const IMG = {};
function img(key, url) { return new Promise((res) => imgLoader.load(url, (i) => { IMG[key] = i; res(i); }, undefined, () => res(null))); }
const MODELS = {};
function glb(key, url) { return new Promise((res) => gltfLoader.load(url, (g) => { MODELS[key] = g; res(g); }, undefined, () => res(null))); }
function model(key) {
  return new Promise((res) => gltfLoader.load("assets/models/" + key + "/" + key + ".gltf", (g) => { MODELS[key] = g.scene; res(g.scene); }, undefined, () => res(null)));
}

// UVs in metres, so a wallpaper / panel texture keeps its real size on any wall
function uvMetres(g, sx, sy) { const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * sx, uv.getY(i) * sy); uv.needsUpdate = true; return g; }
const WALLPAPER = {
  // a photo of real damask wallpaper (Commons, CC BY-SA 4.0), cut to one exact repeat: 53 cm wide
  room: { url: "assets/tex/wallpaper_damask.jpg", w: 0.53, h: 0.637, color: 0x8a7766 },
  // Alfred Peats prize wallpaper, ca. 1910 (Cooper Hewitt, public domain), one repeat
  hall: { url: "assets/tex/wallpaper_green.jpg", w: 0.53, h: 1.125, color: 0x77735f }
};
const wpMats = {};
function wallpaperMat(kind) {
  if (wpMats[kind]) return wpMats[kind];
  const k = WALLPAPER[kind];
  return (wpMats[kind] = new THREE.MeshStandardMaterial({ map: tex(k.url), color: k.color, roughness: 0.86 }));
}
let panelMats = null;
function panelMat() {   // dark panelled wood (Poly Haven, CC0) for the wainscot below the chair rail
  if (panelMats) return panelMats;
  return (panelMats = new THREE.MeshStandardMaterial({ map: tex("assets/tex/dark_paneled_wood_diff.jpg"), normalMap: tex("assets/tex/dark_paneled_wood_nor.jpg", { srgb: false }), roughnessMap: tex("assets/tex/dark_paneled_wood_rough.jpg", { srgb: false }), color: 0xb09080, roughness: 1 }));
}
const trimWood = () => new THREE.MeshStandardMaterial({ map: tex("assets/tex/frame_diff.jpg", { repeat: [3, 0.2] }), color: 0x4a3022, roughness: 0.5 });
// a papered wall with a panelled dado, a chair rail and a skirting board: wall runs along local +x, faces local +z
function dressedWall(w, h, kind, { dado = 0.95, rail = true } = {}) {
  const g = new THREE.Group(), k = WALLPAPER[kind];
  const paper = new THREE.Mesh(uvMetres(new THREE.PlaneGeometry(w, h - dado), w / k.w, (h - dado) / k.h), wallpaperMat(kind));
  paper.position.set(0, dado + (h - dado) / 2, 0); paper.receiveShadow = true; g.add(paper);
  const pan = new THREE.Mesh(uvMetres(new THREE.PlaneGeometry(w, dado), w / 1.6, dado / 1.6), panelMat());
  pan.position.set(0, dado / 2, 0.012); pan.receiveShadow = true; g.add(pan);
  const tm = trimWood();
  if (rail) { const r = new THREE.Mesh(new THREE.BoxGeometry(w, 0.055, 0.035), tm); r.position.set(0, dado, 0.02); r.castShadow = true; r.receiveShadow = true; g.add(r); }
  const sk = new THREE.Mesh(new THREE.BoxGeometry(w, 0.14, 0.03), tm); sk.position.set(0, 0.07, 0.025); sk.receiveShadow = true; g.add(sk);
  return g;
}

/* ============================== room: wall, floor, desk ============================== */
const doorRig = { hinge: null, open: 0 };
function buildRoom() {
  // the board wall keeps its plain plaster (the boards need a quiet background); the other walls are papered
  const wallMat = new THREE.MeshStandardMaterial({ map: tex("assets/tex/wall_a.jpg", { repeat: [4, 2] }), color: 0x4f5458, roughness: 0.95 });
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(9, 4.2), wallMat);
  wall.position.set(0, 2.1, 0); wall.receiveShadow = true; scene.add(wall);
  const side = dressedWall(4.6, 4.2, "room"); side.position.set(-3.6, 0, 2.3); side.rotation.y = Math.PI / 2; scene.add(side);
  const side2 = dressedWall(4.6, 4.2, "room"); side2.position.set(4.2, 0, 2.3); side2.rotation.y = -Math.PI / 2; scene.add(side2);
  const fMap = tex("assets/tex/wood_floor_worn_diff.jpg", { repeat: [4.5, 3.5] }), fNor = tex("assets/tex/wood_floor_worn_nor.jpg", { repeat: [4.5, 3.5], srgb: false }), fRough = tex("assets/tex/wood_floor_worn_rough.jpg", { repeat: [4.5, 3.5], srgb: false });
  const floorMat = new THREE.MeshStandardMaterial({ map: fMap, normalMap: fNor, roughnessMap: fRough, color: 0x6b4c3a, roughness: 1 });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(9, 9), floorMat);
  floor.rotation.x = -Math.PI / 2; floor.position.set(0, 0, 4); floor.receiveShadow = true; scene.add(floor);
  // skirting board
  const skirt = new THREE.Mesh(new THREE.BoxGeometry(9, 0.12, 0.02), new THREE.MeshStandardMaterial({ color: 0x1c130e, roughness: 0.6 }));
  skirt.position.set(0, 0.06, 0.01); scene.add(skirt);

  // back wall with a real doorway, a panelled wooden door and a corridor behind it
  const T = 0.12, DZ = 4.6, X0 = -2.85, X1 = -1.95, DH = 2.05;
  const inner = new THREE.MeshStandardMaterial({ color: 0x2a221c, roughness: 0.9 });    // the wall's core, only seen in the door reveal
  const wbox = (x0, x1, y0, y1) => { const m = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, y1 - y0, T), inner); m.position.set((x0 + x1) / 2, (y0 + y1) / 2, DZ + T / 2); m.castShadow = true; m.receiveShadow = true; scene.add(m); };
  wbox(-3.6, X0, 0, 4.2); wbox(X1, 4.2, 0, 4.2); wbox(X0, X1, DH, 4.2);
  // papered faces: room side (damask) and corridor side (green)
  const face = (kind, x0, x1, z, ry, h = 4.2) => { const f = dressedWall(x1 - x0, h, kind); f.position.set((x0 + x1) / 2, 0, z); f.rotation.y = ry; scene.add(f); return f; };
  face("room", -3.6, X0, DZ - 0.001, Math.PI); face("room", X1, 4.2, DZ - 0.001, Math.PI);
  face("hall", -3.6, X0, DZ + T + 0.001, 0, 2.7); face("hall", X1, -1.2, DZ + T + 0.001, 0, 2.7);
  const over = (kind, z, ry) => { const k = WALLPAPER[kind], w = X1 - X0, h = (kind === "hall" ? 2.7 : 4.2) - DH; const m = new THREE.Mesh(uvMetres(new THREE.PlaneGeometry(w, h), w / k.w, h / k.h), wallpaperMat(kind)); m.position.set((X0 + X1) / 2, DH + h / 2, z); m.rotation.y = ry; m.receiveShadow = true; scene.add(m); };
  over("room", DZ - 0.001, Math.PI); over("hall", DZ + T + 0.001, 0);
  const trimMat = new THREE.MeshStandardMaterial({ map: tex("assets/tex/frame_diff.jpg", { repeat: [0.3, 2] }), color: 0x5a3c2a, roughness: 0.55 });
  [[X0 - 0.04, DH / 2 + 0.02, 0.08, DH + 0.04], [X1 + 0.04, DH / 2 + 0.02, 0.08, DH + 0.04], [(X0 + X1) / 2, DH + 0.04, X1 - X0 + 0.16, 0.08]].forEach(([x, y, w, h]) => {
    const t = new THREE.Mesh(new THREE.BoxGeometry(w, h, T + 0.06), trimMat); t.position.set(x, y, DZ + T / 2); t.castShadow = true; scene.add(t);
  });
  const doorMat = new THREE.MeshStandardMaterial({ map: tex("assets/tex/frame_diff.jpg", { repeat: [0.6, 1.6] }), color: 0x6b4a36, roughness: 0.5 });
  const hinge = new THREE.Group(); hinge.position.set(X0, 0, DZ + 0.02); scene.add(hinge);
  const panel = new THREE.Mesh(new THREE.BoxGeometry(X1 - X0 - 0.01, DH - 0.01, 0.045), doorMat);
  panel.position.set((X1 - X0) / 2, DH / 2, 0); panel.castShadow = true; panel.receiveShadow = true; hinge.add(panel);
  [[0.5, 1.45], [0.5, 0.55]].forEach(([u, v]) => {            // raised panels on both faces
    [-1, 1].forEach((side) => { const r = new THREE.Mesh(new THREE.BoxGeometry(0.62, v > 1 ? 0.8 : 0.72, 0.012), doorMat); r.position.set((X1 - X0) * u, v, side * 0.027); r.castShadow = true; hinge.add(r); });
  });
  const brass = new THREE.MeshStandardMaterial({ color: 0xb8893e, metalness: 1, roughness: 0.3 });
  [-1, 1].forEach((side) => { const k = new THREE.Mesh(new THREE.SphereGeometry(0.03, 20, 14), brass); k.position.set(X1 - X0 - 0.1, 1.0, side * 0.06); hinge.add(k); });
  doorRig.hinge = hinge;
  // light leaking under the closed door (seen when you turn round to leave)
  const leak = new THREE.Mesh(new THREE.PlaneGeometry(X1 - X0 - 0.04, 0.35), new THREE.MeshBasicMaterial({ color: 0xffc88a, transparent: true, opacity: 0, depthWrite: false, toneMapped: false }));
  leak.rotation.x = -Math.PI / 2; leak.position.set((X0 + X1) / 2, 0.004, DZ - 0.17); scene.add(leak); doorRig.leak = leak;
  // corridor: papered walls with a panelled dado, a plaster ceiling with a cornice
  const hw = (w, x, z, ry) => { const f = dressedWall(w, 2.7, "hall"); f.position.set(x, 0, z); f.rotation.y = ry; scene.add(f); };
  hw(7.6 - DZ - T, -1.2, (DZ + T + 7.6) / 2, -Math.PI / 2);      // right
  hw(7.6 - DZ - T, -3.6, (DZ + T + 7.6) / 2, Math.PI / 2);       // left
  hw(2.4, -2.4, 7.6, Math.PI);                                   // end
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 7.6 - DZ), new THREE.MeshStandardMaterial({ map: tex("assets/tex/wall_a.jpg", { repeat: [1, 1.2] }), color: 0xc9bfae, roughness: 0.95 }));
  ceil.rotation.x = Math.PI / 2; ceil.position.set(-2.4, 2.7, (DZ + 7.6) / 2); ceil.receiveShadow = true; scene.add(ceil);
  const cm = trimWood();
  [[2.4, -2.4, 7.58, 0], [2.4, -2.4, DZ + T + 0.02, 0], [7.6 - DZ, -1.22, (DZ + 7.6) / 2, Math.PI / 2], [7.6 - DZ, -3.58, (DZ + 7.6) / 2, Math.PI / 2]].forEach(([w, x, z, ry]) => {
    const c = new THREE.Mesh(new THREE.BoxGeometry(w, 0.09, 0.06), cm); c.position.set(x, 2.655, z); c.rotation.y = ry; scene.add(c);
  });

  // desk: worn wood top + front apron + legs
  const dMap = tex("assets/tex/desk_diff.jpg", { repeat: [2.2, 1] }), dNor = tex("assets/tex/desk_nor.jpg", { repeat: [2.2, 1], srgb: false }), dRough = tex("assets/tex/desk_rough.jpg", { repeat: [2.2, 1], srgb: false });
  const deskMat = new THREE.MeshStandardMaterial({ map: dMap, normalMap: dNor, roughnessMap: dRough, roughness: 1, color: 0xb59a86 });
  const top = new THREE.Mesh(new THREE.BoxGeometry(3.3, 0.05, 1.25), deskMat);
  top.position.set(0.1, DESK_Y - 0.025, 0.64); top.receiveShadow = true; top.castShadow = true; scene.add(top);
  const apronMat = new THREE.MeshStandardMaterial({ map: tex("assets/tex/frame_diff.jpg", { repeat: [3, 0.3] }), color: 0x6a4a36, roughness: 0.7 });
  const apron = new THREE.Mesh(new THREE.BoxGeometry(3.24, 0.14, 0.03), apronMat);
  apron.position.set(0.1, DESK_Y - 0.12, 1.24); apron.castShadow = true; scene.add(apron);
  [[-1.5, 0.1], [1.7, 0.1], [-1.5, 1.2], [1.7, 1.2]].forEach(([x, z]) => {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.07, DESK_Y - 0.05, 0.07), apronMat);
    leg.position.set(x, (DESK_Y - 0.05) / 2, z); leg.castShadow = true; scene.add(leg);
  });
}

/* ============================== canvas documents (real paper photos + real data) ============================== */
const FONT = { mono: '"Courier New", Courier, monospace', serif: 'Georgia, "Times New Roman", serif', hand: '"Segoe Print", "Bradley Hand", "Comic Sans MS", cursive', sans: 'system-ui, "Segoe UI", Arial, sans-serif' };
const rnd = LC.makeRng("layout3d:" + UI.state.seed);

function canvas(w, h) { const c = document.createElement("canvas"); c.width = w; c.height = h; return c; }
function plainText(html) {
  return String(html || "").replace(/<\/(p|tr|h4|li|div)>/gi, "\n").replace(/<\/t[hd]>/gi, "  ").replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/[ \t]+/g, " ").trim();
}
function wrap(ctx, text, x, y, maxW, lh, maxLines) {
  let lines = 0;
  for (const para of String(text).split("\n")) {
    const words = para.trim().split(/\s+/); let line = "";
    if (!para.trim()) continue;
    for (const w of words) {
      const t = line ? line + " " + w : w;
      if (ctx.measureText(t).width > maxW && line) { ctx.fillText(line, x, y); y += lh; line = w; if (++lines >= maxLines) return y; }
      else line = t;
    }
    if (line) { ctx.fillText(line, x, y); y += lh; if (++lines >= maxLines) return y; }
  }
  return y;
}
// a random piece of a real photo (paper / kraft) as the background
function photoBg(ctx, image, w, h, tint, op = "multiply") {
  if (image) {
    const s = Math.max(w / image.width, h / image.height) * (1.1 + rnd() * 0.4);
    const sw = w / s, sh = h / s, sx = rnd() * (image.width - sw), sy = rnd() * (image.height - sh);
    ctx.drawImage(image, Math.max(0, sx), Math.max(0, sy), sw, sh, 0, 0, w, h);
  } else { ctx.fillStyle = "#e9e0cc"; ctx.fillRect(0, 0, w, h); }
  if (tint) { ctx.globalCompositeOperation = op; ctx.fillStyle = tint; ctx.fillRect(0, 0, w, h); ctx.globalCompositeOperation = "source-over"; }
}
function stamp(ctx, text, x, y, size, color = "rgba(178,34,30,.82)", rot = -0.2) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  ctx.font = "700 " + size + "px " + FONT.mono; const tw = ctx.measureText(text).width;
  ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = Math.max(3, size / 7);
  ctx.strokeRect(-tw / 2 - size * 0.4, -size * 0.85, tw + size * 0.8, size * 1.3);
  ctx.textAlign = "center"; ctx.fillText(text, 0, size * 0.18);
  ctx.restore();
}
function paperTex(ev, label) {
  const W = 600, H = 800, c = canvas(W, H), x = c.getContext("2d");
  photoBg(x, IMG.paper, W, H, "rgba(255,248,232,.55)", "screen");
  x.fillStyle = "#b8251f"; x.font = "700 26px " + FONT.mono; x.fillText(ev.file, 44, 74);
  x.fillStyle = "#1d1714"; x.font = "700 36px " + FONT.mono; let y = wrap(x, label || ev.title, 44, 130, W - 88, 42, 3) + 14;
  x.strokeStyle = "rgba(40,30,25,.5)"; x.lineWidth = 2; x.beginPath(); x.moveTo(44, y - 20); x.lineTo(W - 44, y - 20); x.stroke();
  x.fillStyle = "rgba(30,24,20,.86)"; x.font = "24px " + FONT.mono; wrap(x, plainText(ev.html), 44, y + 16, W - 88, 33, 15);
  if (ev.stamp) stamp(x, ev.stamp, W - 170, H - 110, 34);
  return c;
}
function noteTex(text) {
  const W = 512, H = 512, c = canvas(W, H), x = c.getContext("2d");
  photoBg(x, IMG.paper, W, H, "#f1d64e");
  const g = x.createLinearGradient(0, 0, 0, 60); g.addColorStop(0, "rgba(120,90,0,.18)"); g.addColorStop(1, "rgba(0,0,0,0)"); x.fillStyle = g; x.fillRect(0, 0, W, 60);
  x.fillStyle = "#24201a"; x.font = "34px " + FONT.hand; wrap(x, text, 36, 92, W - 70, 46, 9);
  return c;
}
function coverImage(x, image, dx, dy, dw, dh) {
  if (!image) { x.fillStyle = "#1a1412"; x.fillRect(dx, dy, dw, dh); return; }
  const s = Math.max(dw / image.width, dh / image.height), sw = dw / s, sh = dh / s;
  x.drawImage(image, (image.width - sw) / 2, (image.height - sh) / 2, sw, sh, dx, dy, dw, dh);
}
function photoTex(image, caption, opts = {}) {
  const W = 512, H = 610, c = canvas(W, H), x = c.getContext("2d");
  photoBg(x, IMG.paper, W, H, "rgba(255,255,255,.72)", "screen");
  coverImage(x, image, 34, 34, W - 68, W - 68);
  if (opts.mono) { x.globalCompositeOperation = "saturation"; x.fillStyle = "#000"; x.fillRect(34, 34, W - 68, W - 68); x.globalCompositeOperation = "source-over"; }
  const v = x.createRadialGradient(W / 2, W / 2, W * 0.2, W / 2, W / 2, W * 0.62); v.addColorStop(0, "rgba(0,0,0,0)"); v.addColorStop(1, "rgba(0,0,0,.38)"); x.fillStyle = v; x.fillRect(34, 34, W - 68, W - 68);
  if (opts.mark) { x.fillStyle = "rgba(255,255,255,.9)"; x.font = "700 120px " + FONT.mono; x.textAlign = "center"; x.fillText(opts.mark, W / 2, W / 2 + 40); x.textAlign = "left"; }
  x.fillStyle = "#1f1a16"; x.font = "38px " + FONT.hand; x.textAlign = "center"; x.fillText(caption, W / 2, H - 46); x.textAlign = "left";
  return c;
}
function newsTex(ev) {
  const W = 640, H = 760, c = canvas(W, H), x = c.getContext("2d");
  photoBg(x, IMG.paper, W, H, "#cfcbc0", "color"); x.fillStyle = "rgba(210,205,195,.45)"; x.fillRect(0, 0, W, H);
  x.fillStyle = "#1e1b18"; x.font = "700 44px " + FONT.serif; x.textAlign = "center"; x.fillText("ӨДРИЙН СОНИН", W / 2, 70); x.textAlign = "left";
  x.fillRect(30, 88, W - 60, 4); x.font = "16px " + FONT.mono; x.fillText("СПОРТ, СЭЗИС", 30, 116);
  x.font = "700 40px " + FONT.serif; let y = wrap(x, ev.title, 30, 166, W - 60, 44, 2);
  markerCircle(x, W / 2, 166 + (y - 166) / 2 - 16, W * 0.48, (y - 166) / 2 + 26, INKR, 6);
  if (IMG.volleyball) {
    x.save(); x.filter = "grayscale(1) contrast(1.2)"; coverImage(x, IMG.volleyball, 30, y, W - 60, 250); x.restore();
    x.font = "italic 15px " + FONT.serif; x.fillText("Жишээ зураг", 30, y + 272); y += 300;
  }
  x.font = "17px " + FONT.serif; const t = plainText(ev.html);
  const colW = (W - 80) / 2; wrap(x, t, 30, y, colW, 22, 12); wrap(x, t.slice(Math.floor(t.length / 2)), 50 + colW, y, colW, 22, 12);
  return c;
}
function envTex(ev) {
  const W = 640, H = 420, c = canvas(W, H), x = c.getContext("2d");
  photoBg(x, IMG.kraft, W, H, "rgba(190,150,95,.35)");
  x.strokeStyle = "rgba(70,45,20,.35)"; x.lineWidth = 3; x.beginPath(); x.moveTo(0, 0); x.lineTo(W / 2, H * 0.58); x.lineTo(W, 0); x.stroke();
  const g = x.createRadialGradient(W / 2 - 8, H * 0.56 - 8, 4, W / 2, H * 0.58, 46); g.addColorStop(0, "#c0392b"); g.addColorStop(1, "#5e0f0b");
  x.fillStyle = g; x.beginPath(); x.arc(W / 2, H * 0.58, 44, 0, Math.PI * 2); x.fill();
  x.fillStyle = "rgba(255,220,200,.6)"; x.font = "700 30px " + FONT.serif; x.textAlign = "center"; x.fillText("ГЭ", W / 2, H * 0.58 + 11);
  x.fillStyle = "#3b2a15"; x.font = "700 28px " + FONT.mono; x.fillText(ev.file, W / 2, H - 40); x.textAlign = "left";
  stamp(x, "БИТҮҮМЖИЛСЭН", 150, 90, 24, "rgba(150,30,25,.7)", -0.12);
  return c;
}
function folderTex(cs, open) {
  const W = 700, H = 520, c = canvas(W, H), x = c.getContext("2d");
  photoBg(x, IMG.kraft, W, H, "#e8c98a");
  x.fillStyle = "rgba(0,0,0,.08)"; x.fillRect(0, 0, W, 10);
  // typed label sticker
  x.save(); x.translate(60, 120); x.rotate(-0.015);
  photoBg(x, IMG.paper, 420, 92, "rgba(255,255,255,.7)", "screen");
  x.fillStyle = "#b8251f"; x.font = "700 24px " + FONT.mono; x.fillText("CASE " + cs.no, 20, 36);
  x.fillStyle = "#1d1714"; x.font = "30px " + FONT.hand; x.fillText(cs.title, 20, 76);
  x.restore();
  x.fillStyle = "rgba(40,25,10,.55)"; x.font = "20px " + FONT.mono; x.fillText("ХЭРГИЙН ХАВТАС, ИНВЕСТИГАЦИ", 60, 300);
  stamp(x, open ? "НЭЭГДСЭН" : "НУУЦ", W - 170, H - 100, 44, open ? "rgba(40,120,70,.85)" : "rgba(178,34,30,.85)", -0.16);
  return c;
}
function mapCardTex() {
  const W = 1200, H = 680, c = canvas(W, H), x = c.getContext("2d");
  photoBg(x, IMG.paper, W, H, "rgba(255,245,220,.5)", "screen");
  if (IMG.map) { x.globalAlpha = 0.94; x.drawImage(IMG.map, 30, 70, W - 60, (W - 60) * 568 / 1200); x.globalAlpha = 1; }
  x.fillStyle = "#3b2a15"; x.font = "700 30px " + FONT.mono; x.fillText("ГАЗАРЗҮЙН НОТЛОХ БАРИМТ, МОНГОЛ УЛС", 30, 50);
  [["ub", "СЭЗИС", 30, -40], ["dg", "төрсөн нутаг", -230, 80]].forEach(([id, label, dx, dy]) => {
    const q = UI.mapXY(G.places[id]), px = 30 + q.x * 1140, py = 70 + q.y * 1140 * 568 / 1200;
    markerCircle(x, px, py, 46, 34, INKR, 6); markerText(x, label, px + dx, py + dy, 40, INKR, -0.05);
  });
  return c;
}
function texFrom(cnv) { const t = new THREE.CanvasTexture(cnv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = ANISO; return t; }

/* ============================== paper objects ============================== */
// A sheet = thin, slightly curled plane. Built in XY facing +Z (board); desk items are laid flat.
function sheet(cnv, w, curl = 0.0012) {
  const h = w * cnv.height / cnv.width;
  const g = new THREE.PlaneGeometry(w, h, 10, 10), p = g.attributes.position;
  const cx = (rnd() - 0.5) * 0.6, cy = (rnd() - 0.5) * 0.6;
  for (let i = 0; i < p.count; i++) {
    const u = p.getX(i) / (w / 2) - cx, v = p.getY(i) / (h / 2) - cy;
    p.setZ(i, curl * (u * u * 0.7 + v * v * 0.3));
  }
  g.computeVertexNormals();
  const m = new THREE.MeshStandardMaterial({ map: texFrom(cnv), roughness: 0.92, side: THREE.DoubleSide, emissive: 0x000000 });
  const mesh = new THREE.Mesh(g, m); mesh.castShadow = true; mesh.receiveShadow = true;
  mesh.userData.size = [w, h];
  return mesh;
}

const pickables = [];       // meshes the ray can hit
const deskItems = [];       // draggable things on the desk
let topOrder = 0;
function register(obj, data) { obj.traverse((o) => { if (o.isMesh) { o.userData.pick = data; pickables.push(o); } }); data.obj = obj; return data; }

function evCanvas(kind, ev, label) {
  if (kind === "note") return noteTex(plainText(ev.html));
  if (kind === "news") return newsTex(ev);
  if (kind === "env") return envTex(ev);
  if (kind === "print") return IMG.fp ? (() => { const c = canvas(IMG.fp.width, IMG.fp.height); c.getContext("2d").drawImage(IMG.fp, 0, 0); return c; })() : paperTex(ev);
  if (kind === "photo") {
    if (ev.id === "ph2" || ev === D.EVIDENCE.ph2) return photoTex(IMG.volleyball, "Волейбол");
    if (ev === D.EVIDENCE.ubph) return photoTex(IMG.ub, "Улаанбаатар");
    return photoTex(IMG.portrait || IMG.fp, ev.title, { mono: true, mark: IMG.portrait ? "" : "?" });
  }
  return paperTex(ev, label);
}
const KIND_W = { paper: 0.21, news: 0.26, env: 0.23, note: 0.085, photo: 0.11, print: 0.17 };

/* ---- desk ---- */
function deskPose(id, def) {
  const p = (UI.state.pos3 || {})[id];
  return p || def;
}
function putOnDesk(group, id, x, z, rot) {
  const p = deskPose(id, { x, z, rot });
  group.position.set(p.x, DESK_Y + 0.0006 + (++topOrder) * 0.0011, p.z); group.rotation.y = p.rot;
  group.userData.baseY = group.position.y;
}
function buildDesk() {
  // free area at the back/middle of the desk; folders along the front edge
  const defs = LC.shuffle(rnd, D.DESK.slice());
  const slots = [];
  for (let i = 0; i < defs.length; i++) slots.push({ x: -0.7 + (i % 6) * 0.33 + (rnd() - 0.5) * 0.08, z: 0.3 + Math.floor(i / 6) * 0.27 + (rnd() - 0.5) * 0.08 });
  const papers = [];
  defs.forEach((def, i) => {
    const ev = D.EVIDENCE[def.ev]; if (!ev) return;
    let obj;
    if (def.kind === "usb") obj = usbStick(ev);
    else {
      const mesh = sheet(evCanvas(def.kind, ev), KIND_W[def.kind] * (def.kind === "paper" ? 1 : 1.35), def.kind === "note" ? 0.0004 : 0.0016);
      mesh.rotation.x = -Math.PI / 2; obj = new THREE.Group(); obj.add(mesh);
    }
    const s = slots[i]; scene.add(obj);
    putOnDesk(obj, def.ev, s.x, s.z, (rnd() - 0.5) * 0.5);
    const d = register(obj, { type: "ev", id: def.ev, title: ev.title, drag: true });
    deskItems.push(d);
    if (def.kind === "paper") papers.push(d);
  });
  // hidden note: under one of the papers (move the paper to find it)
  if (rnd() < 0.8 && papers.length) {
    const cover = papers[Math.floor(rnd() * papers.length)].obj;
    const ev = D.EVIDENCE.hid1, m = sheet(noteTex(plainText(ev.html)), 0.1, 0.0003); m.rotation.x = -Math.PI / 2;
    const g = new THREE.Group(); g.add(m); scene.add(g);
    const p = (UI.state.pos3 || {}).hid1 || { x: cover.position.x + 0.03, z: cover.position.z + 0.04, rot: cover.rotation.y + 0.2 };
    g.position.set(p.x, DESK_Y + 0.0003, p.z); g.rotation.y = p.rot; g.userData.baseY = g.position.y;
    deskItems.push(register(g, { type: "ev", id: "hid1", title: "?", drag: true }));
  }
  // six case folders
  D.CASES.forEach((cs, i) => {
    const mesh = sheet(folderTex(cs, !!UI.state.unlocked[cs.id]), 0.3, 0.001); mesh.rotation.x = -Math.PI / 2;
    const thick = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.008, mesh.userData.size[1]), new THREE.MeshStandardMaterial({ color: 0xcaa46a, roughness: 0.9 }));
    thick.position.y = -0.0045; thick.castShadow = true; thick.receiveShadow = true;
    const tab = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.008, 0.03), thick.material); tab.position.set(-0.08, -0.0045, -mesh.userData.size[1] / 2 - 0.013);
    const g = new THREE.Group(); g.add(thick, tab, mesh); mesh.position.y = 0.0002; scene.add(g);
    putOnDesk(g, cs.id, -0.98 + i * 0.425 + (rnd() - 0.5) * 0.04, 1.0 + (rnd() - 0.5) * 0.05, (rnd() - 0.5) * 0.12);
    g.position.y += 0.009; g.userData.baseY = g.position.y;
    const d = register(g, { type: "folder", id: cs.id, title: "CASE " + cs.no + ", " + cs.title, drag: true, face: mesh });
    deskItems.push(d); folders[cs.id] = d;
  });
}
const folders = {};
function usbStick(ev) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.058, 0.009, 0.019), new THREE.MeshStandardMaterial({ color: 0x1d2024, roughness: 0.35, metalness: 0.2 }));
  const plug = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.0045, 0.012), new THREE.MeshStandardMaterial({ color: 0xc9ccd0, roughness: 0.25, metalness: 1 }));
  plug.position.set(0.036, 0, 0);
  const c = canvas(256, 80), x = c.getContext("2d"); x.fillStyle = "#e9e4da"; x.fillRect(0, 0, 256, 80); x.fillStyle = "#b8251f"; x.font = "700 40px " + FONT.mono; x.fillText(ev.file, 16, 54);
  const lab = new THREE.Mesh(new THREE.PlaneGeometry(0.04, 0.0125), new THREE.MeshStandardMaterial({ map: texFrom(c), roughness: 0.8 }));
  lab.rotation.x = -Math.PI / 2; lab.position.y = 0.0046;
  [body, plug].forEach((m) => { m.castShadow = true; m.receiveShadow = true; });
  g.add(body, plug, lab); g.scale.setScalar(1.6); g.position.y = 0.007;
  const o = new THREE.Group(); o.add(g); return o;
}
function refreshFolder(id) {
  const d = folders[id]; if (!d) return;
  const cs = D.CASES.find((c) => c.id === id);
  d.face.material.map.dispose(); d.face.material.map = texFrom(folderTex(cs, true)); d.face.material.needsUpdate = true;
}

/* ---- cork boards ---- */
const board = { nodes: {}, edges: [] };
const B1 = { x: -0.3, y: 1.6, w: 2.1, h: 1.18 }, B2 = { x: 1.38, y: 1.56, w: 0.84, h: 1.04 };
function corkBoard(b) {
  const g = new THREE.Group(); g.position.set(b.x, b.y, 0);
  const cork = new THREE.Mesh(new THREE.BoxGeometry(b.w, b.h, 0.018), new THREE.MeshStandardMaterial({ map: tex("assets/tex/cork.jpg", { repeat: [b.w / 1.1, b.h / 0.72] }), color: 0xa89480, roughness: 1 }));
  cork.position.z = 0.012; cork.receiveShadow = true; g.add(cork);
  const fm = new THREE.MeshStandardMaterial({ map: tex("assets/tex/frame_diff.jpg", { repeat: [2, 0.2] }), color: 0x7a5a44, roughness: 0.6 });
  const t = 0.045;
  [[0, b.h / 2 + t / 2, b.w + 2 * t, t], [0, -b.h / 2 - t / 2, b.w + 2 * t, t], [-b.w / 2 - t / 2, 0, t, b.h], [b.w / 2 + t / 2, 0, t, b.h]].forEach(([x, y, w, h]) => {
    const f = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.04), fm); f.position.set(x, y, 0.02); f.castShadow = true; f.receiveShadow = true; g.add(f);
  });
  scene.add(g); return g;
}
function pinMesh(color = 0xb3211b) {
  const g = new THREE.Group();
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.0085, 20, 14), new THREE.MeshStandardMaterial({ color, roughness: 0.25, metalness: 0.05 }));
  head.position.z = 0.012; head.castShadow = true;
  const needle = new THREE.Mesh(new THREE.CylinderGeometry(0.0009, 0.0009, 0.014, 6), new THREE.MeshStandardMaterial({ color: 0xbfc3c7, metalness: 1, roughness: 0.3 }));
  needle.rotation.x = Math.PI / 2; needle.position.z = 0.004; g.add(head, needle); return g;
}
// pin a card on a board; returns the world position of its pin
function pinCard(boardGroup, cnv, w, x, y, rot, data) {
  const m = sheet(cnv, w, 0.0025);
  const g = new THREE.Group(); g.add(m);
  g.position.set(x, y, 0.024 + (++topOrder) * 0.0006); g.rotation.z = rot; boardGroup.add(g);
  const h = m.userData.size[1], pin = pinMesh(); pin.position.set(0, h / 2 - 0.018, 0.002); g.add(pin);
  register(g, data);
  pin.traverse((o) => { if (o.isMesh) { o.userData.pick = { type: "pin", id: data.node, title: "Холбоотой баримтыг гэрэлтүүлэх", obj: pin }; } });
  pickables.push(pin.children[0]);
  g.updateMatrixWorld(true);
  const wp = new THREE.Vector3(); pin.children[0].getWorldPosition(wp);
  return { group: g, mesh: m, pinPos: wp };
}
// board-1 layout (metres from board centre), around the map

/* ---- hand-made marks in felt-tip ink ----
   A real marker line is not a flat vector stroke: it starts with a little blot where the tip touches down, thins out at the end,
   the fibres leave lighter streaks, the ink bleeds into the paper and gets darker where a line crosses itself.
   Each stroke is stamped into its own small canvas, streaked, coloured, then laid on the paper with "multiply" plus a soft bleed. */
const INKR = { rgb: "190,24,20", a: 0.9 }, INKB = { rgb: "22,26,46", a: 0.88 };
const INKR_GLOSS = { rgb: "214,28,22", a: 0.93, over: true };   // on a glossy photo the ink sits on top instead of soaking in
function inkStroke(dst, pts, w, ink = INKR, { streak = true, taper = true } = {}) {
  if (pts.length < 2) return;
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; pts.forEach(([px, py]) => { x0 = Math.min(x0, px); y0 = Math.min(y0, py); x1 = Math.max(x1, px); y1 = Math.max(y1, py); });
  const pad = Math.ceil(w * 2 + 6); x0 = Math.floor(x0 - pad); y0 = Math.floor(y0 - pad);
  const o = canvas(Math.ceil(x1 - x0 + pad), Math.ceil(y1 - y0 + pad)), c = o.getContext("2d");
  const L = [0]; for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const total = L[L.length - 1] || 1, ph = rnd() * 10;
  c.fillStyle = "#000";
  for (let i = 1; i < pts.length; i++) {
    const [ax, ay] = pts[i - 1], [bx, by] = pts[i], seg = L[i] - L[i - 1], n = Math.max(1, Math.ceil(seg / 0.8));
    for (let k = 0; k < n; k++) {
      const f = k / n, t = (L[i - 1] + seg * f) / total;
      let ww = w * (1 + 0.07 * Math.sin(t * 37 + ph));
      if (taper) ww *= Math.min(1, 0.55 + t * 9) * Math.min(1, 0.35 + (1 - t) * 4.5);
      c.beginPath(); c.arc(ax + (bx - ax) * f - x0, ay + (by - ay) * f - y0, ww / 2, 0, Math.PI * 2); c.fill();
    }
  }
  c.beginPath(); c.arc(pts[0][0] - x0, pts[0][1] - y0, w * 0.62, 0, Math.PI * 2); c.fill();   // the blot where the tip touched down
  if (streak) {                                     // fibre streaks: thin lighter lines running along the stroke
    c.globalCompositeOperation = "destination-out"; c.lineCap = "round";
    for (let s = -2; s <= 2; s++) {
      if (!s) continue;
      c.lineWidth = Math.max(0.6, w * 0.06); c.strokeStyle = "rgba(0,0,0," + (0.18 + rnd() * 0.22) + ")"; c.beginPath();
      for (let i = 0; i < pts.length; i++) {
        const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1;
        const ox = -dy / d * s * w * 0.21, oy = dx / d * s * w * 0.21;
        if (i) c.lineTo(pts[i][0] + ox - x0, pts[i][1] + oy - y0); else c.moveTo(pts[i][0] + ox - x0, pts[i][1] + oy - y0);
      }
      c.stroke();
    }
  }
  c.globalCompositeOperation = "source-in"; c.fillStyle = "rgb(" + ink.rgb + ")"; c.fillRect(0, 0, o.width, o.height);
  dst.save(); dst.globalCompositeOperation = ink.over ? "source-over" : "multiply";
  dst.globalAlpha = ink.a * 0.3; dst.filter = "blur(" + (w * 0.28).toFixed(1) + "px)"; dst.drawImage(o, x0, y0);   // bleed into the paper
  dst.globalAlpha = ink.a; dst.filter = "blur(0.5px)"; dst.drawImage(o, x0, y0);
  dst.restore();
}
const jit = (v) => (rnd() - 0.5) * v;
// a loop drawn quickly by hand: a little more than one turn, never closing on itself exactly
function markerCircle(x, cx, cy, rx, ry, ink = INKR, w = 7) {
  const r0 = -2.2 + jit(0.8), turns = 1.1 + rnd() * 0.15, n = 120, first = [], second = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, a = r0 + t * turns * Math.PI * 2, wob = 1 + Math.sin(a * 2 + 1.3) * 0.03 + Math.sin(a * 5) * 0.008, grow = 1 + t * 0.07;
    const pt = [cx + Math.cos(a) * rx * wob * grow, cy + Math.sin(a) * ry * wob * grow - t * ry * 0.05];
    (t * turns <= 1 ? first : second).push(pt);
  }
  second.unshift(first[first.length - 1]);
  inkStroke(x, first, w, ink); inkStroke(x, second, w * 0.92, ink, { taper: false });   // separate strokes: the overlap goes darker
}
// a question mark written with the pen (a hook, a stem, a dot), not typed in a font
function inkQuestion(x, cx, cy, size, ink = INKR, rot = 0, w) {
  w = w || size * 0.085;
  const R = (px, py) => { const c = Math.cos(rot), s = Math.sin(rot); return [cx + (px * c - py * s) * size, cy + (px * s + py * c) * size]; };
  const hook = [];
  for (let i = 0; i <= 40; i++) { const t = i / 40, a = Math.PI * 1.12 + t * Math.PI * 1.25; hook.push(R(Math.cos(a) * 0.27 + jit(0.006), -0.28 + Math.sin(a) * 0.25 + jit(0.006))); }
  const [hx, hy] = hook[hook.length - 1], end = R(0.02, 0.16);
  for (let i = 1; i <= 14; i++) { const t = i / 14; hook.push([hx + (end[0] - hx) * t + Math.sin(t * Math.PI) * size * 0.03, hy + (end[1] - hy) * t]); }
  inkStroke(x, hook, w, ink);
  const d = R(0.025, 0.36); inkStroke(x, [d, [d[0] + w * 0.25, d[1] + w * 0.35]], w * 1.15, ink, { streak: false, taper: false });
}
// words in a hand font, laid down as ink (multiplied, with a little bleed), slightly uneven
function markerText(x, text, px, py, size, ink = INKR, rot = 0) {
  const o = canvas(Math.ceil(size * (text.length * 0.75 + 1)), Math.ceil(size * 1.6)), c = o.getContext("2d");
  c.font = "700 " + size + "px " + FONT.hand; c.fillStyle = "#000"; c.strokeStyle = "#000"; c.lineWidth = size * 0.035; c.lineJoin = "round";
  c.fillText(text, size * 0.2, size * 1.15); c.strokeText(text, size * 0.2, size * 1.15);
  c.globalCompositeOperation = "destination-out"; c.strokeStyle = "rgba(0,0,0,.22)"; c.lineWidth = Math.max(1, size * 0.02);
  for (let i = 0; i < 3; i++) { c.beginPath(); const yy = size * (0.55 + i * 0.22) + jit(size * 0.1); c.moveTo(0, yy); c.lineTo(o.width, yy + jit(size * 0.2)); c.stroke(); }
  c.globalCompositeOperation = "source-in"; c.fillStyle = "rgb(" + ink.rgb + ")"; c.fillRect(0, 0, o.width, o.height);
  x.save(); x.translate(px, py); x.rotate(rot); x.globalCompositeOperation = ink.over ? "source-over" : "multiply";
  x.globalAlpha = ink.a * 0.3; x.filter = "blur(" + (size * 0.03).toFixed(1) + "px)"; x.drawImage(o, -size * 0.2, -size * 1.15);
  x.globalAlpha = ink.a; x.filter = "blur(0.4px)"; x.drawImage(o, -size * 0.2, -size * 1.15);
  x.restore();
}
function markerArrow(x, x0, y0, x1, y1, ink = INKR, w = 7) {
  const mx = (x0 + x1) / 2 + (y1 - y0) * 0.2, my = (y0 + y1) / 2 - (x1 - x0) * 0.2, pts = [];
  for (let i = 0; i <= 30; i++) { const t = i / 30, u = 1 - t; pts.push([u * u * x0 + 2 * u * t * mx + t * t * x1 + jit(0.8), u * u * y0 + 2 * u * t * my + t * t * y1 + jit(0.8)]); }
  inkStroke(x, pts, w, ink);
  const a = Math.atan2(y1 - my, x1 - mx), Lh = w * 4.2;
  inkStroke(x, [[x1 - Math.cos(a - 0.5) * Lh, y1 - Math.sin(a - 0.5) * Lh], [x1, y1]], w * 0.9, ink);
  inkStroke(x, [[x1, y1], [x1 - Math.cos(a + 0.5) * Lh, y1 - Math.sin(a + 0.5) * Lh]], w * 0.9, ink);
}
function markerUnderline(x, x0, x1, y, ink = INKR, w = 6) {
  const pts = []; for (let i = 0; i <= 24; i++) { const t = i / 24; pts.push([x0 + (x1 - x0) * t, y + Math.sin(t * 5.5) * w * 0.25 - t * w * 0.6]); }
  inkStroke(x, pts, w, ink);
}
// a white ruled index card
function indexCardTex(W = 640, H = 384) {
  const c = canvas(W, H), x = c.getContext("2d");
  photoBg(x, IMG.paper, W, H, "rgba(255,255,255,.82)", "screen");
  x.strokeStyle = "rgba(200,60,60,.55)"; x.lineWidth = 2; x.beginPath(); x.moveTo(0, 70); x.lineTo(W, 70); x.stroke();
  x.strokeStyle = "rgba(80,120,170,.35)"; x.lineWidth = 1.5; for (let y = 112; y < H; y += 40) { x.beginPath(); x.moveTo(0, y); x.lineTo(W, y); x.stroke(); }
  return c;
}
// a piece of masking tape: off-white, translucent, torn at both ends
function tapeTex() {
  const W = 256, H = 64, c = canvas(W, H), x = c.getContext("2d");
  x.beginPath(); x.moveTo(6, 0);
  for (let y = 0; y <= H; y += 4) x.lineTo(4 + rnd() * 8, y);
  for (let y = H; y >= 0; y -= 4) x.lineTo(W - 4 - rnd() * 8, y);
  x.closePath(); x.fillStyle = "rgba(226,214,180,.78)"; x.fill();
  x.globalCompositeOperation = "source-atop";
  for (let i = 0; i < 900; i++) { x.fillStyle = "rgba(" + (rnd() < 0.5 ? "255,250,235" : "150,130,90") + "," + (0.05 + rnd() * 0.08) + ")"; x.fillRect(rnd() * W, rnd() * H, 1 + rnd() * 3, 1); }
  x.fillStyle = "rgba(255,255,255,.12)"; x.fillRect(0, 6, W, 3);
  return c;
}
function tapeMesh(w = 0.075) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, w / 4), new THREE.MeshStandardMaterial({ map: texFrom(tapeTex()), transparent: true, roughness: 0.55, depthWrite: false }));
  m.receiveShadow = true; return m;
}
function mugPrintTex() {
  const im = IMG.mugFull, W = 900, PH = im ? Math.round(820 * im.height / im.width) : 1100, H = PH + 210, c = canvas(W, H), x = c.getContext("2d");
  photoBg(x, IMG.paper, W, H, "rgba(255,255,255,.75)", "screen");
  if (im) { x.filter = "contrast(1.05) saturate(.85)"; x.drawImage(im, 40, 40, 820, PH); x.filter = "none"; }
  // the detective's marks on the print
  markerCircle(x, 40 + 820 * 0.255, 40 + PH * 0.31, 125, 155, INKR_GLOSS, 10);
  inkQuestion(x, 40 + 820 * 0.93, 40 + PH * 0.13, 120, INKR_GLOSS, 0.12);
  markerArrow(x, 40 + 820 * 0.9, 40 + PH * 0.24, 40 + 820 * 0.76, 40 + PH * 0.34, INKR_GLOSS, 8);
  markerText(x, "ХЭН БЭ?", 60, H - 70, 62, INKB, -0.03);
  markerUnderline(x, 66, 330, H - 50, INKR, 7);
  markerText(x, C.person.name, 470, H - 74, 34, INKB, -0.02);
  return c;
}
const NODE_POS = {
  "b-id": [0, 0.02, -0.015],                                                   // the mug shot: the heart of the board
  "b-edu": [-0.52, 0.34, 0.04], "b-hobby": [-0.86, 0.3, -0.06], "b-vb": [-0.84, -0.12, 0.05], "b-champ": [-0.52, -0.3, -0.03],
  "b-skills": [0.5, 0.36, -0.03], "b-proj": [0.84, 0.31, 0.05], "b-lead": [0.5, -0.12, 0.04], "b-goal": [0.85, -0.05, -0.07]
};
function buildBoards() {
  const g1 = corkBoard(B1), g2 = corkBoard(B2);
  // the real relief map in the middle
  const MW = 0.66, mc = mapCardTex(), mapMesh = sheet(mc, MW, 0.002);
  const mg = new THREE.Group(); mg.add(mapMesh); mg.position.set(0.0, 0.27, 0.026); mg.rotation.z = 0.015; g2.add(mg);
  register(mg, { type: "map", id: "map", title: "Монгол улсын газрын зураг" });
  [[-0.3, 0.16], [0.3, 0.16], [-0.3, -0.15], [0.3, -0.15]].forEach(([x, y]) => { const p = pinMesh(0x2a2a2a); p.position.set(x, y, 0.002); mg.add(p); });
  // map pins at real coordinates (map image drawn at 30..1170 x 70..638 px of a 1200x680 card)
  const mw = MW, mh = mw * 680 / 1200, place = {};
  ["ub", "dg"].forEach((id) => {
    const q = UI.mapXY(G.places[id]);
    const px = 30 + q.x * 1140, py = 70 + q.y * 1140 * 568 / 1200;
    const p = pinMesh(0xd8261d); p.position.set((px / 1200 - 0.5) * mw, (0.5 - py / 680) * mh, 0.003); p.scale.setScalar(0.8); mg.add(p);
    p.traverse((o) => { if (o.isMesh) { o.userData.pick = { type: "place", id, title: G.places[id].name, obj: p }; pickables.push(o); } });
    mg.updateMatrixWorld(true); place[id] = new THREE.Vector3(); p.children[0].getWorldPosition(place[id]);
  });
  yarn(place.ub, place.dg, { type: "place", id: "link", title: "Дундговь, Улаанбаатар" }, 0.012);

  D.BOARD.nodes.forEach((n) => {
    const ev = D.EVIDENCE[n.ev], kind = n.kind;
    const [x, y, r] = NODE_POS[n.id] || [0, 0, 0];
    const w = kind === "note" ? 0.15 : kind === "photo" ? 0.17 : kind === "news" ? 0.21 : 0.19;
    if (n.id === "b-id") { board.nodes[n.id] = pinCard(g1, mugPrintTex(), 0.44, x, y, r, { type: "ev", id: n.ev, node: n.id, title: "Хэргийн хүн: mug shot" }); return; }
    const cnv = kind === "photo" ? evCanvas("photo", ev) : kind === "note" ? noteTex(plainText(ev.html)) : kind === "news" ? newsTex(ev) : markDoc(n.id, paperTex(ev, n.label));
    board.nodes[n.id] = pinCard(g1, cnv, w, x, y, r, { type: "ev", id: n.ev, node: n.id, title: n.label || ev.title });
  });
  D.EXTRA.forEach((n, i) => {
    const ev = D.EVIDENCE[n.ev];
    if (n.board === 1) { board.nodes[n.id] = pinCard(g1, evCanvas(n.kind, ev), 0.15, 0.74, -0.38, 0.05, { type: "ev", id: n.ev, node: n.id, title: ev.title }); return; }
    const spots = { "x-fp": [-0.2, -0.2, -0.05, 0.22], "x-hint": [0.3, -0.02, 0.09, 0.13], "x-sl": [0.19, -0.3, 0.04, 0.2] };
    const [x, y, r, w] = spots[n.id];
    board.nodes[n.id] = pinCard(g2, evCanvas(n.kind, ev), w, x, y, r, { type: "ev", id: n.ev, node: n.id, title: ev.title });
  });
  // red yarn with a reason on every string
  D.BOARD.edges.forEach((e) => { const a = board.nodes[e.a], b = board.nodes[e.b]; if (a && b) board.edges.push({ e, mesh: yarn(a.pinPos, b.pinPos, { type: "string", why: e.why, a: e.a, b: e.b, title: e.why }) }); });
  const extraEdges = [
    { a: "b-edu", b: "x-ub", why: "СЭЗИС Улаанбаатарт байрладаг." },
    { a: "b-id", b: "x-fp", why: "Хурууны хээ, хэргийн хүн." },
    { a: "b-champ", b: "x-sl", why: "Тэмцээн, уралдаанд идэвхтэй оролцдог." }
  ];
  extraEdges.forEach((e) => { const a = board.nodes[e.a], b = board.nodes[e.b]; if (a && b) board.edges.push({ e, mesh: yarn(a.pinPos, b.pinPos, { type: "string", why: e.why, a: e.a, b: e.b, title: e.why }) }); });
  // UB photo, UB pin on the map, birthplace, Dundgovi pin
  yarn(board.nodes["x-ub"].pinPos, place.ub, { type: "place", id: "ub", title: "Улаанбаатар" });
  yarn(board.nodes["b-id"].pinPos, place.dg, { type: "place", id: "dg", title: "Дундговь, төрсөн нутаг" });
  decorateBoards(g1, g2);
}
// the detective's own marks on the evidence: circled titles, a question in the margin, an underline
function markDoc(id, cnv) {
  const x = cnv.getContext("2d"), W = cnv.width;
  if (id === "b-edu") markerCircle(x, W / 2, 150, W * 0.47, 66, INKR, 7);
  if (id === "b-proj") { inkQuestion(x, W - 70, 70, 86, INKR, 0.15); markerUnderline(x, 44, W * 0.62, 178, INKR, 6); }
  if (id === "b-lead") { markerCircle(x, 112, 66, 92, 34, INKR, 6); markerText(x, "!", W - 90, 120, 90, INKR, 0.1); }
  if (id === "b-skills") markerArrow(x, W - 60, 300, W - 150, 230, INKB, 6);
  return cnv;
}
// a sticky note that is only glued along its top edge, so the lower part lifts off the cork
function stickyMesh(cnv, w) {
  const g = new THREE.PlaneGeometry(w, w, 10, 10), p = g.attributes.position, tw = jit(0.6);
  for (let i = 0; i < p.count; i++) { const u = p.getX(i) / w, d = Math.max(0, (w / 2 - p.getY(i)) / w - 0.12); p.setZ(i, 0.022 * Math.pow(d, 2.2) * (1 + tw * u)); }
  g.computeVertexNormals();
  const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ map: texFrom(cnv), roughness: 0.85, side: THREE.DoubleSide }));
  m.castShadow = true; m.receiveShadow = true; return m;
}
// pinned extras: index cards and sticky notes with questions, scraps, masking tape on the photos
function decorateBoards(g1, g2) {
  const layer = () => 0.024 + (++topOrder) * 0.0006;
  const card = (g, w, xx, yy, rot, draw, pinColor = 0x1d5fbf) => {
    const c = indexCardTex(); draw(c.getContext("2d"), c.width, c.height);
    const m = sheet(c, w, 0.0015), gg = new THREE.Group(); gg.add(m); gg.position.set(xx, yy, layer()); gg.rotation.z = rot;
    const pin = pinMesh(pinColor); pin.position.set(0, m.userData.size[1] / 2 - 0.014, 0.002); gg.add(pin); g.add(gg); return gg;
  };
  const sticky = (g, w, xx, yy, rot, draw) => {
    const c = noteTex(""); draw(c.getContext("2d"), c.width, c.height);
    const m = stickyMesh(c, w), gg = new THREE.Group(); gg.add(m); gg.position.set(xx, yy, layer()); gg.rotation.z = rot; g.add(gg); return gg;
  };
  card(g1, 0.135, -0.335, 0.405, -0.07, (x, W, H) => inkQuestion(x, W / 2, H / 2 + 10, 300, INKR, -0.08));
  card(g1, 0.165, -0.55, 0.075, 0.04, (x, W) => { markerText(x, "ЯАГААД", 40, 160, 78, INKB, -0.03); markerText(x, "МСМ?", 70, 268, 92, INKB, -0.02); markerUnderline(x, 60, 360, 300, INKR, 9); });
  card(g1, 0.12, -0.7, -0.47, 0.07, (x, W, H) => { markerText(x, "БАГ!", 120, 250, 150, INKB, -0.04); markerCircle(x, W / 2 - 10, 200, 250, 120, INKR, 12); }, 0xd8261d);
  sticky(g1, 0.085, 0.3, 0.44, 0.1, (x, W, H) => inkQuestion(x, W / 2, H / 2 + 20, 330, INKR, 0.06));
  sticky(g1, 0.1, -0.3, -0.44, -0.08, (x) => { markerText(x, "ХЭН?", 60, 300, 120, INKB, -0.05); markerUnderline(x, 70, 400, 340, INKR, 10); });
  sticky(g1, 0.1, 0.97, -0.47, 0.06, (x) => { markerText(x, "ДАРАА", 40, 230, 96, INKB, -0.04); markerText(x, "НЬ?", 90, 350, 110, INKB, -0.03); });
  sticky(g2, 0.08, -0.34, 0.03, -0.12, (x, W, H) => inkQuestion(x, W / 2, H / 2 + 20, 320, INKR, -0.1));
  card(g2, 0.13, 0.31, -0.46, -0.05, (x, W, H) => { markerText(x, "ХААНА?", 50, 200, 96, INKB, -0.03); markerArrow(x, 420, 260, 560, 120, INKR, 9); });
  // masking tape over the top corners of the photographs (they are pinned too, but tape is what holds a print flat)
  ["b-vb", "x-ub"].forEach((id) => {
    const n = board.nodes[id]; if (!n) return;
    const [w, h] = n.mesh.userData.size;
    [[-1, 0.62], [1, -0.55]].forEach(([sx, r]) => { const t = tapeMesh(0.06); t.position.set(sx * (w / 2 - 0.006), h / 2 - 0.008, 0.004); t.rotation.z = r + jit(0.2); n.group.add(t); });
  });
}
const yarnMat = new THREE.MeshStandardMaterial({ color: 0xa3150f, roughness: 0.75, emissive: 0x000000 });
function yarn(a, b, data, sag = 0.035) {
  const mid = a.clone().lerp(b, 0.5); mid.y -= sag * Math.min(1, a.distanceTo(b) / 0.5); mid.z += 0.006;
  const curve = new THREE.QuadraticBezierCurve3(a.clone().add(new THREE.Vector3(0, 0, 0.003)), mid, b.clone().add(new THREE.Vector3(0, 0, 0.003)));
  const m = new THREE.Mesh(new THREE.TubeGeometry(curve, 48, 0.0017, 6, false), yarnMat.clone());
  m.castShadow = true; scene.add(m);
  m.userData.pick = data; pickables.push(m);
  // invisible fat tube makes thin strings easy to hover/click
  const hit = new THREE.Mesh(new THREE.TubeGeometry(curve, 24, 0.012, 5, false), new THREE.MeshBasicMaterial({ visible: false }));
  hit.userData.pick = data; data.obj = m; pickables.push(hit); scene.add(hit);
  return m;
}

/* ---- highlight related evidence ---- */
let locked = null;
function related(id) { const s = new Set([id]); board.edges.forEach(({ e }) => { if (e.a === id) s.add(e.b); if (e.b === id) s.add(e.a); }); return s; }
function highlight(id, strong) {
  const rel = id ? related(id) : null;
  Object.entries(board.nodes).forEach(([k, n]) => {
    const on = rel && rel.has(k);
    n.mesh.material.emissive.setHex(on ? (strong ? 0x3a1a10 : 0x1c0d08) : 0x000000);
    n.mesh.material.color.setScalar(rel && !on ? 0.45 : 1);
  });
  board.edges.forEach(({ e, mesh }) => {
    const on = rel && (e.a === id || e.b === id);
    mesh.material.emissive.setHex(on ? 0xff2a1a : 0x000000); mesh.material.emissiveIntensity = on ? 0.9 : 0;
    mesh.material.opacity = rel && !on ? 0.35 : 1; mesh.material.transparent = !!(rel && !on);
  });
}

/* ============================== real 3D props (Poly Haven, CC0) ============================== */
const lights = {};
function place(key, x, z, rotY, scale = 1, y = DESK_Y) {
  const src = MODELS[key]; if (!src) return null;
  const o = src.clone(true); o.position.set(x, y, z); o.rotation.y = rotY; o.scale.setScalar(scale);
  o.traverse((m) => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
  scene.add(o); return o;
}
function buildProps() {
  const lamp = place("desk_lamp_arm_01", 1.62, 0.26, 2.05, 1.0, DESK_Y + 0.088);
  // spotlight inside the lamp shade: find the emissive "light" part of the model
  let head = new THREE.Vector3(1.3, DESK_Y + 0.55, 0.55);
  if (lamp) {
    lamp.updateMatrixWorld(true);
    lamp.traverse((m) => {
      if (!m.isMesh) return;
      const mats = Array.isArray(m.material) ? m.material : [m.material];
      mats.forEach((mt) => { if (/light/i.test(mt.name)) { mt.emissive = new THREE.Color(0xffd9a0); mt.emissiveIntensity = 0; lights.bulbMat = mt; } });
    });
    head = lamp.localToWorld(new THREE.Vector3(0, 0.672, -0.168));   // bulb centre in the model (measured from the .bin)
    register(lamp, { type: "lamp", id: "lamp", title: "Ширээний чийдэн (асаах / унтраах)" });
  }
  lights.lampHead = head;
  const mag = place("magnifying_glass_01", 0.35, 0.8, 0, 1.0, DESK_Y + 0.0135);
  if (mag) { mag.rotation.set(-Math.PI / 2, 0, Math.PI / 2 + 0.25); register(mag, { type: "mag", id: "mag", title: "Томруулдаг шил (M)" }); props.mag = mag; }
  const sp = place("round_spectacles", 1.05, 0.74, 1.35, 1.0, DESK_Y + 0.023); if (sp) register(sp, { type: "deco", title: "Нүдний шил" });
  const pw = place("pocket_watch", 1.42, 0.98, 0.2, 1.4, DESK_Y + 0.012);
  if (pw) { pw.rotation.x = -Math.PI / 2; register(pw, { type: "deco", title: "Халаасны цаг" }); props.watch = pw; }
}
const props = {};

/* ============================== lights ============================== */
function buildLights() {
  lights.hemi = new THREE.HemisphereLight(0x7f8c99, 0x120c08, 0.25); scene.add(lights.hemi);
  // desk lamp: warm cone on the papers, sharp paper shadows
  const s = new THREE.SpotLight(0xffbf73, 0, 6, 0.95, 0.55, 1.6);
  s.position.copy(lights.lampHead); s.target.position.set(0.55, DESK_Y, 0.72);
  s.castShadow = true; s.shadow.mapSize.set(2048, 2048); s.shadow.bias = -0.0004; s.shadow.normalBias = 0.02; s.shadow.camera.near = 0.05; s.shadow.radius = 3;
  scene.add(s, s.target); lights.lamp = s;
  lights.bulb = new THREE.PointLight(0xffc27a, 0, 1.2, 2); lights.bulb.position.copy(lights.lampHead).add(new THREE.Vector3(0, -0.04, 0)); scene.add(lights.bulb);
  // light over the boards (like a picture light from the ceiling)
  const b = new THREE.SpotLight(0xe8ecff, 0, 7, 0.62, 0.75, 1.4);
  b.position.set(0.35, 3.7, 1.9); b.target.position.set(0.2, 1.55, 0); b.castShadow = true; b.shadow.mapSize.set(2048, 2048); b.shadow.bias = -0.0003; b.shadow.normalBias = 0.015; b.shadow.radius = 4;
  scene.add(b, b.target); lights.board = b;
  // corridor light behind the door: it only reaches the room through the real doorway (walls + door cast the shadow)
  const d = new THREE.SpotLight(0xffd3a0, 0, 14, 0.78, 0.25, 1.2);
  d.position.set(-3.5, 1.5, 6.95); d.target.position.set(-0.3, 1.5, 0);
  d.castShadow = true; d.shadow.mapSize.set(innerWidth > 900 ? 4096 : 2048, innerWidth > 900 ? 4096 : 2048); d.shadow.bias = -0.0004; d.shadow.normalBias = 0.02; d.shadow.radius = 5; d.shadow.blurSamples = 16; d.shadow.camera.near = 0.2; d.shadow.camera.far = 14;
  scene.add(d, d.target); lights.door = d;
  // the bare bulb in the corridor (seen when you leave)
  lights.hall = new THREE.PointLight(0xffc488, 0, 4.5, 1.6); lights.hall.position.set(-2.4, 2.4, 6.2); scene.add(lights.hall);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.035, 16, 12), new THREE.MeshStandardMaterial({ color: 0xfff2dd, emissive: 0xffd9a0, emissiveIntensity: 0 }));
  bulb.position.copy(lights.hall.position); scene.add(bulb); lights.hallBulb = bulb.material;
  const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.2, 6), new THREE.MeshStandardMaterial({ color: 0x111111 })); cord.position.set(-2.4, 2.53, 6.2); scene.add(cord);
}
function setLamp(on, instant) { lightTarget.lamp = on ? 7 : 0; lightTarget.bulb = on ? 0.35 : 0; lightTarget.bulbE = on ? 0.6 : 0; if (instant) Object.assign(lightNow, lightTarget); }
const lightTarget = { lamp: 0, bulb: 0, bulbE: 0, board: 0, hemi: 0.03, door: 0, hall: 0 }, lightNow = { ...lightTarget };

/* ============================== the visitor: a detective (coat + hat) seen only as a shadow ============================== */
const visitorRig = { obj: null, card: null };
function buildVisitor() {
  // The man in the corridor is never seen, only his shadow. His outline comes from a real photographed silhouette
  // (long coat, hat) cut out cleanly as an alpha mask; the cards themselves draw nothing (colorWrite off), they only cast shadows.
  // Coat and legs are separate so that the shadow really walks: the feet lift in turn below the hem while the body bobs.
  const SC = 1.86 / 384;                                   // metres per pixel of the source photo (hat top to floor = 384 px)
  const bodyW = 127.8 * SC, bodyH = 346.8 * SC, legH = 37 * SC;
  const shadowOnly = (alphaMap) => {
    const m = new THREE.MeshBasicMaterial({ alphaMap, alphaTest: 0.5, colorWrite: false, depthWrite: false, side: THREE.DoubleSide });
    const d = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, alphaMap, alphaTest: 0.5, side: THREE.DoubleSide });
    return [m, d];
  };
  const mask = texLoader.load("assets/photo/visitor_body.png");
  const [bm, bd] = shadowOnly(mask);
  const card = new THREE.Mesh(new THREE.PlaneGeometry(bodyW, bodyH), bm);
  card.position.y = legH + bodyH / 2; card.castShadow = true; card.customDepthMaterial = bd;
  // one trouser leg with its shoe, drawn as a soft-edged alpha shape
  const lc = canvas(64, 256), x = lc.getContext("2d");
  x.fillStyle = "#000"; x.fillRect(0, 0, 64, 256); x.fillStyle = "#fff";
  x.beginPath(); x.moveTo(12, 0); x.lineTo(52, 0); x.lineTo(49, 200); x.quadraticCurveTo(60, 214, 60, 236); x.lineTo(60, 250); x.lineTo(4, 250); x.lineTo(4, 236); x.quadraticCurveTo(6, 212, 15, 200); x.closePath(); x.fill();
  const lt = new THREE.CanvasTexture(lc);
  const [lm, ld] = shadowOnly(lt);
  const legW = 15 * SC, legFull = legH + 0.06;           // a little of the leg is hidden under the coat
  const legs = [-1, 1].map((side) => {
    const l = new THREE.Mesh(new THREE.PlaneGeometry(legW, legFull), lm);
    l.castShadow = true; l.customDepthMaterial = ld;
    l.position.set(side * 17 * SC, legFull / 2 - 0.004, 0.002); return l;
  });
  const o = new THREE.Group(), body = new THREE.Group();
  body.add(card); o.add(body); legs.forEach((l) => o.add(l));
  o.visible = false; scene.add(o);
  visitorRig.obj = o; visitorRig.card = card; visitorRig.body = body; visitorRig.legs = legs; visitorRig.legFull = legFull;
  return o;
}
// walking pose: phase in radians, w = 0 standing .. 1 walking
function visitorPose(phase, w, t) {
  const v = visitorRig; if (!v.body) return;
  const s = Math.sin(phase);
  v.legs[0].position.y = v.legFull / 2 - 0.004 + w * Math.max(0, s) * 0.06;
  v.legs[1].position.y = v.legFull / 2 - 0.004 + w * Math.max(0, -s) * 0.06;
  v.legs[0].position.x = -17 * 1.86 / 384 + w * s * 0.012; v.legs[1].position.x = 17 * 1.86 / 384 + w * s * 0.012;
  v.body.position.y = w * (1 - Math.abs(Math.cos(phase))) * 0.022;              // rises over each step
  v.body.position.x = w * s * 0.012;                                             // weight shifts from foot to foot
  v.body.rotation.z = w * s * 0.012 + (1 - w) * Math.sin(t * 1.1) * 0.004;       // standing: breathing sway
}

/* ============================== the corridor behind the door: real furniture (Poly Haven, CC0) ============================== */
const hall = { clock: null, hands: null, sconce: null };
async function buildHall() {
  await Promise.all(["vintage_grandfather_clock_01", "fancy_picture_frame_01", "ornate_mirror_01", "ClassicNightstand_01", "ArmChair_01", "hanging_picture_frame_01"].map((k) => model(k)));
  const put = (key, x, y, z, ry, s = 1) => place(key, x, z, ry, s, y);
  // a grandfather clock at the end of the corridor, its hands set to the real time
  const clock = put("vintage_grandfather_clock_01", -2.4, 0.116, 7.36, Math.PI, 0.98);
  if (clock) {
    hall.clock = clock; hall.hands = {};
    clock.traverse((o) => { if (/HourHand/.test(o.name)) hall.hands.h = o; if (/MinuteHand/.test(o.name)) hall.hands.m = o; });
  }
  put("ArmChair_01", -1.72, 0, 6.95, -Math.PI / 2 - 0.55, 0.92);                  // an armchair in the corner
  put("ClassicNightstand_01", -1.45, 0, 5.35, -Math.PI / 2, 1);                    // a side table by the door
  put("fancy_picture_frame_01", -1.215, 1.62, 5.35, -Math.PI / 2, 1.15);           // an oil landscape above it
  put("ornate_mirror_01", -3.585, 1.52, 5.55, Math.PI / 2, 1.1);                  // a mirror opposite
  const photo = put("hanging_picture_frame_01", -1.215, 1.55, 6.7, -Math.PI / 2, 0.62);
  if (photo && IMG.ub) {                                                           // the frame holds a real photo of Ulaanbaatar
    photo.traverse((m) => { if (m.isMesh && /artwork/.test(m.material.name)) { const t = new THREE.Texture(IMG.ub); t.colorSpace = THREE.SRGBColorSpace; t.needsUpdate = true; t.flipY = false; m.material = m.material.clone(); m.material.map = t; m.material.color.set(0xd8cfc0); } });
  }
  // the brass wall light whose lamp throws the visitor's shadow into the room
  const brass = new THREE.MeshStandardMaterial({ color: 0xa67c3a, metalness: 1, roughness: 0.32 });
  const S = new THREE.Group(); S.position.copy(lights.door.position); S.position.x = -3.6; scene.add(S);
  const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.018, 28), brass); plate.rotation.z = Math.PI / 2; plate.position.x = 0.009; S.add(plate);
  const arm = new THREE.Mesh(new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(new THREE.Vector3(0.015, -0.02, 0), new THREE.Vector3(0.17, -0.05, 0), new THREE.Vector3(0.14, 0.06, 0)), 16, 0.008, 8), brass); S.add(arm);
  const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.022, 0.035, 20), brass); cup.position.set(0.14, 0.075, 0); S.add(cup);
  const pts = []; for (let i = 0; i <= 12; i++) { const u = i / 12; pts.push(new THREE.Vector2(0.025 + 0.06 * Math.sin(u * 1.45) + 0.012 * u, u * 0.15)); }
  const glassMat = new THREE.MeshStandardMaterial({ color: 0xf3e6cf, emissive: 0xffc98a, emissiveIntensity: 0, roughness: 0.6, transparent: true, opacity: 0.88, side: THREE.DoubleSide });
  const shade = new THREE.Mesh(new THREE.LatheGeometry(pts, 32), glassMat); shade.position.set(0.14, 0.09, 0); S.add(shade);
  hall.sconce = glassMat;
}
function hallTick() {
  if (hall.hands && hall.hands.h) {
    const d = new Date(), m = d.getMinutes() + d.getSeconds() / 60, h = (d.getHours() % 12) + m / 60;
    hall.hands.m.rotation.z = -m / 60 * Math.PI * 2; hall.hands.h.rotation.z = -h / 12 * Math.PI * 2;
  }
  if (hall.sconce) hall.sconce.emissiveIntensity = Math.min(2.2, (lightNow.door || 0) / 60 + (lightNow.hall || 0) * 0.12);
}

/* ============================== old CRT TV + cassette player: the tape plays a video about me ============================== */
const tv = { state: "empty", cur: null, screen: null, uni: null, video: null, vtex: null, light: null, osd: null, slot: null, anim: null, tapes: [], song: null, songCv: null, songTex: null };
function osdTex(text) {
  const c = tv.osd || canvas(512, 384), x = c.getContext("2d"); tv.osd = c;
  x.clearRect(0, 0, 512, 384);
  if (text) { x.font = "700 30px " + FONT.mono; x.fillStyle = "rgba(255,255,255,.92)"; x.shadowColor = "#000"; x.shadowBlur = 4; x.fillText(text, 26, 46); x.font = "22px " + FONT.mono; x.fillText("CH 03", 26, 356); }
  if (tv.osdTex) tv.osdTex.needsUpdate = true; else { tv.osdTex = new THREE.CanvasTexture(c); tv.osdTex.colorSpace = THREE.SRGBColorSpace; }
  return tv.osdTex;
}
function buildTV() {
  const t = place("Television_01", -1.2, 0.36, 0.38, 1.0, DESK_Y);
  if (t) {
    register(t, { type: "tv", id: "tv", title: "Хуучин зурагт" });
    // the screen: a slightly bulged CRT face with static / the tape, scanlines and flicker (shader)
    const g = new THREE.PlaneGeometry(0.362, 0.276, 24, 18), p = g.attributes.position;
    for (let i = 0; i < p.count; i++) { const u = p.getX(i) / 0.181, v = p.getY(i) / 0.138; p.setZ(i, 0.012 * (1 - 0.55 * u * u - 0.55 * v * v)); }
    tv.uni = { uTime: { value: 0 }, uMode: { value: 0 }, uVideo: { value: null }, uOsd: { value: osdTex("ДОХИО АЛГА") } };
    const mat = new THREE.ShaderMaterial({
      uniforms: tv.uni,
      vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
      fragmentShader: [
        "uniform float uTime; uniform float uMode; uniform sampler2D uVideo; uniform sampler2D uOsd; varying vec2 vUv;",
        "float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453); }",
        "void main(){",
        "  vec2 uv = vUv; vec2 c = uv - 0.5;",
        "  float roll = smoothstep(0.0, 0.06, abs(fract(uv.y * 0.6 - uTime * 0.25) - 0.5) - 0.42);",
        "  float n = h(floor(uv * vec2(320.0, 240.0)) + floor(uTime * 30.0));",
        "  vec3 stat = vec3(n * 0.85 + 0.08) * (0.75 + 0.25 * roll);",
        "  vec2 wob = vec2(sin(uv.y * 180.0 + uTime * 9.0) * 0.0015, 0.0);",
        "  vec3 vid = vec3(texture2D(uVideo, uv + wob + vec2(0.002,0.0)).r, texture2D(uVideo, uv + wob).g, texture2D(uVideo, uv + wob - vec2(0.002,0.0)).b);",
        "  vid += (n - 0.5) * 0.07;",
        "  vec3 col = mix(stat, vid, uMode);",
        "  col *= 0.88 + 0.12 * sin(uv.y * 900.0);",
        "  col *= 0.94 + 0.06 * sin(uTime * 50.0);",
        "  col *= 1.0 - dot(c, c) * 1.6;",
        "  vec4 o = texture2D(uOsd, uv); col = mix(col, o.rgb, o.a);",
        "  gl_FragColor = vec4(col, 1.0);",
        "  #include <colorspace_fragment>",
        "}"].join("\n")
    });
    const scr = new THREE.Mesh(g, mat); scr.position.set(-0.07, 0.258, 0.198); t.add(scr); tv.screen = scr;
    scr.userData.pick = { type: "tv", id: "tv", title: "Хуучин зурагт", obj: t }; pickables.push(scr);
    // the screen lights the desk a little, flickering
    tv.light = new THREE.PointLight(0xa8c4ff, 0.25, 1.6, 2); tv.light.position.set(-0.07, 0.26, 0.45); t.add(tv.light);
  }
  const pl = place("cassette_player", -0.86, 0.7, 0.55, 1.35, DESK_Y);
  if (pl) {
    const tape = pl.getObjectByName("cassette_player_tape");
    pl.updateMatrixWorld(true);
    if (tape) {
      tv.slot = { pos: new THREE.Vector3(), quat: new THREE.Quaternion() };
      tape.getWorldPosition(tv.slot.pos); tape.getWorldQuaternion(tv.slot.quat);
      scene.attach(tape);
      // two tapes on the desk: 1 = the video about me, 2 = a favourite song
      const defs = [
        { id: "t1", kind: "video", label: "БИЧЛЭГ № 334", sub: "Хэргийн хүн", home: [-1.31, 0.79, 0.5], tint: null },
        { id: "t2", kind: "song", label: (C.song && C.song.title) || "Дуу", sub: (C.song && C.song.artist) || "", home: [-1.42, 0.99, -0.35], tint: 0x8fa7c4 }
      ];
      const copies = defs.map((d, n) => (n === 0 ? tape : tape.clone(true)));   // clone before any userData is attached
      defs.forEach((d, n) => {
        const t = copies[n];
        if (n > 0) scene.add(t);
        if (d.tint) t.traverse((m) => { if (m.isMesh) { m.material = m.material.clone(); m.material.color.setHex(d.tint); } });
        // a paper label stuck on the top of the tape, written by hand
        const c = canvas(256, 96), x = c.getContext("2d");
        photoBg(x, IMG.paper, 256, 96, "rgba(255,252,240,.6)", "screen");
        x.fillStyle = "#1f2a44"; x.font = "26px " + FONT.hand; x.fillText(d.label, 12, 40);
        x.fillStyle = "#7a2a1a"; x.font = "18px " + FONT.mono; x.fillText(d.sub, 12, 76);
        const lab = new THREE.Mesh(new THREE.PlaneGeometry(0.066, 0.025), new THREE.MeshStandardMaterial({ map: texFrom(c), roughness: 0.9 }));
        lab.rotation.x = -Math.PI / 2; lab.position.set(0, 0.0043, -0.012); t.add(lab);
        d.obj = t; d.home = { pos: new THREE.Vector3(d.home[0], DESK_Y + 0.0056, d.home[1]), quat: new THREE.Quaternion().setFromEuler(new THREE.Euler(0, d.home[2], 0)) };
        t.position.copy(d.home.pos); t.quaternion.copy(d.home.quat);
        const title = d.kind === "video" ? "Кассет 1: бичлэг (дарж тоглуул)" : "Кассет 2: " + d.sub + ", " + d.label + " (дарж тоглуул)";
        t.traverse((m) => { if (m.isMesh) { m.userData.pick = { type: "tape", id: d.id, title, obj: t }; pickables.push(m); } });
        tv.tapes.push(d);
      });
    }
    pl.traverse((m) => { if (m.isMesh) { m.userData.pick = { type: "player", id: "player", title: "Кассет тоглуулагч (дарвал кассет гарна)", obj: pl }; pickables.push(m); } });
  }
  if (C.video) {
    const v = document.createElement("video");
    v.src = C.video; v.playsInline = true; v.preload = "auto";
    v.addEventListener("ended", () => { if (tv.cur && tv.cur.kind === "video") stopped(true); });   // the tape ends with the set switching off: keep the dark screen
    tv.video = v; tv.vtex = new THREE.VideoTexture(v); tv.vtex.colorSpace = THREE.SRGBColorSpace; tv.uni.uVideo.value = tv.vtex;
  }
  if (C.song && C.song.src) {
    const au = new Audio(); au.preload = "auto"; au.src = C.song.src; tv.song = au;
    au.addEventListener("error", () => { au.dataset.missing = "1"; });
    tv.songCv = canvas(512, 384); tv.songTex = new THREE.CanvasTexture(tv.songCv); tv.songTex.colorSpace = THREE.SRGBColorSpace;
  }
}
function stopped(keepPicture) {
  tv.state = "ended";
  if (keepPicture) setTimeout(() => { if (tv.state === "ended") osdTex("■ STOP"); }, 1500); else { tv.uni.uMode.value = 0; osdTex("■ STOP"); }
  if (tv.song) tv.song.pause();
  LC.audio.ambient(!LC.audio.get().muted);
}
function moveTape(d, to, dur, then) {
  const from = { pos: d.obj.position.clone(), quat: d.obj.quaternion.clone() };
  tv.anim = { d, t: 0, dur: reduceMotion ? 0.01 : dur, from, to, then };
}
function insertTape(id) {
  const d = tv.tapes.find((x) => x.id === id); if (!d || tv.anim) return;
  if (tv.cur === d) { ejectTape(); return; }
  if (tv.cur) { ejectTape(() => insertTape(id)); return; }
  tv.cur = d; tv.state = "inserting"; LC.audio.sfx("pick"); tip.hidden = true;
  moveTape(d, tv.slot, 1.3, () => { LC.audio.sfx("tape_in"); osdTex("▶ PLAY"); d.kind === "video" ? playVideo() : playSong(); });
}
function playVideo() {
  if (!tv.video) { stopped(); UI.toast("Бичлэгийн файл алга (content.js → video)."); return; }
  const a = LC.audio.get(); tv.video.muted = a.muted; tv.video.volume = a.volume; tv.video.currentTime = 0;
  tv.uni.uVideo.value = tv.vtex;
  const go = () => { tv.state = "playing"; tv.uni.uMode.value = 1; setTimeout(() => { if (tv.state === "playing") osdTex(""); }, 2500); LC.audio.ambient(false); UI.markFound("tape1"); UI.toast("Бичлэг тоглож байна. Зурагт дээр дарж томоор үзнэ."); };
  const p = tv.video.play();
  if (p && p.then) p.then(go).catch(() => { tv.video.muted = true; tv.video.play().then(go).catch(stopped); }); else go();
}
function playSong() {
  const S = C.song, au = tv.song;
  if (!au || au.dataset.missing) { stopped(); osdTex("ФАЙЛ АЛГА"); UI.toast("Дууны файл алга: " + (S ? S.src : "content.js → song") + ". Өөрийн 8 секундын клипээ тэнд хийнэ."); return; }
  const a = LC.audio.get(); au.muted = a.muted; au.volume = a.volume;
  try { au.currentTime = S.start || 0; } catch (e) { /* not loaded yet */ }
  tv.uni.uVideo.value = tv.songTex; tv.songT0 = performance.now();
  const go = () => { tv.state = "playing"; tv.uni.uMode.value = 1; osdTex(""); LC.audio.ambient(false); UI.markFound("tape2"); UI.toast(S.artist + ", " + S.title); };
  const p = au.play();
  if (p && p.then) p.then(go).catch(() => { stopped(); osdTex("ФАЙЛ АЛГА"); UI.toast("Дууг тоглуулж чадсангүй: " + S.src); }); else go();
}
function drawSong() {
  const S = C.song, au = tv.song, x = tv.songCv.getContext("2d"), W = 512, H = 384;
  const el = Math.max(0, (au.currentTime || 0) - (S.start || 0)), L = S.length || 8;
  x.fillStyle = "#0d1216"; x.fillRect(0, 0, W, H);
  x.fillStyle = "#fff"; x.font = "700 28px " + FONT.mono; x.fillText("▶ PLAY", 26, 46);
  x.font = "22px " + FONT.mono; x.fillText("00:00:0" + Math.min(9, Math.floor(el)), 360, 46);
  x.fillStyle = "#ffd9a0"; x.font = "700 30px " + FONT.mono; x.textAlign = "center"; x.fillText(S.artist.toUpperCase(), W / 2, 120);
  x.fillStyle = "#fff"; x.font = "26px " + FONT.mono; x.fillText(S.title, W / 2, 158); x.textAlign = "left";
  const n = 24, bw = 12, t = performance.now() / 1000;
  for (let i = 0; i < n; i++) {
    const h = 20 + 70 * Math.abs(Math.sin(t * (2.1 + i * 0.37) + i * 1.7) * Math.cos(t * 1.3 + i));
    x.fillStyle = i % 3 ? "#9fd0ff" : "#ffd9a0"; x.fillRect(64 + i * 16, 290 - h, bw, h);
  }
  x.fillStyle = "rgba(255,255,255,.25)"; x.fillRect(64, 310, 384, 6); x.fillStyle = "#fff"; x.fillRect(64, 310, 384 * Math.min(1, el / L), 6);
  x.font = "20px " + FONT.mono; x.fillText("SP  CH 03", 26, 356);
  tv.songTex.needsUpdate = true;
  if (el >= L) stopped();
}
function ejectTape(then) {
  const d = tv.cur; if (!d) { if (then) then(); return; }
  if (tv.video) tv.video.pause(); if (tv.song) tv.song.pause();
  tv.state = "ejecting"; tv.uni.uMode.value = 0; osdTex("⏏ EJECT"); LC.audio.sfx("tape_out");
  LC.audio.ambient(!LC.audio.get().muted);
  moveTape(d, d.home, 1.0, () => { tv.cur = null; tv.state = "empty"; osdTex("ДОХИО АЛГА"); if (then) then(); });
}
function openTvBig() {
  if (!tv.cur || tv.cur.kind !== "video") { if (tv.cur) UI.toast(C.song.artist + ", " + C.song.title); return; }
  const t = tv.video.currentTime; tv.video.pause();
  UI.openVideo(C.video, tv.state === "ended" ? 0 : t, (time, ended) => {
    if (!tv.cur || tv.cur.kind !== "video") return;
    if (ended) { stopped(); return; }
    tv.video.currentTime = time; tv.state = "playing"; tv.uni.uMode.value = 1; tv.video.play().catch(() => {});
  });
}
function tvTick(dt) {
  if (!tv.uni) return;
  tv.uni.uTime.value += dt;
  const a = LC.audio.get();
  if (tv.state === "playing" && tv.cur) {
    const el = tv.cur.kind === "video" ? tv.video : tv.song; if (el) { el.muted = a.muted; el.volume = a.volume; }
    if (tv.cur.kind === "song") drawSong();
  }
  if (tv.light) tv.light.intensity = (tv.state === "playing" ? 0.45 : 0.22) * (0.8 + 0.2 * Math.random());
  if (tv.anim) {
    const an = tv.anim, o = an.d.obj; an.t = Math.min(1, an.t + dt / an.dur); const k = ease(an.t);
    o.position.lerpVectors(an.from.pos, an.to.pos, k); o.position.y += Math.sin(Math.PI * k) * 0.14;
    o.quaternion.slerpQuaternions(an.from.quat, an.to.quat, k);
    if (an.t >= 1) { tv.anim = null; if (an.then) an.then(); }
  }
}

/* ============================== camera rig ============================== */
const rig = { pos: new THREE.Vector3(), look: new THREE.Vector3(), fov: 44, pan: 0, panMin: -0.6, panMax: 0.9, zoom: 1, par: new THREE.Vector2() };
function basePose() {
  const a = window.innerWidth / Math.max(1, window.innerHeight - hudH() - footH());
  if (a >= 1.25) return { pos: [0.08, 1.46, 2.85], look: [0.08, 1.22, 0.25], fov: 44, panMin: -0.3, panMax: 0.5 };
  if (a >= 0.8) return { pos: [0.2, 1.5, 3.25], look: [0.2, 1.22, 0.25], fov: 52, panMin: -0.6, panMax: 0.7 };
  return { pos: [-0.2, 1.45, 2.55], look: [-0.2, 0.98, 0.3], fov: 62, panMin: -0.75, panMax: 1.6 };
}
function hudH() { return $("#hud").offsetHeight || 52; }
function footH() { return $("#foot").offsetHeight || 0; }
const camAnim = { t: 1, dur: 1, from: null, to: null };
function applyBase(instant) {
  const p = basePose(); rig.panMin = p.panMin; rig.panMax = p.panMax; rig.pan = THREE.MathUtils.clamp(rig.pan, p.panMin, p.panMax);
  const to = { pos: new THREE.Vector3(...p.pos), look: new THREE.Vector3(...p.look), fov: p.fov };
  if (instant) { rig.pos.copy(to.pos); rig.look.copy(to.look); rig.fov = to.fov; camAnim.t = 1; }
  else moveCam(to, 2.6);
}
function moveCam(to, dur) { camAnim.from = { pos: rig.pos.clone(), look: rig.look.clone(), fov: rig.fov }; camAnim.to = to; camAnim.t = 0; camAnim.dur = dur; }
const ease = (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
function updateCamera(dt) {
  if (camAnim.t < 1) {
    camAnim.t = Math.min(1, camAnim.t + dt / camAnim.dur); const k = ease(camAnim.t);
    rig.pos.lerpVectors(camAnim.from.pos, camAnim.to.pos, k); rig.look.lerpVectors(camAnim.from.look, camAnim.to.look, k); rig.fov = THREE.MathUtils.lerp(camAnim.from.fov, camAnim.to.fov, k);
  }
  const par = reduceMotion || touchFirst ? 0 : 1;
  camera.position.set(rig.pos.x + rig.pan + rig.par.x * 0.05 * par, rig.pos.y + rig.par.y * 0.03 * par, rig.pos.z);
  camera.lookAt(rig.look.x + rig.pan, rig.look.y, rig.look.z);
  const f = rig.fov * rig.zoom; if (Math.abs(camera.fov - f) > 0.01) { camera.fov = f; camera.updateProjectionMatrix(); }
}
function resize() {
  const w = window.innerWidth, h = window.innerHeight - hudH() - footH();
  stage.style.top = hudH() + "px"; stage.style.bottom = footH() + "px";
  renderer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix();
  lens.cam.aspect = 1; hudCam.right = w; hudCam.top = h; hudCam.updateProjectionMatrix();
  if (introState.done) applyBase(true);
}

/* ============================== magnifying glass (loupe) ============================== */
const ZOOM = 2.6;
const lens = { on: false, R: touchFirst ? 70 : 96, rt: new THREE.WebGLRenderTarget(512, 512, { samples: 4, type: THREE.HalfFloatType }), cam: new THREE.PerspectiveCamera(20, 1, 0.02, 30), x: -999, y: -999, visible: false };
const hudScene = new THREE.Scene(), hudCam = new THREE.OrthographicCamera(0, 1, 1, 0, -500, 500);
const lensRig = new THREE.Group(); hudScene.add(lensRig);
function buildLens() {
  const disc = new THREE.Mesh(new THREE.CircleGeometry(1, 64), new THREE.MeshBasicMaterial({ map: lens.rt.texture }));
  lensRig.add(disc);
  // glass reflection
  const gc = canvas(256, 256), x = gc.getContext("2d"), gr = x.createRadialGradient(90, 80, 10, 128, 128, 128);
  gr.addColorStop(0, "rgba(255,255,255,.28)"); gr.addColorStop(0.35, "rgba(255,255,255,.05)"); gr.addColorStop(0.85, "rgba(0,0,0,0)"); gr.addColorStop(1, "rgba(0,0,0,.45)");
  x.fillStyle = gr; x.fillRect(0, 0, 256, 256);
  const glass = new THREE.Mesh(new THREE.CircleGeometry(1, 64), new THREE.MeshBasicMaterial({ map: texFrom(gc), transparent: true, depthTest: false, toneMapped: false }));
  glass.position.z = 2; lensRig.add(glass);
  const src = MODELS.magnifying_glass_01;
  if (src) {
    const m = src.clone(true);
    m.traverse((o) => { if (o.isMesh) { const mats = Array.isArray(o.material) ? o.material : [o.material]; mats.forEach((mt) => { if (/lense/i.test(mt.name)) mt.visible = false; }); } });
    const s = 1 / 0.059; m.scale.setScalar(s); m.position.set(0, -0.206 * s, 0.3);   // lens centre of the model, origin
    const holder = new THREE.Group(); holder.add(m); holder.rotation.z = 0.62; lensRig.add(holder);
    hudScene.add(new THREE.AmbientLight(0xffffff, 1.2)); const dl = new THREE.DirectionalLight(0xfff0dd, 2.2); dl.position.set(-1, 2, 3); hudScene.add(dl);
  } else {
    const ring = new THREE.Mesh(new THREE.RingGeometry(1, 1.12, 64), new THREE.MeshBasicMaterial({ color: 0x8a6a3a })); lensRig.add(ring);
  }
  lensRig.visible = false;
}
function setLens(on) {
  lens.on = on; document.body.classList.toggle("lens-on", on && !touchFirst);
  $("#btnLens").setAttribute("aria-pressed", String(on));
  if (props.mag) props.mag.visible = !on;
  if (!on) lensRig.visible = false;
}
const ndc = new THREE.Vector2(), ray = new THREE.Raycaster();
function renderLens() {
  if (!lens.on || !lens.visible) { lensRig.visible = false; return; }
  const r = renderer.domElement.getBoundingClientRect();
  ndc.set((lens.x / r.width) * 2 - 1, -(lens.y / r.height) * 2 + 1);
  ray.setFromCamera(ndc, camera);
  lens.cam.position.copy(camera.position); lens.cam.fov = camera.fov * (2 * lens.R / r.height) / ZOOM; lens.cam.near = 0.02; lens.cam.updateProjectionMatrix();
  lens.cam.lookAt(camera.position.clone().add(ray.ray.direction));
  lensRig.visible = false;
  renderer.setRenderTarget(lens.rt); renderer.render(scene, lens.cam); renderer.setRenderTarget(null);
  lensRig.visible = true; lensRig.position.set(lens.x, r.height - lens.y, 0); lensRig.scale.setScalar(lens.R);
}

/* ============================== picking, hover, drag, pan, zoom ============================== */
const tip = $("#tip");
let hover = null, drag = null, pan = null, downAt = null;
const pointers = new Map();
function pick(cx, cy) {
  const r = renderer.domElement.getBoundingClientRect();
  ndc.set(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1);
  ray.setFromCamera(ndc, camera);
  const hits = ray.intersectObjects(pickables, false);
  for (const h of hits) { const d = h.object.userData.pick; if (d && (d.obj ? d.obj.visible !== false : true)) return { d, point: h.point }; }
  return null;
}
function lift(d, on) {
  if (!d || !d.obj) return;
  d.obj.userData.liftTo = on ? 1 : 0;
  if (d.type === "string") { d.obj.material.emissive.setHex(on ? 0xff3322 : 0x000000); d.obj.material.emissiveIntensity = on ? 0.7 : 0; }
}
function setHover(h, cx, cy) {
  const d = h && h.d;
  if (hover !== d) {
    if (hover && hover.type !== "string") lift(hover, false); else if (hover) lift(hover, false);
    hover = d; if (d) lift(d, true);
    if (!locked) highlight(d && d.node ? d.node : d && d.type === "string" ? d.a : null, false);
  }
  renderer.domElement.style.cursor = drag ? "grabbing" : d ? (d.drag ? "grab" : "pointer") : (pan ? "grabbing" : "default");
  if (d && !drag && !touchFirst) { tip.textContent = d.title; const off = lens.on && lens.visible ? lens.R * 0.75 : 16; tip.style.transform = "translate(" + (cx + off) + "px," + (cy + off) + "px)"; tip.hidden = false; }
  else tip.hidden = true;
}
const deskPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -(DESK_Y + 0.04)), hitP = new THREE.Vector3();
function deskPoint(cx, cy) {
  const r = renderer.domElement.getBoundingClientRect();
  ndc.set(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1); ray.setFromCamera(ndc, camera);
  return ray.ray.intersectPlane(deskPlane, hitP) ? hitP.clone() : null;
}
const el = renderer.domElement;
function inspHit(cx, cy) {
  const r = renderer.domElement.getBoundingClientRect();
  ndc.set(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1); ray.setFromCamera(ndc, camera);
  return ray.intersectObject(insp.obj, true).length > 0;
}
el.addEventListener("pointerdown", (e) => {
  if (!introState.done) return;
  if (insp.on) { insp.drag = { x: e.clientX, y: e.clientY, pan: insp.panT, moved: false }; el.setPointerCapture(e.pointerId); return; }
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  el.setPointerCapture(e.pointerId);
  if (pointers.size === 2) { drag = null; pan = { pinch: dist2(), zoom: rig.zoom }; return; }
  downAt = { x: e.clientX, y: e.clientY, t: performance.now() };
  const h = pick(e.clientX, e.clientY);
  if (h && h.d.drag) { const p = deskPoint(e.clientX, e.clientY); drag = { d: h.d, start: p, ox: h.d.obj.position.x, oz: h.d.obj.position.z, moved: false }; }
  else pan = { x: e.clientX, pan: rig.pan, h };
  if (exitState.on) return;
  if (touchFirst && lens.on) { lens.visible = true; lens.x = e.clientX; lens.y = e.clientY - el.getBoundingClientRect().top; }
});
function dist2() { const [a, b] = [...pointers.values()]; return Math.hypot(a.x - b.x, a.y - b.y); }
el.addEventListener("pointermove", (e) => {
  const rr = el.getBoundingClientRect();
  rig.par.set((e.clientX - rr.left) / rr.width * 2 - 1, -((e.clientY - rr.top) / rr.height * 2 - 1));
  if (lens.on && (!touchFirst || pointers.size)) { lens.visible = true; lens.x = e.clientX - rr.left; lens.y = e.clientY - rr.top; }
  if (!introState.done) return;
  if (insp.on) {
    insp.tiltT.set(THREE.MathUtils.clamp(((e.clientX - rr.left) / rr.width - 0.5) * 0.35, -0.2, 0.2), THREE.MathUtils.clamp(((e.clientY - rr.top) / rr.height - 0.5) * 0.25, -0.14, 0.14));
    if (insp.drag && Math.abs(e.clientX - insp.drag.x) > 6) { insp.drag.moved = true; insp.panT = THREE.MathUtils.clamp(insp.drag.pan + (e.clientX - insp.drag.x) / rr.width * insp.d * 1.2, -insp.w, insp.w); }
    renderer.domElement.style.cursor = insp.drag && insp.drag.moved ? "grabbing" : "default";
    return;
  }
  if (pointers.has(e.pointerId)) pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (pan && pan.pinch) { if (pointers.size === 2) rig.zoom = THREE.MathUtils.clamp(pan.zoom * pan.pinch / dist2(), 0.45, 1); return; }
  const moved = downAt && Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y) > 6;
  if (drag) {
    if (moved && !drag.moved) { drag.moved = true; drag.d.obj.userData.dragging = true; LC.audio.sfx("pick"); setHover(null); }
    if (drag.moved) {
      const p = deskPoint(e.clientX, e.clientY);
      if (p && drag.start) { drag.d.obj.position.x = THREE.MathUtils.clamp(drag.ox + p.x - drag.start.x, -1.5, 1.65); drag.d.obj.position.z = THREE.MathUtils.clamp(drag.oz + p.z - drag.start.z, 0.12, 1.15); }
    }
    return;
  }
  if (pan && moved && pointers.size) { pan.moved = true; rig.pan = THREE.MathUtils.clamp(pan.pan - (e.clientX - pan.x) / rr.width * 1.6, rig.panMin, rig.panMax); renderer.domElement.style.cursor = "grabbing"; return; }
  if (!pointers.size) setHover(pick(e.clientX, e.clientY), e.clientX, e.clientY);
});
// a tap that opens a dialog must not also "click" the button that appears under the finger
function swallowClick() { const h = (ev) => { if (ev.target !== el) { ev.stopPropagation(); ev.preventDefault(); } }; document.addEventListener("click", h, true); setTimeout(() => document.removeEventListener("click", h, true), 450); }
function endPointer(e) {
  pointers.delete(e.pointerId);
  if (insp.on) {
    const dr = insp.drag; insp.drag = null;
    if (dr && !dr.moved && !insp.back && insp.t >= 1 && !inspHit(e.clientX, e.clientY)) { swallowClick(); if (insp.kind === "folder") UI.closeCase(); else endInspect(); }
    return;
  }
  if (touchFirst) lens.visible = false;
  if (!introState.done) return;
  if (drag) {
    const d = drag.d; drag = null;
    if (d.obj.userData.dragging) {
      d.obj.userData.dragging = false; d.obj.position.y = DESK_Y + 0.0006 + (++topOrder) * 0.0011 + (d.type === "folder" ? 0.009 : 0); d.obj.userData.baseY = d.obj.position.y;
      LC.audio.sfx("drop");
      UI.state.pos3 = UI.state.pos3 || {}; UI.state.pos3[d.id] = { x: +d.obj.position.x.toFixed(3), z: +d.obj.position.z.toFixed(3), rot: +d.obj.rotation.y.toFixed(3) }; UI.save();
    } else activate(d);
    return;
  }
  if (pan && !pan.moved && !pan.pinch && pan.h) activate(pan.h.d);
  else if (pan && !pan.moved && !pan.pinch && !pan.h && locked) { locked = null; highlight(null); }
  if (!pointers.size) pan = null;
}
el.addEventListener("pointerup", endPointer);
el.addEventListener("pointercancel", endPointer);
el.addEventListener("pointerleave", () => { if (!touchFirst) { lens.visible = false; setHover(null); } });
el.addEventListener("wheel", (e) => { e.preventDefault(); if (insp.on) { insp.zoom = THREE.MathUtils.clamp(insp.zoom * (e.deltaY > 0 ? 0.92 : 1.08), 0.8, 2.6); return; } rig.zoom = THREE.MathUtils.clamp(rig.zoom * (e.deltaY > 0 ? 1.08 : 0.92), 0.45, 1); }, { passive: false });

function activate(d) {
  tip.hidden = true; swallowClick();
  switch (d.type) {
    case "ev": { const src = d.obj.children.find((m) => m.isMesh && m.userData.size) || d.obj; if (d.obj.userData && !src.userData.hideRoot) src.userData.hideRoot = d.obj; inspectEvidence(d.id, src); break; }
    case "folder": UI.openFolder(d.id); break;
    case "map": UI.openMapBig(); break;
    case "place": UI.openPlace(d.id); break;
    case "pin": locked = locked === d.id ? null : d.id; highlight(locked, true); LC.audio.sfx("click"); if (locked) UI.toast("Холбоотой баримтууд гэрэлтлээ."); break;
    case "string": UI.toast(d.why); LC.audio.sfx("click"); break;
    case "mag": setLens(true); UI.toast("Томруулдаг шил: хулганаа хөдөлгөөд үз. M товчоор унтраана."); LC.audio.sfx("pick"); break;
    case "lamp": lampOn = !lampOn; setLamp(lampOn); LC.audio.sfx("lamp"); break;
    case "tape": insertTape(d.id); break;
    case "player": if (tv.cur && !tv.anim) ejectTape(); else UI.toast("Тоглуулагч хоосон байна. Ширээн дээрх кассетын нэгийг дарж хий."); break;
    case "tv": if (tv.cur && (tv.state === "playing" || tv.state === "ended")) openTvBig(); else UI.toast("Дохио алга. Кассетыг тоглуулагч руу хий."); break;
    default: break;
  }
}
let lampOn = true;
$("#btnLens").addEventListener("click", () => { setLens(!lens.on); if (lens.on && touchFirst) UI.toast("Хуруугаа дарж хөдөлгөхөд томруулна."); });
document.addEventListener("keydown", (e) => {
  if (UI.isOpen() || e.target.closest("input,textarea")) return;
  if (e.key === "m" || e.key === "M") setLens(!lens.on);
  if (e.key === "l" || e.key === "L") UI.openList();
});

/* ============================== intro ============================== */
const introState = { done: false, t: 0, on: false };
const INTRO_POSE = { pos: new THREE.Vector3(-0.15, 1.55, 3.45), look: new THREE.Vector3(-0.05, 1.5, 0), fov: 50 };
// visitor path: inside the corridor, on the line from the corridor light through the doorway
const LP = new THREE.Vector3(-3.5, 0, 6.95), DOORC = new THREE.Vector3(-2.4, 0, 4.6);
function visitorAt(k) { return LP.clone().lerp(DOORC, k); }
function setDoor(v) { doorRig.open = v; if (doorRig.hinge) doorRig.hinge.rotation.y = v * 1.35; }
function playIntro() {
  if (reduceMotion) { finishIntro(true); return; }
  introState.on = true; introState.done = false; introState.t = 0; introState.flags = {};
  $("#intro").hidden = false; $("#intro").classList.remove("out"); $("#introTitle").classList.remove("on");
  rig.pan = 0; rig.zoom = 1; rig.pos.copy(INTRO_POSE.pos); rig.look.copy(INTRO_POSE.look); rig.fov = INTRO_POSE.fov; camAnim.t = 1;
  Object.assign(lightTarget, { lamp: 0, bulb: 0, bulbE: 0, board: 0, hemi: 0.015, door: 0 }); Object.assign(lightNow, lightTarget);
  setLens(false); setDoor(0);
  const v = visitorRig.obj;
  if (v) { v.visible = true; v.position.copy(visitorAt(0.45)); }
  LC.audio.init(); if (!LC.audio.get().muted) LC.audio.ambient(true);
}
function introTick(dt) {
  const s = introState; s.t += dt; const t = s.t, f = s.flags;
  const once = (k, fn) => { if (!f[k]) { f[k] = 1; fn(); } };
  if (t > 0.5) once("door", () => LC.audio.sfx("door"));
  // the real door swings open behind you; the corridor light pours in through the doorway
  setDoor(THREE.MathUtils.smoothstep(t, 0.6, 2.4) * (1 - THREE.MathUtils.smoothstep(t, 7.0, 8.2)));
  lightTarget.door = doorRig.open > 0.02 ? 150 : 0; lightNow.door = lightTarget.door;
  // the man stands in the corridor, then walks slowly toward the door: his shadow shrinks and sharpens on the board
  const v = visitorRig.obj;
  if (v) {
    const k = THREE.MathUtils.smoothstep(t, 2.6, 5.6), walking = t > 2.6 && t < 5.6;
    v.position.copy(visitorAt(0.45 + 0.45 * k));
    v.lookAt(lights.door.position.x, 0, lights.door.position.z);             // the cards always face the light: a full silhouette
    const w = THREE.MathUtils.smoothstep(t, 2.45, 2.9) * (1 - THREE.MathUtils.smoothstep(t, 5.3, 5.75));
    visitorPose((t - 2.6) * Math.PI / 0.7, w, t);                              // one step every 0.7 s
    if (!walking) v.position.y = 0;
  }
  [3.3, 4.0, 4.7, 5.4].forEach((st, i) => { if (t > st) once("st" + i, () => LC.audio.sfx("step")); });   // in time with the feet landing
  if (t > 5.0) once("title", () => $("#introTitle").classList.add("on"));
  if (t > 6.6) once("lamp", () => { setLamp(true); lightTarget.board = 12; lightTarget.hemi = 0.3; LC.audio.sfx("lamp"); });
  if (t > 7.0) once("cam", () => applyBase(false));
  if (t > 7.2) once("close", () => LC.audio.sfx("door_close"));
  if (t > 8.3) once("gone", () => { if (v) v.visible = false; });
  if (t > 9.6) finishIntro(false);
}
function finishIntro(instant) {
  introState.on = false; introState.done = true; if (visitorRig.obj) visitorRig.obj.visible = false;
  setDoor(0); lightTarget.door = 0; lightNow.door = 0;
  setLamp(lampOn, instant); lightTarget.board = 12; lightTarget.hemi = 0.3; if (instant) Object.assign(lightNow, lightTarget);
  if (instant) applyBase(true);
  const i = $("#intro"); i.classList.add("out"); setTimeout(() => { i.hidden = true; }, 600);
  try { localStorage.setItem("lastcase-intro", "1"); } catch (e) { /* ignore */ }
  if (!touchFirst) setLens(true);
  UI.toast(touchFirst ? "Баримт дээр дарж нээнэ. Хоосон газрыг чирч эргэн тойрноо харна." : "Хулганаар томруулж харна. Дарж нээнэ, чирч зөөнө. M = томруулдаг шил.");
}
$("#introSkip").addEventListener("click", () => finishIntro(true));
$("#btnIntro").addEventListener("click", () => { ["#reader", "#folder", "#final", "#list"].forEach((s) => { $(s).hidden = true; }); playIntro(); });

/* ============================== leaving the room: turn, open the door, walk out, close it ============================== */
const exitState = { on: false, t: 0, flags: {}, done: null };
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const EXIT_KEYS = [   // [time, camera position, look-at point]
  [0.0, null, null],
  [1.8, V3(-0.3, 1.58, 2.7), V3(-2.4, 1.3, 4.6)],     // turn round to face the door
  [4.4, V3(-2.38, 1.6, 3.75), V3(-2.4, 1.45, 6.5)],   // walk to it (it opens on the way)
  [6.0, V3(-2.42, 1.6, 5.55), V3(-2.4, 1.5, 7.6)],    // through it, into the corridor
  [7.4, V3(-2.3, 1.6, 6.6), V3(-2.4, 1.3, 4.0)]       // turn back: the room, the lamp, the board
];
function exitRoom(done) {
  ["#reader", "#folder", "#final", "#list"].forEach((q) => { $(q).hidden = true; });
  setLens(false); locked = null; highlight(null); tip.hidden = true;
  if (reduceMotion) { done(); return; }
  exitState.on = true; exitState.t = 0; exitState.flags = {}; exitState.done = done;
  EXIT_KEYS[0][1] = rig.pos.clone().add(V3(rig.pan, 0, 0)); EXIT_KEYS[0][2] = rig.look.clone().add(V3(rig.pan, 0, 0));
  rig.pan = 0; rig.zoom = 1; camAnim.t = 1;
  document.body.classList.add("leaving");
}
function exitTick(dt) {
  const s = exitState; s.t += dt; const t = s.t, f = s.flags;
  const once = (k, fn) => { if (!f[k]) { f[k] = 1; fn(); } };
  let i = 0; while (i < EXIT_KEYS.length - 2 && t > EXIT_KEYS[i + 1][0]) i++;
  const [t0, p0, l0] = EXIT_KEYS[i], [t1, p1, l1] = EXIT_KEYS[i + 1];
  const k = ease(THREE.MathUtils.clamp((t - t0) / (t1 - t0), 0, 1));
  rig.pos.lerpVectors(p0, p1, k); rig.look.lerpVectors(l0, l1, k); rig.fov = THREE.MathUtils.lerp(rig.fov, 55, dt * 2);
  if (t > 2.4) once("open", () => LC.audio.sfx("door"));
  const open = THREE.MathUtils.smoothstep(t, 2.4, 3.8) * (1 - THREE.MathUtils.smoothstep(t, 7.8, 9.0));
  setDoor(open);
  lightTarget.door = open > 0.02 ? 45 : 0; lightNow.door = lightTarget.door;   // softer when you are standing next to the lamp
  lightNow.hall = 2.5 * THREE.MathUtils.smoothstep(t, 0.2, 1.4) + 5.5 * THREE.MathUtils.smoothstep(t, 2.4, 3.6);
  lightTarget.hemi = 0.3 + 0.5 * THREE.MathUtils.smoothstep(t, 0.2, 1.6);
  [2.2, 2.9, 3.6, 4.3, 5.0, 5.7].forEach((st, n) => { if (t > st) once("st" + n, () => LC.audio.sfx("step")); });
  if (t > 7.9) once("close", () => LC.audio.sfx("door_close"));
  if (t > 9.2) once("end", () => { s.on = false; document.body.classList.remove("leaving"); if (s.done) s.done(); });
}

/* ============================== finale (all folders open): the strings light up ============================== */
function finale() {
  lightTarget.board = 16; lightTarget.hemi = 0.4;
  board.edges.forEach(({ mesh }) => { mesh.material.emissive.setHex(0xff2a1a); mesh.material.emissiveIntensity = 0.8; });
}

/* ============================== picking things up: documents and case folders, in 3D ============================== */
// A clicked document is lifted off the desk / board and brought in front of you as a real sheet (hi-res texture drawn
// from the same data), lit by a reading light while the room dims. A clicked case folder comes up as a 3D folder:
// the cover is a real hinged panel that swings open to show the ID card, the evidence envelope and the typed report.
scene.add(camera);
const insp = { on: false, obj: null, src: null, from: null, t: 0, dur: 0.75, back: false, tilt: new THREE.Vector2(), tiltT: new THREE.Vector2(),
  zoom: 1, pan: 0, panT: 0, d: 0.45, w: 0.21, h: 0.3, cs: null, cover: null, open: 0, openT: 0, onClosed: null, drag: null, kind: "" };
const dim = new THREE.Mesh(new THREE.PlaneGeometry(6, 6), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0, depthWrite: false }));
dim.position.z = -1.2; dim.renderOrder = -1; camera.add(dim);
const readLight = new THREE.PointLight(0xffe3c2, 0, 2.2, 1.4); readLight.position.set(0.18, 0.22, 0.05); camera.add(readLight);
const IMGSRC = {};
function imgSrc(src) { return IMGSRC[src] || null; }

// ---- hi-res document drawing: walks the evidence HTML and lays it out like a typed page ----
function wrapM(c, text, x, y, w, lh, draw) {
  for (const para of String(text).split("\n")) {
    const words = para.trim().split(/\s+/); let line = "";
    if (!para.trim()) continue;
    for (const wd of words) {
      const t = line ? line + " " + wd : wd;
      if (c.measureText(t).width > w && line) { if (draw) c.fillText(line, x, y); y += lh; line = wd; } else line = t;
    }
    if (line) { if (draw) c.fillText(line, x, y); y += lh; }
  }
  return y;
}
function flow(c, html, X, Y, W, draw, news) {
  const root = new DOMParser().parseFromString("<div>" + html + "</div>", "text/html").body.firstChild;
  let y = Y;
  const INK = "#221a14", BLUE = "#1f2a44", RED = "#8e2016", GREY = "#6b5a4c";
  const txt = (font, color, s, lh, indent = 0) => { c.font = font; c.fillStyle = color; y = wrapM(c, s, X + indent, y, W - indent, lh, draw); };
  const leader = (yy) => { if (!draw) return; c.fillStyle = "rgba(60,40,30,.45)"; for (let xx = X; xx < X + W; xx += 7) c.fillRect(xx, yy, 2, 2); };
  function walk(node) {
    for (const n of node.childNodes) {
      if (n.nodeType === 3) { const t = n.textContent.trim(); if (t) txt("26px " + FONT.serif, INK, t, 38); continue; }
      if (n.nodeType !== 1) continue;
      const tag = n.tagName, cls = n.getAttribute("class") || "";
      if (tag === "TABLE") {
        for (const tr of n.querySelectorAll("tr")) {
          const th = tr.querySelector("th"), td = tr.querySelector("td");
          const y0 = y + 30;
          c.font = "22px " + FONT.mono; c.fillStyle = GREY; if (draw) wrapM(c, (th ? th.textContent : "").toUpperCase(), X, y0, W * 0.36, 30, true);
          const yl = wrapM(c, (th ? th.textContent : "").toUpperCase(), X, y0, W * 0.36, 30, false);
          c.font = "700 30px " + FONT.mono; c.fillStyle = BLUE;
          const yv = wrapM(c, td ? td.textContent : "", X + W * 0.4, y0, W * 0.6, 40, draw);
          y = Math.max(yl, yv) + 2; leader(y - 18); y += 6;
        }
        y += 14;
      } else if (tag === "H3" || tag === "H4") { y += 14; txt("700 28px " + FONT.mono, RED, n.textContent.toUpperCase(), 38); y += 4; }
      else if (tag === "P") {
        const f = /hand/.test(cls) ? (/big/.test(cls) ? "36px " : "30px ") + FONT.hand : /mono|big/.test(cls) ? "700 25px " + FONT.mono : /small/.test(cls) ? "italic 19px " + FONT.serif : (news ? "24px " : "26px ") + FONT.serif;
        const col = /hand/.test(cls) ? BLUE : /small/.test(cls) ? GREY : INK;
        txt(f, col, n.textContent.replace(/\s+/g, " ").trim(), /hand/.test(cls) ? 46 : 38); y += 10;
      } else if (tag === "IMG") {
        const im = imgSrc(n.getAttribute("src")); if (!im) continue;
        const iw = Math.min(W, im.width * 1.4), ih = Math.min(iw * im.height / im.width, 620), w2 = ih * im.width / im.height;
        const ix = X + (W - w2) / 2;
        if (draw) {
          c.save(); c.translate(ix + w2 / 2, y + 14 + ih / 2); c.rotate((cls.includes("fp") ? 0 : -0.012));
          c.shadowColor = "rgba(0,0,0,.35)"; c.shadowBlur = 14; c.shadowOffsetY = 6; c.fillStyle = "#f6f2e8"; c.fillRect(-w2 / 2 - 12, -ih / 2 - 12, w2 + 24, ih + 24);
          c.shadowColor = "transparent"; c.drawImage(im, -w2 / 2, -ih / 2, w2, ih); c.restore();
        }
        y += ih + 44;
      } else if (tag === "UL") {
        const items = [...n.querySelectorAll("li")].map((l) => l.textContent.trim()); const colW = W / 2;
        c.font = "24px " + FONT.mono; c.fillStyle = INK;
        items.forEach((s, i) => { const xx = X + (i % 2) * colW, yy = y + 30 + Math.floor(i / 2) * 36; if (draw) { c.strokeStyle = INK; c.lineWidth = 2; c.strokeRect(xx, yy - 19, 18, 18); c.fillText(s, xx + 28, yy); } });
        y += Math.ceil(items.length / 2) * 36 + 24;
      } else if (tag === "SPAN") { txt("700 20px " + FONT.mono, GREY, n.textContent, 30); }
      else if (/portrait/.test(cls)) continue;
      else { if (/proj/.test(cls)) { y += 6; if (draw) { c.fillStyle = "rgba(142,32,22,.6)"; c.fillRect(X - 18, y + 8, 3, 0); } } walk(n); }
    }
  }
  walk(root);
  return y;
}
function docCanvas(ev) {
  if (ev.note) {
    const c = canvas(1000, 1000), x = c.getContext("2d");
    photoBg(x, IMG.paper, 1000, 1000, "#f1d64e");
    const g = x.createLinearGradient(0, 0, 0, 120); g.addColorStop(0, "rgba(120,90,0,.2)"); g.addColorStop(1, "rgba(0,0,0,0)"); x.fillStyle = g; x.fillRect(0, 0, 1000, 120);
    x.fillStyle = "#1f2a44"; x.font = "52px " + FONT.hand; wrap(x, plainText(ev.html), 70, 170, 860, 72, 11);
    return c;
  }
  const news = ev.kind === "news", W = 1100, X = 90, CW = W - 180;
  const meas = canvas(W, 10).getContext("2d");
  let need = flow(meas, ev.html, X, 260, CW, false, news) + 160;
  const H = Math.max(Math.round(W * 1.414), need);
  const c = canvas(W, H), x = c.getContext("2d");
  photoBg(x, IMG.paper, W, H, news ? "#cfcbc0" : "rgba(250,240,218,.28)", news ? "color" : "screen");
  if (news) { x.fillStyle = "rgba(214,210,200,.5)"; x.fillRect(0, 0, W, H); }
  // edge wear
  const vg = x.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.45, W / 2, H / 2, Math.max(W, H) * 0.75); vg.addColorStop(0, "rgba(0,0,0,0)"); vg.addColorStop(1, "rgba(90,60,20,.28)"); x.fillStyle = vg; x.fillRect(0, 0, W, H);
  if (news) {
    x.fillStyle = "#1e1b18"; x.font = "700 64px " + FONT.serif; x.textAlign = "center"; x.fillText("ӨДРИЙН СОНИН", W / 2, 110); x.textAlign = "left";
    x.fillRect(X, 132, CW, 5); x.fillRect(X, 142, CW, 2);
    x.font = "700 48px " + FONT.serif; wrap(x, ev.title, X, 210, CW, 54, 2);
  } else {
    x.fillStyle = "#b8251f"; x.font = "700 30px " + FONT.mono; x.fillText(ev.file, X, 110);
    x.fillStyle = "#6b5a4c"; x.font = "20px " + FONT.mono; x.fillText("ХЭРЭГ № 2026-334", W - X - 230, 110);
    x.fillStyle = "#1d1714"; x.font = "700 44px " + FONT.mono; wrap(x, ev.title, X, 180, CW - 40, 52, 2);
    x.fillStyle = "rgba(40,30,25,.7)"; x.fillRect(X, 228, CW, 3); x.fillRect(X, 236, CW, 1);
  }
  flow(x, ev.html, X, news ? 260 : 270, CW, true, news);
  if (ev.stamp) stamp(x, ev.stamp, W - 280, 330, 46);
  x.fillStyle = "rgba(60,45,35,.6)"; x.font = "18px " + FONT.mono; x.fillText("THE LAST CASE", X, H - 60);
  return c;
}

// ---- the case folder pieces ----
function coverCanvas(cs, open) {
  const W = 900, H = 1160, c = canvas(W, H), x = c.getContext("2d");
  photoBg(x, IMG.kraft, W, H, "#e8c98a");
  const vg = x.createRadialGradient(W / 2, H / 2, 300, W / 2, H / 2, 820); vg.addColorStop(0, "rgba(0,0,0,0)"); vg.addColorStop(1, "rgba(70,40,10,.35)"); x.fillStyle = vg; x.fillRect(0, 0, W, H);
  x.save(); x.translate(90, 180); x.rotate(-0.012);
  photoBg(x, IMG.paper, 560, 170, "rgba(255,255,255,.72)", "screen");
  x.fillStyle = "#b8251f"; x.font = "700 30px " + FONT.mono; x.fillText("ХЭРГИЙН ХАВТАС № 2026-334-" + cs.no, 26, 52);
  x.fillStyle = "#1f2a44"; x.font = "52px " + FONT.hand; x.fillText(cs.title, 26, 130);
  x.restore();
  x.fillStyle = "rgba(40,25,10,.55)"; x.font = "26px " + FONT.mono; x.fillText("ХЭРЭГ: THE LAST CASE", 90, 460); x.fillText("ХЭРГИЙН ХҮН: " + C.person.name.toUpperCase(), 90, 504);
  x.strokeStyle = "rgba(40,25,10,.4)"; x.lineWidth = 2; for (let i = 0; i < 5; i++) { x.beginPath(); x.moveTo(90, 580 + i * 56); x.lineTo(W - 90, 580 + i * 56); x.stroke(); }
  stamp(x, open ? "НЭЭГДСЭН" : "НУУЦ", W - 250, H - 190, 74, open ? "rgba(40,120,70,.85)" : "rgba(178,34,30,.85)", -0.16);
  return c;
}
function plainKraft(seed) { const c = canvas(512, 660), x = c.getContext("2d"); photoBg(x, IMG.kraft, 512, 660, "#e3c288"); return c; }
function todayStr() { const d = new Date(); return d.getFullYear() + "." + String(d.getMonth() + 1).padStart(2, "0") + "." + String(d.getDate()).padStart(2, "0"); }
function idCardCanvas(cs) {
  const W = 1000, H = 680, c = canvas(W, H), x = c.getContext("2d"), P = C.person;
  photoBg(x, IMG.paper, W, H, "rgba(246,236,212,.55)", "screen");
  x.strokeStyle = "rgba(90,55,30,.6)"; x.lineWidth = 2; x.strokeRect(18, 18, W - 36, H - 36);
  x.fillStyle = "#7a2a1a"; x.font = "700 30px " + FONT.mono; x.fillText("ХЭРГИЙН ХҮНИЙ ҮНЭМЛЭХ", 50, 76); x.fillText("№ 334-" + cs.no, W - 250, 76);
  x.fillRect(50, 96, W - 100, 2);
  const im = imgSrc(cs.photo || P.photo) || IMG.fp;
  x.save(); x.translate(60, 130); x.rotate(-0.025); x.fillStyle = "#f4efe4"; x.shadowColor = "rgba(0,0,0,.35)"; x.shadowBlur = 10; x.fillRect(0, 0, 270, 340); x.shadowColor = "transparent";
  if (im) { x.filter = "sepia(.45) contrast(1.05)"; coverImage(x, im, 12, 12, 246, 280); x.filter = "none"; }
  x.fillStyle = "#2b2622"; x.font = "24px " + FONT.hand; x.textAlign = "center"; x.fillText(cs.caption || "Хэргийн хүн", 135, 326); x.textAlign = "left"; x.restore();
  const rows = [["ОВОГ НЭР", P.name], ["ТӨРСӨН ГАЗАР", "Дундговь, Сайнцагаан"], ["СУРГУУЛЬ", "СЭЗИС, МСМТ, 3-р курс"], ["АНГИЛАЛ", cs.title]];
  rows.forEach(([k, v], i) => { const yy = 150 + i * 88; x.fillStyle = "#7a6a5c"; x.font = "20px " + FONT.mono; x.fillText(k, 380, yy); x.fillStyle = "#1f2a44"; x.font = "700 30px " + FONT.mono; x.fillText(v, 380, yy + 38); x.fillStyle = "rgba(60,40,30,.45)"; for (let xx = 380; xx < W - 60; xx += 8) x.fillRect(xx, yy + 50, 3, 3); });
  if (IMG.fp) [[34, 92], [77, 92], [126, 92], [172, 92]].forEach(([cx, cy], i) => { x.globalCompositeOperation = "multiply"; x.drawImage(IMG.fp, cx - 20, cy - 28, 40, 56, 60 + i * 96, 520, 80, 112); x.globalCompositeOperation = "source-over"; x.strokeStyle = "rgba(90,55,30,.5)"; x.strokeRect(60 + i * 96, 520, 80, 112); });
  x.save(); x.translate(W - 140, H - 130); x.rotate(-0.25); x.strokeStyle = "rgba(110,30,90,.7)"; x.lineWidth = 5; x.beginPath(); x.arc(0, 0, 82, 0, Math.PI * 2); x.stroke(); x.lineWidth = 2; x.beginPath(); x.arc(0, 0, 70, 0, Math.PI * 2); x.stroke();
  x.fillStyle = "rgba(110,30,90,.75)"; x.font = "700 44px " + FONT.serif; x.textAlign = "center"; x.fillText("334", 0, 16); x.font = "700 13px " + FONT.mono; x.fillText("THE LAST CASE", 0, -36); x.textAlign = "left"; x.restore();
  return c;
}
function envelopeCanvas(cs) {
  const W = 800, H = 980, c = canvas(W, H), x = c.getContext("2d");
  photoBg(x, IMG.kraft, W, H, "rgba(205,160,95,.5)");
  // flap
  x.save(); x.beginPath(); x.moveTo(0, 0); x.lineTo(W, 0); x.lineTo(W, 60); x.lineTo(W / 2, 330); x.lineTo(0, 60); x.closePath(); x.clip();
  photoBg(x, IMG.kraft, W, 340, "rgba(170,125,70,.55)"); x.restore();
  x.strokeStyle = "rgba(60,35,10,.5)"; x.lineWidth = 3; x.beginPath(); x.moveTo(0, 60); x.lineTo(W / 2, 330); x.lineTo(W, 60); x.stroke();
  const btn = (yy) => { const g = x.createRadialGradient(W / 2 - 6, yy - 6, 4, W / 2, yy, 30); g.addColorStop(0, "#d9b47a"); g.addColorStop(1, "#5c3e1c"); x.fillStyle = g; x.beginPath(); x.arc(W / 2, yy, 28, 0, Math.PI * 2); x.fill(); x.fillStyle = "#3a2610"; x.beginPath(); x.arc(W / 2, yy, 8, 0, Math.PI * 2); x.fill(); };
  btn(300); btn(420);
  x.strokeStyle = "#efe3c4"; x.lineWidth = 4; x.beginPath(); x.moveTo(W / 2, 300); x.bezierCurveTo(W / 2 + 60, 330, W / 2 - 50, 380, W / 2, 420); x.moveTo(W / 2, 420); x.bezierCurveTo(W / 2 - 70, 400, W / 2 + 40, 340, W / 2, 300); x.stroke();
  x.save(); x.translate(80, 520); x.rotate(-0.05); x.strokeStyle = "#a8231c"; x.lineWidth = 6; x.strokeRect(0, 0, 420, 76); x.fillStyle = "#a8231c"; x.font = "700 46px " + FONT.mono; x.fillText("НОТЛОХ БАРИМТ", 18, 56); x.restore();
  [["ХЭРГИЙН №", "2026-334-" + cs.no], ["ОГНОО", todayStr()], ["АГУУЛГА", cs.title]].forEach(([k, v], i) => {
    const yy = 680 + i * 80; x.fillStyle = "#5a3e24"; x.font = "22px " + FONT.mono; x.fillText(k, 80, yy); x.fillStyle = "#1f2a44"; x.font = "34px " + FONT.hand; x.fillText(v, 290, yy); x.fillStyle = "rgba(60,35,15,.6)"; x.fillRect(80, yy + 14, W - 160, 2);
  });
  stamp(x, "НУУЦ", W - 170, H - 70, 40, "rgba(168,35,28,.8)", -0.24);
  return c;
}
function tagCanvas(note) {
  const W = 420, H = 560, c = canvas(W, H), x = c.getContext("2d");
  x.beginPath(); x.moveTo(90, 0); x.lineTo(W - 90, 0); x.lineTo(W, 80); x.lineTo(W, H); x.lineTo(0, H); x.lineTo(0, 80); x.closePath(); x.clip();
  photoBg(x, IMG.kraft, W, H, "rgba(240,215,160,.55)", "screen");
  x.fillStyle = "#f3ead6"; x.beginPath(); x.arc(W / 2, 56, 30, 0, Math.PI * 2); x.fill(); x.fillStyle = "#2a1c10"; x.beginPath(); x.arc(W / 2, 56, 15, 0, Math.PI * 2); x.fill();
  x.fillStyle = "#7a2a1a"; x.font = "700 22px " + FONT.mono; x.fillText("МӨРДӨГЧИЙН ТЭМДЭГЛЭЛ", 30, 140);
  x.fillStyle = "#1f2a44"; x.font = "36px " + FONT.hand; wrap(x, note || "хоосон", 30, 210, W - 60, 50, 7);
  return c;
}
function reportCanvas(cs) {
  const W = 1100, P = C.person, qa = cs.iv.qa.filter((q) => q[1] && String(q[1]).trim());
  const meas = canvas(W, 10).getContext("2d"); let need = 560;
  qa.forEach((q) => { meas.font = "24px " + FONT.mono; need = wrapM(meas, "А" + ". " + q[0], 90, need, W - 180, 40, false) + 6; meas.font = "27px " + FONT.mono; need = wrapM(meas, "Х. " + q[1], 90, need, W - 180, 40, false) + 26; });
  const H = Math.max(Math.round(W * 1.414), need + 260), c = canvas(W, H), x = c.getContext("2d");
  photoBg(x, IMG.paper, W, H, "rgba(255,250,238,.55)", "screen");
  const vg = x.createRadialGradient(W / 2, H / 2, 500, W / 2, H / 2, 1100); vg.addColorStop(0, "rgba(0,0,0,0)"); vg.addColorStop(1, "rgba(90,60,20,.25)"); x.fillStyle = vg; x.fillRect(0, 0, W, H);
  // seal + heading
  x.save(); x.translate(160, 160); x.rotate(-0.15); x.strokeStyle = "rgba(31,42,68,.75)"; x.lineWidth = 5; x.beginPath(); x.arc(0, 0, 70, 0, Math.PI * 2); x.stroke(); x.lineWidth = 2; x.beginPath(); x.arc(0, 0, 58, 0, Math.PI * 2); x.stroke();
  x.fillStyle = "rgba(31,42,68,.8)"; x.font = "700 40px " + FONT.serif; x.textAlign = "center"; x.fillText(cs.no, 0, 14); x.font = "700 11px " + FONT.mono; x.fillText("МӨРДӨН БАЙЦААЛТ", 0, -32); x.textAlign = "left"; x.restore();
  x.fillStyle = "#6b5a54"; x.font = "20px " + FONT.mono; x.fillText("ХЭРГИЙН ХАВТАС № 2026-334-" + cs.no, 270, 120);
  x.fillStyle = "#1d1714"; x.font = "700 60px " + FONT.serif; x.fillText("ХЭРГИЙН ТАЙЛАН", 270, 186);
  x.fillStyle = "#6b5a54"; x.font = "20px " + FONT.mono; x.fillText("БАЙЦААЛТЫН ТЭМДЭГЛЭЛ", 270, 222);
  x.fillStyle = "#3a2a20"; x.fillRect(90, 262, W - 180, 4); x.fillRect(90, 272, W - 180, 1.5);
  [["ХЭРГИЙН ХҮН", P.name], ["АНГИЛАЛ", cs.title], ["БАЙЦААСАН", "мөрдөгч (та)"], ["ОГНОО", todayStr()]].forEach(([k, v], i) => {
    const xx = 90 + (i % 2) * 470, yy = 330 + Math.floor(i / 2) * 92;
    x.fillStyle = "#7a6a5c"; x.font = "19px " + FONT.mono; x.fillText(k, xx, yy); x.fillStyle = "#1f2a44"; x.font = "700 28px " + FONT.mono; x.fillText(v, xx, yy + 38); x.fillStyle = "rgba(60,40,30,.55)"; x.fillRect(xx, yy + 50, 430, 2);
  });
  x.fillStyle = "#7a2a1a"; x.font = "700 24px " + FONT.mono; x.fillText("МЭДҮҮЛЭГ", 90, 540);
  let y = 590;
  x.strokeStyle = "rgba(70,100,160,.3)"; x.lineWidth = 1.5; for (let ly = 600; ly < H - 220; ly += 40) { x.beginPath(); x.moveTo(90, ly); x.lineTo(W - 90, ly); x.stroke(); }
  if (!qa.length) { x.fillStyle = "#6b5a54"; x.font = "26px " + FONT.mono; x.fillText("Мэдүүлэг хараахан бүртгэгдээгүй.", 90, y); }
  qa.forEach((q, n) => {
    x.fillStyle = "#6b5a54"; x.font = "24px " + FONT.mono; y = wrapM(x, "А" + (n + 1) + ". " + q[0], 90, y, W - 180, 40, true) + 6;
    x.fillStyle = "#1f2a44"; x.font = "27px " + FONT.mono; y = wrapM(x, "Х. " + q[1], 90, y, W - 180, 40, true) + 26;
  });
  x.fillStyle = "#1f2a44"; x.font = "54px " + FONT.hand; x.save(); x.translate(90, H - 150); x.rotate(-0.06); x.fillText(P.name.split(" ").pop(), 0, 0); x.restore();
  x.fillStyle = "#6b5a54"; x.fillRect(90, H - 128, 360, 2); x.font = "16px " + FONT.mono; x.fillText("мэдүүлэг өгсөн хүний гарын үсэг", 90, H - 104);
  stamp(x, "НЭЭГДСЭН", W - 260, H - 140, 46, "rgba(40,120,70,.85)", -0.17);
  x.save(); x.globalAlpha = 0.09; stamp(x, "CONFIDENTIAL", W / 2, H / 2, 96, "rgba(168,35,28,1)", -0.42); x.restore();
  return c;
}
function flatSheet(cnv, w, z = 0) {           // a flat printed piece (card, envelope, tag) with a hair of thickness
  const h = w * cnv.height / cnv.width, m = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.0012), [0, 0, 0, 0, 0, 0].map((_, i) => i === 4 ? new THREE.MeshStandardMaterial({ map: texFrom(cnv), roughness: 0.9 }) : new THREE.MeshStandardMaterial({ color: 0xd8c9a8, roughness: 0.95 })));
  m.position.z = z; m.castShadow = true; m.receiveShadow = true; return m;
}
function buildDossier(cs, open) {
  const W = 0.24, H = 0.31, T = 0.004, kraftM = () => new THREE.MeshStandardMaterial({ map: texFrom(plainKraft()), roughness: 0.92, color: 0xf0dcb0 });
  const g = new THREE.Group();
  const base = new THREE.Mesh(new THREE.BoxGeometry(W, H, T), [kraftM(), kraftM(), kraftM(), kraftM(), kraftM(), kraftM()]);
  base.position.set(W / 2, 0, 0); base.castShadow = base.receiveShadow = true; g.add(base);
  const page = sheet(reportCanvas(cs), 0.215, 0.0015); page.position.set(W / 2 + 0.004, -0.004, T / 2 + 0.0012); g.add(page);
  const under = sheet(reportCanvas(cs), 0.215, 0.001); under.position.set(W / 2 + 0.008, -0.009, T / 2 + 0.0004); under.rotation.z = -0.02; g.add(under);
  const pivot = new THREE.Group(); pivot.position.set(0, 0, T / 2 + 0.006); g.add(pivot);
  const coverMats = [kraftM(), kraftM(), kraftM(), kraftM(), new THREE.MeshStandardMaterial({ map: texFrom(coverCanvas(cs, open)), roughness: 0.9 }), kraftM()];
  const cover = new THREE.Mesh(new THREE.BoxGeometry(W, H, T), coverMats); cover.position.set(W / 2, 0, 0); cover.castShadow = cover.receiveShadow = true; pivot.add(cover);
  const tab = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.022, T), kraftM()); tab.position.set(W - 0.06, H / 2 + 0.011, 0); pivot.add(tab);
  // inside of the cover (faces -z while closed, +z once the cover is swung open)
  const inside = new THREE.Group(); inside.position.set(W / 2, 0, -T / 2 - 0.0008); inside.rotation.y = Math.PI; pivot.add(inside);
  const id = flatSheet(idCardCanvas(cs), 0.2, 0.0006); id.position.set(0.004, 0.072, 0.0006); id.rotation.z = 0.025; inside.add(id);
  const qa = cs.iv.qa.filter((q) => q[1] && String(q[1]).trim()), note = cs.iv.note || (qa[0] ? qa[0][1] : "");
  const tagM = flatSheet(tagCanvas(note), 0.07, 0.0003); tagM.position.set(0.06, -0.035, 0.0003); tagM.rotation.z = -0.16; inside.add(tagM);
  const env = flatSheet(envelopeCanvas(cs), 0.13, 0.0012); env.position.set(-0.02, -0.07, 0.0012); env.rotation.z = -0.035; inside.add(env);
  g.userData = { pivot, cover, W, H };
  return g;
}

// ---- the "in your hands" pose and its animation ----
function fitDistance(w, h) {
  const v = THREE.MathUtils.degToRad(camera.fov), tv = Math.tan(v / 2), a = camera.aspect;
  return Math.max(h / (0.8 * 2 * tv), w / (0.9 * 2 * tv * a));
}
function beginInspect(obj, srcObj, w, h, kind) {
  if (insp.on) return;
  setHover(null); tip.hidden = true; locked = null; highlight(null);
  insp.on = true; insp.back = false; insp.t = 0; insp.obj = obj; insp.src = srcObj; insp.kind = kind; insp.zoom = 1; insp.pan = insp.panT = 0; insp.tiltT.set(0, 0);
  insp.w = w; insp.h = h; insp.d = fitDistance(w, h);
  srcObj.updateMatrixWorld(true);
  const from = { pos: new THREE.Vector3(), quat: new THREE.Quaternion(), s: 1 };
  srcObj.getWorldPosition(from.pos); srcObj.getWorldQuaternion(from.quat);
  const sw = (srcObj.userData.size && srcObj.userData.size[0]) || w; from.s = sw / w;
  insp.from = from;
  obj.position.copy(from.pos); obj.quaternion.copy(from.quat); obj.scale.setScalar(from.s);
  obj.traverse((m) => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
  scene.add(obj);
  (srcObj.userData.hideRoot || srcObj).visible = false;
  LC.audio.sfx("pick");
  document.body.classList.add("inspecting");
}
function endInspect(after) {
  if (!insp.on || insp.back) return;
  insp.back = true; insp.t = 0; insp.onClosed = after || null;
  insp.openT = 0;
  insp.backFrom = { pos: insp.obj.position.clone(), quat: insp.obj.quaternion.clone(), s: insp.obj.scale.x };
  LC.audio.sfx("drop");
  $("#inspBar").hidden = true; $("#caseBar").hidden = true; $("#pzPanel").hidden = true;
}
const _lp = new THREE.Vector3(), _lq = new THREE.Quaternion(), _e = new THREE.Euler();
function inspectTarget() {
  const portrait = camera.aspect < 0.8, folder = insp.kind === "folder";
  let d = insp.d / insp.zoom;
  // a closed folder with the puzzle beside it sits a bit to the side
  const locked = folder && insp.openT < 0.5 && !$("#pzPanel").hidden;
  const sideX = locked ? (portrait ? 0 : -0.24 * d) : 0, sideY = locked && portrait ? 0.18 * d : 0.03 * d;
  const centre = folder ? -(insp.obj.userData.W / 2) * (1 - insp.open) : 0;   // closed: centre of the cover; open: the spine
  _lp.set(sideX + insp.pan + centre, sideY, -d);
  _e.set(-0.12 + insp.tilt.y, insp.tilt.x, folder ? 0 : -0.02); _lq.setFromEuler(_e);
  return { pos: camera.localToWorld(_lp.clone()), quat: camera.quaternion.clone().multiply(_lq) };
}
function inspectTick(dt) {
  dim.material.opacity += ((insp.on && !insp.back ? 0.62 : 0) - dim.material.opacity) * Math.min(1, dt * 6);
  readLight.intensity += ((insp.on && !insp.back ? 0.9 : 0) - readLight.intensity) * Math.min(1, dt * 6);
  if (!insp.on) return;
  insp.tilt.lerp(insp.tiltT, Math.min(1, dt * 6));
  insp.pan += (insp.panT - insp.pan) * Math.min(1, dt * 8);
  if (insp.kind === "folder") {
    insp.open += (insp.openT - insp.open) * Math.min(1, dt * 3.2);
    const p = insp.obj.userData.pivot; if (p) p.rotation.y = -Math.PI * insp.open;
    if (camera.aspect < 0.8) insp.d = fitDistance(insp.w, insp.h);
    else insp.d = fitDistance(insp.w * (1 + insp.open), insp.h);
  }
  insp.t = Math.min(1, insp.t + dt / (reduceMotion ? 0.01 : insp.dur));
  const k = ease(insp.t), o = insp.obj;
  if (!insp.back) {
    const tg = inspectTarget();
    if (insp.t < 1) {
      o.position.lerpVectors(insp.from.pos, tg.pos, k); o.position.y += Math.sin(Math.PI * k) * 0.06;
      o.quaternion.slerpQuaternions(insp.from.quat, tg.quat, k); o.scale.setScalar(THREE.MathUtils.lerp(insp.from.s, 1, k));
    } else { o.position.lerp(tg.pos, Math.min(1, dt * 10)); o.quaternion.slerp(tg.quat, Math.min(1, dt * 10)); o.scale.setScalar(1); }
  } else {
    const f = insp.backFrom, to = insp.from;
    o.position.lerpVectors(f.pos, to.pos, k); o.position.y += Math.sin(Math.PI * k) * 0.05;
    o.quaternion.slerpQuaternions(f.quat, to.quat, k); o.scale.setScalar(THREE.MathUtils.lerp(f.s, to.s, k));
    if (insp.t >= 1) {
      scene.remove(o); o.traverse((m) => { if (m.isMesh) { [].concat(m.material).forEach((mt) => { if (mt.map) mt.map.dispose(); mt.dispose(); }); m.geometry.dispose(); } });
      (insp.src.userData.hideRoot || insp.src).visible = true;
      insp.on = false; insp.obj = null; document.body.classList.remove("inspecting");
      const cb = insp.onClosed; insp.onClosed = null; if (cb) cb();
    }
  }
}

// ---- public: evidence ----
function inspectEvidence(id, srcMesh) {
  const ev = D.EVIDENCE[id]; if (!ev || insp.on) return;
  const cnv = docCanvas(ev), w = ev.note ? 0.11 : 0.21;
  const m = sheet(cnv, w, ev.note ? 0.0008 : 0.0035);
  const g = new THREE.Group(); g.add(m);
  beginInspect(g, srcMesh, w, m.userData.size[1], "doc");
  UI.markFound(id); if (ev.hidden) UI.toast("Далд тэмдэглэл олдлоо!");
  const links = [...new DOMParser().parseFromString(ev.html, "text/html").querySelectorAll("a[href]")];
  $("#inspLinks").innerHTML = links.map((a) => '<a class="paper-tab" target="_blank" rel="noopener" href="' + D.esc(a.getAttribute("href")) + '">' + D.esc(a.textContent) + "</a>").join("");
  $("#inspBar").hidden = false; $("#inspBar").dataset.ev = id;
}
// ---- public: case folders ----
function openCase(cs, isOpen) {
  if (insp.on) return false;
  const f = folders[cs.id]; if (!f) return false;
  const g = buildDossier(cs, isOpen);
  f.face.userData.size = [0.3, 0.22]; f.face.userData.hideRoot = f.obj;
  insp.cs = cs; insp.open = 0; insp.openT = 0;
  beginInspect(g, f.face, 0.24, 0.33, "folder");
  insp.d = fitDistance(0.24, 0.33);
  if (isOpen) setTimeout(() => { insp.openT = 1; LC.audio.sfx("open"); if (camera.aspect < 0.8) showSide("right"); }, reduceMotion ? 0 : 750);
  $("#caseBar").hidden = false;
  return true;
}
function caseUnlocked(cs) {
  if (!insp.on || insp.kind !== "folder") return;
  const c = insp.obj.userData.cover; c.material[4].map.dispose(); c.material[4].map = texFrom(coverCanvas(cs, true)); c.material[4].needsUpdate = true;
  setTimeout(() => { $("#pzPanel").hidden = true; insp.openT = 1; LC.audio.sfx("open"); if (camera.aspect < 0.8) showSide("right"); }, reduceMotion ? 0 : 900);
}
function showSide(side) { insp.panT = side === "left" ? insp.w / 2 : -insp.w / 2; }

/* ============================== frame loop ============================== */
const clock = new THREE.Clock();
function frame() {
  const dt = Math.min(0.05, clock.getDelta());
  if (introState.on) introTick(dt);
  if (exitState.on) exitTick(dt);
  hallTick();
  tvTick(dt);
  inspectTick(dt);
  lights.hall.intensity = lightNow.hall || 0; lights.hallBulb.emissiveIntensity = Math.min(4, (lightNow.hall || 0) * 0.8);
  if (doorRig.leak) doorRig.leak.material.opacity = Math.min(0.55, (lightNow.hall || 0) * 0.2) * (1 - doorRig.open);
  // ease lights
  const k = 1 - Math.exp(-dt * 4);
  for (const key of ["lamp", "bulb", "bulbE", "board", "hemi"]) lightNow[key] += (lightTarget[key] - lightNow[key]) * k;
  lights.lamp.intensity = lightNow.lamp; lights.bulb.intensity = lightNow.bulb; if (lights.bulbMat) lights.bulbMat.emissiveIntensity = lightNow.bulbE;
  lights.board.intensity = lightNow.board; lights.hemi.intensity = lightNow.hemi; lights.door.intensity = lightNow.door;
  lights.door.castShadow = lightNow.door > 0.5;
  // hover lift: desk items rise toward you, board cards come off the cork
  for (const o of liftables) {
    const u = o.userData, want = u.dragging ? 1.6 : (u.liftTo || 0);
    u.lift = (u.lift || 0) + (want - (u.lift || 0)) * (1 - Math.exp(-dt * 12));
    const k2 = lens.on && !u.dragging ? 0.45 : 1;
    if (u.board) { o.position.z = u.baseZ + u.lift * 0.03 * k2; o.scale.setScalar(1 + u.lift * 0.1 * k2); }
    else { o.position.y = (u.baseY || o.position.y) + u.lift * 0.04 * k2; o.scale.setScalar(1 + u.lift * 0.08 * k2); }
  }
  if (props.watch) { const s = props.watch.getObjectByName("pocket_watch_hand_secondes"); if (s) s.rotation.z = -((Date.now() / 1000) % 60) / 60 * Math.PI * 2; }
  updateCamera(dt);
  renderer.autoClear = true;
  renderLens();
  renderer.render(scene, camera);
  if (lensRig.visible) { renderer.autoClear = false; renderer.clearDepth(); renderer.render(hudScene, hudCam); }
  requestAnimationFrame(frame);
}
const liftables = [];

/* ============================== boot ============================== */
async function boot() {
  const jobs = [
    img("paper", "assets/tex/paper.jpg"), img("kraft", "assets/tex/kraft.jpg"), img("ub", "assets/photo/ub.jpg"),
    img("volleyball", "assets/photo/vb_team.jpg"), img("mugFull", "assets/photo/mugshot.jpg"), img("map", "assets/photo/mongolia_map.jpg"), img("fp", "assets/fingerprint.png"),
    model("desk_lamp_arm_01"), model("Television_01"), model("cassette_player"), model("magnifying_glass_01"), model("round_spectacles"), model("pocket_watch")
  ];
  if (C.person.photo) jobs.push(img("portrait", C.person.photo));
  // every picture a document or folder shows, by its path (for the hi-res 3D documents)
  const srcs = new Set([C.person.photo, C.person.photoFull, ...D.CASES.map((c) => c.photo)].filter(Boolean));
  Object.values(D.EVIDENCE).forEach((ev) => { (String(ev.html || "").match(/src="([^"]+)"/g) || []).forEach((m) => srcs.add(m.slice(5, -1))); });
  srcs.forEach((src) => jobs.push(new Promise((res) => imgLoader.load(src, (i) => { IMGSRC[src] = i; res(); }, undefined, () => res()))));
  await Promise.all(jobs);
  buildRoom(); buildProps(); buildTV(); buildLights(); buildBoards(); buildDesk(); buildLens();
  buildVisitor();
  buildHall().catch(() => { /* the corridor stays bare if a model fails */ });
  // remember rest positions for hover lift
  new Set(pickables.map((m) => m.userData.pick && m.userData.pick.obj)).forEach((o) => {
    if (!o || !o.isObject3D || o.userData.pick) return;
    const p = pickables.find((m) => m.userData.pick.obj === o).userData.pick;
    if (["string", "pin", "place", "lamp", "deco", "map", "tv", "player", "tape"].includes(p.type)) return;
    o.userData.board = !p.drag; o.userData.baseZ = o.position.z; if (o.userData.baseY === undefined) o.userData.baseY = o.position.y;
    liftables.push(o);
  });
  resize(); window.addEventListener("resize", resize);
  $("#loading").classList.add("done"); setTimeout(() => { $("#loading").hidden = true; }, 700);
  window.__sceneOK = true;
  let seen = false; try { seen = !!localStorage.getItem("lastcase-intro"); } catch (e) { /* ignore */ }
  if (seen || reduceMotion) { introState.done = true; finishIntro(true); } else playIntro();
  frame();
}
function backInRoom() { setDoor(0); lightNow.hall = 0; lightTarget.hemi = 0.3; lightTarget.door = 0; lightNow.door = 0; applyBase(true); if (!touchFirst) setLens(true); }
LC.scene = { inspectEvidence, openCase, caseUnlocked, showSide, endInspect, inspecting: () => insp.on, refreshFolder, finale, exitRoom, backInRoom, skipIntro: () => { if (introState.on) finishIntro(true); }, playIntro, setLens, _debug: { camera, rig, pickables, board, lights, scene, introState, exitState, tv, insp } };
boot().catch((err) => { console.error(err); window.__sceneFail && window.__sceneFail(err); });

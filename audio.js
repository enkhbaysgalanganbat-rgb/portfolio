/*
 * audio.js — real recorded sound effects (Wikimedia Commons, public domain / CC0 / CC BY, see README).
 * Files live in assets/audio/sfx/*.m4a and are decoded into Web Audio buffers on the first click/tap
 * (browsers only allow sound after a user gesture). If a file fails to load, a short synthesised
 * fallback is played instead so the game never goes silent.
 */
(function () {
  "use strict";
  var DIR = "assets/audio/sfx/";
  var FILES = ["door_open", "door_close", "step1", "step2", "step3", "page", "rustle", "thud", "click", "switch",
    "tape_in", "tape_out", "stamp", "stamp2", "type", "ding", "rain_loop", "clock_loop"];

  var ctx = null, master = null, sfxBus = null, buffers = {}, ambientNodes = null, stepN = 0;
  var state = { muted: false, volume: 0.6 };
  try { var s = JSON.parse(localStorage.getItem("lastcase-audio")); if (s) { state.muted = !!s.muted; state.volume = +s.volume; } } catch (e) { /* ignore */ }

  function save() { try { localStorage.setItem("lastcase-audio", JSON.stringify(state)); } catch (e) { /* ignore */ } }

  function load(name) {
    return fetch(DIR + name + ".m4a")
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); })
      .then(function (ab) {
        // Safari still uses the callback form of decodeAudioData
        return new Promise(function (res, rej) { ctx.decodeAudioData(ab, res, rej); });
      })
      .then(function (buf) { buffers[name] = buf; })
      .catch(function () { /* fallback synth will be used */ });
  }

  function init() {
    if (ctx) { if (ctx.state === "suspended") ctx.resume(); return; }
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = state.muted ? 0 : state.volume;
    master.connect(ctx.destination);
    sfxBus = ctx.createGain(); sfxBus.gain.value = 0.9; sfxBus.connect(master);
    FILES.forEach(load);
  }

  /* play one recorded clip. opt: vol, rate, when (s from now), dur (s), pan (-1..1) */
  function play(name, opt) {
    var buf = buffers[name]; if (!buf) return false;
    opt = opt || {};
    var src = ctx.createBufferSource(); src.buffer = buf;
    src.playbackRate.value = opt.rate || 1;
    var g = ctx.createGain(); g.gain.value = opt.vol == null ? 1 : opt.vol;
    var t = ctx.currentTime + (opt.when || 0), node = g;
    if (opt.pan && ctx.createStereoPanner) { var p = ctx.createStereoPanner(); p.pan.value = opt.pan; g.connect(p); node = p; }
    src.connect(g); node.connect(sfxBus);
    if (opt.dur) { g.gain.setValueAtTime(g.gain.value, t + opt.dur - 0.08); g.gain.linearRampToValueAtTime(0, t + opt.dur); src.start(t, 0, opt.dur); }
    else src.start(t);
    return true;
  }
  function rnd(a, b) { return a + Math.random() * (b - a); }

  /* tiny synthesised fallback (only used when a file did not load) */
  function blip(freq, dur, vol) {
    var o = ctx.createOscillator(), g = ctx.createGain(), t = ctx.currentTime;
    o.frequency.value = freq; g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.02);
  }

  /* each game event -> which recordings it uses */
  var SFX = {
    pick:   function () { return play("rustle", { vol: 0.55, rate: rnd(1.05, 1.25), dur: 0.35 }); },
    drop:   function () { return play("thud", { vol: 0.35, rate: rnd(1.2, 1.5) }) && play("rustle", { vol: 0.25, rate: 1.3, dur: 0.25 }); },
    open:   function () { return play("page", { vol: 0.75, rate: rnd(0.95, 1.1) }); },
    found:  function () { return play("type", { vol: 0.5, dur: 0.9 }); },
    unlock: function () { return play("type", { vol: 0.5, dur: 0.55 }) && play("ding", { vol: 0.7, when: 0.5 }); },
    wrong:  function () { return play("thud", { vol: 0.7, rate: 0.75 }); },
    click:  function () { return play("click", { vol: 0.6, rate: rnd(0.95, 1.1) }); },
    lamp:   function () { return play("switch", { vol: 0.8 }); },
    door:   function () { return play("door_open", { vol: 0.8 }); },
    door_close: function () { return play("door_close", { vol: 0.9 }); },
    step:   function () { stepN = (stepN + 1) % 3; return play("step" + (stepN + 1), { vol: 0.85, rate: rnd(0.92, 1.05) }); },
    tape_in:  function () { return play("tape_in", { vol: 0.9 }); },
    tape_out: function () { return play("tape_out", { vol: 0.9 }); },
    closed: function () { return play("stamp", { vol: 1 }); }
  };
  var FALLBACK = { found: [880, 0.3, 0.08], unlock: [660, 0.5, 0.1], wrong: [140, 0.3, 0.12], closed: [220, 0.5, 0.12] };

  /* room tone: rain on the window + a wall clock, both quiet and looping */
  function ambient(on) {
    if (!ctx) return;
    if (on && !ambientNodes) {
      var g = ctx.createGain(); g.gain.value = 0.0001; g.connect(master);
      g.gain.exponentialRampToValueAtTime(1, ctx.currentTime + 2.5);
      var nodes = { g: g, srcs: [] };
      [["rain_loop", 0.22], ["clock_loop", 0.16]].forEach(function (it) {
        var b = buffers[it[0]]; if (!b) return;
        var src = ctx.createBufferSource(); src.buffer = b; src.loop = true;
        var v = ctx.createGain(); v.gain.value = it[1];
        src.connect(v); v.connect(g); src.start(); nodes.srcs.push(src);
      });
      if (!nodes.srcs.length) {
        // files not decoded yet: try again shortly
        setTimeout(function () { if (ambientNodes === nodes) { ambientNodes = null; ambient(true); } }, 800);
      }
      ambientNodes = nodes;
    } else if (!on && ambientNodes) {
      var n = ambientNodes; ambientNodes = null;
      try { n.g.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.3); setTimeout(function () { n.srcs.forEach(function (s) { try { s.stop(); } catch (e) { /* ignore */ } }); }, 1500); } catch (e) { /* ignore */ }
    }
  }

  window.LC = window.LC || {};
  window.LC.audio = {
    init: init,
    sfx: function (name) {
      if (!ctx || state.muted || !SFX[name]) return;
      try { if (!SFX[name]() && FALLBACK[name]) blip.apply(null, FALLBACK[name]); } catch (e) { /* ignore */ }
    },
    ambient: function (on) { ambient(on); },
    isAmbient: function () { return !!ambientNodes; },
    setMuted: function (m) { state.muted = m; if (master) master.gain.value = m ? 0 : state.volume; save(); },
    setVolume: function (v) { state.volume = v; if (master && !state.muted) master.gain.value = v; save(); },
    loaded: function () { return Object.keys(buffers); },
    get: function () { return { muted: state.muted, volume: state.volume }; }
  };
})();

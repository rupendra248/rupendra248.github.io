/* Site behaviour: theme toggle, scroll reveal, BibTeX copy, sensor-field
 * simulation. Everything here is progressive enhancement — the site is
 * fully usable with JavaScript disabled. */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  /*-------------------------------------------------------------
   * Theme: light "paper" / dark "night ink"
   * The head snippet has already set data-theme before first paint;
   * here we wire up the toggle and keep <meta theme-color> in step.
   *-----------------------------------------------------------*/

  var THEME_COLORS = { light: '#FBF9F5', dark: '#191613' };
  var toggle = document.querySelector('.themetoggle');

  function setTheme(theme, persist) {
    root.setAttribute('data-theme', theme);
    if (persist) {
      try { localStorage.setItem('theme', theme); } catch (e) {}
    }
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', THEME_COLORS[theme]);
    if (toggle) {
      toggle.textContent = theme === 'dark' ? 'day' : 'night';
      toggle.setAttribute('aria-pressed', String(theme === 'dark'));
      toggle.setAttribute('aria-label',
        theme === 'dark' ? 'Switch to day mode' : 'Switch to night mode');
    }
    document.dispatchEvent(new CustomEvent('themechange'));
  }

  if (toggle) {
    toggle.hidden = false;
    toggle.addEventListener('click', function () {
      setTheme(root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark', true);
    });
  }
  setTheme(root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light', false);

  /*-------------------------------------------------------------
   * Scroll reveal: sections rise gently into view.
   * Applied by JS so nothing is hidden when scripts don't run.
   *-----------------------------------------------------------*/

  if (!reduceMotion.matches && 'IntersectionObserver' in window) {
    var revealer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealer.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });

    document.querySelectorAll('.section, .colophon').forEach(function (el) {
      el.classList.add('reveal');
      revealer.observe(el);
    });
  }

  /*-------------------------------------------------------------
   * BibTeX copy buttons
   *-----------------------------------------------------------*/

  if (navigator.clipboard) {
    document.querySelectorAll('details pre').forEach(function (pre) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'copybtn';
      btn.textContent = 'copy';
      btn.addEventListener('click', function () {
        navigator.clipboard.writeText(pre.textContent).then(function () {
          btn.textContent = 'copied';
          btn.classList.add('is-done');
          setTimeout(function () {
            btn.textContent = 'copy';
            btn.classList.remove('is-done');
          }, 1600);
        });
      });
      pre.parentNode.insertBefore(btn, pre);
    });
  }

  /*-------------------------------------------------------------
   * Sensor field: a small live WSN simulation on the home page.
   * Nodes link to neighbours within radio range; packets hop along
   * shortest paths to the sink. Click deploys a node, hovering a
   * node traces its route. Under prefers-reduced-motion the field
   * renders as a still diagram that only redraws on interaction.
   *-----------------------------------------------------------*/

  var canvas = document.getElementById('wsn');
  if (!canvas || !canvas.getContext) return;

  var ctx = canvas.getContext('2d');
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  var W = 0, H = 0;
  var nodes = [], sink = null, packets = [];
  var hovered = null;
  var running = false, inView = false, rafId = 0, lastT = 0, spawnClock = 0;
  var colors = readColors();

  function readColors() {
    var cs = getComputedStyle(root);
    function v(name) { return cs.getPropertyValue(name).trim(); }
    return {
      ink: v('--ink'), soft: v('--ink-soft'), muted: v('--ink-muted'),
      rule: v('--rule'), ruleStrong: v('--rule-strong'), accent: v('--accent')
    };
  }

  document.addEventListener('themechange', function () {
    colors = readColors();
    if (!running) draw(lastT);
  });

  function dist(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  function makeNode(x, y) {
    return { x: x, y: y, phase: Math.random() * Math.PI * 2,
             id: 0, links: [], parent: null, hops: -1, sink: false };
  }

  function seed() {
    nodes = [];
    packets = [];
    hovered = null;
    var count = Math.max(22, Math.min(56, Math.round((W * H) / 9000)));
    for (var i = 0; i < count; i++) {
      nodes.push(makeNode(12 + Math.random() * (W - 24),
                          12 + Math.random() * (H - 24)));
    }
    sink = makeNode(W * (0.35 + Math.random() * 0.3),
                    H * (0.35 + Math.random() * 0.3));
    sink.sink = true;
    nodes.push(sink);
    rebuild();
  }

  /* Recompute radio links and, via BFS from the sink, each node's
   * next hop and hop count. hops < 0 means unreachable. */
  function rebuild() {
    var range = Math.sqrt((W * H) / nodes.length) * 1.65;
    nodes.forEach(function (n, i) {
      n.id = i; n.links = []; n.parent = null; n.hops = -1;
    });
    for (var i = 0; i < nodes.length; i++) {
      for (var j = i + 1; j < nodes.length; j++) {
        if (dist(nodes[i], nodes[j]) < range) {
          nodes[i].links.push(nodes[j]);
          nodes[j].links.push(nodes[i]);
        }
      }
    }
    sink.hops = 0;
    var queue = [sink];
    while (queue.length) {
      var n = queue.shift();
      n.links.forEach(function (m) {
        if (m.hops === -1) {
          m.hops = n.hops + 1;
          m.parent = n;
          queue.push(m);
        }
      });
    }
    packets = packets.filter(function (p) { return p.node.hops > 0; });
    packets.forEach(function (p) { p.next = p.node.parent; p.t = 0; });
  }

  function spawnPacket() {
    if (packets.length > 7) return;
    var sources = nodes.filter(function (n) { return n.hops > 0; });
    if (!sources.length) return;
    var from = sources[Math.floor(Math.random() * sources.length)];
    packets.push({ node: from, next: from.parent, t: 0 });
  }

  function stepPackets(dt) {
    var speed = 120; /* px per second */
    packets = packets.filter(function (p) {
      if (!p.next) return false;
      p.t += (speed * dt) / Math.max(24, dist(p.node, p.next));
      if (p.t >= 1) {
        p.node = p.next;
        p.next = p.node.parent;
        p.t = 0;
        if (!p.next) return false; /* delivered */
      }
      return true;
    });
  }

  /* Drawn position: base position plus a slow drift, frozen under
   * reduced motion. */
  function pos(n, t) {
    if (reduceMotion.matches) return n;
    return { x: n.x + Math.sin(t / 1300 + n.phase) * 1.6,
             y: n.y + Math.cos(t / 1500 + n.phase) * 1.6 };
  }

  function draw(t) {
    ctx.clearRect(0, 0, W, H);

    ctx.lineWidth = 1;
    ctx.strokeStyle = colors.rule;
    ctx.beginPath();
    nodes.forEach(function (n) {
      var a = pos(n, t);
      n.links.forEach(function (m) {
        if (m.id < n.id) return;
        var b = pos(m, t);
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
      });
    });
    ctx.stroke();

    /* Hovered node: trace its route to the sink in accent. */
    if (hovered && hovered.hops > 0) {
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = colors.accent;
      ctx.beginPath();
      for (var r = hovered; r.parent; r = r.parent) {
        var a1 = pos(r, t), b1 = pos(r.parent, t);
        ctx.moveTo(a1.x, a1.y);
        ctx.lineTo(b1.x, b1.y);
      }
      ctx.stroke();
    }

    nodes.forEach(function (n) {
      var p = pos(n, t);
      if (n.sink) {
        ctx.fillStyle = colors.accent;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y - 6);
        ctx.lineTo(p.x + 6, p.y);
        ctx.lineTo(p.x, p.y + 6);
        ctx.lineTo(p.x - 6, p.y);
        ctx.closePath();
        ctx.fill();
      } else if (n.hops < 0) {
        ctx.strokeStyle = colors.muted;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        ctx.fillStyle = n === hovered ? colors.accent : colors.soft;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.fill();
      }
      if (n === hovered) {
        ctx.strokeStyle = colors.accent;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 7, 0, Math.PI * 2);
        ctx.stroke();
      }
    });

    ctx.fillStyle = colors.accent;
    packets.forEach(function (p) {
      var a = pos(p.node, t), b = pos(p.next, t);
      var x = a.x + (b.x - a.x) * p.t;
      var y = a.y + (b.y - a.y) * p.t;
      ctx.beginPath();
      ctx.arc(x, y, 2.5, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function frame(t) {
    var dt = Math.min(0.05, (t - lastT) / 1000 || 0.016);
    lastT = t;
    spawnClock += dt;
    if (spawnClock > 0.8) {
      spawnClock = 0;
      spawnPacket();
    }
    stepPackets(dt);
    draw(t);
    rafId = requestAnimationFrame(frame);
  }

  function start() {
    if (running || reduceMotion.matches) return;
    running = true;
    lastT = performance.now();
    rafId = requestAnimationFrame(frame);
  }

  function stop() {
    running = false;
    cancelAnimationFrame(rafId);
  }

  var lastW = 0;
  function resize() {
    var w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    W = w; H = h;
    lastW = w;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    seed();
    draw(lastT);
  }

  window.addEventListener('resize', function () {
    /* Reseed only when the width really changes, not when a mobile
     * URL bar collapses. */
    if (canvas.clientWidth !== lastW) resize();
  });

  canvas.addEventListener('pointermove', function (e) {
    var r = canvas.getBoundingClientRect();
    var x = e.clientX - r.left, y = e.clientY - r.top;
    var best = null, bd = 16;
    nodes.forEach(function (n) {
      var d = Math.hypot(n.x - x, n.y - y);
      if (d < bd) { bd = d; best = n; }
    });
    if (best !== hovered) {
      hovered = best;
      canvas.style.cursor = best ? 'pointer' : 'crosshair';
      if (!running) draw(lastT);
    }
  });

  canvas.addEventListener('pointerleave', function () {
    hovered = null;
    if (!running) draw(lastT);
  });

  canvas.addEventListener('click', function (e) {
    var r = canvas.getBoundingClientRect();
    var n = makeNode(e.clientX - r.left, e.clientY - r.top);
    nodes.push(n);
    rebuild();
    if (n.hops > 0) packets.push({ node: n, next: n.parent, t: 0 });
    if (!running) draw(lastT);
  });

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        inView = entry.isIntersecting;
        if (inView && !document.hidden) start(); else stop();
      });
    }, { threshold: 0.05 }).observe(canvas);
  } else {
    inView = true;
  }

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) stop(); else if (inView) start();
  });

  var onMotionChange = function () {
    if (reduceMotion.matches) { stop(); draw(lastT); } else if (inView) start();
  };
  if (reduceMotion.addEventListener) {
    reduceMotion.addEventListener('change', onMotionChange);
  }

  resize();
  if (!('IntersectionObserver' in window)) start();
})();

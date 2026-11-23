// Mini, ambient version of the Stiefel (sphere) gradient descent: no controls, just several
// Riemannian-gradient-descent trails running on a slowly turning sphere. Drag to rotate.
// Embed: <div data-viz="stiefel-mini"></div>
Viz.register('stiefel-mini', function (el) {
  var v = Viz.make(el, { bare: true, aspect: 1 });

  var lam = [0.3, 1.1, 2.4];
  function rot(a, b, c) {
    var ca = Math.cos(a), sa = Math.sin(a), cb = Math.cos(b), sb = Math.sin(b), cc = Math.cos(c), sc = Math.sin(c);
    return [[ca * cb, ca * sb * sc - sa * cc, ca * sb * cc + sa * sc],
            [sa * cb, sa * sb * sc + ca * cc, sa * sb * cc - ca * sc],
            [-sb, cb * sc, cb * cc]];
  }
  var R = rot(0.7, 0.5, 0.3);
  var col = function (j) { return [R[0][j], R[1][j], R[2][j]]; };
  var vmin = col(0);
  function Amul(x) {
    var y = [0, 0, 0];
    for (var j = 0; j < 3; j++) {
      var c = col(j), d = c[0] * x[0] + c[1] * x[1] + c[2] * x[2];
      for (var k = 0; k < 3; k++) y[k] += lam[j] * d * c[k];
    }
    return y;
  }
  var dot = function (a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; };
  var norm = function (a) { return Math.sqrt(dot(a, a)); };

  var N = 650, pts = [];
  for (var i = 0; i < N; i++) {
    var z = 1 - 2 * (i + 0.5) / N, r = Math.sqrt(1 - z * z), th = i * 2.399963229728653;
    var p = [r * Math.cos(th), r * Math.sin(th), z];
    pts.push({ p: p, t: (dot(p, Amul(p)) - lam[0]) / (lam[2] - lam[0]) });
  }

  var ETA = 0.045, K = 9, TRAIL = 120;
  var st = { yaw: 0.9, pitch: 0.5, drag: false };
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  function spawn(delay) {
    var a, n;
    do { a = [Math.random() - .5, Math.random() - .5, Math.random() - .5]; n = norm(a); a = [a[0] / n, a[1] / n, a[2] / n]; }
    while (Math.abs(dot(a, vmin)) > 0.35);
    return { x: a, path: [a.slice()], wait: delay || 0, done: 0 };
  }
  var parts = [];
  for (var k = 0; k < K; k++) parts.push(spawn(k * 14));

  function step(q) {
    var g = Amul(q.x).map(function (t) { return 2 * t; }), c = dot(q.x, g);
    var rg = [g[0] - c * q.x[0], g[1] - c * q.x[1], g[2] - c * q.x[2]];     // tangent-space gradient
    var nx = [q.x[0] - ETA * rg[0], q.x[1] - ETA * rg[1], q.x[2] - ETA * rg[2]];
    var m = norm(nx); q.x = [nx[0] / m, nx[1] / m, nx[2] / m];              // retraction
    q.path.push(q.x.slice()); if (q.path.length > TRAIL) q.path.shift();
    return norm(rg);
  }
  function tick() {
    parts.forEach(function (q, i) {
      if (q.wait > 0) { q.wait--; return; }
      if (q.done > 0) { q.done++; if (q.done > 100) parts[i] = spawn(Math.floor(Math.random() * 40)); return; }
      if (step(q) < 0.004) q.done = 1;
    });
  }

  function view(p) {
    var cy = Math.cos(st.yaw), sy = Math.sin(st.yaw), cp = Math.cos(st.pitch), sp = Math.sin(st.pitch);
    var x1 = p[0] * cy + p[1] * sy, y1 = -p[0] * sy + p[1] * cy;
    return [x1, p[2] * cp - y1 * sp, p[2] * sp + y1 * cp];
  }

  v.onDraw(function () {
    var c = v.c, ctx = v.ctx, w = v.w, h = v.h, S = Math.min(w, h) * 0.42, cx = w / 2, cy = h / 2;
    ctx.clearRect(0, 0, w, h);
    var P = function (q) { var r = view(q); return [cx + S * r[0], cy - S * r[1], r[2]]; };

    ctx.strokeStyle = c.hair; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(cx, cy, S, 0, 6.2832); ctx.stroke();

    var proj = pts.map(function (q) { var r = P(q.p); return { x: r[0], y: r[1], z: r[2], t: q.t }; })
                  .sort(function (a, b) { return a.z - b.z; });
    ctx.fillStyle = c.accent;
    proj.forEach(function (q) {
      ctx.globalAlpha = (0.05 + 0.6 * Math.pow(1 - q.t, 1.8)) * (q.z < 0 ? 0.3 : 1);
      ctx.beginPath(); ctx.arc(q.x, q.y, 1.5, 0, 6.2832); ctx.fill();
    });

    [1, -1].forEach(function (s) {                                          // the minimizer, +/-
      var r = P([vmin[0] * s, vmin[1] * s, vmin[2] * s]);
      ctx.globalAlpha = r[2] < 0 ? 0.3 : 1; ctx.strokeStyle = c.green; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(r[0], r[1], 5, 0, 6.2832); ctx.stroke();
    });

    ctx.lineWidth = 1.3; ctx.lineCap = 'round'; ctx.strokeStyle = c.text; ctx.fillStyle = c.text;
    parts.forEach(function (q) {
      var L = q.path.length, fade = q.done > 0 ? Math.max(0, 1 - (q.done - 40) / 60) : 1;
      for (var i = 1; i < L; i++) {
        var a = P(q.path[i - 1]), b = P(q.path[i]);
        ctx.globalAlpha = (i / L) * 0.85 * fade * ((a[2] + b[2]) < 0 ? 0.3 : 1);
        ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
      }
      if (q.wait <= 0) {
        var e = P(q.x); ctx.globalAlpha = fade * (e[2] < 0 ? 0.35 : 1);
        ctx.beginPath(); ctx.arc(e[0], e[1], 2.6, 0, 6.2832); ctx.fill();
      }
    });
    ctx.globalAlpha = 1;
  });

  // drag to rotate
  var last = null;
  v.canvas.addEventListener('pointerdown', function (e) { st.drag = true; last = [e.clientX, e.clientY]; v.canvas.setPointerCapture(e.pointerId); });
  v.canvas.addEventListener('pointerup', function () { st.drag = false; });
  v.canvas.addEventListener('pointermove', function (e) {
    if (!st.drag) return;
    st.yaw += (e.clientX - last[0]) * 0.01;
    st.pitch = Math.max(-1.4, Math.min(1.4, st.pitch + (e.clientY - last[1]) * 0.01));
    last = [e.clientX, e.clientY]; v.redraw();
  });

  if (reduce) {                                                             // static final frame, no motion
    for (var s = 0; s < 220; s++) parts.forEach(function (q) { if (q.wait > 0) q.wait = 0; if (!q.done) step(q); });
    v.redraw();
    return;
  }

  var visible = true, raf = null;
  function frame() {
    raf = null;
    if (!visible) return;
    if (!st.drag) st.yaw += 0.0035;
    tick(); v.redraw();
    raf = requestAnimationFrame(frame);
  }
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) {
      visible = es[0].isIntersecting;
      if (visible && !raf) raf = requestAnimationFrame(frame);
    }).observe(el);
  }
  raf = requestAnimationFrame(frame);
});

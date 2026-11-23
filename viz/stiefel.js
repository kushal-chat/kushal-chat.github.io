// Riemannian gradient descent on the simplest Stiefel manifold: St(1,3) = the unit sphere in R^3.
// Minimize the Rayleigh quotient f(x) = x^T A x subject to ||x|| = 1  (answer: bottom eigenvector of A).
Viz.register('stiefel', function (el) {
  var v = Viz.make(el, {
    title: 'Gradient descent on the Stiefel manifold St(1, 3), the unit sphere',
    caption: 'Dots show f(x) = xᵀAx on the sphere (dark = low). Each step projects the gradient onto the tangent space, steps, then retracts back onto the sphere. Drag to rotate. Turn the retraction off and the iterate drifts off the manifold.',
    aspect: 0.62
  });

  // A = R diag(lam) R^T with a fixed rotation, so the eigenvectors are not the coordinate axes.
  var lam = [0.3, 1.1, 2.4];
  function rot(a, b, c) {
    var ca = Math.cos(a), sa = Math.sin(a), cb = Math.cos(b), sb = Math.sin(b), cc = Math.cos(c), sc = Math.sin(c);
    return [[ca * cb, ca * sb * sc - sa * cc, ca * sb * cc + sa * sc],
            [sa * cb, sa * sb * sc + ca * cc, sa * sb * cc - ca * sc],
            [-sb, cb * sc, cb * cc]];
  }
  var R = rot(0.7, 0.5, 0.3);
  var col = function (j) { return [R[0][j], R[1][j], R[2][j]]; };
  var vmin = col(0), vmax = col(2);
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

  // Heat-map points on the sphere (Fibonacci lattice)
  var N = 1100, pts = [];
  for (var i = 0; i < N; i++) {
    var z = 1 - 2 * (i + 0.5) / N, r = Math.sqrt(1 - z * z), th = i * 2.399963229728653;
    var p = [r * Math.cos(th), r * Math.sin(th), z];
    pts.push({ p: p, t: (dot(p, Amul(p)) - lam[0]) / (lam[2] - lam[0]) });
  }

  var st = { x: [1, 0, 0], path: [[1, 0, 0]], it: 0, run: true, eta: 0.15, retract: true, yaw: 0.9, pitch: 0.45, done: false };

  function reset() {
    do {
      var a = [Math.random() - .5, Math.random() - .5, Math.random() - .5], n = norm(a);
      st.x = [a[0] / n, a[1] / n, a[2] / n];
    } while (Math.abs(dot(st.x, vmin)) > 0.3);
    st.path = [st.x.slice()]; st.it = 0; st.done = false; st.run = true; runBtn.textContent = 'Pause';
    v.redraw();
  }

  function step() {
    var x = st.x, g = Amul(x).map(function (t) { return 2 * t; });
    var n = norm(x), xh = [x[0] / n, x[1] / n, x[2] / n], c = dot(xh, g);
    var rg = [g[0] - c * xh[0], g[1] - c * xh[1], g[2] - c * xh[2]];       // Riemannian gradient
    var nx = [x[0] - st.eta * rg[0], x[1] - st.eta * rg[1], x[2] - st.eta * rg[2]];
    if (st.retract) { var m = norm(nx); nx = [nx[0] / m, nx[1] / m, nx[2] / m]; }  // retraction
    st.x = nx; st.it++;
    st.path.push(nx.slice()); if (st.path.length > 500) st.path.shift();
    if (norm(rg) < 1e-5) { st.done = true; st.run = false; runBtn.textContent = 'Run'; }
  }

  function view(p) {                                                       // rotate, orthographic project
    var cy = Math.cos(st.yaw), sy = Math.sin(st.yaw), cp = Math.cos(st.pitch), sp = Math.sin(st.pitch);
    var x1 = p[0] * cy + p[1] * sy, y1 = -p[0] * sy + p[1] * cy;
    return [x1, p[2] * cp - y1 * sp, p[2] * sp + y1 * cp];                // x right, y up, z toward viewer
  }

  v.onDraw(function () {
    var c = v.c, ctx = v.ctx, w = v.w, h = v.h, S = Math.min(w, h) * 0.4, cx = w / 2, cy = h / 2;
    ctx.clearRect(0, 0, w, h);
    var P = function (q) { var r = view(q); return [cx + S * r[0], cy - S * r[1], r[2]]; };

    ctx.strokeStyle = c.hair; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(cx, cy, S, 0, 6.2832); ctx.stroke();

    var proj = pts.map(function (q) { var r = P(q.p); return { x: r[0], y: r[1], z: r[2], t: q.t }; })
                  .sort(function (a, b) { return a.z - b.z; });
    ctx.fillStyle = c.accent;
    proj.forEach(function (q) {
      ctx.globalAlpha = (0.08 + 0.8 * Math.pow(1 - q.t, 1.6)) * (q.z < 0 ? 0.3 : 1);
      ctx.beginPath(); ctx.arc(q.x, q.y, 1.9, 0, 6.2832); ctx.fill();
    });
    ctx.globalAlpha = 1;

    [[vmin, 'min', c.green], [vmax, 'max', c.red]].forEach(function (e) {
      [1, -1].forEach(function (s) {
        var r = P([e[0][0] * s, e[0][1] * s, e[0][2] * s]);
        ctx.globalAlpha = r[2] < 0 ? 0.35 : 1; ctx.strokeStyle = e[2]; ctx.lineWidth = 1.6;
        ctx.beginPath(); ctx.arc(r[0], r[1], 6, 0, 6.2832); ctx.stroke();
        if (s === 1) v.text(e[1], r[0] + 10, r[1] + 4, 11, e[2]);
      });
    });
    ctx.globalAlpha = 1;

    ctx.lineWidth = 1.6; ctx.lineJoin = 'round';
    for (var i = 1; i < st.path.length; i++) {
      var a = P(st.path[i - 1]), b = P(st.path[i]);
      ctx.globalAlpha = (a[2] + b[2] < 0) ? 0.3 : 1; ctx.strokeStyle = c.text;
      ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
    }
    ctx.globalAlpha = 1;
    var e0 = P(st.path[0]), e1 = P(st.x);
    ctx.strokeStyle = c.text; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(e0[0], e0[1], 3.5, 0, 6.2832); ctx.stroke();
    ctx.fillStyle = c.text; ctx.beginPath(); ctx.arc(e1[0], e1[1], 5, 0, 6.2832); ctx.fill();

    var f = dot(st.x, Amul(st.x));
    v.stats.textContent = 'iter ' + st.it + '   f(x) = ' + f.toFixed(4) + '  (min ' + lam[0] + ')   ‖x‖ = ' + norm(st.x).toFixed(4) +
      (st.done ? '   converged' : '');
  });

  var runBtn = Viz.button(v.ctrl, 'Pause', function (b) { st.run = !st.run; if (st.done) reset(); b.textContent = st.run ? 'Pause' : 'Run'; });
  Viz.button(v.ctrl, 'Step', function () { if (!st.done) { step(); v.redraw(); } });
  Viz.button(v.ctrl, 'New start', reset);
  Viz.slider(v.ctrl, { label: 'step size η', min: 0.02, max: 0.6, step: 0.01, value: st.eta, format: function (x) { return x.toFixed(2); }, oninput: function (x) { st.eta = x; } });
  var retBtn = Viz.button(v.ctrl, 'Retraction: on', function (b) {
    st.retract = !st.retract; b.textContent = 'Retraction: ' + (st.retract ? 'on' : 'off'); reset();
  });

  // drag to rotate
  var drag = null;
  v.canvas.addEventListener('pointerdown', function (e) { drag = [e.clientX, e.clientY]; v.canvas.setPointerCapture(e.pointerId); });
  v.canvas.addEventListener('pointerup', function () { drag = null; });
  v.canvas.addEventListener('pointermove', function (e) {
    if (!drag) return;
    st.yaw += (e.clientX - drag[0]) * 0.01;
    st.pitch = Math.max(-1.5, Math.min(1.5, st.pitch + (e.clientY - drag[1]) * 0.01));
    drag = [e.clientX, e.clientY]; v.redraw();
  });

  var tick = 0;
  (function loop() {
    if (st.run && ++tick % 3 === 0) { step(); v.redraw(); }
    requestAnimationFrame(loop);
  })();
  reset();
});

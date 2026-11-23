// Entropy, cross-entropy and KL divergence over 5 outcomes. Drag bars to edit P or Q.
// Shows the identity  H(P, Q) = H(P) + D_KL(P || Q).
Viz.register('infotheory', function (el) {
  var v = Viz.make(el, {
    title: 'Entropy, cross-entropy and KL divergence',
    caption: 'Drag a bar to reshape the selected distribution. Cross-entropy H(P,Q) is always the entropy H(P) plus the extra cost D_KL(P‖Q) of coding P with a code built for Q.',
    aspect: 0.5
  });
  var K = 5, labels = ['a', 'b', 'c', 'd', 'e'];
  var P = [0.5, 0.25, 0.125, 0.0625, 0.0625], Q = [0.2, 0.2, 0.2, 0.2, 0.2];
  var editing = 'P', EPS = 0.004;

  var log2 = function (x) { return Math.log(x) / Math.LN2; };
  var H = function (p) { return -p.reduce(function (s, x) { return s + (x > 0 ? x * log2(x) : 0); }, 0); };
  var CE = function (p, q) { return -p.reduce(function (s, x, i) { return s + (x > 0 ? x * log2(Math.max(q[i], EPS)) : 0); }, 0); };

  function setBar(arr, i, val) {                                           // fix bar i, rescale the others
    val = Math.max(0.01, Math.min(0.96, val));
    var rest = arr.reduce(function (s, x, j) { return j === i ? s : s + x; }, 0);
    for (var j = 0; j < K; j++) arr[j] = j === i ? val : (rest > 0 ? arr[j] / rest : 1 / (K - 1)) * (1 - val);
  }

  var L = { x0: 36, x1: 0, top: 14, base: 0 };
  function geom() { L.x1 = v.w - 16; L.base = Math.round(v.h * 0.60); }

  v.onDraw(function () {
    geom();
    var c = v.c, ctx = v.ctx, w = v.w, h = v.h, plotH = L.base - L.top, colW = (L.x1 - L.x0) / K;
    ctx.clearRect(0, 0, w, h);

    ctx.strokeStyle = c.hair; ctx.lineWidth = 1;
    [0, 0.25, 0.5, 0.75, 1].forEach(function (g) {
      var y = L.base - g * plotH;
      ctx.beginPath(); ctx.moveTo(L.x0, y); ctx.lineTo(L.x1, y); ctx.stroke();
      v.text(g.toFixed(2).replace(/0$/, ''), L.x0 - 6, y + 4, 10.5, c.faint, 'right');
    });

    for (var i = 0; i < K; i++) {
      var x = L.x0 + i * colW, bw = Math.min(26, colW * 0.34), cxm = x + colW / 2;
      var hp = P[i] * plotH, hq = Q[i] * plotH;
      ctx.globalAlpha = editing === 'P' ? 1 : 0.55; ctx.fillStyle = c.accent;
      ctx.fillRect(cxm - bw - 2, L.base - hp, bw, hp);
      ctx.globalAlpha = 1;
      ctx.lineWidth = editing === 'Q' ? 2 : 1.2; ctx.strokeStyle = c.text;
      ctx.strokeRect(cxm + 2 + 0.5, L.base - hq + 0.5, bw - 1, hq - 1);
      v.text(labels[i], cxm, L.base + 16, 12, c.muted, 'center');
      v.text(P[i].toFixed(2), cxm - bw / 2 - 2, L.base - hp - 5, 10, c.accent, 'center');
      v.text(Q[i].toFixed(2), cxm + bw / 2 + 2, L.base - hq - 5, 10, c.text, 'center');
    }

    // legend
    ctx.fillStyle = c.accent; ctx.fillRect(L.x1 - 120, L.top - 6, 10, 10);
    v.text('P (data)', L.x1 - 106, L.top + 3, 11, c.muted);
    ctx.strokeStyle = c.text; ctx.lineWidth = 1.2; ctx.strokeRect(L.x1 - 52, L.top - 6, 10, 10);
    v.text('Q (model)', L.x1 - 38, L.top + 3, 11, c.muted);

    // stacked bar: H(P) + KL = cross-entropy (in bits)
    var hP = H(P), ce = CE(P, Q), kl = Math.max(0, ce - hP);
    var maxBits = Math.max(4, Math.ceil(ce)), sx = (L.x1 - L.x0) / maxBits, by = L.base + 44, bh = 22;
    ctx.fillStyle = c.hair; ctx.fillRect(L.x0, by, L.x1 - L.x0, bh);
    ctx.fillStyle = c.accent; ctx.fillRect(L.x0, by, hP * sx, bh);
    ctx.fillStyle = c.red; ctx.fillRect(L.x0 + hP * sx, by, kl * sx, bh);
    v.text('H(P)', L.x0 + 6, by + 15, 11.5, '#fff', 'left', 600);
    if (kl * sx > 34) v.text('KL', L.x0 + hP * sx + 6, by + 15, 11.5, '#fff', 'left', 600);
    v.text('0', L.x0, by + bh + 14, 10.5, c.faint, 'center');
    v.text(maxBits + ' bits', L.x1, by + bh + 14, 10.5, c.faint, 'right');
    v.text('H(P, Q) = H(P) + KL = ' + ce.toFixed(2) + ' bits', L.x0, by - 8, 12, c.text, 'left', 600);

    v.stats.textContent = 'H(P) = ' + hP.toFixed(3) + '   H(P,Q) = ' + ce.toFixed(3) + '   KL(P‖Q) = ' + kl.toFixed(3) +
      '   perplexity 2^H(P,Q) = ' + Math.pow(2, ce).toFixed(2);
  });

  // editing
  var down = false;
  function edit(e) {
    var r = v.canvas.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
    var i = Math.floor((x - L.x0) / ((L.x1 - L.x0) / K));
    if (i < 0 || i >= K) return;
    setBar(editing === 'P' ? P : Q, i, (L.base - y) / (L.base - L.top));
    v.redraw();
  }
  v.canvas.addEventListener('pointerdown', function (e) { down = true; v.canvas.setPointerCapture(e.pointerId); edit(e); });
  v.canvas.addEventListener('pointermove', function (e) { if (down) edit(e); });
  v.canvas.addEventListener('pointerup', function () { down = false; });

  var bP = Viz.button(v.ctrl, 'Edit P', function () { editing = 'P'; sync(); });
  var bQ = Viz.button(v.ctrl, 'Edit Q', function () { editing = 'Q'; sync(); });
  function sync() { bP.classList.toggle('on', editing === 'P'); bQ.classList.toggle('on', editing === 'Q'); v.redraw(); }
  Viz.button(v.ctrl, 'Q = P', function () { Q = P.slice(); v.redraw(); });
  Viz.button(v.ctrl, 'Q uniform', function () { Q = [.2, .2, .2, .2, .2]; v.redraw(); });
  Viz.button(v.ctrl, 'Random P', function () {
    var r = [0, 0, 0, 0, 0].map(function () { return Math.pow(Math.random(), 2.2) + 0.02; }), s = r.reduce(function (a, b) { return a + b; }, 0);
    P = r.map(function (x) { return x / s; }); v.redraw();
  });
  sync();
});

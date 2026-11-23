// Tiny visualization framework.
//
// Embed anywhere (markdown posts or HTML pages):   <div data-viz="stiefel"></div>
// This file finds every [data-viz], loads viz/<name>.js, and calls the function that file registers:
//
//   Viz.register('my-viz', function (el) {
//     var v = Viz.make(el, { title: '...', caption: '...', aspect: 0.6 });  // card + canvas
//     v.ctx, v.w, v.h                         // draw here (CSS pixels, hi-dpi handled)
//     Viz.slider(v.ctrl, {...}); Viz.button(v.ctrl, 'Reset', fn);
//     v.onDraw(function () { ... });          // called on resize and on light/dark change
//   });
(function () {
  var base = document.currentScript.src.replace(/viz\.js.*$/, '');
  var registry = {}, loading = {}, themeCbs = [];

  function colors() {
    var s = getComputedStyle(document.documentElement);
    var g = function (n) { return s.getPropertyValue(n).trim(); };
    return { text: g('--text'), muted: g('--muted'), faint: g('--faint'), hair: g('--hair'),
             accent: g('--accent'), bg: g('--bg'), soft: g('--soft'), red: '#ef402c', green: '#0e9972' };
  }

  function make(el, o) {
    o = o || {};
    el.classList.add('viz-card');
    if (o.bare) el.classList.add('bare');
    el.innerHTML = '<div class="viz-title"></div><canvas></canvas><div class="viz-stats"></div>' +
                   '<div class="viz-controls"></div><p class="viz-caption"></p>';
    el.querySelector('.viz-title').textContent = o.title || '';
    el.querySelector('.viz-caption').textContent = o.caption || '';
    var canvas = el.querySelector('canvas'), ctx = canvas.getContext('2d');
    var api = { el: el, canvas: canvas, ctx: ctx, w: 0, h: 0, c: colors(),
                ctrl: el.querySelector('.viz-controls'), stats: el.querySelector('.viz-stats'),
                font: getComputedStyle(document.body).fontFamily, _draw: function () {} };

    api.fit = function () {
      var dpr = window.devicePixelRatio || 1;
      api.w = canvas.clientWidth || 600;
      api.h = Math.round(api.w * (o.aspect || 0.6));
      canvas.style.height = api.h + 'px';
      canvas.width = Math.round(api.w * dpr);
      canvas.height = Math.round(api.h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    api.redraw = function () { api.c = colors(); api._draw(); };
    api.onDraw = function (fn) { api._draw = fn; api.redraw(); };
    api.text = function (s, x, y, size, color, align, weight) {
      ctx.font = (weight || 400) + ' ' + (size || 12) + 'px ' + api.font;
      ctx.fillStyle = color || api.c.muted;
      ctx.textAlign = align || 'left';
      ctx.fillText(s, x, y);
    };

    api.fit();
    if (window.ResizeObserver) {
      var last = canvas.clientWidth;
      new ResizeObserver(function () {
        if (canvas.clientWidth !== last) { last = canvas.clientWidth; api.fit(); api.redraw(); }
      }).observe(el);
    }
    themeCbs.push(function () { api.redraw(); });
    return api;
  }

  function slider(parent, o) {
    var lab = document.createElement('label');
    var span = document.createElement('span');
    var inp = document.createElement('input');
    inp.type = 'range'; inp.min = o.min; inp.max = o.max; inp.step = o.step; inp.value = o.value;
    var show = function () { span.textContent = o.label + ' ' + (o.format ? o.format(+inp.value) : inp.value); };
    inp.addEventListener('input', function () { show(); o.oninput(+inp.value); });
    show();
    lab.appendChild(span); lab.appendChild(inp); parent.appendChild(lab);
    return inp;
  }

  function button(parent, label, fn) {
    var b = document.createElement('button');
    b.type = 'button'; b.textContent = label;
    b.addEventListener('click', function () { fn(b); });
    parent.appendChild(b);
    return b;
  }

  window.Viz = { register: function (n, f) { registry[n] = f; }, make: make, slider: slider, button: button, colors: colors };

  function load(name) {
    if (loading[name]) return loading[name];
    return (loading[name] = new Promise(function (res, rej) {
      var s = document.createElement('script');
      s.src = base + name + '.js';
      s.onload = res; s.onerror = function () { rej(new Error('could not load viz/' + name + '.js')); };
      document.head.appendChild(s);
    }));
  }

  function start() {
    new MutationObserver(function () { themeCbs.forEach(function (f) { f(); }); })
      .observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function () { themeCbs.forEach(function (f) { f(); }); });
    document.querySelectorAll('[data-viz]').forEach(function (el) {
      var name = el.getAttribute('data-viz');
      load(name).then(function () {
        if (!registry[name]) throw new Error('viz/' + name + '.js did not register "' + name + '"');
        registry[name](el);
      }).catch(function (e) { el.textContent = 'Visualization unavailable: ' + e.message; });
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();

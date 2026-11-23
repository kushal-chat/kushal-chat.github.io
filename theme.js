// Shared nav + light/dark toggle. Every page has an empty <nav></nav>;
// links live here so they change in one place. Loaded in <head> so the
// saved theme applies before first paint.
(function () {
  // Heading font (Inter Tight); falls back to Helvetica/Arial if it can't load.
  [['preconnect', 'https://fonts.googleapis.com'], ['preconnect', 'https://fonts.gstatic.com', 1],
   ['stylesheet', 'https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;600&family=Manrope:wght@400;500;600&family=Noto+Sans+JP:wght@400;500;700&family=Cormorant+Garamond:wght@600;700&family=IBM+Plex+Sans+Condensed:wght@400;500&display=swap']].forEach(function (x) {
    var l = document.createElement('link'); l.rel = x[0]; l.href = x[1]; if (x[2]) l.crossOrigin = ''; document.head.appendChild(l);
  });
  var root = document.documentElement;
  var KEY = 'theme';
  var NAV = [
    ['Home', 'index.html'],
    ['Projects', 'projects.html'],
    ['Papers', 'papers.html'],
    ['Places', 'history.html'],
    ['Blog', 'blog/index.html']
  ];
  var SITE_ROOT = document.currentScript ? document.currentScript.src : location.href;

  function saved() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function current() {
    var t = root.getAttribute('data-theme');
    if (t) return t;
    return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  var s = saved();
  if (s === 'light' || s === 'dark') root.setAttribute('data-theme', s);

  var SUN = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4.5"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';
  var MOON = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>';

  function render(btn) {
    var dark = current() === 'dark';
    btn.innerHTML = dark ? SUN : MOON;
    btn.title = btn.ariaLabel = dark ? 'Switch to light mode' : 'Switch to dark mode';
  }

  document.addEventListener('DOMContentLoaded', function () {
    var nav = document.querySelector('nav');
    if (!nav) return;
    var here = location.pathname.replace(/\/$/, '/index.html');
    var brand = document.createElement('a');
    brand.className = 'brand';
    brand.href = new URL('index.html', SITE_ROOT).href;
    brand.setAttribute('aria-label', 'Kushal Chattopadhyay, home');
    brand.innerHTML = '<svg class="logo" viewBox="0 0 100 100" aria-hidden="true"><defs><mask id="kcmask" maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="100"><rect width="100" height="100" fill="#fff"/><rect x="65.2" y="39.6" width="40" height="20" fill="#000"/></mask></defs><circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" stroke-width="10"/><polygon points="22.5,24.75 29.25,24.75 29.25,47.4 39.95,24.75 46.7,24.75 37,44.75 48.15,74.5 41.13,74.5 33.2,52.6 29.25,60.7 29.25,74.5 22.5,74.5" fill="currentColor"/><ellipse cx="65.2" cy="49.625" rx="10.05" ry="21.5" fill="none" stroke="currentColor" stroke-width="6.75" mask="url(#kcmask)"/></svg>';
    nav.appendChild(brand);
    var links = document.createElement('div');
    links.className = 'links';
    NAV.forEach(function (item) {
      var a = document.createElement('a');
      a.href = new URL(item[1], SITE_ROOT).href;
      a.textContent = item[0];
      var path = new URL(a.href).pathname;
      var inBlog = item[0] === 'Blog' && /\/blog\//.test(here);
      if (path === here || inBlog || (item[0] === 'Home' && /\/$/.test(location.pathname))) a.className = 'active';
      links.appendChild(a);
    });
    nav.appendChild(links);
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'theme-toggle';
    render(btn);
    btn.addEventListener('click', function () {
      var next = current() === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem(KEY, next); } catch (e) {}
      render(btn);
    });
    links.appendChild(btn);

    // Header: hairline once scrolled, hide on scroll down, show on scroll up
    var lastY = 0;
    addEventListener('scroll', function () {
      var y = scrollY;
      nav.classList.toggle('scrolled', y > 8);
      if (y > lastY && y > 120) nav.setAttribute('data-hidden', ''); else nav.removeAttribute('data-hidden');
      lastY = y;
    }, { passive: true });

    // Project filters (projects page only)
    var chips = document.querySelectorAll('.filters button');
    chips.forEach(function (c) {
      c.addEventListener('click', function () {
        chips.forEach(function (x) { x.classList.remove('active'); });
        c.classList.add('active');
        var f = c.dataset.filter;
        document.querySelectorAll('[data-tags]').forEach(function (e) {
          e.classList.toggle('hidden', f !== 'all' && e.dataset.tags.split(' ').indexOf(f) < 0);
        });
      });
    });
  });
})();

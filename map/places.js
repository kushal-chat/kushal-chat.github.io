// Places map: Leaflet over a self-hosted world outline (data/world.json, Natural Earth, public domain).
// No tile server and no API key. Add a place by appending { name, label?, lat, lng, note, link? } to data/places.json.
(function () {
  var el = document.getElementById('map');
  if (!el || !window.L) return;

  var WORLD = L.latLngBounds([[-58, -180], [84, 180]]);
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };

  var map = L.map(el, { scrollWheelZoom: false, zoomSnap: 0.25, zoomDelta: 0.5, worldCopyJump: false, maxBoundsViscosity: 1, maxZoom: 7 });
  map.attributionControl.setPrefix(false);
  map.attributionControl.addAttribution('Boundaries: Natural Earth');
  map.on('click', function () { map.scrollWheelZoom.enable(); });
  map.on('mouseout', function () { map.scrollWheelZoom.disable(); });

  function fitWorld() {
    map.setMaxBounds(null);
    map.fitBounds(WORLD, { animate: false });
    map.setMinZoom(map.getZoom());
    map.setMaxBounds(WORLD.pad(0.15));
  }
  if (window.ResizeObserver) new ResizeObserver(function () { map.invalidateSize(); }).observe(el);

  Promise.all([
    fetch('data/world.json').then(function (r) { return r.json(); }),
    fetch('data/places.json').then(function (r) { return r.json(); })
  ]).then(function (res) {
    L.geoJSON(res[0], { style: { className: 'land', weight: 0.6, fillOpacity: 1 }, interactive: false }).addTo(map);
    fitWorld();
    var data = res[1];
    init(Array.isArray(data) ? data : (data.places || []));
  }).catch(function (e) { el.textContent = 'Could not load map data: ' + e.message; });

  function init(places) {
    var layer = L.layerGroup().addTo(map);
    var list = document.getElementById('place-list');
    var items = [], active = null;

    function select(it, fly) {
      if (active) { active.li.classList.remove('active'); active.m.setRadius(6); }
      active = it;
      it.li.classList.add('active'); it.m.setRadius(9); it.m.bringToFront();
      if (fly) map.flyTo([it.p.lat, it.p.lng], Math.max(map.getZoom(), 4), { duration: .8 });
      it.m.openPopup();
    }

    places.forEach(function (p) {
      var m = L.circleMarker([p.lat, p.lng], { radius: 6, className: 'pin', fillOpacity: 1, weight: 2 });
      m.bindPopup('<strong>' + esc(p.name) + '</strong>' + esc(p.note) +
        (p.link ? '<br><a href="' + esc(p.link) + '">Read more →</a>' : ''), { closeButton: false, offset: [0, -2] });
      var text = p.label || String(p.name).split(',')[0], side = p.lng > 100 ? 'left' : 'right';   // keep labels inside the map
      m.bindTooltip(esc(text), { permanent: true, direction: side, offset: [side === 'left' ? -9 : 9, 0], className: 'pin-label' });

      var li = document.createElement('li');
      li.innerHTML = '<span><a href="#">' + esc(p.name) + '</a><br><small>' + esc(p.note) + '</small></span>';
      var it = { p: p, m: m, li: li, side: side, text: text };
      li.querySelector('a').addEventListener('click', function (e) {
        e.preventDefault(); select(it, true);
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
      m.on('click', function () { select(it, false); });
      if (list) list.appendChild(li);
      items.push(it);
      layer.addLayer(m);
    });

    // Hide labels that would overlap an earlier label; re-run on zoom and pan.
    function declutter() {
      var boxes = [];
      items.forEach(function (it) {
        var tip = it.m.getTooltip && it.m.getTooltip(), node = tip && tip.getElement && tip.getElement();
        if (!node) return;
        var pt = map.latLngToContainerPoint(it.m.getLatLng()), w = it.text.length * 6.4 + 12, h = 16;
        var box = { x: it.side === 'left' ? pt.x - 9 - w : pt.x + 9, y: pt.y - h / 2, w: w, h: h };
        var hit = boxes.some(function (b) { return box.x < b.x + b.w && box.x + box.w > b.x && box.y < b.y + b.h && box.y + box.h > b.y; });
        node.style.visibility = hit ? 'hidden' : 'visible';
        if (!hit) boxes.push(box);
      });
    }
    map.on('zoomend moveend', declutter);
    setTimeout(declutter, 50);
  }
})();

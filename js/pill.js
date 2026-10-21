// BXYZ:..:eliot@bosmanxyz.xyz:..:.www.bosmanxyz.xyz
(function () {
  var PROFIL = {
    fin: [
      { w: 0.57, lag: 'halo',  kant: 0.57, mjuk: 1.14 },
      { w: 0.26, lag: 'luft' },
      { w: 1.00, lag: 'ring' },
      { w: 0.39, lag: 'luft' },
      { w: 1.00, lag: 'ring' },
      { w: 3.87, lag: 'bloom', kant: 1.52, mjuk: 0.74, skift: 0.61, klipp: true },
      { w: 1.65, lag: 'luft' },
      { w: 2.74, lag: 'kol' },
      { w: 8.26, lag: 'karna' }
    ],
    grov: [
      { w: 0.090, lag: 'halo',  kant: 0.09, mjuk: 1.00 },
      { w: 0.060, lag: 'luft' },
      { w: 0.130, lag: 'ring' },
      { w: 0.185, lag: 'bloom', kant: 0.14, mjuk: 0.70, skift: 0.03, klipp: true },
      { w: 0.100, lag: 'luft' },
      { w: 0.160, lag: 'kol' },
      { w: 0.275, lag: 'karna' }
    ]
  };

  var GRANS = 120;
  var SVALL = 0.34;
  var STYVHET = 170;
  var DAMPNING = 24;

  var minskad = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function summa(lager) {
    var n = 0;
    for (var i = 0; i < lager.length; i++) n += lager[i].w;
    return n;
  }

  function valj(R) { return R >= GRANS ? 'fin' : 'grov'; }

  function Fjader(v) { this.v = v; this.mal = v; this.fart = 0; }
  Fjader.prototype.steg = function (dt) {
    if (minskad) { this.v = this.mal; this.fart = 0; return this.v; }
    var a = (this.mal - this.v) * STYVHET - this.fart * DAMPNING;
    this.fart += a * dt;
    this.v += this.fart * dt;
    return this.v;
  };
  Fjader.prototype.vilar = function () {
    return Math.abs(this.mal - this.v) < 0.0004 && Math.abs(this.fart) < 0.0004;
  };

  function bygg(vard, namn) {
    var lager = PROFIL[namn];
    var total = summa(lager);
    var band = [];
    var kvar = total;
    vard.replaceChildren();
    vard.setAttribute('data-profil', namn);
    lager.forEach(function (def) {
      var el = document.createElement('span');
      el.className = 'pill__band';
      el.setAttribute('data-lag', def.lag);
      el.setAttribute('aria-hidden', 'true');
      if (def.kant) el.setAttribute('data-ring', '');
      if (def.mjuk) el.setAttribute('data-mjuk', '');
      if (def.klipp) el.setAttribute('data-klipp', '');
      band.push({ el: el, def: def, f: new Fjader(kvar / total), vilo: kvar / total });
      vard.appendChild(el);
      kvar -= def.w;
    });
    band.total = total;
    return band;
  }

  function rita(band, R) {
    var enhet = R / band.total;
    for (var i = 0; i < band.length; i++) {
      var post = band[i];
      var steg = post.f.v * R;
      var skift = (post.def.skift || 0) * enhet;
      var st = post.el.style;
      st.setProperty('--d', (2 * (steg - skift)).toFixed(2) + 'px');
      if (post.def.kant) st.setProperty('--kantbredd', (post.def.kant * enhet).toFixed(2) + 'px');
      if (post.def.mjuk) st.setProperty('--mjuk', (post.def.mjuk * post.def.kant * enhet).toFixed(2) + 'px');
      if (post.def.klipp) st.setProperty('--klipp', steg.toFixed(2) + 'px');
    }
  }

  function koppla(vard) {
    var R = vard.clientWidth / 2;
    var namn = valj(R);
    var band = bygg(vard, namn);
    var levande = false;
    var sist = 0;

    function mal(traff) {
      for (var i = 0; i < band.length; i++) {
        var ut = (traff >= 0 && i <= traff) ? SVALL / band.total : 0;
        band[i].f.mal = band[i].vilo + ut;
      }
      starta();
    }

    function ram(nu) {
      var dt = sist ? Math.min((nu - sist) / 1000, 0.05) : 0.016;
      sist = nu;
      var rorelse = false;
      for (var i = 0; i < band.length; i++) {
        band[i].f.steg(dt);
        if (!band[i].f.vilar()) rorelse = true;
      }
      rita(band, R);
      if (rorelse) { requestAnimationFrame(ram); } else { levande = false; sist = 0; }
    }

    function starta() {
      if (levande) return;
      levande = true;
      sist = 0;
      requestAnimationFrame(ram);
    }

    function lyssna() {
      vard.addEventListener('pointerenter', function () { mal(band.length - 1); });
      vard.addEventListener('focus', function () { mal(band.length - 1); });
      vard.addEventListener('pointerleave', function () { mal(-1); });
      vard.addEventListener('blur', function () { mal(-1); });
    }
    lyssna();

    window.addEventListener('resize', function () {
      R = vard.clientWidth / 2;
      var ny = valj(R);
      if (ny !== namn) {
        namn = ny;
        band = bygg(vard, namn);
      }
      rita(band, R);
    });

    rita(band, R);
  }

  function alla() {
    document.querySelectorAll('[data-pill]').forEach(function (vard) {
      if (vard.dataset.pillKlar) return;
      vard.dataset.pillKlar = '1';
      koppla(vard);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', alla, { once: true });
  } else {
    alla();
  }
  window.bxyzPill = { profil: PROFIL, grans: GRANS, montera: alla };
})();

// BXYZ:..:eliot@bosmanxyz.xyz:..:.www.bosmanxyz.xyz
(function () {
  var html = document.documentElement;
  var listaNod = document.getElementById('bilder-lista');
  var texterNod = document.getElementById('texter-lista');
  var bilder = listaNod ? JSON.parse(listaNod.textContent) : [];
  var texter = texterNod ? JSON.parse(texterNod.textContent) : [];
  var kort = bilder.slice();
  var lenis = null;
  var bars = document.querySelector('.bars');
  var minskad = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var matt = { u: 36, huvud: 108, falt: 900 };
  var sida = document.querySelector('.home') ? 'hem' : bars ? 'index' : document.querySelector('.project') ? 'projekt' : 'info';
  var flode = {
    hem:     { vila: 'topp-hoger', guide: false, steg: 3 },
    index:   { vila: 'topp-hoger', guide: false, steg: 3 },
    projekt: { vila: 'topp-hoger', guide: false, steg: 3 },
    info:    { vila: 'topp-hoger', guide: false, steg: 3 }
  };
  var vantande = '';
  var fallN = 0;
  var acc = 0;
  var senY = window.scrollY;
  var ram = 0;
  var rulleSteg = [];
  var rulleFigur = null;

  function mat(prop) {
    var prov = document.createElement('i');
    prov.style.cssText = 'position:absolute;visibility:hidden;block-size:' + prop;
    document.body.appendChild(prov);
    var n = prov.getBoundingClientRect().height;
    prov.remove();
    return n || 36;
  }
  function tauMs() { return parseFloat(getComputedStyle(html).getPropertyValue('--tau')) || 80; }
  function idxTak() {
    var n = parseFloat(getComputedStyle(html).getPropertyValue('--idx-tak'));
    return Number.isFinite(n) && n > 0 ? n : 12;
  }
  function ease(t) { return 1 - Math.pow(1 - t, 3); }
  function matOm() {
    matt.u = mat('var(--u)') || 36;
    matt.huvud = mat('var(--huvud)') || matt.u * 3;
    matt.falt = mat('var(--falt-block)') || window.innerHeight;
    html.style.setProperty('--flip-rader', String(Math.max(1, Math.round(matt.falt / matt.u))));
  }
  var rang = { lage: 1, fall: 2, vand: 3, meny: 4 };
  var FALL_VAL = '.bar, .project__band, .info__fall, .fot';
  var FALL_OPPEN = '.bar[data-open], .project__band[data-open], .info__fall[data-open], .fot[data-open]';
  function lasPa(orsak) {
    if (minskad || tauMs() === 0) return;
    var nu = html.dataset.las;
    if (nu && (rang[nu] || 0) > (rang[orsak] || 0)) return;
    html.dataset.las = orsak;
  }
  function lasAv(orsak) {
    if (html.dataset.las !== orsak) return;
    delete html.dataset.las;
    if (!vantande) return;
    var nasta = vantande;
    var led = html.dataset.vantLed || '';
    vantande = '';
    delete html.dataset.vantLed;
    sattLage(nasta, led);
  }
  function lasFall() {
    if (minskad || tauMs() === 0) return;
    if (html.dataset.las && (rang[html.dataset.las] || 0) > rang.fall) return;
    fallN += 1;
    html.dataset.las = 'fall';
  }
  function fallKlar() {
    fallN = Math.max(0, fallN - 1);
    if (fallN) return;
    lasAv('fall');
  }
  function stegFor(fran, till) {
    if (!fran || fran === till) return 3;
    var plan = flode[sida];
    if (plan && plan.steg) return plan.steg;
    var topp = function (n) { return n.indexOf('topp') === 0; };
    return topp(fran) !== topp(till) ? Math.max(1, Math.round(matt.falt / matt.u)) : 3;
  }
  function menyOppet() { return false; }
  function sattMark() {
    var nasta = sida === 'projekt' ? 'projekt' : 'vila';
    if (html.dataset.syfte === 'led') nasta = 'led';
    if (document.querySelector(FALL_OPPEN)) nasta = 'fall';
    if (menyOppet()) nasta = 'meny';
    html.dataset.mark = nasta;
  }
  function markRoll() {}
  function sattLage(nasta, led) {
    if (!nasta || nasta === html.dataset.lage) return;
    if (menyOppet() || html.dataset.las) { vantande = nasta; html.dataset.vantLed = led || ''; return; }
    html.style.setProperty('--mark-steg', String(stegFor(html.dataset.lage || '', nasta)));
    html.dataset.lage = nasta;
    var plan = flode[sida];
    var guide = !(plan && plan.guide === false) && (nasta === 'botten-mitten' || led === 'upp');
    html.dataset.syfte = guide ? 'led' : 'meny';
    if (guide) html.dataset.led = led || 'ned';
    else delete html.dataset.led;
    markRoll();
    lasPa('lage');
    sattMark();
  }
  function rulla(mal, direkt) {
    if (!mal) return;
    var u = matt.u;
    var offset = -matt.huvud;
    var dist = Math.abs(mal.getBoundingClientRect().top + offset);
    var rader = Math.max(1, Math.min(idxTak(), Math.round(dist / u)));
    var sek = (tauMs() * rader) / 1000;
    if (lenis && !direkt && !minskad) {
      lenis.scrollTo(mal, { offset: offset, duration: sek, easing: ease, lerp: undefined });
      return;
    }
    mal.scrollIntoView({ behavior: direkt || minskad ? 'auto' : 'smooth', block: 'start' });
  }
  function aterLage() {
    var plan = flode[sida];
    if (!plan) return;
    var y = window.scrollY;
    var max = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    var nasta = plan.vila;
    var led = '';
    if (plan.ned && y >= matt.u && max - y >= matt.u * 2) { nasta = plan.ned; led = 'ned'; }
    else if (plan.slut && max - y < matt.u * 2) nasta = plan.slut;
    sattLage(nasta, led);
  }
  function hashMal() {
    var id = location.hash.slice(1);
    if (!id) return null;
    return document.getElementById(id) || document.querySelector('[data-slug="' + id + '"]');
  }
  function markera(img) {
    img.setAttribute('data-laddad', '');
    img.setAttribute('data-visad', '');
  }
  function ladda(img) {
    if (!img) return;
    img.removeAttribute('data-laddad');
    var visa = function () { markera(img); };
    if (img.complete && img.naturalWidth) { requestAnimationFrame(function () { requestAnimationFrame(visa); }); return; }
    img.addEventListener('load', visa, { once: true });
  }
  function bytBild(img, src) {
    if (!img || !src) return;
    if (img.getAttribute('src') === src && img.complete && img.naturalWidth) { markera(img); return; }
    if (!img.hasAttribute('data-visad')) img.removeAttribute('data-laddad');
    img.addEventListener('load', function () { markera(img); }, { once: true });
    img.src = src;
    if (img.complete && img.naturalWidth) markera(img);
  }
  function skrivTal(g, i) {
    var n = Number(g.dataset.antal) || 1;
    var ix = g.querySelector('[data-roll="index"]');
    var an = g.querySelector('[data-roll="antal"]');
    if (ix) ix.textContent = ix.classList.contains('project__tal') ? String(i + 1).padStart(2, '0') : String(i + 1);
    if (an) an.textContent = an.classList.contains('project__tal') ? String(n).padStart(2, '0') : String(n);
    var text = g.querySelector('[data-roll="text"]');
    if (text && texter.length) text.textContent = texter[i % texter.length];
    var mer = g.querySelector('[data-roll="mer"]');
    if (mer && texter.length) mer.textContent = texter.join(' ');
  }
  function slappZoom(nod) {
    if (!nod) return;
    nod.removeAttribute('data-zoom');
    var yta = nod.querySelector && nod.querySelector('.galleri__yta');
    if (yta) yta.removeAttribute('data-zoom');
  }
  function stangAutoBand() {
    document.querySelectorAll('.project__band[data-open]:not([data-hall])').forEach(function (band) {
      if (band.closest('.project[data-form="dubbel"]')) return;
      band.removeAttribute('data-open');
      var knapp = band.querySelector('.project__head');
      if (knapp) knapp.setAttribute('aria-expanded', 'false');
    });
    sattMark();
  }
  function oppnaAutoBand() {
    document.querySelectorAll('.project__band').forEach(function (band) {
      if (band.hasAttribute('data-hall')) return;
      band.setAttribute('data-open', '');
      var knapp = band.querySelector('.project__head');
      if (knapp) knapp.setAttribute('aria-expanded', 'true');
    });
    sattMark();
  }
  function zooma(yta) {
    if (!yta) return;
    stangAutoBand();
    if (yta.getAttribute('data-zoom') === 'in') yta.removeAttribute('data-zoom');
    else yta.setAttribute('data-zoom', 'in');
  }
  function visaGalleri(g) {
    var n = Number(g.dataset.antal) || 1;
    var i = ((Number(g.dataset.index) % n) + n) % n;
    g.dataset.index = String(i);
    g.dataset.klar = 'nasta';
    skrivTal(g, i);
    var nu = g.querySelector('[data-sida="nu"]');
    var inn = g.querySelector('[data-sida="in"]');
    if (nu && kort.length) bytBild(nu, kort[i]);
    if (inn && kort.length) bytBild(inn, kort[(i + 1) % n]);
  }
  function steg(g, d) {
    if (!g) return;
    if (g.classList.contains('project__galleri')) stangAutoBand();
    var n = Number(g.dataset.antal) || 1;
    if (n < 2) return;
    var fran = ((Number(g.dataset.index) % n) + n) % n;
    var till = (fran + d + n) % n;
    g.removeAttribute('data-vand');
    slappZoom(g);
    g.dataset.index = String(till);
    if (g.classList.contains('project__galleri')) {
      g.style.setProperty('--svep', '0');
      window.scrollTo({ top: till * window.innerHeight, behavior: 'auto' });
      lasBild();
      return;
    }
    visaGalleri(g);
  }
  function lasBild() {
    var g = document.querySelector('.project .galleri');
    if (!g || g.hasAttribute('data-vand')) return;
    var n = Number(g.dataset.antal) || 1;
    var vh = window.innerHeight || 1;
    var y = window.scrollY / vh;
    if (y < 0) y = 0;
    if (y > n - 1) y = n - 1;
    var i = Math.floor(y + 1e-4);
    if (i > n - 1) i = n - 1;
    var f = i >= n - 1 ? 0 : y - i;
    g.style.setProperty('--svep', String(f));
    if (i >= n - 1) g.setAttribute('data-slut', '');
    else g.removeAttribute('data-slut');
    if (String(i) !== g.dataset.index) {
      g.dataset.index = String(i);
      skrivTal(g, i);
      slappZoom(g);
      if (i) stangAutoBand();
    }
    var nu = g.querySelector('[data-sida="nu"]');
    var inn = g.querySelector('[data-sida="in"]');
    if (nu && kort.length) bytBild(nu, kort[i]);
    if (inn && kort.length) bytBild(inn, kort[Math.min(n - 1, i + 1)]);
  }
  function shut() {
    if (!bars) return 0;
    var oppna = bars.querySelectorAll('.bar[data-open]');
    oppna.forEach(function (b) {
      b.removeAttribute('data-open');
      b.querySelector('.bar__head').setAttribute('aria-expanded', 'false');
    });
    return oppna.length;
  }
  var kantFarger = ['var(--gul)', 'var(--vit)', 'var(--rok)', 'var(--silver)', 'var(--dim)', 'var(--rosa)', 'var(--bla)', 'var(--tra)', 'var(--oliv)', 'var(--svart)'];
  function fallHuvud(el) {
    return el.querySelector('.bar__head, .project__head, .info__head, .fot__rad') || el;
  }
  function genomskinlig(f) { return !f || f === 'transparent' || /,\s*0\)$/.test(f); }
  function bakgrund(el) {
    var nod = el;
    while (nod && nod !== document.documentElement) {
      var f = getComputedStyle(nod).backgroundColor;
      if (!genomskinlig(f)) return f;
      nod = nod.parentElement;
    }
    return getComputedStyle(document.body).backgroundColor;
  }
  function slumpKant(bar) {
    var falt = bakgrund(fallHuvud(bar));
    var probe = document.createElement('i');
    probe.style.cssText = 'position:absolute;visibility:hidden';
    document.body.appendChild(probe);
    var vald = kantFarger[0];
    for (var n = 0; n < kantFarger.length; n++) {
      vald = kantFarger[Math.floor(Math.random() * kantFarger.length)];
      probe.style.background = vald;
      if (getComputedStyle(probe).backgroundColor !== falt) break;
    }
    probe.remove();
    bar.style.setProperty('--kant', vald);
  }
  function fallFarg(foredrag) {
    if (foredrag && foredrag.hasAttribute('data-open')) { colour(foredrag); return; }
    var vald = null;
    document.querySelectorAll(FALL_VAL).forEach(function (el) {
      if (el.hasAttribute('data-open')) vald = el;
    });
    colour(vald);
  }
  function colour(bar) {
    if (!bar) {
      html.style.removeProperty('--field');
      html.style.removeProperty('--accent');
      html.style.removeProperty('--rad-text');
      html.style.removeProperty('--kant');
      return;
    }
    var par = getComputedStyle(bar);
    html.style.setProperty('--field', bar.style.getPropertyValue('--field') || par.getPropertyValue('--field').trim());
    html.style.setProperty('--accent', bar.style.getPropertyValue('--accent') || par.getPropertyValue('--accent').trim());
    html.style.setProperty('--rad-text', bar.style.getPropertyValue('--rad-text') || par.getPropertyValue('--rad-text').trim());
    html.style.setProperty('--kant', bar.style.getPropertyValue('--kant'));
  }
  function sattFlipRader() { matOm(); }
  function hemTal(hem) {
    var n = bilder.length;
    var i = Number(hem.dataset.index) || 0;
    var ix = hem.querySelector('[data-roll="index"]');
    var an = hem.querySelector('[data-roll="antal"]');
    if (ix) ix.textContent = String(i + 1);
    if (an) an.textContent = String(n);
  }
  function lagraBlad(i) {
    try { sessionStorage.setItem('loa-hem-index', String(i)); } catch (err) {}
  }
  function slumpBlad(n) {
    var raw = null;
    try { raw = sessionStorage.getItem('loa-hem-index'); } catch (err) { raw = null; }
    var last = raw === null || raw === '' ? -1 : Number(raw);
    var i = Math.floor(Math.random() * n);
    if (n > 1 && i === last) i = (i + 1) % n;
    return i;
  }
  function visaSida(hem, i) {
    var n = bilder.length;
    if (!n) return;
    i = ((i % n) + n) % n;
    slappZoom(hem);
    hem.dataset.index = String(i);
    var nu = hem.querySelector('[data-sida="nu"]');
    var inn = hem.querySelector('[data-sida="in"]');
    if (nu) bytBild(nu, bilder[i]);
    if (inn) bytBild(inn, bilder[(i + 1) % n]);
    hemTal(hem);
    lagraBlad(i);
  }
  function vandra(hem, d) {
    var n = bilder.length;
    if (!hem || !n) return;
    visaSida(hem, (Number(hem.dataset.index) + d + n) % n);
  }
  function startaHem() {
    var hem = document.querySelector('.home');
    if (!hem || !bilder.length) return;
    sattFlipRader();
    hem.dataset.riktning = 'nasta';
    hem.dataset.klar = 'nasta';
    visaSida(hem, slumpBlad(bilder.length));
    hem.addEventListener('pointermove', function (e) {
      if (hem.hasAttribute('data-vand')) return;
      var r = hem.getBoundingClientRect();
      var t = (e.clientX - r.left) / r.width;
      hem.dataset.riktning = t < 0.5 ? 'fore' : 'nasta';
    });
  }
  function bildMatt(img) {
    var w = Number(img.getAttribute('width')) || img.naturalWidth || 0;
    var h = Number(img.getAttribute('height')) || img.naturalHeight || 0;
    return { w: w, h: h, port: h > w && w > 0 };
  }
  function grupperaYta(rot) {
    var i = 0;
    while (i < rot.children.length) {
      var el = rot.children[i];
      if (el.tagName !== 'IMG') { i += 1; continue; }
      var a = bildMatt(el);
      var nasta = rot.children[i + 1];
      var b = nasta && nasta.tagName === 'IMG' ? bildMatt(nasta) : null;
      var yta = document.createElement('div');
      yta.className = 'bar__yta';
      if (a.port && b && b.port) {
        yta.dataset.yta = 'par';
        yta.style.setProperty('--rad-kvot', String(2 / Math.max(a.h / a.w, b.h / b.w)));
        rot.insertBefore(yta, el);
        yta.appendChild(el);
        yta.appendChild(nasta);
      } else {
        yta.dataset.yta = 'vid';
        rot.insertBefore(yta, el);
        yta.appendChild(el);
      }
    }
  }
  document.querySelectorAll('.bar__sida, .bar__rulle').forEach(grupperaYta);

  function openBar(bar, rullaDit) {
    if (!bars || !bar) return;
    shut();
    bar.setAttribute('data-open', '');
    bar.querySelector('.bar__head').setAttribute('aria-expanded', 'true');
    slumpKant(bar);
    fallFarg(bar);
    markRoll();
    sattMark();
    requestAnimationFrame(function () {
      if (lenis) lenis.resize();
      if (rullaDit) rulla(bar);
    });
  }

  if (kort.length) {
    for (var i = kort.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = kort[i];
      kort[i] = kort[j];
      kort[j] = t;
    }
    document.querySelectorAll('.shot__bild').forEach(function (el, n) {
      el.src = kort[n % kort.length];
    });
    startaHem();
    document.querySelectorAll('.galleri').forEach(function (g, n) {
      g.dataset.index = String(n % kort.length);
      g.dataset.antal = String(kort.length);
      var artikel = g.closest('.project');
      if (artikel) artikel.style.setProperty('--antal', String(kort.length));
      visaGalleri(g);
    });
    if (document.querySelector('.project .galleri')) { lasBild(); oppnaAutoBand(); }
    var rulle = document.querySelector('.project .project__rulle');
    if (rulle) {
      var artikeln = rulle.closest('.project');
      var figur = artikeln && artikeln.querySelector('.project__galleri');
      var steg = [];
      kort.forEach(function (src, i) {
        var img = document.createElement('img');
        img.alt = '';
        img.width = 1600;
        img.height = 1200;
        img.dataset.steg = String(i);
        rulle.appendChild(img);
        bytBild(img, src);
        steg.push(img);
      });
      if (figur) {
        figur.dataset.antal = String(kort.length);
        rulleFigur = figur;
        rulleSteg = steg;
        foljRulle();
      }
    }
  }

  // one read per scroll frame: whatever sits nearest the middle writes the
  // bottom band, so images and modules speak through the same label.
  // project page 003: two columns scroll on their own, so the window never
  // moves. the header answers whichever column is being read.
  function kopplaSpalter() {
    var artikel = document.querySelector('.project[data-form="dubbel"]');
    if (!artikel) return;
    var spalter = artikel.querySelectorAll('.projekt__spalt');
    if (!spalter.length) return;
    var banden = artikel.querySelectorAll('.project__band[data-kant="rubrik"]');
    var trosk = matt.u * 2;
    // how far the fold travels, in rows, capped by the idx ceiling. the same
    // reading rulla() uses, so this move is timed like every other one.
    function steg() {
      var hojd = 0;
      banden.forEach(function (band) {
        var fold = band.querySelector('.project__fold');
        hojd = Math.max(hojd, fold ? fold.scrollHeight : 0);
      });
      // distance in rows, but held to the same short range the mark uses for an
      // ordinary move. a header stepping aside is not a journey across the field.
      var rader = Math.round(hojd / matt.u);
      rader = Math.max(2, Math.min(4, Math.min(idxTak(), rader)));
      artikel.style.setProperty('--rubrik-steg', String(rader));
    }
    steg();
    function sattBand(band, oppen) {
      if (oppen) band.setAttribute('data-open', '');
      else band.removeAttribute('data-open');
      var knapp = band.querySelector('.project__head');
      if (knapp) knapp.setAttribute('aria-expanded', oppen ? 'true' : 'false');
    }
    function markeraStycke() {
      var poster = [];
      var telefon = !window.matchMedia('(min-width: 40rem)').matches;
      spalter.forEach(function (sp) {
        var hoger = sp.dataset.sida === 'hoger';
        Array.prototype.forEach.call(sp.children, function (el, i) {
          el.removeAttribute('data-fore');
          el.removeAttribute('data-nasta');
          poster.push({ el: el, ordning: i * 2 + (hoger ? 1 : 0) });
        });
      });
      if (!telefon) return;
      poster.sort(function (a, b) { return a.ordning - b.ordning; });
      var fore = null;
      poster.forEach(function (post) {
        var text = post.el.classList.contains('spalt__text');
        if (text && fore) {
          fore.setAttribute('data-fore', '');
          post.el.setAttribute('data-nasta', '');
        }
        fore = text ? post.el : null;
      });
    }
    function las() {
      var djupast = window.scrollY;
      spalter.forEach(function (sp) { djupast = Math.max(djupast, sp.scrollTop); });
      var nere = djupast > trosk;
      artikel.dataset.rubrik = nere ? 'dold' : 'synlig';
      // back at the top the columns take both labels back. a click below the
      // threshold holds that one label until the reader returns.
      if (!nere) banden.forEach(function (band) { band.removeAttribute('data-hall'); });
      banden.forEach(function (band) {
        if (band.hasAttribute('data-hall')) return;
        sattBand(band, !nere);
      });
    }
    // the window never moves here, so each column carries the same lenis as
    // the archive (lerp 0.1). one wheel event is capped at idx-tak rows,
    // the same ceiling rulla() uses, so a flick cannot skip the column.
    var motorer = [];
    function motorerAv() {
      motorer.forEach(function (m) { m.destroy(); });
      motorer = [];
    }
    function motorerPa() {
      var tva = window.matchMedia('(min-width: 40rem)').matches;
      if (!tva || minskad || !globalThis.Lenis) { motorerAv(); return; }
      if (motorer.length) return;
      spalter.forEach(function (sp) {
        sp.removeAttribute('data-lenis-prevent');
        motorer.push(new globalThis.Lenis({
          wrapper: sp,
          content: sp,
          autoRaf: true,
          smoothWheel: true,
          lerp: 0.1,
          overscroll: false,
          virtualScroll: function (data) {
            var tak = idxTak() * (matt.u || 1);
            var d = data.deltaY;
            if (!d || Math.abs(d) <= tak) return;
            data.deltaY = Math.sign(d) * tak;
          }
        }));
      });
    }
    spalter.forEach(function (sp) {
      sp.addEventListener('scroll', las, { passive: true });
    });
    window.addEventListener('scroll', las, { passive: true });
    window.addEventListener('resize', function () { steg(); markeraStycke(); las(); motorerPa(); });
    markeraStycke();
    motorerPa();
    las();
  }
  kopplaSpalter();

  function foljRulle() {
    if (!rulleFigur || !rulleSteg.length) return;
    var mitt = window.innerHeight / 2;
    var bast = null;
    var minst = Infinity;
    for (var i = 0; i < rulleSteg.length; i++) {
      var r = rulleSteg[i].getBoundingClientRect();
      if (r.bottom < 0 || r.top > window.innerHeight) continue;
      var d = Math.abs((r.top + r.bottom) / 2 - mitt);
      if (d < minst) { minst = d; bast = rulleSteg[i]; }
    }
    if (!bast) return;
    skrivTal(rulleFigur, Number(bast.dataset.steg) || 0);
  }
  document.querySelectorAll('.home__image, .galleri__bild, .project__rulle img').forEach(ladda);

  document.querySelectorAll('.galleri__yta').forEach(function (yta) {
    yta.dataset.riktning = 'nasta';
    yta.addEventListener('pointermove', function (e) {
      var r = yta.getBoundingClientRect();
      var t = (e.clientX - r.left) / r.width;
      if (yta.closest('.bar')) { yta.dataset.riktning = t < 0.5 ? 'fore' : 'nasta'; return; }
      var zoomaYta = !!yta.closest('.project');
      yta.dataset.riktning = zoomaYta ? (t < 0.369 ? 'fore' : t > 0.631 ? 'nasta' : 'plus') : (t < 0.5 ? 'fore' : 'nasta');
    });
  });

  var mark = document.querySelector('.mark');
  sattMark();

  if (mark) {
    var tryckTid = 0;
    var navigerar = false;
    function tryckAv() {
      if (navigerar) return;
      clearTimeout(tryckTid);
      tryckTid = 0;
      mark.removeAttribute('data-tryck');
    }
    function stilla() { return minskad || tauMs() === 0; }
    mark.addEventListener('pointerdown', function () {
      if (stilla()) return;
      mark.setAttribute('data-tryck', '');
    });
    mark.addEventListener('pointerup', tryckAv);
    mark.addEventListener('pointercancel', tryckAv);
    mark.addEventListener('pointerleave', tryckAv);
    mark.addEventListener('blur', tryckAv);
    mark.addEventListener('click', function (e) {
      var href = mark.getAttribute('href');
      if (!href || navigerar) return;
      if (e.defaultPrevented || e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (stilla()) return;
      e.preventDefault();
      navigerar = true;
      mark.setAttribute('data-tryck', '');
      clearTimeout(tryckTid);
      tryckTid = setTimeout(function () {
        mark.removeAttribute('data-tryck');
        tryckTid = setTimeout(function () { location.href = href; }, tauMs());
      }, tauMs() * 2);
    });
  }

  document.addEventListener('click', function (e) {
    var atg = e.target.closest('[data-atgard]');
    if (atg) {
      var g = atg.closest('.galleri');
      var kod = atg.getAttribute('data-atgard');
      if (kod === 'bar/vaxla') {
        var head = atg.closest('.bar__head');
        var bar = head && head.closest('.bar');
        if (!bar) return;
        if (bar.hasAttribute('data-open')) { shut(); fallFarg(); markRoll(); sattMark(); return; }
        openBar(bar);
        history.replaceState(null, '', '#' + bar.dataset.slug);
        return;
      }
      if (kod === 'band/vaxla' || kod === 'fot/vaxla' || kod === 'remsa/vaxla') {
        var band = atg.closest('.project__band, .info__fall, .fot, .project__remsa');
        if (!band) return;
        var oppna = band.hasAttribute('data-open');
        if (oppna) {
          band.removeAttribute('data-open');
          band.removeAttribute('data-hall');
        } else {
          band.setAttribute('data-open', '');
          if (band.classList.contains('project__band')) band.setAttribute('data-hall', '');
          slumpKant(band);
        }
        atg.setAttribute('aria-expanded', oppna ? 'false' : 'true');
        fallFarg(band);
        markRoll();
        sattMark();
        return;
      }
      if (kod === 'hem/blad') {
        var hem = atg.classList.contains('home') ? atg : atg.closest('.home');
        if (!hem) return;
        e.preventDefault();
        vandra(hem, hem.dataset.riktning === 'fore' ? -1 : 1);
        return;
      }
      if (g && kod === 'galleri/nasta') { e.preventDefault(); steg(g, 1); return; }
      if (g && kod === 'galleri/fore') { e.preventDefault(); steg(g, -1); return; }
      // P3 click-to-zoom on an editorial project image
      if (kod === 'bild/zoom') { e.preventDefault(); zooma(atg); return; }
      if (g && kod === 'galleri/steg') {
        if (g.closest('.bar')) { e.preventDefault(); steg(g, atg.dataset.riktning === 'fore' ? -1 : 1); return; }
        if (atg.dataset.riktning === 'plus' && g.classList.contains('project__galleri')) { e.preventDefault(); zooma(atg); return; }
        e.preventDefault();
        steg(g, atg.dataset.riktning === 'fore' ? -1 : 1);
        return;
      }
    }
    var a = e.target.closest('a[href]');
    if (!a) return;
    var url;
    try { url = new URL(a.href); } catch (err) { return; }
    if (url.pathname !== location.pathname || !url.hash) return;
    var slug = url.hash.slice(1);
    var mal = document.getElementById(slug) || document.querySelector('[data-slug="' + slug + '"]');
    if (!mal) return;
    e.preventDefault();
    history.replaceState(null, '', url.hash);
    if (mal.classList.contains('bar')) openBar(mal, true);
    else rulla(mal);
  });

  document.addEventListener('keydown', function (e) {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.classList && e.target.classList.contains('home')) {
      e.preventDefault();
      vandra(e.target, e.target.dataset.riktning === 'fore' ? -1 : 1);
      return;
    }
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    if (menyOppet()) return;
    var g = e.target.closest && e.target.closest('.galleri');
    if (!g) {
      if (e.target.closest('a, button, input, textarea')) return;
      var hem = document.querySelector('.home');
      if (hem) { e.preventDefault(); vandra(hem, e.key === 'ArrowRight' ? 1 : -1); return; }
      g = document.querySelector('.project .galleri');
      if (!g) return;
    }
    e.preventDefault();
    steg(g, e.key === 'ArrowRight' ? 1 : -1);
  });

  var start = hashMal();
  if (start && !start.classList.contains('bar')) start.scrollIntoView({ behavior: 'auto', block: 'start' });

  // on a page whose window never scrolls, smoothing the window only steals the
  // wheel from the columns that do scroll.
  if (globalThis.Lenis && !minskad && !document.querySelector('.project[data-form="dubbel"]')) {
    lenis = new globalThis.Lenis({ autoRaf: true, smoothWheel: true, lerp: 0.1 });
  }

  matOm();
  window.addEventListener('resize', matOm);
  function lasScroll() {
    ram = 0;
    lasBild();
    foljRulle();
    var plan = flode[sida];
    if (!plan || !plan.ned) return;
    var y = window.scrollY;
    var d = y - senY;
    senY = y;
    if (!d) return;
    acc = acc === 0 || Math.sign(d) === Math.sign(acc) ? acc + d : d;
    if (Math.abs(acc) < matt.u) return;
    var dir = acc > 0 ? 1 : -1;
    acc = 0;
    var max = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    var nasta = plan.vila;
    var led = '';
    if (y >= matt.u && max - y >= matt.u * 2) {
      nasta = dir > 0 ? plan.ned : plan.upp;
      led = dir > 0 ? 'ned' : (nasta.indexOf('topp') === 0 ? 'upp' : '');
    } else if (max - y < matt.u * 2) nasta = plan.slut || plan.vila;
    sattLage(nasta, led);
    sattMark();
  }

  // the feed bites its own tail: a second set of rows follows the first, and
  // the scroll position wraps by exactly one set so the seam is never seen.
  (function () {
    var fack = document.querySelector('.bars');
    if (!fack) return;
    var original = Array.prototype.slice.call(fack.querySelectorAll('.bar'));
    if (original.length < 2) return;

    original.forEach(function (bar) {
      var kopia = bar.cloneNode(true);
      kopia.setAttribute('data-eko', '');
      kopia.removeAttribute('data-open');
      kopia.querySelectorAll('[id]').forEach(function (n) { n.id = n.id + '-eko'; });
      kopia.querySelectorAll('[aria-controls]').forEach(function (n) {
        n.setAttribute('aria-controls', n.getAttribute('aria-controls') + '-eko');
        n.setAttribute('aria-expanded', 'false');
      });
      kopia.querySelectorAll('[data-slug]').forEach(function (n) { n.removeAttribute('data-slug'); });
      kopia.dataset.slug = bar.dataset.slug + '-eko';
      fack.appendChild(kopia);
    });

    var ettVarv = 0;
    function mat() {
      var forsta = fack.querySelector('.bar');
      var sista = fack.querySelector('.bar[data-eko]');
      if (!forsta || !sista) return;
      ettVarv = sista.getBoundingClientRect().top - forsta.getBoundingClientRect().top;
    }
    mat();
    window.addEventListener('resize', mat);

    var vilar = false;
    var sist = window.scrollY;
    function varv() {
      if (vilar || !ettVarv) { sist = window.scrollY; return; }
      var y = window.scrollY;
      var ny = y;
      if (y >= ettVarv) ny = y - ettVarv;                 // past the last row, back to the first
      sist = y;
      if (ny === y) return;
      vilar = true;
      if (lenis && lenis.scrollTo) lenis.scrollTo(ny, { immediate: true });
      else window.scrollTo(0, ny);
      sist = ny;
      requestAnimationFrame(function () { vilar = false; });
    }
    window.addEventListener('scroll', varv, { passive: true });
    document.addEventListener('click', function () { setTimeout(mat, 400); });
  })();

  window.addEventListener('scroll', function () {
    if (ram) return;
    ram = requestAnimationFrame(lasScroll);
  }, { passive: true });

  if (!bars) return;
  if (lenis && typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(function () { lenis.resize(); }).observe(bars);
  }
  bars.addEventListener('transitionend', function (e) {
    if (!e.target.classList || !e.target.classList.contains('bar__fold')) return;
    if (e.propertyName !== 'grid-template-rows') return;
    fallKlar();
  });
  var startBar = start && start.classList.contains('bar') ? start : null;
  if (!startBar) {
    var slug = location.hash.slice(1);
    startBar = slug && bars.querySelector('.bar[data-slug="' + slug + '"]');
  }
  if (startBar) openBar(startBar, true);
})();

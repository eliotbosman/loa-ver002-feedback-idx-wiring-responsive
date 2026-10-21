// BXYZ:..:eliot@bosmanxyz.xyz:..:.www.bosmanxyz.xyz
(function () {
  const ns = 'http://www.w3.org/2000/svg';
  const modell = JSON.parse(document.getElementById('modell').textContent);
  const svg = document.getElementById('karta');
  const fyndRot = document.getElementById('fynd');
  const detalj = document.getElementById('detalj');
  const filterFalt = document.getElementById('filter');
  const allaFalt = document.getElementById('alla');
  const verktygFalt = document.getElementById('verktyg');
  const sidaFalt = document.getElementById('sida');
  const summa = document.getElementById('summa');
  const led = document.getElementById('led');

  const lage = { vy: 'funktioner', vald: null, tx: 24, ty: 24, sc: 1 };
  let drag = null;

  modell.dom.forEach((grupp) => {
    const opt = document.createElement('option');
    opt.value = grupp.id;
    opt.textContent = grupp.etikett + ' · ' + grupp.filer.length;
    sidaFalt.appendChild(opt);
  });

  document.querySelectorAll('[data-vy]').forEach((knapp) => {
    knapp.addEventListener('click', () => byt(knapp.getAttribute('data-vy'), true));
  });
  filterFalt.addEventListener('input', () => rita(false));
  allaFalt.addEventListener('change', () => rita(false));
  verktygFalt.addEventListener('change', () => rita(true));
  sidaFalt.addEventListener('change', () => {
    if (lage.vy === 'dom') rita(true);
  });

  svg.addEventListener('wheel', (e) => {
    if (lage.vy === 'fynd') return;
    e.preventDefault();
    const faktor = e.deltaY < 0 ? 1.08 : 0.92;
    const ruta = svg.getBoundingClientRect();
    const x = e.clientX - ruta.left;
    const y = e.clientY - ruta.top;
    lage.tx = x - (x - lage.tx) * faktor;
    lage.ty = y - (y - lage.ty) * faktor;
    lage.sc *= faktor;
    tillampa();
  }, { passive: false });

  svg.addEventListener('pointerdown', (e) => {
    if (e.target.closest('.nod')) return;
    drag = { x: e.clientX, y: e.clientY, tx: lage.tx, ty: lage.ty };
    svg.setPointerCapture(e.pointerId);
  });
  svg.addEventListener('pointermove', (e) => {
    if (!drag) return;
    lage.tx = drag.tx + e.clientX - drag.x;
    lage.ty = drag.ty + e.clientY - drag.y;
    tillampa();
  });
  svg.addEventListener('pointerup', () => { drag = null; });
  svg.addEventListener('click', (e) => {
    const nod = e.target.closest('.nod');
    if (!nod) return;
    valj(nod.getAttribute('data-slag'), nod.getAttribute('data-id'));
  });

  document.addEventListener('keydown', (e) => {
    const kart = { '1': 'funktioner', '2': 'dom', '3': 'tillstand', '4': 'fynd' };
    if (kart[e.key] && document.activeElement.tagName !== 'INPUT') byt(kart[e.key], true);
  });

  function byt(vy, reset) {
    lage.vy = vy;
    document.querySelectorAll('[data-vy]').forEach((knapp) => {
      knapp.setAttribute('aria-pressed', knapp.getAttribute('data-vy') === vy ? 'true' : 'false');
    });
    led.hidden = vy !== 'tillstand';
    if (reset) { lage.tx = 24; lage.ty = 24; lage.sc = 1; }
    rita(false);
  }

  function q() { return filterFalt.value.trim().toLowerCase(); }
  function med(text) {
    const s = q();
    return !s || String(text || '').toLowerCase().includes(s);
  }

  function rita() {
    const a = modell.antal;
    summa.textContent = a.funktioner + ' functions · ' + a.uttryck + ' expressions · ' + a.tillstand + ' states · ' + a.fynd + ' findings';
    svg.hidden = lage.vy === 'fynd';
    fyndRot.hidden = lage.vy !== 'fynd';
    if (lage.vy === 'fynd') { ritaFynd(); return; }
    svg.replaceChildren();
    const varld = svgEl('g', {});
    svg.appendChild(varld);
    if (lage.vy === 'funktioner') ritaFunktioner(varld);
    if (lage.vy === 'dom') ritaDom(varld);
    if (lage.vy === 'tillstand') ritaTillstand(varld);
    tillampa();
  }

  function tillampa() {
    const varld = svg.querySelector('g');
    if (varld) varld.setAttribute('transform', 'translate(' + lage.tx + ' ' + lage.ty + ') scale(' + lage.sc + ')');
  }

  function svgEl(tag, attr) {
    const nod = document.createElementNS(ns, tag);
    Object.entries(attr).forEach(([k, v]) => nod.setAttribute(k, v));
    return nod;
  }

  function text(foralder, x, y, innehall, klass) {
    const nod = svgEl('text', { x: String(x), y: String(y), class: klass || '' });
    nod.textContent = innehall;
    foralder.appendChild(nod);
    return nod;
  }

  function allvarFor(fil, fran, till) {
    const traff = modell.fynd.filter((f) => f.fil === fil && f.allvar !== 'ok' && (f.rader || []).some((r) => r >= fran && r <= till));
    const ordning = ['broken', 'violation', 'dead', 'note'];
    traff.sort((a, b) => ordning.indexOf(a.allvar) - ordning.indexOf(b.allvar));
    return traff[0] ? traff[0].allvar : '';
  }

  function oppen(fn) {
    if (allaFalt.checked) return true;
    return lage.vald && lage.vald.slag === 'funktion' && lage.vald.id === fn.id;
  }

  function ritaFunktioner(varld) {
    const funs = modell.funktioner.filter((f) => (verktygFalt.checked || f.roll === 'sajt') && (med(f.namn) || med(f.fil) || f.uttryck.some((u) => med(u.text))));
    const perFil = new Map();
    funs.forEach((f) => {
      if (!perFil.has(f.fil)) perFil.set(f.fil, []);
      perFil.get(f.fil).push(f);
    });
    let y0 = 0;
    perFil.forEach((lista, fil) => {
      text(varld, 0, y0 + 14, fil, 'filnamn');
      y0 += 28;
      const djup = bredd(lista);
      const kol = new Map();
      lista.forEach((fn) => {
        const d = djup.get(fn.id) || 0;
        if (!kol.has(d)) kol.set(d, []);
        kol.get(d).push(fn);
      });
      let maxY = y0;
      [...kol.keys()].sort((a, b) => a - b).forEach((d) => {
        let y = y0;
        kol.get(d).forEach((fn) => {
          const uttryck = oppen(fn) ? fn.uttryck : [];
          fn._x = d * 520;
          fn._y = y;
          fn._b = 480;
          fn._h = 40 + uttryck.length * 14;
          y += fn._h + 12;
        });
        maxY = Math.max(maxY, y);
      });
      lista.forEach((fn) => {
        [...fn.anrop, ...fn.referenser].forEach((namn) => {
          const mal = lista.find((g) => g.namn === namn);
          if (!mal || mal === fn) return;
          const d = svgEl('path', {
            class: 'kant',
            d: kurva(fn._x + fn._b, fn._y + 20, mal._x, mal._y + 20),
          });
          varld.appendChild(d);
        });
      });
      lista.forEach((fn) => ritaFunktion(varld, fn));
      y0 = maxY + 28;
    });
  }

  function bredd(lista) {
    const id = new Map(lista.map((f) => [f.namn, f]));
    const dj = new Map(lista.map((f) => [f.id, Infinity]));
    const inGrader = new Map(lista.map((f) => [f.id, 0]));
    lista.forEach((f) => {
      [...f.anrop, ...f.referenser].forEach((namn) => {
        const mal = id.get(namn);
        if (mal && mal !== f) inGrader.set(mal.id, (inGrader.get(mal.id) || 0) + 1);
      });
    });
    const ko = [];
    lista.forEach((f) => {
      if (!inGrader.get(f.id)) { dj.set(f.id, 0); ko.push(f); }
    });
    if (!ko.length && lista.length) { dj.set(lista[0].id, 0); ko.push(lista[0]); }
    let vakt = 0;
    while (ko.length && vakt < lista.length * 8) {
      vakt += 1;
      const fn = ko.shift();
      [...fn.anrop, ...fn.referenser].forEach((namn) => {
        const mal = id.get(namn);
        if (!mal || mal === fn) return;
        const nasta = (dj.get(fn.id) || 0) + 1;
        if (nasta < (dj.get(mal.id) ?? Infinity)) {
          dj.set(mal.id, nasta);
          ko.push(mal);
        }
      });
    }
    lista.forEach((f) => { if (!Number.isFinite(dj.get(f.id))) dj.set(f.id, 0); });
    return dj;
  }

  function kurva(x1, y1, x2, y2) {
    const mx = (x1 + x2) / 2;
    return 'M ' + x1 + ' ' + y1 + ' C ' + mx + ' ' + y1 + ', ' + mx + ' ' + y2 + ', ' + x2 + ' ' + y2;
  }

  function ritaFunktion(varld, fn) {
    const slut = fn.uttryck.length ? fn.uttryck[fn.uttryck.length - 1].rad : fn.rad;
    const g = svgEl('g', {
      class: 'nod',
      'data-slag': 'funktion',
      'data-id': fn.id,
      'data-allvar': allvarFor(fn.fil, fn.rad, slut),
      'data-vald': lage.vald && lage.vald.id === fn.id ? 'ja' : 'nej',
    });
    if (lage.vald && lage.vald.id === fn.id) g.setAttribute('data-vald', 'ja');
    g.appendChild(svgEl('rect', { x: fn._x, y: fn._y, width: fn._b, height: fn._h, rx: 8 }));
    text(g, fn._x + 12, fn._y + 22, fn.namn + (fn.parametrar ? '(' + fn.parametrar + ')' : '()'), '');
    text(g, fn._x + fn._b - 12, fn._y + 22, String(fn.uttryck.length), 'svag').setAttribute('text-anchor', 'end');
    if (oppen(fn)) {
      fn.uttryck.forEach((uttryck, i) => {
        const rad = text(g, fn._x + 12, fn._y + 40 + i * 14, uttryck.rad + '  ' + klipp(uttryck.text, 78), 'svag');
        const titel = svgEl('title', {});
        titel.textContent = uttryck.text;
        rad.appendChild(titel);
      });
    }
    varld.appendChild(g);
  }

  function klipp(textIn, n) { return textIn.length > n ? textIn.slice(0, n) + '…' : textIn; }

  function ritaDom(varld) {
    const grupp = modell.dom.find((g) => g.id === sidaFalt.value) || modell.dom[0];
    if (!grupp) return;
    text(varld, 0, 16, grupp.etikett + ' — ' + grupp.filer.join(', '), 'filnamn');
    const rot = struktur(grupp.trad);
    if (!haller(rot)) {
      text(varld, 0, 48, 'nothing in this tree matches the filter', 'svag');
      return;
    }
    mata(rot, 0, 36);
    ritaGren(varld, rot);
  }

  function struktur(nod) {
    return {
      id: '',
      tag: nod.tag,
      klass: nod.klass || [],
      tillstand: nod.tillstand || {},
      text: nod.text || '',
      upprepning: nod.upprepning || 1,
      barn: (nod.barn || []).map(struktur),
    };
  }

  function etikettNod(nod) {
    const klass = nod.klass.length ? '.' + nod.klass.join('.') : '';
    const gang = nod.upprepning > 1 ? ' ×' + nod.upprepning : '';
    return nod.tag + klass + gang;
  }

  function haller(nod) {
    const blob = etikettNod(nod) + ' ' + Object.entries(nod.tillstand).map(([k, v]) => k + '=' + v).join(' ');
    if (med(blob)) return true;
    return nod.barn.some(haller);
  }

  function mata(nod, d, y) {
    nod._x = d * 280;
    const barn = nod.barn.filter(haller);
    if (!barn.length) {
      nod._y = y;
      return y + 34;
    }
    let cursor = y;
    barn.forEach((b) => { cursor = mata(b, d + 1, cursor); });
    nod._y = (barn[0]._y + barn[barn.length - 1]._y) / 2;
    nod._barn = barn;
    return cursor;
  }

  function ritaGren(varld, nod) {
    (nod._barn || nod.barn.filter(haller)).forEach((barn) => {
      varld.appendChild(svgEl('path', {
        class: 'kant',
        d: 'M ' + (nod._x + 200) + ' ' + (nod._y + 14) + ' H ' + (nod._x + 230) + ' V ' + (barn._y + 14) + ' H ' + barn._x,
      }));
      ritaGren(varld, barn);
    });
    const id = nod.tag + '.' + nod.klass.join('.');
    const g = svgEl('g', { class: 'nod', 'data-slag': 'dom', 'data-id': id + '|' + nod._x + '|' + nod._y });
    nod._id = g.getAttribute('data-id');
    g.appendChild(svgEl('rect', { x: nod._x, y: nod._y, width: 200, height: 28, rx: 6 }));
    text(g, nod._x + 8, nod._y + 18, klipp(etikettNod(nod), 28), '');
    const titel = svgEl('title', {});
    titel.textContent = Object.entries(nod.tillstand).map(([k, v]) => k + '=' + v).join('\n') || etikettNod(nod);
    g.appendChild(titel);
    g.addEventListener('click', () => { domDetalj(nod); });
    varld.appendChild(g);
  }

  function ritaTillstand(varld) {
    const rubrik = ['element', 'state', 'interaction', 'style'];
    rubrik.forEach((namn, i) => text(varld, i * 300, 16, namn, 'filnamn'));
    const rader = modell.tillstand.filter((row) => med(row.element + ' ' + row.attribut + ' ' + row.varden.map((v) => v.varde).join(' ') + ' ' + row.interaktion.map((v) => v.text).join(' ')));
    let y = 32;
    rader.forEach((row) => {
      const linjer = Math.max(1, Math.min(row.varden.length, 6), Math.min(row.interaktion.length, 6), Math.min(row.stil.length, 4));
      const h = 16 + linjer * 14;
      const vald = lage.vald && lage.vald.id === row.id;
      [row.element, row.attribut, '', ''].forEach((_, i) => {
        const g = svgEl('g', { class: 'nod', 'data-slag': 'tillstand', 'data-id': row.id, 'data-vald': vald ? 'ja' : 'nej' });
        g.appendChild(svgEl('rect', { x: i * 300, y: y, width: 284, height: h, rx: 6 }));
        varld.appendChild(g);
      });
      text(varld, 10, y + 16, klipp(row.element, 32), '');
      const varden = row.varden.slice(0, 6).map((v) => v.varde + (v.kallor ? '' : ''));
      if (row.dynamisk) varden.push('set in script');
      textBlock(varld, 310, y + 16, [row.attribut].concat(varden.slice(0, 5)));
      textBlock(varld, 610, y + 16, row.interaktion.slice(0, 6).map((p) => p.slag + ' ' + p.text));
      textBlock(varld, 910, y + 16, row.stil.slice(0, 4).map((s) => (s.lager || '—') + '  ' + klipp(s.selektor, 36)));
      if (iKanter(row)) {
        varld.appendChild(svgEl('path', { class: 'kant', d: 'M 284 ' + (y + h / 2) + ' H 300' }));
        varld.appendChild(svgEl('path', { class: 'kant', d: 'M 584 ' + (y + h / 2) + ' H 600' }));
        varld.appendChild(svgEl('path', { class: 'kant', d: 'M 884 ' + (y + h / 2) + ' H 900' }));
      }
      y += h + 8;
    });
  }

  function iKanter() { return true; }

  function textBlock(foralder, x, y, rader) {
    rader.forEach((rad, i) => text(foralder, x, y + i * 14, klipp(String(rad), 40), i ? 'svag' : ''));
  }

  function valj(slag, id) {
    lage.vald = { slag: slag, id: id };
    if (slag === 'funktion') funktionDetalj(modell.funktioner.find((f) => f.id === id));
    if (slag === 'tillstand') tillstandDetalj(modell.tillstand.find((r) => r.id === id));
    rita(false);
  }

  function funktionDetalj(fn) {
    if (!fn) return;
    detalj.replaceChildren();
    rubrik(fn.namn);
    meta(fn.fil + ':' + fn.rad);
    if (fn.anrop.length) stycke('calls ' + fn.anrop.join(', '));
    const lista = document.createElement('ol');
    fn.uttryck.forEach((uttryck) => {
      const li = document.createElement('li');
      li.textContent = uttryck.rad + '  ' + uttryck.text;
      lista.appendChild(li);
    });
    detalj.appendChild(lista);
    if (fn.skriver.length) {
      stycke('writes ' + fn.skriver.map((s) => s.attribut + '=' + s.varde).join(', '));
    }
    fyndLista(fn.fil, fn.rad, fn.uttryck.length ? fn.uttryck[fn.uttryck.length - 1].rad : fn.rad);
  }

  function domDetalj(nod) {
    detalj.replaceChildren();
    rubrik(etikettNod(nod));
    const poster = Object.entries(nod.tillstand);
    if (nod.text) stycke(nod.text);
    if (!poster.length) stycke('no state attributes');
    poster.forEach(([k, v]) => stycke(k + ' = ' + v));
    const element = nod.tag + (nod.klass.length ? '.' + nod.klass.join('.') : '');
    const rader = modell.tillstand.filter((r) => r.element === element);
    rader.forEach((row) => {
      const knapp = document.createElement('button');
      knapp.type = 'button';
      knapp.textContent = row.attribut;
      knapp.addEventListener('click', () => {
        byt('tillstand', true);
        valj('tillstand', row.id);
      });
      detalj.appendChild(knapp);
    });
  }

  function tillstandDetalj(row) {
    if (!row) return;
    detalj.replaceChildren();
    rubrik(row.element);
    meta(row.attribut);
    row.varden.forEach((v) => stycke(v.varde + '  (' + v.kallor.join(', ') + ')'));
    if (row.dynamisk) stycke('also assigned from script without a literal');
    row.interaktion.forEach((post) => {
      if (post.funktion) {
        const knapp = document.createElement('button');
        knapp.type = 'button';
        knapp.textContent = post.slag + ' · ' + post.text;
        knapp.addEventListener('click', () => {
          byt('funktioner', true);
          valj('funktion', post.funktion);
        });
        detalj.appendChild(knapp);
      } else {
        stycke(post.slag + ' · ' + post.text);
      }
    });
    row.stil.forEach((s) => {
      stycke((s.lager || '—') + '  ' + s.selektor);
      stycke(s.egenskaper.join(' · '));
    });
  }

  function fyndLista(fil, fran, till) {
    modell.fynd.filter((f) => f.fil === fil && (f.rader || []).some((r) => r >= fran && r <= till)).forEach((f) => {
      stycke(f.regel + ' ' + f.allvar + ' — ' + f.fynd);
    });
  }

  function ritaFynd() {
    fyndRot.replaceChildren();
    const tabell = document.createElement('table');
    const huvud = document.createElement('tr');
    ['file', 'rule', 'severity', 'finding', 'minimal fix'].forEach((namn) => {
      const th = document.createElement('th');
      th.textContent = namn;
      huvud.appendChild(th);
    });
    const thead = document.createElement('thead');
    thead.appendChild(huvud);
    tabell.appendChild(thead);
    const kropp = document.createElement('tbody');
    const regler = document.createElement('p');
    regler.textContent = modell.regler.map((r) => r.id + ' ' + r.lage).join('   ');
    fyndRot.appendChild(regler);
    modell.fynd.filter((f) => (verktygFalt.checked || f.roll === 'sajt') && (f.allvar !== 'ok' || q()) && med(f.fil + ' ' + f.regel + ' ' + f.fynd + ' ' + f.allvar)).forEach((f) => {
      const tr = document.createElement('tr');
      tr.setAttribute('data-allvar', f.allvar);
      [f.fil + ':' + (f.rader || [f.rad]).slice(0, 6).join(','), f.regel, f.allvar, f.fynd, f.atgard].forEach((cell) => {
        const td = document.createElement('td');
        td.textContent = cell;
        tr.appendChild(td);
      });
      tr.addEventListener('click', () => {
        const fun = modell.funktioner.find((fn) => fn.fil === f.fil && fn.rad <= f.rad && (fn.uttryck.some((u) => u.rad === f.rad) || fn.rad === f.rad));
        if (!fun) return;
        byt('funktioner', true);
        valj('funktion', fun.id);
      });
      kropp.appendChild(tr);
    });
    tabell.appendChild(kropp);
    fyndRot.appendChild(tabell);
    const arbete = document.createElement('ol');
    modell.arbete.forEach((rad) => {
      const li = document.createElement('li');
      li.textContent = rad;
      arbete.appendChild(li);
    });
    fyndRot.appendChild(arbete);
  }

  function rubrik(textIn) {
    const h = document.createElement('h2');
    h.textContent = textIn;
    detalj.appendChild(h);
  }
  function meta(textIn) {
    const p = document.createElement('p');
    p.className = 'meta';
    p.textContent = textIn;
    detalj.appendChild(p);
  }
  function stycke(textIn) {
    const p = document.createElement('p');
    p.textContent = textIn;
    detalj.appendChild(p);
  }

  byt('funktioner', true);
})();

// BXYZ:..:eliot@bosmanxyz.xyz:..:.www.bosmanxyz.xyz
// node map. macro is the whole page as boxes. micro is one family,
// the real pieces, with the page still visible underneath.
{
  const installningar = {
    attribut: 'data-dev-karta',
    hanterare: ['band/vaxla', 'bar/vaxla', 'fot/vaxla', 'remsa/vaxla', 'galleri/steg', 'galleri/nasta', 'galleri/fore', 'hem/blad', 'bild/zoom'],
    lagen: ['data-open', 'data-hall', 'data-scroll', 'data-slut', 'data-las'],
    rotlagen: ['data-lage', 'data-mark', 'data-syfte', 'data-mer', 'data-led', 'data-satt'],
    familjer: ['wordmark', 'mark', 'menu', 'oversikt', 'home', 'fot', 'bar', 'galleri', 'info', 'press', 'project', 'projekt'],
    box: { b: 220, hMakro: 124, hMikro: 168, kol: 300, rad: 36 },
  };

  const forklaring = {
    wordmark: 'the loa name in the corner. it always goes home.',
    mark: 'the circle. a mouse can hover it. a finger cannot, so the three section words do that job.',
    menu: 'projects and info. they live inside the circle until it opens.',
    oversikt: 'archive, about, press. a row on the project list. in the header everywhere else when there is no hover.',
    home: 'the big picture on the front page. click or tap it for the next one.',
    fot: 'the coloured names that can slide up at the bottom of the front page.',
    bar: 'one project row. on a phone every row is the same height and a taller tier is just a bolder name. on a tablet the rows are still short and tall.',
    galleri: 'the pictures inside an open row, with back and next.',
    info: 'the about page. two columns on a tablet so a line stays readable. one column on a phone.',
    press: 'the press list on the about page.',
    project: 'a project page. pictures, a title, and previous / next.',
    projekt: 'the words and pictures inside a project page. previous and next wrap onto a new line if the names are long.',
  };

  const beslut = [
    ['the edges', 'the logo and the circle move in so a notch or a home bar does not cover them. on a normal screen nothing moves.'],
    ['a tablet is not a wide phone', 'about text and the facts sit side by side, so you are not reading a very long line.'],
    ['phone rows', 'every project row is one short strip. the old tall empty colour blocks are gone. a stronger row is a bolder name.'],
    ['tablet rows', 'rows can still be short or tall. the step grows with the screen but never gets taller than on a desktop.'],
    ['fingertips', 'on a touch screen, buttons are at least 44px. a mouse keeps the smaller size.'],
    ['three words', 'archive, about and press sit in the header on a phone or tablet, because the circle has no hover there.'],
    ['shorter motion', 'on touch, lists do not trickle in for a whole second. they stop after three steps. a mouse is unchanged.'],
    ['the wide screen', 'a desktop with a mouse is the same layout as before these changes.'],
  ];

  const skapa = (tagg, klass, egenskaper = {}) => Object.assign(document.createElement(tagg), { className: klass }, egenskaper);
  const html = document.documentElement;
  const ns = 'http://www.w3.org/2000/svg';

  let lage = 'makro';
  let skala = 1;
  let panX = 32;
  let panY = 32;
  let drag = null;

  const blockAv = (el) => {
    for (const k of el.classList) {
      const bas = k.split('__')[0];
      if (installningar.familjer.includes(bas)) return bas;
    }
    return null;
  };

  const alla = () => [...document.querySelectorAll('[class]')].filter((el) => blockAv(el) && !el.closest('.bxyz-karta'));

  const arRot = (el) => {
    const b = blockAv(el);
    let p = el.parentElement;
    while (p) {
      if (blockAv(p) === b) return false;
      p = p.parentElement;
    }
    return true;
  };

  const intressant = (el) => el.matches('[data-atgard], [data-roll], [data-rad], [data-form], [id], h1, h2, h3');

  const krokAv = (el) => (el.matches('[data-atgard]') ? el.getAttribute('data-atgard') : null);

  const foraldrad = (krok) => krok && !installningar.hanterare.includes(krok);

  const valj = (el) => {
    const id = el.id ? `#${el.id}` : '';
    const kl = [...el.classList].filter((k) => !k.startsWith('bxyz')).slice(0, 2).map((k) => `.${k}`).join('');
    return `${el.tagName.toLowerCase()}${id}${kl}`;
  };

  const lys = (lista) => {
    document.querySelectorAll('[data-karta-lyft]').forEach((el) => el.removeAttribute('data-karta-lyft'));
    lista.forEach((el) => el.setAttribute('data-karta-lyft', ''));
  };

  const mikroLista = (familj) => {
    const rotter = alla().filter((el) => blockAv(el) === familj && arRot(el));
    if (rotter.length > 1) return rotter;
    const inre = alla().filter((el) => blockAv(el) === familj && !rotter.includes(el) && intressant(el));
    return [...rotter, ...inre];
  };

  const tradFran = (noder) => {
    const trad = [];
    noder.forEach((barn, i) => {
      const foralder = noder.findIndex((p, j) => j !== i && p.el.contains(barn.el));
      if (foralder >= 0) trad.push([foralder, i]);
    });
    return trad.filter(([a, b], i, allaTrad) => allaTrad.findIndex(([x, y]) => x === a && y === b) === i);
  };

  const djup = (noder, trad) => {
    const d = noder.map(() => 0);
    let andrad = true;
    let vakt = 0;
    while (andrad && vakt < noder.length + 2) {
      andrad = false;
      vakt += 1;
      trad.forEach(([a, b]) => {
        if (d[b] < d[a] + 1) { d[b] = d[a] + 1; andrad = true; }
      });
    }
    return d;
  };

  const placera = (noder, trad, hojd) => {
    const d = djup(noder, trad);
    const raknare = new Map();
    const { b, kol, rad } = installningar.box;
    const rader = 4;
    const start = new Map();
    const maxD = Math.max(0, ...d);
    let kant = 24;
    for (let n = 0; n <= maxD; n += 1) {
      start.set(n, kant);
      const antal = d.filter((v) => v === n).length;
      kant += Math.max(1, Math.ceil(antal / rader)) * kol;
    }
    return noder.map((nod, i) => {
      const ordning = raknare.get(d[i]) || 0;
      raknare.set(d[i], ordning + 1);
      return {
        ...nod,
        x: start.get(d[i]) + Math.floor(ordning / rader) * kol,
        y: 24 + (ordning % rader) * (hojd + rad),
        b,
        h: hojd,
      };
    });
  };

  const ritaTrad = (poster, bredd, hojd) => {
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('class', 'bxyz-karta__trad');
    svg.setAttribute('width', String(bredd));
    svg.setAttribute('height', String(hojd));
    poster.forEach((nod) => {
      (nod.till || []).forEach((mal) => {
        const path = document.createElementNS(ns, 'path');
        const x1 = nod.x + nod.b;
        const y1 = nod.y + nod.h / 2;
        const x2 = mal.x;
        const y2 = mal.y + mal.h / 2;
        const mx = (x1 + x2) / 2;
        path.setAttribute('d', `M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`);
        svg.append(path);
      });
    });
    return svg;
  };

  const box = (nod, niva) => {
    const el = skapa('article', 'bxyz-karta__box');
    el.dataset.niva = niva;
    el.dataset.familj = nod.familj;
    el.style.insetInlineStart = `${nod.x}px`;
    el.style.insetBlockStart = `${nod.y}px`;
    el.style.borderBlockStartColor = 'var(--lime)';
    el.addEventListener('pointerenter', () => lys(nod.lyft));

    const rubrik = skapa('button', 'bxyz-karta__namn', { type: 'button', textContent: nod.rubrik });
    rubrik.dataset.atgard = 'karta/peka';
    el.append(rubrik);

    el.append(skapa('p', 'bxyz-karta__mening', { textContent: nod.mening }));

    if (nod.krok) {
      const k = skapa('span', 'bxyz-karta__krok', { textContent: nod.krok });
      if (foraldrad(nod.krok)) { k.dataset.fel = 'orphan'; k.title = 'nothing in the page script answers this'; }
      el.append(k);
    }

    if (niva === 'mikro' && nod.el) {
      const chips = skapa('div', 'bxyz-karta__lagen');
      installningar.lagen.forEach((attr) => {
        const c = skapa('button', 'bxyz-karta__chip', { type: 'button', textContent: attr.replace('data-', '') });
        c.dataset.atgard = 'karta/vaxla';
        c.dataset.attr = attr;
        c.setAttribute('aria-pressed', String(nod.el.hasAttribute(attr)));
        chips.append(c);
      });
      el.append(chips);
    }

    if (niva === 'makro') {
      const inKnapp = skapa('button', 'bxyz-karta__in', { type: 'button', textContent: 'inside' });
      inKnapp.dataset.atgard = 'karta/in';
      inKnapp.dataset.familj = nod.familj;
      inKnapp.title = `open the ${nod.familj} pieces`;
      el.append(inKnapp);
    }

    el._post = nod;
    return el;
  };

  const makro = () => {
    const grupper = new Map();
    alla().forEach((el) => {
      const b = blockAv(el);
      if (!arRot(el)) return;
      if (!grupper.has(b)) grupper.set(b, []);
      grupper.get(b).push(el);
    });
    const namn = [...grupper.keys()];
    const noder = namn.map((familj) => ({
      familj,
      rubrik: `${familj} · ${grupper.get(familj).length}`,
      mening: forklaring[familj] || familj,
      krok: grupper.get(familj).map(krokAv).find(Boolean) || null,
      lyft: grupper.get(familj),
      el: grupper.get(familj)[0],
    }));
    const trad = [];
    namn.forEach((barn, bi) => {
      namn.forEach((foralder, fi) => {
        if (barn === foralder) return;
        const inne = grupper.get(barn).some((el) => grupper.get(foralder).some((p) => p.contains(el)));
        if (inne) trad.push([fi, bi]);
      });
    });
    return { noder, trad };
  };

  const mikro = (familj) => {
    const lista = mikroLista(familj);
    const noder = lista.map((el) => ({
      familj,
      rubrik: valj(el),
      mening: forklaring[familj] || familj,
      krok: krokAv(el),
      lyft: [el],
      el,
    }));
    return { noder, trad: tradFran(noder) };
  };

  const tillampa = () => {
    const plan = document.querySelector('.bxyz-karta__plan');
    if (plan) plan.style.transform = `translate(${panX}px, ${panY}px) scale(${skala})`;
  };

  const passa = () => {
    const yta = document.querySelector('.bxyz-karta__yta');
    const plan = document.querySelector('.bxyz-karta__plan');
    if (!yta || !plan) return;
    const w = Number(plan.dataset.bredd) || 1;
    const h = Number(plan.dataset.hojd) || 1;
    const r = yta.getBoundingClientRect();
    skala = Math.max(0.35, Math.min(1, (r.width - 64) / w, (r.height - 64) / h));
    panX = Math.max(24, (r.width - w * skala) / 2);
    panY = Math.max(24, (r.height - h * skala) / 2);
    tillampa();
  };

  const rita = () => {
    const panel = document.querySelector('.bxyz-karta__panel');
    const plan = document.querySelector('.bxyz-karta__plan');
    const sats = document.querySelector('.bxyz-karta__sats');
    const ut = document.querySelector('[data-atgard="karta/ut"]');
    if (!panel || !plan) return;

    const modell = lage === 'makro' ? makro() : mikro(lage);
    const hojd = lage === 'makro' ? installningar.box.hMakro : installningar.box.hMikro;
    const poster = placera(modell.noder, modell.trad, hojd);
    const index = new Map(poster.map((nod, i) => [i, nod]));
    poster.forEach((nod, i) => {
      nod.till = modell.trad.filter(([a]) => a === i).map(([, b]) => index.get(b));
    });
    const bredd = Math.max(installningar.box.b + 80, ...poster.map((n) => n.x + n.b + 48), 320);
    const planHojd = Math.max(hojd + 80, ...poster.map((n) => n.y + n.h + 48), 240);

    plan.replaceChildren(ritaTrad(poster, bredd, planHojd), ...poster.map((nod) => box(nod, lage === 'makro' ? 'makro' : 'mikro')));
    plan.dataset.bredd = String(bredd);
    plan.dataset.hojd = String(planHojd);
    plan.style.inlineSize = `${bredd}px`;
    plan.style.blockSize = `${planHojd}px`;

    if (sats) {
      sats.textContent = lage === 'makro'
        ? 'wide view. the whole page is boxes. press inside a box to see its pieces. drag empty space to move. scroll to zoom.'
        : `inside ${lage}. these are the real pieces on the page. press a name to light that piece up. whole page goes back.`;
    }
    if (ut) ut.hidden = lage === 'makro';

    const rot = document.querySelector('.bxyz-karta__rot');
    if (rot) {
      rot.replaceChildren(...installningar.rotlagen.map((a) => {
        const v = html.getAttribute(a);
        const s = skapa('span', 'bxyz-karta__rotlage', { textContent: `${a.replace('data-', '')}: ${v ?? '—'}` });
        if (v === null) s.dataset.tom = '';
        return s;
      }));
    }
    requestAnimationFrame(passa);
  };

  const zooma = (faktor, cx, cy) => {
    const yta = document.querySelector('.bxyz-karta__yta');
    if (!yta) return;
    const ny = Math.min(2.4, Math.max(0.28, skala * faktor));
    const r = yta.getBoundingClientRect();
    const x = cx ?? r.width / 2;
    const y = cy ?? r.height / 2;
    panX = x - (x - panX) * (ny / skala);
    panY = y - (y - panY) * (ny / skala);
    skala = ny;
    tillampa();
  };

  const postAv = (knapp) => knapp.closest('.bxyz-karta__box')?._post || null;

  const atgarder = {
    'karta/panel': (knapp) => {
      const pa = html.toggleAttribute(installningar.attribut);
      knapp.setAttribute('aria-pressed', String(pa));
      if (pa) { lage = 'makro'; rita(); }
    },
    'karta/rita': () => { if (html.hasAttribute(installningar.attribut)) rita(); },
    'karta/in': (knapp) => {
      lage = knapp.dataset.familj || postAv(knapp)?.familj || 'makro';
      rita();
    },
    'karta/ut': () => { lage = 'makro'; rita(); },
    'karta/peka': (knapp) => {
      const post = postAv(knapp);
      if (!post) return;
      lys(post.lyft);
      post.el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    },
    'karta/vaxla': (knapp) => {
      const post = postAv(knapp);
      if (!post?.el) return;
      const attr = knapp.dataset.attr;
      const pa = post.el.toggleAttribute(attr);
      knapp.setAttribute('aria-pressed', String(pa));
      const head = post.el.querySelector('[data-atgard][aria-expanded]') || (post.el.matches('[aria-expanded]') ? post.el : null);
      if (head && attr === 'data-open') head.setAttribute('aria-expanded', String(pa));
    },
    'karta/zooma': (knapp) => zooma(knapp.dataset.riktning === 'in' ? 1.15 : 0.87),
    'karta/passa': () => passa(),
    'karta/varfor': (knapp) => {
      const pa = html.toggleAttribute('data-karta-varfor');
      knapp.setAttribute('aria-pressed', String(pa));
    },
    'karta/kopiera': () => {
      const ut = {};
      makro().noder.forEach((nod) => { ut[nod.familj] = { mening: nod.mening, antal: nod.lyft.length, krok: nod.krok }; });
      navigator.clipboard?.writeText(JSON.stringify({ lage, noder: ut, beslut }, null, 2));
    },
    'karta/dolj': (knapp) => {
      html.removeAttribute(installningar.attribut);
      html.removeAttribute('data-karta-varfor');
      lys([]);
      const panelKnapp = knapp.closest('.bxyz-karta').querySelector('[data-atgard="karta/panel"]');
      panelKnapp?.setAttribute('aria-pressed', 'false');
      knapp.closest('.bxyz-karta').querySelector('[data-atgard="karta/varfor"]')?.setAttribute('aria-pressed', 'false');
    },
  };

  const hanteraAtgard = (handelse) => {
    const knapp = handelse.target.closest('[data-atgard^="karta/"]');
    if (!knapp) return;
    handelse.stopPropagation();
    atgarder[knapp.dataset.atgard]?.(knapp);
  };

  const montera = () => {
    const skal = skapa('div', 'bxyz-karta');
    skal.setAttribute('aria-label', 'page map');

    const reglage = skapa('div', 'bxyz-karta__reglage', { role: 'group' });
    const vaxla = skapa('button', '', { type: 'button', textContent: 'map' });
    vaxla.dataset.atgard = 'karta/panel';
    vaxla.setAttribute('aria-pressed', 'false');
    vaxla.title = 'open the page as boxes. wide view first, then one part.';
    const hint = skapa('span', 'bxyz-karta__hint', { textContent: 'whole page, then one part' });
    const ut = skapa('button', '', { type: 'button', textContent: 'whole page' });
    ut.dataset.atgard = 'karta/ut';
    ut.dataset.vidd = 'oppen';
    ut.hidden = true;
    ut.title = 'back to the wide view of the whole page';
    const minus = skapa('button', '', { type: 'button', textContent: '−' });
    minus.dataset.atgard = 'karta/zooma';
    minus.dataset.riktning = 'ut';
    minus.dataset.vidd = 'oppen';
    minus.setAttribute('aria-label', 'zoom out');
    const plus = skapa('button', '', { type: 'button', textContent: '+' });
    plus.dataset.atgard = 'karta/zooma';
    plus.dataset.riktning = 'in';
    plus.dataset.vidd = 'oppen';
    plus.setAttribute('aria-label', 'zoom in');
    const fit = skapa('button', '', { type: 'button', textContent: 'fit' });
    fit.dataset.atgard = 'karta/passa';
    fit.dataset.vidd = 'oppen';
    fit.title = 'fit the boxes in the window';
    const varfor = skapa('button', '', { type: 'button', textContent: 'why' });
    varfor.dataset.atgard = 'karta/varfor';
    varfor.dataset.vidd = 'oppen';
    varfor.setAttribute('aria-pressed', 'false');
    varfor.title = 'plain words for the layout changes';
    const ritaKnapp = skapa('button', '', { type: 'button', textContent: '↻' });
    ritaKnapp.dataset.atgard = 'karta/rita';
    ritaKnapp.dataset.vidd = 'oppen';
    ritaKnapp.setAttribute('aria-label', 'read the page again');
    const kop = skapa('button', '', { type: 'button', textContent: 'json' });
    kop.dataset.atgard = 'karta/kopiera';
    kop.dataset.vidd = 'oppen';
    kop.setAttribute('aria-label', 'copy the map as json');
    const dolj = skapa('button', '', { type: 'button', textContent: '×' });
    dolj.dataset.atgard = 'karta/dolj';
    dolj.dataset.vidd = 'oppen';
    dolj.setAttribute('aria-label', 'close the map');
    const sats = skapa('p', 'bxyz-karta__sats');
    reglage.append(vaxla, hint, ut, minus, plus, fit, varfor, ritaKnapp, kop, dolj, sats);

    const panel = skapa('div', 'bxyz-karta__panel');
    const rot = skapa('div', 'bxyz-karta__rot');
    const yta = skapa('div', 'bxyz-karta__yta');
    const plan = skapa('div', 'bxyz-karta__plan');
    yta.append(plan);
    panel.append(rot, yta);

    const varforPanel = skapa('aside', 'bxyz-karta__varfor');
    varforPanel.append(skapa('h2', 'bxyz-karta__varfor-rubrik', { textContent: 'what changed' }));
    beslut.forEach(([namn, mening]) => {
      const rad = skapa('p', 'bxyz-karta__varfor-rad');
      rad.append(skapa('strong', '', { textContent: namn }), document.createTextNode(` ${mening}`));
      varforPanel.append(rad);
    });

    skal.append(reglage, panel, varforPanel);
    document.body.append(skal);
    document.addEventListener('click', hanteraAtgard);

    yta.addEventListener('pointerdown', (e) => {
      if (e.target.closest('.bxyz-karta__box, button')) return;
      drag = { x: e.clientX, y: e.clientY, panX, panY };
      yta.setPointerCapture(e.pointerId);
      yta.dataset.dra = '';
    });
    yta.addEventListener('pointermove', (e) => {
      if (!drag) return;
      panX = drag.panX + (e.clientX - drag.x);
      panY = drag.panY + (e.clientY - drag.y);
      tillampa();
    });
    const slapp = () => { drag = null; delete yta.dataset.dra; };
    yta.addEventListener('pointerup', slapp);
    yta.addEventListener('pointercancel', slapp);
    yta.addEventListener('wheel', (e) => {
      if (!html.hasAttribute(installningar.attribut)) return;
      e.preventDefault();
      const r = yta.getBoundingClientRect();
      zooma(e.deltaY < 0 ? 1.08 : 0.92, e.clientX - r.left, e.clientY - r.top);
    }, { passive: false });

    document.addEventListener('keydown', (e) => {
      if (!html.hasAttribute(installningar.attribut) || e.key !== 'Escape') return;
      if (lage !== 'makro') { lage = 'makro'; rita(); return; }
      atgarder['karta/dolj'](dolj);
    });
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', montera);
  else montera();
}

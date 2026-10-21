// BXYZ:..:eliot@bosmanxyz.xyz:..:.www.bosmanxyz.xyz
{
  const kallor = [
    { id: 'cl', namn: 'caroline lambrechts', url: 'https://carolinelambrechts.be/' },
    { id: 'cog', namn: 'co—g', url: 'https://co-g.co/' },
    { id: 'aas', namn: 'gonzalez haase aas', url: 'https://gonzalezhaase.com/' },
    { id: 'wzw', namn: 'wzw architektur', url: 'https://www.wzwarchitektur.ch/' },
    { id: 'lera', namn: 'lederer ragnarsdóttir', url: 'https://ledererragnarsdottir.de/de' },
    { id: 'jg', namn: 'büro juliane greb', url: 'https://julianegreb.com/' }
  ];
  const slagNamn = { layout: 'layout', animation: 'animation', interaction: 'interaction' };
  const delar = [
    ['cl', 'layout', 'halv-kolumn', 'col-half two-column project wrap'],
    ['cl', 'layout', 'dubbel-spann', 'col-double / col-wide span'],
    ['cl', 'layout', 'projekt-huvud', 'project-head uppercase row'],
    ['cl', 'layout', 'bildspel-full', 'slick slideshow full bleed'],
    ['cl', 'layout', 'klister-marke', 'sticker wordmark chip'],
    ['cl', 'animation', 'slick-svep', 'slick slide translate'],
    ['cl', 'animation', 'lazy-ton', 'lazyload fade-in'],
    ['cl', 'animation', 'info-falla', 'project-info fold'],
    ['cl', 'animation', 'las-mer-glid', 'read-more rise'],
    ['cl', 'animation', 'slide-raknare', 'slidecount tracking'],
    ['cl', 'interaction', 'slick-pilar', 'slick-prev / slick-next'],
    ['cl', 'interaction', 'toggle-knapp', 'toggle-btn on mark'],
    ['cl', 'interaction', 'las-mer', 'read-more disclosure'],
    ['cl', 'interaction', 'lazy-klick', 'click-to-advance slide'],
    ['cl', 'interaction', 'projekt-slug', 'data-slug on head'],
    ['cog', 'layout', 'cell-rutnat', 'mod-grid__cell mosaic'],
    ['cog', 'layout', 'bild-kvot', 'h-aspect-ratio 3:2'],
    ['cog', 'layout', 'cell-mellanrum', 'h-cell-spacer'],
    ['cog', 'layout', 'rubrik-cell', 'mod-header__cell'],
    ['cog', 'layout', 'dold-liten', 'h-cell-hidden-small'],
    ['cog', 'animation', 'ljuslada', 'lightbox frame'],
    ['cog', 'animation', 'video-hover', 'grid video hover'],
    ['cog', 'animation', 'bakgrund-vaxel', 'h-bg-gray / white'],
    ['cog', 'animation', 'titel-skala', 'title__small scale'],
    ['cog', 'animation', 'flicker-yt', '2d/3d standing-seam flicker'],
    ['cog', 'interaction', 'lightbox-lank', 'js-lightbox-link'],
    ['cog', 'interaction', 'video-klick', 'js-grid-video-container'],
    ['cog', 'interaction', 'grid-rad', 'js-grid-row'],
    ['cog', 'interaction', 'indikator', 'h-indicator'],
    ['cog', 'interaction', 'caption-inner', 'mod-grid__caption__inner'],
    ['aas', 'layout', 'flickity-bana', 'flickity track'],
    ['aas', 'layout', 'sex-tolv', 'w-6-12 split'],
    ['aas', 'layout', 'rut-grid', 'grid + row'],
    ['aas', 'layout', 'padding-small', 'padding-small inset'],
    ['aas', 'animation', 'blur-ton', 'closed bars blurred'],
    ['aas', 'animation', 'scrolldown-puls', 'scrolldown cue'],
    ['aas', 'animation', 'lazy-flickity', 'vanilla-lazyload slides'],
    ['aas', 'animation', 'reload', 'reload chrome invert'],
    ['aas', 'animation', 'reel-loop', 'reel object-position'],
    ['aas', 'interaction', 'list-filter', 'list.js filter'],
    ['aas', 'interaction', 'cookie-lager', 'cookie bar'],
    ['aas', 'interaction', 'scrolldown', 'mandatory snap'],
    ['aas', 'interaction', 'shop-lank', 'object shop nav'],
    ['aas', 'interaction', 'flickity-dra', 'flickity drag cursor'],
    ['wzw', 'layout', 'nyhet-mall', 'data-template=news'],
    ['wzw', 'layout', 'projekt-inner', 'project-inner sheet'],
    ['wzw', 'layout', 'foto-kedja', 'project-photo-element'],
    ['wzw', 'layout', 'detalj-nyckel', 'project-details-key/value'],
    ['wzw', 'layout', 'text-kropp', 'project-text-body'],
    ['wzw', 'animation', 'slider-kontroll', 'slider-controls ink'],
    ['wzw', 'animation', 'orientering', 'data-orientation viewport'],
    ['wzw', 'animation', 'tillstand', 'data-state outline'],
    ['wzw', 'animation', 'foto-glid', 'photo grayscale lift'],
    ['wzw', 'animation', 'nyhet-media', 'news-article-media'],
    ['wzw', 'interaction', 'slider-steg', 'prev / next areas'],
    ['wzw', 'interaction', 'slider-toggle', 'controls-area--toggle'],
    ['wzw', 'interaction', 'filter-kategori', 'data-category dim'],
    ['wzw', 'interaction', 'orientering-sensor', 'data-last-orientation'],
    ['wzw', 'interaction', 'page-endpoint', 'data-endpoint nav'],
    ['lera', 'layout', 'masonry', 'masonry-item columns'],
    ['lera', 'layout', 'stor-text', 'bigtext heads'],
    ['lera', 'layout', 'aktuell-lista', 'aktuelles offset'],
    ['lera', 'layout', 'barba-behallare', 'data-barba container'],
    ['lera', 'animation', 'barba-sida', 'barba page enter'],
    ['lera', 'animation', 'swiper', 'swiper x-snap'],
    ['lera', 'animation', 'masonry-lagg', 'imagesloaded layout'],
    ['lera', 'animation', 'bokstav-in', 'uebele tracking in'],
    ['lera', 'interaction', 'barba-nav', 'barba core links'],
    ['lera', 'interaction', 'swiper-dra', 'swiper pan-x'],
    ['lera', 'interaction', 'slug-sida', 'data-slug line'],
    ['lera', 'interaction', 'mur-klick', 'masonry-item cursor'],
    ['lera', 'interaction', 'aktuell-datum', 'news date prefix'],
    ['jg', 'layout', 'oversikt', 'overview mosaic'],
    ['jg', 'layout', 'foto-ritning', 'photos / drawings blend'],
    ['jg', 'layout', 'nyhet-rad', 'news-item columns'],
    ['jg', 'layout', 'sekundar-meny', 'secondary-menu'],
    ['jg', 'layout', 'projekt-ruta', 'project-img box'],
    ['jg', 'animation', 'lazy-in', 'lazysizes fade'],
    ['jg', 'animation', 'filter-ton', 'checkbox filter fade'],
    ['jg', 'animation', 'slick-karusell', 'slick on home'],
    ['jg', 'animation', 'lager-vaxel', 'photos above text'],
    ['jg', 'animation', 'checkbox-puls', 'checkbox-typology flash'],
    ['jg', 'interaction', 'typologi', 'data-typology outline'],
    ['jg', 'interaction', 'bildtyp', 'checkbox-image nav'],
    ['jg', 'interaction', 'visa-alla', 'checkbox-show-all open'],
    ['jg', 'interaction', 'checkbox-rutnat', 'types-menu ticks'],
    ['jg', 'interaction', 'tidsspann', 'data-start / data-end']
  ].map(([kalla, slag, namn, kallaKlass]) => ({ id: kalla + '-' + namn, kalla, slag, namn, kallaKlass }));

  const html = document.documentElement;
  const skapa = (tagg, klass, props = {}) => Object.assign(document.createElement(tagg), { className: klass || '' }, props);
  const satta = (id, pa) => {
    const set = new Set((html.getAttribute('data-lab') || '').split(/\s+/).filter(Boolean));
    pa ? set.add(id) : set.delete(id);
    set.size ? html.setAttribute('data-lab', [...set].join(' ')) : html.removeAttribute('data-lab');
  };

  const byggPanel = () => {
    const panel = skapa('aside', 'bxyz-lab__panel');
    panel.id = 'bxyz-lab-panel';
    panel.setAttribute('aria-label', 'lab components');
    const h = skapa('h2', '', { textContent: 'lab' });
    panel.append(h);
    kallor.forEach((k) => {
      const d = skapa('details', 'bxyz-lab__kalla');
      const s = document.createElement('summary');
      const a = skapa('a', '', { href: k.url, textContent: k.namn, target: '_blank', rel: 'noreferrer' });
      s.append(a);
      d.append(s);
      ['layout', 'animation', 'interaction'].forEach((slag) => {
        const box = skapa('div', 'bxyz-lab__slag');
        box.append(skapa('strong', '', { textContent: slagNamn[slag] }));
        delar.filter((x) => x.kalla === k.id && x.slag === slag).forEach((del) => {
          const lab = document.createElement('label');
          const inp = document.createElement('input');
          inp.type = 'checkbox';
          inp.dataset.atgard = 'lab/vaxla';
          inp.dataset.del = del.id;
          const txt = document.createElement('span');
          txt.append(del.namn, skapa('small', '', { textContent: del.kallaKlass }));
          lab.append(inp, txt);
          box.append(lab);
        });
        d.append(box);
      });
      panel.append(d);
    });
    return panel;
  };

  const byggReglage = () => {
    const reglage = skapa('div', 'bxyz-lab__reglage', { role: 'group' });
    reglage.setAttribute('aria-label', 'lab overlay');
    const vaxla = skapa('button', '', { type: 'button', textContent: 'lab' });
    vaxla.dataset.atgard = 'lab/panel';
    vaxla.setAttribute('aria-pressed', 'false');
    vaxla.setAttribute('aria-controls', 'bxyz-lab-panel');
    const dolj = skapa('button', '', { type: 'button', textContent: '×' });
    dolj.dataset.atgard = 'lab/dolj';
    dolj.setAttribute('aria-label', 'hide lab control');
    reglage.append(vaxla, dolj);
    reglage.hidden = true;
    return reglage;
  };

  const atgarder = {
    'lab/panel': (knapp) => knapp.setAttribute('aria-pressed', String(html.toggleAttribute('data-lab-panel'))),
    'lab/dolj': (knapp) => {
      html.removeAttribute('data-lab-panel');
      html.removeAttribute('data-lab');
      knapp.closest('.bxyz-lab__reglage').querySelector('[data-atgard="lab/panel"]').setAttribute('aria-pressed', 'false');
      knapp.closest('.bxyz-lab__reglage').hidden = true;
      document.getElementById('bxyz-lab-panel').querySelectorAll('input').forEach((i) => { i.checked = false; });
    },
    'lab/vaxla': (inp) => satta(inp.dataset.del, inp.checked)
  };

  const hantera = (e) => {
    const el = e.target.closest('[data-atgard^="lab/"]');
    if (!el) return;
    if (el.dataset.atgard === 'lab/vaxla') {
      if (e.type === 'change') atgarder['lab/vaxla'](el);
      return;
    }
    if (e.type === 'click') atgarder[el.dataset.atgard]?.(el);
  };

  const montera = () => {
    document.body.append(byggReglage(), byggPanel());
    document.addEventListener('click', hantera);
    document.addEventListener('change', hantera);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', montera);
  else montera();
}

// BXYZ:..:eliot@bosmanxyz.xyz:..:.www.bosmanxyz.xyz
{
  const installningar = { attribut: 'data-dev-grid', lager: ['huvud', 'rest', 'baslinjer', 'rader'] };

  const skapa = (tagg, klass, egenskaper = {}) => Object.assign(document.createElement(tagg), { className: klass }, egenskaper);
  const kolumnAntal = () => {
    const n = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--cols'), 10);
    return Number.isFinite(n) && n > 0 ? n : 6;
  };
  const fyll = (nod) => nod.replaceChildren(...Array.from({ length: kolumnAntal() }, () => skapa('i', '')));

  const byggLager = () => {
    const lager = skapa('div', 'bxyz-dev-grid');
    lager.setAttribute('aria-hidden', 'true');
    const kolumner = skapa('div', 'bxyz-dev-grid__kolumner falt');
    fyll(kolumner);
    lager.append(...installningar.lager.map((namn) => skapa('div', `bxyz-dev-grid__${namn}`)), kolumner);
    return lager;
  };

  const byggInre = (falt) => {
    const rut = skapa('div', 'bar__rut');
    rut.setAttribute('aria-hidden', 'true');
    const kol = skapa('div', 'bar__rut-kol');
    fyll(kol);
    rut.append(skapa('div', 'bar__rut-rader'), skapa('div', 'bar__rut-bas'), kol);
    falt.append(rut);
    return kol;
  };

  const byggReglage = () => {
    const reglage = skapa('div', 'bxyz-dev-grid__reglage', { role: 'group' });
    reglage.setAttribute('aria-label', 'grid overlay');
    const vaxla = skapa('button', '', { type: 'button', textContent: 'grid' });
    vaxla.dataset.atgard = 'grid/vaxla';
    vaxla.setAttribute('aria-pressed', 'false');
    const dolj = skapa('button', '', { type: 'button', textContent: '×' });
    dolj.dataset.atgard = 'grid/dolj';
    dolj.setAttribute('aria-label', 'hide grid control');
    reglage.append(vaxla, dolj);
    reglage.hidden = false;
    vaxla.setAttribute('aria-pressed', String(document.documentElement.hasAttribute(installningar.attribut)));
    return reglage;
  };

  const atgarder = {
    'grid/vaxla': (knapp) => knapp.setAttribute('aria-pressed', String(document.documentElement.toggleAttribute(installningar.attribut))),
    'grid/dolj': (knapp) => {
      const reglage = knapp.closest('.bxyz-dev-grid__reglage');
      document.documentElement.removeAttribute(installningar.attribut);
      reglage.querySelector('[data-atgard="grid/vaxla"]').setAttribute('aria-pressed', 'false');
      reglage.hidden = true;
    },
  };

  const hanteraAtgard = (handelse) => {
    const knapp = handelse.target.closest('[data-atgard^="grid/"]');
    if (knapp) atgarder[knapp.dataset.atgard]?.(knapp);
  };

  const montera = () => {
    const lager = byggLager();
    const kolumner = lager.querySelector('.bxyz-dev-grid__kolumner');
    const inre = [...document.querySelectorAll('.bar__grid')].map(byggInre);
    document.body.append(lager, byggReglage());
    document.addEventListener('click', hanteraAtgard);
    window.addEventListener('resize', () => { fyll(kolumner); inre.forEach(fyll); });
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', montera);
  else montera();
}

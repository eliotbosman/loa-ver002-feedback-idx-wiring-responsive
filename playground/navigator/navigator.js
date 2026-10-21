/* BXYZ:..:eliot@bosmanxyz.xyz:..:.www.bosmanxyz.xyz */
{
  const html = document.documentElement;
  const yta = document.querySelector('.falt');
  const penn = yta.getContext('2d');
  const knappar = [...document.querySelectorAll('[data-mal]')];

  const mat = (prop) => {
    const prov = document.createElement('i');
    prov.style.cssText = 'position:absolute;visibility:hidden;block-size:' + prop;
    document.body.appendChild(prov);
    const n = prov.getBoundingClientRect().height;
    prov.remove();
    return n || 36;
  };

  class Vektor {
    constructor(x, y) { this.x = x; this.y = y; }
    lagg(v) { this.x += v.x; this.y += v.y; return this; }
    mult(n) { this.x *= n; this.y *= n; return this; }
    mag() { return Math.hypot(this.x, this.y); }
    norm() { const m = this.mag() || 1; return this.mult(1 / m); }
    begransa(max) { const m = this.mag(); if (m > max && m) this.mult(max / m); return this; }
    kopia() { return new Vektor(this.x, this.y); }
    static sub(a, b) { return new Vektor(a.x - b.x, a.y - b.y); }
  }

  class Fordon {
    constructor(x, y, u) {
      this.position = new Vektor(x, y);
      this.hastighet = new Vektor(0, 0);
      this.acceleration = new Vektor(0, 0);
      this.maxfart = u * 0.18;
      this.maxkraft = this.maxfart * 0.08;
      this.broms = u * 3;
    }
    kraft(f) { this.acceleration.lagg(f); }
    styr(onskad, vikt) {
      const steer = Vektor.sub(onskad, this.hastighet);
      steer.mult(vikt);
      steer.begransa(this.maxkraft * vikt);
      this.kraft(steer);
    }
    sok(mal, vikt) {
      const onskad = Vektor.sub(mal, this.position);
      const d = onskad.mag();
      onskad.norm().mult(d < this.broms ? this.maxfart * (d / this.broms) : this.maxfart);
      this.styr(onskad, vikt);
    }
    folj(flode, vikt) {
      const onskad = flode.las(this.position);
      if (!onskad) return;
      onskad.mult(this.maxfart);
      this.styr(onskad, vikt);
    }
    vagg(kant, vikt) {
      const w = yta.clientWidth;
      const h = yta.clientHeight;
      const p = this.position;
      let onskad = null;
      if (p.x < kant) onskad = new Vektor(this.maxfart, this.hastighet.y);
      else if (p.x > w - kant) onskad = new Vektor(-this.maxfart, this.hastighet.y);
      if (p.y < kant) onskad = new Vektor(this.hastighet.x, this.maxfart);
      else if (p.y > h - kant) onskad = new Vektor(this.hastighet.x, -this.maxfart);
      if (!onskad) return;
      onskad.norm().mult(this.maxfart);
      this.styr(onskad, vikt);
    }
    hall(kant) {
      const w = yta.clientWidth;
      const h = yta.clientHeight;
      this.position.x = Math.min(Math.max(this.position.x, kant), w - kant);
      this.position.y = Math.min(Math.max(this.position.y, kant), h - kant);
    }
    steg() {
      this.hastighet.lagg(this.acceleration).begransa(this.maxfart);
      this.position.lagg(this.hastighet);
      this.acceleration.mult(0);
    }
  }

  class Flode {
    constructor(cell) { this.cell = cell; this.rut = []; this.bygg(); }
    bygg() {
      this.kol = Math.max(1, Math.ceil(yta.clientWidth / this.cell));
      this.rad = Math.max(1, Math.ceil(yta.clientHeight / this.cell));
      this.rut = [];
      for (let y = 0; y < this.rad; y++) {
        for (let x = 0; x < this.kol; x++) {
          const vinkel = Math.sin(x * 0.45) * 0.9 + Math.cos(y * 0.35) * 0.7;
          this.rut.push(new Vektor(Math.cos(vinkel), Math.sin(vinkel)));
        }
      }
    }
    las(p) {
      const kol = Math.floor(p.x / this.cell);
      const rad = Math.floor(p.y / this.cell);
      if (kol < 0 || rad < 0 || kol >= this.kol || rad >= this.rad) return null;
      return this.rut[kol + rad * this.kol].kopia();
    }
  }

  const mitt = (el) => {
    const r = el.getBoundingClientRect();
    return new Vektor(r.left + r.width / 2, r.top + r.height / 2);
  };

  let u = mat('var(--u)');
  let kant = mat('var(--margin)') + mat('var(--mark-size)') / 2;
  let flode = new Flode(u);
  let fordon = new Fordon(yta.clientWidth / 2, yta.clientHeight / 2, u);
  let mal = mitt(document.querySelector('.karta [aria-pressed="true"]'));

  const rit = () => {
    const w = yta.clientWidth;
    const h = yta.clientHeight;
    const dpr = window.devicePixelRatio || 1;
    if (yta.width !== Math.floor(w * dpr) || yta.height !== Math.floor(h * dpr)) {
      yta.width = Math.floor(w * dpr);
      yta.height = Math.floor(h * dpr);
    }
    penn.setTransform(dpr, 0, 0, dpr, 0, 0);
    penn.clearRect(0, 0, w, h);
    penn.strokeStyle = 'rgba(22,22,23,0.28)';
    penn.lineWidth = 1;
    penn.strokeRect(kant, kant, w - kant * 2, h - kant * 2);
    penn.strokeStyle = 'rgba(109,110,112,0.55)';
    const steg = flode.cell;
    for (let y = 0; y < flode.rad; y++) {
      for (let x = 0; x < flode.kol; x++) {
        const v = flode.rut[x + y * flode.kol];
        const cx = (x + 0.5) * steg;
        const cy = (y + 0.5) * steg;
        penn.beginPath();
        penn.moveTo(cx, cy);
        penn.lineTo(cx + v.x * steg * 0.35, cy + v.y * steg * 0.35);
        penn.stroke();
      }
    }
    penn.strokeStyle = 'rgba(22,22,23,0.8)';
    penn.beginPath();
    penn.moveTo(fordon.position.x, fordon.position.y);
    penn.lineTo(mal.x, mal.y);
    penn.stroke();
  };

  const placera = () => {
    const halva = mat('var(--mark-size)') / 2;
    html.style.setProperty('--fordon-x', (fordon.position.x - halva) + 'px');
    html.style.setProperty('--fordon-y', (fordon.position.y - halva) + 'px');
  };

  const valj = (knapp) => {
    knappar.forEach((k) => k.setAttribute('aria-pressed', String(k === knapp)));
    mal = mitt(knapp);
  };

  document.querySelector('.karta').addEventListener('click', (e) => {
    const knapp = e.target.closest('[data-mal]');
    if (knapp) valj(knapp);
  });

  document.querySelector('.lage').addEventListener('click', (e) => {
  const pa = html.toggleAttribute('data-placerad');
    html.dataset.mark = pa ? 'projekt' : 'vila';
    e.currentTarget.setAttribute('aria-pressed', String(pa));
  });

  const om = () => {
    u = mat('var(--u)');
    kant = mat('var(--margin)') + mat('var(--mark-size)') / 2;
    flode = new Flode(u);
    fordon.maxfart = u * 0.18;
    fordon.maxkraft = fordon.maxfart * 0.08;
    fordon.broms = u * 3;
    mal = mitt(document.querySelector('.karta [aria-pressed="true"]'));
  };
  window.addEventListener('resize', om);

  const ram = () => {
    const d = Vektor.sub(mal, fordon.position).mag();
    fordon.folj(flode, d < fordon.broms ? 0.2 : 0.7);
    fordon.sok(mal, 1);
    fordon.vagg(kant, 2.5);
    fordon.steg();
    fordon.hall(kant);
    placera();
    rit();
    requestAnimationFrame(ram);
  };
}

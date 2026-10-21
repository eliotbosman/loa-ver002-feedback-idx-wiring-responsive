// BXYZ:..:eliot@bosmanxyz.xyz:..:.www.bosmanxyz.xyz
(function () {
  var RINGAR = [
    { w: 1, klass: 'ring', lag: '1', soft: 'halo' },
    { w: 1, klass: 'mellan', lag: 'paper', soft: 'bloom' },
    { w: 2, klass: 'ring', lag: '2' },
    { w: 1, klass: 'mellan', lag: 'paper' },
    { w: 1, klass: 'ring', lag: '3' },
    { w: 1, klass: 'mellan', lag: 'paper' },
    { w: 2, klass: 'ring', lag: '4' },
    { w: 1, klass: 'mellan', lag: 'paper' },
    { w: 1, klass: 'ring', lag: '5' },
    { w: 0, klass: 'mellan', lag: 'paper' }
  ];
  function rita(svg) {
    if (!svg) return;
    var enhet = 50 / 16;
    var r = 50;
    var ns = 'http://www.w3.org/2000/svg';
    svg.replaceChildren();
    RINGAR.forEach(function (lag) {
      var c = document.createElementNS(ns, 'circle');
      c.setAttribute('class', lag.klass);
      c.setAttribute('cx', '50');
      c.setAttribute('cy', '50');
      c.setAttribute('r', String(r));
      c.setAttribute('data-lag', lag.lag);
      svg.appendChild(c);
      if (lag.w) r -= lag.w * enhet;
    });
  }
  document.querySelectorAll('.mark svg').forEach(rita);
})();

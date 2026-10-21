# BXYZ:..:eliot@bosmanxyz.xyz:..:.www.bosmanxyz.xyz
from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from karta import skriv
from regler import AM, CM, granska
from samman import las_allt


KRAV = (
    ('js/site.js', 'sattLage'),
    ('js/site.js', 'openBar'),
    ('js/site.js', 'lasScroll'),
    ('js/site.js', 'visaMer'),
    ('js/site.js', 'markRoll'),
    ('js/site.js', 'colour'),
    ('js/site.js', 'steg'),
    ('js/site.js', 'genomskinlig'),
    ('js/pill.js', 'bygg'),
    ('js/pill.js', 'Fjader.prototype.steg'),
    ('js/ringar.js', 'rita'),
)


def main() -> int:
    rot = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else Path(__file__).resolve().parents[2]
    modell = las_allt(rot)
    fel = _sjalv(modell)
    if fel:
        for rad in fel:
            print(rad)
        return 1
    fynd, regler, tradar = granska(modell)
    ut = skriv(rot, modell, fynd, regler, tradar)
    _skriv_ut(modell, fynd, regler, tradar, ut)
    return 0


def _sjalv(modell: dict) -> list[str]:
    fel = []
    namn = {(f['fil'], f['namn']) for f in modell['funktioner']}
    for par in KRAV:
        if par not in namn:
            fel.append(f'missing function {par[0]}:{par[1]}')
    satt = next(f for f in modell['funktioner'] if f['namn'] == 'sattLage' and f['fil'] == 'js/site.js')
    if not satt['uttryck']:
        fel.append('sattLage has no expressions')
    if not any(s['attribut'] == 'data-lage' for s in satt['skriver']):
        fel.append('sattLage does not write data-lage')
    tom = next(f for f in modell['funktioner'] if f['namn'] == 'markRoll')
    if not tom['tom']:
        fel.append('markRoll should be empty')
    klick = [f for f in modell['funktioner'] if f['fil'] == 'js/site.js' and any(l['handelse'] == 'click' for l in f['lyssnare'])]
    if not any(f['namn'] != 'rot' for f in klick):
        fel.append('click listener stayed on rot')
    if not any(r['element'] == 'html' and r['attribut'] == 'data-lage' for r in modell['tillstand']):
        fel.append('state map has no html data-lage')
    site = next(c for c in modell['css'] if c['fil'] == 'css/site.css')
    if len(site['regler']) < 40:
        fel.append(f"site.css parsed {len(site['regler'])} rules")
    if not site['lager_ordning']:
        fel.append('site.css layer order missing')
    return fel


def _skriv_ut(modell: dict, fynd: list[dict], regler: list[dict], tradar: list[dict], ut: Path) -> None:
    sajt = [f for f in fynd if f['roll'] == 'sajt' and f['allvar'] != 'ok']
    raknare: dict[str, int] = {}
    for post in sajt:
        raknare[post['allvar']] = raknare.get(post['allvar'], 0) + 1
    print(f"root {ut.parents[2]}")
    print(f"pages {len(modell['sidor'])}  css {len(modell['css'])}  js {len(modell['js_filer'])}")
    print(f"functions {len(modell['funktioner'])}  expressions {sum(len(f['uttryck']) for f in modell['funktioner'])}")
    print(f"dom-groups {len(modell['dom'])}  state-rows {len(modell['tillstand'])}")
    print('site-findings ' + '  '.join(f'{k} {raknare.get(k, 0)}' for k in ('broken', 'violation', 'dead', 'note')))
    for regel in regler:
        if regel['id'] in AM + CM:
            print(f"{regel['id']} {regel['lage']}")
    print(f"interlink {len(tradar)}")
    print(f"wrote {ut / 'index.html'}")


if __name__ == '__main__':
    sys.exit(main())

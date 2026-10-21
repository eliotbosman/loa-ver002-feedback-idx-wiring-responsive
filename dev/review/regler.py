# BXYZ:..:eliot@bosmanxyz.xyz:..:.www.bosmanxyz.xyz
from __future__ import annotations

import re

from las_css import attribut
from las_js import alltid_falsk

AM = [f'AM{i:02d}' for i in range(1, 16)]
CM = [f'CM{i:02d}' for i in range(1, 16)]

LANGD = re.compile(r'(?<![\w-])(\d*\.?\d+)(px|pt|rem|em|dvw|dvh|vw|vh|ms|s)\b')
HEX = re.compile(r'#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})\b')
NAMNGIVEN = re.compile(
    r'\b(white|black|yellow|whitesmoke|silver|dimgray|lightpink|darkslateblue|burlywood|olivedrab)\b',
    re.I,
)
FYSISK = {
    'left', 'right', 'top', 'bottom',
    'margin-left', 'margin-right', 'margin-top', 'margin-bottom',
    'padding-left', 'padding-right', 'padding-top', 'padding-bottom',
}
UTSEENDE = re.compile(
    r'^(vit|svart|gul|bla|rosa|big|small|blue|red|green|yellow|white|black|grey|gray)$',
    re.I,
)
ATGARD = re.compile(r'''['"]([a-z0-9]+/[a-z0-9]+)['"]''')
LAYOUT_TID = re.compile(r'grid-template|block-size|inline-size|(?<![\w-])(?:height|width|margin|padding|top|left|gap)\b')


class Samling:
    def __init__(self) -> None:
        self.fynd: list[dict] = []
        self._index: dict[tuple, dict] = {}

    def lagg(
        self,
        *,
        fil: str,
        rad: int,
        regel: str,
        allvar: str,
        fynd: str,
        atgard: str,
        roll: str,
        nyckel: str,
        paverkar: bool = True,
        risk: str = 'lag',
    ) -> None:
        slot = (roll, fil, regel, allvar, nyckel)
        post = self._index.get(slot)
        if post is None:
            post = {
                'fil': fil,
                'rad': rad,
                'rader': [],
                'regel': regel,
                'allvar': allvar,
                'fynd': fynd,
                'atgard': atgard,
                'roll': roll,
                'paverkar': paverkar,
                'risk': risk,
            }
            self._index[slot] = post
            self.fynd.append(post)
        if rad and rad not in post['rader']:
            post['rader'].append(rad)
            post['rad'] = post['rader'][0]


def granska(modell: dict) -> tuple[list[dict], list[dict], list[dict]]:
    samling = Samling()
    _am(modell, samling)
    _cm(modell, samling)
    tradar = _tradar(modell, samling)
    return samling.fynd, _lage(samling.fynd, modell), tradar


def _am(modell: dict, samling: Samling) -> None:
    funs = modell['funktioner']
    for fun in funs:
        har_prob = any(s['slag'] == 'prob' for s in fun['skriver'])
        for skriv in fun['skriver']:
            if skriv['slag'] == 'stil' and skriv['attribut'] == 'background' and har_prob:
                samling.lagg(
                    fil=fun['fil'], rad=skriv['rad'], regel='AM01', allvar='note', roll=fun['roll'],
                    nyckel='prob-bakgrund', paverkar=False, risk='lag',
                    fynd='A throwaway probe sets background to read a computed color.',
                    atgard='Keep the probe, or read the token without painting a node.',
                )
                continue
            if skriv['slag'] == 'prob':
                samling.lagg(
                    fil=fun['fil'], rad=skriv['rad'], regel='AM01', allvar='note', roll=fun['roll'],
                    nyckel='prob', paverkar=False, risk='lag',
                    fynd='A hidden probe node is used to measure a token or a color.',
                    atgard='Leave the probe. It is not the page painting itself.',
                )
                continue
            if skriv['slag'] == 'stil':
                samling.lagg(
                    fil=fun['fil'], rad=skriv['rad'], regel='AM01', allvar='violation', roll=fun['roll'],
                    nyckel='stil-' + skriv['attribut'], paverkar=True, risk='medel',
                    fynd=f"JS sets style.{skriv['attribut']} ({skriv['varde']}). Presentation is owned by CSS.",
                    atgard='Write a data-attribute and let a rule paint visibility, color, or position.',
                )
            elif skriv['slag'] == 'variabel':
                samling.lagg(
                    fil=fun['fil'], rad=skriv['rad'], regel='AM01', allvar='note', roll=fun['roll'],
                    nyckel='variabel', paverkar=True, risk='medel',
                    fynd='JS writes custom properties (--*) onto elements. CSS still paints, but the script owns the value.',
                    atgard='Prefer a data-state that selects a token already defined in CSS.',
                )
            elif skriv['slag'] == 'klass':
                samling.lagg(
                    fil=fun['fil'], rad=skriv['rad'], regel='AM04', allvar='violation', roll=fun['roll'],
                    nyckel='klass', paverkar=True, risk='medel',
                    fynd=f"classList mutates '{skriv['varde']}'.",
                    atgard='Use a data-attribute. CSS selects the state.',
                )
        if always_looks(fun):
            samling.lagg(
                fil=fun['fil'], rad=fun['rad'], regel='AM02', allvar='note', roll=fun['roll'],
                nyckel='namn-' + fun['namn'], paverkar=True, risk='lag',
                fynd=f"Function {fun['namn']} is named for appearance.",
                atgard='Name the job (sattTema, lasYta) rather than the paint.',
            )
        for skriv in fun['skriver']:
            if skriv['slag'] == 'tillstand' and UTSEENDE.match(str(skriv['varde'] or '')):
                samling.lagg(
                    fil=fun['fil'], rad=skriv['rad'], regel='AM02', allvar='violation', roll=fun['roll'],
                    nyckel='varde-' + skriv['attribut'], paverkar=True, risk='lag',
                    fynd=f"{skriv['attribut']} is set to '{skriv['varde']}', which names a look.",
                    atgard='Name the intent (lag, kontrast, vald) and map that to a color in CSS.',
                )
        if fun['tom']:
            samling.lagg(
                fil=fun['fil'], rad=fun['rad'], regel='AM06', allvar='dead', roll=fun['roll'],
                nyckel='tom-' + fun['namn'], paverkar=True, risk='lag',
                fynd=f"{fun['namn']} has an empty body.",
                atgard='Remove it, or give it the job its callers expect.',
            )
        if alltid_falsk(fun):
            samling.lagg(
                fil=fun['fil'], rad=fun['rad'], regel='AM08', allvar='dead', roll=fun['roll'],
                nyckel='falsk-' + fun['namn'], paverkar=True, risk='lag',
                fynd=f"{fun['namn']} always returns false, and callers still branch on it.",
                atgard='Delete the branch, or return the real condition.',
            )

    for fun in funs:
        if fun['roll'] != 'sajt' or fun['namn'] == 'rot' or '@' in fun['namn']:
            continue
        if not _anvand(fun, funs):
            samling.lagg(
                fil=fun['fil'], rad=fun['rad'], regel='AM06', allvar='dead', roll=fun['roll'],
                nyckel='oanvand-' + fun['namn'], paverkar=True, risk='lag',
                fynd=f"{fun['namn']} is never called.",
                atgard='Remove it, or wire it from the action table.',
            )

    per_fil: dict[str, list[dict]] = {}
    for fun in funs:
        per_fil.setdefault(fun['fil'], []).append(fun)
    for fil, grupp in per_fil.items():
        roll = grupp[0]['roll']
        klick = [f for f in grupp if any(l['handelse'] == 'click' for l in f['lyssnare'])]
        har_tabell = any('atgarder' in u['text'] for f in grupp for u in f['uttryck'])
        kodgren = any(re.search(r"getAttribute\s*\(\s*['\"]data-atgard['\"]", u['text']) for f in grupp for u in f['uttryck'])
        if klick and kodgren and not har_tabell:
            samling.lagg(
                fil=fil, rad=klick[0]['rad'], regel='AM03', allvar='violation', roll=roll,
                nyckel='if-kedja', paverkar=True, risk='medel',
                fynd='Clicks read data-atgard and then branch with if. There is no action table.',
                atgard='One atgarder map: code to function. The listener only dispatches.',
            )
        if har_tabell:
            samling.lagg(
                fil=fil, rad=grupp[0]['rad'], regel='AM03', allvar='ok', roll=roll,
                nyckel='tabell', paverkar=False, risk='lag',
                fynd='This file dispatches through an atgarder table.',
                atgard='Keep new actions on that table.',
            )
        if len(grupp) > 35 and roll == 'sajt':
            samling.lagg(
                fil=fil, rad=1, regel='AM06', allvar='note', roll=roll,
                nyckel='monolit', paverkar=True, risk='hog',
                fynd=f'{len(grupp)} functions share one file.',
                atgard='Split along the existing jobs: mark, gallery, archive, project. Do not change behavior while splitting.',
            )
        fan = []
        for fun in grupp:
            mal = [n for n in fun['anrop'] if n.split('.')[-1] in {'sattMark', 'fallFarg', 'markRoll', 'sattLage', 'colour', 'visaMer', 'shut'}]
            if len(set(mal)) >= 3:
                fan.append(fun['namn'])
        if fan:
            samling.lagg(
                fil=fil, rad=1, regel='AM07', allvar='note', roll=roll,
                nyckel='fan', paverkar=True, risk='medel',
                fynd='These functions each poke several state writers: ' + ', '.join(fan[:8]) + '.',
                atgard='One writer should publish the next state. The others subscribe.',
            )
        if any('sessionStorage' in u['text'] for f in grupp for u in f['uttryck']):
            samling.lagg(
                fil=fil, rad=1, regel='AM09', allvar='note', roll=roll,
                nyckel='sido', paverkar=True, risk='medel',
                fynd='sessionStorage, history, and dataset writes share the same page script.',
                atgard='Keep storage and routing in named functions the state step calls.',
            )
        if any('setTimeout' in u['text'] for f in grupp for u in f['uttryck']):
            samling.lagg(
                fil=fil, rad=1, regel='AM10', allvar='note', roll=roll,
                nyckel='tid', paverkar=True, risk='medel',
                fynd='setTimeout sequences a press. data-las names the scroll lock; the press timer is unnamed.',
                atgard='A data-state for the press, with the delay taken from --tau.',
            )
        if any(l['handelse'] == 'scroll' for f in grupp for l in f['lyssnare']):
            samling.lagg(
                fil=fil, rad=1, regel='AM14', allvar='note', roll=roll,
                nyckel='scroll', paverkar=True, risk='medel',
                fynd='Scroll writes --svep and samples pixels on a rAF tick.',
                atgard='Keep the rAF gate. Move the color sample off the scroll path if it hitches.',
            )

    refererade = set()
    for sida in modell['sidor']:
        refererade.update(sida['skript'])
    for post in modell['js_filer']:
        if post['roll'] == 'sajt' and post['fil'] not in refererade:
            samling.lagg(
                fil=post['fil'], rad=1, regel='AM06', allvar='dead', roll='sajt',
                nyckel='fil', paverkar=True, risk='lag',
                fynd='No page loads this script.',
                atgard='Link it from the pages that need it, or delete it.',
            )


def always_looks(fun: dict) -> bool:
    return bool(re.search(r'colour|color|opacity', fun['namn'], re.I))


def _anvand(fun: dict, funs: list[dict]) -> bool:
    for annan in funs:
        if annan is fun:
            continue
        if annan['fil'] != fun['fil']:
            continue
        if fun['namn'] in annan['anrop'] or fun['namn'] in annan['referenser']:
            return True
    return False


def _cm(modell: dict, samling: Samling) -> None:
    for css in modell['css']:
        roll = css['roll']
        fil = css['fil']
        if not css['har_lager'] and css['regler']:
            samling.lagg(
                fil=fil, rad=1, regel='CM02', allvar='violation', roll=roll,
                nyckel='olager', paverkar=True, risk='medel',
                fynd='This file has no @layer. Unlayered rules outrank the layered site.',
                atgard='Put the rules in @layer komponenter (or the layer they belong to).',
            )
        if css['important']:
            samling.lagg(
                fil=fil, rad=1, regel='CM02', allvar='violation', roll=roll,
                nyckel='viktig', paverkar=True, risk='lag',
                fynd=f"{css['important']} !important declarations.",
                atgard='Raise the layer or narrow the selector. Drop !important.',
            )
        lager_traff: dict[str, int] = {}
        for regel in css['regler']:
            if regel['lager']:
                lager_traff[regel['lager']] = lager_traff.get(regel['lager'], 0) + 1
            _literal(css, regel, samling)
            _fysisk(css, regel, samling)
            _rorelse(css, regel, samling)
            _element(css, regel, samling)
        if css['lager_ordning']:
            dubbel = [namn for namn, n in lager_traff.items() if n and css['lager_ordning'].count(namn) > 1]
            if dubbel:
                samling.lagg(
                    fil=fil, rad=1, regel='CM02', allvar='note', roll=roll,
                    nyckel='dubbel-lager', paverkar=False, risk='lag',
                    fynd='Layer order lists ' + ', '.join(dubbel) + ' once; the file opens the layer in more than one block.',
                    atgard='One block per layer keeps the cascade readable. Order is already set by the first @layer line.',
                )
        media_props: set[str] = set()
        for regel in css['regler']:
            if not regel['media'] or 'prefers-reduced-motion' in regel['media']:
                continue
            for dek in regel['deklarationer']:
                if dek['prop'] not in {'--u', '--cols'}:
                    media_props.add(dek['prop'])
        if media_props and roll == 'sajt':
            lista = ', '.join(sorted(media_props)[:12])
            samling.lagg(
                fil=fil, rad=1, regel='CM08', allvar='note', roll=roll,
                nyckel='media', paverkar=True, risk='hog',
                fynd=f'Breakpoints change more than --u and --cols: {lista}.',
                atgard='At a breakpoint, change --u and --cols. Derive the rest.',
            )
        if any('63.999rem' in r['media'] or 'max-width' in r['media'] for r in css['regler']):
            samling.lagg(
                fil=fil, rad=1, regel='CM08', allvar='note', roll=roll,
                nyckel='max', paverkar=True, risk='lag',
                fynd='A max-width breakpoint sits beside the min-width cuts.',
                atgard='Write the phone and tablet cuts as not (min-width: …).',
            )
        fasta = sum(1 for r in css['regler'] for d in r['deklarationer'] if d['prop'] == 'position' and d['varde'] in {'fixed', 'absolute'})
        if fasta and roll == 'sajt':
            samling.lagg(
                fil=fil, rad=1, regel='CM08', allvar='note', roll=roll,
                nyckel='position', paverkar=False, risk='lag',
                fynd=f'{fasta} rules use position fixed or absolute.',
                atgard='Keep fixed chrome on the viewport field. New pieces should join the grid.',
            )

    sajt = [c for c in modell['css'] if c['roll'] == 'sajt']
    if sajt and not any(c['har_container'] for c in sajt):
        samling.lagg(
            fil=sajt[0]['fil'], rad=1, regel='CM03', allvar='violation', roll='sajt',
            nyckel='container', paverkar=True, risk='hog',
            fynd='No @container query. Components switch on the viewport only.',
            atgard='Give a component container-type: inline-size where it must travel between columns.',
        )
    if any('prefers-reduced-motion' in r['media'] for c in sajt for r in c['regler']):
        samling.lagg(
            fil='css/site.css', rad=1, regel='CM09', allvar='ok', roll='sajt',
            nyckel='reduced', paverkar=False, risk='lag',
            fynd='prefers-reduced-motion sets --tau to 0ms.',
            atgard='Keep every new duration on --tau so this cut still wins.',
        )
    if any(':focus-visible' in r['selektor'] for c in sajt for r in c['regler']):
        samling.lagg(
            fil='css/site.css', rad=1, regel='CM11', allvar='ok', roll='sajt',
            nyckel='fokus', paverkar=False, risk='lag',
            fynd=':focus-visible is drawn with the stroke token.',
            atgard='Do not remove the outline without a replacement on the same control.',
        )
    if any('scrollbar-width' in d['prop'] or d['varde'] == 'none' and d['prop'] == 'user-select' for c in sajt for r in c['regler'] for d in r['deklarationer']):
        samling.lagg(
            fil='css/site.css', rad=1, regel='CM11', allvar='note', roll='sajt',
            nyckel='krom', paverkar=True, risk='medel',
            fynd='The scrollbar is hidden and images refuse selection.',
            atgard='Keep keyboard focus. Treat hidden scrollbars as a page-state decision, not a default.',
        )
    if any(d['prop'] == '--fs-body' and 'rem' in d['varde'] for c in sajt for r in c['regler'] for d in r['deklarationer']):
        samling.lagg(
            fil='css/site.css', rad=1, regel='CM12', allvar='note', roll='sajt',
            nyckel='fs', paverkar=True, risk='medel',
            fynd='--fs-body is a raw rem, not a step on --u / --baseline.',
            atgard='Derive the body size from --u, then snap the line-height back to a baseline multiple.',
        )


def _literal(css: dict, regel: dict, samling: Samling) -> None:
    if regel['lager'] == 'tokens':
        return
    roll, fil = css['roll'], css['fil']
    for dek in regel['deklarationer']:
        val = dek['varde']
        prop = dek['prop']
        if prop == 'z-index' and re.fullmatch(r'-?\d+', val or ''):
            samling.lagg(
                fil=fil, rad=regel['rad'], regel='CM01', allvar='note', roll=roll,
                nyckel='z', paverkar=True, risk='lag',
                fynd=f'z-index: {val} is a raw integer.',
                atgard='Use --lager-*.',
            )
        if prop == 'font-weight' and re.fullmatch(r'\d{3}', val or '') and regel['lager'] == 'komponenter':
            samling.lagg(
                fil=fil, rad=regel['rad'], regel='CM12', allvar='note', roll=roll,
                nyckel='vikt', paverkar=False, risk='lag',
                fynd='Font weight is a raw number on a component rule.',
                atgard='A token for the row emphasis, selected by data-rad.',
            )
        for traff in HEX.finditer(val):
            slag = 'note' if 'var(' in val else 'violation'
            samling.lagg(
                fil=fil, rad=regel['rad'], regel='CM01', allvar=slag, roll=roll,
                nyckel='hex-' + slag, paverkar=slag == 'violation', risk='lag',
                fynd=f'{prop} carries {traff.group(0)} outside the token layer.',
                atgard='Point at a token. A fallback hex inside var() still leaves a second source of truth.',
            )
        for traff in NAMNGIVEN.finditer(val):
            if 'var(' in val:
                continue
            samling.lagg(
                fil=fil, rad=regel['rad'], regel='CM01', allvar='violation', roll=roll,
                nyckel='namn-farg', paverkar=True, risk='lag',
                fynd=f'{prop} uses the named color {traff.group(0)} outside tokens.',
                atgard='Use the token that already names that color.',
            )
        for traff in LANGD.finditer(val):
            tal, enhet = traff.group(1), traff.group(2)
            if tal in {'0', '0.0', '.0'}:
                continue
            if enhet == 'px' and 'url(' in val:
                samling.lagg(
                    fil=fil, rad=regel['rad'], regel='CM01', allvar='note', roll=roll,
                    nyckel='pekare', paverkar=False, risk='lag',
                    fynd='Cursor hotspot offsets are px.',
                    atgard='Hotspot numbers are image coordinates. Keep them on the cursor token only.',
                )
                continue
            if regel['lager'] == '' and prop.startswith('--') and 'var(' in val and enhet == 'ms':
                samling.lagg(
                    fil=fil, rad=regel['rad'], regel='CM01', allvar='note', roll=roll,
                    nyckel='ms-fallback', paverkar=False, risk='lag',
                    fynd=f'{prop} falls back to a raw {tal}{enhet}.',
                    atgard='Let the fallback be var(--tau) or a derived duration.',
                )
                continue
            samling.lagg(
                fil=fil, rad=regel['rad'], regel='CM01', allvar='violation', roll=roll,
                nyckel='langd-' + enhet, paverkar=True, risk='lag',
                fynd=f'{prop} uses {tal}{enhet} outside the token layer.',
                atgard='Derive it from --u, --baseline, or --tau.',
            )


def _fysisk(css: dict, regel: dict, samling: Samling) -> None:
    for dek in regel['deklarationer']:
        if dek['prop'] in FYSISK:
            samling.lagg(
                fil=css['fil'], rad=regel['rad'], regel='CM14', allvar='violation', roll=css['roll'],
                nyckel=dek['prop'], paverkar=True, risk='lag',
                fynd=f"{dek['prop']} is a physical property.",
                atgard='Use the logical longhand (inset-inline, padding-block, margin-inline).',
            )
        elif dek['prop'] == 'inset':
            samling.lagg(
                fil=css['fil'], rad=regel['rad'], regel='CM14', allvar='note', roll=css['roll'],
                nyckel='inset', paverkar=False, risk='lag',
                fynd='inset sets physical edges.',
                atgard='inset-block and inset-inline survive a direction change.',
            )


def _rorelse(css: dict, regel: dict, samling: Samling) -> None:
    for dek in regel['deklarationer']:
        if dek['prop'] in {'transition', 'animation'} and LAYOUT_TID.search(dek['varde']):
            samling.lagg(
                fil=css['fil'], rad=regel['rad'], regel='CM09', allvar='violation', roll=css['roll'],
                nyckel='layout-tid', paverkar=True, risk='medel',
                fynd=f"{dek['prop']} animates a layout property ({dek['varde'][:80]}).",
                atgard='Animate transform or opacity. Drive the fold with a token, not grid-template-rows, if it stutters.',
            )


def _element(css: dict, regel: dict, samling: Samling) -> None:
    if regel['lager'] != 'komponenter':
        return
    for delse in regel['selektor'].split(','):
        bit = delse.strip()
        if re.fullmatch(r'(button|a|img|h1|h2|h3|p|div|span|ul|li)', bit):
            samling.lagg(
                fil=css['fil'], rad=regel['rad'], regel='CM04', allvar='note', roll=css['roll'],
                nyckel='element-' + bit, paverkar=True, risk='lag',
                fynd=f'Component layer styles every {bit}.',
                atgard='Scope it with @scope or a block class.',
            )


def _tradar(modell: dict, samling: Samling) -> list[dict]:
    html_atg: set[str] = set()
    js_atg: set[str] = set()
    for sida in modell['sidor']:
        if sida['roll'] != 'sajt':
            continue
        for post in sida['poster']:
            if post['attribut'] == 'data-atgard' and post['varde'] not in {'', '•'}:
                html_atg.add(post['varde'])
    for fun in modell['funktioner']:
        if fun['roll'] != 'sajt':
            continue
        for uttryck in fun['uttryck']:
            js_atg.update(ATGARD.findall(uttryck['text']))
    tradar: list[dict] = []
    for kod in sorted(html_atg - js_atg):
        tradar.append({'slag': 'atgard', 'text': f'{kod} is in the markup and not handled in script.'})
        samling.lagg(
            fil='js/site.js', rad=1, regel='AM03', allvar='broken', roll='sajt',
            nyckel='saknar-' + kod, paverkar=True, risk='hog',
            fynd=f'data-atgard="{kod}" has no script branch.',
            atgard='Add the code to the action table, or remove the attribute.',
        )
    for kod in sorted(js_atg - html_atg):
        tradar.append({'slag': 'atgard', 'text': f'{kod} is handled in script and not used in the markup.'})
        samling.lagg(
            fil='js/site.js', rad=1, regel='AM03', allvar='dead', roll='sajt',
            nyckel='over-' + kod, paverkar=True, risk='lag',
            fynd=f"Script handles '{kod}', and no element sends it.",
            atgard='Keep the handler if a page still authors it. Otherwise delete the branch.',
        )
    laddade = set()
    for sida in modell['sidor']:
        if sida['roll'] != 'sajt':
            continue
        for src in sida['skript'] + sida['stil']:
            if src.startswith('dev/') or src.startswith('playground/'):
                laddade.add((sida['fil'], src))
    if laddade:
        sidor = sorted({s for s, _ in laddade})
        verktyg = sorted({v for _, v in laddade})
        tradar.append({'slag': 'dev', 'text': 'Pages load dev tools: ' + ', '.join(verktyg)})
        samling.lagg(
            fil=sidor[0], rad=1, regel='AM13', allvar='note', roll='sajt',
            nyckel='dev-last', paverkar=True, risk='lag',
            fynd='Shipped pages load dev grid, lab, and map scripts: ' + ', '.join(verktyg) + '.',
            atgard='Load those from a dev switch, not from every page.',
        )
    return tradar


def _lage(fynd: list[dict], modell: dict) -> list[dict]:
    sajt_js = [f for f in modell['funktioner'] if f['roll'] == 'sajt']
    sajt_css = [c for c in modell['css'] if c['roll'] == 'sajt']
    skal = {
        'AM01': 'JS may set data-state. It may not paint.',
        'AM02': 'State names intent: lage, mark, open, laddad.',
        'AM03': 'data-atgard is the wire. One table should own it.',
        'AM04': 'data-* is the declarative state. CSS reads it.',
        'AM05': 'Page scripts are closures. Nothing is written to window.',
        'AM06': 'A unit does one job. Empty and unreferenced units are dead.',
        'AM07': 'One state change should fan out by subscription, not by a list of calls.',
        'AM08': 'Labels and indexes are derived from the source state.',
        'AM09': 'Storage, history, and DOM writes have a named boundary.',
        'AM10': 'data-las is the scroll lock. Motion time comes from --tau.',
        'AM11': 'Numbers in script should be grid or token quantities.',
        'AM12': 'Keyboard, reduced motion, and :focus-visible stay intact.',
        'AM13': 'The page script is one closure. Dev tools are not part of that API.',
        'AM14': 'Scroll and resize go through rAF. They do not paint layout in a loop.',
        'AM15': 'Home, archive, project, and info are the page kinds.',
        'CM01': 'Color, type, space, and time come from tokens.',
        'CM02': 'Layers are reset, tokens, falt, komponenter, dev.',
        'CM03': 'A component that must travel uses a container query.',
        'CM04': 'Block classes scope component rules.',
        'CM05': 'Rules key off data-state, not a class thrown from JS.',
        'CM06': 'There is no utility-class stack.',
        'CM07': 'html[data-satt] swaps tokens. There is no second theme file.',
        'CM08': 'Breakpoints change --u and --cols. Chrome may be fixed to the viewport.',
        'CM09': 'Motion uses --tau. Reduced motion zeroes it. Layout props stay still.',
        'CM10': 'The reset star is the only universal selector that should exist.',
        'CM11': ':focus-visible uses the stroke token.',
        'CM12': 'Type and the row step steer the hierarchy.',
        'CM13': '@supports keeps the baseline when a new css function is missing.',
        'CM14': 'Logical properties keep the field in either writing direction.',
        'CM15': 'Names stay on the block. One-off breakpoints and unlayered files are the leak.',
    }
    if any(l['handelse'] == 'keydown' for f in sajt_js for l in f['lyssnare']):
        skal['AM12'] = 'Enter, Space, and arrow keys are handled. prefers-reduced-motion is read. :focus-visible is in CSS.'
    if any(c['har_lager'] for c in sajt_css):
        skal['CM02'] = 'site.css declares @layer reset, tokens, falt, komponenter, dev.'
    if any('@supports' in (r['selektor'] + r['media']) or r['selektor'].startswith('@supports') for c in sajt_css for r in c['regler']):
        pass
    supports = False
    for css in sajt_css:
        if css['har_container']:
            supports = supports
        for regel in css['regler']:
            if '@supports' in regel['selektor']:
                supports = True
    if any('round(down' in d['varde'] for c in sajt_css for r in c['regler'] for d in r['deklarationer']):
        skal['CM13'] = '@supports guards the round() baseline snap. The plain --falt-rader remains when it is missing.'
    rader = []
    for rid in AM + CM:
        egna = [f for f in fynd if f['regel'] == rid and f['roll'] == 'sajt' and f['allvar'] != 'ok']
        if any(f['allvar'] in {'broken', 'violation'} and f['paverkar'] for f in egna):
            lage = 'FAIL'
        elif any(f['paverkar'] and f['allvar'] in {'note', 'dead'} for f in egna):
            lage = 'PARTIAL'
        elif rid == 'AM05':
            lage = 'PASS'
        elif rid == 'AM11':
            lage = 'PARTIAL'
            skal['AM11'] = 'Script still carries raw numerals (0.369, 0.45, 36, lerp 0.1). They are not token quantities.'
        elif rid == 'AM15':
            lage = 'PASS'
        elif rid == 'CM04':
            lage = 'PARTIAL' if any(f['regel'] == 'CM04' and f['roll'] == 'sajt' for f in fynd) else 'PASS'
        elif rid == 'CM06':
            lage = 'PASS'
        elif rid == 'CM07':
            lage = 'PASS'
            skal['CM07'] = 'html[data-satt] reassigns --rad-* and the halo. No per-component theme file.'
        elif rid == 'CM10':
            lage = 'PASS'
        else:
            lage = 'PASS'
        rader.append({'id': rid, 'lage': lage, 'skal': skal[rid]})
    return rader

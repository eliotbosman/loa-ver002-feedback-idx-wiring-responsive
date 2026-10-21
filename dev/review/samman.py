# BXYZ:..:eliot@bosmanxyz.xyz:..:.www.bosmanxyz.xyz
from __future__ import annotations

import re
from pathlib import Path

from las_css import attribut, las as las_css
from las_html import grupper, las as las_html
from las_js import analysera, med_id



def roll_av(rel: str) -> str:
    if rel.startswith('dev/') or rel.startswith('playground/') or 'test' in Path(rel).name:
        return 'verktyg'
    return 'sajt'


def las_allt(rot: Path) -> dict:
    html, css, js = [], [], []
    for vag in sorted(rot.rglob('*')):
        if not vag.is_file() or _hoppa(vag, rot):
            continue
        if vag.suffix == '.html':
            html.append(vag)
        elif vag.suffix == '.css':
            css.append(vag)
        elif vag.suffix == '.js':
            js.append(vag)
    sidor = [las_html(vag, rot, roll_av(vag.relative_to(rot).as_posix())) for vag in html]
    stil = [las_css(vag, rot, roll_av(vag.relative_to(rot).as_posix())) for vag in css]
    funktioner = []
    js_filer = []
    for vag in js:
        rel = vag.relative_to(rot).as_posix()
        roll = roll_av(rel)
        js_filer.append({'fil': rel, 'roll': roll})
        funktioner.extend(analysera(vag.read_text(encoding='utf-8', errors='replace'), rel, roll))
    med_id(funktioner)
    _vidare_lyssnare(funktioner)
    return {
        'sidor': sidor,
        'dom': grupper(sidor),
        'css': stil,
        'funktioner': funktioner,
        'js_filer': js_filer,
        'tillstand': bygg_tillstand(sidor, stil, funktioner),
    }


def _hoppa(vag: Path, rot: Path) -> bool:
    rel = vag.relative_to(rot).as_posix()
    if rel.startswith('dev/review'):
        return True
    if '.git' in vag.parts or 'node_modules' in vag.parts:
        return True
    if vag.name.endswith('.min.js'):
        return True
    return False


def _vidare_lyssnare(funs: list[dict]) -> None:
    per = {(f['fil'], f['namn']): f for f in funs}
    for fun in funs:
        kvar = []
        for lys in fun['lyssnare']:
            cb = per.get((fun['fil'], lys.get('callback') or ''))
            if cb is None or cb is fun:
                kvar.append(lys)
                continue
            post = {k: v for k, v in lys.items() if k != 'callback'}
            if post not in cb['lyssnare']:
                cb['lyssnare'].append(post)
            if fun['namn'] != 'rot':
                kvar.append(lys)
        fun['lyssnare'] = kvar


def bygg_tillstand(sidor: list[dict], stil: list[dict], funs: list[dict]) -> list[dict]:
    sidor = [s for s in sidor if s['roll'] == 'sajt']
    stil = [s for s in stil if s['roll'] == 'sajt']
    funs = [f for f in funs if f['roll'] == 'sajt']
    rader: dict[str, dict] = {}
    element_av: dict[str, set[str]] = {}
    atgard_av: dict[str, set[str]] = {}

    def rad(element: str, attribut_namn: str) -> dict:
        nyckel = f'{element}|{attribut_namn}'
        if nyckel not in rader:
            rader[nyckel] = {
                'id': nyckel,
                'element': element,
                'attribut': attribut_namn,
                'varden': [],
                'interaktion': [],
                'stil': [],
                'dynamisk': False,
            }
        return rader[nyckel]

    def varde(row: dict, text: str, kalla: str) -> None:
        if text in {'*', ''}:
            row['dynamisk'] = True
            return
        for post in row['varden']:
            if post['varde'] == text:
                if kalla not in post['kallor']:
                    post['kallor'].append(kalla)
                return
        if len(row['varden']) < 18:
            row['varden'].append({'varde': text, 'kallor': [kalla]})

    def inter(row: dict, slag: str, text: str, funktion: str) -> None:
        for post in row['interaktion']:
            if post['slag'] == slag and post['text'] == text:
                return
        if len(row['interaktion']) < 12:
            row['interaktion'].append({'slag': slag, 'text': text, 'funktion': funktion})

    for sida in sidor:
        for post in sida['poster']:
            element_av.setdefault(post['attribut'], set()).add(post['element'])
            row = rad(post['element'], post['attribut'])
            varde(row, post['varde'] or '•', 'html')
            if post['attribut'] == 'data-atgard' and post['varde'] not in {'', '•'}:
                atgard_av.setdefault(post['element'], set()).add(post['varde'])

    per = {(f['fil'], f['namn']): f for f in funs}
    for fun in funs:
        for skriv in fun['skriver']:
            if skriv['slag'] != 'tillstand':
                continue
            attr = skriv['attribut']
            for element in _element(fun, skriv, element_av.get(attr, set())):
                row = rad(element, attr)
                varde(row, skriv['varde'], 'js')
                inter(row, 'skript', fun['namn'], fun['id'])

    for element, koder in atgard_av.items():
        for kod in sorted(koder):
            for row in rader.values():
                if row['element'] == element:
                    inter(row, 'atgard', kod, '')
            for fun in funs:
                if any(kod in u['text'] for u in fun['uttryck']):
                    inter(rad(element, 'data-atgard'), 'skript', fun['namn'], fun['id'])

    for fun in funs:
        if fun['namn'] == 'rot' or not fun['lyssnare']:
            continue
        for row in list(rader.values()):
            if not _nar(fun, row['attribut'], per):
                continue
            for lys in fun['lyssnare']:
                inter(row, 'lyssnare', f"{lys['mal']} {lys['handelse']}", fun['id'])

    for css in stil:
        for regel in css['regler']:
            props = [f"{d['prop']}: {d['varde']}" for d in regel['deklarationer'][:4]]
            post = {
                'fil': css['fil'],
                'lager': regel['lager'] or '—',
                'selektor': regel['selektor'][:180],
                'egenskaper': props,
                'rad': regel['rad'],
                'media': (regel['media'] or '')[:90],
            }
            attrs = attribut(regel['selektor'])
            if attrs:
                for attr, literal in attrs:
                    mal = [r for r in rader.values() if r['attribut'] == attr] or [rad('*', attr)]
                    for row in mal:
                        if not _passar(row, regel['selektor'], literal):
                            continue
                        if literal:
                            varde(row, literal, 'css')
                        if len(row['stil']) < 8 and post not in row['stil']:
                            row['stil'].append(post)
                continue
            for element in {r['element'] for r in rader.values()}:
                klass = element.split('.')[-1] if '.' in element else element[1:] if element.startswith('.') else ''
                if not klass:
                    continue
                if re.search(r'\.' + re.escape(klass) + r'(?![\w-])', regel['selektor']):
                    row = rad(element, '—')
                    if len(row['stil']) < 5 and post not in row['stil']:
                        row['stil'].append(post)

    ut = list(rader.values())
    ut.sort(key=lambda r: (r['element'], '' if r['attribut'] == '—' else r['attribut']))
    return ut


METOD = {
    'querySelector', 'querySelectorAll', 'getAttribute', 'setAttribute', 'removeAttribute',
    'toggleAttribute', 'classList', 'closest', 'contains', 'addEventListener', 'forEach',
    'style', 'dataset', 'appendChild', 'removeChild', 'getElementById',
}


def _klasser_i(text: str) -> list[str]:
    ut: list[str] = []
    for s in re.findall(r'''['"]([^'"]+)['"]''', text):
        ut.extend(k for k in re.findall(r'\.([A-Za-z_][\w-]*)', s) if k not in METOD)
        if '__' in s and re.fullmatch(r'[A-Za-z_][\w-]*', s) and s not in METOD:
            ut.append(s)
    return ut


def _namn_fran_skript(text: str, mottagare: str) -> str:
    klasser = _klasser_i(text)
    if mottagare and klasser:
        if mottagare in klasser or any(k.split('__')[0] == mottagare for k in klasser):
            return '.' + mottagare
        for klass in klasser:
            if klass.endswith(mottagare):
                return '.' + klass
    if klasser:
        return '.' + klasser[0]
    if mottagare in {'html', 'document.documentElement', 'documentElement'}:
        return 'html'
    if mottagare in METOD:
        return '*'
    if mottagare in {'g', 'el', 'nod', 'e', 'atg', 'img', 'yta', 'b', 'fn', 'bar', 'hem', 'band'}:
        return mottagare or '*'
    return '.' + mottagare if mottagare else '*'


def _passar(row: dict, selektor: str, literal: str | None) -> bool:
    element = row['element']
    klasser = re.findall(r'\.([A-Za-z_][\w-]*)', selektor)
    if klasser:
        return any(element == '.' + k or element.endswith('.' + k) or element == k for k in klasser)
    if re.search(r'(^|[\s>+~,(])html(?![\w-])', selektor):
        return element == 'html'
    if re.search(r'(^|[\s>+~,(])body(?![\w-])', selektor):
        return element == 'body'
    if literal:
        return any(v['varde'] == literal for v in row['varden'])
    return True


def _klasser(element_av: dict[str, set[str]]) -> list[tuple[str, str]]:
    sedda = []
    for mangd in element_av.values():
        for element in mangd:
            if '.' in element and element not in {e for e, _ in sedda}:
                sedda.append((element, element.split('.')[-1]))
    return sedda


def _element(fun: dict, skriv: dict, kanda: set[str]) -> list[str]:
    mottagare = skriv.get('mottagare') or ''
    if mottagare in {'html', 'document.documentElement', 'documentElement'}:
        return ['html']
    text = ' '.join(u['text'] for u in fun['uttryck'])
    if not kanda:
        return [_namn_fran_skript(text, mottagare)]
    traff = []
    for element in kanda:
        if element == 'html':
            continue
        klass = element.split('.')[-1]
        if re.search(r'\.' + re.escape(klass) + r'(?![\w-])', text):
            traff.append(element)
    if traff:
        return traff
    namn = _namn_fran_skript(text, mottagare)
    if namn.startswith('.'):
        return [namn]
    rest = sorted(e for e in kanda if e != 'html')
    return rest or [namn]


def _nar(fun: dict, attr: str, per: dict, sedda: set | None = None, djup: int = 0) -> bool:
    if sedda is None:
        sedda = set()
    if fun['id'] in sedda or djup > 5:
        return False
    sedda.add(fun['id'])
    if attr != '—' and any(s['attribut'] == attr and s['slag'] == 'tillstand' for s in fun['skriver']):
        return True
    for namn in fun['anrop']:
        nxt = per.get((fun['fil'], namn))
        if nxt and _nar(nxt, attr, per, sedda, djup + 1):
            return True
    return False

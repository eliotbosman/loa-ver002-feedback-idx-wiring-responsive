# BXYZ:..:eliot@bosmanxyz.xyz:..:.www.bosmanxyz.xyz
from __future__ import annotations

from html.parser import HTMLParser
from pathlib import Path

TOMMA = {'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'}
TILLSTAND = {'aria-expanded', 'aria-current', 'aria-hidden', 'hidden'}


class _Trad(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.rot: dict | None = None
        self.stack: list[dict] = []
        self.skript: list[str] = []
        self.stil: list[str] = []
        self._hoppa = 0

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        self._oppna(tag, attrs, False)

    def handle_startendtag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        self._oppna(tag, attrs, True)

    def _oppna(self, tag: str, attrs: list[tuple[str, str | None]], stangd: bool) -> None:
        if self._hoppa:
            if tag in {'script', 'style'}:
                self._hoppa += 1
            return
        attr = {k: ('' if v is None else v) for k, v in attrs}
        if tag == 'script' and attr.get('src'):
            self.skript.append(attr['src'].split('?')[0])
        if tag == 'link' and attr.get('rel') == 'stylesheet' and attr.get('href'):
            self.stil.append(attr['href'].split('?')[0])
        if tag == 'script' and not attr.get('src') and attr.get('type') != 'application/json':
            self._hoppa = 1
            return
        if tag == 'style':
            self._hoppa = 1
            return
        nod = {
            'tag': tag,
            'id': attr.get('id', ''),
            'klass': attr.get('class', '').split(),
            'tillstand': {},
            'stil': attr.get('style', ''),
            'text': '',
            'barn': [],
            'upprepning': 1,
            'rad': self.getpos()[0],
        }
        for nyckel, varde in attr.items():
            if nyckel.startswith('data-') or nyckel in TILLSTAND:
                nod['tillstand'][nyckel] = varde if varde != '' else '•'
        foralder = self.stack[-1] if self.stack else None
        if foralder is None:
            self.rot = nod
        else:
            foralder['barn'].append(nod)
        if not stangd and tag not in TOMMA:
            self.stack.append(nod)

    def handle_endtag(self, tag: str) -> None:
        if self._hoppa:
            if tag in {'script', 'style'}:
                self._hoppa -= 1
            return
        for i in range(len(self.stack) - 1, -1, -1):
            if self.stack[i]['tag'] == tag:
                del self.stack[i:]
                break

    def handle_data(self, data: str) -> None:
        if self._hoppa or not self.stack:
            return
        text = ' '.join(data.split())
        if not text:
            return
        nod = self.stack[-1]
        if nod['tag'] in {'script', 'style'}:
            return
        if len(nod['text']) < 48:
            nod['text'] = (nod['text'] + ' ' + text).strip()[:48]


def _signatur(nod: dict) -> tuple:
    barn = tuple(_signatur(b) for b in nod['barn'])
    nycklar = tuple(sorted(nod['tillstand']))
    return (nod['tag'], tuple(nod['klass']), nycklar, barn)


def _kollapsa(nod: dict) -> None:
    for barn in nod['barn']:
        _kollapsa(barn)
    nya: list[dict] = []
    for barn in nod['barn']:
        if nya and _signatur(nya[-1]) == _signatur(barn) and barn['tag'] not in {'html', 'body', 'main'}:
            nya[-1]['upprepning'] += barn['upprepning']
        else:
            nya.append(barn)
    nod['barn'] = nya


def _etikett(nod: dict, fil: str) -> str:
    klasser: set[str] = set()

    def ga(n: dict) -> None:
        klasser.update(n['klass'])
        for b in n['barn']:
            ga(b)

    ga(nod)
    if 'home' in klasser:
        return 'home'
    if 'bars' in klasser:
        return 'archive'
    if 'project' in klasser or 'projekt' in klasser:
        return 'project'
    if 'info' in klasser:
        return 'info'
    if 'falt' in klasser and 'navigator' in fil:
        return 'navigator'
    if 'pill' in klasser and fil.startswith('dev/'):
        return 'pill lab'
    return Path(fil).stem


def _samla(nod: dict, fil: str, ut: list[dict], element: str | None = None) -> None:
    if nod['tag'] in {'html', 'body'}:
        egen = nod['tag']
    else:
        egen = nod['tag'] + ('.' + '.'.join(nod['klass']) if nod['klass'] else '')
    for namn, varde in nod['tillstand'].items():
        ut.append({'fil': fil, 'element': egen, 'attribut': namn, 'varde': varde, 'rad': nod['rad']})
    if nod['stil']:
        ut.append({'fil': fil, 'element': egen, 'attribut': 'style', 'varde': nod['stil'][:180], 'rad': nod['rad']})
    for barn in nod['barn']:
        _samla(barn, fil, ut)


def las(vag: Path, rot: Path, roll: str) -> dict:
    parser = _Trad()
    parser.feed(vag.read_text(encoding='utf-8', errors='replace'))
    trad = parser.rot or {'tag': 'html', 'id': '', 'klass': [], 'tillstand': {}, 'stil': '', 'text': '', 'barn': [], 'upprepning': 1, 'rad': 1}
    rel = vag.relative_to(rot).as_posix()
    poster: list[dict] = []
    _samla(trad, rel, poster)
    _kollapsa(trad)
    return {
        'fil': rel,
        'roll': roll,
        'trad': trad,
        'signatur': str(_signatur(trad)),
        'skript': [_los(vag, rot, s) for s in parser.skript],
        'stil': [_los(vag, rot, s) for s in parser.stil],
        'poster': poster,
    }


def _los(html: Path, rot: Path, src: str) -> str:
    if src.startswith('http://') or src.startswith('https://') or src.startswith('//'):
        return src
    mal = (html.parent / src).resolve()
    try:
        return mal.relative_to(rot.resolve()).as_posix()
    except ValueError:
        return src


def grupper(sidor: list[dict]) -> list[dict]:
    hann: dict[str, dict] = {}
    for sida in sidor:
        grupp = hann.get(sida['signatur'])
        if grupp is None:
            grupp = {
                'id': '',
                'etikett': _etikett(sida['trad'], sida['fil']),
                'roll': sida['roll'],
                'filer': [],
                'trad': sida['trad'],
            }
            hann[sida['signatur']] = grupp
        grupp['filer'].append(sida['fil'])
    ut = list(hann.values())
    ut.sort(key=lambda g: (0 if g['roll'] == 'sajt' else 1, g['etikett']))
    sedda: dict[str, int] = {}
    for grupp in ut:
        bas = grupp['etikett']
        sedda[bas] = sedda.get(bas, 0) + 1
        grupp['id'] = bas if sedda[bas] == 1 else f'{bas}-{sedda[bas]}'
    return ut

# BXYZ:..:eliot@bosmanxyz.xyz:..:.www.bosmanxyz.xyz
from __future__ import annotations

import json
from pathlib import Path

MALL = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>loa — am / cm map</title>
<link rel="stylesheet" href="../vy.css?v=2">
</head>
<body>
<header class="topp">
  <p class="marke">loa <span>am / cm</span></p>
  <nav>
    <button type="button" data-vy="funktioner" aria-pressed="true">functions</button>
    <button type="button" data-vy="dom">dom</button>
    <button type="button" data-vy="tillstand">state map</button>
    <button type="button" data-vy="fynd">findings</button>
  </nav>
  <label>filter <input id="filter" type="search" placeholder="name, state, file"></label>
  <label class="kryss"><input id="alla" type="checkbox"> all expressions</label>
  <label class="kryss"><input id="verktyg" type="checkbox"> dev tools</label>
  <label>page <select id="sida"></select></label>
  <p id="summa"></p>
</header>
<p class="led" id="led">element → state → interaction → style</p>
<div class="yta">
  <div class="scen">
    <svg id="karta" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="review map"></svg>
    <div id="fynd" hidden></div>
  </div>
  <aside id="detalj"><p class="tom">Select a function, a node, or a state.</p></aside>
</div>
<script id="modell" type="application/json">__JSON__</script>
<script src="../vy.js?v=2"></script>
</body>
</html>
"""


def skriv(rot: Path, modell: dict, fynd: list[dict], regler: list[dict], tradar: list[dict]) -> Path:
    ut = rot / 'dev' / 'review' / 'ut'
    ut.mkdir(parents=True, exist_ok=True)
    paket = {
        'funktioner': modell['funktioner'],
        'dom': modell['dom'],
        'tillstand': modell['tillstand'],
        'fynd': fynd,
        'regler': regler,
        'tradar': tradar,
        'arbete': _arbete(fynd),
        'antal': {
            'sidor': len(modell['sidor']),
            'funktioner': len(modell['funktioner']),
            'uttryck': sum(len(f['uttryck']) for f in modell['funktioner']),
            'tillstand': len(modell['tillstand']),
            'fynd': len([f for f in fynd if f['allvar'] != 'ok']),
        },
    }
    radata = json.dumps(paket, ensure_ascii=False).replace('<', '\\u003c')
    (ut / 'modell.json').write_text(radata, encoding='utf-8')
    (ut / 'index.html').write_text(MALL.replace('__JSON__', radata), encoding='utf-8')
    (ut / 'rapport.md').write_text(_rapport(modell, fynd, regler, tradar), encoding='utf-8')
    return ut


def _arbete(fynd: list[dict]) -> list[str]:
    ordning = {'broken': 0, 'violation': 1, 'dead': 2, 'note': 3}
    risk = {'lag': 0, 'medel': 1, 'hog': 2}
    valda = [f for f in fynd if f['roll'] == 'sajt' and f['allvar'] in ordning]
    valda.sort(key=lambda f: (risk[f['risk']], ordning[f['allvar']], f['regel']))
    rader = []
    for post in valda:
        if len(rader) >= 12:
            break
        rad = post['rader'][0] if post['rader'] else post['rad']
        rader.append(f"{post['regel']} {post['allvar']} — {post['fil']}:{rad} — {post['atgard']}")
    return rader


def _rapport(modell: dict, fynd: list[dict], regler: list[dict], tradar: list[dict]) -> str:
    sajt = [f for f in fynd if f['roll'] == 'sajt' and f['allvar'] != 'ok']
    verktyg = [f for f in fynd if f['roll'] != 'sajt' and f['allvar'] != 'ok']
    html_n = len([s for s in modell['sidor'] if s['roll'] == 'sajt'])
    css_n = len([c for c in modell['css'] if c['roll'] == 'sajt'])
    js_n = len([j for j in modell['js_filer'] if j['roll'] == 'sajt'])
    rader = [
        '# AM / CM review — loa',
        '',
        'Scope: site HTML, CSS, and JS. `js/lenis.min.js` is vendor and was not parsed. Dev tools are listed apart from the site verdict.',
        f'Site files: {html_n} html, {css_n} css, {js_n} js. Functions: {len(modell["funktioner"])}. State rows: {len(modell["tillstand"])}.',
        '',
        '## Findings',
        '',
        '| file | rule | severity | finding | minimal fix |',
        '|---|---|---|---|---|',
    ]
    for post in sajt:
        rader.append('| ' + ' | '.join([
            _cell(post['fil'] + _rader(post)),
            post['regel'],
            post['allvar'],
            _cell(post['fynd']),
            _cell(post['atgard']),
        ]) + ' |')
    rader += ['', '## Per-rule compliance', '', '| rule | status | why |', '|---|---|---|']
    for regel in regler:
        rader.append(f"| {regel['id']} | {regel['lage']} | {_cell(regel['skal'])} |")
    rader += ['', '## Interlink', '']
    if tradar:
        for post in tradar:
            rader.append(f"- {post['text']}")
    else:
        rader.append('- No broken wires between markup actions and script.')
    rader += ['', '## Prioritized work order', '']
    for rad in _arbete(fynd):
        rader.append(f'- {rad}')
    if verktyg:
        rader += ['', '## Dev tools (not in the site verdict)', '']
        for post in verktyg:
            rader.append(f"- {post['regel']} {post['allvar']} {post['fil']}: {post['fynd']}")
    rader += [
        '',
        'Open `dev/review/ut/index.html` for the function graph, the DOM tree, and the state map.',
        'Regenerate with `python3 dev/review/granska.py`.',
        '',
    ]
    return '\n'.join(rader)


def _rader(post: dict) -> str:
    rader = post.get('rader') or []
    if not rader:
        return ''
    visade = ', '.join(str(r) for r in rader[:8])
    extra = f' +{len(rader) - 8}' if len(rader) > 8 else ''
    return f':{visade}{extra}'


def _cell(text: str) -> str:
    return text.replace('|', '/').replace('\n', ' ')

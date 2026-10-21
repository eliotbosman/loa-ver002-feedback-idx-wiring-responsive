# BXYZ:..:eliot@bosmanxyz.xyz:..:.www.bosmanxyz.xyz
from __future__ import annotations

import re
from pathlib import Path

LAGER_NAMN = re.compile(r'@layer\s+([A-Za-z_][\w-]*)')
LAGER_ORDNING = re.compile(r'@layer\s+([^;{]+);')
ATTR = re.compile(
    r'\[(data-[\w-]+|aria-[\w-]+)(?:[~|^$*]?=(?:"([^"]*)"|\'([^\']*)\'|([^\s\]]+)))?\]'
)


def las(vag: Path, rot: Path, roll: str) -> dict:
    text = vag.read_text(encoding='utf-8', errors='replace')
    regler: list[dict] = []
    ordning: list[str] = []
    _parse(text, [], [], 1, regler, ordning)
    return {
        'fil': vag.relative_to(rot).as_posix(),
        'roll': roll,
        'regler': regler,
        'lager_ordning': ordning,
        'har_lager': bool(ordning) or any(r['lager'] for r in regler),
        'har_container': '@container' in text,
        'important': sum(1 for r in regler for d in r['deklarationer'] if d['viktig']),
    }


def _parse(text: str, lager: list[str], media: list[str], rad0: int, regler: list[dict], ordning: list[str]) -> None:
    n = len(text)
    i = 0
    while i < n:
        i = _hoppa(text, i)
        if i >= n:
            break
        if text[i] == '}':
            i += 1
            continue
        rad = rad0 + text[:i].count('\n')
        kind, data, i = _nasta(text, i)
        if kind == 'tom':
            break
        if kind == 'stmt':
            traff = LAGER_ORDNING.search(data)
            if traff and '{' not in data:
                ordning.extend(d.strip() for d in traff.group(1).split(',') if d.strip())
            continue
        pre, body, body_ix = data
        body_rad = rad0 + text[:body_ix].count('\n')
        if pre.startswith('@layer'):
            namn = LAGER_NAMN.match(pre)
            if namn and '{' in body:
                _parse(body, lager + [namn.group(1)], media, body_rad, regler, ordning)
                continue
        if pre.startswith('@media'):
            _parse(body, lager, media + [pre], body_rad, regler, ordning)
            continue
        if pre.startswith('@supports'):
            _parse(body, lager, media, body_rad, regler, ordning)
            continue
        if pre.startswith('@container'):
            _parse(body, lager, media + [pre], body_rad, regler, ordning)
            continue
        if not pre or pre.startswith('@'):
            if pre.startswith('@') and ':' in body and '{' not in body:
                regler.append(_regel(pre, body, lager, media, rad))
            continue
        regler.append(_regel(pre, body, lager, media, rad))


def _regel(selektor: str, body: str, lager: list[str], media: list[str], rad: int) -> dict:
    return {
        'rad': rad,
        'lager': lager[-1] if lager else '',
        'media': ' '.join(media),
        'selektor': ' '.join(selektor.split()),
        'deklarationer': _deklarationer(body),
    }


def _deklarationer(body: str) -> list[dict]:
    ut: list[dict] = []
    for bit in _dela(body, ';'):
        if ':' not in bit:
            continue
        prop, _, val = bit.partition(':')
        prop = prop.strip()
        val = ' '.join(val.strip().split())
        if not prop or prop.startswith('@'):
            continue
        viktig = '!important' in val
        if viktig:
            val = ' '.join(val.replace('!important', '').split())
        ut.append({'prop': prop, 'varde': val, 'viktig': viktig})
    return ut


def _dela(text: str, tecken: str) -> list[str]:
    ut: list[str] = []
    i = 0
    start = 0
    n = len(text)
    djup = 0
    while i < n:
        c = text[i]
        if c in '"\'':
            i = _slut_strang(text, i)
            continue
        if text.startswith('/*', i):
            j = text.find('*/', i + 2)
            i = n if j < 0 else j + 2
            continue
        if c in '({[':
            djup += 1
        elif c in ')}]':
            djup = max(0, djup - 1)
        elif c == tecken and djup == 0:
            ut.append(text[start:i])
            start = i + 1
        i += 1
    if start < n:
        ut.append(text[start:])
    return ut


def _nasta(text: str, i: int) -> tuple[str, object, int]:
    n = len(text)
    start = i
    djup = 0
    while i < n:
        c = text[i]
        if c in '"\'':
            i = _slut_strang(text, i)
            continue
        if text.startswith('/*', i):
            j = text.find('*/', i + 2)
            i = n if j < 0 else j + 2
            continue
        if c == '(':
            djup += 1
        elif c == ')':
            djup = max(0, djup - 1)
        elif c == ';' and djup == 0:
            return 'stmt', text[start:i + 1], i + 1
        elif c == '{' and djup == 0:
            body, efter, body_ix = _block(text, i)
            return 'block', (text[start:i].strip(), body, body_ix), efter
        i += 1
    rest = text[start:].strip()
    if rest:
        return 'stmt', text[start:], n
    return 'tom', '', n


def _block(text: str, i: int) -> tuple[str, int, int]:
    n = len(text)
    djup = 0
    j = i
    while j < n:
        c = text[j]
        if c in '"\'':
            j = _slut_strang(text, j)
            continue
        if text.startswith('/*', j):
            k = text.find('*/', j + 2)
            j = n if k < 0 else k + 2
            continue
        if c == '{':
            djup += 1
        elif c == '}':
            djup -= 1
            if djup == 0:
                return text[i + 1:j], j + 1, i + 1
        j += 1
    return text[i + 1:], n, i + 1


def _hoppa(text: str, i: int) -> int:
    n = len(text)
    while i < n:
        if text[i] in ' \t\r\n':
            i += 1
        elif text.startswith('/*', i):
            j = text.find('*/', i + 2)
            i = n if j < 0 else j + 2
        else:
            break
    return i


def _slut_strang(text: str, i: int) -> int:
    citat = text[i]
    j = i + 1
    n = len(text)
    while j < n:
        if text[j] == '\\':
            j += 2
            continue
        if text[j] == citat:
            return j + 1
        j += 1
    return n


def attribut(selektor: str) -> list[tuple[str, str | None]]:
    ut: list[tuple[str, str | None]] = []
    for traff in ATTR.finditer(selektor):
        varde = traff.group(2) or traff.group(3) or traff.group(4)
        ut.append((traff.group(1), varde))
    return ut

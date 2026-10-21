# BXYZ:..:eliot@bosmanxyz.xyz:..:.www.bosmanxyz.xyz
from __future__ import annotations

import re
from dataclasses import dataclass, field

NYCKEL = {
    'break', 'case', 'catch', 'class', 'const', 'continue', 'debugger', 'default',
    'delete', 'do', 'else', 'export', 'extends', 'finally', 'for', 'function',
    'if', 'import', 'in', 'instanceof', 'let', 'new', 'return', 'super', 'switch',
    'this', 'throw', 'try', 'typeof', 'var', 'void', 'while', 'with', 'yield',
    'async', 'await', 'of', 'static',
}

OP3 = ('===', '!==', '**=', '>>=', '<<=', '>>>', '...')
OP2 = ('==', '!=', '<=', '>=', '=>', '&&', '||', '??', '?.', '++', '--', '+=', '-=', '*=', '/=', '%=', '&=', '|=', '^=', '>>', '<<')


@dataclass
class Tok:
    slag: str
    text: str
    rad: int
    ix: int = 0


@dataclass
class Funk:
    namn: str
    fil: str
    roll: str
    rad: int
    parametrar: str
    start: int
    slut: int
    body_start: int
    body_slut: int
    uttryck: list = field(default_factory=list)
    anrop: list = field(default_factory=list)
    referenser: list = field(default_factory=list)
    lyssnare: list = field(default_factory=list)
    skriver: list = field(default_factory=list)
    tom: bool = False
    ra_anrop: list = field(default_factory=list)
    ra_ref: list = field(default_factory=list)


def tokenisera(kalla: str) -> list[Tok]:
    s = kalla
    n = len(s)
    i = 0
    rad = 1
    ut: list[Tok] = []
    fore: Tok | None = None

    def lagg(slag: str, text: str, rad0: int) -> None:
        nonlocal fore
        tok = Tok(slag, text, rad0)
        ut.append(tok)
        fore = tok

    while i < n:
        c = s[i]
        if c == '\n':
            rad += 1
            i += 1
            continue
        if c in ' \t\r':
            i += 1
            continue
        if c == '/' and i + 1 < n and s[i + 1] == '/':
            while i < n and s[i] != '\n':
                i += 1
            continue
        if c == '/' and i + 1 < n and s[i + 1] == '*':
            i += 2
            while i + 1 < n and not (s[i] == '*' and s[i + 1] == '/'):
                if s[i] == '\n':
                    rad += 1
                i += 1
            i = min(n, i + 2)
            continue
        if c in '"\'':
            text, i, rad = _strang(s, i, rad, c)
            lagg('strang', text, rad)
            continue
        if c == '`':
            text, i, rad = _mall(s, i, rad)
            lagg('mall', text, rad)
            continue
        if c == '/' and _ar_regex(fore) and not (i + 1 < n and s[i + 1] == '='):
            traff = _regex(s, i, rad)
            if traff:
                text, i, rad = traff
                lagg('regex', text, rad)
                continue
        if c.isdigit() or (c == '.' and i + 1 < n and s[i + 1].isdigit()):
            j = i + 1
            while j < n and (s[j].isdigit() or s[j] in '.eE'):
                if s[j] in 'eE' and j + 1 < n and s[j + 1] in '+-':
                    j += 1
                j += 1
            lagg('tal', s[i:j], rad)
            i = j
            continue
        if c.isalpha() or c in '_$':
            j = i + 1
            while j < n and (s[j].isalnum() or s[j] in '_$'):
                j += 1
            lagg('ident', s[i:j], rad)
            i = j
            continue
        for op in OP3:
            if s.startswith(op, i):
                lagg('punkt', op, rad)
                i += len(op)
                break
        else:
            for op in OP2:
                if s.startswith(op, i):
                    lagg('punkt', op, rad)
                    i += len(op)
                    break
            else:
                lagg('punkt', c, rad)
                i += 1
    for ix, tok in enumerate(ut):
        tok.ix = ix
    return ut


def _ar_regex(fore: Tok | None) -> bool:
    if fore is None:
        return True
    if fore.slag in {'ident', 'tal', 'strang', 'regex', 'mall'}:
        return False
    if fore.text in {')', ']', '++', '--'}:
        return False
    return True


def _strang(s: str, i: int, rad: int, citat: str) -> tuple[str, int, int]:
    n = len(s)
    j = i + 1
    while j < n:
        if s[j] == '\\':
            j += 2
            continue
        if s[j] == '\n':
            rad += 1
        if s[j] == citat:
            return s[i:j + 1], j + 1, rad
        j += 1
    return s[i:], n, rad


def _mall(s: str, i: int, rad: int) -> tuple[str, int, int]:
    n = len(s)
    j = i + 1
    while j < n:
        if s[j] == '\\':
            j += 2
            continue
        if s[j] == '\n':
            rad += 1
        if s[j] == '`':
            return s[i:j + 1], j + 1, rad
        if s[j] == '$' and j + 1 < n and s[j + 1] == '{':
            j += 2
            djup = 1
            while j < n and djup:
                if s[j] == '\n':
                    rad += 1
                if s[j] == '{':
                    djup += 1
                elif s[j] == '}':
                    djup -= 1
                elif s[j] in '"\'':
                    _, j, rad = _strang(s, j, rad, s[j])
                    continue
                j += 1
            continue
        j += 1
    return s[i:], n, rad


def _regex(s: str, i: int, rad: int) -> tuple[str, int, int] | None:
    n = len(s)
    j = i + 1
    klass = False
    while j < n:
        if s[j] == '\\':
            j += 2
            continue
        if s[j] == '\n':
            return None
        if s[j] == '[':
            klass = True
        elif s[j] == ']':
            klass = False
        elif s[j] == '/' and not klass:
            j += 1
            while j < n and s[j] in 'gimsuy':
                j += 1
            return s[i:j], j, rad
        j += 1
    return None


def _match(tokens: list[Tok], i: int, oppna: str, stang: str, steg: int) -> int | None:
    djup = 0
    k = i
    while 0 <= k < len(tokens):
        if tokens[k].text == oppna:
            djup += 1
        elif tokens[k].text == stang:
            djup -= 1
            if djup == 0:
                return k
        k += steg
    return None


def _tilldelning(tokens: list[Tok], i: int) -> tuple[str, int] | None:
    k = i - 1
    if k >= 0 and tokens[k].text == 'async':
        k -= 1
    if k < 0 or tokens[k].text != '=':
        return None
    k -= 1
    delar: list[str] = []
    while k >= 0 and tokens[k].slag == 'ident' and tokens[k].text not in NYCKEL:
        delar.append(tokens[k].text)
        if k >= 1 and tokens[k - 1].text == '.':
            delar.append('.')
            k -= 2
            continue
        k -= 1
        break
    if not delar or delar[0] == '.' or delar[-1] == '.':
        return None
    return ''.join(reversed(delar)), k + 1


def _callback(tokens: list[Tok], i: int) -> str | None:
    if i < 2 or tokens[i - 1].text != '(':
        return None
    namn = tokens[i - 2]
    if namn.slag == 'ident' and namn.text not in NYCKEL:
        return f'{namn.text}@{tokens[i].rad}'
    return None


def _param_text(tokens: list[Tok]) -> str:
    if not tokens:
        return ''
    return _text(tokens)[:160]


def _text(tokens: list[Tok]) -> str:
    delar: list[str] = []
    langd = 0
    for tok in tokens:
        bit = tok.text
        if delar:
            fore = delar[-1]
            tätt = bit[:1] in '.,;:)]}' or fore[-1:] in '([{.' or bit.startswith('«') or fore.endswith('«')
            if not tätt:
                delar.append(' ')
                langd += 1
        delar.append(bit)
        langd += len(bit)
        if langd > 2000:
            delar.append(' …')
            break
    return ''.join(delar)


def _koncis_slut(tokens: list[Tok], i: int) -> int:
    dm = dp = dk = 0
    k = i
    while k < len(tokens):
        t = tokens[k].text
        if t == '{':
            dm += 1
        elif t == '}':
            if dm == 0:
                break
            dm -= 1
        elif t == '(':
            dp += 1
        elif t == ')':
            if dp == 0 and dm == 0:
                break
            dp -= 1
        elif t == '[':
            dk += 1
        elif t == ']':
            if dk == 0 and dm == 0 and dp == 0:
                break
            dk -= 1
        elif t in {';', ','} and dm == dp == dk == 0:
            break
        k += 1
    return k


def _las_funktion(tokens: list[Tok], i: int) -> Funk | None:
    if i > 0 and tokens[i - 1].text == '.':
        return None
    j = i + 1
    namn = None
    if j < len(tokens) and tokens[j].slag == 'ident':
        namn = tokens[j].text
        j += 1
    if j >= len(tokens) or tokens[j].text != '(':
        return None
    ps = _match(tokens, j, '(', ')', 1)
    if ps is None or ps + 1 >= len(tokens) or tokens[ps + 1].text != '{':
        return None
    bs = _match(tokens, ps + 1, '{', '}', 1)
    if bs is None:
        return None
    start = i
    if namn is None:
        till = _tilldelning(tokens, i)
        cb = _callback(tokens, i)
        if till:
            namn, start = till
        else:
            namn = cb or f'anonym@{tokens[i].rad}'
    return Funk(
        namn=namn,
        fil='',
        roll='',
        rad=tokens[start].rad,
        parametrar=_param_text(tokens[j + 1:ps]),
        start=start,
        slut=bs + 1,
        body_start=ps + 2,
        body_slut=bs,
    )


def _las_pil(tokens: list[Tok], i: int) -> Funk | None:
    if i < 1:
        return None
    if tokens[i - 1].text == ')':
        p = _match(tokens, i - 1, ')', '(', -1)
        if p is None:
            return None
        param = tokens[p + 1:i - 1]
        start = p
    elif tokens[i - 1].slag == 'ident' and tokens[i - 1].text not in NYCKEL:
        param = [tokens[i - 1]]
        start = i - 1
        p = i - 1
    else:
        return None
    till = _tilldelning(tokens, p if tokens[i - 1].text == ')' else i - 1)
    if till:
        namn, start = till
    else:
        namn = f'anonym@{tokens[i].rad}'
    if i + 1 < len(tokens) and tokens[i + 1].text == '{':
        bs = _match(tokens, i + 1, '{', '}', 1)
        if bs is None:
            return None
        body_start, body_slut, slut = i + 2, bs, bs + 1
    else:
        body_start = i + 1
        body_slut = _koncis_slut(tokens, i + 1)
        slut = body_slut
    return Funk(
        namn=namn,
        fil='',
        roll='',
        rad=tokens[start].rad,
        parametrar=_param_text(param),
        start=start,
        slut=slut,
        body_start=body_start,
        body_slut=body_slut,
    )


def _las_metod(tokens: list[Tok], i: int) -> Funk | None:
    tok = tokens[i]
    if tok.slag != 'ident' or tok.text in NYCKEL:
        return None
    if i > 0 and tokens[i - 1].text in {'.', 'function'}:
        return None
    if i + 1 >= len(tokens) or tokens[i + 1].text != '(':
        return None
    ps = _match(tokens, i + 1, '(', ')', 1)
    if ps is None or ps + 1 >= len(tokens):
        return None
    if tokens[ps + 1].text == '=>':
        return None
    if tokens[ps + 1].text != '{':
        return None
    bs = _match(tokens, ps + 1, '{', '}', 1)
    if bs is None:
        return None
    return Funk(
        namn=tok.text,
        fil='',
        roll='',
        rad=tok.rad,
        parametrar=_param_text(tokens[i + 2:ps]),
        start=i,
        slut=bs + 1,
        body_start=ps + 2,
        body_slut=bs,
    )


def _platta(tokens: list[Tok], start: int, slut: int, inre: list[Funk]) -> list[Tok]:
    inre = sorted(inre, key=lambda f: f.start)
    ut: list[Tok] = []
    i = start
    for fun in inre:
        if fun.start < i or fun.slut > slut:
            continue
        ut.extend(tokens[i:fun.start])
        ut.append(Tok('ident', f'«{fun.namn}»', tokens[fun.start].rad))
        i = fun.slut
    ut.extend(tokens[i:slut])
    return ut


def _satser(tokens: list[Tok]) -> list[list[Tok]]:
    dp = dk = 0
    start = 0
    rå: list[list[Tok]] = []
    for i, tok in enumerate(tokens):
        t = tok.text
        if t == '(':
            dp += 1
        elif t == ')':
            dp = max(0, dp - 1)
        elif t == '[':
            dk += 1
        elif t == ']':
            dk = max(0, dk - 1)
        if dp == dk == 0 and t == ';':
            rå.append(tokens[start:i + 1])
            start = i + 1
    if start < len(tokens):
        rest = [t for t in tokens[start:] if t.text not in {';', ',', '{', '}'}]
        if rest:
            rå.append(tokens[start:])
    ut: list[list[Tok]] = []
    for sats in rå:
        if not any(t.text not in {'{', '}', ';'} for t in sats):
            continue
        if ut and sats and sats[0].text == 'else':
            ut[-1].extend(sats)
        else:
            ut.append(sats)
    return ut


def _callback_arg(tokens: list[Tok], i: int) -> str:
    djup = 0
    komma = False
    k = i + 1
    while k < len(tokens):
        t = tokens[k]
        if t.text == '(':
            djup += 1
        elif t.text == ')':
            djup -= 1
            if djup <= 0:
                break
        elif t.text == ',' and djup == 1:
            komma = True
        elif komma and djup == 1 and t.slag == 'ident':
            return t.text[1:-1] if t.text.startswith('«') and t.text.endswith('»') else t.text
        k += 1
    return ''


def _kedja(tokens: list[Tok], i: int) -> str:
    k = i - 1
    delar: list[str] = []
    while k >= 1 and tokens[k].text == '.' and tokens[k - 1].slag == 'ident':
        delar.append(tokens[k - 1].text)
        k -= 2
    return '.'.join(reversed(delar))


def _delete_fore(tokens: list[Tok], i: int) -> bool:
    k = i
    while k > 0 and tokens[k - 1].text == '.':
        k -= 2
    return k > 0 and tokens[k - 1].text == 'delete'


def _strangar(tokens: list[Tok], i: int) -> list[str]:
    djup = 0
    ut: list[str] = []
    k = i + 1
    while k < len(tokens):
        t = tokens[k]
        if t.text in '({[':
            djup += 1
        elif t.text in ')}]':
            if djup == 0:
                break
            djup -= 1
        elif t.text in {';', ','} and djup == 0:
            break
        elif t.slag == 'strang':
            ut.append(_avkoda(t.text))
        k += 1
    return ut


def _avkoda(text: str) -> str:
    if len(text) >= 2 and text[0] == text[-1] and text[0] in '"\'':
        return text[1:-1]
    return text


def _till_data(nyckel: str) -> str:
    delar: list[str] = []
    for i, c in enumerate(nyckel):
        if c.isupper() and i:
            delar.append('-')
        delar.append(c.lower())
    return 'data-' + ''.join(delar)


def _effekt(tokens: list[Tok]) -> tuple[list, list, list, list]:
    skriver: list[dict] = []
    lyssnare: list[dict] = []
    anrop: list[str] = []
    referenser: list[str] = []
    i = 0
    while i < len(tokens):
        tok = tokens[i]
        if tok.slag == 'ident' and not tok.text.startswith('«'):
            nasta = tokens[i + 1].text if i + 1 < len(tokens) else ''
            if nasta == '(' and tok.text not in NYCKEL:
                anrop.append(tok.text)
            elif nasta != '(' and tok.text not in NYCKEL and tok.text not in {'true', 'false', 'null', 'undefined'}:
                if i == 0 or tokens[i - 1].text != '.':
                    referenser.append(tok.text)
            if tok.text == 'addEventListener' and nasta == '(':
                handelse = ''
                for s in _strangar(tokens, i + 1):
                    handelse = s
                    break
                if handelse:
                    lyssnare.append({
                        'mal': _kedja(tokens, i) or 'okand',
                        'handelse': handelse,
                        'rad': tok.rad,
                        'callback': _callback_arg(tokens, i),
                    })
            if tok.text in {'setAttribute', 'removeAttribute', 'toggleAttribute'} and nasta == '(':
                strangar = _strangar(tokens, i + 1)
                if strangar and (strangar[0].startswith('data-') or strangar[0].startswith('aria-')):
                    if tok.text == 'removeAttribute':
                        varde = 'bort'
                    elif tok.text == 'toggleAttribute':
                        varde = 'vaxlar'
                    elif len(strangar) > 1 and strangar[1] == '':
                        varde = '•'
                    elif len(strangar) > 1:
                        varde = strangar[1]
                    else:
                        varde = '*'
                    skriver.append({'attribut': strangar[0], 'varde': varde, 'rad': tok.rad, 'slag': 'tillstand', 'mottagare': _kedja(tokens, i)})
            if tok.text == 'dataset' and i > 0 and tokens[i - 1].text == '.':
                if i + 2 < len(tokens) and tokens[i + 1].text == '.' and tokens[i + 2].slag == 'ident':
                    efter = tokens[i + 3].text if i + 3 < len(tokens) else ''
                    raderar = _delete_fore(tokens, i)
                    if efter == '=' or raderar:
                        varden = ['bort'] if raderar else (_strangar(tokens, i + 3) or ['*'])
                        for varde in varden:
                            skriver.append({
                                'attribut': _till_data(tokens[i + 2].text),
                                'varde': varde,
                                'rad': tok.rad,
                                'slag': 'tillstand',
                                'mottagare': _kedja(tokens, i),
                            })
            if tok.text == 'style' and i > 0 and tokens[i - 1].text == '.':
                _stil(tokens, i, skriver)
            if tok.text == 'classList' and i + 2 < len(tokens) and tokens[i + 1].text == '.' and tokens[i + 2].text in {'add', 'remove', 'toggle'}:
                namn = _strangar(tokens, i + 2)
                skriver.append({
                    'attribut': 'class',
                    'varde': namn[0] if namn else '*',
                    'rad': tok.rad,
                    'slag': 'klass',
                    'mottagare': _kedja(tokens, i),
                })
        i += 1
    return skriver, lyssnare, anrop, referenser


def _stil(tokens: list[Tok], i: int, skriver: list[dict]) -> None:
    if i + 1 >= len(tokens) or tokens[i + 1].text != '.':
        return
    if i + 2 >= len(tokens):
        return
    namn = tokens[i + 2]
    mottagare = _kedja(tokens, i)
    if namn.text == 'setProperty' and i + 3 < len(tokens) and tokens[i + 3].text == '(':
        strangar = _strangar(tokens, i + 3)
        prop = strangar[0] if strangar else '*'
        varde = strangar[1] if len(strangar) > 1 else '*'
        slag = 'variabel' if prop.startswith('--') else 'stil'
        skriver.append({'attribut': prop, 'varde': varde, 'rad': namn.rad, 'slag': slag, 'mottagare': mottagare})
        return
    if namn.text == 'removeProperty':
        strangar = _strangar(tokens, i + 3) if i + 3 < len(tokens) else []
        prop = strangar[0] if strangar else '*'
        skriver.append({'attribut': prop, 'varde': 'bort', 'rad': namn.rad, 'slag': 'variabel' if prop.startswith('--') else 'stil', 'mottagare': mottagare})
        return
    if namn.slag == 'ident' and i + 3 < len(tokens) and tokens[i + 3].text == '=':
        strangar = _strangar(tokens, i + 3)
        varde = strangar[0] if strangar else '*'
        slag = 'stil'
        if namn.text == 'cssText' and 'position:absolute' in varde and 'visibility:hidden' in varde:
            slag = 'prob'
        skriver.append({'attribut': namn.text, 'varde': varde, 'rad': namn.rad, 'slag': slag, 'mottagare': mottagare})


def analysera(kalla: str, fil: str, roll: str) -> list[dict]:
    tokens = tokenisera(kalla)
    funs: list[Funk] = []
    sedda: set[int] = set()
    for i, tok in enumerate(tokens):
        fun = None
        if tok.text == 'function':
            fun = _las_funktion(tokens, i)
        elif tok.text == '=>':
            fun = _las_pil(tokens, i)
        elif tok.slag == 'ident':
            fun = _las_metod(tokens, i)
        if fun and fun.start not in sedda:
            fun.fil = fil
            fun.roll = roll
            sedda.add(fun.start)
            funs.append(fun)
    if funs:
        rot = max(funs, key=lambda f: f.slut - f.start)
        if rot.namn.startswith('anonym@') and rot.rad <= 8:
            rot.namn = 'rot'
    for fun in funs:
        inre = [g for g in funs if g is not fun and fun.body_start <= g.start and g.slut <= fun.body_slut]
        platta = _platta(tokens, fun.body_start, fun.body_slut, inre)
        satser = _satser(platta)
        for sats in satser:
            skriver, lyssnare, anrop, referenser = _effekt(sats)
            fun.uttryck.append({
                'rad': sats[0].rad,
                'text': _text(sats),
                'anrop': anrop,
                'skriver': skriver,
            })
            fun.lyssnare.extend(lyssnare)
            fun.skriver.extend(skriver)
            fun.ra_anrop.extend(anrop)
            fun.ra_ref.extend(referenser)
        fun.tom = not any(s['text'].strip(' ;{}') for s in fun.uttryck)
    _koppla(funs)
    return [_dict(f) for f in funs]


def _koppla(funs: list[Funk]) -> None:
    per: dict[str, list[Funk]] = {}
    for fun in funs:
        per.setdefault(fun.fil, []).append(fun)
    for fun in funs:
        syskon = per[fun.fil]

        def los(namn: str) -> str | None:
            exakt = [g for g in syskon if g.namn == namn and g is not fun]
            if len(exakt) == 1:
                return exakt[0].namn
            seg = [g for g in syskon if g.namn.split('.')[-1] == namn and g is not fun]
            if len(seg) == 1:
                return seg[0].namn
            return None

        anrop: list[str] = []
        for namn in fun.ra_anrop:
            mal = los(namn)
            if mal and mal not in anrop:
                anrop.append(mal)
        ref: list[str] = []
        for namn in fun.ra_ref:
            mal = los(namn)
            if mal and mal not in anrop and mal not in ref:
                ref.append(mal)
        fun.anrop = anrop
        fun.referenser = ref


def _id(fun: Funk, tagna: set[str]) -> str:
    bas = f'{fun.fil}:{fun.namn}:{fun.rad}'
    if bas not in tagna:
        tagna.add(bas)
        return bas
    alt = f'{bas}:{fun.start}'
    tagna.add(alt)
    return alt


def _dict(fun: Funk) -> dict:
    return {
        'namn': fun.namn,
        'fil': fun.fil,
        'roll': fun.roll,
        'rad': fun.rad,
        'parametrar': fun.parametrar,
        'uttryck': fun.uttryck,
        'anrop': fun.anrop,
        'referenser': fun.referenser,
        'lyssnare': fun.lyssnare,
        'skriver': fun.skriver,
        'tom': fun.tom,
    }


def med_id(poster: list[dict]) -> list[dict]:
    tagna: set[str] = set()
    for post in poster:
        bas = f"{post['fil']}:{post['namn']}:{post['rad']}"
        if bas in tagna:
            bas = f"{bas}:{len(tagna)}"
        tagna.add(bas)
        post['id'] = bas
    return poster


def alltid_falsk(fun: dict) -> bool:
    satser = [re.sub(r'\s+', ' ', s['text']).strip(' ;') for s in fun['uttryck']]
    satser = [s for s in satser if s and not s.startswith('«')]
    return satser == ['return false']

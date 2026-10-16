import json, sys, re, html
sys.stdout.reconfigure(encoding='utf-8')
bcd = json.load(open(sys.argv[1], encoding='utf-8'))
wf = json.load(open(sys.argv[2], encoding='utf-8'))['features']
ciu = json.load(open(sys.argv[3], encoding='utf-8'))
probe = {}
for f, label in [(sys.argv[4], 'chromium147'), (sys.argv[5], 'chrome155'), (sys.argv[6], 'chrome155exp')]:
    t = open(f, encoding='utf-8').read()
    m = re.search(r'PROBE_JSON=(.*?)</pre>', t, re.S)
    probe[label] = {r['id']: r for r in json.loads(html.unescape(m.group(1)))['results']}

F = [  # name, web-features id, BCD key, probe id
    ("random()", "random-function", "css.types.random", "random-fx"),
    ("random-item()", None, None, "random-item-plain"),
    ("if()", "if", "css.types.if", "if-fx"),
    ("Container style queries style(--x: v)", "container-style-queries", "css.at-rules.container.style_queries_for_custom_properties", "cq-style-fx"),
    ("Style query range syntax style(--n > 5)", None, "css.at-rules.container.style_queries_for_custom_properties.range_syntax", "cq-style-range-fx"),
    ("Container size queries + cq units", "container-queries", "css.at-rules.container", "cq-size-fx"),
    ("Name-only @container foo", "container-name-queries", "css.at-rules.container.container-query_optional", "cq-name-only-fx"),
    ("@scope", "scope", "css.at-rules.scope", "scope-fx"),
    ("CSS nesting (&)", "nesting", "css.selectors.nesting", "nesting-fx"),
    (":has()", "has", "css.selectors.has", "has-fx"),
    ("@property", "registered-custom-properties", "css.at-rules.property", "property-fx"),
    ("sin()/cos() (trig)", "trig-functions", "css.types.sin", "trig-fx"),
    ("Scroll-driven animations", "scroll-driven-animations", "css.properties.animation-timeline.scroll", "sda-view"),
    ("Cross-document view transitions @view-transition", "cross-document-view-transitions", "css.at-rules.view-transition", "vt-crossdoc-parse"),
    ("Same-document view transitions", "view-transitions", "css.properties.view-transition-name", "vt-name"),
    ("view-transition-name: match-element", None, "css.properties.view-transition-name.match-element", "vt-name-match-element"),
    ("view-transition-name: auto", None, None, "vt-name-auto"),
    ("Anchor positioning (core)", "anchor-positioning", "css.properties.anchor-name", "anchor-fx"),
    ("@starting-style", "starting-style", "css.at-rules.starting-style", "starting-style-fx"),
    ("transition-behavior: allow-discrete", "transition-behavior", "css.properties.transition-behavior", "transition-behavior"),
    ("interpolate-size", "interpolate-size", "css.properties.interpolate-size", "interpolate-size-fx"),
    ("calc-size()", "calc-size", "css.types.calc-size", "calc-size"),
    ("sibling-index()/sibling-count()", "sibling-count", "css.types.sibling-index", "sibling-fx"),
    ("text-wrap: balance", "text-wrap-balance", "css.properties.text-wrap.balance", "text-wrap-balance"),
    ("text-wrap: pretty", "text-wrap-pretty", "css.properties.text-wrap.pretty", "text-wrap-pretty"),
    ('content alt text ("x" / "")', "alt-text-generated-content", "css.properties.content.alt_text", "content-alt-fx"),
    ("overflow: clip", "overflow-clip", "css.properties.overflow.clip", "gotcha-overflow-clip-removes-scroll-overflow"),
    ("backdrop-filter (unprefixed)", "backdrop-filter", "css.properties.backdrop-filter", "backdrop-filter"),
    ("translate / rotate / scale", "individual-transforms", "css.properties.translate", "translate"),
    ("color-mix()", "color-mix", "css.types.color.color-mix", "color-mix-fx"),
    ("color-mix() with 3+ colors", "color-mix-variadic", "css.types.color.color-mix.variadic_color_arguments", "color-mix-variadic"),
    ("Relative color (rgb(from ...))", "relative-color", "css.types.color.rgb.relative_syntax", "relative-color-fx"),
    ("light-dark()", "light-dark", "css.types.color.light-dark", "light-dark-fx"),
    ("light-dark() with images", "light-dark-image", "css.types.color.light-dark.image_value", "light-dark-image"),
    ("@layer", "cascade-layers", "css.at-rules.layer", "layer-fx"),
    ("attr() with type()/units (any property)", "attr", "css.types.attr.type_function", "attr-typed-fx"),
    ("@function (custom functions)", "function", "css.at-rules.function", "function-fx"),
    ("::scroll-marker / ::scroll-marker-group", "scroll-markers", "css.selectors.scroll-marker", "scroll-marker"),
    ("::scroll-button()", "scroll-buttons", "css.selectors.scroll-button", "scroll-button"),
    ("::details-content", "details-content", "css.selectors.details-content", "details-content"),
    ("field-sizing", "field-sizing", "css.properties.field-sizing", "field-sizing"),
    ("shape()", "shape-function", "css.types.basic-shape.shape", "shape"),
    ("corner-shape", "corner-shape", "css.properties.corner-shape", "corner-shape"),
    ("text-box (trim/edge)", "text-box", "css.properties.text-box", "text-box"),
    ("@container scroll-state()", "container-scroll-state-queries", "css.at-rules.container.scroll-state_queries", "cq-scroll-state-parse"),
    (":popover-open", "popover", "css.selectors.popover-open", "popover-open"),
    ("reading-flow", "reading-flow", "css.properties.reading-flow", "reading-flow"),
    ("Typed arithmetic (calc(40px / 10px) = 4)", None, "css.types.calc.typed_division_produces_unitless_number", "typed-division-fx"),
    ("@custom-media", "custom-media-queries", "css.at-rules.custom-media", "custom-media-parse"),
    ("@mixin / @apply", "mixin", None, "mixin-parse"),
    ("@supports at-rule()", "supports-at-rule", "css.at-rules.supports.at-rule", "supports-at-rule"),
]
MAP = {'chrome': 'chrome', 'edge': 'edge', 'firefox': 'firefox', 'safari': 'safari', 'ios_saf': 'safari_ios',
       'and_chr': 'chrome_android', 'and_ff': 'firefox_android', 'samsung': 'samsunginternet_android',
       'opera': 'opera', 'op_mob': 'opera_android', 'android': 'webview_android'}


def num(v):
    m = re.match(r'[≤]?(\d+(?:\.\d+)?)', str(v))
    return tuple(int(x) for x in m.group(1).split('.')) if m else None


def node(path):
    n = bcd
    for p in path.split('.'):
        if p not in n:
            return None
        n = n[p]
    return n.get('__compat', {}).get('support')


def ver(entries):
    if entries is None:
        return '-'
    if isinstance(entries, dict):
        entries = [entries]
    full = None
    notes = []
    for e in entries:
        va = e.get('version_added')
        if e.get('flags'):
            notes.append('flag')
            continue
        if e.get('prefix'):
            notes.append(f"{e['prefix']}{va}")
            continue
        if e.get('alternative_name') or e.get('version_removed'):
            continue
        if e.get('partial_implementation'):
            notes.append(f'partial {va}')
            continue
        if va == 'preview':
            notes.append('TP/Nightly')
            continue
        if va in (False, None):
            continue
        full = va
        break
    s = str(full) if full else 'no'
    if notes and not full:
        s += ' (' + ', '.join(notes) + ')'
    return s


def cov(path):
    sup = node(path)
    tot = 0
    if not sup:
        return None
    for agent, b in MAP.items():
        e = sup.get(b)
        if e is None:
            continue
        v = ver(e)
        if v.startswith('no') or v == '-':
            continue
        n = num(v)
        if not n:
            continue
        for vv, u in ciu['agents'][agent]['usage_global'].items():
            if u:
                k = num(vv.split('-')[0])
                if k and k >= n:
                    tot += u
    return round(tot, 1)


rows = []
for name, wid, key, pid in F:
    st = wf.get(wid, {}).get('status', {}) if wid else {}
    bl = {'high': 'Widely', 'low': 'Newly', False: 'No', None: '-'}.get(st.get('baseline'), str(st.get('baseline')))
    s = node(key) if key else None
    g = lambda b: ver(s.get(b)) if s else '-'
    rows.append({
        'feature': name, 'web_features_id': wid, 'bcd_key': key, 'baseline': bl,
        'baseline_low_date': st.get('baseline_low_date'), 'baseline_high_date': st.get('baseline_high_date'),
        'chrome': g('chrome'), 'edge': g('edge'), 'firefox': g('firefox'), 'safari': g('safari'), 'safari_ios': g('safari_ios'),
        'global_users_pct': cov(key) if key else None,
        'probe_id': pid,
        'chromium147': probe['chromium147'].get(pid, {}).get('ok'),
        'chrome155': probe['chrome155'].get(pid, {}).get('ok'),
        'chrome155_experimental_flag': probe['chrome155exp'].get(pid, {}).get('ok'),
        'chrome155_detail': probe['chrome155'].get(pid, {}).get('detail'),
    })
json.dump({'generated': '2026-10-14',
           'sources': {'web-features': '3.42.0 (published 2026-10-09)', '@mdn/browser-compat-data': '8.1.5 (published 2026-10-08)',
                       'caniuse usage': 'Fyrd/caniuse fulldata-json/data-2.0.json, commit 2026-10-13'},
           'rows': rows}, open(sys.argv[7], 'w', encoding='utf-8'), indent=1, ensure_ascii=False)
yn = lambda b: 'Y' if b else ('n' if b is False else '-')
print('| Feature | Baseline (since) | Chrome/Edge | Firefox | Safari / iOS | % users | Local Chrome 147 / 155 / 155+flag |')
print('|---|---|---|---|---|---|---|')
for r in rows:
    since = r['baseline_high_date'] or r['baseline_low_date'] or ''
    sf = r['safari'] if r['safari'] == r['safari_ios'] else r['safari'] + ' / ' + r['safari_ios']
    ce = r['chrome'] if r['chrome'] == r['edge'] else r['chrome'] + ' / ' + r['edge']
    pct = r['global_users_pct'] if r['global_users_pct'] is not None else '-'
    print(f"| {r['feature']} | {r['baseline']}{(' ' + since) if since else ''} | {ce} | {r['firefox']} | {sf} | {pct} | "
          f"{yn(r['chromium147'])} / {yn(r['chrome155'])} / {yn(r['chrome155_experimental_flag'])} |")

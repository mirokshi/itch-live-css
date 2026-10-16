/*
 * Tiny result reporter for the local itch custom-CSS experiments.
 *
 * A test page calls T.run(async () => { ...T.check()/T.info()... }).
 * Results are rendered into <section id="results"> (outside #wrapper, so the
 * table never interferes with the CSS under test), exposed as window.__results,
 * and posted to the parent window (used by index.html, the "run all" page).
 *
 *   T.check(id, what, actual, expected)  -> PASS/FAIL (expected: value, or {fn, label})
 *   T.info(id, what, actual)             -> INFO row (observation, no expectation)
 *   T.cs(selector, prop, pseudo?, doc?)  -> trimmed computed value
 *   T.frame(html, w, h)                  -> Promise<iframe> (srcdoc, same origin)
 *   T.who(value, map)                    -> label for a marker color, e.g. {"rgb(1, 1, 1)": "theme"}
 */
(function () {
  const results = [];
  const meta = { userAgent: navigator.userAgent, url: location.href, ranAt: new Date().toISOString() };

  function esc(s) {
    return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  }

  function box() {
    let el = document.getElementById('results');
    if (!el) {
      el = document.createElement('section');
      el.id = 'results';
      document.body.appendChild(el);
    }
    return el;
  }

  function render() {
    const pass = results.filter(r => r.status === 'PASS').length;
    const fail = results.filter(r => r.status === 'FAIL').length;
    const info = results.length - pass - fail;
    box().innerHTML =
      '<h2 class="results-title">Results: ' + pass + ' PASS · ' + fail + ' FAIL · ' + info + ' INFO</h2>' +
      '<p class="results-ua">' + esc(meta.userAgent) + '</p>' +
      '<table><thead><tr><th>id</th><th>status</th><th>what</th><th>expected</th><th>actual</th></tr></thead><tbody>' +
      results.map(r =>
        '<tr class="r-' + r.status + '"><td>' + esc(r.id) + '</td><td>' + r.status + '</td><td>' + esc(r.what) +
        '</td><td>' + esc(r.expected) + '</td><td>' + esc(r.actual) + '</td></tr>').join('') +
      '</tbody></table>';
    document.title = document.title.replace(/^\[[^\]]*\] /, '');
    document.title = '[' + pass + '/' + (pass + fail) + '] ' + document.title;
  }

  function check(id, what, actual, expected) {
    let ok, label;
    if (expected && typeof expected === 'object' && typeof expected.fn === 'function') {
      ok = !!expected.fn(actual);
      label = expected.label;
    } else {
      ok = actual === expected;
      label = expected;
    }
    results.push({ id, what, status: ok ? 'PASS' : 'FAIL', expected: String(label), actual: String(actual) });
    render();
    return ok;
  }

  function info(id, what, actual) {
    results.push({ id, what, status: 'INFO', expected: '-', actual: typeof actual === 'string' ? actual : JSON.stringify(actual) });
    render();
  }

  function cs(selector, prop, pseudo, doc) {
    const d = doc || document;
    const el = d.querySelector(selector);
    if (!el) return '(no element ' + selector + ')';
    return d.defaultView.getComputedStyle(el, pseudo || null).getPropertyValue(prop).trim();
  }

  function who(value, map) {
    return map[value] || ('?' + value);
  }

  function frame(html, w, h) {
    return new Promise(resolve => {
      let host = document.getElementById('frames');
      if (!host) {
        host = document.createElement('div');
        host.id = 'frames';
        document.body.appendChild(host);
      }
      const f = document.createElement('iframe');
      f.width = w || 375;
      f.height = h || 300;
      f.addEventListener('load', () => setTimeout(() => resolve(f), 30), { once: true });
      f.srcdoc = html;
      host.appendChild(f);
    });
  }

  function done() {
    window.__results = results;
    window.__meta = meta;
    window.__done = true;
    try { parent !== window && parent.postMessage({ type: 'itch-css-test', url: location.pathname, results, meta }, '*'); } catch (e) {}
  }

  function run(fn) {
    const go = async () => {
      try {
        if (document.fonts && document.fonts.ready) await document.fonts.ready;
        await new Promise(r => setTimeout(r, 60));
        await fn();
      } catch (e) {
        results.push({ id: 'ERROR', what: 'test script threw', status: 'FAIL', expected: 'no exception', actual: e && (e.stack || e.message || e) });
        render();
      }
      done();
    };
    if (document.readyState === 'complete') go();
    else window.addEventListener('load', go, { once: true });
  }

  // Results-table styling, scoped to #results/#frames so it can't leak into the CSS under test.
  const st = document.createElement('style');
  st.textContent =
    '#results{font:13px/1.35 system-ui,sans-serif;margin:24px 8px;color:#111;background:#fff;padding:8px;border:1px solid #999}' +
    '#results table{border-collapse:collapse;width:100%}#results td,#results th{border:1px solid #ccc;padding:2px 4px;text-align:left;vertical-align:top;word-break:break-word}' +
    '#results .r-PASS td:nth-child(2){color:#060;font-weight:700}#results .r-FAIL td:nth-child(2){color:#b00;font-weight:700}' +
    '#results .r-INFO td:nth-child(2){color:#555}#results .results-ua{color:#555;font-size:11px}' +
    '#frames iframe{border:1px dashed #888;margin:4px;vertical-align:top}';
  document.head.appendChild(st);

  window.T = { check, info, cs, who, frame, run, results, meta };
})();

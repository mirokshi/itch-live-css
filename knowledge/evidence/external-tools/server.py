# Local lab server for the "external" dimension (itch @import behaviour).
# Run twice: python -I server.py 8701  (page origin, http://localhost:8701)
#            python -I server.py 8702  (asset origin, http://127.0.0.1:8702 -> cross-site)
# /pages/<file>             static test pages from ./pages (Referrer-Policy: no-referrer-when-downgrade, like itch)
# /css?n=NAME&...           CSS body ":root{--NAME:applied}"; options:
#     ct=<type>|none          Content-Type (default text/css)
#     status=<int>            HTTP status (default 200)
#     delay=<ms>              wait before responding
#     imp=<url>               prepend @import url(<url>);
#     extra=<css>             append raw css
#     acao=<value>            Access-Control-Allow-Origin
#     cc=<value>              Cache-Control
#     rp=<value>              Referrer-Policy on this response
#     redirect=1              302 to the same URL without redirect=1
#     loc=<url>               302 to <url> (verifier-2)
#     setcookie=<value>       Set-Cookie header (verifier-2)
# /font?acao=*|none         serves fonts/f.woff2 (font/woff2)
# /img                      1x1 gif
# Every request is appended as JSON to log-<port>.jsonl
import json, os, sys, time, threading
from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs, urlencode

PORT = int(sys.argv[1])
HERE = os.path.dirname(os.path.abspath(__file__))
LOG = os.path.join(HERE, f"log-{PORT}.jsonl")
lock = threading.Lock()
GIF = bytes.fromhex("47494638396101000100800000000000ffffff21f90401000000002c00000000010001000002024401003b")

class H(BaseHTTPRequestHandler):
    protocol_version = "HTTP/1.1"
    def log_message(self, *a):
        pass
    def _log(self, extra=None):
        rec = {"t": round(time.time() * 1000), "port": PORT, "path": self.path,
               "referer": self.headers.get("Referer"), "origin": self.headers.get("Origin"),
               "dest": self.headers.get("Sec-Fetch-Dest"), "mode": self.headers.get("Sec-Fetch-Mode"),
               "site": self.headers.get("Sec-Fetch-Site"), "cookie": self.headers.get("Cookie"),
               "ua": self.headers.get("User-Agent"), "all": dict(self.headers)}
        if extra: rec.update(extra)
        with lock:
            with open(LOG, "a", encoding="utf-8") as f:
                f.write(json.dumps(rec) + "\n")
    def _send(self, status, body, headers):
        self.send_response(status)
        for k, v in headers.items():
            self.send_header(k, v)
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)
    def do_GET(self):
        u = urlparse(self.path)
        q = {k: v[0] for k, v in parse_qs(u.query).items()}
        self._log()
        if "delay" in q:
            time.sleep(int(q["delay"]) / 1000)
        if u.path.startswith("/pages/"):
            fn = os.path.join(HERE, "pages", os.path.basename(u.path))
            if not os.path.exists(fn):
                return self._send(404, b"nf", {"Content-Type": "text/plain"})
            with open(fn, "rb") as f:
                body = f.read()
            h = {"Content-Type": "text/html; charset=utf-8", "Referrer-Policy": "no-referrer-when-downgrade"}
            if not os.path.basename(u.path).startswith("bf"):
                h["Cache-Control"] = "no-store"
            return self._send(200, body, h)
        if u.path == "/css":
            if "loc" in q:  # verifier-2: 302 to an arbitrary (e.g. cross-origin) URL
                return self._send(302, b"", {"Location": q["loc"]})
            if q.get("redirect") == "1":
                q2 = dict(q); q2.pop("redirect")
                return self._send(302, b"", {"Location": "/css?" + urlencode(q2)})
            css = ""
            if "imp" in q:
                css += f"@import url({q['imp']});\n"
            css += ":root{--%s:applied}\n" % q.get("n", "x")
            css += q.get("extra", "")
            h = {"Cache-Control": q.get("cc", "no-store")}
            ct = q.get("ct", "text/css")
            if ct != "none":
                h["Content-Type"] = ct
            if "acao" in q:
                h["Access-Control-Allow-Origin"] = q["acao"]
            if "link" in q:
                h["Link"] = q["link"]
            if "rp" in q:
                h["Referrer-Policy"] = q["rp"]
            if "setcookie" in q:  # verifier-2: Set-Cookie on the stylesheet response
                h["Set-Cookie"] = q["setcookie"]
            return self._send(int(q.get("status", 200)), css.encode("utf-8"), h)
        if u.path == "/font":
            with open(os.path.join(HERE, "fonts", "f.woff2"), "rb") as f:
                body = f.read()
            h = {"Content-Type": "font/woff2", "Cache-Control": "no-store"}
            if q.get("acao", "none") != "none":
                h["Access-Control-Allow-Origin"] = q["acao"]
            return self._send(200, body, h)
        if u.path == "/js":
            return self._send(200, b"window.__js=(window.__js||0)+1;", {"Content-Type": "text/javascript", "Cache-Control": "no-store"})
        if u.path == "/img":
            return self._send(200, GIF, {"Content-Type": "image/gif", "Cache-Control": "no-store"})
        return self._send(404, b"nf", {"Content-Type": "text/plain"})

ThreadingHTTPServer(("0.0.0.0", PORT), H).serve_forever()

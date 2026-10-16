"""Local HTTPS page server for the Brave Shields test (gapfill-08, 2026-10-14).
usage: python -I https_pages.py <pages_dir> <cert.pem> <key.pem> <port>
'/' serves index.html; other paths serve <pages_dir>/<basename>. Logs each request line to stdout."""
import http.server, os, ssl, sys
pages, cert, key, port = sys.argv[1], sys.argv[2], sys.argv[3], int(sys.argv[4])


class H(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        name = os.path.basename(self.path.split('?')[0]) or 'index.html'
        fn = os.path.join(pages, name)
        print('GET', self.path, flush=True)
        if not os.path.isfile(fn):
            self.send_response(404); self.send_header('Content-Length', '0'); self.end_headers(); return
        body = open(fn, 'rb').read()
        self.send_response(200)
        self.send_header('Content-Type', 'text/html; charset=utf-8')
        self.send_header('Cache-Control', 'no-store')
        self.send_header('Referrer-Policy', 'no-referrer-when-downgrade')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, *a):
        pass


ctx = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
ctx.load_cert_chain(cert, key)
srv = http.server.ThreadingHTTPServer(('127.0.0.1', port), H)
srv.socket = ctx.wrap_socket(srv.socket, server_side=True)
srv.serve_forever()

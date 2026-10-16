"""Stall lab servers (gapfill-08, 2026-10-14).
usage: python -I stallserver.py <pages_dir> <log_file>
  :8811  page server: serves <pages_dir>/<name>.html with Cache-Control: no-store
  :8812  accepts TCP connections and never reads or writes (holds them HOLD s)  -> "connect OK, no answer"
  :8813  reads the request, sends 200 text/css headers + a first CSS chunk, then stalls the body (HOLD s)
  :8814  answers after DELAY_MS with a complete small CSS file (control for a slow-but-OK host)
Every accept / send / close is logged as JSON lines with a ms timestamp.
"""
import json, os, socket, sys, threading, time

PAGES, LOG = sys.argv[1], sys.argv[2]
HOLD = 600
DELAY_MS = 2500
lock = threading.Lock()


def log(**kw):
    kw['t'] = round(time.time() * 1000)
    with lock, open(LOG, 'a', encoding='utf-8') as f:
        f.write(json.dumps(kw) + '\n')


def read_request(conn):
    conn.settimeout(30)
    data = b''
    try:
        while b'\r\n\r\n' not in data and len(data) < 65536:
            chunk = conn.recv(4096)
            if not chunk:
                break
            data += chunk
    except Exception:
        pass
    conn.settimeout(None)
    first = data.split(b'\r\n', 1)[0].decode('latin-1', 'replace')
    return first, data


def serve(port, handler):
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    s.bind(('127.0.0.1', port))
    s.listen(64)
    while True:
        conn, addr = s.accept()
        threading.Thread(target=handler, args=(conn, port), daemon=True).start()


def h_pages(conn, port):
    first, _ = read_request(conn)
    log(port=port, ev='request', line=first)
    path = first.split(' ')[1] if ' ' in first else '/'
    name = os.path.basename(path.split('?')[0])
    fn = os.path.join(PAGES, name)
    if os.path.isfile(fn):
        body = open(fn, 'rb').read()
        hdr = 'HTTP/1.1 200 OK\r\nContent-Type: text/html; charset=utf-8\r\nCache-Control: no-store\r\n'
    else:
        body = b'nf'
        hdr = 'HTTP/1.1 404 Not Found\r\nContent-Type: text/plain\r\n'
    hdr += f'Content-Length: {len(body)}\r\nConnection: close\r\n\r\n'
    conn.sendall(hdr.encode() + body)
    conn.close()


def h_hang(conn, port):
    log(port=port, ev='accept')
    time.sleep(HOLD)
    conn.close()
    log(port=port, ev='close')


def h_headers_then_stall(conn, port):
    first, _ = read_request(conn)
    log(port=port, ev='request', line=first)
    body0 = b':root{--stall:first-chunk}\n'
    conn.sendall(b'HTTP/1.1 200 OK\r\nContent-Type: text/css; charset=utf-8\r\nCache-Control: no-store\r\n'
                 b'Content-Length: 100000\r\n\r\n' + body0)
    log(port=port, ev='headers+chunk sent')
    time.sleep(HOLD)
    conn.close()
    log(port=port, ev='close')


def h_slow_ok(conn, port):
    first, _ = read_request(conn)
    log(port=port, ev='request', line=first)
    time.sleep(DELAY_MS / 1000)
    body = b':root{--slow:ok}\n'
    conn.sendall(b'HTTP/1.1 200 OK\r\nContent-Type: text/css\r\nCache-Control: no-store\r\n'
                 + f'Content-Length: {len(body)}\r\nConnection: close\r\n\r\n'.encode() + body)
    conn.close()
    log(port=port, ev='sent')


for port, h in ((8812, h_hang), (8813, h_headers_then_stall), (8814, h_slow_ok)):
    threading.Thread(target=serve, args=(port, h), daemon=True).start()
serve(8811, h_pages)

# Logs every TCP connection accepted on a port (to detect browser preconnects). Usage: python -I sockwatch.py 8703
import socket, sys, time, threading
port = int(sys.argv[1])
s = socket.socket(); s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1); s.bind(("0.0.0.0", port)); s.listen(50)
def handle(c, a):
    c.settimeout(3)
    try: data = c.recv(200)
    except Exception: data = b""
    with open(f"sock-{port}.log", "a") as f: f.write(f"{round(time.time()*1000)} conn from {a} first-bytes={data[:60]!r}\n")
    c.close()
while True:
    c, a = s.accept(); threading.Thread(target=handle, args=(c, a), daemon=True).start()

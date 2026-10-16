import re, sys
sys.stdout.reconfigure(encoding='utf-8')
BS = chr(92)
for f in sys.argv[1:]:
    d = open(f, 'rb').read().decode('utf-8')
    m = re.search(r'<style\b[^>]*\bid="(custom_css|jam_theme)"[^>]*>(.*?)</style>', d, re.S); s = m.group(2)
    hits = [s[x.start() - 30:x.end() + 3] for x in re.finditer(re.escape(BS) + r'[0-9a-fA-F]{1,6}', s)]
    print(f.split('/')[-1], 'len', len(s), 'backslashes', s.count(BS), 'hex-escapes', len(hits), hits[:4])

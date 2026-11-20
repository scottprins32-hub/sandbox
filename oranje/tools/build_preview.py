import os, re, shutil
# Builds the demo-only copy of Oranje: generated data, no sign-in, no welcome screen.
# usage: python3 tools/build_preview.py OUT_DIR   → OUT_DIR/oranje-demo.html (page fragment) and OUT_DIR/site/ (its files)
import sys
SRC=os.path.dirname(os.path.dirname(os.path.abspath(__file__))); OUT=os.path.abspath(sys.argv[1])
site=OUT+'/site'
os.makedirs(site, exist_ok=True)
# Overwrites in place and never deletes: use a fresh OUT_DIR if files were removed from the app.
for d in ('css','js','fonts'): shutil.copytree(f'{SRC}/{d}', f'{site}/{d}', dirs_exist_ok=True)
open(site+'/config.js','w').write("window.ORANJE_CONFIG = { clientId: '', preview: true };\n")
h=open(SRC+'/index.html').read()
body=h[h.index('<body'):h.index('</body>')]; body=body[body.index('>')+1:]
a=body.index('  <!-- ───────────── Welcome'); b=body.index('  <!-- ───────────── Dashboard')
body=body[:a]+body[b:]
body=body.replace('<noscript><p class="noscript">Oranje needs JavaScript to read and draw your data.</p></noscript>\n','')
page='<title>Oranje Demo</title>\n<meta name="claude:viewport-fit-sides" content="cover">\n<link rel="stylesheet" href="css/style.css?v=11">\n<script src="js/boot.js?v=11"></script>\n<script src="config.js"></script>\n'+body
open(OUT+'/oranje-demo.html','w').write(page)
open(site+'/index.html','w').write('<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"><style>:root{color-scheme:light}body{margin:0}</style></head><body>'+page+'</body></html>')
print('built', len(page))

# Brand files

`../../brand/` holds every logo file. To rebuild them after changing the mark:

```bash
pip install fonttools brotli      # only to re-outline the wordmark
python3 wordmark.py wordmark.json # outlines ORANJE from the app's Archivo font
python3 generate.py               # writes the SVGs into brand/ and icons/
node render.cjs                   # renders the PNGs (needs Playwright)
```

// Copies the files the site serves into dist/, which Base44 uploads.
// Sources, tests and tools stay out of the deployment.
import { cpSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'dist');
mkdirSync(out, { recursive: true });
// google…html proves to Google Search Console that this address is ours; keep it.
for (const f of ['index.html', 'whoop.html', 'google592dd5f2c27a76db.html', 'privacy.html', 'terms.html', 'config.js', 'manifest.webmanifest', 'sw.js', 'css', 'js', 'fonts', 'icons', 'brand']) {
  cpSync(join(root, f), join(out, f), { recursive: true, force: true });
}
console.log(`site built in ${out}`);

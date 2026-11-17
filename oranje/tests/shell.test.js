import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const walk = (dir) => readdirSync(join(root, dir), { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)]));

test('the offline shell lists every script and only files that exist', () => {
  const sw = readFileSync(join(root, 'sw.js'), 'utf8');
  const listed = [...sw.matchAll(/'([^']+\.(?:js|css|html|woff2|png|svg|webmanifest))'/g)].map((m) => m[1]).filter((f) => f !== 'sw.js');
  for (const f of listed) assert.ok(existsSync(join(root, f)), `${f} is listed but missing`);
  for (const f of [...walk('js'), 'css/style.css']) assert.ok(listed.includes(f), `${f} is not in the offline shell`);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { HELP } from '../js/ui/help.js';
import { VITAL_DEFS } from '../js/ui/sections.js';

const root = fileURLToPath(new URL('..', import.meta.url));

test('every "?" on the page and on each vital has an explanation', () => {
  const html = readFileSync(`${root}index.html`, 'utf8');
  const keys = [...html.matchAll(/data-help="([^"]+)"/g)].map((m) => m[1]);
  assert.ok(keys.length >= 20, `only ${keys.length} help markers`);
  for (const k of [...keys, ...Object.keys(VITAL_DEFS).map((v) => `vital-${v}`)]) {
    assert.ok(HELP[k], `no explanation for ${k}`);
    const [title, body] = HELP[k];
    assert.ok(title && body.length && body.every((p) => p.length > 20), `${k} is incomplete`);
  }
});

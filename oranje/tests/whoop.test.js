import test from 'node:test';
import assert from 'node:assert/strict';
import { handleWhoop, WHOOP_SCOPES, whoopCallback } from '../base44/shared/whoop-broker.js';
import { defaultWearable, whoopContext } from '../js/data/whoop.js';
import { fetchWhoopDays, summarizeWhoop } from '../base44/shared/whoop-data.js';

const appOrigin = 'https://oranje.test';
const env = { appOrigin, id: 'test-client', secret: 'test-app-secret' };
const start = '2026-11-16T23:00:00Z';
const wake = '2026-11-17T06:15:00Z';
const finished = '2026-11-17T22:00:00Z';
const cycle = { id: 10, start, end: finished, timezone_offset: '+02:00', score_state: 'SCORED', score: { strain: 12.41, average_heart_rate: 73 }, user_id: 900 };
const recovery = { cycle_id: 10, sleep_id: 'night', score_state: 'SCORED', score: { recovery_score: 78, hrv_rmssd_milli: 60.42, resting_heart_rate: 49 } };
const night = { cycle_id: 10, id: 'night', nap: false, end: wake, timezone_offset: '+02:00', score_state: 'SCORED', score: { sleep_performance_percentage: 91, stage_summary: { total_light_sleep_time_milli: 13_200_000, total_slow_wave_sleep_time_milli: 5_400_000, total_rem_sleep_time_milli: 5_400_000 } } };
const workout = { id: 'workout', sport_name: 'cycling', start: '2026-11-17T12:00:00Z', end: '2026-11-17T12:42:00Z', timezone_offset: '+02:00', score_state: 'SCORED', score: { strain: 9.51, average_heart_rate: 133 } };
const token = (expires_in = 3600) => Response.json({ access_token: 'fake-access-value', refresh_token: 'fake-refresh-value', expires_in });
const cookieOf = (response, name) => response.headers.getSetCookie().find((value) => value.startsWith(`${name}=`))?.split(';')[0];
const req = (action, method = 'GET', cookie = '', origin = appOrigin) =>
  new Request(`${appOrigin}/functions/whoop?action=${action}`, { method, headers: { Origin: origin, Cookie: cookie } });

async function login(expiresIn) {
  const response = await handleWhoop(req('login'), env);
  const target = new URL(response.headers.get('Location'));
  const callback = new URL(target.searchParams.get('redirect_uri'));
  callback.searchParams.set('state', target.searchParams.get('state'));
  callback.searchParams.set('code', 'fake-code');
  const cookie = cookieOf(response, 'oranje_whoop_state');
  const result = await whoopCallback(new Request(callback, { headers: { Cookie: cookie } }), env, (_, init) => {
    assert.equal(init.body.get('grant_type'), 'authorization_code');
    assert.equal(init.body.get('redirect_uri'), `${appOrigin}/functions/whoopCallback`);
    return token(expiresIn);
  });
  return { response, target, result, jar: cookieOf(result, 'oranje_whoop_session') };
}

test('WHOOP displays original scores by physiological cycle and preserves missing scores', () => {
  const [day] = summarizeWhoop([cycle], [recovery], [night, { ...night, id: 'nap', nap: true }], [workout]);
  assert.deepEqual(day, {
    date: '2026-11-17', strain: 12.41, recovery: 78, sleep: 91, hrv: 60.42,
    restingHeartRate: 49, averageHeartRate: 73, sleepMinutes: 400,
    workouts: [{ name: 'cycling', minutes: 42, strain: 9.51, averageHeartRate: 133 }],
  });
  const [pending] = summarizeWhoop([{ ...cycle, score_state: 'PENDING_SCORE' }], [], [], []);
  assert.equal(pending.strain, null);
  assert.equal(pending.recovery, null);
  assert.equal(pending.sleep, null);
});

test('WHOOP follows the official continuation token and uses only the four data collections', async () => {
  const clients = [];
  const days = await fetchWhoopDays('access', (url, init) => {
    clients.push(url.pathname);
    assert.equal(init.headers.Authorization, 'Bearer access');
    assert.equal(url.searchParams.get('limit'), '25');
    if (url.pathname.endsWith('/cycle') && !url.searchParams.get('nextToken')) return Response.json({ records: [], next_token: 'page-2' });
    return Response.json({ records: url.searchParams.get('nextToken') === 'page-2' ? [cycle] : [] });
  });
  assert.equal(clients.length, 5);
  assert.equal(days[0].strain, 12.41);
});

test('WHOOP login requests only required scopes and seals its own session cookie', async () => {
  const { response, target, result, jar } = await login();
  assert.equal(target.origin, 'https://api.prod.whoop.com');
  assert.deepEqual(target.searchParams.get('scope').split(' '), [...WHOOP_SCOPES, 'offline']);
  assert.match(target.searchParams.get('state'), /^[A-Za-z0-9_-]{8}$/);
  assert.match(response.headers.get('Set-Cookie'), /HttpOnly; SameSite=Lax/);
  assert.equal(result.headers.get('Location'), `${appOrigin}/whoop.html`);
  assert.ok(result.headers.getSetCookie().some((item) => item.startsWith(jar) && item.includes('HttpOnly; SameSite=Strict')));
  assert.ok(!jar.includes('fake-refresh-value'));
  const session = await handleWhoop(req('session', 'GET', jar), env);
  assert.deepEqual(await session.json(), { configured: true, connected: true });
});

test('WHOOP rejects wrong state, cross-origin, tampered cookie and unconfigured requests', async () => {
  const callback = await whoopCallback(new Request(`${appOrigin}/functions/whoopCallback?state=wrong&code=abc`,
    { headers: { Cookie: 'oranje_whoop_state=expected' } }), env, () => assert.fail('must not contact WHOOP'));
  assert.match(callback.headers.get('Location'), /error=state_mismatch/);
  assert.equal((await handleWhoop(req('data', 'POST', '', 'https://other.test'), env)).status, 403);
  assert.equal((await handleWhoop(req('data', 'POST', 'oranje_whoop_session=tampered'), env)).status, 401);
  const check = await handleWhoop(req('session'), { appOrigin });
  assert.deepEqual(await check.json(), { configured: false, connected: false });
});

test('WHOOP saves rotated tokens even if the data API is rate limited and never caches scores', async () => {
  const { jar } = await login(1);
  const updated = await handleWhoop(req('data', 'POST', jar), env, async (url, init) => {
    if (String(url).endsWith('/token')) {
      assert.equal(init.body.get('refresh_token'), 'fake-refresh-value');
      assert.equal(init.body.get('scope'), 'offline');
      return Response.json({ access_token: 'new-access', refresh_token: 'new-refresh', expires_in: 3600 });
    }
    assert.equal(init.headers.Authorization, 'Bearer new-access');
    return new Response(null, { status: 429 });
  });
  assert.equal(updated.status, 429);
  assert.equal(updated.headers.get('Cache-Control'), 'no-store');
  assert.ok(cookieOf(updated, 'oranje_whoop_session'));
  const newer = await handleWhoop(req('data', 'POST', cookieOf(updated, 'oranje_whoop_session')), env, (url, init) => {
    assert.equal(init.headers.Authorization, 'Bearer new-access');
    return Response.json({ records: [] });
  });
  assert.equal(newer.status, 200);
  assert.equal(newer.headers.get('Cache-Control'), 'no-store');
});

test('WHOOP disconnect revokes only the WHOOP grant', async () => {
  const { jar } = await login();
  const result = await handleWhoop(req('logout', 'POST', `${jar}; oranje_rt=google-cookie`), env, (url, init) => {
    assert.equal(url, 'https://api.prod.whoop.com/developer/v2/user/access');
    assert.equal(init.method, 'DELETE');
    return new Response(null, { status: 204 });
  });
  assert.equal(result.status, 200);
  assert.match(result.headers.get('Set-Cookie'), /^oranje_whoop_session=;.*/);
  assert.ok(!result.headers.get('Set-Cookie').includes('oranje_rt'));
});

test('WHOOP distinguishes unconfirmed revocation from a successful local disconnect', async () => {
  const { jar } = await login();
  const calls = [];
  const result = await handleWhoop(req('logout', 'POST', jar), env, (url) => {
    calls.push(url);
    return String(url).endsWith('/token') ? token() : new Response(null, { status: 401 });
  });
  assert.equal(calls.length, 3);
  assert.deepEqual(await result.json(), { ok: true, revoked: false });
  assert.match(result.headers.get('Set-Cookie'), /^oranje_whoop_session=;.*Max-Age=0/);
});

test('the dashboard defaults to linked direct WHOOP and honours an explicit Fitbit choice', () => {
  assert.equal(defaultWearable({ whoop: true, fitbit: true }), 'whoop');
  assert.equal(defaultWearable({ whoop: true, fitbit: true, preference: 'google' }), 'google');
  assert.equal(defaultWearable({ whoop: true, fitbit: false, preference: 'google' }), 'whoop');
  assert.equal(defaultWearable({ whoop: false, fitbit: true, preference: 'whoop' }), 'google');
  assert.equal(defaultWearable({ whoop: false, fitbit: false, preference: 'apple-health' }), null);
});

test('WHOOP cycles on the same date stay separate and unavailable scores stay unavailable', () => {
  const ctx = whoopContext([
    { date: '2026-11-18', strain: 9.4, recovery: 88, sleep: 92 },
    { date: '2026-11-18', strain: 6.4, recovery: null, sleep: 79 },
  ]);
  assert.equal(ctx.days.length, 2);
  assert.equal(ctx.days.at(-1).recovery, 88);
  assert.equal(ctx.byDate['2026-11-18:2'].recovery, null);
  assert.equal(ctx.byDate['2026-11-18:2'].sleep, 79);
});

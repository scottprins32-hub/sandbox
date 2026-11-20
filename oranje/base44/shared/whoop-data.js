const API = 'https://api.prod.whoop.com/developer/v2/';
const DAY_MS = 86_400_000;
const score = (record) => record?.score_state === 'SCORED' ? record.score : undefined;
const number = (value) => Number.isFinite(value) ? value : null;

function localDate(instant, offset) {
  const time = Date.parse(instant);
  if (!Number.isFinite(time)) return null;
  const match = /^([+-])(\d{2}):(\d{2})$/.exec(offset);
  const mins = match ? (match[1] === '-' ? -1 : 1) * (Number(match[2]) * 60 + Number(match[3])) : 0;
  return new Date(time + mins * 60_000).toISOString().slice(0, 10);
}

export function summarizeWhoop(cycles, recoveries, sleeps, workouts) {
  const recoveryByCycle = new Map(recoveries.map((r) => [r.cycle_id, r]));
  const nights = sleeps.filter((s) => s.nap === false).sort((a, b) => Date.parse(a.end) - Date.parse(b.end));
  const sleepByCycle = new Map(nights.map((s) => [s.cycle_id, s]));
  const sleepById = new Map(nights.map((s) => [s.id, s]));
  const sessions = workouts.map((workout) => ({
    time: Date.parse(workout.start),
    date: localDate(workout.start, workout.timezone_offset),
    name: workout.sport_name || 'Workout',
    minutes: number(Math.max(0, Math.round((Date.parse(workout.end) - Date.parse(workout.start)) / 60_000))),
    strain: number(score(workout)?.strain),
    averageHeartRate: number(score(workout)?.average_heart_rate),
  })).filter((workout) => workout.date).sort((a, b) => b.time - a.time);
  const cycleIds = new Set();
  return [...cycles].sort((a, b) => Date.parse(b.start) - Date.parse(a.start)).flatMap((cycle) => {
    if (cycleIds.has(cycle.id)) return [];
    cycleIds.add(cycle.id);
    const recovery = recoveryByCycle.get(cycle.id);
    const sleep = sleepById.get(recovery?.sleep_id) ?? sleepByCycle.get(cycle.id);
    const date = localDate(sleep?.end, sleep?.timezone_offset) ?? localDate(cycle.start, cycle.timezone_offset);
    if (!date) return [];
    const start = Date.parse(cycle.start);
    const end = cycle.end ? Date.parse(cycle.end) : Infinity;
    const stages = score(sleep)?.stage_summary;
    return [{
      date,
      strain: number(score(cycle)?.strain),
      recovery: number(score(recovery)?.recovery_score),
      sleep: number(score(sleep)?.sleep_performance_percentage),
      hrv: number(score(recovery)?.hrv_rmssd_milli),
      restingHeartRate: number(score(recovery)?.resting_heart_rate),
      averageHeartRate: number(score(cycle)?.average_heart_rate),
      sleepMinutes: stages ? number(Math.round(
        (stages.total_light_sleep_time_milli + stages.total_slow_wave_sleep_time_milli + stages.total_rem_sleep_time_milli) / 60_000,
      )) : null,
      workouts: sessions.filter((w) => w.time >= start && w.time < end)
        .map(({ time, date: workoutDate, ...workout }) => workout),
    }];
  });
}

export async function fetchWhoopDays(token, fetchImpl) {
  const end = new Date();
  const start = new Date(end.getTime() - 30 * DAY_MS);
  const collection = async (path) => {
    const records = [];
    let next;
    const seen = new Set();
    do {
      const url = new URL(path, API);
      url.search = new URLSearchParams({ start: start.toISOString(), end: end.toISOString(), limit: '25' });
      if (next) url.searchParams.set('nextToken', next);
      const response = await fetchImpl(url, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        signal: AbortSignal.timeout(8_000),
      });
      if (!response.ok) throw Object.assign(new Error('WHOOP API request failed'), { status: response.status });
      const result = await response.json();
      if (!Array.isArray(result.records)) throw new Error('Invalid WHOOP collection');
      records.push(...result.records);
      next = result.next_token;
      if (next && (seen.has(next) || seen.size === 11)) throw new Error('Unexpected WHOOP pagination');
      if (next) seen.add(next);
    } while (next);
    return records;
  };
  const results = await Promise.all(['cycle', 'recovery', 'activity/sleep', 'activity/workout'].map(collection));
  return summarizeWhoop(...results);
}

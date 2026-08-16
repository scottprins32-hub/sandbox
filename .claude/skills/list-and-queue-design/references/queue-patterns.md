# Work queues: claiming, ageing, and draining

A list is browsed and never finishes. A **queue is meant to be emptied**, by one or more people working it,
and that changes the engineering completely: two operators can collide on the same item, an item can be
claimed and then abandoned, a low-priority item can wait forever, and a broken item can cycle through the
same failure ten thousand times while real work queues up behind it. None of those failures are visible in a
screenshot and none of them are fixed in CSS.

`list-and-queue-design/SKILL.md` owns the screen — the default sort, which columns earn a place, what a row
does when clicked, what a bulk action means, and move 11's short version of claiming. This file owns the
mechanics underneath: the claim protocol, push versus pull, the ageing function, the state machine, and what
happens when the phone working the queue is in a basement. Row *styling* in each state belongs to
`ui-signifiers-and-states`; density values to `spacing-and-layout`; undo-over-confirmation, optimistic UI and
the latency thresholds to `friction-and-flow`; how to define and instrument any metric named here to
`behavioral-metrics`.

The user is almost always in `ux-psychology`'s *professional daily tool* or *assigned tool* archetype. They
did not choose this software and cannot leave it, so absence of complaints is not evidence of anything, and
every mechanism below has a person on the other end of it.

## 1. The shape of a queue row

Everything in this file refers back to one table. Stack-neutral, PostgreSQL-flavoured; the column set is the
point, not the dialect.

```sql
CREATE TABLE work_items (
  id                bigserial PRIMARY KEY,
  kind              text        NOT NULL,          -- routing: 'refund', 'inspection', 'kyc_review'
  pool              text        NOT NULL,          -- which group of workers may take it (section 2)
  payload           jsonb       NOT NULL,

  -- lifecycle (section 5) — one explicit column, never inferred from a combination of nullables
  state             text        NOT NULL DEFAULT 'available'
                    CHECK (state IN ('available','claimed','in_progress',
                                     'blocked','done','failed','dead')),

  -- scheduling and ageing (section 4)
  priority          text        NOT NULL DEFAULT 'normal'
                    CHECK (priority IN ('urgent','high','normal','low')),
  available_at      timestamptz NOT NULL DEFAULT now(),  -- when it may next be claimed; backoff moves it
  first_available_at timestamptz NOT NULL DEFAULT now(), -- never moves; this is what "age" means
  due_at            timestamptz,                          -- resolved deadline, not a duration

  -- the ageing-aware sort key. Section 4 derives it; it lives here so the index below can be built.
  queue_key         double precision GENERATED ALWAYS AS (
                      EXTRACT(EPOCH FROM (first_available_at - 'epoch'::timestamptz))
                        - 3600 * CASE priority          -- priority_weight / age_rate, in hours
                                   WHEN 'urgent' THEN 50
                                   WHEN 'high'   THEN 30
                                   WHEN 'normal' THEN 15
                                   ELSE 5
                                 END
                    ) STORED,

  -- claiming (sections 2–3)
  claimed_by        text,
  claimed_at        timestamptz,
  claim_expires_at  timestamptz,                   -- the lease. NULL when unclaimed
  assigned_to       text,                          -- push assignment; independent of claiming

  -- failure handling (section 5)
  attempts          int         NOT NULL DEFAULT 0,
  last_error        text,
  blocked_reason    text,
  blocked_owner     text,
  blocked_until     timestamptz,

  -- terminal record (section 5)
  resolved_by       text,
  resolved_at       timestamptz,
  outcome           text,

  CONSTRAINT claim_is_complete CHECK (
    (state IN ('claimed','in_progress'))
      = (claimed_by IS NOT NULL AND claim_expires_at IS NOT NULL)),
  CONSTRAINT blocked_has_an_owner CHECK (
    state <> 'blocked'
      OR (blocked_reason IS NOT NULL AND blocked_owner IS NOT NULL AND blocked_until IS NOT NULL)),
  CONSTRAINT done_is_attributed CHECK (
    state NOT IN ('done','dead') OR (resolved_by IS NOT NULL AND resolved_at IS NOT NULL))
);

-- The claim query must be an index lookup, not a scan, or contention gets worse under load.
CREATE INDEX work_items_claimable ON work_items (pool, queue_key)     -- queue_key derived in section 4
  WHERE state = 'available';
CREATE INDEX work_items_expiring ON work_items (claim_expires_at)
  WHERE state IN ('claimed','in_progress');
```

Three decisions in there are load-bearing and usually got wrong:

- **`available_at` and `first_available_at` are different columns.** Backoff and blocking push `available_at`
  forward; age is measured from `first_available_at`. Collapse them into one and every retry resets the
  item's age, which hides exactly the items that have been failing longest.
- **`assigned_to` and `claimed_by` are different columns.** Assignment is "this is yours to do"; a claim is
  "I am doing it right now, hands on". A system with only one of them cannot express "assigned to Sara,
  currently being worked by Tom because Sara is off" — and that situation happens weekly.
- **The `CHECK` constraints make the illegal states unrepresentable.** Six nullable columns describe 64
  combinations of which about seven are legal; without constraints, the other 57 all eventually occur in
  production, and each one costs an afternoon.

## 2. Claiming

### Why an unclaimed shared queue fails

With no claim, the queue is a shared mutable resource with no mutual exclusion, worked by humans who cannot
see each other. Three things follow, in order of how expensive they are:

1. **Duplicated work.** Two operators open the same item within the same minute and both do it. On a screen
   queue that costs ten minutes. On a dispatch queue it costs two crews driving to the same address.
2. **Duplicated side effects.** Two refunds. Two emails to the same customer with different answers. Two
   inspections logged against one visit, which then fails an audit for reasons nobody can reconstruct.
3. **Arguments.** The part nobody models. When collisions happen weekly, operators start protecting
   themselves — a shared spreadsheet of "who has what", a Slack channel where people call out item numbers, a
   habit of grabbing a batch first thing in the morning so nobody else can take them. Every one of those
   workarounds is a specification for the claim feature you did not build, and each makes the real queue less
   accurate than the shadow one.

The tell that you need this is in `SKILL.md`'s decide-first list: if the operator keeps their own note of
where they got to, or asks in chat before starting an item, the queue has no claim model.

### The claim model

A claim is a **lease**, not a lock: it is held for a bounded time and expires. That single property is what
separates a queue that self-heals from one that leaks.

| Field | Meaning | Why it exists |
|---|---|---|
| `claimed_by` | Who holds it | Shown in the UI so the collision is visible before it happens |
| `claimed_at` | When they took it | Ages the claim; drives the "held for 42 minutes" display |
| `claim_expires_at` | When the lease lapses | An abandoned claim returns to the pool instead of blocking the item forever |

Store the expiry as an absolute timestamp rather than deriving it from `claimed_at` plus a constant. Lease
length varies by item kind and gets extended by heartbeats, and a derived expiry means every reader
re-implements that logic and one of them gets it wrong.

**Set the lease from the p95 of actual handling time for that kind of work, not the mean.** Too short and
items get yanked out from under someone mid-edit, which teaches operators to distrust the tool and to hoard
claims defensively. Too long and every laptop closed at 5pm parks an item until morning. If you have no data
yet, start at roughly three times the expected handling time, instrument `claim_expiry_rate` (section 6),
and tune.

### The naive claim races, and exactly where

```sql
-- Worker A                                    -- Worker B (milliseconds later)
SELECT id FROM work_items                      SELECT id FROM work_items
 WHERE state = 'available'                      WHERE state = 'available'
 ORDER BY queue_key LIMIT 1;   -- 8842          ORDER BY queue_key LIMIT 1;   -- 8842

UPDATE work_items SET claimed_by = 'a',        UPDATE work_items SET claimed_by = 'b',
       state = 'claimed' WHERE id = 8842;             state = 'claimed' WHERE id = 8842;
```

Both workers get 8842. This is not a bug in anyone's isolation level — under `READ COMMITTED` the `SELECT`
takes no lock at all, so nothing prevents B from reading a row A is about to take. The two `UPDATE`s
serialise correctly and the second one silently overwrites the first. A believes it holds the item; the
database says B does.

**Adding the predicate to the `UPDATE` closes the correctness hole but not the throughput hole:**

```sql
UPDATE work_items SET claimed_by = :me, state = 'claimed'
 WHERE id = :id AND state = 'available'
RETURNING id;                    -- zero rows = you lost the race
```

Now B's update matches zero rows and B knows it lost. Correct, and it is exactly the right shape for the
*human* case in the next subsection, where the item id came from a click. It is the wrong shape for a worker
pool: B has to go back and re-run the whole selection query, and with N workers polling the head of the same
queue, N−1 of them lose every round and retry. That is a thundering herd on one hot row.

Reaching for plain `FOR UPDATE` makes it worse rather than better. B blocks until A commits, then re-evaluates
its predicate, finds the row no longer available, and starts over — the entire worker pool serialised through
one row, with lock waits instead of retries.

### `FOR UPDATE SKIP LOCKED`

`SKIP LOCKED` tells the executor to silently step over rows that are row-locked by another uncommitted
transaction rather than waiting for them. Combined with `FOR UPDATE`, `ORDER BY` and `LIMIT`, it turns the
table into a concurrent queue: each worker locks the best row nobody else has locked, and workers never see
each other.

```sql
BEGIN;

WITH next AS (
  SELECT id
    FROM work_items
   WHERE state = 'available'
     AND pool = ANY(:my_pools)
     AND available_at <= now()
   ORDER BY queue_key                    -- section 4; the ageing-aware sort key
   LIMIT 1
   FOR UPDATE SKIP LOCKED                -- lock it, or skip past anything already locked
)
UPDATE work_items w
   SET state            = 'claimed',
       claimed_by       = :worker,
       claimed_at       = now(),
       claim_expires_at = now() + :lease::interval,
       attempts         = w.attempts + 1     -- incremented at claim, not at failure (section 5)
  FROM next
 WHERE w.id = next.id
RETURNING w.*;

COMMIT;                                   -- lock released here; hold the transaction open no longer
```

Zero rows returned means "nothing available to you right now" — which is not the same as "the queue is
empty", and section 7's drained state has to say which.

Six things to know before shipping this:

- **Availability.** PostgreSQL added it in 9.5 ("Add `SELECT` option `SKIP LOCKED` to skip locked rows"),
  MySQL in 8.0 alongside `NOWAIT`, and Oracle has had it far longer. SQL Server's equivalent is the hint pair
  `WITH (UPDLOCK, READPAST)`. SQLite has no row-level locking, so a queue there is a single-writer design
  instead.
- **Commit immediately after claiming.** The row lock lives until the transaction ends. Claim, commit, then
  let the human spend twenty minutes reading the item. Holding a database transaction open for the duration
  of human work is how a queue takes down the database it lives in. The *lease*, not the lock, is what
  protects the item for those twenty minutes.
- **Ordering becomes best-effort under contention.** If A holds the best row, B gets the second-best. For a
  human queue that is invisible and irrelevant. For anything where strict order is a business rule, this
  pattern is the wrong tool.
- **The predicate must be indexed.** Without the partial index from section 1 every claim scans, and scans get
  slower exactly when the queue is deep — the moment you need throughput most.
- **`FOR UPDATE` locks rows in the table being selected**, so if the `SELECT` joins other tables, use
  `FOR UPDATE OF work_items` or you will lock rows you did not mean to.
- **It does not replace the lease.** `SKIP LOCKED` protects the claim *transaction*; the lease protects the
  *work*. A system with skip-locked claiming and no expiry still leaks items when a worker dies.

### Claim-on-open, for a human queue

When the item id came from a click there is no selection to race, only the specific row. Use the
conditional
`UPDATE`, and fold expiry into the predicate so an abandoned claim is reclaimable without waiting for a
sweeper:

```sql
UPDATE work_items
   SET state = 'claimed', claimed_by = :me, claimed_at = now(),
       claim_expires_at = now() + interval '20 minutes'
 WHERE id = :id
   AND (state = 'available'
        OR (state IN ('claimed','in_progress') AND claim_expires_at < now()))
RETURNING claimed_by, claimed_at, claim_expires_at;
```

Zero rows means somebody live holds it. Do not fail silently and do not show a generic error: re-read the row
and say who has it, since that is the only information that lets the operator decide what to do next.

Claim on **open**, not on first edit. Opening is the intent signal, and the whole point is to prevent two
people reading the same item at the same time — waiting for an edit means the collision has already happened.

### Heartbeats and expiry

```ts
// Renew at a third of the lease so two consecutive misses are survivable.
const HEARTBEAT_MS = leaseMs / 3;

function startHeartbeat(itemId: string) {
  const tick = async () => {
    if (document.visibilityState !== "visible") return;   // a backgrounded tab is not working
    const r = await fetch(`/api/items/${itemId}/heartbeat`, { method: "POST" });
    if (r.status === 409) onClaimLost(await r.json());    // someone took it over — section 2, stealing
  };
  const h = setInterval(tick, HEARTBEAT_MS);
  return () => clearInterval(h);
}
```

Server-side the heartbeat is `UPDATE … SET claim_expires_at = now() + :lease WHERE id = :id AND claimed_by =
:me` — the `claimed_by` predicate is what makes a heartbeat from a stale tab a no-op rather than a
resurrection.

**Warn the holder before the lease lapses rather than yanking it.** At 80% of the lease, a non-blocking notice
in the drawer: "Your hold on this expires in 4 minutes — Keep working". Silent expiry mid-edit is how someone
loses twenty minutes of typing and stops trusting the tool. Pair it with the drafts-survive rule from
`friction-and-flow` move 4: never lose what they typed, whatever the lease did.

**Expire lazily, sweep for hygiene.** Lazy expiry — evaluating `claim_expires_at < now()` in the claim
predicate — means an expired claim is reclaimable the instant it lapses, with no cron job that can silently
stop running. A periodic sweeper is still worth having, but for *bookkeeping*, not for correctness:

```sql
UPDATE work_items
   SET state = 'available', claimed_by = NULL, claimed_at = NULL, claim_expires_at = NULL
 WHERE state IN ('claimed','in_progress')
   AND claim_expires_at < now() - interval '1 minute'
RETURNING id, claimed_by;      -- log these: the expiry rate is a real signal (section 6)
```

If correctness depends on the sweeper running, the queue stalls the first time the sweeper's deploy fails.

### Showing claims, and stealing with attribution

A claim the operator cannot see is a claim that produces the same argument as no claim at all. In the row:

- **The holder's name in text**, not a colour and not an avatar alone — SC 1.4.1 Use of Color (A) means the
  claim state must survive greyscale, and an avatar with no name is unreadable to a screen reader.
- **How long they have held it.** "Sara Nkemi · 6 min" reads differently from "Sara Nkemi · 3 h", and the
  operator needs the difference to decide whether to wait or take over.
- **Dim the row, keep it readable and openable.** A claimed item opens read-only; the primary action is
  unavailable, with the reason in adjacent visible text rather than a tooltip
  (`ui-signifiers-and-states` move 10). Do not remove claimed rows from the list — `SKILL.md` move 9's rule
  applies: a row that vanishes makes the operator think they misread and go looking for it.

**A claim is a lease on an item, not a lock on a person.** Sara is at lunch, in a meeting, off sick, or was
pulled onto an incident. Blocking everyone else until her lease expires does not protect her work; it protects
nothing, and it produces the workaround where somebody pings a supervisor for a force-release or, worse, does
the work in another system entirely so the queue never learns about it.

So allow stealing, and make it attributable:

```
Sara Nkemi has had this for 42 minutes.
[ Take it over ]   Sara will be told you took it.
```

```sql
UPDATE work_items
   SET claimed_by = :me, claimed_at = now(), claim_expires_at = now() + :lease
 WHERE id = :id AND claimed_by = :previous_holder      -- optimistic: fails if it moved again
RETURNING claimed_by;
-- plus an append-only audit row: (item_id, 'claim_stolen', from=:previous_holder, by=:me, at=now())
```

Three properties make this humane rather than hostile: **it is recorded** (the audit row, permanently), **the
previous holder is told** (in-product, not only by a lapsed heartbeat), and **it is never silent**. The
takeover shows up in Sara's UI as an explicit event with a name attached, which is exactly what stops it
being used casually. Announce it to the person losing the claim through a `role="status"` live region as well
as visually, or a screen-reader user simply finds their actions rejected with no explanation
(`ui-signifiers-and-states/references/announcing-state.md`).

## 3. Assignment versus pull

**Push**: a supervisor, a rules engine or a round-robin sets `assigned_to`, and the worker sees a personal
list. **Pull**: `assigned_to` stays null and workers claim from a shared pool.

| | Push (assign) | Pull (take next) |
|---|---|---|
| Balances load | Only as well as the assigner's picture of who is free | Automatically — a worker who is busy or absent simply does not pull |
| Skill and language routing | Native. Route the Dutch KYC case to someone who reads Dutch | Only via pools; finer-grained routing needs push |
| Fairness policy | Expressible: round-robin, equal counts, protected capacity for a new starter | Emergent, and emergently unfair (below) |
| Worker autonomy | Low. Their day is decided for them | High. They pace themselves |
| Failure mode | The assigner is a bottleneck; items sit in one person's list while others idle | Cherry-picking; hard items age indefinitely |
| Absence handling | Needs explicit reassignment, and someone has to notice | Free |
| Planning | Workers can see and sequence their day | Nobody can promise when a specific item gets done |

**Use push** when routing depends on a skill, licence, language or territory the system knows about; when a
named person must own an item end-to-end for a customer relationship or a regulatory reason; when the work
has to be planned into a route or a shift; or when items are large enough that starting one is a commitment
of hours.

**Use pull** when the work is interchangeable, when the queue is worked by a shift rather than by individuals,
when arrival is spiky, and — crucially — when capacity varies unpredictably during the day. Pull is the
default for support, moderation, exception handling and any queue where "who does it" carries no information.

**Most mature systems land on a hybrid, and it is worth going there directly:** push at the *pool* level
(routing decides which group may work an item), pull *within* the pool (workers take the next one). That
buys skill routing without an assigner in the critical path, and it is why `pool` is a column in section 1.

### The fairness failure mode of pull

Given a browsable queue, people take the items they can finish. This is not laziness — it is a rational
response to being measured on throughput, to wanting a clean end to the shift, and to the fact that a
five-minute item is genuinely more satisfying than a two-hour one. The effect compounds: an item everyone
skips gets skipped again tomorrow, and again next week, and its age grows without bound while the queue's
median wait looks excellent.

The fixes, from strongest to weakest:

1. **Hide the queue and serve only the next item.** One button — "Get next" — and the worker gets whatever
   the sort says is next. Cherry-picking becomes impossible because there is nothing to pick from. This is
   the standard answer for high-volume interchangeable work, and it is also the most restrictive thing in
   this file: it removes the worker's discretion entirely. Justify it by the fairness requirement, offer an
   explicit **skip with a reason** rather than pretending nobody ever needs one, and read the ethics section
   in section 7 before shipping it.
2. **Sort by effective priority including age (section 4) and default the filter to it.** Cherry-picking
   is still possible but requires deliberate effort — re-sorting, scrolling past the top. Usually enough,
   because most cherry-picking is opportunistic rather than determined.
3. **Record skips and act on them.** A `skip_count` per item, incremented when someone opens it and puts it
   back. A high skip count is a *diagnostic, not a disciplinary record*: it means the item is genuinely hard,
   badly described, missing information, or routed to the wrong pool. Route items past a skip threshold to a
   supervisor for triage instead of leaving them to rot at the top of a sort nobody obeys.
4. **Measure the distribution, not the average.** Age at resolution, p95 and max, never the mean.
   Section 6.

### Work-in-progress limits

Cap how many items one person may hold at once, and enforce it server-side at claim time:

```sql
-- inside the claim transaction, before the UPDATE
WITH held AS (
  SELECT count(*) AS n FROM work_items
   WHERE claimed_by = :me AND state IN ('claimed','in_progress')
)
SELECT n < :wip_limit FROM held;    -- false → refuse the claim, and say why
```

Refuse with a message that names the blocker: "You're holding 3 items already. Finish or release one to take
another." A silent refusal reads as a bug.

**`wip_limit = 1` is right for most human queues.** Claiming five items and working one means four items are
invisible to everyone else while ageing, which is the same harm as cherry-picking arriving by a different
route. Raise it only where an item legitimately contains waiting — a callback, a lab result, a customer
reply — and even then prefer moving the waiting item to `blocked` with a `blocked_until` (section 5)
over letting it occupy a claim slot. WIP limits come from Kanban practice (David J. Anderson, *Kanban*,
2010); the queueing reason is in section 6: holding a batch increases lead time without increasing throughput.

## 4. Prioritisation and ageing

### A pure priority sort starves the bottom of the ladder

`ORDER BY priority DESC, created_at` is the default every queue starts with, and it has one property nobody
notices until it has been true for a year: as long as high-priority work arrives at least as fast as it is
worked, a low-priority item is *never* reached. Not "reached slowly" — never. Its position in the sort does
not improve with time, because time is only the tiebreaker within a priority band.

The operational reason to care is sharper than fairness: **an item worked late produces a complaint you can
answer; an item never worked produces a discovery.** Late gets you "this took three weeks" and an apology.
Never gets you a customer, an auditor or a regulator finding a request from eleven months ago that nobody
touched, and it is always *that specific item* under discussion — at which point "our median time to resolve
is four hours" is not a defence, it is an admission that you were watching the wrong number.

### Ageing as a priority head start

Make waiting time raise effective priority continuously:

```
score = priority_weight[priority] + age_hours × age_rate
```

with `priority_weight` = urgent 100, high 60, normal 30, low 10, and `age_rate` in points per hour. Both
items age, so what the rate actually controls is **how long a low-priority item waits behind freshly arriving
high-priority work before it overtakes it**. Derive it from that sentence instead of picking a number that
looks reasonable:

```
age_rate = (highest_weight − lowest_weight) / max_acceptable_extra_wait_hours
         = (100 − 10) / 45 h
         = 2 points per hour
```

Two points an hour means a `low` item that has waited 45 hours ranks alongside an `urgent` item that just
arrived. State the parameter that way in the config and in the runbook — "a low item never waits more than
about 45 hours behind fresh urgent work" is a sentence an operations manager can agree or disagree with. "2.0"
is not.

### Making it indexable

Recomputing a score containing `now()` on every read prevents indexing it: PostgreSQL requires an `IMMUTABLE`
expression for an index or a generated column, and `now()` is not. For queues of a few thousand rows,
computing at query time is fine. Past that, use the algebra.

Sorting descending by `base + rate × (now − t)` is, since `rate × now` is the same for every row,
identical to sorting descending by `base − rate × t`, which is identical to sorting **ascending** by
`t − base/rate`. So express priority as a **head start on the arrival time** — a high-priority item behaves
exactly like an item that arrived earlier — and you get a stored, indexable, time-independent sort key.
Section 1 declares it inline; on an existing table it is a migration:

```sql
ALTER TABLE work_items
  ADD COLUMN queue_key double precision
  GENERATED ALWAYS AS (
    EXTRACT(EPOCH FROM (first_available_at - 'epoch'::timestamptz))
      - 3600 * CASE priority                       -- priority_weight / age_rate, in hours
                 WHEN 'urgent' THEN 50             -- 100 / 2
                 WHEN 'high'   THEN 30             --  60 / 2
                 WHEN 'normal' THEN 15             --  30 / 2
                 ELSE 5                            --  10 / 2
               END
  ) STORED;
```

**Writing that the obvious way is rejected, and the error does not explain itself.** Subtracting the head
start as an interval — `first_available_at - make_interval(hours => CASE priority …)` — fails with
`ERROR: generation expression is not immutable`. The reason is that `timestamptz - interval` is marked
`STABLE`, not `IMMUTABLE`: subtracting an interval from a `timestamptz` has to consult the session's
`TimeZone` to land on the right side of a DST boundary, so "50 hours earlier" is not a fixed number of
seconds and the same row could generate different values for different sessions. Casting to `timestamp`
first does not rescue it, because the `timestamptz → timestamp` cast is itself `STABLE` for the same reason.
What *is* immutable is `timestamptz − timestamptz`, which yields elapsed time no zone can change — hence
subtracting the epoch first and doing the head-start arithmetic in seconds. If you would rather keep
`queue_key` as a human-readable `timestamptz`, the other way out is a `BEFORE INSERT OR UPDATE` trigger,
which immutability does not constrain at all; the cost is machinery a generated column does not need, plus a
backfill every time the expression changes.

`queue_key` is a *virtual arrival time*, in epoch seconds. An urgent item pretends it arrived 50 hours before
it did; a low item gets 5 hours. Sort ascending, tiebreak on `id`, and the ageing is exact, continuous, free
to compute and covered by the partial index in section 1. Changing `age_rate` becomes a migration rather than
a config change, which is a fair trade for a sort that costs nothing to evaluate.

Breaches are a step, not a slope, so they go in front as a bucket rather than into the linear term — the same
shape as `SKILL.md` move 1:

```sql
SELECT * FROM work_items
 WHERE state = 'available' AND pool = ANY(:my_pools) AND available_at <= now()
 ORDER BY (due_at IS NOT NULL AND due_at < now()) DESC,   -- breached first
          queue_key ASC,                                  -- then ageing-aware priority
          id ASC                                          -- then stability (SKILL.md move 1)
 LIMIT 50;
```

### The parameters that matter

- **`age_rate`**, derived above. The only parameter with a real business meaning; everything else is shape.
- **The priority ladder.** Three levels in practice. With five, people use two and argue about the middle
  one, and the ladder stops carrying information.
- **A cap on the head start.** Uncapped ageing means an item stuck for a year eventually outranks a genuine
  emergency. Cap it — or better, treat crossing the cap as a *symptom*: an item that has aged past your
  longest acceptable wait is not a prioritisation problem, it is a broken item, and it should leave the queue
  for human triage rather than climbing to the top of it.
- **What resets the clock.** When an item is requeued after a failure, blocked and released, or rejected and
  returned, does its age restart? Keeping `first_available_at` is fairer to the person waiting; resetting is
  fairer to the queue's own statistics. Section 1 keeps it, deliberately. Whichever you choose, **decide
  it once, write it down, and show the original arrival in the UI** — somebody will ask why item 8842 is
  at the top, and "the ageing function" is only an acceptable answer if the inputs are visible.

### Deadlines and breach

- **Resolve `due_at` at creation and store the timestamp**, not a duration. An SLA of "8 business hours"
  depends on a calendar, holidays and a timezone; if it is stored as a duration, every reader re-implements
  that calendar and one of them gets it wrong. Recompute and store on the rare occasions the class changes.
- **Surface `at_risk`, not just `breached`.** A dashboard that lights up after the miss is a report; the
  control is a state that appears while there is still time to act — say, at 75% of the window consumed. Put
  it in the same bucketed sort.
- **A breached item is still work.** Breach must not silently change an item's fate, drop it out of the
  default filter, or move it to a "missed" tab that nobody opens. That is how "we breached it anyway" becomes
  "we never did it".

## 5. States

### Explicit, not inferred

Inferring status from a combination of nullable columns — `claimed_by IS NOT NULL AND resolved_at IS NULL AND
NOT failed` — produces a system where the number of representable states vastly exceeds the number of legal
ones, where every query re-implements the definition slightly differently, and where nobody can answer "how
many are blocked" without reading three files. One `state` column plus the constraints from section 1 makes the
question answerable and the illegal combinations impossible.

| State | Meaning | Enter by | Must record |
|---|---|---|---|
| `available` | In the pool, claimable now | Creation; lease expiry; unblock; retry backoff elapsing | `available_at` |
| `claimed` | Someone has it, not yet working | Claim (section 2) | `claimed_by`, `claimed_at`, `claim_expires_at` |
| `in_progress` | Actively being worked | First substantive action | — (keeps the claim fields) |
| `blocked` | Cannot proceed, waiting on something outside the queue | Explicit operator action | `blocked_reason`, `blocked_owner`, `blocked_until` |
| `done` | Terminal, successful | Explicit operator action | `resolved_by`, `resolved_at`, `outcome` |
| `failed` | This attempt failed; will retry | Error path | `attempts`, `last_error`, new `available_at` |
| `dead` | Out of attempts; needs a human | Retry exhaustion | `resolved_by` = system, `last_error` |

Two rules on top of the table:

- **`done` is explicit and attributed, never inferred.** "The operator opened it" is not "the operator handled
  it". Inferred completion produces a queue that drains without the work happening, and no audit trail to
  discover it with. Every terminal transition writes an append-only event row — who, when, from what, to what
  — because "who marked this done" is the first question in every incident and a mutated column cannot answer
  it.
- **Separating `claimed` from `in_progress` earns its keep** only if something distinguishes them. It does:
  time-to-first-action is a real signal (people claim a batch and then start one), and an item claimed but
  never started can safely have a shorter lease than one actively being edited.

### `blocked` needs a reason, an owner and a date, or it is a black hole

`blocked` is where a queue's uncomfortable items go, and left unstructured it becomes the drawer nobody opens:
the depth graph looks great, the work is not done, and the discovery happens months later.

- **Reason as an enum plus free text.** The enum is what makes it countable, and the top blocked reason is
  always a product backlog item: "waiting on customer" means your intake form is missing a field; "needs
  supervisor approval" means your permission model is too narrow; "missing document" means the upstream
  process leaks.
- **An owner — a named person or team, not the queue.** Blocked with no owner means nobody is responsible for
  unblocking, and responsibility that belongs to everyone belongs to no one. The owner may well be outside
  the queue's own team; that is fine, and it is the point.
- **A `blocked_until` date, after which it returns to `available` automatically** with its block history
  intact and its age preserved (section 4). "Waiting on a customer reply" is three days, not forever.
- **The black-hole test:** can you produce, right now, a list of every blocked item, sorted by how long it has
  been blocked, with a named owner beside each? If not, blocked is where your work is dying. Give the blocked
  list its own oldest-item-age metric (section 6) and put it in front of whoever owns the queue.

### Retry, backoff, and the dead-letter state

For queues with automated processing — or human queues where an item can fail on a downstream system — the
retry loop needs three parts, and skipping any one produces a specific failure.

**Attempt counting, incremented at claim rather than at failure.** A worker that crashes, is OOM-killed, or
loses power never reaches its failure handler. Increment on the way in and a crash still burns an attempt;
increment on the way out and a poison item that reliably kills its worker retries forever, consuming the pool.
This is why the `UPDATE` in section 2 does `attempts = w.attempts + 1`.

**Exponential backoff with jitter.**

```sql
UPDATE work_items
   SET state        = CASE WHEN attempts >= :max_attempts THEN 'dead' ELSE 'failed' END,
       last_error   = :error,
       claimed_by   = NULL, claimed_at = NULL, claim_expires_at = NULL,
       -- `dead` is terminal, so section 1's done_is_attributed constraint demands both of these
       resolved_by  = CASE WHEN attempts >= :max_attempts THEN 'system' ELSE resolved_by END,
       resolved_at  = CASE WHEN attempts >= :max_attempts THEN now()    ELSE resolved_at END,
       available_at = now()
                    + (least(:base_seconds * power(2, attempts), :cap_seconds)
                       * random())::int * interval '1 second'    -- full jitter
 WHERE id = :id;
```

Attribute the death in the same statement that causes it. `dead` is one of the two terminal states section 1
constrains with `done_is_attributed`, so an `UPDATE` that moves a row there without writing `resolved_by` and
`resolved_at` aborts on the constraint — and it aborts on exactly the items whose retries have run out, which
is the path you least want failing.

Plain exponential backoff makes every worker that failed during the same outage retry at the same instant,
so the recovering dependency is hit by the entire backlog simultaneously and fails again. Multiplying the
delay by a uniform random factor spreads them out; AWS's "Exponential Backoff And Jitter" (Marc Brooker, 2015)
is the standard write-up, and full jitter — a random value between zero and the computed delay — is the
variant to reach for by default. Cap the delay so an item is not scheduled a week out by arithmetic.

**A dead-letter state a human actually reviews.** After `max_attempts`, `dead` — never delete, and never
leave it cycling. A poison item that retries forever burns worker capacity continuously and hides real
work behind it; one that is deleted takes the evidence with it.

The part that is usually missing: **the dead-letter queue is itself a queue, and needs everything in this
file.** An owner, an oldest-item-age metric, a review cadence, and a **redrive** action that fixes the cause
and returns the item to `available` with `attempts` reset. A dead-letter table nobody opens is a delete with
extra storage costs, and it will be discovered by whoever is investigating why a customer never got their
refund.

**Retries need idempotency, or the retry is the bug.** If attempt 1 sent the email and then timed out on the
response, attempt 2 must not send it again. Derive a stable idempotency key from the item and the operation —
not from the attempt number — and have the side-effecting service store it and return the original result on
replay. This is the same key the offline outbox uses in section 8, for the same reason: the dangerous
failure is not "the request failed", it is "the request succeeded and the response was lost".

## 6. Throughput and queue health

Name these, instrument them, and put the definitions somewhere they cannot drift. `behavioral-metrics` owns
how to define a metric honestly, how to pair it with a guardrail, and what to do when the sample is too small
for a test — do not re-derive any of that here.

| Metric | Definition | What it tells you |
|---|---|---|
| **Queue depth over time** | Count of `available` + `blocked`, sampled on an interval | A depth of 40 is meaningless; 40 rising and 40 falling are opposite situations. Always a time series, never a number on a card |
| **Oldest-item age** | `now() − first_available_at` for the oldest non-terminal item, per pool | The number that actually matters, and the one nobody dashboards. Averages hide starvation perfectly: an excellent median plus one 90-day-old item is a 90-day-old item |
| **Time to claim** | `claimed_at − first_available_at` | Capacity and routing. Rising means not enough people, wrong pools, or a sort nobody trusts |
| **Time to resolve** | `resolved_at − claimed_at` | Task difficulty and tool quality. Splitting this from time-to-claim is what separates "we are understaffed" from "this screen is slow" — a single end-to-end number cannot distinguish them |
| **Claim expiry rate** | Claims that lapse ÷ claims taken | Items are too hard, leases are too short, or workers are being interrupted. It rises *before* depth does, which makes it the best early warning in the set |
| **Rework rate** | Items reopened, corrected or disputed after `done` | The guardrail on every throughput improvement. Catches "we made the queue drain faster by doing worse work", which is the standard way a queue optimisation goes wrong |
| **Skip and steal counts** | Per item and per pool | Routing diagnostics (section 3). Per *item*, not per person — see section 7 |
| **Blocked-list oldest age** | Same as oldest-item age, over `blocked` | Whether `blocked` is a state or a black hole (section 5) |

Three pieces of queueing theory make depth legible, and all three are old, robust and directly actionable:

**Little's Law** (John D. C. Little, "A Proof for the Queuing Formula: L = λW", *Operations Research* 9(3),
1961): the average number of items in a system equals the arrival rate times the average time each spends in
it. Two uses. First, you can compute the wait implied by your current depth without measuring it: 200 items
waiting and 25 completed per hour means an average wait of about 8 hours — if the SLA is 4 hours you are
already breaching, before a single ticket has been filed about it. Second, and more bluntly: if arrivals
exceed completions, no amount of working faster within the current process fixes it. The queue is not a
motivation problem.

**Wait time is non-linear in utilisation.** For the simplest queue (M/M/1), average wait is
`ρ/(1−ρ) × service time`. At 50% utilisation the wait is one service time; at 90% it is nine; at 95% it is
nineteen. A team staffed to exactly its arrival rate does not have a short queue — it has an unbounded one.
Plan for utilisation well under 1 and treat "everyone is busy all day" as a warning rather than an
achievement.

**Variability is the second lever, and usually the cheaper one.** Kingman's heavy-traffic approximation
(J. F. C. Kingman, "The single server queue in heavy traffic", *Mathematical Proceedings of the Cambridge
Philosophical Society* 57(4), 1961) generalises the above to arbitrary arrival and service distributions, and
in its familiar "VUT" form the wait is a product of a **utilisation** term, a **variability** term and the
**service time**. The practical consequence: a queue mixing two-minute items with three-hour items behaves far
worse than either would alone, because the variability term dominates. **Splitting a heterogeneous queue by
size is often a bigger win than adding people**, costs nothing, and is invisible to anyone looking only at
the average.

None of this licenses a per-person throughput dashboard; see section 7.

## 7. The human layer

### An infinite backlog is a design choice, and a bad one

A queue UI that displays its true depth tells a worker, at the start of every session and continuously
throughout it, that the work cannot be finished. The mechanism is the **goal-gradient effect** — effort rises
as perceived distance to the goal falls (Hull, 1932; demonstrated in consumers by Kivetz, Urminsky & Zheng,
2006) — running in reverse: with no visible finish line there is no gradient to climb.

Stated honestly, because this set grades its evidence: the goal-gradient effect itself is well supported
(`ux-psychology/references/principles.md` carries the grading), but its application to a work-queue header
is inference rather than a measured result, and no published figure for how much an unbounded backlog slows
queue work could be found. Treat it as a strong design prior, not a citation, and if it matters to your
argument, measure it locally with `behavioral-metrics` rather than quoting anyone.

What follows from it is cheap either way:

- **Show a bounded batch, not the depth.** Render 25 items, not 4,312. The total stays available — a queue
  that hides how much work exists is dishonest and the operator will find out — but it is secondary text,
  not the headline, and it is not what goes in the tab title or the browser badge. "25 shown · 4,312 total"
  is the shape.
- **Shape the goal to a session, and derive it from arithmetic.** "About 40 to clear today" computed from
  actual arrival rate and today's staffing is a goal someone can reach. A number invented by management is a
  quota with a progress bar drawn on it, and a goal that arithmetic says is unreachable is worse than no goal
  — it converts every day into a failure.
- **Never turn the session goal into a per-person quota** without the people whose job it is owning that
  decision explicitly. A UI can make a target feel like a fact.

### "All caught up" is a real feature

`SKILL.md` move 5 owns the copy and the four distinct empty states. Two things belong here:

**It has to be true, and the honest version names its scope.** "Caught up" means *nothing available to you
right now*, which is not the same as an empty queue. State what is elsewhere:

```
You're all caught up.
47 cleared today · nothing available in your pools.
12 items are blocked · 3 are being worked by other people · next batch expected 06:00.
```

A drained state that quietly hides work sitting in `blocked` is a lie the operator discovers later, and it
costs more trust than the blank screen would have.

**Offer the obviously useful next thing, not a dead end and not a grind.** Tomorrow's list, the team pool, the
blocked list they own. This is the only moment in the day the tool tells someone they are finished; it is
worth getting right, and it must stay an accurate completion signal rather than becoming a reward mechanic
(`habit-loop-design` says the same from the other side — no streak for clearing a queue, no confetti on the
400th item).

### Interruptions and breaks are the normal case

Queue work is interrupted constantly — a phone call, a walk-in, a colleague, a shift change. Design for it
rather than around it:

- **Persist everything on interruption:** the draft, the scroll position, the claim, the filter state. This is
  `friction-and-flow` move 4's preserve-input rule applied to a whole session.
- **The lease should survive a normal break.** A 15-minute lease with a 30-minute lunch means every afternoon
  starts by re-claiming everything, and it teaches people to keep a tab warm on purpose, which defeats the
  heartbeat entirely.
- **Offer an explicit "pause my claims"** so a break is a first-class action rather than something the system
  detects and punishes.

### The ethical line

**Anything that measures individual throughput is a monitoring feature acting on someone who cannot decline
it.** The worker cannot refuse it; refusing means not having the job. Run test 5 of
`ethical-persuasion-audit` — the subject test — before building it, and clear all five questions:
disclosure in plain language, reciprocity (does the subject get anything from it?), access and contest (can
they see and correct their own record?), proportionality (is there a less invasive design that serves the
same purpose?), and purpose limitation enforced in code.

The concrete failure this catches, which is common enough to name: **a per-item timer built for capacity
planning becomes a performance ranking six months later, because the data was sitting there and someone asked
for a chart.** Purpose limitation "enforced in code" means the aggregate is queryable and the per-person
series is not, or is aggregated after 30 days, or is visible to the worker before it is visible to their
manager. A policy in a document does not survive a new dashboard request; a schema does.

Specific things to weigh:

- **Pacing.** A queue that serves the next item faster when you work faster is a treadmill with no visible
  speed control. If the tool sets the pace, the pace has become a management decision wearing a UI, and it
  should be argued as one, by the people who own it, in the open.
- **Serve-only-next (section 3).** Genuinely justified by fairness, and genuinely a removal of autonomy.
  Ship the skip-with-reason escape hatch, and do not also count skips against the individual.
- **Leaderboards, streaks, badges, confetti.** No. `ux-psychology`'s archetype table rules out engagement
  mechanics for assigned-use tools generally; on a queue it is worse than condescension, because it converts
  throughput into a competition nobody can opt out of and quietly penalises whoever takes the hard items.
- **What is fine:** showing a worker *their own* numbers, privately, with the queue's aggregate beside them
  for context and no ranking. That is reciprocity — the data flows back to the person it came from — and it
  is the version that survives the subject test.

## 8. Offline and unreliable networks

Queues are worked in basements, lifts, warehouses, rural roads and hospital sub-levels, usually on a phone,
often one-handed. `ux-psychology`'s *assigned / field tool* archetype: legibility in bad conditions, offline
tolerance, forgiving input.

**`navigator.onLine` is not a connectivity check.** It reports whether the device has a network interface, not
whether your server is reachable — captive portals, dead cell edges and VPN drops all report `true`. Derive
connectivity from your own traffic: "online" means a request to your API succeeded within the last N seconds.
Use the `online`/`offline` events as a *hint* to trigger a flush attempt, never as the source of truth.

### Claiming without a network

You cannot take a lease you cannot register. Two honest models, and the choice depends on the work:

**Pre-claim a batch while connected.** "Take today's route — 12 stops" claims all twelve with a lease
covering the expected offline window. Correct for scheduled field work, because the offline period is
predictable and the batch is the unit of work anyway. Make the lease generous: an eight-hour route needs a
lease longer than eight hours, and expiring items out from under someone with no signal is the cruellest
possible version of section 2's expiry rule.

**Optimistic local claim, reconciled on reconnect.** Correct for opportunistic work, and it must be able to
lose. The UI has to be honest about the difference:

```
Claimed on this device — not yet confirmed
```

**Never render an unconfirmed claim identically to a confirmed one.** That is a false affordance in
`ui-signifiers-and-states` move 1's exact sense, and here it costs a duplicated site visit. Distinguish it
with text and an icon, not colour alone (SC 1.4.1), and announce transitions through a `role="status"` region
so the state reaches someone using a screen reader in bad light with one hand full.

### The outbox

Persist **intents**, not resulting state. "Mark 8842 done, outcome = repaired, note = …" survives a server
rejection with the human's meaning intact; a locally-mutated row reading `state = 'done'` does not, and cannot
be replayed or explained.

```ts
type OutboxEntry = {
  id: string;              // client-generated UUID — this is the idempotency key
  itemId: string;
  op: "claim" | "start" | "complete" | "block" | "note" | "photo";
  body: unknown;
  deviceTime: number;      // device clock: display only, never used to resolve conflicts
  seq: number;             // monotonic per device — orders this device's own actions
  attempts: number;
  lastError?: string;
  state: "pending" | "sending" | "conflict" | "done";
};
```

```ts
async function flush(db: IDBDatabase, api: Api) {
  for (const entry of await pending(db)) {                    // strictly in `seq` order
    await mark(db, entry.id, "sending");
    try {
      const res = await api.post(`/items/${entry.itemId}/${entry.op}`, entry.body, {
        headers: { "Idempotency-Key": entry.id },             // the whole point
      });
      await mark(db, entry.id, res.conflict ? "conflict" : "done", res);
      if (res.conflict) surfaceConflict(entry, res);          // never silent — section 8, conflicts
    } catch (err) {
      await bumpAttempts(db, entry.id, err);                  // exponential backoff + jitter, as section 5
      break;                                                  // stop on failure; order matters
    }
  }
}
```

Five details do the work:

- **The idempotency key is generated on the device, before the first send.** The dangerous failure is not "the
  request failed" — it is "the server committed and the response was lost", which is the single most common
  offline bug and produces double refunds, double dispatches and double emails. With a stable key the server
  recognises the replay and returns the original result. Same mechanism as section 5's retries.
- **Flush in `seq` order and stop at the first failure.** "Claim, then complete" replayed out of order is a
  completion of an item you do not hold. Ordering per device is cheap; global ordering across devices is not
  needed and not worth attempting.
- **Device clocks are wrong.** A phone that has been off for a week, or has a manually set timezone, will
  produce timestamps from the future or the past. Send `deviceTime` for display and audit, order by `seq`
  within a device and by server receipt across devices, and **never resolve a conflict by comparing two
  devices' wall clocks**.
- **Flush on every plausible trigger**: reconnect hint, `visibilitychange` to visible, app start, an interval,
  and after any successful request. The Background Sync API (`SyncManager`) can flush when the app is not
  open, but it ships in Chromium and is absent from Safari and Firefox — so it is an enhancement layered on
  top of a foreground flush loop, never the mechanism itself.
- **Attachments upload separately.** Reference a photo by client id and let the state transition commit
  without it. Blocking "job complete" on a 4 MB upload over one bar of signal means the job is not recorded.

### Conflict resolution

Two devices acted on one item. The resolution depends entirely on what kind of thing was asserted:

| Conflict | Resolution |
|---|---|
| Two claims | First to reach the server wins. The loser gets a named message ("Tom has this — claimed 09:14") and, critically, **their queued follow-up actions are not discarded** — see the next row |
| Two completions, same outcome | Converge silently. Keep the first, record the second as a duplicate in the audit trail. Nothing went wrong from either human's point of view, so do not show either of them an error |
| Two completions, **different** outcomes | A real conflict about the world. Park the item in a `conflict` state holding both versions with both authors, and route it to a supervisor. **Never last-write-wins a decision** |
| Completion of an item cancelled server-side | The work physically happened. Accept it into a reconciliation state rather than dropping it — the crew really did visit the address, and the record has to say so |
| Two edits to the same free-text note | Keep both, attributed, rather than picking. Text is cheap; a lost hand-written observation from a site visit is not |

The general rule, and the one to carry away: **last-write-wins is acceptable for facts about a device — draft
text, a photo, a scroll position, a local preference — and unacceptable for decisions about the world.** A
decision that two people made differently is information, not a merge problem, and discarding one side
destroys the only evidence that the process is ambiguous.

### Making sync state visible

This is the part that gets cut for time and the part that determines whether the worker trusts the tool. A
field worker who cannot tell whether their morning's work is safe will either redo it or photograph the
screen — both of which you will find out about eventually.

- **Per item**, a state badge with a word, not just an icon or a colour (SC 1.4.1): *Saved on device* →
  *Sending* → *Synced* → *Conflict*. Announce transitions politely through a `role="status"` region
  (`ui-signifiers-and-states/references/announcing-state.md`).
- **Globally**, a real number and a real time: **"3 actions waiting to sync · last synced 14:02"**. A cloud
  icon with a slash through it tells a worker nothing they can act on. This belongs somewhere persistent, not
  in a toast that expires while the phone is in a pocket.
- **A manual "Sync now"**, sized for a gloved thumb (SC 2.5.8's 24×24 CSS px is the floor; 44×44 is the
  target for field use). Not because the automatic flush is inadequate, but because the worker needs a
  way to act on their own uncertainty before walking away from a job.
- **A hard, blocking warning before anything that destroys unsynced work** — sign out, switch account, clear
  data — naming the count. `beforeunload` is unreliable on mobile, so do not depend on it; the real
  protection is that the outbox is durable in IndexedDB and survives being killed.
- **Never show "Synced" until the server has said so.** An optimistic sync indicator is the one place
  optimistic UI is always wrong: `friction-and-flow` move 5's rule is that optimistic rendering requires
  failure to be detectable and the user to understand the rollback, and a worker who has already driven away
  can do nothing with either.

## 9. Before shipping a queue

- [ ] Claims are atomic. The worker-pool path uses `FOR UPDATE SKIP LOCKED` (or the platform equivalent); the
      click-to-open path uses a conditional `UPDATE` whose zero-row result is surfaced with the holder's name.
- [ ] No database transaction stays open for the duration of human work.
- [ ] Every claim has an expiry, expiry is evaluated lazily in the claim predicate, and the sweeper is
      bookkeeping rather than a correctness dependency.
- [ ] Lease length is set from p95 handling time, heartbeats renew at a third of it, and the holder is warned
      before it lapses instead of losing work.
- [ ] Claimed rows stay visible with the holder's name in text and a duration; they open read-only rather
      than disappearing.
- [ ] Stealing a claim is possible, recorded in an append-only audit row, announced to the previous holder,
      and never silent.
- [ ] Push versus pull is a decision someone made, not an accident. If pull, the cherry-picking mitigation is
      named — serve-next, age-aware default sort, or skip tracking.
- [ ] WIP is limited server-side, and the refusal message says what to do about it.
- [ ] The sort ages items so nothing at the bottom of the priority ladder can starve, and the ageing rate is
      documented as a sentence about maximum wait, not as a bare number.
- [ ] `first_available_at` survives retries, blocks and requeues, so age means age.
- [ ] Deadlines are stored resolved, and `at_risk` exists as a state before `breached` does.
- [ ] State is one explicit column with constraints, not a combination of nullables.
- [ ] `blocked` cannot be entered without a reason, an owner and a return date, and the blocked list has its
      own oldest-age metric with a name against it.
- [ ] `done` is explicit, attributed, and written to an append-only event log.
- [ ] Attempts increment at claim; backoff is exponential with jitter and capped; `dead` exists, is reviewed
      by a named human, and has a redrive path.
- [ ] Every retryable side effect is idempotent under a stable key.
- [ ] Oldest-item age is on the dashboard, per pool, alongside depth-over-time — not an average.
- [ ] Time-to-claim and time-to-resolve are tracked separately; claim-expiry rate and rework rate exist as
      guardrails (`behavioral-metrics` owns the definitions).
- [ ] The UI shows a bounded batch and a session-shaped goal derived from arithmetic, with the true total
      available but secondary.
- [ ] "All caught up" is reachable, accurate, names what is elsewhere, and offers a useful next step.
- [ ] Anything measuring individual throughput has cleared the subject test in `ethical-persuasion-audit`,
      with purpose limitation enforced by the schema rather than by a policy document.
- [ ] Offline: intents queue in a durable outbox with device-generated idempotency keys, flush in order,
      resolve conflicts by kind rather than by clock, and never last-write-wins a decision about the world.
- [ ] Sync state is visible per item and globally, in words as well as colour, with a manual sync and a
      warning before anything that would discard unsynced work.

## Sources and version notes

- **`SKIP LOCKED`** — PostgreSQL 9.5 release notes: "Add `SELECT` option `SKIP LOCKED` to skip locked rows"
  (Thomas Munro). MySQL 8.0 added `SKIP LOCKED` and `NOWAIT`; Oracle has supported it far longer. SQL Server's
  equivalent is `WITH (UPDLOCK, READPAST)`. SQLite has no row-level locking.
- **Little's Law** — John D. C. Little, "A Proof for the Queuing Formula: L = λW", *Operations Research*
  9(3), 1961, 383–387.
- **Utilisation and variability** — the `ρ/(1−ρ)` wait multiplier is the standard M/M/1 result. The
  generalisation is J. F. C. Kingman, "The single server queue in heavy traffic", *Mathematical Proceedings of
  the Cambridge Philosophical Society* 57(4), 1961, 902–904, commonly written as the VUT form.
- **Exponential backoff with jitter** — AWS Architecture Blog, Marc Brooker, "Exponential Backoff And Jitter"
  (2015); full jitter as the default variant.
- **WIP limits** — Kanban practice; David J. Anderson, *Kanban: Successful Evolutionary Change for Your
  Technology Business* (2010).
- **Goal-gradient effect** — Hull (1932) in animal learning; Kivetz, Urminsky & Zheng (2006) in consumers.
  Graded in `ux-psychology/references/principles.md`.
- **WCAG 2.2** — 1.4.1 Use of Color (A), which binds on every claim, sync and conflict badge here; 2.5.8
  Target Size (Minimum), 24×24 CSS px (AA), with 44×44 from SC 2.5.5 (AAA) as the field-use target.
- **Background Sync** — `SyncManager` ships in Chromium-based browsers and is implemented in neither Safari
  nor Firefox, which is why it can only be an enhancement over a foreground flush.

**Claims deliberately not made here:** no figure for how much an unbounded backlog slows queue work — the
goal-gradient mechanism is cited, its application to a queue header is labelled as inference. No lease length,
WIP limit, skip threshold, backoff base or `age_rate` is presented as a finding; each is given with the
reasoning that lets you derive your own. The priority weights in section 4 are an illustrative ladder
chosen to make the arithmetic legible, not a recommendation.

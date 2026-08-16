# Consent dialog done right, cancellation flow done right

The two flows where design decisions become legal ones fastest, and where almost every product has a finding.
Read when building or reviewing either. Code is React/Tailwind for illustration only — the structure is what
matters, not the framework.

---

# Part 1 — The consent dialog

## The five properties it must have

1. **Nothing fires first.** No non-essential cookie, `localStorage` write, pixel, SDK init or session-replay
   recorder before a choice is made. Verify in devtools with a clean profile, not by reading source — tag
   managers and third-party SDKs fire things your application code never mentions.
2. **Reject is on the first layer, one click, same weight as Accept.** Not behind "Manage preferences". Not
   grey-on-white. This is the single most-cited failure in regulator guidance.
3. **Granular, and all off by default.** Separate purposes get separate toggles, each starting off. No
   pre-enabled "legitimate interest" sliders.
4. **Plain language, one positive clause per decision.** If a sentence needs re-reading, it fails the
   informed test regardless of its accuracy.
5. **Revocable as cheaply as it was granted, and logged.** A persistent path in settings or the footer, plus
   a stored record of what was shown (notice version), what was chosen, and when.

## The shape

```tsx
// Consent dialog: equal-weight choices, nothing pre-selected, three real options.
<div role="dialog" aria-modal="true" aria-labelledby="c-title" aria-describedby="c-body">
  <h2 id="c-title">Cookies on this site</h2>

  <p id="c-body">
    We use cookies that are needed to run the site. We&rsquo;d also like to use analytics cookies to see
    which pages people use, and advertising cookies to measure our ads. You can change this any time in
    Settings.
  </p>

  {/* Three buttons, one visual class, one click each. */}
  <div className="flex flex-wrap gap-3">
    <button onClick={() => save({ analytics: true,  ads: true  })} className={btn}>Accept all</button>
    <button onClick={() => save({ analytics: false, ads: false })} className={btn}>Reject all</button>
    <button onClick={openPreferences} className={btn}>Choose</button>
  </div>

  <p className="mt-3 text-sm">
    <a href="/privacy">How we use your data</a>
  </p>
</div>
```

`btn` is **one class applied to all three**. The moment Accept gets a colour the others do not, you have a
misdirection finding and, in the EU, arguably invalid consent. If your brand requires a visual primary, the
defensible version is Accept and Reject sharing the primary treatment and "Choose" as the tertiary — never
Reject demoted alone.

## The preferences layer

```tsx
const [prefs, setPrefs] = useState({ analytics: false, ads: false }); // both off. always.

<fieldset>
  <legend>Strictly necessary</legend>
  <p>Needed for the site to work — sign-in, security, your basket. These can&rsquo;t be turned off.</p>
</fieldset>

<fieldset>
  <legend>Analytics</legend>
  <label>
    <input type="checkbox" checked={prefs.analytics}
           onChange={e => setPrefs({ ...prefs, analytics: e.target.checked })} />
    Let us see which pages people use, so we can fix the ones that don&rsquo;t work.
  </label>
</fieldset>
```

Then persist with a version and a timestamp, because Art. 7(1) requires you to be able to demonstrate it:

```ts
await saveConsent({
  choices: prefs,
  noticeVersion: "2026-03-11",   // bump when the wording or purposes change
  method: "banner_choose",       // banner_accept_all | banner_reject_all | banner_choose | settings
  at: new Date().toISOString(),
});
```

Bumping `noticeVersion` when purposes change matters: consent is *specific*, so consent to yesterday's list
of purposes is not consent to a new one you added.

## Copy that passes and copy that fails

| Fails | Passes |
|---|---|
| "We value your privacy. To provide the best experience we and our 847 partners process data…" | "We use cookies to run the site, and we'd like to use analytics cookies too." |
| "Accept all" / "Manage my choices" | "Accept all" / "Reject all" / "Choose" |
| "Untick if you do not wish to not receive updates" | "Email me product updates" (unticked) |
| "Continue with recommended settings" | "Accept all" |
| "By continuing to browse you agree…" | An explicit choice, because continuing to browse is not a clear affirmative action |
| "Do you want to miss out on a personalised experience?" | "Reject all" |

## Failure modes to grep for

- The banner renders after analytics has already initialised. (Check the network tab, not the code.)
- Reject sets a cookie but the SDK stays loaded and keeps beaconing.
- Re-showing the banner every session to users who rejected. Ask once; respect it for a real duration.
- A "consent wall" where dismissing the dialog blocks the page but only Accept unblocks it.
- Consent state stored client-side only, so you cannot demonstrate it when asked.
- Focus not moved into the dialog, no focus trap, `Esc` not handled, or Reject unreachable by keyboard —
  each of which is simultaneously an accessibility defect and a consent defect.
- Contrast: run the checker on **both** buttons. It is common for Accept to pass and Reject to fail.

## Permission prompts (push, location, camera) — the same logic

Native permission dialogs cannot be re-shown after a decline on most platforms, which is exactly why the
**pre-prompt** pattern matters: ask in your own UI first, at a moment when the permission unlocks something
specific the user just asked for, with the reason stated. If they say no to yours, you have not burned the
system prompt. What makes a pre-prompt honest rather than manipulative:

- it appears **after** the user has seen value, not on first launch;
- it names the concrete benefit ("so we can tell you when your order ships"), not a vague one;
- declining it is a real, equally-weighted option that is respected;
- you do not re-ask every session. One deferral, at a later moment of genuine need, is the ceiling.

---

# Part 2 — The cancellation flow

## The rule

**Cancellation happens in the same medium as signup, in roughly the same number of steps, and completes
without another human being involved.** If they signed up in an app in three taps, they cancel in the app in
about three taps. This is simultaneously the asymmetry test, the ROSCA "simple mechanism" requirement, the
DSA's termination-harder-than-subscription concern, and what several US state auto-renewal laws require
directly.

## The shape that works

```
Account → Subscription → [Cancel subscription]        ← visible link, not hidden behind "Help"
   ↓
One screen:
   • What you lose and when it happens ("You keep access until 14 April")
   • What happens to your data (kept N days, export button, deletion option)
   • Alternatives at equal weight: [Pause for 3 months] [Switch to Free] [Cancel subscription]
   • Optional, skippable: "Why are you leaving?" — one field, no required answer
   ↓
[Confirm cancellation]  → done, on screen, immediately
   ↓
Email confirming it, with the end date and a one-click resubscribe link
```

Three details that separate a legitimate retention screen from an obstruction pattern:

- **Once, not repeatedly.** One screen offering alternatives is a service. A second "are you sure", a third
  "here's 50% off", a fourth survey — that is a gauntlet, and the count is the finding.
- **Equal weight.** If Pause is a large primary button and "Cancel subscription" is grey 12px text, you have
  built misdirection into the exit. Same treatment, or Cancel as the primary since it is what they asked for.
- **Never blocking.** The survey must be skippable, the offer must be declinable in one click, and no step
  may require waiting for anything or anyone.

```tsx
// Retention offers presented as genuine alternatives, not obstacles.
<h1>Cancel your subscription</h1>
<p>You&rsquo;ll keep full access until <strong>14 April 2026</strong>. After that your projects stay
   read-only for 30 days, and you can export them any time.</p>

<div className="flex flex-wrap gap-3">
  <button onClick={pause}   className={btn}>Pause for 3 months</button>
  <button onClick={downgrade} className={btn}>Switch to Free</button>
  <button onClick={cancel}  className={btn}>Cancel subscription</button>
</div>

<details className="mt-6">
  <summary>Tell us why (optional)</summary>
  <textarea aria-label="Why are you leaving?" />
</details>
```

## Anti-patterns in cancellation, and the fix

| Pattern | Fix |
|---|---|
| Cancel only by phone, email or live chat when signup was self-serve | Self-serve, in-product, immediate |
| Cancel link only in a help-centre article, not in account settings | Direct link in Subscription settings |
| Multi-screen "are you sure" chain, each with a different offer | One screen, offers at equal weight, one confirm |
| Required exit survey | Optional and skippable, or move it to the confirmation email |
| Countdown or "your discount expires in 5:00" on the cancel screen | Delete. Fake urgency is worse here than anywhere |
| Confirmshaming: "No thanks, I don't want to save money" | "Cancel subscription" |
| Cancellation "request submitted, we'll process it within 5 business days" | Effective immediately (or at period end), confirmed on screen |
| Cancel available only during business hours | Any time |
| Access cut instantly on cancellation of a paid-through period | Access runs to the end of the paid period; say so |
| Data deleted immediately with no export | Grace period, export in one action, explicit delete-now option |
| Re-subscribing takes 2 clicks, cancelling takes 9 | Count them. The count is the audit |

## Unsubscribe (email) — the same rule, smaller

- One click from the email, no login, no password, no "manage all my preferences" wall.
- Honour it for all marketing of that type immediately, not "within 10 days".
- A preference centre is fine as an *option* alongside a plain "Unsubscribe from all", never instead of it.
- Transactional mail is a separate category and should be described as such, not used as a loophole to keep
  sending marketing.

## What you actually gain

Removing cancellation friction reliably reduces the things that cost more than the churn does: chargebacks,
"I didn't know I was being charged" support contacts, card-network disputes, one-star reviews naming the
cancel flow, and regulator attention. Users who leave cleanly return; users who feel trapped tell people.
Pause and downgrade recover real intent-to-cancel volume precisely because they are honest offers — instrument
your own save-rate for each alternative rather than trusting anyone's published number, including this file's.

## Reviewer's five-minute test

Do this on production, in a fresh incognito window, with a stopwatch:

1. Sign up. Count clicks. Note the time.
2. Cancel. Count clicks. Note the time.
3. If step 2 exceeds step 1 by any meaningful margin, you have the finding and the number to put in the PR.
4. Screenshot the consent banner and run a contrast checker on **every** button in it.
5. Tab through the consent dialog and the cancel screen with the mouse untouched. If you cannot complete
   either, that is both an accessibility bug and a consent/cancellation bug, and it should be filed as both.

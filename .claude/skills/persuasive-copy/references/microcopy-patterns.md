# Microcopy patterns

A copy library to write from. Every pattern is before/after, because that is the format that transfers.
Read this while you are actually writing strings; the reasoning behind the patterns is in `SKILL.md`.

Two rules govern everything below:

1. **Say what is true about the user's state**, not what the system did. "Entity created" describes your
   data model; "Your building is set up — add units next" describes their situation.
2. **Every message that reports a failure must say whether their work survived.** This is the sentence users
   care most about and the one that is most often missing.

---

## 1. Errors, by failure class

Different failures need different structures. Using one template for all of them is why error copy reads as
generic.

### Validation (the user can fix it, right now)

Structure: *what's wrong → what a valid value looks like → why we need it, if not obvious*. No blame, no
"please", no "invalid".

| Before | After |
|---|---|
| Invalid input | That date is in the past. Pick a date from today onward. |
| Please enter a valid email | That address is missing an @. Example: ana@example.com |
| You entered an invalid phone number | We need a mobile number so the driver can text on arrival — include the country code, e.g. +40 |
| Password does not meet requirements | Passwords need at least 12 characters. Length is what matters — spaces and full sentences are fine. |
| Field is required | Enter the building's street address so we can dispatch inspectors. |
| Value out of range | Enter between 1 and 500 units. This building is recorded as having 84. |
| File type not supported | We can read PDF, JPG and PNG. This file is a .heic — your phone can export it as JPG in Share → Options. |

Never argue with the user's belief. "Please enter a *valid* phone number" tells someone who is confident
their number is valid that you are wrong or broken. Name the constraint instead.

### Server / unknown failure (they can't fix it)

Structure: *own it → say what happened to their work → give an action → give a reference only if support can
use it*.

```
Before: "Error 500: An unexpected error occurred."
After:  "We couldn't save your changes — our end, not yours. Your draft is safe on this device.
         Try again, or come back in a few minutes. (Ref: 8f2c-91)"

Before: "Something went wrong."
After:  "The export didn't finish. Nothing was sent to your accountant and nothing was changed.
         Start the export again, or email support@… with ref 8f2c-91."
```

Never do jokes here. "Oops! Our hamsters dropped the data 🐹" is read by someone who may have just lost work,
and it converts your outage into contempt.

### Network / offline

```
Before: "Network error."
After:  "You're offline. We saved this inspection on your phone and will upload it automatically
         when you're back on signal — nothing is lost."

Before: "Request timed out."
After:  "The upload is taking longer than usual — the file is 84 MB and your connection is slow.
         It's still going. You can leave this screen; we'll notify you when it finishes."
```

Offline copy is the highest-value error copy in any field or mobile product, because it is read by someone
standing in a basement with a phone, deciding whether to redo an hour of work.

### Permission / authorisation

Say who can grant it and how. A dead end here generates a support ticket every time.

```
Before: "Access denied."
After:  "You don't have access to payroll exports. Your workspace admins are Ana Popescu and
         Mihai Ionescu — [request access] sends them a one-click approval."
```

### Payment declined

Money errors need extra precision about state, because the user's next fear is a double charge.

```
Before: "Payment failed."
After:  "Your bank declined the card. Nothing has been charged. Try another card, or ask your bank
         about a block on international payments."

Before: "Card error."
After:  "That card expired in 03/25. Update the expiry date or add a different card — your subscription
         stays active until 14 September either way."
```

### Conflict / someone else changed it

```
Before: "Conflict: the record has been modified."
After:  "Mihai edited this inspection 2 minutes ago while you had it open. [See what changed] before
         you save, or [overwrite with your version]."
```

### Rate limit / quota

Name the number, the window, and the reset time. A limit without a reset time reads as a permanent wall.

```
Before: "Too many requests."
After:  "You've hit the 100-exports-per-hour limit. It resets at 14:35. Larger volumes are available
         on the Team plan, or [contact us] to raise the limit on this account."
```

### Error summaries on submit

If the form failed on more than one field, the summary must be navigable, not just a count.

```
Before: "3 errors. Please correct and resubmit."
After:  "3 things need fixing before we can book this:
         • Inspection date is in the past — jump to it
         • Building address is empty — jump to it
         • Tenant email is missing an @ — jump to it"
```

---

## 2. Empty states

Three different situations, three different copies. Shipping one component for all three is the standard bug.

### First-run empty (nothing exists yet)

The best-read documentation you will ever write: shown at the moment of intent, to someone who already
decided to do the thing. Structure: *what lives here → why it's worth having → one action → a way to look
around without committing*.

```
Before: "No inspections."
        [+ New]

After:  "No inspections yet.
         Each inspection captures photos, notes and a signature, and produces a PDF the tenant
         can sign on the spot — no printing.
         [Create your first inspection]   or   [Load a sample building] to look around first."
```

Do not put a marketing pitch here in a tool people were told to use. For a mandated portal the same slot
should read: *"No shifts recorded yet. Shifts appear here after your site manager approves them, usually
within one working day."* — certainty, not enthusiasm.

### Filtered empty (things exist; the filter is hiding them)

The failure mode is the user believing their data is gone. Name the filter and offer the escape.

```
Before: "No results found."
After:  "No invoices match ‘overdue’ + ‘March 2026’.
         47 invoices exist in other months.  [Clear filters]  [Search all invoices]"
```

### Search empty

Distinguish "nothing matched" from "your query was misspelled" from "we don't index that".

```
Before: "0 results for ‘blder 12’."
After:  "Nothing matches ‘blder 12’. Did you mean ‘Building 12’?
         Search covers building names, addresses and unit numbers — not tenant names."
```

That last sentence is often the whole fix: users search for things you never indexed and conclude the
product is broken.

### Cleared empty (they finished)

Confirm and get out of the way. Don't sell into a moment of completion.

```
Before: "No items."
After:  "All caught up — 14 inspections closed today."
```

### Error empty (the list failed to load)

Never render an empty state for a failed fetch; it silently lies about the data. Render the error class
above.

---

## 3. Confirmations and success

A confirmation answers four questions: **what happened, what it means for me, what happens next and when,
and how do I change or find it.** "Sent" answers none of them.

```
Before: "Invitation sent!"
After:  "Invited ana@example.com as an Editor. She has 7 days to accept; we'll email you when she does.
         Resend or revoke from Settings → Members."

Before: "Saved."
After:  "Saved. Visible to the 4 people on this building."          ← when scope isn't obvious
After:  "Saved"                                                      ← when it is; don't over-explain
                                                                       a save the user does 40× a day

Before: "Your order has been placed."
After:  "Order #4192 confirmed — €248.50 charged to Visa ••4417.
         Arriving Tue 3 March. Track it or change the address until Sunday 18:00."

Before: "Password changed successfully."
After:  "Password changed. We've signed out your other 3 devices. If this wasn't you,
         [lock the account] now."

Before: "Report generated."
After:  "March report is ready — 84 units, 3 open issues. [Open PDF] [Email to accountant]"
```

**Frequency governs the length.** A save toast fired forty times a day should be one word. A confirmation
seen once per contract should carry every detail the reader will need to reassure themselves at 11pm.

**Peak-end:** whatever screen the flow lands on is the one they'll remember. Make it a resolved state with
the reassurance on it, and don't append a survey or an upsell after it — whatever comes last *becomes* the
ending.

---

## 4. Destructive and irreversible actions

The dialog title asks the real question; the buttons answer it; the pair must be readable with the body
ignored, because that is how they are read.

```
Before: title "Are you sure?"      body "This cannot be undone."     [OK] [Cancel]
After:  title "Delete 3 photos from “Site survey”?"
        body  "They'll be removed for everyone with access. Deleted photos are recoverable from
               Trash for 30 days; their comments are not."
        [Delete 3 photos] [Keep them]
```

Checklist for this pattern:

- **Count and scope in the label.** "Delete 3 photos", "Remove 12 members", "Cancel 4 scheduled sends".
- **Name what does not come back.** This is the part users get wrong, and the part that generates the
  angriest support ticket.
- **Say who else is affected.** "for everyone with access", "your team will lose their saved views".
- **The dismissal is its own positive outcome** — "Keep them", "Keep editing", "Stay subscribed" — never
  "Cancel", which collides with domain uses of the word.
- **Never Yes/No.** They carry no information when skimmed.
- **Escalate to typed confirmation** only for the genuinely catastrophic: deleting a workspace, an account,
  a production resource. Ask them to type the resource's name, not the word "DELETE" — typing the name
  forces them to verify *which* thing they're deleting.
- **Prefer undo where the action is reversible** (`friction-and-flow` move 9). Then the copy becomes a toast:
  *"Inspection archived. [Undo]"*.

Subscription cancellation deserves its own note: an EU/US-compliant flow states plainly what happens and
when, without a maze. *"Your plan stays active until 14 September. After that, your 340 templates become
read-only for 90 days, then are deleted. [Cancel subscription] [Keep my plan]"* — and the cancel path must
be no harder than the signup path was.

---

## 5. Permission prompts and asks

The prompt must arrive *after* the user has expressed the intent that needs it, and must name the benefit in
their terms, the scope, and what happens if they say no.

```
Before: "Allow notifications?"                     ← fired on first launch, before any value
After:  (shown when the user taps “Notify me when the inspector arrives”)
        "Turn on notifications so we can tell you when the inspector is 10 minutes away.
         We send about 2 a week. You can turn them off any time in Settings."
        [Turn on notifications] [Not now]

Before: "This app would like to access your location."
After:  "Share your location so we can list the buildings nearest you first.
         Used only while the app is open; never stored."
```

Never say "we value your privacy" in the sentence where you ask for data. Say what you collect, what you do
with it, and what you don't do.

---

## 6. Notifications and email subject lines

The subject line's job is to let the reader decide *not* to open it, correctly. Vagueness that inflates open
rate at the cost of a wasted open is a trade you lose twice.

| Before | After |
|---|---|
| You have a new notification | Mihai approved your 14 August shift |
| Don't miss out! | Your inspection is scheduled for tomorrow, 09:00 |
| Weekly update | 3 units need attention this week (2 overdue) |
| Action required | Add a payment method by 1 March to keep exports working |
| Re: your account | Your card ending 4417 expires next month |

Rules: name the actor and the object; put the decision-relevant fact in the first 40 characters (mobile
truncation); never fake a reply (`Re:`) or a personal sender; never use "Action required" for something that
isn't. Whether the notification should exist at all is `habit-loop-design`'s question, and it should be
answered before the subject line is written.

---

## 7. Buttons and links — quick reference

| Instead of | Write |
|---|---|
| Submit | Get my quote / Send message / Book the inspection |
| OK | Delete 3 photos / Got it / Keep editing |
| Continue | Review order / Add payment method |
| Cancel (on a destructive dialog) | Keep them / Stay subscribed / Keep editing |
| Learn more | See how pricing works / Read the 2-minute setup guide |
| Click here | the actual destination, as the link text |
| Sign up | Start free — no card needed |
| Save | Save draft / Publish changes / Apply to 14 records |
| Yes / No | the two outcomes, named |
| Download | Download March report (PDF, 1.2 MB) |
| Next | Add your first building |

Link text must make sense read alone, because screen-reader users routinely navigate by a list of links, and
sighted users skim to them. "Click here" and "Read more" are unusable in that list.

---

## 8. Voice, by surface frequency

| Read | Register | Example |
|---|---|---|
| Once (hero, first-run) | Warm, specific, may have a point of view | "Inspections that finish before you leave the building." |
| Occasionally (settings, billing) | Neutral, explanatory, complete | "Changing plan takes effect immediately; we prorate the difference." |
| Constantly (toasts, table headers, form labels) | Plain, terse, invisible | "Saved", "Due date", "Assign" |
| At a moment of failure | Plain, no personality, action-first | "We couldn't save — your draft is safe on this device." |

The rule underneath: **personality is a cost paid per repetition.** Spend it where it's read once.

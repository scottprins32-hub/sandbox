# Form implementation recipes

Read this while writing an actual form. It is the field-by-field layer under move 2 and move 4 of
`friction-and-flow/SKILL.md`. Framework-agnostic: everything here is HTML attributes plus a few rules about
when to run logic.

## The autofill contract

Browsers and password managers fill forms by reading `autocomplete` tokens defined in the HTML standard
(WHATWG "autofill field names"). Getting these right is the cheapest friction reduction available — it can
turn a nine-field address form into one tap — and getting them wrong (or omitting them) silently disables
the feature for every user.

Rules that make autofill work:

- Wrap the fields in a real `<form>`. Many browsers won't offer autofill outside one.
- Use standard tokens, not invented ones. `autocomplete="addr1"` does nothing; `address-line1` does.
- Give each field a `name` and an `id`, and a `<label for>`. Heuristic matchers use all three.
- Group with section and contact-type prefixes when a page has two of something:
  `autocomplete="shipping address-line1"` and `autocomplete="billing address-line1"`, or
  `section-work email` / `section-home email`.
- Never `autocomplete="off"` on identity, address or payment fields. It is widely ignored by password
  managers anyway, and where it is honoured it just makes the form worse. The legitimate uses are narrow:
  one-time codes you handle yourself, and fields where a stale value would be actively harmful.

### Token table

| Purpose | `type` | `autocomplete` | Also set |
|---|---|---|---|
| Full name | `text` | `name` | `autocapitalize="words"` |
| First / last | `text` | `given-name` / `family-name` | |
| Email | `email` | `email` | `inputmode="email" autocapitalize="off" spellcheck="false"` |
| Username | `text` | `username` | `autocapitalize="off" spellcheck="false"` |
| New password | `password` | `new-password` | `minlength`, show/hide toggle |
| Existing password | `password` | `current-password` | show/hide toggle |
| One-time code | `text` | `one-time-code` | `inputmode="numeric" pattern="[0-9]*"` |
| Phone | `tel` | `tel` | `inputmode="tel"` |
| Street | `text` | `address-line1` / `address-line2` | |
| City | `text` | `address-level2` | |
| State / province | `text` or `select` | `address-level1` | |
| Postcode | `text` | `postal-code` | `inputmode="text"` (not numeric — many are alphanumeric) |
| Country | `select` | `country` (code) / `country-name` | |
| Card number | `text` | `cc-number` | `inputmode="numeric"` |
| Card expiry | `text` | `cc-exp` (or `cc-exp-month`/`cc-exp-year`) | `inputmode="numeric"` |
| Card CVC | `text` | `cc-csc` | `inputmode="numeric"` |
| Name on card | `text` | `cc-name` | |
| Organisation | `text` | `organization` | |
| Job title | `text` | `organization-title` | |
| Birthday | `date` or split | `bday` (or `bday-day`/`bday-month`/`bday-year`) | |

## Keyboards and input modes

`type` controls validation and semantics; `inputmode` controls which soft keyboard appears. They are
different levers and both matter on mobile.

- `type="number"` is for genuine quantities you'd increment. It is the wrong choice for card numbers,
  postcodes, phone numbers and OTPs — it strips leading zeros, shows spinner arrows, and in some browsers
  silently discards non-numeric input including the pasted spaces in a card number. Use `type="text"` plus
  `inputmode="numeric"`.
- `inputmode="decimal"` for money and measurements — gives a decimal separator without the `+ - ( )` clutter
  of the phone pad.
- `inputmode="numeric"` for digit-only strings.
- `inputmode="search"` turns the enter key into "Search".
- `enterkeyhint="next" | "done" | "send" | "go"` labels the enter key to match what will actually happen —
  a small but real reduction in uncertainty on mobile multi-field forms.
- `autocapitalize="off"` on emails, usernames, passwords, codes and URLs. iOS capitalises by default and
  will produce `Sam@example.com`, which some backends reject.
- `spellcheck="false"` on the same set, plus anything with identifiers, to stop red squiggles on valid input.

## Address forms

- **Ask for country first**, then render the rest of the address form for that country. Address structure is
  not universal: not everyone has a postcode, "state" is meaningless in most of the world, and field order
  differs. A US-shaped form is a defect for international users, not a minor inconvenience.
- Label generically or per-country: `address-level1` is "State" in the US, "Province" in Canada, "County" in
  Ireland, and absent in many places. Do not require a field a country doesn't have.
- Offer address lookup/autocomplete where the volume justifies it — it replaces five fields with one, and
  usually improves deliverability at the same time.
- Postcode → city/state derivation is a good default (editable), not a lock.
- Accept and normalise: strip whitespace, uppercase where the country's format is uppercase, don't reject on
  case or spacing.

## Card fields

- One card-number field, not four boxes. Format with spaces as they type (`4242 4242 4242 4242`) — it makes
  the number checkable against the physical card, which is the actual error-detection mechanism.
- Accept pasted numbers containing spaces, dashes and non-breaking spaces. Strip on your side.
- Detect the network from the leading digits and show it inline rather than making the user select it.
- Auto-advance from expiry to CVC only after a complete, valid entry, and never move focus in a way that
  breaks backspace-to-previous-field.
- Validate the Luhn checksum client-side before you send it — a caught typo here saves a declined-payment
  round trip, which is the most expensive error in the flow.
- Prefer the platform payment sheet (Payment Request API / Apple Pay / Google Pay) over your form entirely
  where it is available.

## Phone numbers and one-time codes

- `type="tel"`, `inputmode="tel"`, and a country-code selector defaulted from the user's locale or IP.
- Accept any punctuation. `+44 7700 900123`, `(07700) 900123` and `07700900123` are the same number to a
  human and should be to you.
- For SMS codes: a single input with `autocomplete="one-time-code"` gets iOS and Android to offer the code
  from the notification. Six separate boxes look nicer and defeat that, break paste, and break backspace —
  if you must use them, handle paste across boxes and wire the OTP autofill to the first one.

## Password fields

- `autocomplete="new-password"` on creation (invites the password manager to generate one),
  `current-password` on login. Getting this backwards is why so many logins don't autofill.
- Enforce a minimum length and check against a breached-password list; drop composition rules (one symbol,
  one uppercase, no repeated characters). This is current NIST SP 800-63B guidance and it produces stronger
  passwords in practice, because composition rules push people toward `Password1!`.
- State the rule permanently next to the field, before the user types, and keep it visible while typing.
- Ship a show/hide toggle instead of a confirm-password field. Give the toggle an accessible label that
  changes with state (`aria-pressed`), and when a page has more than one password field, make each toggle's
  accessible name unique so it's clear which field it controls.
- Never block paste. It breaks password managers and pushes users to weaker, memorable passwords.
- Don't truncate silently. If you cap length, say so.

## Validation timing

| Moment | Do | Don't |
|---|---|---|
| On focus | Show the format hint / rule if not already visible | Clear the field |
| While typing, first entry | Live-format (card, phone). Show positive progress (password strength, username available) | Show an error — the value is incomplete by definition |
| On blur | Validate the field, show the error | Move focus away from where the user put it |
| While re-editing a failed field | Validate live so the error clears the moment it's fixed | Wait for blur — they can't tell if the fix worked |
| On submit | Validate everything; move focus to the first error; announce the count | Clear anything; scroll to top without the errors |
| Server rejection | Repopulate every field, keep uploads, place the error at the field | Return a generic page that loses the payload |

Client-side validation is a convenience, never a control. Everything is revalidated server-side.

## Error message patterns

Structure: **what went wrong → how to fix it → (if useful) why we need it.** Skip the apology.

| Situation | Message |
|---|---|
| Empty required field | "Enter your email address" — not "This field is required" |
| Wrong format | "Enter a date as DD/MM/YYYY, for example 21/03/2027" |
| Taken value | "That username is taken. `sam-b` and `sam-2026` are free." |
| Unfamiliar requirement | "We need your mobile number to send the verification code. Include your country code." |
| Payment declined | "Your bank declined the payment. Try another card, or contact your bank — we weren't told why." |
| Server error mid-flow | "Something broke on our side. Your details are saved — try again." (and mean it) |
| Session expired | Restore the form, then say "You were signed out. Sign in again and we'll pick up where you left off." |

Accessibility wiring, per field:

```html
<label for="email">Email address</label>
<input id="email" name="email" type="email" autocomplete="email"
       aria-invalid="true" aria-describedby="email-error">
<p id="email-error" role="alert">Enter an email address in the format name@example.com</p>
```

On submit failure, render an error summary at the top with in-page links to each bad field, move focus to
the summary, and set the page title so the failure is announced. Never signal an error with colour alone —
pair it with an icon and text.

## Multi-step flows

- Show the total number of steps and the current one. An unbounded flow is a commitment people decline.
- Name the steps rather than numbering them where you can: "Delivery → Payment → Review" tells the user what
  is left and lets them predict the cost.
- Persist as they go — server-side for logged-in users, `localStorage` otherwise. Every step boundary is a
  place where a phone call, a battery death, or a closed tab can destroy the work.
- Allow backward navigation without loss, and make the browser back button do the sane thing.
- Put the cheapest, most confidence-building step first, and anything requiring the user to fetch a physical
  object (card, passport, meter reading) as late as possible — that is the step where people leave to find
  the thing and don't come back. Warn them at the start if such a step exists.

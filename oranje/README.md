# Oranje

A personal dashboard for a **Fitbit Air**: day strain, recovery, sleep and vitals on one page, in navy and orange. Static files, no build step, no framework.

- **Strain 0–21**, in the spirit of WHOOP's, worked out from every minute of heart rate.
- **Recovery** and **sleep** scores, computed in the open from your own baselines.
- **The day, beat by beat**: 24 hours of heart rate with sleep, sessions and the strain it built.
- Ten vitals with their last fortnight; pick which ones show.
- **The climb**, a small game: good days earn metres of altitude, from the Zuidplaspolder (−6.76 m) past the Vaalserberg to the Alpe d'Huez, with three streaks and eight medals.
- Your health data is read by your browser straight from Google and cached there. No server of this app sees it.

## Try it

```bash
cd oranje && python3 -m http.server 4173   # open http://localhost:4173
```

Choose **Look around with demo data**. The demo month is generated in the browser and labelled as such.

## Where the data comes from

The old Fitbit Web API was switched off on 2 November 2026. A Fitbit Air now syncs to **Google Health**, and this app reads it through the [Google Health API v4](https://developers.google.com/health) with five read-only scopes (activity, health metrics, sleep, profile, settings).

Google does not expose Fitbit's own Readiness, Sleep Score or Cardio Load through that API, which is why Oranje computes its own.

## Connect your account (once)

Google only releases health data to an app you registered yourself, so there is one piece of setup that cannot be skipped: an OAuth client in Google Cloud. About five minutes.

1. In [Google Cloud Console](https://console.cloud.google.com/projectcreate) create a project and enable the [Google Health API](https://console.developers.google.com/apis/library/health.googleapis.com).
2. **OAuth consent screen**: user type *External*. Under **Audience**, add your own Google account as a test user. Under **Data access**, add the five `googlehealth.*.readonly` scopes: `activity_and_fitness`, `health_metrics_and_measurements`, `sleep`, `profile`, `settings`.
3. **Credentials → Create OAuth client ID → Web application.**
4. Your Google account must already be signed in to the Google Health (Fitbit) app on your phone. Otherwise Google answers "account not linked".

Then pick one way to host it. To share it with other people, use A.

### A. Vercel: sign in once, stay signed in (recommended)

The four small functions in `api/auth/` keep Google's refresh token in an encrypted, httpOnly cookie and hand the page one-hour access tokens. They never touch health data.

1. Import this repository in Vercel with **Root Directory** `oranje` and framework preset **Other**.
2. On the OAuth client add
   - Authorised JavaScript origin: `https://YOUR-DOMAIN`
   - Authorised redirect URI: `https://YOUR-DOMAIN/api/auth/callback`
3. Set two environment variables (Settings → Environment Variables) and redeploy:

   | Name | Value |
   |---|---|
   | `GOOGLE_CLIENT_ID` | the client ID |
   | `GOOGLE_CLIENT_SECRET` | the client secret |

   Optional: `ORANJE_SECRET`, any long random string, to encrypt the sign-in cookie with its own key instead of one derived from the client secret.

4. Open the site and press **Connect Google account**.

### Sharing it with friends or family

Each person opens the same link, presses **Connect Google account** and signs in with the Google account their own Fitbit Air syncs to. Their data goes from Google to their own browser; nobody sees anyone else's. On a shared phone or laptop, the next person's sign-in clears the previous person's cached days, and settings such as max heart rate are kept per person.

Google needs to know about each person while the app is unverified:

- **Testing** (default): add each person's Google address under **Audience → Test users**. Their sign-in expires every seven days.
- **In production**: press **Publish app** under **Audience**. Anyone with the link can sign in, sign-ins no longer expire weekly, and an unverified app may have up to 100 users. Everyone sees Google's "Google hasn't verified this app" screen once: **Advanced**, then **Go to Oranje**.

Under **Data access**, add `openid`, `email` and `profile` next to the five Google Health scopes; Oranje uses them only to greet each person by name.

### B. Any static host: no server at all

Serve the folder from anywhere (GitHub Pages, Netlify, your own machine). Add the page's origin as an **Authorised JavaScript origin** on the OAuth client, open the site, press **Connect**, and paste the client ID when asked (or put it in `config.js`).

Without a server Google issues one-hour tokens only. When one lapses the page keeps showing the last synced data and the status chip turns into **Sign in again**: one click.

### The seven-day catch

While the consent screen is in *Testing*, Google expires every grant after seven days, so you would have to reconnect weekly. To stop that, open **Audience** and press **Publish app**. You do not need to submit it for verification for personal use; Google will show an "unverified app" warning once when you sign in, and you click through it. (Google's documentation implies this lifts the weekly expiry for these scopes but does not say so in as many words.)

## How the scores work

**Strain** (`js/core/strain.js`). WHOOP does not publish its formula; this is a transparent estimate, not WHOOP's number.

1. Each minute's intensity is its share of heart-rate reserve: `x = (HR − resting) / (max − resting)`.
2. Each minute above 30 % of reserve adds load `w(x) − w(0.30)`, with Banister's weighting `w(x) = 0.64 · x · e^(1.92x)`. Google's own Cardio Load uses the same weighting and floor.
3. `strain = min(21, 4.1 · ln(1 + 0.315 · load))`.

That curve reproduces the figures WHOOP has published: an hour's walk ≈ 6.5, an hour's run ≈ 12, a marathon ≈ 20.4 (the tests assert these). It reads the heart only, so heavy lifting scores lower than on a WHOOP, which adds a muscular-load term from its accelerometer. Max heart rate is the highest the band has recorded, or `208 − 0.7 × age` until then; you can set it yourself in the panel.

**Recovery** (`js/core/scores.js`) compares this morning with your own previous 30 days: heart-rate variability (50 %), resting heart rate (25 %), sleep (20 %), breathing rate (5 %), squashed to 0–100 so an ordinary morning reads about 58 %. It needs three nights before it says anything.

**Sleep** is the share of your sleep need you met, marked down by up to 30 % for broken, shallow or badly timed sleep. Need starts at 7 h 36 m and grows after a hard day or a short night.

**Target strain** follows WHOOP's published colour guidance: `6 + 0.12 × recovery`, ± 1.2.

**The climb** (`js/core/game.js`) rewards balance, not pain. Each day earns metres: 12 for a strain inside your target (5 if within 1.5 of it), 8 for sleep at 85 %+ (4 at 70 %+), 4 for 22+ zone minutes (150 a week), 2 for wearing the band to bed, and up to 5 more for a run of on-target days. Going far past your target earns nothing for training. Medals cover distance, rides, steps, early mornings, sleep runs, on-target runs, a rest day after a hard one, and one all-out day.

None of this is medical advice.

## Tests

```bash
cd oranje && npm test
```

18 tests, no dependencies: the scoring maths against WHOOP's reference points, the climb's earnings and medals, the sign-in functions (state check, encrypted cookie, cross-site refusal), and the Google Health adapter run end to end against `tests/mock-health.js`, a stand-in server that speaks the wire format from the API's discovery document.

**Not yet verified against a live Google account.** The adapter is written from Google's published specification and proven against the mock, but no real Fitbit Air data has passed through it. If a data type misbehaves, the panel's **Data health** list names it and shows Google's error.

## Layout

```
index.html, css/style.css      the page
js/core/                       strain, recovery, sleep (pure functions, run in Node too)
js/data/                       Google Health adapter, sign-in, demo generator, browser cache
js/ui/                         dial, day line, charts, sections, motion
api/auth/                      optional Vercel functions that keep you signed in
fonts/                         Archivo and IBM Plex Mono (SIL Open Font License)
```

# Oranje

A personal dashboard for a **Fitbit Air**: day strain, recovery, sleep and vitals on one page, in navy and orange. Static files, no build step, no framework.

- **Strain 0–21**, in the spirit of WHOOP's, worked out from every minute of heart rate.
- **Recovery** and **sleep** scores, computed in the open from your own baselines.
- **The day, beat by beat**: 24 hours of heart rate with sleep, sessions and the strain it built.
- Ten vitals with their last fortnight; pick which ones show.
- **Day points and levels**: every day earns up to 10 points for healthy habits; points build a week score and XP for your level, with three streaks and eight medals.
- **Team**: everyone on the link who chooses to join competes in weekly standings, a weekly challenge and leaderboards, like WHOOP teams.
- Your health data is read by your browser straight from Google and cached there. No server of this app sees it.

## Try it

```bash
cd oranje && python3 -m http.server 4173   # open http://localhost:4173
```

Choose **Try the demo**. The demo month is generated in the browser and labelled as such.

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

### A. Base44: sign in once, stay signed in (recommended)

Five small backend functions in `base44/functions/` keep Google's refresh token in an encrypted, httpOnly cookie and hand the page one-hour access tokens. They never touch health data. The site and the functions share one address, `https://<app>.base44.app`.

1. Install the CLI and sign in: `npm install -g base44`, then `base44 login` (it shows a code to enter in your browser).
2. In `oranje/`: `base44 link --create --name oranje`, then `npm run deploy`. That builds `dist/` and deploys the functions and the site, and prints the app URL.
3. On the OAuth client add
   - Authorised JavaScript origin: `https://<app>.base44.app`
   - Authorised redirect URI: `https://<app>.base44.app/functions/authCallback`
4. Give the functions their settings as Base44 secrets:

   ```bash
   base44 secrets set GOOGLE_CLIENT_ID=... GOOGLE_CLIENT_SECRET=... APP_ORIGIN=https://<app>.base44.app
   ```

   `APP_ORIGIN` pins the address Google redirects back to. Optional: `ORANJE_SECRET`, any long random string, to encrypt the sign-in cookie with its own key instead of one derived from the client secret.

5. Open the site and press **Connect Google account**.

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

## Connect WHOOP

Choose **WHOOP scores** on the welcome page or in settings to connect. Once WHOOP is connected, the dashboard uses WHOOP's own Strain, Recovery and Sleep scores for every day WHOOP scored (see *Which source leads* below). The WHOOP page itself also lists HRV, resting/average heart rate, sleep duration and workouts from the last 30 days. The WHOOP API provides averages rather than continuous heart-rate samples.

Owner setup for the existing Base44 app:

1. In the [WHOOP Developer Dashboard](https://developer-dashboard.whoop.com/), create an app named Oranje. Select `read:cycles`, `read:recovery`, `read:sleep` and `read:workout`. Oranje requests `offline` during sign-in to renew the access token.
2. Register exactly `https://health-oranje.base44.app/functions/whoopReturn` as an OAuth redirect URI.
3. Add `WHOOP_CLIENT_ID` and `WHOOP_CLIENT_SECRET` in the Oranje app's Base44 secrets. Put the secret in Base44 directly, never in the repository, frontend or chat.
4. Open [Oranje's WHOOP view](https://health-oranje.base44.app/whoop.html), select **Connect WHOOP** and grant the requested read access at WHOOP. You can use the WHOOP Sandbox tier for personal use.

The Base44 WHOOP functions proxy the API because it does not allow cross-origin browser requests. They use a separate encrypted browser cookie for each WHOOP session and do not persist health records. **Disconnect** clears the browser session and requests revocation at WHOOP. If WHOOP cannot confirm revocation, remove Oranje from Connected Apps in WHOOP.

## Languages

Oranje speaks English and Dutch. A browser set to Dutch starts in Dutch, everyone else in English; the **NL / EN** button in the header and *Language* in settings switch it, and the choice is kept per browser. `js/i18n.js` holds the language, the translators and number formats (Dutch uses a decimal comma); `js/terms.js` the shared words (band, zone and sleep names); each module keeps its own English and Dutch strings next to its code, and `js/i18n-page.js` the page text. The privacy and terms pages are written in Dutch, with an English translation (`js/legal.js`). `ORANJE_LANG=nl npm run check:layout` checks the Dutch layout.

## Which source leads

What a wearable measured or scored comes first; phone apps and Oranje's own estimates fill gaps (`js/core/sources.js`, `js/data/health.js`).

1. **Scores.** For days WHOOP scored, its own strain, recovery and sleep replace Oranje's estimates. Each score on Today is tagged *WHOOP* or *Oranje estimate*; the Strain, Recovery and Sleep views show Oranje's estimate beside WHOOP's number. The strain target follows WHOOP's recovery.
2. **Fitbit data.** Every data type is first requested from Google's `google-wearables` source family: Fitbit trackers and Pixel Watch only, nothing typed in or written by apps. Only when the band has nothing for a type does Oranje read all sources (Apple Health, Health Connect, other apps). Sleep cannot be filtered that way, so a night a wearable recorded is preferred. *Data health* in settings shows for each type whether it came from the band or other apps.
3. **Vitals.** Resting heart rate and HRV come from the Fitbit; WHOOP's readings fill days the band missed.

A WHOOP connection belongs to the browser, not the Google account, so on a shared device WHOOP scores are only added to the days of the person who first used them there.

## How the scores work

**Strain** (`js/core/strain.js`). WHOOP does not publish its formula; this is a transparent estimate, not WHOOP's number.

1. Each minute's intensity is its share of heart-rate reserve: `x = (HR − resting) / (max − resting)`.
2. Each minute above 30 % of reserve adds load `w(x) − w(0.30)`, with Banister's weighting `w(x) = 0.64 · x · e^(1.92x)`. Google's own Cardio Load uses the same weighting and floor.
3. `strain = min(21, 4.1 · ln(1 + 0.315 · load))`.

That curve reproduces the figures WHOOP has published: an hour's walk ≈ 6.5, an hour's run ≈ 12, a marathon ≈ 20.4 (the tests assert these). It reads the heart only, so heavy lifting scores lower than on a WHOOP, which adds a muscular-load term from its accelerometer. Max heart rate is the highest the band has recorded, or `208 − 0.7 × age` until then; you can set it yourself in the panel.

**Recovery** (`js/core/scores.js`) compares this morning with your own previous 30 days: heart-rate variability (50 %), resting heart rate (25 %), sleep (20 %), breathing rate (5 %), squashed to 0–100 so an ordinary morning reads about 58 %. It needs three nights before it says anything.

**Sleep** is the share of your sleep need you met, marked down by up to 30 % for broken, shallow or badly timed sleep. Need starts at 7 h 36 m and grows after a hard day or a short night.

**Target strain** follows WHOOP's published colour guidance: `6 + 0.12 × recovery`, ± 1.2.

**Day points** (`js/core/game.js`) reward balance, not pain. Each day earns up to 10: 4 for a strain inside your target (2 if within 1.5 of it), 3 for sleep at 85 %+ (1 at 70 %+), 2 for 22+ zone minutes (150 a week), 1 for wearing the band to bed. Going far past your target earns nothing for training. All points ever earned are XP; levels run from Starter (0) to Legend (3,300). XP is kept in the browser per person, so it keeps growing after old days leave the synced window.

**Team** (`js/core/team.js`, `base44/shared/team.js`). Joining is opt-in. Members share one summary per day (points, strain, recovery, sleep score, resting heart rate, HRV, sleep time, zone minutes, steps, on-target) through `/functions/teamApi`, which knows the caller from the sealed sign-in cookie and stores the rows in two Base44 entities (`TeamMember`, `TeamDay`) that browsers cannot read directly. The last 120 days are kept; *Leave and erase* deletes them. The Team tab shows weekly standings on day points (Monday to Sunday), a weekly challenge that rotates through sleep, on-target days, zone minutes, recovery and steps, and 7-day leaderboards. Deploying it needs `base44 entities push` as well as functions and site. Medals cover distance, rides, steps, early mornings, sleep runs, on-target runs, a rest day after a hard one, and one all-out day.

None of this is medical advice.

## Tests

```bash
cd oranje && npm test
```

The tests have no external dependencies and cover the scoring maths against WHOOP's reference points, day points, levels, medals and the team rules, the team function (identity, validation, no e-mail in responses), the sign-in functions (state check, encrypted cookie, cross-site refusal), and the Google Health adapter run end to end against `tests/mock-health.js`, a stand-in server that speaks the wire format from the API's discovery document.

**Not yet verified against a live Google account.** The adapter is written from Google's published specification and proven against the mock, but no real Fitbit Air data has passed through it. If a data type misbehaves, the panel's **Data health** list names it and shows Google's error.

## Layout

```
index.html, css/style.css      the page
js/core/                       strain, recovery, sleep (pure functions, run in Node too)
js/data/                       Google Health adapter, sign-in, demo generator, browser cache
js/ui/                         dial, day line, charts, sections, motion
base44/                        Base44 config, the sign-in functions, and their shared broker
tools/                         site build for Base44, demo-only preview build
fonts/                         Archivo and IBM Plex Mono (SIL Open Font License)
```

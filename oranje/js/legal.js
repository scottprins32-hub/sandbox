// privacy.html and terms.html in Dutch and English. The pages are written in
// Dutch; without JavaScript that is what shows. With it, the reader's language
// (see i18n.js) fills every element marked data-i18n / data-i18n-html, the
// title and the description, and the switch at the top changes it.

import { applyPage, getLang, onLang, setLang, strings } from './i18n.js';

const updated = { nl: 'Bijgewerkt op 20 november 2026', en: 'Updated 20 November 2026' };
const foot = {
  nl: { back: 'Terug naar Oranje', privacy: 'Privacy', terms: 'Voorwaarden' },
  en: { back: 'Back to Oranje', privacy: 'Privacy', terms: 'Terms' },
};
const ext = (href, text) => `<a href="${href}" rel="noopener" target="_blank">${text}</a>`;
const GOOGLE_CONNECTIONS = 'https://myaccount.google.com/connections';
const BASE44_PRIVACY = 'https://base44.com/about-us/legal/privacy-policy';

const PAGES = {
  privacy: {
    nl: {
      title: 'Privacy · Oranje',
      desc: 'Hoe Oranje omgaat met je Fitbit-, Google- en WHOOP-gegevens.',
      lang: 'Taal',
      h1: 'Privacy',
      meta: updated.nl,
      lede: 'Oranje is een persoonlijke app voor je Fitbit Air en WHOOP. Hij wordt gemaakt en beheerd door een privépersoon voor een kleine kring mensen. Er zit geen bedrijf achter, er zijn geen advertenties en er wordt niets verkocht.',
      hShort: 'Kort gezegd',
      short1: 'Fitbit-gegevens gaan rechtstreeks van Google naar je browser. WHOOP-gegevens gaan via de serverfunctie van Oranje naar je browser.',
      short2: 'Oranje bewaart geen gezondheidsgegevens in een database, tenzij je zelf kiest om mee te doen met het team. Dan bewaart hij je naam en per dag een samenvatting van je scores, en zien de andere teamleden die.',
      short3: 'Oranje kan alleen lezen. Hij kan niets veranderen aan je metingen bij Google, Fitbit of WHOOP.',
      short4: 'Je kunt altijd stoppen met het team, de koppeling verbreken en alles wissen.',
      hFitbit: 'Fitbit via Google Health',
      fitbit: 'Alleen nadat je bij Google toestemming geeft, en alleen-lezen, via de Google Health API:',
      fit1: '<b>Activiteit en fitness:</b> stappen, afstand, calorieën, zone-minuten, trainingen en cardio-fitness.',
      fit2: '<b>Gezondheidsmetingen:</b> hartslag, rusthartslag, hartslagvariabiliteit (HRV), zuurstof in het bloed, ademhaling en huidtemperatuur.',
      fit3: '<b>Slaap:</b> wanneer je sliep en de slaapfases.',
      fit4: '<b>Profiel en instellingen:</b> je leeftijd, je tijdzone en de status van je band, zoals de batterij.',
      fit5: '<b>Je naam en e-mailadres</b> van je Google-account, om te laten zien wie er is ingelogd. Als je meedoet met het team, gebruikt Oranje ze ook daarvoor (zie <b>Team</b>).',
      hWhere: 'Waar je gegevens blijven',
      where1: 'Je browser haalt de gegevens zelf op bij Google en bewaart ze in de opslag van die browser, zodat de app snel opent. Strain, recovery, slaapscore en je dagpunten worden in je browser berekend. Dagpunten zijn een spel: je verdient er maximaal 10 per dag met gezonde gewoontes, zoals trainen binnen je strain-doel, een slaapscore van 85% of meer, 22 of meer zone-minuten en je band ’s nachts dragen. Met die punten bouw je XP op voor je level, en je verdient reeksen en medailles.',
      where3: 'Doe je niet mee met het team, dan wordt er niets naar een server van Oranje gestuurd. Doe je wel mee, dan gaat er per dag een samenvatting naar Base44 (zie <b>Team</b>).',
      where2: 'Om ingelogd te blijven bewaart Oranje de inlogsleutel die Google afgeeft (een zogenaamd refresh token) en je naam en e-mailadres versleuteld (AES-GCM) in een cookie in jouw browser. Scripts op de pagina kunnen die cookie niet lezen (httpOnly). De kleine inlogfuncties van Oranje gebruiken hem alleen om bij Google een toegangscode van een uur op te halen. Ze slaan niets op en zien geen gezondheidsgegevens.',
      hWhoop: 'WHOOP',
      whoop1: 'Als je WHOOP koppelt, geef je Oranje bij WHOOP toestemming om je dagcycli, recovery, slaap en trainingen te lezen. De serverfunctie op Base44 haalt de laatste 30 dagen op bij WHOOP en stuurt de benodigde scores en metingen door naar jouw browser. Oranje bewaart die gegevens alleen zolang het scherm open is en slaat ze niet op in een database of in browseropslag. Alleen als je meedoet met het team, komen je WHOOP-scores voor strain, recovery en slaap in je dagelijkse samenvatting (zie <b>Team</b>).',
      whoop2: 'Oranje bewaart de WHOOP-toegangssleutels versleuteld in een afzonderlijke httpOnly-cookie. De cookie blijft tot 30 dagen geldig en wordt vernieuwd bij het verversen van de toegangssleutel. Met <b>Disconnect</b> op het WHOOP-scherm verwijder je de sessie en vraagt Oranje WHOOP om de toegang in te trekken. Je kunt de toegang ook intrekken via je gekoppelde apps in WHOOP.',
      hTeam: 'Team (alleen als je meedoet)',
      team1: 'Iedereen die deze Oranje-link gebruikt en inlogt met Google, kan kiezen om mee te doen met één gedeeld team. Dat kies je zelf in de app met <b>Meedoen</b>, en je kunt het altijd terugdraaien met <b>Stoppen en wissen</b>. Doe je niet mee, dan gebeurt er niets van wat hieronder staat en blijft alles zoals hierboven beschreven.',
      team2: 'Als je meedoet, bewaart Oranje bij Base44 (de host, in zijn database):',
      teamData1: '<b>Je naam:</b> je voornaam, of de naam die je zelf kiest.',
      teamData2: '<b>Je Google-e-mailadres</b>, alleen als interne sleutel. Andere teamleden zien het nooit.',
      teamData3: '<b>Per dag:</b> dagpunten, strain, recovery (%), slaapscore (%), rusthartslag, hartslagvariabiliteit (HRV), slaapduur, zone-minuten, stappen en of je binnen je doel hebt getraind.',
      team3: 'Dat zijn samenvattingen per dag, geen hartslag per minuut, slaapfases of trainingen. Komt de strain, recovery of slaapscore van een dag van WHOOP, dan is het die WHOOP-score die gedeeld wordt.',
      team4: '<b>Wie het ziet:</b> alle andere leden van het team op deze Oranje-link, in de weekstand, de weekuitdaging en de ranglijsten. De beheerder van de app kan de database inzien. Verder niemand. Je gegevens worden niet verkocht, niet gebruikt voor advertenties en niet gebruikt om AI-modellen te trainen.',
      team5: '<b>Hoe lang:</b> Oranje bewaart per lid de laatste 120 dagen; oudere dagen worden automatisch gewist. Met <b>Stoppen en wissen</b> verwijder je in één keer je lidmaatschap en al je dagen. Base44 bewaart gewiste gegevens nog een tijd in een prullenbak (Recently deleted) voordat ze echt weg zijn; de beheerder kan die prullenbak legen.',
      team6: '<b>Waarom het mag:</b> omdat je er zelf uitdrukkelijk voor kiest om mee te doen (toestemming). Je trekt die toestemming in door te stoppen met het team.',
      team7: '<b>Let op:</b> <b>Disconnect</b> in de instellingen wist je teamgegevens niet vanzelf. Stop daarom eerst met het team, of vraag de beheerder om ze te wissen.',
      hHosting: 'Hosting',
      hosting: `De site en de inlogfuncties draaien bij Base44. Als je meedoet met het team, bewaart Base44 ook je teamgegevens in zijn database (zie <b>Team</b>). Zoals elke webserver kan Base44 technische gegevens verwerken, zoals je IP-adres en het tijdstip van een bezoek, volgens ${ext(BASE44_PRIVACY, 'het privacybeleid van Base44')}. Base44 voegt eigen scripts toe aan de pagina. Oranje staat het uitvoeren daarvan niet toe en gebruikt geen statistiek- of advertentiediensten.`,
      hShare: 'Delen',
      share: 'Doe je niet mee met het team, dan deelt Oranje je gegevens met niemand. Doe je wel mee, dan zien de andere teamleden je naam en je scores per dag, en kan de beheerder de database inzien (zie <b>Team</b>). Verder met niemand. Je gegevens worden niet verkocht, niet gebruikt voor advertenties en niet gebruikt om AI-modellen te trainen.',
      hDelete: 'Verwijderen',
      deleteTeam: 'Team: <b>Stoppen en wissen</b>. Dat verwijdert je lidmaatschap en al je dagen uit de database, na een tijd in de prullenbak van Base44. Doe dit vóór Disconnect.',
      delete1: 'In de app: <b>Instellingen</b>, dan <b>Disconnect</b>. Dat wist de gegevens in je browser, verwijdert de inlogcookie en trekt de toegang bij Google in. Je teamgegevens blijven dan staan; stop eerst met het team of vraag de beheerder om ze te wissen.',
      delete2: `Bij Google: op ${ext(GOOGLE_CONNECTIONS, 'myaccount.google.com/connections')} kun je Oranje de toegang ontnemen.`,
      hMedical: 'Geen medisch advies',
      medical: 'De scores in de Fitbit-weergave zijn schattingen van Oranje. In de WHOOP-weergave staan de scores van WHOOP zelf. De informatie in Oranje is geen medisch advies.',
      hQuestions: 'Vragen',
      questions: 'Vragen over je gegevens kun je stellen aan de persoon die je de link naar Oranje heeft gestuurd; dat is de beheerder van deze app.',
      foot: `<a href="./">${foot.nl.back}</a> · <a href="terms.html">${foot.nl.terms}</a>`,
    },
    en: {
      title: 'Privacy · Oranje',
      desc: 'How Oranje handles your Fitbit, Google and WHOOP data.',
      lang: 'Language',
      h1: 'Privacy',
      meta: updated.en,
      lede: 'Oranje is a personal app for your Fitbit Air and WHOOP. It is made and run by a private individual for a small circle of people. There is no company behind it, there are no ads and nothing is sold.',
      hShort: 'In short',
      short1: 'Fitbit data goes straight from Google to your browser. WHOOP data goes to your browser through Oranje’s server function.',
      short2: 'Oranje does not keep health data in a database, unless you choose to join the team yourself. Then it keeps your name and a summary of your scores per day, and the other team members see them.',
      short3: 'Oranje can only read. It cannot change anything in your measurements at Google, Fitbit or WHOOP.',
      short4: 'You can always leave the team, disconnect and erase everything.',
      hFitbit: 'Fitbit through Google Health',
      fitbit: 'Only after you give permission at Google, and read-only, through the Google Health API:',
      fit1: '<b>Activity and fitness:</b> steps, distance, calories, zone minutes, workouts and cardio fitness.',
      fit2: '<b>Health measurements:</b> heart rate, resting heart rate, heart rate variability (HRV), blood oxygen, breathing and skin temperature.',
      fit3: '<b>Sleep:</b> when you slept and the sleep stages.',
      fit4: '<b>Profile and settings:</b> your age, your time zone and the status of your band, such as the battery.',
      fit5: '<b>Your name and email address</b> from your Google account, to show who is signed in. If you join the team, Oranje also uses them for that (see <b>Team</b>).',
      hWhere: 'Where your data stays',
      where1: 'Your browser fetches the data from Google itself and keeps it in that browser’s storage, so the app opens quickly. Strain, recovery, sleep score and your day points are worked out in your browser. Day points are a game: you earn up to 10 a day for healthy habits, such as training inside your strain target, a sleep score of 85% or more, 22 or more zone minutes and wearing your band at night. With those points you build up XP for your level, and you earn streaks and medals.',
      where3: 'If you do not join the team, nothing is sent to an Oranje server. If you do join, a summary per day goes to Base44 (see <b>Team</b>).',
      where2: 'To keep you signed in, Oranje stores the sign-in key that Google issues (a so-called refresh token) and your name and email address, encrypted (AES-GCM), in a cookie in your browser. Scripts on the page cannot read that cookie (httpOnly). Oranje’s small sign-in functions use it only to fetch an access code valid for one hour from Google. They store nothing and see no health data.',
      hWhoop: 'WHOOP',
      whoop1: 'If you connect WHOOP, you give Oranje permission at WHOOP to read your daily cycles, recovery, sleep and workouts. The server function on Base44 fetches the last 30 days from WHOOP and passes the scores and measurements needed on to your browser. Oranje keeps that data only while the screen is open and does not store it in a database or in browser storage. Only if you join the team do your WHOOP scores for strain, recovery and sleep go into your daily summary (see <b>Team</b>).',
      whoop2: 'Oranje keeps the WHOOP access keys encrypted in a separate httpOnly cookie. The cookie stays valid for up to 30 days and is renewed when the access key is refreshed. With <b>Disconnect</b> on the WHOOP screen you remove the session and Oranje asks WHOOP to revoke access. You can also revoke access through your connected apps in WHOOP.',
      hTeam: 'Team (only if you join)',
      team1: 'Everyone who uses this Oranje link and signs in with Google can choose to join one shared team. You choose this yourself in the app with <b>Join</b>, and you can undo it any time with <b>Leave and erase</b>. If you do not join, none of what follows happens and everything stays as described above.',
      team2: 'If you join, Oranje stores at Base44 (the host, in its database):',
      teamData1: '<b>Your name:</b> your first name, or the name you choose.',
      teamData2: '<b>Your Google email address</b>, only as an internal key. Other team members never see it.',
      teamData3: '<b>Per day:</b> day points, strain, recovery (%), sleep score (%), resting heart rate, heart rate variability (HRV), sleep duration, zone minutes, steps and whether you trained inside your target.',
      team3: 'These are summaries per day, not minute-by-minute heart rate, sleep stages or workouts. If a day’s strain, recovery or sleep score came from WHOOP, it is that WHOOP score that is shared.',
      team4: '<b>Who sees it:</b> every other member of the team on this Oranje link, in the weekly standings, the weekly challenge and the leaderboards. The administrator of the app can see the database. Nobody else. Your data is not sold, not used for advertising and not used to train AI models.',
      team5: '<b>How long:</b> Oranje keeps the last 120 days per member; older days are deleted automatically. With <b>Leave and erase</b> you delete your membership and all your days at once. Base44 keeps deleted data in a trash (Recently deleted) for a while before it is gone for good; the administrator can empty that trash.',
      team6: '<b>Why this is allowed:</b> because you explicitly choose to join yourself (consent). You withdraw that consent by leaving the team.',
      team7: '<b>Note:</b> <b>Disconnect</b> in the settings does not by itself erase your team data. So leave the team first, or ask the administrator to erase it.',
      hHosting: 'Hosting',
      hosting: `The site and the sign-in functions run on Base44. If you join the team, Base44 also stores your team data in its database (see <b>Team</b>). Like any web server, Base44 may process technical data, such as your IP address and the time of a visit, under ${ext(BASE44_PRIVACY, 'Base44’s privacy policy')}. Base44 adds its own scripts to the page. Oranje does not allow them to run and uses no analytics or advertising services.`,
      hShare: 'Sharing',
      share: 'If you do not join the team, Oranje shares your data with no one. If you do join, the other team members see your name and your scores per day, and the administrator can see the database (see <b>Team</b>). No one else. Your data is not sold, not used for advertising and not used to train AI models.',
      hDelete: 'Deleting',
      deleteTeam: 'Team: <b>Leave and erase</b>. That deletes your membership and all your days from the database, after a while in Base44’s trash. Do this before Disconnect.',
      delete1: 'In the app: <b>Settings</b>, then <b>Disconnect</b>. That erases the data in your browser, removes the sign-in cookie and revokes access at Google. Your team data stays; leave the team first or ask the administrator to erase it.',
      delete2: `At Google: on ${ext(GOOGLE_CONNECTIONS, 'myaccount.google.com/connections')} you can remove Oranje’s access.`,
      hMedical: 'No medical advice',
      medical: 'The scores in the Fitbit view are Oranje’s estimates. The WHOOP view shows WHOOP’s own scores. The information in Oranje is not medical advice.',
      hQuestions: 'Questions',
      questions: 'Questions about your data can go to the person who sent you the link to Oranje; they are the administrator of this app.',
      foot: `<a href="./">${foot.en.back}</a> · <a href="terms.html">${foot.en.terms}</a>`,
    },
  },
  terms: {
    nl: {
      title: 'Voorwaarden · Oranje',
      desc: 'De voorwaarden voor het gebruik van Oranje.',
      lang: 'Taal',
      h1: 'Voorwaarden',
      meta: updated.nl,
      lede: 'Oranje is een gratis, persoonlijk project voor een kleine kring mensen. Door de app te gebruiken ga je akkoord met deze punten.',
      hUse: 'Gebruik',
      use1: 'Je logt in met je eigen Google- of WHOOP-account. Je ziet je eigen gegevens en, als je meedoet met het team, de scores van de andere teamleden.',
      use2: 'Gebruik Oranje alleen met je eigen account, niet om gegevens van iemand anders op te halen.',
      use3: 'De beheerder kan de app aanpassen, toegang beperken of de app stoppen, ook zonder aankondiging.',
      hTeam: 'Team',
      team1: 'Meedoen met het team is een keuze. Doe je mee, dan zijn je scores per dag zichtbaar voor de andere teamleden. Met <b>Stoppen en wissen</b> stop je weer.',
      team2: 'Doe alleen mee met een team van mensen met wie je je scores graag deelt.',
      team3: 'Weekstanden, uitdagingen en ranglijsten zijn voor de lol. Ze zijn geen medisch advies en geen trainingsadvies.',
      hMedical: 'Geen medisch advies',
      medical: 'Voor Fitbit berekent Oranje eigen scores en streefwaarden. De WHOOP-weergave toont scores die WHOOP aanlevert. Ze zijn bedoeld als inzicht en motivatie, niet als diagnose of behandeladvies. Twijfel je over je gezondheid, raadpleeg dan een arts.',
      hWarranty: 'Geen garantie',
      warranty: 'Oranje wordt aangeboden zoals hij is. De beheerder doet zijn best, maar garandeert niet dat de app altijd werkt, dat de gegevens volledig zijn of dat de berekeningen kloppen. Voor zover de wet dat toestaat, is de beheerder niet aansprakelijk voor schade door het gebruik van Oranje.',
      hMarks: 'Merken',
      marks: 'Fitbit en Google zijn merken van Google LLC. WHOOP is een merk van WHOOP, Inc. Oranje is niet verbonden aan, gesponsord door of goedgekeurd door deze bedrijven.',
      hPrivacy: 'Privacy',
      privacy: 'Hoe Oranje met je gegevens omgaat, lees je in de <a href="privacy.html">privacyverklaring</a>.',
      foot: `<a href="./">${foot.nl.back}</a> · <a href="privacy.html">${foot.nl.privacy}</a>`,
    },
    en: {
      title: 'Terms · Oranje',
      desc: 'The terms for using Oranje.',
      lang: 'Language',
      h1: 'Terms',
      meta: updated.en,
      lede: 'Oranje is a free, personal project for a small circle of people. By using the app you agree to these points.',
      hUse: 'Use',
      use1: 'You sign in with your own Google or WHOOP account. You see your own data and, if you join the team, the scores of the other team members.',
      use2: 'Use Oranje only with your own account, not to fetch someone else’s data.',
      use3: 'The administrator may change the app, limit access or stop the app, also without notice.',
      hTeam: 'Team',
      team1: 'Joining the team is a choice. If you join, your scores per day are visible to the other team members. With <b>Leave and erase</b> you stop again.',
      team2: 'Only join a team with people you are happy to share your scores with.',
      team3: 'Weekly standings, challenges and leaderboards are for fun. They are not medical advice and not training advice.',
      hMedical: 'No medical advice',
      medical: 'For Fitbit, Oranje calculates its own scores and targets. The WHOOP view shows scores supplied by WHOOP. They are meant as insight and motivation, not as a diagnosis or treatment advice. If you are unsure about your health, consult a doctor.',
      hWarranty: 'No warranty',
      warranty: 'Oranje is offered as it is. The administrator does their best, but does not guarantee that the app always works, that the data is complete or that the calculations are correct. To the extent the law allows, the administrator is not liable for damage resulting from the use of Oranje.',
      hMarks: 'Trademarks',
      marks: 'Fitbit and Google are trademarks of Google LLC. WHOOP is a trademark of WHOOP, Inc. Oranje is not affiliated with, sponsored by or endorsed by these companies.',
      hPrivacy: 'Privacy',
      privacy: 'How Oranje handles your data is set out in the <a href="privacy.html">privacy statement</a>.',
      foot: `<a href="./">${foot.en.back}</a> · <a href="privacy.html">${foot.en.privacy}</a>`,
    },
  },
};

const page = PAGES[document.body.dataset.page];
if (page) {
  const t = strings(page);
  const pick = [...document.querySelectorAll('[data-lang-pick]')];
  const apply = () => {
    applyPage(t);
    document.title = t('title');
    document.querySelector('meta[name="description"]')?.setAttribute('content', t('desc'));
    for (const b of pick) b.setAttribute('aria-pressed', String(b.dataset.langPick === getLang()));
  };
  for (const b of pick) b.addEventListener('click', () => setLang(b.dataset.langPick));
  document.querySelector('.doc-lang')?.removeAttribute('hidden');
  onLang(apply);
  apply();
}

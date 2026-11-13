---
name: self-hosted-app-alternatives
description: Router for free or self-hosted open-source replacements of paid SaaS apps, from a reel listing nine: Wispr Flow, Higgsfield, Calendly, Intercom, Notion, Loom, SEMrush, ElevenLabs and Asana. Use this whenever the user asks for a free, open-source or self-hosted alternative to a paid app, wants to stop paying for a subscription, or asks what to use instead of one of those nine - even if they never name a repo. Says which skill covers each, checks fit and licence honestly, and warns where "free" has limits.
---

# Free and self-hosted alternatives

From one reel (2026-11-10, by an Instagram creator; the post only lists names and the links were behind a comment gate, so repo names below were matched by search and confirmed by reading each repo). The reel's claims are marketing: each skill below records what the repo's own files say, including where they disagree with it.

| Paid app | Open alternative | Where to go |
|---|---|---|
| Calendly | Cal.diy (`calcom/cal.diy`) | `cal-diy-scheduling` |
| Intercom | Chatwoot (`chatwoot/chatwoot`) | `chatwoot-support-desk` |
| Notion | AppFlowy (`AppFlowy-IO/AppFlowy`) | `appflowy-workspace` |
| Loom | Cap (`CapSoftware/Cap`) | `cap-screen-recording` |
| Asana | OpenProject (`opf/openproject`) | `openproject-project-management` |
| Wispr Flow | OpenWhispr (`OpenWhispr/openwhispr`) | `openwhispr-dictation` |
| Higgsfield | Open Generative AI (`Anil-matcha/Open-Generative-AI`) | `open-generative-ai-studio` |
| SEMrush | OpenSEO (`every-app/open-seo`) | `openseo-self-hosted-seo` |
| ElevenLabs | VoiceStudio (`debpalash/VoiceStudio`) | `voicestudio-local-voice` |

All nine now live in this directory. Four similarly named skills are also installed globally in some environments (`openwhispr-route-diagnostics`, `open-higgsfield-studio-workflow`, `openseo-project-readiness`, `voicestudio-local-readiness`); these were not read, so these repo skills were written from the repos themselves.

## How "free" breaks, in order of surprise

1. **The server is not free after all.** AppFlowy's current self-hosted server is closed source with a one-seat free tier; the open server repo is archived.
2. **"Open source" with a paid core.** Chatwoot's `enterprise/` folder needs a subscription in production; OpenProject lists LDAP, SCIM and more as Enterprise add-ons.
3. **Free for personal use only.** Cap's pricing page excludes commercial use from the free tier, and VoiceStudio's default voice weights are CC-BY-NC.
4. **The software is free, the service behind it is not.** OpenSEO's data is bought from DataForSEO ($50 minimum top-up); Open Generative AI sends cloud generation through the paid Muapi.ai service.
5. **Not for production.** Cal.diy's README says personal, non-production use only.
6. **You become the operator:** TLS, secrets, backups, upgrades and security patches. Cap offers no support for self-hosting; Chatwoot supports only the latest version.

## Before recommending any of them

- State what the user would run (a server or a desktop app), what it costs to operate, and what they lose compared with the paid app.
- Check the licence against the intended use (commercial, client work, redistribution).
- Do not run a project's install script or compose file you have not read; every default compose file seen here ships placeholder secrets.
- Prefer the option that needs nothing hosted when one user is enough (the desktop app, or a single-user tier).

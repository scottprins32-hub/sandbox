---
name: openproject-project-management
description: Decides whether and how to self-host OpenProject, the GPLv3 project management tool (work packages, Gantt, boards, Scrum, time tracking, wikis) used as a free alternative to Asana or Jira, covering Community versus Enterprise features, system requirements, the Docker Compose install and upgrade rules. Use this whenever the user wants free or self-hosted project and task management, a Gantt or Kanban tool, an Asana replacement, or mentions OpenProject - even if they never name it. Separates verified facts from page summaries that must be re-checked.
---

# OpenProject (self-hosted project management)

"Web-based open source project management software for teams and organizations that require transparency, flexibility, and data sovereignty" (README). Read 2026-11-11: README, LICENSE, SECURITY.md and the community and enterprise pages verbatim. **The installation, requirements, backup, upgrade and telemetry details come from a model-extracted summary of long docs pages**, so re-check any command against the live docs before use. GitHub stats could not be fetched (API 403). Nothing was installed or run.

## Decide first

1. **Licence:** GPLv3. The Community edition is "free of charge with unlimited users and projects" (community page). Enterprise add-ons are paid: LDAP and group sync, SCIM, custom OpenID Connect providers, resource management, project life-cycle customisation, antivirus scanning, internal comments, and more. Which of SSO (SAML, CAS, Kerberos), Gantt, boards, backlogs and time tracking are Community could not be decoded from the pricing table, so check before relying on any of them. Paid plans start at about EUR 5.95 per user per month with a 25-user minimum.
2. **Hardware (summary):** up to 200 users needs 4 cores, 4 GB RAM, 20 GB disk. PostgreSQL 16 or newer officially (13 to 15 may work but are unsupported), with extensions `pg_trgm`, `btree_gist` and `unaccent`.
3. **Install method:** Docker Compose is the recommended route; the single all-in-one container is "not recommended for production"; DEB/RPM packages cover Ubuntu 22.04 and 20.04, Debian 11 and 12, RHEL 9 and SLES 15 (no Ubuntu 24.04). Helm for big installs.

## Docker Compose (summary of the docs: verify)

```bash
git clone https://github.com/opf/openproject-docker-compose.git --depth=1 --branch=stable/17 openproject
cd openproject && cp .env.example .env
# create the assets dir owned by uid 1000, set a unique SECRET_KEY_BASE (openssl rand -hex 64)
docker compose up -d --build --pull always      # then http://localhost:8080
```

The quick-start examples set `OPENPROJECT_HTTPS=false` and the docs say to remove that for real use and put a TLS-terminating proxy in front. The documented first login is `admin` / `admin`: **change it immediately.**

## Backup and upgrade (summary)

- Back up with a `pg_dump` plus the assets volume (packaged installs: `sudo openproject run backup`). Copy it off the host and test a restore.
- Upgrade one major version at a time (X to X+2 is not allowed), back up first, then pull and restart; packaged installs must run `openproject configure` after every upgrade.

## Telemetry

A "security badge" check sends installation type, version, database type, enterprise status, an anonymous instance ID and locale to OpenProject; it can be turned off (`security_badge_displayed: false` or in System settings). Nothing else was found, but this was not an audit.

## Features and API

Work packages, Gantt, boards, Scrum backlogs, team planner, time and cost tracking, wikis, meetings, Nextcloud and GitHub/GitLab integrations (README); a REST API v3 with an OpenAPI spec (docs summary). Authentication methods were not read. BIM is a paid add-on.

## Latest seen

Release notes (summary) list 17.9.7 dated 2026-11-09. A repo page snapshot shows about 17.2k stars. Neither archived status nor open issues were verified. SECURITY.md: security@openproject.com, no supported-versions table.

## Ship checklist

- [ ] Every feature you depend on confirmed as Community, not Enterprise.
- [ ] Install commands re-read on the live docs page for your version.
- [ ] Default admin password changed, `SECRET_KEY_BASE` unique, HTTPS on.
- [ ] Postgres 16+ and backups, with a restore tested.
- [ ] Telemetry badge decision made.

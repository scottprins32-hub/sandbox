---
name: yt-dlp-media-download
description: Uses yt-dlp, the Unlicense command-line downloader for video and audio from thousands of sites, safely and effectively: install and the nightly channel, format selection, audio extraction, subtitles, metadata, playlists, pacing, why downloads fail (429, 403, missing formats), and the cookie, plugin and config-file security rules. Use this whenever the user wants to download a video, audio, captions or metadata from a URL, pull audio for transcription, archive a playlist, or mentions yt-dlp or youtube-dl - even if they never name it. Includes rights and account-ban cautions and what this session learned downloading Instagram reels.
---

# yt-dlp (media downloader)

"A feature-rich command-line audio/video downloader with support for thousands of sites", a fork of youtube-dl. Read 2026-11-11 from its README (most of it), LICENSE, the wiki FAQ and the Extractors wiki page; latest release seen 2026.10.26. Parts of the README tail were only read as a summary, and the Supported-Sites list, EJS and PO Token guides and `SECURITY.md` (404) were not reached. This session also used yt-dlp for real on Instagram reels, noted below.

## Before downloading: rights and accounts

- Download only what the user has the right to keep or process (their own content, licensed or clearly permitted material). The project refuses to support "sites primarily used for piracy" (FAQ). I found no DRM statement in the parts read; do not try to get around DRM.
- **Do not pass the user's logged-in cookies or credentials without their explicit say-so.** The docs warn that using an account "you run the risk of it being banned (temporarily or permanently)" and that an exported `cookies.txt` contains cookies "for ALL sites", so it must be guarded. The FAQ also reports a popular "Get cookies.txt" Chrome extension as malware.
- OAuth login "no longer works"; cookies are the only route to account features.

## Install and update

- Binary (`yt-dlp`, `yt-dlp.exe`, `yt-dlp_macos`) or pip: `pip install -U "yt-dlp[default]"`. Python 3.11 or newer for the Python versions; Windows 10 or newer for the exe (latest release notes).
- Channels: stable (default), **nightly** (README calls it the recommended channel for regular users), master. `yt-dlp -U` updates release binaries; `yt-dlp --update-to nightly` switches channel. The stable build "is often stale and prone to external breakage", so update first when a site stops working. `--update-to` another repository is unverified.
- Highly recommended: `ffmpeg` and `ffprobe` (merging and extraction; the program, not the Python package), `yt-dlp-ejs` plus a JavaScript runtime (deno is the default; node, bun, QuickJS also listed) which "is required for full YouTube support", and `curl_cffi` for browser impersonation.
- Quick no-install run used in this session: `uv run --no-project --with 'yt-dlp[default]' python -I -m yt_dlp URL`.

## Everyday commands

```bash
yt-dlp -F URL                          # list formats
yt-dlp URL                             # default: best video + best audio, merged (needs ffmpeg)
yt-dlp -f "bv*[height<=720]+ba/b[height<=720]" URL
yt-dlp -S "res:720" URL                # sort instead of filter
yt-dlp -x --audio-format mp3 URL       # audio only (ffmpeg + ffprobe)
yt-dlp --write-subs --write-auto-subs --sub-langs "en.*" --skip-download URL
yt-dlp --write-info-json --skip-download URL   # metadata; may contain personal information
yt-dlp -o "%(title)s [%(id)s].%(ext)s" -P ./downloads URL   # that title template is the default
yt-dlp --no-playlist URL               # a video link inside a playlist
yt-dlp -I 1:5 --download-archive done.txt PLAYLIST_URL
yt-dlp -t sleep PLAYLIST_URL           # preset: pacing of 10-20 s between downloads
```

Other pacing and retry flags: `--sleep-interval`, `--max-sleep-interval`, `--sleep-requests`, `-r` (rate limit), `-R` (retries, default 10). `--print after_move:filepath` gives the real output path. `--restrict-filenames` for ASCII names. A URL starting with `-` needs `--`.

## When it fails

- **HTTP 429 or 402:** the service is blocking your IP for overuse (FAQ). Slow down with `-t sleep`, solve any CAPTCHA in a browser, or use a proxy. Retrying hard makes it worse.
- **HTTP 403 (Cloudflare-style):** per the FAQ, refresh cookies in a browser and pass the same `--user-agent`; reportedly works best with Firefox.
- **Missing high-quality formats:** install ffmpeg (YouTube serves video and audio separately); for YouTube also check the JS runtime and `yt-dlp-ejs`. YouTube is rolling out "PO Tokens"; the PO Token guide was not read.
- **YouTube "try again later":** guest and account rate limits (the wiki cites about 300 and 2000 videos an hour). I did not find guidance in the pages read for "Sign in to confirm you're not a bot": check the live wiki.
- **Cuts and sponsor-removal are inexact** unless `--force-keyframes-at-cuts` (slow).
- Run `yt-dlp -Uv ...` and read the verbose output before changing anything.

## What this session saw (Instagram)

Earlier reel downloads hit HTTP 429 and then a login redirect, so I stopped rather than use the user's cookies. On later days the same command downloaded a public reel with no login. Treat it as luck, not a guarantee: public Instagram access flips between works and blocked. Fall back to the caption and metadata (`--write-info-json`), or ask the user for the content, before asking for cookies.

## Security rules

- `--exec` is restricted to safe format conversions; the compat flags `allow-unsafe-exec-expansion` and `allow-unsafe-ext` "can enable remote code execution": never set them on untrusted input.
- Plugins are all imported with no checks: "use plugins at your own risk". Disable with `YTDLP_NO_PLUGINS`.
- yt-dlp loads `yt-dlp.conf` from several places, including the current directory when `-P` is not given: in a directory you do not control, use `--ignore-config`.
- `--netrc-cmd` runs a shell command; `--netrc` stores passwords in plaintext. `--enable-file-urls` is off by default for a reason.
- `--no-check-certificates` and `--legacy-server-connect` weaken TLS: avoid.
- Release assets have signed checksums; the PyInstaller binaries are GPLv3+ combined works (the source is Unlicense).

## Embedding in Python

Use `YoutubeDL(opts)`, `extract_info(url, download=False)` and `ydl.sanitize_info(info)`; do not parse stdout, and do not assume `extract_info` returns JSON-serialisable data.

## Not verified

Supported-sites list, DRM and legal statements in the README tail, SECURITY.md, EJS and PO Token details, exact `--sleep-interval` defaults.

## Ship checklist

- [ ] Rights to the content confirmed; no DRM or paywall circumvention.
- [ ] yt-dlp on nightly, ffmpeg present, JS runtime present for YouTube.
- [ ] No account cookies used without explicit approval; any cookie file stored privately.
- [ ] Pacing set for playlists; a download archive file used.
- [ ] No untrusted config, plugin or compat flags in play.

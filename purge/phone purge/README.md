# Phone purge (stage)

Completed cut-and-fix batches on the Chromium tree (phases 01–11), plus the
DevTools / password-manager extra.

| Folder | What |
|---|---|
| [`phase-01-phone-platforms/`](phase-01-phone-platforms/) | Phase 1 — phone platforms |
| [`phase-02-other-hosts/`](phase-02-other-hosts/) | Phase 2 — Fuchsia web / Chromecast |
| [`phase-03-docs-metadata/`](phase-03-docs-metadata/) | Phase 3 — docs / metadata |
| [`phase-04-android-fuchsia-third-party/`](phase-04-android-fuchsia-third-party/) | Phase 4 — Android/Fuchsia third_party |
| [`phase-05-unused-third-party/`](phase-05-unused-third-party/) | Phase 5 — more unused third_party |
| [`phase-06-test-third-party/`](phase-06-test-third-party/) | Phase 6 — test third_party |
| [`phase-07-blink-web-tests/`](phase-07-blink-web-tests/) | Phase 7 — Blink web_tests |
| [`phase-08-chrome-test-data/`](phase-08-chrome-test-data/) | Phase 8 — chrome test data |
| [`phase-09-leftover-test-data/`](phase-09-leftover-test-data/) | Phase 9 — leftover test data |
| [`phase-10-zero-hit-trees/`](phase-10-zero-hit-trees/) | Phase 10 — zero-hit trees (+ stubs) |
| [`phase-11-catapult-hunspell/`](phase-11-catapult-hunspell/) | Phase 11 — catapult / hunspell (+ stubs) |
| [`phase-extra-devtools-password-manager/`](phase-extra-devtools-password-manager/) | DevTools + password manager (manual) |

Each phase has `REMOVED.md`, `apply.ps1`, and optional `fix.md`.

```powershell
powershell -NoProfile -File "purge\phone purge\apply.ps1"
# or one phase:
powershell -NoProfile -File "purge\phone purge\phase-01-phone-platforms\apply.ps1"
```

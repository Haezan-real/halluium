# Halluium plan

Agents: if the user is working on halluium, Electron, or Chromium for Hallu,
read this file first and update the **Status** section after every finished
step. Do not invent a new plan. A chat summary is not the source of truth;
this file is.

## Goal

Halluium is Hallu's engine: Chromium plus Electron, owned and trimmed for
Hallu only. Runtime optimizations (RAM, CPU) come **after** the source purge.

## Decisions (locked)

- **Name:** halluium = the whole engine tree (what was `C:\electron-42`).
- **GitHub:** separate repo `Haezan-real/halluium` (not inside `Haezan-real/hallu`).
- **History:** orphan start on that repo later; no Chromium commit chain.
- **Binaries:** never commit `out/`, `*.exe`, `*.dll`, build products; gitignore them.
- **Hallu git:** never add the halluium source tree to the Hallu repo.
- **Disk (phase 1):** rename `C:\electron-42` → `C:\halluium`.
- **Disk (later):** optional move Hallu to `C:\hallu` and nest engine at
  `C:\hallu\bin\halluium`. Not part of phase 1.
- **Keep macOS:** never purge Mac / Darwin / Cocoa source; phone (iOS,
  Android) only for platform cuts.
- **Order:** (1) save pending capture edit (2) rename (3) update configs/docs
  (4) purge in small phases with rebuild proof (5) create orphan GitHub repo
  and push (6) only then RAM/CPU work.

## Status

- **Current phase:** 8 — more test / tooling cuts (auto-continuing)
- **Last done:** Phases 1–7 complete; phase 7 cut ~878 MB of
  `blink/web_tests` bulk + trimmed `chrome/android` (kept
  `modules/buildflags.gni`). `e build` exit 0. Notes in
  `C:\halluium-repo\purge\REMOVED.md`.
- **Next action:** Find next large zero/low-hit trees, delete, prove
  rebuild, sync halluium GitHub, continue until purge stalls.
- **Blocked on:** nothing

## Paths

| Role | Path |
|---|---|
| Engine root (human) | `C:\halluium` (junction → `C:\electron-42`) |
| Engine root (**builds**) | `C:\electron-42` — do not `e build` through the junction |
| Chromium source | `C:\halluium\src` |
| Electron nested repo | `C:\halluium\src\electron` |
| Build output (gitignored) | `C:\halluium\src\out` |
| Runtime copy | `C:\halluium\runtime` |
| Build-tools config | `C:\Users\zeela\.electron_build_tools\configs\evm.hallu-42.json` (`root`) |
| Hallu app | still `...\code\hallu` until a later move |

## Branches

- Chromium: `hallu-no-cursor` in `C:\halluium\src`
- Electron: `hallu-42.11.3` in `C:\halluium\src\electron` (also on
  `Haezan-real/electron`)
- Pending local Chromium edit (must save before purge): whole cached-pass
  export in `components/viz/service/display/surface_aggregator.cc`

## Purge rules

- One phase at a time (e.g. confirm iOS docs/tests unused → delete → `e build`
  must still produce a Hallu-running runtime).
- Do not delete Blink, `cc`, `components/viz`, `gpu`, `v8`, or linked
  `third_party` for the Windows Electron target.
- **Keep all macOS / Darwin / Cocoa related source.** Halluium may ship on Mac.
  Do not delete `mac`, `*_mac*`, Apple/Cocoa UI paths, or Mac-only branches of
  shared libraries just because this machine builds Windows. Phone platforms
  (iOS, Android) are still purge candidates; desktop Mac is not.
- Prefer “never checkout” / leave undownloaded over mass `git rm` on the
  long-lived Chromium branch when possible.
- After each phase: update **Status** here with what was removed and whether
  the rebuild worked.

## Continuity

After every tool batch that finishes a step:

1. Update **Status** (`Current phase`, `Last done`, `Next action`).
2. If the chat is summarized, the next agent reads this file before doing
   anything else to halluium.
3. Do not start RAM optimization until Status says purge phases are done and
   the orphan `Haezan-real/halluium` repo exists (or is explicitly deferred).

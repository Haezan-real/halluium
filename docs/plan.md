# Hallulium plan

Agents: if the user is working on hallulium, Electron, or Chromium for Hallu,
read this file first and update the **Status** section after every finished
step. Do not invent a new plan. A chat summary is not the source of truth;
this file is.

## Goal

Hallulium is Hallu's engine: Chromium plus Electron, owned and trimmed for
Hallu only. Runtime optimizations (RAM, CPU) come **after** the source purge.

## Decisions (locked)

- **Name:** hallulium = the whole engine tree (extra `l`; was briefly
  `halluium` / `C:\electron-42`).
- **GitHub (docs):** `Haezan-real/hallulium-docs` — plan, purge log, apply
  script only. Not the Chromium tree. (Earlier names `halluium` /
  `hallulium` for this docs repo redirect here.)
- **GitHub (engine, later):** orphan import may go to a separate
  `Haezan-real/hallulium` when ready; no Chromium commit chain.
- **Binaries:** never commit `out/`, `*.exe`, `*.dll`, build products; gitignore them.
- **Hallu git:** never add the hallulium source tree to the Hallu repo.
- **Disk:** engine lives at `C:\hallulium` (real rename done; no junction).
- **Disk (later):** optional move Hallu to `C:\hallu` and nest engine at
  `C:\hallu\bin\hallulium`. Not part of current work.
- **Keep macOS:** never purge Mac / Darwin / Cocoa source; phone (iOS,
  Android) only for platform cuts.
- **Order:** (1) save pending capture edit (2) rename (3) update configs/docs
  (4) purge in small phases with rebuild proof (5) create orphan GitHub repo
  and push (6) only then RAM/CPU work.

## Status

- **Current phase:** purge phases 1–9 **complete**; docs repo is
  `hallulium-docs`
- **Last done:** Engine folder is `C:\hallulium`. Progress GitHub repo
  renamed to `Haezan-real/hallulium-docs` (docs only). Build-tools
  `root` / `CHROMIUM_BUILDTOOLS_PATH` point at `C:\hallulium`. Purge notes
  in `C:\halluium-repo\purge\REMOVED.md`.
- **Next action:** Orphan full-tree push to a future `hallulium` engine
  repo when ready, then RAM/CPU work.
- **Blocked on:** nothing (safe wholesale purge stalled on keep-list /
  gn-linked trees)

## Paths

| Role | Path |
|---|---|
| Engine root (**builds** and human) | `C:\hallulium` |
| Chromium source | `C:\hallulium\src` |
| Electron nested repo | `C:\hallulium\src\electron` |
| Build output (gitignored) | `C:\hallulium\src\out` |
| Runtime copy | `C:\hallulium\runtime` |
| Build-tools config | `C:\Users\zeela\.electron_build_tools\configs\evm.hallu-42.json` (`root`) |
| Docs / progress git checkout | `C:\halluium-repo` → `Haezan-real/hallulium-docs` |
| Hallu app | still `...\code\hallu` until a later move |

## Branches

- Chromium: `hallu-no-cursor` in `C:\hallulium\src`
- Electron: `hallu-42.11.3` in `C:\hallulium\src\electron` (also on
  `Haezan-real/electron`)
- Pending local Chromium edit (must save before purge): whole cached-pass
  export in `components/viz/service/display/surface_aggregator.cc`

## Purge rules

- One phase at a time (e.g. confirm iOS docs/tests unused → delete → `e build`
  must still produce a Hallu-running runtime).
- Do not delete Blink, `cc`, `components/viz`, `gpu`, `v8`, or linked
  `third_party` for the Windows Electron target.
- **Keep all macOS / Darwin / Cocoa related source.** Hallulium may ship on Mac.
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
   anything else to hallulium.
3. Do not start RAM optimization until Status says purge phases are done and
   the orphan engine repo exists or is explicitly deferred.

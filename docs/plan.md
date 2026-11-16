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
- **Purge test (locked):** keep a path only if a **Hallu developer
  environment** needs it (build + run Hallu). If not needed → delete. If
  something else in the tree still references it → change that code so
  Hallu builds without it, then delete. “Chromium/ChromeOS still builds
  every target” is not a keep reason.
- **Order:** (1) save pending capture edit (2) rename (3) update configs/docs
  (4) purge in small phases with rebuild proof (5) create orphan GitHub repo
  and push (6) only then RAM/CPU work.

## Status

- **Current phase:** aggressive purge under the Hallu-dev-env test
- **Last done:** Phases 1–9 done; engine at `C:\hallulium`; docs repo
  `Haezan-real/hallulium-docs`. User continuing purge: delete anything
  not required for a Hallu developer environment (or fix deps then delete).
- **Next action:** Purge more under that test; prove with `e build` from
  `C:\hallulium\src` after each risky batch; update purge log.
- **Blocked on:** nothing

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

- **Hallu-dev-env test** is the gate (see Decisions). Not “does Chromium
  still know about this folder.”
- After each risky delete: `e build` from `C:\hallulium\src` must still
  produce a Hallu-running runtime. If gen/build fails only because of a
  leftover import/data_dep, fix or stub that reference, then keep it deleted.
- Expect Hallu still needs core browser pieces (Blink, `cc`, viz, `gpu`,
  `v8`, and whatever `third_party` those link). Delete them only if you
  have replaced that need.
- **Keep all macOS / Darwin / Cocoa related source.** Hallulium may ship on Mac.
  Phone platforms (iOS, Android) and ChromeOS-only trees are fair game if
  Hallu’s Windows/Mac developer build does not need them.
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

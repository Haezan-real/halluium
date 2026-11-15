# Halluium

Hallu’s engine: Chromium plus Electron, trimmed for Hallu only.

## What this GitHub repo is (for now)

This repository stores **halluium progress you can sync**:

- The living plan and purge log
- A script that re-applies the platform cuts on a stock Electron/Chromium checkout
- Pointers to the Electron branch that carries the compositor patches

It does **not** yet contain the full multi‑gigabyte Chromium source tree. That
tree lives on the build machine at `C:\electron-42` (junction `C:\halluium`).
A single orphan push of ~20 GB of Chromium is not practical on GitHub; more
purge phases come first, then an orphan import of the lean tree.

## Pins

| Piece | Version |
|---|---|
| Electron | v42.11.3 (`hallu-42.11.3` on [Haezan-real/electron](https://github.com/Haezan-real/electron)) |
| Chromium | 148.0.7778.280 (`hallu-no-cursor` locally) |

## Related repos

- [Haezan-real/hallu](https://github.com/Haezan-real/hallu) — the editor
- [Haezan-real/electron](https://github.com/Haezan-real/electron/tree/hallu-42.11.3) — Electron shell + Chromium patch files

## Build rule

On Windows, run `e build` from the **real** path `C:\electron-42\src`, not
through the `C:\halluium` junction (TypeScript path checks break on the
junction).

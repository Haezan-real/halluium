# Hallulium

Hallu’s engine: Chromium plus Electron, trimmed for Hallu only.

## What this GitHub repo is (for now)

This repository stores **hallulium progress you can sync**:

- The living plan and purge log
- A script that re-applies the platform cuts on a stock Electron/Chromium checkout
- Pointers to the Electron branch that carries the compositor patches

It does **not** yet contain the full multi‑gigabyte Chromium source tree. That
tree lives on the build machine at `C:\hallulium`.
A single orphan push of ~20 GB of Chromium is not practical on GitHub; more
purge phases came first, then an orphan import of the lean tree is next.

## Pins

| Piece | Version |
|---|---|
| Electron | v42.11.3 (`hallu-42.11.3` on [Haezan-real/electron](https://github.com/Haezan-real/electron)) |
| Chromium | 148.0.7778.280 (`hallu-no-cursor` locally) |

## Related repos

- [Haezan-real/hallu](https://github.com/Haezan-real/hallu) — the editor
- [Haezan-real/electron](https://github.com/Haezan-real/electron/tree/hallu-42.11.3) — Electron shell + Chromium patch files

## Build rule

On Windows, run `e build` from `C:\hallulium\src`.

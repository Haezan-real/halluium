# Hallulium docs

Progress notes for **hallulium** (Hallu’s Chromium + Electron engine).

This repo is **documentation only**: living plan, purge log, unrelated-code
scan, and a script that re-applies platform cuts. It is **not** the engine
source.

See [`purge/unrelated code purge.md`](purge/unrelated%20code%20purge.md) for a
full file list of `src/` paths that are not ninja inputs of the Release
`electron.exe` target (minus macOS/toolchain policy keeps).

The engine tree lives on the build machine at `C:\hallulium`. A future
`Haezan-real/hallulium` repo may hold an orphan import of that tree; this
repo stays `hallulium-docs`.

## Pins

| Piece | Version |
|---|---|
| Electron | v42.11.3 (`hallu-42.11.3` on [Haezan-real/electron](https://github.com/Haezan-real/electron)) |
| Chromium | 148.0.7778.280 (`hallu-no-cursor` locally) |

## Related repos

- [Haezan-real/hallu](https://github.com/Haezan-real/hallu) — the editor
- [Haezan-real/electron](https://github.com/Haezan-real/electron/tree/hallu-42.11.3) — Electron shell + Chromium patch files

## Build rule

On Windows, run `e build` from `C:\hallulium\src`. Ninja still emits `electron.exe`; rename it to `hallulium.exe` and sync that plus the companion dlls/paks into `C:\hallulium\runtime` and Hallu `bin\node_modules\electron\dist` (set `path.txt` to `hallulium.exe`).

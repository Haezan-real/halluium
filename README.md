# Hallulium docs

Progress notes for **hallulium** (Hallu’s Chromium + Electron engine).

This repo is **documentation only**: living plan and purge stages. It is **not**
the engine source.

## Purge

See [`purge/README.md`](purge/README.md). Work is split into **stages**:

| Stage | Path |
|---|---|
| Phone purge (phases 01–11 + extra) | [`purge/phone purge/`](purge/phone%20purge/) |
| Unused by electron (scan maps) | [`purge/unused by electron purge/`](purge/unused%20by%20electron%20purge/) |

Each phone-purge **phase** has `REMOVED.md`, `apply.ps1`, and optional `fix.md`.

```powershell
powershell -NoProfile -File purge\apply.ps1
```

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

The engine tree lives on the build machine at `C:\hallulium`. A future
`Haezan-real/hallulium` repo may hold an orphan import of that tree; this
repo stays `hallulium-docs`.

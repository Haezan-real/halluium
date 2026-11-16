# Hallulium docs

Progress notes for **hallulium** (Hallu’s Chromium + Electron engine).

This repo is **documentation only**: living plan, purge log, and a script that
re-applies platform cuts. It is **not** the engine source.

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

On Windows, run `e build` from `C:\hallulium\src`.

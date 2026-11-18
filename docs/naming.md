# Hallulium naming

## What you type

- `h build` — build the engine (same as old `e build`)
- `hallulium build` — same thing (Windows; avoids PowerShell’s old `h` = history)
- `e build` — still works

New PowerShell windows clear the `h` = history shortcut so `h build` works.

## Hallu app: `require('hallulium')`

Hallu source uses `require('hallulium')` (and `npm start` runs the `hallulium` CLI).
Under the hood, `bin/packages/hallulium` forwards to the real `electron` package /
built-in — so the engine still works. Keep `node_modules/electron` installed;
do not delete it.

## What the program is called

- Finished host exe: **`hallu.exe`**
- Hallu runs: repo-root `hallu.exe` (synced from `out/Release` with its dlls)
- Ninja target name is still `electron` (internal). `project_name` is `hallu`, so the file on disk is `hallu.exe`.
- Windows exe icon: Hallu day (`bin/assets/icons/app/hallu_day.ico`), baked in as
  `electron/shell/browser/resources/win/electron.ico` for builds.

## Folders

| Role | Path |
|---|---|
| Engine | `C:\hallulium` |
| Docs checkout | `C:\hallulium-docs` |
| Nested Electron sources | `C:\hallulium\src\electron` (keep this name; Node/Chromium expect it) |
| Hallu’s npm package folder | `hallu/bin/node_modules/electron` (keep; `require('electron')`) |

## After branding change

If this is the first build after `BRANDING.json` → hallulium, run once from `C:\hallulium\src`:

```text
gn gen out/Release
```

Then `h build`. The current in-flight build may still emit `electron.exe`; sync renames/copies to `hallulium.exe`.

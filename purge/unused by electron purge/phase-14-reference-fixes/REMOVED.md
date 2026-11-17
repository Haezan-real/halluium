# Phase 14 — pre-apply reference fixes (no further deletes)

Before the giant `e build`, fill GN gaps left by earlier deletes so gen/compile
fails less often on missing paths.

## What was applied

1. `_apply-reference-fixes.mjs`
   - Ensure / refresh hollow `BUILD.gn` stubs for dep/label deleted packages
     (merge referenced target names into `group("…") {}`).
   - Stub missing `.gni` / source / data paths still named by kept build files.
   - Critical stubs: `components/optimization_guide/features.gni`,
     `services/on_device_model/on_device_model.gni`, etc.
   - ~15k file stubs on first pass.

2. `_stub-missing-in-build.mjs` (after fixing quote regex `[^"]+`)
   - For kept `BUILD.gn` under chrome/components/content/base/net/ui/…
     create stubs for every missing relative `.cc`/`.h`/… still listed.
   - ~3k more stubs (incl. all `chrome/browser/nearby_sharing/*` sources).

## What was NOT done

- Line-by-line removal of `sources` / `deps` from kept BUILD files (stubs
  satisfy “file exists” for gn; unused sibling targets stay in the file).
- Stubbing kept packages that still have real content (~6.9k fix-list rows
  point at dawn/ffmpeg/ozone/… we are not deleting).
- Full guarantee — grit/`exec_script`/generated paths can still break gen.

## Next

Giant `e build`; fix any remaining gaps as they appear (should be far fewer).

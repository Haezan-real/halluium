# Phase 12 — electron PGO profiles (~1.0 GB)

Build deferred to end. **Fix then delete:** official Hallu builds import
`electron/build/args/release.gn`, which enabled PGO (`chrome_pgo_phase` defaults
to 2 when `is_official_build`) and pointed V8 at these profiles.

## Fix

In `electron/build/args/release.gn`:

- `chrome_pgo_phase = 0`
- `v8_builtins_profiling_log_file = ""`

(replacing the `//electron/build/pgo_profiles/...` path)

## Remove

- `electron/build/pgo_profiles/` (~1.0 GB `.profdata` + V8 builtins profile)

## Notes

Hallu-dev-env does not need profile-guided optimization. Binary size/perf of
the next `e build` may differ slightly from a PGO Release (usually a bit
larger / less tuned), unrelated to the unused-source deletes.

After the first `e build` attempt, ninja still wanted the old
`*.pgo.txt` state files to refresh `build.ninja`. Re-added **tiny stub**
`*.pgo.txt` (+ empty builtins profile placeholders) under
`electron/build/pgo_profiles/` so gn/ninja can regenerate with
`chrome_pgo_phase = 0`. The multi‑hundred‑MB `.profdata` files stay gone.

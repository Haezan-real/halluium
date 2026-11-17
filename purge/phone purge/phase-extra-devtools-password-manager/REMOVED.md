# Extra — DevTools frontend + password manager hollow

Not a numbered disk-purge phase; code/UI cuts done in the same arc.

## Remove

- `third_party/devtools-frontend/` (frontend deleted; empty pak stubs / flags used so electron still packs)

Password manager: Chrome UI cut; `components/password_manager/core/browser` hollowed;
`browser.lib` dropped from electron link. Kept `core/common` + `password_features`.

## Notes

These cuts are **not** fully re-applicable from a simple path list + stubs.
`apply.ps1` here only documents intent. Re-apply from the Hallu/electron branch
state or redo the hollow manually. Do not run a blind delete of password_manager.

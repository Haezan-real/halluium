# Phase 11 — WebNN / LiteRT / TFLite support / ML helpers (~200+ MB)

Build deferred to end. **Fix then delete:** force WebNN off TFLite/LiteRT
before stubbing the trees.

## Fix

After delete, leave stub `services/webnn/features.gni` and
`third_party/litert/features.gni` with ML backends forced off so leftover
GN imports resolve. Also stub `chrome/browser/webnn/` (imports the webnn
features file).

(`third_party/tflite/` was already stubbed in phase 05.)

## Remove

- `third_party/tflite_support/` (~106 MB)
- `third_party/litert/` (~93 MB)
- `services/webnn/`
- `services/on_device_model/`
- `components/optimization_guide/`
- `components/language_detection/`
- `components/permissions/prediction_service/`
- `chrome/browser/webnn/`

## Keep

- Rest of `components/permissions/` (non-prediction)
- Main toolchains / angle / dawn cores

## Fixes

Stubs via `_bulk-stub-delete.mjs` + feature `.gni` stubs in `apply.ps1`.

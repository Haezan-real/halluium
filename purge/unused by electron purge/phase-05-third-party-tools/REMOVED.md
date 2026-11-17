# Phase 05 — unused third_party + tools (~700+ MB)

Build deferred to end. Hollow root (and reference-fix) `BUILD.gn` stubs left.

## Remove

### third_party (ML / test / unused)

- `third_party/fuzztest/`
- `third_party/googletest/`
- `third_party/google_benchmark/`
- `third_party/afl/`
- `third_party/hyphenation-patterns/`
- `third_party/win_build_output/`
- `third_party/nan/`
- `third_party/protobuf-javascript/`
- `third_party/sentencepiece/`
- `third_party/oak/`
- `third_party/federated_compute/`
- `third_party/eigen3/`
- `third_party/mediapipe/`
- `third_party/gemmlowp/`
- `third_party/gperf/`
- `third_party/cpu_features/`
- `third_party/tflite/`
- `third_party/libphonenumber/`
- `third_party/spirv-cross/`
- `third_party/glslang/`
- `third_party/llvm-libc/`
- `third_party/highway/`
- `third_party/material_color_utilities/`
- `third_party/vulkan_memory_allocator/`
- `third_party/libwebm/`
- `third_party/libgav1/`
- `third_party/cpuinfo/`
- `third_party/xnnpack/`
- `third_party/ruy/`
- `third_party/pthreadpool/`
- `third_party/fxdiv/`
- `third_party/fp16/`

### tools (CI / perf helpers)

- `tools/luci-go/`
- `tools/metrics/`
- `tools/perf/`
- `tools/resultdb/`
- `tools/skia_goldctl/`

## Fixes

Stubs via `_bulk-stub-delete.mjs` (root `BUILD.gn` + any paths named in the
reference-fix map).

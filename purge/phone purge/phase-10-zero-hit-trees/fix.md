# Phase 10 fixes

Hollow `BUILD.gn` stubs written **after** the ## Remove deletes. `apply.ps1`
parses each `## Stub:` path and writes the following fenced body.

## Stub: third_party/webgpu-cts/BUILD.gn

```
# Hallulium stub.
group("stub") {}
group("webgpu-cts") { }
```

## Stub: codelabs/BUILD.gn

```
# Hallulium stub.
group("codelabs") {}
```

## Stub: infra/orchestrator/BUILD.gn

```
# Hallulium stub.
group("orchestrator") {}
group("orchestrator_all") { }
```

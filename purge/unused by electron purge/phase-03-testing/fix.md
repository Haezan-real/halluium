# Phase 03 fixes

After deleting `testing/`, restore keep-overrides then write these stubs.

## Stub: testing/BUILD.gn

```
# Hallulium stub — testing unused by electron.exe.
group("run_isolated_script_test") {}
group("testing") {}
```

## Stub: testing/gtest/BUILD.gn

```
# Hallulium stub.
group("gtest") {}
group("gtest_main") {}
group("gtest_config") {}
```

## Stub: testing/gmock/BUILD.gn

```
# Hallulium stub.
group("gmock") {}
group("gmock_main") {}
```

## Stub: testing/buildbot/filters/BUILD.gn

```
# Hallulium stub.
group("filters") {}
```

## Stub: testing/libfuzzer/proto/BUILD.gn

```
# Hallulium stub.
group("json_proto") {}
group("proto") {}
```

## Stub: testing/android/native_test/BUILD.gn

```
# Hallulium stub.
group("native_test") {}
```

## Stub: testing/android/instrumentation/BUILD.gn

```
# Hallulium stub.
group("instrumentation") {}
```

## Stub: testing/android/junit/BUILD.gn

```
# Hallulium stub.
group("junit") {}
```

## Stub: testing/scripts/run_isolated_script_test.py

```
# Hallulium stub
```

## Stub: testing/scripts/common.py

```
# Hallulium stub
```

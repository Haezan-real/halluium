# Phase 11 fixes

Hollow `BUILD.gn` stubs written **after** deleting catapult / hunspell_dictionaries.

## Stub: third_party/hunspell_dictionaries/BUILD.gn

```
# Hallulium stub.
group("hunspell_dictionaries") {}
```

## Stub: third_party/catapult/BUILD.gn

```
# Hallulium stub — catapult removed.
group("catapult") {}
group("telemetry_chrome_test_support") { }
```

## Stub: third_party/catapult/common/py_utils/BUILD.gn

```
# Hallulium stub.
group("py_utils") {}
```

## Stub: third_party/catapult/dependency_manager/BUILD.gn

```
# Hallulium stub.
group("dependency_manager") {}
```

## Stub: third_party/catapult/devil/BUILD.gn

```
# Hallulium stub.
group("devil") {}
```

## Stub: third_party/catapult/telemetry/BUILD.gn

```
# Hallulium stub.
group("bitmaptools") {}
group("telemetry") {}
```

## Stub: third_party/catapult/third_party/gsutil/BUILD.gn

```
# Hallulium stub.
group("stub") {}
group("gsutil") { }
```

## Stub: third_party/catapult/third_party/typ/BUILD.gn

```
# Hallulium: restored typ package only (rest of catapult deleted).
group("typ") {
  data = [ "typ/" ]
}
```

## Stub: third_party/catapult/tracing/BUILD.gn

```
# Hallulium stub.
group("stub") {}
group("convert_chart_json") { }
group("generate_about_tracing") { }
```

## Stub: third_party/catapult/tracing/tracing/BUILD.gn

```
# Hallulium stub.
group("stub") {}
group("histogram") { }
group("reserved_infos") { }
```

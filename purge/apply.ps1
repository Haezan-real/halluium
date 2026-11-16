# Re-apply hallulium platform cuts on a Chromium src directory.
param(
  [string]$Src = ""
)

$ErrorActionPreference = "Stop"

if (-not $Src) {
  if (Test-Path "C:\hallulium\src") { $Src = "C:\hallulium\src" }
  elseif (Test-Path "C:\electron-42\src") { $Src = "C:\electron-42\src" }
  else { throw "Pass -Src to your Chromium src directory." }
}

$remove = @(
  "ios",
  "ios_internal",
  "android_webview",
  "clank",
  "fuchsia_web",
  "chromecast",
  "docs",
  "clusterfuzz-data",
  "agents",
  "internal",
  "signing_keys",
  "styleguide",
  "third_party\jetstream",
  "third_party\speedometer",
  "third_party\apache-windows-arm64",
  "third_party\nearby",
  "third_party\androidx",
  "third_party\androidx_javascriptengine",
  "third_party\android_build_tools",
  "third_party\android_deps",
  "third_party\android_media",
  "third_party\android_opengl",
  "third_party\android_platform",
  "third_party\android_prebuilts",
  "third_party\android_provider",
  "third_party\android_sdk",
  "third_party\android_swipe_refresh",
  "third_party\android_system_sdk",
  "third_party\android_toolchain",
  "third_party\arcore-android-sdk",
  "third_party\arcore-android-sdk-client",
  "third_party\byte_buddy",
  "third_party\fuchsia-gn-sdk",
  "third_party\fuchsia-sdk",
  "third_party\hamcrest",
  "third_party\robolectric",
  "third_party\perl",
  "third_party\crossbench",
  "third_party\crossbench-web-tests",
  "third_party\webgl",
  "third_party\checkstyle",
  "third_party\instrumented_libs",
  ".github",
  ".claude",
  ".gemini",
  ".agents",
  "third_party\blink\perf_tests",
  "third_party\webxr_test_pages",
  "third_party\apache-win32",
  "third_party\js_code_coverage",
  "third_party\nlohmann_json",
  "third_party\webdriver",
  "third_party\wpt_tools",
  "third_party\libpfm4",
  "third_party\liblouis",
  "third_party\cldr",
  "third_party\google_input_tools",
  "third_party\material_web_components",
  "third_party\blink\web_tests\platform",
  "third_party\blink\web_tests\external",
  "third_party\blink\web_tests\svg",
  "third_party\blink\web_tests\http",
  "third_party\blink\web_tests\fast",
  "third_party\blink\web_tests\images",
  "third_party\blink\web_tests\virtual",
  "third_party\blink\web_tests\flag-specific",
  "third_party\blink\web_tests\editing",
  "third_party\blink\web_tests\webaudio",
  "third_party\blink\web_tests\media",
  "third_party\blink\web_tests\css3",
  "third_party\blink\web_tests\third_party",
  "chrome\test\data\android",
  "chrome\test\data\extensions",
  "chrome\test\data\image_decoding",
  "chrome\test\data\import",
  "chrome\test\data\page_cycler",
  "chrome\test\data\perf",
  "chrome\test\data\safe_browsing",
  "chrome\test\data\xr",
  "chrome\browser\resources\chromeos",
  "chrome\test\data\dromaeo",
  "chrome\test\data\ocr"
)

$keep = @(
  "chrome\android",
  "third_party\closure_compiler",
  "third_party\screen-ai",
  "third_party\grpc",
  "third_party\vulkan-validation-layers",
  "third_party\readability",
  "third_party\google-closure-library",
  "third_party\test_fonts",
  "third_party\updater",
  "third_party\enterprise_companion",
  "third_party\catapult\third_party\vinn",
  "third_party\catapult\third_party\gsutil"
)

foreach ($rel in $remove) {
  $path = Join-Path $Src $rel
  if (Test-Path $path) {
    Write-Host "Removing $rel"
    Remove-Item -LiteralPath $path -Recurse -Force
  } else {
    Write-Host "Already gone: $rel"
  }
}

foreach ($rel in $keep) {
  $path = Join-Path $Src $rel
  if (-not (Test-Path $path)) {
    Write-Warning "Missing kept path $rel — restore from git before building."
  }
}

Write-Host "Purge apply done. Next: e build from C:\hallulium\src."

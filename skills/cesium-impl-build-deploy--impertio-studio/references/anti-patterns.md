# CesiumJS Build and Deployment Anti-Patterns

Each entry lists the symptom, the root cause, and the fix. Verified against the
CesiumJS quickstart, the `cesium-webpack-example` repository, and the project
research base.

## 1. CESIUM_BASE_URL unset or pointing at the wrong path

**Symptom:** The globe is blank or black. The console shows `404` errors for
files under `Workers`, `Assets`, or `Widgets`.

**Root cause:** CesiumJS resolves every worker and asset request against the
`CESIUM_BASE_URL` global. When it is unset or points somewhere the static
directories are not served, every request misses.

**Fix:** Set `CESIUM_BASE_URL` to the directory that contains `Workers`,
`ThirdParty`, `Assets`, and `Widgets`. With a bundler, use `vite-plugin-cesium`
or `webpack.DefinePlugin`. With no bundler, assign `window.CESIUM_BASE_URL`.

## 2. The bundler ships JavaScript but not the static directories

**Symptom:** The bundle loads, then a worker fails and the globe stays blank,
even though `CESIUM_BASE_URL` looks correct.

**Root cause:** The four static directories are not part of the JavaScript
bundle. A build with no copy step deploys `app.js` alone, so the worker and
asset files are simply absent from the output.

**Fix:** Add an asset-copy step. In Vite use `vite-plugin-cesium`. In webpack
use `copy-webpack-plugin` to copy the four directories into the output.

## 3. CESIUM_BASE_URL set after the cesium import

**Symptom:** `window.CESIUM_BASE_URL` is assigned in the app code, yet assets
still 404.

**Root cause:** CesiumJS reads `CESIUM_BASE_URL` while its module initializes,
which happens at `import` time. An assignment placed after the import runs too
late and is ignored.

**Fix:** Set `window.CESIUM_BASE_URL` in an earlier script, before the module
that imports `cesium`. With a bundler, inject it at build time so it is defined
before any CesiumJS code runs.

## 4. CopyWebpackPlugin destination differs from the DefinePlugin value

**Symptom:** The static directories are present in `dist`, but the app still
404s for them.

**Root cause:** `CopyWebpackPlugin` copies the directories to one path while
`DefinePlugin` tells CesiumJS to look at a different path. The two are out of
sync.

**Fix:** Define one base-URL variable and use it for both: the `to` field of
every `CopyWebpackPlugin` pattern and the `DefinePlugin` `CESIUM_BASE_URL`
value.

## 5. widgets.css not imported

**Symptom:** The globe renders, but the Animation, Timeline, and other widgets
are unstyled, mispositioned, or overlapping.

**Root cause:** The widget layout and icons come from `widgets.css`. Importing
the CesiumJS JavaScript does not pull in the stylesheet.

**Fix:** Add `import "cesium/Build/Cesium/Widgets/widgets.css";` to the entry
module. For `@cesium/engine`, import
`@cesium/engine/Source/Widget/CesiumWidget.css`.

## 6. Sandcastle demo token shipped to production

**Symptom:** A deployed app works briefly, then ion assets fail with `401` or
rate-limit errors.

**Root cause:** Sandcastle injects a shared demo ion token for the gallery.
Code copied from Sandcastle carries no token of its own, or carries the demo
token, which is rate-limited and not valid for deployment.

**Fix:** Create an ion account, generate an access token, and set
`Ion.defaultAccessToken` to it in the application code.

## 7. Sandcastle code relying on the Cesium global

**Symptom:** The app throws `Cesium is not defined` or `Cesium.Viewer is not a
constructor`.

**Root cause:** Sandcastle provides a global `Cesium` object. A bundled project
has no such global; symbols come from the `cesium` module.

**Fix:** Replace every `Cesium.X` reference with an ES6 named import,
`import { X } from "cesium"`.

## 8. Namespace import instead of named imports

**Symptom:** The production bundle is far larger than expected and slow to
load.

**Root cause:** `import * as Cesium from "cesium"` references the whole
namespace, so the bundler cannot tree-shake unused CesiumJS code.

**Fix:** Import only the symbols the app uses,
`import { Viewer, Cartesian3 } from "cesium"`.

## 9. Missing output.sourcePrefix in webpack

**Symptom:** The build succeeds, but a CesiumJS worker throws a syntax error at
runtime.

**Root cause:** webpack indents wrapped module code by default. CesiumJS worker
source is sensitive to that indentation.

**Fix:** Set `output.sourcePrefix` to an empty string in `webpack.config.js`.

## 10. Deprecated sync constructors copied from old Sandcastle examples

**Symptom:** A tileset or model never appears, and the console reports that
`readyPromise` is undefined or that a constructor argument is invalid.

**Root cause:** Older Sandcastle examples used synchronous constructors with
`readyPromise`, removed in CesiumJS 1.107. They fail on 1.124+.

**Fix:** Use the async factories, such as `Cesium3DTileset.fromUrl` and
`Model.fromGltfAsync`. See `cesium-core-versioning` for the full migration.

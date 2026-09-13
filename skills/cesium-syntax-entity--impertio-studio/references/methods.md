# Entity API Reference

All signatures and defaults below are verified against the CesiumJS API
reference (`cesium.com/learn/cesiumjs/ref-doc/`) for the 1.124+ release line.

## Entity

Constructor: `new Cesium.Entity(options)` where `options` is an
`Entity.ConstructorOptions`.

### Entity.ConstructorOptions

| Field | Type | Notes |
|-------|------|-------|
| `id` | `string` | Auto-generated GUID if omitted |
| `name` | `string` | InfoBox title; not unique |
| `availability` | `TimeIntervalCollection` | Entity hidden outside these intervals |
| `show` | `boolean` | Master visibility |
| `description` | `Property` or `string` | HTML for the InfoBox body |
| `position` | `PositionProperty`, `Cartesian3`, or `CallbackPositionProperty` | Required for point/billboard/label/model |
| `orientation` | `Property` or `Quaternion` | Defaults to east-north-up |
| `viewFrom` | `Property` or `Cartesian3` | Suggested tracking offset |
| `parent` | `Entity` | Hierarchy parent |
| graphics fields | see below | `point`, `billboard`, `label`, `polyline`, `polygon`, `model`, `path`, `box`, `corridor`, `cylinder`, `ellipse`, `ellipsoid`, `plane`, `rectangle`, `wall`, `polylineVolume`, `tileset` |

### Entity instance members

| Member | Type | Notes |
|--------|------|-------|
| `id` | `string` | Unique id |
| `name` | `string` or `undefined` | Get or set |
| `position` | `PositionProperty` or `undefined` | Get or set |
| `isShowing` | `boolean` | Accounts for ancestor visibility |
| `definitionChanged` | `Event` (readonly) | Raised when any property changes |

## EntityCollection

`viewer.entities` is an `EntityCollection`.

| Method | Signature | Notes |
|--------|-----------|-------|
| `add` | `add(entity) → Entity` | Accepts an `Entity` or `Entity.ConstructorOptions` |
| `remove` | `remove(entity) → boolean` | `true` if removed |
| `removeById` | `removeById(id) → boolean` | `true` if removed |
| `removeAll` | `removeAll()` | Removes every entity |
| `getById` | `getById(id) → Entity` or `undefined` | Lookup by id |
| `getOrCreateEntity` | `getOrCreateEntity(id) → Entity` | Creates and adds if absent |
| `contains` | `contains(entity) → boolean` | Membership test |
| `suspendEvents` | `suspendEvents()` | Pause change events during a bulk update |
| `resumeEvents` | `resumeEvents()` | Resume; balance every `suspendEvents` |

`values` is the array of `Entity` instances. It MUST NOT be modified directly;
use `add` and `remove`.

## PointGraphics.ConstructorOptions

| Field | Default |
|-------|---------|
| `show` | `true` |
| `pixelSize` | `1` |
| `heightReference` | `HeightReference.NONE` |
| `color` | `Color.WHITE` |
| `outlineColor` | `Color.BLACK` |
| `outlineWidth` | `0` |
| `scaleByDistance` | undefined |
| `translucencyByDistance` | undefined |
| `distanceDisplayCondition` | undefined |
| `disableDepthTestDistance` | undefined |

## BillboardGraphics.ConstructorOptions

| Field | Default |
|-------|---------|
| `show` | `true` |
| `image` | undefined (required to render) |
| `scale` | `1.0` |
| `pixelOffset` | `Cartesian2.ZERO` |
| `eyeOffset` | `Cartesian3.ZERO` |
| `horizontalOrigin` | `HorizontalOrigin.CENTER` |
| `verticalOrigin` | `VerticalOrigin.CENTER` |
| `heightReference` | `HeightReference.NONE` |
| `color` | `Color.WHITE` |
| `rotation` | `0` |
| `alignedAxis` | `Cartesian3.ZERO` |
| `width`, `height` | undefined (natural image size) |

## LabelGraphics.ConstructorOptions

| Field | Default |
|-------|---------|
| `show` | `true` |
| `text` | undefined |
| `font` | `'30px sans-serif'` |
| `style` | `LabelStyle.FILL` |
| `scale` | `1.0` |
| `showBackground` | `false` |
| `backgroundColor` | `new Color(0.165, 0.165, 0.165, 0.8)` |
| `fillColor` | `Color.WHITE` |
| `outlineColor` | `Color.BLACK` |
| `outlineWidth` | `1.0` |
| `horizontalOrigin` | `HorizontalOrigin.CENTER` |
| `verticalOrigin` | `VerticalOrigin.CENTER` |
| `heightReference` | `HeightReference.NONE` |
| `pixelOffset` | `Cartesian2.ZERO` |
| `eyeOffset` | `Cartesian3.ZERO` |

## PolylineGraphics.ConstructorOptions

| Field | Default |
|-------|---------|
| `show` | `true` |
| `positions` | undefined (required to render) |
| `width` | `1.0` |
| `granularity` | `Math.RADIANS_PER_DEGREE` |
| `material` | `Color.WHITE` |
| `depthFailMaterial` | undefined |
| `arcType` | `ArcType.GEODESIC` |
| `clampToGround` | `false` |
| `shadows` | `ShadowMode.DISABLED` |
| `classificationType` | `ClassificationType.BOTH` |
| `zIndex` | `0` |

## PolygonGraphics.ConstructorOptions

| Field | Default |
|-------|---------|
| `show` | `true` |
| `hierarchy` | undefined; accepts `PolygonHierarchy` or `Array<Cartesian3>` |
| `height` | `0` |
| `heightReference` | `HeightReference.NONE` |
| `extrudedHeight` | undefined |
| `extrudedHeightReference` | `HeightReference.NONE` |
| `material` | `Color.WHITE` |
| `fill` | `true` |
| `outline` | `false` |
| `outlineColor` | `Color.BLACK` |
| `outlineWidth` | `1.0` |
| `perPositionHeight` | `false` |
| `classificationType` | `ClassificationType.BOTH` |
| `arcType` | `ArcType.GEODESIC` |
| `zIndex` | `0` |

## The Property classes

### ConstantProperty

`new Cesium.ConstantProperty(value)`. `getValue(time, result)` ignores `time`.
`setValue(value)` changes it. `isConstant` is readonly and always `true`. A raw
value assigned to a graphics field is wrapped in a `ConstantProperty`
automatically.

### SampledProperty

`new Cesium.SampledProperty(type, derivativeTypes?)`.

| Method | Signature |
|--------|-----------|
| `addSample` | `addSample(time, value, derivatives?)` |
| `addSamples` | `addSamples(times, values, derivativeValues?)` |
| `setInterpolationOptions` | `setInterpolationOptions({ interpolationAlgorithm, interpolationDegree })` |
| `getValue` | `getValue(time?, result?)` |

`forwardExtrapolationType` and `backwardExtrapolationType` default to
`ExtrapolationType.NONE`.

### CallbackProperty

`new Cesium.CallbackProperty(callback, isConstant)`. `isConstant` is `true`
when the callback returns the same value every time, `false` when the value
changes. ALWAYS pass `false` for an animated callback or CesiumJS caches the
first result. `getValue(time, result)` invokes the callback.

`CallbackPositionProperty` is the position-typed equivalent for a `position`
field:
`new Cesium.CallbackPositionProperty(callback, isConstant, referenceFrame?)`.

## Material properties

| Class | Constructor | Notes |
|-------|-------------|-------|
| `ColorMaterialProperty` | `new ColorMaterialProperty(color?)` | `color` defaults to `Color.WHITE`. A raw `Color` on a `material` field is wrapped in this. |
| `PolylineGlowMaterialProperty` | `new PolylineGlowMaterialProperty({ color?, glowPower?, taperPower? })` | `color` default `Color.WHITE`, `glowPower` default `0.25`, `taperPower` default `1.0` |
| `PolylineDashMaterialProperty` | `new PolylineDashMaterialProperty({ color?, gapColor?, dashLength?, dashPattern? })` | Dashed line |
| `PolylineArrowMaterialProperty` | `new PolylineArrowMaterialProperty(color?)` | Arrowhead line |
| `PolylineOutlineMaterialProperty` | `new PolylineOutlineMaterialProperty({ color?, outlineColor?, outlineWidth? })` | Outlined line |
| `ImageMaterialProperty` | `new ImageMaterialProperty({ image, repeat?, color?, transparent? })` | Textured fill |
| `GridMaterialProperty`, `StripeMaterialProperty`, `CheckerboardMaterialProperty` | pattern fills | For polygon and surface fills |

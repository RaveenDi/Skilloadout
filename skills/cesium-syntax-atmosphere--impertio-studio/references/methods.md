# Atmosphere and Lighting : Verified API Reference

> CesiumJS 1.124+. Every signature and default verified via WebFetch against
> cesium.com/learn/cesiumjs/ref-doc on 2026-05-20.

## Scene members

| Member | Type | Notes |
|--------|------|-------|
| `scene.skyAtmosphere` | `SkyAtmosphere` | the halo around the globe, 3D only |
| `scene.skyBox` | `SkyBox` | the star field |
| `scene.sun` | `Sun` | the sun disc |
| `scene.moon` | `Moon` | the moon disc |
| `scene.fog` | `Fog` | distance haze |
| `scene.light` | `Light` | shading light, defaults to a `SunLight` |
| `scene.globe` | `Globe` | ground atmosphere and terrain lighting |
| `scene.backgroundColor` | `Color` | canvas clear color, default `Color.BLACK` |
| `scene.sunBloom` | boolean | sun bloom post-process, default `true` |

A `Viewer` and a `CesiumWidget` build `skyAtmosphere`, `skyBox`, `sun`, and
`moon` during construction.

## SkyAtmosphere

Constructor: `new Cesium.SkyAtmosphere(ellipsoid)`. `ellipsoid` is optional,
default `Ellipsoid.WGS84`. Renders ONLY in 3D; fades out in 2D and Columbus
view.

| Property | Type | Default |
|----------|------|---------|
| `show` | boolean | `true` |
| `hueShift` | number | `0.0` |
| `saturationShift` | number | `0.0` |
| `brightnessShift` | number | `0.0` |
| `atmosphereLightIntensity` | number | `50.0` |
| `atmosphereRayleighCoefficient` | `Cartesian3` | `(5.5e-6, 13.0e-6, 28.4e-6)` |
| `atmosphereMieCoefficient` | `Cartesian3` | `(21e-6, 21e-6, 21e-6)` |
| `atmosphereRayleighScaleHeight` | number | `10000.0` |
| `atmosphereMieScaleHeight` | number | `3200.0` |
| `atmosphereMieAnisotropy` | number | `0.9` |
| `perFragmentAtmosphere` | boolean | `false` |

## Globe : atmosphere and lighting members

| Property | Type | Default |
|----------|------|---------|
| `show` | boolean | `true` |
| `enableLighting` | boolean | `false` |
| `showGroundAtmosphere` | boolean | `true` on the WGS84 ellipsoid |
| `dynamicAtmosphereLighting` | boolean | `true` |
| `dynamicAtmosphereLightingFromSun` | boolean | `false` |
| `atmosphereLightIntensity` | number | `10.0` |
| `atmosphereRayleighCoefficient` | `Cartesian3` | `(5.5e-6, 13.0e-6, 28.4e-6)` |
| `atmosphereMieCoefficient` | `Cartesian3` | `(21e-6, 21e-6, 21e-6)` |
| `atmosphereRayleighScaleHeight` | number | `10000.0` |
| `atmosphereMieScaleHeight` | number | `3200.0` |
| `atmosphereMieAnisotropy` | number | `0.9` |
| `lightingFadeInDistance` | number | `pi * minimumRadius` |
| `lightingFadeOutDistance` | number | `0.5 * pi * minimumRadius` |
| `nightFadeInDistance` | number | `2.5 * pi * minimumRadius` |
| `nightFadeOutDistance` | number | `0.5 * pi * minimumRadius` |

`atmosphereLightIntensity`, the coefficient members, the scale-height members,
and `atmosphereMieAnisotropy` exist on BOTH `SkyAtmosphere` and `Globe` as
independent properties.

## Fog

Constructor: `new Cesium.Fog()`.

| Property | Type | Default |
|----------|------|---------|
| `enabled` | boolean | `true` |
| `renderable` | boolean | `true` |
| `density` | number | `0.0006` |
| `visualDensityScalar` | number | `0.15` |
| `heightScalar` | number | `0.001` |
| `maxHeight` | number | `800000.0` |
| `minimumBrightness` | number | `0.03` |
| `screenSpaceErrorFactor` | number | `2.0` |

## SkyBox

Constructor: `new Cesium.SkyBox(options)`. `options.sources` holds six cube-map
faces: `positiveX`, `negativeX`, `positiveY`, `negativeY`, `positiveZ`,
`negativeZ`, each a URL string or an `Image`. `options.show` defaults `true`.
Instance properties: `show` (default `true`), `sources`.

## Sun

Constructor: `new Cesium.Sun()`. Instance properties: `show` (default `true`),
`glowFactor` (default `1.0`; `0` shows the disc without flare).

## Moon

Constructor: `new Cesium.Moon(options)`.

| Option | Type | Default |
|--------|------|---------|
| `show` | boolean | `true` |
| `textureUrl` | string | the bundled `moonSmall.jpg` |
| `ellipsoid` | `Ellipsoid` | `Ellipsoid.MOON` |
| `onlySunLighting` | boolean | `true` |

## Light : SunLight and DirectionalLight

`scene.light` accepts any `Light`. Two implementations ship.

`new Cesium.SunLight(options)` follows the real sun position.

| Option | Type | Default |
|--------|------|---------|
| `color` | `Color` | `Color.WHITE` |
| `intensity` | number | `2.0` |

`new Cesium.DirectionalLight(options)` emits from one fixed direction.

| Option | Type | Default |
|--------|------|---------|
| `direction` | `Cartesian3` | required, must be non-zero |
| `color` | `Color` | `Color.WHITE` |
| `intensity` | number | `1.0` |

A zero-length `direction` throws `DeveloperError`,
"options.direction cannot be zero-length".

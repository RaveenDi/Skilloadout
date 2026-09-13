# Atmosphere and Lighting : Examples

> CesiumJS 1.124+. All snippets verified against cesium.com ref-doc on
> 2026-05-20. Each assumes a constructed `viewer`.

## Pure black space

```js
// Hide the halo and the star field.
viewer.scene.skyAtmosphere.show = false;
viewer.scene.skyBox.show = false;
// What remains behind the globe is scene.backgroundColor (default black).
```

## Brighten the sky halo

```js
const sky = viewer.scene.skyAtmosphere;
sky.atmosphereLightIntensity = 100.0; // default 50.0
sky.brightnessShift = 0.2;            // -1.0 to 1.0
sky.saturationShift = 0.1;
```

## Day-night terminator on the globe

```js
// enableLighting defaults to false: without this the globe is evenly lit.
viewer.scene.globe.enableLighting = true;
// Advance the clock so the terminator moves.
viewer.clock.shouldAnimate = true;
```

## Tune the ground atmosphere

```js
const globe = viewer.scene.globe;
globe.showGroundAtmosphere = true;       // surface haze near the horizon
globe.atmosphereLightIntensity = 20.0;   // default 10.0, distinct from skyAtmosphere
```

## Replace the moving sun with a fixed light

```js
// A DirectionalLight never moves with the clock.
viewer.scene.light = new Cesium.DirectionalLight({
  direction: Cesium.Cartesian3.normalize(
    new Cesium.Cartesian3(1.0, 0.0, -1.0),
    new Cesium.Cartesian3()
  ),
  intensity: 2.0,
});
```

## Restore the sun-following light

```js
viewer.scene.light = new Cesium.SunLight();
```

## A custom star field

```js
viewer.scene.skyBox = new Cesium.SkyBox({
  sources: {
    positiveX: "/skybox/px.jpg",
    negativeX: "/skybox/nx.jpg",
    positiveY: "/skybox/py.jpg",
    negativeY: "/skybox/ny.jpg",
    positiveZ: "/skybox/pz.jpg",
    negativeZ: "/skybox/nz.jpg",
  },
});
```

## Sun disc without lens flare

```js
viewer.scene.sun.show = true;
viewer.scene.sun.glowFactor = 0.0; // disc only, no flare
viewer.scene.sunBloom = false;     // no bloom post-process
```

## Hide the moon

```js
viewer.scene.moon.show = false;
```

## Thicker distance haze

```js
const fog = viewer.scene.fog;
fog.enabled = true;
fog.density = 0.0012;        // default 0.0006
fog.minimumBrightness = 0.1; // default 0.03
```

## Disable fog, then measure performance

```js
// Fog also lowers distant-terrain detail; disabling it raises the tile load.
viewer.scene.fog.enabled = false;
```

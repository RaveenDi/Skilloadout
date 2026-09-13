# Entity Examples

Complete, runnable patterns. All code is verified against the CesiumJS 1.124+
API reference. Examples use the `Cesium.` namespace prefix.

## 1. A marker: point plus label

```javascript
const marker = viewer.entities.add({
  id: "site-42",
  name: "Pumping Station",
  position: Cesium.Cartesian3.fromDegrees(4.9041, 52.3676, 0.0),
  point: {
    pixelSize: 12,
    color: Cesium.Color.CYAN,
    outlineColor: Cesium.Color.BLACK,
    outlineWidth: 2,
    heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
  },
  label: {
    text: "Pumping Station",
    font: "14px sans-serif",
    pixelOffset: new Cesium.Cartesian2(0, -24),
    showBackground: true,
  },
  description: "<h3>Pumping Station</h3><p>Built 1998.</p>",
});

viewer.flyTo(marker);
```

## 2. A billboard with an image

```javascript
viewer.entities.add({
  position: Cesium.Cartesian3.fromDegrees(2.3522, 48.8566, 0.0),
  billboard: {
    image: "/icons/landmark.png",          // must be a reachable, loaded URL
    width: 32,
    height: 32,
    verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
    heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
  },
});
```

## 3. A filled polygon

```javascript
viewer.entities.add({
  name: "Survey Area",
  polygon: {
    hierarchy: Cesium.Cartesian3.fromDegreesArray([
      -75.17, 39.95, -75.16, 39.95, -75.16, 39.96, -75.17, 39.96,
    ]),
    material: Cesium.Color.ORANGE.withAlpha(0.5), // raw Color is auto-wrapped
    outline: true,
    outlineColor: Cesium.Color.ORANGE,
  },
});
```

## 4. An extruded polygon (a 3D block)

```javascript
viewer.entities.add({
  polygon: {
    hierarchy: Cesium.Cartesian3.fromDegreesArray([
      4.890, 52.373, 4.892, 52.373, 4.892, 52.375, 4.890, 52.375,
    ]),
    extrudedHeight: 40.0,                  // meters
    material: Cesium.Color.STEELBLUE,
    outline: true,
    outlineColor: Cesium.Color.BLACK,
  },
});
```

## 5. A glowing polyline

```javascript
viewer.entities.add({
  polyline: {
    positions: Cesium.Cartesian3.fromDegreesArrayHeights([
      -75.17, 39.95, 150.0, -75.16, 39.96, 320.0, -75.15, 39.95, 150.0,
    ]),
    width: 8,
    material: new Cesium.PolylineGlowMaterialProperty({
      color: Cesium.Color.CYAN,
      glowPower: 0.25,
      taperPower: 1.0,
    }),
  },
});
```

## 6. A ground-clamped polyline

```javascript
viewer.entities.add({
  polyline: {
    positions: Cesium.Cartesian3.fromDegreesArray([
      -75.17, 39.95, -75.15, 39.96,
    ]),
    width: 4,
    clampToGround: true,                   // drapes the line over terrain
    material: Cesium.Color.RED,
  },
});
```

## 7. A time-dynamic value with SampledProperty

```javascript
// A point whose color is driven by a time-indexed temperature sample set.
const temperature = new Cesium.SampledProperty(Number);
temperature.addSample(Cesium.JulianDate.fromIso8601("2026-05-20T06:00:00Z"), 8);
temperature.addSample(Cesium.JulianDate.fromIso8601("2026-05-20T14:00:00Z"), 22);
temperature.addSample(Cesium.JulianDate.fromIso8601("2026-05-20T22:00:00Z"), 11);
temperature.setInterpolationOptions({
  interpolationAlgorithm: Cesium.LinearApproximation,
  interpolationDegree: 1,
});
```

## 8. An animated CallbackProperty (isConstant must be false)

```javascript
let radius = 100.0;
viewer.entities.add({
  position: Cesium.Cartesian3.fromDegrees(4.9, 52.37, 0.0),
  ellipse: {
    // The callback returns a changing value, so isConstant is false.
    semiMinorAxis: new Cesium.CallbackProperty(() => radius, false),
    semiMajorAxis: new Cesium.CallbackProperty(() => radius, false),
    material: Cesium.Color.YELLOW.withAlpha(0.4),
  },
});

viewer.clock.onTick.addEventListener(() => {
  radius = 100.0 + 50.0 * Math.sin(Date.now() / 1000);
});
```

## 9. A callback-driven position

```javascript
let lon = 4.9;
viewer.entities.add({
  // CallbackPositionProperty is the position-typed callback. isConstant false.
  position: new Cesium.CallbackPositionProperty(() => {
    return Cesium.Cartesian3.fromDegrees(lon, 52.37, 100.0);
  }, false),
  point: { pixelSize: 10, color: Cesium.Color.LIME },
});

viewer.clock.onTick.addEventListener(() => {
  lon += 0.0001;
});
```

## 10. Bulk add with suspended events

```javascript
function addAll(viewer, features) {
  viewer.entities.suspendEvents();
  for (const feature of features) {
    viewer.entities.add({
      position: Cesium.Cartesian3.fromDegrees(feature.lon, feature.lat, 0.0),
      point: { pixelSize: 6, color: Cesium.Color.WHITE },
    });
  }
  viewer.entities.resumeEvents();          // balances suspendEvents exactly once
}
```

Use this for several hundred entities or more. Beyond ~10000 entities switch to
batched primitives instead.

## 11. Parent hierarchy and availability

```javascript
const group = viewer.entities.add({ name: "Sensor Group", show: true });

viewer.entities.add({
  parent: group,                           // hidden when the group is hidden
  availability: new Cesium.TimeIntervalCollection([
    Cesium.TimeInterval.fromIso8601({ iso8601: "2026-05-20/2026-05-21" }),
  ]),
  position: Cesium.Cartesian3.fromDegrees(4.9, 52.37, 0.0),
  point: { pixelSize: 8, color: Cesium.Color.MAGENTA },
});

group.show = false;                        // child.isShowing is now false too
```

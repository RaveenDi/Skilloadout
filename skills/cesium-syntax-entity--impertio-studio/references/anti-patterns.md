# Entity Anti-Patterns

Each entry: the broken code, the symptom, the root cause, and the fix. These
are the verified failure modes behind invisible entities, frozen callbacks, and
scenes that slow down at scale, drawn from CesiumGS GitHub issues and the API
reference.

## 1. Entity with no graphics field

```javascript
// BROKEN: the entity has a position but nothing to draw.
viewer.entities.add({
  position: Cesium.Cartesian3.fromDegrees(4.9, 52.37, 0.0),
});
```

Symptom: the entity is in the collection, `getById` finds it, but nothing
appears on the globe.

Root cause: an `Entity` is a container. Without a graphics field (`point`,
`billboard`, `polygon`, and so on) there is nothing to visualize.

Fix: set at least one graphics object.

```javascript
viewer.entities.add({
  position: Cesium.Cartesian3.fromDegrees(4.9, 52.37, 0.0),
  point: { pixelSize: 10, color: Cesium.Color.YELLOW },
});
```

## 2. Point, billboard, or label without a position

```javascript
// BROKEN: a point graphic with no position.
viewer.entities.add({ point: { pixelSize: 10 } });
```

Symptom: the marker never appears; no error is thrown.

Root cause: `point`, `billboard`, `label`, and `model` are located graphics.
They render at the entity `position`. With no position there is no place to
draw them.

Fix: provide `position`. Polygon uses `hierarchy` and polyline uses
`positions` instead, so those two do not need an entity `position`.

## 3. Animated CallbackProperty with isConstant true

```javascript
// BROKEN: isConstant true caches the first evaluation.
let angle = 0;
viewer.entities.add({
  position: Cesium.Cartesian3.fromDegrees(4.9, 52.37, 0.0),
  ellipse: {
    semiMajorAxis: new Cesium.CallbackProperty(() => 100 + angle, true),
    semiMinorAxis: new Cesium.CallbackProperty(() => 100 + angle, true),
    material: Cesium.Color.YELLOW,
  },
});
```

Symptom: the value is correct on the first frame and then frozen forever, even
though the callback keeps running elsewhere.

Root cause: the second `CallbackProperty` argument is `isConstant`. When `true`,
CesiumJS assumes the callback always returns the same value and caches the
first result.

Fix: pass `false` for any callback whose return value changes.

```javascript
new Cesium.CallbackProperty(() => 100 + angle, false);
```

## 4. Billboard image that fails to load

```javascript
// BROKEN: the image path is wrong; the request 404s.
viewer.entities.add({
  position: Cesium.Cartesian3.fromDegrees(2.35, 48.86, 0.0),
  billboard: { image: "icons/missing-icon.png" },
});
```

Symptom: no billboard appears. The console shows a network 404 but CesiumJS
throws no error.

Root cause: a billboard renders the texture at `image`. A failed image load
leaves nothing to draw. A relative path resolved against the wrong base also
fails silently.

Fix: use a reachable absolute path or an already-loaded `HTMLCanvasElement` or
`HTMLImageElement`. Verify the URL loads in the browser network panel.

## 5. Tens of thousands of entities

```javascript
// BROKEN: 80000 entities; the EntityCollection visualizer loops all of them.
for (let i = 0; i < 80000; i++) {
  viewer.entities.add({ position: positions[i], point: { pixelSize: 4 } });
}
```

Symptom: the frame rate collapses and the tab eventually crashes with an
out-of-memory error.

Root cause: the `EntityCollection` visualizer iterates every entity every
frame. Past roughly 10000 entities this dominates the frame budget; past
roughly 100000 the tab runs out of memory (issues #6081, #9912).

Fix: use batched `GeometryInstance` primitives (`cesium-syntax-primitive`) or
stream the data as 3D Tiles (`cesium-syntax-3d-tiles`). Reserve entities for
interactive or time-dynamic data below ~10000 objects.

## 6. Expecting removed entities to free memory instantly

```javascript
// MISDIAGNOSIS: removeAll() is called, but the heap stays high.
viewer.entities.removeAll();
```

Symptom: memory does not drop immediately after removing many entities; a
40000-point data source can take seconds to clear.

Root cause: removing entities frees their primitive memory over subsequent
frames, not synchronously (issues #6534, #8767). An immediate measurement is
not evidence of a leak.

Fix: allow several frames after `removeAll`, then measure. For repeated
load/clear cycles prefer one `DataSource` that is replaced, or batched
primitives. See `cesium-core-memory`.

## 7. Entity floating above or buried under terrain

```javascript
// BROKEN: no heightReference; the point sits at the position height.
viewer.entities.add({
  position: Cesium.Cartesian3.fromDegrees(86.925, 27.988), // height defaults to 0
  point: { pixelSize: 10 },
});
```

Symptom: in a scene with terrain, the point floats in the air or is hidden
inside a mountain.

Root cause: with `heightReference` left at `HeightReference.NONE`, the entity
renders at the height baked into its position, which is `0` (the ellipsoid)
when omitted. Terrain elevation is independent of the ellipsoid.

Fix: set a height reference so the entity follows terrain.

```javascript
point: {
  pixelSize: 10,
  heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
}
```

## 8. Modifying entities.values directly

```javascript
// BROKEN: pushing onto the backing array bypasses the collection.
viewer.entities.values.push(new Cesium.Entity({ point: { pixelSize: 8 } }));
```

Symptom: the entity is in the array but is never visualized and never picked.

Root cause: `EntityCollection.values` is a read-only view. Adding through it
skips the change events the visualizer depends on.

Fix: ALWAYS go through the collection API.

```javascript
viewer.entities.add({
  position: Cesium.Cartesian3.fromDegrees(4.9, 52.37, 0.0),
  point: { pixelSize: 8 },
});
```

## 9. Unbalanced suspendEvents

```javascript
// BROKEN: suspendEvents without a matching resumeEvents.
viewer.entities.suspendEvents();
for (const f of features) {
  viewer.entities.add({ position: f.position, point: { pixelSize: 6 } });
}
// resumeEvents was forgotten
```

Symptom: none of the entities appear; later add and remove calls also seem to
do nothing visible.

Root cause: `suspendEvents` pauses the change events the visualizer needs.
Until a matching `resumeEvents` runs, the collection stays frozen.

Fix: pair every `suspendEvents` with exactly one `resumeEvents`, ideally in a
`try` / `finally` so an exception inside the loop cannot strand the collection.

```javascript
viewer.entities.suspendEvents();
try {
  for (const f of features) {
    viewer.entities.add({ position: f.position, point: { pixelSize: 6 } });
  }
} finally {
  viewer.entities.resumeEvents();
}
```

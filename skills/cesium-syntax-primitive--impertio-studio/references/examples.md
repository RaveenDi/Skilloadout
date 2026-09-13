# Examples: Primitive API

Companion to `SKILL.md`. Every snippet runs on CesiumJS 1.124+. No WebGPU
path exists; CesiumJS is WebGL2 only.

## 1. Single Box With Per-Instance Color

The full three-layer build: `Geometry`, `GeometryInstance`, `Primitive`.

```js
const instance = new Cesium.GeometryInstance({
  geometry: new Cesium.BoxGeometry({
    vertexFormat: Cesium.PerInstanceColorAppearance.VERTEX_FORMAT,
    maximum: new Cesium.Cartesian3(20.0, 20.0, 20.0),
    minimum: new Cesium.Cartesian3(-20.0, -20.0, -20.0),
  }),
  modelMatrix: Cesium.Transforms.eastNorthUpToFixedFrame(
    Cesium.Cartesian3.fromDegrees(4.9, 52.37, 50.0),
  ),
  id: "box-1",
  attributes: {
    color: Cesium.ColorGeometryInstanceAttribute.fromColor(Cesium.Color.ORANGE),
  },
});

const primitive = new Cesium.Primitive({
  geometryInstances: instance,
  appearance: new Cesium.PerInstanceColorAppearance({ closed: true }),
});

viewer.scene.primitives.add(primitive);
```

## 2. Many Instances Batched Into One Primitive

The core scale use-case: thousands of shapes in one draw batch.

```js
const instances = [];
for (let i = 0; i < 5000; i++) {
  const lon = 4.0 + Math.random();
  const lat = 52.0 + Math.random();
  instances.push(
    new Cesium.GeometryInstance({
      geometry: new Cesium.EllipsoidGeometry({
        vertexFormat: Cesium.PerInstanceColorAppearance.VERTEX_FORMAT,
        radii: new Cesium.Cartesian3(30.0, 30.0, 30.0),
      }),
      modelMatrix: Cesium.Transforms.eastNorthUpToFixedFrame(
        Cesium.Cartesian3.fromDegrees(lon, lat, 100.0),
      ),
      id: `sphere-${i}`,
      attributes: {
        color: Cesium.ColorGeometryInstanceAttribute.fromColor(
          Cesium.Color.fromRandom({ alpha: 1.0 }),
        ),
      },
    }),
  );
}

const primitive = new Cesium.Primitive({
  geometryInstances: instances,
  appearance: new Cesium.PerInstanceColorAppearance(),
});

viewer.scene.primitives.add(primitive);
```

## 3. GroundPrimitive: Polygon Draped on Terrain

```js
const drape = new Cesium.GroundPrimitive({
  geometryInstances: new Cesium.GeometryInstance({
    geometry: new Cesium.PolygonGeometry({
      polygonHierarchy: new Cesium.PolygonHierarchy(
        Cesium.Cartesian3.fromDegreesArray([
          4.88, 52.36, 4.93, 52.36, 4.93, 52.40, 4.88, 52.40,
        ]),
      ),
    }),
    attributes: {
      color: Cesium.ColorGeometryInstanceAttribute.fromColor(
        Cesium.Color.LIME.withAlpha(0.5),
      ),
    },
  }),
  classificationType: Cesium.ClassificationType.TERRAIN,
});

viewer.scene.primitives.add(drape);
```

The polygon needs no height values. The terrain surface supplies them.

## 4. GroundPrimitive With a Material, Guarded by a Support Check

```js
const scene = viewer.scene;

if (Cesium.GroundPrimitive.supportsMaterials(scene)) {
  const striped = new Cesium.GroundPrimitive({
    geometryInstances: new Cesium.GeometryInstance({
      geometry: new Cesium.RectangleGeometry({
        rectangle: Cesium.Rectangle.fromDegrees(4.85, 52.35, 4.95, 52.42),
      }),
    }),
    appearance: new Cesium.MaterialAppearance({
      material: Cesium.Material.fromType("Stripe"),
    }),
  });
  scene.primitives.add(striped);
} else {
  console.warn("This scene does not support materials on GroundPrimitive.");
}
```

ALWAYS gate a `MaterialAppearance` on a `GroundPrimitive` behind
`GroundPrimitive.supportsMaterials(scene)`.

## 5. ClassificationPrimitive: Volume Highlight

`ClassificationPrimitive` highlights surface geometry enclosed by a volume.
Every instance must share one color.

```js
const SHARED_COLOR = Cesium.ColorGeometryInstanceAttribute.fromColor(
  Cesium.Color.RED.withAlpha(0.5),
);

const highlight = new Cesium.ClassificationPrimitive({
  geometryInstances: new Cesium.GeometryInstance({
    geometry: new Cesium.BoxGeometry({
      vertexFormat: Cesium.PerInstanceColorAppearance.VERTEX_FORMAT,
      maximum: new Cesium.Cartesian3(50.0, 50.0, 50.0),
      minimum: new Cesium.Cartesian3(-50.0, -50.0, -50.0),
    }),
    modelMatrix: Cesium.Transforms.eastNorthUpToFixedFrame(
      Cesium.Cartesian3.fromDegrees(4.9, 52.37, 0.0),
    ),
    attributes: { color: SHARED_COLOR },
  }),
  appearance: new Cesium.PerInstanceColorAppearance({ flat: true }),
});

viewer.scene.primitives.add(highlight);
```

A differing color across instances throws a `DeveloperError` on first render.

## 6. Picking a Batched Instance by id

```js
const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
handler.setInputAction((movement) => {
  const picked = viewer.scene.pick(movement.position);
  if (Cesium.defined(picked) && Cesium.defined(picked.id)) {
    console.log("Picked instance:", picked.id);
  }
}, Cesium.ScreenSpaceEventType.LEFT_CLICK);
```

`scene.pick` returns the `GeometryInstance` `id` for a batched primitive.

## 7. Updating a Per-Instance Attribute After Build

```js
// Toggle one instance off without rebuilding the primitive.
const attributes = primitive.getGeometryInstanceAttributes("sphere-42");
attributes.show = Cesium.ShowGeometryInstanceAttribute.toValue(false);
viewer.scene.requestRender();
```

Update through `getGeometryInstanceAttributes(id)`. NEVER mutate the original
`GeometryInstance`; after build it no longer drives the primitive.

## 8. Removing a Primitive

```js
function removePrimitive(scene, primitive) {
  if (scene.primitives.contains(primitive)) {
    scene.primitives.remove(primitive);
  }
}
```

`remove` destroys the primitive by default. The removed primitive object is
destroyed and NEVER reusable; build a fresh one if needed again.

# Methods Reference: Primitive API

Companion to `SKILL.md`. All signatures, option names, and defaults verified
against the CesiumJS API reference (`cesium.com/learn/cesiumjs/ref-doc/`) on
2026-05-20.

## 1. Primitive Constructor

```js
new Cesium.Primitive(options);
```

| Option | Type | Default |
|--------|------|---------|
| `geometryInstances` | `GeometryInstance` or `GeometryInstance[]` | undefined |
| `appearance` | `Appearance` | undefined |
| `depthFailAppearance` | `Appearance` | undefined |
| `show` | boolean | `true` |
| `modelMatrix` | `Matrix4` | `Matrix4.IDENTITY` |
| `vertexCacheOptimize` | boolean | `false` |
| `interleave` | boolean | `false` |
| `compressVertices` | boolean | `true` |
| `releaseGeometryInstances` | boolean | `true` |
| `allowPicking` | boolean | `true` |
| `cull` | boolean | `true` |
| `asynchronous` | boolean | `true` |
| `debugShowBoundingVolume` | boolean | `false` |
| `shadows` | `ShadowMode` | `ShadowMode.DISABLED` |

### Behavior notes

- `asynchronous: true` builds geometry on a web worker. The primitive renders
  once building completes. `asynchronous: false` builds synchronously on the
  main thread and blocks until done.
- `releaseGeometryInstances: true` releases the input instances after build,
  so `primitive.geometryInstances` becomes `undefined`. Keep a separate
  reference if the instances are needed later.
- `depthFailAppearance` shades fragments that fail the depth test, useful for
  geometry partly behind terrain.
- The instance property `ready` (readonly boolean) reports whether geometry
  has finished building. Normal code does not read it; adding the primitive to
  `scene.primitives` is enough for the render loop to display it.

## 2. GeometryInstance Constructor

```js
new Cesium.GeometryInstance(options);
```

| Option | Type | Default |
|--------|------|---------|
| `geometry` | `Geometry` or `GeometryFactory` | required |
| `modelMatrix` | `Matrix4` | `Matrix4.IDENTITY` |
| `id` | object | undefined |
| `attributes` | object | `{}` |

`id` is returned by `Scene#pick` when a batched instance is clicked.
`attributes` is an object whose values are per-instance attribute objects.

## 3. Per-Instance Attribute Classes

| Class | Construction | Purpose |
|-------|--------------|---------|
| `ColorGeometryInstanceAttribute` | `ColorGeometryInstanceAttribute.fromColor(color)` | Per-instance color |
| `ShowGeometryInstanceAttribute` | `new ShowGeometryInstanceAttribute(show)` | Per-instance visibility |
| `DistanceDisplayConditionGeometryInstanceAttribute` | `new DistanceDisplayConditionGeometryInstanceAttribute(near, far)` | Per-instance visible distance range |

After build, read and write attributes through
`primitive.getGeometryInstanceAttributes(id)`, which returns the live
attribute object for that instance.

## 4. Appearance Classes

### PerInstanceColorAppearance

```js
new Cesium.PerInstanceColorAppearance(options);
```

| Option | Type | Default |
|--------|------|---------|
| `flat` | boolean | `false` |
| `faceForward` | boolean | `!options.closed` |
| `translucent` | boolean | `true` |
| `closed` | boolean | `false` |
| `vertexShaderSource` | string | default shader |
| `fragmentShaderSource` | string | default shader |
| `renderState` | object | default render state |

Static `PerInstanceColorAppearance.VERTEX_FORMAT` is the `VertexFormat` to
assign to geometry shaded by this appearance.

### Other appearances

| Class | Use for | Color source |
|-------|---------|--------------|
| `MaterialAppearance` | Geometry shaded by a `Material` | Shared `Material` |
| `EllipsoidSurfaceAppearance` | Geometry on the ellipsoid surface | Shared `Material` |
| `PolylineColorAppearance` | `PolylineGeometry`, per-instance color | Per-instance attribute |
| `PolylineMaterialAppearance` | `PolylineGeometry` shaded by a `Material` | Shared `Material` |

`MaterialAppearance` accepts a `materialSupport` value
(`MaterialAppearance.MaterialSupport.BASIC`, `TEXTURED`, or `ALL`); the
matching `vertexFormat` is on the chosen support level.

## 5. GroundPrimitive Constructor

```js
new Cesium.GroundPrimitive(options);
```

| Option | Type | Default |
|--------|------|---------|
| `geometryInstances` | `GeometryInstance` or `GeometryInstance[]` | undefined |
| `appearance` | `Appearance` | undefined |
| `show` | boolean | `true` |
| `classificationType` | `ClassificationType` | `ClassificationType.BOTH` |
| `asynchronous` | boolean | `true` |
| `debugShowBoundingVolume` | boolean | `false` |
| `debugShowShadowVolume` | boolean | `false` |

### Static methods

| Method | Returns | Meaning |
|--------|---------|---------|
| `GroundPrimitive.isSupported(scene)` | boolean | Whether ground primitives are supported in this scene |
| `GroundPrimitive.supportsMaterials(scene)` | boolean | Whether materials on ground primitives are supported (needs `WEBGL_depth_texture`) |

### Supported geometry types

`GroundPrimitive` accepts only `CircleGeometry`, `CorridorGeometry`,
`EllipseGeometry`, `PolygonGeometry`, and `RectangleGeometry`. These are
2D-footprint geometries; the terrain or 3D Tiles surface supplies height.

## 6. ClassificationPrimitive Constructor

```js
new Cesium.ClassificationPrimitive(options);
```

| Option | Type | Default |
|--------|------|---------|
| `geometryInstances` | `GeometryInstance` or `GeometryInstance[]` | undefined |
| `appearance` | `Appearance` | undefined |
| `show` | boolean | `true` |
| `classificationType` | `ClassificationType` | `ClassificationType.BOTH` |
| `asynchronous` | boolean | `true` |

### Restrictions

- Only `PerInstanceColorAppearance` is supported.
- Every geometry instance MUST carry the same color. A differing color throws
  a `DeveloperError` on the first render.
- For full appearance support when classifying terrain or 3D Tiles, use
  `GroundPrimitive` instead.

## 7. ClassificationType Enum

| Value | Classifies |
|-------|-----------|
| `ClassificationType.TERRAIN` | Terrain only |
| `ClassificationType.CESIUM_3D_TILE` | 3D Tiles only |
| `ClassificationType.BOTH` | Terrain and 3D Tiles |

## 8. PrimitiveCollection

`scene.primitives` is the scene-wide `PrimitiveCollection`.

| Member | Effect |
|--------|--------|
| `add(primitive, index?)` | Add a primitive; returns it |
| `remove(primitive)` | Remove and destroy the primitive; returns `true` if present |
| `removeAll()` | Remove and destroy every primitive |
| `contains(primitive)` | Report membership |
| `get(index)` | Primitive at an index |
| `length` | Count of primitives |
| `destroyPrimitives` | When `true` (default), `remove` and `removeAll` destroy the primitive |

Set `destroyPrimitives = false` only when a primitive must outlive its removal
from the collection.

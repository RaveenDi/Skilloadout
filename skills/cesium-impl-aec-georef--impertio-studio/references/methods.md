# AEC Georeferencing : Verified API Reference

> CesiumJS 1.124+ unless noted. Every signature verified via WebFetch against
> cesium.com/learn/cesiumjs/ref-doc and the CesiumGS/cesium CHANGES.md on
> 2026-05-20.

## Transforms

`static Transforms.eastNorthUpToFixedFrame(origin, ellipsoid, result) -> Matrix4`
- `origin` (`Cartesian3`): center of the local frame.
- `ellipsoid` (`Ellipsoid`, default `Ellipsoid.default`).
- `result` (`Matrix4`, optional).

Local axes of the produced frame: +X east, +Y north, +Z up.

`static Transforms.headingPitchRollToFixedFrame(origin, headingPitchRoll, ellipsoid, fixedFrameTransform, result) -> Matrix4`
- `origin` (`Cartesian3`).
- `headingPitchRoll` (`HeadingPitchRoll`).
- `ellipsoid` (`Ellipsoid`, default `Ellipsoid.default`).
- `fixedFrameTransform` (`Transforms.LocalFrameToFixedFrame`, default
  `Transforms.eastNorthUpToFixedFrame`).
- `result` (`Matrix4`, optional).

`static Transforms.localFrameToFixedFrameGenerator(firstAxis, secondAxis) -> Transforms.LocalFrameToFixedFrame`
- `firstAxis`, `secondAxis` (string): one of `east`, `north`, `up`, `west`,
  `south`, `down`.
- Returns a function with the same shape as `eastNorthUpToFixedFrame`.

## HeadingPitchRoll

`new Cesium.HeadingPitchRoll(heading, pitch, roll)` : all optional, all in
RADIANS, default `0.0`.

`static HeadingPitchRoll.fromDegrees(heading, pitch, roll, result)` : builds a
`HeadingPitchRoll` from degree inputs.

Instance properties `heading`, `pitch`, `roll` are numbers in radians.

## Matrix4

| Member | Signature |
|--------|-----------|
| `Matrix4.IDENTITY` | static constant, the immutable identity matrix |
| `Matrix4.fromTranslationRotationScale` | `(translationRotationScale, result) -> Matrix4` |
| `Matrix4.multiply` | `(left, right, result) -> Matrix4` |
| `Matrix4.multiplyByTranslation` | `(matrix, translation, result) -> Matrix4` |
| `Matrix4.multiplyByUniformScale` | `(matrix, scale, result) -> Matrix4` |

## TranslationRotationScale

`new Cesium.TranslationRotationScale(translation, rotation, scale)`

| Parameter | Type | Default |
|-----------|------|---------|
| `translation` | `Cartesian3` | `Cartesian3.ZERO` |
| `rotation` | `Quaternion` | `Quaternion.IDENTITY` |
| `scale` | `Cartesian3` | `(1.0, 1.0, 1.0)` |

Pass an instance to `Matrix4.fromTranslationRotationScale` to build a placement
or correction matrix.

## modelMatrix

`Model.modelMatrix` and `Cesium3DTileset.modelMatrix` are both `Matrix4`,
default `Matrix4.IDENTITY`. The docs state that the identity matrix draws the
asset in world coordinates, "Earth's Cartesian WGS84 coordinates", and that a
different matrix places it in a local reference frame "like that returned by
`Transforms.eastNorthUpToFixedFrame`". `Cesium3DTileset.modelMatrix` is mutable
after the tileset loads.

`static Model.fromGltfAsync(options) -> Promise<Model>` : `options.url` is the
glTF or glb URL; `options.modelMatrix` is the placement matrix.

## EdgeDisplayMode (CesiumJS 1.142+)

Added in CesiumJS 1.142. `EdgeDisplayMode` is an enum with three members:

| Member | Effect |
|--------|--------|
| `SURFACES_ONLY` | default; no edges drawn |
| `SURFACES_AND_EDGES` | shaded surfaces with edges |
| `EDGES_ONLY` | CAD-style wireframe |

The `edgeDisplayMode` property exists on `Model` and `Cesium3DTileset`. It
controls rendering of edges from the `EXT_mesh_primitive_edge_visibility` glTF
extension, whose loading is supported since CesiumJS 1.135.

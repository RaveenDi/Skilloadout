# AEC Georeferencing : Anti-Patterns

> Each entry: symptom, root cause, prevention, recovery.
> Verified against cesium.com ref-doc and the CesiumGS/cesium CHANGES.md on
> 2026-05-20.

## 1. Model renders at the center of the Earth

Symptom: a loaded glTF model is invisible; zooming far out shows it near the
Earth's core.

Root cause: `modelMatrix` was left at `Matrix4.IDENTITY`, so the model's local
`(0, 0, 0)` is drawn at ECEF `(0, 0, 0)`, the planet's center.

Prevention: ALWAYS assign a `modelMatrix` from
`Transforms.eastNorthUpToFixedFrame(origin)` with a real `Cartesian3` origin.

Recovery: set `model.modelMatrix` to the ENU frame at the correct location.

## 2. Double transform on an already-georeferenced tileset

Symptom: an ion-tiled tileset that used to sit correctly flies off the globe
after a `modelMatrix` is assigned.

Root cause: the ion tiler bakes the real-world transform into the tileset's
root tile. Assigning a `modelMatrix` applies a SECOND transform on top.

Prevention: ALWAYS leave `modelMatrix` at `Matrix4.IDENTITY` for a tileset
tiled from georeferenced source data. Assign one ONLY for a tileset whose
content sits in a local CAD frame.

Recovery: reset `tileset.modelMatrix = Cesium.Matrix4.IDENTITY`.

## 3. HeadingPitchRoll built with degrees in the constructor

Symptom: a model is rotated wildly, far past the intended angle.

Root cause: `new HeadingPitchRoll(135, 0, 0)` treats `135` as RADIANS, roughly
twenty-one full turns.

Prevention: ALWAYS use `HeadingPitchRoll.fromDegrees(135, 0, 0)` for degree
inputs; the constructor is radians-only.

Recovery: replace the constructor call with `fromDegrees`.

## 4. Model sinks into or floats above terrain

Symptom: a correctly-placed model is buried in a hill or hovers in the air.

Root cause: the height in the `origin` `Cartesian3` does not match the terrain
elevation at that longitude and latitude.

Prevention: set the `origin` height to the real elevation of the model's base.
For terrain-relative placement, sample the terrain height first.

Recovery: rebuild the `modelMatrix` with the corrected origin height.

## 5. Loading a CityGML or IFC file directly

Symptom: `Model.fromGltfAsync` or `Cesium3DTileset.fromUrl` fails or does
nothing when handed a `.ifc`, `.gml`, or CityGML file.

Root cause: CesiumJS has NO native CityGML or IFC loader. These are not
loadable formats.

Prevention: ALWAYS convert first. CityGML becomes 3D Tiles (ion tiler or
external tooling); IFC becomes glTF (ThatOpen Components, IfcOpenShell). The
conversion is external workflow, not CesiumJS API.

Recovery: run the conversion, then load the resulting glTF or tileset.

## 6. Wrong rotation from an axis-convention mismatch

Symptom: a placed model is correctly located but lies on its side or faces a
wrong cardinal direction.

Root cause: the model's authored axes do not match east-north-up, so the ENU
frame orients it incorrectly.

Prevention: build a custom frame with
`Transforms.localFrameToFixedFrameGenerator`, or compose a local correction
matrix onto the ENU frame with `Matrix4.multiply`.

Recovery: identify the exporter's axis convention and apply the matching
correction matrix.

## 7. EdgeDisplayMode on an older CesiumJS

Symptom: `Cesium.EdgeDisplayMode` is `undefined`, or setting `edgeDisplayMode`
has no effect.

Root cause: `EdgeDisplayMode` and the `edgeDisplayMode` property were added in
CesiumJS 1.142. Earlier versions do not have them.

Prevention: ALWAYS confirm the CesiumJS version is 1.142 or newer before using
`EdgeDisplayMode`. The underlying `EXT_mesh_primitive_edge_visibility` glTF
extension loads since 1.135, but the display-mode control is 1.142.

Recovery: upgrade CesiumJS to 1.142 or newer.

---
name: cesium-impl-aec-georef
description: >
  Use when placing a BIM model, CAD model, IFC export, or city model into a
  CesiumJS globe at its real geographic location, and the model renders at the
  center of the Earth, sits at the wrong place, floats above or sinks below
  terrain, or faces the wrong direction. Prevents the identity-modelMatrix
  mistake (a model with no transform draws in raw ECEF coordinates), the
  double-transform mistake (re-placing an already-georeferenced ion tileset),
  the radians-versus-degrees HeadingPitchRoll mistake, and the
  conversion-pipeline-is-an-API mistake. Separates the official CesiumJS
  georeferencing API (Transforms, Matrix4, HeadingPitchRoll, modelMatrix) from
  the external CityGML and IFC conversion workflow.
  Keywords: CesiumJS AEC, georeference, georeferencing, BIM in Cesium, IFC in
  Cesium, CityGML, modelMatrix, Transforms.eastNorthUpToFixedFrame,
  headingPitchRollToFixedFrame, HeadingPitchRoll, Matrix4, ECEF, local frame,
  east north up, digital twin, geo-BIM, EdgeDisplayMode, CAD edges,
  model wrong location, model at center of earth, BIM not georeferenced,
  model floating, model underground, IFC to glTF, how do I place a building on
  the globe, how do I georeference a model.
license: MIT
compatibility: "Designed for Claude Code. Requires CesiumJS 1.124+."
metadata:
  author: OpenAEC-Foundation
  version: "1.0"
---

# CesiumJS AEC Georeferencing

## Overview

BIM, CAD, and city models use a LOCAL engineering coordinate system: meters
from a project origin. CesiumJS renders in ECEF (Earth-Centered Earth-Fixed)
WGS84 meters. A model loaded with no transform draws near the CENTER of the
Earth, invisible from any normal camera. Georeferencing is building the
`Matrix4` that maps the model's local frame to its real position on the globe
and assigning it to `modelMatrix`.

Core principle: the placement math (`Transforms`, `Matrix4`, `HeadingPitchRoll`,
`modelMatrix`) is official CesiumJS API. Getting CityGML or IFC INTO a loadable
format is an EXTERNAL workflow with no CesiumJS API. This skill keeps the two
strictly separate.

This skill is technology-specific: CesiumJS 1.124+, WebGL2 only.

## When to Use This Skill

- Placing a BIM, CAD, or city model at a real-world location.
- A loaded model is invisible, or appears at the center of the Earth.
- A model sits at the wrong place, or faces the wrong direction.
- A model floats above or sinks below terrain.
- Getting an IFC or CityGML model into CesiumJS.
- Rendering CAD-style edges on a model or tileset.

## Official API vs External Workflow

This separation is CRITICAL. NEVER present a file-conversion pipeline as a
CesiumJS API call.

| Concern | Official CesiumJS API | External workflow (NOT API) |
|---------|-----------------------|------------------------------|
| Place and orient an asset | `Transforms`, `Matrix4`, `HeadingPitchRoll`, `modelMatrix` | none |
| Load a glb or glTF | `Model.fromGltfAsync` | none |
| Load tiled 3D Tiles | `Cesium3DTileset.fromUrl` / `fromIonAssetId` | none |
| CityGML to 3D Tiles | none | ion tiler, FME, external tooling |
| IFC to glTF | none | ThatOpen Components, IfcOpenShell |

CesiumJS has NO native CityGML loader and NO native IFC loader. Those formats
MUST be converted first, outside CesiumJS.

## Quick Reference: Georeferencing API

| Call | Purpose |
|------|---------|
| `Transforms.eastNorthUpToFixedFrame(origin)` | local east-north-up frame at a position, mapped to ECEF |
| `Transforms.headingPitchRollToFixedFrame(origin, hpr)` | the same, plus a heading-pitch-roll rotation |
| `Transforms.localFrameToFixedFrameGenerator(a, b)` | a frame function for non-ENU axis conventions |
| `HeadingPitchRoll.fromDegrees(h, p, r)` | a rotation from degree inputs |
| `model.modelMatrix` / `tileset.modelMatrix` | the `Matrix4` slot the result is assigned to |

## The Placement Problem and modelMatrix

`modelMatrix` is a `Matrix4` on both `Model` and `Cesium3DTileset`, default
`Matrix4.IDENTITY`. With the identity matrix the asset is drawn in raw ECEF
WGS84 coordinates, so a CAD model built around local `(0, 0, 0)` lands at the
Earth's core.

ALWAYS assign a `modelMatrix` that maps the model's local origin to a real
`Cartesian3` position on the globe.

## Placing a Model at a Location

`Transforms.eastNorthUpToFixedFrame(origin)` returns the `Matrix4` that maps a
local east-north-up frame (local +X east, +Y north, +Z up) at `origin` into
ECEF. Assign it to `modelMatrix`.

```js
const origin = Cesium.Cartesian3.fromDegrees(4.9041, 52.3676, 12.0);
const model = await Cesium.Model.fromGltfAsync({
  url: "/models/building.glb",
  modelMatrix: Cesium.Transforms.eastNorthUpToFixedFrame(origin),
});
viewer.scene.primitives.add(model);
```

## Orienting a Model

When the model must be rotated (a building not aligned to north, a tilted
element), use `Transforms.headingPitchRollToFixedFrame(origin, hpr)`. The
`HeadingPitchRoll` constructor takes RADIANS; ALWAYS use
`HeadingPitchRoll.fromDegrees` when working in degrees.

```js
const origin = Cesium.Cartesian3.fromDegrees(4.9041, 52.3676, 12.0);
const hpr = Cesium.HeadingPitchRoll.fromDegrees(135.0, 0.0, 0.0);
const modelMatrix = Cesium.Transforms.headingPitchRollToFixedFrame(origin, hpr);
const model = await Cesium.Model.fromGltfAsync({
  url: "/models/building.glb",
  modelMatrix,
});
viewer.scene.primitives.add(model);
```

`heading` rotates about the local up axis from north, `pitch` about the east
axis, `roll` about the north axis.

## Placing a Tileset

`Cesium3DTileset.modelMatrix` works the same way and is mutable after the
tileset loads.

ALWAYS check whether the tileset is ALREADY georeferenced before assigning a
`modelMatrix`. A tileset produced by the ion tiler from georeferenced source
data carries its real-world transform in its root tile; its `modelMatrix` must
stay `Matrix4.IDENTITY`. Assign a `modelMatrix` ONLY to a tileset whose content
sits in a local CAD frame.

```js
// Non-georeferenced tileset: place it.
const tileset = await Cesium.Cesium3DTileset.fromUrl("/tiles/plant/tileset.json");
tileset.modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(
  Cesium.Cartesian3.fromDegrees(4.9041, 52.3676, 0.0)
);
viewer.scene.primitives.add(tileset);
```

## Custom Local Frames

A glTF or BIM export whose axes do not match east-north-up needs either a
local correction matrix composed onto the ENU frame, or a custom frame
function from `Transforms.localFrameToFixedFrameGenerator(firstAxis,
secondAxis)`, where each axis is one of `east`, `north`, `up`, `west`, `south`,
`down`.

```js
// A model authored north-west-up instead of east-north-up.
const nwuToFixed = Cesium.Transforms.localFrameToFixedFrameGenerator("north", "west");
const modelMatrix = nwuToFixed(origin);
```

Compose a correction with `Matrix4.multiply(enuFrame, localCorrection, result)`.

## External Workflow: CityGML and IFC

These steps run OUTSIDE CesiumJS. They produce a file CesiumJS can load; they
are NOT CesiumJS API.

- CityGML: convert to 3D Tiles with the Cesium ion tiler or external tooling,
  then stream the result with `Cesium3DTileset.fromUrl` or `fromIonAssetId`.
- IFC: export to glTF with ThatOpen Components or IfcOpenShell, then load the
  glTF with `Model.fromGltfAsync` and georeference it with a `modelMatrix`.

The georeference step (the `modelMatrix`) is the only CesiumJS-side work; the
conversion is external workflow.

## CAD-style Edges

`EdgeDisplayMode` (CesiumJS 1.142+) renders the crisp edges architects expect.
The `edgeDisplayMode` property on `Model` and `Cesium3DTileset` takes
`EdgeDisplayMode.SURFACES_ONLY` (default), `SURFACES_AND_EDGES`, or
`EDGES_ONLY` (CAD wireframe).

```js
// Requires CesiumJS 1.142 or newer.
model.edgeDisplayMode = Cesium.EdgeDisplayMode.SURFACES_AND_EDGES;
```

Edges are read from the `EXT_mesh_primitive_edge_visibility` glTF extension, so
the glTF MUST carry edge data; an exporter that omits the extension shows no
edges. The extension loads since 1.135; the `EdgeDisplayMode` control is 1.142+.

## Cross-Tech Companion Notes

Georeferencing usually sits inside a larger AEC toolchain. Each tool below has
its own skill package; this skill covers only the CesiumJS step.

- QGIS: prepares and inspects the geospatial source data (survey points,
  imagery, terrain) that defines where a model belongs.
- ThatOpen Components and IfcOpenShell: the IFC-to-glTF bridge feeding
  `Model.fromGltfAsync`.
- Speckle: federates multi-discipline BIM data; export to glTF or 3D Tiles for
  streaming into CesiumJS.

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Model invisible, at the Earth's core | Assign `Transforms.eastNorthUpToFixedFrame(origin)` to `modelMatrix` |
| `modelMatrix` set on an ion-tiled tileset | Leave it `Matrix4.IDENTITY`; ion assets are pre-placed |
| `new HeadingPitchRoll(135, 0, 0)` for degrees | Use `HeadingPitchRoll.fromDegrees(135, 0, 0)` |
| Model sunk into terrain | Set the real height in the `origin` `Cartesian3` |
| Loading a `.ifc` or CityGML file directly | Convert first; CesiumJS has no native loader |
| `EdgeDisplayMode` on CesiumJS below 1.142 | Upgrade; the enum does not exist earlier |

Full root-cause analysis is in `references/anti-patterns.md`.

## Reference Files

- `references/methods.md` : verified signatures for `Transforms`, `Matrix4`,
  `HeadingPitchRoll`, `TranslationRotationScale`, `modelMatrix`, and
  `EdgeDisplayMode`.
- `references/examples.md` : runnable placement, orientation, tileset, and
  custom-frame snippets.
- `references/anti-patterns.md` : georeferencing failure modes, each with
  symptom, root cause, prevention, and recovery.

## Related Skills

- `cesium-core-coordinates` : `Cartesian3`, `Cartographic`, the ellipsoid, ENU frames.
- `cesium-syntax-gltf-model` : `Model.fromGltfAsync` and model loading.
- `cesium-syntax-3d-tiles` : `Cesium3DTileset` loading and tile formats.
- `cesium-impl-cesium-ion` : the ion tiler that converts source data to 3D Tiles.
- `cesium-errors-coordinates` : NaN positions and off-globe geometry.

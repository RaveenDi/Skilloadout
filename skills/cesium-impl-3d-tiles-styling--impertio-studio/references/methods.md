# 3D Tiles Styling and Clipping API Reference

Verified against the CesiumJS API reference (cesium.com/learn/cesiumjs/ref-doc)
and the 3D Tiles styling specification (github.com/CesiumGS/3d-tiles) for
CesiumJS 1.124+.

## Cesium3DTileStyle

### Constructor

`new Cesium.Cesium3DTileStyle(style)`

`style` is an optional JSON object whose values are expressions in the 3D
Tiles styling language. The constructor is synchronous; there is no
`readyPromise`. Assign the result to `tileset.style`.

### Styleable Properties

Each property is a `StyleExpression` and accepts a string expression, a
`conditions` object, or an object with an `evaluate` function.

| Property | Return type | Purpose |
|----------|-------------|---------|
| `color` | `Color` | Feature color, multiplied with the source color |
| `show` | `Boolean` | Feature visibility |
| `pointSize` | `Number` | Point-cloud point size |
| `pointOutlineColor` | `Color` | Point outline color |
| `pointOutlineWidth` | `Number` | Point outline width |
| `labelColor` | `Color` | Label text color |
| `labelOutlineColor` | `Color` | Label outline color |
| `labelOutlineWidth` | `Number` | Label outline width |
| `font` | `String` | Label CSS font string |
| `labelStyle` | `LabelStyle` | Fill, outline, or both |
| `labelText` | `String` | Label text |
| `labelHorizontalOrigin` | `HorizontalOrigin` | Label horizontal anchor |
| `labelVerticalOrigin` | `VerticalOrigin` | Label vertical anchor |
| `backgroundColor` | `Color` | Label background color |
| `backgroundPadding` | `Cartesian2` | Label background padding |
| `backgroundEnabled` | `Boolean` | Label background toggle |
| `scaleByDistance` | `Cartesian4` | Near and far scale by distance |
| `translucencyByDistance` | `Cartesian4` | Near and far alpha by distance |
| `distanceDisplayCondition` | `Cartesian2` | Near and far visible range |
| `heightOffset` | `Number` | Vertical offset in meters |
| `image` | `String` | Billboard image URL |
| `disableDepthTestDistance` | `Number` | Distance past which depth test is off |
| `horizontalOrigin` | `HorizontalOrigin` | Billboard horizontal anchor |
| `verticalOrigin` | `VerticalOrigin` | Billboard vertical anchor |

Several label and background properties apply to vector content and are part
of an unfinalized part of the specification.

### Evaluation Methods

A `StyleExpression` exposes `evaluate(feature)` for numeric, boolean, and
string results, and `evaluateColor(feature, result)` for color results.

### Applying and Clearing

- `tileset.style = new Cesium.Cesium3DTileStyle({ ... })` applies the style.
- `tileset.style = undefined` clears the style.
- `tileset.makeStyleDirty()` forces a re-evaluation next frame.

## Styling Expression Language

### Operators

- Unary: `+`, `-`, `!`
- Binary: `||`, `&&`, `===`, `!==`, `<`, `>`, `<=`, `>=`, `+`, `-`, `*`,
  `/`, `%`, `=~`, `!~`
- Ternary: `? :`

`=~` tests a regular-expression match; `!~` tests no match.

### Types

Boolean, Null, Undefined, Number, String, Array, `vec2`, `vec3`, `vec4`,
Color (a `vec4`), and RegExp.

### Feature Property Reference

`${PropertyName}`, `${object.nested}`, `${array[0]}`. Property names are
case-sensitive. A missing property evaluates to `undefined`.

### Color Functions

| Function | Range |
|----------|-------|
| `color('name')`, `color('#RRGGBB', alpha)` | named or hex |
| `rgb(r, g, b)`, `rgba(r, g, b, a)` | r, g, b 0 to 255; a 0.0 to 1.0 |
| `hsl(h, s, l)`, `hsla(h, s, l, a)` | 0.0 to 1.0 |

Color components are read with `.r .g .b .a` or `.x .y .z .w`.

### Functions

Math: `abs`, `sqrt`, `sign`, `floor`, `ceil`, `round`, `exp`, `log`, `exp2`,
`log2`, `fract`, `pow`, `min`, `max`, `clamp`, `mix`. Trigonometric: `cos`,
`sin`, `tan`, `acos`, `asin`, `atan`, `atan2`, `radians`, `degrees`. Vector:
`length`, `distance`, `normalize`, `dot`, `cross`. Constants: `Math.PI`,
`Math.E`. Type conversion: `Boolean(value)`, `Number(value)`,
`String(value)`. RegExp: `regExp(pattern, flags)` with `.test()` and
`.exec()`.

### conditions and defines

`conditions` is an array of `[test, result]` pairs evaluated top to bottom;
the first matching pair wins. `defines` is an object of named expressions
referenced like properties with `${Name}`.

### Point Cloud Semantics

Point-cloud styles read built-in semantics: `${POSITION}`,
`${POSITION_ABSOLUTE}`, `${COLOR}`, `${NORMAL}`.

## ClippingPlane

`new Cesium.ClippingPlane(normal, distance)`

| Parameter | Type | Purpose |
|-----------|------|---------|
| `normal` | `Cartesian3` | Plane normal, normalized |
| `distance` | number | Shortest distance from the origin to the plane |

A positive `distance` places the origin on the normal side of the plane.
`ClippingPlane.fromPlane(plane, result)` builds one from a `Plane`. Geometry
on the side opposite the normal is hidden.

## ClippingPlaneCollection

`new Cesium.ClippingPlaneCollection(options)`

| Option | Type | Default | Purpose |
|--------|------|---------|---------|
| `planes` | `ClippingPlane[]` | `[]` | The clipping planes |
| `enabled` | boolean | `true` | Whether clipping is active |
| `modelMatrix` | `Matrix4` | `Matrix4.IDENTITY` | Transform of the plane frame |
| `unionClippingRegions` | boolean | `false` | Multi-plane logic |
| `edgeColor` | `Color` | `Color.WHITE` | Clip-edge highlight color |
| `edgeWidth` | number | `0.0` | Clip-edge highlight width in pixels |

`unionClippingRegions` `false`: a region is clipped only when outside every
plane. `true`: a region is clipped when outside any plane.

Methods: `add(plane)`, `get(index)`, `contains(plane)`, `remove(plane)`,
`removeAll()`. Property `length` is read-only.

Assign a collection to `tileset.clippingPlanes`, `model.clippingPlanes`, or
`globe.clippingPlanes`.

## ClippingPolygon

`new Cesium.ClippingPolygon(options)`

| Option | Type | Default | Purpose |
|--------|------|---------|---------|
| `positions` | `Cartesian3[]` | required | Three or more positions, the outer ring |
| `ellipsoid` | `Ellipsoid` | `Ellipsoid.default` | Projection ellipsoid |

Read-only properties: `positions`, `ellipsoid`, `length`. Method
`computeRectangle(result)` returns the enclosing cartographic rectangle.

## ClippingPolygonCollection

`new Cesium.ClippingPolygonCollection(options)`. Added in CesiumJS 1.117.

| Option | Type | Default | Purpose |
|--------|------|---------|---------|
| `polygons` | `ClippingPolygon[]` | `[]` | The clipping polygons |
| `enabled` | boolean | `true` | Whether clipping is active |
| `inverse` | boolean | `false` | Kept side |
| `quality` | number | `1.0` | Signed-distance texture resolution |

`inverse` `false`: geometry inside any polygon is clipped away. `true`:
geometry outside every polygon is clipped, keeping only the inside.

Methods: `add(polygon)`, `get(index)`, `contains(polygon)`,
`remove(polygon)`, `removeAll()`, `destroy()`, `isDestroyed()`. Static
`ClippingPolygonCollection.isSupported(scene)` returns whether the scene has
the required WebGL2 support. Events: `polygonAdded`, `polygonRemoved`.
Property `length` is read-only.

Assign a collection to `tileset.clippingPolygons` or `globe.clippingPolygons`.

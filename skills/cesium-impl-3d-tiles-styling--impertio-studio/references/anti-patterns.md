# 3D Tiles Styling and Clipping Anti-Patterns

Each entry is a real failure mode. Format: symptom, root cause, fix. Verified
against the CesiumJS API reference and the 3D Tiles styling specification for
1.124+.

## 1. Wrong-Case Property Name

**Symptom:** A style expression has no effect, or every feature falls through
to the fallback color.

**Root cause:** The expression referenced `${height}` while the feature
property is `Height`. Property names in the styling language are
case-sensitive, and a missing property evaluates to `undefined`.

**Fix:** Match the property name exactly. Pick a feature and call
`feature.getPropertyIds()` to read the real names.

```js
// WRONG, if the property is Height
color: "${height} > 50 ? color('red') : color('blue')";

// RIGHT
color: "${Height} > 50 ? color('red') : color('blue')";
```

## 2. conditions Array Without a true Fallback

**Symptom:** Some features are styled and others keep their source color.

**Root cause:** A `conditions` array is evaluated top to bottom and stops at
the first match. A feature that matches no condition gets no value.

**Fix:** ALWAYS end a `conditions` array with a `['true', ...]` row.

```js
color: {
  conditions: [
    ["${Height} >= 50", "color('red')"],
    ["true", "color('white')"], // catches every other feature
  ],
}
```

## 3. Every Feature the Same Color

**Symptom:** A per-feature style was wanted, but every feature renders in one
color.

**Root cause:** The `color` expression is a constant such as `color('red')`
with no `${property}` reference and no `conditions` array. A constant
expression yields the same result for every feature.

**Fix:** Reference a feature property or use a `conditions` array keyed on a
property.

## 4. Mutating Features in a Loop for a Static Style

**Symptom:** Styling is slow, and the colors flicker or revert.

**Root cause:** Feature colors were set by iterating features and writing
`feature.color`. The style system re-applies on its own schedule and fights
the manual writes.

**Fix:** Build a `Cesium3DTileStyle` and assign it to `tileset.style`.
Per-feature mutation is for transient highlights only, such as a pick
hover.

## 5. Style Assigned as a Plain Object Expecting Live Updates

**Symptom:** Changing the JSON object after assignment does not change the
scene.

**Root cause:** `tileset.style` captures the style at assignment time. A
later mutation of the original object is not observed.

**Fix:** Build a new `Cesium3DTileStyle` and assign it again, or call
`tileset.makeStyleDirty()` after changing state an `evaluate` function reads.

## 6. ClippingPolygonCollection Without isSupported

**Symptom:** Polygon clipping does nothing on some machines, with no error.

**Root cause:** `ClippingPolygonCollection` needs specific WebGL2 support.
On a scene without it, the collection has no effect.

**Fix:** ALWAYS guard with `ClippingPolygonCollection.isSupported(scene)`
before creating and assigning the collection.

```js
if (Cesium.ClippingPolygonCollection.isSupported(viewer.scene)) {
  tileset.clippingPolygons = new Cesium.ClippingPolygonCollection({
    polygons: [footprint],
  });
}
```

## 7. ClippingPlane Normal Pointing the Wrong Way

**Symptom:** The clip removes the half that should stay, or removes nothing.

**Root cause:** A `ClippingPlane` hides the geometry on the side opposite its
`normal`. A normal in the wrong direction hides the wrong half.

**Fix:** Negate the `normal` vector, or negate the `distance`, to flip which
side is hidden.

## 8. Clipping Collection Disabled

**Symptom:** A clipping collection is assigned but nothing is cut.

**Root cause:** The collection `enabled` property is `false`, or the wrong
collection property was assigned (`clippingPlanes` versus
`clippingPolygons`).

**Fix:** Keep `enabled` at its `true` default. Assign a plane collection to
`tileset.clippingPlanes` and a polygon collection to
`tileset.clippingPolygons`.

## 9. Wrong inverse Expectation for Polygon Clipping

**Symptom:** A polygon clip keeps the outside when the inside was wanted, or
the reverse.

**Root cause:** `ClippingPolygonCollection.inverse` defaults to `false`,
which clips away the geometry inside the polygon.

**Fix:** Set `inverse: true` to keep only the geometry inside the polygon;
leave it `false` to cut a hole where the polygon is.

## 10. Misreading unionClippingRegions

**Symptom:** Two clipping planes together hide more or less than expected.

**Root cause:** `unionClippingRegions` defaults to `false`, which clips a
region only when it is outside every plane. A value of `true` clips a region
when it is outside any plane.

**Fix:** Set `unionClippingRegions` to match the intent: `false` for an
intersection clip, `true` for a union clip.

## 11. Confusing Styling With CustomShader

**Symptom:** A GLSL snippet placed in a `Cesium3DTileStyle` is rejected.

**Root cause:** `Cesium3DTileStyle` uses the 3D Tiles styling expression
language, not GLSL. GLSL belongs in a `CustomShader`.

**Fix:** Use the styling language for declarative color and show logic. Use a
`CustomShader` for GLSL; see `cesium-syntax-materials`.

## 12. Expecting evaluate to Be Fast

**Symptom:** A style with an `evaluate` function drops the frame rate on a
large tileset.

**Root cause:** An `evaluate` function runs in JavaScript for every feature,
while a string expression is compiled and runs efficiently.

**Fix:** Express the logic as a string expression or a `conditions` array.
Reserve `evaluate` for logic the expression language cannot represent.

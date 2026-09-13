# 3D Tiles Styling and Clipping Examples

Complete, runnable recipes for CesiumJS 1.124+. Every recipe assumes a
`viewer` and a `tileset` loaded with the async factory
`Cesium3DTileset.fromUrl` or `Cesium3DTileset.fromIonAssetId`.

## Style a Constant Color

```js
const tileset = await Cesium.Cesium3DTileset.fromUrl(url);
viewer.scene.primitives.add(tileset);

tileset.style = new Cesium.Cesium3DTileStyle({
  color: "color('cornflowerblue', 0.8)",
});
```

## Color Features by a Metadata Property

```js
tileset.style = new Cesium.Cesium3DTileStyle({
  // ${Height} reads the per-feature Height property.
  color: "${Height} >= 50 ? color('red') : color('green')",
});
```

The property name is case-sensitive. Pick a feature and call
`feature.getPropertyIds()` to discover the exact names; see
`cesium-syntax-3d-tiles`.

## Color With a Conditions Array

```js
tileset.style = new Cesium.Cesium3DTileStyle({
  color: {
    conditions: [
      ["${Height} >= 200", "color('#1a237e')"],
      ["${Height} >= 100", "color('#3949ab')"],
      ["${Height} >= 50", "color('#7986cb')"],
      ["${Height} >= 0", "color('#c5cae9')"],
      ["true", "color('#ffffff')"],
    ],
  },
});
```

The final `['true', ...]` row gives every non-matching feature a value.

## Show and Hide Features

```js
tileset.style = new Cesium.Cesium3DTileStyle({
  // Render only large features.
  show: "${Area} > 250",
});

// Or with a conditions array.
tileset.style = new Cesium.Cesium3DTileStyle({
  show: {
    conditions: [
      ["${Category} === 'hidden'", "false"],
      ["true", "true"],
    ],
  },
});
```

## Reuse a Subexpression With defines

```js
tileset.style = new Cesium.Cesium3DTileStyle({
  defines: {
    HeightFraction: "clamp(${Height} / 150.0, 0.0, 1.0)",
  },
  color: "mix(color('white'), color('darkblue'), ${HeightFraction})",
});
```

## Style a Point Cloud

```js
tileset.style = new Cesium.Cesium3DTileStyle({
  pointSize: 5.0,
  color: "color() * ${COLOR}",
  show: "${POSITION}.z > 0.0",
});
```

`${COLOR}`, `${POSITION}`, and `${NORMAL}` are built-in point-cloud
semantics.

## Style With an evaluate Function

```js
tileset.style = new Cesium.Cesium3DTileStyle();
tileset.style.color = {
  evaluate: function (feature) {
    const type = feature.getProperty("buildingType");
    if (type === "residential") {
      return Cesium.Color.STEELBLUE;
    }
    if (type === "commercial") {
      return Cesium.Color.GOLDENROD;
    }
    return Cesium.Color.LIGHTGRAY;
  },
};
```

Use a string expression where possible; an `evaluate` function runs in
JavaScript per feature.

## Update and Clear a Style

```js
// Replace the style.
tileset.style = new Cesium.Cesium3DTileStyle({ color: "color('orange')" });

// Force a re-evaluation after changing external state.
tileset.makeStyleDirty();

// Clear the style back to the source colors.
tileset.style = undefined;
```

## Clip a Tileset With a Plane

```js
const tileset = await Cesium.Cesium3DTileset.fromUrl(url);
viewer.scene.primitives.add(tileset);

tileset.clippingPlanes = new Cesium.ClippingPlaneCollection({
  planes: [
    // Hide the negative-X half of the tileset local frame.
    new Cesium.ClippingPlane(new Cesium.Cartesian3(1.0, 0.0, 0.0), 0.0),
  ],
  edgeWidth: 1.0,
  edgeColor: Cesium.Color.CYAN,
});
```

If the wrong half disappears, negate the `normal` or the `distance`.

## Clip a Tileset With Two Planes

```js
tileset.clippingPlanes = new Cesium.ClippingPlaneCollection({
  planes: [
    new Cesium.ClippingPlane(new Cesium.Cartesian3(1.0, 0.0, 0.0), 0.0),
    new Cesium.ClippingPlane(new Cesium.Cartesian3(0.0, 1.0, 0.0), 0.0),
  ],
  // false: clip only where outside both planes.
  unionClippingRegions: false,
});
```

## Clip a Tileset With a Polygon

```js
if (Cesium.ClippingPolygonCollection.isSupported(viewer.scene)) {
  const footprint = new Cesium.ClippingPolygon({
    positions: Cesium.Cartesian3.fromDegreesArray([
      4.89, 52.36, 4.91, 52.36, 4.91, 52.38, 4.89, 52.38,
    ]),
  });

  tileset.clippingPolygons = new Cesium.ClippingPolygonCollection({
    polygons: [footprint],
    // false: cut a hole where the polygon is.
    inverse: false,
  });
}
```

## Keep Only the Inside of a Polygon

```js
if (Cesium.ClippingPolygonCollection.isSupported(viewer.scene)) {
  tileset.clippingPolygons = new Cesium.ClippingPolygonCollection({
    polygons: [footprint],
    // true: keep only what is inside the polygon.
    inverse: true,
  });
}
```

## Disable Clipping Without Removing It

```js
tileset.clippingPlanes.enabled = false; // keep the planes, stop clipping
tileset.clippingPolygons.enabled = false;
```

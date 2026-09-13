# DataSources : Examples

> CesiumJS 1.124+. All snippets verified against cesium.com ref-doc on
> 2026-05-20. Each assumes a constructed `viewer` and, for ion-hosted data,
> `Cesium.Ion.defaultAccessToken` set before the `Viewer` was built.

## Load a GeoJSON file

```js
viewer.dataSources.add(
  Cesium.GeoJsonDataSource.load("/data/countries.geojson")
);
```

## TopoJSON uses the same loader

```js
// GeoJsonDataSource.load detects TopoJSON from the data; no separate class.
viewer.dataSources.add(
  Cesium.GeoJsonDataSource.load("/data/states.topojson")
);
```

## Drape GeoJSON over terrain

```js
// Without clampToGround the polygons render at ellipsoid height 0.
viewer.dataSources.add(
  Cesium.GeoJsonDataSource.load("/data/parcels.geojson", {
    clampToGround: true,
  })
);
```

## GeoJSON with custom styling and a camera fit

```js
const ds = await viewer.dataSources.add(
  Cesium.GeoJsonDataSource.load("/data/routes.geojson", {
    stroke: Cesium.Color.ORANGE,
    strokeWidth: 4,
    fill: Cesium.Color.ORANGE.withAlpha(0.3),
    markerColor: Cesium.Color.ORANGE,
    markerSize: 32,
    clampToGround: true,
  })
);
viewer.flyTo(ds);
```

## Load and fly to a CZML file

```js
const czmlSource = await viewer.dataSources.add(
  Cesium.CzmlDataSource.load("/data/satellites.czml")
);
viewer.flyTo(czmlSource);
viewer.clock.shouldAnimate = true; // CZML is time-dynamic
```

## A minimal inline CZML document

```js
const czml = [
  { id: "document", name: "minimal", version: "1.0" },
  {
    id: "point-1",
    position: { cartographicDegrees: [-75.6, 40.0, 0] },
    point: { color: { rgba: [255, 0, 0, 255] }, pixelSize: 12 },
  },
];
viewer.dataSources.add(Cesium.CzmlDataSource.load(czml));
```

## CZML streaming with process

```js
// process appends; calling load again would wipe the running scene.
const live = new Cesium.CzmlDataSource("telemetry");
viewer.dataSources.add(live);
await live.load("/data/telemetry-base.czml"); // initial dataset

setInterval(async () => {
  await live.process("/data/telemetry-delta.czml"); // merges, keeps base
}, 5000);
```

## Load KML or KMZ

```js
const kmlSource = await viewer.dataSources.add(
  Cesium.KmlDataSource.load("/data/sites.kmz", {
    camera: viewer.scene.camera,
    canvas: viewer.scene.canvas,
    clampToGround: true,
  })
);
viewer.flyTo(kmlSource);
```

## Load a KMZ chosen from a file input

```js
// A KMZ File from <input type="file"> is a Blob, accepted directly.
async function loadKmlFile(file) {
  const ds = await Cesium.KmlDataSource.load(file, {
    camera: viewer.scene.camera,
    canvas: viewer.scene.canvas,
  });
  viewer.dataSources.add(ds);
  viewer.flyTo(ds);
}
```

## Replace one dataset with another

```js
// Instance load CLEARS, then loads. This is the correct way to swap data.
const layer = new Cesium.GeoJsonDataSource("active-layer");
viewer.dataSources.add(layer);

await layer.load("/data/january.geojson");
// later: swap the whole dataset
await layer.load("/data/february.geojson"); // january entities are cleared
```

## Inspect entities after the promise resolves

```js
const ds = await Cesium.GeoJsonDataSource.load("/data/cities.geojson");
viewer.dataSources.add(ds);
console.log(`loaded ${ds.entities.values.length} entities`);
const first = ds.entities.values[0];
```

## Remove and destroy

```js
// Pass true so the entity primitives and WebGL buffers are freed.
viewer.dataSources.remove(myDataSource, true);

// Tear down every data source before disposing the viewer.
viewer.dataSources.removeAll(true);
```

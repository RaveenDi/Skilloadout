# DataSources : Verified API Reference

> CesiumJS 1.124+. Every signature verified via WebFetch against
> cesium.com/learn/cesiumjs/ref-doc on 2026-05-20.

## DataSourceCollection

`viewer.dataSources` is a `DataSourceCollection`.

| Member | Signature | Notes |
|--------|-----------|-------|
| `add` | `add(dataSource) -> Promise<DataSource>` | accepts a `DataSource` or a `Promise<DataSource>`; a promise is added on resolve |
| `remove` | `remove(dataSource, destroy) -> boolean` | `destroy` defaults `false` |
| `removeAll` | `removeAll(destroy)` | `destroy` defaults `false` |
| `contains` | `contains(dataSource) -> boolean` | membership test |
| `get` | `get(index) -> DataSource` | by index |
| `getByName` | `getByName(name) -> Array<DataSource>` | by name, may match many |
| `indexOf` | `indexOf(dataSource) -> number` | position in collection |
| `raise` | `raise(dataSource)` | up one position |
| `lower` | `lower(dataSource)` | down one position |
| `raiseToTop` | `raiseToTop(dataSource)` | to the top |
| `lowerToBottom` | `lowerToBottom(dataSource)` | to the bottom |

Properties and events: `length` (readonly `number`), `dataSourceAdded`,
`dataSourceRemoved`, `dataSourceMoved` (readonly `Event`).

When `add` is given a promise, the data source is NOT in the collection until
the promise resolves successfully.

## CzmlDataSource

Constructor: `new Cesium.CzmlDataSource(name)`. `name` is an optional string.

| Method | Signature | Behavior |
|--------|-----------|----------|
| static `load` | `CzmlDataSource.load(czml, options) -> Promise<CzmlDataSource>` | creates a new data source |
| `load` | `load(czml, options) -> Promise<CzmlDataSource>` | CLEARS, then loads |
| `process` | `process(czml, options) -> Promise<CzmlDataSource>` | KEEPS, then merges |
| `update` | `update(time) -> boolean` | advances to a `JulianDate` |

`czml` is a `Resource`, a URL string, or a parsed CZML object. `LoadOptions`
members: `sourceUri` (`Resource` or string), `credit` (`Credit` or string).

Instance properties: `entities` (`EntityCollection`), `clock`
(`DataSourceClock`), `name`, `show`, `credit`, `isLoading`, `clustering`
(`EntityCluster`). Events: `changedEvent`, `errorEvent`, `loadingEvent`.

The CZML document packet is required and must be the first array element:

```json
[
  { "id": "document", "name": "example", "version": "1.0" }
]
```

The version must be `<Major>.<Minor>`; a missing version or a major version
other than `1` makes the load reject with `RuntimeError`.

## GeoJsonDataSource

Constructor: `new Cesium.GeoJsonDataSource(name)`. `name` is an optional string.

| Method | Signature | Behavior |
|--------|-----------|----------|
| static `load` | `GeoJsonDataSource.load(data, options) -> Promise<GeoJsonDataSource>` | GeoJSON and TopoJSON |
| `load` | `load(data, options) -> Promise<GeoJsonDataSource>` | CLEARS, then loads |
| `process` | `process(data, options) -> Promise<GeoJsonDataSource>` | KEEPS, then merges |

`data` is a `Resource`, a URL string, or a parsed GeoJSON or TopoJSON object.

`LoadOptions` members and defaults:

| Option | Type | Default |
|--------|------|---------|
| `sourceUri` | string | undefined |
| `describe` | function | `GeoJsonDataSource.defaultDescribeProperty` |
| `markerSize` | number | `48` |
| `markerSymbol` | string | undefined |
| `markerColor` | `Color` | `Color.ROYALBLUE` |
| `stroke` | `Color` | `Color.BLACK` |
| `strokeWidth` | number | `2.0` |
| `fill` | `Color` | `Color.YELLOW` |
| `clampToGround` | boolean | `false` |
| `credit` | `Credit` or string | undefined |

The static fields `GeoJsonDataSource.markerSize`, `.markerSymbol`,
`.markerColor`, `.stroke`, `.strokeWidth`, `.fill`, and `.clampToGround` set
process-wide defaults for every later load. Per-feature `simplestyle-spec`
keys inside the GeoJSON override the load options.

## KmlDataSource

Constructor: `new Cesium.KmlDataSource(options)`. `options` is a
`KmlDataSource.ConstructorOptions`.

| Method | Signature | Behavior |
|--------|-----------|----------|
| static `load` | `KmlDataSource.load(data, options) -> Promise<KmlDataSource>` | KML and KMZ |

`data` is a `Resource`, a URL string, a parsed `Document`, or a `Blob` holding
KMZ bytes.

`ConstructorOptions` and `LoadOptions` members and defaults:

| Member | Type | Default |
|--------|------|---------|
| `camera` | `Camera` | undefined |
| `canvas` | `HTMLCanvasElement` | undefined |
| `sourceUri` | string | undefined |
| `clampToGround` | boolean | `false` |
| `ellipsoid` | `Ellipsoid` | `Ellipsoid.default` |
| `screenOverlayContainer` | `Element` or string | undefined |

`camera` and `canvas` are optional in the API but required in practice for
network links and screen overlays. ALWAYS pass `viewer.scene.camera` and
`viewer.scene.canvas`.

Instance properties: `entities` (`EntityCollection`), `clock`
(`DataSourceClock`), `kmlTours` (`Array<KmlTour>`), `show`, `isLoading`.
Events: `refreshEvent`, `unsupportedNodeEvent`.

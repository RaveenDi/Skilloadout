# CesiumJS Geocoding API Reference

All names verified against the CesiumJS API reference at
`https://cesium.com/learn/cesiumjs/ref-doc/` for the 1.124+ release line.

## GeocoderService interface

`GeocoderService` is the interface every geocoder implements.

| Member | Signature | Returns |
|--------|-----------|---------|
| `geocode` | `geocode(query, type)` | `Promise<Array<GeocoderService.Result>>` |
| `credit` | property, readonly | `Credit` or `undefined` |

- `query` is the search string.
- `type` is an optional `GeocodeType`, default `GeocodeType.SEARCH`.
- `credit` is attribution shown after a geocode completes.

### GeocoderService.Result typedef

| Field | Type | Meaning |
|-------|------|---------|
| `displayName` | string | Human-readable name of the location |
| `destination` | `Rectangle` or `Cartesian3` | The location as a box or a point |
| `attributions` | `Array<object>`, optional | Per-result attribution data |

`camera.flyTo` accepts either a `Rectangle` or a `Cartesian3` as its
`destination`, so a `Result.destination` is usable without a type branch.

## IonGeocoderService

Backed by Cesium ion geocoding.

```js
new Cesium.IonGeocoderService(options);
```

| Option | Type | Default | Required |
|--------|------|---------|----------|
| `scene` | `Scene` | none | Yes |
| `accessToken` | string | `Ion.defaultAccessToken` | No |
| `server` | string or `Resource` | `Ion.defaultServer` | No |
| `geocodeProviderType` | `IonGeocodeProviderType` | `IonGeocodeProviderType.DEFAULT` | No |

`geocode(query, type)` returns `Promise<Array<GeocoderService.Result>>`.

## PeliasGeocoderService

Queries a Pelias geocoding server.

```js
new Cesium.PeliasGeocoderService(url);
```

`url` is the Pelias endpoint as a string or a `Resource`. `geocode(query,
type)` returns `Promise<Array<GeocoderService.Result>>`.

## CartographicGeocoderService

Parses a coordinate query string rather than a place name.

```js
new Cesium.CartographicGeocoderService();
```

Takes no constructor arguments and needs no token. It interprets a query of
the form `longitude latitude` or `longitude latitude height`, with longitude
and latitude in degrees and height in meters. `geocode(query)` returns
`Promise<Array<GeocoderService.Result>>`.

## Other built-in services

| Service | Constructor | Backend |
|---------|-------------|---------|
| `BingMapsGeocoderService` | `new Cesium.BingMapsGeocoderService(options)` | Bing Maps |
| `GoogleGeocoderService` | `new Cesium.GoogleGeocoderService(options)` | Google geocoding |
| `OpenCageGeocoderService` | `new Cesium.OpenCageGeocoderService(url, apiKey, params)` | OpenCage Data |

Each implements `GeocoderService`. Verify the exact constructor options for
these against the API reference before pinning them, as each wraps a
third-party account.

## GeocodeType enum

| Member | Meaning |
|--------|---------|
| `SEARCH` | The input is a complete query (the default) |
| `AUTOCOMPLETE` | The input is partial, for suggestions as the user types |

## IonGeocodeProviderType enum

| Member | Meaning |
|--------|---------|
| `DEFAULT` | The geocoder configured on the ion server |
| `GOOGLE` | The Google geocoder, for use with Google data |
| `BING` | The Bing geocoder, for use with Bing data |

## Viewer geocoder option

| Aspect | Value |
|--------|-------|
| Accepted types | `boolean`, `IonGeocodeProviderType`, or `Array<GeocoderService>` |
| Default | `IonGeocodeProviderType.DEFAULT` |
| `false` | The Geocoder widget is not created |
| `viewer.geocoder` | The `Geocoder` widget, read-only |

## Geocoder widget

| Option | Type | Default |
|--------|------|---------|
| `container` | element or id | required |
| `scene` | `Scene` | required |
| `geocoderServices` | `Array<GeocoderService>` | ion geocoder |
| `autoComplete` | boolean | `true` |
| `flightDuration` | number | `1.5` |
| `destinationFound` | `Geocoder.DestinationFoundFunction` | `GeocoderViewModel.flyToDestination` |

| Property | Type | Meaning |
|----------|------|---------|
| `viewModel` | `GeocoderViewModel` | The widget view model, read-only |
| `container` | element | The parent DOM element |

`Geocoder.DestinationFoundFunction` is a callback `(viewModel, destination)`
invoked after a successful geocode; the default flies the camera to the
result.

## GeocoderViewModel

| Option | Type | Meaning |
|--------|------|---------|
| `scene` | `Scene` | Required scene |
| `geocoderServices` | `Array<GeocoderService>` | Services queried for results |
| `flightDuration` | number | Camera flight time to a found location |
| `destinationFound` | `Geocoder.DestinationFoundFunction` | Callback after a geocode |

| Property | Type | Meaning |
|----------|------|---------|
| `searchText` | string | The query text, an address or coordinates |
| `isSearchInProgress` | boolean | `true` while a search runs |
| `complete` | `Event` | Fires when the result flight completes |
| `search` | `Command` | Runs the geocode and acts on the result |
| `keepExpanded` | boolean | Keep the input field always visible, default `false` |
| `autoComplete` | boolean | Query while typing, default `true` |
| `destinationFound` | `Geocoder.DestinationFoundFunction` | The success callback |

## Routing

CesiumJS and Cesium ion expose NO routing, directions, or path-finding API.
There is no `RouteService`, no `directions()` method, and no navigation class.
A route must be computed by an external service (for example OSRM, the Mapbox
Directions API, or the HERE Routing API) and then rendered in CesiumJS as a
`PolylineGraphics` entity or a `Polyline` primitive.

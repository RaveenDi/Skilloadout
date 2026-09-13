# CesiumJS Geocoding Anti-Patterns

Each entry lists the symptom, the root cause, and the fix. Verified against the
CesiumJS API reference and the project research base.

## 1. Expecting a routing or directions API

**Symptom:** A request asks CesiumJS to compute a route, draw directions, or
give turn-by-turn navigation, and no API can be found.

**Root cause:** CesiumJS and Cesium ion provide geocoding ONLY. There is no
`RouteService`, no `directions()` method, and no path-finding class anywhere in
either product. Geocoding maps a query string to a coordinate; it does not
connect two coordinates.

**Fix:** Compute the route with an external routing service such as OSRM, the
Mapbox Directions API, or the HERE Routing API. Take the returned coordinate
list and render it in CesiumJS as a `PolylineGraphics` entity or a `Polyline`
primitive. NEVER document a CesiumJS routing call; it would be a hallucination.

## 2. ion geocode without a valid access token

**Symptom:** An `IonGeocoderService` call fails with an authorization error or
resolves to an empty array, and the Geocoder widget finds nothing.

**Root cause:** ion geocoding is an authenticated service. When
`Ion.defaultAccessToken` is unset and no `accessToken` option is passed, ion
rejects the request.

**Fix:** Set `Cesium.Ion.defaultAccessToken` before the geocode, or pass an
explicit `accessToken` to the `IonGeocoderService` constructor.

## 3. Treating the geocode result as a single object

**Symptom:** Reading `result.displayName` or `result.destination` returns
`undefined`.

**Root cause:** `geocode` resolves to an `Array<GeocoderService.Result>`, not a
single result. The array is the value, even when only one place matches.

**Fix:** Read `results[0]` after confirming `results.length` is greater than
`0`. Treat an empty array as a no-match case, not an error.

## 4. Assuming destination is always a Cartesian3

**Symptom:** Code reads `.longitude` or `.x` off a `Result.destination` and
gets wrong or `undefined` values for some queries.

**Root cause:** `Result.destination` is a `Rectangle` for an area match and a
`Cartesian3` for a point match. The type varies per result and per provider.

**Fix:** Pass `destination` straight to `camera.flyTo`, which accepts both
types. When a point is genuinely required, branch on
`destination instanceof Cesium.Rectangle` and use `Rectangle.center`.

## 5. Custom geocoder missing the credit getter

**Symptom:** A custom `GeocoderService` works for the geocode call but the
Geocoder widget throws after a result comes back.

**Root cause:** The `GeocoderService` interface requires a readonly `credit`
member. The widget reads `credit` after every geocode to render attribution. A
custom class without it produces a property access on `undefined`.

**Fix:** Implement a `credit` getter on the custom geocoder. Return `undefined`
when there is no attribution, or a `Cesium.Credit` when there is.

## 6. Passing a single service instead of an array

**Symptom:** The `geocoder` option seems ignored and the default ion geocoder
is still used, or the `Viewer` constructor throws.

**Root cause:** The `geocoder` option expects `boolean`, an
`IonGeocodeProviderType`, or an `Array<GeocoderService>`. A bare service
instance is none of those.

**Fix:** Wrap the service in an array: `geocoder: [myService]`.

## 7. SEARCH used for live type-ahead

**Symptom:** An autocomplete field feels heavy and does not return partial
matches as the user types.

**Root cause:** `GeocodeType.SEARCH`, the default, treats the input as a
complete query. It is not meant for partial text.

**Fix:** Pass `Cesium.GeocodeType.AUTOCOMPLETE` as the second argument to
`geocode` while the user is still typing, and `SEARCH` for the final query.

## 8. geocodeProviderType set to a provider without data access

**Symptom:** An `IonGeocoderService` with `geocodeProviderType` set to `GOOGLE`
or `BING` fails where `DEFAULT` worked.

**Root cause:** `IonGeocodeProviderType.GOOGLE` and `BING` route through ion to
the named provider and require the matching data access on the ion account.

**Fix:** Use `IonGeocodeProviderType.DEFAULT` unless the ion account is
provisioned for the specific provider.

## 9. Custom geocoder throwing instead of returning an empty array

**Symptom:** A custom geocoder makes the Geocoder widget error out whenever a
query matches nothing.

**Root cause:** The `geocode` contract is to resolve to an array. Throwing, or
resolving to `undefined`, breaks the widget and any caller that expects an
array.

**Fix:** Return an empty array `[]` from `geocode` when nothing matches. Reserve
exceptions for genuine transport failures.

# CesiumJS Geocoding Examples

Complete, runnable recipes. Each assumes `Cesium.Ion.defaultAccessToken` is set
when an ion-backed service is used.

## 1. Default geocoder widget

The `Viewer` shows the ion Geocoder widget unless told otherwise.

```js
Cesium.Ion.defaultAccessToken = "<your ion token>";
const viewer = new Cesium.Viewer("cesiumContainer");
// The search box is present and uses ion geocoding.
```

## 2. Disable the geocoder widget

```js
const viewer = new Cesium.Viewer("cesiumContainer", { geocoder: false });
```

## 3. Coordinate search with CartographicGeocoderService

`CartographicGeocoderService` lets users type raw `longitude latitude` or
`longitude latitude height` into the widget.

```js
const viewer = new Cesium.Viewer("cesiumContainer", {
  geocoder: [new Cesium.CartographicGeocoderService()],
});
// Typing "4.9 52.37 1500" flies the camera to that coordinate.
```

To accept both place names and coordinates, pass both services. The widget
queries each and merges suggestions.

```js
const viewer = new Cesium.Viewer("cesiumContainer", {
  geocoder: [
    new Cesium.IonGeocoderService({ scene: undefined }),
    new Cesium.CartographicGeocoderService(),
  ],
});
```

When constructing `IonGeocoderService` outside the `Viewer`, pass the real
`viewer.scene`; see recipe 4.

## 4. Programmatic geocoding

Resolve a query in code and fly the camera to the first result.

```js
const viewer = new Cesium.Viewer("cesiumContainer");
const geocoder = new Cesium.IonGeocoderService({ scene: viewer.scene });

async function flyToPlace(query) {
  const results = await geocoder.geocode(query);
  if (results.length === 0) {
    console.warn(`no match for "${query}"`);
    return;
  }
  await viewer.camera.flyTo({ destination: results[0].destination });
}

flyToPlace("Rotterdam");
```

`results[0].destination` is a `Rectangle` or a `Cartesian3`; `camera.flyTo`
accepts either, so no type branch is needed.

## 5. Autocomplete suggestions while typing

Use `GeocodeType.AUTOCOMPLETE` for a type-ahead list.

```js
const geocoder = new Cesium.IonGeocoderService({ scene: viewer.scene });
const input = document.getElementById("placeSearch");
const list = document.getElementById("suggestions");

input.addEventListener("input", async () => {
  const text = input.value.trim();
  if (text.length < 3) {
    list.innerHTML = "";
    return;
  }
  const results = await geocoder.geocode(
    text,
    Cesium.GeocodeType.AUTOCOMPLETE,
  );
  list.innerHTML = "";
  for (const result of results) {
    const item = document.createElement("li");
    item.textContent = result.displayName;
    item.addEventListener("click", () => {
      viewer.camera.flyTo({ destination: result.destination });
    });
    list.appendChild(item);
  }
});
```

## 6. A custom GeocoderService

Any object with a `geocode` method and a `credit` getter is a valid backend.

```js
class CountryCapitalGeocoder {
  constructor() {
    this._capitals = {
      france: { lon: 2.3522, lat: 48.8566 },
      japan: { lon: 139.6917, lat: 35.6895 },
      brazil: { lon: -47.8825, lat: -15.7942 },
    };
  }

  get credit() {
    return undefined; // return a Cesium.Credit to show attribution
  }

  async geocode(query, type) {
    const key = query.trim().toLowerCase();
    const match = this._capitals[key];
    if (!match) {
      return []; // empty array, never throw, when nothing matches
    }
    return [
      {
        displayName: `Capital of ${query}`,
        destination: Cesium.Cartesian3.fromDegrees(match.lon, match.lat, 8000),
      },
    ];
  }
}

const viewer = new Cesium.Viewer("cesiumContainer", {
  geocoder: [new CountryCapitalGeocoder()],
});
```

## 7. Pelias geocoder against a self-hosted server

```js
const pelias = new Cesium.PeliasGeocoderService("https://pelias.example.com");
const viewer = new Cesium.Viewer("cesiumContainer", {
  geocoder: [pelias],
});
```

## 8. Rendering an external route

CesiumJS has no routing API. Compute the route with an external service, then
draw the returned coordinates as a polyline. This example assumes an OSRM-style
response of `[longitude, latitude]` pairs.

```js
async function drawRoute(startLonLat, endLonLat) {
  // Routing is done entirely outside CesiumJS.
  const response = await fetch(
    `https://routing.example.com/route?start=${startLonLat}&end=${endLonLat}`,
  );
  const data = await response.json();
  const flat = data.geometry.coordinates.flatMap(([lon, lat]) => [lon, lat]);

  viewer.entities.add({
    polyline: {
      positions: Cesium.Cartesian3.fromDegreesArray(flat),
      width: 4,
      material: Cesium.Color.ORANGE,
      clampToGround: true,
    },
  });
}
```

CesiumJS only renders the path; the route geometry comes from the external
service.

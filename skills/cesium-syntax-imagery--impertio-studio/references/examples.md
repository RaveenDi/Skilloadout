# Imagery Syntax : Examples

Every example targets CesiumJS 1.124+ and WebGL2. All APIs are verified against the
CesiumJS API reference (https://cesium.com/learn/cesiumjs/ref-doc/).

## 1. Cesium ion world imagery

```js
Cesium.Ion.defaultAccessToken = "<your-ion-token>";

const viewer = new Cesium.Viewer("cesiumContainer", {
  baseLayer: Cesium.ImageryLayer.fromWorldImagery(),
});
```

## 2. Async provider wrapped by fromProviderAsync

`fromProviderAsync` takes the provider PROMISE directly and manages the pending state.

```js
const arcGisLayer = Cesium.ImageryLayer.fromProviderAsync(
  Cesium.ArcGisMapServerImageryProvider.fromBasemapType(
    Cesium.ArcGisBaseMapType.SATELLITE,
    { token: "<arcgis-access-token>" }
  )
);
viewer.imageryLayers.add(arcGisLayer);
```

## 3. Await the provider, then construct the layer

```js
const provider = await Cesium.IonImageryProvider.fromAssetId(3954);
const layer = new Cesium.ImageryLayer(provider);
viewer.imageryLayers.add(layer);
```

## 4. Bing Maps via the async factory

```js
const bingProvider = await Cesium.BingMapsImageryProvider.fromUrl(
  "https://dev.virtualearth.net",
  { key: "<bing-maps-key>" }
);
viewer.imageryLayers.add(new Cesium.ImageryLayer(bingProvider));
```

## 5. OpenStreetMap, a synchronous provider

`addImageryProvider` builds and adds the layer in one call.

```js
viewer.imageryLayers.addImageryProvider(
  new Cesium.OpenStreetMapImageryProvider({
    url: "https://tile.openstreetmap.org",
  })
);
```

## 6. MapTiler or a custom XYZ server

There is no MapTiler provider class. Use `UrlTemplateImageryProvider`.

```js
viewer.imageryLayers.addImageryProvider(
  new Cesium.UrlTemplateImageryProvider({
    url: "https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=" + maptilerKey,
    credit: "MapTiler",
  })
);
```

## 7. A WMS layer

```js
viewer.imageryLayers.addImageryProvider(
  new Cesium.WebMapServiceImageryProvider({
    url: "https://example.org/geoserver/wms",
    layers: "topp:states",
    parameters: {
      transparent: true,
      format: "image/png",
    },
  })
);
```

## 8. A WMTS layer

```js
viewer.imageryLayers.addImageryProvider(
  new Cesium.WebMapTileServiceImageryProvider({
    url: "https://example.org/wmts",
    layer: "BlueMarble",
    style: "default",
    format: "image/jpeg",
    tileMatrixSetID: "EPSG:3857",
  })
);
```

## 9. A TileMapService (TMS) layer

```js
const tmsProvider = await Cesium.TileMapServiceImageryProvider.fromUrl(
  "../images/cesium_maptiler/Cesium_Logo_Color"
);
viewer.imageryLayers.addImageryProvider(tmsProvider);
```

## 10. A single image draped over a region

```js
const singleTile = await Cesium.SingleTileImageryProvider.fromUrl(
  "overlay.png",
  { rectangle: Cesium.Rectangle.fromDegrees(4.85, 52.34, 4.95, 52.40) }
);
viewer.imageryLayers.addImageryProvider(singleTile);
```

## 11. Layer ordering and blending

```js
const base = viewer.imageryLayers.get(0);

const overlay = viewer.imageryLayers.addImageryProvider(
  new Cesium.OpenStreetMapImageryProvider()
);

// Index 0 is the bottom. Bring the overlay to the top of the stack.
viewer.imageryLayers.raiseToTop(overlay);

// Blend the overlay over the base layer.
overlay.alpha = 0.5;
overlay.brightness = 1.2;
overlay.saturation = 0.8;
```

## 12. Removing a layer

```js
const layer = viewer.imageryLayers.get(1);
viewer.imageryLayers.remove(layer, true); // true destroys the layer resources
```

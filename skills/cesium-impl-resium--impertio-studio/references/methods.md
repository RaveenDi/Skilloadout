# Resium API Reference

Verified against the Resium repository (github.com/reearth/resium) for Resium
1.21.1. The Resium documentation site (resium.reearth.dev) was unreachable
during research; every name below is confirmed from the repository source.

## Package and Peer Dependencies

`npm install resium cesium`

Resium 1.21.1 `peerDependencies`:

```json
"peerDependencies": {
  "cesium": "1.x",
  "react": ">=18.2.0",
  "react-dom": ">=18.2.0"
}
```

CesiumJS is a peer dependency: the application installs and pins `cesium`
itself. Resium 1.21.1 is developed against CesiumJS 1.141 and supports any
CesiumJS `1.x`, 1.124 or newer for this skill package.

## Root Components

| Component | Wraps | Purpose |
|-----------|-------|---------|
| `Viewer` | `Cesium.Viewer` | Full UI with toolbar and widgets |
| `CesiumWidget` | `Cesium.CesiumWidget` | Minimal canvas, no toolbar |

All other components MUST be nested inside one of these.

## Component Catalog

Resium exports a component per CesiumJS object. Component names match the
CesiumJS class names. Each component has a matching `<Name>Props` type.

**Data and features:** `Entity`, `EntityDescription`, `CzmlDataSource`,
`GeoJsonDataSource`, `KmlDataSource`, `CustomDataSource`, `Cesium3DTileset`,
`TimeDynamicPointCloud`.

**Entity graphics:** `BillboardGraphics`, `BoxGraphics`,
`Cesium3DTilesetGraphics`, `CorridorGraphics`, `CylinderGraphics`,
`EllipseGraphics`, `EllipsoidGraphics`, `LabelGraphics`, `ModelGraphics`,
`PathGraphics`, `PlaneGraphics`, `PointGraphics`, `PolygonGraphics`,
`PolylineGraphics`, `PolylineVolumeGraphics`, `RectangleGraphics`,
`WallGraphics`.

**Primitives and collections:** `Primitive`, `GroundPrimitive`,
`GroundPolylinePrimitive`, `GroundPrimitiveCollection`,
`ClassificationPrimitive`, `Model`, `Billboard`, `BillboardCollection`,
`Label`, `LabelCollection`, `PointPrimitive`, `PointPrimitiveCollection`,
`Polyline`, `PolylineCollection`, `BufferPoint`, `BufferPointCollection`,
`BufferPolygon`, `BufferPolygonCollection`, `BufferPolyline`,
`BufferPolylineCollection`, `CloudCollection`, `CumulusCloud`,
`ParticleSystem`.

**Scene and environment:** `Scene`, `Globe`, `Camera`,
`ScreenSpaceCameraController`, `SkyAtmosphere`, `SkyBox`, `Sun`, `Moon`,
`Fog`, `Clock`, `ShadowMap`, `CubeMapPanorama`, `EquirectangularPanorama`.

**Camera operations:** `CameraFlyTo`, `CameraFlyToBoundingSphere`,
`CameraFlyHome`, `CameraLookAt`.

**Imagery and terrain:** `ImageryLayer`, `ImageryLayerCollection`,
`Google2DImageryProvider`, `WebMapTileServiceImageryProvider`,
`Cesium3DTilesTerrainProvider`.

**Events:** `ScreenSpaceEvent`, `ScreenSpaceEventHandler`.

**Post-processing:** `PostProcessStage`, `PostProcessStageComposite`,
`BlackAndWhiteStage`, `BrightnessStage`, `LensFlareStage`, `Fxaa`,
`NightVisionStage`, `AmbientOcclusion`, `Bloom`, `BlurStage`,
`DepthOfFieldStage`, `EdgeDetectionStage`, `SilhouetteStage`.

## Component Props

A component prop is one of:

- A construction option, passed once at mount.
- A settable property of the Cesium object, kept in sync on re-render.
- An event prop such as `onClick`, attached as a handler.

A graphics object is set either as a prop on `Entity`
(`<Entity point={{ pixelSize: 10 }} />`) or as a nested graphics component
(`<Entity><PointGraphics pixelSize={10} /></Entity>`).

## CesiumComponentRef

```ts
export type CesiumComponentRef<Element> = {
  cesiumElement?: Element;
};
```

A component `ref` resolves to a `CesiumComponentRef<T>`. The `cesiumElement`
property holds the native Cesium object. It is OPTIONAL and is `undefined`
until the component mounts. Read it inside `useEffect` and guard it before
use.

```ts
const viewerRef = useRef<CesiumComponentRef<CesiumViewer>>(null);
```

## useCesium

```ts
export const CesiumContext = createContext<ResiumContext>({});
export const useCesium = (): ResiumContext => useContext(CesiumContext) || {};
```

`useCesium` returns the `ResiumContext` of the nearest root component. Called
outside a `Viewer` or `CesiumWidget`, it returns an empty object.

### ResiumContext Shape

Every field is optional:

| Field | Type |
|-------|------|
| `viewer` | `Viewer` |
| `cesiumWidget` | `CesiumWidget` |
| `scene` | `Scene` |
| `globe` | `Globe` |
| `camera` | `Camera` |
| `screenSpaceEventHandler` | `ScreenSpaceEventHandler` |
| `entity` | `Entity` |
| `dataSource` | `DataSource` |
| `dataSourceCollection` | `DataSourceCollection` |
| `entityCollection` | `EntityCollection` |
| `imageryLayerCollection` | `ImageryLayerCollection` |
| `primitiveCollection` | `PrimitiveCollection` |
| `billboardCollection` | `BillboardCollection` |
| `labelCollection` | `LabelCollection` |
| `polylineCollection` | `PolylineCollection` |
| `pointPrimitiveCollection` | `PointPrimitiveCollection` |
| `cloudCollection` | `CloudCollection` |

The field that is populated depends on where the calling component sits in
the tree. A component directly under `Viewer` sees `viewer`, `scene`,
`camera`; a component under an `Entity` also sees `entity`.

## Lifecycle

Resium creates the Cesium object on mount and calls `destroy()` on the object
when the component unmounts. A native object obtained imperatively through a
ref and added outside the component tree is NOT torn down by Resium; destroy
it manually. See `cesium-core-memory`.

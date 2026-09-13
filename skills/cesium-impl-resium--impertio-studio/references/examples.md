# Resium Examples

Complete, runnable recipes for Resium 1.21.1 with CesiumJS 1.124+ and React
18.2 or newer.

## Project Setup

```bash
npm install resium cesium
```

In a Vite project, add `vite-plugin-cesium` so the CesiumJS static assets are
copied and `CESIUM_BASE_URL` is set. Import the widget CSS once, in the entry
file.

```js
// main.jsx
import "cesium/Build/Cesium/Widgets/widgets.css";
```

## A Viewer With an Entity

```jsx
import { Viewer, Entity, PointGraphics } from "resium";
import { Cartesian3, Color } from "cesium";

export function Map() {
  return (
    <Viewer full>
      <Entity
        name="Amsterdam"
        position={Cartesian3.fromDegrees(4.9041, 52.3676, 100)}
        description="A point in Amsterdam"
      >
        <PointGraphics pixelSize={12} color={Color.ORANGE} />
      </Entity>
    </Viewer>
  );
}
```

## Accessing the Viewer Through a Ref

```jsx
import { useRef, useEffect } from "react";
import { Viewer } from "resium";

export function Map() {
  const viewerRef = useRef(null);

  useEffect(() => {
    const viewer = viewerRef.current?.cesiumElement;
    if (!viewer) {
      return;
    }
    viewer.scene.globe.enableLighting = true;
    viewer.scene.requestRenderMode = true;
  }, []);

  return <Viewer ref={viewerRef} full />;
}
```

`cesiumElement` is `undefined` during the first render. The `useEffect` runs
after mount, and the guard handles the case where creation failed.

## TypeScript Ref Typing

```tsx
import { useRef } from "react";
import { Viewer, type CesiumComponentRef } from "resium";
import type { Viewer as CesiumViewer } from "cesium";

export function Map() {
  const viewerRef = useRef<CesiumComponentRef<CesiumViewer>>(null);
  return <Viewer ref={viewerRef} full />;
}
```

## Reading Context With useCesium

```jsx
import { Viewer, useCesium } from "resium";

function CameraReadout() {
  const { camera } = useCesium();
  if (!camera) {
    return null;
  }
  return <div>Camera height: {camera.positionCartographic.height.toFixed(0)} m</div>;
}

export function Map() {
  return (
    <Viewer full>
      <CameraReadout />
    </Viewer>
  );
}
```

`CameraReadout` is a child of `Viewer`, so `useCesium` returns a populated
context. The same component placed outside `Viewer` would receive an empty
object.

## Declarative Camera Flight

```jsx
import { Viewer, CameraFlyTo } from "resium";
import { Cartesian3 } from "cesium";

export function Map() {
  return (
    <Viewer full>
      <CameraFlyTo
        destination={Cartesian3.fromDegrees(4.9041, 52.3676, 5000)}
        duration={3}
        once
      />
    </Viewer>
  );
}
```

The `once` prop flies a single time. Without it, the flight repeats whenever
the props change.

## Loading a 3D Tileset

```jsx
import { useRef, useEffect } from "react";
import { Viewer, Cesium3DTileset } from "resium";

export function Map() {
  const tilesetRef = useRef(null);
  const viewerRef = useRef(null);

  useEffect(() => {
    const tileset = tilesetRef.current?.cesiumElement;
    const viewer = viewerRef.current?.cesiumElement;
    if (!tileset || !viewer) {
      return;
    }
    viewer.zoomTo(tileset);
  }, []);

  return (
    <Viewer ref={viewerRef} full>
      <Cesium3DTileset
        ref={tilesetRef}
        url="https://example.com/tileset.json"
      />
    </Viewer>
  );
}
```

The `Cesium3DTileset` component loads the tileset through the CesiumJS async
factory internally. The ref resolves after the tileset is ready.

## Handling a Click

```jsx
import { Viewer, ScreenSpaceEventHandler, ScreenSpaceEvent } from "resium";
import { ScreenSpaceEventType } from "cesium";

export function Map() {
  const handleClick = (event) => {
    console.log("Clicked at", event.position);
  };

  return (
    <Viewer full>
      <ScreenSpaceEventHandler>
        <ScreenSpaceEvent
          action={handleClick}
          type={ScreenSpaceEventType.LEFT_CLICK}
        />
      </ScreenSpaceEventHandler>
    </Viewer>
  );
}
```

An `Entity` also accepts an `onClick` prop for per-entity clicks.

## Conditionally Rendering a Layer

```jsx
import { Viewer, ImageryLayer } from "resium";

export function Map({ showOverlay, provider }) {
  return (
    <Viewer full>
      {showOverlay && <ImageryLayer imageryProvider={provider} />}
    </Viewer>
  );
}
```

When `showOverlay` turns false, React unmounts the `ImageryLayer` and Resium
removes the layer from the scene.

# Resium Anti-Patterns

Each entry is a real failure mode. Format: symptom, root cause, fix. Verified
against the Resium repository (github.com/reearth/resium) for Resium 1.21.1.

## 1. Resium Installed Without CesiumJS

**Symptom:** The build fails with a peer-dependency error or a missing
`cesium` module.

**Root cause:** CesiumJS is a peer dependency of Resium. Resium does not
bundle it. Installing only `resium` leaves `cesium` absent.

**Fix:** ALWAYS install both.

```bash
npm install resium cesium
```

## 2. Component Placed Outside a Root

**Symptom:** A component is in the JSX but nothing appears, with no error.

**Root cause:** Every Resium component except `Viewer` and `CesiumWidget`
MUST be a descendant of one of those root components. A component outside a
root has no Cesium context to attach to.

**Fix:** Nest the component inside a `<Viewer>` or `<CesiumWidget>`.

```jsx
// WRONG
<Entity position={position} />
<Viewer full />

// RIGHT
<Viewer full>
  <Entity position={position} />
</Viewer>
```

## 3. Reading cesiumElement During Render

**Symptom:** A crash on first render, or `cesiumElement` is `undefined`.

**Root cause:** `CesiumComponentRef.cesiumElement` is `undefined` until the
component has mounted and the Cesium object is created. The render pass runs
before the ref is populated.

**Fix:** Read `cesiumElement` inside `useEffect`, which runs after mount.

```jsx
useEffect(() => {
  const viewer = viewerRef.current?.cesiumElement;
  if (!viewer) {
    return;
  }
  // use viewer
}, []);
```

## 4. Using cesiumElement Without a Guard

**Symptom:** An intermittent `Cannot read properties of undefined` crash.

**Root cause:** `cesiumElement` is typed as optional. Object creation can
fail, and a parent re-render can run effect code before the child mounts.

**Fix:** ALWAYS check `cesiumElement` before use, with `?.` or an early
return.

## 5. useCesium Outside a Root Component

**Symptom:** `useCesium()` returns an object whose `viewer`, `scene`, and
`camera` are all `undefined`.

**Root cause:** The Resium context provider is the root component. A
component that calls `useCesium` but is not a descendant of a `Viewer` or
`CesiumWidget` receives the empty default context.

**Fix:** Call `useCesium` only in a component rendered inside a root
component.

## 6. Missing widgets.css Import

**Symptom:** The `Viewer` renders, but the timeline, toolbar, and other
widgets look broken and unstyled.

**Root cause:** The CesiumJS widget stylesheet was never imported. Resium
does not import it.

**Fix:** Import the CSS once, in the application entry file.

```js
import "cesium/Build/Cesium/Widgets/widgets.css";
```

## 7. CESIUM_BASE_URL Not Configured

**Symptom:** The `Viewer` is blank, and the console shows 404s for files
under `Workers`, `Assets`, or `Widgets`.

**Root cause:** CesiumJS needs its static directories served and
`window.CESIUM_BASE_URL` set before import. Resium does not configure this.

**Fix:** Use `vite-plugin-cesium` in a Vite project, or the equivalent
webpack setup. See `cesium-impl-build-deploy`.

## 8. Pinning an Incompatible CesiumJS Version

**Symptom:** A peer-dependency warning on install, or runtime errors against
the Resium components.

**Root cause:** Resium 1.21.1 declares the peer dependency `cesium: "1.x"`.
A CesiumJS major version outside `1.x` is not supported.

**Fix:** Install a CesiumJS `1.x`, version 1.124 or newer for this skill
package.

## 9. Expecting a Native Object Added by Ref to Be Cleaned Up

**Symptom:** Memory grows after components unmount.

**Root cause:** Resium calls `destroy()` on the objects it creates from
components. A native object created imperatively through a ref and added
outside the component tree is not tracked by Resium.

**Fix:** Destroy any manually created native object yourself, in the
`useEffect` cleanup function. See `cesium-core-memory`.

```jsx
useEffect(() => {
  const viewer = viewerRef.current?.cesiumElement;
  if (!viewer) {
    return;
  }
  const tileset = /* created imperatively */;
  viewer.scene.primitives.add(tileset);
  return () => {
    viewer.scene.primitives.remove(tileset);
  };
}, []);
```

## 10. CameraFlyTo Repeating Every Render

**Symptom:** The camera flies again on every state change.

**Root cause:** `CameraFlyTo` runs whenever its props change. Without the
`once` prop, a parent re-render that recreates the `destination` re-triggers
the flight.

**Fix:** Add the `once` prop for a single flight, or keep the `destination`
value stable with `useMemo`.

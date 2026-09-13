# CesiumJS Time Examples

Complete, runnable recipes. Each assumes a `Viewer` exists as `viewer` and
`Cesium.Ion.defaultAccessToken` is set when ion assets are used.

## 1. Animated flight track with a SampledPositionProperty

Drives an entity along time-stamped positions and tracks it with the camera.

```js
const start = Cesium.JulianDate.fromIso8601("2026-05-20T00:00:00Z");
const stop = Cesium.JulianDate.addSeconds(start, 1200, new Cesium.JulianDate());

// Clock setup. shouldAnimate must be true or nothing moves.
viewer.clock.startTime = start;
viewer.clock.stopTime = stop;
viewer.clock.currentTime = Cesium.JulianDate.clone(start);
viewer.clock.clockRange = Cesium.ClockRange.LOOP_STOP;
viewer.clock.multiplier = 30;
viewer.clock.shouldAnimate = true;
viewer.timeline.zoomTo(start, stop);

// Build the position track.
const route = [
  { offset: 0, lon: 4.9, lat: 52.37, height: 1000 },
  { offset: 300, lon: 4.97, lat: 52.41, height: 1800 },
  { offset: 600, lon: 5.05, lat: 52.46, height: 2200 },
  { offset: 900, lon: 5.12, lat: 52.5, height: 1600 },
  { offset: 1200, lon: 5.2, lat: 52.55, height: 1000 },
];

const positionProperty = new Cesium.SampledPositionProperty();
for (const point of route) {
  const time = Cesium.JulianDate.addSeconds(
    start,
    point.offset,
    new Cesium.JulianDate(),
  );
  positionProperty.addSample(
    time,
    Cesium.Cartesian3.fromDegrees(point.lon, point.lat, point.height),
  );
}

const aircraft = viewer.entities.add({
  position: positionProperty,
  point: { pixelSize: 14, color: Cesium.Color.YELLOW },
  path: {
    width: 3,
    material: Cesium.Color.CYAN,
    leadTime: 0,
    trailTime: 600,
  },
});
viewer.trackedEntity = aircraft;
```

## 2. JulianDate arithmetic

```js
const launch = Cesium.JulianDate.fromIso8601("2026-05-20T08:00:00Z");

// Offsets never change the input; they write into the result argument.
const tenMinutesLater = Cesium.JulianDate.addMinutes(
  launch,
  10,
  new Cesium.JulianDate(),
);
const oneDayLater = Cesium.JulianDate.addDays(
  launch,
  1,
  new Cesium.JulianDate(),
);

// Comparison.
const elapsed = Cesium.JulianDate.secondsDifference(tenMinutesLater, launch);
console.log(elapsed); // 600

if (Cesium.JulianDate.lessThan(launch, tenMinutesLater)) {
  console.log("launch is earlier");
}

// Format back to a string.
console.log(Cesium.JulianDate.toIso8601(oneDayLater));
```

## 3. Smooth interpolation with Lagrange

Linear interpolation gives straight segments. A curved path needs Lagrange or
Hermite, and enough samples for the chosen degree.

```js
const positionProperty = new Cesium.SampledPositionProperty();

// Eight samples leave room for degree 5 around any query time.
for (let i = 0; i < 8; i++) {
  const time = Cesium.JulianDate.addSeconds(
    start,
    i * 150,
    new Cesium.JulianDate(),
  );
  positionProperty.addSample(
    time,
    Cesium.Cartesian3.fromDegrees(4.9 + i * 0.03, 52.37 + i * 0.02, 1500),
  );
}

positionProperty.setInterpolationOptions({
  interpolationAlgorithm: Cesium.LagrangePolynomialApproximation,
  interpolationDegree: 5,
});
```

## 4. Hermite interpolation with velocity derivatives

Hermite is correct only when the property carries derivatives. Construct with
`numberOfDerivatives` set to `1` and pass a velocity array to `addSample`.

```js
const positionProperty = new Cesium.SampledPositionProperty(
  Cesium.ReferenceFrame.FIXED,
  1, // one derivative: velocity
);

const samples = [
  {
    offset: 0,
    position: Cesium.Cartesian3.fromDegrees(4.9, 52.37, 1500),
    velocity: new Cesium.Cartesian3(120, 0, 0),
  },
  {
    offset: 300,
    position: Cesium.Cartesian3.fromDegrees(4.97, 52.41, 1800),
    velocity: new Cesium.Cartesian3(110, 40, 0),
  },
];
for (const s of samples) {
  const time = Cesium.JulianDate.addSeconds(
    start,
    s.offset,
    new Cesium.JulianDate(),
  );
  positionProperty.addSample(time, s.position, [s.velocity]);
}

positionProperty.setInterpolationOptions({
  interpolationAlgorithm: Cesium.HermitePolynomialApproximation,
  interpolationDegree: 1,
});
```

## 5. Hold the entity at its endpoint with extrapolation

By default a track returns `undefined` outside its samples and the entity
vanishes. `HOLD` keeps it parked.

```js
const positionProperty = new Cesium.SampledPositionProperty();
// ... addSample calls ...

positionProperty.forwardExtrapolationType = Cesium.ExtrapolationType.HOLD;
positionProperty.backwardExtrapolationType = Cesium.ExtrapolationType.HOLD;
```

## 6. Visibility windows with availability

The aircraft from recipe 1 should only appear during its active flight window.

```js
const flightWindow = Cesium.TimeInterval.fromIso8601({
  iso8601: "2026-05-20T00:02:00Z/2026-05-20T00:18:00Z",
});
aircraft.availability = new Cesium.TimeIntervalCollection([flightWindow]);
```

Two separate windows for an entity that is active twice:

```js
aircraft.availability = new Cesium.TimeIntervalCollection([
  Cesium.TimeInterval.fromIso8601({
    iso8601: "2026-05-20T00:02:00Z/2026-05-20T00:08:00Z",
  }),
  Cesium.TimeInterval.fromIso8601({
    iso8601: "2026-05-20T00:14:00Z/2026-05-20T00:18:00Z",
  }),
]);
```

## 7. A deterministic clock for a video export

`TICK_DEPENDENT` advances a fixed amount per frame, independent of frame rate,
so an exported sequence is reproducible.

```js
viewer.clock.clockStep = Cesium.ClockStep.TICK_DEPENDENT;
viewer.clock.multiplier = 1 / 30; // one render frame is 1/30 simulated second
viewer.clock.shouldAnimate = true;
```

## 8. Reacting to clock ticks

`Clock.onTick` fires every frame after the time advances.

```js
const removeListener = viewer.clock.onTick.addEventListener((clock) => {
  const seconds = Cesium.JulianDate.secondsDifference(
    clock.currentTime,
    clock.startTime,
  );
  document.getElementById("elapsed").textContent = `${seconds.toFixed(1)} s`;
});

// Remove the listener during teardown.
// removeListener();
```

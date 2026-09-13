# CesiumJS Time API Reference

All names verified against the CesiumJS API reference at
`https://cesium.com/learn/cesiumjs/ref-doc/` for the 1.124+ release line.

## JulianDate

`JulianDate` represents an astronomical Julian date as a whole day number plus
seconds-of-day, stored internally in International Atomic Time
(`TimeStandard.TAI`) so arithmetic is leap-second-safe.

### Constructor

```js
new Cesium.JulianDate(julianDayNumber, secondsOfDay, timeStandard);
```

All arguments are optional. ALWAYS prefer a factory over the raw constructor.

### Instance properties

| Property | Type | Meaning |
|----------|------|---------|
| `dayNumber` | number | Whole days of the Julian date |
| `secondsOfDay` | number | Seconds elapsed into the current day |

### Static factory methods

| Method | Returns |
|--------|---------|
| `JulianDate.fromDate(date, result)` | A `JulianDate` from a JavaScript `Date` |
| `JulianDate.fromIso8601(iso8601String, result)` | A `JulianDate` from an ISO 8601 string |
| `JulianDate.fromGregorianDate(date, result)` | A `JulianDate` from a `GregorianDate` |
| `JulianDate.now(result)` | The current system time |

### Static arithmetic and comparison methods

| Method | Returns |
|--------|---------|
| `JulianDate.addSeconds(julianDate, seconds, result)` | A new offset `JulianDate` |
| `JulianDate.addMinutes(julianDate, minutes, result)` | A new offset `JulianDate` |
| `JulianDate.addHours(julianDate, hours, result)` | A new offset `JulianDate` |
| `JulianDate.addDays(julianDate, days, result)` | A new offset `JulianDate` |
| `JulianDate.compare(left, right)` | Negative, zero, or positive sort order |
| `JulianDate.secondsDifference(left, right)` | Seconds of `left` minus `right` |
| `JulianDate.daysDifference(left, right)` | Days of `left` minus `right` |
| `JulianDate.lessThan(left, right)` | `true` if `left` is earlier |
| `JulianDate.greaterThan(left, right)` | `true` if `left` is later |
| `JulianDate.equals(left, right)` | `true` if equal |
| `JulianDate.toIso8601(julianDate, precision)` | An ISO 8601 string |
| `JulianDate.toDate(julianDate)` | A JavaScript `Date` |
| `JulianDate.clone(julianDate, result)` | An independent copy |

The `result` argument is optional; when omitted a new instance is returned.

## Clock

A `Clock` advances simulation time. `viewer.clock` is the `Viewer` instance.

### Constructor options and properties

| Name | Type | Default | Meaning |
|------|------|---------|---------|
| `startTime` | `JulianDate` | undefined | Start of the clock interval |
| `stopTime` | `JulianDate` | undefined | End of the clock interval |
| `currentTime` | `JulianDate` | undefined | The active simulation time |
| `multiplier` | number | `1.0` | Time advancement factor per tick |
| `clockStep` | `ClockStep` | `SYSTEM_CLOCK_MULTIPLIER` | How a tick advances time |
| `clockRange` | `ClockRange` | `UNBOUNDED` | Behavior at the interval bounds |
| `canAnimate` | boolean | `true` | Whether ticking may advance time |
| `shouldAnimate` | boolean | `false` | Whether ticking should advance time |

### Events and methods

| Member | Meaning |
|--------|---------|
| `onTick` | `Event` fired whenever `tick()` is called |
| `onStop` | `Event` fired whenever `stopTime` is reached |
| `tick()` | Advances the clock one step and returns the new `currentTime` |

## ClockStep enum

| Member | Meaning |
|--------|---------|
| `TICK_DEPENDENT` | Advances by a fixed `multiplier` seconds per tick |
| `SYSTEM_CLOCK_MULTIPLIER` | Advances by real elapsed time times `multiplier` |
| `SYSTEM_CLOCK` | Sets the clock to the real system time, ignoring other settings |

## ClockRange enum

| Member | Meaning |
|--------|---------|
| `UNBOUNDED` | `tick()` always advances in the current direction |
| `CLAMPED` | `tick()` will not advance `currentTime` past the bound |
| `LOOP_STOP` | `tick()` advances `currentTime` to the opposite end of the interval |

## ClockViewModel

`ClockViewModel` wraps a `Clock` for the Animation and Timeline widgets.

```js
new Cesium.ClockViewModel(clock); // clock argument is optional
```

| Member | Meaning |
|--------|---------|
| `startTime`, `stopTime`, `currentTime` | Mirror the underlying clock times |
| `multiplier`, `clockStep`, `clockRange` | Mirror the clock advancement config |
| `canAnimate`, `shouldAnimate` | Mirror the clock animation flags |
| `systemTime` | The real current system time, read-only |
| `clock` | The underlying `Clock`, read-only |
| `synchronize()` | Refreshes the view model from the underlying clock |

## SampledPositionProperty

Interpolates a `Cartesian3` position between time-stamped samples.

### Constructor

```js
new Cesium.SampledPositionProperty(referenceFrame, numberOfDerivatives);
```

| Parameter | Default | Meaning |
|-----------|---------|---------|
| `referenceFrame` | `ReferenceFrame.FIXED` | Coordinate frame of the positions |
| `numberOfDerivatives` | `0` | Count of derivative arrays per sample |

### Methods

| Method | Meaning |
|--------|---------|
| `addSample(time, position, derivatives)` | Adds one time-stamped sample |
| `addSamples(times, positions, derivatives)` | Adds parallel arrays of samples |
| `addSamplesPackedArray(packedSamples, epoch)` | Adds samples from a packed array |
| `setInterpolationOptions(options)` | Sets `interpolationAlgorithm` and `interpolationDegree` |
| `removeSample(time)` | Removes a single sample |
| `removeSamples(timeInterval)` | Removes samples in an interval |
| `getValue(time, result)` | Interpolates the position at `time` |
| `getValueInReferenceFrame(time, referenceFrame, result)` | Position in another frame |

### Properties

| Property | Default | Meaning |
|----------|---------|---------|
| `isConstant` | derived | `true` while one sample or fewer exist |
| `definitionChanged` | `Event` | Fires when the result of `getValue` would change |
| `referenceFrame` | constructor | The coordinate frame |
| `interpolationDegree` | `1` | Polynomial degree, read-only |
| `interpolationAlgorithm` | `LinearApproximation` | The algorithm, read-only |
| `numberOfDerivatives` | constructor | Derivative count per sample |
| `forwardExtrapolationType` | `ExtrapolationType.NONE` | Behavior after the last sample |
| `forwardExtrapolationDuration` | `0` | Forward window, `0` is unlimited |
| `backwardExtrapolationType` | `ExtrapolationType.NONE` | Behavior before the first sample |
| `backwardExtrapolationDuration` | `0` | Backward window, `0` is unlimited |

## SampledProperty

The non-position equivalent for any `Packable` value such as a number, color,
or `Cartesian3` that is not a globe position.

```js
new Cesium.SampledProperty(type, derivativeTypes);
```

Methods `addSample`, `addSamples`, `setInterpolationOptions`, and `getValue`
behave as on `SampledPositionProperty`. `SampledProperty` and
`SampledPositionProperty` are distinct classes.

## Interpolation algorithms

Each is an `InterpolationAlgorithm` passed to `setInterpolationOptions`.

| Algorithm | Use |
|-----------|-----|
| `LinearApproximation` | Straight-line interpolation, the default, degree 1 |
| `LagrangePolynomialApproximation` | Smooth polynomial curves through samples |
| `HermitePolynomialApproximation` | Polynomial curves that honor sample derivatives |

An `InterpolationAlgorithm` exposes `getRequiredDataPoints(degree)`,
`interpolateOrderZero(...)`, and `interpolate(...)`. Skill code only needs to
pass the algorithm object; CesiumJS calls these internally.

## ExtrapolationType enum

| Member | Meaning |
|--------|---------|
| `NONE` | No extrapolation; `getValue` returns `undefined` outside the range |
| `HOLD` | The first or last sample value is held outside the range |
| `EXTRAPOLATE` | The value is projected from the sample trend |

## TimeIntervalCollection

A sorted, non-overlapping set of `TimeInterval`s.

### Static factory methods

| Method | Builds a collection from |
|--------|--------------------------|
| `TimeIntervalCollection.fromJulianDateArray(options, result)` | An array of `JulianDate`s |
| `TimeIntervalCollection.fromIso8601(options, result)` | An ISO 8601 start/stop/duration spec |
| `TimeIntervalCollection.fromIso8601DateArray(options, result)` | An array of ISO 8601 dates |
| `TimeIntervalCollection.fromIso8601DurationArray(options, result)` | ISO 8601 durations from an epoch |

### Methods and properties

| Member | Meaning |
|--------|---------|
| `addInterval(interval, dataComparer)` | Adds an interval, merging where data matches |
| `removeInterval(interval)` | Removes a time range |
| `contains(julianDate)` | `true` if the date falls in any interval |
| `findIntervalContainingDate(date)` | The interval enclosing a date |
| `get(index)` | The interval at a numeric index |
| `start`, `stop` | The `JulianDate` bounds of the whole collection |
| `length` | The number of intervals |
| `isEmpty` | `true` when no intervals are present |

## TimeInterval

A single span of time.

### Constructor options

| Option | Default | Meaning |
|--------|---------|---------|
| `start` | `JulianDate` | Beginning of the interval |
| `stop` | `JulianDate` | End of the interval |
| `isStartIncluded` | `true` | Whether `start` is inside the interval |
| `isStopIncluded` | `true` | Whether `stop` is inside the interval |
| `data` | undefined | Arbitrary value associated with the interval |

`TimeInterval.fromIso8601(options)` parses an ISO 8601 interval string, supplied
as the `iso8601` option, into a `TimeInterval`.

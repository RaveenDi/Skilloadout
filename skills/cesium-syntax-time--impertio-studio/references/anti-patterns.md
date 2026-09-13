# CesiumJS Time Anti-Patterns

Each entry lists the symptom, the root cause, and the fix. Verified against the
CesiumJS API reference and the project research base.

## 1. Animation never moves because shouldAnimate is false

**Symptom:** A `SampledPositionProperty` track, a glTF animation, or the
timeline does not advance. The scene looks static.

**Root cause:** `Clock.shouldAnimate` defaults to `false`. A clock that is not
animating never advances `currentTime`, so every time-dynamic property keeps
returning its value at the start time.

**Fix:** Set `viewer.clock.shouldAnimate = true`, or pass `shouldAnimate: true`
to the `Viewer` constructor. NEVER assume a track moves on its own.

## 2. Entity does not interpolate because it has one sample

**Symptom:** An entity with a `SampledPositionProperty` stays at a fixed
position even though the clock is running.

**Root cause:** A sampled property with one sample or fewer reports
`isConstant` as `true`. With nothing to interpolate between, it returns that
single value at every time.

**Fix:** ALWAYS add two or more samples with `addSample` or `addSamples` before
expecting motion.

## 3. interpolationDegree too high for the sample count

**Symptom:** A path configured for `LagrangePolynomialApproximation` at a high
degree does not look like the expected smooth curve.

**Root cause:** A polynomial of degree N needs N+1 samples around the query
time. When fewer in-range samples exist, CesiumJS silently falls back to a
lower degree, so the curve is not the one configured.

**Fix:** ALWAYS keep `interpolationDegree` below the count of samples that
surround the times being queried. For degree 5, supply at least 6 samples.

## 4. Hermite interpolation without derivatives

**Symptom:** A track set to `HermitePolynomialApproximation` interpolates
incorrectly or throws.

**Root cause:** `HermitePolynomialApproximation` consumes sample derivatives
such as velocity. A `SampledPositionProperty` created with the default
`numberOfDerivatives` of `0` carries no derivatives for Hermite to use.

**Fix:** Construct the property with `numberOfDerivatives` set to `1` and pass
a velocity array as the third `addSample` argument. If no derivative data
exists, use `LinearApproximation` or `LagrangePolynomialApproximation` instead.

## 5. Track disappears at its ends with ExtrapolationType.NONE

**Symptom:** An entity is invisible before its first sample time and after its
last, even though the clock is inside the overall scene window.

**Root cause:** `forwardExtrapolationType` and `backwardExtrapolationType`
default to `ExtrapolationType.NONE`. Outside the sample range the property
returns `undefined`, and an entity with an undefined position is not drawn.

**Fix:** Set both to `ExtrapolationType.HOLD` to park the entity at its first
or last sample, or constrain playback to the sample range.

## 6. Entity hidden by an availability window

**Symptom:** An entity with a valid `position` never appears during playback.

**Root cause:** `entity.availability` is a `TimeIntervalCollection`. The entity
is drawn ONLY while `viewer.clock.currentTime` falls inside an interval. A
window that does not cover the current time hides the entity regardless of its
position.

**Fix:** Check `availability` against `viewer.clock.currentTime`. Widen the
`TimeIntervalCollection`, or remove `availability` if the entity should always
be visible.

## 7. Parsing ISO 8601 with Date.parse

**Symptom:** A time read from a string is wrong, off by a time zone, or
`Invalid Date`.

**Root cause:** `Date.parse` and `new Date(string)` handle only a subset of ISO
8601 and behave inconsistently across browsers, especially for forms without a
zone or with fractional seconds.

**Fix:** ALWAYS parse with `JulianDate.fromIso8601`, which accepts every ISO
8601 form. Convert an existing JavaScript `Date` with `JulianDate.fromDate`.

## 8. Mutating secondsOfDay to offset a time

**Symptom:** Adding seconds to a `JulianDate` produces a date in the wrong day,
or a `secondsOfDay` value above 86400.

**Root cause:** Writing to `secondsOfDay` directly does not carry overflow into
`dayNumber`. The two fields are stored separately and only the static helpers
normalize them.

**Fix:** Use `JulianDate.addSeconds`, `addMinutes`, `addHours`, or `addDays`.
These return a normalized `JulianDate`.

## 9. clockRange CLAMPED when a loop is expected

**Symptom:** Playback reaches `stopTime` and freezes instead of restarting.

**Root cause:** `clockRange` defaults to `UNBOUNDED`, and `CLAMPED` halts at
the bound. Neither loops.

**Fix:** Set `viewer.clock.clockRange = Cesium.ClockRange.LOOP_STOP` for
repeating playback.

## 10. Shared JulianDate reference between clock fields

**Symptom:** After a few frames the clock behaves oddly; `startTime` appears to
drift forward.

**Root cause:** `Clock.tick` writes the advanced time into its `currentTime`
object. When the same `JulianDate` instance was assigned to both `startTime`
and `currentTime`, the tick mutates `startTime` as well.

**Fix:** Assign a `JulianDate.clone` of the start time to `currentTime`:
`viewer.clock.currentTime = Cesium.JulianDate.clone(start)`.

## 11. Expecting a fixed step from SYSTEM_CLOCK_MULTIPLIER

**Symptom:** A recorded or exported animation has uneven motion between frames.

**Root cause:** `clockStep` defaults to `SYSTEM_CLOCK_MULTIPLIER`, which scales
each step by real elapsed wall-clock time. Frame-rate variation makes each step
a different size.

**Fix:** For deterministic, frame-rate-independent playback use
`ClockStep.TICK_DEPENDENT`, which advances a fixed `multiplier` seconds per
tick.

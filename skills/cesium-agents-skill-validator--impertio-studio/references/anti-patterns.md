# Validation Anti-Patterns

Each entry lists symptom, root cause, prevention, and recovery. These are the
ways a validation pass itself fails, letting defective CesiumJS code through.

## 1. Pattern match without API-name verification

**Symptom:** Code passes the grep-based checks, is accepted, then throws
`TypeError: ... is not a function` at runtime.

**Root cause:** Checks 1 to 6 are pattern matches. They catch known-bad tokens
but cannot confirm that a plausible-looking name actually exists. A hallucinated
factory such as `Cesium3DTileset.fromGeoJsonAsync` matches the modern
async-factory shape and slips through.

**Prevention:** ALWAYS run Check 7. Every CesiumJS class, method, and enum value
must be confirmed against the API reference by WebFetch, not assumed from shape.

**Recovery:** Re-run Check 7 on every API name. Remove or correct any name that
does not resolve on `https://cesium.com/learn/cesiumjs/ref-doc/`.

## 2. Accepting code with an open BLOCKER

**Symptom:** Code with a known removed API is presented as done; it fails on
the user's 1.124+ target.

**Root cause:** A BLOCKER was found but treated as advisory, or the verdict
rule was not applied.

**Prevention:** Apply the verdict rule strictly. Any unresolved Check 1, 2, 3,
4, 6, or 7 failure means REJECT. NEVER report the code as complete.

**Recovery:** Return to the failed check, apply its fix skill, re-validate.

## 3. Skipping the ion-token check because the snippet is short

**Symptom:** A small snippet that uses an ion asset is accepted; the user runs
it and sees a blank globe with 401 errors.

**Root cause:** Check 3 was skipped because `Ion.defaultAccessToken` is often
set in a different file, so a short snippet looks fine in isolation.

**Prevention:** When the code uses any ion asset, Check 3 must confirm the token
is set somewhere in scope. If the snippet cannot show it, state the requirement
explicitly to the user.

**Recovery:** Add the token assignment, or tell the user it must exist before
this code runs.

## 4. Treating a WARN as a BLOCKER or the reverse

**Symptom:** Correct code is rejected over a missing `destroy()` in a one-shot
script; or leaky app code is accepted because teardown is "only a WARN".

**Root cause:** The WARN and BLOCKER levels were not applied with their intent.
Check 5 and 8 are WARN because they depend on context (script versus app).

**Prevention:** Use the level as defined. WARN items are stated to the user
with a recommendation; they do not block. BLOCKER items always block. Judge a
WARN in context: missing teardown in a long-lived app is worth raising
prominently even though it does not flip the verdict.

**Recovery:** Re-issue the verdict at the correct level with the context noted.

## 5. Validating only the snippet, not its assumptions

**Symptom:** The snippet is internally correct but fails because a precondition
(a constructed viewer, a loaded terrain provider, a set token) is absent.

**Root cause:** Validation looked only at the lines given and not at what they
depend on.

**Prevention:** For each snippet, list its preconditions (a `viewer` in scope,
`Ion.defaultAccessToken` set, terrain loaded before sampling) and confirm or
state each.

**Recovery:** State the unmet preconditions to the user as required setup.

## 6. Not re-validating after a fix

**Symptom:** A fix for one BLOCKER introduces another, and the new defect ships.

**Root cause:** The checklist was run once, fixes were applied, and the result
was not run through the checklist again.

**Prevention:** After ANY fix, re-run the full checklist from Check 1. A fix is
not done until a clean pass confirms it.

**Recovery:** Run the complete checklist again on the corrected code.

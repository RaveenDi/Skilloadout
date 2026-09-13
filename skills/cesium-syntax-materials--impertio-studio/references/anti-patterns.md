# Materials and Shaders Anti-Patterns

Each entry is a real failure mode. Format: symptom, root cause, fix. Verified
against the CesiumJS API reference for 1.124+.

## 1. Material Applied to a Model

**Symptom:** A `Material` is set on a `Model` and nothing changes.

**Root cause:** `Model` does not accept a `Material`. `Material` styles
Primitive appearances and the `Globe`. A `Model` is styled with a
`CustomShader`.

**Fix:** Use a `CustomShader` for a `Model` or a `Cesium3DTileset`.

```js
// WRONG
model.material = Cesium.Material.fromType("Color");

// RIGHT
model.customShader = new Cesium.CustomShader({
  fragmentShaderText: `
    void fragmentMain(FragmentInput fsInput, inout czm_modelMaterial material) {
      material.diffuse = vec3(1.0, 0.0, 0.0);
    }
  `,
});
```

## 2. CustomShader Applied to a Primitive

**Symptom:** A `CustomShader` is created for a `Primitive` and has no effect.

**Root cause:** `CustomShader` targets `Model` and `Cesium3DTileset` only. A
`Primitive` is styled through its `appearance.material`.

**Fix:** Build a `Material` and attach it through a `MaterialAppearance`.

## 3. Material Used for an Entity Graphics Object

**Symptom:** `Material.fromType` assigned to `entity.polygon.material` throws
or renders wrong.

**Root cause:** An `Entity` graphics object expects a `MaterialProperty`, not
a `Material`. The two type families are distinct.

**Fix:** Use a `MaterialProperty` such as `ColorMaterialProperty` or
`GridMaterialProperty`. See `cesium-syntax-entity`.

```js
// RIGHT, for an entity
entity.polygon.material = new Cesium.ColorMaterialProperty(
  Cesium.Color.RED.withAlpha(0.5),
);
```

## 4. WebGL1 GLSL Keywords

**Symptom:** A shader fails to compile with an error about `texture2D`,
`varying`, or `attribute`.

**Root cause:** CesiumJS 1.124+ compiles GLSL ES 3.00 on WebGL2. The WebGL1
keywords are not valid.

**Fix:** Use `texture()` instead of `texture2D()`, `in` and `out` instead of
`varying` and `attribute`.

## 5. CustomShader Without the Required Function

**Symptom:** A `CustomShader` fails to compile.

**Root cause:** `fragmentShaderText` did not define a `fragmentMain` function,
or `vertexShaderText` did not define `vertexMain`. The runtime calls those
named functions.

**Fix:** Define the exact function the shader stage requires.

```glsl
void fragmentMain(FragmentInput fsInput, inout czm_modelMaterial material) {
  material.diffuse = vec3(0.0, 1.0, 0.0);
}
```

## 6. Post-Process Stage Not Added

**Symptom:** A `PostProcessStage` is constructed but the screen never
changes.

**Root cause:** The stage was created but never added to
`scene.postProcessStages`. A bare `PostProcessStage` does not run.

**Fix:** Call `viewer.scene.postProcessStages.add(stage)`.

## 7. Writing to gl_FragColor in a Post-Process Shader

**Symptom:** A post-process stage runs but produces a black or unchanged
frame.

**Root cause:** The fragment shader wrote to `gl_FragColor`. CesiumJS GLSL ES
3.00 stages output through `out_FragColor`.

**Fix:** Write the result to `out_FragColor`.

## 8. Redeclaring the Injected Post-Process Uniforms

**Symptom:** A post-process shader fails to compile with a redefinition
error.

**Root cause:** The shader redeclared `colorTexture`, `depthTexture`, or
`v_textureCoordinates`. The runtime injects all three.

**Fix:** Use the injected names directly. Declare only custom uniforms passed
through the `uniforms` option.

## 9. Reused Fabric Type String

**Symptom:** Two materials built with the same `fabric.type` string render
identically, ignoring different uniforms.

**Root cause:** CesiumJS caches a Fabric material shader by its `type` name.
The second material reuses the first compiled shader.

**Fix:** Give every distinct Fabric material a unique `type` string, or omit
`type` for an auto-generated unique name.

## 10. Wrong Translucent Flag

**Symptom:** A semi-transparent material shows depth-sort artifacts, or an
opaque material renders with edge halos.

**Root cause:** The appearance `translucent` flag does not match the material
alpha. The renderer sorts and blends based on that flag.

**Fix:** Set `translucent: true` on the appearance for a material with alpha
below `1.0`, and `false` for a fully opaque material.

## 11. Post-Process Stages Not Released

**Symptom:** Memory climbs as post-process stages are swapped in and out.

**Root cause:** A stage was dropped without removal. WebGL resources are not
garbage-collected.

**Fix:** Remove a stage with `scene.postProcessStages.remove(stage)` or clear
all with `removeAll()`; both destroy the stage resources. Disable the
built-in `fxaa`, `bloom`, and `ambientOcclusion` stages with `enabled = false`
instead of removing them.

## 12. Strict Material With an Unused Uniform

**Symptom:** A `Material` constructed with `strict: true` throws on creation.

**Root cause:** `strict` mode rejects a uniform declared in the Fabric but
not referenced in the GLSL.

**Fix:** Remove the unused uniform from the Fabric, reference it in the GLSL,
or drop `strict: true` once the Fabric is finalized.

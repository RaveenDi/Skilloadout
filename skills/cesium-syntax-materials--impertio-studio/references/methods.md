# Materials and Shaders API Reference

Verified against the CesiumJS API reference (cesium.com/learn/cesiumjs/ref-doc)
for CesiumJS 1.124+. CesiumJS renders on WebGL2 and compiles GLSL ES 3.00.

## Material

### Constructor

`new Cesium.Material(options)`

| Option | Type | Default | Purpose |
|--------|------|---------|---------|
| `fabric` | object | required | The Fabric JSON that generates the material |
| `strict` | boolean | `false` | Throw on an unused or duplicate uniform |
| `translucent` | boolean \| function | `true` | Whether the geometry is expected to be translucent |
| `minificationFilter` | `TextureMinificationFilter` | `LINEAR` | Texture minification |
| `magnificationFilter` | `TextureMagnificationFilter` | `LINEAR` | Texture magnification |

### Static Factory

`Material.fromType(type, uniforms)` returns a `Material`. `type` is a built-in
type string; `uniforms` overrides the default uniform values.

### Instance Properties

| Property | Type | Purpose |
|----------|------|---------|
| `type` | string | The material type name |
| `uniforms` | object | Maps uniform names to current values |
| `translucent` | boolean \| function | Translucency expectation |
| `shaderSource` | string | The generated GLSL source |
| `materials` | object | Sub-material mappings for composite Fabric |

### Built-In Type Constants and Uniforms

| Constant | Type string | Uniforms |
|----------|-------------|----------|
| `Material.ColorType` | `Color` | `color` |
| `Material.ImageType` | `Image` | `image`, `repeat` |
| `Material.DiffuseMapType` | `DiffuseMap` | `image`, `channels`, `repeat` |
| `Material.AlphaMapType` | `AlphaMap` | `image`, `channel`, `repeat` |
| `Material.SpecularMapType` | `SpecularMap` | `image`, `channel`, `repeat` |
| `Material.EmissionMapType` | `EmissionMap` | `image`, `channels`, `repeat` |
| `Material.BumpMapType` | `BumpMap` | `image`, `channel`, `strength`, `repeat` |
| `Material.NormalMapType` | `NormalMap` | `image`, `channels`, `strength`, `repeat` |
| `Material.GridType` | `Grid` | `color`, `cellAlpha`, `lineCount`, `lineThickness`, `lineOffset` |
| `Material.StripeType` | `Stripe` | `horizontal`, `evenColor`, `oddColor`, `offset`, `repeat` |
| `Material.CheckerboardType` | `Checkerboard` | `lightColor`, `darkColor`, `repeat` |
| `Material.DotType` | `Dot` | `lightColor`, `darkColor`, `repeat` |
| `Material.WaterType` | `Water` | `baseWaterColor`, `blendColor`, `specularMap`, `normalMap`, `frequency`, `animationSpeed`, `amplitude`, `specularIntensity` |
| `Material.RimLightingType` | `RimLighting` | `color`, `rimColor`, `width` |
| `Material.FadeType` | `Fade` | `fadeInColor`, `fadeOutColor`, `maximumDistance`, `repeat`, `fadeDirection`, `time` |
| `Material.PolylineArrowType` | `PolylineArrow` | `color` |
| `Material.PolylineDashType` | `PolylineDash` | `color`, `gapColor`, `dashLength`, `dashPattern` |
| `Material.PolylineGlowType` | `PolylineGlow` | `color`, `glowPower`, `taperPower` |
| `Material.PolylineOutlineType` | `PolylineOutline` | `color`, `outlineColor`, `outlineWidth` |
| `Material.ElevationContourType` | `ElevationContour` | `color`, `spacing`, `width` |
| `Material.ElevationRampType` | `ElevationRamp` | `image`, `minimumHeight`, `maximumHeight` |
| `Material.SlopeRampMaterialType` | `SlopeRamp` | `image` |
| `Material.AspectRampMaterialType` | `AspectRamp` | `image` |

### Fabric JSON Shape

```js
{
  type: "UniqueTypeName",
  uniforms: { /* name: value */ },
  components: { diffuse, specular, shininess, normal, emission, alpha },
  // or a full GLSL block:
  source: "czm_material czm_getMaterial(czm_materialInput materialInput) { ... }"
}
```

`components` is the simple path; `source` is the full-control path. The GLSL
input is `czm_materialInput` with fields such as `materialInput.st` (texture
coordinates) and `materialInput.normalEC`.

## CustomShader

### Constructor

`new Cesium.CustomShader(options)`

| Option | Type | Default | Purpose |
|--------|------|---------|---------|
| `mode` | `CustomShaderMode` | `MODIFY_MATERIAL` | How the GLSL is inserted |
| `lightingModel` | `LightingModel` | undefined | Overrides the model lighting |
| `translucencyMode` | `CustomShaderTranslucencyMode` | `INHERIT` | Transparency handling |
| `uniforms` | object | undefined | User uniform declarations |
| `varyings` | object | undefined | Vertex-to-fragment varyings |
| `vertexShaderText` | string | undefined | GLSL defining `vertexMain` |
| `fragmentShaderText` | string | undefined | GLSL defining `fragmentMain` |

### Enums

- `CustomShaderMode` : `MODIFY_MATERIAL`, `REPLACE_MATERIAL`
- `LightingModel` : `UNLIT`, `PBR`
- `CustomShaderTranslucencyMode` : `OPAQUE`, `TRANSLUCENT`, `INHERIT`
- `UniformType` : scalar, vector (`VEC2`, `VEC3`, `VEC4`), matrix (`MAT2`,
  `MAT3`, `MAT4`), `FLOAT`, `INT`, `BOOL`, `SAMPLER_2D`
- `VaryingType` : `FLOAT`, `VEC2`, `VEC3`, `VEC4`, matrix types

### Method

`setUniform(uniformName, value)` updates a declared uniform. `value` is a
boolean, number, `Cartesian2/3/4`, `Matrix2/3/4`, string, `Resource`, or
`TextureUniform`.

### Shader Function Contract

- `vertexShaderText` MUST define
  `void vertexMain(VertexInput vsInput, inout czm_modelVertexOutput vsOutput)`.
- `fragmentShaderText` MUST define
  `void fragmentMain(FragmentInput fsInput, inout czm_modelMaterial material)`.

`czm_modelMaterial` fields include `diffuse`, `specular`, `roughness`,
`metalness`, `occlusion`, `emissive`, `normalEC`, and `alpha`.

### Assignment

A `CustomShader` is assigned to `model.customShader` or
`tileset.customShader`, or passed as the `customShader` constructor option of
`Model.fromGltfAsync` or `Cesium3DTileset.fromUrl`.

## PostProcessStage

### Constructor

`new Cesium.PostProcessStage(options)`

| Option | Type | Default | Purpose |
|--------|------|---------|---------|
| `fragmentShader` | string | required | The full-screen fragment shader |
| `uniforms` | object | undefined | Custom uniform values, constant or function |
| `textureScale` | number | `1.0` | Output texture scale, range `(0.0, 1.0]` |
| `forcePowerOfTwo` | boolean | `false` | Force power-of-two texture dimensions |
| `sampleMode` | `PostProcessStageSampleMode` | `NEAREST` | Color texture sampling |
| `pixelFormat` | `PixelFormat` | `RGBA` | Output texture format |
| `pixelDatatype` | `PixelDatatype` | `UNSIGNED_BYTE` | Output texture data type |
| `clearColor` | `Color` | `BLACK` | Texture clear color |
| `name` | string | auto GUID | Unique stage identifier |

### Instance Properties

| Property | Type | Access | Purpose |
|----------|------|--------|---------|
| `enabled` | boolean | read / write | Whether the stage runs |
| `uniforms` | object | read / write | Live uniform values |
| `name` | string | read-only | Unique identifier |
| `ready` | boolean | read-only | Whether the stage is ready to run |

### Fragment Shader Contract

The runtime injects the `sampler2D` uniforms `colorTexture` and `depthTexture`
and the `vec2` varying `v_textureCoordinates`. The shader writes its result to
`out_FragColor`. NEVER redeclare the injected names; NEVER write to
`gl_FragColor`.

## PostProcessStageCollection

Accessed as `viewer.scene.postProcessStages`.

### Properties

| Property | Type | Purpose |
|----------|------|---------|
| `fxaa` | `PostProcessStage` | Fast approximate anti-aliasing stage |
| `ambientOcclusion` | `PostProcessStageComposite` | Horizon-based ambient occlusion |
| `bloom` | `PostProcessStageComposite` | Glow and brightness |
| `length` | number | Number of added stages |
| `exposure` | number | HDR tonemapping exposure, default `1.0` |
| `tonemapper` | `Tonemapper` | Tonemapping algorithm, default `PBR_NEUTRAL` |

### Methods

| Method | Signature | Purpose |
|--------|-----------|---------|
| `add` | `add(stage)` returns the stage | Add a stage to the collection |
| `remove` | `remove(stage)` returns `boolean` | Remove and destroy a stage |
| `removeAll` | `removeAll()` | Remove and destroy every added stage |
| `contains` | `contains(stage)` returns `boolean` | Test membership |
| `get` | `get(index)` returns the stage | Stage at an index |

## PostProcessStageLibrary

Static factories that build ready-made stages:

| Method | Returns |
|--------|---------|
| `createBlurStage()` | `PostProcessStageComposite` (Gaussian blur) |
| `createDepthOfFieldStage()` | `PostProcessStageComposite` |
| `createEdgeDetectionStage()` | `PostProcessStage` |
| `createSilhouetteStage(edgeDetectionStages)` | `PostProcessStageComposite` |
| `createBrightnessStage()` | `PostProcessStage` |
| `createNightVisionStage()` | `PostProcessStage` |
| `createBlackAndWhiteStage()` | `PostProcessStage` |

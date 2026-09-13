# Materials and Shaders Examples

Complete, runnable recipes for CesiumJS 1.124+. Every recipe assumes a
`viewer` created with `new Cesium.Viewer(container)`.

## Material From a Built-In Type

```js
const grid = Cesium.Material.fromType("Grid", {
  color: Cesium.Color.CYAN,
  cellAlpha: 0.1,
  lineCount: new Cesium.Cartesian2(8, 8),
  lineThickness: new Cesium.Cartesian2(2.0, 2.0),
});
```

`Material.fromType` returns a `Material` ready to attach to an appearance.
Any uniform left out of the second argument keeps its built-in default.

## Material On a Primitive

```js
const instance = new Cesium.GeometryInstance({
  geometry: new Cesium.RectangleGeometry({
    rectangle: Cesium.Rectangle.fromDegrees(4.7, 52.2, 5.1, 52.5),
    vertexFormat: Cesium.MaterialAppearance.MaterialSupport.TEXTURED.vertexFormat,
  }),
});

const primitive = new Cesium.Primitive({
  geometryInstances: instance,
  appearance: new Cesium.MaterialAppearance({
    material: Cesium.Material.fromType("Checkerboard", {
      lightColor: Cesium.Color.WHITE,
      darkColor: Cesium.Color.BLACK,
      repeat: new Cesium.Cartesian2(10, 10),
    }),
    materialSupport: Cesium.MaterialAppearance.MaterialSupport.TEXTURED,
  }),
});
viewer.scene.primitives.add(primitive);
```

The geometry `vertexFormat` MUST match the appearance, or the material has no
texture coordinates to sample.

## Material On the Globe

```js
viewer.scene.globe.material = Cesium.Material.fromType("SlopeRamp");

// Clear the globe material.
viewer.scene.globe.material = undefined;
```

Surface-shading materials such as `SlopeRamp`, `AspectRamp`, `ElevationRamp`,
and `ElevationContour` apply directly to `globe.material`.

## Custom Fabric Material

```js
const animatedStripe = new Cesium.Material({
  fabric: {
    type: "AnimatedStripe",
    uniforms: {
      lightColor: new Cesium.Color(1.0, 1.0, 1.0, 1.0),
      darkColor: new Cesium.Color(0.0, 0.3, 0.6, 1.0),
      offset: 0.0,
    },
    components: {
      diffuse:
        "mix(darkColor.rgb, lightColor.rgb, step(0.5, fract(materialInput.st.s * 10.0 + offset)))",
      alpha: "1.0",
    },
  },
});

// Animate by updating the uniform each frame.
viewer.scene.preUpdate.addEventListener(() => {
  animatedStripe.uniforms.offset += 0.01;
});
```

The `type` string is unique, so the material is not confused with a cached
one. Read and write live values through `material.uniforms`.

## CustomShader On a Model

```js
const customShader = new Cesium.CustomShader({
  lightingModel: Cesium.LightingModel.UNLIT,
  fragmentShaderText: `
    void fragmentMain(FragmentInput fsInput, inout czm_modelMaterial material) {
      // Tint the model by its position in model space.
      vec3 p = fsInput.attributes.positionMC;
      material.diffuse = vec3(0.5) + 0.5 * normalize(p);
    }
  `,
});

const model = await Cesium.Model.fromGltfAsync({
  url: "./models/aircraft.glb",
  customShader: customShader,
  modelMatrix: Cesium.Transforms.eastNorthUpToFixedFrame(
    Cesium.Cartesian3.fromDegrees(4.9, 52.37, 200.0),
  ),
});
viewer.scene.primitives.add(model);
```

## CustomShader On a 3D Tileset With a Uniform

```js
const customShader = new Cesium.CustomShader({
  uniforms: {
    u_brightness: { type: Cesium.UniformType.FLOAT, value: 1.0 },
  },
  fragmentShaderText: `
    void fragmentMain(FragmentInput fsInput, inout czm_modelMaterial material) {
      material.diffuse *= u_brightness;
    }
  `,
});

const tileset = await Cesium.Cesium3DTileset.fromUrl(url, {
  customShader: customShader,
});
viewer.scene.primitives.add(tileset);

// Change the uniform later.
customShader.setUniform("u_brightness", 1.6);
```

## Custom PostProcessStage

```js
const stage = viewer.scene.postProcessStages.add(
  new Cesium.PostProcessStage({
    uniforms: { u_amount: 0.6 },
    fragmentShader: `
      uniform float u_amount;
      void main() {
        vec4 color = texture(colorTexture, v_textureCoordinates);
        float gray = dot(color.rgb, vec3(0.299, 0.587, 0.114));
        out_FragColor = vec4(mix(color.rgb, vec3(gray), u_amount), color.a);
      }
    `,
  }),
);

// Toggle and update.
stage.enabled = true;
stage.uniforms.u_amount = 0.9;
```

`colorTexture` and `v_textureCoordinates` are injected; the custom uniform
`u_amount` is declared in the shader and supplied through `uniforms`.

## Built-In Post-Process Effects

```js
// Toggle the always-present built-in stages.
viewer.scene.postProcessStages.fxaa.enabled = true;
viewer.scene.postProcessStages.bloom.enabled = true;
viewer.scene.postProcessStages.ambientOcclusion.enabled = true;

// Add a library-built stage.
const blackAndWhite =
  Cesium.PostProcessStageLibrary.createBlackAndWhiteStage();
viewer.scene.postProcessStages.add(blackAndWhite);
```

## Removing Post-Process Stages

```js
// Remove and destroy one stage.
viewer.scene.postProcessStages.remove(stage);

// Remove and destroy every added stage.
viewer.scene.postProcessStages.removeAll();
```

`remove` and `removeAll` destroy the stage WebGL resources. The built-in
`fxaa`, `bloom`, and `ambientOcclusion` stages are not removed; disable them
with `enabled = false`.

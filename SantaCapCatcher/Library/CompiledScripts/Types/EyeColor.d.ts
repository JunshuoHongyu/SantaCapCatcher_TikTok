declare namespace APJS {
  /**
   * @description The scope of applying the eye color effect.
   * @enum
   */
  enum EyeApplyingScope {
    BothEyes,
    LeftEyeOnly,
    RightEyeOnly,
  }
  
  /**
   * @class EyeColor
   * @extends DynamicComponent
   * @description Runtime iris-color effect component.
   * `makeupTexture`, `color`, and `intensity` define the base tint result; `isOpacityEnabled` and
   * `isReflectionEnabled` independently gate the optional opacity and reflection passes.
   * {@link applyingScope} limits the mask to both eyes, only the left eye, or only the right eye.
   */
  class EyeColor extends DynamicComponent {
    protected constructor();
  
    /**
     * @description The scope to apply the eye color effect to, can be both eyes, left eye, or right eye.
     * @default EyeApplyingScope.BothEyes
     */
    applyingScope: EyeApplyingScope;
  
    /**
     * @description Base color of the eyes, used in combination with the makeup texture.
     * @default new Color(1, 1, 1, 1) // Opaque white
     */
    color: Color;
  
    /**
     * @description The intensity of the eye color effect. Higher values make the color effect more prominent. Range [0.0, 1.0]
     * @default 0.0
     */
    intensity: number;
  
    /**
     * @description Whether the optional opacity pass is enabled.
     * This flag only toggles the pass. The per-region opacity texture comes from
     * {@link opacityTexture} when that texture is non-null.
     * @default false
     */
    isOpacityEnabled: boolean;
  
    /**
     * @description Whether the optional eye-reflection pass is enabled.
     * The pass uses {@link reflectionTexture} and {@link reflectionIntensity} when enabled.
     * @default false
     */
    isReflectionEnabled: boolean;
  
    /**
     * @description Makeup texture used to define the eye color effect.
     * When `null`, the base color still comes from {@link color} and {@link intensity}, but no
     * extra makeup texture is provided to the material.
     * @default null
     */
    makeupTexture: Texture | null;
  
    /**
     * @description Opacity texture used to control transparency in different eye regions.
     * This texture is only consumed when {@link isOpacityEnabled} is `true`.
     * @default null
     */
    opacityTexture: Texture | null;
  
    /**
     * @description The intensity of the reflection effect. Range [0.0, 1.0]
     * This value only affects rendering when {@link isReflectionEnabled} is `true`.
     * @default 0.0
     */
    reflectionIntensity: number;
  
    /**
     * @description Reflection texture used to simulate eye shine effects.
     * This texture is only consumed when {@link isReflectionEnabled} is `true`.
     * @default null
     */
    reflectionTexture: Texture | null;
  }
}
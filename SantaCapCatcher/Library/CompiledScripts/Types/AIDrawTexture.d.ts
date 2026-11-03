declare namespace APJS {
  /**
   * @class AIDrawTextureProvider
   * @description Provider for AI-generated texture assets. Use it as the control object returned by `texture.getControl()` on an AI Draw texture resource.
   * Configure generation inputs such as `prompt`, style-related properties, and dynamic properties, then toggle `play` to submit or stop generation.
   * The resource has an internal input texture that defaults to `Final Render Output`. Bind the AI Image Texture resource itself as the output texture; call `getControl()` only to configure generation through `prompt` and `play`.
   *
   * @example
   * const provider = texture.getControl() as AIDrawTextureProvider;
   * provider.prompt = 'oil painting cat';
   * provider.play = true;
   */
  class AIDrawTextureProvider extends AIDrawAlgoScriptBase implements IDynamicAsset {
    /**
     * @description Starts or stops AI texture generation.
     * Set to `true` to submit or continue generation with the current prompt and configuration.
     * Set to `false` to stop generation requests for this provider.
     */
    set play(play: boolean);
  
    /**
     * @description Whether AI texture generation is currently enabled for this provider.
     * `true` means generation has been requested and the provider should keep running with the current configuration.
     */
    get play(): boolean;
  
    get prompt(): string;
  
    set prompt(value: string);
  
    constructor(tex: effect.Amaz.RenderTexture);
  }
}
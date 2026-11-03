declare namespace APJS {
  class FaceFusionTextureProvider extends FaceFusionAlgoScriptBase implements IDynamicAsset {
    get fusionTexture(): any;
  
    set fusionTexture(value: Texture | undefined);
  
    constructor(tex: effect.Amaz.ScreenRenderTexture);
  
    triggerMorph(): void;
  }
}
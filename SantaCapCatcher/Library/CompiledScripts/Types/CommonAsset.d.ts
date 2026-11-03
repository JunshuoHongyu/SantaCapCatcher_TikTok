declare namespace APJS {
  type CommonAssetGroupRequest = {
    groupKey: string;
    /**
     * Exact asset keys to request. This array's order is independent of the
     * order returned by {@link CommonAssetController.getAssetGroup}.
     * When `randomAssetCount` is also set, the combined result is de-duplicated:
     * these keys are not also returned as random picks.
     */
    explicitAssetKeys?: string[];
    /**
     * Number of random assets to request from the same group.
     * When `explicitAssetKeys` is also set, random picks exclude those keys.
     * If explicit keys plus this count exceed the group size, the load still
     * finishes and the server returns at most every asset in the group.
     */
    randomAssetCount?: number;
  };

  type CommonAssetControllerRequestInfo = {
    remoteAssetGroupInfos: CommonAssetGroupRequest[];
  };

  type CommonAssetItem = {
    groupKey: string;
    assetKey: string;
    /** Loaded texture for downloaded media assets. `null` for text-only assets. */
    texture: Texture | null;
    /**
     * JSON object string for this asset's metadata. `null` when the asset has no metadata.
     * Parse with `JSON.parse(textData)` after `onLoadFinished`.
     */
    textData: string | null;
  };

  /**
   * @class CommonAssetController
   * @description Loads predefined Common Asset groups. This API can only
   * preview on a TikTok phone: Effect House preview never returns these
   * assets (`onLoadFinished` still runs, then `getAsset` is `null` and
   * `getAssetGroup` is `undefined`). That is expected, not a catalog or
   * key failure. If you are an AI agent, prompt the user to preview on a
   * TikTok phone.
   * Call {@link loadAssets} exactly once from `onStart`. That call downloads
   * the requested assets and loads their textures and text data. The delay
   * until `onLoadFinished` depends on the requested asset count and size.
   * Repeat calls are ignored. Read assets only inside `onLoadFinished`.
   * Failures are not reported as thrown errors, error lists, or extra
   * callbacks. Inspect getter results only: `getAsset` returns `null` for a
   * missing or failed asset, and `getAssetGroup` returns `undefined` for a
   * missing, empty, or fully failed group. Callers should handle download
   * failures: a successful load can still omit individual assets. Partial
   * success is allowed. Combined explicit and random requests are
   * de-duplicated. If the request is larger than the group, the load still
   * finishes and the result contains at most the group's available assets.
   * @apjs_protected_constructor
   * @example
   * onStart() {
   *   CommonAssetController.loadAssets(
   *     {
   *       remoteAssetGroupInfos: [
   *         {
   *           groupKey: 'Countries',
   *           explicitAssetKeys: ['United Kingdom', 'United States'],
   *         },
   *         {
   *           groupKey: 'Food',
   *           explicitAssetKeys: ['Taco'],
   *           randomAssetCount: 3,
   *         },
   *       ],
   *     },
   *     () => {
   *       const foods = CommonAssetController.getAssetGroup('Food');
   *       const taco = CommonAssetController.getAsset('Food', 'Taco');
   *       const uk = CommonAssetController.getAsset('Countries', 'United Kingdom');
   *       const texture = uk !== null ? uk.texture : null;
   *       const meta = uk !== null && uk.textData !== null ? JSON.parse(uk.textData) : null;
   *       const ukName = meta !== null ? meta['name'] : null;
   *       const ukCapital = meta !== null ? meta['capital'] : null;
   *     }
   *   );
   * }
   */
  class CommonAssetController {
    private constructor();

    /**
     * @static
     * @description Call exactly once from `onStart`. Repeat calls are ignored and
     * do not invoke `onLoadFinished`. Downloads the requested remote assets, then
     * loads their textures and text data. The delay from this call to
     * `onLoadFinished` depends on the requested asset count and size.
     * `onLoadFinished` runs after the first call settles, including situations like
     * invalid input, network failure, timeout, partial success, and success.
     * Do not read assets before `onLoadFinished`. After invalid input the load is
     * still settled: getters return empty results and later `loadAssets` calls are ignored.
     * `remoteAssetGroupInfos` must be a non-empty array. Each group must request at
     * least one asset via unique non-empty `explicitAssetKeys`, a positive
     * `randomAssetCount`, or both. Combined explicit and random requests are
     * de-duplicated. If the requested count is larger than the group, the server
     * returns at most the group's available assets and `onLoadFinished` still runs.
     * @param {CommonAssetControllerRequestInfo} info - Remote asset groups to request.
     * @param {() => void} onLoadFinished - Called once after the first load settles.
     * @returns {void}
     */
    public static loadAssets(info: CommonAssetControllerRequestInfo, onLoadFinished: () => void): void;

    /**
     * @static
     * @description Returns a detached snapshot of assets that succeeded for a group.
     * Call only after `onLoadFinished`. Returns `undefined` when the group is
     * not found, empty, or every asset in it failed. This is `undefined`, not `null`.
     * The returned array order is independent of `explicitAssetKeys` and the
     * original request order. Look up items by `assetKey` (for example with
     * {@link getAsset}) instead of by index. There is no separate error result.
     * Treat `undefined` as failure for the group. The array may be shorter than
     * requested because the group is smaller than the request, some explicit
     * keys are missing, or some assets fail to download. Callers should handle
     * download failures.
     * @param {string} groupKey - Asset group to read.
     * @returns {CommonAssetItem[] | undefined}
     */
    public static getAssetGroup(groupKey: string): CommonAssetItem[] | undefined;

    /**
     * @static
     * @description Returns a detached snapshot of one asset that succeeded.
     * Call only after `onLoadFinished`. There is no separate error result.
     * Returns `null` when the asset is missing, failed to download, failed to
     * load, or is otherwise unavailable. Callers should handle `null`, including
     * download failures.
     * @param {string} groupKey - Asset group that contains the asset.
     * @param {string} assetKey - Asset to read.
     * @returns {CommonAssetItem | null}
     */
    public static getAsset(groupKey: string, assetKey: string): CommonAssetItem | null;
  }
}

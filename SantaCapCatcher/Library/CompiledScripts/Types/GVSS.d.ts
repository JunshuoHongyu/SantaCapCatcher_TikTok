declare namespace APJS {
  /**
   * @class EffectUsageInfo
   * @description Snapshot of the current effect's usage statistics.
   * Fields default to `0` until usage data becomes available.
   */
  export class EffectUsageInfo {
    constructor();
    /**
     * @description Total number of unique users who have used this effect.
     * Read-only statistic; assigning to it has no effect on the underlying data.
     * A non-negative integer, `0` until usage data is available.
     */
    public userCount: number;
    /**
     * @description Total number of posts published with this effect.
     * Read-only statistic; assigning to it has no effect on the underlying data.
     * A non-negative integer, `0` until usage data is available.
     */
    public postCount: number;
    /**
     * @description Total number of times the current user has used this effect (cumulative across days).
     * Read-only statistic; assigning to it has no effect on the underlying data.
     * A non-negative integer, `0` until usage data is available.
     */
    public userUsageCount: number;
    /**
     * @description Number of distinct calendar days on which the current user has used this effect.
     * Each day is counted at most once regardless of how many times it was used that day.
     * Read-only statistic; assigning to it has no effect on the underlying data.
     * A non-negative integer, `0` until usage data is available.
     */
    public userUsageDays: number;
    /**
     * @description Current consecutive-day usage streak for the current user, in days.
     * The streak counts back from the most recent usage day; a day with no usage breaks the streak
     * and resets the count. Read-only statistic; assigning to it has no effect on the underlying data.
     * A non-negative integer, `0` until usage data is available.
     */
    public userConsecutiveUsageDays: number;
  }

  /**
   * @class CloudDataManager
   * @description Manages schema-based cloud key-value data for user scripts.
   * The constructor schema defines which keys are persisted and their initial defaults.
   * Only `number` and `string` values are supported. Total saved data must stay within `1 KB`.
   *
   * @example
   * ```typescript
   * const cloudData = new CloudDataManager({ score: 0, level: 1, name: '' });
   *
   * cloudData.loadData((data) => {
   *   console.log(data.score, data.level, data.name);
   * });
   *
   * cloudData.saveData({ score: 42 });
   * ```
   */
  export class CloudDataManager {
    /**
     * Creates a new CloudDataManager with a defined data schema.
     * @param schema - Keys define the persisted fields and values provide the initial defaults.
     * Only schema keys participate in future save/load operations.
     */
    constructor(schema: {[key: string]: number | string});

    /**
     * @description Returns the latest effect usage statistics snapshot.
     * Values may still be `0` if the usage data has not finished loading yet.
     * @returns An {@link EffectUsageInfo} instance with the current usage counters.
     */
    public getEffectUsageInfo(): EffectUsageInfo;

    /**
     * @description Saves data for the keys declared in the constructor schema.
     * Extra keys in `data` are ignored. Schema keys omitted from `data` keep their most recently loaded
     * or saved value. The save fails if a provided value is not `number` or `string`, or if the serialized
     * payload exceeds `1 KB`.
     * @param data - Partial key-value data to save.
     * @param onSuccess - Optional callback invoked synchronously after the data has been validated
     * and written to the local cache. Cloud synchronization happens asynchronously afterwards and is
     * not signaled by this callback.
     * @param onFailure - Optional callback invoked with an error message when saving fails.
     */
    public saveData(
      data: {[key: string]: number | string},
      onSuccess?: () => void,
      onFailure?: (error: string) => void
    ): void;

    /**
     * @description Loads cloud data for the constructor schema.
     * The callback waits until data is available, then receives an object containing exactly the schema keys.
     * Stored values override the current cached values; keys with no stored value keep their current default or
     * last known value.
     * @param onSuccess - Called with the loaded schema-shaped data object.
     * @param onFailure - Optional callback invoked with an error message when loading fails.
     */
    public loadData(
      onSuccess: (data: {[key: string]: number | string}) => void,
      onFailure?: (error: string) => void
    ): void;
  }
}

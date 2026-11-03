declare namespace APJS {
  /**
   * @class AudioComponent
   * @extends DynamicComponent
   * @description Audio playback component for a scene object.
   * Use {@link play}, {@link pause}, {@link resume}, and {@link stop} to control playback.
   * The component tracks completion through {@link isFinished}; {@link duration} returns `0`
   * when no playable runtime audio instance is available yet.
   * @apjs_protected_constructor
   */
  class AudioComponent extends DynamicComponent {
    protected constructor();
    /**
     * @description Number of completed play passes before the component stops itself.
     * Default: `1`.
     */
    loopCount: number;
    /**
     * @description The volume level of the audio. Default is `100`.
     * Accepts integer or floating-point values in the range `[0, 100]`.
     * Values above `100` are clamped to `100`, and values below `0` are clamped to `0`.
     */
    volume: number;

    /**
     * @readonly
     * @description Gets the audio duration in seconds.
     * Returns `0` when no runtime audio player is available (e.g. design-time / before initialization).
     */
    get duration(): number;

    /**
     * @readonly
     * @description Whether playback has finished by reaching the configured loop count.
     * A manual {@link stop} does not set this flag; {@link play} clears it before restarting.
     */
    get isFinished(): boolean;
    /**
     * @description Pauses playback. Takes effect only when a runtime audio player is available,
     * and does not check the current playback state.
     */
    pause(): void;
  
    /**
     * @description Starts playback from the beginning, resetting the loop counter and clearing the
     * finished state. Calling it again restarts from the beginning. Requires a runtime audio player.
     */
    play(): void;
  
    /**
     * @description Resumes playback after a pause if the runtime audio player is available.
     */
    resume(): void;
  
    /**
     * @description Stops playback immediately.
     */
    stop(): void;
  }
  /**
   * @enum AudioDetectionType
   * @property Pitch Detect the pitch of the audio source in real time.
   * @property Beat Detect the rhythm pattern of a piece of music and output the beat in real time. All types of rhythm pattern will be quantified to 3/4 time or 4/4 time. The output value 1 represents the onset beat, which is usually the first beat of each measure. For example, music in 4/4 time will return 1, 2, 3, 4 in sequence, and music in 3/4 time will return 1, 2, 3 in sequence. Beats Detection is in the Audio category.
   * @property Onset Detect the onsets of notes in the musical audio in realtime based on a certain threshold.
   * @property Spectrum Divide the audio spectrum range (0 Hz to 22050 Hz) into 8 output bands, and detect the magnitude of each band in a range between 0 and 255.
   * @property Volume Detect the volume of the audio source in realtime.
   * @property SoundEvent Detect the sound events in the audio source in realtime.
   * @property Keyword Monitor an audio stream in real time and identify whether one or more specified keywords are present.
   */
  enum AudioDetectionType {
    Pitch = 0,
    Beat = 1,
    Onset = 2,
    Spectrum = 3,
    Volume = 4,
    SoundEvent = 5,
    Keyword = 6,
  }

  /**
   * @namespace AudioDetectionModule
   * @description The module for audio detection to get the builder for the specified audio detection type.
   */
  namespace AudioDetectionModule {
    /**
     * @description Gets a builder for the specified audio detection type. Call this in `onInit()`.
     * The returned builder is the concrete subclass for the requested type:
     * `Pitch` → `PitchDetectorBuilder`, `Beat` → `BeatDetectorBuilder`, `Onset` → `OnsetDetectorBuilder`,
     * `Spectrum` → `SpectrumDetectorBuilder`, `Volume` → `VolumeDetectorBuilder`,
     * `SoundEvent` → `SoundEventDetectorBuilder`, `Keyword` → `KeywordDetectorBuilder`.
     * @param type The audio detection type.
     * @returns The builder for the specified type, or `null` if `type` is not a valid {@link AudioDetectionType} value.
     * @example
     * onInit(): void {
     *    const audioDetectionBuilder = APJS.AudioDetectionModule.getOrCreateAudioDetectionBuilder(APJS.AudioDetectionType.SoundEvent);
     *    audioEventDetector = audioDetectionBuilder.build();
     * }
     */
    function getOrCreateAudioDetectionBuilder(type: AudioDetectionType): AudioDetectorBuilder<any> | null;
  }

  /**
   * @version UNKNOWN
   * @enum KeywordEventType
   * @description Keyword event type.
   */
  enum KeywordEventType {
      KeywordHit,
      KeywordMiss,
  }

  /**
   * @version UNKNOWN
   * @class KeywordDetector
   * @description Runtime detector that matches configured target keywords from the selected audio source.
   * It emits {@link KeywordEventType.KeywordHit} when one or more configured keywords are detected in the current
   * update, and {@link KeywordEventType.KeywordMiss} otherwise.
   * @apjs_protected_constructor
   * @example
   * onInit() {
   *   // 1. Get the KeywordDetectorBuilder
   *   const builder = APJS.AudioDetectionModule.getOrCreateAudioDetectionBuilder(APJS.AudioDetectionType.Keyword) as APJS.KeywordDetectorBuilder;
   * 
   *   // 2. Configure the builder (e.g., set keyword type, source type)
   *   // If using external file, you need an AudioComponent:
   *   // builder.setDetectorSource(APJS.AudioSourceType.ExternalFile, this.audioComponent);
   *   // Or for microphone (default):
   *   // builder.setDetectorSource(APJS.AudioSourceType.Microphone, null);
   * 
   *   // 3. Build the KeywordDetector
   *   this.keywordDetector = builder.build();
   * 
   *   // 4. Set target keywords
   *   if (this.keywordDetector) {
   *     this.keywordDetector.targetKeywords = ["hello", "world"];
   *     
   *     // 5. Listen to events
   *     this.keywordDetector.eventEmitter.on(APJS.KeywordEventType.KeywordHit, this.onKeywordHit);
   *     this.keywordDetector.eventEmitter.on(APJS.KeywordEventType.KeywordMiss, this.onKeywordMiss);
   *   }
   * }
   * 
   * onKeywordHit(event: APJS.IEvent) {
   *   const detectedWords = event.args[0] as string[];
   *   console.log("KeywordDetector", "Hit: " + detectedWords.join(", "));
   * }
   * 
   * onKeywordMiss(event: APJS.IEvent) {
   *   console.log("KeywordDetector", "Miss");
   * }
   * 
   * onDestroy() {
   *   if (this.keywordDetector) {
   *     this.keywordDetector.eventEmitter.off(APJS.KeywordEventType.KeywordHit, this.onKeywordHit);
   *     this.keywordDetector.eventEmitter.off(APJS.KeywordEventType.KeywordMiss, this.onKeywordMiss);
   *   }
   * }
   */
  class KeywordDetector implements IAudioDetector {
    /**
     * @description Whether the detector is enabled.
     * Default: `true`. When set to `false`, no keyword events are emitted.
     * The change takes effect on the next update.
     */
    enabled: boolean;
    
    /**
     * @description The keyword list monitored by this detector.
     * Assigning a new array replaces the previous list and applies immediately.
     * Keywords are used as provided; empty strings are ignored.
     * An empty array clears all targets, so no keyword can match.
     * @example
     * this.keywordDetector.targetKeywords = ["start", "stop"];
     */
    targetKeywords: string[];

    /**
     * @description Event emitter for keyword detection results.
     * While {@link enabled} is `true`, each update emits one event:
     * `KeywordHit` when one or more target keywords match, with the matched keywords in `event.args[0]` as `string[]`;
     * otherwise `KeywordMiss`, which carries no arguments.
     * @example
     * this.keywordDetector.eventEmitter.on(APJS.KeywordEventType.KeywordHit, (e) => {
     *   const words = e.args[0];
     *   console.log("Detected:", words);
     * });
     */
    readonly eventEmitter: IEventEmitter;
  }

  /**
   * @version UNKNOWN
   * @class KeywordDetectorBuilder
   * @description Builder for creating {@link KeywordDetector} instances.
   * Configure the detector source before calling {@link build}.
   * @apjs_protected_constructor
   * @example
   * const builder = APJS.AudioDetectionModule.getOrCreateAudioDetectionBuilder(APJS.AudioDetectionType.Keyword) as APJS.KeywordDetectorBuilder;
   * builder.setDetectorSource(APJS.AudioSourceType.Microphone, null);
   * const detector = builder.build();
   */
  class KeywordDetectorBuilder extends AudioDetectorBuilder<KeywordDetector> {
    /**
     * @description Builds a {@link KeywordDetector} using the builder's current source configuration.
     * Call this in `onInit()`. Returns `null` when keyword detection is unavailable or the configured source
     * cannot provide an extractor node. Each successful call returns a new detector instance; calling it
     * repeatedly does not reuse a previously built detector.
     * @returns {KeywordDetector | null}
     * @example
     * const detector = builder.build();
     */
    build(): KeywordDetector | null;
  }
}

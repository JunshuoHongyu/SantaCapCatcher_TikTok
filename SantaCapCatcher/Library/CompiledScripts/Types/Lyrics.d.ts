declare namespace APJS {
  /** Event types emitted by TikTokSoundInfo and TikTokSoundLyrics. */
  enum TikTokSoundEventType {
    /** Fired after changed runtime sound or lyric data has been committed. */
    DataUpdated,
  }

  /** Details for a TikTokSoundEventType.DataUpdated event. Available as `event.args[0]`. */
  interface TikTokSoundDataUpdate {
    /** Monotonically increases for each committed runtime data update. */
    revision: number;
    /** Current music identifier after the update. */
    musicId: string;
    /** Whether selected-sound metadata changed. */
    infoChanged: boolean;
    /** Whether the selected music identifier changed. */
    musicChanged: boolean;
    /** Whether the selected clip start or duration changed. */
    playbackWindowChanged: boolean;
    /** Whether parsed lyric lines or timings changed. */
    lyricsChanged: boolean;
    /** Whether previously available lyrics were cleared. */
    lyricsCleared: boolean;
    /** Whether parsed lyric lines are available after the update. */
    lyricsDataAvailable: boolean;
  }

  /** Metadata for the TikTok sound currently selected in Effect House. */
  interface TikTokSoundInfoOutput {
    /** Stable music identifier when supplied by the runtime. */
    musicId: string;
    /** Display title of the sound. */
    title: string;
    /** Artist, author, or singer name. */
    artist: string;
    /** Cover image URL. The consuming effect owns texture download and lifetime. */
    coverUrl: string;
    /** Selected clip start offset in seconds. */
    startTime: number;
    /** Selected sound duration in seconds. */
    duration: number;
    /** Monotonically increases whenever the current sound metadata changes. */
    revision: number;
  }

  /** Lyric state resolved for one selected-sound timestamp. */
  interface TikTokSoundLyricsOutput {
    /** Current lyric line, or an empty string outside an active line. */
    lyric: string;
    /** Zero-based lyric line index, or `-1` outside an active line. */
    index: number;
    /** Current line progress in `[0, 1]`. */
    progress: number;
    /** Current timed word for KRC lyrics, otherwise an empty string. */
    word: string;
    /** Zero-based word index in the current line, or `-1`. */
    wordIndex: number;
    /** Current word progress in `[0, 1]`, or `-1` when no timed word is active. */
    wordProgress: number;
    /** Whether the selected lyrics contain word-level timing data. */
    wordDataAvailable: boolean;
    /** Whether the selected sound currently has parsed lyric lines. */
    lyricsDataAvailable: boolean;
    /** Monotonically increases whenever parsed lyric lines or timings change. */
    revision: number;
  }

  /**
   * @class TikTokSoundInfo
   * @description Reads metadata for the TikTok sound selected in Effect House.
   * Create one instance per owning script and call {@link destroy} from `onDestroy()`.
   */
  class TikTokSoundInfo {
    constructor();
    /** Emits DataUpdated when runtime sound or lyric data changes. */
    readonly eventEmitter: IEventEmitter;
    /** Returns a snapshot of current sound metadata. */
    getInfo(): TikTokSoundInfoOutput;
    /** Releases the instance's runtime event subscription. Safe to call more than once. */
    destroy(): void;
  }

  /**
   * @class TikTokSoundLyrics
   * @description Resolves current line and word timing for the TikTok sound selected in Effect House.
   * The timestamp starts at `0` for the beginning of the selected sound clip.
   * Create one instance per owning script and call {@link destroy} from `onDestroy()`.
   * @example
   * private lyrics!: APJS.TikTokSoundLyrics;
   * private elapsed = 0;
   * private currentLyric = "";
   * private readonly onSoundDataUpdated = (event: APJS.IEvent): void => {
   *   const update = event.args[0] as APJS.TikTokSoundDataUpdate;
   *   if (update.musicChanged || update.playbackWindowChanged) this.elapsed = 0;
   * };
   * onStart(): void {
   *   this.lyrics = new APJS.TikTokSoundLyrics();
   *   this.lyrics.eventEmitter.on(APJS.TikTokSoundEventType.DataUpdated, this.onSoundDataUpdated, this);
   * }
   * onUpdate(deltaTime: number): void {
   *   this.elapsed += deltaTime;
   *   this.currentLyric = this.lyrics.tick(this.elapsed).lyric;
   * }
   * onDestroy(): void {
   *   this.lyrics.eventEmitter.off(APJS.TikTokSoundEventType.DataUpdated, this.onSoundDataUpdated, this);
   *   this.lyrics.destroy();
   * }
   */
  class TikTokSoundLyrics {
    constructor();
    /** Emits DataUpdated when runtime sound or lyric data changes. */
    readonly eventEmitter: IEventEmitter;
    /** Returns lyric state for a timestamp measured in seconds from the selected clip start. */
    tick(timestampSeconds: number): TikTokSoundLyricsOutput;
    /** Releases the instance's runtime event subscription. Safe to call more than once. */
    destroy(): void;
  }
}

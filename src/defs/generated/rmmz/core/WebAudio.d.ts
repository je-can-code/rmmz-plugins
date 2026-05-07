/**
 * Generated from project/js/rmmz_core.js
 * Class: WebAudio
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface WebAudio
{
  /**
   * Instance fields inferred from `this._*` assignments across vanilla engine sources.
   */
  _buffers: unknown[];
  _context: null | AudioContext;
  _data: null | Uint8Array;
  _decoder: null | VorbisDecoder;
  _endTimer: null;
  _fetchedData: unknown[];
  _fetchedSize: number;
  _gainNode: null;
  _isError: boolean;
  _isLoaded: boolean;
  _isPlaying: boolean;
  _lastUpdateTime: number;
  _loadListeners: unknown[];
  _loop: number;
  _loopLength: number;
  _loopLengthTime: number;
  _loopStart: number;
  _loopStartTime: number;
  _masterGainNode: null;
  _masterVolume: number;
  _pan: number;
  _pannerNode: null;
  _pitch: number;
  _sampleRate: number;
  _sourceNodes: unknown[];
  _startTime: number;
  _stopListeners: unknown[];
  _totalTime: number;
  _url: unknown;
  _volume: number;
  _concatenateFetchedData(): void;
  _createAllSourceNodes(): void;
  /**
   * Tries to load the audio again.
   */
  _createDecoder(): void;
  _createEndTimer(): void;
  _createGainNode(): void;
  _createPannerNode(): void;
  _createSourceNode(index: number): void;
  _decodeAudioData(arrayBuffer: ArrayBuffer): void;
  _destroyDecoder(): void;
  _onDecode(buffer: AudioBuffer): void;
  _onError(): void;
  _onFetch(response: Response): void;
  _onFetchProcess(value: Uint8Array): void;
  _onLoad(): void;
  _onXhrLoad(xhr: XMLHttpRequest): void;
  _readFourCharacters(view: DataView, index: number): string;
  _readLoopComments(arrayBuffer: ArrayBuffer): void;
  _readMetaData(view: DataView, index: number, size: number): void;
  _readableBuffer(): ArrayBuffer;
  _realUrl(): string;
  _refreshSourceNode(): void;
  _removeEndTimer(): void;
  _removeNodes(): void;
  /**
   * Tries to load the audio again.
   */
  _shouldUseDecoder(): boolean;
  _startAllSourceNodes(): void;
  _startFetching(url: string): void;
  /**
   * Tries to load the audio again.
   */
  _startLoading(): void;
  _startPlaying(offset: number): void;
  _startSourceNode(index: number): void;
  _startXhrLoading(url: string): void;
  _stopSourceNode(): void;
  _updateBuffer(): void;
  _updateBufferOnFetch(): void;
  _updatePanner(): void;
  /**
   * Adds a callback function that will be called when the audio data is loaded.
   * @param listner The callback function.
   */
  addLoadListener(listner: () => void): void;
  /**
   * Adds a callback function that will be called when the playback is stopped.
   * @param listner The callback function.
   */
  addStopListener(listner: () => void): void;
  /**
   * Clears the audio data.
   */
  clear(): void;
  /**
   * Destroys the audio.
   */
  destroy(): void;
  /**
   * Performs the audio fade-in.
   * @param duration Fade-in time in seconds.
   */
  fadeIn(duration: number): void;
  /**
   * Performs the audio fade-out.
   * @param duration Fade-out time in seconds.
   */
  fadeOut(duration: number): void;
  /**
   * The audio object of Web Audio API.
   * @param url The url of the audio file.
   */
  initialize(url: string): void;
  /**
   * Checks whether a loading error has occurred.
   */
  isError(): boolean;
  /**
   * Checks whether the audio is playing.
   */
  isPlaying(): boolean;
  /**
   * Checks whether the audio data is ready to play.
   */
  isReady(): boolean;
  /**
   * Plays the audio.
   * @param loop Whether the audio data play in a loop.
   * @param offset The start position to play in seconds.
   */
  play(loop: boolean, offset: number): void;
  /**
   * Tries to load the audio again.
   */
  retry(): void;
  /**
   * Gets the seek position of the audio.
   */
  seek(): unknown;
  /**
   * Stops the audio.
   */
  stop(): void;
}
declare namespace WebAudio
{
  /**
   * Sets the master volume for all audio.
   */
  function _createContext(): void;
  /**
   * Sets the master volume for all audio.
   */
  function _createMasterGainNode(): void;
  /**
   * Sets the master volume for all audio.
   */
  function _currentTime(): number;
  function _fadeIn(duration: number): void;
  function _fadeOut(duration: number): void;
  function _onHide(): void;
  function _onShow(): void;
  function _onUserGesture(): void;
  function _onVisibilityChange(): void;
  function _resetVolume(): void;
  /**
   * Sets the master volume for all audio.
   */
  function _setupEventHandlers(): void;
  function _shouldMuteOnHide(): boolean;
  /**
   * Initializes the audio system.
   */
  function initialize(): boolean;
  /**
   * Sets the master volume for all audio.
   * @param value The master volume (0 to 1).
   */
  function setMasterVolume(value: number): void;
}

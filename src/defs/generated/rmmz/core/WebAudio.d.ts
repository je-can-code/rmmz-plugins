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
   * Inferred engine backing field.
   *
   * Type: `unknown[]`.
   * Initialized in: none.
   * Written in: {@link WebAudio#_onDecode}, {@link WebAudio#clear}.
   * Read in: {@link WebAudio#_createAllSourceNodes}, {@link WebAudio#_createSourceNode}, {@link WebAudio#_onDecode}, {@link WebAudio#_refreshSourceNode}, {@link WebAudio#_startSourceNode}, {@link WebAudio#isReady}.
   *
   * Consumed by:
   * - `.length`: {@link WebAudio#_createAllSourceNodes}, {@link WebAudio#_refreshSourceNode}, {@link WebAudio#isReady}.
   * - `push()`: {@link WebAudio#_onDecode}.
   */
  _buffers: unknown[];
  /**
   * Inferred engine backing field.
   *
   * Type: `null | AudioContext`.
   * Initialized in: {@link WebAudio#initialize}.
   * Written in: {@link WebAudio#_createContext}, {@link WebAudio#initialize}.
   * Read in: {@link WebAudio#_createMasterGainNode}, {@link WebAudio#_currentTime}, {@link WebAudio#_onUserGesture}, {@link WebAudio#initialize}.
   */
  _context: null | AudioContext;
  /**
   * Inferred engine backing field.
   *
   * Type: `null | Uint8Array`.
   * Initialized in: none.
   * Written in: {@link WebAudio#_concatenateFetchedData}, {@link WebAudio#_onError}, {@link WebAudio#_onFetch}, {@link WebAudio#_onXhrLoad}, {@link WebAudio#clear}.
   * Read in: {@link WebAudio#_concatenateFetchedData}, {@link WebAudio#_readableBuffer}, {@link WebAudio#_updateBufferOnFetch}.
   */
  _data: null | Uint8Array;
  /**
   * Inferred engine backing field.
   *
   * Type: `null | VorbisDecoder`.
   * Initialized in: none.
   * Written in: {@link WebAudio#_createDecoder}, {@link WebAudio#_destroyDecoder}, {@link WebAudio#clear}.
   * Read in: {@link WebAudio#_decodeAudioData}, {@link WebAudio#_destroyDecoder}.
   */
  _decoder: null | VorbisDecoder;
  /**
   * Inferred engine backing field.
   *
   * Type: `null`.
   * Initialized in: none.
   * Written in: {@link WebAudio#_createEndTimer}, {@link WebAudio#_removeEndTimer}, {@link WebAudio#clear}.
   * Read in: {@link WebAudio#_removeEndTimer}.
   */
  _endTimer: null;
  /**
   * Inferred engine backing field.
   *
   * Type: `unknown[]`.
   * Initialized in: none.
   * Written in: {@link WebAudio#_concatenateFetchedData}, {@link WebAudio#clear}.
   * Read in: {@link WebAudio#_concatenateFetchedData}, {@link WebAudio#_onFetchProcess}.
   *
   * Consumed by:
   * - `push()`: {@link WebAudio#_onFetchProcess}.
   */
  _fetchedData: unknown[];
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: none.
   * Written in: {@link WebAudio#_concatenateFetchedData}, {@link WebAudio#_onFetchProcess}, {@link WebAudio#clear}.
   * Read in: {@link WebAudio#_concatenateFetchedData}, {@link WebAudio#_onFetch}, {@link WebAudio#_updateBufferOnFetch}.
   */
  _fetchedSize: number;
  /**
   * Inferred engine backing field.
   *
   * Type: `null`.
   * Initialized in: none.
   * Written in: {@link WebAudio#_createGainNode}, {@link WebAudio#_removeNodes}, {@link WebAudio#clear}.
   * Read in: {@link WebAudio#_createGainNode}, {@link WebAudio#_createSourceNode}, {@link WebAudio#fadeIn}, {@link WebAudio#fadeOut}.
   */
  _gainNode: null;
  /**
   * Inferred engine backing field.
   *
   * Type: `boolean`.
   * Initialized in: none.
   * Written in: {@link WebAudio#_onError}, {@link WebAudio#_startLoading}, {@link WebAudio#clear}.
   * Read in: {@link WebAudio#isError}.
   */
  _isError: boolean;
  /**
   * Inferred engine backing field.
   *
   * Type: `boolean`.
   * Initialized in: none.
   * Written in: {@link WebAudio#_onFetch}, {@link WebAudio#_onXhrLoad}, {@link WebAudio#_startLoading}, {@link WebAudio#clear}.
   * Read in: {@link WebAudio#_createSourceNode}, {@link WebAudio#_decodeAudioData}.
   */
  _isLoaded: boolean;
  /**
   * Inferred engine backing field.
   *
   * Type: `boolean`.
   * Initialized in: none.
   * Written in: {@link WebAudio#clear}, {@link WebAudio#fadeOut}, {@link WebAudio#play}, {@link WebAudio#stop}.
   * Read in: {@link WebAudio#_refreshSourceNode}, {@link WebAudio#isPlaying}, {@link WebAudio#retry}.
   */
  _isPlaying: boolean;
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: none.
   * Written in: {@link WebAudio#_startLoading}, {@link WebAudio#_updateBufferOnFetch}, {@link WebAudio#clear}.
   * Read in: {@link WebAudio#_updateBufferOnFetch}.
   */
  _lastUpdateTime: number;
  /**
   * Inferred engine backing field.
   *
   * Type: `unknown[]`.
   * Initialized in: none.
   * Written in: {@link WebAudio#clear}, {@link WebAudio#fadeOut}, {@link WebAudio#stop}.
   * Read in: {@link WebAudio#_onLoad}, {@link WebAudio#addLoadListener}.
   *
   * Consumed by:
   * - `.length`: {@link WebAudio#_onLoad}.
   * - `push()`: {@link WebAudio#addLoadListener}.
   * - `shift()`: {@link WebAudio#_onLoad}.
   */
  _loadListeners: unknown[];
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: none.
   * Written in: {@link WebAudio#clear}, {@link WebAudio#play}.
   * Read in: {@link WebAudio#_createEndTimer}, {@link WebAudio#_createSourceNode}, {@link WebAudio#_startSourceNode}, {@link WebAudio#retry}.
   */
  _loop: number;
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: none.
   * Written in: {@link WebAudio#_readMetaData}, {@link WebAudio#clear}.
   * Read in: {@link WebAudio#_onDecode}.
   */
  _loopLength: number;
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: none.
   * Written in: {@link WebAudio#_onDecode}, {@link WebAudio#clear}.
   * Read in: {@link WebAudio#_createSourceNode}, {@link WebAudio#_startPlaying}, {@link WebAudio#_startSourceNode}, {@link WebAudio#seek}.
   */
  _loopLengthTime: number;
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: none.
   * Written in: {@link WebAudio#_readMetaData}, {@link WebAudio#clear}.
   * Read in: {@link WebAudio#_onDecode}.
   */
  _loopStart: number;
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: none.
   * Written in: {@link WebAudio#_onDecode}, {@link WebAudio#clear}.
   * Read in: {@link WebAudio#_createSourceNode}, {@link WebAudio#_startPlaying}, {@link WebAudio#_startSourceNode}, {@link WebAudio#seek}.
   */
  _loopStartTime: number;
  /**
   * Inferred engine backing field.
   *
   * Type: `null`.
   * Initialized in: {@link WebAudio#initialize}.
   * Written in: {@link WebAudio#_createMasterGainNode}, {@link WebAudio#initialize}.
   * Read in: {@link WebAudio#_createMasterGainNode}, {@link WebAudio#_fadeIn}, {@link WebAudio#_fadeOut}, {@link WebAudio#_resetVolume}.
   */
  _masterGainNode: null;
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: {@link WebAudio#initialize}.
   * Written in: {@link WebAudio#initialize}, {@link WebAudio#setMasterVolume}.
   * Read in: {@link WebAudio#_fadeIn}, {@link WebAudio#_fadeOut}, {@link WebAudio#_resetVolume}.
   */
  _masterVolume: number;
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: none.
   * Written in: {@link WebAudio#clear}.
   * Read in: {@link WebAudio#_updatePanner}.
   */
  _pan: number;
  /**
   * Inferred engine backing field.
   *
   * Type: `null`.
   * Initialized in: none.
   * Written in: {@link WebAudio#_createPannerNode}, {@link WebAudio#_removeNodes}, {@link WebAudio#clear}.
   * Read in: {@link WebAudio#_createGainNode}, {@link WebAudio#_createPannerNode}, {@link WebAudio#_updatePanner}.
   */
  _pannerNode: null;
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: none.
   * Written in: {@link WebAudio#clear}.
   * Read in: {@link WebAudio#_createEndTimer}, {@link WebAudio#_createSourceNode}, {@link WebAudio#_startPlaying}, {@link WebAudio#_startSourceNode}, {@link WebAudio#seek}.
   */
  _pitch: number;
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: none.
   * Written in: {@link WebAudio#_readLoopComments}, {@link WebAudio#clear}.
   * Read in: {@link WebAudio#_onDecode}.
   */
  _sampleRate: number;
  /**
   * Inferred engine backing field.
   *
   * Type: `unknown[]`.
   * Initialized in: none.
   * Written in: {@link WebAudio#_removeNodes}, {@link WebAudio#clear}.
   * Read in: {@link WebAudio#_createEndTimer}, {@link WebAudio#_createSourceNode}, {@link WebAudio#_onDecode}, {@link WebAudio#_onError}, {@link WebAudio#_removeNodes}, {@link WebAudio#_startAllSourceNodes}, {@link WebAudio#_startSourceNode}, {@link WebAudio#_stopSourceNode}.
   *
   * Consumed by:
   * - `.length`: {@link WebAudio#_createEndTimer}, {@link WebAudio#_onDecode}, {@link WebAudio#_onError}, {@link WebAudio#_removeNodes}, {@link WebAudio#_startAllSourceNodes}.
   */
  _sourceNodes: unknown[];
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: none.
   * Written in: {@link WebAudio#_startPlaying}, {@link WebAudio#clear}.
   * Read in: {@link WebAudio#_createEndTimer}, {@link WebAudio#seek}.
   */
  _startTime: number;
  /**
   * Inferred engine backing field.
   *
   * Type: `unknown[]`.
   * Initialized in: none.
   * Written in: {@link WebAudio#clear}.
   * Read in: {@link WebAudio#addStopListener}, {@link WebAudio#stop}.
   *
   * Consumed by:
   * - `.length`: {@link WebAudio#stop}.
   * - `push()`: {@link WebAudio#addStopListener}.
   * - `shift()`: {@link WebAudio#stop}.
   */
  _stopListeners: unknown[];
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: none.
   * Written in: {@link WebAudio#_onDecode}, {@link WebAudio#clear}.
   * Read in: {@link WebAudio#_createEndTimer}, {@link WebAudio#_onDecode}.
   */
  _totalTime: number;
  /**
   * Inferred engine backing field.
   *
   * Type: `unknown`.
   * Initialized in: {@link WebAudio#initialize}.
   * Written in: {@link WebAudio#initialize}.
   * Read in: {@link WebAudio#_realUrl}.
   */
  _url: unknown;
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: none.
   * Written in: {@link WebAudio#clear}.
   * Read in: {@link WebAudio#_createGainNode}, {@link WebAudio#fadeIn}, {@link WebAudio#fadeOut}.
   */
  _volume: number;
  /**
   * Performs concatenate fetched data.
   */
  _concatenateFetchedData(): void;
  /**
   * Performs create all source nodes.
   */
  _createAllSourceNodes(): void;
  /**
   * Tries to load the audio again.
   */
  _createDecoder(): void;
  /**
   * Performs create end timer.
   */
  _createEndTimer(): void;
  /**
   * Performs create gain node.
   */
  _createGainNode(): void;
  /**
   * Performs create panner node.
   */
  _createPannerNode(): void;
  /**
   * Performs create source node.
   * @param index The index parameter.
   */
  _createSourceNode(index: number): void;
  /**
   * Performs decode audio data.
   * @param arrayBuffer The arrayBuffer parameter.
   */
  _decodeAudioData(arrayBuffer: ArrayBuffer): void;
  /**
   * Performs destroy decoder.
   */
  _destroyDecoder(): void;
  /**
   * Performs on decode.
   * @param buffer The buffer parameter.
   */
  _onDecode(buffer: AudioBuffer): void;
  /**
   * Performs on error.
   */
  _onError(): void;
  /**
   * Performs on fetch.
   * @param response The response parameter.
   */
  _onFetch(response: Response): void;
  /**
   * Performs on fetch process.
   * @param value The value parameter.
   */
  _onFetchProcess(value: Uint8Array): void;
  /**
   * Performs on load.
   */
  _onLoad(): void;
  /**
   * Performs on xhr load.
   * @param xhr The xhr parameter.
   */
  _onXhrLoad(xhr: XMLHttpRequest): void;
  /**
   * Gets read four characters.
   * @param view The view parameter.
   * @param index The index parameter.
   * @returns The result.
   */
  _readFourCharacters(view: DataView, index: number): string;
  /**
   * Performs read loop comments.
   * @param arrayBuffer The arrayBuffer parameter.
   */
  _readLoopComments(arrayBuffer: ArrayBuffer): void;
  /**
   * Performs read meta data.
   * @param view The view parameter.
   * @param index The index parameter.
   * @param size The size parameter.
   */
  _readMetaData(view: DataView, index: number, size: number): void;
  /**
   * Gets readable buffer.
   * @returns The result.
   */
  _readableBuffer(): ArrayBuffer;
  /**
   * Gets real url.
   * @returns The result.
   */
  _realUrl(): string;
  /**
   * Performs refresh source node.
   */
  _refreshSourceNode(): void;
  /**
   * Performs remove end timer.
   */
  _removeEndTimer(): void;
  /**
   * Performs remove nodes.
   */
  _removeNodes(): void;
  /**
   * Tries to load the audio again.
   * @returns The result.
   */
  _shouldUseDecoder(): boolean;
  /**
   * Performs start all source nodes.
   */
  _startAllSourceNodes(): void;
  /**
   * Performs start fetching.
   * @param url The url parameter.
   */
  _startFetching(url: string): void;
  /**
   * Tries to load the audio again.
   */
  _startLoading(): void;
  /**
   * Performs start playing.
   * @param offset The offset parameter.
   */
  _startPlaying(offset: number): void;
  /**
   * Performs start source node.
   * @param index The index parameter.
   */
  _startSourceNode(index: number): void;
  /**
   * Performs start xhr loading.
   * @param url The url parameter.
   */
  _startXhrLoading(url: string): void;
  /**
   * Performs stop source node.
   */
  _stopSourceNode(): void;
  /**
   * Performs update buffer.
   */
  _updateBuffer(): void;
  /**
   * Performs update buffer on fetch.
   */
  _updateBufferOnFetch(): void;
  /**
   * Performs update panner.
   */
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
   * @returns True if error; false otherwise.
   */
  isError(): boolean;
  /**
   * Checks whether the audio is playing.
   * @returns True if playing; false otherwise.
   */
  isPlaying(): boolean;
  /**
   * Checks whether the audio data is ready to play.
   * @returns True if ready; false otherwise.
   */
  isReady(): boolean;
  /**
   * The pan of the audio.
   * @returns The result.
   */
  get pan(): number;
  /**
   * The pitch of the audio.
   * @returns The result.
   */
  get pitch(): number;
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
   * @returns The result.
   */
  seek(): unknown;
  /**
   * Stops the audio.
   */
  stop(): void;
  /**
   * The url of the audio file.
   * @returns The result.
   */
  get url(): unknown;
  /**
   * The volume of the audio.
   * @returns The result.
   */
  get volume(): number;
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
   * @returns The result.
   */
  function _currentTime(): number;
  /**
   * Performs fade in.
   * @param duration The duration parameter.
   */
  function _fadeIn(duration: number): void;
  /**
   * Performs fade out.
   * @param duration The duration parameter.
   */
  function _fadeOut(duration: number): void;
  /**
   * Performs on hide.
   */
  function _onHide(): void;
  /**
   * Performs on show.
   */
  function _onShow(): void;
  /**
   * Performs on user gesture.
   */
  function _onUserGesture(): void;
  /**
   * Performs on visibility change.
   */
  function _onVisibilityChange(): void;
  /**
   * Performs reset volume.
   */
  function _resetVolume(): void;
  /**
   * Sets the master volume for all audio.
   */
  function _setupEventHandlers(): void;
  /**
   * Gets should mute on hide.
   * @returns The result.
   */
  function _shouldMuteOnHide(): boolean;
  /**
   * Initializes the audio system.
   * @returns The result.
   */
  function initialize(): boolean;
  /**
   * Sets the master volume for all audio.
   * @param value The master volume (0 to 1).
   */
  function setMasterVolume(value: number): void;
}

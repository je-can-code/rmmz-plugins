/**
 * Generated from project/js/rmmz_core.js
 * Class: Video
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Video
{
  /**
   * Inferred engine backing field.
   *
   * Type: `null`.
   * Initialized in: {@link Video#initialize}.
   * Written in: {@link Video#_createElement}, {@link Video#initialize}.
   * Read in: {@link Video#_createElement}, {@link Video#_isVisible}, {@link Video#_onError}, {@link Video#_onLoad}, {@link Video#_onUserGesture}, {@link Video#_updateVisibility}, {@link Video#play}, {@link Video#resize}, {@link Video#setVolume}.
   */
  _element: null;
  /**
   * Inferred engine backing field.
   *
   * Type: `boolean`.
   * Initialized in: {@link Video#initialize}.
   * Written in: {@link Video#_onLoad}, {@link Video#initialize}, {@link Video#play}.
   * Read in: {@link Video#isPlaying}.
   */
  _loading: boolean;
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: {@link Video#initialize}.
   * Written in: {@link Video#initialize}, {@link Video#setVolume}.
   * Read in: {@link Video#_onLoad}, {@link Video#setVolume}.
   */
  _volume: number;
}
declare function Video(): never;
declare namespace Video
{
  /**
   * Sets the volume for videos.
   */
  function _createElement(): void;
  /**
   * Gets is visible.
   * @returns The result.
   */
  function _isVisible(): boolean;
  /**
   * Performs on end.
   */
  function _onEnd(): void;
  /**
   * Performs on error.
   */
  function _onError(): void;
  /**
   * Sets the volume for videos.
   */
  function _onLoad(): void;
  /**
   * Performs on user gesture.
   */
  function _onUserGesture(): void;
  /**
   * Performs setup event handlers.
   */
  function _setupEventHandlers(): void;
  /**
   * Performs update visibility.
   * @param videoVisible The videoVisible parameter.
   */
  function _updateVisibility(videoVisible: boolean): void;
  /**
   * Initializes the video system.
   * @param width The width of the video.
   * @param height The height of the video.
   */
  function initialize(width: number, height: number): void;
  /**
   * Checks whether the video is playing.
   * @returns True if playing; false otherwise.
   */
  function isPlaying(): boolean;
  /**
   * Starts playback of a video.
   * @param src The url of the video.
   */
  function play(src: string): void;
  /**
   * Changes the display size of the video.
   * @param width The width of the video.
   * @param height The height of the video.
   */
  function resize(width: number, height: number): void;
  /**
   * Sets the volume for videos.
   * @param volume The volume for videos (0 to 1).
   */
  function setVolume(volume: number): void;
}

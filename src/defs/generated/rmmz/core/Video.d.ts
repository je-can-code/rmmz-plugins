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
   * Instance fields inferred from `this._*` assignments across vanilla engine sources.
   */
  _element: null;
  _loading: boolean;
  _volume: number;
}
declare function Video(): never;
declare namespace Video
{
  /**
   * Sets the volume for videos.
   */
  function _createElement(): void;
  function _isVisible(): boolean;
  function _onEnd(): void;
  function _onError(): void;
  /**
   * Sets the volume for videos.
   */
  function _onLoad(): void;
  function _onUserGesture(): void;
  function _setupEventHandlers(): void;
  function _updateVisibility(videoVisible: boolean): void;
  /**
   * Initializes the video system.
   * @param width The width of the video.
   * @param height The height of the video.
   */
  function initialize(width: number, height: number): void;
  /**
   * Checks whether the video is playing.
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

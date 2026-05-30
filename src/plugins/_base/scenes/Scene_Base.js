//region Scene_Base
import Window_Dimmer from '../windows/Window_Dimmer.js';

/**
 * Default {@link Window#contentsOpacity} for {@link #showModalDimmer} / {@link #buildModalDimmerWindow} (0 = clear,
 * 255 = strongest tint). Raise for heavier dim; override with {@link #showModalDimmer}'s first argument per call.
 */
Scene_Base.MODAL_DIMMER_CONTENTS_OPACITY_DEFAULT = 200;

/**
 * Extends {@link #initialize}.<br/>
 * Adds extension for initializing custom members for scenes.
 */
J.BASE.Aliased.Scene_Base.set('initialize', Scene_Base.prototype.initialize);
Scene_Base.prototype.initialize = function()
{
  // perform original logic.
  J.BASE.Aliased.Scene_Base.get('initialize')
    .call(this);

  // also add custom members to this class.
  this.initMembers();
};

/**
 * Initialize any additional custom members for this scene.
 * This runs once per scene instance; child scenes that override should call <code>super.initMembers</code> first.
 */
Scene_Base.prototype.initMembers = function()
{
  this._j ||= {};

  /**
   * Lazy-built on first {@link #getModalDimmerWindow}; {@link Scene_Boot} runs {@link #initMembers} before
   * {@link $gameSystem} exists, so constructing {@link Window_Base} during init would crash in
   * {@link Window_Base#resetFontSettings}.
   * @type {Window_Dimmer|null}
   */
  this._j._modalDimmerWindow = null;
};

/**
 * Allocates the modal dimmer window; only call once {@link $gameSystem} is ready (after boot finishes loading
 * database).
 *
 * @returns {Window_Dimmer} Hidden until {@link #showModalDimmer} runs.
 */
Scene_Base.prototype.buildModalDimmerWindow = function()
{
  const rect = new Rectangle(0, 0, Graphics.boxWidth, Graphics.boxHeight);
  const win = new Window_Dimmer(rect);
  win.visible = false;

  // {@link Window#opacity} only drives {@link Window#_container} (frame/back). The black fill lives in
  // {@link Window#_clientArea}, so dim strength must use {@link Window#contentsOpacity}.
  win.contentsOpacity = Scene_Base.MODAL_DIMMER_CONTENTS_OPACITY_DEFAULT;

  return win;
};

/**
 * Gets the shared modal dimmer window for this scene, creating it on first use when the engine data layer is live.
 *
 * @returns {Window_Dimmer} The dimmer overlay window.
 */
Scene_Base.prototype.getModalDimmerWindow = function()
{
  if (this._j._modalDimmerWindow === null)
  {
    this._j._modalDimmerWindow = this.buildModalDimmerWindow();
  }

  return this._j._modalDimmerWindow;
};

/**
 * Parents the dimmer into {@link Scene_Base#_windowLayer} immediately before the anchor so {@link WindowLayer} draws it
 * above earlier windows but below that anchor sibling.
 *
 * @param {Window} anchorWindow The window that must remain visually above the dimmer (the modal itself).
 */
Scene_Base.prototype.ensureModalDimmerBeforeWindow = function(anchorWindow)
{
  const dimmer = this.getModalDimmerWindow();
  const wl = this._windowLayer;

  if (dimmer.parent !== null)
  {
    dimmer.parent.removeChild(dimmer);
  }

  const insertAt = wl.getChildIndex(anchorWindow);

  wl.addChildAt(dimmer, insertAt);
};

/**
 * Turns the dimmer on for scenes that already built {@link Scene_Base#_windowLayer}.
 *
 * @param {number} opacity Final {@link Window#contentsOpacity} after clamping (tint strength on the black fill).
 * @param {Window} layerAboveWindow Window that must stay above the dimmer (confirmation, shop prompt, etc.).
 */
Scene_Base.prototype.showModalDimmer = function(
  opacity = Scene_Base.MODAL_DIMMER_CONTENTS_OPACITY_DEFAULT,
  layerAboveWindow)
{
  this.ensureModalDimmerBeforeWindow(layerAboveWindow);

  const win = this.getModalDimmerWindow();

  win.contentsOpacity = opacity.clamp(0, 255);
  win.show();
  win.openness = 255;
  win.visible = true;
  win.refresh();
};

/**
 * Hides the dimmer without destroying the window so the next modal can reuse it.
 */
Scene_Base.prototype.hideModalDimmer = function()
{
  if (this._j._modalDimmerWindow === null)
  {
    return;
  }

  this._j._modalDimmerWindow.visible = false;
};

/**
 * Pushes this current scene onto the stack, forcing it into action.
 */
Scene_Base.prototype.callScene = function()
{
  SceneManager.push(this);
};

//endregion Scene_Base
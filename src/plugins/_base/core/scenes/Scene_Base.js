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
 * Gets whether this scene has ever summoned its modal dimmer.
 *
 * Asked instead of the getter when the answer only matters for tearing down, since the getter builds
 * one on first use and would create a dimmer purely to switch it off.
 * @returns {boolean}
 */
Scene_Base.prototype.hasModalDimmerWindow = function()
{
  return this._j._modalDimmerWindow !== null;
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
  const wl = this.windowLayer();

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
  // nothing to hide when the dimmer was never summoned; reaching for it through its getter would
  // build one purely to switch it off.
  if (this.hasModalDimmerWindow() === false) return;

  this.getModalDimmerWindow().visible = false;
};

/**
 * Pushes this current scene onto the stack, forcing it into action.
 */
Scene_Base.prototype.callScene = function()
{
  SceneManager.push(this);
};

/**
 * Whether this scene is the map scene.
 * All scenes return false; {@link Scene_Map} overrides to return true.
 * @returns {boolean}
 */
Scene_Base.prototype.isMapScene = function()
{
  // scenes are not the map scene unless they say otherwise.
  return false;
};

//endregion Scene_Base

//region Scene_Map
/**
 * Identifies this scene as the map scene.
 * @returns {boolean}
 */
Scene_Map.prototype.isMapScene = function()
{
  // this is the map scene.
  return true;
};

/**
 * Gets the layer every window of this scene is added to.
 * @returns {WindowLayer} The windowLayer.
 */
Scene_Base.prototype.windowLayer = function()
{
  // hand back the layer every window of this scene is added to.
  return this._windowLayer;
};

/**
 * Overwrites {@link #buttonAreaHeight}.<br/>
 * Reserves no vertical space for the touch ui button row.
 *
 * Vanilla reserves this strip on every scene whether or not any buttons are drawn into it, so a
 * project that does not use them pays for the gap on every window layout it ever writes.
 * @returns {number}
 */
Scene_Base.prototype.buttonAreaHeight = function()
{
  // no buttons are created, so no room is set aside for them.
  return 0;
};

/**
 * Overwrites {@link #createButtons}.<br/>
 * Skips creation of the touch ui buttons entirely.
 *
 * The cancel and page buttons are an accessibility affordance for touch devices, and this suite
 * targets keyboard and gamepad instead- every scene here binds its own controls and draws its own
 * legend, so the vanilla buttons would be a second, inconsistent way to do the same thing.
 */
Scene_Base.prototype.createButtons = function()
{
};
//endregion Scene_Map
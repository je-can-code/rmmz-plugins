//region Game_System
/**
 * Extends {@link #initMembers}.<br/>
 * Also seeds persistent minimap state.
 */
J.MAP.Aliased.Game_System.set('initMembers', Game_System.prototype.initMembers);
Game_System.prototype.initMembers = function()
{
  // original
  // perform original logic.
  J.MAP.Aliased.Game_System.get('initMembers').call(this);

  /**
   * The shared root namespace for all J-plugins temporary data.
   */
  this._j ||= {};

  /**
   * A grouping of all properties associated with the map/minimap plugin.
   */
  this._j._map ||= {};

  /**
   * Current desired minimap visibility.
   * @type {boolean}
   */
  this._j._map._minimapVisible = J.MAP.Metadata.startVisible;
};

/**
 * Get whether the minimap should be visible (before HUD auto-hide rules).
 */
Game_System.prototype.isMinimapVisible = function()
{
  return this._j._map._minimapVisible;
};

/**
 * Show the minimap.
 */
Game_System.prototype.showMinimap = function()
{
  this._j._map._minimapVisible = true;
};

/**
 * Hide the minimap.
 */
Game_System.prototype.hideMinimap = function()
{
  this._j._map._minimapVisible = false;
};

/**
 * Toggles to the opposite of the current visibility for the minimap.
 */
Game_System.prototype.toggleMinimapVisibility = function()
{
  this._j._map._minimapVisible = !this._j._map._minimapVisible;
};

/**
 * Sets visibility of the minimap to the given value.
 */
Game_System.prototype.setMinimapVisibility = function(visibility)
{
  this._j._map._minimapVisible = visibility;
};

/**
 * Extends {@link #onAfterLoad}.<br/>
 * Also handles the possibility of loading a save that was created before using this plugin.
 */
J.MAP.Aliased.Game_System.set('onAfterLoad', Game_System.prototype.onAfterLoad);
Game_System.prototype.onAfterLoad = function()
{
  // perform original logic.
  J.MAP.Aliased.Game_System.get('onAfterLoad').call(this);

  // ensure structure and default if missing from older saves.
  this._j ||= {};
  this._j._map ||= {};
  this._j._map._minimapVisible ??= J.MAP.Metadata.startVisible;
};
//endregion Game_System
//region Game_System
/**
 * Extends {@link #initialize}.<br>
 * Also initializes the debug features for the SDP system.
 */
J.SDP.Aliased.Game_System.set('initialize', Game_System.prototype.initialize);
Game_System.prototype.initialize = function()
{
  // perform original logic.
  J.SDP.Aliased.Game_System.get('initialize')
    .call(this);

  // initializes members for this plugin.
  this.initSdpMembers();
};

/**
 * Initializes the SDP system and binds earned panels to the `$gameSystem` object.
 */
Game_System.prototype.initSdpMembers = function()
{
  /**
   * The J object where all my additional properties live.
   */
  this._j ||= {};

  /**
   * A grouping of all properties associated with the SDP system.
   */
  this._j._sdp ||= {};

  /**
   * Whether or not to force any enemy that can drop a panel to drop a panel.
   * @type {boolean}
   */
  this._j._sdp._forceDropPanels = false;
};

/**
 * Enables a DEBUG functionality for forcing the drop of panels where applicable.
 */
Game_System.prototype.enableForcedSdpDrops = function()
{
  this._j._sdp._forceDropPanels = true;
};

/**
 * Disables a DEBUG functionality for forcing the drop of panels where applicable.
 */
Game_System.prototype.disableForcedSdpDrops = function()
{
  this._j._sdp._forceDropPanels = false;
};

/**
 * Determines whether or not the DEBUG functionality of forced-panel-dropping is active.
 * @returns {boolean|*|boolean}
 */
Game_System.prototype.shouldForceDropSdp = function()
{
  return this._j._sdp._forceDropPanels ?? false;
};

/**
 * Extends {@link #onAfterLoad}.<br>
 * Updates the list of all available panels from the latest plugin metadata.
 */
J.SDP.Aliased.Game_System.set('onAfterLoad', Game_System.prototype.onAfterLoad);
Game_System.prototype.onAfterLoad = function()
{
  // perform original logic.
  J.SDP.Aliased.Game_System.get('onAfterLoad')
    .call(this);

  // setup the difficulty layers in the temp data.
  $gameParty.updateSdpTrackingsFromConfig();
};
//endregion Game_System
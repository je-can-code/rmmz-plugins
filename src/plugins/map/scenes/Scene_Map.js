//region Scene_Map integration
J.MAP.Aliased.Scene_Map.set('initMembers', Scene_Map.prototype.initMembers);
Scene_Map.prototype.initMembers = function()
{
  // perform original logic.
  J.MAP.Aliased.Scene_Map.get('initMembers')
    .call(this);

  // also initialize the HUD members.
  this.initMiniMapMembers();
};

Scene_Map.prototype.initMiniMapMembers = function()
{
  /**
   * The J object where all my additional properties live.
   */
  this._j ||= {};

  /**
   * A grouping of all properties associated with this plugin.
   */
  this._j._map ||= {};

  /**
   * The tracked minimap.
   * @type {Sprite_MiniMap}
   */
  this._j._map._miniMap = null;
};

/**
 * Extends {@link Scene_Map.createAllWindows}.<br>
 * Also creates the minimap sprite.
 */
J.MAP.Aliased.Scene_Map.set('createAllWindows', Scene_Map.prototype.createAllWindows);
Scene_Map.prototype.createAllWindows = function()
{
  // perform original logic
  J.MAP.Aliased.Scene_Map.get('createAllWindows').call(this);

  // create the minimap layer
  this.createMiniMap();
};

/**
 * Creates and attaches the minimap to the scene.
 */
Scene_Map.prototype.createMiniMap = function()
{
  /**
   * The minimap sprite instance.
   * @type {Sprite_MiniMap}
   */
  this._j._map._miniMap = new Sprite_MiniMap();

  // add the minimap.
  this.addChild(this._j._map._miniMap);
};
//endregion Scene_Map integration
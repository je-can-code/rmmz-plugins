//region Scene_Map
import Sprite_MiniMap from '../sprites/Sprite_MiniMap.js';

/**
 * Extends {@link #initMembers}.<br/>
 * Also initializes the minimap-related members.
 */
J.MAP.Aliased.Scene_Map.set('initMembers', Scene_Map.prototype.initMembers);
Scene_Map.prototype.initMembers = function()
{
  // perform original logic.
  J.MAP.Aliased.Scene_Map.get('initMembers')
    .call(this);

  // also initialize the HUD members.
  this.initMiniMapMembers();
};

/**
 * Initializes the minimap-related members.
 */
Scene_Map.prototype.initMiniMapMembers = function()
{
  /**
   * The J object where all my additional properties live.
   */
  // policy step inside init mini map members.
  this._j ||= {};

  // policy step inside init mini map members.
  /**
   * A grouping of all properties associated with this plugin.
   */
  this._j._map ||= {};

  // policy step inside init mini map members.
  /**
   * The tracked minimap.
   * @type {Sprite_MiniMap}
   */
  this._j._map._miniMap = null;
};

/**
 * Extends {@link #createAllWindows}.<br/>
 * Also creates the minimap sprite.
 */
J.MAP.Aliased.Scene_Map.set('createAllWindows', Scene_Map.prototype.createAllWindows);
Scene_Map.prototype.createAllWindows = function()
{
  // perform original logic
  J.MAP.Aliased.Scene_Map.get('createAllWindows')
    .call(this);

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

  // set initial visibility from runtime state.
  let shouldBeVisible = $gameSystem.isMinimapVisible();

  // if this map blocks the minimap, force hide regardless of saved preference.
  if ($gameMap.isMinimapBlocked())
  {
    shouldBeVisible = false;
  }

  // apply the computed visibility.
  this._j._map._miniMap.visible = shouldBeVisible;

  // add the minimap to the scene.
  this.addChild(this._j._map._miniMap);
};

/**
 * Gets the minimap sprite.
 * @returns {Sprite_MiniMap|null}
 */
Scene_Map.prototype.getMiniMap = function()
{
  return this._j._map._miniMap;
};

/**
 * Extends {@link #update}.<br/>
 * Also keeps the visibility of the minimap in sync.
 */
J.MAP.Aliased.Scene_Map.set('update', Scene_Map.prototype.update);
Scene_Map.prototype.update = function()
{
  // perform original logic.
  J.MAP.Aliased.Scene_Map.get('update')
    .call(this);

  // handle minimap visibility.
  this.updateMiniMapVisibilityAndOpacity();
};

/**
 * Manages minimap visibility and overlap-opacity per frame.
 */
Scene_Map.prototype.updateMiniMapVisibilityAndOpacity = function()
{
  // grab the minimap for visibility work.
  const miniMap = this.getMiniMap();
  if (!miniMap) return; // nothing to do if no minimap exists.

  // 0) Per-map block wins immediately.
  if ($gameMap.isMinimapBlocked())
  {
    // if blocked, force hide and skip any further processing.
    miniMap.visible = false;
    return;
  }

  // If the minimap is in focus mode, force it visible and full alpha and skip dimming.
  if (miniMap.isInFocusMode())
  {
    miniMap.visible = true;
    miniMap.alpha = 1.0;
    return;
  }

  // 1) Start with runtime toggle from Game_System.
  let shouldBeVisible = $gameSystem.isMinimapVisible();

  // 2) Respect HUD hide (JABS input) if configured.
  if (J.HUD && J.MAP.Metadata.respectHudHide && !$hudManager.canShowHud())
  {
    shouldBeVisible = false;
  }

  // apply visibility based on toggles.
  miniMap.visible = shouldBeVisible;
  if (!miniMap.visible) return; // if hidden, no need to compute overlap alpha.

  // 3) Overlap-opacity against the player.
  const overlapping = this.hasMinimapInterference();
  const overlapAlpha = J.MAP.Metadata.overlapOpacity ?? 0.40; // sensible default if no param yet.
  miniMap.alpha = overlapping
    ? overlapAlpha
    : 1.0;
};

/**
 * Determine if the minimap overlaps with the player.
 * @returns {boolean}
 */
Scene_Map.prototype.hasMinimapInterference = function()
{
  const mini = this.getMiniMap();
  if (!mini || !mini.bitmap) return false;

  // Minimap bounds (Sprite anchored center).
  const mmW = mini.bitmap.width;
  const mmH = mini.bitmap.height;
  const mmLeft = Math.round(mini.x - (mmW / 2));
  const mmTop = Math.round(mini.y - (mmH / 2));
  const mmRight = mmLeft + mmW;
  const mmBottom = mmTop + mmH;

  // Player screen-space rectangle. The engine’s screenX/screenY gives the
  // character’s foot position; use tile size as a reasonable sprite bbox.
  const px = $gamePlayer.screenX();
  const py = $gamePlayer.screenY();
  const pW = ($gameMap.tileWidth && $gameMap.tileWidth()) || 48;
  const pH = ($gameMap.tileHeight && $gameMap.tileHeight()) || 48;

  // Approximate player rect: centered horizontally, extends up one tile.
  const pLeft = Math.round(px - (pW / 2));
  const pTop = Math.round(py - pH);
  const pRight = pLeft + pW;
  const pBottom = pTop + pH;

  // AABB overlap check
  const noOverlap = (mmRight <= pLeft) || (mmLeft >= pRight) || (mmBottom <= pTop) || (mmTop >= pBottom);
  return !noOverlap;
};
//endregion Scene_Map
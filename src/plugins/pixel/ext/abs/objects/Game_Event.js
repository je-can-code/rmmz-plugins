//region Game_Event
/**
 * Extends {@link #initMembers}.<br/>
 * Also initializes the cached enemy hitbox size data.
 */
J.PIXEL.EXT.ABS.Aliased.Game_Event.set('initMembers', Game_Event.prototype.initMembers);
Game_Event.prototype.initMembers = function()
{
  // perform original logic.
  J.PIXEL.EXT.ABS.Aliased.Game_Event.get('initMembers').call(this);

  // initialize our pixel-ABS hitbox cache.
  this.initPixelAbsHitboxData();
};

/**
 * Extends {@link #setupPageSettings}.<br/>
 * Rebuilds the cached hitbox data whenever the active page changes.
 */
J.PIXEL.EXT.ABS.Aliased.Game_Event.set('setupPageSettings', Game_Event.prototype.setupPageSettings);
Game_Event.prototype.setupPageSettings = function()
{
  // perform original logic first so battler core data is current.
  J.PIXEL.EXT.ABS.Aliased.Game_Event.get('setupPageSettings').call(this);

  // refresh the resolved hitbox data for the new page.
  this.refreshPixelAbsHitboxSizeData();

  // refresh the resolved hitbox reveal data for the new page.
  this.refreshPixelAbsHitboxRevealRange();
};

/**
 * Initializes the cached pixel-ABS enemy hitbox data.
 */
Game_Event.prototype.initPixelAbsHitboxData = function()
{
  // ensure the shared extension data structure exists.
  this._j ||= {};
  this._j._pixel ||= {};
  this._j._pixel._abs ||= {};

  // initialize the cached hitbox size to nothing.
  this._j._pixel._abs._hitboxSizeData = null;

  // initialize the cached hitbox reveal range to nothing.
  this._j._pixel._abs._hitboxRevealRange = null;
};

/**
 * Gets the cached enemy hitbox size data for this event.
 * @returns {{widthTiles:number,heightTiles:number}|null}
 */
Game_Event.prototype.getPixelAbsHitboxSizeData = function()
{
  // if our cache was somehow never initialized, then do so now.
  if (!this._j || !this._j._pixel || !this._j._pixel._abs)
  {
    this.initPixelAbsHitboxData();
  }

  return this._j._pixel._abs._hitboxSizeData;
};

/**
 * Sets the cached enemy hitbox size data for this event.
 * @param {{widthTiles:number,heightTiles:number}|null} hitboxSizeData The resolved data.
 */
Game_Event.prototype.setPixelAbsHitboxSizeData = function(hitboxSizeData)
{
  // if our cache was somehow never initialized, then do so now.
  if (!this._j || !this._j._pixel || !this._j._pixel._abs)
  {
    this.initPixelAbsHitboxData();
  }

  // null means this event should use the vanilla PIXEL footprint.
  if (hitboxSizeData === null)
  {
    this._j._pixel._abs._hitboxSizeData = null;
    return;
  }

  // store a fresh copy to avoid accidental external mutation.
  this._j._pixel._abs._hitboxSizeData = {
    widthTiles: hitboxSizeData.widthTiles,
    heightTiles: hitboxSizeData.heightTiles,
  };
};

/**
 * Refreshes the resolved enemy hitbox size for this event.
 */
Game_Event.prototype.refreshPixelAbsHitboxSizeData = function()
{
  // only JABS enemy battlers participate in this shared hitbox model.
  if (this.canUsePixelAbsHitboxSize() === false)
  {
    this.setPixelAbsHitboxSizeData(null);
    return;
  }

  // resolve in precedence order: event > enemy > default.
  const hitboxSizeData = this.getPixelAbsHitboxSizeCommentOverride()
    ?? this.getPixelAbsHitboxSizeEnemyFallback()
    ?? this.getPixelAbsDefaultHitboxSizeData();

  // cache the found size for the runtime systems that need it.
  this.setPixelAbsHitboxSizeData(hitboxSizeData);
};

/**
 * Determines whether or not this event should use PIXEL-ABS battler hitbox data.
 * @returns {boolean}
 */
Game_Event.prototype.canUsePixelAbsEnemyHitboxData = function()
{
  // if this event is not a JABS battler, then this feature does not apply.
  if (typeof this.isJabsBattler !== 'function') return false;
  if (this.isJabsBattler() === false) return false;

  // only enemy battlers with a valid enemy id should use this path.
  if (typeof this.getBattlerId !== 'function') return false;
  if (this.getBattlerId() <= 0) return false;

  return true;
};

/**
 * Determines whether or not this event should use the unified enemy hitbox model.
 * @returns {boolean}
 */
Game_Event.prototype.canUsePixelAbsHitboxSize = function()
{
  return this.canUsePixelAbsEnemyHitboxData();
};

/**
 * Whether or not this event currently has a resolved custom hitbox model.
 * @returns {boolean}
 */
Game_Event.prototype.hasCustomPixelHitbox = function()
{
  return !!this.getPixelAbsHitboxSizeData();
};

/**
 * Gets the event comment override for hitbox size, if any.
 * @returns {{widthTiles:number,heightTiles:number}|null}
 */
Game_Event.prototype.getPixelAbsHitboxSizeCommentOverride = function()
{
  // if the event cannot parse comments, then there can be no override.
  if (typeof this.extractValueByRegex !== 'function') return null;

  // grab the raw comment payload and normalize it into the shared model.
  const rawHitboxSize = this.extractValueByRegex(J.PIXEL.EXT.ABS.RegExp.HitboxSize, null, false);
  return RPG_Enemy.hitboxSizeDataFromRaw(rawHitboxSize);
};

/**
 * Gets the cached enemy hitbox reveal range for this event.
 * @returns {number|null}
 */
Game_Event.prototype.getPixelAbsHitboxRevealRange = function()
{
  // if our cache was somehow never initialized, then do so now.
  if (!this._j || !this._j._pixel || !this._j._pixel._abs)
  {
    this.initPixelAbsHitboxData();
  }

  return this._j._pixel._abs._hitboxRevealRange;
};

/**
 * Sets the cached enemy hitbox reveal range for this event.
 * @param {number|null} hitboxRevealRange The resolved reveal range.
 */
Game_Event.prototype.setPixelAbsHitboxRevealRange = function(hitboxRevealRange)
{
  // if our cache was somehow never initialized, then do so now.
  if (!this._j || !this._j._pixel || !this._j._pixel._abs)
  {
    this.initPixelAbsHitboxData();
  }

  // store the resolved reveal range for later visibility checks.
  this._j._pixel._abs._hitboxRevealRange = hitboxRevealRange;
};

/**
 * Refreshes the resolved enemy hitbox reveal range for this event.
 */
Game_Event.prototype.refreshPixelAbsHitboxRevealRange = function()
{
  // only eligible JABS battlers participate in this feature.
  if (this.canUsePixelAbsEnemyHitboxData() === false)
  {
    this.setPixelAbsHitboxRevealRange(null);
    return;
  }

  // check the event comments first for a local override.
  const commentOverride = this.getPixelAbsHitboxRevealCommentOverride();
  if (commentOverride !== null)
  {
    this.setPixelAbsHitboxRevealRange(commentOverride);
    return;
  }

  // next, check the enemy notes for a database-level fallback.
  const enemyFallback = this.getPixelAbsHitboxRevealEnemyFallback();
  if (enemyFallback !== null)
  {
    this.setPixelAbsHitboxRevealRange(enemyFallback);
    return;
  }

  // otherwise, use the plugin default.
  this.setPixelAbsHitboxRevealRange(this.getPixelAbsDefaultHitboxRevealRange());
};

/**
 * Gets the event comment override for hitbox reveal range, if any.
 * @returns {number|null}
 */
Game_Event.prototype.getPixelAbsHitboxRevealCommentOverride = function()
{
  // if the event cannot parse comments, then there can be no override.
  if (typeof this.extractValueByRegex !== 'function') return null;

  // grab the reveal range directly from the event comments.
  return this.extractValueByRegex(J.PIXEL.EXT.ABS.RegExp.HitboxReveal, null, true);
};

/**
 * Gets the enemy database fallback hitbox size, if any.
 * @returns {{widthTiles:number,heightTiles:number}|null}
 */
Game_Event.prototype.getPixelAbsHitboxSizeEnemyFallback = function()
{
  // grab the shared enemy database data.
  const enemyData = this.getPixelAbsEnemyData();

  // if the enemy data is unavailable, then skip this fallback.
  if (!enemyData) return null;

  return enemyData.hitboxSizeData;
};

/**
 * Gets the enemy database fallback hitbox reveal range, if any.
 * @returns {number|null}
 */
Game_Event.prototype.getPixelAbsHitboxRevealEnemyFallback = function()
{
  // grab the shared enemy database data.
  const enemyData = this.getPixelAbsEnemyData();

  // if the enemy data is unavailable, then skip this fallback.
  if (!enemyData) return null;

  return enemyData.hitboxRevealRange;
};

/**
 * Gets the shared enemy database data for this battler event.
 * @returns {RPG_Enemy|null}
 */
Game_Event.prototype.getPixelAbsEnemyData = function()
{
  // grab the enemy id associated with this battler event.
  const battlerId = this.getBattlerId();

  // if somehow the battler id is invalid, then there is no fallback.
  if (battlerId <= 0) return null;

  // grab the cached enemy battler wrapper.
  const enemyBattler = $gameEnemies.enemy(battlerId);

  // if the battler wrapper is unavailable, then skip the fallback.
  if (!enemyBattler) return null;

  // grab the hydrated database data behind the battler.
  return enemyBattler.enemy();
};

/**
 * Gets the plugin-default hitbox size for enemy battlers.
 * @returns {{widthTiles:number,heightTiles:number}}
 */
Game_Event.prototype.getPixelAbsDefaultHitboxSizeData = function()
{
  return {
    widthTiles: J.PIXEL.EXT.ABS.Metadata.DefaultEnemyHitboxWidth,
    heightTiles: J.PIXEL.EXT.ABS.Metadata.DefaultEnemyHitboxHeight,
  };
};

/**
 * Gets the plugin-default hitbox reveal range for enemy battlers.
 * @returns {number}
 */
Game_Event.prototype.getPixelAbsDefaultHitboxRevealRange = function()
{
  return J.PIXEL.EXT.ABS.Metadata.DefaultEnemyHitboxRevealRange;
};

/**
 * Determines whether or not hitbox outlines should be visible for all eligible battlers.
 * @returns {boolean}
 */
Game_Event.prototype.isPixelAbsHitboxRevealAlwaysActive = function()
{
  return J.PIXEL.EXT.ABS.Metadata.EnemyHitboxOutlineAlwaysActive;
};

/**
 * Determines whether or not this battler's hitbox outline should currently be shown.
 * @returns {boolean}
 */
Game_Event.prototype.canShowPixelAbsHitboxReveal = function()
{
  // only eligible JABS battlers can reveal their hitboxes.
  if (this.canUsePixelAbsEnemyHitboxData() === false)
  {
    return false;
  }

  // invincible battlers cannot be struck, so they should not display the strike outline.
  const jabsBattler = this.getJabsBattler();
  if (!jabsBattler) return false;
  if (jabsBattler.isInvincible())
  {
    return false;
  }

  // always-active mode bypasses all range checks.
  if (this.isPixelAbsHitboxRevealAlwaysActive())
  {
    return true;
  }

  // zero or negative range means this feature is currently disabled for this battler.
  const revealRange = this.getPixelAbsHitboxRevealRange();
  if (revealRange <= 0)
  {
    return false;
  }

  // reveal the outline when the player is close enough.
  return revealRange >= this.distanceFromPlayer();
};

/**
 * Gets this event's hitbox as a PIXEL-style tile-space AABB.
 * @param {number=} logicalX The logical map x to evaluate from.
 * @param {number=} logicalY The logical map y to evaluate from.
 * @returns {{left:number,top:number,right:number,bottom:number,width:number,height:number}}
 */
Game_Event.prototype.getPixelAbsHitboxTileAabb = function(logicalX = this.x, logicalY = this.y)
{
  // build the hitbox against the event's current pivoting rules.
  const pivotX = logicalX + this.getCollisionPivotX();
  const pivotY = logicalY + this.getCollisionPivotY();
  const hitbox = this._pixelHitbox(this.getEffectiveRadius());
  const left = pivotX + hitbox.hx;
  const top = pivotY + hitbox.hy;

  return {
    left,
    top,
    right: left + hitbox.w,
    bottom: top + hitbox.h,
    width: hitbox.w,
    height: hitbox.h,
  };
};

/**
 * Builds the battler AABB model for JABS using this event's resolved hitbox.
 * @returns {JABS_Aabb|null}
 */
Game_Event.prototype.getPixelAbsBattlerAabbModel = function()
{
  // only provide a custom model when the shared enemy hitbox is active.
  if (this.hasCustomPixelHitbox() === false) return null;

  // convert the resolved tile dimensions into screen pixels.
  const { widthTiles, heightTiles } = this.getPixelAbsHitboxSizeData();
  const widthPixels = widthTiles * $gameMap.tileWidth();
  const heightPixels = heightTiles * $gameMap.tileHeight();
  const left = this.screenX() - (widthPixels / 2);
  const top = this.screenY() - heightPixels;

  return new JABS_Aabb(left, top, widthPixels, heightPixels);
};

/**
 * Extends {@link Game_Event.getCollisionRadius}.<br/>
 * The rectangle is canonical, but PIXEL still asks for a scalar in some paths.
 * Use the larger half-extent as the compatibility radius.
 * @returns {number}
 */
J.PIXEL.EXT.ABS.Aliased.Game_Event.set('getCollisionRadius', Game_Event.prototype.getCollisionRadius);
Game_Event.prototype.getCollisionRadius = function()
{
  // if this event does not use the shared model, then perform original logic.
  if (this.hasCustomPixelHitbox() === false)
  {
    // perform original logic.
    return J.PIXEL.EXT.ABS.Aliased.Game_Event.get('getCollisionRadius').call(this);
  }

  // use the larger half-extent as the compatibility radius.
  const { widthTiles, heightTiles } = this.getPixelAbsHitboxSizeData();
  return Math.max(widthTiles, heightTiles) / 2;
};

/**
 * Extends {@link Game_Event.getEffectiveRadius}.<br/>
 * Feet-anchored rectangles are already normalized, so the compatibility radius
 * should not be clamped by the legacy downward-bleed rule.
 * @returns {number}
 */
J.PIXEL.EXT.ABS.Aliased.Game_Event.set('getEffectiveRadius', Game_Event.prototype.getEffectiveRadius);
Game_Event.prototype.getEffectiveRadius = function()
{
  // if this event does not use the shared model, then perform original logic.
  if (this.hasCustomPixelHitbox() === false)
  {
    // perform original logic.
    return J.PIXEL.EXT.ABS.Aliased.Game_Event.get('getEffectiveRadius').call(this);
  }

  // our compatibility radius is already derived from the resolved rectangle.
  return this.getCollisionRadius();
};

/**
 * Extends {@link Game_Event.getCollisionPivotY}.<br/>
 * Enemy hitboxes are feet-anchored, so the pivot becomes the event feet.
 * @returns {number}
 */
J.PIXEL.EXT.ABS.Aliased.Game_Event.set('getCollisionPivotY', Game_Event.prototype.getCollisionPivotY);
Game_Event.prototype.getCollisionPivotY = function()
{
  // if this event does not use the shared model, then perform original logic.
  if (this.hasCustomPixelHitbox() === false)
  {
    // perform original logic.
    return J.PIXEL.EXT.ABS.Aliased.Game_Event.get('getCollisionPivotY').call(this);
  }

  // the feet live on the tile's bottom edge.
  return 1.0;
};

/**
 * Extends {@link Game_Event._pixelHitbox}.<br/>
 * Builds the rectangular, feet-anchored hitbox for PIXEL movement checks.
 * @param {number} radius The incoming compatibility radius.
 * @returns {{w:number,h:number,hx:number,hy:number}}
 */
J.PIXEL.EXT.ABS.Aliased.Game_Event.set('_pixelHitbox', Game_Event.prototype._pixelHitbox);
Game_Event.prototype._pixelHitbox = function(radius)
{
  // if this event does not use the shared model, then perform original logic.
  if (this.hasCustomPixelHitbox() === false)
  {
    // perform original logic.
    return J.PIXEL.EXT.ABS.Aliased.Game_Event.get('_pixelHitbox').call(this, radius);
  }

  // grab the canonical rectangle dimensions.
  const { widthTiles, heightTiles } = this.getPixelAbsHitboxSizeData();

  return {
    w: widthTiles,
    h: heightTiles,
    hx: -(widthTiles / 2),
    hy: -heightTiles,
  };
};
//endregion Game_Event
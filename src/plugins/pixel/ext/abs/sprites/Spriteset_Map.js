//region Spriteset_Map
/**
 * Extends {@link #createLowerLayer}.<br>
 * Also creates the PIXEL-ABS hitbox reveal outline layer.
 */
J.PIXEL.EXT.ABS.Aliased.Spriteset_Map.set('createLowerLayer', Spriteset_Map.prototype.createLowerLayer);
Spriteset_Map.prototype.createLowerLayer = function()
{
  // perform original logic.
  J.PIXEL.EXT.ABS.Aliased.Spriteset_Map.get('createLowerLayer').call(this);

  // also create the PIXEL-ABS reveal outline layer.
  this.createPixelAbsHitboxRevealLayer();
};

/**
 * Extends {@link #updateJabsSprites}.<br>
 * Also updates the PIXEL-ABS reveal outline overlays.
 */
J.PIXEL.EXT.ABS.Aliased.Spriteset_Map.set('updateJabsSprites', Spriteset_Map.prototype.updateJabsSprites);
Spriteset_Map.prototype.updateJabsSprites = function()
{
  // perform original logic.
  J.PIXEL.EXT.ABS.Aliased.Spriteset_Map.get('updateJabsSprites').call(this);

  // also update the PIXEL-ABS reveal outlines.
  this.handlePixelAbsHitboxRevealOutlines();
};

/**
 * Creates the layer and sprite dictionary for PIXEL-ABS reveal hitboxes.
 */
Spriteset_Map.prototype.createPixelAbsHitboxRevealLayer = function()
{
  /**
   * The shared root namespace for all of J's plugin data.
   */
  this._j ||= {};

  /**
   * A grouping of all properties associated with PIXEL.
   */
  this._j._pixel ||= {};

  /**
   * A grouping of all properties associated with PIXEL-ABS.
   */
  this._j._pixel._abs ||= {};

  /**
   * The container for battler hitbox reveal outlines.
   * @type {Sprite}
   */
  this._j._pixel._abs._hitboxRevealLayer = new Sprite();

  /**
   * Direct tracking for reveal sprites by their stable key.
   * @type {Record<string, Sprite>}
   */
  this._j._pixel._abs._hitboxRevealSprites = {};

  // mount beside the existing battler overlay layers.
  this.addChild(this._j._pixel._abs._hitboxRevealLayer);
};

/**
 * Gets the PIXEL-ABS reveal outline layer.
 * @returns {Sprite}
 */
Spriteset_Map.prototype.getPixelAbsHitboxRevealLayer = function()
{
  return this._j._pixel._abs._hitboxRevealLayer;
};

/**
 * Gets the PIXEL-ABS reveal outline sprite dictionary.
 * @returns {Record<string, Sprite>}
 */
Spriteset_Map.prototype.getPixelAbsHitboxRevealSprites = function()
{
  return this._j._pixel._abs._hitboxRevealSprites;
};

/**
 * Updates the proximity-based hitbox reveal outlines for eligible battlers.
 */
Spriteset_Map.prototype.handlePixelAbsHitboxRevealOutlines = function()
{
  // if the full debug overlay is already visible, then skip these softer outlines.
  if ($jabsEngine.hitboxOverlaysVisible)
  {
    this.getPixelAbsHitboxRevealLayer().visible = false;
    this.purgePixelAbsHitboxRevealSprites([]);
    return;
  }

  // collect all battlers that should reveal their hitboxes right now.
  const items = this.collectPixelAbsHitboxRevealItems();

  // show the layer only while we have something to draw.
  const layer = this.getPixelAbsHitboxRevealLayer();
  layer.visible = items.length > 0;

  // if nothing is visible, then purge stale sprites and stop here.
  if (layer.visible === false)
  {
    this.purgePixelAbsHitboxRevealSprites(items);
    return;
  }

  // build, refresh, and purge the reveal sprites for this frame.
  this.buildMissingPixelAbsHitboxRevealSprites(items);
  this.refreshExistingPixelAbsHitboxRevealSprites(items);
  this.purgePixelAbsHitboxRevealSprites(items);
};

/**
 * Collects the battlers whose hitbox outlines should currently be revealed.
 * @returns {{ key:string, type:'battler', source: Game_Event }[]}
 */
Spriteset_Map.prototype.collectPixelAbsHitboxRevealItems = function()
{
  return this.collectActiveBattlerOverlayItems()
    .filter(item => item.type === 'battler')
    .filter(item => item.source.canShowPixelAbsHitboxReveal())
    .map(item =>
    {
      return {
        key: `pixel-reveal:${item.key}`,
        type: 'battler',
        source: item.source,
      };
    });
};

/**
 * Builds reveal sprites for any battlers that currently need one.
 * @param {{ key:string, type:'battler', source: Game_Event }[]} items The reveal items.
 */
Spriteset_Map.prototype.buildMissingPixelAbsHitboxRevealSprites = function(items)
{
  // get the container and dict for reveal sprites.
  const layer = this.getPixelAbsHitboxRevealLayer();
  const dict = this.getPixelAbsHitboxRevealSprites();

  // create any missing reveal sprites.
  items.forEach(item =>
  {
    // skip if the sprite already exists for this battler.
    if (dict[item.key]) return;

    // create, mark, and track the reveal sprite.
    const sprite = this.createBattlerHitboxSprite(item);
    sprite._pixelAbsRevealOutline = true;
    dict[item.key] = sprite;
    layer.addChild(sprite);
  });
};

/**
 * Refreshes the active reveal sprites for this frame.
 * @param {{ key:string, type:'battler', source: Game_Event }[]} items The reveal items.
 */
Spriteset_Map.prototype.refreshExistingPixelAbsHitboxRevealSprites = function(items)
{
  // quick access to tile size for the shared draw function.
  const tw = $gameMap.tileWidth();
  const th = $gameMap.tileHeight();

  // refresh each active reveal sprite.
  items.forEach(item =>
  {
    // locate or create the sprite for this battler.
    const sprite = this.getOrCreatePixelAbsHitboxRevealSprite(item);

    // place the sprite at the battler's feet.
    sprite.x = item.source.screenX();
    sprite.y = item.source.screenY();

    // compute the battler AABB from the shared runtime model.
    const aabb = JABS_Engine.getBattlerAabbModel(item.source);

    // draw the reveal outline using the shared battler hitbox function.
    this.drawBattlerHitboxInto(sprite, item.type, tw, th, false, aabb);
  });
};

/**
 * Retrieves or creates the reveal sprite for a given battler.
 * @param {{ key:string, type:'battler', source: Game_Event }} item The reveal item.
 * @returns {Sprite}
 */
Spriteset_Map.prototype.getOrCreatePixelAbsHitboxRevealSprite = function(item)
{
  // return the existing reveal sprite if it already exists.
  const dict = this.getPixelAbsHitboxRevealSprites();
  if (dict[item.key]) return dict[item.key];

  // otherwise, create and mount a new reveal sprite.
  const sprite = this.createBattlerHitboxSprite(item);
  sprite._pixelAbsRevealOutline = true;
  dict[item.key] = sprite;
  this.getPixelAbsHitboxRevealLayer().addChild(sprite);
  return sprite;
};

/**
 * Removes reveal sprites that no longer correspond to an active battler.
 * @param {{ key:string }[]} items The active reveal items.
 */
Spriteset_Map.prototype.purgePixelAbsHitboxRevealSprites = function(items)
{
  // compute the set of active reveal keys now.
  const active = new Set(items.map(item => item.key));

  // walk the dict and remove any reveal sprites whose keys are no longer active.
  const dict = this.getPixelAbsHitboxRevealSprites();
  const layer = this.getPixelAbsHitboxRevealLayer();

  Object.keys(dict)
    .forEach(key =>
    {
      if (active.has(key)) return;

      // detach and destroy the orphaned reveal sprite.
      const sprite = dict[key];
      if (sprite && sprite.parent === layer)
      {
        layer.removeChild(sprite);
      }

      this.destroyBattlerHitboxSprite(sprite);
      delete dict[key];
    });
};

/**
 * Extends {@link #drawBattlerHitboxInto}.<br>
 * Draws a softer outline-only style for PIXEL-ABS reveal sprites.
 * @param {Sprite} sprite The target battler hitbox sprite.
 * @param {'player'|'follower'|'battler'} type The kind of battler.
 * @param {number} tw Tile width in pixels.
 * @param {number} th Tile height in pixels.
 * @param {boolean} colliding Whether the battler overlaps any active action.
 * @param {JABS_Aabb} aabb The model rect for this battler in screen pixels.
 */
J.PIXEL.EXT.ABS.Aliased.Spriteset_Map.set('drawBattlerHitboxInto', Spriteset_Map.prototype.drawBattlerHitboxInto);
Spriteset_Map.prototype.drawBattlerHitboxInto = function(sprite, type, tw, th, colliding, aabb)
{
  // if this is not a reveal sprite, then perform original logic.
  if (sprite._pixelAbsRevealOutline !== true)
  {
    J.PIXEL.EXT.ABS.Aliased.Spriteset_Map.get('drawBattlerHitboxInto').call(
      this,
      sprite,
      type,
      tw,
      th,
      colliding,
      aabb);
    return;
  }

  // draw the softer reveal outline instead.
  this.drawPixelAbsRevealHitboxInto(sprite, aabb);
};

/**
 * Draws the softer PIXEL-ABS reveal outline into the battler hitbox sprite.
 * @param {Sprite} sprite The target reveal sprite.
 * @param {JABS_Aabb} aabb The model rect for this battler in screen pixels.
 */
Spriteset_Map.prototype.drawPixelAbsRevealHitboxInto = function(sprite, aabb)
{
  // get the graphics used to draw.
  /** @type {PIXI.Graphics} */
  const g = sprite._jabsHitboxG;

  // clear previous drawings for this frame.
  g.clear();

  // apply the softer outline style.
  const style = this.getPixelAbsRevealHitboxStyle();
  this.applyHitboxStyle(g, style);

  // compute local offsets relative to the battler feet.
  const localX = aabb.x - sprite.x;
  const localY = aabb.y - sprite.y;

  // draw the model rect exactly so visuals match physics.
  g.drawRect(localX, localY, aabb.w, aabb.h);
  g.endFill();
};

/**
 * Gets the style used for PIXEL-ABS hitbox reveal outlines.
 * @returns {{ fillColor:number, fillAlpha:number, lineColor:number, lineAlpha:number, lineWidth:number }}
 */
Spriteset_Map.prototype.getPixelAbsRevealHitboxStyle = function()
{
  // mirror the pulse highlight's soft white styling, but without any fill.
  const pulseStyle = J.ABS.Metadata.HitboxPulse;

  return {
    fillColor: pulseStyle.fillColor,
    fillAlpha: 0.0,
    lineColor: pulseStyle.lineColor,
    lineAlpha: 0.35,
    lineWidth: pulseStyle.lineWidth,
  };
};
//endregion Spriteset_Map
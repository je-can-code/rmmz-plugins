if (J.HUD && J.HUD.EXT.PARTY)
{
  /**
   * The type of gauge for shields.
   */
  Window_PartyFrame.gaugeTypes.Shield = 'shield';

  //region caching
  /**
   * Creates the key for an actor's shield gauge sprite based on the parameters.
   * @param {Game_Actor} actor The actor to draw a composite shield gauge for.
   * @param {boolean} isFull Whether or not this is for a full-sized sprite.
   * @returns {string} The key for this shield gauge sprite.
   */
  Window_PartyFrame.prototype.makeShieldGaugeSpriteKey = function(actor, isFull)
  {
    // identify the size variant for cache keying.
    const gaugeSize = isFull
      ? 'full'
      : 'mini';

    // return a deterministic cache key for this actor + size.
    return `shield-${gaugeSize}-${actor.name()}-${actor.actorId()}`;
  };

  /**
   * Creates a full-sized composite shield gauge sprite for the given actor and caches it.
   * @param {Game_Actor} actor The actor to draw a shield gauge sprite for.
   * @returns {Sprite_ShieldMapGauge} The shield gauge sprite.
   */
  Window_PartyFrame.prototype.getOrCreateFullSizeShieldGaugeSprite = function(actor)
  {
    // the key for this actor's full gauge sprite.
    const key = this.makeShieldGaugeSpriteKey(actor, true);

    // check if the key already maps to a cached sprite.
    if (this._hudSprites.has(key))
    {
      // if it does, just return that.
      return this._hudSprites.get(key);
    }

    // determine gauge width based on gauge type.
    const hpGauge = this.getOrCreateFullSizeGaugeSprite(actor, Window_PartyFrame.gaugeTypes.HP);
    const bitmapWidth = hpGauge.bitmapWidth();
    const bitmapHeight = 8;
    const gaugeHeight = 8;

    // create a new full-width short-height gauge sprite of the actor.
    const sprite = new Sprite_ShieldMapGauge(bitmapWidth, bitmapHeight, gaugeHeight);

    // setup the gauge sprite to point to the actor.
    sprite.setup(actor, Window_PartyFrame.gaugeTypes.Shield);

    // deactivate the gauge to prevent updating until its necessary.
    sprite.deactivateGauge();

    // cache the sprite.
    this._hudSprites.set(key, sprite);

    // hide the sprite for now.
    sprite.hide();

    // add the sprite to tracking.
    this.addChild(sprite);

    // return the created sprite.
    return sprite;
  };

  /**
   * Creates a mini-sized composite shield gauge sprite for the given actor and caches it.
   * @param {Game_Actor} actor The actor to draw a shield gauge sprite for.
   * @returns {Sprite_ShieldMapGauge} The shield gauge sprite.
   */
  Window_PartyFrame.prototype.getOrCreateMiniSizeShieldGaugeSprite = function(actor)
  {
    // build the cache key for this actor's mini-size shield sprite.
    const key = this.makeShieldGaugeSpriteKey(actor, false);

    // if we already have one cached, reuse it.
    if (this._hudSprites.has(key))
    {
      // return the cached instance.
      return this._hudSprites.get(key);
    }

    // create the shield gauge using the mini HP gauge’s nominal width and a thin height.
    const hpGauge = this.getOrCreateMiniSizeGaugeSprite(actor, Window_PartyFrame.gaugeTypes.HP);
    const bitmapWidth = hpGauge.bitmapWidth();
    const bitmapHeight = 4;
    const gaugeHeight = 4;

    // create a new full-width short-height gauge sprite of the actor.
    const sprite = new Sprite_ShieldMapGauge(bitmapWidth, bitmapHeight, gaugeHeight);

    // setup the gauge sprite to point to the actor.
    sprite.setup(actor, Window_PartyFrame.gaugeTypes.Shield);

    // deactivate the gauge to prevent updating until its necessary.
    sprite.deactivateGauge();

    // cache the sprite.
    this._hudSprites.set(key, sprite);

    // hide the sprite for now.
    sprite.hide();

    // add the sprite to tracking.
    this.addChild(sprite);

    // return the created sprite.
    return sprite;
  };

  /**
   * Creates the key for an actor's shield value sprite.
   * @param {Game_Actor} actor The actor to draw a shield value sprite for.
   * @returns {string} The key for this shield value sprite.
   */
  Window_PartyFrame.prototype.makeShieldValueSpriteKey = function(actor)
  {
    // return a deterministic cache key for this actor’s shield values.
    return `shield-values-full-${actor.name()}-${actor.actorId()}`;
  };

  /**
   * Creates a full-sized shield value sprite for the given actor and caches it.
   * Only used for the party leader.
   * @param {Game_Actor} actor The actor to draw a shield value sprite for.
   * @returns {Sprite_ActorValue} The shield value sprite.
   */
  Window_PartyFrame.prototype.getOrCreateShieldValueSprite = function(actor)
  {
    // build the cache key for this actor's shield value sprite.
    const key = this.makeShieldValueSpriteKey(actor);

    // check cache.
    if (this._hudSprites.has(key))
    {
      return this._hudSprites.get(key);
    }

    // create and set up the value sprite for shields.
    const sprite = new Sprite_ActorValue(actor, Window_PartyFrame.gaugeTypes.Shield, -6);

    // cache the sprite.
    this._hudSprites.set(key, sprite);

    // hide the sprite for now.
    sprite.hide();

    // add the sprite to tracking.
    this.addChild(sprite);

    // return the created sprite.
    return sprite;
  };

  /**
   * Creates all sprites for this hud and caches them.
   */
  J.ABS.EXT.SHIELD.Aliased.Window_PartyFrame.set('createCache', Window_PartyFrame.prototype.createCache);
  Window_PartyFrame.prototype.createCache = function()
  {
    // establish the gauge types we will create.
    J.ABS.EXT.SHIELD.Aliased.Window_PartyFrame.get('createCache')
      .call(this);

    // iterate over each of the battle members in the party.
    $gameParty.battleMembers()
      .forEach(actor =>
      {
        // cache the full-sized shield gauges for each actor.
        this.getOrCreateFullSizeShieldGaugeSprite(actor);

        // cache the mini-sized shield gauges for each actor.
        this.getOrCreateMiniSizeShieldGaugeSprite(actor);
      });
  };
  //endregion caching

  /**
   * Extends {@link #drawLeaderResourceGauges}.<br/>
   * Calls original, then overlays the composite shield gauge on the HP gauge.
   * @param {number} x The x coordinate of the leader resource gauge group.
   * @param {number} y The y coordinate of the leader resource gauge group.
   */
  J.ABS.EXT.SHIELD.Aliased.Window_PartyFrame.set(
    'drawLeaderResourceGauges',
    Window_PartyFrame.prototype.drawLeaderResourceGauges
  );
  Window_PartyFrame.prototype.drawLeaderResourceGauges = function(x, y)
  {
    // perform original logic for drawing HP/MP/TP and numbers.
    J.ABS.EXT.SHIELD.Aliased.Window_PartyFrame.get('drawLeaderResourceGauges')
      .call(this, x, y);

    // draw the shield gauge as well.
    this.drawLeaderShieldGauge(x, y);
  };

  /**
   * Draws the composite shield gauge on the HP gauge.
   * @param {number} x The x coordinate.
   * @param {number} y The y coordinate.
   */
  Window_PartyFrame.prototype.drawLeaderShieldGauge = function(x, y)
  {
    // grab the party leader.
    const leader = $gameParty.leader();

    // acquire the HP gauge sprite used for size/position reference.
    const hpGauge = this.getOrCreateFullSizeGaugeSprite(leader, Window_PartyFrame.gaugeTypes.HP);

    // define the overlay height (thin strip) for full-size HP.
    const overlayH = 4;

    // center the overlay vertically on the HP gauge's height.
    const overlayY = y + Math.floor((hpGauge.bitmapHeight() - overlayH) / 2) - 14;

    // create or reuse the composite shield gauge sized to the HP bar.
    const shield = this.getOrCreateFullSizeShieldGaugeSprite(leader);

    // sprites must be activated to draw.
    shield.activateGauge();

    // position to match HP bar.
    const shieldX = x;
    shield.move(shieldX, overlayY);
    shield.show();

    // get or create the shield value sprite for the leader.
    const shieldValues = this.getOrCreateShieldValueSprite(leader);

    // activate and position the numbers near the HP numbers.
    const shieldValuesX = x + 12;
    shieldValues.move(shieldValuesX, overlayY - 12);
    shieldValues.show();
  };

  /**
   * Extends/Overrides {@link #drawAllyGauges}.<br/>
   * Calls original, then overlays the composite shield gauge on the ally HP gauge.
   * @param {Game_Actor} ally The ally to draw the gauges for.
   * @param {number} x The x coordinate.
   * @param {number} oy The original y coordinate.
   */
  J.ABS.EXT.SHIELD.Aliased.Window_PartyFrame.set('drawAllyGauges', Window_PartyFrame.prototype.drawAllyGauges);
  Window_PartyFrame.prototype.drawAllyGauges = function(ally, x, oy)
  {
    // perform original logic for drawing mini HP/MP/TP.
    J.ABS.EXT.SHIELD.Aliased.Window_PartyFrame.get('drawAllyGauges')
      .call(this, ally, x, oy);

    // draw the shield gauge as well.
    this.drawAllyShieldGauge(ally, x, oy);
  };

  /**
   * Draws the composite shield gauge on the ally HP gauge.
   * @param {Game_Actor} ally The ally to draw the shield gauge for.
   * @param {number} x The x coordinate.
   * @param {number} oy The original y coordinate.
   */
  Window_PartyFrame.prototype.drawAllyShieldGauge = function(ally, x, oy)
  {
    // determine the line height for mini gauges.
    const lh = 12;

    // acquire the mini HP gauge sprite used for size/position reference.
    const hpGauge = this.getOrCreateMiniSizeGaugeSprite(ally, Window_PartyFrame.gaugeTypes.HP);

    // define the overlay height (thin strip) for mini-size HP.
    const overlayH = 3;

    // compute the top y of the mini HP gauge line.
    const hpY = oy + (lh * 0);

    // center the overlay vertically on the mini HP gauge's height.
    const overlayY = hpY + Math.floor((hpGauge.bitmapHeight() - overlayH) / 2) - 6;

    // create or reuse the composite shield gauge sized to the mini HP bar.
    const shield = this.getOrCreateMiniSizeShieldGaugeSprite(ally);

    // sprites must be activated to draw.
    shield.activateGauge();

    // Position to match HP bar.
    const shieldX = x;
    shield.move(shieldX, overlayY);
    shield.show();
  };
}
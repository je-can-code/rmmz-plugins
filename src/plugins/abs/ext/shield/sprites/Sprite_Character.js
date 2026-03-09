//region Sprite_Character
/**
 * Extends {@link #initGaugeMembers}.<br/>
 * Adds the shield gauge slot to the gauge group.
 */
J.ABS.EXT.SHIELD.Aliased.Sprite_Character.set('initGaugeMembers', Sprite_Character.prototype.initGaugeMembers);
Sprite_Character.prototype.initGaugeMembers = function()
{
  // perform original logic.
  J.ABS.EXT.SHIELD.Aliased.Sprite_Character.get('initGaugeMembers')
    .call(this);

  /**
   * The shield gauge for this sprite.
   * @type {Sprite_ShieldMapGauge|null}
   */
  this._j._abs._gauges._shieldGauge = null;
};

/**
 * Extends {@link #setupMapSprite}.<br/>
 * Also sets up the on-map shield gauge.
 */
J.ABS.EXT.SHIELD.Aliased.Sprite_Character.set('setupMapSprite', Sprite_Character.prototype.setupMapSprite);
Sprite_Character.prototype.setupMapSprite = function()
{
  // perform original logic.
  J.ABS.EXT.SHIELD.Aliased.Sprite_Character.get('setupMapSprite')
    .call(this);

  // setup the shield gauge above the hp gauge.
  this.setupShieldGauge();
};

/**
 * Sets up this character's shield gauge, to show shields as-needed.
 */
Sprite_Character.prototype.setupShieldGauge = function()
{
  // if we already have a shield gauge sprite available, just (re)bind and reposition it.
  if (this._j._abs._gauges._shieldGauge)
  {
    // bind the current battler to the shield gauge sprite.
    this._j._abs._gauges._shieldGauge.setup(this.getBattler(), 'shield');

    // ensure it’s ready to update when needed (visibility is controlled elsewhere).
    this._j._abs._gauges._shieldGauge.activateGauge();

    // reposition in case dimensions changed (defensive; typically unchanged).
    const sprite = this._j._abs._gauges._shieldGauge;

    // center it horizontally, stack it between Cast (-28) and HP (-12).
    const x = -Math.round(sprite.bitmapWidth() / 2);
    const y = 0;
    sprite.move(x, y);

    // finished (no need to recreate).
    return;
  }

  // create a dedicated shield gauge sprite and keep it activated.
  const baseWidth = 96;
  const baseHeight = 6;
  const sprite = new Sprite_ShieldMapGauge(baseWidth, baseHeight, 6);

  // bind the battler and status type for the MapGauge internals.
  sprite.setup(this.getBattler(), 'shield');
  sprite.activateGauge();

  // assign for later access.
  this._j._abs._gauges._shieldGauge = sprite;

  // position between the cast and hp gauges (centered like cast).
  const x = -Math.round(sprite.bitmapWidth() / 2);
  const y = 0;
  sprite.move(x, y);

  // add to this character's sprite.
  this.addChild(sprite);
};

/**
 * Extends {@link #updateGauges}.<br/>
 * Also updates the shield gauge using the same pattern as HP/Cast.
 */
J.ABS.EXT.SHIELD.Aliased.Sprite_Character.set('updateGauges', Sprite_Character.prototype.updateGauges);
Sprite_Character.prototype.updateGauges = function()
{
  // perform original logic (HP + Cast branches).
  J.ABS.EXT.SHIELD.Aliased.Sprite_Character.get('updateGauges')
    .call(this);

  // check if we can update the shield gauge.
  if (this.canUpdateShieldGauge())
  {
    // update it.
    this.updateShieldGauge();
  }
  // otherwise, if we can't update it...
  else
  {
    // then hide it.
    this.hideShieldGauge();
  }
};

/**
 * Determines whether or not we can update the shield gauge.
 * @returns {boolean} True if we can update the shield gauge, false otherwise.
 */
Sprite_Character.prototype.canUpdateShieldGauge = function()
{
  // if we're not using JABS, then it shouldn't update.
  if (!this.canUpdate()) return false;

  // if this sprite doesn't have a battler, then it shouldn't update.
  if (!this.isJabsBattler()) return false;

  // if we don't have a shield gauge sprite, we can't update it.
  if (!this._j._abs._gauges._shieldGauge) return false;

  // require some shield to be present to show on the map.
  const battler = this.getBattler();
  if (!battler) return false;
  if (battler.currentShieldValue() <= 0) return false;

  // ready to update this frame.
  return true;
};

/**
 * Updates the shield gauge sprite.
 */
Sprite_Character.prototype.updateShieldGauge = function()
{
  // make sure we show it while shields exist (we only get here when canUpdateShieldGauge() is true).
  this.showShieldGauge();

  // ensure the gauge rebinds if battler swapped underneath (post-swap safe).
  const gauge = this._j._abs._gauges._shieldGauge;
  if (gauge)
  {
    // keep the underlying base battler fresh for Sprite_Gauge internals.
    gauge._battler = this.getBattler();
  }
};

/**
 * Shows the shield gauge if it exists.
 */
Sprite_Character.prototype.showShieldGauge = function()
{
  const gauge = this._j._abs._gauges._shieldGauge;
  if (gauge)
  {
    gauge.activateGauge();
    gauge.show();
  }
};

/**
 * Hides the shield gauge if it exists.
 */
Sprite_Character.prototype.hideShieldGauge = function()
{
  const gauge = this._j._abs._gauges._shieldGauge;
  if (gauge)
  {
    gauge.hide();
  }
};

//endregion Sprite_Character
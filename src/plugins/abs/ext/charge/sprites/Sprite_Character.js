//region Sprite_Character
import Sprite_MapChargeGauge from './Sprite_MapChargeGauge.js';

/**
 * Extends {@link #initGaugeMembers}.<br/>
 * Also initializes the charge gauge member.
 */
J.ABS.EXT.CHARGE.Aliased.Sprite_Character.set('initGaugeMembers', Sprite_Character.prototype.initGaugeMembers);
Sprite_Character.prototype.initGaugeMembers = function()
{
  // perform original logic.
  J.ABS.EXT.CHARGE.Aliased.Sprite_Character.get('initGaugeMembers').call(this);

  /**
   * The charge gauge for this sprite.
   * @type {Sprite_MapChargeGauge|null}
   */
  this._j._abs._gauges._chargeGauge = null;
};

/**
 * Extends {@link #setupMapSprite}.<br/>
 * Also sets up the charge gauge.
 */
J.ABS.EXT.CHARGE.Aliased.Sprite_Character.set('setupMapSprite', Sprite_Character.prototype.setupMapSprite);
Sprite_Character.prototype.setupMapSprite = function()
{
  // perform original logic.
  J.ABS.EXT.CHARGE.Aliased.Sprite_Character.get('setupMapSprite').call(this);

  // also setup the charge gauge above the hp gauge.
  this.setupChargeGauge();
};

/**
 * Sets up this character's charge gauge, which shows tier progress while charging.
 */
Sprite_Character.prototype.setupChargeGauge = function()
{
  // determine the current battler and character for this sprite.
  const jabsBattler = this._character.getJabsBattler();
  const expectedCharacter = this._character;

  // if we already have a charge gauge, rebind it to the current battler/character and exit.
  if (this._j._abs._gauges._chargeGauge)
  {
    // rebind for charge logic and validity.
    this._j._abs._gauges._chargeGauge.setupJabs(jabsBattler, expectedCharacter);

    // ensure it's ready to update when needed.
    this._j._abs._gauges._chargeGauge.activateGauge();

    // reposition defensively in case dimensions changed.
    const sprite = this._j._abs._gauges._chargeGauge;
    sprite.move(-Math.round(sprite.bitmapWidth() / 2), -28);

    return;
  }

  // create a dedicated charge gauge sprite.
  const sprite = new Sprite_MapChargeGauge();

  // bind the JABS battler and expected character.
  sprite.setupJabs(jabsBattler, expectedCharacter);
  sprite.activateGauge();

  // assign for later access.
  this._j._abs._gauges._chargeGauge = sprite;

  // position at the same slot as the cast gauge; only one is ever visible at a time.
  sprite.move(-Math.round(sprite.bitmapWidth() / 2), -28);

  // add to this character's sprite.
  this.addChild(sprite);
};

/**
 * Extends {@link #updateGauges}.<br/>
 * Also updates the charge gauge.
 */
J.ABS.EXT.CHARGE.Aliased.Sprite_Character.set('updateGauges', Sprite_Character.prototype.updateGauges);
Sprite_Character.prototype.updateGauges = function()
{
  // perform original logic.
  J.ABS.EXT.CHARGE.Aliased.Sprite_Character.get('updateGauges').call(this);

  // update or hide the charge gauge depending on whether the battler is charging.
  if (this.canUpdateChargeGauge())
  {
    this.updateChargeGauge();
  }
  else
  {
    this.hideChargeGauge();
  }
};

/**
 * Determines whether or not we can update the charge gauge.
 * @returns {boolean} True if we can update the charge gauge, false otherwise.
 */
Sprite_Character.prototype.canUpdateChargeGauge = function()
{
  // if we're not using JABS, then it shouldn't update.
  if (!this.canUpdate()) return false;

  // if this sprite doesn't have a battler, then it shouldn't update.
  if (!this.isJabsBattler()) return false;

  // if we don't have a charge gauge sprite, we can't update it.
  if (!this._j._abs._gauges._chargeGauge) return false;

  // use the current JABS battler's live charging state as the gate.
  const jabs = this._character.getJabsBattler();
  if (!jabs) return false;

  // must be actively charging.
  if (!jabs.isCharging()) return false;

  return true;
};

/**
 * Updates the charge gauge sprite.
 */
Sprite_Character.prototype.updateChargeGauge = function()
{
  // make sure we show it while charging.
  this.showChargeGauge();

  // ensure the gauge rebinds if host or battler changed.
  const gauge = this._j._abs._gauges._chargeGauge;
  if (gauge)
  {
    const currentJabs = this._character.getJabsBattler();

    // rebind if anything about the binding has drifted.
    const needsRebind = (
      gauge._jabsBattler !== currentJabs ||
      gauge._expectedCharacter !== this._character ||
      gauge._expectedUuid !== (currentJabs ? currentJabs.getUuid() : null)
    );

    if (needsRebind)
    {
      gauge.setupJabs(currentJabs, this._character);
    }

    // keep the underlying base battler fresh for Sprite_Gauge internals.
    gauge._battler = this.getBattler();
  }
};

/**
 * Shows the charge gauge if it exists.
 */
Sprite_Character.prototype.showChargeGauge = function()
{
  const gauge = this._j._abs._gauges._chargeGauge;
  if (gauge)
  {
    gauge.activateGauge();
    gauge.show();
  }
};

/**
 * Hides the charge gauge if it exists.
 */
Sprite_Character.prototype.hideChargeGauge = function()
{
  const gauge = this._j._abs._gauges._chargeGauge;
  if (gauge)
  {
    gauge.hide();
  }
};
//endregion Sprite_Character

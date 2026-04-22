//region Sprite_Character
/**
 * Extends {@link #getBattlerName}.<br/>
 * Considers passive tier states for {@link JABS_BattlerName#colorHex} (map stripe).
 * Tier label copy is composed in the HUD target frame.
 * @returns {JABS_BattlerName}
 */
J.PASSIVE.EXT.ABS.Aliased.Sprite_Character.set('getBattlerName', Sprite_Character.prototype.getBattlerName);
Sprite_Character.prototype.getBattlerName = function()
{
  // perform original logic.
  /** @type {JABS_BattlerName} */
  const battlerName = J.PASSIVE.EXT.ABS.Aliased.Sprite_Character.get('getBattlerName')
    .call(this);

  // apply passive tier accent for the map nameplate stripe.
  this.applyPassiveMapTierAccent(battlerName);

  // return the updated name.
  return battlerName;
};

/**
 * Sets {@link JABS_BattlerName#colorHex} from the first tier-prefix passive state.
 * Map stripe and HUD may reuse the same field for tinting.
 * @param {JABS_BattlerName} battlerName The battler's name.
 */
Sprite_Character.prototype.applyPassiveMapTierAccent = function(battlerName)
{
  // if there is no battler, or this isn't an enemy map nameplate use-case, don't worry about the color.
  if (this.canApplyPassiveMapTierAccent() === false) return;

  // grab the battler.
  const battler = this.getBattler();

  // share the exact same tier-prefix → tierColorHex rule as the HUD target frame (see J.PASSIVE.EXT.ABS).
  const tierStripeHex = J.PASSIVE.EXT.ABS.Helpers.resolvePassiveTierStripeColorHex(battler);

  // only touch the name bag when we actually resolved a stripe color (pure helper returns empty otherwise).
  if (tierStripeHex !== String.empty)
  {
    battlerName.colorHex = tierStripeHex;
  }
};

/**
 * Determines whether or not passive map tier accent should be considered for this sprite.
 * @returns {boolean} True if the battler name color may be modified, false otherwise.
 */
Sprite_Character.prototype.canApplyPassiveMapTierAccent = function()
{
  // grab the battler.
  const battler = this.getBattler();

  // if there is no battler, don't worry about the name.
  if (!battler) return false;

  // if the battler isn't an enemy, then don't worry about the name.
  if (battler.isEnemy() === false) return false;

  return true;
};
//endregion Sprite_Character
//region Sprite_ActorValue
/**
 * Extends {@link #initMembers}.<br/>
 * Also initializes the shield value.
 */
J.ABS.EXT.SHIELD.Aliased.Sprite_ActorValue.set('initMembers', Sprite_ActorValue.prototype.initMembers);
Sprite_ActorValue.prototype.initMembers = function(actor, parameter, fontSizeMod)
{
  // perform original logic.
  J.ABS.EXT.SHIELD.Aliased.Sprite_ActorValue.get('initMembers')
    .call(this, actor, parameter, fontSizeMod);

  /**
   * The last tracked shield value.
   * @type {string}
   */
  this._j._last._shields = this.makeShieldValue();
};

/**
 * A factory method to create the shield value string.
 * @param {Game_Actor} actor The actor to generate the shield value for.
 * @returns {string} The shield value as a string 'current / (total)'.
 */
Sprite_ActorValue.prototype.makeShieldValue = function(actor)
{
  // if there is no actor for some reason, return an empty string.
  if (!actor) return String.empty;

  // grab the current shield value.
  const currentShields = actor.currentShieldValue();

  // if there are no shields, return an empty string.
  if (currentShields === 0) return String.empty;

  // return the shield value.
  let shieldLabel = `(${currentShields})`;

  // check if there are multiple stacks on the shield.
  if (actor.currentShieldStacks() > 1)
  {
    // append the stack count.
    shieldLabel += `${actor.currentShieldStacks()}x🛡`
  }

  // return the shield value.
  return shieldLabel;
};

/**
 * Gets the last tracked shield value.
 * @returns {string}
 */
Sprite_ActorValue.prototype.getLastShieldValue = function()
{
  return this._j._last._shields;
};

/**
 * Sets the last tracked shield value.
 * @param {string} value The shield value as a string 'current / (total)'.
 */
Sprite_ActorValue.prototype.setLastShieldValue = function(value)
{
  this._j._last._shields = value;
};

/**
 * Extends {@link #hasParameterChanged}.<br/>
 * Also considers the shield values for change.
 */
J.ABS.EXT.SHIELD.Aliased.Sprite_ActorValue.set('hasParameterChanged', Sprite_ActorValue.prototype.hasParameterChanged);
Sprite_ActorValue.prototype.hasParameterChanged = function()
{
  // perform original logic.
  const originalChange = J.ABS.EXT.SHIELD.Aliased.Sprite_ActorValue.get('hasParameterChanged')
    .call(this);

  // if something else changed, then return true.
  if (originalChange === true) return true;

  // only consider if this is a shield gauge.
  if (this.getParameter() === Window_PartyFrame.gaugeTypes.Shield)
  {
    // determine the current shield value.
    const currentShieldValue = this.makeShieldValue(this.getActor());

    // compare current against the previous shield value.
    if (this.getLastShieldValue() !== currentShieldValue)
    {
      // update the shield value.
      this.setLastShieldValue(currentShieldValue);

      // reflect it changed.
      return true;
    }
  }

  // nothing changed.
  return false;
};

/**
 * Extends {@link #getActorValue}.<br/>
 * Also gets the shield value if applicable.
 */
J.ABS.EXT.SHIELD.Aliased.Sprite_ActorValue.set('getActorValue', Sprite_ActorValue.prototype.getActorValue);
Sprite_ActorValue.prototype.getActorValue = function()
{
  // perform original logic.
  const originalValue = J.ABS.EXT.SHIELD.Aliased.Sprite_ActorValue.get('getActorValue')
    .call(this);

  // return the original value if it is present.
  if (originalValue !== null) return originalValue;

  // check if the parameter is the shield.
  if (this.getParameter() === Window_PartyFrame.gaugeTypes.Shield)
  {
    // return the shield value.
    return this.makeShieldValue(this.getActor());
  }

  // otherwise return null- its something else.
  return null;
};

//endregion Sprite_ActorValue
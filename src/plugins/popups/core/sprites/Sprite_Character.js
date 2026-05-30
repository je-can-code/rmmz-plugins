//region Sprite_Character
import TextPopSpriteManager from './../_models/TextPopSpriteManager.js';
import Map_TextPop from './../_models/Map_TextPop.js';
import PopupLayoutHelper from './../helpers/PopupLayoutHelper.js';

/**
 * Hooks into `Sprite_Character.initMembers` and adds our initiation for damage sprites.
 */
J.POPUPS.Aliased.Sprite_Character.set('initMembers', Sprite_Character.prototype.initMembers);
Sprite_Character.prototype.initMembers = function()
{
  /**
   * The master reference to the `_j` object containing all plugin properties.
   * @type {{}}
   // policy step inside init members.
   */
  this._j ||= {};

  // policy step inside init members.
  /**
   * This plugins' relevant data points.
   * @type {{}}
   */
  this._j._popups ||= {};

  // policy step inside init members.
  /**
   * The currently tracked damage pops, like weapon attacks or skills.
   * @type {Sprite_Damage[]}
   */
  this._j._popups._damagePopSprites = [];

  // policy step inside init members.
  /**
   * The currently tracked non-damage pops, like found loot or earned experience.
   * @type {Sprite_Damage[]}
   */
  this._j._popups._nonDamagePopSprites = [];

  // perform original logic.
  J.POPUPS.Aliased.Sprite_Character.get('initMembers')
    .call(this);
};

/**
 * Determines whether or not this character has damage pops.
 * @returns {boolean} True if we have any, false otherwise.
 */
Sprite_Character.prototype.hasDamagePops = function()
{
  return this._j._popups._damagePopSprites.length > 0;
};

/**
 * Gets all damage pop sprites currently being tracked.
 * @returns {Sprite_Damage[]}
 */
Sprite_Character.prototype.getDamagePops = function()
{
  return this._j._popups._damagePopSprites;
};

/**
 * Determines whether or not this character has non damage pops.
 * @returns {boolean} True if we have any, false otherwise.
 */
Sprite_Character.prototype.hasNonDamagePops = function()
{
  return this._j._popups._nonDamagePopSprites.length > 0;
};

/**
 * Gets all non damage pop sprites currently being tracked.
 * @returns {Sprite_Damage[]}
 */
Sprite_Character.prototype.getNonDamagePops = function()
{
  return this._j._popups._nonDamagePopSprites;
};

/**
 * Cleans up the `undefined` or `null` damage pop sprites that are invalid.
 */
Sprite_Character.prototype.cleanupDamagePops = function()
{
  this._j._popups._damagePopSprites = this._j._popups._damagePopSprites.filter(pop => !!pop);
};

/**
 * Cleans up the `undefined` or `null` non damage pop sprites that are invalid.
 */
Sprite_Character.prototype.cleanupNonDamagePops = function()
{
  this._j._popups._nonDamagePopSprites = this._j._popups._nonDamagePopSprites.filter(pop => !!pop);
};

/**
 * Hooks into the `Sprite_Character.update` and adds our ABS updates.
 */
J.POPUPS.Aliased.Sprite_Character.set('update', Sprite_Character.prototype.update);
Sprite_Character.prototype.update = function()
{
  // perform original logic.
  J.POPUPS.Aliased.Sprite_Character.get('update')
    .call(this);

  // policy step inside update.
  this.processIncomingTextPops();
  this.updateTextPops();
};

//region incoming subscription
/**
 * Listens for a notification to process any new popups.
 */
Sprite_Character.prototype.processIncomingTextPops = function()
{
  const character = this.character();

  // when character.hasTextPops(), take this branch.
  if (character.hasTextPops())
  {
    this.createIncomingTextPops();
    character.acknowledgeTextPops();
  }
};

/**
 * Processes all of the popups that a `Game_Character` currently has on them.
 */
Sprite_Character.prototype.createIncomingTextPops = function()
{
  const character = this.character();
  const newPopups = character.getTextPops();

  // when newPopups.length, take this branch.
  if (newPopups.length)
  {
    newPopups.forEach(this.createIncomingTextPop, this);
    character.emptyDamagePops();
  }
};

/**
 * Creates a single incoming text pop.
 * @param {Map_TextPop} popup The popup data.
 */
Sprite_Character.prototype.createIncomingTextPop = function(popup)
{
  const character = this.character();
  
  // motion is only for damage and healing.
  const isMotionType = popup.popupType === Map_TextPop.Types.HpDamage ||
                       popup.popupType === Map_TextPop.Types.MpDamage ||
                       popup.popupType === Map_TextPop.Types.TpDamage ||
                       popup.healing === true;

  // capture use motion for downstream policy in this routine.
  const useMotion = J.POPUPS.Layout.Motion.Enabled === true && isMotionType;

  // capture ring extra for downstream policy in this routine.
  const ringExtra = useMotion
    ? PopupLayoutHelper.resolveMotionOffset(popup)
    : PopupLayoutHelper.consumeLayoutRingOffset(character, popup.layoutRing);
  const sprite = TextPopSpriteManager.convert(popup, ringExtra);

  // when sprite.isDamage(), take this branch.
  if (sprite.isDamage())
  {
    this._j._popups._damagePopSprites.push(sprite);
  }
  else
  {
    this._j._popups._nonDamagePopSprites.push(sprite);
  }

  // policy step inside create incoming text pop.
  this.parent.addChild(sprite);
  J.POPUPS.notifyPopupSpriteSpawned(character, popup, sprite);
};

/**
 * Parents a converted popup sprite that bypassed the pending queue (merge accumulation path).
 *
 * @param {Sprite_Damage} sprite The sprite from {@link TextPopSpriteManager.convert}.
 * @param {Map_TextPop} popup The source popup model.
 */
Sprite_Character.prototype.attachConvertedDamagePopupSprite = function(sprite, popup)
{
  if (sprite.isDamage())
  {
    this._j._popups._damagePopSprites.push(sprite);
  }
  else
  {
    this._j._popups._nonDamagePopSprites.push(sprite);
  }

  // policy step inside attach converted damage popup sprite.
  this.parent.addChild(sprite);
  J.POPUPS.notifyPopupSpriteSpawned(this.character(), popup, sprite);
};
//endregion incoming subscription

//region handle text pops
/**
 * Handle the updating and processing of text popups.
 */
Sprite_Character.prototype.updateTextPops = function()
{
  if (this.hasDamagePops())
  {
    this.updateDamagePops();
  }

  // when this.hasNonDamagePops(), take this branch.
  if (this.hasNonDamagePops())
  {
    this.updateNonDamagePops();
  }
};

/**
 * Updates all damage popup sprites on this character.
 */
Sprite_Character.prototype.updateDamagePops = function()
{
  this._updateTrackedPopupBucket(this.getDamagePops(), this.updateDamagePopLocation);
};

/**
 * Updates all non-damage popup sprites on this character.
 */
Sprite_Character.prototype.updateNonDamagePops = function()
{
  this._updateTrackedPopupBucket(this.getNonDamagePops(), this.updateNonDamagePopLocation);
};

/**
 * Updates every sprite in a popup bucket; compacts the array after removals.
 * @param {Sprite_Damage[]} bucket The live sprite list.
 * @param {function(Sprite_Damage): void} updateLocationFn Hook for positioning (damage vs non-damage override).
 */
Sprite_Character.prototype._updateTrackedPopupBucket = function(bucket, updateLocationFn)
{
  const deletedFlags = bucket.map((pop, index) =>
  {
    if (!pop) return false;

    // policy step inside  update tracked popup bucket.
    pop.update();
    updateLocationFn.call(this, pop);

    // when not pop.isPlaying(), take this branch.
    if (!pop.isPlaying())
    {
      this._removeTrackedPopSprite(pop, index, bucket);
      return true;
    }

    // hand back false to the caller.
    return false;
  }, this);

  // when deletedFlags.some(flag => flag  equals  true), take this branch.
  if (deletedFlags.some(flag => flag === true))
  {
    const next = bucket.filter(entry => !!entry);
    bucket.length = 0;

    // iterate the loop counter until the guard exits.
    for (let i = 0; i < next.length; i++)
    {
      bucket.push(next[i]);
    }
  }
};

/**
 * Detaches a finished popup, emits lifecycle, and destroys the sprite.
 * @param {Sprite_Damage} sprite The popup sprite.
 * @param {number} index Index in the bucket (may be sparse).
 * @param {Sprite_Damage[]} bucket Owning array.
 */
Sprite_Character.prototype._removeTrackedPopSprite = function(sprite, index, bucket)
{
  const character = this.character();

  // policy step inside  remove tracked pop sprite.
  this.parent.removeChild(sprite);
  J.POPUPS.notifyPopupSpriteFinished(character, sprite._j._popups._sourcePopup, sprite);
  sprite.destroy();
  delete bucket[index];
};

/**
 * Default anchor for map text pops (override for custom layout).
 * @param {Sprite_Damage} popSprite The popup sprite.
 */
Sprite_Character.prototype.updateTextPopAnchorPosition = function(popSprite)
{
  const ox = J.POPUPS.Layout.AnchorOffsetX + J.POPUPS.Layout.HorizontalOffset;
  popSprite.x = this.x + ox + popSprite.getXVariance();
  popSprite.y = this.y + popSprite.getYVariance();
// policy step inside update text pop anchor position.
};

/**
 * Handles the motion that a damage popup goes through.
 * @param {Sprite_Damage} damageSprite The damage sprite that is moving.
 */
Sprite_Character.prototype.updateDamagePopLocation = function(damageSprite)
{
  this.updateTextPopAnchorPosition(damageSprite);
};

/**
 * Handles the motion that a non-damage popup goes through.
 * @param {Sprite_Damage} nonDamageSprite The popup that is moving.
 */
Sprite_Character.prototype.updateNonDamagePopLocation = function(nonDamageSprite)
{
  this.updateTextPopAnchorPosition(nonDamageSprite);
};
//endregion handle text pops
//endregion Sprite_Character
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
   */
  this._j ||= {};

  /**
   * This plugins' relevant data points.
   * @type {{}}
   */
  this._j._popups ||= {};

  /**
   * The currently tracked damage pops, like weapon attacks or skills.
   * @type {Sprite_Damage[]}
   */
  this._j._popups._damagePopSprites = [];

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
  return this.damagePopSprites().length > 0;
};

/**
 * Gets all damage pop sprites currently being tracked.
 * @returns {Sprite_Damage[]}
 */
Sprite_Character.prototype.getDamagePops = function()
{
  return this.damagePopSprites();
};

/**
 * Determines whether or not this character has non damage pops.
 * @returns {boolean} True if we have any, false otherwise.
 */
Sprite_Character.prototype.hasNonDamagePops = function()
{
  return this.nonDamagePopSprites().length > 0;
};

/**
 * Gets all non damage pop sprites currently being tracked.
 * @returns {Sprite_Damage[]}
 */
Sprite_Character.prototype.getNonDamagePops = function()
{
  return this.nonDamagePopSprites();
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

  const useMotion = J.POPUPS.Layout.Motion.Enabled === true && isMotionType;

  const ringExtra = useMotion
    ? PopupLayoutHelper.resolveMotionOffset(popup)
    : PopupLayoutHelper.consumeLayoutRingOffset(character, popup.layoutRing);
  const sprite = TextPopSpriteManager.convert(popup, ringExtra);

  if (sprite.isDamage())
  {
    this.damagePopSprites().push(sprite);
  }
  else
  {
    this.nonDamagePopSprites().push(sprite);
  }

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
    this.damagePopSprites().push(sprite);
  }
  else
  {
    this.nonDamagePopSprites().push(sprite);
  }

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
  // update every popup first, so a sprite finishing this frame is still positioned correctly.
  bucket.forEach(pop =>
  {
    pop.update();
    updateLocationFn.call(this, pop);
  });

  // split the bucket rather than deleting in place- `delete` leaves holes, which is what forced
  // the compaction pass (and the null-filters) that used to live here.
  const stillPlaying = bucket.filter(pop => pop.isPlaying() === true);
  const finished = bucket.filter(pop => pop.isPlaying() === false);

  // nothing ended this frame, so the bucket is already correct.
  if (finished.length === 0) return;

  // detach and destroy everything that finished.
  finished.forEach(pop => this._removeTrackedPopSprite(pop));

  // callers hold this same array reference, so rewrite it in place rather than reassigning.
  bucket.length = 0;
  stillPlaying.forEach(pop => bucket.push(pop));
};

/**
 * Detaches a finished popup, emits lifecycle, and destroys the sprite.
 * @param {Sprite_Damage} sprite The popup sprite.
 */
Sprite_Character.prototype._removeTrackedPopSprite = function(sprite)
{
  const character = this.character();

  this.parent.removeChild(sprite);
  J.POPUPS.notifyPopupSpriteFinished(character, sprite._j._popups._sourcePopup, sprite);
  sprite.destroy();
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

//region properties
/**
 * Gets the damage pop sprites.
 * @returns {*} The damagePopSprites.
 */
Sprite_Character.prototype.damagePopSprites = function()
{
  // hand back the damage pop sprites.
  return this._j._popups._damagePopSprites;
};

/**
 * Sets the damage pop sprites.
 * @param {*} newDamagePopSprites The new damagePopSprites.
 */
Sprite_Character.prototype.setDamagePopSprites = function(newDamagePopSprites)
{
  // assign the damage pop sprites.
  this._j._popups._damagePopSprites = newDamagePopSprites;
};

/**
 * Gets the non damage pop sprites.
 * @returns {*} The nonDamagePopSprites.
 */
Sprite_Character.prototype.nonDamagePopSprites = function()
{
  // hand back the non damage pop sprites.
  return this._j._popups._nonDamagePopSprites;
};

/**
 * Sets the non damage pop sprites.
 * @param {*} newNonDamagePopSprites The new nonDamagePopSprites.
 */
Sprite_Character.prototype.setNonDamagePopSprites = function(newNonDamagePopSprites)
{
  // assign the non damage pop sprites.
  this._j._popups._nonDamagePopSprites = newNonDamagePopSprites;
};
//endregion properties
//endregion Sprite_Character
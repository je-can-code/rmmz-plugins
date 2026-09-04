import Diagnostics from './../core/Diagnostics.js';
import Sprite_CharacterOverlay from './Sprite_CharacterOverlay.js';

/**
 * Gets the underlying `Game_Character` or its appropriate subclass that this
 * sprite represents on the map.
 * @returns {Game_Character|Game_Player|Game_Event|Game_Vehicle|Game_Follower}
 */
Sprite_Character.prototype.character = function()
{
  return this._character;
};

/**
 * Gets whether or not the underlying {@link Game_Character} is erased.
 * If there is no underlying character, then it is still considered erased.
 * @returns {boolean}
 */
Sprite_Character.prototype.isErased = function()
{
  // grab the underlying character for this sprite.
  const character = this.character();

  // if we don't have a character, then it must certainly be erased.
  if (!character)
  {
    Diagnostics.warn(__PLUGIN_NAME__, 'attempted to check erasure status on a non-existing character.', this);
    return true;
  }

  // return the erasure status.
  return character.isErased();
};

/**
 * Extends {@link Sprite_Character.initMembers}.<br/>
 * Also builds the layer that this character's interface furniture will be drawn on.
 */
J.BASE.Aliased.Sprite_Character.set('initMembers', Sprite_Character.prototype.initMembers);
Sprite_Character.prototype.initMembers = function()
{
  // perform original logic.
  J.BASE.Aliased.Sprite_Character.get('initMembers')
    .call(this);

  /**
   * The shared root namespace for all of J's plugin data.
   */
  this._j ||= {};

  /**
   * The layer holding everything drawn *about* this character rather than as part of it.
   * @type {Sprite_CharacterOverlay}
   */
  this._j._characterOverlay = new Sprite_CharacterOverlay();

  // the layer is built and attached here rather than when something first needs it, because a
  // caption is added partway through a character's life and would otherwise have nowhere to go.
  this.addChild(this._j._characterOverlay);
};

/**
 * The layer that this character's interface furniture is drawn on.
 *
 * Anything that describes a character rather than depicting it - a nameplate, a gauge, a floating
 * label - belongs here instead of on the character sprite directly. The layer cancels the
 * character's own scale and rotation, so a caption keeps its size and stays upright through
 * whatever the body beneath it is animating.
 * @returns {Sprite_CharacterOverlay}
 */
Sprite_Character.prototype.characterOverlay = function()
{
  return this._j._characterOverlay;
};
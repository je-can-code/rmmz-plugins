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

  // the layer is built here rather than when something first needs it, because a caption is added
  // partway through a character's life and would otherwise have nowhere to go.
  //
  // it is built but not attached: the layer belongs to the spriteset's caption plane rather than to
  // this sprite, which is what keeps captions out of the screen tone. a sprite has no idea a
  // spriteset exists, so parenting is the plane's job and it collects this on the next frame.
  this._j._characterOverlay.setCharacterSprite(this);
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

/**
 * Determines whether this sprite's character is close enough to the screen to be worth drawing.<br/>
 * The engine's own {@link Game_CharacterBase#isNearTheScreen} is the measure: half a screen of margin
 * beyond every edge, the same reach it uses to decide which events may wander on their own. That
 * margin is what makes waking up invisible, since a sprite comes back long before it can be seen.
 *
 * The measure ignores the screen's zoom, and that is only safe while nothing zooms the camera out. A
 * zoom in shows less of the map, so the margin still covers it; a zoom out shows more than the margin
 * reaches, and the sprites in that band would be asleep in plain view. A camera that ever zooms out
 * needs this widened by the inverse of its zoom scale.
 * @returns {boolean} True if this sprite should be updated and drawn, false if it can sleep.
 */
Sprite_Character.prototype.shouldBeAwake = function()
{
  return this.character()
    .isNearTheScreen();
};

/**
 * Determines whether this sprite is asleep: neither updated nor drawn, because its character is too
 * far from the screen for anybody to see it.<br/>
 * Sleep is held in PIXI's own `renderable` flag rather than a field of ours, because that flag is
 * already what decides drawing, and {@link Tilemap#updateChild} reads the same flag to decide updating.
 * @returns {boolean} True if this sprite is asleep, false if it is awake.
 */
Sprite_Character.prototype.isAsleep = function()
{
  return this.renderable === false;
};

/**
 * Brings this sprite's sleep in line with where its character currently stands.<br/>
 * Called by the spriteset once a frame, before the tilemap walks its children, so a sprite that wakes
 * this frame is also updated this frame and is never drawn from wherever it fell asleep.
 */
Sprite_Character.prototype.updateSleep = function()
{
  const shouldBeAwake = this.shouldBeAwake();
  const isAsleep = this.isAsleep();

  // a sleeping sprite whose character has come near the screen wakes up.
  if (shouldBeAwake === true && isAsleep === true)
  {
    this.wakeUp();
    return;
  }

  // an awake sprite whose character has wandered out of reach goes to sleep.
  if (shouldBeAwake === false && isAsleep === false)
  {
    this.fallAsleep();
  }
};

/**
 * Puts this sprite to sleep, so it is neither updated nor drawn until its character comes back.<br/>
 * Only the picture stops. Position, movement and everything else that makes a character what it is
 * live on the character rather than here, so the world carries on exactly as it would have.
 */
Sprite_Character.prototype.fallAsleep = function()
{
  this.renderable = false;
};

/**
 * Wakes this sprite up, so it is updated and drawn again from this frame on.<br/>
 * Also the seam for anything a sprite would otherwise let pile up while nobody was looking: J-Popups
 * extends it to throw away the popups queued for a character that was out of sight.
 */
Sprite_Character.prototype.wakeUp = function()
{
  this.renderable = true;
};

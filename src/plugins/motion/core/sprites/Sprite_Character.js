//region Sprite_Character
import CharacterMotionComposer from '../managers/CharacterMotionComposer.js';
import MotionChannels from '../core/MotionChannels.js';

/**
 * Extends {@link #initMembers}.<br/>
 * Adds the motion-specific members to this sprite.
 */
J.MOTION.Aliased.Sprite_Character.set('initMembers', Sprite_Character.prototype.initMembers);
Sprite_Character.prototype.initMembers = function()
{
  // perform original logic.
  J.MOTION.Aliased.Sprite_Character.get('initMembers')
    .call(this);

  // initialize our motion members.
  this.initMotionMembers();
};

/**
 * Initializes the members of this sprite that belong to motion.
 */
Sprite_Character.prototype.initMotionMembers = function()
{
  /**
   * Whether this sprite has ever had a colour motion applied to it.
   * @type {boolean}
   */
  this._motionColored = false;

  /**
   * Where this sprite's anchor sits when no motion is moving it.
   *
   * Captured rather than assumed, because the only thing that knows where a character sprite rests
   * is the engine that just placed it there — and a motion that borrows the anchor has to have
   * somewhere exact to give it back to.
   * @type {number}
   */
  this._motionRestingAnchorY = this.anchor.y;
};

/**
 * Gets whether this sprite has ever had a colour motion applied to it.
 * @returns {boolean} The motionColored.
 */
Sprite_Character.prototype.isMotionColored = function()
{
  // hand back whether this sprite has been coloured.
  return this._motionColored;
};

/**
 * Flags this sprite as having had a colour motion applied to it.
 */
Sprite_Character.prototype.flagMotionColored = function()
{
  this._motionColored = true;
};

/**
 * Gets where this sprite's anchor sits when no motion is moving it.
 * @returns {number} The motionRestingAnchorY.
 */
Sprite_Character.prototype.motionRestingAnchorY = function()
{
  // hand back the resting anchor.
  return this._motionRestingAnchorY;
};

/**
 * Extends {@link #update}.<br/>
 * Applies this character's composed motion after the engine has finished placing the sprite.
 *
 * This runs after the original rather than before it because `updatePosition` assigns x and y and
 * `updateOther` assigns opacity, every frame, unconditionally. Anything written ahead of them is
 * overwritten within the same frame and never reaches the screen.
 */
J.MOTION.Aliased.Sprite_Character.set('update', Sprite_Character.prototype.update);
Sprite_Character.prototype.update = function()
{
  // perform original logic.
  J.MOTION.Aliased.Sprite_Character.get('update')
    .call(this);

  // layer this character's motion on top of where the engine just put it.
  this.updateCharacterMotion();
};

/**
 * Applies one frame of composed motion to this sprite.
 */
Sprite_Character.prototype.updateCharacterMotion = function()
{
  const character = this.character();
  const composition = CharacterMotionComposer.compose(character);

  this.applyMotionTransform(composition);
  this.applyMotionColor(composition);
};

/**
 * Applies the positional half of a composition: offsets, rotation, scale and opacity.
 *
 * Every channel is written on every frame, including when nothing is animating. Returning early
 * for a still character would be cheaper, and would also mean a character that had been scaled up
 * and then had that motion removed would stay large forever, because nothing else in the engine
 * ever writes scale or rotation back.
 * @param {MotionComposition} composition This character's composed motion.
 */
Sprite_Character.prototype.applyMotionTransform = function(composition)
{
  // offsets add to wherever the engine placed the sprite; everything else replaces.
  this.x += composition.valueFor(MotionChannels.OFFSET_X);
  this.y += composition.valueFor(MotionChannels.OFFSET_Y);
  this.opacity *= composition.valueFor(MotionChannels.OPACITY);
  this.scale.x = composition.valueFor(MotionChannels.SCALE_X);
  this.scale.y = composition.valueFor(MotionChannels.SCALE_Y);
  this.rotation = composition.valueFor(MotionChannels.ROTATION);

  this.applyMotionAnchor(composition);
};

/**
 * Moves the sprite's anchor to its middle when a motion needs to rotate it in place.
 *
 * A character sprite is anchored at its feet so that it stands on its tile. Rotating about that
 * point swings the character around like a conker on a string, so a spin asks for the anchor to
 * move to the middle — which drops the drawn image by half its own height, because the point the
 * engine pinned to the tile is now the sprite's waist instead of its feet. Lifting it back by the
 * same amount is what keeps a spinning character standing where it was.
 *
 * The resting anchor is restored on every frame that does not want centred rotation, for the same
 * reason {@link #applyMotionTransform} writes every channel unconditionally: nothing else in the
 * engine ever puts an anchor back, so a spin that ended would otherwise leave the character sunk
 * into the ground for the rest of its life.
 * @param {MotionComposition} composition This character's composed motion.
 */
Sprite_Character.prototype.applyMotionAnchor = function(composition)
{
  // nothing wants centred rotation, so put the sprite back on its own feet.
  if (composition.hasCenterRotation() === false)
  {
    this.anchor.y = this.motionRestingAnchorY();

    return;
  }

  const lift = this.motionAnchorLift();

  this.anchor.y = 0.5;
  this.y -= lift;
};

/**
 * How far the sprite has to climb to stay put while its anchor sits at its middle.
 *
 * The engine's `height` is deliberately the raw frame height with no scale applied, but the drop
 * caused by moving the anchor happens in world space and is therefore scaled along with everything
 * else. Scaling it here is what keeps a character that spins *and* changes size — a breathing enemy
 * turning in place, a caster flipping mid-squish — from sliding as its own scale animates.
 * @returns {number} The distance to lift, in screen pixels.
 */
Sprite_Character.prototype.motionAnchorLift = function()
{
  const anchorTravel = this.motionRestingAnchorY() - 0.5;

  return anchorTravel * this.height * this.scale.y;
};

/**
 * Applies the colour half of a composition: hue, tint, tone and flash.
 *
 * The colour filter these use is created lazily by the engine on first write and never removed, so
 * a sprite that has ever been coloured keeps its own render pass for the rest of its life. Nothing
 * is written until a colour motion actually runs, which is why an ordinary character never pays
 * for a feature it is not using.
 * @param {MotionComposition} composition This character's composed motion.
 */
Sprite_Character.prototype.applyMotionColor = function(composition)
{
  // no colour motion has ever run on this sprite, so do not create a filter to say so.
  if (this.needsMotionColor(composition) === false) return;

  const [ red, green, blue ] = composition.valueFor(MotionChannels.TINT);

  this.setHue(composition.valueFor(MotionChannels.HUE));
  this.setColorTone(composition.valueFor(MotionChannels.TONE));
  this.setBlendColor(composition.valueFor(MotionChannels.FLASH));
  this.tint = (red << 16) + (green << 8) + blue;
};

/**
 * Determines whether the colour channels need writing this frame.
 *
 * Once a sprite has been coloured it must keep being written even as the values return to normal,
 * because the trip back to plain is itself something the engine has to be told about.
 * @param {MotionComposition} composition This character's composed motion.
 * @returns {boolean}
 */
Sprite_Character.prototype.needsMotionColor = function(composition)
{
  // a sprite already carrying colour keeps being told, including on its way back to plain.
  if (this.isMotionColored() === true) return true;

  const isColored = Sprite_Character.isMotionColorMeaningful(composition);

  // remember it, so that the return trip still gets written.
  if (isColored === true)
  {
    this.flagMotionColored();
  }

  return isColored;
};

/**
 * Determines whether a composition's colour channels differ from doing nothing at all.
 * @param {MotionComposition} composition The composition to inspect.
 * @returns {boolean}
 */
Sprite_Character.isMotionColorMeaningful = function(composition)
{
  if (composition.valueFor(MotionChannels.HUE) !== 0) return true;

  const tone = composition.valueFor(MotionChannels.TONE);
  if (tone.some(component => component !== 0)) return true;

  const flash = composition.valueFor(MotionChannels.FLASH);
  if (flash.at(3) !== 0) return true;

  const tint = composition.valueFor(MotionChannels.TINT);

  return tint.some(component => component !== 255);
};
//endregion Sprite_Character
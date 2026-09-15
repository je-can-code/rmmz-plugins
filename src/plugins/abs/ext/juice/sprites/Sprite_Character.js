//region Sprite_Character
import JuiceHeldOverlayManager from './../managers/JuiceHeldOverlayManager.js';

/**
 * Extends {@link #update}.<br/>
 * Restores any icon this sprite's character is holding up.
 *
 * This runs on every frame rather than on some event announcing that a sprite was created, because
 * there is no such event that covers every route. A sprite appears when a map loads, when the menu
 * closes, when an event page turns, and when a follower joins the party; a held overlay has to
 * survive all four, and asking on every frame is what makes the question "is this drawn correctly
 * right now" instead of "did something happen that means it might not be".
 *
 * The cost of asking is one `WeakMap` miss for every character holding nothing, which is very
 * nearly all of them.
 */
J.ABS.EXT.JUICE.Aliased.Sprite_Character.set('update', Sprite_Character.prototype.update);
Sprite_Character.prototype.update = function()
{
  // perform original logic.
  J.ABS.EXT.JUICE.Aliased.Sprite_Character.get('update')
    .call(this);

  // put back anything this character is meant to be holding up.
  this.updateHeldJuiceOverlays();
};

/**
 * Restores any held juice overlays this sprite's character has outstanding.
 */
Sprite_Character.prototype.updateHeldJuiceOverlays = function()
{
  JuiceHeldOverlayManager.materializeFor(this);
};
//endregion Sprite_Character
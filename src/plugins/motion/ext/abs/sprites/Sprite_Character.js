//region Sprite_Character
import LootMotionCoordinator from '../managers/LootMotionCoordinator.js';

/**
 * Extends {@link #updateLootFloat}.<br/>
 * Gives a loot drop a visible ending rather than letting it blink out.
 *
 * J-ABS's own duration handling is untouched: it still counts the drop down and still removes it
 * the moment it runs out. What changes is only that the closing stretch of that countdown is now
 * something the player can see, which is what makes a missed drop a thing that was lost rather
 * than a thing that was never there.
 *
 * Hooked here because this is already the per-frame heartbeat of a drawn loot drop, so nothing new
 * has to be polled and nothing in J-ABS had to learn what a motion is. A drop out of sight has a
 * sleeping sprite that skips this entirely, which costs nothing: there is nobody there to warn, and
 * the warning is brought up to date on the first frame the sprite wakes.
 */
J.MOTION.EXT.ABS.Aliased.Sprite_Character.set('updateLootFloat', Sprite_Character.prototype.updateLootFloat);
Sprite_Character.prototype.updateLootFloat = function()
{
  // perform original logic.
  J.MOTION.EXT.ABS.Aliased.Sprite_Character.get('updateLootFloat')
    .call(this);

  // warn about the drop's remaining life, if it is short enough to be worth warning about.
  LootMotionCoordinator.syncExpiryWarning(this);
};
//endregion Sprite_Character

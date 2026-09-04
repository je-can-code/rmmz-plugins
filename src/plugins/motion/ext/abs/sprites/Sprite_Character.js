//region Sprite_Character
import LootMotionCoordinator from '../managers/LootMotionCoordinator.js';

/**
 * Extends {@link #handleLootDuration}.<br/>
 * Gives a loot drop a visible ending rather than letting it blink out.
 *
 * J-ABS's own duration handling is untouched: it still counts the drop down and still removes it
 * the moment it runs out. What changes is only that the closing stretch of that countdown is now
 * something the player can see, which is what makes a missed drop a thing that was lost rather
 * than a thing that was never there.
 *
 * Hooked here because this is already the per-frame heartbeat of a live loot drop, so nothing new
 * has to be polled and nothing in J-ABS had to learn what a motion is.
 */
J.MOTION.EXT.ABS.Aliased.Sprite_Character.set('handleLootDuration', Sprite_Character.prototype.handleLootDuration);
Sprite_Character.prototype.handleLootDuration = function()
{
  // perform original logic.
  J.MOTION.EXT.ABS.Aliased.Sprite_Character.get('handleLootDuration')
    .call(this);

  // warn about the drop's remaining life, if it is short enough to be worth warning about.
  LootMotionCoordinator.syncExpiryWarning(this);
};
//endregion Sprite_Character

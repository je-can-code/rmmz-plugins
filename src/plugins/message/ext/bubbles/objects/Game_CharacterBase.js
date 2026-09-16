//region Game_CharacterBase
/**
 * The point a bubble's tail should aim at when this character is speaking.
 *
 * Which end of the character that is depends on which side the bubble is sitting. A bubble floating
 * above wants the top of their head, because a tail aimed at their feet has to cross their whole
 * sprite to get there. A bubble hanging below wants the ground they are standing on, for exactly the
 * same reason in the other direction - aiming at the head from underneath puts the bubble over them
 * rather than under them, which is the version that looks like a bug.
 *
 * `screenY` answers with the ground, so the head is one tile up from it. Being approximate about the
 * height of a sprite costs nothing: the bubble floats clear of this point either way, and the tail
 * only leans toward it.
 * @param {boolean} preferBelow Whether the bubble is hanging below this character.
 * @returns {number}
 */
Game_CharacterBase.prototype.bubbleAnchorY = function(preferBelow)
{
  if (preferBelow === true) return this.screenY();

  return this.screenY() - $gameMap.tileHeight();
};
//endregion Game_CharacterBase
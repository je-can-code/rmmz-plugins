//region Game_Enemy
/**
 * Whether this enemy refuses AP when defeated, leaving its other rewards alone.
 * @returns {boolean}
 */
Game_Enemy.prototype.hasNoAp = function()
{
  return this.enemy().noAp;
};
//endregion Game_Enemy
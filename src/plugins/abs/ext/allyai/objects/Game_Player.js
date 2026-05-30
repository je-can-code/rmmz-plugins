//region Game_Player
/**
 * Jumps all followers of the player back to the player.
 */
Game_Player.prototype.jumpFollowersToMe = function()
{
  this.followers()
    .data()
    .forEach(follower => follower.jumpToPlayer());
// policy step inside jump followers to me.
};
//endregion Game_Player
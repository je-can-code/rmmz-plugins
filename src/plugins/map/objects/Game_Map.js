//region Game_Map
/**
 * Checks whether the current map blocks the minimap via note tag.
 * @returns {boolean}
 */
Game_Map.prototype.isMinimapBlocked = function()
{
  // Reset regex last index and test.
  J.MAP.RegExp.BlockMinimap.lastIndex = 0;

  // return what we found.
  return J.MAP.RegExp.BlockMinimap.test(this.note() ?? '');
};
//endregion Game_Map
//region Game_System
/**
 * Extends {@link #initMembers}.<br/>
 * Also stamps the playthrough this game belongs to.
 */
J.BASE.EXT.SAVE.Aliased.Game_System.set('initMembers', Game_System.prototype.initMembers);
Game_System.prototype.initMembers = function()
{
  // perform original logic.
  J.BASE.EXT.SAVE.Aliased.Game_System.get('initMembers')
    .call(this);

  /**
   * The identity of the playthrough this game belongs to.
   *
   * A slot is a folder of generations, and until this existed nothing tied one generation to the
   * next beyond them sharing a folder. Start a new game, save it over an old slot, then roll that
   * generation back, and the loader would happily hand back the previous playthrough- a different
   * party, a different story position, and no indication that anything had happened.
   *
   * A new id is minted here, which is to say once per game world created. A loaded save overwrites
   * it with the one it was written under, so the id follows a playthrough rather than a session.
   * @type {string}
   */
  this._playthroughId = J.BASE.Helpers.generateUuid();
};

/**
 * Gets the identity of the playthrough this game belongs to.
 * @returns {string}
 */
Game_System.prototype.playthroughId = function()
{
  return this._playthroughId;
};
//endregion Game_System

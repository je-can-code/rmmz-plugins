//region RPG_Enemy
/**
 * The number of AP this enemy will yield upon defeat.
 * @type {number}
 */
Object.defineProperty(RPG_Enemy.prototype, 'apPoints', {
  get()
  {
    // get the AP amount from this enemy's notes.
    return RPGManager.getNumberFromNoteByRegex(this, J.APT.RegExp.ApReward);
  },
});
//endregion RPG_Enemy
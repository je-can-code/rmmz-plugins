//region RPG_Enemy
/**
 * Whether or not this enemy should be hidden from the monsterpedia.
 * @type {boolean} True if the enemy should be hidden, false otherwise.
 */
Object.defineProperty(RPG_Enemy.prototype, "hideFromMonsterpedia", {
  get: function()
  {
    return RPGManager.checkForBooleanFromNoteByRegex(this, J.OMNI.EXT.MONSTER.RegExp.HideFromMonsterpedia);
  },
});

/**
 * The icon index of the monster family this enemy belongs to.
 * @type {number}
 */
Object.defineProperty(RPG_Enemy.prototype, "monsterFamilyIcon", {
  get: function()
  {
    return RPGManager.getNumberFromNoteByRegex(this, J.OMNI.EXT.MONSTER.RegExp.MonsterpediaFamilyIcon);
  },
});

/**
 * The description of the enemy for the monsterpedia.
 * @type {string[]}
 */
Object.defineProperty(RPG_Enemy.prototype, "monsterpediaDescription", {
  get: function()
  {
    return RPGManager.getStringsFromNoteByRegex(this, J.OMNI.EXT.MONSTER.RegExp.MonsterpediaDescription);
  },
});
//endregion RPG_Enemy
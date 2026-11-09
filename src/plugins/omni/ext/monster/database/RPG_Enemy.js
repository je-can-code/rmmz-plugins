//region RPG_Enemy
import MonsterpediaTypes from '../managers/MonsterpediaTypes.js';

/**
 * The kind of entry this enemy is, which decides the page of the monsterpedia it is listed on.
 * An enemy without a `<monsterType:KEY>` tag is an ordinary enemy.
 * @type {string}
 */
Object.defineProperty(RPG_Enemy.prototype, "monsterType", {
  get: function()
  {
    // the kind the row declares, or null when it declares none.
    const declaredType = RPGManager.getStringFromNoteByRegex(this, J.OMNI.EXT.MONSTER.RegExp.MonsterType, true);

    // a row that declares nothing is an ordinary enemy.
    return declaredType ?? MonsterpediaTypes.DEFAULT_KEY;
  },
});

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
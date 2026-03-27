//region RPG_UsableItem
//region bonusHits
/**
 * The number of additional bonus hits this skill or item adds to their basic attacks.
 * @type {number}
 */
Object.defineProperty(RPG_UsableItem.prototype, "jabsBonusHits", {
  get: function()
  {
    return RPGManager.getNumberFromNoteByRegex(this, J.ABS.RegExp.BonusHits, true);
  },
});
//endregion bonusHits

//region cooldowns
/**
 * The JABS cooldown when using this skill or item.
 * @type {number}
 */
Object.defineProperty(RPG_UsableItem.prototype, "jabsCooldown", {
  get: function()
  {
    return RPGManager.getNumberFromNoteByRegex(this, J.ABS.RegExp.Cooldown, true);
  },
});

/**
 * A new property for retrieving the JABS uniqueCooldown from this skill.
 * @type {boolean}
 */
Object.defineProperty(RPG_UsableItem.prototype, 'jabsUniqueCooldown', {
  get: function()
  {
    return RPGManager.checkForBooleanFromNoteByRegex(this, J.ABS.RegExp.UniqueCooldown, true);
  },
});
//endregion cooldowns

//region usability
/**
 * Whether or not the skill or item is hidden from the JABS quick menus.
 * True when the explicit hide tag is present; false otherwise.
 * @type {boolean}
 */
Object.defineProperty(RPG_UsableItem.prototype, 'jabsHiddenFromMenus', {
  get: function()
  {
    // direct passthrough: tag present = true (hidden), tag absent = false (visible).
    return RPGManager.checkForBooleanFromNoteByRegex(this, J.ABS.RegExp.HideFromJabsMenu);
  },
});
//endregion usability
//endregion RPG_UsableItem
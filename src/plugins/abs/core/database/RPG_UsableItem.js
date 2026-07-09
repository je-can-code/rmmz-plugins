//region RPG_UsableItem
//region cooldowns
/**
 * The JABS cooldown when using this skill or item.
 * @type {number}
 */
Object.defineProperty(RPG_UsableItem.prototype, 'jabsCooldown', {
  get: function()
  {
    return RPGManager.getNumberFromNoteByRegex(this, J.ABS.RegExp.Cooldown, true);
  },
});

/**
 * A new property for retrieving the JABS uniqueCooldown from this skill.
 * @type {boolean|null}
 */
Object.defineProperty(RPG_UsableItem.prototype, 'jabsUniqueCooldown', {
  get: function()
  {
    return RPGManager.checkForBooleanFromNoteByRegex(this, J.ABS.RegExp.UniqueCooldown, true);
  },
});

/**
 * When true, this skill or item never participates in the battler-wide GCD: it does not start the global timer on use
 * and is never refused because that timer is still counting. Driven by {@code noGlobalCooldown} or {@code ogcd}
 * notetags.
 * @type {boolean}
 */
Object.defineProperty(RPG_UsableItem.prototype, 'jabsIgnoresGlobalCooldown', {
  get: function()
  {
    return RPGManager.checkForBooleanFromNoteByRegex(this, J.ABS.RegExp.Ogcd);
  },
});

/**
 * Optional per-entry length in frames for the global cooldown applied after this skill executes, when it is
 * GCD-subject. Parsed from {@code <gcd:N>}; null or invalid values mean “use the plugin default duration” instead of
 * overriding.
 * @type {number|null}
 */
Object.defineProperty(RPG_UsableItem.prototype, 'jabsGlobalCooldownOverride', {
  get: function()
  {
    return RPGManager.getNumberFromNoteByRegex(this, J.ABS.RegExp.GlobalCooldownFrames, true);
  },
});
//endregion cooldowns

//region interruption
/**
 * The percent magnifier applied to a target's own effective cooldown when this skill lands a hit
 * against a battler that is casting/channeling and interrupts it. Sentinel `0` means this skill
 * carries no interrupt capability at all- it never disturbs a cast/channel it hits.
 * @type {number}
 */
Object.defineProperty(RPG_UsableItem.prototype, 'jabsInterruptMagnifier', {
  get: function()
  {
    return RPGManager.getNumberFromNoteByRegex(this, J.ABS.RegExp.Interrupt);
  },
});
//endregion interruption

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
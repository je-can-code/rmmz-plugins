//region RPG_Skill
/**
 * Skill note override for J-ABS-Juice weapon swing IconSet index (falls back to equipped weapon).
 * @type {number}
 */
Object.defineProperty(RPG_Skill.prototype, 'jabsJuiceIconIndex', {
  get: function()
  {
    return RPGManager.getNumberFromNoteByRegex(this, J.ABS.EXT.JUICE.RegExp.JuiceIcon, true) ?? -1;
  },
});

/**
 * Skill note override for juice swing style bucket (matched against weapon-style multiplier keys).
 * @type {string}
 */
Object.defineProperty(RPG_Skill.prototype, 'jabsJuiceWeaponStyle', {
  get: function()
  {
    return RPGManager.getStringFromNoteByRegex(this, J.ABS.EXT.JUICE.RegExp.JuiceWeaponStyle, true) ?? String.empty;
  },
});

/**
 * Skill note override for the preset weapon motion key (kebab-case).
 * @type {string}
 */
Object.defineProperty(RPG_Skill.prototype, 'jabsJuiceMotion', {
  get: function()
  {
    return RPGManager.getStringFromNoteByRegex(this, J.ABS.EXT.JUICE.RegExp.JuiceMotion, true) ?? String.empty;
  },
});

/**
 * Skill note: arc / arc-reverse span in degrees (`<juiceSpan:N>`). Omitted uses plugin default (120).
 * @type {number}
 */
Object.defineProperty(RPG_Skill.prototype, 'jabsJuiceArcSpanDegrees', {
  get: function()
  {
    return RPGManager.getNumberFromNoteByRegex(this, J.ABS.EXT.JUICE.RegExp.JuiceSpan, true) ?? -1;
  },
});

/**
 * Skill note: `<juiceSpinCount:N>` — full rotations for spin / spin-reverse (see J-ABS-Juice help).
 * @type {number}
 */
Object.defineProperty(RPG_Skill.prototype, 'jabsJuiceSpinCount', {
  get: function()
  {
    return RPGManager.getNumberFromNoteByRegex(this, J.ABS.EXT.JUICE.RegExp.JuiceSpinCount, true) ?? -1;
  },
});

/**
 * Skill note: tip/bearing from Pixi +x at rotation 0 in degrees (`<juiceStabTipDegrees:N>`).
 * Omitted: stab-forward uses sword default; bash / recoil use π rad (barrel toward −x) unless tagged.
 * @type {number|null}
 */
Object.defineProperty(RPG_Skill.prototype, 'jabsJuiceStabTipDegrees', {
  get: function()
  {
    return RPGManager.getNumberFromNoteByRegex(this, J.ABS.EXT.JUICE.RegExp.JuiceStabTipDegrees, true) ?? null;
  },
});

/**
 * Skill note: `<juiceProfileGun>` — profile gun overlay uses horizontal flip for left/right aim (see J-ABS-Juice help).
 * @type {boolean}
 */
Object.defineProperty(RPG_Skill.prototype, 'jabsJuiceProfileGun', {
  get: function()
  {
    return RPGManager.checkForBooleanFromNoteByRegex(this, J.ABS.EXT.JUICE.RegExp.JuiceProfileGun, false) === true;
  },
});
//endregion RPG_Skill
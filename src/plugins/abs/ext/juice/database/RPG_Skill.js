//region RPG_Skill
/**
 * When {@code true}, all juice motion is suppressed for this skill on the caster.
 * @type {boolean}
 */
Object.defineProperty(RPG_Skill.prototype, 'jabsNoJuice', {
  get: function()
  {
    return RPGManager.checkForBooleanFromNoteByRegex(this, J.ABS.EXT.JUICE.RegExp.NoJuice, false) === true;
  },
});

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
 * Skill note: the body motion shown for the whole of this skill's cast (`<castMotion:NAME>`).
 * Empty when omitted, which means the default charge pulse.
 * @type {string}
 */
Object.defineProperty(RPG_Skill.prototype, 'jabsJuiceCastMotion', {
  get: function()
  {
    return RPGManager.getStringFromNoteByRegex(this, J.ABS.EXT.JUICE.RegExp.CastMotion, true) ?? String.empty;
  },
});

/**
 * Skill note: frames per repetition of the cast motion (`<castMotionPeriod:N>`).
 * Zero when omitted, which lets the motion type's registered default period stand.
 * @type {number}
 */
Object.defineProperty(RPG_Skill.prototype, 'jabsJuiceCastMotionPeriod', {
  get: function()
  {
    return RPGManager.getNumberFromNoteByRegex(this, J.ABS.EXT.JUICE.RegExp.CastMotionPeriod, true) ?? 0;
  },
});

/**
 * Skill note: peak deformation of the cast motion as a percent (`<castMotionIntensity:PERCENT>`).
 * Zero when omitted, which lets the juice config's unarmed strike intensity stand.
 * @type {number}
 */
Object.defineProperty(RPG_Skill.prototype, 'jabsJuiceCastMotionIntensity', {
  get: function()
  {
    return RPGManager.getNumberFromNoteByRegex(this, J.ABS.EXT.JUICE.RegExp.CastMotionIntensity, true) ?? 0;
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
 * Skill note: `<juiceRepeatCount:N>` — number of times to repeat the motion within the juice duration.
 * Applies to all motion types: spin / spin-reverse use it as full rotations; arc-oscillate uses it as
 * sweep count (alternating direction); all others replay the motion N times within the duration.
 * @type {number}
 */
Object.defineProperty(RPG_Skill.prototype, 'jabsJuiceRepeatCount', {
  get: function()
  {
    return RPGManager.getNumberFromNoteByRegex(this, J.ABS.EXT.JUICE.RegExp.JuiceRepeatCount, true) ?? -1;
  },
});

/**
 * Skill note: `<juiceDuration:N>` — overrides the weapon swing animation duration in frames.
 * When omitted, the global metadata default (`weaponSwingFrames * 2`) is used.
 * @type {number|null}
 */
Object.defineProperty(RPG_Skill.prototype, 'jabsJuiceDuration', {
  get: function()
  {
    return RPGManager.getNumberFromNoteByRegex(this, J.ABS.EXT.JUICE.RegExp.JuiceDuration, true) ?? null;
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
//region RPG_Skill
/**
 * Gets the JABS pose suffix data for this skill.
 *
 * The zeroth index is the string suffix itself (no quotes needed).
 * The first index is the index on the suffixed character sheet.
 * The second index is the number of frames to spend in this pose.
 * @type {[string, number, number]|null}
 */
Object.defineProperty(RPG_Skill.prototype, "jabsPoseData", {
  get: function()
  {
    // null rather than an empty array on absence, because callers gate on this being truthy before
    // reading the tuple apart- and an empty array is truthy, which would let a skill with no pose
    // build a sprite name out of undefined.
    return RPGManager.getArrayFromNotesByRegex(this, J.ABS.EXT.POSES.RegExp.PoseSuffix, true);
  },
});

/**
 * Gets the JABS pose suffix for this skill.
 * @type {string}
 */
Object.defineProperty(RPG_Skill.prototype, "jabsPoseSuffix", {
  get: function()
  {
    return this.jabsPoseData[0];
  },
});

/**
 * Gets the JABS pose index for this skill.
 * @type {number}
 */
Object.defineProperty(RPG_Skill.prototype, "jabsPoseIndex", {
  get: function()
  {
    return this.jabsPoseData[1];
  },
});

/**
 * Gets the JABS pose duration for this skill.
 * @type {number}
 */
Object.defineProperty(RPG_Skill.prototype, "jabsPoseDuration", {
  get: function()
  {
    return this.jabsPoseData[2];
  },
});
//endregion RPG_Skill
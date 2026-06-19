//region RPG_State
/**
 * Whether this state bears any state extension tags.
 * True when either {@code <extend:[IDs]>} or {@code <extendStateType:TYPE>} is present.
 */
Object.defineProperty(RPG_State.prototype, 'isStateExtension', {
  get: function()
  {
    const hasIdExtension = !!RPGManager.getArrayFromNotesByRegex(this, J.EXTEND.RegExp.Extend, true, true);
    const hasTypeExtension = !!RPGManager.getStringsFromNoteByRegex(this, J.EXTEND.RegExp.StateExtendType, true);
    return hasIdExtension || hasTypeExtension;
  },
});

/**
 * Gets all state ids this state targets via {@code <extend:[IDs]>}.
 * Returns an empty array when the tag is absent.
 * @type {number[]}
 */
Object.defineProperty(RPG_State.prototype, 'getStateExtensions', {
  get: function()
  {
    return RPGManager.getArrayFromNotesByRegex(this, J.EXTEND.RegExp.Extend, true);
  },
});

/**
 * Gets all type classifiers this state extends via {@code <extendStateType:TYPE>}.
 * Returns an empty array when the tag is absent.
 * @type {string[]}
 */
Object.defineProperty(RPG_State.prototype, 'getStateExtensionTypes', {
  get: function()
  {
    return RPGManager.getStringsFromNoteByRegex(this, J.EXTEND.RegExp.StateExtendType);
  },
});
//endregion RPG_State

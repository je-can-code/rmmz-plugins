//region RPG_Base
/**
 * Whether this database object bears any extension tags.
 * True when either {@code <extend:[IDs]>} or {@code <extendType:TYPE>} is present.
 * Generic across every database object type ({@link RPG_Base} subclasses) since {@code <type:>}
 * itself lives on {@link RPG_Base} — skills and states are the only types with an overlay
 * consumer today ({@link OverlayManager}), but weapons/armors/actors/classes/etc. get this
 * detection for free the moment a consumer wants it.
 * @type {boolean}
 */
Object.defineProperty(RPG_Base.prototype, 'isExtension', {
  get: function()
  {
    const hasIdExtension = !!RPGManager.getArrayFromNotesByRegex(this, J.EXTEND.RegExp.Extend, true, true);
    const hasTypeExtension = !!RPGManager.getStringsFromNoteByRegex(this, J.EXTEND.RegExp.ExtendType, true);
    return hasIdExtension || hasTypeExtension;
  },
});

/**
 * Gets all ids this database object targets via {@code <extend:[IDs]>}.
 * Returns an empty array when the tag is absent.
 * @type {number[]}
 */
Object.defineProperty(RPG_Base.prototype, 'getExtensions', {
  get: function()
  {
    return RPGManager.getArrayFromNotesByRegex(this, J.EXTEND.RegExp.Extend, true);
  },
});

/**
 * Gets all type classifiers this database object extends via {@code <extendType:TYPE>}.
 * Returns an empty array when the tag is absent.
 * @type {string[]}
 */
Object.defineProperty(RPG_Base.prototype, 'getExtensionTypes', {
  get: function()
  {
    return RPGManager.getStringsFromNoteByRegex(this, J.EXTEND.RegExp.ExtendType);
  },
});
//endregion RPG_Base

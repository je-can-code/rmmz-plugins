//region RPG_Base
/**
 * Gets all {@link AptitudeTeachable}s associated with this database object.
 * @type {AptitudeTeachable[]}
 */
Object.defineProperty(RPG_Base.prototype, 'aptitudeTeachings', {
  get()
  {
    // extract the data from the notes- should be [skillId, requiredAp].
    const raw = RPGManager.getArraysFromNotesByRegex(this, J.APT.RegExp.AptitudeTeachable, true) ?? [];

    // map all the raw data to DTOs.
    return raw.map(([ skillId, requiredAp ]) => new AptitudeTeachable(skillId, requiredAp));
  },
});

//endregion RPG_Base
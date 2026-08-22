//region RPG_Base
import AptitudeTeachable from './../_models/AptitudeTeachable.js';

/**
 * Gets all {@link AptitudeTeachable}s associated with this database object.
 * @type {AptitudeTeachable[]}
 */
Object.defineProperty(RPG_Base.prototype, 'aptitudeTeachings', {
  get()
  {
    // delegate to the build function so extensions can alias it cleanly.
    return this.buildAptitudeTeachings();
  },
});

/**
 * Builds the array of {@link AptitudeTeachable}s associated with this database object.
 * Extensions may alias this to append additional teachables.
 * @returns {AptitudeTeachable[]} The built list.
 */
RPG_Base.prototype.buildAptitudeTeachings = function()
{
  // extract the data from the notes- should be [skillId, requiredAp].
  const raw = RPGManager.getArraysFromNotesByRegex(this, J.APT.RegExp.AptitudeTeachable);

  // map all the raw data to DTOs.
  return raw.map(([ skillId, requiredAp ]) => new AptitudeTeachable(skillId, requiredAp));
};
//endregion RPG_Base
//region JAFT_RefinementData
/**
 * A class containing all the various data points extracted from notes.
 */
class JAFTING_RefinementData
{
  /**
   * @constructor
   * @param {string} notes The raw note box as a string.
   * @param {any} meta The `meta` object containing prebuilt note metadata.
   */
  constructor(notes, meta)
  {
    this._notes = notes.split(/[\r\n]+/);
    this._meta = meta;
    this.refinedCount = 0;
    this.maxRefineCount = this.getMaxRefineCount();
    this.maxTraitCount = this.getMaxTraitCount();
    this.notRefinementMaterial = this.isNotRefinableAsMaterial();
    this.notRefinementBase = this.isNotRefinableAsBase();
    this.unrefinable = this.isNotRefinable();
  }

  /**
   * The number of times this piece of equipment can be refined.
   * @returns {number}
   */
  getMaxRefineCount()
  {
    return RPGManager.getNumberFromNoteByRegex(
      // because it expects actual database objects for inspection,
      // hand-craft an object with a note property to be inspected.
      { note: this._notes },
      J.JAFTING.EXT.REFINE.MaxRefineCount);
  }

  /**
   * The number of transferable traits that this piece of equipment can have at any one time.
   * @returns {number}
   */
  getMaxTraitCount()
  {
    return RPGManager.getNumberFromNoteByRegex(
      // because it expects actual database objects for inspection,
      // hand-craft an object with a note property to be inspected.
      { note: this._notes },
      J.JAFTING.EXT.REFINE.MaxRefinedTraits);
  }

  /**
   * Gets whether or not this piece of equipment can be used in refinement as a material.
   * @returns {boolean}
   */
  isNotRefinableAsMaterial()
  {
    return RPGManager.checkForBooleanFromNoteByRegex(
      // because it expects actual database objects for inspection,
      // hand-craft an object with a note property to be inspected.
      { note: this._notes },
      J.JAFTING.EXT.REFINE.NotRefinementMaterial);
  }

  /**
   * Gets whether or not this piece of equipment can be used in refinement as a base.
   * @returns {boolean}
   */
  isNotRefinableAsBase()
  {
    return RPGManager.checkForBooleanFromNoteByRegex(
      // because it expects actual database objects for inspection,
      // hand-craft an object with a note property to be inspected.
      { note: this._notes },
      J.JAFTING.EXT.REFINE.NotRefinementBase);
  }

  /**
   * Gets whether or not this piece of equipment can be used in refinement.
   * If this is true, this will mean this cannot be used in refinement as base or material.
   * @returns
   */
  isNotRefinable()
  {
    return RPGManager.checkForBooleanFromNoteByRegex(
      // because it expects actual database objects for inspection,
      // hand-craft an object with a note property to be inspected.
      { note: this._notes },
      J.JAFTING.EXT.REFINE.Unrefinable);
  }
}
//endregion JAFT_RefinementData
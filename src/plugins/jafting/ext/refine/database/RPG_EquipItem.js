//region salvage ledger
/**
 * Copies the salvage ledger from the source object so refinement lineage survives save/load.
 * The base schema does not include `_jaftingSalvageLedger`, so without this hook the property is silently dropped
 * when {@link Game_Party#refreshDatabaseWeapons} and {@link Game_Party#refreshDatabaseArmors} reconstruct refined
 * entries via `new RPG_Weapon(raw, index)`.
 *
 * @param {RPG_EquipItem & { _jaftingSalvageLedger?: JaftingSalvageLedgerSnapshot|null }} baseItem
 */
J.JAFTING.EXT.REFINE.Aliased.RPG_EquipItem.set('initMembers', RPG_EquipItem.prototype.initMembers);
RPG_EquipItem.prototype.initMembers = function(baseItem)
{
  // perform original logic.
  J.JAFTING.EXT.REFINE.Aliased.RPG_EquipItem.get('initMembers').call(this, baseItem);

  // carry the salvage ledger forward; null for all non-refined base rows.
  this._jaftingSalvageLedger = baseItem._jaftingSalvageLedger ?? null;
};
//endregion salvage ledger

//region refinedCount
/**
 * The number of times this equip has been refined.
 * @type {number}
 */
RPG_EquipItem.prototype.jaftingRefinedCount ||= 0;
//endregion refinedCount

//region notRefinementBase
/**
 * Whether or not this equip is blocked from being used as a base for refinement.
 * @type {boolean}
 */
Object.defineProperty(RPG_EquipItem.prototype, "jaftingNotRefinementBase", {
  get: function()
  {
    return RPGManager.checkForBooleanFromNoteByRegex(this, J.JAFTING.EXT.REFINE.RegExp.NotRefinementBase);
  },
});
//endregion notRefinementBase

//region notRefinementMaterial
/**
 * Whether or not this equip is blocked from being used as a material for refinement.
 * @type {boolean}
 */
Object.defineProperty(RPG_EquipItem.prototype, "jaftingNotRefinementMaterial", {
  get: function()
  {
    return RPGManager.checkForBooleanFromNoteByRegex(this, J.JAFTING.EXT.REFINE.RegExp.NotRefinementMaterial);
  },
});
//endregion notRefinementMaterial

//region unrefinable
/**
 * Whether or not this equip is blocked from being used in refinement at all.
 * This is equivalent to {@link jaftingNotRefinementBase} and {@link jaftingNotRefinementMaterial}
 * existing on the same equip.
 * @type {boolean}
 */
Object.defineProperty(RPG_EquipItem.prototype, "jaftingUnrefinable", {
  get: function()
  {
    return this.getJaftingUnrefinable();
  },
});

/**
 * Gets whether or not this equip is blocked from being used as a material for refinement.
 * @returns {boolean}
 */
RPG_EquipItem.prototype.getJaftingUnrefinable = function()
{
  // check if the notes say this is explicitly unrefinable.
  let unrefinable = RPGManager.checkForBooleanFromNoteByRegex(this, J.JAFTING.EXT.REFINE.RegExp.Unrefinable);

  // if the notes didn't have the tag, lets check for the other pair.
  if (!unrefinable)
  {
    // see if this equip cannot be used as both base and material for refinement.
    const notForBase = this.jaftingNotRefinementBase;
    const notForMaterial = this.jaftingNotRefinementMaterial;

    // check if it is alternatively unrefinable.
    if (notForBase && notForMaterial)
    {
      // flip the flag.
      unrefinable = true;
    }
  }

  // return our result.
  return unrefinable;
};
//endregion unrefinable

//region maxRefineCount
/**
 * The maximum number of times this equip can be refined.
 * @type {number}
 */
Object.defineProperty(RPG_EquipItem.prototype, "jaftingMaxRefineCount", {
  get: function()
  {
    return RPGManager.getNumberFromNoteByRegex(this, J.JAFTING.EXT.REFINE.RegExp.MaxRefineCount);
  },
});
//endregion maxRefineCount

//region maxTraitCount
/**
 * The maximum number of traits this equip can be gain as a result of refinement.
 * This is defined as the number of traits that come after the divider.
 * @type {number}
 */
Object.defineProperty(RPG_EquipItem.prototype, "jaftingMaxTraitCount", {
  get: function()
  {
    return RPGManager.getNumberFromNoteByRegex(this, J.JAFTING.EXT.REFINE.RegExp.MaxTraitCount);
  },
});
//endregion maxRefineCount
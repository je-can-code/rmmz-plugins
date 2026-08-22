//region RPG_EquipItem
//region skillId
/**
 * The skill id associated with this equipment.
 * This is typically found on weapons and offhand armors.
 * @type {number|null}
 */
Object.defineProperty(RPG_EquipItem.prototype, 'jabsSkillId', {
  get: function()
  {
    return RPGManager.getNumberFromNoteByRegex(this, J.ABS.RegExp.SkillId, true);
  },
});
//endregion skillId

//region offhand skillId
/**
 * The offhand skill id override from this equip.
 * @type {number}
 */
Object.defineProperty(RPG_EquipItem.prototype, 'jabsOffhandSkillId', {
  get: function()
  {
    return RPGManager.getNumberFromNoteByRegex(this, J.ABS.RegExp.OffhandSkillId, true);
  },
});
//endregion offhand skillId

//region guard skillId
/**
 * The guard skill id declared by this equip, if any.
 * Lives independently of {@link jabsSkillId}/{@link jabsOffhandSkillId}- an offhand item
 * with no guard skill declared grants no guarding capability at all, regardless of
 * whatever attack skill it or the mainhand weapon provides.
 * @type {number|null}
 */
Object.defineProperty(RPG_EquipItem.prototype, 'jabsGuardSkillId', {
  get: function()
  {
    return RPGManager.getNumberFromNoteByRegex(this, J.ABS.RegExp.GuardSkillId, true);
  },
});
//endregion guard skillId

//region useOnPickup
/**
 * Normally defines whether or not an item will be automatically used
 * upon being picked up, however, equipment cannot be "used".
 * @type {false}
 */
Object.defineProperty(RPG_EquipItem.prototype, 'jabsUseOnPickup', {
  get: function()
  {
    return false;
  },
});
//endregion useOnPickup

//region expiration
/**
 * The expiration time in frames for this equip drop.
 * @type {number|null}
 */
Object.defineProperty(RPG_EquipItem.prototype, 'jabsExpiration', {
  get: function()
  {
    return RPGManager.getNumberFromNoteByRegex(this, J.ABS.RegExp.Expires, true);
  },
});
//endregion expiration

//region skillTransforms
/**
 * The collection of skill transforms defined on this piece of equipment.
 *
 * Each entry is a two-number array in the form:
 * [ baseSkillId, transformedSkillId ]
 *
 * While a battler has this equip equipped, any slot whose base skill id matches
 * {@code baseSkillId} will execute as {@code transformedSkillId} instead,
 * without mutating the slot's stored id.
 * @type {number[][]}
 */
Object.defineProperty(RPG_EquipItem.prototype, 'jabsSkillTransforms', {
  get: function()
  {
    return RPGManager.getArraysFromNotesByRegex(this, J.ABS.RegExp.SkillTransform);
  },
});
//endregion skillTransforms
//endregion RPG_EquipItem
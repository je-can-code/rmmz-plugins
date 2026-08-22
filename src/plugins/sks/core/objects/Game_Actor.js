//region Game_Actor
import SkillEquipSlot from './../_models/SkillEquipSlot.js';

//region init
/**
 * Extends {@link #initMembers}.<br/>
 * Also initializes the skill slots members.
 */
J.SKS.Aliased.Game_Actor.set('initMembers', Game_Actor.prototype.initMembers);
Game_Actor.prototype.initMembers = function()
{
  // perform original logic.
  J.SKS.Aliased.Game_Actor.get('initMembers')
    .call(this);

  // initialize skill slots members.
  this.initSkillSlotsMembers();
};

/**
 * Initializes all members associated with the skill slots system.
 */
Game_Actor.prototype.initSkillSlotsMembers = function()
{
  /**
   * The shared root namespace for all of J's plugin data.
   */
  this._j ||= {};

  /**
   * A grouping of all properties associated with SKS.
   */
  this._j._sks = {};

  /**
   * The ordered array of equipped skill slots for this actor.
   * @type {SkillEquipSlot[]}
   */
  this._j._sks._slots = [];

  /**
   * A map of slot index to equipped skill id for fast lookups.
   * @type {Map<number, number>}
   */
  this._j._sks._slotMap = new Map();

  /**
   * The cached set of skill ids exempted from the slot requirement for this battler
   * specifically, per {@link J.SKS.RegExp.UnslottedSkills}. Null until first computed,
   * and invalidated back to null whenever {@link #onBattlerDataChange} fires.
   * @type {Set<number>|null}
   */
  this._j._sks._forcedUnslottedSkillIds = null;
};
//endregion init

//region event hooks
/**
 * Extends {@link #onBattlerDataChange}.<br/>
 * Invalidates the forced-unslotted-skills cache and prunes any slot that no longer
 * holds a skill this actor actually knows, since whatever changed (equip, class,
 * state, level) may have altered either.
 */
J.SKS.Aliased.Game_Actor.set('onBattlerDataChange', Game_Actor.prototype.onBattlerDataChange);
Game_Actor.prototype.onBattlerDataChange = function()
{
  // perform original logic.
  J.SKS.Aliased.Game_Actor.get('onBattlerDataChange')
    .call(this);

  // the cached forced-unslotted set may now be stale- clear it so it recomputes on next read.
  this._j._sks._forcedUnslottedSkillIds = null;

  // clear out any slot whose skill this actor no longer actually knows.
  this.pruneStaleSlots();
};
//endregion event hooks

//region accessors
/**
 * Gets the ordered array of equipped skill slots for this actor.
 * @returns {SkillEquipSlot[]}
 */
Game_Actor.prototype.slots = function()
{
  return this._j._sks._slots;
};

/**
 * Gets the slot map for this actor.
 * @returns {Map<number, number>}
 */
Game_Actor.prototype.slotMap = function()
{
  return this._j._sks._slotMap;
};

/**
 * Clears all entries from the slot map.
 */
Game_Actor.prototype.clearSlotMap = function()
{
  // clear all entries from the map.
  this.slotMap()
    .clear();
};

/**
 * Gets the skill id currently assigned to a given slot index.
 * @param {number} slotIndex - The index of the slot to inspect.
 * @returns {number} - The skill id in the slot, or 0 if the slot is empty.
 */
Game_Actor.prototype.getSkillIdInSlot = function(slotIndex)
{
  // grab the id from the slot map.
  const id = this.slotMap()
    .get(slotIndex);

  // return the id, or 0 if the slot is empty.
  return id ?? 0;
};

/**
 * Gets the slot index where the given skill is currently equipped.
 * @param {number} skillId - The id of the skill to locate.
 * @returns {number} - The slot index where the skill is equipped, or -1 if not found.
 */
Game_Actor.prototype.getEquippedSkillIndex = function(skillId)
{
  // iterate over the slot map to find the matching skill.
  for (const [ slotIndex, slotSkillId ] of this.slotMap())
  {
    // if this slot contains the skill, return its index.
    if (slotSkillId === skillId) return slotIndex;
  }

  // the skill was not found in any slot.
  return -1;
};

/**
 * Gets the maximum number of skill slots available to this actor.
 * Baseline comes from a {@link J.SKS.RegExp.BaseSlots} tag on the actor or class, falling back to
 * the plugin's configured default when neither carries the tag. Bonus amounts from
 * {@link J.SKS.RegExp.MaxSlots} tags anywhere in {@link #getAllNotes} stack on top of that baseline.
 * @returns {number}
 */
Game_Actor.prototype.maxSlots = function()
{
  // resolve the baseline from the actor/class only, falling back to the plugin default when absent.
  const baseline = RPGManager.getResultsFromAllNotesByRegex(
    this.getActorNotes(), J.SKS.RegExp.BaseSlots, 0, this, true) ?? J.SKS.Metadata.defaultMaxSkillSlots;

  // sum every bonus tag found across the actor's full note sources.
  const bonus = RPGManager.getResultsFromAllNotesByRegex(
    this.getAllNotes(), J.SKS.RegExp.MaxSlots, 0, this, false);

  // combine baseline and bonus, never going below zero.
  return Math.max(0, baseline + bonus);
};

/**
 * Gets the maximum number of slot points available to this actor.
 * Baseline comes from a {@link J.SKS.RegExp.BaseSlotPoints} tag on the actor or class, falling back
 * to the plugin's configured default when neither carries the tag. Bonus amounts from
 * {@link J.SKS.RegExp.MaxSlotPoints} tags anywhere in {@link #getAllNotes} stack on top of that
 * baseline.
 * @returns {number}
 */
Game_Actor.prototype.maxSlotPoints = function()
{
  // resolve the baseline from the actor/class only, falling back to the plugin default when absent.
  const baseline = RPGManager.getResultsFromAllNotesByRegex(
    this.getActorNotes(), J.SKS.RegExp.BaseSlotPoints, 0, this, true) ?? J.SKS.Metadata.defaultMaxSkillSlotPoints;

  // sum every bonus tag found across the actor's full note sources.
  const bonus = RPGManager.getResultsFromAllNotesByRegex(
    this.getAllNotes(), J.SKS.RegExp.MaxSlotPoints, 0, this, false);

  // combine baseline and bonus, never going below zero.
  return Math.max(0, baseline + bonus);
};

/**
 * Gets the total number of slot points currently spent by this actor.
 * @returns {number}
 */
Game_Actor.prototype.spentSlotPoints = function()
{
  // start from zero.
  let points = 0;

  // iterate over all equipped slots and accumulate their costs.
  for (const [ , skillId ] of this.slotMap())
  {
    // add the slot cost of this skill to the running total.
    points += this.skill(skillId).slotCost;
  }

  // return the accumulated total.
  return points;
};

/**
 * Gets the number of slot points remaining after all equipped skills are accounted for.
 * @returns {number}
 */
Game_Actor.prototype.remainingSlotPoints = function()
{
  return this.maxSlotPoints() - this.spentSlotPoints();
};

/**
 * Whether or not this actor has enough slot points to cover the given cost.
 * @param {number} points - The number of points to check against.
 * @returns {boolean}
 */
Game_Actor.prototype.hasSufficientSlotPoints = function(points)
{
  // skills that cost nothing can always be equipped.
  if (points <= 0) return true;

  // if no points remain and a cost is required, the actor cannot equip.
  if (this.remainingSlotPoints() <= 0) return false;

  // confirm the total after adding this cost does not exceed the maximum.
  return (this.spentSlotPoints() + points) <= this.maxSlotPoints();
};

/**
 * Gets only the skills this actor currently has equipped in slots.
 * This is the filtered view intended for the JABS quick menu and CMS.
 * @returns {RPG_Skill[]}
 */
Game_Actor.prototype.equippedSkills = function()
{
  // gather all skills this actor has learned.
  const learned = this.skills();

  // build a set of equipped skill ids from the slot map for fast lookups.
  const equippedIds = new Set();

  // populate the set with every skill id currently in a slot.
  for (const [ , skillId ] of this.slotMap())
  {
    // add the skill id to the lookup set.
    equippedIds.add(skillId);
  }

  // filter the learned skills down to only those present in the equipped set.
  const equippedSkills = learned.filter(skill =>
  {
    // include only valid skills that are currently equipped in a slot.
    return skill && equippedIds.has(skill.id);
  });

  // return the filtered list.
  return equippedSkills;
};

/**
 * Gets the set of skill ids exempted from the slot requirement for this battler
 * specifically, per {@link J.SKS.RegExp.UnslottedSkills} tags found anywhere across
 * {@link #getAllNotes}. Unlike a skill's own {@link RPG_Skill#unslotted} tag, this
 * exemption applies only to this battler- the same skill still costs a slot for
 * anyone who has to learn-then-equip it through the normal pipeline. Cached until
 * {@link #onBattlerDataChange} invalidates it.
 * @returns {Set<number>}
 */
Game_Actor.prototype.forcedUnslottedSkillIds = function()
{
  // return the cached set if it has already been computed since the last data change.
  if (this._j._sks._forcedUnslottedSkillIds !== null) return this._j._sks._forcedUnslottedSkillIds;

  // scan every note source for the tag, yielding one raw array of ids per tag found.
  const arraysFound = RPGManager.getArraysFromAllNotesByRegex(
    this.getAllNotes(), J.SKS.RegExp.UnslottedSkills);

  // flatten every array found into a single deduplicated set of skill ids.
  this._j._sks._forcedUnslottedSkillIds = new Set(arraysFound.flat());

  // return the freshly-computed and now-cached set.
  return this._j._sks._forcedUnslottedSkillIds;
};

//endregion accessors

//region slot management
/**
 * Assigns a skill to a slot entry, updating both the slots array and the slot map.
 * @param {number} index - The slot index to assign to.
 * @param {number} skillId - The id of the skill to assign.
 */
Game_Actor.prototype.assignSlot = function(index, skillId)
{
  // build the new slot entry.
  const skillEquipSlot = new SkillEquipSlot(index, skillId);

  // store the slot entry in the slots array.
  this.slots()[index] = skillEquipSlot;

  // mirror the assignment in the slot map for fast lookups.
  this.slotMap()
    .set(index, skillId);
};

/**
 * Removes the slot entry at the given index from both the slots array and the slot map.
 * @param {number} index - The slot index to remove.
 */
Game_Actor.prototype.deleteSlot = function(index)
{
  // remove the entry from the slots array.
  delete this.slots()[index];

  // remove the entry from the slot map.
  this.slotMap()
    .delete(index);
};

//endregion slot management

//region actions
/**
 * Equips a skill to a slot after validating that the actor can afford the cost.
 * @param {number} slotIndex - The index of the slot to equip into.
 * @param {number} skillId - The id of the skill to equip.
 */
Game_Actor.prototype.equipSkillToSlot = function(slotIndex, skillId)
{
  // validate the skill can be equipped to this slot before proceeding.
  if (this.canEquipSkillToSlot(slotIndex, skillId) === false) return;

  // perform the equip operation.
  this.updateEquipSkillSlot(slotIndex, skillId);

  // notify observers that the equip state has changed.
  this.onSkillEquipChange(slotIndex, skillId);
};

/**
 * Determines whether a skill can be equipped into the given slot by this actor.
 * Gating depends on the plugin's configured mode: by default both slot count and
 * slot points must permit the equip (tandem mode); when exclusive mode is enabled,
 * only one of those two capacities is checked at all, per {@link J.SKS.Metadata.slotsOnly}.
 * @param {number} slotIndex - The index of the slot to check.
 * @param {number} skillId - The id of the skill to check.
 * @returns {boolean}
 */
Game_Actor.prototype.canEquipSkillToSlot = function(slotIndex, skillId)
{
  // if this skill is already equipped somewhere, moving it incurs no additional
  // cost or slot usage- the source slot is still occupied at this point in time,
  // so treating this as "new" usage would wrongly double-count it.
  if (this.getEquippedSkillIndex(skillId) !== -1) return true;

  // check what is currently occupying the target slot. A slot already holding this very skill is
  // covered by the check above- `getEquippedSkillIndex` scans every slot, target included - so
  // whatever is here is necessarily a different skill being displaced.
  const currentSkillId = this.getSkillIdInSlot(slotIndex);

  // resolve whether points and count each independently permit this equip.
  const pointsOk = this.canAffordSkillSlotPoints(slotIndex, skillId, currentSkillId);
  const countOk = this.canAffordSkillSlotCount(currentSkillId);

  // consult the plugin's configured mode to decide which capacities actually gate.
  if (J.SKS.Metadata.enableExclusiveMode)
  {
    // in exclusive mode, only the configured capacity matters- the other is ignored entirely.
    return J.SKS.Metadata.slotsOnly
      ? countOk
      : pointsOk;
  }

  // in tandem mode (the default), both capacities must permit the equip.
  return pointsOk && countOk;
};

/**
 * Determines whether this actor has enough slot points to place the given skill
 * into the given slot, accounting for whatever skill is being displaced.
 * @param {number} slotIndex - The index of the slot being targeted.
 * @param {number} skillId - The id of the incoming skill.
 * @param {number} currentSkillId - The id of the skill currently occupying the slot, or 0 if empty.
 * @returns {boolean}
 */
Game_Actor.prototype.canAffordSkillSlotPoints = function(slotIndex, skillId, currentSkillId)
{
  // resolve the cost of the incoming skill for this slot.
  const newCost = this.skillSlotCost(skillId, slotIndex);

  // free skills never strain the point budget, regardless of what they displace.
  if (newCost <= 0) return true;

  // compute the cost of the skill currently in the target slot, if any.
  const currentCost = this.skillSlotCost(currentSkillId, slotIndex);

  // determine the hypothetical spend after swapping the occupant for the new skill.
  const hypotheticalSpent = this.spentSlotPoints() - currentCost + newCost;

  // allow only if the hypothetical spend stays within the actor's maximum.
  return hypotheticalSpent <= this.maxSlotPoints();
};

/**
 * Determines whether this actor has room for one more occupied slot, unless the
 * target slot is already occupied- in which case no new slot usage is introduced.
 * @param {number} currentSkillId - The id of the skill currently occupying the target slot, or 0 if empty.
 * @returns {boolean}
 */
Game_Actor.prototype.canAffordSkillSlotCount = function(currentSkillId)
{
  // an occupied target slot is being replaced in-place, not newly consumed.
  const isNewSlotUsage = currentSkillId === 0;

  // a replacement never needs a free slot; only new usage needs to fit under the cap.
  return isNewSlotUsage === false || this.hasSufficientSlotCount();
};

/**
 * Determines if this actor has an available slot beyond what is currently occupied.
 * @returns {boolean}
 */
Game_Actor.prototype.hasSufficientSlotCount = function()
{
  // compare the true occupant count against the actor's maximum slot count.
  return this.slotMap().size < this.maxSlots();
};

/**
 * Resolves the effective slot cost for a skill in a given slot context.
 * @param {number} skillId - The id of the skill to resolve the cost for.
 * @param {number} slotIndex - The slot index context (reserved for future cost modifiers).
 * @returns {number}
 */
// eslint-disable-next-line no-unused-vars
Game_Actor.prototype.skillSlotCost = function(skillId, slotIndex)
{
  // free-id skills have no cost.
  if (skillId <= 0) return 0;

  // resolve and return the base cost from the skill's notetag.
  return this.skill(skillId).slotCost;
};

/**
 * Determines if this actor has enough slot points to equip the specified skill.
 * @param {number} skillId - The id of the skill to check.
 * @returns {boolean}
 */
Game_Actor.prototype.hasEquipSkillPoints = function(skillId)
{
  // resolve the cost of this skill.
  const { slotCost } = this.skill(skillId);

  // free skills can always be equipped.
  if (slotCost <= 0) return true;

  // if the skill is already equipped, it can be moved without additional cost.
  if (this.getEquippedSkillIndex(skillId) !== -1) return true;

  // confirm there are enough remaining points to cover the cost.
  return this.hasSufficientSlotPoints(slotCost);
};

/**
 * Performs the actual slot assignment for an equip operation, handling displacement
 * of existing occupants and de-duplication of the incoming skill.
 * @param {number} slotIndex - The target slot index.
 * @param {number} skillId - The skill id to place into the slot.
 */
Game_Actor.prototype.updateEquipSkillSlot = function(slotIndex, skillId)
{
  // find if this skill is already equipped in another slot.
  const existingSlotIndex = this.getEquippedSkillIndex(skillId);

  // if the skill is already equipped elsewhere, remove it from that slot first.
  if (existingSlotIndex !== -1)
  {
    // remove the skill from its previous slot.
    this.deleteSlot(existingSlotIndex);

    // notify observers that the old slot was vacated.
    this.onSkillUnequipChange(existingSlotIndex, skillId);
  }

  // check whether the target slot already has a skill in it.
  const displacedSkillId = this.getSkillIdInSlot(slotIndex);

  // if a skill is being displaced, notify observers before it is removed.
  if (displacedSkillId > 0)
  {
    // notify observers that the displaced skill is leaving this slot.
    this.onSkillUnequipChange(slotIndex, displacedSkillId);
  }

  // place the new skill into the target slot.
  this.assignSlot(slotIndex, skillId);
};

/**
 * Unequips whatever skill is currently occupying the specified slot.
 * @param {number} slotIndex - The index of the slot to clear.
 */
Game_Actor.prototype.unequipSkillFromSlot = function(slotIndex)
{
  // determine what skill is currently in this slot.
  const currentSkillId = this.getSkillIdInSlot(slotIndex);

  // if the slot is already empty, there is nothing to do.
  if (currentSkillId === 0) return;

  // remove the slot entry.
  this.deleteSlot(slotIndex);

  // notify observers that this skill has been unequipped.
  this.onSkillUnequipChange(slotIndex, currentSkillId);
};

/**
 * Unequips every slot whose skill this actor no longer actually knows- e.g. after a
 * class change or state removal takes away access to something that was equipped.
 * Left in place, a stale slot would keep pointing at a skill the actor can't use.
 */
Game_Actor.prototype.pruneStaleSlots = function()
{
  // snapshot the occupied indices first, since unequipping mutates the slot map mid-iteration.
  const occupiedIndices = [ ...this.slotMap()
    .keys() ];

  // check each occupied slot against what this actor currently knows.
  occupiedIndices.forEach(slotIndex =>
  {
    // resolve the skill currently sitting in this slot.
    const skillId = this.getSkillIdInSlot(slotIndex);

    // still known- nothing to prune here.
    if (this.hasSkill(skillId)) return;

    // no longer known- clear the stale slot.
    this.unequipSkillFromSlot(slotIndex);
  });
};

/**
 * Unequips the specified skill from whichever slot it currently occupies.
 * @param {number} skillId - The id of the skill to unequip.
 */
Game_Actor.prototype.unequipSkill = function(skillId)
{
  // find which slot this skill is currently in.
  const index = this.getEquippedSkillIndex(skillId);

  // if the skill is not equipped anywhere, there is nothing to do.
  if (index === -1) return;

  // delegate to the slot-based unequip method.
  this.unequipSkillFromSlot(index);
};

/**
 * Moves the skill in one slot into another slot, respecting all point and cost rules.
 * @param {number} fromIndex - The source slot index to move from.
 * @param {number} toIndex - The destination slot index to move to.
 */
Game_Actor.prototype.moveEquippedSkill = function(fromIndex, toIndex)
{
  // dropping a skill back onto the slot it came from is an ordinary gesture in the equip menu, and
  // it means "leave it alone". Without this the destination check below matches the source, and the
  // skill gets unequipped out of the very slot it never left.
  if (fromIndex === toIndex) return;

  // determine what skill is in the source slot.
  const skillId = this.getSkillIdInSlot(fromIndex);

  // if the source slot is empty, there is nothing to move.
  if (skillId === 0) return;

  // attempt to equip the skill into the destination slot.
  this.equipSkillToSlot(toIndex, skillId);

  // if the move succeeded, explicitly clear the source slot.
  if (this.getSkillIdInSlot(toIndex) === skillId)
  {
    // remove the skill from the source slot now that the destination is set.
    this.unequipSkillFromSlot(fromIndex);
  }
};

//endregion actions

//region event hooks
/**
 * A hook fired when a skill is successfully equipped to a slot.
 * @param {number} slotIndex - The index of the slot that was equipped.
 * @param {number} skillId - The id of the skill that was equipped.
 */
// eslint-disable-next-line no-unused-vars
Game_Actor.prototype.onSkillEquipChange = function(slotIndex, skillId)
{
  // no-op by default; extensions may observe this.
};

/**
 * A hook fired when a skill is unequipped from a slot.
 * @param {number} slotIndex - The index of the slot that was vacated.
 * @param {number} skillId - The id of the skill that was unequipped.
 */
// eslint-disable-next-line no-unused-vars
Game_Actor.prototype.onSkillUnequipChange = function(slotIndex, skillId)
{
  // no-op by default; extensions may observe this.
};

//endregion event hooks

//endregion Game_Actor
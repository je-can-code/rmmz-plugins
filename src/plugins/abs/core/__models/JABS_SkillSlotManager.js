//region JABS_SkillSlotManager
import JABS_SkillSlot from './JABS_SkillSlot.js';
import JABS_Battler from './JABS_Battler.js';
import JABS_AiManager from './../managers/JABS_AiManager.js';
/**
 * A class responsible for managing the skill slots on an actor.
 */
class JABS_SkillSlotManager
{
  /**
   * Constructor.
   */
  constructor()
  {
    this.initialize();
  }

  /**
   * Initializes this class. Executed when this class is instantiated.
   */
  initialize()
  {
    // setup the properties of this class.
    this.initMembers();
  }

  /**
   * Initializes all properties on this class.
   */
  initMembers()
  {
    /**
     * All skill slots that a battler possesses.
     *
     * These are in a fixed order.
     * @type {JABS_SkillSlot[]}
     */
    // store  slots on the instance for later reads.
    this._slots = [];

    /**
     * A single flip that gets toggled when this class no longer requires a setup.
     * @type {boolean}
     * @private
     */
    this._setupComplete = false;
  }

  /**
   * Gets whether or not this skill slot manager has been setup yet.
   * @returns {boolean}
   */
  isSetupComplete()
  {
    return this._setupComplete;
  }

  /**
   * Finalizes the initialization of this skill slot manager.
   */
  completeSetup()
  {
    // flag it as setup.
    this._setupComplete = true;
  }

  /**
   * Sets up the slots for the given battler.
   * @param {Game_Actor|Game_Enemy} battler The battler to setup slots for.
   */
  setupSlots(battler)
  {
    // actors only get one setup!
    if (this.isSetupComplete() && battler.isActor()) return;

    // initialize the slots.
    this.initializeBattlerSlots();

    // either actor or enemy, no in between!
    switch (true)
    {
      case (battler.isActor()):
        this.setupActorSlots();
        break;
      case (battler.isEnemy()):
        this.setupEnemySlots(battler);
        break;
    }

    // flag the setup as complete.
    this.completeSetup();
  }

  /**
   * Gets all skill slots, regardless of whether or not their are assigned.
   * @returns {JABS_SkillSlot[]}
   */
  getAllSlots()
  {
    return this._slots;
  }

  /**
   * Initializes the slot collection to a new collection of slots.
   */
  initializeBattlerSlots()
  {
    // initialize the slots.
    this._slots = [];
  }

  /**
   * Setup the slots for an actor.
   * All actors have the same set of slots.
   */
  setupActorSlots()
  {
    this._slots.push(new JABS_SkillSlot(J.ABS.Globals.GlobalCooldownKey, 0));
    this._slots.push(new JABS_SkillSlot(JABS_Button.Mainhand, 0));
    this._slots.push(new JABS_SkillSlot(JABS_Button.Offhand, 0));
    // Append the row to the working collection.
    this._slots.push(new JABS_SkillSlot(JABS_Button.Tool, 0));
    this._slots.push(new JABS_SkillSlot(JABS_Button.Dodge, 0));

    // Append the row to the working collection.
    this._slots.push(new JABS_SkillSlot(JABS_Button.CombatSkill1, 0));
    this._slots.push(new JABS_SkillSlot(JABS_Button.CombatSkill2, 0));
    this._slots.push(new JABS_SkillSlot(JABS_Button.CombatSkill3, 0));
    this._slots.push(new JABS_SkillSlot(JABS_Button.CombatSkill4, 0));
  }

  /**
   * Setup slots for an enemy.
   * Each enemy can have varying slots.
   * @param {Game_Enemy} enemy The enemy to setup slots for.
   */
  setupEnemySlots(enemy)
  {
    // grab the database data.
    const battlerData = enemy.databaseData();

    // filter the skills.
    const skillIds = battlerData.actions
      .filter(action => this.filterActionSkills(enemy, action))
      .map(action => action.skillId);

    // grab the basic attack skill id as well.
    const basicAttackSkillId = enemy.basicAttackSkillId();

    // check to make sure we found one.
    if (basicAttackSkillId)
    {
      // add it to the list if we did.
      skillIds.push(basicAttackSkillId);
    }

    // dedupe so we never register the same skill twice under different keys.
    const uniqueSkillIds = [];

    skillIds.forEach(skillId =>
    {
      if (!uniqueSkillIds.includes(skillId))
      {
        uniqueSkillIds.push(skillId);
      }
    });

    // first dodge-type and guard-type skills win (matches actor slot semantics).
    let dodgeSkillId = 0;
    let guardSkillId = 0;

    uniqueSkillIds.forEach(skillId =>
    {
      if (!dodgeSkillId && JABS_Battler.isDodgeSkillById(skillId))
      {
        dodgeSkillId = skillId;
      }

      if (!guardSkillId && JABS_Battler.isGuardSkillById(skillId))
      {
        guardSkillId = skillId;
      }
    });

    // always mirror actors: dodge lives on the dodge slot (may stay empty).
    this.addSlot(JABS_Button.Dodge, dodgeSkillId);

    // guard skills mirror actors: players equip guard on offhand (performGuard / autocounter use Offhand).
    this.addSlot(JABS_Button.Offhand, guardSkillId);

    // remaining skills keep per-skill arbitrary keys for ai/cooldown isolation.
    uniqueSkillIds.forEach(skillId =>
    {
      if (skillId === dodgeSkillId || skillId === guardSkillId)
      {
        return;
      }

      // grab the skill itself.
      const skill = enemy.skill(skillId);

      // calculate the cooldown key.
      const slotKey = JABS_AiManager.buildEnemyCooldownType(skill);

      // add the slot to the manager for this enemy.
      this.addSlot(slotKey, skillId);
    }, this);
  }

  /**
   * A filter function for whether or not a skill should be included in the skill slot manager for enemies.
   * @param {Game_Enemy} enemy The enemy to check.
   * @param {RPG_EnemyAction} action The action to check.
   */
  filterActionSkills(enemy, action)
  {
    return true;
  }

  /**
   * Flags all skillslots for needing visual refresh for the input frame.
   */
  flagAllSkillSlotsForRefresh()
  {
    this._slots.forEach(slot => slot.flagSkillSlotForRefresh());
  }

  /**
   * Adds a slot with the given slot key and skill id.
   * If a slot with the same key already exists, no action will be taken.
   * @param {string} key The slot key.
   * @param {number} initialSkillId The skill id to set to this slot.
   */
  addSlot(key, initialSkillId)
  {
    // check if the slot key already exists on the manager.
    const exists = this._slots.find(slot => slot.key === key);

    // if it exists, then don't re-add this slot.
    if (exists) return;

    // add the slot with the designated key and skill id.
    this._slots.push(new JABS_SkillSlot(key, initialSkillId));
  }

  /**
   * Gets all skill slots identified as "primary".
   * @returns {JABS_SkillSlot[]}
   */
  getAllPrimarySlots()
  {
    return this.getAllSlots()
      .filter(slot => slot.isPrimarySlot());
  }

  /**
   * Gets all skill slots identified as "secondary".
   * @returns {JABS_SkillSlot[]}
   */
  getAllSecondarySlots()
  {
    return this.getAllSlots()
      .filter(slot => slot.isSecondarySlot());
  }

  /**
   * Gets the skill dedicated to the tool slot.
   * @returns {JABS_SkillSlot}
   */
  getToolSlot()
  {
    return this.getSkillSlotByKey(JABS_Button.Tool);
  }

  /**
   * Gets the skill dedicated to the dodge slot.
   * @returns {JABS_SkillSlot}
   */
  getDodgeSlot()
  {
    return this.getSkillSlotByKey(JABS_Button.Dodge);
  }

  /**
   * Gets all skill slots that have a skill assigned.
   * @returns {JABS_SkillSlot[]}
   */
  getEquippedSlots()
  {
    return this.getAllSlots()
      .filter(skillSlot => skillSlot.isUsable());
  }

  /**
   * Gets all secondary skill slots that are unassigned.
   * @returns {JABS_SkillSlot[]}
   */
  getEmptySecondarySlots()
  {
    return this.getAllSecondarySlots()
      .filter(skillSlot => skillSlot.isEmpty());
  }

  /**
   * Gets a skill slot by its key.
   * @param {string} key The key to find the matching slot for.
   * @returns {JABS_SkillSlot}
   */
  getSkillSlotByKey(key)
  {
    return this.getAllSlots()
      .find(skillSlot => skillSlot.key === key);
  }

  /**
   * Gets the entire skill slot of the slot containing the skill id.
   * @param {number} skillIdToFind The skill id to find.
   * @returns {JABS_SkillSlot}
   */
  getSlotBySkillId(skillIdToFind)
  {
    // check if the skill to find is the base skill of a slot.
    let foundSlot = this.getEquippedSlots()
      .find(skillSlot => skillSlot.id === skillIdToFind);

    // validate we found a slot for the skill.
    if (!foundSlot)
    {
      // check if the skill id is actually the combo skill of one of the slots.
      foundSlot = this.getEquippedSlots()
        .find(skillSlot => skillSlot.comboId === skillIdToFind);
    }

    // return the found slot.
    return foundSlot;
  }

  /**
   * Sets a new skill to a designated slot.
   * @param {string} key The key of the slot to set.
   * @param {number} skillId The id of the skill to assign to the slot.
   * @param {boolean} locked Whether or not the slot should be locked.
   */
  setSlot(key, skillId, locked)
  {
    this.getSkillSlotByKey(key)
      .setSkillId(skillId)
      .setLock(locked);
  }

  /**
   * Gets the combo id of the given skill slot.
   * @param {string} key The skill slot key.
   * @returns {number} Pending combo skill id for the slot, or 0 when there is no combo or the key does not match a slot.
   */
  getSlotComboId(key)
  {
    // grab the slot once; callers treat 0 as "no combo" (see getSkillIdForAction, canExecuteSkill).
    const jabsSkillSlot = this.getSkillSlotByKey(key);

    if (!jabsSkillSlot)
    {
      // never return a real database skill id here — a bad key or desync must not execute skill #1 (or any arbitrary id).
      console.warn(`[J-ABS] getSlotComboId: no skill slot for key "${key}". Returning 0 (no combo).`);

      return 0;
    }

    return jabsSkillSlot.getComboId();
  }

  /**
   * Sets the combo id of the given skill slot.
   * @param {string} key The new skill slot key.
   * @param {number} comboId The new combo skill id.
   */
  setSlotComboId(key, comboId)
  {
    // shorthand the skill slot.
    const skillSlot = this.getSkillSlotByKey(key);

    // set the new combo id.
    skillSlot.setComboId(comboId);

    // flag for refresh.
    skillSlot.flagSkillSlotForRefresh();
  }

  /**
   * Updates the cooldowns of all slots with a skill in them.
   */
  updateCooldowns()
  {
    // this.getAllSlots() // use this if slots should update when there is no skill in them.
    this.getEquippedSlots()
      .forEach(slot => slot.updateCooldown());
  }

  /**
   * Determines if either cooldown is available for the given slot.
   * @param {string} key The slot.
   * @returns {boolean} True if one of the cooldowns is ready, false if both are not.
   */
  isAnyCooldownReadyForSlot(key)
  {
    // shorthand the slot.
    const slot = this.getSkillSlotByKey(key);

    // shorthand the cooldown.
    const cooldown = slot.getCooldown();

    // whether or not the slot has a combo id available to it.
    const hasComboId = (slot.getComboId() !== 0);

    // check if the combo cooldown is flagged as ready.
    const comboCooldownReady = cooldown.isComboReady();

    // if we have both a combo id and a ready, we can use a combo.
    const isComboReady = hasComboId && comboCooldownReady;

    // if the base cooldown is ready, thats it- its ready.
    const isBaseReady = cooldown.isBaseReady();

    // whether or not either type of cooldown is available.
    const isAnyReady = (isComboReady || isBaseReady);

    // return our result.
    return isAnyReady;
  }

  /**
   * Clears and unlocks a skill slot by its key.
   * @param {string} key The key of the slot to clear.
   */
  clearSlot(key)
  {
    this.getSkillSlotByKey(key)
      .clear();
  }

  /**
   * Unlocks all slots owned by this actor.
   */
  unlockAllSlots()
  {
    this.getAllSlots()
      .forEach(slot => slot.unlock());
  }

  //region offhand pin
  /**
   * Gets the skill id pinned to the offhand slot, or 0 when no pin is set.
   *
   * Convenience wrapper to keep callers (Game_Actor, plugin commands, scenes) from
   * threading the slot key through their resolution code.
   * @returns {number}
   */
  getOffhandPinnedSkillId()
  {
    // grab the offhand slot directly; return 0 if it is not present yet.
    const offhandSlot = this.getSkillSlotByKey(JABS_Button.Offhand);
    if (!offhandSlot) return 0;

    // delegate the read to the slot itself so legacy field handling is centralized.
    return offhandSlot.getPinnedSkillId();
  }

  /**
   * Sets the skill id pinned to the offhand slot.
   *
   * Pass 0 to clear the pin. Returns silently when the offhand slot does not yet exist
   * (battlers initialize their slots lazily).
   * @param {number} skillId The skill id to pin into the offhand slot, or 0 to clear.
   */
  setOffhandPinnedSkillId(skillId)
  {
    // do nothing if the offhand slot is not yet initialized for this battler.
    const offhandSlot = this.getSkillSlotByKey(JABS_Button.Offhand);
    if (!offhandSlot) return;

    // delegate the write to the slot, which handles change-detection and onChange.
    offhandSlot.setPinnedSkillId(skillId);
  }

  /**
   * Clears the pin on the offhand slot, if any.
   */
  clearOffhandPin()
  {
    this.setOffhandPinnedSkillId(0);
  }
  //endregion offhand pin
}

SerializableRegistry.register(JABS_SkillSlotManager);

export default JABS_SkillSlotManager;
//endregion JABS_SkillSlotManager
//region Game_Battler
import JABS_StateBuilder from '../models/JABS_StateBuilder.js';
import JABS_State from '../models/JABS_State.js';
import JABS_SkillSlotManager from '../models/JABS_SkillSlotManager.js';
import JABS_SkillSlot from '../models/JABS_SkillSlot.js';
import JABS_OnChanceEffect from '../models/JABS_OnChanceEffect.js';
import JABS_EnemyAI from '../models/JABS_EnemyAI.js';
import JABS_Battler from '../models/JABS_Battler.js';
import JABS_DeathContext from '../models/JABS_DeathContext.js';
import JABS_AiManager from '../managers/JABS_AiManager.js';

/**
 * Extends {@link Game_Battler.initMembers}.<br/>
 * Includes JABS parameter initialization.
 */
J.ABS.Aliased.Game_Battler.set('initMembers', Game_Battler.prototype.initMembers);
Game_Battler.prototype.initMembers = function()
{
  // perform original logic.
  J.ABS.Aliased.Game_Battler.get('initMembers')
    .call(this);

  // initialize our custom members.
  this.initJabsMembers();
};

/**
 * Initializes additional parameters related to JABS for this battler.
 */
Game_Battler.prototype.initJabsMembers = function()
{
  /**
   * The shared root namespace for all of J's plugin data.
   */
  this._j ||= {};

  /**
   * A grouping of all properties associated with JABS.
   */
  this._j._abs ||= {};

  /**
   * The unique identifier of this battler.
   * This is typically 6 characters long, including two pairs of 3 characters.
   * The characters used are one of the 16 available hexadecimal characters.
   * This includes `0-9` and `A-F`.
   * An example might be something like `a40-1f7`.
   * @type {string}
   */
  this._j._abs._uuid = J.BASE.Helpers.shortUuid();

  /**
   * Cached per-connection bonus hits from `<bonus-hits-global:>` across battler-side sources.
   * @type {number}
   */
  this._j._abs._bonusHitsGlobal = 0;

  /**
   * Cached per-connection bonus hits from `<bonus-hits-basic:>` across battler-side sources.
   * @type {number}
   */
  this._j._abs._bonusHitsBasic = 0;

  /**
   * Cached per-connection bonus hits from `<bonus-hits-skill:>` across battler-side sources.
   * @type {number}
   */
  this._j._abs._bonusHitsSkill = 0;

  /**
   * All equipped skills on this battler.
   * @type {JABS_SkillSlotManager}
   */
  this._j._abs._equippedSkills = new JABS_SkillSlotManager();

  /**
   * A snapshot of the conditions under which this battler last died.
   * Populated immediately after the killing blow lands; cleared on revive.
   * @type {JABS_DeathContext|null}
   */
  this._j._abs._deathContext = null;

  /**
   * The cached result of {@link #getVisionModifier}.
   * Null when the cache is cold; invalidated by {@link #onBattlerDataChange}.
   * @type {number|null}
   */
  this._j._abs._cachedVisionModifier = null;

  /**
   * The cached sum of all CDR (global cooldown reduction) percent-points from note sources.
   * Refreshed by {@link #refreshCdr} on {@link #onBattlerDataChange}.
   * @type {number}
   */
  this._j._abs._cdr = 0;

  /**
   * The cached sum of all PER (parry extension rate) percent-points from note sources.
   * Refreshed by {@link #refreshPer} on {@link #onBattlerDataChange}.
   * @type {number}
   */
  this._j._abs._per = 0;
};

//region CDR
/**
 * The battler's CDR in percent-point space; sourced from all active note sources.
 * @type {number}
 */
Object.defineProperty(Game_Battler.prototype, 'cdr', {
  get: function()
  {
    return this.globalCooldownReduction();
  },
  configurable: true,
});

/**
 * Gets this battler's cached global cooldown reduction in percent-point space.
 * @returns {number}
 */
Game_Battler.prototype.globalCooldownReduction = function()
{
  return this._j._abs._cdr;
};

Game_Battler.prototype.setGlobalCooldownReduction = function(cooldownReduction)
{
  this._j._abs._cdr = cooldownReduction;
};

/**
 * Recomputes and caches the sum of all CDR percent-points from this battler's note sources.
 * Called from {@link Game_Actor#onBattlerDataChange} and {@link Game_Enemy#onBattlerDataChange}.
 */
Game_Battler.prototype.refreshCdr = function()
{
  // grab all the candidates for cooldown reduction.
  const objectsToCheck = this.getAllNotes();

  // iterate over them and process what grants CDR.
  const newCooldownReduction = RPGManager.getResultsFromAllNotesByRegex(
    objectsToCheck,
    J.ABS.RegExp.GlobalCooldownReduction,
    0,
    this
  );

  // convert from percent-points to decimal to match the PERCENT_SUFFIX display convention.
  this.setGlobalCooldownReduction(newCooldownReduction / 100);
};
//endregion CDR

//region PER
/**
 * The battler's PER in percent-point space; sourced from all active note sources.
 * @type {number}
 */
Object.defineProperty(Game_Battler.prototype, 'per', {
  get: function()
  {
    return this.parryExtensionRate();
  },
  configurable: true,
});

/**
 * Gets this battler's cached parry extension rate in percent-point space.
 * @returns {number}
 */
Game_Battler.prototype.parryExtensionRate = function()
{
  return this._j._abs._per;
};

Game_Battler.prototype.setParryExtensionRate = function(parryExtensionRate)
{
  this._j._abs._per = parryExtensionRate;
};

/**
 * Recomputes and caches the sum of all PER percent-points from this battler's note sources.
 * Called from {@link Game_Actor#onBattlerDataChange} and {@link Game_Enemy#onBattlerDataChange}.
 */
Game_Battler.prototype.refreshPer = function()
{
  // grab all the candidates for parry extension rate.
  const objectsToCheck = this.getAllNotes();

  // iterate over them and process what grants PER.
  const newParryExtensionRate = RPGManager.getResultsFromAllNotesByRegex(
    objectsToCheck,
    J.ABS.RegExp.ParryExtensionRate,
    0,
    this
  );

  // convert from percent-points to decimal to match the PERCENT_SUFFIX display convention.
  this.setParryExtensionRate(newParryExtensionRate / 100);
};
//endregion PER

//region JABS battler properties
/**
 * Gets the `uuid` of this battler.
 * The default uuid for battlers is their name and the uuid connected by a hyphen.
 * @returns {string}
 */
Game_Battler.prototype.getUuid = function()
{
  // build the custom uuid including the name.
  const modifiedUuid = `${this.name()}_${this._j._abs._uuid}`;

  // return the name-based uuid.
  return modifiedUuid;
};

/**
 * Sets the `uuid` of this battler.
 * @param {string} uuid The `uuid` to assign to this battler.
 */
Game_Battler.prototype.setUuid = function(uuid)
{
  this._j._abs._uuid = uuid;
};

/**
 * Gets the underlying id of the battler from the database.
 * @returns {number}
 */
Game_Battler.prototype.battlerId = function()
{
  return 0;
};

/**
 * All battlers have a prepare time.
 * At this level, returns default 180 frames.
 * @returns {number}
 */
Game_Battler.prototype.prepareTime = function()
{
  return 180;
};

/**
 * Gets the battler's basic attack skill id.
 * This is defined by the first "Attack Skill" trait on a battler.
 * If there are multiple traits of this kind, only the first found will be used.
 * @returns {number}
 */
Game_Battler.prototype.basicAttackSkillId = function()
{
  // get the data from the database of this battler.
  const databaseData = this.databaseData();

  // the battler's basic attack is their first found "Attack Skill" trait.
  const attackSkillTrait = databaseData.traits
    .find(trait => trait.code === J.BASE.Traits.ATTACK_SKILLID);

  // check to make sure we found a trait.
  if (attackSkillTrait)
  {
    // return the traits underlying skill id.
    return attackSkillTrait.dataId;
  }

  // we didn't find a trait so just return 1.
  return 0;
};

/**
 * All battlers have a default sight range.
 * @returns {number}
 */
Game_Battler.prototype.sightRange = function()
{
  return 4;
};

/**
 * All battlers have a default alerted sight boost.
 * @returns {number}
 */
Game_Battler.prototype.alertedSightBoost = function()
{
  return 2;
};

/**
 * All battlers have a default pursuit range.
 * @returns {number}
 */
Game_Battler.prototype.pursuitRange = function()
{
  return 6;
};

/**
 * Gets the cached vision modifier for this battler, or null if the cache is cold.
 * @returns {number|null}
 */
Game_Battler.prototype.getCachedVisionModifier = function()
{
  return this._j._abs._cachedVisionModifier;
};

/**
 * Sets the cached vision modifier for this battler.
 * @param {number|null} value The new cached value, or null to invalidate.
 */
Game_Battler.prototype.setCachedVisionModifier = function(value)
{
  this._j._abs._cachedVisionModifier = value;
};

/**
 * A multiplier against the vision of an enemy target.
 * This may increase/decrease the sight and pursuit range of an enemy attempting to
 * perceive the actor.
 * Result is cached and invalidated by {@link #onBattlerDataChange}.
 * @returns {number}
 */
Game_Battler.prototype.getVisionModifier = function()
{
  // return the cached result if the cache is still warm.
  if (this.getCachedVisionModifier() !== null)
  {
    return this.getCachedVisionModifier();
  }

  // define the base vision rate for this battler.
  const baseVisionRate = 100;

  // get the vision multiplier from anything this battler has available.
  const visionMultiplier = RPGManager.getSumFromAllNotesByRegex(this.getAllNotes(), J.ABS.RegExp.VisionMultiplier);

  // constrain the multiplier to never go below 0.
  const constrainedVisionMultiplier = Math.max(((baseVisionRate + visionMultiplier) / 100), 0);

  // cache and return the result.
  this.setCachedVisionModifier(constrainedVisionMultiplier);

  return this.getCachedVisionModifier();
};

/**
 * All battlers have a default alerted pursuit boost.
 * @returns {number}
 */
Game_Battler.prototype.alertedPursuitBoost = function()
{
  return 4;
};

/**
 * All battlers have a default alert duration.
 * @returns {number}
 */
Game_Battler.prototype.alertDuration = function()
{
  return 300;
};

/**
 * All battlers have a default team id.
 * At this level, the default team id is 1 (the default for enemies).
 * @returns {number}
 */
Game_Battler.prototype.teamId = function()
{
  return JABS_Battler.enemyTeamId();
};

/**
 * All battlers have a default AI.
 * @returns {JABS_EnemyAI}
 */
Game_Battler.prototype.ai = function()
{
  return new JABS_EnemyAI();
};

/**
 * All battlers can idle by default.
 * @returns {boolean}
 */
Game_Battler.prototype.canIdle = function()
{
  return true;
};

/**
 * All battlers will show their hp bar by default.
 * @returns {boolean}
 */
Game_Battler.prototype.showHpBar = function()
{
  return true;
};

/**
 * All battlers show their map affliction strip by default.
 * @returns {boolean}
 */
Game_Battler.prototype.showStates = function()
{
  return true;
};

/**
 * All battlers will show their danger indicator by default.
 * @returns {boolean}
 */
Game_Battler.prototype.showDangerIndicator = function()
{
  return true;
};

/**
 * All battlers will show their database name by default.
 * @returns {boolean}
 */
Game_Battler.prototype.showBattlerName = function()
{
  return true;
};

/**
 * All battlers can be invincible, but are not by default.
 * @returns {boolean}
 */
Game_Battler.prototype.isInvincible = function()
{
  return false;
};

/**
 * All battlers can be inanimate, but are not by default.
 * @returns {boolean}
 */
Game_Battler.prototype.isInanimate = function()
{
  return false;
};

/**
 * Gets whether or not the aggro is locked for this battler.
 * Locked aggro means their aggro cannot be modified in any way.
 * @returns {boolean}
 */
Game_Battler.prototype.isAggroLocked = function()
{
  return this.states()
    .some(state => state.jabsAggroLock ?? false);
};
/**
 * Gets the death context snapshot for this battler.
 * @returns {JABS_DeathContext|null}
 */
Game_Battler.prototype.getDeathContext = function()
{
  return this._j._abs._deathContext;
};

/**
 * Sets the death context snapshot for this battler.
 * @param {JABS_DeathContext} context The death context to store.
 */
Game_Battler.prototype.setDeathContext = function(context)
{
  this._j._abs._deathContext = context;
};

/**
 * Clears the death context snapshot for this battler.
 */
Game_Battler.prototype.clearDeathContext = function()
{
  this._j._abs._deathContext = null;
};
//endregion JABS battler properties

//region JABS skill slot management
/**
 * Gets the battler's skill slot manager directly.
 * @returns {JABS_SkillSlotManager}
 */
Game_Battler.prototype.getSkillSlotManager = function()
{
  return this._j._abs._equippedSkills;
};

/**
 * Retrieves all skills that are currently equipped on this actor.
 * @returns {JABS_SkillSlot[]}
 */
Game_Battler.prototype.getAllEquippedSkills = function()
{
  return this.getSkillSlotManager()
    .getAllSlots();
};

/**
 * Gets the key to the slot that the provided skill id lives within.
 * @param {number} skillIdToFind The skill id to find amidst all equipped skills.
 * @returns {JABS_SkillSlot}
 */
Game_Battler.prototype.findSlotForSkillId = function(skillIdToFind)
{
  return this.getSkillSlotManager()
    .getSlotBySkillId(skillIdToFind);
};

/**
 * Gets the currently-equipped skill id in the specified slot.
 * @param {string} slot The slot to retrieve an equipped skill for.
 * @returns {number} Skill id, or 0 when the slot key does not exist on this battler (same as empty).
 */
Game_Battler.prototype.getEquippedSkillId = function(slot)
{
  const skillSlot = this.getSkillSlot(slot);

  if (!skillSlot)
  {
    return 0;
  }

  return skillSlot.id;
};

/**
 * Gets the slot associated with a key.
 * @param {string} slot The slot to retrieve a slot for.
 * @returns {JABS_SkillSlot}
 */
Game_Battler.prototype.getSkillSlot = function(slot)
{
  return this.getSkillSlotManager()
    .getSkillSlotByKey(slot);
};

/**
 * Gets all secondary slots that are unassigned.
 * @returns {JABS_SkillSlot[]}
 */
Game_Battler.prototype.getEmptySecondarySkills = function()
{
  return this.getSkillSlotManager()
    .getEmptySecondarySlots();
};

/**
 * Sets the skill id to the specified slot with an option to lock the skill into the slot.
 * @param {string} slot The slot to retrieve an equipped skill for.
 * @param {number} skillId The skill id to assign to the specified slot.
 * @param {boolean} locked Whether or not the skill is locked onto this slot.
 */
Game_Battler.prototype.setEquippedSkill = function(slot, skillId, locked = false)
{
  // shorthand the skill slot manager.
  const skillSlotManager = this.getSkillSlotManager();

  // do nothing if we don't have skill slots to work with.
  if (!skillSlotManager) return;

  // check if we need to actually update the slot.
  if (this.needsSlotUpdate(slot, skillId, locked))
  {
    // update the slot.
    skillSlotManager.setSlot(slot, skillId, locked);

    // check if we're using the hud's input frame.
    if (J.HUD && J.HUD.EXT.INPUT)
    {
      // flag the slot for refresh.
      skillSlotManager.getSkillSlotByKey(slot)
        .flagSkillSlotForRefresh();

      // request an update to the input frame.
      $hudManager.requestRefreshInputFrame();
    }
  }
};

/**
 * Whether or not this actor requires the given slot to be updated.
 * @param {string} slot The slot to retrieve an equipped skill for.
 * @param {number} skillId The skill id to assign to the specified slot.
 * @param {boolean} locked Whether or not the skill is locked onto this slot.
 * @returns {boolean} True if this slot needs to be updated, false otherwise.
 */
Game_Battler.prototype.needsSlotUpdate = function(slot, skillId, locked)
{
  // grab the slot in question.
  const currentSlot = this.getSkillSlot(slot);

  // if we have no slot currently, we need to update it.
  if (!currentSlot) return true;

  // if the locked states don't match, we need to update it.
  if (currentSlot.isLocked() !== locked) return true;

  // if the skill ids don't match, we need to udpate it.
  if (currentSlot.id !== skillId) return true;

  // guess we didn't need to update it after all.
  return false;
};

/**
 * Checks if a slot is locked or not.
 * @param {string} slot The slot being checked to see if it is locked.
 * @returns {boolean}
 */
Game_Battler.prototype.isSlotLocked = function(slot)
{
  return this.getSkillSlotManager()
    .getSkillSlotByKey(slot)
    .isLocked();
};

/**
 * Unlocks a slot that was forcefully assigned.
 * @param {string} slot The slot to unlock.
 */
Game_Battler.prototype.unlockSlot = function(slot)
{
  this.getSkillSlotManager()
    .getSkillSlotByKey(slot)
    .unlock();
};

/**
 * Unlocks all slots that were forcefully assigned.
 */
Game_Battler.prototype.unlockAllSlots = function()
{
  this.getSkillSlotManager()
    .unlockAllSlots();
};
//endregion JABS skill slot management

//region on-chance effects
/**
 * Gets all retaliation skills associated with this battler.
 * @returns {JABS_OnChanceEffect[]}
 */
Game_Battler.prototype.retaliationSkills = function()
{
  // get all things that have notes.
  const objectsToCheck = this.getAllNotes();

  // get all retaliation skills from the notes.
  const retaliations = RPGManager.getOnChanceEffectsFromDatabaseObjects(objectsToCheck, J.ABS.RegExp.Retaliate);

  // return what was found.
  return retaliations;
};

/**
 * Gets all on-own-defeat skills associated with this battler.
 * @returns {JABS_OnChanceEffect[]}
 */
Game_Battler.prototype.onOwnDefeatSkillIds = function()
{
  // get all things that have notes.
  const objectsToCheck = this.getAllNotes();

  // get all on-own-defeat skills from the notes.
  const onOwnDeaths = RPGManager.getOnChanceEffectsFromDatabaseObjects(objectsToCheck, J.ABS.RegExp.OnOwnDefeat);

  // return what was found.
  return onOwnDeaths;
};

/**
 * Gets all on-target-defeat skills associated with this battler.
 * @returns {JABS_OnChanceEffect[]}
 */
Game_Battler.prototype.onTargetDefeatSkillIds = function()
{
  // get all things that have notes.
  const objectsToCheck = this.getAllNotes();

  // get all on-target-defeat skills from the notes.
  const onTargetKills = RPGManager.getOnChanceEffectsFromDatabaseObjects(objectsToCheck, J.ABS.RegExp.OnTargetDefeat);

  // return what was found.
  return onTargetKills;
};

/**
 * Gets all on-evade-apply-self effects associated with this battler.
 * These are states to apply to the evader themselves when an evasion occurs.
 * @returns {JABS_OnChanceEffect[]}
 */
Game_Battler.prototype.onEvadeApplySelfEffects = function()
{
  // get all things that have notes.
  const objectsToCheck = this.getAllNotes();

  // get all on-evade-apply-self state effects from the notes.
  const selfStateEffects = RPGManager.getOnChanceEffectsFromDatabaseObjects(
    objectsToCheck,
    J.ABS.RegExp.OnEvadeApplySelf
  );

  // return what was found.
  return selfStateEffects;
};

/**
 * Gets all on-evade-apply-attacker effects associated with this battler.
 * These are states to apply to the attacker who was evaded.
 * @returns {JABS_OnChanceEffect[]}
 */
Game_Battler.prototype.onEvadeApplyAttackerEffects = function()
{
  // get all things that have notes.
  const objectsToCheck = this.getAllNotes();

  // get all on-evade-apply state effects (targeting the attacker) from the notes.
  const attackerStateEffects = RPGManager.getOnChanceEffectsFromDatabaseObjects(
    objectsToCheck,
    J.ABS.RegExp.OnEvadeApply
  );

  // return what was found.
  return attackerStateEffects;
};

/**
 * Gets all on-evade-execute effects associated with this battler.
 * These are skills to fire when an evasion occurs.
 * @returns {JABS_OnChanceEffect[]}
 */
Game_Battler.prototype.onEvadeExecuteEffects = function()
{
  // get all things that have notes.
  const objectsToCheck = this.getAllNotes();

  // get all on-evade-execute skill effects from the notes.
  const executeEffects = RPGManager.getOnChanceEffectsFromDatabaseObjects(
    objectsToCheck,
    J.ABS.RegExp.OnEvadeExecute
  );

  // return what was found.
  return executeEffects;
};

/**
 * Processes the on-evasion state effects targeting the evader themselves.
 */
Game_Battler.prototype.processOnEvadeStateSelf = function()
{
  // get all self-targeting state effects for this evasion.
  const selfEffects = this.onEvadeApplySelfEffects();

  // if there are none, there is nothing to do.
  if (selfEffects.length === 0) return;

  // iterate over each effect and apply it if the chance roll passes.
  selfEffects.forEach(stateEffect =>
  {
    // check if this effect should trigger.
    if (stateEffect.shouldTrigger() === false) return;

    // apply the state to ourselves — the evader gets the benefit.
    this.addState(stateEffect.skillId);
  });
};

/**
 * Processes the on-evasion state effects targeting the attacker who was evaded.
 * @param {Game_Actor|Game_Enemy} attacker The battler whose attack was evaded.
 */
Game_Battler.prototype.processOnEvadeStateAttacker = function(attacker)
{
  // get all attacker-targeting state effects for this evasion.
  const attackerEffects = this.onEvadeApplyAttackerEffects();

  // if there are none, there is nothing to do.
  if (attackerEffects.length === 0) return;

  // iterate over each effect and apply it if the chance roll passes.
  attackerEffects.forEach(stateEffect =>
  {
    // check if this effect should trigger.
    if (stateEffect.shouldTrigger() === false) return;

    // apply the state to the attacker — they get punished for missing.
    attacker.addState(stateEffect.skillId);
  });
};

/**
 * Processes all on-evasion reactionary effects.
 * @param {Game_Actor|Game_Enemy} attacker The attacker whom this battler evaded.
 * @param {Game_Action} _action The action that was evaded.
 */
Game_Battler.prototype.onEvade = function(attacker, _action)
{
  // apply any states the evader has configured to grant themselves on evasion.
  this.processOnEvadeStateSelf();

  // apply any states the evader has configured to inflict on the attacker on evasion.
  this.processOnEvadeStateAttacker(attacker);

  // skill execution requires JABS_Battler context — look up the evader's JABS_Battler.
  const jabsEvader = JABS_AiManager.getBattlerByUuid(this.getUuid());

  // if no JABS_Battler is found (e.g. not on a JABS map), there are no skills to execute.
  if (!jabsEvader) return;

  // look up the attacker's JABS_Battler so skills can use them as the seed target.
  const jabsAttacker = JABS_AiManager.getBattlerByUuid(attacker.getUuid());

  // delegate skill execution to the JABS_Battler, which has engine access.
  jabsEvader.handleOnEvadeSkills(jabsAttacker);
};
//endregion on-chance effects

//region JABS state management
/**
 * Overwrites {@link #states}.<br/>
 * Returns the proper states for all that are afflicted on this battler.
 * Accommodates stacking.
 * @returns {RPG_State[]}
 */
J.ABS.Aliased.Game_Battler.set('states', Game_Battler.prototype.states);
Game_Battler.prototype.states = function()
{
  // perform original logic.
  const originalStates = J.ABS.Aliased.Game_Battler.get('states')
      .call(this);

  // grab all the states the user is currently afflicted with- as far as JABS is concerned.
  const currentAfflictedStates = $jabsEngine.getJabsStatesByUuid(this.getUuid());

  // prepare a collection of states that represent duplicates for the stacks.
  const stackedStates = [];

  // an iterating function for duplicating the number of states applied to a battler.
  const forEacher = state =>
  {
    // grab the JABS tracker for the state.
    const jabsState = currentAfflictedStates.get(state.id);

    // the battler is not afflicted with this state, so nothing special should be done.
    if (!jabsState) return;

    // check the current number of stacks applied.
    const appliedStacks = jabsState.stackCount;

    if (appliedStacks < 2) return;

    // we start the counter at 1 because there is already 1 copy of the state in the collection.
    for (let counter = 1; counter < appliedStacks; counter++)
    {
      // add a clone of the stacked state.
      stackedStates.push(state._clone());
    }
  };

  // iterate over each of the original states and calculate which need stacks.
  originalStates.forEach(forEacher, this);

  // return the concatenated collection of stacked states.
  return originalStates.concat(stackedStates);
};

/**
 * Extends {@link #addState}.<br/>
 * Rewrites the handling for state application. The attacker is
 * now relevant to the state being applied.
 * @param {number} stateId The state id to potentially apply.
 * @param {Game_Battler} attacker The battler who is applying this state.
 */
J.ABS.Aliased.Game_Battler.set('addState', Game_Battler.prototype.addState);
Game_Battler.prototype.addState = function(stateId, attacker)
{
  // if we're missing an attacker or the engine is disabled, perform as usual.
  if (!attacker || !$jabsEngine.absEnabled)
  {
    // perform original logic.
    J.ABS.Aliased.Game_Battler.get('addState')
      .call(this, stateId);

    // stop processing this state.
    return;
  }

  // hand-off the state handling to JABS.
  this.handleAddingJabsState(stateId, attacker);
};

/**
 * Handles logic surrounding state application in regards to JABS.
 * @param {number} stateId The state being applied.
 * @param {Game_Actor|Game_Enemy|Game_Battler} attacker The assailant applying the state.
 * @param {JABS_StateOverrides|null} overrides Optional skill-authored overrides for duration and stacks.
 * When null, the state's own database values are used.
 */
Game_Battler.prototype.handleAddingJabsState = function(stateId, attacker, overrides = null)
{
  // if the state isn't addable, then don't add it.
  if (!this.isStateAddable(stateId)) return;

  // see if we need to track this state for the first time.
  if (!this.isStateAffected(stateId))
  {
    // add the new state with the attacker data.
    this.addNewState(stateId, attacker);

    // refresh this battler.
    this.refresh();
  }

  // reset the state counts for the battler.
  this.resetStateCounts(stateId, attacker);

  // track the state in the JABS engine now that vanilla tracking is settled.
  this.addJabsState(stateId, attacker, overrides);

  // add the new state to the action result on this battler.
  this._result.pushAddedState(stateId);
};


/**
 * Extends `removeState()` to also expire the state in the JABS state tracker.
 * @param {number} stateId The state id driving this step.
 */
J.ABS.Aliased.Game_Battler.set('removeState', Game_Battler.prototype.removeState);
Game_Battler.prototype.removeState = function(stateId)
{
  // perform original logic.
  J.ABS.Aliased.Game_Battler.get('removeState')
    .call(this, stateId);

  // query for the state to remove from the engine.
  const trackedState = $jabsEngine.getJabsStateByUuidAndStateId(this.getUuid(), stateId);

  // check if we found anything.
  if (trackedState)
  {
    // expire the found state if it is being removed.
    trackedState.expired = true;
  }
};

/**
 * Decrements the stack count of a tracked state by the designated amount.
 * If the state is not being tracked by JABS, then this falls back to normal state removal.
 * @param {number} stateId The id of the state to decrement.
 * @param {number} [stacksRemoved=1] The number of stacks to remove.
 */
Game_Battler.prototype.decrementStateStacks = function(stateId, stacksRemoved = 1)
{
  // if we aren't afflicted with the state, then there is nothing to decrement.
  if (!this.isStateAffected(stateId))
  {
    return;
  }

  // grab the tracked state from the JABS state tracker.
  const trackedState = $jabsEngine.getJabsStateByUuidAndStateId(this.getUuid(), stateId);

  // if the state isn't tracked by JABS, then remove it normally instead.
  if (!trackedState)
  {
    this.removeState(stateId);
    return;
  }

  // decrement the tracked state's stack count.
  trackedState.decrementStacks(stacksRemoved);

  // if there are still stacks remaining, then stop here.
  if (trackedState.stackCount > 0)
  {
    return;
  }

  // remove the state now that all stacks are gone.
  trackedState.removeFromBattler();
};

/**
 * Removes up to {@link count} states from this battler, selected by highest priority first.
 *
 * States are filtered by {@link type}: {@code negative} selects only states tagged {@code <negative>};
 * {@code positive} selects only states not tagged {@code <negative>}; {@code all} applies no filter.
 * Death (state 1) is excluded unless {@link allowDeath} is {@code true}.
 * The pool of eligible states is provided by {@link getPurgeableStates}, which upstream plugins
 * (such as J-Passive) may override to exclude states this layer should not know about.
 *
 * @param {string} [type='negative'] - Which states to target: {@code negative}, {@code positive}, or {@code all}.
 * @param {boolean} [allowDeath=false] - When {@code true}, state 1 (death) is eligible for removal.
 * @param {number} [count=1] - Maximum number of states to remove; pass {@code Infinity} to remove all matching.
 */
Game_Battler.prototype.removeStatesByPriority = function(type = 'negative', allowDeath = false, count = 1)
{
  // collect purgeable states from the extensible pool, then apply type and death filters.
  const candidates = this.getPurgeableStates()
    .filter(state => this.isRemovableCandidate(state, type, allowDeath));

  // sort by priority descending so the most impactful state is removed first.
  candidates.sort((a, b) => b.priority - a.priority);

  // select the top candidates up to count, then remove each and collect what was actually removed.
  const toRemove = candidates.slice(0, count);
  toRemove.forEach(state => this.removeState(state.id));

  // return the removed states so callers can log or react to what was cleansed.
  return toRemove;
};

/**
 * Returns the pool of states eligible for priority-based removal via {@link removeStatesByPriority}.
 *
 * Base implementation returns all currently active states. Upstream plugins that manage state
 * categories invisible to this layer (e.g. passive states) should override this method to exclude
 * states that must never be forcibly removed.
 *
 * @returns {RPG_State[]} - The candidate pool before type and death filters are applied.
 */
Game_Battler.prototype.getPurgeableStates = function()
{
  // base pool: all states currently active on this battler.
  return this.allStates();
};

/**
 * Determines whether a state qualifies as a removal candidate given the requested type filter.
 * @param {RPG_State} state - The state to evaluate.
 * @param {string} type - {@code negative}, {@code positive}, or {@code all}.
 * @param {boolean} allowDeath - Whether state 1 (death) is eligible.
 * @returns {boolean} - {@code true} when the state passes all filters.
 */
Game_Battler.prototype.isRemovableCandidate = function(state, type, allowDeath)
{
  // death state is excluded unless the caller explicitly allows it.
  if (state.id === 1 && allowDeath === false)
  {
    return false;
  }

  // negative type: only states tagged <negative>.
  if (type === 'negative')
  {
    return state.jabsNegative === true;
  }

  // positive type: only states NOT tagged <negative>.
  if (type === 'positive')
  {
    return state.jabsNegative !== true;
  }

  // all type: no polarity filter applied.
  return true;
};

/**
 * Adds a particular state to become tracked by the tracker for this battler.
 * @param {number} stateId The state id to track.
 * @param {Game_Battler|Game_Actor|Game_Enemy} attacker The battler who is applying this state.
 * @param {JABS_StateOverrides|null} overrides Optional skill-authored overrides for duration and stacks.
 * When null, the state's own database values are used for both.
 */
Game_Battler.prototype.addJabsState = function(stateId, attacker, overrides = null)
{
  // reassign the incoming parameter because we are good developers.
  let assailant = attacker;

  // check if we're missing an actor due to external application of state.
  if (!attacker)
  {
    // typically, this condition occurs when an enemy applies to an actor.
    assailant = this;
  }

  // grab the state from the attacker's perspective.
  const state = assailant.state(stateId);

  // extract the base duration and icon index.
  const {
    iconIndex,
    jabsStateHasMapTimer: hasMapTimer,
    jabsStateDurationFrames: baseDuration,
  } = state;

  // establish the defaults from the state's own database data.
  let stateDuration = baseDuration;
  let stateStacks = state.jabsStateStacksApplied;

  // apply any skill-authored overrides when provided.
  if (overrides)
  {
    const { duration, stacks } = overrides;

    // use the override if specified; fall back to the state's own value if not.
    stateDuration = duration ?? baseDuration;
    stateStacks = stacks ?? state.jabsStateStacksApplied;
  }

  // default to eternal; finite timers come from stateDuration tags (not MZ removeByWalking).
  let totalDuration = -1;

  if (hasMapTimer)
  {
    // extend outgoing duration per the battler applying this state, using the effective base.
    totalDuration = stateDuration + assailant.getStateDurationBoost(stateDuration);
  }

  // populate the state builder.
  const builder = this.createJabsState(this, stateId, iconIndex, totalDuration, stateStacks, assailant);

  // build the state.
  const jabsState = builder.build();

  // when overrides are present the skill author explicitly declared the parameters, so replace the
  // tracker entry wholesale and skip reapplication rules entirely; otherwise follow normal rules.
  if (overrides)
  {
    // force-replace the tracker entry so the authored values always win.
    $jabsEngine.addJabsStateByUuid(this.getUuid(), jabsState);
  }
  else
  {
    // no overrides; follow the state's configured reapplication type (refresh/extend/stack).
    $jabsEngine.addOrUpdateStateByUuid(this.getUuid(), jabsState);
  }
};

/**
 * Applies a state to this battler with skill-authored duration and/or stack overrides.
 *
 * Use this instead of {@link addState} when a skill notetag specifies a custom duration
 * or starting stack count that should replace the state's own database defaults.
 * The attacker's duration-boost tags ({@code stateDurationFlat}, {@code stateDurationPerc},
 * {@code stateDurationFormula}) still apply on top of the overridden base duration.
 *
 * Falls back to vanilla state application without overrides if JABS is disabled.
 *
 * @param {number} stateId The id of the state to apply.
 * @param {Game_Battler} attacker The battler applying the state.
 * @param {JABS_StateOverrides} overrides The skill-authored duration and/or stack overrides.
 */
Game_Battler.prototype.addStateWithOverrides = function(stateId, attacker, overrides)
{
  // if JABS is disabled, fall back to vanilla state application since overrides are JABS-only.
  if (!$jabsEngine.absEnabled)
  {
    // apply the state normally, discarding the overrides.
    this.addState(stateId);

    // stop processing.
    return;
  }

  // apply the state via the JABS handler with the provided overrides.
  this.handleAddingJabsState(stateId, attacker, overrides);
};

/**
 * An abstraction for creating a new {@link JABS_State} with the given parameters.
 * Returns the builder with the designated parameters so that extension from the builder is possible.
 * @param {Game_Battler} target the battler being affected by the state.
 * @param {number} stateId The id of the state being applied.
 * @param {number} iconIndex The icon index of the state being applied.
 * @param {number} totalDuration The total duration in frames of the state being applied.
 * @param {number} stacks The number of stacks of the state being applied.
 * @param {Game_Battler} attacker The battler applying the state.
 * @returns {JABS_StateBuilder} The builder with all the parameters of the state being applied.
 */
Game_Battler.prototype.createJabsState = function(target, stateId, iconIndex, totalDuration, stacks, attacker)
{
  return JABS_State.Builder(target, stateId)
    .setIconIndex(iconIndex)
    .setDuration(totalDuration)
    .setStartingStacks(stacks)
    .setSource(attacker);
};

/**
 * Determines the various state duration boosts available to this battler.
 * @param {number} baseDuration The base duration of the state.
 * @returns {number} The number of bonus frames to add to the duration of negative states.
 */
Game_Battler.prototype.getStateDurationBoost = function(baseDuration)
{
  // TODO: update annotations file with new regex and usage?
  // grab everything with notes.
  const objectsToCheck = this.getAllNotes();

  // sum together all the state duration boost flat modifiers.
  const flat = RPGManager.getSumFromAllNotesByRegex(objectsToCheck, J.ABS.RegExp.StateDurationFlatPlus);

  // calculate the flat duration boost.
  const percent = RPGManager.getSumFromAllNotesByRegex(objectsToCheck, J.ABS.RegExp.StateDurationPercentPlus);

  // calculate the percent duration boost.
  const percentBoost = Math.round(baseDuration * (percent / 100));

  // calculate the formulai duration boost.
  const formulaiBoost = RPGManager.getResultsFromAllNotesByRegex(
    objectsToCheck,
    J.ABS.RegExp.StateDurationFormulaPlus,
    baseDuration,
    this
  );

  // sum the boosts together to get the total boost.
  const durationBoost = flat + percentBoost + formulaiBoost;

  // format it kindly because javascript floating point numbers suck.
  const formattedDurationBoost = parseFloat(durationBoost.toFixed(2));

  // return the total state duration boost.
  return formattedDurationBoost;
};
//endregion JABS state management

//region JABS bonus hits
/**
 * Recomputes cached per-connection bonus hit totals from all {@link Game_Battler.getBonusHitsSources} collections.
 */
Game_Battler.prototype.refreshBonusHits = function()
{
  let bonusHitsGlobal = 0;
  let bonusHitsBasic = 0;
  let bonusHitsSkill = 0;

  const sourceCollections = this.getBonusHitsSources();

  sourceCollections.forEach(sourceCollection =>
  {
    const part = this.getBonusHitsFromSources(sourceCollection);
    bonusHitsGlobal += part.global;
    bonusHitsBasic += part.basic;
    bonusHitsSkill += part.skill;
  });

  this.setBonusHitsGlobal(bonusHitsGlobal);
  this.setBonusHitsBasic(bonusHitsBasic);
  this.setBonusHitsSkill(bonusHitsSkill);
};

/**
 * Gets all collections of sources that will be scanned for bonus hits.
 *
 * Uses {@link #getAllNotes} so the result benefits from the notes cache and
 * naturally includes passives that were previously missed when this called
 * {@link #states} directly.
 * @returns {RPG_BaseItem[][]}
 */
Game_Battler.prototype.getBonusHitsSources = function()
{
  return [
    this.getAllNotes(),
  ];
};

/**
 * Gets the cached global-scope per-connection bonus hits total for this battler.
 * @returns {number}
 */
Game_Battler.prototype.getBonusHitsGlobal = function()
{
  return this._j._abs._bonusHitsGlobal;
};

/**
 * Sets the cached global-scope per-connection bonus hits total.
 * @param {number} value The new total.
 */
Game_Battler.prototype.setBonusHitsGlobal = function(value)
{
  this._j._abs._bonusHitsGlobal = value;
};

/**
 * Gets the cached basic-attack-scope per-connection bonus hits total for this battler.
 * @returns {number}
 */
Game_Battler.prototype.getBonusHitsBasic = function()
{
  return this._j._abs._bonusHitsBasic;
};

/**
 * Sets the cached basic-attack-scope per-connection bonus hits total.
 * @param {number} value The new total.
 */
Game_Battler.prototype.setBonusHitsBasic = function(value)
{
  this._j._abs._bonusHitsBasic = value;
};

/**
 * Gets the cached non-basic-skill-scope per-connection bonus hits total for this battler.
 * @returns {number}
 */
Game_Battler.prototype.getBonusHitsSkill = function()
{
  return this._j._abs._bonusHitsSkill;
};

/**
 * Sets the cached non-basic-skill-scope per-connection bonus hits total.
 * @param {number} value The new total.
 */
Game_Battler.prototype.setBonusHitsSkill = function(value)
{
  this._j._abs._bonusHitsSkill = value;
};

/**
 * Sums scoped per-connection bonus hits from a collection of traited database rows.
 * @param {RPG_Traited[]|RPG_BaseBattler[]|RPG_Class[]} sources Rows that may carry scoped bonus-hit notes.
 * @returns {{ global: number, basic: number, skill: number }} Totals contributed by this collection.
 */
Game_Battler.prototype.getBonusHitsFromSources = function(sources)
{
  const totals = {
    global: 0,
    basic: 0,
    skill: 0
  };

  const collectFromSource = source =>
  {
    if (!source) return;

    totals.global += source.jabsBonusHitsScopeGlobal;
    totals.basic += source.jabsBonusHitsScopeBasic;
    totals.skill += source.jabsBonusHitsScopeSkill;
  };

  sources.forEach(collectFromSource);

  return totals;
};
//endregion JABS bonus hits

//region range modifiers
/**
 * Gets the flat tile bonus applied to all outgoing action dimensions (radius, proximity, thickness).
 * @returns {number}
 */
Game_Battler.prototype.getRangeBuff = function()
{
  // sum every rangeBuff tag across all note sources.
  return RPGManager.getSumFromAllNotesByRegex(this.getAllNotes(), J.ABS.RegExp.RangeBuff) ?? 0;
};

/**
 * Gets the multiplicative rate applied to all outgoing action dimensions.
 * Accumulates as 1.0 + sum(each tag value - 1.0) so multiple tags stack additively.
 * @returns {number}
 */
Game_Battler.prototype.getRangeRate = function()
{
  // accumulate each rangeRate tag's delta from 1.0, starting at 1.0.
  const captures = RPGManager.getAllCapturesFromAllNotesByRegex(this.getAllNotes(), J.ABS.RegExp.RangeRate);
  return captures.reduce((acc, capture) => acc + (Number(capture[0]) - 1.0), 1.0);
};

/**
 * Gets the flat tile bonus applied only to outgoing action radius (AoE splash zone).
 * Stacks with {@link #getRangeBuff}.
 * @returns {number}
 */
Game_Battler.prototype.getRadiusBuff = function()
{
  // sum every radiusBuff tag across all note sources.
  return RPGManager.getSumFromAllNotesByRegex(this.getAllNotes(), J.ABS.RegExp.RadiusBuff) ?? 0;
};

/**
 * Gets the multiplicative rate applied only to outgoing action radius.
 * Contributes (N - 1.0) deltas on top of {@link #getRangeRate}.
 * @returns {number}
 */
Game_Battler.prototype.getRadiusRate = function()
{
  // accumulate each radiusRate tag's delta from 0 — the caller folds this into the shared rate.
  const captures = RPGManager.getAllCapturesFromAllNotesByRegex(this.getAllNotes(), J.ABS.RegExp.RadiusRate);
  return captures.reduce((acc, capture) => acc + (Number(capture[0]) - 1.0), 0);
};

/**
 * Gets the flat tile bonus applied only to outgoing action proximity (targeting reach).
 * Stacks with {@link #getRangeBuff}.
 * @returns {number}
 */
Game_Battler.prototype.getProximityBuff = function()
{
  // sum every proximityBuff tag across all note sources.
  return RPGManager.getSumFromAllNotesByRegex(this.getAllNotes(), J.ABS.RegExp.ProximityBuff) ?? 0;
};

/**
 * Gets the multiplicative rate applied only to outgoing action proximity.
 * Contributes (N - 1.0) deltas on top of {@link #getRangeRate}.
 * @returns {number}
 */
Game_Battler.prototype.getProximityRate = function()
{
  // accumulate each proximityRate tag's delta from 0 — the caller folds this into the shared rate.
  const captures = RPGManager.getAllCapturesFromAllNotesByRegex(this.getAllNotes(), J.ABS.RegExp.ProximityRate);
  return captures.reduce((acc, capture) => acc + (Number(capture[0]) - 1.0), 0);
};

/**
 * Gets the flat tile bonus applied only to outgoing action thickness (LINE/WALL hitbox width).
 * Stacks with {@link #getRangeBuff}.
 * @returns {number}
 */
Game_Battler.prototype.getThicknessBuff = function()
{
  // sum every thicknessBuff tag across all note sources.
  return RPGManager.getSumFromAllNotesByRegex(this.getAllNotes(), J.ABS.RegExp.ThicknessBuff) ?? 0;
};

/**
 * Gets the multiplicative rate applied only to outgoing action thickness.
 * Contributes (N - 1.0) deltas on top of {@link #getRangeRate}.
 * @returns {number}
 */
Game_Battler.prototype.getThicknessRate = function()
{
  // accumulate each thicknessRate tag's delta from 0 — the caller folds this into the shared rate.
  const captures = RPGManager.getAllCapturesFromAllNotesByRegex(this.getAllNotes(), J.ABS.RegExp.ThicknessRate);
  return captures.reduce((acc, capture) => acc + (Number(capture[0]) - 1.0), 0);
};
//endregion range modifiers

/**
 * Checks all states to see if we have anything that grants parry ignore.
 * @returns {boolean}
 */
Game_Battler.prototype.ignoreAllParry = function()
{
  // grab all the notes.
  const objectsToCheck = this.getAllNotes();

  // check if any of the note objects possibly could be granting ignore parry.
  const unparryable = RPGManager.checkForBooleanFromAllNotesByRegex(objectsToCheck, J.ABS.RegExp.Unparryable);

  // return what we found.
  return unparryable;
};

//region skill transform resolution
/**
 * Gets the ordered list of note sources that should be searched for skill transform tags.
 *
 * Sources are returned in descending precedence: the first source in the list wins when
 * multiple sources define a transform for the same base skill id. The base implementation
 * covers both actors and enemies: active states (sorted highest priority first), then the
 * battler's own database row.
 *
 * {@link Game_Actor} overrides this to insert equips and class between states and the DB row.
 * @returns {RPG_Base[]}
 */
Game_Battler.prototype.getSkillTransformSources = function()
{
  // copy the active states so sorting does not mutate the live array.
  const sortedStates = [ ...this.states() ];

  // higher-priority states take precedence; sort descending by priority field.
  sortedStates.sort((left, right) => right.priority - left.priority);

  // states first, then the battler's own database row as the lowest-priority passive source.
  return [ ...sortedStates, this.databaseData() ];
};

/**
 * Resolves a base equipped skill id to its transformed counterpart, if any active note source
 * defines a matching {@code <skillTransform:[BASE, OVERRIDE]>} tag.
 *
 * Sources are evaluated in the order returned by {@link #getSkillTransformSources}; the first
 * matching transform wins. If no source transforms the given id, the original id is returned
 * unchanged so callers need not special-case the no-transform path.
 * @param {number} baseSkillId The raw skill id stored in the slot.
 * @returns {number} The transformed skill id, or {@code baseSkillId} when no transform applies.
 */
Game_Battler.prototype.resolveEquippedSkillId = function(baseSkillId)
{
  // nothing to resolve for an empty slot.
  if (!baseSkillId) return 0;

  // grab the ordered note sources for this battler.
  const sources = this.getSkillTransformSources();

  // walk each source in precedence order and stop at the first matching transform.
  for (const source of sources)
  {
    // skip sources that carry no transform tags at all.
    if (!source || !source.jabsSkillTransforms || source.jabsSkillTransforms.length === 0)
    {
      continue;
    }

    // look for a transform pair whose base id matches the slot's stored skill.
    const match = source.jabsSkillTransforms
      .find(transform =>
      {
        const [ transformBaseId ] = transform;
        return transformBaseId === baseSkillId;
      });

    // first match wins — extract the override id and return immediately.
    if (match)
    {
      const [ , transformedSkillId ] = match;
      return transformedSkillId;
    }
  }

  // no transform was found; return the base id unchanged.
  return baseSkillId;
};

/**
 * Gets the effective skill id for the given slot after applying any active skill transforms.
 *
 * This is the primary resolution point that all execution and display paths should call instead
 * of {@link #getEquippedSkillId} when the transformed (runtime) skill is needed. The tool slot
 * is intentionally excluded: it stores item ids, not skill ids, and transform logic does not
 * apply to it.
 * @param {string} slot The slot key to resolve.
 * @returns {number} The resolved skill id, or 0 when the slot is empty or does not exist.
 */
Game_Battler.prototype.getResolvedSkillId = function(slot)
{
  // item-based slots store item ids, not skill ids; transforms do not apply to them.
  if (slot === JABS_Button.Tool || slot === JABS_Button.UsableItem)
  {
    return this.getEquippedSkillId(slot);
  }

  // get the raw stored id, then pass it through the transform resolver.
  const baseSkillId = this.getEquippedSkillId(slot);
  return this.resolveEquippedSkillId(baseSkillId);
};
//endregion skill transform resolution

/**
 * Disables native RMMZ regeneration.
 */
Game_Battler.prototype.regenerateAll = function()
{
};
//endregion Game_Battler
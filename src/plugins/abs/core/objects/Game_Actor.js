//region Game_Actor
import JABS_SkillSlot from '../models/JABS_SkillSlot.js';
import JABS_Battler from '../models/JABS_Battler.js';
import JABS_AiManager from './../managers/JABS_AiManager.js';
/**
 * Extends {@link #initJabsMembers}.<br/>
 * Includes additional actor-specific members.
 */
J.ABS.Aliased.Game_Actor.set('initJabsMembers', Game_Actor.prototype.initJabsMembers);
Game_Actor.prototype.initJabsMembers = function()
{
  // perform original logic.
  Game_Battler.prototype.initJabsMembers.call(this);

  /**
   * The shared root namespace for all of J's plugin data.
   */
  this._j ||= {};

  /**
   * A grouping of all properties associated with JABS.
   */
  this._j._abs ||= {};

  /**
   * Whether or not the death effect has been performed.
   * The death effect is defined as "death animation".
   * @type {boolean}
   */
  this._j._abs._deathEffect = false;

  /**
   * The last observed offhand equip's item id, used to detect offhand swaps so we
   * can clear any player-pinned offhand skill the next time equipment changes.
   *
   * Stored as null until the first equip-change hook seeds it; reads default to 0
   * for legacy save data via the helper accessor.
   * @type {?number}
   */
  this._j._abs._lastOffhandItemId = null;
};

/**
 * Extends `.setup()` and initializes the jabs equipped skills.
 */
J.ABS.Aliased.Game_Actor.set('setup', Game_Actor.prototype.setup);
Game_Actor.prototype.setup = function(actorId)
{
  // perform original logic.
  J.ABS.Aliased.Game_Actor.get('setup')
    .call(this, actorId);

  // setup all the JABS skill slots for the first time.
  this.initAbsSkills();

  // execute the first refresh for JABS-related things.
  this.jabsRefresh();
};

/**
 * Refreshes aspects associated with this battler in the context of JABS.
 */
Game_Actor.prototype.jabsRefresh = function()
{
  // reconcile the offhand pin against the current offhand item so a swap clears it
  // before the slot is re-resolved below.
  this.reconcileOffhandPinAgainstEquip();

  // refresh the currently equipped skills to ensure they are still valid.
  this.refreshBasicAttackSkills();

  // bonus hits are refreshed by onBattlerDataChange, which always fires before jabsRefresh.
};

/**
 * Extends {@link #onBattlerDataChange}.<br/>
 * Adds a hook for performing actions when the battler's data hase changed.
 */
J.ABS.Aliased.Game_Actor.set('onBattlerDataChange', Game_Actor.prototype.onBattlerDataChange);
Game_Actor.prototype.onBattlerDataChange = function()
{
  // perform original logic.
  J.ABS.Aliased.Game_Actor.get('onBattlerDataChange')
    .call(this);

  // invalidate the vision modifier cache — enemies use this to scale pursuit radius against the actor.
  this.setCachedVisionModifier(null);

  // invalidate the projectile duration modifier cache — recomputed lazily on next access.
  this.setCachedProjectileDurationModifier(null);

  // bonus hits are derived from getAllNotes() which changes whenever battler data changes
  // (equips, states, passives, etc.) — recompute the cache to stay current.
  this.refreshBonusHits();

  // recompute cached CDR from note sources.
  this.refreshCdr();

  // recompute cached PER from note sources.
  this.refreshPer();

  // recompute cached luck/curse roll totals from note sources.
  this.refreshPositiveRolls();
  this.refreshNegativeRolls();

  // recompute cached bonus repeat count from note sources.
  this.refreshEncoreRepeats();

  // update JABS-related things.
  this.jabsRefresh();
};

//region JABS basic attack skills
/**
 * Initializes the JABS equipped skills based on equipment.
 */
Game_Actor.prototype.initAbsSkills = function()
{
  // setup the skill slots for the first time.
  this.getSkillSlotManager()
    .setupSlots(this);

  // update them with data.
  this.refreshBasicAttackSkills();

  // update the auto-equippable skills if applicable.
  this.refreshAutoEquippedSkills();
};

/**
 * Refreshes the JABS skills that are currently equipped.
 * If any are no longer valid, they will be removed.
 */
Game_Actor.prototype.refreshBasicAttackSkills = function()
{
  // don't refresh if setup hasn't been completed.
  if (!this.canRefreshBasicAttackSkills()) return;

  // update the mainhand skill slot.
  this.updateMainhandSkill();

  // update the offhand skill slot.
  this.updateOffhandSkill();

  // remove all unequippable skills from their slots.
  this.removeInvalidSkills();
};

/**
 * Determines whether or not basic attack skills can be refreshed.
 * @returns {boolean} True if they can be refreshed, false otherwise.
 */
Game_Actor.prototype.canRefreshBasicAttackSkills = function()
{
  // don't refresh if the initialization hasn'te ven been completed.
  if (!this.getSkillSlotManager()) return false;

  // don't refresh if setup hasn't been completed.
  if (!this.getSkillSlotManager()
    .isSetupComplete())
  {
    return false;
  }

  // refresh!
  return true;
};

/**
 * Updates the mainhand skill slot with the most up-to-date value.
 */
Game_Actor.prototype.updateMainhandSkill = function()
{
  // determine the current main and offhand skills.
  const mainhandSkill = this.getMainhandSkill();

  // update the main and offhand skill slots.
  this.setEquippedSkill(JABS_Button.Mainhand, mainhandSkill);
};

/**
 * Gets the mainhand skill for this actor.
 * @returns {number}
 */
Game_Actor.prototype.getMainhandSkill = function()
{
  // grab the mainhand of the actor.
  const [ mainhand, ] = this.equips();

  // default the mainhand skill to 0.
  let mainhandSkill = 0;

  // check if we have something in our mainhand.
  if (mainhand)
  {
    // assign the skill id tag from the mainhand.
    mainhandSkill = mainhand.jabsSkillId ?? 0;
  }

  // return what we found.
  return mainhandSkill
};

/**
 * Updates the offhand skill slot with the most up-to-date value.
 */
Game_Actor.prototype.updateOffhandSkill = function()
{
  // determine the current main and offhand skills.
  const offhandSkill = this.getOffhandSkill();

  // update the offhand skill slot.
  this.setEquippedSkill(JABS_Button.Offhand, offhandSkill);
};

/**
 * Gets the offhand skill for this actor.
 *
 * Resolution precedence (highest first):
 *  1. Native offhand equip-seal (returns 0) unless the mainhand also defines an
 *     {@link RPG_EquipItem#jabsOffhandSkillId offhandSkillId} that bypasses it, or the
 *     actor is also dual-wielding (a second weapon has taken over the physical slot the
 *     seal was meant to empty, so there is nothing left for the seal to enforce).
 *  2. Player pin via the JABS quick menu, when the pinned skill is still assignable.
 *  3. The mainhand's provided offhand skill via {@code <offhandSkillId:N>}.
 *  4. The equipped offhand item's {@link RPG_EquipItem#jabsSkillId jabsSkillId}.
 *  5. 0 (no skill).
 *
 * After the base skill is identified, active states may temporarily transform that
 * offhand skill into another one via {@code <skillTransform:[BASE, OVERRIDE]>}.
 * @returns {number} The offhand skill id.
 */
Game_Actor.prototype.getOffhandSkill = function()
{
  // an offhand equip-seal trait anywhere on the battler seals the slot unless the
  // same weapon also declares its own offhand skill (spear-like weapons), or dual-wield
  // is also active. vanilla RMMZ's own dual-wield handling already reclassifies the
  // offhand equip slot into a second weapon slot before this ever runs, so the seal has
  // no physical slot left to enforce- a "deathgrip both weapons" build keeps both combos.
  if (this.isTwoHanded() && !this.mainhandDeclaresOffhandSkillId() && !this.isDualWield())
  {
    return 0;
  }

  // determine the base offhand skill from the player's pin or equipment defaults.
  const baseOffhandSkillId = this.getBaseOffhandSkill();

  // if there is no offhand skill to resolve, then return 0.
  if (!baseOffhandSkillId)
  {
    return 0;
  }

  // apply state-driven transforms to the resolved offhand skill, if applicable.
  return this.getTransformedOffhandSkillId(baseOffhandSkillId);
};

/**
 * Gets the base offhand skill for this actor before any temporary transforms are applied.
 *
 * This method only decides "what the actor has equipped or pinned". Any short-lived state
 * behavior that upgrades one offhand skill into another is layered on afterwards by
 * {@link #getTransformedOffhandSkillId}.
 * @returns {number}
 */
Game_Actor.prototype.getBaseOffhandSkill = function()
{
  // honor a player-pinned offhand skill when it is still assignable for this actor.
  const pinnedOffhandSkillId = this.getPinnedOffhandSkillId();
  if (pinnedOffhandSkillId && this.isOffhandSkillAssignable(pinnedOffhandSkillId))
  {
    return pinnedOffhandSkillId;
  }

  // when there is no pin, prefer the mainhand's provided offhand skill first.
  const mainhandProvidedSkillId = this.getMainhandProvidedOffhandSkillId();
  if (mainhandProvidedSkillId)
  {
    return mainhandProvidedSkillId;
  }

  // otherwise, fall back to the equipped offhand item's granted skill.
  const offhandEquippedSkillId = this.getOffhandEquippedSkillId();
  if (offhandEquippedSkillId)
  {
    return offhandEquippedSkillId;
  }

  // no offhand skill source was identified.
  return 0;
};

/**
 * Gets the native equip-type id that represents the offhand slot.
 *
 * In RMMZ, "Seal Equip: Offhand" is represented by {@link Game_BattlerBase.TRAIT_EQUIP_SEAL}
 * with this equip-type id as the {@code dataId}. We centralize the magic number here
 * so all offhand-seal checks read consistently.
 * @returns {number}
 */
Game_Actor.prototype.offhandEquipTypeId = function()
{
  return 2;
};

/**
 * Whether or not this actor is currently in a two-handed state.
 *
 * This is driven by native battler traits, not custom notetags: if any active source
 * on the battler applies the offhand equip-seal trait, then JABS treats the offhand
 * slot as sealed for skill-resolution purposes.
 * @returns {boolean}
 */
Game_Actor.prototype.isTwoHanded = function()
{
  // check the battler's active traits for the native offhand equip-seal.
  return this.isEquipTypeSealed(this.offhandEquipTypeId());
};

/**
 * Whether or not this actor's currently equipped mainhand is effectively two-handed.
 *
 * This wrapper is retained for existing callers while the underlying implementation now
 * delegates to the battler-wide native offhand-seal trait check.
 * @returns {boolean}
 */
Game_Actor.prototype.isMainhandTwoHanded = function()
{
  return this.isTwoHanded();
};

/**
 * Whether or not the currently equipped mainhand explicitly declares an offhand skill id.
 *
 * This is the seal-bypass check: a mainhand can be marked two-handed and still grant a
 * specific offhand action via {@code <offhandSkillId:N>} (e.g. spear-style weapons).
 * @returns {boolean}
 */
Game_Actor.prototype.mainhandDeclaresOffhandSkillId = function()
{
  // grab the mainhand only; state-driven overrides are not considered for the seal bypass.
  const [ mainhand, ] = this.equips();

  // no mainhand means it cannot be declaring anything.
  if (!mainhand) return false;

  // a positive value indicates an explicit declaration on the equip itself.
  return (mainhand.jabsOffhandSkillId ?? 0) > 0;
};

/**
 * Gets the offhand skill currently provided by the mainhand weapon.
 * @returns {number}
 */
Game_Actor.prototype.getMainhandProvidedOffhandSkillId = function()
{
  // grab only the mainhand equip.
  const [ mainhand, ] = this.equips();

  // no mainhand means there is no mainhand-provided offhand skill.
  if (!mainhand) return 0;

  // return the explicit offhand contribution from the mainhand.
  return mainhand.jabsOffhandSkillId ?? 0;
};

/**
 * Whether or not the given skill id currently belongs to the mainhand's provided offhand path.
 *
 * This returns true both for the base skill directly granted by the mainhand's
 * {@code <offhandSkillId:N>} and for the transformed result of that skill while a
 * state-driven offhand transform is active.
 * @param {number} skillId The skill id to check.
 * @returns {boolean}
 */
Game_Actor.prototype.isMainhandProvidedOffhandSkill = function(skillId)
{
  // a missing or zero id cannot belong to the mainhand's offhand path.
  if (!skillId) return false;

  // no mainhand-provided offhand skill means there is nothing to compare against.
  const mainhandProvidedSkillId = this.getMainhandProvidedOffhandSkillId();
  if (!mainhandProvidedSkillId) return false;

  // direct match against the mainhand's provided skill.
  if (mainhandProvidedSkillId === skillId)
  {
    return true;
  }

  // transformed match against the state-upgraded result of the mainhand's provided skill.
  const transformedMainhandSkillId = this.getTransformedOffhandSkillId(mainhandProvidedSkillId);
  if (transformedMainhandSkillId === skillId) return true;

  // combo chain match — the executing skill may be a combo descendent of the root offhand skill
  // (e.g. row 5 follows row 4 via <combo>); walk the full chain and accept any member.
  const rootSkill = $dataSkills.at(mainhandProvidedSkillId);
  if (rootSkill)
  {
    const comboChain = rootSkill.getComboSkillIdList();
    if (comboChain.includes(skillId)) return true;
  }

  return false;
};

/**
 * Gets the offhand skill currently provided by the equipped offhand item.
 * @returns {number}
 */
Game_Actor.prototype.getOffhandEquippedSkillId = function()
{
  // grab only the offhand equip.
  const [ , offhand ] = this.equips();

  // no offhand means there is no offhand-provided skill.
  if (!offhand) return 0;

  // return the offhand's granted skill id.
  return offhand.jabsSkillId ?? 0;
};

/**
 * Gets the guard skill declared by the equipped offhand item, if any.
 * This is independent of {@link #getOffhandEquippedSkillId}- an offhand item with no
 * guard skill declared grants no guarding capability at all, regardless of whatever
 * attack skill it or the mainhand weapon provides.
 * @returns {number}
 */
Game_Actor.prototype.getGuardSkillId = function()
{
  // grab only the offhand equip.
  const [ , offhand ] = this.equips();

  // no offhand means there is no guard skill to resolve.
  if (!offhand) return 0;

  // return the offhand's declared guard skill id, if any.
  return offhand.jabsGuardSkillId ?? 0;
};

/**
 * Gets the skill id pinned to the offhand slot by the player, or 0 if no pin is set.
 * @returns {number}
 */
Game_Actor.prototype.getPinnedOffhandSkillId = function()
{
  // shortcut to the slot manager's offhand pin accessor.
  const skillSlotManager = this.getSkillSlotManager();
  if (!skillSlotManager) return 0;

  return skillSlotManager.getOffhandPinnedSkillId();
};

/**
 * Pins the given skill id to the offhand slot for this actor and refreshes the slot.
 *
 * Pass 0 to clear the pin and let auto-derivation take over again. The basic-attack
 * refresh chain is invoked so the slot's resolved id and any HUD updates stay
 * coherent without waiting for the next data-change tick.
 * @param {number} skillId The skill id to pin into the offhand slot, or 0 to clear.
 */
Game_Actor.prototype.pinOffhandSkill = function(skillId)
{
  // grab the slot manager; bail if the actor has not been set up yet.
  const skillSlotManager = this.getSkillSlotManager();
  if (!skillSlotManager) return;

  // write the pin (the slot itself handles change detection and onChange).
  skillSlotManager.setOffhandPinnedSkillId(skillId);

  // re-resolve the offhand slot so consumers see the new skill id immediately.
  this.refreshBasicAttackSkills();
};

/**
 * Clears the player-set pin from the offhand slot, if any.
 */
Game_Actor.prototype.clearOffhandPin = function()
{
  this.pinOffhandSkill(0);
};

/**
 * Whether or not the given skill id is currently assignable as this actor's offhand.
 *
 * Offhand-assignable skills are sourced explicitly, not from the actor's entire learned
 * weapon-skill pool. A skill is assignable only if it appears in the current offhand
 * candidate list:
 * - learned skills carrying {@code <offhandEligible>}
 * - the skill currently granted by the equipped offhand item
 * - the skill currently granted by the mainhand's {@code <offhandSkillId:N>}
 * @param {number} skillId The skill id to validate.
 * @returns {boolean}
 */
Game_Actor.prototype.isOffhandSkillAssignable = function(skillId)
{
  // a missing or zero id is never assignable.
  if (!skillId) return false;

  // build the current collection of assignable skill ids and see if this one is present.
  const offhandAssignableSkillIds = this.buildOffhandAssignableSkillIds();
  return offhandAssignableSkillIds.includes(skillId);
};

/**
 * Builds the list of skill ids available for player pinning into the offhand slot.
 *
 * The candidate list intentionally does not include all learned weapon skills. Offhand
 * choices come only from explicit skill tags or the currently equipped gear's provided
 * offhand skills.
 * @returns {number[]}
 */
Game_Actor.prototype.buildOffhandAssignableSkillIds = function()
{
  // initialize the current collection of assignable skill ids.
  const assignableSkillIds = [];

  // begin with learned skills that explicitly opt into offhand assignment.
  const explicitlyEligibleSkills = this.skills()
    .filter(JABS_Battler.isSkillVisibleInOffhandMenu);

  // add each explicitly eligible learned skill to the pool.
  explicitlyEligibleSkills.forEach(skill =>
  {
    // skip duplicates while preserving the original learned-skill order.
    if (assignableSkillIds.includes(skill.id)) return;

    // add the explicitly eligible skill to the pool.
    assignableSkillIds.push(skill.id);
  });

  // add the currently equipped offhand-provided skill, such as guard or utility actions.
  const offhandEquippedSkillId = this.getOffhandEquippedSkillId();
  if (offhandEquippedSkillId && !assignableSkillIds.includes(offhandEquippedSkillId))
  {
    assignableSkillIds.push(offhandEquippedSkillId);
  }

  // add the mainhand's provided offhand skill, such as pistol shot or taser discharge.
  const mainhandProvidedSkillId = this.getMainhandProvidedOffhandSkillId();
  if (mainhandProvidedSkillId && !assignableSkillIds.includes(mainhandProvidedSkillId))
  {
    assignableSkillIds.push(mainhandProvidedSkillId);
  }

  // return the ordered list of candidate ids.
  return assignableSkillIds;
};

/**
 * Builds the list of skills available for player pinning into the offhand slot.
 *
 * This translates the current offhand-assignable skill id list into database skill data
 * for the quick menu.
 * @returns {RPG_Skill[]}
 */
Game_Actor.prototype.buildOffhandAssignableSkillPool = function()
{
  // convert the assignable id collection into actual skill database objects.
  const skillPool = [];

  // build the current collection of assignable offhand skill ids.
  const assignableSkillIds = this.buildOffhandAssignableSkillIds();

  // translate each id into its corresponding skill data.
  assignableSkillIds.forEach(skillId =>
  {
    // grab the skill data from the battler's skill resolver.
    const skillData = this.skill(skillId);

    // skip any invalid skill ids that somehow slipped through.
    if (!skillData) return;

    // add the translated skill data to the final pool.
    skillPool.push(skillData);
  });

  // return the translated pool.
  return skillPool;
};

/**
 * Builds the list of skills available for player pinning into the combat slot.
 * @returns {RPG_Skill[]}
 */
Game_Actor.prototype.buildCombatSkillCandidatePool = function()
{
  // grab all of this actor's learned skills that are visible in the combat quick menu.
  return this.skills()
    .filter(JABS_Battler.isSkillVisibleInCombatMenu);
};

/**
 * Builds the list of skills available for player pinning into the dodge slot.
 * @returns {RPG_Skill[]}
 */
Game_Actor.prototype.buildDodgeSkillCandidatePool = function()
{
  // grab all of this actor's learned skills that are visible in the dodge quick menu.
  return this.skills()
    .filter(JABS_Battler.isSkillVisibleInDodgeMenu);
};

/**
 * Extends {@link Game_Battler#getSkillTransformSources}.<br/>
 * Also includes the actor's equipped equips and current class as transform sources,
 * inserted between states and the actor's own database row.
 */
J.ABS.Aliased.Game_Actor.set('getSkillTransformSources', Game_Actor.prototype.getSkillTransformSources);
Game_Actor.prototype.getSkillTransformSources = function()
{
  // copy the actor's active states so sorting does not mutate the live array.
  const sortedStates = [ ...this.states() ];

  // higher-priority states take precedence; sort descending by priority field.
  sortedStates.sort((left, right) => right.priority - left.priority);

  // individual equips come after states: a worn fire ring beats a class-wide transform.
  const equipSources = this.equippedEquips();

  // class is a broader, more passive source than individual equipped items.
  const classSources = [ this.currentClass() ];

  // the actor's database row is the most passive and lowest-precedence source.
  const actorSources = [ this.databaseData() ];

  // precedence order: states > equips > class > actor db row.
  return [ ...sortedStates, ...equipSources, ...classSources, ...actorSources ];
};

/**
 * Gets the transformed offhand skill id after applying any active skill transforms.
 *
 * Delegates to the generic {@link Game_Battler#resolveEquippedSkillId} resolver, which
 * searches all note sources in precedence order. The offhand-specific implementation
 * previously lived here; it has been superseded by the generic layer.
 * @param {number} baseSkillId The base offhand skill id before transforms are applied.
 * @returns {number}
 */
Game_Actor.prototype.getTransformedOffhandSkillId = function(baseSkillId)
{
  // delegate to the generic resolver that covers all note sources and all slots.
  return this.resolveEquippedSkillId(baseSkillId);
};

/**
 * Automatically removes all skills that are no longer available.
 * This most commonly will occur when a skill is bound to equipment that is
 * no longer equipped to the character. Skills that are "forced" will not be removed.
 *
 * Additionally, if the offhand slot's pinned skill is no longer assignable to this
 * actor (typically because the actor unlearned it and no equip grants it), the pin is
 * cleared so it cannot resurrect a stale id during the next refresh.
 */
Game_Actor.prototype.removeInvalidSkills = function()
{
  // grab all the slots this actor has.
  const slots = this.getSkillSlotManager()
    .getAllSlots();

  // iterate over each of them.
  slots.forEach(skillSlot =>
  {
    // check if we currently know this skill.
    if (!this.hasSkill(skillSlot.id))
    {
      // remove it if we don't.
      skillSlot.autoclear();
    }
  });

  // sweep the offhand pin separately: it lives independently of the slot id, so the
  // autoclear above does not touch it. an unassignable pin must be cleared so it
  // cannot resurrect a stale skill id the next time the slot is resolved.
  const pinnedOffhandSkillId = this.getPinnedOffhandSkillId();
  if (pinnedOffhandSkillId && !this.isOffhandSkillAssignable(pinnedOffhandSkillId))
  {
    this.getSkillSlotManager()
      .clearOffhandPin();
  }
};

/**
 * Gets the cached id of the most recently observed offhand equip.
 *
 * Returns 0 when no offhand was previously cached (legacy save data) or when the
 * cache slot has not yet been seeded with the actor's current equipment.
 * @returns {number}
 */
Game_Actor.prototype.lastOffhandItemId = function()
{
  return this._j._abs._lastOffhandItemId ?? 0;
};

/**
 * Caches the given equip item's id as the actor's last-known offhand.
 * @param {RPG_EquipItem|null} offhand The current offhand item, or null when unequipped.
 */
Game_Actor.prototype.setLastOffhandItemId = function(offhand)
{
  // store the database id of the equip; an empty slot is recorded as 0.
  this._j._abs._lastOffhandItemId = offhand ? offhand.id : 0;
};

/**
 * Gets the stored last-offhand id exactly as recorded, without coalescing.
 *
 * This is deliberately not {@link Game_Actor#lastOffhandItemId}, which reports 0 for an unseeded
 * cache. Null means 'never observed' and 0 means 'observed as empty'- two different things.
 * @returns {number|null} The stored id, or null when the cache was never seeded.
 */
Game_Actor.prototype.rawLastOffhandItemId = function()
{
  // hand back the stored value with its null sentinel intact.
  return this._j._abs._lastOffhandItemId;
};

/**
 * Whether or not this actor has an existing snapshot of the offhand equip.
 *
 * Used to skip the "first observation" path so a freshly loaded actor does not clear
 * an existing pin just because the cache had not been seeded yet.
 * @returns {boolean}
 */
Game_Actor.prototype.hasLastOffhandSnapshot = function()
{
  return this.rawLastOffhandItemId() !== null && this.rawLastOffhandItemId() !== undefined;
};

/**
 * Reconciles the offhand pin against the currently equipped offhand item.
 *
 * Compares the live offhand item id against the last cached snapshot and, if they
 * differ, clears any active pin so the newly equipped offhand's skill takes priority.
 * The first observation seeds the cache without clearing anything.
 */
Game_Actor.prototype.reconcileOffhandPinAgainstEquip = function()
{
  // resolve the current offhand once for both the comparison and the cache write.
  const [ , offhand ] = this.equips();
  const currentOffhandId = offhand ? offhand.id : 0;

  // first observation: seed the cache without modifying any pin.
  if (!this.hasLastOffhandSnapshot())
  {
    this.setLastOffhandItemId(offhand);
    return;
  }

  // when the offhand item itself changed, clear the player's pin.
  if (this.lastOffhandItemId() !== currentOffhandId)
  {
    // cache the new id before clearing so the pin removal does not loop.
    this.setLastOffhandItemId(offhand);

    // clear the pin via the manager helper; safe even if no pin is set.
    if (this.getSkillSlotManager())
    {
      this.getSkillSlotManager()
        .clearOffhandPin();
    }
  }
};
//endregion JABS basic attack skills

//region JABS battler properties
/**
 * Actors have fixed `uuid`s, and thus it can be calculated as-is.
 *
 * An actor that has not been given a database row yet has no identity to report, which happens ordinarily enough -
 * the party allocates its members before a save has finished restoring them. That is a moment to wait through, not
 * a fault, so it answers with the empty sentinel rather than narrating it.
 * @returns {string}
 */
Game_Actor.prototype.getUuid = function()
{
  // validate we have an actor.
  if (this.actor())
  {
    // return the actor's constant uuid.
    return `actor-${this.actorId()}`;
  }

  // nothing to identify yet.
  return String.empty;
};

/**
 * Gets the prepare time for this actor.
 * Actors are not gated by prepare times, only by post-action cooldowns.
 * @returns {number}
 */
Game_Actor.prototype.prepareTime = function()
{
  return 1;
};

/**
 * Extracts the JABS-related parameter from this actor's class, and
 * falls back to the actor data itself.
 * @param {RegExp} structure The parameter's regexp to search for.
 * @param {number} defaultValue The default value to fallback to.
 * @returns {number}
 */
Game_Actor.prototype.getJabsParameter = function(structure, defaultValue)
{
  // grab the class data from the actor.
  const classData = this.currentClass();

  // grab the parameter from the class.
  const classJabsParameter = RPGManager.getNumberFromNoteByRegex(classData, structure, true);

  // check if the class has sight on it.
  if (classJabsParameter !== null)
  {
    // return the sight from the class.
    return classJabsParameter;
  }

  // grab the parameter from the actor.
  const actorJabsParameter = RPGManager.getNumberFromNoteByRegex(this.actor(), structure, true);

  // if there is no class prepare tag, then look to the actor.
  if (actorJabsParameter !== null)
  {
    // return the sight from the battler.
    return actorJabsParameter;
  }

  return defaultValue;
};

/**
 * Gets the sight range for this actor.
 * @returns {number}
 */
Game_Actor.prototype.sightRange = function()
{
  // determine the default value.
  const defaultValue = Game_Battler.prototype.sightRange.call(this);

  // grab the value appropriately from this actor.
  const actualValue = this.getJabsParameter(J.ABS.RegExp.Sight, defaultValue);

  // return the value.
  return actualValue;
};

/**
 * Gets the alerted sight boost for this actor.
 * @returns {number}
 */
Game_Actor.prototype.alertedSightBoost = function()
{
  // determine the default value.
  const defaultValue = Game_Battler.prototype.alertedSightBoost.call(this);

  // grab the value appropriately from this actor.
  const actualValue = this.getJabsParameter(J.ABS.RegExp.AlertedSightBoost, defaultValue);

  // return the value.
  return actualValue;
};

/**
 * Gets the alerted pursuit boost for this actor.
 * @returns {number}
 */
Game_Actor.prototype.pursuitRange = function()
{
  // determine the default value.
  const defaultValue = Game_Battler.prototype.pursuitRange.call(this);

  // grab the value appropriately from this actor.
  const actualValue = this.getJabsParameter(J.ABS.RegExp.Pursuit, defaultValue);

  // return the value.
  return actualValue;
};

/**
 * Gets the alerted pursuit boost for this actor.
 * @returns {number}
 */
Game_Actor.prototype.alertedPursuitBoost = function()
{
  // determine the default value.
  const defaultValue = Game_Battler.prototype.alertedPursuitBoost.call(this);

  // grab the value appropriately from this actor.
  const actualValue = this.getJabsParameter(J.ABS.RegExp.AlertedPursuitBoost, defaultValue);

  // return the value.
  return actualValue;
};

/**
 * Gets the alert duration for this actor.
 * @returns {number}
 */
Game_Actor.prototype.alertDuration = function()
{
  // determine the default value.
  const defaultValue = Game_Battler.prototype.alertDuration.call(this);

  // grab the value appropriately from this actor.
  const actualValue = this.getJabsParameter(J.ABS.RegExp.AlertDuration, defaultValue);

  // return the value.
  return actualValue;
};

/**
 * Gets the ai of the actor.
 * This is only implemented in JABS Ally AI.
 * @returns {null}
 */
Game_Actor.prototype.ai = function()
{
  return null;
};

/**
 * Gets whether or not the actor can idle.
 * Actors can never idle.
 * @returns {boolean}
 */
Game_Actor.prototype.canIdle = function()
{
  return false;
};

/**
 * Gets whether or not the actor's hp bar will show.
 * Actors never show their hp bar (they use HUDs for that).
 * @returns {boolean}
 */
Game_Actor.prototype.showHpBar = function()
{
  // leaders do not reveal their HP bar.
  if (this.isLeader()) return false;

  // show the HP!
  return true;
};

/**
 * Actors always show their map affliction strip when states are active.
 * @returns {boolean}
 */
Game_Actor.prototype.showStates = function()
{
  return true;
};

/**
 * Gets whether or not the actor's name will show below their character.
 * Actors never show their name.
 * @returns {boolean}
 */
Game_Actor.prototype.showBattlerName = function()
{
  return false;
};

/**
 * Gets whether or not the actor is invincible.
 * Actors are never invincible by this means.
 * @returns {boolean}
 */
Game_Actor.prototype.isInvincible = function()
{
  return false;
};

/**
 * Gets whether or not the actor is inanimate.
 * Actors are never inanimate.
 * @returns {boolean}
 */
Game_Actor.prototype.isInanimate = function()
{
  return false;
};

/**
 * The team id of this actor.
 * Defaults to the default ally team id.
 * @returns {number}
 */
Game_Actor.prototype.teamId = function()
{
  return JABS_Battler.allyTeamId();
};

/**
 * Checks if this actor has anything that is preventing party cycling.
 * @returns {boolean} True if party cycling is blocked, false otherwise.
 */
Game_Actor.prototype.switchLocked = function()
{
  // grab all the things that could have this tag.
  const objectsToCheck = this.getAllNotes();

  // check if any of the things have this tag on it.
  const switchLocked = objectsToCheck
    .some(object => RPGManager.checkForBooleanFromNoteByRegex(object, J.ABS.RegExp.ConfigNoSwitch));

  // return the result.
  return switchLocked;
};
//endregion JABS battler properties

//region ondeath management
/**
 * Gets whether or not this actor needs a death effect.
 * @returns {boolean}
 */
Game_Actor.prototype.needsDeathEffect = function()
{
  return this.deathEffect();
};

/**
 * Toggles this actor's need for a death effect.
 */
Game_Actor.prototype.toggleDeathEffect = function()
{
  this.setDeathEffect(!this.deathEffect());
};

/**
 * Toggles the death effect for this actor when they die.
 */
J.ABS.Aliased.Game_Actor.set('onDeath', Game_Actor.prototype.onDeath);
Game_Actor.prototype.onDeath = function()
{
  // toggle the on-death flag for tracking if death has occurred or not.
  this.toggleDeathEffect();
};

/**
 * Reverts the death effect toggle when they are revived.
 */
J.ABS.Aliased.Game_Actor.set('onRevive', Game_Actor.prototype.onRevive);
Game_Actor.prototype.onRevive = function()
{
  // perform original logic.
  J.ABS.Aliased.Game_Actor.get('onRevive')
    .call(this);

  // stops this battler from being flagged as dead by JABS.
  this.stopDying();

  // the death context is no longer relevant after revival.
  this.clearDeathContext();
};

/**
 * Stops this actor from being in the death effect flagged state.
 */
Game_Actor.prototype.stopDying = function()
{
  // grab the battler that is revived.
  const jabsBattler = JABS_AiManager.getBattlerByUuid(this.getUuid());

  // validate the existance of the battler before using.
  if (!jabsBattler) return;

  // turn off the dying effect.
  jabsBattler.setDying(false);
};
//endregion ondeath management

//region JABS skill slot access
/**
 * Gets all skill slots identified as "primary".
 * @returns {JABS_SkillSlot[]}
 */
Game_Actor.prototype.getAllPrimarySkills = function()
{
  return this.getSkillSlotManager()
    .getAllPrimarySlots();
};

/**
 * Gets all skill slots identified as "secondary".
 * @returns {JABS_SkillSlot[]}
 */
Game_Actor.prototype.getAllCombatSkillSlots = function()
{
  return this.getSkillSlotManager()
    .getAllSecondarySlots();
};

/**
 * Gets the skill dedicated to the tool slot.
 * @returns {JABS_SkillSlot}
 */
Game_Actor.prototype.getToolSkillSlot = function()
{
  return this.getSkillSlotManager()
    .getToolSlot();
};

/**
 * Gets the skill dedicated to the dodge slot.
 * @returns {JABS_SkillSlot}
 */
Game_Actor.prototype.getDodgeSkillSlot = function()
{
  return this.getSkillSlotManager()
    .getDodgeSlot();
};

/**
 * Gets all skill slots that have skills assigned to them.
 * @returns {JABS_SkillSlot[]}
 */
Game_Actor.prototype.getValidEquippedSkillSlots = function()
{
  // don't try to get slots if we are not setup yet.
  if (!this.getSkillSlotManager()) return [];

  return this.getSkillSlotManager()
    .getEquippedSlots();
};

/**
 * Gets all skill slots that have skills that are upgradable.
 * @returns {JABS_SkillSlot[]}
 */
Game_Actor.prototype.getUpgradableSkillSlots = function()
{
  // a filtering function for whether or not a skill slot is upgradable.
  const filtering = skillSlot =>
  {
    // if the slot is not autoclearable, then it isn't upgradable.
    if (!skillSlot.canBeAutocleared()) return false;

    // if the slot is locked, then it isn't upgradable.
    if (skillSlot.isLocked()) return false;

    // the slot is upgradable!
    return true;
  };

  // determine the slots that are valid and upgradable.
  const upgradableSkillSlots = this.getValidEquippedSkillSlots()
    .filter(filtering, this);

  // return our valid upgradable slots.
  return upgradableSkillSlots;
};
//endregion JABS skill slot access

//region leveling
/**
 * Overwrites {@link #shouldDisplayLevelUp}.<br/>
 * Replaces the levelup display on the map to not display a message.
 */
Game_Actor.prototype.shouldDisplayLevelUp = function()
{
  return false;
};

/**
 * Executes the JABS level up process.
 */
J.ABS.Aliased.Game_Actor.set('onLevelUp', Game_Actor.prototype.onLevelUp);
Game_Actor.prototype.onLevelUp = function()
{
  // perform original logic.
  J.ABS.Aliased.Game_Actor.get('onLevelUp')
    .call(this);

  // perform JABS-related things for leveling up.
  this.jabsLevelUp();
};

/**
 * Do JABS-related things for leveling up.
 */
Game_Actor.prototype.jabsLevelUp = function()
{
  // refresh the sprite if they need it.
  $jabsEngine.requestSpriteRefresh = true;

  // command the JABS engine to do the JABS-related things for leveling up.
  $jabsEngine.battlerLevelup(this.getUuid());
};

/**
 * Extends {@link #onLevelDown}.<br/>
 * Also refresh sprites' danger indicator.
 */
J.ABS.Aliased.Game_Actor.set('onLevelDown', Game_Actor.prototype.onLevelDown);
Game_Actor.prototype.onLevelDown = function()
{
  // perform original logic.
  J.ABS.Aliased.Game_Actor.get('onLevelDown')
    .call(this);

  // perform JABS-related things for leveling down.
  this.jabsLevelDown();
};

/**
 * Do JABS-related things for leveling down.
 */
Game_Actor.prototype.jabsLevelDown = function()
{
  // if this isn't the leader, then don't worry about leveling down.
  if (!this.isLeader()) return;

  // this is the leader so refresh the battler sprite!
  $jabsEngine.requestSpriteRefresh = true;
};
//endregion leveling

//region learning
/**
 * A hook for performing actions when a battler learns a new skill.
 * @param {number} skillId The skill id of the skill learned.
 */
J.ABS.Aliased.Game_Actor.set('onLearnNewSkill', Game_Actor.prototype.onLearnNewSkill);
Game_Actor.prototype.onLearnNewSkill = function(skillId)
{
  // perform original logic.
  J.ABS.Aliased.Game_Actor.get('onLearnNewSkill')
    .call(this, skillId);

  // perform JABS-related things for learning a new skill.
  this.jabsLearnNewSkill(skillId);
};

/**
 * Do JABS-related things for leveling down.
 * @param {number} skillId The skill id being learned.
 */
Game_Actor.prototype.jabsLearnNewSkill = function(skillId)
{
  // if the skill id is invalid, do not do JABS things.
  if (!skillId) return;

  // show the popup for the skill learned on the battler.
  $jabsEngine.battlerSkillLearn(this.skill(skillId), this.getUuid());

  // upgrade the skill if permissable.
  this.jabsProcessLearnedSkill(skillId);
};

/**
 * Performs various JABS-related logic upon learning the given skill.
 * @param {number} skillId The id of the skill being learnt.
 */
Game_Actor.prototype.jabsProcessLearnedSkill = function(skillId)
{
  // upgrade existing skills first if necessary.
  this.autoUpgradeSkillIfRequired(skillId);

  // if not upgradeable, then just autoassign it if possible.
  this.autoAssignSkillIfRequired(skillId);

  // do nothing if we don't have a slot manager to work with.
  if (!this.getSkillSlotManager()) return;

  // flag skills on the skillslot manager for refreshing.
  this.getSkillSlotManager()
    .flagAllSkillSlotsForRefresh();
};

/**
 * If a skill that was upgraded is equipped currently, upgrade it.
 * "Upgrading" in the context of JABS is tag-defined skill slot replacement.
 * @param {number} skillId The skill id to upgrade.
 */
Game_Actor.prototype.autoUpgradeSkillIfRequired = function(skillId)
{
  // grab all the upgradable skill slots.
  const upgradableSkillsSlots = this.getUpgradableSkillSlots();

  // if there are no upgradeable slots, then don't try to upgrade them.
  if (!upgradableSkillsSlots || !upgradableSkillsSlots.length) return;

  // a local function for upgrading the skill slot.
  const upgrader = skillSlot =>
  {
    // identify the skill based on the current skillslot.
    const canUpgrade = this.canUpgradeSkill(skillSlot, skillId);

    // validate we can upgrade before proceeding.
    if (!canUpgrade) return;

    // it looks like we should upgrade the skill according to JABS.
    this.setEquippedSkill(skillSlot.key, skillId);
  };

  // iterate over each of the skillslots to see if we should upgrade them.
  upgradableSkillsSlots.forEach(upgrader, this);
};

/**
 * Determines whether or not this skill slot can be upgraded with this new skill.
 * This applies even to battlers that are not under the auto assign control.
 * @param {JABS_SkillSlot} skillSlot The target skill slot to potentially upgrade.
 * @param {number} skillId The id of the skill learned to potentially auto-assign.
 */
Game_Actor.prototype.canUpgradeSkill = function(skillSlot, skillId)
{
  // grab all the things that could have this tag.
  const objectsToCheck = this.getActorNotes();

  // if the actor is not allowed to auto upgrade skills, then do not.
  const canAutoUpgrade = objectsToCheck
    .some(object => RPGManager.checkForBooleanFromNoteByRegex(object, J.ABS.RegExp.ConfigAutoUpgradeSkills));
  if (!canAutoUpgrade) return false;

  // identify the skill based on the current skillslot.
  const currentSkillData = this.skill(skillSlot.id);

  // if auto-assignment is disallowed explicitly, then don't upgrade this slot.
  const isSkillAutoUpgradeBlocked = RPGManager
    .checkForBooleanFromNoteByRegex(currentSkillData, J.ABS.RegExp.NoSkillUpgrading);
  if (isSkillAutoUpgradeBlocked) return false;

  // if the current skillslot's skill isn't the one that should be upgraded, then don't upgrade.
  const upgradeOverThisSkillId = RPGManager
    .getNumberFromNoteByRegex(this.skill(skillId), J.ABS.RegExp.UpgradeOverSkill);
  if (skillSlot.id !== upgradeOverThisSkillId) return false;

  // we should upgrade this skill with this new skillId!
  return true;
};

/**
 * Attempts to assign the given skillId into the first unassigned combat skill slot.
 *
 * If all slots are full, no action is taken.
 * @param {number} skillId The skillId to auto-assign to a slot.
 */
Game_Actor.prototype.autoAssignSkillIfRequired = function(skillId)
{
  // validate we should be autoassigning, and are allowed to.
  if (!this.canAutoAssignSkillOnLevelup(skillId)) return;

  // grab the first slot that we'll be working with.
  const firstEmptySlot = this.getEmptySecondarySkills()
    .at(0);

  // assign the given skill to the slot.
  this.setEquippedSkill(firstEmptySlot.key, skillId);
};

/**
 * Gets whether or not there are notes that indicate skills should be autoassigned
 * when leveling up.
 * @param {number} skillId The skillId to auto-assign to a slot.
 */
Game_Actor.prototype.canAutoAssignSkillOnLevelup = function(skillId)
{
  // grab all the things that could have this tag.
  const objectsToCheck = this.getActorNotes();

  // if the actor is not allowed to auto assign skills, then do not.
  const canAutoAssign = objectsToCheck
    .some(object => RPGManager.checkForBooleanFromNoteByRegex(object, J.ABS.RegExp.ConfigAutoAssignSkills));
  if (!canAutoAssign) return false;

  // if we already have the skill equipped, don't equip it again.
  const combatSkillSlots = this.getAllCombatSkillSlots();
  const alreadyEquipped = combatSkillSlots.some(skillSlot => skillSlot.id === skillId);
  if (alreadyEquipped) return false;

  // if we have no additional empty slots, then do not auto-assign.
  const emptySlots = this.getEmptySecondarySkills();
  if (emptySlots.length === 0) return false;

  // shorthand the data of this skill.
  const skillData = this.skill(skillId);

  // if the skill is preventing auto assignment, don't auto assign.
  const isSkillAutoAssignBlocked = RPGManager.checkForBooleanFromNoteByRegex(skillData, J.ABS.RegExp.NoAutoAssign);
  if (isSkillAutoAssignBlocked) return false;

  // skills that are upgrade-only cannot be assigned to blank slots.
  const onlyUpgradeable = RPGManager.checkForBooleanFromNoteByRegex(skillData, J.ABS.RegExp.UpgradeOnlySkill);
  if (onlyUpgradeable) return false;

  // if the skill type is blacklisted, don't allow auto assigning.
  const blacklistedBySkillTypeId = objectsToCheck.some(object =>
  {
    // grab the blacklisted skill types by the actor/class.
    const skillTypeIds = RPGManager.getNumbersFromNoteByRegex(object, J.ABS.RegExp.BlacklistAutoAssignSkillType);

    // if the skill's type was amongst the blacklisted types, don't auto assign it.
    if (skillTypeIds.includes(skillData.stypeId)) return true;

    // this can be autoassigned.
    return false;
  });
  if (blacklistedBySkillTypeId) return false;

  // we should try to auto assign this skill!
  return true;
};

/**
 * Refreshes all auto-equippable skills available to this battler.
 */
Game_Actor.prototype.refreshAutoEquippedSkills = function()
{
  // iterate over each of the skills and auto-assign/equip them where applicable.
  this.skills()
    .forEach(skill => this.jabsProcessLearnedSkill(skill.id), this);
};
//endregion learning

//region JABS bonus hits
/**
 * Gets all collections of sources that will be scanned for bonus hits.
 *
 * For actors, this includes:
 *   - All applied states
 *   - The actor's own data
 *   - All of the actor's equips
 *   - The actor's applied class
 * @returns {RPG_BaseItem[][]}
 */
Game_Actor.prototype.getBonusHitsSources = function()
{
  return [
    // allStates includes passive states; states() only returns regular states.
    this.allStates(),

    // the actor itself may contain bonus hits.
    [ this.databaseData() ],

    // the equipment may contain bonus hits.
    this.equips(),

    // the class may contain bonus hits.
    [ this.currentClass() ], ];
};
//endregion JABS bonus hits

//region map effects
/**
 * Replaces the map damage with JABS' version of the map damage.
 */
J.ABS.Aliased.Game_Actor.set('performMapDamage', Game_Actor.prototype.performMapDamage);
Game_Actor.prototype.performMapDamage = function()
{
  // check if JABS is disabled.
  if (!$jabsEngine.absEnabled)
  {
    // perform original logic.
    J.ABS.Aliased.Game_Actor.get('performMapDamage')
      .call(this);
  }
  // JABS is definitely enabled.
  else
  {
    // let JABS handle it.
    this.performJabsFloorDamage();
  }
};

/**
 * Handles how an actor is treated when they are taking floor damage on the map.
 */
Game_Actor.prototype.performJabsFloorDamage = function()
{
  // just flash the screen, the damage is applied by other means.
  $gameScreen.startFlashForDamage();
};

/**
 * Disable built-in on-turn-end effects while JABS is active.
 * (built-in effects include regeneration and poison, but those are
 * already handled elsewhere in the engine)
 */
J.ABS.Aliased.Game_Actor.set('turnEndOnMap', Game_Actor.prototype.turnEndOnMap);
Game_Actor.prototype.turnEndOnMap = function()
{
  // if JABS is enabled, the fun never stops- it runs regeneration and poison on its own clock.
  if ($jabsEngine.absEnabled === true) return;

  // do normal turn-end things while JABS is disabled.
  // perform original logic.
  J.ABS.Aliased.Game_Actor.get('turnEndOnMap')
    .call(this);
};
//endregion map effects

//region properties
/**
 * Gets the death effect.
 * @returns {boolean} The deathEffect.
 */
Game_Actor.prototype.deathEffect = function()
{
  // hand back the death effect.
  return this._j._abs._deathEffect;
};

/**
 * Sets the death effect.
 * @param {boolean} newDeathEffect The new deathEffect.
 */
Game_Actor.prototype.setDeathEffect = function(newDeathEffect)
{
  // assign the death effect.
  this._j._abs._deathEffect = newDeathEffect;
};
//endregion properties
//endregion Game_Actor
//region OverlayManager
/**
 * A static class for managing the overlaying of one skill onto another.
 * The methods are divided by the attribute they overlay.
 */
class OverlayManager
{

  //region properties
  /**
   * Gets the skill cache.
   * @returns {*} The skillCache.
   */
  static skillCache()
  {
    // hand back the skill cache.
    return this._skillCache;
  }

  /**
   * Gets the state cache.
   * @returns {*} The stateCache.
   */
  static stateCache()
  {
    // hand back the state cache.
    return this._stateCache;
  }
  //endregion properties

  /**
   * The line types available for overlaying in the context of a note.
   */

  static LineType = {
    /**
     * A "key value pair" tag, such as <key:value>.
     */
    kvp: 'kvp',

    /**
     * A "boolean" tag, such as <key>.
     */
    boolean: 'boolean',

    /**
     * A tag that isn't supported by this framework at this time.
     * Any tag that is not one of the defined types will qualify as this and not get mutated.
     */
    unsupported: 'unsupported',
  };

  //region caching
  /**
   * The cache for caster-skill extensions. Keyed by the caster alone- extension results are
   * wholesale-invalidated on any learnSkill/forgetSkill via {@link invalidate}, so the skill id
   * is a stable key within one cache lifetime with no need to encode the overlay set.
   * @type {JCache}
   */
  static _skillCache = JCache.battlerScoped({ name: 'overlay:caster-skill' });

  /**
   * Tracks skill ids currently mid-resolution per caster to detect circular extension data
   * (e.g. skill 2 extends skill 1 AND skill 1 extends skill 2, direct or indirect).
   * Unlike the old caster-level re-entrancy guard, this is scoped per-skillId so legitimate
   * recursive chains (A extends B extends C) proceed normally — only actual cycles throw.
   * @type {WeakMap<Game_Actor|Game_Enemy, Set<number>>}
   */
  static #resolving = new WeakMap();

  /**
   * The cache for battler-state extensions, parallel to {@link _skillCache} for skills.
   * @type {JCache}
   */
  static _stateCache = JCache.battlerScoped({ name: 'overlay:battler-state' });

  /**
   * Tracks state ids currently mid-resolution per battler to detect circular state extension data.
   * @type {WeakMap<Game_Battler, Set<number>>}
   */
  static #resolvingState = new WeakMap();

  /**
   * Invalidates the cache for the given battler.
   * @param {Game_Actor|Game_Enemy} battler The battler to invalidate the cache for.
   * @returns {boolean} True if the cache was invalidated, false otherwise.
   */
  static invalidate(battler)
  {
    this.skillCache().invalidate(battler);
    this.stateCache().invalidate(battler);
  }

  /**
   * Clears the cache for all objects.
   */
  static clearCache()
  {
    this.skillCache().clear();
    this.stateCache().clear();
  }

  //endregion caching

  /**
   * Gets the extended skill based on the caster's learned skills.
   *
   * Extension candidates are gathered from the caster's full {@link Game_Battler#skillIds} list
   * (learned skills only — unlike states, a skill overlay never applies unless the caster has
   * actually learned it) and applied in two passes:
   * 1. Type-based overlays ({@code <extendType:TYPE>}) in ascending skill-id order — familial.
   * 2. Id-based overlays ({@code <extend:[IDs]>}) in ascending skill-id order — specific.
   *
   * Each candidate is itself recursively resolved before being applied, so extension chains work.
   * Mirrors {@link getExtendedState}; see that method for the parallel state-side implementation.
   * @param caster {Game_Actor|Game_Enemy} The caster of the skill.
   * @param skillId {number} The base skill to extend.
   * @returns {RPG_Skill}
   */
  static getExtendedSkill(caster, skillId)
  {
    // validate the incoming base id.
    if (skillId <= 0) throw new Error('Invalid skill extension id.');

    // if we don't have a caster for some reason, don't process anything.
    if (!caster) return this.#requireDatabaseEntry($dataSkills[skillId], 'skill', skillId);

    // fast-path: JCache.get() itself checks the per-caster bucket before running the compute
    // function below, so a cache hit never allocates, filters, or touches the re-entrancy guard.
    // the cache is always invalidated wholesale via invalidate(battler) on any learnSkill /
    // forgetSkill call, so skillId alone is a stable key within one cache lifetime — encoding the
    // overlay set in the key is redundant overhead.
    return this.skillCache().get(caster, String(skillId), () =>
    {
      // cache miss: get all known skill ids for this caster.
      const knownIds = caster.skillIds();

      // get the target skill's type classifiers for type-based candidate matching.
      const targetSkill = $dataSkills[skillId];
      const targetTypes = targetSkill
        ? targetSkill.types()
        : [];

      // bucket candidates: type-based first (familial), id-based second (specific).
      const typeCandidates = [];
      const idCandidates = [];

      for (const id of knownIds)
      {
        // skip the target itself.
        if (id === skillId) continue;

        // skip invalid or non-extension skills.
        const candidate = $dataSkills[id];
        if (!candidate || !candidate.isExtension) continue;

        // type-based: candidate declares a type that intersects with the target's types.
        if (targetTypes.length > 0 && ArrayHelper.hasAnyIntersection(targetTypes, candidate.getExtensionTypes))
        {
          typeCandidates.push(id);
          continue;
        }

        // id-based: candidate explicitly lists this skillId as a target.
        if (candidate.getExtensions.includes(skillId))
        {
          idCandidates.push(id);
        }
      }

      // sort each bucket ascending by id.
      typeCandidates.sort((a, b) => a - b);
      idCandidates.sort((a, b) => a - b);

      // combine: type-based overlays first, id-based overlays second.
      const overlayIds = [ ...typeCandidates, ...idCandidates ];

      // get or create the set of skill ids currently being resolved for this caster.
      let inProgress = this.#resolving.get(caster);
      if (!inProgress)
      {
        inProgress = new Set();
        this.#resolving.set(caster, inProgress);
      }

      // a skill id already in the set means we have walked back to it — bad extension data.
      if (inProgress.has(skillId))
      {
        // circular extension detected — this is bad data, not a recoverable state.
        throw new Error(`Circular skill extension detected on skill ${skillId}! Please stop recursing the universe 💢`);
      }

      // mark this skill as in-flight before recursing into overlay resolution.
      inProgress.add(skillId);

      try
      {
        // recursively resolve each overlay to its own fully-extended form before applying it.
        const resolvedOverlays = overlayIds.map(id => this.getExtendedSkill(caster, id));
        return this.#getExtendedSkill(resolvedOverlays, skillId);
      }
      finally
      {
        // always remove the skill from in-flight so sibling and future calls proceed normally.
        inProgress.delete(skillId);
        if (inProgress.size === 0) this.#resolving.delete(caster);
      }
    });
  }

  //region state extension
  /**
   * Gets the extended state for the given battler and state id.
   *
   * Extension states are gathered from the battler's full {@link Game_Battler#allStateIds} list
   * (preserving passive stacks/duplicates) and applied in two passes:
   * 1. Type-based overlays ({@code <extendType:TYPE>}) in ascending state-id order — familial.
   * 2. Id-based overlays ({@code <extend:[IDs]>}) in ascending state-id order — specific.
   *
   * Each candidate is itself recursively resolved before being applied, so extension chains work.
   * Results are cached per-battler and invalidated by {@link OverlayManager.invalidate} on any
   * state change (via {@link Game_Battler#onBattlerDataChange}).
   * @param {Game_Battler} battler The battler whose active states supply potential overlays.
   * @param {number} stateId The base state id to potentially extend.
   * @returns {RPG_State} The extended (or unmodified) state.
   */
  static getExtendedState(battler, stateId)
  {
    // validate the incoming base id.
    if (stateId <= 0) throw new Error('Invalid state id for extension.');

    // if we don't have a battler for some reason, don't process anything.
    if (!battler) return this.#requireDatabaseEntry($dataStates[stateId], 'state', stateId);

    // fast-path: JCache.get() itself checks the per-battler bucket before running the compute
    // function below, so a cache hit never allocates, walks allStateIds, or touches the guard.
    return this.stateCache().get(battler, String(stateId), () =>
    {
      // cache miss: get all raw state ids, preserving stacks and duplicates.
      const allIds = battler.allStateIds();

      // get the target state's type classifiers for type-based candidate matching.
      const targetState = $dataStates[stateId];
      const targetTypes = targetState
        ? targetState.types()
        : [];

      // bucket candidates: type-based first (familial), id-based second (specific).
      const typeCandidates = [];
      const idCandidates = [];

      for (const id of allIds)
      {
        // skip the target itself.
        if (id === stateId) continue;

        // skip invalid or non-extension states.
        const candidate = $dataStates[id];
        if (!candidate || !candidate.isExtension) continue;

        // type-based: candidate declares a type that intersects with the target's types.
        if (targetTypes.length > 0 && ArrayHelper.hasAnyIntersection(targetTypes, candidate.getExtensionTypes))
        {
          typeCandidates.push(id);
          continue;
        }

        // id-based: candidate explicitly lists this stateId as a target.
        if (candidate.getExtensions.includes(stateId))
        {
          idCandidates.push(id);
        }
      }

      // sort each bucket ascending by id (duplicate stacks of the same id remain consecutive).
      typeCandidates.sort((a, b) => a - b);
      idCandidates.sort((a, b) => a - b);

      // combine: type-based overlays first, id-based overlays second.
      const overlayIds = [ ...typeCandidates, ...idCandidates ];

      // get or create the circular-guard set for this battler.
      let inProgressState = this.#resolvingState.get(battler);
      if (!inProgressState)
      {
        inProgressState = new Set();
        this.#resolvingState.set(battler, inProgressState);
      }

      // a stateId already in the set means we have walked back to it — circular data.
      if (inProgressState.has(stateId))
      {
        throw new Error(`Circular state extension detected on state ${stateId}! Please stop recursing the universe 💢`);
      }

      // mark this state as in-flight before recursing into overlay resolution.
      inProgressState.add(stateId);

      try
      {
        // recursively resolve each overlay to its own fully-extended form before applying it.
        const resolvedOverlays = overlayIds.map(id => this.getExtendedState(battler, id));
        return this.#getExtendedState(resolvedOverlays, stateId);
      }
      finally
      {
        // always clear the in-flight marker so siblings and future calls proceed normally.
        inProgressState.delete(stateId);
        if (inProgressState.size === 0) this.#resolvingState.delete(battler);
      }
    });
  }
  //endregion state extension

  /**
   * Extends the base skill with the given overlay skills in sequential order.
   * @param {RPG_Skill[]} overlaySkills - The skill overlays to apply.
   * @param {number} skillId - The id of the base skill to extend.
   * @returns {RPG_Skill} The extended skill.
   */
  static #getExtendedSkill(overlaySkills, skillId)
  {
    // a missing row is bad data, not a recoverable state; say so before anything else touches it.
    const baseSkill = this.#requireDatabaseEntry($dataSkills[skillId], 'skill', skillId);

    // if there are no overlays, return the original skill without incurring clone cost.
    if (overlaySkills.length === 0)
    {
      // return the base database skill untouched.
      return baseSkill;
    }

    // clone the base skill so overlays can safely mutate the clone without affecting the database.
    const baseClone = baseSkill._clone();

    // apply all overlays in order to produce the final extended skill.
    const extended = overlaySkills
      .reduce((working, overlay) => this.extendSkill(working, overlay), baseClone);

    // return the final extended skill.
    return extended;
  }

  /**
   * Extends the base state with the given overlay states in sequential order.
   * @param {RPG_State[]} overlayStates The state overlays to apply.
   * @param {number} stateId The id of the base state to extend.
   * @returns {RPG_State} The extended state.
   */
  static #getExtendedState(overlayStates, stateId)
  {
    // a missing row is bad data, not a recoverable state; say so before anything else touches it.
    const baseState = this.#requireDatabaseEntry($dataStates[stateId], 'state', stateId);

    // if there are no overlays, return the original state without incurring clone cost.
    if (overlayStates.length === 0) return baseState;

    // clone the base state so overlays can safely mutate the clone without affecting the database.
    const baseClone = baseState._clone();

    // apply all overlays in order to produce the final extended state.
    return overlayStates.reduce((working, overlay) => this.extendState(working, overlay), baseClone);
  }

  /**
   * Asserts that a database row actually exists before it gets overlaid.
   *
   * An `<extend:>` tag pointing at an id that no longer exists is a data error, and a silent
   * fallback would leave a skill or state quietly doing nothing for the rest of the playthrough.
   * Failing loudly, naming the id, is the only useful outcome.
   * @param {RPG_Skill|RPG_State} entry The database row to validate.
   * @param {string} kind The kind of row, for the error message.
   * @param {number} id The id that was looked up.
   * @returns {RPG_Skill|RPG_State} The validated row.
   */
  static #requireDatabaseEntry(entry, kind, id)
  {
    // an absent row means the id is dangling and there is nothing meaningful to overlay.
    if (!entry)
    {
      throw new Error(`Extension targets a ${kind} id that does not exist: ${id}. Check your <extend:> data.`);
    }

    return entry;
  }

  /**
   * Merges the skill overlay onto the base skill and returns the updated base skill.
   * @param baseSkill {RPG_Skill} The base skill to be overlayed.
   * @param skillOverlay {RPG_Skill} The skill to overlay with.
   * @returns {RPG_Skill} The base skill overlayed with the overlay skill.
   */
  static extendSkill(baseSkill, skillOverlay)
  {
    // merge all of the base skill data.
    const updatedBaseSkill = this.extendBaseSkill(baseSkill, skillOverlay);

    // sanitize the skill extends out of the base skill to prevent recursive extensions.
    this.sanitizeExtensions(updatedBaseSkill);

    // return the base skill merged with the overlay.
    return updatedBaseSkill;
  }

  //region extensions
  /**
   * Overlays the base skill data.
   *
   * Effects, meta, note, and repeats are combined.
   *
   * Scope, mpCost, tpCost, and tpGain are replaced.
   * @param baseSkill {RPG_Skill} The base skill.
   * @param skillOverlay {RPG_Skill} The overlay skill.
   * @returns {RPG_Skill} The overlayed base skill.
   */
  static extendBaseSkill(baseSkill, skillOverlay)
  {
    // extend all the sections of the skill with the skill overlay.
    this.extendGeneral(baseSkill, skillOverlay);
    this.extendDamage(baseSkill, skillOverlay);
    this.extendEffects(baseSkill, skillOverlay);
    this.extendInvocation(baseSkill, skillOverlay);
    this.extendMessage(baseSkill, skillOverlay);

    // extend the note and metadata with the skill overlay.
    this.extendMetadata(baseSkill, skillOverlay);

    // return the base skill extended by the overlay.
    return baseSkill;
  }

  /**
   * Extends the general settings section of a skill.
   * @param {RPG_Skill} baseSkill The skill being extended.
   * @param {RPG_Skill} skillOverlay The skill extending the base skill.
   */
  static extendGeneral(baseSkill, skillOverlay)
  {
    // overwrite mp costs if not the same.
    if (baseSkill.mpCost !== skillOverlay.mpCost)
    {
      baseSkill.mpCost = skillOverlay.mpCost;
    }

    // overwrite tp costs if not the same.
    if (baseSkill.tpCost !== skillOverlay.tpCost)
    {
      baseSkill.tpCost = skillOverlay.tpCost;
    }

    // overwrite scope if not "none" (0 = default) and not the same.
    const bothHaveScopes = baseSkill.scope !== 0 && skillOverlay.scope !== 0;
    const scopesHaveChanged = baseSkill.scope !== skillOverlay.scope;
    if (bothHaveScopes && scopesHaveChanged)
    {
      baseSkill.scope = skillOverlay.scope;
    }

    // NOTE: not overriding "occasion".
    // NOTE: not overriding "skill type".
  }

  /**
   * Extends the damage section of a skill.
   * @param {RPG_Skill} baseSkill The skill being extended.
   * @param {RPG_Skill} skillOverlay The skill extending the base skill.
   */
  static extendDamage(baseSkill, skillOverlay)
  {
    // if the overlay damage type isn't "none", then overlay those values.
    if (!skillOverlay.damage.type)
    {
      return;
    }

    if (baseSkill.damage.critical !== skillOverlay.damage.critical)
    {
      // overwrite the critical toggle.
      baseSkill.damage.critical = skillOverlay.damage.critical;
    }

    if (baseSkill.damage.elementId !== skillOverlay.damage.elementId)
    {
      baseSkill.damage.elementId = skillOverlay.damage.elementId;
    }

    if (baseSkill.damage.type !== skillOverlay.damage.type)
    {
      // allow upgrading hp-damage >> hp-drain.
      if (baseSkill.damage.type === 1 && skillOverlay.damage.type === 5)
      {
        baseSkill.damage.type = 5;
      }
      // allow upgrading mp-damage >> mp-drain.
      else if (baseSkill.damage.type === 2 && skillOverlay.damage.type === 6)
      {
        baseSkill.damage.type = 6;
      }

      // otherwise, overwrite damage type.
      // TODO: when stacking damage types, update here.
    }
    if (baseSkill.damage.variance !== skillOverlay.damage.variance)
    {
      baseSkill.damage.variance = skillOverlay.damage.variance;
    }

    if (skillOverlay.damage.formula && baseSkill.damage.formula !== skillOverlay.damage.formula)
    {
      // overwrite the formula.
      baseSkill.damage.formula = skillOverlay.damage.formula;
    }
  }

  /**
   * Extends the effects section of a skill.
   *
   * For add-state effects (code 21), the overlay wins per state id — "last extension wins."
   * If the overlay defines a chance for state X, any earlier add-state entries for state X
   * are stripped from the base before concatenation.  This prevents duplicate apply-state
   * rolls when a later extension upgrades a partial chance to a guaranteed application.
   *
   * All other effect types are concatenated as before.
   * @param {RPG_Skill} baseSkill The skill being extended.
   * @param {RPG_Skill} skillOverlay The skill extending the base skill.
   */
  static extendEffects(baseSkill, skillOverlay)
  {
    // nothing to merge if the overlay contributes no effects.
    if (skillOverlay.effects.length === 0) return;

    // collect the add-state effects the overlay is explicitly providing.
    const overlayAddStates = skillOverlay.effects
      .filter(e => e.code === Game_Action.EFFECT_ADD_STATE);

    if (overlayAddStates.length > 0)
    {
      // build the set of state ids the overlay will own going forward.
      const replacedIds = new Set(overlayAddStates.map(e => e.dataId));

      // remove any prior add-state entries for those ids so there is no duplicate roll.
      baseSkill.effects = baseSkill.effects
        .filter(e => e.code !== Game_Action.EFFECT_ADD_STATE || replacedIds.has(e.dataId) === false);
    }

    // concat all overlay effects — add-state entries for replaced ids now exist only once.
    baseSkill.effects = baseSkill.effects.concat(skillOverlay.effects);
  }

  /**
   * Extends the metadata of a skill.
   * @param {RPG_Skill} baseSkill The skill being extended.
   * @param {RPG_Skill} skillOverlay The skill extending the base skill.
   */
  static extendMetadata(baseSkill, skillOverlay)
  {
    // combine the meta together.
    baseSkill.meta = {
      ...baseSkill.meta, ...skillOverlay.meta,
    };

    // merge notes via overwriteNote() instead of blind concatenation.
    baseSkill.note = this.overwriteNote(baseSkill.note, skillOverlay.note);

    // invalidate all cached tag parses for this object (RPGManager WeakMap cache).
    RPGManager.invalidate(baseSkill);
  }

  /**
   * Extends the invocation section of a skill.
   * @param {RPG_Skill} baseSkill The skill being extended.
   * @param {RPG_Skill} skillOverlay The skill extending the base skill.
   */
  static extendInvocation(baseSkill, skillOverlay)
  {
    // combine speeds.
    if (skillOverlay.speed !== 0)
    {
      baseSkill.speed += skillOverlay.speed;
    }

    // if they aren't the same, and aren't 100 (default), then add them.
    // both halves must hold: an overlay sitting at the RMMZ default of 100 has expressed no opinion
    // about accuracy, so it must not contribute. with an OR here, extending any skill whose own rate
    // was not 100 would add a flat +100 to it purely because the two values differed- silently
    // turning a deliberately-fallible skill into one that never misses.
    if (baseSkill.successRate !== skillOverlay.successRate && skillOverlay.successRate !== 100)
    {
      baseSkill.successRate += skillOverlay.successRate;
    }

    // combine repeats if they aren't just 1 (default).
    if (skillOverlay.repeats !== 1)
    {
      baseSkill.repeats += (skillOverlay.repeats - 1);
    }

    // combine the tp gains.
    baseSkill.tpGain += skillOverlay.tpGain;

    // if both hit types are NOT "certain hit" (default), then overwrite them.
    if (baseSkill.hitType && skillOverlay.hitType)
    {
      baseSkill.hitType = skillOverlay.hitType;
    }

    // overwrite the animation only if the overlay actually specifies one (not 0/default) and it changed.
    if (skillOverlay.animationId !== 0 && baseSkill.animationId !== skillOverlay.animationId)
    {
      baseSkill.animationId = skillOverlay.animationId;
    }
  }

  /**
   * Extends the message section of a skill.
   * @param {RPG_Skill} baseSkill The skill being extended.
   * @param {RPG_Skill} skillOverlay The skill extending the base skill.
   */
  static extendMessage(baseSkill, skillOverlay)
  {
    // overwrite message 1 only if the overlay actually specifies one (not blank/default).
    if (skillOverlay.message1 !== String.empty && baseSkill.message1 !== skillOverlay.message1)
    {
      baseSkill.message1 = skillOverlay.message1;
    }

    // overwrite message 2 only if the overlay actually specifies one (not blank/default).
    if (skillOverlay.message2 !== String.empty && baseSkill.message2 !== skillOverlay.message2)
    {
      baseSkill.message2 = skillOverlay.message2;
    }
  }

  /**
   * Purges all references to the skill extension tags from the `baseSkill`.
   * @param baseSkill {RPG_Skill} The base skill.
   * @returns {RPG_Skill} The overlayed base skill.
   */
  static sanitizeExtensions(baseSkill)
  {
    // remove the extend tags from the metadata.
    delete baseSkill.meta['extend'];
    delete baseSkill.meta['extendType'];

    // remove the extend tags from the notedata, so recursive re-triggering can't occur.
    baseSkill.note = baseSkill.note.replace(J.EXTEND.RegExp.Extend, String.empty);
    baseSkill.note = baseSkill.note.replace(J.EXTEND.RegExp.ExtendType, String.empty);

    // cleanup any duplicate newlines.
    baseSkill.note = baseSkill.note.replace(/\n\n/gmi, '\n');
    baseSkill.note = baseSkill.note.replace(/\r\r/gmi, '\r');

    // we changed the note – invalidate cached parses for this skill.
    RPGManager.invalidate(baseSkill);
  }

  //region state extensions
  /**
   * Merges the state overlay onto the base state and returns the updated base state.
   * @param {RPG_State} baseState The base state to be overlaid.
   * @param {RPG_State} stateOverlay The state to overlay with.
   * @returns {RPG_State} The updated base state.
   */
  static extendState(baseState, stateOverlay)
  {
    this.extendStateGeneral(baseState, stateOverlay);
    this.extendStateRemoval(baseState, stateOverlay);
    this.extendStateMessages(baseState, stateOverlay);
    this.extendStateTraits(baseState, stateOverlay);
    this.extendStateMetadata(baseState, stateOverlay);
    this.sanitizeStateExtensions(baseState);
    return baseState;
  }

  /**
   * Extends the general section of a state (restriction, priority, overlay icon, battler motion).
   * @param {RPG_State} baseState The state being extended.
   * @param {RPG_State} stateOverlay The state extending the base.
   */
  static extendStateGeneral(baseState, stateOverlay)
  {
    // overwrite restriction only when the overlay declares one (0 = "none"/default).
    if (stateOverlay.restriction !== 0)
    {
      baseState.restriction = stateOverlay.restriction;
    }

    // overwrite priority only when the overlay declares a non-default value (50 = default).
    if (stateOverlay.priority !== 50)
    {
      baseState.priority = stateOverlay.priority;
    }

    // overwrite the visual overlay icon only when the overlay declares one (0 = none/default).
    if (stateOverlay.overlay !== 0)
    {
      baseState.overlay = stateOverlay.overlay;
    }

    // overwrite the battler motion only when the overlay declares one (0 = none/default).
    if (stateOverlay.motion !== 0)
    {
      baseState.motion = stateOverlay.motion;
    }
  }

  /**
   * Extends the removal conditions of a state (timing, turns, damage, walk, restriction, battle-end).
   * Last wins for all fields; numeric fields only replace when the overlay differs from default.
   * @param {RPG_State} baseState The state being extended.
   * @param {RPG_State} stateOverlay The state extending the base.
   */
  static extendStateRemoval(baseState, stateOverlay)
  {
    // overwrite timing when the overlay declares a non-default value (0 = "none"/default).
    if (stateOverlay.autoRemovalTiming !== 0)
    {
      baseState.autoRemovalTiming = stateOverlay.autoRemovalTiming;
    }

    // overwrite turn range when the overlay declares non-default values (1/1 = defaults).
    if (stateOverlay.minTurns !== 1) baseState.minTurns = stateOverlay.minTurns;
    if (stateOverlay.maxTurns !== 1) baseState.maxTurns = stateOverlay.maxTurns;

    // last wins for all boolean removal flags.
    baseState.removeAtBattleEnd = stateOverlay.removeAtBattleEnd;
    baseState.removeByRestriction = stateOverlay.removeByRestriction;
    baseState.removeByDamage = stateOverlay.removeByDamage;
    baseState.removeByWalking = stateOverlay.removeByWalking;

    // overwrite numeric removal params only when they differ from their defaults.
    if (stateOverlay.chanceByDamage !== 100) baseState.chanceByDamage = stateOverlay.chanceByDamage;
    if (stateOverlay.stepsToRemove !== 100) baseState.stepsToRemove = stateOverlay.stepsToRemove;
  }

  /**
   * Extends the messages of a state; only overwrites when the overlay provides a non-empty string.
   * @param {RPG_State} baseState The state being extended.
   * @param {RPG_State} stateOverlay The state extending the base.
   */
  static extendStateMessages(baseState, stateOverlay)
  {
    if (stateOverlay.message1) baseState.message1 = stateOverlay.message1;
    if (stateOverlay.message2) baseState.message2 = stateOverlay.message2;
    if (stateOverlay.message3) baseState.message3 = stateOverlay.message3;
    if (stateOverlay.message4) baseState.message4 = stateOverlay.message4;
  }

  /**
   * Extends the traits of a state using {@link TraitResolver.overlayTraits} (last wins per code+dataId).
   * @param {RPG_State} baseState The state being extended.
   * @param {RPG_State} stateOverlay The state extending the base.
   */
  static extendStateTraits(baseState, stateOverlay)
  {
    baseState.traits = TraitResolver.overlayTraits(baseState.traits, stateOverlay.traits);
  }

  /**
   * Extends the metadata and note of a state.
   * @param {RPG_State} baseState The state being extended.
   * @param {RPG_State} stateOverlay The state extending the base.
   */
  static extendStateMetadata(baseState, stateOverlay)
  {
    baseState.meta = { ...baseState.meta, ...stateOverlay.meta };
    baseState.note = this.overwriteNote(baseState.note, stateOverlay.note);
    RPGManager.invalidate(baseState);
  }

  /**
   * Purges all state-extension tags from the note of the given state to prevent recursive extension.
   * @param {RPG_State} baseState The state to sanitize.
   */
  static sanitizeStateExtensions(baseState)
  {
    baseState.note = baseState.note.replace(J.EXTEND.RegExp.Extend, String.empty);
    baseState.note = baseState.note.replace(J.EXTEND.RegExp.ExtendType, String.empty);
    baseState.note = baseState.note.replace(/\n\n/gmi, '\n');
    baseState.note = baseState.note.replace(/\r\r/gmi, '\r');
    RPGManager.invalidate(baseState);
  }
  //endregion state extensions

  //region extend note
  // TODO: make this configurable.
  /**
   * Merges the overlay note into the base note with key-aware behavior.
   * - For keys not registered as non-combining: replace base lines with overlay lines if overlay provides any.
   * - For keys registered as non-combining: append unique overlay lines after base lines.
   * - Unsupported lines (non-tag text) are preserved from both notes with deduplication; base lines keep priority.
   * Non-combining keys are registered via {@link J.EXTEND.Metadata.registerNonCombiningKey}.
   * Keys are case-insensitive. Tags are those enclosed with angle brackets (e.g., `<key:value>` or `<key>`).
   * @param {string} baseNote The base note content.
   * @param {string} overlayNote The overlay note content.
   * @returns {string} The merged note text, joined with newlines.
   */
  static overwriteNote(baseNote, overlayNote)
  {
    // normalize the incoming notes to empty strings if nullish.
    const oldNote = baseNote || String.empty;

    // normalize the overlay note to empty string if nullish.
    const newNote = overlayNote || String.empty;

    // fetch the currently registered non-combining keys from the extend plugin metadata.
    const exclusions = J.EXTEND.Metadata.getNonCombiningKeys();

    // tokenize both notes into tags and unsupported lines.
    const oldTokens = this._tokenizeNote(oldNote);

    // tokenize the new note into tags and unsupported lines as well.
    const newTokens = this._tokenizeNote(newNote);

    // bucket the tags by key for old note.
    const oldBuckets = this._toKeyBuckets(oldTokens.tags);

    // bucket the tags by key for new note.
    const newBuckets = this._toKeyBuckets(newTokens.tags);

    // merge the buckets based on replace-or-append rules per registered non-combining keys.
    const merged = this._mergeBuckets(oldBuckets, newBuckets, exclusions);

    // merge unsupported lines from old then new with deduplication.
    const mergedUnsupported = this._mergeUnsupported(oldTokens.unsupported, newTokens.unsupported);

    // reconstruct the final note text from unsupported + merged tags in key order.
    const result = this._reconstructNote(mergedUnsupported, merged);

    // return the final merged note string.
    return result;
  }

  /**
   * Tokenizes a note text into angle-bracketed tags and unsupported lines.
   * Handles tags concatenated without newlines by regex extraction, and also
   * collects newline-separated content that is not tags.
   * @param {string} note The raw note text.
   * @returns {{tags: string[], unsupported: string[]}} The extracted tags and unsupported lines.
   */
  static _tokenizeNote(note)
  {
    // find angle-bracketed chunks like <key:value> or <key>.
    const tags = note.match(/<[^>]+>/g) || [];

    // split the raw text on newlines to capture any free-form lines.
    const rawLines = (note.split(/[\r\n]+/) || []).filter(l => l.length > 0);

    // build a fast look-up set of exact tag strings.
    const tagSet = new Set(tags);

    // anything that is not an exact tag string is considered unsupported.
    const unsupported = rawLines.filter(l => tagSet.has(l) === false);

    // return the separated collections.
    return {
      tags: tags,
      unsupported: unsupported
    };
  }

  /**
   * Parses a single tag string into a key and type using the existing classifier.
   * @param {string} tag The tag, e.g. "<range:5>" or "<direct>".
   * @returns {{type: string, key: (string|null), line: string}} The parsed record.
   */
  static _parseTag(tag)
  {
    // classify tag or unsupported using existing logic.
    const type = this._classifyLine(tag);

    // unsupported tags simply echo back with null key.
    if (type === OverlayManager.LineType.unsupported)
    {
      // return unsupported tag data.
      return {
        type: type,
        key: null,
        line: tag
      };
    }

    // strip off the leading and trailing angle brackets.
    const inner = tag.substring(1, tag.length - 1);

    // if this is a kvp like <key:value> then split on the first colon.
    if (type === OverlayManager.LineType.kvp)
    {
      // find the first colon index.
      const idx = inner.indexOf(':');

      // extract and normalize the key to lowercase.
      const key = inner.substring(0, idx)
        .trim()
        .toLowerCase();

      // return the parsed kvp.
      return {
        type: type,
        key: key,
        line: tag
      };
    }

    // it must be boolean; use the entire inner content as the key.
    const key = inner.trim()
      .toLowerCase();

    // return the parsed boolean.
    return {
      type: OverlayManager.LineType.boolean,
      key: key,
      line: tag
    };
  }

  /**
   * Determines if the note line is one of our standard key-value pairs separated by a colon.
   * @param {string} line The note line as a string.
   * @returns {boolean} True if it is a conventional <key:value> type of line.
   */
  static _classifyLine(line)
  {
    // must at least start and end with angle brackets.
    if (line.startsWith('<') === false || line.endsWith('>') === false) return OverlayManager.LineType.unsupported;

    // too many angle brackets.
    if ((line.match(/</g) || []).length > 1) return OverlayManager.LineType.unsupported;
    if ((line.match(/>/g) || []).length > 1) return OverlayManager.LineType.unsupported;

    // if a colon exists, then it must be a key-value pair of some kind.
    if (line.includes(':')) return OverlayManager.LineType.kvp;

    // its just a pair of angle brackets, so its a boolean-type tag.
    return OverlayManager.LineType.boolean;
  }

  /**
   * Buckets an array of tag strings by their keys, preserving the first-seen key order
   * and deduping exact duplicate lines within a key.
   * @param {string[]} tags The tag strings to bucket.
   * @returns {{ order: string[], map: Record<string, string[]> }} The ordered keys and per-key lines.
   */
  static _toKeyBuckets(tags)
  {
    // the ordered list of unique keys as encountered.
    const order = [];

    // the key -> array-of-lines mapping.
    const map = Object.create(null);

    // iterate over each tag.
    tags.forEach(tag =>
    {
      // parse the tag into its parts.
      const parsed = this._parseTag(tag);

      // skip unsupported; those are handled elsewhere.
      if (parsed.type === OverlayManager.LineType.unsupported)
      {
        return;
      }

      // if encountering this key for the first time, initialize it.
      if (map[parsed.key] === undefined)
      {
        // initialize the array of lines for this key.
        map[parsed.key] = [];

        // record the encounter order for later reconstruction.
        order.push(parsed.key);
      }

      // dedupe exact duplicate lines for this key.
      if (map[parsed.key].includes(parsed.line) === false)
      {
        // add this unique line.
        map[parsed.key].push(parsed.line);
      }
    });

    // return the buckets.
    return {
      order: order,
      map: map
    };
  }

  /**
   * Merges the old and new buckets according to replacement rules and exclusions.
   * - For keys NOT in exclusions: replace old lines entirely with new lines (if provided), else keep old.
   * - For keys IN exclusions: combine old lines with new lines (append unique new lines), preserving order.
   * - New-only keys are appended in the order they appear in the new note.
   * @param {{order: string[], map: Record<string, string[]>}} oldBuckets The buckets from the base note.
   * @param {{order: string[], map: Record<string, string[]>}} newBuckets The buckets from the overlay note.
   * @param {string[]} exclusions The keys to be combined instead of replaced.
   * @returns {{ order: string[], map: Record<string, string[]> }} The merged buckets.
   */
  static _mergeBuckets(oldBuckets, newBuckets, exclusions)
  {
    // the merged map to accumulate into.
    const mergedMap = Object.create(null);

    // the merged key order to output.
    const mergedOrder = [];

    // helper to append a key with its lines in order while honoring dedupe.
    const appendKey = (key, lines) =>
    {
      // ignore if no lines provided.
      if (!lines || lines.length === 0)
      {
        return;
      }

      // set the lines array as a shallow copy.
      mergedMap[key] = lines.slice(0);

      // record the key order if not already present.
      if (mergedOrder.includes(key) === false)
      {
        // push the key preserving order.
        mergedOrder.push(key);
      }
    };

    // step 1: walk old keys first to preserve their order baseline.
    oldBuckets.order.forEach(key =>
    {
      // determine whether this key is in the exclusions list.
      const isExcluded = exclusions.includes(key);

      // gather the old lines for this key.
      const oldLines = oldBuckets.map[key];

      // gather any new lines for this key, if present.
      const newLines = newBuckets.map[key];

      // if we have new lines and the key is not excluded, then replace.
      if (newLines && newLines.length > 0 && isExcluded === false)
      {
        // replace the old lines entirely with the new lines.
        appendKey(key, newLines);
        return;
      }

      // if the key is excluded and we have new lines, then combine.
      if (isExcluded && newLines && newLines.length > 0)
      {
        // start with a copy of old lines.
        const combined = oldLines.slice(0);

        // append any new unique lines.
        newLines.forEach(line =>
        {
          // only include if not present.
          if (combined.includes(line) === false)
          {
            // add the unique new line.
            combined.push(line);
          }
        });

        // append the combined lines for this key.
        appendKey(key, combined);
        return;
      }

      // otherwise, no new lines or no exclusion behavior; keep old.
      appendKey(key, oldLines);
    });

    // step 2: append any new-only keys at the end in the order they appear in the new note.
    newBuckets.order.forEach(key =>
    {
      // only consider keys we don't already have.
      if (mergedOrder.includes(key) === false)
      {
        // add the new-only key with its lines as-is.
        appendKey(key, newBuckets.map[key]);
      }
    });

    // return the merged buckets for reconstruction.
    return {
      order: mergedOrder,
      map: mergedMap
    };
  }

  /**
   * Merges unsupported lines by appending new unsupported lines that do not already exist.
   * Old unsupported lines retain their relative order.
   * @param {string[]} oldUnsupported The unsupported lines from the base note.
   * @param {string[]} newUnsupported The unsupported lines from the overlay note.
   * @returns {string[]} The merged unsupported lines.
   */
  static _mergeUnsupported(oldUnsupported, newUnsupported)
  {
    // initialize the merged unsupported list honoring old order.
    const merged = [];

    // include all old unsupported while deduping.
    oldUnsupported.forEach(line =>
    {
      // only include if not already added.
      if (merged.includes(line) === false)
      {
        // add the old unsupported line.
        merged.push(line);
      }
    });

    // append any new unsupported lines not already present.
    newUnsupported.forEach(line =>
    {
      // only include if not already present.
      if (merged.includes(line) === false)
      {
        // add the new unsupported line.
        merged.push(line);
      }
    });

    // return the merged unsupported lines.
    return merged;
  }

  /**
   * Reconstructs a note from unsupported lines and merged buckets of tags.
   * Unsupported lines are emitted first, followed by tags grouped by key in key order.
   * @param {string[]} unsupported The unsupported lines to emit first.
   * @param {{order: string[], map: Record<string, string[]>}} buckets The merged buckets.
   * @returns {string} The reconstructed note text.
   */
  static _reconstructNote(unsupported, buckets)
  {
    // initialize an array of parts to join.
    const parts = [];

    // append unsupported lines first, honoring their order.
    unsupported.forEach(line =>
    {
      // push the unsupported line.
      parts.push(line);
    });

    // for each key in order, append its lines in recorded order.
    buckets.order.forEach(key =>
    {
      // retrieve the lines for this key.
      const lines = buckets.map[key];

      // append each tag line.
      lines.forEach(line =>
      {
        // push the tag line.
        parts.push(line);
      });
    });

    // join with newlines to keep readability and stability.
    const result = parts.join('\n');

    // return the reconstructed note.
    return result;
  }

  //endregion extend note
  //endregion extensions
}

export default OverlayManager;
//endregion OverlayManager
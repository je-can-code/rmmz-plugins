//region ApManager
import AptitudeTeachable from './../_models/AptitudeTeachable.js';

class ApManager
{
  /**
   * Awards AP to the given actor, distributing to all active APT sources
   * and resolving any skill learns that cross their thresholds.
   * @param {Game_Actor} actor The actor gaining AP.
   * @param {number} amount The amount of AP awarded.
   * @param {string} cause A short label describing the cause (ex: 'victory').
   */
  static gainAp(actor, amount, cause = 'victory')
  {
    // don't bother if the AP gained is zero or actor cannot gain.
    if (this.canGainAp(actor, amount) === false) return;

    // scale the award by the actor's aptitude gain multiplier. an identity multiplier is skipped
    // so the award passes through at exactly its authored value- a multiplier of zero, however, is
    // an actor who has been tagged into earning nothing, and must scale the award away entirely.
    let scaledAmount = amount;
    if (actor.apr !== 1)
    {
      scaledAmount = Math.round(amount * actor.apr);
    }

    if (scaledAmount === 0) return;

    // build the list of active sources for this actor.
    const teachableSources = this.activeTeachables(actor);

    // iterate each active source to apply AP.
    teachableSources.forEach(source =>
    {
      // deconstruct the source for readability.
      const { key, teachables } = source;

      // apply the AP to this source's taught skills.
      this.applyApToSource(actor, key, teachables, scaledAmount, cause);
    });
  }

  /**
   * Determines whether the actor can gain AP.
   * @param {Game_Actor} actor The actor to evaluate.
   * @param {number} amount The amount of AP to check.
   * @returns {boolean} True if the actor can gain AP, false otherwise.
   */
  static canGainAp(actor, amount)
  {
    // dead actors cannot gain AP.
    if (actor.isDead()) return false;

    // zero AP cannot be gained.
    if (amount === 0) return false;

    // gain the AP!
    return true;
  }

  /**
   * Derives a stable key for a source.
   * @param {RPG_Base} source The source to derive a key for.
   * @returns {string} The stable key.
   */
  static deriveKey(source)
  {
    return `${source.implementationType()}:${source.id}`;
  }

  /**
   * Resolves a `sourceKey` (as produced by {@link ApManager.deriveKey}) back to the
   * concrete RPG object currently contributing aptitude teachables for the actor.
   *
   * Notes:
   * - This searches the actor’s current aptitude sources and matches by the same
   *   `deriveKey(source)` used during AP distribution, guaranteeing a stable pair.
   * - If the matched source is a skill, this returns the actor’s live skill entry
   *   (`actor.skill(id)`) to mirror the behavior in `#activeTeachables`.
   *
   * @param {Game_Actor} actor - The actor whose sources are searched.
   * @param {string} sourceKey - The stable key (e.g., "@base:usable:skill:17").
   * @returns {RPG_Actor|RPG_Class|RPG_Skill|RPG_Weapon|RPG_Armor|RPG_State|null} - The found source object.
   */
  static resolveSourceByKey(actor, sourceKey)
  {
    // guard against missing inputs.
    if (!actor) return null;

    // gather all current aptitude sources from the actor.
    const sources = actor.getAptitudeSources();

    // iterate the sources to find a matching key.
    for (let i = 0; i < sources.length; i++)
    {
      // grab the candidate source.
      const candidate = sources[i];

      // re-derive the stable key from this source.
      const key = this.deriveKey(candidate);

      // if the key matches, we have our source.
      if (key === sourceKey)
      {
        // if this is a skill, resolve to the actor's live skill entry.
        if (candidate.isSkill() === true)
        {
          // return the actor's known version of the database skill.
          return actor.skill(candidate.id);
        }

        // otherwise, return the source as-is.
        return candidate;
      }
    }

    // no matching source was found.
    return null;
  }

  /**
   * Resolves a `sourceKey` into a database object (ignores actor state).
   * @param {string} sourceKey The source key driving this step.
   * @returns {RPG_Actor|RPG_Class|RPG_Skill|RPG_Weapon|RPG_Armor|RPG_State|RPG_Item|null}
   */
  static resolveStaticSourceByKey(sourceKey)
  {
    const parsed = this.parseKey(sourceKey);
    if (!parsed || Number.isFinite(parsed.id) === false) return null;
    const {
      types,
      id
    } = parsed;
    const terminal = types[types.length - 1];
    switch (terminal)
    {
      case 'skill':
        return $dataSkills[id] || null;
      case 'weapon':
        return $dataWeapons[id] || null;
      case 'armor':
        return $dataArmors[id] || null;
      case 'state':
        return $dataStates[id] || null;
      case 'class':
        return $dataClasses[id] || null;
      case 'actor':
        return $dataActors[id] || null;
      case 'item':
        return $dataItems[id] || null;
      default:
        return null;
    }
  }

  static isSourceActive(actor, sourceKey)
  {
    if (!actor) return false;
    // Build a set of current keys once per call; S is usually small.
    const sources = actor.getAptitudeSources();
    for (let i = 0; i < sources.length; i++)
    {
      const key = this.deriveKey(sources[i]);
      if (key === sourceKey) return true;
    }
    return false;
  }

  /**
   * Resolves a list of `sourceKey`s into their concrete source objects.
   *
   * @param {Game_Actor} actor - The actor whose sources are searched.
   * @param {string[]} sourceKeys - The list of stable keys to resolve.
   * @returns {(RPG_Base|null)[]} - Array of resolved sources (null where missing).
   */
  static resolveAllSourcesByKeys(actor, sourceKeys)
  {
    // coalesce an empty list if none provided.
    const keys = Array.isArray(sourceKeys)
      ? sourceKeys
      : [];

    // map each key through the single-key resolver.
    const resolved = keys.map(key => this.resolveSourceByKey(actor, key));

    // return the resolved list.
    return resolved;
  }

  /**
   * Parses a `sourceKey` produced by {@link ApManager.deriveKey}.
   *
   * A key looks like: "@base:traited:equip:weapon:12" or "@base:usable:skill:17".
   * The final segment is always the numeric id; all preceding segments are the
   * type chain assembled via `implementationType()` across the inheritance stack.
   *
   * @param {string} sourceKey - The stable key to parse.
   * @returns {{ types: string[], id: number }} - The parsed components.
   */
  static parseKey(sourceKey)
  {
    // split on ':' to separate type chain and id.
    const parts = String(sourceKey)
      .split(':');

    // if we don't have at least type+id, return a minimal shape.
    if (parts.length < 2)
    {
      // provide a safe fallback.
      return {
        types: [],
        id: NaN
      };
    }

    // extract the id (final segment).
    const idText = parts[parts.length - 1];

    // parse into a number.
    const id = Number(idText);

    // everything before the id is the type chain.
    const types = parts.slice(0, parts.length - 1);

    // return the parsed structure.
    return {
      types,
      id
    };
  }

  /**
   * Builds the list of currently active APT sources for the actor.
   * Each source contains a stringy `key` and a {@link AptitudeTeachable[]} `teachables`.
   * @param {Game_Actor} actor The actor to evaluate.
   * @returns {{ key: string, teachables: AptitudeTeachable[] }[]} The active teachable sources.
   */
  static activeTeachables(actor)
  {
    // acquire all potential sources.
    const sources = actor.getAptitudeSources();

    // draw up a set for keys to prevent dupes.
    const foundKeys = new Set();

    // all the results with teachables.
    const results = [];

    // iterate once; conditionally add entries that matter.
    sources.forEach(source =>
    {
      // derive stable key like 'equip:weapon:5'.
      const key = this.deriveKey(source);

      // skip duplicate sources.
      if (foundKeys.has(key)) return;

      // this might be a skill requiring extension.
      let trueSource = source;

      // check if the source is a skill.
      if (source.isSkill())
      {
        // get the full skill.
        trueSource = actor.skill(source.id);
      }

      // grab all the teachables.
      const teachables = trueSource.aptitudeTeachings;

      // only include if there is at least one teachable.
      if (teachables.length === 0) return;

      // flag this key as found to prevent dupes.
      foundKeys.add(key);

      // record this source for downstream AP application.
      results.push({
        key,
        teachables
      });
    });

    // Return only meaningful sources.
    return results;
  }

  /**
   * Applies AP to all relevant skill tracks for a single source, then resolves learns.
   * @param {Game_Actor} actor The actor gaining AP.
   * @param {string} sourceKey The stable key for this source.
   * @param {AptitudeTeachable[]} teachables The skills this source teaches.
   * @param {number} amount The AP awarded for this tick.
   * @param {string} cause The cause string for debugging/toasts.
   */
  static applyApToSource(actor, sourceKey, teachables, amount, cause)
  {
    // iterate each teachable to add progress and check thresholds.
    teachables.forEach(teachable =>
    {
      // destructure the teachable for readability.
      const {
        skillId,
        requiredAp
      } = teachable;

      // skip if already learned permanently.
      if (actor.hasLearnedAptitudeSkill(skillId)) return;

      // validate the progress exists on the actor.
      if (actor.hasAptitudeProgress(sourceKey) === false)
      {
        // initialize the progress for this source.
        actor.initializeAptitudeProgress(sourceKey, skillId, requiredAp, 0);
      }

      // Get current progress for this skill from this source.
      const aptitudeProgress = actor.getAptitudeProgress(sourceKey);

      // validate the learning exists on the progress.
      if (aptitudeProgress.hasLearning(skillId) === false)
      {
        // initialize the learning.
        aptitudeProgress.initializeLearning(skillId, requiredAp, 0);
      }

      // grab the learning from the progress.
      const aptitudeLearning = aptitudeProgress.learningBySkillId(skillId);

      // keep the persisted requirement in sync with the live notetag value- otherwise a
      // save that already started this learning would be stuck forever honoring whatever
      // requiredAp existed the moment it was first touched, ignoring later notetag tuning.
      aptitudeLearning.setRequiredAp(requiredAp);

      // the previous amount of AP acquired.
      const before = aptitudeLearning.currentAp;

      // Calculate updated progress.
      const unclamped = before + amount;
      const after = Math.max(0, Math.min(unclamped, requiredAp));

      // Persist the updated progress.
      actor.setAptitudeProgress(sourceKey, skillId, after);

      // Check if the threshold was crossed this tick.
      if (aptitudeLearning.isLearned())
      {
        // Resolve the learn and emit feedback.
        this.#resolveLearn(actor, sourceKey, skillId, cause);
      }
    });
  }

  /**
   * Re-syncs the requiredAp on every persisted aptitude learning for this actor to
   * match the current live notetag values on their sources.
   *
   * Normal AP gain only re-syncs a learning's requiredAp the next time that specific
   * source actually grants AP (see {@link ApManager.applyApToSource}), so a save that
   * started a learning before a notetag was retuned would otherwise be stuck honoring
   * the stale value forever. Use this to repair such a save after tuning notetags
   * mid-playtest, without needing to grind AP to touch every learning again.
   * @param {Game_Actor} actor The actor to refresh aptitude requirements for.
   */
  static refreshRequiredAp(actor)
  {
    // grab every persisted progress on this actor, keyed by source key.
    const progresses = actor.getAllAptitudeProgresses();

    // walk each source's progress to resync its learnings.
    Object.entries(progresses)
      .forEach(([ sourceKey, progress ]) =>
      {
        // resolve the source from the key alone, regardless of whether the actor
        // still has it active- a learning can persist after unequipping/reclassing.
        const source = this.resolveStaticSourceByKey(sourceKey);

        // if the source no longer exists in the database, there's nothing to resync against.
        if (!source) return;

        // rebuild the live teachables for this source from its current notetags.
        const teachables = source.aptitudeTeachings;

        // resync each teachable's requiredAp into its persisted learning, if one exists.
        teachables.forEach(teachable =>
        {
          // skip teachables that don't have a persisted learning yet.
          if (progress.hasLearning(teachable.skillId) === false) return;

          // grab the persisted learning and sync its requiredAp to the live value.
          progress.learningBySkillId(teachable.skillId)
            .setRequiredAp(teachable.requiredAp);
        });
      });
  }

  /**
   * Resolves learning the skill permanently and emits any feedback.
   * @param {Game_Actor} actor The actor learning a skill.
   * @param {string} sourceKey The source that triggered the learn.
   * @param {number} skillId The id of the learned skill.
   * @param {string} cause A short label describing why this occurred.
   */
  // eslint-disable-next-line no-unused-vars
  static #resolveLearn(actor, sourceKey, skillId, cause)
  {
    // Mark the skill as learned in the actor's APT data.
    actor.learnAptitudeSkill(skillId, sourceKey);

    // Learn it in the engine if not already known.
    if (actor.isLearnedSkill(skillId) === false)
    {
      // Add the skill to the actor's known skills.
      actor.learnSkill(skillId);
    }

    // announce the freshly-learned skill in the dia log while the source context is still in scope.
    this.#handleSkillLearnedLog(actor, sourceKey, skillId);
  }

  /**
   * Generates a dia log announcing that an actor learned a skill from one of their aptitude sources.
   * The skill's own message fields act as per-skill overrides for either line, allowing an author to
   * give a notable skill its own voice without touching this default phrasing.
   * @param {Game_Actor} actor The actor who learned the skill.
   * @param {string} sourceKey The key of the aptitude source that taught the skill.
   * @param {number} skillId The id of the skill that was learned.
   */
  static #handleSkillLearnedLog(actor, sourceKey, skillId)
  {
    // the dia log is optional- when J-Log is absent there is simply nowhere to announce this.
    if (!J.LOG) return;

    // grab the skill so its name and message overrides can be read.
    const skill = actor.skill(skillId);

    // resolve the source object behind the key so it can be named in the message.
    const source = ApManager.resolveSourceByKey(actor, sourceKey);

    // sources that no longer resolve still deserve an announcement, just an unattributed one.
    const sourceName = source
      ? source.name
      : 'training';

    // the skill's own message1 wins when authored; otherwise fall back to the aptitude phrasing.
    const headline = skill.message1 || `\\C[1]${actor.name()}\\C[0] learned \\C[1]${skill.name}\\C[0] from ${sourceName} aptitudes!`;

    // the skill's own message2 wins when authored; otherwise remind the player it must be equipped.
    const instruction = skill.message2 || 'Equip it from the skills menu to use it.';

    // build the two-line log wearing the learner's face so the player knows who grew.
    const log = new DiaLogBuilder().addLine(headline)
      .addLine(instruction)
      .setFaceName(actor.faceName())
      .setFaceIndex(actor.faceIndex())
      .build();

    // push it into the dialog channel for display.
    $mapLogs.dialog.addLog(log);
  }
}

export default ApManager;
//endregion ApManager
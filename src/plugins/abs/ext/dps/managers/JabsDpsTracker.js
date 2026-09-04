//region JabsDpsTracker
import JabsDpsEncounter from '../models/JabsDpsEncounter.js';
import JabsDpsHit from '../models/JabsDpsHit.js';

/**
 * Keeps a live measure of how much damage each party member is dealing, and how fast.
 *
 * The whole instrument rests on one idea: the clock only runs while the party is in combat. A rate
 * measured against wall time in an ARPG is mostly measuring the walk between fights, so the
 * denominator here advances only while {@link Game_Party#anyMemberInCombat} says something is
 * happening. Out of combat it freezes, and every figure holds its last reading instead of decaying
 * to zero on the way to the next encounter.
 *
 * Two encounters are kept at a time, and they behave as a shift register. A closed encounter stays
 * in the current slot until the next one opens on its first landed hit, which is what makes the
 * fight that just ended readable in the moment anyone would want to read it.
 */
class JabsDpsTracker
{
  /**
   * How many frames of combat time the rolling window looks back across.
   * @type {number}
   */
  #rollingWindowFrames = 300;

  /**
   * How many frames the party has spent in combat this session.
   *
   * This is the clock everything is measured against, and it is deliberately not the frame count.
   * It advances only while the party is engaged.
   * @type {number}
   */
  #combatFrames = 0;

  /**
   * Whether the party was in combat as of the previous update.
   *
   * Held only to spot the falling edge- the moment combat ends is the signal to close an encounter,
   * and there is no event announcing it.
   * @type {boolean}
   */
  #wasInCombat = false;

  /**
   * The encounter currently being measured, or the most recently finished one.
   *
   * Seeded already-spent so nothing downstream has to consider emptiness- a fightless encounter
   * answers zero to every question asked of it, which is the honest answer before any fighting.
   * @type {JabsDpsEncounter}
   */
  #currentEncounter = JabsDpsTracker.spentEncounter();

  /**
   * The encounter before the current one.
   * @type {JabsDpsEncounter}
   */
  #previousEncounter = JabsDpsTracker.spentEncounter();

  /**
   * Constructor.
   * @param {number} rollingWindowFrames How many frames the rolling window looks back across.
   */
  constructor(rollingWindowFrames)
  {
    this.#rollingWindowFrames = rollingWindowFrames;
  }

  /**
   * Builds an encounter that is already over and never had anything happen in it.
   * @returns {JabsDpsEncounter}
   */
  static spentEncounter()
  {
    const encounter = new JabsDpsEncounter(0);
    encounter.close();

    return encounter;
  }

  /**
   * Gets how many frames the rolling window looks back across.
   * @returns {number}
   */
  rollingWindowFrames()
  {
    return this.#rollingWindowFrames;
  }

  /**
   * Gets how many frames the party has spent in combat this session.
   * @returns {number}
   */
  combatFrames()
  {
    return this.#combatFrames;
  }

  /**
   * Gets the encounter currently being measured, or the most recently finished one.
   * @returns {JabsDpsEncounter}
   */
  currentEncounter()
  {
    return this.#currentEncounter;
  }

  /**
   * Gets the encounter before the current one.
   * @returns {JabsDpsEncounter}
   */
  previousEncounter()
  {
    return this.#previousEncounter;
  }

  /**
   * Advances the tracker by one frame.
   */
  update()
  {
    // one read, because both halves below have to agree about it.
    const inCombat = $gameParty.anyMemberInCombat();

    this.updateCombatClock(inCombat);
    this.updateEncounterState(inCombat);

    this.#wasInCombat = inCombat;
  }

  /**
   * Advances the combat clock, and the open encounter along with it.
   * @param {boolean} inCombat Whether or not the party is currently in combat.
   */
  updateCombatClock(inCombat)
  {
    // out of combat the clock stops, which is what freezes every reading rather than decaying it.
    if (inCombat === false) return;

    this.#combatFrames++;

    // an open encounter is measured to right now, so a lull mid-fight drags its rate down.
    if (this.#currentEncounter.isClosed() === false)
    {
      this.#currentEncounter.extendTo(this.#combatFrames);
    }
  }

  /**
   * Closes out the open encounter when combat has just ended.
   * @param {boolean} inCombat Whether or not the party is currently in combat.
   */
  updateEncounterState(inCombat)
  {
    // only the falling edge matters- combat continuing, or continuing to be over, changes nothing.
    if (inCombat === true) return;
    if (this.#wasInCombat === false) return;

    // nothing to close if the last fight already ended.
    if (this.#currentEncounter.isClosed() === true) return;

    this.#currentEncounter.close();
  }

  /**
   * Considers a landed skill effect for recording, and records it when it describes party damage.
   * @param {JABS_Action} action The action that was executed.
   * @param {JABS_Battler} target The battler the effects were applied against.
   */
  handleSkillEffect(action, target)
  {
    if (this.shouldRecordSkillEffect(action, target) === false) return;

    const caster = action.getCaster();
    const {
      hpDamage,
      critical
    } = target.getBattler()
      .result();

    this.recordHit(caster.getUuid(), action.getBaseSkill().id, hpDamage, critical);
  }

  /**
   * Gets whether or not a landed skill effect belongs in the damage record.
   * @param {JABS_Action} action The action that was executed.
   * @param {JABS_Battler} target The battler the effects were applied against.
   * @returns {boolean}
   */
  shouldRecordSkillEffect(action, target)
  {
    // consumables are not a statement about the weapon being measured; a thrown bomb belongs to the
    // bomb. these are the same two slots the metrics ship excludes, for the same reason.
    const cooldownType = action.getCooldownType();
    if (cooldownType === JABS_Button.Tool) return false;
    if (cooldownType === JABS_Button.UsableItem) return false;

    // this is a measure of what the party puts out, so the swing has to have come from the party.
    // inferring it from the target instead- as the metrics ship does- stops being safe with teams,
    // where an enemy striking another enemy also arrives here with an enemy on the receiving end.
    const caster = action.getCaster();
    if (caster.isActor() === false) return false;

    // the other half of that: the party has to be hitting something that fights back.
    if (target.isEnemy() === false) return false;

    // inanimate forces the neutral team, and JABS only declares combat between opposed teams- so
    // nothing struck here ever raises the in-combat flag. The clock would never start, every hit
    // would stamp the same frame, and the encounter would have nothing to ever close it. This is a
    // measurement that cannot be taken rather than one not worth taking, which is also why a
    // training dummy must not be built inanimate: use a normal enemy with fixed movement instead.
    if (target.isInanimate() === true) return false;

    const {
      hpDamage,
      evaded
    } = target.getBattler()
      .result();

    // a swing that never connected dealt no damage, and its frame is not part of any rate.
    if (evaded === true) return false;

    // a pure state application deals nothing, and a heal arrives as negative damage- adding it
    // would walk the figure backwards.
    if (hpDamage <= 0) return false;

    return true;
  }

  /**
   * Records a landed hit, opening a new encounter when the previous one is spent.
   * @param {string} casterUuid The uuid of the battler that dealt the hit.
   * @param {number} skillId The id of the skill that dealt the hit.
   * @param {number} hpDamage The hp damage the hit inflicted.
   * @param {boolean} critical Whether or not the hit was a critical.
   */
  recordHit(casterUuid, skillId, hpDamage, critical)
  {
    // a hit arriving against a finished encounter is the first hit of the next one.
    if (this.#currentEncounter.isClosed() === true)
    {
      this.openEncounter();
    }

    const hit = new JabsDpsHit(this.#combatFrames, casterUuid, skillId, hpDamage, critical);
    this.#currentEncounter.addHit(hit);
  }

  /**
   * Opens a new encounter, retiring the finished one into the previous slot.
   */
  openEncounter()
  {
    this.#previousEncounter = this.#currentEncounter;
    this.#currentEncounter = new JabsDpsEncounter(this.#combatFrames);
  }

  /**
   * Gets the given battler's damage per second across the last few seconds of combat.
   * @param {string} casterUuid The uuid of the battler in question.
   * @returns {number}
   */
  rollingDpsBy(casterUuid)
  {
    const windowFrames = this.#rollingWindowFrames;
    const earliestCountedFrame = this.#combatFrames - windowFrames;
    const damage = this.#currentEncounter.damageBySince(casterUuid, earliestCountedFrame);

    return JabsDpsEncounter.toDps(damage, this.rollingDenominatorFrames());
  }

  /**
   * Gets how many frames the rolling rate is currently divided by.
   *
   * Two clamps, fixing opposite failures. The window has to be capped by how long the fight has
   * actually been going, or the opening seconds of every encounter divide by a window that has not
   * filled and read low. It also has to be floored, or the very first hit divides by almost nothing
   * and reads absurdly high.
   * @returns {number}
   */
  rollingDenominatorFrames()
  {
    const elapsed = this.#combatFrames - this.#currentEncounter.openedAtCombatFrame();
    const unfilledWindow = Math.min(this.#rollingWindowFrames, elapsed);

    return Math.max(JabsDpsEncounter.MINIMUM_SPAN_FRAMES, unfilledWindow);
  }

  /**
   * Gets the given battler's damage per second across the current encounter.
   * @param {string} casterUuid The uuid of the battler in question.
   * @returns {number}
   */
  currentDpsBy(casterUuid)
  {
    return this.#currentEncounter.dpsBy(casterUuid);
  }

  /**
   * Gets the given battler's damage per second across the previous encounter.
   * @param {string} casterUuid The uuid of the battler in question.
   * @returns {number}
   */
  previousDpsBy(casterUuid)
  {
    return this.#previousEncounter.dpsBy(casterUuid);
  }

  /**
   * Gets the total hp damage the given battler dealt in the current encounter.
   * @param {string} casterUuid The uuid of the battler in question.
   * @returns {number}
   */
  currentDamageBy(casterUuid)
  {
    return this.#currentEncounter.damageBy(casterUuid);
  }
}

export default JabsDpsTracker;
//endregion JabsDpsTracker
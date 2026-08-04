//region JabsBossManager
/**
 * The authority on boss encounters: which one is running, who is in it, and what recurs while it
 * does.
 *
 * This lives with the battle system rather than the HUD on purpose. What a boss *is* is combat
 * knowledge- a battler, a health pool, a set of behaviors. A frame drawn around a health bar is a
 * view of that knowledge, and views do not own the thing they render. Anything wanting to display
 * a boss asks here; nothing here knows a window exists.
 */
class JabsBossManager
{
  //region properties
  /**
   * The verbs a boss step may perform.
   *
   * Only verbs a shipped fight actually uses are listed. The vocabulary observed across the
   * existing hand-evented fights is considerably larger, and the rest land as the fights that need
   * them are converted- an implemented verb with no consumer is untested surface.
   */
  static Verbs = {
    /**
     * Makes the boss perform a skill.
     */
    ForceSkill: 'forceSkill',
  };

  /**
   * Every encounter known to the game, keyed by its author-facing name.
   * @type {Map<string, JabsBossEncounter>}
   */
  static encounters = new Map();

  /**
   * The encounter currently being fought, if any.
   * @type {JabsBossEncounter|null}
   */
  static #activeEncounter = null;

  /**
   * How many frames remain before each of the active encounter's routines comes due, keyed by
   * routine name. Cadence is measured from the moment the encounter starts, so every routine's
   * first execution is a full interval away rather than landing on frame one.
   * @type {Map<string, number>}
   */
  static #routineCountdowns = new Map();

  //endregion properties

  /**
   * Registers every encounter parsed from configuration.
   * @param {JabsBossEncounter[]} encounters The encounters to register.
   */
  static registerEncounters(encounters)
  {
    encounters.forEach(encounter => this.encounters.set(encounter.key(), encounter));
  }

  /**
   * Gets the encounter currently being fought.
   * @returns {JabsBossEncounter|null} The active encounter, or null when no fight is running.
   */
  static activeEncounter()
  {
    return this.#activeEncounter;
  }

  /**
   * Determines whether a boss encounter is currently being fought.
   * @returns {boolean}
   */
  static hasActiveEncounter()
  {
    return this.#activeEncounter !== null;
  }

  /**
   * Begins the encounter of the given name.
   *
   * Starting is explicit rather than automatic on map load because a boss fight almost never
   * begins when the player walks into the room- it begins when the story scene in front of it
   * ends.
   * @param {string} encounterKey The name of the encounter to begin.
   */
  static startEncounter(encounterKey)
  {
    const encounter = this.encounters.get(encounterKey);

    // an unknown encounter name is an authoring error, and a silent no-op here would present as a
    // boss that simply never does anything- the single hardest failure to diagnose from in-game.
    if (!encounter)
    {
      throw new Error(`Unknown boss encounter: [ ${encounterKey} ].`);
    }

    // every database reference is checked before a single frame of the fight runs. Ids drift when
    // the database is rebalanced, and a drifted id is invisible at runtime- the boss simply casts
    // the wrong skill forever and nothing complains. Checking here converts that silence into a
    // crash at the one moment an author can act on it.
    this.#validateEncounter(encounter);

    this.#activeEncounter = encounter;

    // seed each routine a full interval so nothing fires on the frame the fight begins.
    this.#routineCountdowns.clear();
    encounter.routines()
      .forEach(routine => this.#routineCountdowns.set(routine.key(), routine.cadenceFrames()));
  }

  /**
   * Ends the active encounter and discards its runtime state.
   */
  static endEncounter()
  {
    this.#activeEncounter = null;
    this.#routineCountdowns.clear();
  }

  //region validation
  /**
   * Confirms every database reference in an encounter still means what it meant when authored.
   * @param {JabsBossEncounter} encounter The encounter to check.
   */
  static #validateEncounter(encounter)
  {
    encounter.participants()
      .forEach(participant => this.#validateReference(
        $dataEnemies[participant.enemyId()],
        participant.enemyId(),
        participant.expect(),
        `encounter [ ${encounter.key()} ] participant [ ${participant.key()} ] enemy`));

    encounter.routines()
      .forEach(routine => this.#validateRoutine(encounter, routine));
  }

  /**
   * Confirms every database reference within a single routine is still accurate.
   * @param {JabsBossEncounter} encounter The encounter owning the routine, named for the error.
   * @param {JabsBossRoutine} routine The routine to check.
   */
  static #validateRoutine(encounter, routine)
  {
    routine.steps()
      .forEach(step => this.#validateReference(
        $dataSkills[step.skillId()],
        step.skillId(),
        step.expect(),
        `encounter [ ${encounter.key()} ] routine [ ${routine.key()} ] skill`));
  }

  /**
   * Confirms one database row still carries the name it was authored against.
   * @param {RPG_Base} databaseEntry The row the id currently resolves to.
   * @param {number} id The id being checked, named for the error.
   * @param {string} expected The name recorded when the encounter was authored.
   * @param {string} description Where in the configuration this reference lives.
   */
  static #validateReference(databaseEntry, id, expected, description)
  {
    // an author who did not record a name gets no tripwire, which is their choice to make.
    if (expected === String.empty) return;

    const actual = databaseEntry ? databaseEntry.name : '<nothing>';
    if (actual === expected) return;

    throw new Error(
      `Boss configuration drift: ${description} id [ ${id} ] was authored as [ ${expected} ] but is now [ ${actual} ].`);
  }

  //endregion validation

  //region boss resolution
  /**
   * Gets the {@link JABS_Battler} for the given participant of the active encounter.
   * @param {JabsBossParticipant} participant The participant to resolve.
   * @returns {JABS_Battler|null} The battler, or null when its event is not currently on the map.
   */
  static getParticipantJabsBattler(participant)
  {
    const participantEvent = $gameMap.event(participant.eventId());

    // a participant whose event is absent is normal rather than exceptional: the event may not
    // have spawned yet, or may have been despawned on defeat.
    if (!participantEvent) return null;

    return participantEvent.getJabsBattler();
  }

  /**
   * Gets the {@link Game_Battler} for the primary body of the active encounter.
   * @returns {Game_Battler|null} The battler, or null when no encounter is running.
   */
  static getBossGameBattler()
  {
    const jabsBattler = this.getBossJabsBattler();
    if (!jabsBattler) return null;

    return jabsBattler.getBattler();
  }

  /**
   * Gets the {@link JABS_Battler} for the primary body of the active encounter.
   * @returns {JABS_Battler|null} The battler, or null when no encounter is running.
   */
  static getBossJabsBattler()
  {
    if (!this.#activeEncounter) return null;

    const primary = this.#activeEncounter.primaryParticipant();

    return this.getParticipantJabsBattler(primary);
  }

  /**
   * Gets the primary boss's current health as a whole-number percent.
   * @returns {number} The percent, or zero when there is no boss to measure.
   */
  static getBossHpPercent()
  {
    const gameBattler = this.getBossGameBattler();
    if (!gameBattler) return 0;

    return gameBattler.currentHpPercent100();
  }

  /**
   * Determines whether the primary boss is at or below a given health percent.
   * @param {number} hpPercentThreshold The percent to compare inclusively against.
   * @returns {boolean} True when the boss is at or below the threshold, false otherwise.
   */
  static isBossBelowHpThreshold(hpPercentThreshold)
  {
    const gameBattler = this.getBossGameBattler();
    if (!gameBattler) return false;

    return gameBattler.currentHpPercent100() <= hpPercentThreshold;
  }

  /**
   * Determines whether the primary boss is at or above a given health percent.
   * @param {number} hpPercentThreshold The percent to compare inclusively against.
   * @returns {boolean} True when the boss is at or above the threshold, false otherwise.
   */
  static isBossAboveHpThreshold(hpPercentThreshold)
  {
    const gameBattler = this.getBossGameBattler();
    if (!gameBattler) return false;

    return gameBattler.currentHpPercent100() >= hpPercentThreshold;
  }

  //endregion boss resolution

  //region update
  /**
   * Advances the active encounter by one frame.
   */
  static update()
  {
    if (!this.hasActiveEncounter()) return;

    this.#activeEncounter.routines()
      .forEach(routine => this.#updateRoutine(routine));
  }

  /**
   * Advances a single routine by one frame, executing it when it comes due.
   * @param {JabsBossRoutine} routine The routine to advance.
   */
  static #updateRoutine(routine)
  {
    const remaining = this.#routineCountdowns.get(routine.key());

    // not due yet; burn a frame and wait.
    if (remaining > 0)
    {
      this.#routineCountdowns.set(routine.key(), remaining - 1);
      return;
    }

    // a boss that cannot act right now- stunned, already casting, mid-swing- gets its turn skipped
    // rather than queued. Queueing would mean a stun releases into every missed execution firing
    // back to back, which reads as a bug to the player even though the arithmetic is correct.
    if (this.#canExecuteRoutine() === false) return;

    this.#executeRoutine(routine);

    this.#routineCountdowns.set(routine.key(), routine.cadenceFrames());
  }

  /**
   * Determines whether the active encounter's boss is in a state where a routine may execute.
   * @returns {boolean}
   */
  static #canExecuteRoutine()
  {
    const jabsBattler = this.getBossJabsBattler();

    // no body on the map means nothing to drive.
    if (!jabsBattler) return false;

    // a dead boss is mid-collapse and its fight is effectively over.
    if (jabsBattler.getBattler().isDead()) return false;

    // interrupting a cast would delete the telegraph the player is currently reading.
    if (jabsBattler.isCastingOrChanneling()) return false;

    return true;
  }

  /**
   * Performs every step of a routine, in order.
   * @param {JabsBossRoutine} routine The routine to perform.
   */
  static #executeRoutine(routine)
  {
    routine.steps()
      .forEach(step => this.#executeStep(step));
  }

  /**
   * Performs a single step of a routine.
   * @param {JabsBossStep} step The step to perform.
   */
  static #executeStep(step)
  {
    switch (step.verb())
    {
      case JabsBossManager.Verbs.ForceSkill:
        this.#executeForceSkill(step);
        break;
      default:
        throw new Error(`Unrecognized boss step verb: [ ${step.verb()} ].`);
    }
  }

  /**
   * Makes the boss perform the skill named by a step.
   *
   * There are two genuinely different ways to make a battler use a skill, and which one is correct
   * depends entirely on whether the skill has a telegraph worth preserving.
   * @param {JabsBossStep} step The step naming the skill to perform.
   */
  static #executeForceSkill(step)
  {
    const jabsBattler = this.getBossJabsBattler();

    // the instant path bypasses cost, cooldown, and cast time alike. That is what makes it right
    // for scripted set-pieces and wrong for anything the player is meant to react to.
    if (step.isCast() === false)
    {
      $jabsEngine.forceMapAction(jabsBattler, step.skillId(), false);
      return;
    }

    // the deliberate path walks the same road the player's own inputs walk: decide the action,
    // start its cast timer, and let the AI's phase-two handler fire it once the wind-up completes.
    // That wind-up is the telegraph, and it is the only reason a frontal cone is dodgeable.
    const actionOptions = JABS_ActionOptions.Builder()
      .build();
    const actions = jabsBattler.createJabsActionFromSkill(step.skillId(), actionOptions);
    jabsBattler.setDecidedAction(actions);

    const [ primaryAction, ] = actions;
    jabsBattler.setCastCountdown(primaryAction.getCastTime());

    // phase two is where a decided action is cast and then executed; without this the action would
    // sit decided but unprocessed until the AI happened to arrive there on its own.
    jabsBattler.setPhase(2);
  }

  //endregion update
}

export default JabsBossManager;
//endregion JabsBossManager
//region JabsBossManager
import JabsBossReaction from '../models/JabsBossReaction.js';

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

    /**
     * Puts a state on a participant, such as a seal that holds it still and turns every hit to nothing.
     */
    AddState: 'addState',

    /**
     * Takes a state off a participant again.
     */
    RemoveState: 'removeState',

    /**
     * Changes what a participant looks like, such as a statue coming to life.
     */
    ChangeImage: 'changeImage',

    /**
     * Shortens how long a routine waits between executions, so the fight gets faster.
     */
    QuickenRoutine: 'quickenRoutine',

    /**
     * Puts something on the map that is part of the fight without being a body it has to fell, such as a
     * hazard that wakes as the boss is worn down.
     */
    Spawn: 'spawn',

    /**
     * Shifts the color of the whole screen, such as the room reddening as the boss's temper rises.
     */
    Tint: 'tint',

    /**
     * Plays an animation over a participant, such as the boss flaring up.
     */
    Animation: 'animation',

    /**
     * Has a participant say a line, holding the fight still until the player has read it.
     */
    Dialogue: 'dialogue',
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

  /**
   * How many frames each of the active encounter's routines currently waits between executions, keyed by
   * routine name.
   *
   * Every routine starts at the cadence it was authored with, and a quickening shortens it as the fight
   * goes on. That is fight state, so it lives here rather than on the routine: the next attempt at the
   * same fight starts back at the authored cadence.
   * @type {Map<string, number>}
   */
  static #routineCadences = new Map();

  /**
   * The reactions to bodies falling that have already fired in the active encounter. Each fires once per
   * fight. Reactions to the fight beginning are never kept here, because they fire as the fight starts
   * and at no other moment.
   * @type {Set<JabsBossReaction>}
   */
  static #firedReactions = new Set();

  /**
   * The bodies the active encounter spawned, keyed by the name of the participant each one plays.
   *
   * These are held as the events themselves rather than as their ids. A spawned body's slot is freed
   * once it leaves the map, and the next thing dropped there- loot, most often- can move into it, so an
   * id kept here could quietly start naming something that is not the boss at all.
   * @type {Map<string, Game_Event>}
   */
  static #participantBodies = new Map();

  /**
   * Whether every body the active encounter spawned has fallen and finished its death scene.
   *
   * A fight is won exactly once. The defeat switch turns on at the moment this settles rather than on
   * every frame after it, since each switch change makes the whole map refresh.
   * @type {boolean}
   */
  static #bossDefeated = false;

  /**
   * The steps waiting their turn, oldest first.
   *
   * Steps run the moment their routine or reaction does, all in the same frame, except that a line being
   * said holds every step queued behind it until the player has read it. A boss that says something and
   * then lashes out does so in that order, rather than lashing out while the line is still on screen.
   * @type {JabsBossStep[]}
   */
  static #pendingSteps = [];

  /**
   * The bodies the active encounter's steps spawned that are no part of its win condition, such as hazards.
   *
   * Held as the events themselves for the same reason the participants' bodies are: a slot can be handed to
   * something else once its body leaves the map. When the fight is won or ended, whichever of these are
   * still standing leave with it.
   * @type {Game_Event[]}
   */
  static #extraBodies = [];

  /**
   * The interpreter saying a participant's line, or null when no line has been said this fight.
   *
   * A line is said the way an event says one- a Show Text command run by an interpreter belonging to the
   * speaker's own event- so anything that reads who is speaking, such as a message floating above them,
   * finds the speaker exactly as it would during a scene.
   * @type {Game_Interpreter|null}
   */
  static #dialogue = null;

  /**
   * The screen tone the active encounter found when it first tinted the screen, or empty when it has not.
   *
   * A fight's tint is the fight's own. Ending the fight hands the screen back the way the fight found it,
   * so whatever the story does next starts from the room as it was.
   * @type {number[]}
   */
  static #toneBeforeFight = [];

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
   * Determines whether the active encounter has been won: every body it spawned has fallen, and each
   * one's death scene has finished playing.
   *
   * A fight won away from its arena turns no switch on, so this is how a test hall learns its fight is
   * over.
   * @returns {boolean}
   */
  static isBossDefeated()
  {
    return this.#bossDefeated;
  }

  /**
   * Begins the encounter of the given name, spawning every one of its bodies onto the current map.
   *
   * Starting is explicit rather than automatic on map load because a boss fight almost never
   * begins when the player walks into the room- it begins when the story scene in front of it
   * ends. The bodies arrive at that same moment, which is why the map staging the fight holds no
   * event for the boss at all.
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

    // a fight started over the top of another takes nothing of the old one with it: no hazard it woke, no
    // step it was still waiting to take, no line it was in the middle of saying.
    this.#clearExtraBodies();
    this.#pendingSteps = [];
    this.#dialogue = null;

    // the bodies arrive only once every name has checked out, so a drifted id never puts the wrong
    // enemy on the map- and all of them arrive before the fight counts as running.
    this.#spawnParticipants(encounter);

    this.#activeEncounter = encounter;

    // a fight starts unwon, even one started over the top of a fight already won- which is exactly how
    // a test hall stages a rematch.
    this.#bossDefeated = false;

    // every routine starts at the cadence it was authored with, and a full interval away so nothing
    // fires on the frame the fight begins.
    this.#seedRoutines(encounter);

    // a fight starts with none of its reactions spent, and its opening moves land the moment its
    // bodies arrive, before a single frame of the fight is drawn.
    this.#firedReactions.clear();
    this.#fireStartReactions(encounter);
  }

  /**
   * Seeds each of an encounter's routines with the cadence it was authored with, a full interval away.
   * @param {JabsBossEncounter} encounter The encounter whose routines to seed.
   */
  static #seedRoutines(encounter)
  {
    this.#routineCountdowns.clear();
    this.#routineCadences.clear();
    encounter.routines()
      .forEach(routine =>
      {
        this.#routineCadences.set(routine.key(), routine.cadenceFrames());
        this.#routineCountdowns.set(routine.key(), routine.cadenceFrames());
      });
  }

  /**
   * Fires every one of an encounter's reactions to the fight beginning.
   * @param {JabsBossEncounter} encounter The encounter that just began.
   */
  static #fireStartReactions(encounter)
  {
    encounter.reactions()
      .filter(reaction => reaction.trigger() === JabsBossReaction.Triggers.Start)
      .forEach(reaction => this.#performReaction(reaction));
  }

  /**
   * Ends the active encounter and discards its runtime state.
   *
   * Any participant still standing is left where it is. Ending a fight is bookkeeping, and whatever the
   * story wants done with a survivor belongs to the scene that ends it. What the fight put on the map for
   * itself is different: a hazard it woke, or a tint it laid over the screen, is the fight's own and leaves
   * with it.
   */
  static endEncounter()
  {
    this.#clearExtraBodies();
    this.#restoreTone();
    this.#activeEncounter = null;
    this.#routineCountdowns.clear();
    this.#routineCadences.clear();
    this.#firedReactions.clear();
    this.#participantBodies.clear();
    this.#bossDefeated = false;
    this.#pendingSteps = [];
    this.#dialogue = null;
  }

  /**
   * Takes every extra body the active encounter spawned off the map, and forgets them all.
   *
   * Taking a body off the map is erasing it, the same way J-ABS itself takes an enemy away while it waits
   * to respawn.
   */
  static #clearExtraBodies()
  {
    this.#extraBodies
      .filter(body => this.#isStillStanding(body))
      .forEach(body => body.erase());

    this.#extraBodies = [];
  }

  /**
   * Determines whether a spawned body is still on the map and still standing.
   * @param {Game_Event} body The body to check.
   * @returns {boolean}
   */
  static #isStillStanding(body)
  {
    // a body the map no longer holds left on its own, and its slot may hold something else by now.
    if ($gameMap.event(body.eventId()) !== body) return false;

    // a body already erased- felled, most often- has nothing left to take off the map.
    return body.isErased() === false;
  }

  /**
   * Puts the screen back the way the active encounter found it, if the encounter ever tinted it.
   */
  static #restoreTone()
  {
    // a fight that never tinted the screen has nothing to hand back.
    if (this.#toneBeforeFight.length === 0) return;

    // at once rather than over time: a fight ends under a scene that takes over the screen from here.
    $gameScreen.startTint(this.#toneBeforeFight, 0);

    this.#toneBeforeFight = [];
  }

  //region spawning
  /**
   * Puts every participant of an encounter onto the current map.
   * @param {JabsBossEncounter} encounter The encounter whose bodies to spawn.
   */
  static #spawnParticipants(encounter)
  {
    encounter.participants()
      .forEach(participant => this.#spawnParticipant(encounter, participant));
  }

  /**
   * Spawns a single participant from the enemy clone map onto its tile, and remembers the body.
   * @param {JabsBossEncounter} encounter The encounter owning the participant, named for errors.
   * @param {JabsBossParticipant} participant The participant to spawn.
   */
  static #spawnParticipant(encounter, participant)
  {
    // the participant knows which template on the enemy clone map it comes from: its enemy's own slot,
    // unless it names one dressed for this fight alone.
    const body = $jabsEngine.addEnemyToMap(participant.x(), participant.y(), participant.templateId());

    // the body has to be exactly who the configuration says it is.
    const who = this.#describeParticipant(encounter, participant);
    this.#confirmBody(body, participant.enemyId(), participant.templateId(), who);

    this.#participantBodies.set(participant.key(), body);
  }

  /**
   * Confirms a spawn produced a body at all, and that the body is the enemy it was spawned to be.
   *
   * A slot holding no event spawns nothing, and a boss that never shows up is the hardest failure there is
   * to diagnose from in-game. A slot can also hold an event and still produce the wrong body: the clone
   * map's slots are only expected to match their enemy ids, and nothing enforces it. A slot that drifted, or
   * a placeholder slot with no enemy on it, would otherwise put a body on the map that fights as something
   * else- or does not fight at all- without a word.
   * @param {Game_Event|undefined} body The event the spawn produced, if it produced one.
   * @param {number} enemyId The enemy the body was spawned to be.
   * @param {number} templateId The clone map slot the body was copied from, named for the errors.
   * @param {string} who Whatever the body was spawned for, named for the errors.
   */
  static #confirmBody(body, enemyId, templateId, who)
  {
    if (!body)
    {
      throw new Error(`Boss ${who} could not spawn: the enemy clone map holds no event [ ${templateId} ].`);
    }

    // a page that names no enemy produces an event with no battler at all, which reads as enemy zero.
    const jabsBattler = body.getJabsBattler();
    const spawnedEnemyId = jabsBattler ? jabsBattler.getBattler().enemyId() : 0;

    // the body is exactly who the configuration says it is.
    if (spawnedEnemyId === enemyId) return;

    throw new Error(
      `Boss configuration drift: ${who} spawned enemy [ ${spawnedEnemyId} ] from clone event [ ${templateId} ].`);
  }

  /**
   * Names a participant the way the spawning errors refer to it.
   * @param {JabsBossEncounter} encounter The encounter owning the participant.
   * @param {JabsBossParticipant} participant The participant being described.
   * @returns {string}
   */
  static #describeParticipant(encounter, participant)
  {
    return `encounter [ ${encounter.key()} ] participant [ ${participant.key()} ]`;
  }

  //endregion spawning

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

    encounter.reactions()
      .forEach(reaction => this.#validateReaction(encounter, reaction));

    this.#validateDefeatSwitch(encounter);
  }

  /**
   * Confirms the switch an encounter turns on when it is won is one the game actually has.
   *
   * The engine quietly ignores a switch past the end of its list, so a mistyped id would let the boss
   * fall while the story waited on it forever, with nothing anywhere saying why.
   * @param {JabsBossEncounter} encounter The encounter to check.
   */
  static #validateDefeatSwitch(encounter)
  {
    const switchId = encounter.defeatSwitchId();

    // a fight that turns no switch on has nothing to check.
    if (switchId === 0) return;

    // the switch has to be somewhere on the game's own list, which starts at one.
    const lastSwitchId = $dataSystem.switches.length - 1;
    if (switchId > 0 && switchId <= lastSwitchId) return;

    const where = `encounter [ ${encounter.key()} ]`;
    throw new Error(
      `Boss ${where} turns on switch [ ${switchId} ] when won, but the game only has switches 1-${lastSwitchId}.`);
  }

  /**
   * Confirms every step within a single routine still refers to things that exist.
   * @param {JabsBossEncounter} encounter The encounter owning the routine.
   * @param {JabsBossRoutine} routine The routine to check.
   */
  static #validateRoutine(encounter, routine)
  {
    const where = `encounter [ ${encounter.key()} ] routine [ ${routine.key()} ]`;
    routine.steps()
      .forEach(step => this.#validateStep(encounter, step, where));
  }

  /**
   * Confirms a reaction answers a moment a fight actually has, waits on bodies the fight actually has,
   * and that each of its steps refers to things that exist.
   * @param {JabsBossEncounter} encounter The encounter owning the reaction.
   * @param {JabsBossReaction} reaction The reaction to check.
   */
  static #validateReaction(encounter, reaction)
  {
    const where = `encounter [ ${encounter.key()} ] reaction [ ${reaction.key()} ]`;
    this.#validateTrigger(encounter, reaction, where);
    reaction.steps()
      .forEach(step => this.#validateStep(encounter, step, where));
  }

  /**
   * Confirms a reaction's trigger is one a fight has, and that whatever it waits on is real.
   * @param {JabsBossEncounter} encounter The encounter owning the reaction.
   * @param {JabsBossReaction} reaction The reaction to check.
   * @param {string} where Where in the configuration the reaction lives, named for the error.
   */
  static #validateTrigger(encounter, reaction, where)
  {
    switch (reaction.trigger())
    {
      // the fight beginning waits on nobody.
      case JabsBossReaction.Triggers.Start:
        return;
      case JabsBossReaction.Triggers.Fallen:
        this.#validateFallenTrigger(encounter, reaction, where);
        return;
      case JabsBossReaction.Triggers.Health:
        this.#validateHealthTrigger(encounter, reaction, where);
        return;
      default:
        // a misspelled trigger would otherwise sit unanswered for the whole fight without a word.
        throw new Error(`Boss ${where} answers [ ${reaction.trigger()} ], which is not a moment a fight has.`);
    }
  }

  /**
   * Confirms a fallen trigger waits on somebody, and only on participants the encounter has.
   * @param {JabsBossEncounter} encounter The encounter owning the reaction.
   * @param {JabsBossReaction} reaction The reaction to check.
   * @param {string} where Where in the configuration the reaction lives, named for the error.
   */
  static #validateFallenTrigger(encounter, reaction, where)
  {
    // a reaction waiting on nobody falling is satisfied from the first frame, so it would fire at once.
    if (reaction.participantKeys().length === 0)
    {
      throw new Error(`Boss ${where} waits on nobody falling, so it would fire the moment the fight began.`);
    }

    reaction.participantKeys()
      .forEach(key => this.#validateParticipantKey(encounter, key, where));
  }

  /**
   * Confirms a health trigger waits on a percent a fight actually passes through, and only on participants
   * the encounter has. Naming nobody is allowed: it watches the boss.
   * @param {JabsBossEncounter} encounter The encounter owning the reaction.
   * @param {JabsBossReaction} reaction The reaction to check.
   * @param {string} where Where in the configuration the reaction lives, named for the error.
   */
  static #validateHealthTrigger(encounter, reaction, where)
  {
    const percent = reaction.belowPercent();

    // at a hundred the boss is there before the fight begins, and at zero it has already fallen, which a
    // health reaction never answers. Either way the turning point it was written for never comes.
    if (percent <= 0 || percent >= 100)
    {
      const threshold = `waits for health at or below [ ${percent}% ]`;
      throw new Error(`Boss ${where} ${threshold}, which is no turning point a fight has.`);
    }

    reaction.participantKeys()
      .forEach(key => this.#validateParticipantKey(encounter, key, where));
  }

  /**
   * Confirms a single step refers only to things that exist, judged by what its verb reads.
   * @param {JabsBossEncounter} encounter The encounter owning the step.
   * @param {JabsBossStep} step The step to check.
   * @param {string} where Where in the configuration the step lives, named for the error.
   */
  static #validateStep(encounter, step, where)
  {
    // a verb nothing implements is left alone here: it fails loudly the moment it is performed, which
    // names it just as plainly.
    switch (step.verb())
    {
      case JabsBossManager.Verbs.ForceSkill:
        this.#validateStepParticipant(encounter, step, where);
        this.#validateReference($dataSkills[step.skillId()], step.skillId(), step.expect(), `${where} skill`);
        return;
      case JabsBossManager.Verbs.AddState:
      case JabsBossManager.Verbs.RemoveState:
        this.#validateStepParticipant(encounter, step, where);
        this.#validateReference($dataStates[step.stateId()], step.stateId(), step.expect(), `${where} state`);
        return;
      case JabsBossManager.Verbs.ChangeImage:
        this.#validateStepParticipant(encounter, step, where);
        return;
      case JabsBossManager.Verbs.QuickenRoutine:
        this.#validateRoutineKey(encounter, step.routineKey(), where);
        return;
      case JabsBossManager.Verbs.Spawn:
        this.#validateReference($dataEnemies[step.enemyId()], step.enemyId(), step.expect(), `${where} spawned enemy`);
        return;
      case JabsBossManager.Verbs.Tint:
        this.#validateTone(step, where);
        return;
      case JabsBossManager.Verbs.Animation:
        this.#validateStepParticipant(encounter, step, where);
        this.#validateReference(
          $dataAnimations[step.animationId()], step.animationId(), step.expect(), `${where} animation`);
        return;
      case JabsBossManager.Verbs.Dialogue:
        this.#validateStepParticipant(encounter, step, where);
        this.#validateLines(step, where);
        return;
    }
  }

  /**
   * Confirms a tint names a whole screen tone: red, green, blue and gray.
   *
   * The engine reads a tone by position, so one with a value missing would not fail- it would settle on a
   * color nobody chose.
   * @param {JabsBossStep} step The step to check.
   * @param {string} where Where in the configuration the step lives, named for the error.
   */
  static #validateTone(step, where)
  {
    if (step.tone().length === 4) return;

    throw new Error(`Boss ${where} tints the screen to [ ${step.tone()} ], which is not red, green, blue and gray.`);
  }

  /**
   * Confirms a line of dialogue says something.
   *
   * An empty message still opens a window and still holds the fight until the player dismisses it, which
   * reads as the game stalling for no reason.
   * @param {JabsBossStep} step The step to check.
   * @param {string} where Where in the configuration the step lives, named for the error.
   */
  static #validateLines(step, where)
  {
    if (step.lines().length > 0) return;

    throw new Error(`Boss ${where} has a participant say nothing at all.`);
  }

  /**
   * Confirms the participant a step acts on is one the encounter has. A step naming nobody acts on the
   * boss, who always exists.
   * @param {JabsBossEncounter} encounter The encounter owning the step.
   * @param {JabsBossStep} step The step to check.
   * @param {string} where Where in the configuration the step lives, named for the error.
   */
  static #validateStepParticipant(encounter, step, where)
  {
    const key = step.participantKey();
    if (key === String.empty) return;

    this.#validateParticipantKey(encounter, key, where);
  }

  /**
   * Confirms an encounter has a participant answering to the given name.
   *
   * A misspelled name is not an error anything else would catch: a reaction waiting on it would never
   * fire, and a step acting on it would act on nobody, and the fight would simply play wrong.
   * @param {JabsBossEncounter} encounter The encounter to look in.
   * @param {string} key The participant name to find.
   * @param {string} where Where in the configuration the name was given, named for the error.
   */
  static #validateParticipantKey(encounter, key, where)
  {
    const isKnown = encounter.participants()
      .some(participant => participant.key() === key);
    if (isKnown) return;

    throw new Error(`Boss ${where} names participant [ ${key} ], but the encounter has nobody by that name.`);
  }

  /**
   * Confirms an encounter has a routine answering to the given name.
   * @param {JabsBossEncounter} encounter The encounter to look in.
   * @param {string} key The routine name to find.
   * @param {string} where Where in the configuration the name was given, named for the error.
   */
  static #validateRoutineKey(encounter, key, where)
  {
    const isKnown = encounter.routines()
      .some(routine => routine.key() === key);
    if (isKnown) return;

    throw new Error(`Boss ${where} names routine [ ${key} ], but the encounter has no routine by that name.`);
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

    const drift = `was authored as [ ${expected} ] but is now [ ${actual} ]`;
    throw new Error(`Boss configuration drift: ${description} id [ ${id} ] ${drift}.`);
  }

  //endregion validation

  //region boss resolution
  /**
   * Gets the {@link JABS_Battler} for the given participant of the active encounter.
   * @param {JabsBossParticipant} participant The participant to resolve.
   * @returns {JABS_Battler|null} The battler, or null when its body is not currently on the map.
   */
  static getParticipantJabsBattler(participant)
  {
    const body = this.#participantBodies.get(participant.key());

    // a participant has a body only while a fight that spawned it is running.
    if (!body) return null;

    // a body that has left the map no longer answers to its old slot: the slot may sit empty, or hold
    // whatever was dropped there since. Absence is normal rather than exceptional- bodies despawn on
    // defeat- so the map has to still hold this very body for it to count.
    if ($gameMap.event(body.eventId()) !== body) return null;

    // a fallen body keeps its slot for a while once its death scene ends, but no longer carries a battler.
    if (body.isErased()) return null;

    return body.getJabsBattler();
  }

  /**
   * Determines whether a battler is the body of one of the active encounter's participants: the boss, or any
   * other body the fight is won by felling.
   *
   * What a fight spawns for itself, such as a hazard, is no participant, and neither is anything that was on the
   * map before the fight began.
   * @param {JABS_Battler} jabsBattler The battler to check.
   * @returns {boolean}
   */
  static isParticipant(jabsBattler)
  {
    const body = jabsBattler.getCharacter();

    return [ ...this.#participantBodies.values() ].includes(body);
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

    // a scene the map is playing holds the whole fight, the boss's own lines included, so that a line never
    // talks over a scene.
    if ($gameMap.isEventRunning()) return;

    // a line being said plays out before anything else in the fight moves.
    this.#updateDialogue();

    // only fight time counts. While a message is on screen the battle system holds every battler still, and a
    // routine that kept counting through it would spring on the player the moment the message closed.
    if (this.#isFightHeld()) return;

    // steps held behind a line take their turn now that it has been read. One of them may start another
    // line, and anything queued from here on simply waits behind that one in turn.
    this.#runPendingSteps();

    // whatever just happened in the fight is answered before anything else moves.
    this.#updateReactions();

    // a fight whose every body has fallen tells the story so, once.
    this.#updateDefeat();

    this.#activeEncounter.routines()
      .forEach(routine => this.#updateRoutine(routine));
  }

  /**
   * Advances the line a participant is saying, if one is being said.
   */
  static #updateDialogue()
  {
    if (this.#isDialogueRunning() === false) return;

    this.#dialogue.update();
  }

  /**
   * Determines whether a participant is in the middle of saying a line.
   * @returns {boolean}
   */
  static #isDialogueRunning()
  {
    // no line has been said this fight.
    if (this.#dialogue === null) return false;

    return this.#dialogue.isRunning();
  }

  /**
   * Fires every reaction whose moment has just arrived.
   */
  static #updateReactions()
  {
    // the fight beginning was answered as it began; every other moment is watched for from here.
    this.#activeEncounter.reactions()
      .filter(reaction => reaction.trigger() !== JabsBossReaction.Triggers.Start)
      .filter(reaction => this.#isReactionDue(reaction))
      .forEach(reaction => this.#fireReaction(reaction));
  }

  /**
   * Determines whether a reaction is due: not yet spent this fight, and its moment has arrived.
   * @param {JabsBossReaction} reaction The reaction to check.
   * @returns {boolean}
   */
  static #isReactionDue(reaction)
  {
    // a reaction answers its moment once per fight.
    if (this.#firedReactions.has(reaction)) return false;

    // a health reaction's moment is a body worn down far enough.
    if (reaction.trigger() === JabsBossReaction.Triggers.Health) return this.#isHealthReached(reaction);

    // J-ABS erases a body only once its last words are said, so an erased body has finished falling.
    return reaction.participantKeys()
      .every(key => this.#participantBodies.get(key)
        .isErased());
  }

  /**
   * Determines whether every participant a health reaction watches is standing at or below its percent.
   * @param {JabsBossReaction} reaction The health reaction to check.
   * @returns {boolean}
   */
  static #isHealthReached(reaction)
  {
    return this.#watchedParticipants(reaction)
      .every(participant => this.#isWornDownTo(participant, reaction.belowPercent()));
  }

  /**
   * Gets the participants a health reaction watches: the ones it names, or the boss when it names nobody.
   * @param {JabsBossReaction} reaction The health reaction.
   * @returns {JabsBossParticipant[]}
   */
  static #watchedParticipants(reaction)
  {
    // naming nobody watches the boss, the same way a step naming nobody acts on it.
    if (reaction.participantKeys().length === 0) return [ this.#activeEncounter.primaryParticipant() ];

    return reaction.participantKeys()
      .map(key => this.#participantByKey(key));
  }

  /**
   * Determines whether a participant is still standing, at or below a percent of its health.
   * @param {JabsBossParticipant} participant The participant to measure.
   * @param {number} percent The percent to compare inclusively against.
   * @returns {boolean}
   */
  static #isWornDownTo(participant, percent)
  {
    const jabsBattler = this.getParticipantJabsBattler(participant);

    // a body gone from the map has no health left to pass through.
    if (!jabsBattler) return false;

    // a body already falling is past every turning point it had: its fight is ending, not changing.
    const battler = jabsBattler.getBattler();
    if (battler.isDead()) return false;

    return battler.currentHpPercent100() <= percent;
  }

  /**
   * Spends a reaction, then performs it.
   * @param {JabsBossReaction} reaction The reaction to fire.
   */
  static #fireReaction(reaction)
  {
    // spent before anything it does, so nothing it sets in motion can fire it a second time.
    this.#firedReactions.add(reaction);

    this.#performReaction(reaction);
  }

  /**
   * Performs each of a reaction's steps, in order.
   * @param {JabsBossReaction} reaction The reaction to perform.
   */
  static #performReaction(reaction)
  {
    this.#performSteps(reaction.steps());
  }

  /**
   * Queues steps behind any already waiting, then runs as many as may run right now.
   * @param {JabsBossStep[]} steps The steps to perform, in order.
   */
  static #performSteps(steps)
  {
    steps.forEach(step => this.#pendingSteps.push(step));

    this.#runPendingSteps();
  }

  /**
   * Runs waiting steps in the order they were queued, stopping at a line being said: every step behind a
   * line waits until the player has read it.
   */
  static #runPendingSteps()
  {
    while (this.#pendingSteps.length > 0 && this.#isDialogueRunning() === false)
    {
      const step = this.#pendingSteps.shift();
      this.#executeStep(step);
    }
  }

  /**
   * Settles the active encounter as won on the first frame every one of its bodies has fallen, and lets
   * the story know.
   */
  static #updateDefeat()
  {
    // a fight is only ever won once.
    if (this.#bossDefeated) return;

    // a body still standing, or still saying its last words, means the fight is not over.
    if (!this.#isEveryBodyGone()) return;

    this.#bossDefeated = true;

    // whatever the fight woke goes quiet with it.
    this.#clearExtraBodies();

    this.#announceDefeat();
  }

  /**
   * Determines whether every body the active encounter spawned has fallen and finished dying.
   *
   * J-ABS erases a fallen body only once its death scene has played out, so an erased body is one whose
   * last words have all been said. Each body is asked directly rather than looked up on the map: a body
   * the map no longer holds may only have been left behind by a player walking off of it, which is not
   * the same thing at all as a boss that has fallen.
   * @returns {boolean}
   */
  static #isEveryBodyGone()
  {
    return this.#activeEncounter.participants()
      .every(participant => this.#participantBodies.get(participant.key()).isErased());
  }

  /**
   * Turns on the active encounter's defeat switch, when it names one and the fight was won in its arena.
   */
  static #announceDefeat()
  {
    // the story only hears of a fight won where the story put it. A test hall staging the same fight on
    // a map of its own can be won over and over without the game ever believing the boss is dead.
    if ($gameMap.mapId() !== this.#activeEncounter.mapId()) return;

    // a fight whose ending the story learns some other way names no switch.
    const switchId = this.#activeEncounter.defeatSwitchId();
    if (switchId === 0) return;

    $gameSwitches.setValue(switchId, true);
  }

  /**
   * Determines whether the fight is being held still for a message, the way the battle system holds every
   * battler while one is on screen. A participant's own line counts: by the time this is asked, any line
   * being said has already been put on screen.
   * @returns {boolean}
   */
  static #isFightHeld()
  {
    return $gameMessage.isBusy();
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

    // the next wait is however long this routine waits now, which a quickening may have shortened.
    this.#routineCountdowns.set(routine.key(), this.#routineCadences.get(routine.key()));
  }

  /**
   * Determines whether the active encounter's boss is in a state where a routine may execute.
   *
   * A routine's turn is judged by the boss, whichever participant its steps act on: the boss is who the
   * fight's rhythm belongs to.
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
    this.#performSteps(routine.steps());
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
      case JabsBossManager.Verbs.AddState:
        this.#executeAddState(step);
        break;
      case JabsBossManager.Verbs.RemoveState:
        this.#executeRemoveState(step);
        break;
      case JabsBossManager.Verbs.ChangeImage:
        this.#executeChangeImage(step);
        break;
      case JabsBossManager.Verbs.QuickenRoutine:
        this.#executeQuickenRoutine(step);
        break;
      case JabsBossManager.Verbs.Spawn:
        this.#executeSpawn(step);
        break;
      case JabsBossManager.Verbs.Tint:
        this.#executeTint(step);
        break;
      case JabsBossManager.Verbs.Animation:
        this.#executeAnimation(step);
        break;
      case JabsBossManager.Verbs.Dialogue:
        this.#executeDialogue(step);
        break;
      default:
        throw new Error(`Unrecognized boss step verb: [ ${step.verb()} ].`);
    }
  }

  /**
   * Gets the battler a step acts on: the participant it names, or the boss when it names nobody.
   * @param {JabsBossStep} step The step being performed.
   * @returns {JABS_Battler|null} The battler, or null when that participant has no body on the map.
   */
  static #stepJabsBattler(step)
  {
    const participant = this.#stepParticipant(step);

    return this.getParticipantJabsBattler(participant);
  }

  /**
   * Gets the participant a step acts on: the one it names, or the boss when it names nobody.
   * @param {JabsBossStep} step The step being performed.
   * @returns {JabsBossParticipant}
   */
  static #stepParticipant(step)
  {
    // a step naming nobody acts on the boss itself.
    const key = step.participantKey();
    if (key === String.empty) return this.#activeEncounter.primaryParticipant();

    return this.#participantByKey(key);
  }

  /**
   * Gets the active encounter's participant answering to the given name.
   * @param {string} key The participant's author-facing name.
   * @returns {JabsBossParticipant}
   */
  static #participantByKey(key)
  {
    // starting the encounter already proved somebody answers to the name.
    return this.#activeEncounter.participants()
      .find(participant => participant.key() === key);
  }

  /**
   * Makes a participant perform the skill named by a step.
   *
   * There are two genuinely different ways to make a battler use a skill, and which one is correct
   * depends entirely on whether the skill has a telegraph worth preserving.
   * @param {JabsBossStep} step The step naming the skill to perform.
   */
  static #executeForceSkill(step)
  {
    const jabsBattler = this.#stepJabsBattler(step);

    // a body no longer on the map has nothing left to perform with.
    if (!jabsBattler) return;

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

    // a decided action only fires once its battler is in position, and only walking there says so. A boss
    // held in place can never take that step, so it casts from where it stands rather than winding up the
    // skill and then waiting forever.
    if (jabsBattler.canBattlerMove() === false)
    {
      jabsBattler.setInPosition(true);
    }

    // phase two is where a decided action is cast and then executed; without this the action would
    // sit decided but unprocessed until the AI happened to arrive there on its own.
    jabsBattler.setPhase(2);
  }

  /**
   * Puts the state named by a step on its participant.
   * @param {JabsBossStep} step The step naming the participant and the state.
   */
  static #executeAddState(step)
  {
    const jabsBattler = this.#stepJabsBattler(step);

    // a body no longer on the map has nothing left to put a state on.
    if (!jabsBattler) return;

    // the participant puts the state on itself. Naming a source is what makes it a JABS state that keeps
    // to its own timing, rather than a vanilla one that silently never expires.
    const battler = jabsBattler.getBattler();
    battler.addState(step.stateId(), battler);
  }

  /**
   * Takes the state named by a step off its participant.
   * @param {JabsBossStep} step The step naming the participant and the state.
   */
  static #executeRemoveState(step)
  {
    const jabsBattler = this.#stepJabsBattler(step);

    // a body no longer on the map has nothing left to take a state off.
    if (!jabsBattler) return;

    const battler = jabsBattler.getBattler();
    battler.removeState(step.stateId());
  }

  /**
   * Changes what a step's participant looks like.
   *
   * A spawned body has a single page, so nothing that refreshes the map can put its old look back: a page
   * is only set up again when the event changes which page it is on.
   * @param {JabsBossStep} step The step naming the participant and its new look.
   */
  static #executeChangeImage(step)
  {
    const jabsBattler = this.#stepJabsBattler(step);

    // a body no longer on the map has nothing left to change.
    if (!jabsBattler) return;

    const body = jabsBattler.getCharacter();
    body.setImage(step.characterName(), step.characterIndex());
  }

  /**
   * Shortens how long the routine named by a step waits between executions.
   * @param {JabsBossStep} step The step naming the routine and by how much.
   */
  static #executeQuickenRoutine(step)
  {
    const key = step.routineKey();

    // a routine quickened past nothing simply runs as often as its boss is able to act, since a wait at
    // or below zero is already due.
    const cadence = this.#routineCadences.get(key);
    this.#routineCadences.set(key, cadence - step.frames());

    // the fight speeds up now rather than one execution from now: the wait already underway shortens too.
    const remaining = this.#routineCountdowns.get(key);
    this.#routineCountdowns.set(key, remaining - step.frames());
  }

  /**
   * Puts the body a step names onto its tile, as part of the fight without being a body the fight needs
   * felled.
   * @param {JabsBossStep} step The step naming the enemy, its template and its tile.
   */
  static #executeSpawn(step)
  {
    const body = $jabsEngine.addEnemyToMap(step.x(), step.y(), step.templateId());

    // the body has to be exactly who the configuration says it is, the same as any participant's.
    const who = `encounter [ ${this.#activeEncounter.key()} ] spawn of enemy [ ${step.enemyId()} ]`;
    this.#confirmBody(body, step.enemyId(), step.templateId(), who);

    this.#extraBodies.push(body);
  }

  /**
   * Shifts the whole screen toward the tone a step names, over the time it names.
   * @param {JabsBossStep} step The step naming the tone and how long it takes to settle.
   */
  static #executeTint(step)
  {
    // the first tint of a fight remembers the screen it found, so ending the fight can hand that back.
    if (this.#toneBeforeFight.length === 0)
    {
      this.#toneBeforeFight = [ ...$gameScreen.tone() ];
    }

    $gameScreen.startTint(step.tone(), step.frames());
  }

  /**
   * Plays the animation a step names over its participant.
   * @param {JabsBossStep} step The step naming the participant and the animation.
   */
  static #executeAnimation(step)
  {
    const jabsBattler = this.#stepJabsBattler(step);

    // a body no longer on the map has nothing left to play over.
    if (!jabsBattler) return;

    const body = jabsBattler.getCharacter();
    $gameTemp.requestAnimation([ body ], step.animationId());
  }

  /**
   * Has a step's participant say its line, holding the fight until the player has read it.
   *
   * The line runs through an interpreter belonging to the speaker's own event, the way a scene's lines do,
   * so a message that floats above whoever is speaking floats above the speaker here too.
   * @param {JabsBossStep} step The step naming the participant, their name and their line.
   */
  static #executeDialogue(step)
  {
    const jabsBattler = this.#stepJabsBattler(step);

    // a body no longer on the map has nobody left to say the line.
    if (!jabsBattler) return;

    const speaker = jabsBattler.getCharacter();
    const commands = this.#dialogueCommands(step);

    const interpreter = new Game_Interpreter();
    interpreter.setup(commands, speaker.eventId());
    this.#dialogue = interpreter;
  }

  /**
   * Builds the event commands that say a step's line: one Show Text naming the speaker, then each of its
   * lines, then the end of the list.
   * @param {JabsBossStep} step The step naming the speaker and the line.
   * @returns {object[]}
   */
  static #dialogueCommands(step)
  {
    // a Show Text with no face, in the ordinary window at the bottom of the screen, naming the speaker.
    const showText = { code: 101, indent: 0, parameters: [ String.empty, 0, 0, 2, step.speaker() ] };

    // each line of the message is a text line of its own.
    const textLines = step.lines()
      .map(line => ({ code: 401, indent: 0, parameters: [ line ] }));

    // an interpreter stops at the end of a list, which is a command of its own.
    const end = { code: 0, indent: 0, parameters: [] };

    return [ showText, ...textLines, end ];
  }

  //endregion update
}

export default JabsBossManager;
//endregion JabsBossManager
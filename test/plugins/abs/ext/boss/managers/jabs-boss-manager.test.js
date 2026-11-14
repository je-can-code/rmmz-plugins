//region plugins/abs/ext/boss/managers/jabs-boss-manager.test.js
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('J-ABS-Boss JabsBossManager (unit, all downstream dependencies mocked)', () =>
{
  /** @type {typeof import('../../../../../../src/plugins/abs/ext/boss/managers/JabsBossManager.js').default} */
  let JabsBossManager;
  /** @type {typeof import('../../../../../../src/plugins/abs/ext/boss/models/JabsBossEncounter.js').default} */
  let JabsBossEncounter;
  /** @type {typeof import('../../../../../../src/plugins/abs/ext/boss/models/JabsBossParticipant.js').default} */
  let JabsBossParticipant;
  /** @type {typeof import('../../../../../../src/plugins/abs/ext/boss/models/JabsBossReaction.js').default} */
  let JabsBossReaction;
  /** @type {typeof import('../../../../../../src/plugins/abs/ext/boss/models/JabsBossRoutine.js').default} */
  let JabsBossRoutine;
  /** @type {typeof import('../../../../../../src/plugins/abs/ext/boss/models/JabsBossStep.js').default} */
  let JabsBossStep;

  const ENEMY_ID = 581;
  const ENEMY_NAME = 'Gluttonwolf Mayor';
  const SPAWN_X = 8;
  const SPAWN_Y = 14;
  const BODY_EVENT_ID = 61;
  const TWIN_ENEMY_ID = 582;
  const TWIN_ENEMY_NAME = 'Vampire King';
  const TWIN_X = 12;
  const TWIN_Y = 6;
  const TWIN_BODY_EVENT_ID = 62;
  const TEMPLATE_ID = 601;
  const SKILL_ID = 2584;
  const SKILL_NAME = 'Devour';
  const STATE_ID = 2072;
  const STATE_NAME = 'Sealed';
  const IMAGE_NAME = '$m_elemental-earthie';
  const IMAGE_INDEX = 3;
  const CADENCE_FRAMES = 1200;
  const CAST_TIME = 30;
  const ARENA_MAP_ID = 75;
  const HALL_MAP_ID = 501;
  const DEFEAT_SWITCH_ID = 24;
  const LAST_SWITCH_ID = 400;
  const HAZARD_ENEMY_ID = 511;
  const HAZARD_NAME = 'Ignihazard';
  const HAZARD_TEMPLATE_ID = 605;
  const HAZARD_X = 44;
  const HAZARD_Y = 16;
  const HAZARD_EVENT_ID = 70;
  const TONE = [ 17, -68, -68, 0 ];
  const TINT_FRAMES = 120;
  const ANIMATION_ID = 56;
  const ANIMATION_NAME = 'Flare Up';
  const SPEAKER = '\\C[10]Cynder\\C[0]';
  const LINES = [ '\\pop[self]BRING IT', 'second line' ];
  const FACE = 'KH06-2_faces_MV_07';
  const FACE_INDEX = 3;
  const PLATFORM_X = 8;
  const PLATFORM_Y = 19;
  const BLINK_FLARE = 40;
  const PAUSE_FRAMES = 45;
  const MASTERWORK_ENEMY_ID = 531;
  const MASTERWORK_NAME = 'Puppet';
  const MASTERWORK_X = 23;
  const MASTERWORK_Y = 13;
  const MASTERWORK_TEMPLATE_ID = 608;
  const MASTERWORK_EVENT_ID = 80;
  const SUMMON_FLARE = 52;

  /**
   * Every interpreter a fight created to say a line, oldest first. Each one reports itself still saying its
   * line until a test says it has finished.
   * @type {object[]}
   */
  const interpreters = [];

  /**
   * Stands in for the engine's interpreter, remembering what it was set up to run.
   */
  class FakeInterpreter
  {
    /**
     * Constructor.
     */
    constructor()
    {
      this.setup = vi.fn();
      this.update = vi.fn();
      this.isRunning = vi.fn(() => true);
      interpreters.push(this);
    }
  }

  /**
   * Builds a boss battler test double whose act-ability can be varied per test.
   * @param {boolean} isDead Whether the underlying battler reports itself defeated.
   * @param {boolean} isCasting Whether the battler is mid-cast or channeling.
   * @param {number} hpPercent The whole-number health percent the battler reports.
   * @param {number} enemyId The id of the enemy the underlying battler reports being.
   * @param {number} characterEventId The slot of the event the battler's character occupies.
   * @returns {object} The stand-in JABS battler.
   */
  const buildJabsBattler = (isDead, isCasting, hpPercent, enemyId = ENEMY_ID, characterEventId = BODY_EVENT_ID) =>
  {
    const gameBattler = {
      isDead: () => isDead,
      currentHpPercent100: vi.fn(() => hpPercent),
      enemyId: () => enemyId,
      addState: vi.fn(),
      removeState: vi.fn(),
      learnSkill: vi.fn(),
    };
    const character = { setImage: vi.fn(), setDirection: vi.fn(), eventId: () => characterEventId };

    // the action it has decided on, as J-ABS keeps it: whatever was last handed over, until something fires it.
    let decidedAction = null;

    return {
      getBattler: () => gameBattler,
      getCharacter: () => character,
      isCastingOrChanneling: () => isCasting,
      canBattlerMove: vi.fn(() => true),
      createJabsActionFromSkill: vi.fn(() => [ { getCastTime: () => CAST_TIME } ]),
      setDecidedAction: vi.fn(actions => { decidedAction = actions; }),
      getDecidedAction: () => decidedAction,
      setCastCountdown: vi.fn(),
      setInPosition: vi.fn(),
      setPhase: vi.fn(),
    };
  };

  /**
   * Builds a spawned body: an event in the given slot, carrying the given battler. Every body starts out
   * standing; a test fells one by having its erasure report true, the way J-ABS erases a body once its
   * death scene has played out.
   * @param {number} eventId The slot the body was spawned into.
   * @param {object|undefined} jabsBattler The battler the body carries, if any.
   * @returns {object} The stand-in event.
   */
  const buildBody = (eventId, jabsBattler) => ({
    eventId: () => eventId,
    getJabsBattler: () => jabsBattler,
    isErased: vi.fn(() => false),
    erase: vi.fn(),
  });

  /**
   * Has the map hold exactly the given bodies, each one in its own slot.
   * @param {object[]} bodies The bodies standing on the map.
   */
  const holdOnMap = bodies =>
  {
    $gameMap.event.mockImplementation(eventId => bodies.find(body => body.eventId() === eventId));
  };

  /**
   * Builds everything a step can be told, with every field at its "none" unless a test says otherwise.
   * @param {object} overrides The fields this step actually uses.
   * @returns {object} The step's details.
   */
  const stepDetails = overrides => ({
    participantKey: '',
    skillId: 0,
    stateId: 0,
    expect: '',
    cast: true,
    characterName: '',
    characterIndex: 0,
    routineKey: '',
    frames: 0,
    enemyId: 0,
    templateId: 0,
    x: 0,
    y: 0,
    direction: 0,
    tone: [],
    animationId: 0,
    face: '',
    faceIndex: 0,
    speaker: '',
    lines: [],
    ...overrides,
  });

  /**
   * Builds a step that wakes the test hazard on its tile, from its own template.
   * @param {string} enemyExpect The enemy name the step was authored against.
   * @returns {JabsBossStep}
   */
  const spawnStep = (enemyExpect = HAZARD_NAME, animationId = 0) => new JabsBossStep('spawn', stepDetails({
    enemyId: HAZARD_ENEMY_ID,
    expect: enemyExpect,
    templateId: HAZARD_TEMPLATE_ID,
    x: HAZARD_X,
    y: HAZARD_Y,
    animationId,
  }));

  /**
   * Builds a step that tints the screen to the given tone over the test duration.
   * @param {number[]} tone The tone the screen settles on.
   * @returns {JabsBossStep}
   */
  const tintStep = (tone = TONE) => new JabsBossStep('tint', stepDetails({ tone, frames: TINT_FRAMES }));

  /**
   * Builds a step that plays the test animation over a participant.
   * @param {string} participantKey The participant to play over, or empty for the boss.
   * @param {string} animationExpect The animation name the step was authored against.
   * @returns {JabsBossStep}
   */
  const animationStep = (participantKey = '', animationExpect = ANIMATION_NAME) =>
    new JabsBossStep('animation', stepDetails({ participantKey, animationId: ANIMATION_ID, expect: animationExpect }));

  /**
   * Builds a step that has a participant say the test line.
   * @param {string} participantKey The participant saying it, or empty for the boss.
   * @param {string[]} lines The text they say.
   * @returns {JabsBossStep}
   */
  const dialogueStep = (participantKey = '', lines = LINES) =>
    new JabsBossStep('dialogue', stepDetails({ participantKey, speaker: SPEAKER, lines }));

  /**
   * Builds a step that blinks a participant to the test platform, facing right, with the given flare.
   * @param {string} participantKey The participant to blink, or empty for the boss.
   * @param {number} animationId The flare it vanishes and arrives in, or zero for none.
   * @param {number} direction The way it is left facing.
   * @returns {JabsBossStep}
   */
  const blinkStep = (participantKey = '', animationId = BLINK_FLARE, direction = 6) =>
    new JabsBossStep('blink', stepDetails({ participantKey, x: PLATFORM_X, y: PLATFORM_Y, direction, animationId }));

  /**
   * Builds a step that holds its lane for the test pause.
   * @returns {JabsBossStep}
   */
  const waitStep = () => new JabsBossStep('wait', stepDetails({ frames: PAUSE_FRAMES }));

  /**
   * Builds a step that teaches a participant the test skill.
   * @param {string} participantKey The participant to teach, or empty for the boss.
   * @param {string} skillExpect The skill name the step was authored against.
   * @returns {JabsBossStep}
   */
  const learnSkillStep = (participantKey = '', skillExpect = SKILL_NAME) =>
    new JabsBossStep('learnSkill', stepDetails({ participantKey, skillId: SKILL_ID, expect: skillExpect }));

  /**
   * Builds a step that wakes the named routine.
   * @param {string} routineKey The routine to wake.
   * @returns {JabsBossStep}
   */
  const startRoutineStep = routineKey => new JabsBossStep('startRoutine', stepDetails({ routineKey }));

  /**
   * Builds a step that turns a participant to face the given way.
   * @param {string} participantKey The participant to turn, or empty for the boss.
   * @param {number} direction The way it turns to face.
   * @returns {JabsBossStep}
   */
  const faceStep = (participantKey = '', direction = 4) =>
    new JabsBossStep('face', stepDetails({ participantKey, direction }));

  /**
   * Builds a step that writes the test line to the dialogue log, wearing the test face.
   * @param {string[]} lines The text it writes.
   * @returns {JabsBossStep}
   */
  const logStep = (lines = LINES) => new JabsBossStep('log', stepDetails({ lines, face: FACE, faceIndex: FACE_INDEX }));

  /**
   * Builds a step that summons the participant it names.
   * @param {string} participantKey The participant to summon.
   * @param {number} animationId The flash it arrives in, or zero for none.
   * @returns {JabsBossStep}
   */
  const summonStep = (participantKey, animationId = 0) =>
    new JabsBossStep('summon', stepDetails({ participantKey, animationId }));

  /**
   * Builds a step that has a participant leap onto the test platform.
   * @param {string} participantKey The participant to leap, or empty for the boss.
   * @returns {JabsBossStep}
   */
  const jumpStep = (participantKey = '') =>
    new JabsBossStep('jump', stepDetails({ participantKey, x: PLATFORM_X, y: PLATFORM_Y }));

  /**
   * Builds a step that puts the test state on a participant.
   * @param {string} participantKey The participant to seal, or empty for the boss.
   * @param {string} stateExpect The state name the step was authored against.
   * @returns {JabsBossStep}
   */
  const addStateStep = (participantKey, stateExpect = STATE_NAME) =>
    new JabsBossStep('addState', stepDetails({ participantKey, stateId: STATE_ID, expect: stateExpect }));

  /**
   * Builds a step that takes the test state off a participant.
   * @param {string} participantKey The participant to unseal, or empty for the boss.
   * @param {string} stateExpect The state name the step was authored against.
   * @returns {JabsBossStep}
   */
  const removeStateStep = (participantKey, stateExpect = STATE_NAME) =>
    new JabsBossStep('removeState', stepDetails({ participantKey, stateId: STATE_ID, expect: stateExpect }));

  /**
   * Builds a step that changes a participant's look to the test image.
   * @param {string} participantKey The participant to change.
   * @returns {JabsBossStep}
   */
  const changeImageStep = participantKey =>
    new JabsBossStep('changeImage', stepDetails({ participantKey, characterName: IMAGE_NAME, characterIndex: IMAGE_INDEX }));

  /**
   * Builds a step that forces the test skill, skipping its cast time so it lands on the instant path.
   * @param {string} participantKey The participant to act through, or empty for the boss.
   * @returns {JabsBossStep}
   */
  const forceSkillStep = participantKey =>
    new JabsBossStep('forceSkill', stepDetails({ participantKey, skillId: SKILL_ID, expect: SKILL_NAME, cast: false }));

  /**
   * Builds an encounter with a single participant and a single forceSkill routine, staged in the arena.
   * @param {string} enemyExpect The enemy name the participant was authored against.
   * @param {string} skillExpect The skill name the step was authored against.
   * @param {boolean} cast Whether the step's skill observes its own cast time.
   * @param {number} defeatSwitchId The switch the encounter turns on once won, or zero for none.
   * @returns {JabsBossEncounter}
   */
  const buildEncounter = (enemyExpect, skillExpect, cast, defeatSwitchId = DEFEAT_SWITCH_ID) =>
  {
    const participant = new JabsBossParticipant('mayor', ENEMY_ID, enemyExpect, SPAWN_X, SPAWN_Y, ENEMY_ID);
    const step = new JabsBossStep('forceSkill', stepDetails({ skillId: SKILL_ID, expect: skillExpect, cast }));
    const routine = new JabsBossRoutine('devour', CADENCE_FRAMES, [ step ]);

    return new JabsBossEncounter(
      'gluttonwolf', ARENA_MAP_ID, [ participant ], 'shared', [ routine ], defeatSwitchId, []);
  };

  /**
   * Builds an encounter with two participants, each a different enemy on a different tile.
   * @param {JabsBossReaction[]} reactions What the encounter does in answer to the moments of the fight.
   * @param {JabsBossRoutine[]} routines The recurring sequences for the encounter.
   * @returns {JabsBossEncounter}
   */
  const buildTwinEncounter = (reactions = [], routines = []) =>
  {
    const mayor = new JabsBossParticipant('mayor', ENEMY_ID, ENEMY_NAME, SPAWN_X, SPAWN_Y, ENEMY_ID);
    const twin = new JabsBossParticipant('twin', TWIN_ENEMY_ID, TWIN_ENEMY_NAME, TWIN_X, TWIN_Y, TWIN_ENEMY_ID);

    return new JabsBossEncounter('twins', ARENA_MAP_ID, [ mayor, twin ], 'shared', routines, DEFEAT_SWITCH_ID, reactions);
  };

  /**
   * Starts the standard encounter with its boss spawning as the given battler, on a map that holds it.
   * @param {object} jabsBattler The battler the spawned boss carries.
   * @param {boolean} cast Whether the routine's skill observes its own cast time.
   * @param {number} defeatSwitchId The switch the encounter turns on once won, or zero for none.
   * @returns {object} The spawned body.
   */
  const startWithBoss = (jabsBattler, cast = true, defeatSwitchId = DEFEAT_SWITCH_ID) =>
  {
    JabsBossManager.registerEncounters([ buildEncounter(ENEMY_NAME, SKILL_NAME, cast, defeatSwitchId) ]);
    const body = buildBody(BODY_EVENT_ID, jabsBattler);
    $jabsEngine.addEnemyToMap.mockReturnValue(body);
    holdOnMap([ body ]);

    JabsBossManager.startEncounter('gluttonwolf');

    return body;
  };

  /**
   * Starts the twin encounter with both bodies standing on the map.
   * @param {JabsBossReaction[]} reactions What the encounter does in answer to the moments of the fight.
   * @param {JabsBossRoutine[]} routines The recurring sequences for the encounter.
   * @returns {{mayorBattler: object, twinBattler: object, mayorBody: object, twinBody: object}}
   */
  const startTwins = (reactions = [], routines = []) =>
  {
    JabsBossManager.registerEncounters([ buildTwinEncounter(reactions, routines) ]);
    const mayorBattler = buildJabsBattler(false, false, 100);
    const twinBattler = buildJabsBattler(false, false, 100, TWIN_ENEMY_ID, TWIN_BODY_EVENT_ID);
    const mayorBody = buildBody(BODY_EVENT_ID, mayorBattler);
    const twinBody = buildBody(TWIN_BODY_EVENT_ID, twinBattler);
    $jabsEngine.addEnemyToMap
      .mockReturnValueOnce(mayorBody)
      .mockReturnValueOnce(twinBody);
    holdOnMap([ mayorBody, twinBody ]);

    JabsBossManager.startEncounter('twins');

    return { mayorBattler, twinBattler, mayorBody, twinBody };
  };

  /**
   * Builds an encounter whose boss fights while a second body stands by, part of the fight without being part
   * of winning it.
   * @param {JabsBossReaction[]} reactions What the encounter does in answer to the moments of the fight.
   * @returns {JabsBossEncounter}
   */
  const buildWatchedEncounter = (reactions = []) =>
  {
    const mayor = new JabsBossParticipant('mayor', ENEMY_ID, ENEMY_NAME, SPAWN_X, SPAWN_Y, ENEMY_ID);
    const watcher = new JabsBossParticipant(
      'watcher', TWIN_ENEMY_ID, TWIN_ENEMY_NAME, TWIN_X, TWIN_Y, TWIN_ENEMY_ID, true);

    return new JabsBossEncounter('watched', ARENA_MAP_ID, [ mayor, watcher ], 'shared', [], DEFEAT_SWITCH_ID, reactions);
  };

  /**
   * Starts the watched encounter with the boss and its bystander both standing on the map.
   * @param {JabsBossReaction[]} reactions What the encounter does in answer to the moments of the fight.
   * @returns {{mayorBody: object, watcherBody: object, watcherBattler: object}}
   */
  const startWatched = (reactions = []) =>
  {
    JabsBossManager.registerEncounters([ buildWatchedEncounter(reactions) ]);
    const watcherBattler = buildJabsBattler(false, false, 100, TWIN_ENEMY_ID, TWIN_BODY_EVENT_ID);
    const mayorBody = buildBody(BODY_EVENT_ID, buildJabsBattler(false, false, 100));
    const watcherBody = buildBody(TWIN_BODY_EVENT_ID, watcherBattler);
    $jabsEngine.addEnemyToMap
      .mockReturnValueOnce(mayorBody)
      .mockReturnValueOnce(watcherBody);
    holdOnMap([ mayorBody, watcherBody ]);

    JabsBossManager.startEncounter('watched');

    return { mayorBody, watcherBody, watcherBattler };
  };

  /**
   * Builds a reaction to the given bodies falling.
   * @param {string[]} participantKeys The participants it waits on.
   * @param {JabsBossStep[]} steps What it does once they have all fallen.
   * @returns {JabsBossReaction}
   */
  const onFallen = (participantKeys, steps) => new JabsBossReaction('fell', 'fallen', participantKeys, steps);

  /**
   * Builds a reaction to the fight beginning.
   * @param {JabsBossStep[]} steps What it does as the fight opens.
   * @returns {JabsBossReaction}
   */
  const onStart = steps => new JabsBossReaction('opening', 'start', [], steps);

  /**
   * Builds a reaction to participants being worn down to a percent of their health.
   * @param {number} belowPercent The percent it waits for, inclusive.
   * @param {JabsBossStep[]} steps What it does once they are.
   * @param {string[]} participantKeys The participants it watches, or none for the boss.
   * @returns {JabsBossReaction}
   */
  const onHealth = (belowPercent, steps, participantKeys = []) =>
    new JabsBossReaction('flare', 'health', participantKeys, steps, belowPercent);

  /**
   * Registers a single-boss encounter, staged in the arena, with the given reactions and routines.
   * @param {JabsBossReaction[]} reactions What the encounter does in answer to the moments of the fight.
   * @param {JabsBossRoutine[]} routines The recurring sequences for the encounter.
   */
  const registerFlaring = (reactions, routines = []) =>
  {
    const participant = new JabsBossParticipant('mayor', ENEMY_ID, ENEMY_NAME, SPAWN_X, SPAWN_Y, ENEMY_ID);
    const encounter = new JabsBossEncounter(
      'flaring', ARENA_MAP_ID, [ participant ], 'shared', routines, DEFEAT_SWITCH_ID, reactions);
    JabsBossManager.registerEncounters([ encounter ]);
  };

  /**
   * Starts a single-boss encounter with the given reactions and routines. The spawner hands back the boss
   * first and then each extra body in turn, and the map holds all of them.
   * @param {object} jabsBattler The battler the spawned boss carries.
   * @param {JabsBossReaction[]} reactions What the encounter does in answer to the moments of the fight.
   * @param {object[]} extras The bodies its steps spawn, in the order they spawn them.
   * @param {JabsBossRoutine[]} routines The recurring sequences for the encounter.
   * @returns {object} The spawned boss body.
   */
  const startFlaring = (jabsBattler, reactions, extras = [], routines = []) =>
  {
    registerFlaring(reactions, routines);
    const body = buildBody(BODY_EVENT_ID, jabsBattler);
    $jabsEngine.addEnemyToMap.mockReturnValueOnce(body);
    extras.forEach(extra => $jabsEngine.addEnemyToMap.mockReturnValueOnce(extra));
    holdOnMap([ body, ...extras ]);

    JabsBossManager.startEncounter('flaring');

    return body;
  };

  /**
   * Builds a body for the test hazard, standing in its own slot.
   * @returns {object} The stand-in event.
   */
  const buildHazard = () => buildBody(HAZARD_EVENT_ID, buildJabsBattler(false, false, 100, HAZARD_ENEMY_ID));

  /**
   * Builds an encounter whose boss is joined by masterworks held back until a step summons each one, the way a
   * maker calls her work down one piece at a time. Every masterwork shares the same enemy, tile and template.
   * @param {JabsBossReaction[]} reactions What the encounter does in answer to the moments of the fight.
   * @param {string[]} heldBack The name of each masterwork, in the order the fight lists them.
   * @param {JabsBossRoutine[]} routines The recurring sequences for the encounter.
   * @returns {JabsBossEncounter}
   */
  const buildSummoningEncounter = (reactions, heldBack = [ 'brine' ], routines = []) =>
  {
    const mayor = new JabsBossParticipant('mayor', ENEMY_ID, ENEMY_NAME, SPAWN_X, SPAWN_Y, ENEMY_ID);
    const masterworks = heldBack.map(key => new JabsBossParticipant(
      key, MASTERWORK_ENEMY_ID, MASTERWORK_NAME, MASTERWORK_X, MASTERWORK_Y, MASTERWORK_TEMPLATE_ID, false, true));
    const participants = [ mayor, ...masterworks ];

    return new JabsBossEncounter('workshop', ARENA_MAP_ID, participants, 'shared', routines, DEFEAT_SWITCH_ID, reactions);
  };

  /**
   * Starts the summoning encounter. The spawner hands back the boss first and then each masterwork in the order
   * they are listed, which is the order these tests summon them in, and the map holds every one of them.
   * @param {JabsBossReaction[]} reactions What the encounter does in answer to the moments of the fight.
   * @param {string[]} heldBack The name of each masterwork, in the order the fight lists them.
   * @returns {{mayorBody: object, mayorBattler: object, masterworkBodies: object[]}}
   */
  const startSummoning = (reactions, heldBack = [ 'brine' ]) =>
  {
    JabsBossManager.registerEncounters([ buildSummoningEncounter(reactions, heldBack) ]);
    const mayorBattler = buildJabsBattler(false, false, 100);
    const mayorBody = buildBody(BODY_EVENT_ID, mayorBattler);
    const masterworkBodies = heldBack.map((key, index) =>
    {
      const eventId = MASTERWORK_EVENT_ID + index;
      return buildBody(eventId, buildJabsBattler(false, false, 100, MASTERWORK_ENEMY_ID, eventId));
    });
    $jabsEngine.addEnemyToMap.mockReturnValueOnce(mayorBody);
    masterworkBodies.forEach(body => $jabsEngine.addEnemyToMap.mockReturnValueOnce(body));
    holdOnMap([ mayorBody, ...masterworkBodies ]);

    JabsBossManager.startEncounter('workshop');

    return { mayorBody, mayorBattler, masterworkBodies };
  };

  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = { ABS: { EXT: { BOSS: {} } } };
    String.empty = '';

    globalThis.$dataEnemies = [];
    globalThis.$dataEnemies[ENEMY_ID] = { name: ENEMY_NAME };
    globalThis.$dataEnemies[TWIN_ENEMY_ID] = { name: TWIN_ENEMY_NAME };
    globalThis.$dataEnemies[HAZARD_ENEMY_ID] = { name: HAZARD_NAME };
    globalThis.$dataEnemies[MASTERWORK_ENEMY_ID] = { name: MASTERWORK_NAME };
    globalThis.$dataSkills = [];
    globalThis.$dataSkills[SKILL_ID] = { name: SKILL_NAME };
    globalThis.$dataStates = [];
    globalThis.$dataStates[STATE_ID] = { name: STATE_NAME };
    globalThis.$dataAnimations = [];
    globalThis.$dataAnimations[ANIMATION_ID] = { name: ANIMATION_NAME };
    globalThis.$gameScreen = { tone: vi.fn(), toneTarget: vi.fn(), startTint: vi.fn() };
    globalThis.$gameTemp = { requestAnimation: vi.fn() };
    globalThis.Game_Interpreter = FakeInterpreter;

    // the engine's switch list starts with an unused slot zero, so four hundred switches is 401 entries.
    globalThis.$dataSystem = { switches: Array(LAST_SWITCH_ID + 1).fill('') };

    globalThis.$gameMap = { event: vi.fn(), isEventRunning: vi.fn(), mapId: vi.fn() };
    globalThis.$gameMessage = { isBusy: vi.fn() };
    globalThis.$gameSwitches = { setValue: vi.fn() };
    globalThis.$jabsEngine = { forceMapAction: vi.fn(), addEnemyToMap: vi.fn() };
    globalThis.JABS_ActionOptions = { Builder: () => ({ build: () => ({}) }) };
    globalThis.JABS_AiManager = { needsActionExecution: vi.fn(), executeAiPhase2Action: vi.fn() };

    ({ default: JabsBossParticipant } = await import('../../../../../../src/plugins/abs/ext/boss/models/JabsBossParticipant.js'));
    ({ default: JabsBossStep } = await import('../../../../../../src/plugins/abs/ext/boss/models/JabsBossStep.js'));
    ({ default: JabsBossRoutine } = await import('../../../../../../src/plugins/abs/ext/boss/models/JabsBossRoutine.js'));
    ({ default: JabsBossReaction } = await import('../../../../../../src/plugins/abs/ext/boss/models/JabsBossReaction.js'));
    ({ default: JabsBossEncounter } = await import('../../../../../../src/plugins/abs/ext/boss/models/JabsBossEncounter.js'));
    ({ default: JabsBossManager } = await import('../../../../../../src/plugins/abs/ext/boss/managers/JabsBossManager.js'));
  });

  beforeEach(() =>
  {
    // static managers keep their state between tests; wipe it so no test inherits a live fight.
    JabsBossManager.encounters.clear();
    JabsBossManager.endEncounter();
    vi.clearAllMocks();

    // clearing a mock forgets its calls but keeps its implementation, and these two are given a new
    // one by nearly every test- reset them so no test inherits another's map or spawner.
    $gameMap.event.mockReset();
    $jabsEngine.addEnemyToMap.mockReset();

    // nothing is playing out unless a test says so, so the fight runs freely by default.
    $gameMap.isEventRunning.mockReturnValue(false);
    $gameMessage.isBusy.mockReturnValue(false);

    // every windup is still playing unless a test says it has ended.
    JABS_AiManager.needsActionExecution.mockReturnValue(false);

    // every fight is staged in its own arena unless a test moves it to a hall.
    $gameMap.mapId.mockReturnValue(ARENA_MAP_ID);

    // no line has been said, and the screen starts untinted, headed nowhere else.
    interpreters.length = 0;
    $gameScreen.startTint.mockReset();
    $gameScreen.tone.mockReturnValue([ 0, 0, 0, 0 ]);
    $gameScreen.toneTarget.mockReturnValue([ 0, 0, 0, 0 ]);
  });

  describe('startEncounter', () =>
  {
    it('throws when the encounter name is unknown', () =>
    {
      // Arrange
      // nothing is registered.

      // Act
      const act = () => JabsBossManager.startEncounter('nonexistent');

      // Assert
      expect(act).toThrow(/Unknown boss encounter/);
    });

    it('makes the named encounter active once its bodies are on the map', () =>
    {
      // Arrange & Act
      startWithBoss(buildJabsBattler(false, false, 100));

      // Assert
      expect(JabsBossManager.hasActiveEncounter()).toBe(true);
      expect(JabsBossManager.activeEncounter().key()).toBe('gluttonwolf');
    });

    it('seeds each routine a full interval so nothing fires on the opening frame', () =>
    {
      // Arrange
      const jabsBattler = buildJabsBattler(false, false, 100);
      startWithBoss(jabsBattler);

      // Act
      JabsBossManager.update();

      // Assert
      expect($jabsEngine.forceMapAction).not.toHaveBeenCalled();
      expect(jabsBattler.setDecidedAction).not.toHaveBeenCalled();
    });
  });

  describe('spawning', () =>
  {
    it('spawns each participant from the clone map slot matching its enemy id, onto its own tile', () =>
    {
      // Arrange
      JabsBossManager.registerEncounters([ buildTwinEncounter() ]);
      $jabsEngine.addEnemyToMap
        .mockReturnValueOnce(buildBody(BODY_EVENT_ID, buildJabsBattler(false, false, 100)))
        .mockReturnValueOnce(buildBody(TWIN_BODY_EVENT_ID, buildJabsBattler(false, false, 100, TWIN_ENEMY_ID)));

      // Act
      JabsBossManager.startEncounter('twins');

      // Assert
      expect($jabsEngine.addEnemyToMap).toHaveBeenCalledTimes(2);
      expect($jabsEngine.addEnemyToMap).toHaveBeenNthCalledWith(1, SPAWN_X, SPAWN_Y, ENEMY_ID);
      expect($jabsEngine.addEnemyToMap).toHaveBeenNthCalledWith(2, TWIN_X, TWIN_Y, TWIN_ENEMY_ID);
    });

    it('resolves each participant to the body spawned for it rather than to any body on the map', () =>
    {
      // Arrange- two bodies stand on the map, so a lookup that matched every body would hand back the
      // same one for both participants.
      const encounter = buildTwinEncounter();
      JabsBossManager.registerEncounters([ encounter ]);
      const mayorBattler = buildJabsBattler(false, false, 100);
      const twinBattler = buildJabsBattler(false, false, 100, TWIN_ENEMY_ID);
      const mayorBody = buildBody(BODY_EVENT_ID, mayorBattler);
      const twinBody = buildBody(TWIN_BODY_EVENT_ID, twinBattler);
      $jabsEngine.addEnemyToMap
        .mockReturnValueOnce(mayorBody)
        .mockReturnValueOnce(twinBody);
      holdOnMap([ mayorBody, twinBody ]);
      JabsBossManager.startEncounter('twins');
      const [ , twin ] = encounter.participants();

      // Act
      const bossBattler = JabsBossManager.getBossJabsBattler();
      const resolvedTwin = JabsBossManager.getParticipantJabsBattler(twin);

      // Assert
      expect(bossBattler).toBe(mayorBattler);
      expect(resolvedTwin).toBe(twinBattler);
    });

    it('throws without starting the fight when the clone map holds no event for a participant', () =>
    {
      // Arrange
      JabsBossManager.registerEncounters([ buildEncounter(ENEMY_NAME, SKILL_NAME, true) ]);
      $jabsEngine.addEnemyToMap.mockReturnValue(undefined);

      // Act
      const act = () => JabsBossManager.startEncounter('gluttonwolf');

      // Assert
      expect(act).toThrow(/participant \[ mayor ] could not spawn: the enemy clone map holds no event \[ 581 ]/);
      expect(JabsBossManager.hasActiveEncounter()).toBe(false);
    });

    it('throws without starting the fight when the spawned body is a different enemy', () =>
    {
      // Arrange- the slot holds an event, but its page names somebody else.
      JabsBossManager.registerEncounters([ buildEncounter(ENEMY_NAME, SKILL_NAME, true) ]);
      $jabsEngine.addEnemyToMap.mockReturnValue(
        buildBody(BODY_EVENT_ID, buildJabsBattler(false, false, 100, TWIN_ENEMY_ID)));

      // Act
      const act = () => JabsBossManager.startEncounter('gluttonwolf');

      // Assert
      expect(act).toThrow(/participant \[ mayor ] spawned enemy \[ 582 ] from clone event \[ 581 ]/);
      expect(JabsBossManager.hasActiveEncounter()).toBe(false);
    });

    it('throws when the spawned body carries no battler at all', () =>
    {
      // Arrange- a placeholder slot whose page names no enemy produces an event with no battler.
      JabsBossManager.registerEncounters([ buildEncounter(ENEMY_NAME, SKILL_NAME, true) ]);
      $jabsEngine.addEnemyToMap.mockReturnValue(buildBody(BODY_EVENT_ID, undefined));

      // Act
      const act = () => JabsBossManager.startEncounter('gluttonwolf');

      // Assert
      expect(act).toThrow(/spawned enemy \[ 0 ] from clone event \[ 581 ]/);
    });
  });

  describe('templates', () =>
  {
    /**
     * Registers a fight whose one participant is the boss enemy, dressed by a template of its own.
     */
    const registerTemplatedFight = () =>
    {
      const golem = new JabsBossParticipant('golem', ENEMY_ID, ENEMY_NAME, SPAWN_X, SPAWN_Y, TEMPLATE_ID);
      const encounter = new JabsBossEncounter('dressed', ARENA_MAP_ID, [ golem ], 'shared', [], 0, []);
      JabsBossManager.registerEncounters([ encounter ]);
    };

    it('spawns a participant that names a template of its own from that template, not its enemy slot', () =>
    {
      // Arrange
      registerTemplatedFight();
      $jabsEngine.addEnemyToMap.mockReturnValue(buildBody(BODY_EVENT_ID, buildJabsBattler(false, false, 100)));

      // Act
      JabsBossManager.startEncounter('dressed');

      // Assert- the body is still the enemy the participant names, so the fight starts.
      expect($jabsEngine.addEnemyToMap).toHaveBeenCalledWith(SPAWN_X, SPAWN_Y, TEMPLATE_ID);
      expect(JabsBossManager.hasActiveEncounter()).toBe(true);
    });

    it('names the template slot it tried when that slot is empty', () =>
    {
      // Arrange
      registerTemplatedFight();
      $jabsEngine.addEnemyToMap.mockReturnValue(undefined);

      // Act
      const act = () => JabsBossManager.startEncounter('dressed');

      // Assert
      expect(act).toThrow(/the enemy clone map holds no event \[ 601 ]/);
    });

    it('names the template slot it spawned from when the body turns out to be somebody else', () =>
    {
      // Arrange
      registerTemplatedFight();
      $jabsEngine.addEnemyToMap.mockReturnValue(
        buildBody(BODY_EVENT_ID, buildJabsBattler(false, false, 100, TWIN_ENEMY_ID)));

      // Act
      const act = () => JabsBossManager.startEncounter('dressed');

      // Assert
      expect(act).toThrow(/spawned enemy \[ 582 ] from clone event \[ 601 ]/);
    });
  });

  describe('encounter validation', () =>
  {
    it('throws before spawning anything when a participant enemy no longer carries its authored name', () =>
    {
      // Arrange
      JabsBossManager.registerEncounters([ buildEncounter('Emotion', SKILL_NAME, true) ]);

      // Act
      const act = () => JabsBossManager.startEncounter('gluttonwolf');

      // Assert
      expect(act).toThrow(/was authored as \[ Emotion ] but is now \[ Gluttonwolf Mayor ]/);
      expect($jabsEngine.addEnemyToMap).not.toHaveBeenCalled();
    });

    it('throws when a routine skill no longer carries its authored name', () =>
    {
      // Arrange
      JabsBossManager.registerEncounters([ buildEncounter(ENEMY_NAME, 'Doom Wing', true) ]);

      // Act
      const act = () => JabsBossManager.startEncounter('gluttonwolf');

      // Assert
      expect(act).toThrow(/routine \[ devour ] skill id \[ 2584 ] was authored as \[ Doom Wing ] but is now \[ Devour ]/);
    });

    it('reports the absence plainly when the id resolves to no database row at all', () =>
    {
      // Arrange
      const participant = new JabsBossParticipant('ghost', 9999, 'Some Enemy', SPAWN_X, SPAWN_Y, 9999);
      const encounter = new JabsBossEncounter('ghost-fight', ARENA_MAP_ID, [ participant ], 'shared', [], 0, []);
      JabsBossManager.registerEncounters([ encounter ]);

      // Act
      const act = () => JabsBossManager.startEncounter('ghost-fight');

      // Assert
      expect(act).toThrow(/but is now \[ <nothing> ]/);
    });

    it('throws before spawning anything when the defeat switch is past the last switch the game has', () =>
    {
      // Arrange
      JabsBossManager.registerEncounters([ buildEncounter(ENEMY_NAME, SKILL_NAME, true, LAST_SWITCH_ID + 1) ]);

      // Act
      const act = () => JabsBossManager.startEncounter('gluttonwolf');

      // Assert
      expect(act).toThrow(/turns on switch \[ 401 ] when won, but the game only has switches 1-400/);
      expect($jabsEngine.addEnemyToMap).not.toHaveBeenCalled();
    });

    it('throws when the defeat switch comes before the first switch the game has', () =>
    {
      // Arrange
      JabsBossManager.registerEncounters([ buildEncounter(ENEMY_NAME, SKILL_NAME, true, -1) ]);

      // Act
      const act = () => JabsBossManager.startEncounter('gluttonwolf');

      // Assert
      expect(act).toThrow(/turns on switch \[ -1 ] when won/);
    });

    it('accepts the last switch the game has as a defeat switch', () =>
    {
      // Arrange
      JabsBossManager.registerEncounters([ buildEncounter(ENEMY_NAME, SKILL_NAME, true, LAST_SWITCH_ID) ]);
      $jabsEngine.addEnemyToMap.mockReturnValue(buildBody(BODY_EVENT_ID, buildJabsBattler(false, false, 100)));

      // Act
      JabsBossManager.startEncounter('gluttonwolf');

      // Assert
      expect(JabsBossManager.hasActiveEncounter()).toBe(true);
    });

    it('skips the switch check for an encounter that turns no switch on', () =>
    {
      // Arrange- zero sits below the first switch, so only the check being skipped lets this fight start.
      JabsBossManager.registerEncounters([ buildEncounter(ENEMY_NAME, SKILL_NAME, true, 0) ]);
      $jabsEngine.addEnemyToMap.mockReturnValue(buildBody(BODY_EVENT_ID, buildJabsBattler(false, false, 100)));

      // Act
      JabsBossManager.startEncounter('gluttonwolf');

      // Assert
      expect(JabsBossManager.hasActiveEncounter()).toBe(true);
    });

    it('skips the check when no name was recorded to check against', () =>
    {
      // Arrange
      JabsBossManager.registerEncounters([ buildEncounter('', '', true) ]);
      $jabsEngine.addEnemyToMap.mockReturnValue(buildBody(BODY_EVENT_ID, buildJabsBattler(false, false, 100)));

      // Act
      const act = () => JabsBossManager.startEncounter('gluttonwolf');

      // Assert- the fight running is what proves the empty names were let through.
      expect(act).not.toThrow();
      expect(JabsBossManager.hasActiveEncounter()).toBe(true);
    });
  });

  describe('step validation', () =>
  {
    /**
     * Registers the twin fight with one reaction to the fight beginning, made of the given steps, and
     * returns what starting it does.
     * @param {JabsBossStep[]} steps The steps to validate.
     * @param {JabsBossRoutine[]} routines The routines the encounter has.
     * @returns {Function} Starting the fight.
     */
    const startingWithSteps = (steps, routines = []) =>
    {
      JabsBossManager.registerEncounters([ buildTwinEncounter([ onStart(steps) ], routines) ]);

      return () => JabsBossManager.startEncounter('twins');
    };

    it('throws before spawning anything when an added state no longer carries its authored name', () =>
    {
      // Arrange
      const act = startingWithSteps([ addStateStep('twin', 'Stunned') ]);

      // Act & Assert
      expect(act).toThrow(/reaction \[ opening ] state id \[ 2072 ] was authored as \[ Stunned ] but is now \[ Sealed ]/);
      expect($jabsEngine.addEnemyToMap).not.toHaveBeenCalled();
    });

    it('throws when a removed state no longer carries its authored name', () =>
    {
      // Arrange
      const act = startingWithSteps([ removeStateStep('twin', 'Stunned') ]);

      // Act & Assert
      expect(act).toThrow(/state id \[ 2072 ] was authored as \[ Stunned ] but is now \[ Sealed ]/);
    });

    it('throws when a state step names a participant the encounter does not have', () =>
    {
      // Arrange
      const act = startingWithSteps([ addStateStep('ghost') ]);

      // Act & Assert
      expect(act).toThrow(/reaction \[ opening ] names participant \[ ghost ], but the encounter has nobody by that name/);
    });

    it('throws when a forced skill names a participant the encounter does not have', () =>
    {
      // Arrange
      const act = startingWithSteps([ forceSkillStep('ghost') ]);

      // Act & Assert
      expect(act).toThrow(/names participant \[ ghost ]/);
    });

    it('throws when a change of look names a participant the encounter does not have', () =>
    {
      // Arrange
      const act = startingWithSteps([ changeImageStep('ghost') ]);

      // Act & Assert
      expect(act).toThrow(/names participant \[ ghost ]/);
    });

    it('throws when a quickening names a routine the encounter does not have', () =>
    {
      // Arrange- the encounter has a routine, just not one by this name.
      const routine = new JabsBossRoutine('rocks', CADENCE_FRAMES, [ forceSkillStep('') ]);
      const quicken = new JabsBossStep('quickenRoutine', stepDetails({ routineKey: 'rokcs', frames: 60 }));
      const act = startingWithSteps([ quicken ], [ routine ]);

      // Act & Assert
      expect(act).toThrow(/names routine \[ rokcs ], but the encounter has no routine by that name/);
    });
  });

  describe('reaction validation', () =>
  {
    it('throws before spawning anything when a reaction answers a moment no fight has', () =>
    {
      // Arrange
      const reaction = new JabsBossReaction('typo', 'fell', [ 'twin' ], []);
      JabsBossManager.registerEncounters([ buildTwinEncounter([ reaction ]) ]);

      // Act
      const act = () => JabsBossManager.startEncounter('twins');

      // Assert
      expect(act).toThrow(/reaction \[ typo ] answers \[ fell ], which is not a moment a fight has/);
      expect($jabsEngine.addEnemyToMap).not.toHaveBeenCalled();
    });

    it('throws when a fallen reaction waits on nobody, since it would fire at once', () =>
    {
      // Arrange
      JabsBossManager.registerEncounters([ buildTwinEncounter([ onFallen([], []) ]) ]);

      // Act
      const act = () => JabsBossManager.startEncounter('twins');

      // Assert
      expect(act).toThrow(/reaction \[ fell ] waits on nobody falling/);
    });

    it('throws when a fallen reaction waits on a participant the encounter does not have', () =>
    {
      // Arrange- one real name beside the misspelled one, so a check of only the first would pass it.
      JabsBossManager.registerEncounters([ buildTwinEncounter([ onFallen([ 'twin', 'twni' ], []) ]) ]);

      // Act
      const act = () => JabsBossManager.startEncounter('twins');

      // Assert
      expect(act).toThrow(/reaction \[ fell ] names participant \[ twni ]/);
    });
  });

  describe('start reactions', () =>
  {
    it('seals the named participant the moment the fight begins, as its own source', () =>
    {
      // Arrange & Act
      const { mayorBattler, twinBattler } = startTwins([ onStart([ addStateStep('twin') ]) ]);

      // Assert- the twin sealed itself, and the boss beside it was left alone.
      const twin = twinBattler.getBattler();
      expect(twin.addState).toHaveBeenCalledWith(STATE_ID, twin);
      expect(mayorBattler.getBattler().addState).not.toHaveBeenCalled();
    });

    it('acts on the boss when a step names nobody', () =>
    {
      // Arrange & Act
      const { mayorBattler, twinBattler } = startTwins([ onStart([ addStateStep('') ]) ]);

      // Assert
      const mayor = mayorBattler.getBattler();
      expect(mayor.addState).toHaveBeenCalledWith(STATE_ID, mayor);
      expect(twinBattler.getBattler().addState).not.toHaveBeenCalled();
    });

    it('changes a participant into its new look the moment the fight begins', () =>
    {
      // Arrange & Act
      const { mayorBattler, twinBattler } = startTwins([ onStart([ changeImageStep('twin') ]) ]);

      // Assert
      expect(twinBattler.getCharacter().setImage).toHaveBeenCalledWith(IMAGE_NAME, IMAGE_INDEX);
      expect(mayorBattler.getCharacter().setImage).not.toHaveBeenCalled();
    });

    it('never fires its opening moves again once the fight is underway', () =>
    {
      // Arrange
      const { twinBattler } = startTwins([ onStart([ addStateStep('twin') ]) ]);

      // Act
      JabsBossManager.update();
      JabsBossManager.update();
      JabsBossManager.update();

      // Assert- sealed once as the fight began, and not once per frame after it.
      expect(twinBattler.getBattler().addState).toHaveBeenCalledTimes(1);
    });

    it('fires no reaction to bodies falling as the fight begins', () =>
    {
      // Arrange & Act- nobody has fallen yet, so only a reaction fired for the wrong moment could run.
      const { mayorBattler } = startTwins([ onFallen([ 'twin' ], [ removeStateStep('mayor') ]) ]);

      // Assert
      expect(mayorBattler.getBattler().removeState).not.toHaveBeenCalled();
    });
  });

  describe('fallen reactions', () =>
  {
    it('fires once every body it waits on has fallen', () =>
    {
      // Arrange
      const { mayorBattler, twinBody } = startTwins([ onFallen([ 'twin' ], [ removeStateStep('mayor') ]) ]);
      twinBody.isErased.mockReturnValue(true);

      // Act
      JabsBossManager.update();

      // Assert
      expect(mayorBattler.getBattler().removeState).toHaveBeenCalledWith(STATE_ID);
    });

    it('holds while any one body it waits on is still standing', () =>
    {
      // Arrange- of the two bodies it waits on only the twin has fallen.
      const { mayorBattler, twinBody } = startTwins([ onFallen([ 'mayor', 'twin' ], [ removeStateStep('mayor') ]) ]);
      twinBody.isErased.mockReturnValue(true);

      // Act
      JabsBossManager.update();

      // Assert
      expect(mayorBattler.getBattler().removeState).not.toHaveBeenCalled();
    });

    it('fires only once, however long its bodies stay fallen', () =>
    {
      // Arrange
      const { mayorBattler, twinBody } = startTwins([ onFallen([ 'twin' ], [ removeStateStep('mayor') ]) ]);
      twinBody.isErased.mockReturnValue(true);

      // Act
      JabsBossManager.update();
      JabsBossManager.update();
      JabsBossManager.update();

      // Assert
      expect(mayorBattler.getBattler().removeState).toHaveBeenCalledTimes(1);
    });

    it('starts a rematch with every reaction unspent', () =>
    {
      // Arrange- the reaction fires in the first attempt, then the fight starts over with fresh bodies.
      const reactions = [ onFallen([ 'twin' ], [ removeStateStep('mayor') ]) ];
      const first = startTwins(reactions);
      first.twinBody.isErased.mockReturnValue(true);
      JabsBossManager.update();
      const second = startTwins(reactions);
      second.twinBody.isErased.mockReturnValue(true);

      // Act
      JabsBossManager.update();

      // Assert
      expect(first.mayorBattler.getBattler().removeState).toHaveBeenCalledTimes(1);
      expect(second.mayorBattler.getBattler().removeState).toHaveBeenCalledTimes(1);
    });

    it('skips taking a state off a body that has already fallen, and carries on with the rest', () =>
    {
      // Arrange- the twin is the one that fell, so it has no battler left to unseal.
      const steps = [ removeStateStep('twin'), addStateStep('mayor') ];
      const { mayorBattler, twinBattler, twinBody } = startTwins([ onFallen([ 'twin' ], steps) ]);
      twinBody.isErased.mockReturnValue(true);

      // Act
      JabsBossManager.update();

      // Assert- the step after it still ran, so the reaction did fire.
      expect(twinBattler.getBattler().removeState).not.toHaveBeenCalled();
      expect(mayorBattler.getBattler().addState).toHaveBeenCalledTimes(1);
    });

    it('skips putting a state on a body that has already fallen', () =>
    {
      // Arrange
      const steps = [ addStateStep('twin'), removeStateStep('mayor') ];
      const { mayorBattler, twinBattler, twinBody } = startTwins([ onFallen([ 'twin' ], steps) ]);
      twinBody.isErased.mockReturnValue(true);

      // Act
      JabsBossManager.update();

      // Assert
      expect(twinBattler.getBattler().addState).not.toHaveBeenCalled();
      expect(mayorBattler.getBattler().removeState).toHaveBeenCalledTimes(1);
    });

    it('skips changing the look of a body that has already fallen', () =>
    {
      // Arrange
      const steps = [ changeImageStep('twin'), removeStateStep('mayor') ];
      const { mayorBattler, twinBattler, twinBody } = startTwins([ onFallen([ 'twin' ], steps) ]);
      twinBody.isErased.mockReturnValue(true);

      // Act
      JabsBossManager.update();

      // Assert
      expect(twinBattler.getCharacter().setImage).not.toHaveBeenCalled();
      expect(mayorBattler.getBattler().removeState).toHaveBeenCalledTimes(1);
    });

    it('skips forcing a skill through a body that has already fallen', () =>
    {
      // Arrange
      const steps = [ forceSkillStep('twin'), removeStateStep('mayor') ];
      const { mayorBattler, twinBody } = startTwins([ onFallen([ 'twin' ], steps) ]);
      twinBody.isErased.mockReturnValue(true);

      // Act
      JabsBossManager.update();

      // Assert
      expect($jabsEngine.forceMapAction).not.toHaveBeenCalled();
      expect(mayorBattler.getBattler().removeState).toHaveBeenCalledTimes(1);
    });

    it('forces a skill through the participant a step names', () =>
    {
      // Arrange
      const { mayorBattler, twinBody } = startTwins([ onFallen([ 'twin' ], [ forceSkillStep('mayor') ]) ]);
      twinBody.isErased.mockReturnValue(true);

      // Act
      JabsBossManager.update();

      // Assert
      expect($jabsEngine.forceMapAction).toHaveBeenCalledWith(mayorBattler, SKILL_ID, false);
    });
  });

  describe('quickenRoutine', () =>
  {
    /**
     * Starts the twin fight with the mayor forcing a skill on a routine, and the twin's fall quickening it.
     * @param {number} frames How many frames the twin's fall takes off the routine's cadence.
     * @returns {object} The twin's body.
     */
    const startQuickened = frames =>
    {
      const routine = new JabsBossRoutine('rocks', CADENCE_FRAMES, [ forceSkillStep('') ]);
      const quicken = new JabsBossStep('quickenRoutine', stepDetails({ routineKey: 'rocks', frames }));
      const { twinBody } = startTwins([ onFallen([ 'twin' ], [ quicken ]) ], [ routine ]);

      return twinBody;
    };

    /**
     * Runs the fight for the given number of frames and notes on which of them the routine executed.
     * @param {number} frameCount How many frames to run.
     * @returns {number[]} The frames, counted from one, on which the routine executed.
     */
    const executionFrames = frameCount =>
    {
      const executedOn = [];
      for (let frame = 1; frame <= frameCount; frame++)
      {
        const before = $jabsEngine.forceMapAction.mock.calls.length;
        JabsBossManager.update();
        if ($jabsEngine.forceMapAction.mock.calls.length > before) executedOn.push(frame);
      }

      return executedOn;
    };

    it('brings the next execution forward, and keeps the routine faster from then on', () =>
    {
      // Arrange- twelve hundred frames between rocks, three hundred taken off the moment the twin falls.
      const twinBody = startQuickened(300);
      twinBody.isErased.mockReturnValue(true);

      // Act
      const executedOn = executionFrames(1900);

      // Assert- nine hundred frames from the fall to the first rock, then nine hundred between each.
      expect(executedOn).toEqual([ 901, 1802 ]);
    });

    it('runs a routine quickened past nothing on every frame its boss can act', () =>
    {
      // Arrange
      const twinBody = startQuickened(CADENCE_FRAMES + 600);
      twinBody.isErased.mockReturnValue(true);

      // Act
      const executedOn = executionFrames(3);

      // Assert
      expect(executedOn).toEqual([ 1, 2, 3 ]);
    });

    it('leaves the routine at its authored pace until the reaction fires', () =>
    {
      // Arrange- the twin stays standing, so nothing quickens.
      startQuickened(300);

      // Act
      const executedOn = executionFrames(1300);

      // Assert
      expect(executedOn).toEqual([ 1201 ]);
    });
  });

  describe('boss resolution', () =>
  {
    it('reports no battler when no encounter is running', () =>
    {
      // Arrange
      // no encounter started.

      // Act
      const gameBattler = JabsBossManager.getBossGameBattler();

      // Assert
      expect(gameBattler).toBeNull();
    });

    it('reports no battler once the body has left its slot to something else', () =>
    {
      // Arrange- the boss despawned and loot dropped into the slot it freed; the slot answers, but
      // with a body that is not the boss.
      startWithBoss(buildJabsBattler(false, false, 100));
      $gameMap.event.mockReturnValue(buildBody(BODY_EVENT_ID, buildJabsBattler(false, false, 100)));

      // Act
      const jabsBattler = JabsBossManager.getBossJabsBattler();

      // Assert
      expect(jabsBattler).toBeNull();
    });

    it('reports no battler once the body has fallen and been erased, though it keeps its slot', () =>
    {
      // Arrange- the map still holds the body and the body still answers for a battler, so only the
      // erasure itself can explain a null.
      const body = startWithBoss(buildJabsBattler(true, false, 0));
      body.isErased.mockReturnValue(true);

      // Act
      const jabsBattler = JabsBossManager.getBossJabsBattler();

      // Assert
      expect(jabsBattler).toBeNull();
    });

    it('reports zero health percent when there is no boss to measure', () =>
    {
      // Arrange
      // no encounter started.

      // Act
      const hpPercent = JabsBossManager.getBossHpPercent();

      // Assert
      expect(hpPercent).toBe(0);
    });

    it('reports the boss health percent when a boss is present', () =>
    {
      // Arrange
      startWithBoss(buildJabsBattler(false, false, 42));

      // Act
      const hpPercent = JabsBossManager.getBossHpPercent();

      // Assert
      expect(hpPercent).toBe(42);
    });

    it('answers below-threshold questions against the live boss', () =>
    {
      // Arrange- the boss sits at 40%, so a threshold of 40 is the inclusive edge and a threshold
      // of 30 is beneath it.
      startWithBoss(buildJabsBattler(false, false, 40));

      // Act
      const isBelowEdge = JabsBossManager.isBossBelowHpThreshold(40);
      const isBelowLower = JabsBossManager.isBossBelowHpThreshold(30);

      // Assert
      expect(isBelowEdge).toBe(true);
      expect(isBelowLower).toBe(false);
    });

    it('answers above-threshold questions against the live boss', () =>
    {
      // Arrange- the boss sits at 40%, so a threshold of 40 is the inclusive edge and a threshold
      // of 60 is out of reach above it.
      startWithBoss(buildJabsBattler(false, false, 40));

      // Act
      const isAboveEdge = JabsBossManager.isBossAboveHpThreshold(40);
      const isAboveHigher = JabsBossManager.isBossAboveHpThreshold(60);

      // Assert
      expect(isAboveEdge).toBe(true);
      expect(isAboveHigher).toBe(false);
    });

    it('answers threshold questions false when there is no boss', () =>
    {
      // Arrange
      // no encounter started.

      // Act
      const isBelow = JabsBossManager.isBossBelowHpThreshold(50);
      const isAbove = JabsBossManager.isBossAboveHpThreshold(50);

      // Assert
      expect(isBelow).toBe(false);
      expect(isAbove).toBe(false);
    });
  });

  describe('update', () =>
  {
    it('does nothing when no encounter is running', () =>
    {
      // Arrange
      // no encounter started.

      // Act
      JabsBossManager.update();

      // Assert
      expect($gameMap.event).not.toHaveBeenCalled();
    });

    it('executes a routine once its cadence has fully elapsed', () =>
    {
      // Arrange
      startWithBoss(buildJabsBattler(false, false, 100), false);

      // Act
      for (let frame = 0; frame <= CADENCE_FRAMES; frame++)
      {
        JabsBossManager.update();
      }

      // Assert
      expect($jabsEngine.forceMapAction).toHaveBeenCalledTimes(1);
    });

    it('skips the execution rather than queueing it when the boss is mid-cast', () =>
    {
      // Arrange
      startWithBoss(buildJabsBattler(false, true, 100), false);

      // Act
      for (let frame = 0; frame <= CADENCE_FRAMES + 5; frame++)
      {
        JabsBossManager.update();
      }

      // Assert
      expect($jabsEngine.forceMapAction).not.toHaveBeenCalled();
    });

    it('skips the execution when the boss is already defeated', () =>
    {
      // Arrange
      startWithBoss(buildJabsBattler(true, false, 0), false);

      // Act
      for (let frame = 0; frame <= CADENCE_FRAMES; frame++)
      {
        JabsBossManager.update();
      }

      // Assert
      expect($jabsEngine.forceMapAction).not.toHaveBeenCalled();
    });

    it('holds every routine where it is while an event is running, rather than counting through it', () =>
    {
      // Arrange- a scene plays out for longer than a whole cadence.
      startWithBoss(buildJabsBattler(false, false, 100), false);
      $gameMap.isEventRunning.mockReturnValue(true);
      for (let frame = 0; frame <= CADENCE_FRAMES + 10; frame++)
      {
        JabsBossManager.update();
      }
      $gameMap.isEventRunning.mockReturnValue(false);

      // Act- a held countdown still has its whole cadence ahead of it once the scene ends.
      for (let frame = 0; frame < CADENCE_FRAMES; frame++)
      {
        JabsBossManager.update();
      }
      const firedBeforeFullCadence = $jabsEngine.forceMapAction.mock.calls.length;
      JabsBossManager.update();

      // Assert
      expect(firedBeforeFullCadence).toBe(0);
      expect($jabsEngine.forceMapAction).toHaveBeenCalledTimes(1);
    });

    it('holds every routine where it is while a message is on screen', () =>
    {
      // Arrange
      startWithBoss(buildJabsBattler(false, false, 100), false);
      $gameMessage.isBusy.mockReturnValue(true);

      // Act
      for (let frame = 0; frame <= CADENCE_FRAMES + 10; frame++)
      {
        JabsBossManager.update();
      }

      // Assert- the boss could act, its cadence elapsed, and only the message stood in the way.
      expect($jabsEngine.forceMapAction).not.toHaveBeenCalled();
      $gameMessage.isBusy.mockReturnValue(false);
      for (let frame = 0; frame <= CADENCE_FRAMES; frame++)
      {
        JabsBossManager.update();
      }
      expect($jabsEngine.forceMapAction).toHaveBeenCalledTimes(1);
    });

    it('skips the execution when the participant has no body on the map', () =>
    {
      // Arrange- the boss despawned and nothing has taken its slot since.
      startWithBoss(buildJabsBattler(false, false, 100), false);
      $gameMap.event.mockReturnValue(undefined);

      // Act
      for (let frame = 0; frame <= CADENCE_FRAMES; frame++)
      {
        JabsBossManager.update();
      }

      // Assert
      expect($jabsEngine.forceMapAction).not.toHaveBeenCalled();
    });
  });

  describe('defeat', () =>
  {
    it('turns the defeat switch on once every body has fallen in the arena', () =>
    {
      // Arrange
      const body = startWithBoss(buildJabsBattler(true, false, 0));
      body.isErased.mockReturnValue(true);

      // Act
      JabsBossManager.update();

      // Assert
      expect($gameSwitches.setValue).toHaveBeenCalledWith(DEFEAT_SWITCH_ID, true);
      expect(JabsBossManager.isBossDefeated()).toBe(true);
    });

    it('keeps the fight going while any one body is still standing', () =>
    {
      // Arrange- of two bodies only the mayor has fallen, so a check satisfied by any single fallen body
      // would call this fight won.
      JabsBossManager.registerEncounters([ buildTwinEncounter() ]);
      const mayorBody = buildBody(BODY_EVENT_ID, buildJabsBattler(true, false, 0));
      const twinBody = buildBody(TWIN_BODY_EVENT_ID, buildJabsBattler(false, false, 100, TWIN_ENEMY_ID));
      $jabsEngine.addEnemyToMap
        .mockReturnValueOnce(mayorBody)
        .mockReturnValueOnce(twinBody);
      holdOnMap([ mayorBody, twinBody ]);
      JabsBossManager.startEncounter('twins');
      mayorBody.isErased.mockReturnValue(true);

      // Act
      JabsBossManager.update();

      // Assert
      expect(JabsBossManager.isBossDefeated()).toBe(false);
      expect($gameSwitches.setValue).not.toHaveBeenCalled();
    });

    it('turns no switch on for a fight won away from its arena, though the fight is still won', () =>
    {
      // Arrange- the same fight, staged in a test hall on a map of its own.
      const body = startWithBoss(buildJabsBattler(true, false, 0));
      $gameMap.mapId.mockReturnValue(HALL_MAP_ID);
      body.isErased.mockReturnValue(true);

      // Act
      JabsBossManager.update();

      // Assert- the win is settled, so only the arena check can explain the switch staying off.
      expect(JabsBossManager.isBossDefeated()).toBe(true);
      expect($gameSwitches.setValue).not.toHaveBeenCalled();
    });

    it('turns no switch on for a fight that names none, though the fight is still won', () =>
    {
      // Arrange
      const body = startWithBoss(buildJabsBattler(true, false, 0), true, 0);
      body.isErased.mockReturnValue(true);

      // Act
      JabsBossManager.update();

      // Assert- won in its own arena, so only the missing switch can explain nothing being turned on.
      expect(JabsBossManager.isBossDefeated()).toBe(true);
      expect($gameSwitches.setValue).not.toHaveBeenCalled();
    });

    it('turns the switch on only once, however long the fight stays won', () =>
    {
      // Arrange
      const body = startWithBoss(buildJabsBattler(true, false, 0));
      body.isErased.mockReturnValue(true);

      // Act
      JabsBossManager.update();
      JabsBossManager.update();
      JabsBossManager.update();

      // Assert
      expect($gameSwitches.setValue).toHaveBeenCalledTimes(1);
    });

    it('waits for a scene on screen to finish before telling the story the fight is won', () =>
    {
      // Arrange- the body has fallen, but something else is still playing out.
      const body = startWithBoss(buildJabsBattler(true, false, 0));
      body.isErased.mockReturnValue(true);
      $gameMap.isEventRunning.mockReturnValue(true);
      JabsBossManager.update();
      const flippedDuringScene = $gameSwitches.setValue.mock.calls.length;
      $gameMap.isEventRunning.mockReturnValue(false);

      // Act
      JabsBossManager.update();

      // Assert
      expect(flippedDuringScene).toBe(0);
      expect($gameSwitches.setValue).toHaveBeenCalledWith(DEFEAT_SWITCH_ID, true);
    });

    it('starts a rematch unwon, even over the top of a fight already won', () =>
    {
      // Arrange- the fight is won, then started again the way a test hall restarts it.
      const fallenBody = startWithBoss(buildJabsBattler(true, false, 0));
      fallenBody.isErased.mockReturnValue(true);
      JabsBossManager.update();
      const wonBeforeRematch = JabsBossManager.isBossDefeated();
      const freshBody = buildBody(BODY_EVENT_ID, buildJabsBattler(false, false, 100));
      $jabsEngine.addEnemyToMap.mockReturnValue(freshBody);
      holdOnMap([ freshBody ]);

      // Act
      JabsBossManager.startEncounter('gluttonwolf');

      // Assert
      expect(wonBeforeRematch).toBe(true);
      expect(JabsBossManager.isBossDefeated()).toBe(false);
    });
  });

  describe('forceSkill', () =>
  {
    it('uses the instant path when the step declines its cast time', () =>
    {
      // Arrange
      const jabsBattler = buildJabsBattler(false, false, 100);
      startWithBoss(jabsBattler, false);

      // Act
      for (let frame = 0; frame <= CADENCE_FRAMES; frame++)
      {
        JabsBossManager.update();
      }

      // Assert
      expect($jabsEngine.forceMapAction).toHaveBeenCalledWith(jabsBattler, SKILL_ID, false);
      expect(jabsBattler.setCastCountdown).not.toHaveBeenCalled();
    });

    it('preserves the telegraph by routing through the cast pipeline when asked to', () =>
    {
      // Arrange
      const jabsBattler = buildJabsBattler(false, false, 100);
      startWithBoss(jabsBattler, true);

      // Act
      for (let frame = 0; frame <= CADENCE_FRAMES; frame++)
      {
        JabsBossManager.update();
      }

      // Assert
      expect(jabsBattler.setDecidedAction).toHaveBeenCalledTimes(1);
      expect(jabsBattler.setCastCountdown).toHaveBeenCalledWith(CAST_TIME);
      expect(jabsBattler.setPhase).toHaveBeenCalledWith(2);
      expect($jabsEngine.forceMapAction).not.toHaveBeenCalled();
    });

    it('leaves a boss that can move to walk into position for its skill, as any battler would', () =>
    {
      // Arrange
      const jabsBattler = buildJabsBattler(false, false, 100);
      startWithBoss(jabsBattler, true);

      // Act
      for (let frame = 0; frame <= CADENCE_FRAMES; frame++)
      {
        JabsBossManager.update();
      }

      // Assert- the skill was decided, so only the boss being free to move explains no position given.
      expect(jabsBattler.setDecidedAction).toHaveBeenCalledTimes(1);
      expect(jabsBattler.setInPosition).not.toHaveBeenCalled();
    });

    it('lets a boss held in place cast from where it stands, since it can never walk into position', () =>
    {
      // Arrange- a sealed boss: rooted, so walking into range is the one step it can never take.
      const jabsBattler = buildJabsBattler(false, false, 100);
      jabsBattler.canBattlerMove.mockReturnValue(false);
      startWithBoss(jabsBattler, true);

      // Act
      for (let frame = 0; frame <= CADENCE_FRAMES; frame++)
      {
        JabsBossManager.update();
      }

      // Assert
      expect(jabsBattler.setInPosition).toHaveBeenCalledWith(true);
    });

    /**
     * Starts a fight whose routine forces its cast, and plays it up to the frame the cast is forced.
     * @param {object} jabsBattler The boss.
     */
    const forceTheCast = jabsBattler =>
    {
      startWithBoss(jabsBattler, true);
      for (let frame = 0; frame <= CADENCE_FRAMES; frame++)
      {
        JabsBossManager.update();
      }
    };

    it('fires a forced cast once its windup ends, when the boss\'s own AI never did', () =>
    {
      // Arrange- the boss stands beyond J-ABS's AI range, so nothing else will ever fire its windup.
      const jabsBattler = buildJabsBattler(false, false, 100);
      forceTheCast(jabsBattler);
      JABS_AiManager.needsActionExecution.mockReturnValue(true);

      // Act- the frame the windup ends, and the next.
      JabsBossManager.update();
      JabsBossManager.update();

      // Assert- fired once by the AI's own hand, and never again.
      expect(JABS_AiManager.executeAiPhase2Action).toHaveBeenCalledTimes(1);
      expect(JABS_AiManager.executeAiPhase2Action).toHaveBeenCalledWith(jabsBattler);
    });

    it('leaves a forced cast winding up while its windup still plays', () =>
    {
      // Arrange
      const jabsBattler = buildJabsBattler(false, false, 100);
      forceTheCast(jabsBattler);

      // Act
      JabsBossManager.update();

      // Assert- the windup was looked at, and found still playing.
      expect(JABS_AiManager.needsActionExecution).toHaveBeenCalledWith(jabsBattler);
      expect(JABS_AiManager.executeAiPhase2Action).not.toHaveBeenCalled();
    });

    it('lets go of a forced cast the boss\'s own AI has already fired', () =>
    {
      // Arrange- the AI fired it and moved on, so the boss has nothing decided any more.
      const jabsBattler = buildJabsBattler(false, false, 100);
      forceTheCast(jabsBattler);
      jabsBattler.setDecidedAction([]);
      JABS_AiManager.needsActionExecution.mockReturnValue(true);

      // Act
      JabsBossManager.update();

      // Assert
      expect(JABS_AiManager.needsActionExecution).not.toHaveBeenCalled();
      expect(JABS_AiManager.executeAiPhase2Action).not.toHaveBeenCalled();
    });

    it('lands nothing for a boss that falls before its windup ends', () =>
    {
      // Arrange
      const jabsBattler = buildJabsBattler(false, false, 100);
      forceTheCast(jabsBattler);
      jabsBattler.getBattler().isDead = () => true;
      JABS_AiManager.needsActionExecution.mockReturnValue(true);

      // Act
      JabsBossManager.update();

      // Assert
      expect(JABS_AiManager.needsActionExecution).not.toHaveBeenCalled();
      expect(JABS_AiManager.executeAiPhase2Action).not.toHaveBeenCalled();
    });

    it('takes no forced cast of an old fight into a fight started over the top of it', () =>
    {
      // Arrange- a windup left over from the fight before, which a new start must forget.
      const jabsBattler = buildJabsBattler(false, false, 100);
      forceTheCast(jabsBattler);
      JabsBossManager.startEncounter('gluttonwolf');
      JABS_AiManager.needsActionExecution.mockReturnValue(true);

      // Act
      JabsBossManager.update();

      // Assert
      expect(JABS_AiManager.executeAiPhase2Action).not.toHaveBeenCalled();
    });

    it('throws when a step names a verb the manager does not implement', () =>
    {
      // Arrange
      const participant = new JabsBossParticipant('mayor', ENEMY_ID, ENEMY_NAME, SPAWN_X, SPAWN_Y, ENEMY_ID);
      const step = new JabsBossStep('teleport', stepDetails({ skillId: SKILL_ID, expect: SKILL_NAME }));
      const routine = new JabsBossRoutine('blink', 1, [ step ]);
      const encounter = new JabsBossEncounter('bad-verb', ARENA_MAP_ID, [ participant ], 'shared', [ routine ], 0, []);
      JabsBossManager.registerEncounters([ encounter ]);
      const body = buildBody(BODY_EVENT_ID, buildJabsBattler(false, false, 100));
      $jabsEngine.addEnemyToMap.mockReturnValue(body);
      holdOnMap([ body ]);
      JabsBossManager.startEncounter('bad-verb');

      // Act
      const act = () =>
      {
        JabsBossManager.update();
        JabsBossManager.update();
      };

      // Assert
      expect(act).toThrow(/Unrecognized boss step verb: \[ teleport ]/);
    });
  });

  describe('endEncounter', () =>
  {
    it('clears the active encounter so a retry starts clean', () =>
    {
      // Arrange
      startWithBoss(buildJabsBattler(false, false, 100));

      // Act
      JabsBossManager.endEncounter();

      // Assert
      expect(JabsBossManager.hasActiveEncounter()).toBe(false);
      expect(JabsBossManager.activeEncounter()).toBeNull();
    });

    it('forgets the bodies it spawned, even one still standing on the map', () =>
    {
      // Arrange
      const body = startWithBoss(buildJabsBattler(false, false, 100));
      const participant = JabsBossManager.activeEncounter()
        .primaryParticipant();

      // Act
      JabsBossManager.endEncounter();

      // Assert- the map still holds the body, so only the manager forgetting it can explain the null.
      expect($gameMap.event(BODY_EVENT_ID)).toBe(body);
      expect(JabsBossManager.getParticipantJabsBattler(participant)).toBeNull();
    });

    it('forgets a fight already won', () =>
    {
      // Arrange
      const body = startWithBoss(buildJabsBattler(true, false, 0));
      body.isErased.mockReturnValue(true);
      JabsBossManager.update();
      const wonBeforeEnding = JabsBossManager.isBossDefeated();

      // Act
      JabsBossManager.endEncounter();

      // Assert
      expect(wonBeforeEnding).toBe(true);
      expect(JabsBossManager.isBossDefeated()).toBe(false);
    });
  });

  describe('isParticipant', () =>
  {
    /**
     * Builds a battler standing in the given body, the way J-ABS hands a battler its event.
     * @param {object} body The event the battler stands in.
     * @returns {object} The stand-in battler.
     */
    const battlerIn = body => ({ getCharacter: () => body });

    it('answers yes for the body a participant was spawned as', () =>
    {
      // Arrange
      const body = startWithBoss(buildJabsBattler(false, false, 100));

      // Act
      const isParticipant = JabsBossManager.isParticipant(battlerIn(body));

      // Assert
      expect(isParticipant).toBe(true);
    });

    it('answers no for something the same fight spawned for itself', () =>
    {
      // Arrange- the hazard arrives with the fight, but nobody has to fell it to win.
      const hazard = buildHazard();
      startFlaring(buildJabsBattler(false, false, 100), [ onStart([ spawnStep() ]) ], [ hazard ]);

      // Act
      const isParticipant = JabsBossManager.isParticipant(battlerIn(hazard));

      // Assert
      expect(isParticipant).toBe(false);
    });

    it('answers no once the fight is over, even for the body that was the boss', () =>
    {
      // Arrange
      const body = startWithBoss(buildJabsBattler(false, false, 100));
      JabsBossManager.endEncounter();

      // Act
      const isParticipant = JabsBossManager.isParticipant(battlerIn(body));

      // Assert
      expect(isParticipant).toBe(false);
    });
  });

  describe('health reactions', () =>
  {
    it('fires once the boss is worn down to its percent, counting the percent itself', () =>
    {
      // Arrange
      const jabsBattler = buildJabsBattler(false, false, 100);
      startFlaring(jabsBattler, [ onHealth(66, [ addStateStep('') ]) ]);
      jabsBattler.getBattler().currentHpPercent100.mockReturnValue(66);

      // Act
      JabsBossManager.update();

      // Assert
      expect(jabsBattler.getBattler().addState).toHaveBeenCalledTimes(1);
      expect(jabsBattler.getBattler().addState).toHaveBeenCalledWith(STATE_ID, jabsBattler.getBattler());
    });

    it('holds while the boss is still above its percent', () =>
    {
      // Arrange
      const jabsBattler = buildJabsBattler(false, false, 67);
      startFlaring(jabsBattler, [ onHealth(66, [ addStateStep('') ]) ]);

      // Act
      JabsBossManager.update();

      // Assert
      expect(jabsBattler.getBattler().addState).not.toHaveBeenCalled();
    });

    it('fires only once, however long the boss stays worn down', () =>
    {
      // Arrange
      const jabsBattler = buildJabsBattler(false, false, 20);
      startFlaring(jabsBattler, [ onHealth(66, [ addStateStep('') ]) ]);

      // Act
      JabsBossManager.update();
      JabsBossManager.update();
      JabsBossManager.update();

      // Assert
      expect(jabsBattler.getBattler().addState).toHaveBeenCalledTimes(1);
    });

    it('watches the participant it names rather than the boss', () =>
    {
      // Arrange- only the twin is worn down, so only the reaction watching the twin may fire.
      const watchTwin = onHealth(66, [ addStateStep('twin') ], [ 'twin' ]);
      const watchMayor = onHealth(66, [ addStateStep('mayor') ], [ 'mayor' ]);
      const { mayorBattler, twinBattler } = startTwins([ watchTwin, watchMayor ]);
      twinBattler.getBattler().currentHpPercent100.mockReturnValue(50);

      // Act
      JabsBossManager.update();

      // Assert
      expect(twinBattler.getBattler().addState).toHaveBeenCalledTimes(1);
      expect(mayorBattler.getBattler().addState).not.toHaveBeenCalled();
    });

    it('waits until every participant it names is worn down', () =>
    {
      // Arrange
      const both = onHealth(66, [ addStateStep('mayor') ], [ 'mayor', 'twin' ]);
      const { mayorBattler, twinBattler } = startTwins([ both ]);
      twinBattler.getBattler().currentHpPercent100.mockReturnValue(50);
      JabsBossManager.update();
      const firedWhileMayorStood = mayorBattler.getBattler().addState.mock.calls.length;

      // Act
      mayorBattler.getBattler().currentHpPercent100.mockReturnValue(60);
      JabsBossManager.update();

      // Assert
      expect(firedWhileMayorStood).toBe(0);
      expect(mayorBattler.getBattler().addState).toHaveBeenCalledTimes(1);
    });

    it('never answers a boss that has already fallen, however low it fell', () =>
    {
      // Arrange- the body is still on the map and well under the percent; only its falling stops the reaction.
      const jabsBattler = buildJabsBattler(true, false, 0);
      startFlaring(jabsBattler, [ onHealth(66, [ addStateStep('') ]) ]);

      // Act
      JabsBossManager.update();

      // Assert
      expect(jabsBattler.getBattler().addState).not.toHaveBeenCalled();
    });

    it('never answers a boss whose body has left the map', () =>
    {
      // Arrange- worn down and alive, but its slot now holds something else. A tint needs no body, so only
      // the reaction declining to fire can keep the screen untouched.
      startFlaring(buildJabsBattler(false, false, 10), [ onHealth(66, [ tintStep() ]) ]);
      holdOnMap([ buildBody(BODY_EVENT_ID, buildJabsBattler(false, false, 100)) ]);

      // Act
      JabsBossManager.update();

      // Assert
      expect($gameScreen.startTint).not.toHaveBeenCalled();
    });

    it('throws before spawning anything when it waits for no health at all', () =>
    {
      // Arrange
      registerFlaring([ onHealth(0, [ tintStep() ]) ]);

      // Act
      const act = () => JabsBossManager.startEncounter('flaring');

      // Assert
      expect(act).toThrow(/reaction \[ flare ] waits for health at or below \[ 0% ], which is no turning point/);
      expect($jabsEngine.addEnemyToMap).not.toHaveBeenCalled();
    });

    it('throws when it waits for a percent the boss is already at when the fight begins', () =>
    {
      // Arrange
      registerFlaring([ onHealth(100, [ tintStep() ]) ]);

      // Act
      const act = () => JabsBossManager.startEncounter('flaring');

      // Assert
      expect(act).toThrow(/waits for health at or below \[ 100% ], which is no turning point/);
    });

    it('throws when it watches a participant the encounter does not have', () =>
    {
      // Arrange
      registerFlaring([ onHealth(66, [ tintStep() ], [ 'ghost' ]) ]);

      // Act
      const act = () => JabsBossManager.startEncounter('flaring');

      // Assert
      expect(act).toThrow(/reaction \[ flare ] names participant \[ ghost ], but the encounter has nobody/);
    });
  });

  describe('dialogue', () =>
  {
    it('has the participant say the line through an interpreter belonging to its own event', () =>
    {
      // Arrange- the twin speaks, so the line has to belong to the twin's event rather than the boss's.

      // Act
      startTwins([ onStart([ dialogueStep('twin') ]) ]);

      // Assert
      expect(interpreters).toHaveLength(1);
      expect(interpreters[0].setup).toHaveBeenCalledWith([
        { code: 101, indent: 0, parameters: [ '', 0, 0, 2, SPEAKER ] },
        { code: 401, indent: 0, parameters: [ '\\pop[self]BRING IT' ] },
        { code: 401, indent: 0, parameters: [ 'second line' ] },
        { code: 0, indent: 0, parameters: [] },
      ], TWIN_BODY_EVENT_ID);
    });

    it('holds every step behind a line until the player has read it', () =>
    {
      // Arrange
      const jabsBattler = buildJabsBattler(false, false, 100);
      startFlaring(jabsBattler, [ onStart([ dialogueStep(''), addStateStep('') ]) ]);
      JabsBossManager.update();
      const sealedMidLine = jabsBattler.getBattler().addState.mock.calls.length;

      // Act
      interpreters[0].isRunning.mockReturnValue(false);
      JabsBossManager.update();

      // Assert
      expect(sealedMidLine).toBe(0);
      expect(jabsBattler.getBattler().addState).toHaveBeenCalledTimes(1);
    });

    it('advances the line on every frame of the fight it is being said', () =>
    {
      // Arrange
      startFlaring(buildJabsBattler(false, false, 100), [ onStart([ dialogueStep('') ]) ]);

      // Act
      JabsBossManager.update();
      JabsBossManager.update();

      // Assert
      expect(interpreters[0].update).toHaveBeenCalledTimes(2);
    });

    it('lets a scene the map is playing finish before the line goes on', () =>
    {
      // Arrange
      startFlaring(buildJabsBattler(false, false, 100), [ onStart([ dialogueStep('') ]) ]);
      $gameMap.isEventRunning.mockReturnValue(true);

      // Act
      JabsBossManager.update();

      // Assert
      expect(interpreters[0].update).not.toHaveBeenCalled();
    });

    it('stops advancing a line once it has been said', () =>
    {
      // Arrange
      startFlaring(buildJabsBattler(false, false, 100), [ onStart([ dialogueStep('') ]) ]);
      interpreters[0].isRunning.mockReturnValue(false);

      // Act
      JabsBossManager.update();

      // Assert
      expect(interpreters[0].update).not.toHaveBeenCalled();
    });

    it('skips the line of a speaker no longer on the map, and carries on with the rest', () =>
    {
      // Arrange
      const { twinBody, mayorBattler } = startTwins([ onFallen([ 'twin' ], [ dialogueStep('twin'), addStateStep('mayor') ]) ]);
      twinBody.isErased.mockReturnValue(true);

      // Act
      JabsBossManager.update();

      // Assert
      expect(interpreters).toHaveLength(0);
      expect(mayorBattler.getBattler().addState).toHaveBeenCalledTimes(1);
    });

    it('throws before spawning anything when a participant is given nothing to say', () =>
    {
      // Arrange
      registerFlaring([ onStart([ dialogueStep('', []) ]) ]);

      // Act
      const act = () => JabsBossManager.startEncounter('flaring');

      // Assert
      expect(act).toThrow(/reaction \[ opening ] has a participant say nothing at all/);
      expect($jabsEngine.addEnemyToMap).not.toHaveBeenCalled();
    });

    it('throws when a line names a participant the encounter does not have', () =>
    {
      // Arrange
      registerFlaring([ onStart([ dialogueStep('ghost') ]) ]);

      // Act
      const act = () => JabsBossManager.startEncounter('flaring');

      // Assert
      expect(act).toThrow(/reaction \[ opening ] names participant \[ ghost ]/);
    });

    it('starts a fight over the top of another without the old line holding the new fight up', () =>
    {
      // Arrange- the old fight is still mid-line when the next one starts.
      startFlaring(buildJabsBattler(false, false, 100), [ onStart([ dialogueStep('') ]) ]);
      const nextBattler = buildJabsBattler(false, false, 100);

      // Act
      startFlaring(nextBattler, [ onStart([ addStateStep('') ]) ]);

      // Assert
      expect(interpreters[0].isRunning()).toBe(true);
      expect(nextBattler.getBattler().addState).toHaveBeenCalledTimes(1);
    });

    it('drops the steps an old fight was holding behind its line when another starts over the top', () =>
    {
      // Arrange- the step waiting behind the old line names nobody, so it would land on the new boss.
      startFlaring(buildJabsBattler(false, false, 100), [ onStart([ dialogueStep(''), addStateStep('') ]) ]);
      const nextBattler = buildJabsBattler(false, false, 100);
      startFlaring(nextBattler, []);
      interpreters[0].isRunning.mockReturnValue(false);

      // Act
      JabsBossManager.update();

      // Assert
      expect(nextBattler.getBattler().addState).not.toHaveBeenCalled();
    });
  });

  describe('spawn', () =>
  {
    it('puts the named enemy onto its tile from the template it names', () =>
    {
      // Arrange
      const hazard = buildHazard();

      // Act
      startFlaring(buildJabsBattler(false, false, 100), [ onStart([ spawnStep() ]) ], [ hazard ]);

      // Assert
      expect($jabsEngine.addEnemyToMap).toHaveBeenCalledTimes(2);
      expect($jabsEngine.addEnemyToMap).toHaveBeenLastCalledWith(HAZARD_X, HAZARD_Y, HAZARD_TEMPLATE_ID);
    });

    it('throws, naming the spawn, when the clone map holds no event for it', () =>
    {
      // Arrange- the boss spawns, then the hazard's slot comes back empty.
      registerFlaring([ onStart([ spawnStep() ]) ]);
      const body = buildBody(BODY_EVENT_ID, buildJabsBattler(false, false, 100));
      $jabsEngine.addEnemyToMap
        .mockReturnValueOnce(body)
        .mockReturnValueOnce(undefined);

      // Act
      const act = () => JabsBossManager.startEncounter('flaring');

      // Assert
      expect(act).toThrow(
        /encounter \[ flaring ] spawn of enemy \[ 511 ] could not spawn: the enemy clone map holds no event \[ 605 ]/);
    });

    it('throws, naming the spawn, when its body turns out to be another enemy', () =>
    {
      // Arrange
      registerFlaring([ onStart([ spawnStep() ]) ]);
      const body = buildBody(BODY_EVENT_ID, buildJabsBattler(false, false, 100));
      const impostor = buildBody(HAZARD_EVENT_ID, buildJabsBattler(false, false, 100, TWIN_ENEMY_ID));
      $jabsEngine.addEnemyToMap
        .mockReturnValueOnce(body)
        .mockReturnValueOnce(impostor);

      // Act
      const act = () => JabsBossManager.startEncounter('flaring');

      // Assert
      expect(act).toThrow(/spawn of enemy \[ 511 ] spawned enemy \[ 582 ] from clone event \[ 605 ]/);
    });

    it('throws before spawning anything when a spawned enemy no longer carries its authored name', () =>
    {
      // Arrange
      registerFlaring([ onStart([ spawnStep('Lava Imp') ]) ]);

      // Act
      const act = () => JabsBossManager.startEncounter('flaring');

      // Assert
      expect(act).toThrow(/spawned enemy id \[ 511 ] was authored as \[ Lava Imp ] but is now \[ Ignihazard ]/);
      expect($jabsEngine.addEnemyToMap).not.toHaveBeenCalled();
    });

    it('takes every hazard still standing off the map once the fight is won', () =>
    {
      // Arrange
      const hazard = buildHazard();
      const body = startFlaring(buildJabsBattler(true, false, 0), [ onStart([ spawnStep() ]) ], [ hazard ]);
      body.isErased.mockReturnValue(true);

      // Act
      JabsBossManager.update();

      // Assert
      expect(hazard.erase).toHaveBeenCalledTimes(1);
    });

    it('leaves its hazards standing while the fight goes on', () =>
    {
      // Arrange
      const hazard = buildHazard();
      startFlaring(buildJabsBattler(false, false, 100), [ onStart([ spawnStep() ]) ], [ hazard ]);

      // Act
      JabsBossManager.update();

      // Assert
      expect(hazard.erase).not.toHaveBeenCalled();
    });

    it('leaves a hazard alone that has already been felled', () =>
    {
      // Arrange
      const hazard = buildHazard();
      const body = startFlaring(buildJabsBattler(true, false, 0), [ onStart([ spawnStep() ]) ], [ hazard ]);
      hazard.isErased.mockReturnValue(true);
      body.isErased.mockReturnValue(true);

      // Act
      JabsBossManager.update();

      // Assert- the fight was still won, so the hazard was looked at and left alone.
      expect(JabsBossManager.isBossDefeated()).toBe(true);
      expect(hazard.erase).not.toHaveBeenCalled();
    });

    it('leaves a slot alone once its hazard has left the map, whatever holds the slot now', () =>
    {
      // Arrange
      const hazard = buildHazard();
      const body = startFlaring(buildJabsBattler(true, false, 0), [ onStart([ spawnStep() ]) ], [ hazard ]);
      const newcomer = buildHazard();
      holdOnMap([ body, newcomer ]);
      body.isErased.mockReturnValue(true);

      // Act
      JabsBossManager.update();

      // Assert
      expect(JabsBossManager.isBossDefeated()).toBe(true);
      expect(hazard.erase).not.toHaveBeenCalled();
      expect(newcomer.erase).not.toHaveBeenCalled();
    });

    it('takes its hazards off the map when the fight is ended', () =>
    {
      // Arrange
      const hazard = buildHazard();
      startFlaring(buildJabsBattler(false, false, 100), [ onStart([ spawnStep() ]) ], [ hazard ]);

      // Act
      JabsBossManager.endEncounter();

      // Assert
      expect(hazard.erase).toHaveBeenCalledTimes(1);
    });

    it('takes an old fight\'s hazards with it when another fight starts over the top', () =>
    {
      // Arrange
      const hazard = buildHazard();
      startFlaring(buildJabsBattler(false, false, 100), [ onStart([ spawnStep() ]) ], [ hazard ]);
      JabsBossManager.registerEncounters([ buildEncounter(ENEMY_NAME, SKILL_NAME, true) ]);
      const nextBody = buildBody(BODY_EVENT_ID, buildJabsBattler(false, false, 100));
      $jabsEngine.addEnemyToMap.mockReturnValueOnce(nextBody);
      holdOnMap([ nextBody, hazard ]);

      // Act
      JabsBossManager.startEncounter('gluttonwolf');

      // Assert
      expect(hazard.erase).toHaveBeenCalledTimes(1);
    });
  });

  describe('tint', () =>
  {
    it('shifts the screen toward the tone it names, over the time it names', () =>
    {
      // Arrange

      // Act
      startFlaring(buildJabsBattler(false, false, 100), [ onStart([ tintStep() ]) ]);

      // Assert
      expect($gameScreen.startTint).toHaveBeenCalledWith(TONE, TINT_FRAMES);
    });

    it('hands the screen back the way the fight found it once the fight ends', () =>
    {
      // Arrange
      $gameScreen.toneTarget.mockReturnValue([ 0, -51, -51, 0 ]);
      startFlaring(buildJabsBattler(false, false, 100), [ onStart([ tintStep() ]) ]);
      $gameScreen.startTint.mockClear();

      // Act
      JabsBossManager.endEncounter();

      // Assert
      expect($gameScreen.startTint).toHaveBeenCalledTimes(1);
      expect($gameScreen.startTint).toHaveBeenCalledWith([ 0, -51, -51, 0 ], 0);
    });

    it('remembers the screen only from the first tint of the fight', () =>
    {
      // Arrange- by the second tint the screen is already headed for red.
      $gameScreen.toneTarget
        .mockReturnValueOnce([ 0, -51, -51, 0 ])
        .mockReturnValue(TONE);
      startFlaring(buildJabsBattler(false, false, 100), [ onStart([ tintStep(), tintStep([ 34, -85, -85, 0 ]) ]) ]);
      $gameScreen.startTint.mockClear();

      // Act
      JabsBossManager.endEncounter();

      // Assert
      expect($gameScreen.startTint).toHaveBeenCalledWith([ 0, -51, -51, 0 ], 0);
    });

    it('remembers where the screen was headed rather than a fade still underway', () =>
    {
      // Arrange- the screen is partway through fading to a tint somebody asked for.
      $gameScreen.toneTarget.mockReturnValue([ 0, -51, -51, 0 ]);
      $gameScreen.tone.mockReturnValue([ 0, -20, -20, 0 ]);
      startFlaring(buildJabsBattler(false, false, 100), [ onStart([ tintStep() ]) ]);
      $gameScreen.startTint.mockClear();

      // Act
      JabsBossManager.endEncounter();

      // Assert
      expect($gameScreen.startTint).toHaveBeenCalledWith([ 0, -51, -51, 0 ], 0);
    });

    it('starts a fight the same frame another ends remembering the room, not the old fight\'s tint', () =>
    {
      // Arrange- a screen that paints a frame behind what it is asked for, the way a lighting composer does.
      let headedFor = [ 0, 0, 0, 0 ];
      $gameScreen.startTint.mockImplementation(tone =>
      {
        headedFor = [ ...tone ];
      });
      $gameScreen.toneTarget.mockImplementation(() => headedFor);
      $gameScreen.tone.mockReturnValue(TONE);
      startFlaring(buildJabsBattler(false, false, 100), [ onStart([ tintStep() ]) ]);
      JabsBossManager.endEncounter();
      startFlaring(buildJabsBattler(false, false, 100), [ onStart([ tintStep([ 34, -85, -85, 0 ]) ]) ]);
      $gameScreen.startTint.mockClear();

      // Act
      JabsBossManager.endEncounter();

      // Assert- the room was untinted before either fight, and that is what it gets back.
      expect($gameScreen.startTint).toHaveBeenCalledWith([ 0, 0, 0, 0 ], 0);
    });

    it('hands the screen back only once, however many times the fight is ended', () =>
    {
      // Arrange
      startFlaring(buildJabsBattler(false, false, 100), [ onStart([ tintStep() ]) ]);
      JabsBossManager.endEncounter();
      $gameScreen.startTint.mockClear();

      // Act
      JabsBossManager.endEncounter();

      // Assert
      expect($gameScreen.startTint).not.toHaveBeenCalled();
    });

    it('leaves the screen alone at the end of a fight that never tinted it', () =>
    {
      // Arrange
      startFlaring(buildJabsBattler(false, false, 100), []);

      // Act
      JabsBossManager.endEncounter();

      // Assert
      expect($gameScreen.startTint).not.toHaveBeenCalled();
    });

    it('throws before spawning anything when a tint is not red, green, blue and gray', () =>
    {
      // Arrange
      registerFlaring([ onStart([ tintStep([ 17, -68, -68 ]) ]) ]);

      // Act
      const act = () => JabsBossManager.startEncounter('flaring');

      // Assert
      expect(act).toThrow(/reaction \[ opening ] tints the screen to \[ 17,-68,-68 ], which is not red, green, blue and gray/);
      expect($jabsEngine.addEnemyToMap).not.toHaveBeenCalled();
    });
  });

  describe('animation', () =>
  {
    it('plays the animation over the participant it names', () =>
    {
      // Arrange

      // Act
      const { twinBattler } = startTwins([ onStart([ animationStep('twin') ]) ]);

      // Assert
      expect($gameTemp.requestAnimation).toHaveBeenCalledTimes(1);
      expect($gameTemp.requestAnimation).toHaveBeenCalledWith([ twinBattler.getCharacter() ], ANIMATION_ID);
    });

    it('skips the animation for a body no longer on the map, and carries on with the rest', () =>
    {
      // Arrange
      const { twinBody } = startTwins([ onFallen([ 'twin' ], [ animationStep('twin'), tintStep() ]) ]);
      twinBody.isErased.mockReturnValue(true);

      // Act
      JabsBossManager.update();

      // Assert
      expect($gameTemp.requestAnimation).not.toHaveBeenCalled();
      expect($gameScreen.startTint).toHaveBeenCalledTimes(1);
    });

    it('throws before spawning anything when an animation no longer carries its authored name', () =>
    {
      // Arrange
      registerFlaring([ onStart([ animationStep('', 'Explosion') ]) ]);

      // Act
      const act = () => JabsBossManager.startEncounter('flaring');

      // Assert
      expect(act).toThrow(/animation id \[ 56 ] was authored as \[ Explosion ] but is now \[ Flare Up ]/);
      expect($jabsEngine.addEnemyToMap).not.toHaveBeenCalled();
    });

    it('throws when an animation names a participant the encounter does not have', () =>
    {
      // Arrange
      registerFlaring([ onStart([ animationStep('ghost') ]) ]);

      // Act
      const act = () => JabsBossManager.startEncounter('flaring');

      // Assert
      expect(act).toThrow(/reaction \[ opening ] names participant \[ ghost ]/);
    });
  });

  describe('lanes', () =>
  {
    it('plays two reactions side by side, so a scene in one never holds up the other', () =>
    {
      // Arrange
      const jabsBattler = buildJabsBattler(false, false, 100);

      // Act
      startFlaring(jabsBattler, [ onStart([ dialogueStep(''), addStateStep('') ]), onStart([ tintStep() ]) ]);

      // Assert- the second reaction's tint lands while the first is still mid-line.
      expect($gameScreen.startTint).toHaveBeenCalledTimes(1);
      expect(jabsBattler.getBattler().addState).not.toHaveBeenCalled();
    });

    it('starts a routine again only once its last run has played out', () =>
    {
      // Arrange- due on every frame, and its first run pauses before it does anything.
      const routine = new JabsBossRoutine('tour', 0, [ waitStep(), forceSkillStep('') ]);
      startFlaring(buildJabsBattler(false, false, 100), [], [], [ routine ]);
      JabsBossManager.update();
      JabsBossManager.update();
      JabsBossManager.update();
      const runsWhilePausing = interpreters.length;

      // Act
      interpreters[0].isRunning.mockReturnValue(false);
      JabsBossManager.update();

      // Assert
      expect(runsWhilePausing).toBe(1);
      expect($jabsEngine.forceMapAction).toHaveBeenCalledTimes(1);
    });

    it('leaves nothing playing once the fight is won', () =>
    {
      // Arrange- the opening is still pausing when the boss finishes falling.
      const body = startFlaring(buildJabsBattler(true, false, 0), [ onStart([ waitStep(), tintStep() ]) ]);
      body.isErased.mockReturnValue(true);
      JabsBossManager.update();

      // Act
      interpreters[0].isRunning.mockReturnValue(false);
      JabsBossManager.update();

      // Assert
      expect(JabsBossManager.isBossDefeated()).toBe(true);
      expect($gameScreen.startTint).not.toHaveBeenCalled();
    });
  });

  describe('dormant routines', () =>
  {
    /**
     * Builds a routine that forces the test skill, dormant unless told otherwise.
     * @param {number} cadenceFrames How many frames it waits between executions.
     * @param {boolean} dormant Whether it waits to be started.
     * @returns {JabsBossRoutine}
     */
    const tourRoutine = (cadenceFrames, dormant = true) =>
      new JabsBossRoutine('tour', cadenceFrames, [ forceSkillStep('') ], dormant);

    it('leaves a dormant routine still until something starts it', () =>
    {
      // Arrange
      startFlaring(buildJabsBattler(false, false, 100), [], [], [ tourRoutine(0) ]);

      // Act
      JabsBossManager.update();
      JabsBossManager.update();
      JabsBossManager.update();

      // Assert
      expect($jabsEngine.forceMapAction).not.toHaveBeenCalled();
    });

    it('plays a woken routine at once, then again once its cadence has passed', () =>
    {
      // Arrange
      startFlaring(buildJabsBattler(false, false, 100), [ onStart([ startRoutineStep('tour') ]) ], [], [ tourRoutine(3) ]);
      JabsBossManager.update();
      const runsAtOnce = $jabsEngine.forceMapAction.mock.calls.length;
      JabsBossManager.update();
      JabsBossManager.update();
      JabsBossManager.update();
      const runsWhileWaiting = $jabsEngine.forceMapAction.mock.calls.length;

      // Act
      JabsBossManager.update();

      // Assert
      expect(runsAtOnce).toBe(1);
      expect(runsWhileWaiting).toBe(1);
      expect($jabsEngine.forceMapAction).toHaveBeenCalledTimes(2);
    });

    it('carries on with a running routine\'s wait when something starts it again', () =>
    {
      // Arrange- already running, and a full five frames from its first execution.
      startFlaring(buildJabsBattler(false, false, 100), [ onStart([ startRoutineStep('tour') ]) ], [], [ tourRoutine(5, false) ]);

      // Act
      JabsBossManager.update();

      // Assert
      expect($jabsEngine.forceMapAction).not.toHaveBeenCalled();
    });

    it('shortens a dormant routine\'s cadence without starting it', () =>
    {
      // Arrange- a ten-minute routine quickened to ten frames, while still dormant.
      const quicken = new JabsBossStep('quickenRoutine', stepDetails({ routineKey: 'tour', frames: 35990 }));
      startFlaring(buildJabsBattler(false, false, 100), [ onStart([ quicken ]) ], [], [ tourRoutine(36000) ]);
      JabsBossManager.update();
      const runsBeforeWaking = $jabsEngine.forceMapAction.mock.calls.length;

      // Act- woken by a later moment, it plays at once and then on the shortened cadence.
      JabsBossManager.registerEncounters([]);
      startFlaring(buildJabsBattler(false, false, 100), [ onStart([ quicken, startRoutineStep('tour') ]) ], [], [ tourRoutine(36000) ]);
      for (let frame = 0; frame < 12; frame++) JabsBossManager.update();

      // Assert
      expect(runsBeforeWaking).toBe(0);
      expect($jabsEngine.forceMapAction).toHaveBeenCalledTimes(2);
    });

    it('throws before spawning anything when a step starts a routine the encounter does not have', () =>
    {
      // Arrange
      registerFlaring([ onStart([ startRoutineStep('ghost') ]) ]);

      // Act
      const act = () => JabsBossManager.startEncounter('flaring');

      // Assert
      expect(act).toThrow(/reaction \[ opening ] names routine \[ ghost ]/);
      expect($jabsEngine.addEnemyToMap).not.toHaveBeenCalled();
    });
  });

  describe('blink', () =>
  {
    /**
     * The fade a blink plays as a body leaves, or arrives when `wait` is set, exactly as the scene builds it.
     * @param {number[]} opacities The opacities it passes through.
     * @param {boolean} wait Whether the scene waits it out.
     * @returns {object}
     */
    const fadeRoute = (opacities, wait) => ({
      list: [
        ...opacities.flatMap(opacity => [ { code: 42, parameters: [ opacity ] }, { code: 15, parameters: [ 3 ] } ]),
        { code: 0, parameters: [] },
      ],
      repeat: false,
      skippable: true,
      wait,
    });

    it('takes the participant it names to its tile through a scene belonging to its own event', () =>
    {
      // Arrange

      // Act
      startTwins([ onStart([ blinkStep('twin') ]) ]);

      // Assert
      expect(interpreters).toHaveLength(1);
      expect(interpreters[0].setup).toHaveBeenCalledWith([
        { code: 212, indent: 0, parameters: [ 0, BLINK_FLARE, false ] },
        { code: 205, indent: 0, parameters: [ 0, fadeRoute([ 200, 150, 100, 50, 0 ], false) ] },
        { code: 230, indent: 0, parameters: [ 60 ] },
        { code: 203, indent: 0, parameters: [ 0, 0, PLATFORM_X, PLATFORM_Y, 6 ] },
        { code: 212, indent: 0, parameters: [ 0, BLINK_FLARE, false ] },
        { code: 205, indent: 0, parameters: [ 0, fadeRoute([ 50, 100, 150, 200, 255 ], true) ] },
        { code: 230, indent: 0, parameters: [ 30 ] },
        { code: 0, indent: 0, parameters: [] },
      ], TWIN_BODY_EVENT_ID);
    });

    it('blinks without a flare when the step names none', () =>
    {
      // Arrange

      // Act
      startFlaring(buildJabsBattler(false, false, 100), [ onStart([ blinkStep('', 0) ]) ]);

      // Assert- the fades and the move still play, only the flares are gone.
      const [ scene ] = interpreters;
      const [ [ commands ] ] = scene.setup.mock.calls;
      expect(commands.map(command => command.code)).toEqual([ 205, 230, 203, 205, 230, 0 ]);
    });

    it('holds the steps behind a blink until it has played out', () =>
    {
      // Arrange
      const jabsBattler = buildJabsBattler(false, false, 100);
      startFlaring(jabsBattler, [ onStart([ blinkStep(''), addStateStep('') ]) ]);
      JabsBossManager.update();
      const sealedMidBlink = jabsBattler.getBattler().addState.mock.calls.length;

      // Act
      interpreters[0].isRunning.mockReturnValue(false);
      JabsBossManager.update();

      // Assert
      expect(sealedMidBlink).toBe(0);
      expect(jabsBattler.getBattler().addState).toHaveBeenCalledTimes(1);
    });

    it('skips the blink of a body no longer on the map, and carries on with the rest', () =>
    {
      // Arrange
      const { twinBody, mayorBattler } = startTwins([ onFallen([ 'twin' ], [ blinkStep('twin'), addStateStep('mayor') ]) ]);
      twinBody.isErased.mockReturnValue(true);

      // Act
      JabsBossManager.update();

      // Assert
      expect(interpreters).toHaveLength(0);
      expect(mayorBattler.getBattler().addState).toHaveBeenCalledTimes(1);
    });

    it('throws before spawning anything when a blink faces a way no character can face', () =>
    {
      // Arrange
      registerFlaring([ onStart([ blinkStep('', BLINK_FLARE, 5) ]) ]);

      // Act
      const act = () => JabsBossManager.startEncounter('flaring');

      // Assert
      expect(act).toThrow(/reaction \[ opening ] blinks to face \[ 5 ], which is not down \(2\), left \(4\), right \(6\) or up \(8\)/);
      expect($jabsEngine.addEnemyToMap).not.toHaveBeenCalled();
    });

    it('throws when a blink names a participant the encounter does not have', () =>
    {
      // Arrange
      registerFlaring([ onStart([ blinkStep('ghost') ]) ]);

      // Act
      const act = () => JabsBossManager.startEncounter('flaring');

      // Assert
      expect(act).toThrow(/reaction \[ opening ] names participant \[ ghost ]/);
    });
  });

  describe('wait', () =>
  {
    it('holds the steps behind it for the time it names, on a scene belonging to no event', () =>
    {
      // Arrange
      startFlaring(buildJabsBattler(false, false, 100), [ onStart([ waitStep(), tintStep() ]) ]);
      const tintedMidPause = $gameScreen.startTint.mock.calls.length;

      // Act
      interpreters[0].isRunning.mockReturnValue(false);
      JabsBossManager.update();

      // Assert
      expect(interpreters[0].setup).toHaveBeenCalledWith([
        { code: 230, indent: 0, parameters: [ PAUSE_FRAMES ] },
        { code: 0, indent: 0, parameters: [] },
      ], 0);
      expect(tintedMidPause).toBe(0);
      expect($gameScreen.startTint).toHaveBeenCalledTimes(1);
    });
  });

  describe('learnSkill', () =>
  {
    it('teaches the participant it names the skill it names', () =>
    {
      // Arrange

      // Act
      const { mayorBattler, twinBattler } = startTwins([ onStart([ learnSkillStep('twin') ]) ]);

      // Assert
      expect(twinBattler.getBattler().learnSkill).toHaveBeenCalledWith(SKILL_ID);
      expect(mayorBattler.getBattler().learnSkill).not.toHaveBeenCalled();
    });

    it('skips teaching a body no longer on the map, and carries on with the rest', () =>
    {
      // Arrange
      const { twinBody, twinBattler } = startTwins([ onFallen([ 'twin' ], [ learnSkillStep('twin'), tintStep() ]) ]);
      twinBody.isErased.mockReturnValue(true);

      // Act
      JabsBossManager.update();

      // Assert
      expect(twinBattler.getBattler().learnSkill).not.toHaveBeenCalled();
      expect($gameScreen.startTint).toHaveBeenCalledTimes(1);
    });

    it('throws before spawning anything when a learned skill no longer carries its authored name', () =>
    {
      // Arrange
      registerFlaring([ onStart([ learnSkillStep('', 'Bite') ]) ]);

      // Act
      const act = () => JabsBossManager.startEncounter('flaring');

      // Assert
      expect(act).toThrow(/skill id \[ 2584 ] was authored as \[ Bite ] but is now \[ Devour ]/);
      expect($jabsEngine.addEnemyToMap).not.toHaveBeenCalled();
    });

    it('throws when a learned skill names a participant the encounter does not have', () =>
    {
      // Arrange
      registerFlaring([ onStart([ learnSkillStep('ghost') ]) ]);

      // Act
      const act = () => JabsBossManager.startEncounter('flaring');

      // Assert
      expect(act).toThrow(/reaction \[ opening ] names participant \[ ghost ]/);
    });
  });

  describe('arrivals and faces', () =>
  {
    it('brings a spawned body in with the flash the step names', () =>
    {
      // Arrange
      const hazard = buildHazard();

      // Act
      startFlaring(buildJabsBattler(false, false, 100), [ onStart([ spawnStep(HAZARD_NAME, 120) ]) ], [ hazard ]);

      // Assert
      expect($gameTemp.requestAnimation).toHaveBeenCalledWith([ hazard ], 120);
    });

    it('brings a spawned body in without a flash when the step names none', () =>
    {
      // Arrange
      const hazard = buildHazard();

      // Act
      startFlaring(buildJabsBattler(false, false, 100), [ onStart([ spawnStep() ]) ], [ hazard ]);

      // Assert- the body still arrived, it just came quietly.
      expect($jabsEngine.addEnemyToMap).toHaveBeenLastCalledWith(HAZARD_X, HAZARD_Y, HAZARD_TEMPLATE_ID);
      expect($gameTemp.requestAnimation).not.toHaveBeenCalled();
    });

    it('shows the speaker\'s face with the line', () =>
    {
      // Arrange
      const step = new JabsBossStep('dialogue', stepDetails({ speaker: SPEAKER, lines: LINES, face: FACE, faceIndex: FACE_INDEX }));

      // Act
      startFlaring(buildJabsBattler(false, false, 100), [ onStart([ step ]) ]);

      // Assert
      const [ scene ] = interpreters;
      const [ [ [ showText ] ] ] = scene.setup.mock.calls;
      expect(showText).toEqual({ code: 101, indent: 0, parameters: [ FACE, FACE_INDEX, 0, 2, SPEAKER ] });
    });
  });

  describe('bystanders', () =>
  {
    it('wins the fight once the boss falls, with its bystander still standing', () =>
    {
      // Arrange
      const { mayorBody } = startWatched();
      mayorBody.isErased.mockReturnValue(true);

      // Act
      JabsBossManager.update();

      // Assert
      expect(JabsBossManager.isBossDefeated()).toBe(true);
      expect($gameSwitches.setValue).toHaveBeenCalledWith(DEFEAT_SWITCH_ID, true);
    });

    it('takes a bystander still standing off the map once the fight is won', () =>
    {
      // Arrange
      const { mayorBody, watcherBody } = startWatched();
      mayorBody.isErased.mockReturnValue(true);

      // Act
      JabsBossManager.update();

      // Assert
      expect(watcherBody.erase).toHaveBeenCalledTimes(1);
    });

    it('leaves a bystander standing while the fight goes on', () =>
    {
      // Arrange
      const { watcherBody } = startWatched();

      // Act
      JabsBossManager.update();

      // Assert- nothing has fallen, so nothing is won and nobody leaves.
      expect(JabsBossManager.isBossDefeated()).toBe(false);
      expect(watcherBody.erase).not.toHaveBeenCalled();
    });

    it('takes a bystander off the map when the fight is ended, and leaves the boss standing', () =>
    {
      // Arrange
      const { mayorBody, watcherBody } = startWatched();

      // Act
      JabsBossManager.endEncounter();

      // Assert
      expect(watcherBody.erase).toHaveBeenCalledTimes(1);
      expect(mayorBody.erase).not.toHaveBeenCalled();
    });

    it('leaves a bystander alone that has already been taken off the map', () =>
    {
      // Arrange
      const { watcherBody } = startWatched();
      watcherBody.isErased.mockReturnValue(true);

      // Act
      JabsBossManager.endEncounter();

      // Assert
      expect(watcherBody.erase).not.toHaveBeenCalled();
    });

    it('takes an old fight\'s bystander with it when another fight starts over the top', () =>
    {
      // Arrange
      const { watcherBody } = startWatched();
      JabsBossManager.registerEncounters([ buildEncounter(ENEMY_NAME, SKILL_NAME, true) ]);
      const nextBody = buildBody(BODY_EVENT_ID, buildJabsBattler(false, false, 100));
      $jabsEngine.addEnemyToMap.mockReturnValueOnce(nextBody);
      holdOnMap([ nextBody, watcherBody ]);

      // Act
      JabsBossManager.startEncounter('gluttonwolf');

      // Assert
      expect(watcherBody.erase).toHaveBeenCalledTimes(1);
    });

    it('lets a step name a bystander, so it says its line from where it stands', () =>
    {
      // Arrange

      // Act
      startWatched([ onStart([ dialogueStep('watcher') ]) ]);

      // Assert
      const [ scene ] = interpreters;
      const [ [ , eventId ] ] = scene.setup.mock.calls;
      expect(eventId).toBe(TWIN_BODY_EVENT_ID);
    });

    it('throws before spawning anything when a bystander is listed first, where the boss belongs', () =>
    {
      // Arrange
      const watcher = new JabsBossParticipant(
        'watcher', TWIN_ENEMY_ID, TWIN_ENEMY_NAME, TWIN_X, TWIN_Y, TWIN_ENEMY_ID, true);
      const mayor = new JabsBossParticipant('mayor', ENEMY_ID, ENEMY_NAME, SPAWN_X, SPAWN_Y, ENEMY_ID);
      const encounter = new JabsBossEncounter('backwards', ARENA_MAP_ID, [ watcher, mayor ], 'shared', [], 0, []);
      JabsBossManager.registerEncounters([ encounter ]);

      // Act
      const act = () => JabsBossManager.startEncounter('backwards');

      // Assert
      expect(act).toThrow(/encounter \[ backwards ] lists bystander \[ watcher ] first, where its boss belongs/);
      expect($jabsEngine.addEnemyToMap).not.toHaveBeenCalled();
    });

    it('throws before spawning anything when the encounter has nobody in it', () =>
    {
      // Arrange
      const encounter = new JabsBossEncounter('empty', ARENA_MAP_ID, [], 'shared', [], 0, []);
      JabsBossManager.registerEncounters([ encounter ]);

      // Act
      const act = () => JabsBossManager.startEncounter('empty');

      // Assert
      expect(act).toThrow(/encounter \[ empty ] has no participants, so it would be won the moment it began/);
      expect($jabsEngine.addEnemyToMap).not.toHaveBeenCalled();
    });
  });

  describe('face', () =>
  {
    it('turns the participant it names to face the way it names', () =>
    {
      // Arrange

      // Act
      const { mayorBattler, twinBattler } = startTwins([ onStart([ faceStep('twin', 8) ]) ]);

      // Assert
      expect(twinBattler.getCharacter().setDirection).toHaveBeenCalledWith(8);
      expect(mayorBattler.getCharacter().setDirection).not.toHaveBeenCalled();
    });

    it('holds nothing up: the step behind a turn plays in the same frame', () =>
    {
      // Arrange
      const jabsBattler = buildJabsBattler(false, false, 100);

      // Act
      startFlaring(jabsBattler, [ onStart([ faceStep('', 2), forceSkillStep('') ]) ]);

      // Assert
      expect(jabsBattler.getCharacter().setDirection).toHaveBeenCalledWith(2);
      expect($jabsEngine.forceMapAction).toHaveBeenCalledWith(jabsBattler, SKILL_ID, false);
    });

    it('skips turning a body no longer on the map, and carries on with the rest', () =>
    {
      // Arrange
      const { twinBody, twinBattler } = startTwins([ onFallen([ 'twin' ], [ faceStep('twin'), tintStep() ]) ]);
      twinBody.isErased.mockReturnValue(true);

      // Act
      JabsBossManager.update();

      // Assert
      expect(twinBattler.getCharacter().setDirection).not.toHaveBeenCalled();
      expect($gameScreen.startTint).toHaveBeenCalledTimes(1);
    });

    it('throws before spawning anything when a turn names no way to face', () =>
    {
      // Arrange- zero keeps a blink's facing, but there is no such thing as turning to keep one.
      registerFlaring([ onStart([ faceStep('', 0) ]) ]);

      // Act
      const act = () => JabsBossManager.startEncounter('flaring');

      // Assert
      expect(act).toThrow(/reaction \[ opening ] turns to face \[ 0 ], which is not down \(2\), left \(4\), right \(6\) or up \(8\)/);
      expect($jabsEngine.addEnemyToMap).not.toHaveBeenCalled();
    });

    it('throws when a turn names a participant the encounter does not have', () =>
    {
      // Arrange
      registerFlaring([ onStart([ faceStep('ghost') ]) ]);

      // Act
      const act = () => JabsBossManager.startEncounter('flaring');

      // Assert
      expect(act).toThrow(/reaction \[ opening ] names participant \[ ghost ]/);
    });
  });

  describe('log', () =>
  {
    /**
     * Stands in for J-Log's builder, handing back exactly what it was told.
     */
    class FakeDiaLogBuilder
    {
      /**
       * Constructor.
       */
      constructor()
      {
        this.built = { lines: [], faceName: '', faceIndex: -1 };
      }

      /**
       * Remembers the lines of the log.
       * @param {string[]} lines The lines.
       * @returns {FakeDiaLogBuilder}
       */
      setLines(lines)
      {
        this.built.lines = lines;
        return this;
      }

      /**
       * Remembers the face image of the log.
       * @param {string} faceName The face image.
       * @returns {FakeDiaLogBuilder}
       */
      setFaceName(faceName)
      {
        this.built.faceName = faceName;
        return this;
      }

      /**
       * Remembers the face on that image.
       * @param {number} faceIndex The face.
       * @returns {FakeDiaLogBuilder}
       */
      setFaceIndex(faceIndex)
      {
        this.built.faceIndex = faceIndex;
        return this;
      }

      /**
       * Hands back what it was told.
       * @returns {object}
       */
      build()
      {
        return this.built;
      }
    }

    beforeEach(() =>
    {
      // J-Log is installed unless a test takes it away.
      J.LOG = {};
      globalThis.DiaLogBuilder = FakeDiaLogBuilder;
      globalThis.$mapLogs = { dialog: { addLog: vi.fn() } };
    });

    afterEach(() =>
    {
      // J-Log is no part of any other test's game.
      delete J.LOG;
      delete globalThis.DiaLogBuilder;
      delete globalThis.$mapLogs;
    });

    it('writes the line to the dialogue log, wearing the face it names', () =>
    {
      // Arrange

      // Act
      startFlaring(buildJabsBattler(false, false, 100), [ onStart([ logStep() ]) ]);

      // Assert
      expect($mapLogs.dialog.addLog).toHaveBeenCalledWith({ lines: LINES, faceName: FACE, faceIndex: FACE_INDEX });
    });

    it('holds nothing up: the step behind a line in the log plays in the same frame', () =>
    {
      // Arrange
      const jabsBattler = buildJabsBattler(false, false, 100);

      // Act
      startFlaring(jabsBattler, [ onStart([ logStep(), addStateStep('') ]) ]);

      // Assert
      expect(interpreters).toHaveLength(0);
      expect(jabsBattler.getBattler().addState).toHaveBeenCalledTimes(1);
    });

    it('writes nowhere in a game without J-Log, and carries on with the rest', () =>
    {
      // Arrange
      delete J.LOG;

      // Act
      startFlaring(buildJabsBattler(false, false, 100), [ onStart([ logStep(), tintStep() ]) ]);

      // Assert
      expect($mapLogs.dialog.addLog).not.toHaveBeenCalled();
      expect($gameScreen.startTint).toHaveBeenCalledTimes(1);
    });

    it('throws before spawning anything when a line in the log says nothing', () =>
    {
      // Arrange
      registerFlaring([ onStart([ logStep([]) ]) ]);

      // Act
      const act = () => JabsBossManager.startEncounter('flaring');

      // Assert
      expect(act).toThrow(/reaction \[ opening ] writes nothing at all to the dialogue log/);
      expect($jabsEngine.addEnemyToMap).not.toHaveBeenCalled();
    });
  });

  describe('summoned participants', () =>
  {
    it('leaves a participant held back to be summoned off the map as the fight starts', () =>
    {
      // Arrange

      // Act
      startSummoning([ onHealth(50, [ summonStep('brine') ]) ]);

      // Assert- the boss arrived, and nobody else did.
      expect($jabsEngine.addEnemyToMap).toHaveBeenCalledTimes(1);
      expect($jabsEngine.addEnemyToMap).toHaveBeenCalledWith(SPAWN_X, SPAWN_Y, ENEMY_ID);
    });

    it('brings a summoned participant onto its own tile, from its own template, when a step summons it', () =>
    {
      // Arrange
      const { mayorBattler, masterworkBodies } = startSummoning([ onHealth(50, [ summonStep('brine') ]) ]);
      const [ brineBody ] = masterworkBodies;
      mayorBattler.getBattler().currentHpPercent100.mockReturnValue(50);

      // Act
      JabsBossManager.update();

      // Assert
      const [ , brine ] = JabsBossManager.activeEncounter()
        .participants();
      expect($jabsEngine.addEnemyToMap).toHaveBeenLastCalledWith(MASTERWORK_X, MASTERWORK_Y, MASTERWORK_TEMPLATE_ID);
      expect(JabsBossManager.getParticipantJabsBattler(brine)).toBe(brineBody.getJabsBattler());
    });

    it('brings a summoned participant in with the flash the step names', () =>
    {
      // Arrange

      // Act
      const { masterworkBodies } = startSummoning([ onStart([ summonStep('brine', SUMMON_FLARE) ]) ]);

      // Assert
      const [ brineBody ] = masterworkBodies;
      expect($gameTemp.requestAnimation).toHaveBeenCalledWith([ brineBody ], SUMMON_FLARE);
    });

    it('throws, naming the participant, when a summoned body turns out to be another enemy', () =>
    {
      // Arrange- the boss arrives true, then the masterwork's template turns out to hold somebody else.
      JabsBossManager.registerEncounters([ buildSummoningEncounter([ onStart([ summonStep('brine') ]) ]) ]);
      const mayorBody = buildBody(BODY_EVENT_ID, buildJabsBattler(false, false, 100));
      const impostor = buildBody(MASTERWORK_EVENT_ID, buildJabsBattler(false, false, 100, TWIN_ENEMY_ID));
      $jabsEngine.addEnemyToMap
        .mockReturnValueOnce(mayorBody)
        .mockReturnValueOnce(impostor);

      // Act
      const act = () => JabsBossManager.startEncounter('workshop');

      // Assert
      expect(act).toThrow(/encounter \[ workshop ] participant \[ brine ] spawned enemy \[ 582 ] from clone event \[ 608 ]/);
    });

    it('counts a summoned participant as part of the fight once it has arrived', () =>
    {
      // Arrange
      const { masterworkBodies } = startSummoning([ onStart([ summonStep('brine') ]) ]);
      const [ brineBody ] = masterworkBodies;

      // Act
      const isParticipant = JabsBossManager.isParticipant({ getCharacter: () => brineBody });

      // Assert- so it stands its ground against knockback, the same as the boss does.
      expect(isParticipant).toBe(true);
    });

    it('holds a reaction waiting on a summoned participant until it has arrived', () =>
    {
      // Arrange- the masterwork waits for the boss to be worn down, and the boss has not been.
      startSummoning([ onHealth(50, [ summonStep('brine') ]), onFallen([ 'brine' ], [ tintStep() ]) ]);

      // Act
      JabsBossManager.update();

      // Assert
      expect($gameScreen.startTint).not.toHaveBeenCalled();
    });

    it('fires a reaction waiting on a summoned participant once it has arrived and fallen', () =>
    {
      // Arrange
      const reactions = [ onHealth(50, [ summonStep('brine') ]), onFallen([ 'brine' ], [ tintStep() ]) ];
      const { mayorBattler, masterworkBodies } = startSummoning(reactions);
      const [ brineBody ] = masterworkBodies;
      mayorBattler.getBattler().currentHpPercent100.mockReturnValue(50);
      JabsBossManager.update();
      brineBody.isErased.mockReturnValue(true);

      // Act
      JabsBossManager.update();

      // Assert
      expect($gameScreen.startTint).toHaveBeenCalledTimes(1);
    });

    it('keeps the fight going while a summoned participant has yet to arrive, though everyone else has fallen', () =>
    {
      // Arrange- the boss falls from full health in one blow, so the moment its masterwork waits for never comes.
      const { mayorBody } = startSummoning([ onHealth(50, [ summonStep('brine') ]) ]);
      mayorBody.isErased.mockReturnValue(true);

      // Act
      JabsBossManager.update();

      // Assert
      expect(JabsBossManager.isBossDefeated()).toBe(false);
      expect($gameSwitches.setValue).not.toHaveBeenCalled();
    });

    it('wins the fight once its summoned participants have arrived and fallen too', () =>
    {
      // Arrange
      const { mayorBody, masterworkBodies } = startSummoning([ onStart([ summonStep('brine') ]) ]);
      const [ brineBody ] = masterworkBodies;
      mayorBody.isErased.mockReturnValue(true);
      brineBody.isErased.mockReturnValue(true);

      // Act
      JabsBossManager.update();

      // Assert
      expect(JabsBossManager.isBossDefeated()).toBe(true);
      expect($gameSwitches.setValue).toHaveBeenCalledWith(DEFEAT_SWITCH_ID, true);
    });

    it('forgets the summons of an earlier attempt when the fight starts again, so nothing waiting on them fires', () =>
    {
      // Arrange- the first attempt wears the boss down, summons its masterwork, and fells it.
      const reactions = [ onHealth(50, [ summonStep('brine') ]), onFallen([ 'brine' ], [ tintStep() ]) ];
      const first = startSummoning(reactions);
      const [ firstBrineBody ] = first.masterworkBodies;
      first.mayorBattler.getBattler().currentHpPercent100.mockReturnValue(50);
      JabsBossManager.update();
      firstBrineBody.isErased.mockReturnValue(true);
      JabsBossManager.update();
      const tintsInFirstAttempt = $gameScreen.startTint.mock.calls.length;
      startSummoning(reactions);

      // Act
      JabsBossManager.update();

      // Assert- the second attempt's boss is untouched, so its masterwork has not even arrived to fall.
      expect(tintsInFirstAttempt).toBe(1);
      expect($gameScreen.startTint).toHaveBeenCalledTimes(1);
    });

    it('leaves a bystander that was never summoned alone when the fight ends', () =>
    {
      // Arrange- a bystander held back for a moment the fight never reaches.
      const mayor = new JabsBossParticipant('mayor', ENEMY_ID, ENEMY_NAME, SPAWN_X, SPAWN_Y, ENEMY_ID);
      const watcher = new JabsBossParticipant(
        'watcher', TWIN_ENEMY_ID, TWIN_ENEMY_NAME, TWIN_X, TWIN_Y, TWIN_ENEMY_ID, true, true);
      const reactions = [ onHealth(50, [ summonStep('watcher') ]) ];
      const encounter = new JabsBossEncounter('late', ARENA_MAP_ID, [ mayor, watcher ], 'shared', [], 0, reactions);
      JabsBossManager.registerEncounters([ encounter ]);
      const mayorBody = buildBody(BODY_EVENT_ID, buildJabsBattler(false, false, 100));
      $jabsEngine.addEnemyToMap.mockReturnValueOnce(mayorBody);
      holdOnMap([ mayorBody ]);
      JabsBossManager.startEncounter('late');

      // Act
      JabsBossManager.endEncounter();

      // Assert- the fight ended all the way through, leaving the boss standing where it stood.
      expect(JabsBossManager.hasActiveEncounter()).toBe(false);
      expect(mayorBody.erase).not.toHaveBeenCalled();
    });

    it('throws before spawning anything when the boss is held back to be summoned', () =>
    {
      // Arrange
      const mayor = new JabsBossParticipant('mayor', ENEMY_ID, ENEMY_NAME, SPAWN_X, SPAWN_Y, ENEMY_ID, false, true);
      const reactions = [ onStart([ summonStep('mayor') ]) ];
      const encounter = new JabsBossEncounter('late-boss', ARENA_MAP_ID, [ mayor ], 'shared', [], 0, reactions);
      JabsBossManager.registerEncounters([ encounter ]);

      // Act
      const act = () => JabsBossManager.startEncounter('late-boss');

      // Assert
      expect(act).toThrow(
        /encounter \[ late-boss ] lists summoned participant \[ mayor ] first, where its boss belongs, but a boss is there/);
      expect($jabsEngine.addEnemyToMap).not.toHaveBeenCalled();
    });

    it('throws before spawning anything when a summon names nobody', () =>
    {
      // Arrange
      JabsBossManager.registerEncounters([ buildSummoningEncounter([ onStart([ summonStep('brine'), summonStep('') ]) ]) ]);

      // Act
      const act = () => JabsBossManager.startEncounter('workshop');

      // Assert
      expect(act).toThrow(/reaction \[ opening ] summons nobody: a summon names the participant it brings in/);
      expect($jabsEngine.addEnemyToMap).not.toHaveBeenCalled();
    });

    it('throws before spawning anything when a summon names a participant the encounter does not have', () =>
    {
      // Arrange
      const reactions = [ onStart([ summonStep('brine'), summonStep('ghost') ]) ];
      JabsBossManager.registerEncounters([ buildSummoningEncounter(reactions) ]);

      // Act
      const act = () => JabsBossManager.startEncounter('workshop');

      // Assert
      expect(act).toThrow(/reaction \[ opening ] names participant \[ ghost ]/);
      expect($jabsEngine.addEnemyToMap).not.toHaveBeenCalled();
    });

    it('throws before spawning anything when a summon names a participant there from the start', () =>
    {
      // Arrange
      const reactions = [ onStart([ summonStep('brine'), summonStep('mayor') ]) ];
      JabsBossManager.registerEncounters([ buildSummoningEncounter(reactions) ]);

      // Act
      const act = () => JabsBossManager.startEncounter('workshop');

      // Assert
      expect(act).toThrow(/reaction \[ opening ] summons participant \[ mayor ], but it is there from the start/);
      expect($jabsEngine.addEnemyToMap).not.toHaveBeenCalled();
    });

    it('throws before spawning anything when nothing ever summons a participant held back to be summoned', () =>
    {
      // Arrange- the first masterwork is summoned, and the second is only ever sealed.
      const reactions = [ onStart([ summonStep('brine'), addStateStep('char') ]) ];
      JabsBossManager.registerEncounters([ buildSummoningEncounter(reactions, [ 'brine', 'char' ]) ]);

      // Act
      const act = () => JabsBossManager.startEncounter('workshop');

      // Assert
      expect(act).toThrow(/encounter \[ workshop ] participant \[ char ] waits to be summoned, but no reaction ever summons it/);
      expect($jabsEngine.addEnemyToMap).not.toHaveBeenCalled();
    });

    it('throws before spawning anything when a participant is summoned more than once', () =>
    {
      // Arrange- the first masterwork is summoned once, the way it should be, and the second twice.
      const reactions = [
        onStart([ summonStep('brine'), summonStep('char') ]),
        onFallen([ 'brine' ], [ summonStep('char') ]),
      ];
      JabsBossManager.registerEncounters([ buildSummoningEncounter(reactions, [ 'brine', 'char' ]) ]);

      // Act
      const act = () => JabsBossManager.startEncounter('workshop');

      // Assert
      expect(act).toThrow(/encounter \[ workshop ] participant \[ char ] is summoned by \[ 2 ] steps, but a participant arrives/);
      expect($jabsEngine.addEnemyToMap).not.toHaveBeenCalled();
    });

    it('throws before spawning anything when a routine summons a participant', () =>
    {
      // Arrange
      const routine = new JabsBossRoutine('reinforce', CADENCE_FRAMES, [ summonStep('brine') ]);
      JabsBossManager.registerEncounters([ buildSummoningEncounter([], [ 'brine' ], [ routine ]) ]);

      // Act
      const act = () => JabsBossManager.startEncounter('workshop');

      // Assert
      expect(act).toThrow(/routine \[ reinforce ] summons a participant, but a routine runs over and over/);
      expect($jabsEngine.addEnemyToMap).not.toHaveBeenCalled();
    });
  });

  describe('jump', () =>
  {
    it('leaps the participant it names from where it stands onto its tile, through a scene of its own event', () =>
    {
      // Arrange- the twin stands between tiles, the way pixel movement leaves a body.
      const { mayorBody, twinBattler } = startTwins([ onFallen([ 'mayor' ], [ jumpStep('twin') ]) ]);
      Object.assign(twinBattler.getCharacter(), { x: 12.5, y: 6 });
      mayorBody.isErased.mockReturnValue(true);

      // Act
      JabsBossManager.update();

      // Assert- from (12.5, 6) onto the platform at (8, 19) is four and a half tiles left and thirteen down.
      const route = {
        list: [ { code: 14, parameters: [ -4.5, 13 ] }, { code: 0, parameters: [] } ],
        repeat: false,
        skippable: true,
        wait: true,
      };
      expect(interpreters).toHaveLength(1);
      expect(interpreters[0].setup).toHaveBeenCalledWith([
        { code: 205, indent: 0, parameters: [ 0, route ] },
        { code: 0, indent: 0, parameters: [] },
      ], TWIN_BODY_EVENT_ID);
    });

    it('holds the steps behind a jump until it has landed', () =>
    {
      // Arrange
      const jabsBattler = buildJabsBattler(false, false, 100);
      startFlaring(jabsBattler, [ onStart([ jumpStep(''), addStateStep('') ]) ]);
      JabsBossManager.update();
      const sealedMidLeap = jabsBattler.getBattler().addState.mock.calls.length;

      // Act
      interpreters[0].isRunning.mockReturnValue(false);
      JabsBossManager.update();

      // Assert
      expect(sealedMidLeap).toBe(0);
      expect(jabsBattler.getBattler().addState).toHaveBeenCalledTimes(1);
    });

    it('skips the jump of a body no longer on the map, and carries on with the rest', () =>
    {
      // Arrange
      const { twinBody, mayorBattler } = startTwins([ onFallen([ 'twin' ], [ jumpStep('twin'), addStateStep('mayor') ]) ]);
      twinBody.isErased.mockReturnValue(true);

      // Act
      JabsBossManager.update();

      // Assert
      expect(interpreters).toHaveLength(0);
      expect(mayorBattler.getBattler().addState).toHaveBeenCalledTimes(1);
    });

    it('throws when a jump names a participant the encounter does not have', () =>
    {
      // Arrange
      registerFlaring([ onStart([ jumpStep('ghost') ]) ]);

      // Act
      const act = () => JabsBossManager.startEncounter('flaring');

      // Assert
      expect(act).toThrow(/reaction \[ opening ] names participant \[ ghost ]/);
    });
  });
});
//endregion plugins/abs/ext/boss/managers/jabs-boss-manager.test.js

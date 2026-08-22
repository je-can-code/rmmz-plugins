//region plugins/abs/ext/boss/managers/jabs-boss-manager.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('J-ABS-Boss JabsBossManager (unit, all downstream dependencies mocked)', () =>
{
  /** @type {typeof import('../../../../../../src/plugins/abs/ext/boss/managers/JabsBossManager.js').default} */
  let JabsBossManager;
  /** @type {typeof import('../../../../../../src/plugins/abs/ext/boss/models/JabsBossEncounter.js').default} */
  let JabsBossEncounter;
  /** @type {typeof import('../../../../../../src/plugins/abs/ext/boss/models/JabsBossParticipant.js').default} */
  let JabsBossParticipant;
  /** @type {typeof import('../../../../../../src/plugins/abs/ext/boss/models/JabsBossRoutine.js').default} */
  let JabsBossRoutine;
  /** @type {typeof import('../../../../../../src/plugins/abs/ext/boss/models/JabsBossStep.js').default} */
  let JabsBossStep;

  const ENEMY_ID = 581;
  const ENEMY_NAME = 'Gluttonwolf Mayor';
  const SKILL_ID = 2584;
  const SKILL_NAME = 'Devour';
  const EVENT_ID = 4;
  const CADENCE_FRAMES = 1200;
  const CAST_TIME = 30;

  /**
   * Builds a boss battler test double whose act-ability can be varied per test.
   * @param {boolean} isDead Whether the underlying battler reports itself defeated.
   * @param {boolean} isCasting Whether the battler is mid-cast or channeling.
   * @param {number} hpPercent The whole-number health percent the battler reports.
   * @returns {object} The stand-in JABS battler.
   */
  const buildJabsBattler = (isDead, isCasting, hpPercent) =>
  {
    const gameBattler = {
      isDead: () => isDead,
      currentHpPercent100: () => hpPercent,
    };

    return {
      getBattler: () => gameBattler,
      isCastingOrChanneling: () => isCasting,
      createJabsActionFromSkill: vi.fn(() => [ { getCastTime: () => CAST_TIME } ]),
      setDecidedAction: vi.fn(),
      setCastCountdown: vi.fn(),
      setPhase: vi.fn(),
    };
  };

  /**
   * Builds an encounter with a single participant and a single forceSkill routine.
   * @param {string} enemyExpect The enemy name the participant was authored against.
   * @param {string} skillExpect The skill name the step was authored against.
   * @param {boolean} cast Whether the step's skill observes its own cast time.
   * @returns {JabsBossEncounter}
   */
  const buildEncounter = (enemyExpect, skillExpect, cast) =>
  {
    const participant = new JabsBossParticipant('mayor', EVENT_ID, ENEMY_ID, enemyExpect);
    const step = new JabsBossStep('forceSkill', SKILL_ID, skillExpect, cast);
    const routine = new JabsBossRoutine('devour', CADENCE_FRAMES, [ step ]);

    return new JabsBossEncounter('gluttonwolf', 75, [ participant ], 'shared', [ routine ]);
  };

  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = { ABS: { EXT: { BOSS: {} } } };
    String.empty = '';

    globalThis.$dataEnemies = [];
    globalThis.$dataEnemies[ENEMY_ID] = { name: ENEMY_NAME };
    globalThis.$dataSkills = [];
    globalThis.$dataSkills[SKILL_ID] = { name: SKILL_NAME };

    globalThis.$gameMap = { event: vi.fn() };
    globalThis.$jabsEngine = { forceMapAction: vi.fn() };
    globalThis.JABS_ActionOptions = { Builder: () => ({ build: () => ({}) }) };

    ({ default: JabsBossParticipant } = await import('../../../../../../src/plugins/abs/ext/boss/models/JabsBossParticipant.js'));
    ({ default: JabsBossStep } = await import('../../../../../../src/plugins/abs/ext/boss/models/JabsBossStep.js'));
    ({ default: JabsBossRoutine } = await import('../../../../../../src/plugins/abs/ext/boss/models/JabsBossRoutine.js'));
    ({ default: JabsBossEncounter } = await import('../../../../../../src/plugins/abs/ext/boss/models/JabsBossEncounter.js'));
    ({ default: JabsBossManager } = await import('../../../../../../src/plugins/abs/ext/boss/managers/JabsBossManager.js'));
  });

  beforeEach(() =>
  {
    // static managers keep their state between tests; wipe it so no test inherits a live fight.
    JabsBossManager.encounters.clear();
    JabsBossManager.endEncounter();
    vi.clearAllMocks();
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

    it('makes the named encounter active when it is registered and valid', () =>
    {
      // Arrange
      JabsBossManager.registerEncounters([ buildEncounter(ENEMY_NAME, SKILL_NAME, true) ]);

      // Act
      JabsBossManager.startEncounter('gluttonwolf');

      // Assert
      expect(JabsBossManager.hasActiveEncounter()).toBe(true);
      expect(JabsBossManager.activeEncounter().key()).toBe('gluttonwolf');
    });

    it('seeds each routine a full interval so nothing fires on the opening frame', () =>
    {
      // Arrange
      JabsBossManager.registerEncounters([ buildEncounter(ENEMY_NAME, SKILL_NAME, true) ]);
      const jabsBattler = buildJabsBattler(false, false, 100);
      $gameMap.event.mockReturnValue({ getJabsBattler: () => jabsBattler });

      // Act
      JabsBossManager.startEncounter('gluttonwolf');
      JabsBossManager.update();

      // Assert
      expect($jabsEngine.forceMapAction).not.toHaveBeenCalled();
      expect(jabsBattler.setDecidedAction).not.toHaveBeenCalled();
    });
  });

  describe('encounter validation', () =>
  {
    it('throws when a participant enemy no longer carries its authored name', () =>
    {
      // Arrange
      JabsBossManager.registerEncounters([ buildEncounter('Emotion', SKILL_NAME, true) ]);

      // Act
      const act = () => JabsBossManager.startEncounter('gluttonwolf');

      // Assert
      expect(act).toThrow(/was authored as \[ Emotion ] but is now \[ Gluttonwolf Mayor ]/);
    });

    it('throws when a routine skill no longer carries its authored name', () =>
    {
      // Arrange
      JabsBossManager.registerEncounters([ buildEncounter(ENEMY_NAME, 'Doom Wing', true) ]);

      // Act
      const act = () => JabsBossManager.startEncounter('gluttonwolf');

      // Assert
      expect(act).toThrow(/was authored as \[ Doom Wing ] but is now \[ Devour ]/);
    });

    it('reports the absence plainly when the id resolves to no database row at all', () =>
    {
      // Arrange
      const participant = new JabsBossParticipant('ghost', EVENT_ID, 9999, 'Some Enemy');
      const encounter = new JabsBossEncounter('ghost-fight', 75, [ participant ], 'shared', []);
      JabsBossManager.registerEncounters([ encounter ]);

      // Act
      const act = () => JabsBossManager.startEncounter('ghost-fight');

      // Assert
      expect(act).toThrow(/but is now \[ <nothing> ]/);
    });

    it('skips the check when no name was recorded to check against', () =>
    {
      // Arrange
      JabsBossManager.registerEncounters([ buildEncounter('', '', true) ]);

      // Act
      const act = () => JabsBossManager.startEncounter('gluttonwolf');

      // Assert
      expect(act).not.toThrow();
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

    it('reports no battler when the participant event is absent from the map', () =>
    {
      // Arrange
      JabsBossManager.registerEncounters([ buildEncounter(ENEMY_NAME, SKILL_NAME, true) ]);
      JabsBossManager.startEncounter('gluttonwolf');
      $gameMap.event.mockReturnValue(undefined);

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
      JabsBossManager.registerEncounters([ buildEncounter(ENEMY_NAME, SKILL_NAME, true) ]);
      JabsBossManager.startEncounter('gluttonwolf');
      $gameMap.event.mockReturnValue({ getJabsBattler: () => buildJabsBattler(false, false, 42) });

      // Act
      const hpPercent = JabsBossManager.getBossHpPercent();

      // Assert
      expect(hpPercent).toBe(42);
    });

    it('answers below-threshold questions against the live boss', () =>
    {
      // Arrange- the boss sits at 40%, so a threshold of 40 is the inclusive edge and a threshold
      // of 30 is beneath it.
      JabsBossManager.registerEncounters([ buildEncounter(ENEMY_NAME, SKILL_NAME, true) ]);
      JabsBossManager.startEncounter('gluttonwolf');
      $gameMap.event.mockReturnValue({ getJabsBattler: () => buildJabsBattler(false, false, 40) });

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
      JabsBossManager.registerEncounters([ buildEncounter(ENEMY_NAME, SKILL_NAME, true) ]);
      JabsBossManager.startEncounter('gluttonwolf');
      $gameMap.event.mockReturnValue({ getJabsBattler: () => buildJabsBattler(false, false, 40) });

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
      JabsBossManager.registerEncounters([ buildEncounter(ENEMY_NAME, SKILL_NAME, false) ]);
      JabsBossManager.startEncounter('gluttonwolf');
      $gameMap.event.mockReturnValue({ getJabsBattler: () => buildJabsBattler(false, false, 100) });

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
      JabsBossManager.registerEncounters([ buildEncounter(ENEMY_NAME, SKILL_NAME, false) ]);
      JabsBossManager.startEncounter('gluttonwolf');
      $gameMap.event.mockReturnValue({ getJabsBattler: () => buildJabsBattler(false, true, 100) });

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
      JabsBossManager.registerEncounters([ buildEncounter(ENEMY_NAME, SKILL_NAME, false) ]);
      JabsBossManager.startEncounter('gluttonwolf');
      $gameMap.event.mockReturnValue({ getJabsBattler: () => buildJabsBattler(true, false, 0) });

      // Act
      for (let frame = 0; frame <= CADENCE_FRAMES; frame++)
      {
        JabsBossManager.update();
      }

      // Assert
      expect($jabsEngine.forceMapAction).not.toHaveBeenCalled();
    });

    it('skips the execution when the participant has no body on the map', () =>
    {
      // Arrange
      JabsBossManager.registerEncounters([ buildEncounter(ENEMY_NAME, SKILL_NAME, false) ]);
      JabsBossManager.startEncounter('gluttonwolf');
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

  describe('forceSkill', () =>
  {
    it('uses the instant path when the step declines its cast time', () =>
    {
      // Arrange
      JabsBossManager.registerEncounters([ buildEncounter(ENEMY_NAME, SKILL_NAME, false) ]);
      JabsBossManager.startEncounter('gluttonwolf');
      const jabsBattler = buildJabsBattler(false, false, 100);
      $gameMap.event.mockReturnValue({ getJabsBattler: () => jabsBattler });

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
      JabsBossManager.registerEncounters([ buildEncounter(ENEMY_NAME, SKILL_NAME, true) ]);
      JabsBossManager.startEncounter('gluttonwolf');
      const jabsBattler = buildJabsBattler(false, false, 100);
      $gameMap.event.mockReturnValue({ getJabsBattler: () => jabsBattler });

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

    it('throws when a step names a verb the manager does not implement', () =>
    {
      // Arrange
      const participant = new JabsBossParticipant('mayor', EVENT_ID, ENEMY_ID, ENEMY_NAME);
      const step = new JabsBossStep('teleport', SKILL_ID, SKILL_NAME, true);
      const routine = new JabsBossRoutine('blink', 1, [ step ]);
      const encounter = new JabsBossEncounter('bad-verb', 75, [ participant ], 'shared', [ routine ]);
      JabsBossManager.registerEncounters([ encounter ]);
      JabsBossManager.startEncounter('bad-verb');
      $gameMap.event.mockReturnValue({ getJabsBattler: () => buildJabsBattler(false, false, 100) });

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
      JabsBossManager.registerEncounters([ buildEncounter(ENEMY_NAME, SKILL_NAME, true) ]);
      JabsBossManager.startEncounter('gluttonwolf');

      // Act
      JabsBossManager.endEncounter();

      // Assert
      expect(JabsBossManager.hasActiveEncounter()).toBe(false);
      expect(JabsBossManager.activeEncounter()).toBeNull();
    });
  });
});
//endregion plugins/abs/ext/boss/managers/jabs-boss-manager.test.js
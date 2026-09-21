//region plugins/abs/ext/allyai/_models/jabs-battler.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('J-ABS-AllyAI JABS_Battler (unit, all downstream dependencies mocked)', () =>
{
  let originalShouldEngage;
  let originalInitIdleInfo;

  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = {
      ABS: {
        EXT: {
          ALLYAI: {
            Aliased: { JABS_Battler: new Map() },
            // the two knobs the formation seams read. Distinct values, so a seam reading the wrong
            // one of them shows up as a wrong answer rather than as a coincidence.
            Metadata: {
              FormationProgressEpsilon: 0.05,
              FormationStallFrames: 3,
            },
          },
        },
      },
    };

    globalThis.JABS_BattlerCoreData = {
      Builder: () => ({ setBattler: vi.fn().mockReturnThis(), build: vi.fn(() => ({ built: true })) }),
    };
    globalThis.JABS_AiManager = { getAlliedBattlersWithinRange: vi.fn() };

    // JABS_AllyAI is a downstream dependency (a sibling model file) imported only for its JSDoc
    // type reference; mock it entirely rather than pulling in its real JABS_AI superclass chain.
    vi.doMock('../../../../../../src/plugins/abs/ext/allyai/_models/JABS_AllyAI.js', () => ({ default: class {} }));

    function JABS_Battler(follower, actor, coreData)
    {
      this.follower = follower;
      this.actor = actor;
      this.coreData = coreData;
    }

    JABS_Battler.allyRubberbandRange = vi.fn(() => 8);
    JABS_Battler.closeDistance = 2;
    JABS_Battler.farDistance = 6;

    originalShouldEngage = vi.fn();
    JABS_Battler.prototype.shouldEngage = originalShouldEngage;

    originalInitIdleInfo = vi.fn();
    JABS_Battler.prototype.initIdleInfo = originalInitIdleInfo;

    globalThis.JABS_Battler = JABS_Battler;

    await import('../../../../../../src/plugins/abs/ext/allyai/_models/JABS_Battler.js');
  });

  beforeEach(() =>
  {
    originalShouldEngage.mockReset();

    // the aliased original is shared across this whole file, and several cases now seed a battler
    // by calling the method that reaches it. Counting calls is only meaningful from zero.
    originalInitIdleInfo.mockReset();
    globalThis.JABS_AiManager.getAlliedBattlersWithinRange.mockReset();
    globalThis.$gameParty = { isAggro: () => false };
    globalThis.$jabsEngine = { getPlayer1: vi.fn(() => ({ hasBattlerLastHit: () => false })) };
  });

  function buildBattler(overrides = {})
  {
    const battler = Object.create(globalThis.JABS_Battler.prototype);
    battler.isEnemy = () => false;
    return Object.assign(battler, overrides);
  }

  describe('createAlly', () =>
  {
    it('returns null when the follower is missing', () =>
    {
      expect(globalThis.JABS_Battler.createAlly(null, {})).toBeNull();
    });

    it('returns null when the actor is missing', () =>
    {
      expect(globalThis.JABS_Battler.createAlly({}, null)).toBeNull();
    });

    it('builds core data from the actor then constructs the battler', () =>
    {
      const follower = { id: 'follower' };
      const actor = { id: 'actor' };
      const result = globalThis.JABS_Battler.createAlly(follower, actor);
      expect(result.follower).toBe(follower);
      expect(result.actor).toBe(actor);
      expect(result.coreData).toEqual({ built: true });
    });
  });

  describe('shouldEngage', () =>
  {
    it('defers to the original logic for enemies', () =>
    {
      const battler = buildBattler({ isEnemy: () => true });
      originalShouldEngage.mockReturnValue(true);
      const target = { isInanimate: () => false };

      const result = battler.shouldEngage(target, 5);

      expect(originalShouldEngage).toHaveBeenCalledWith(target, 5);
      expect(result).toBe(true);
    });

    it('defers to the original logic when the party is aggro and the target is animate', () =>
    {
      globalThis.$gameParty.isAggro = () => true;
      const battler = buildBattler();
      originalShouldEngage.mockReturnValue(true);
      const target = { isInanimate: () => false };

      const result = battler.shouldEngage(target, 5);

      expect(originalShouldEngage).toHaveBeenCalledWith(target, 5);
      expect(result).toBe(true);
    });

    it('delegates to shouldAllyEngage when the party is aggro but the target is inanimate', () =>
    {
      globalThis.$gameParty.isAggro = () => true;
      const battler = buildBattler();
      battler.shouldAllyEngage = vi.fn(() => 'ally-decision');
      const target = { isInanimate: () => true };

      const result = battler.shouldEngage(target, 5);

      expect(battler.shouldAllyEngage).toHaveBeenCalledWith(target, 5);
      expect(originalShouldEngage).not.toHaveBeenCalled();
      expect(result).toBe('ally-decision');
    });

    it('delegates to shouldAllyEngage for a passive ally', () =>
    {
      const battler = buildBattler();
      battler.shouldAllyEngage = vi.fn(() => 'ally-decision');
      const target = { isInanimate: () => false };

      const result = battler.shouldEngage(target, 5);

      expect(battler.shouldAllyEngage).toHaveBeenCalledWith(target, 5);
      expect(result).toBe('ally-decision');
    });
  });

  describe('shouldAllyEngage', () =>
  {
    it('never engages when the ally mode is do-nothing', () =>
    {
      const battler = buildBattler({ getAllyAiMode: () => ({ isDoNothing: () => true }) });
      expect(battler.shouldAllyEngage({ isInanimate: () => false }, 5)).toBe(false);
    });

    it('never engages an inanimate target', () =>
    {
      const battler = buildBattler({ getAllyAiMode: () => null });
      expect(battler.shouldAllyEngage({ isInanimate: () => true }, 5)).toBe(false);
    });

    it('does not engage when the target is out of sight range', () =>
    {
      const battler = buildBattler({ getAllyAiMode: () => null, inSightRange: () => false });
      expect(battler.shouldAllyEngage({ isInanimate: () => false }, 5)).toBe(false);
    });

    it('engages when alerted', () =>
    {
      const battler = buildBattler({ getAllyAiMode: () => null, inSightRange: () => true, isAlerted: () => true });
      expect(battler.shouldAllyEngage({ isInanimate: () => false }, 5)).toBe(true);
    });

    it('engages when the player has a last-hit target, even without being alerted', () =>
    {
      globalThis.$jabsEngine.getPlayer1.mockReturnValue({ hasBattlerLastHit: () => true });
      const battler = buildBattler({ getAllyAiMode: () => null, inSightRange: () => true, isAlerted: () => false });
      expect(battler.shouldAllyEngage({ isInanimate: () => false }, 5)).toBe(true);
    });

    it('does not engage when neither alerted nor the player has a last-hit target', () =>
    {
      const battler = buildBattler({ getAllyAiMode: () => null, inSightRange: () => true, isAlerted: () => false });
      expect(battler.shouldAllyEngage({ isInanimate: () => false }, 5)).toBe(false);
    });
  });

  describe('getAllNearbyAllies', () =>
  {
    it('queries the ai manager within the rubberband range', () =>
    {
      const battler = buildBattler();
      const allies = [ 'ally1' ];
      globalThis.JABS_AiManager.getAlliedBattlersWithinRange.mockReturnValue(allies);

      const result = battler.getAllNearbyAllies();

      expect(globalThis.JABS_AiManager.getAlliedBattlersWithinRange).toHaveBeenCalledWith(battler, 8);
      expect(result).toBe(allies);
    });
  });

  describe('getAllyAiMode', () =>
  {
    it('is null for enemies', () =>
    {
      const battler = buildBattler({ isEnemy: () => true });
      expect(battler.getAllyAiMode()).toBeNull();
    });

    it('reads the ally AI mode from the underlying battler for allies', () =>
    {
      const allyAi = { id: 'ally-ai' };
      const battler = buildBattler({ getBattler: () => ({ getAllyAI: () => allyAi }) });
      expect(battler.getAllyAiMode()).toBe(allyAi);
    });
  });

  describe('getCloseDistance / getFarDistance', () =>
  {
    it('uses the global default for enemies', () =>
    {
      const battler = buildBattler({ isEnemy: () => true });
      expect(battler.getCloseDistance()).toBe(2);
      expect(battler.getFarDistance()).toBe(6);
    });

    it('uses the global default for allies with no ally AI mode', () =>
    {
      const battler = buildBattler({ getAllyAiMode: () => null });
      expect(battler.getCloseDistance()).toBe(2);
      expect(battler.getFarDistance()).toBe(6);
    });

    it('delegates to the ally AI mode\'s own spacing when present', () =>
    {
      const allyAi = { getCloseDistance: () => 1, getFarDistance: () => 9 };
      const battler = buildBattler({ getAllyAiMode: () => allyAi });
      expect(battler.getCloseDistance()).toBe(1);
      expect(battler.getFarDistance()).toBe(9);
    });
  });

  describe('getAllyLeashRange', () =>
  {
    it('uses the base rubberband range with no multiplier when there is no ally AI mode', () =>
    {
      const battler = buildBattler({ getAllyAiMode: () => null });
      expect(battler.getAllyLeashRange()).toBe(8);
    });

    it('scales the base rubberband range by the ally AI leash multiplier', () =>
    {
      const battler = buildBattler({ getAllyAiMode: () => ({ getLeashMultiplier: () => 2 }) });
      expect(battler.getAllyLeashRange()).toBe(16);
    });
  });

  describe('applyBattleMemories', () =>
  {
    it('does nothing for enemies', () =>
    {
      const battler = buildBattler({ isEnemy: () => true, getBattler: vi.fn() });
      battler.applyBattleMemories({ id: 'memory' });
      expect(battler.getBattler).not.toHaveBeenCalled();
    });

    it('applies the memory to the ally AI for allies', () =>
    {
      const applyMemory = vi.fn();
      const battler = buildBattler({ getBattler: () => ({ getAllyAI: () => ({ applyMemory }) }) });
      const memory = { id: 'memory' };

      battler.applyBattleMemories(memory);

      expect(applyMemory).toHaveBeenCalledWith(memory);
    });
  });

  describe('the formation seams', () =>
  {
    /**
     * An ally with its idle state already seeded, which is when a formation tracker exists.
     * @returns {object}
     */
    const buildIdleAlly = () =>
    {
      const battler = new globalThis.JABS_Battler();
      battler.initIdleInfo();

      return battler;
    };

    describe('observeFormationApproach', () =>
    {
      it('records a frame of no progress against the configured epsilon', () =>
      {
        // Arrange - the same distance twice, which is an ally pressed against a wall.
        const ally = buildIdleAlly();

        // Act.
        ally.observeFormationApproach(5, 10, 10);
        ally.observeFormationApproach(5, 10, 10);

        // Assert - two observations, one of which opened the attempt, so one frame is spent.
        expect(ally.hasGivenUpOnFormationSlot())
          .toBe(false);
        expect(ally.getFormationStall()
          .isStalled(1))
          .toBe(true);
      });

      it('counts progress rather than elapsed frames', () =>
      {
        // Arrange - an ally taking a long detour and getting steadily closer. This is the whole
        // reason the tracker measures progress: a frame counter would give up on a legitimate
        // walk around a lake.
        const ally = buildIdleAlly();

        // Act.
        [ 9, 8, 7, 6, 5, 4, 3, 2 ].forEach(distance => ally.observeFormationApproach(distance, 10, 10));

        // Assert - eight frames against a three-frame patience, and still trying.
        expect(ally.hasGivenUpOnFormationSlot())
          .toBe(false);
      });

      it('starts over when the slot itself moves', () =>
      {
        // Arrange - the party turns a corner and every slot shifts. An ally part-way through
        // running out of patience against the old slot has a new problem, not a continuing one.
        const ally = buildIdleAlly();
        [ 5, 5, 5, 5 ].forEach(distance => ally.observeFormationApproach(distance, 10, 10));

        // Act.
        ally.observeFormationApproach(5, 12, 10);

        // Assert.
        expect(ally.hasGivenUpOnFormationSlot())
          .toBe(false);
      });
    });

    describe('hasGivenUpOnFormationSlot', () =>
    {
      it('gives up once the configured patience is spent', () =>
      {
        // Arrange - four identical observations against a patience of three: the first opens the
        // attempt and the next three are the wasted frames.
        const ally = buildIdleAlly();

        // Act.
        [ 5, 5, 5, 5 ].forEach(distance => ally.observeFormationApproach(distance, 10, 10));

        // Assert.
        expect(ally.hasGivenUpOnFormationSlot())
          .toBe(true);
      });

      it('has not given up one frame short of the patience', () =>
      {
        // Arrange - the boundary, one frame below. Without this the threshold could be anything.
        const ally = buildIdleAlly();

        // Act.
        [ 5, 5, 5 ].forEach(distance => ally.observeFormationApproach(distance, 10, 10));

        // Assert.
        expect(ally.hasGivenUpOnFormationSlot())
          .toBe(false);
      });

      it('has not given up before anything has been observed at all', () =>
      {
        // Arrange - a freshly idle ally standing in its slot.
        const ally = buildIdleAlly();

        // Act & Assert.
        expect(ally.hasGivenUpOnFormationSlot())
          .toBe(false);
      });
    });

    describe('clearFormationApproach', () =>
    {
      it('spends the attempt, so the same slot is a new problem next time', () =>
      {
        // Arrange - an ally that gave up, then arrived.
        const ally = buildIdleAlly();
        [ 5, 5, 5, 5 ].forEach(distance => ally.observeFormationApproach(distance, 10, 10));

        // Act.
        ally.clearFormationApproach();

        // Assert - and the very same slot, deliberately: a reset that only forgot the distance
        // would resume the old attempt the moment this ally fell behind again.
        expect(ally.hasGivenUpOnFormationSlot())
          .toBe(false);
        ally.observeFormationApproach(5, 10, 10);
        expect(ally.hasGivenUpOnFormationSlot())
          .toBe(false);
      });
    });

    it('gives every ally its own patience', () =>
    {
      // Arrange - one ally wedged behind scenery while another walks freely. A tracker shared
      // across battlers would strand the one that was doing fine.
      const stuck = buildIdleAlly();
      const walking = buildIdleAlly();

      // Act.
      [ 5, 5, 5, 5 ].forEach(distance => stuck.observeFormationApproach(distance, 10, 10));
      [ 9, 8, 7, 6 ].forEach(distance => walking.observeFormationApproach(distance, 10, 10));

      // Assert.
      expect(stuck.hasGivenUpOnFormationSlot())
        .toBe(true);
      expect(walking.hasGivenUpOnFormationSlot())
        .toBe(false);
    });
  });

  describe('initIdleInfo()', () =>
  {
    it('still performs the original idle setup', () =>
    {
      // Arrange
      const battler = new globalThis.JABS_Battler();

      // Act
      battler.initIdleInfo();

      // Assert
      expect(originalInitIdleInfo).toHaveBeenCalledTimes(1);
    });

    it('seeds a formation stall tracker that starts with no attempt recorded', () =>
    {
      // Arrange
      const battler = new globalThis.JABS_Battler();

      // Act
      battler.initIdleInfo();

      // Assert
      // a single observation is a fresh attempt, so one frame of patience is not yet spent.
      battler.getFormationStall()
        .observe(5, 10, 10, 0.05);
      expect(battler.getFormationStall()
        .isStalled(1)).toBe(false);
    });

    it('gives each battler a tracker of its own', () =>
    {
      // Arrange
      const rupert = new globalThis.JABS_Battler();
      const someoneElse = new globalThis.JABS_Battler();
      rupert.initIdleInfo();
      someoneElse.initIdleInfo();

      // Act
      // only rupert is stuck; a shared tracker would strand his neighbour too.
      rupert.getFormationStall()
        .observe(5, 10, 10, 0.05);
      rupert.getFormationStall()
        .observe(5, 10, 10, 0.05);

      // Assert
      expect(rupert.getFormationStall()
        .isStalled(1)).toBe(true);
      expect(someoneElse.getFormationStall()
        .isStalled(1)).toBe(false);
    });
  });
});
//endregion plugins/abs/ext/allyai/_models/jabs-battler.test.js

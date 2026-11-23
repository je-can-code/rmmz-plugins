//region plugins/abs/ext/allyai/_models/jabs-battler.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('J-ABS-AllyAI JABS_Battler (unit, all downstream dependencies mocked)', () =>
{
  let originalShouldEngage;
  let originalInitIdleInfo;
  let originalInitBattleInfo;
  let originalUpdateTimers;

  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = {
      ABS: {
        Balloons: { Exclamation: 1, Sweat: 6 },
        EXT: {
          ALLYAI: {
            Aliased: { JABS_Battler: new Map() },
            // the knobs the stance seams read. Distinct values, so a seam reading the wrong one of
            // them shows up as a wrong answer rather than as a coincidence.
            Metadata: {
              StanceProgressEpsilon: 0.05,
              StanceSpotDrift: 0.5,
              StanceStallFrames: 3,
              StanceFacingSettleFrames: 2,
              StanceCatchUpDistance: 1.5,
              StanceTolerance: 0.25,
              PullBackFrames: 180,
            },
          },
        },
      },
    };

    globalThis.JABS_BattlerCoreData = {
      Builder: () => ({ setBattler: vi.fn().mockReturnThis(), build: vi.fn(() => ({ built: true })) }),
    };
    globalThis.JABS_AiManager = {
      getAlliedBattlersWithinRange: vi.fn(),
      getClosestOpposingBattler: vi.fn(),
    };
    globalThis.Graphics = { frameCount: 100 };

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

    originalInitBattleInfo = vi.fn();
    JABS_Battler.prototype.initBattleInfo = originalInitBattleInfo;

    originalUpdateTimers = vi.fn();
    JABS_Battler.prototype.updateTimers = originalUpdateTimers;

    globalThis.JABS_Battler = JABS_Battler;

    await import('../../../../../../src/plugins/abs/ext/allyai/_models/JABS_Battler.js');
  });

  beforeEach(() =>
  {
    originalShouldEngage.mockReset();

    // the aliased originals are shared across this whole file, and several cases seed a battler by
    // calling the method that reaches them. Counting calls is only meaningful from zero.
    originalInitIdleInfo.mockReset();
    originalInitBattleInfo.mockReset();
    originalUpdateTimers.mockReset();
    globalThis.JABS_AiManager.getAlliedBattlersWithinRange.mockReset();
    globalThis.JABS_AiManager.getClosestOpposingBattler.mockReset();
    globalThis.Graphics.frameCount = 100;
    globalThis.$gameParty = { getPartyStanceType: () => ({ engagesFirst: false }) };
    globalThis.$jabsEngine = { getPlayer1: vi.fn(() => ({ lastHit: () => null })) };
  });

  function buildBattler(overrides = {})
  {
    const battler = Object.create(globalThis.JABS_Battler.prototype);
    battler.isEnemy = () => false;
    return Object.assign(battler, overrides);
  }

  /**
   * Builds a battler the leader could have struck.
   * @param {object} overrides Anything to replace on it.
   * @returns {object}
   */
  function buildFoe(overrides = {})
  {
    return Object.assign({ isInanimate: () => false, isDead: () => false }, overrides);
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
      // Arrange
      const battler = buildBattler({ isEnemy: () => true });
      originalShouldEngage.mockReturnValue(true);
      const target = { isInanimate: () => false };

      // Act
      const result = battler.shouldEngage(target, 5);

      // Assert
      expect(originalShouldEngage).toHaveBeenCalledWith(target, 5);
      expect(result).toBe(true);
    });

    it('delegates to shouldAllyEngage for allies', () =>
    {
      // Arrange
      const battler = buildBattler();
      battler.shouldAllyEngage = vi.fn(() => 'ally-decision');
      const target = { isInanimate: () => false };

      // Act
      const result = battler.shouldEngage(target, 5);

      // Assert
      expect(battler.shouldAllyEngage).toHaveBeenCalledWith(target, 5);
      expect(originalShouldEngage).not.toHaveBeenCalled();
      expect(result).toBe('ally-decision');
    });
  });

  describe('shouldAllyEngage', () =>
  {
    /**
     * An ally that passes every gate up to the stance, so each case below changes one thing.
     * @param {object} overrides Anything to replace on it.
     * @returns {object}
     */
    const buildWillingAlly = (overrides = {}) => buildBattler(Object.assign({
      getAllyAiMode: () => null,
      isPullingBack: () => false,
      inSightRange: () => true,
      isAlerted: () => false,
      isLeaderFighting: () => false,
    }, overrides));

    it('never engages when the ally mode is do-nothing', () =>
    {
      // Arrange - alerted too, so only the do-nothing gate can explain the refusal.
      const battler = buildWillingAlly({ getAllyAiMode: () => ({ isDoNothing: () => true }), isAlerted: () => true });

      // Act & Assert
      expect(battler.shouldAllyEngage({ isInanimate: () => false }, 5)).toBe(false);
    });

    it('gets past the do-nothing gate when the ally mode is not do-nothing', () =>
    {
      // Arrange
      const battler = buildWillingAlly({ getAllyAiMode: () => ({ isDoNothing: () => false }), isAlerted: () => true });

      // Act & Assert
      expect(battler.shouldAllyEngage({ isInanimate: () => false }, 5)).toBe(true);
    });

    it('never engages an inanimate target', () =>
    {
      // Arrange
      const battler = buildWillingAlly({ isAlerted: () => true });

      // Act & Assert
      expect(battler.shouldAllyEngage({ isInanimate: () => true }, 5)).toBe(false);
    });

    it('never engages while pulling back', () =>
    {
      // Arrange
      const battler = buildWillingAlly({ isPullingBack: () => true, isAlerted: () => true });

      // Act & Assert
      expect(battler.shouldAllyEngage({ isInanimate: () => false }, 5)).toBe(false);
    });

    it('does not engage when the target is out of sight range', () =>
    {
      // Arrange
      const battler = buildWillingAlly({ inSightRange: () => false, isAlerted: () => true });

      // Act & Assert
      expect(battler.shouldAllyEngage({ isInanimate: () => false }, 5)).toBe(false);
    });

    it('engages when alerted, whatever the stance', () =>
    {
      // Arrange
      const battler = buildWillingAlly({ isAlerted: () => true });

      // Act & Assert
      expect(battler.shouldAllyEngage({ isInanimate: () => false }, 5)).toBe(true);
    });

    it('engages when the leader is fighting, whatever the stance', () =>
    {
      // Arrange
      const battler = buildWillingAlly({ isLeaderFighting: () => true });

      // Act & Assert
      expect(battler.shouldAllyEngage({ isInanimate: () => false }, 5)).toBe(true);
    });

    it('engages anything in sight when the stance goes in first', () =>
    {
      // Arrange
      globalThis.$gameParty.getPartyStanceType = () => ({ engagesFirst: true });
      const battler = buildWillingAlly();

      // Act & Assert
      expect(battler.shouldAllyEngage({ isInanimate: () => false }, 5)).toBe(true);
    });

    it('waits when the stance does not go in first and nothing has called it in', () =>
    {
      // Arrange
      const battler = buildWillingAlly();

      // Act & Assert
      expect(battler.shouldAllyEngage({ isInanimate: () => false }, 5)).toBe(false);
    });
  });

  describe('isLeaderFighting', () =>
  {
    it('is not fighting when the leader has struck nothing', () =>
    {
      // Arrange
      const battler = buildBattler();

      // Act & Assert
      expect(battler.isLeaderFighting()).toBe(false);
    });

    it('is not fighting when the leader last struck something inanimate', () =>
    {
      // Arrange
      const crate = buildFoe({ isInanimate: () => true });
      globalThis.$jabsEngine.getPlayer1.mockReturnValue({ lastHit: () => crate });
      const battler = buildBattler();

      // Act & Assert
      expect(battler.isLeaderFighting()).toBe(false);
    });

    it('is not fighting when the leader last struck something already defeated', () =>
    {
      // Arrange
      const slime = buildFoe({ isDead: () => true });
      globalThis.$jabsEngine.getPlayer1.mockReturnValue({ lastHit: () => slime });
      const battler = buildBattler();

      // Act & Assert
      expect(battler.isLeaderFighting()).toBe(false);
    });

    it('is fighting when the leader last struck something alive that fights back', () =>
    {
      // Arrange
      const slime = buildFoe();
      globalThis.$jabsEngine.getPlayer1.mockReturnValue({ lastHit: () => slime });
      const battler = buildBattler();

      // Act & Assert
      expect(battler.isLeaderFighting()).toBe(true);
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

  describe('the stance seams', () =>
  {
    /**
     * An ally with its idle state already seeded, which is when the stance trackers exist.
     * @returns {object}
     */
    const buildIdleAlly = () =>
    {
      const battler = new globalThis.JABS_Battler();
      battler.initIdleInfo();

      return battler;
    };

    describe('observeStanceApproach', () =>
    {
      it('records a frame of no progress against the configured epsilon', () =>
      {
        // Arrange - the same distance twice, which is an ally pressed against a wall.
        const ally = buildIdleAlly();

        // Act.
        ally.observeStanceApproach(5, 10, 10);
        ally.observeStanceApproach(5, 10, 10);

        // Assert - two observations, one of which opened the attempt, so one frame is spent.
        expect(ally.hasGivenUpOnStanceSpot())
          .toBe(false);
        expect(ally.getStanceStall()
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
        [ 9, 8, 7, 6, 5, 4, 3, 2 ].forEach(distance => ally.observeStanceApproach(distance, 10, 10));

        // Assert - eight frames against a three-frame patience, and still trying.
        expect(ally.hasGivenUpOnStanceSpot())
          .toBe(false);
      });

      it('holds the same attempt while the spot only drifts within the configured tolerance', () =>
      {
        // Arrange - a shuffling ally drags its spot a hair each frame.
        const ally = buildIdleAlly();

        // Act.
        [ 10, 10.1, 10.2, 10.3 ].forEach(spotX => ally.observeStanceApproach(5, spotX, 10));

        // Assert - one attempt, three wasted frames, out of patience.
        expect(ally.hasGivenUpOnStanceSpot())
          .toBe(true);
      });

      it('starts over when the spot itself moves', () =>
      {
        // Arrange - the party turns a corner and the spot shifts. An ally part-way through
        // running out of patience against the old spot has a new problem, not a continuing one.
        const ally = buildIdleAlly();
        [ 5, 5, 5 ].forEach(distance => ally.observeStanceApproach(distance, 10, 10));

        // Act.
        ally.observeStanceApproach(5, 12, 10);

        // Assert.
        expect(ally.hasGivenUpOnStanceSpot())
          .toBe(false);
      });
    });

    describe('hasGivenUpOnStanceSpot', () =>
    {
      it('gives up once the configured patience is spent', () =>
      {
        // Arrange - four identical observations against a patience of three: the first opens the
        // attempt and the next three are the wasted frames.
        const ally = buildIdleAlly();

        // Act.
        [ 5, 5, 5, 5 ].forEach(distance => ally.observeStanceApproach(distance, 10, 10));

        // Assert.
        expect(ally.hasGivenUpOnStanceSpot())
          .toBe(true);
      });

      it('has not given up one frame short of the patience', () =>
      {
        // Arrange - the boundary, one frame below. Without this the threshold could be anything.
        const ally = buildIdleAlly();

        // Act.
        [ 5, 5, 5 ].forEach(distance => ally.observeStanceApproach(distance, 10, 10));

        // Assert.
        expect(ally.hasGivenUpOnStanceSpot())
          .toBe(false);
      });
    });

    describe('clearStanceApproach', () =>
    {
      it('spends the attempt, so the same spot is a new problem next time', () =>
      {
        // Arrange - an ally that gave up, then arrived.
        const ally = buildIdleAlly();
        [ 5, 5, 5, 5 ].forEach(distance => ally.observeStanceApproach(distance, 10, 10));

        // Act.
        ally.clearStanceApproach();

        // Assert - and the very same spot, deliberately: a reset that only forgot the distance
        // would resume the old attempt the moment this ally fell behind again.
        expect(ally.hasGivenUpOnStanceSpot())
          .toBe(false);
        ally.observeStanceApproach(5, 10, 10);
        expect(ally.hasGivenUpOnStanceSpot())
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
      [ 5, 5, 5, 5 ].forEach(distance => stuck.observeStanceApproach(distance, 10, 10));
      [ 9, 8, 7, 6 ].forEach(distance => walking.observeStanceApproach(distance, 10, 10));

      // Assert.
      expect(stuck.hasGivenUpOnStanceSpot())
        .toBe(true);
      expect(walking.hasGivenUpOnStanceSpot())
        .toBe(false);
    });

    describe('observeLeaderFacing / getStanceFacing', () =>
    {
      it('lays the stance out from the first facing it sees', () =>
      {
        // Arrange
        const ally = buildIdleAlly();

        // Act
        ally.observeLeaderFacing(6);

        // Assert
        expect(ally.getStanceFacing()).toBe(6);
      });

      it('turns the stance only after the configured settle frames', () =>
      {
        // Arrange - a settle of two frames.
        const ally = buildIdleAlly();
        ally.observeLeaderFacing(2);
        ally.observeLeaderFacing(8);

        // Act
        const afterOneFrame = ally.getStanceFacing();
        ally.observeLeaderFacing(8);

        // Assert
        expect(afterOneFrame).toBe(2);
        expect(ally.getStanceFacing()).toBe(8);
      });
    });

    describe('updateStanceCatchUp / isStanceCatchingUp', () =>
    {
      it('starts sprinting once well out of position', () =>
      {
        // Arrange
        const ally = buildIdleAlly();

        // Act
        ally.updateStanceCatchUp(1.6);

        // Assert
        expect(ally.isStanceCatchingUp()).toBe(true);
      });

      it('does not start sprinting at exactly the catch-up distance', () =>
      {
        // Arrange - the boundary: strictly further than the distance is what starts a sprint.
        const ally = buildIdleAlly();

        // Act
        ally.updateStanceCatchUp(1.5);

        // Assert
        expect(ally.isStanceCatchingUp()).toBe(false);
      });

      it('keeps sprinting while closer than the catch-up distance but not yet in position', () =>
      {
        // Arrange
        const ally = buildIdleAlly();
        ally.updateStanceCatchUp(3);

        // Act
        ally.updateStanceCatchUp(1);

        // Assert
        expect(ally.isStanceCatchingUp()).toBe(true);
      });

      it('stops sprinting once back within the stance tolerance', () =>
      {
        // Arrange
        const ally = buildIdleAlly();
        ally.updateStanceCatchUp(3);

        // Act - exactly the tolerance counts as in position.
        ally.updateStanceCatchUp(0.25);

        // Assert
        expect(ally.isStanceCatchingUp()).toBe(false);
      });

      it('still counts a sprint the frame after the stance last steered the ally', () =>
      {
        // Arrange
        const ally = buildIdleAlly();
        ally.updateStanceCatchUp(3);

        // Act
        globalThis.Graphics.frameCount = 101;

        // Assert
        expect(ally.isStanceCatchingUp()).toBe(true);
      });

      it('drops a sprint left over from before the stance last steered the ally', () =>
      {
        // Arrange - a sprint, then two frames of the ally doing something else.
        const ally = buildIdleAlly();
        ally.updateStanceCatchUp(3);

        // Act
        globalThis.Graphics.frameCount = 102;

        // Assert
        expect(ally.isStanceCatchingUp()).toBe(false);
      });
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

    it('seeds a stance stall tracker that starts with no attempt recorded', () =>
    {
      // Arrange
      const battler = new globalThis.JABS_Battler();

      // Act
      battler.initIdleInfo();

      // Assert
      // a single observation is a fresh attempt, so one frame of patience is not yet spent.
      battler.getStanceStall()
        .observe(5, 10, 10, 0.05, 0.5);
      expect(battler.getStanceStall()
        .isStalled(1)).toBe(false);
    });

    it('seeds a stance facing that has not seen any facing yet', () =>
    {
      // Arrange
      const battler = new globalThis.JABS_Battler();

      // Act
      battler.initIdleInfo();

      // Assert
      expect(battler.getStanceFacing()).toBe(0);
    });

    it('starts out not sprinting', () =>
    {
      // Arrange
      const battler = new globalThis.JABS_Battler();

      // Act
      battler.initIdleInfo();

      // Assert
      expect(battler.stanceCatchingUp()).toBe(false);
      expect(battler.stanceFollowFrame()).toBe(0);
    });

    it('gives each battler trackers of its own', () =>
    {
      // Arrange
      const rupert = new globalThis.JABS_Battler();
      const someoneElse = new globalThis.JABS_Battler();
      rupert.initIdleInfo();
      someoneElse.initIdleInfo();

      // Act
      // only rupert is stuck; a shared tracker would strand his neighbour too.
      rupert.getStanceStall()
        .observe(5, 10, 10, 0.05, 0.5);
      rupert.getStanceStall()
        .observe(5, 10, 10, 0.05, 0.5);
      rupert.observeLeaderFacing(4);

      // Assert
      expect(rupert.getStanceStall()
        .isStalled(1)).toBe(true);
      expect(someoneElse.getStanceStall()
        .isStalled(1)).toBe(false);
      expect(someoneElse.getStanceFacing()).toBe(0);
    });
  });

  describe('initBattleInfo()', () =>
  {
    it('still performs the original battle setup, and starts with no pull back in effect', () =>
    {
      // Arrange
      const battler = new globalThis.JABS_Battler();

      // Act
      battler.initBattleInfo();

      // Assert
      expect(originalInitBattleInfo).toHaveBeenCalledTimes(1);
      expect(battler.pullBackFrames()).toBe(0);
    });
  });

  describe('updateTimers()', () =>
  {
    it('still updates the original timers, and counts down a pull back', () =>
    {
      // Arrange
      const battler = new globalThis.JABS_Battler();
      battler.setPullBackFrames(5);

      // Act
      battler.updateTimers();

      // Assert
      expect(originalUpdateTimers).toHaveBeenCalledTimes(1);
      expect(battler.pullBackFrames()).toBe(4);
    });
  });

  describe('processPullBackTimer / isPullingBack', () =>
  {
    it('counts nothing down when no pull back is in effect', () =>
    {
      // Arrange
      const battler = new globalThis.JABS_Battler();
      battler.setPullBackFrames(0);

      // Act
      battler.processPullBackTimer();

      // Assert - never below zero.
      expect(battler.pullBackFrames()).toBe(0);
      expect(battler.isPullingBack()).toBe(false);
    });

    it('is still pulling back with a frame left', () =>
    {
      // Arrange
      const battler = new globalThis.JABS_Battler();
      battler.setPullBackFrames(2);

      // Act
      battler.processPullBackTimer();

      // Assert
      expect(battler.isPullingBack()).toBe(true);
    });

    it('stops pulling back as the last frame runs out', () =>
    {
      // Arrange
      const battler = new globalThis.JABS_Battler();
      battler.setPullBackFrames(1);

      // Act
      battler.processPullBackTimer();

      // Assert
      expect(battler.isPullingBack()).toBe(false);
    });
  });

  describe('chargeOnCommand', () =>
  {
    /**
     * An ally ready to charge, with every collaborator recorded.
     * @param {object} overrides Anything to replace on it.
     * @returns {object}
     */
    const buildChargingAlly = (overrides = {}) =>
    {
      const ally = buildBattler(Object.assign({
        getAllyAiMode: () => ({ isDoNothing: () => false }),
        isEngaged: () => false,
        findChargeTarget: () => 'slime',
        showBalloon: vi.fn(),
        engageTarget: vi.fn(),
      }, overrides));
      ally.setPullBackFrames(30);

      return ally;
    };

    it('does nothing for an ally told to do nothing', () =>
    {
      // Arrange
      const ally = buildChargingAlly({ getAllyAiMode: () => ({ isDoNothing: () => true }) });

      // Act
      ally.chargeOnCommand();

      // Assert - nor does the order cancel its pull back.
      expect(ally.engageTarget).not.toHaveBeenCalled();
      expect(ally.pullBackFrames()).toBe(30);
    });

    it('leaves an ally already fighting to its fight', () =>
    {
      // Arrange
      const ally = buildChargingAlly({ isEngaged: () => true });

      // Act
      ally.chargeOnCommand();

      // Assert
      expect(ally.engageTarget).not.toHaveBeenCalled();
      expect(ally.pullBackFrames()).toBe(30);
    });

    it('cancels the pull back but charges nothing when nothing is in reach', () =>
    {
      // Arrange
      const ally = buildChargingAlly({ findChargeTarget: () => null });

      // Act
      ally.chargeOnCommand();

      // Assert
      expect(ally.pullBackFrames()).toBe(0);
      expect(ally.showBalloon).not.toHaveBeenCalled();
      expect(ally.engageTarget).not.toHaveBeenCalled();
    });

    it('cancels the pull back, shows the charge, and engages the target', () =>
    {
      // Arrange
      const ally = buildChargingAlly();

      // Act
      ally.chargeOnCommand();

      // Assert
      expect(ally.pullBackFrames()).toBe(0);
      expect(ally.showBalloon).toHaveBeenCalledWith(1);
      expect(ally.engageTarget).toHaveBeenCalledWith('slime');
    });
  });

  describe('findChargeTarget', () =>
  {
    it('charges whatever the leader is fighting when it is within reach', () =>
    {
      // Arrange - the nearest foe is a different battler, so answering it would be the wrong answer.
      const leaderFoe = buildFoe();
      globalThis.$jabsEngine.getPlayer1.mockReturnValue({ lastHit: () => leaderFoe });
      globalThis.JABS_AiManager.getClosestOpposingBattler.mockReturnValue(buildFoe());
      const ally = buildBattler({ isLeaderFighting: () => true, canChargeAt: () => true });

      // Act & Assert
      expect(ally.findChargeTarget()).toBe(leaderFoe);
    });

    it('falls back to the nearest foe when the leader\'s fight is out of reach', () =>
    {
      // Arrange
      const leaderFoe = buildFoe();
      const nearestFoe = buildFoe();
      globalThis.$jabsEngine.getPlayer1.mockReturnValue({ lastHit: () => leaderFoe });
      globalThis.JABS_AiManager.getClosestOpposingBattler.mockReturnValue(nearestFoe);
      const ally = buildBattler({ isLeaderFighting: () => true, canChargeAt: target => target === nearestFoe });

      // Act & Assert
      expect(ally.findChargeTarget()).toBe(nearestFoe);
    });

    it('charges the nearest foe when the leader is not fighting', () =>
    {
      // Arrange
      const nearestFoe = buildFoe();
      globalThis.JABS_AiManager.getClosestOpposingBattler.mockReturnValue(nearestFoe);
      const ally = buildBattler({ isLeaderFighting: () => false, canChargeAt: () => true });

      // Act & Assert
      expect(ally.findChargeTarget()).toBe(nearestFoe);
    });

    it('finds nothing when nothing is in sight', () =>
    {
      // Arrange
      globalThis.JABS_AiManager.getClosestOpposingBattler.mockReturnValue(null);
      const ally = buildBattler({ isLeaderFighting: () => false, canChargeAt: () => true });

      // Act & Assert
      expect(ally.findChargeTarget()).toBeNull();
    });

    it('finds nothing when the nearest thing in sight is inanimate', () =>
    {
      // Arrange
      globalThis.JABS_AiManager.getClosestOpposingBattler.mockReturnValue(buildFoe({ isInanimate: () => true }));
      const ally = buildBattler({ isLeaderFighting: () => false, canChargeAt: () => true });

      // Act & Assert
      expect(ally.findChargeTarget()).toBeNull();
    });

    it('finds nothing when the nearest foe is out of reach', () =>
    {
      // Arrange
      globalThis.JABS_AiManager.getClosestOpposingBattler.mockReturnValue(buildFoe());
      const ally = buildBattler({ isLeaderFighting: () => false, canChargeAt: () => false });

      // Act & Assert
      expect(ally.findChargeTarget()).toBeNull();
    });
  });

  describe('canChargeAt', () =>
  {
    /**
     * A foe at a fixed distance from the leader.
     * @param {number} fromLeader How far the foe stands from the leader.
     * @returns {object}
     */
    const buildFoeFromLeader = fromLeader => buildFoe({ distanceToDesignatedTarget: () => fromLeader });

    it('cannot charge a foe beyond its pursuit range', () =>
    {
      // Arrange - close to the leader, so only the pursuit gate can refuse.
      const ally = buildBattler({ distanceToDesignatedTarget: () => 20, inPursuitRange: () => false, getAllyLeashRange: () => 10 });

      // Act & Assert
      expect(ally.canChargeAt(buildFoeFromLeader(2))).toBe(false);
    });

    it('cannot charge a foe beyond its leash of the leader', () =>
    {
      // Arrange
      const ally = buildBattler({ distanceToDesignatedTarget: () => 4, inPursuitRange: () => true, getAllyLeashRange: () => 10 });

      // Act & Assert
      expect(ally.canChargeAt(buildFoeFromLeader(10.5))).toBe(false);
    });

    it('can charge a foe at exactly its leash of the leader', () =>
    {
      // Arrange - the boundary.
      const ally = buildBattler({ distanceToDesignatedTarget: () => 4, inPursuitRange: () => true, getAllyLeashRange: () => 10 });

      // Act & Assert
      expect(ally.canChargeAt(buildFoeFromLeader(10))).toBe(true);
    });

    it('measures the pursuit gate by its own distance to the foe', () =>
    {
      // Arrange
      const inPursuitRange = vi.fn(() => true);
      const ally = buildBattler({ distanceToDesignatedTarget: () => 7, inPursuitRange, getAllyLeashRange: () => 10 });
      const foe = buildFoeFromLeader(2);

      // Act
      ally.canChargeAt(foe);

      // Assert
      expect(inPursuitRange).toHaveBeenCalledWith(foe, 7);
    });
  });

  describe('pullBackOnCommand', () =>
  {
    it('drops its fight and its grudges, holds off for the configured frames, and shows it', () =>
    {
      // Arrange
      const ally = buildBattler({ disengageTarget: vi.fn(), resetAllAggro: vi.fn(), showBalloon: vi.fn() });

      // Act
      ally.pullBackOnCommand();

      // Assert
      expect(ally.disengageTarget).toHaveBeenCalledTimes(1);
      expect(ally.resetAllAggro).toHaveBeenCalledWith(null, true);
      expect(ally.pullBackFrames()).toBe(180);
      expect(ally.showBalloon).toHaveBeenCalledWith(6);
    });
  });
});
//endregion plugins/abs/ext/allyai/_models/jabs-battler.test.js

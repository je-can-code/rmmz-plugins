//region plugins/abs/ext/targeting/managers/jabs-targeting-manager.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * JABS_TargetingManager.js is a genuine ES `class` (static-only, never instantiated). Every
 * sibling model it imports is mocked per the "unit tier mocks all downstream file-external
 * dependencies" convention. JABS_GlobalCooldown, JABS_AiManager, JABS_Engine, JABS_Location,
 * JABS_ActionOptions, Input, and $jabsEngine are all bare globals this file reads (not imported),
 * stubbed directly. Every private method (#buildCycleCursor, #updateCursorMovement,
 * #updateCycleSelection, #readDpadStep, #readDirectionalInput, #syncSentinelPosition,
 * #confirmDirectLock, #resolveTargetXY, #endSession) is only reachable indirectly through the
 * public entry points (beginTargeting, update, confirm, cancel).
 */
describe('JABS_TargetingManager (unit, all downstream dependencies mocked)', () =>
{
  /** @type {typeof import('../../../../../../src/plugins/abs/ext/targeting/managers/JABS_TargetingManager.js').default} */
  let JABS_TargetingManager;
  let sentinelInstance;
  let CycleCursorMock;
  let FreeRoamCursorMock;

  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = { ABS: { EXT: { INPUT: { Symbols: { DPadUp: 'dpad-up', DPadDown: 'dpad-down', DPadLeft: 'dpad-left', DPadRight: 'dpad-right' } } } } };

    globalThis.JABS_GlobalCooldown = { isGlobalBlockingSkillId: vi.fn(() => false) };
    globalThis.JABS_AiManager = {
      getAlliedBattlersWithinRange: vi.fn(() => []),
      getBattlersWithinRange: vi.fn(() => []),
    };
    globalThis.JABS_Engine = { getBattlerAabbModel: vi.fn(() => ({ h: 48 })) };
    globalThis.JABS_Location = {
      Builder: () =>
      {
        const built = {};
        const builder = {
          setX: vi.fn((v) => { built.x = v; return builder; }),
          setY: vi.fn((v) => { built.y = v; return builder; }),
          setDirection: vi.fn((v) => { built.direction = v; return builder; }),
        };
        builder.build = vi.fn(() => built);
        return builder;
      },
    };
    globalThis.JABS_ActionOptions = {
      Builder: () =>
      {
        const built = {};
        const builder = {
          setIsRetaliation: vi.fn((v) => { built.isRetaliation = v; return builder; }),
          setCooldownKey: vi.fn((v) => { built.cooldownKey = v; return builder; }),
          setLocation: vi.fn((v) => { built.location = v; return builder; }),
          setIsTerrainDamage: vi.fn((v) => { built.isTerrainDamage = v; return builder; }),
          setSpawnOffset: vi.fn((x, y) => { built.spawnOffset = [ x, y ]; return builder; }),
          setProjectileTravelAngleDegrees: vi.fn((v) => { built.travelAngle = v; return builder; }),
          setRetaliationTarget: vi.fn((v) => { built.retaliationTarget = v; return builder; }),
        };
        builder.build = vi.fn(() => built);
        return builder;
      },
    };
    globalThis.Input = { isTriggered: vi.fn(() => false), isPressed: vi.fn(() => false), dir8: 0 };
    globalThis.$jabsEngine = { dir8ToUnitVector: vi.fn((dir8) => ({ x: dir8 === 6 ? 1 : 0, y: dir8 === 2 ? 1 : 0 })) };

    vi.doMock('../../../../../../src/plugins/abs/ext/targeting/_models/JABS_TargetingSession.js', () => ({
      default: class
      {
        constructor(battler, actions, onCommit)
        {
          this.battler = battler;
          this.actions = actions;
          this.onCommit = onCommit;
        }

        getBattler()
        {
          return this.battler;
        }

        getActions()
        {
          return this.actions;
        }

        getOnCommit()
        {
          return this.onCommit;
        }
      },
    }));

    CycleCursorMock = vi.fn();
    FreeRoamCursorMock = vi.fn();
    vi.doMock('../../../../../../src/plugins/abs/ext/targeting/_models/JABS_TargetingCursor.js', () => ({
      default: {
        Cycle: (...args) => { CycleCursorMock(...args); return buildFakeCursor({ cycleMode: true }); },
        FreeRoam: (...args) => { FreeRoamCursorMock(...args); return buildFakeCursor({ cycleMode: false }); },
      },
    }));

    vi.doMock('../../../../../../src/plugins/abs/ext/targeting/_models/JABS_TargetingSentinelAction.js', () => ({
      default: class
      {
        constructor()
        {
          this.set = vi.fn();
          this.reset = vi.fn();
          this.setPosition = vi.fn();
          this.setVerticalCenterOffset = vi.fn();
          sentinelInstance = this;
        }
      },
    }));

    ({ default: JABS_TargetingManager } =
      await import('../../../../../../src/plugins/abs/ext/targeting/managers/JABS_TargetingManager.js'));
  });

  beforeEach(() =>
  {
    // reset static state between tests since this is a true static singleton manager.
    JABS_TargetingManager._session = null;
    JABS_TargetingManager._cursor = null;
    JABS_TargetingManager._previousDir8 = 0;
    JABS_TargetingManager._previousDpadStep = 0;
    JABS_TargetingManager._justBegan = false;

    globalThis.JABS_GlobalCooldown.isGlobalBlockingSkillId.mockReset().mockReturnValue(false);
    globalThis.JABS_AiManager.getAlliedBattlersWithinRange.mockReset().mockReturnValue([]);
    globalThis.JABS_AiManager.getBattlersWithinRange.mockReset().mockReturnValue([]);
    globalThis.Input.isTriggered.mockReset().mockReturnValue(false);
    globalThis.Input.isPressed.mockReset().mockReturnValue(false);
    globalThis.Input.dir8 = 0;
    CycleCursorMock.mockClear();
    FreeRoamCursorMock.mockClear();
    sentinelInstance.set.mockClear();
    sentinelInstance.reset.mockClear();
    sentinelInstance.setPosition.mockClear();
    sentinelInstance.setVerticalCenterOffset.mockClear();
  });

  /**
   * Builds a fake targeting cursor test double.
   * @param {object} [overrides] Overrides.
   * @returns {object} A fake cursor.
   */
  function buildFakeCursor(overrides = {})
  {
    const cycleMode = overrides.cycleMode ?? true;
    return {
      isCycleMode: () => cycleMode,
      getCaster: () => overrides.caster ?? buildBattler(),
      getX: () => overrides.x ?? 0,
      getY: () => overrides.y ?? 0,
      getRange: () => overrides.range ?? 10,
      setPosition: vi.fn(),
      selectTowards: vi.fn(),
      stepIndex: vi.fn(),
      getSelectedBattler: () => overrides.selectedBattler ?? null,
      ...overrides,
    };
  }

  /**
   * Builds a fake battler test double.
   * @param {object} [overrides] Overrides.
   * @returns {object} A fake battler.
   */
  function buildBattler(overrides = {})
  {
    return {
      getX: () => 0,
      getY: () => 0,
      getTeam: () => 0,
      isFriendlyTeam: () => false,
      isFollower: () => false,
      getCharacter: () => ({ isVisible: () => true, direction: () => 2 }),
      setTarget: vi.fn(),
      setAllyTarget: vi.fn(),
      getAttackData: vi.fn(() => []),
      ...overrides,
    };
  }

  /**
   * Builds a fake action test double.
   * @param {object} [overrides] Overrides.
   * @returns {object} A fake action.
   */
  function buildAction(overrides = {})
  {
    return {
      getBaseSkill: () => ({ id: 1, targeted: true, jabsDirectLock: false }),
      isDirectAction: () => true,
      isSupportAction: () => false,
      getProximity: () => 5,
      getActionOptions: () => ({
        isActionRetaliation: () => false,
        getCooldownKey: () => 'gcd',
        isTerrainDamage: () => false,
        getSpawnOffsetX: () => 0,
        getSpawnOffsetY: () => 0,
        getProjectileTravelAngleDegrees: () => 0,
        getRetaliationTarget: () => null,
      }),
      setActionOptions: vi.fn(),
      ...overrides,
    };
  }

  describe('isActive()/getCursor()/getSentinel()', () =>
  {
    it('is inactive with no session', () =>
    {
      expect(JABS_TargetingManager.isActive()).toEqual(false);
      expect(JABS_TargetingManager.getCursor()).toBeNull();
    });

    it('exposes the shared sentinel', () =>
    {
      expect(JABS_TargetingManager.getSentinel()).toBe(sentinelInstance);
    });
  });

  describe('isTargetedAttempt()', () =>
  {
    it('returns false for an empty action list', () =>
    {
      expect(JABS_TargetingManager.isTargetedAttempt([])).toEqual(false);
    });

    it('returns false when the primary skill is not targeted', () =>
    {
      const actions = [ buildAction({ getBaseSkill: () => ({ targeted: false }) }) ];

      expect(JABS_TargetingManager.isTargetedAttempt(actions)).toEqual(false);
    });

    it('returns true when the primary skill is targeted', () =>
    {
      const actions = [ buildAction() ];

      expect(JABS_TargetingManager.isTargetedAttempt(actions)).toEqual(true);
    });
  });

  describe('peekTargetedActions()', () =>
  {
    it('returns empty when the slot has no attack data', () =>
    {
      const battler = buildBattler({ getAttackData: () => [] });

      expect(JABS_TargetingManager.peekTargetedActions(battler, 'Main')).toEqual([]);
    });

    it('returns empty when blocked by the global cooldown', () =>
    {
      globalThis.JABS_GlobalCooldown.isGlobalBlockingSkillId.mockReturnValue(true);
      const battler = buildBattler({ getAttackData: () => [ buildAction() ] });

      expect(JABS_TargetingManager.peekTargetedActions(battler, 'Main')).toEqual([]);
    });

    it('returns empty when the primary action is not targeted', () =>
    {
      const notTargeted = buildAction({ getBaseSkill: () => ({ id: 1, targeted: false }) });
      const battler = buildBattler({ getAttackData: () => [ notTargeted ] });

      expect(JABS_TargetingManager.peekTargetedActions(battler, 'Main')).toEqual([]);
    });

    it('returns the actions for a valid targeted attempt', () =>
    {
      const actions = [ buildAction() ];
      const battler = buildBattler({ getAttackData: () => actions });

      expect(JABS_TargetingManager.peekTargetedActions(battler, 'Main')).toEqual(actions);
    });
  });

  describe('beginTargeting()', () =>
  {
    it('does not stomp an already-active session', () =>
    {
      JABS_TargetingManager._session = { tag: 'existing' };

      JABS_TargetingManager.beginTargeting(buildBattler(), [ buildAction() ], vi.fn());

      expect(JABS_TargetingManager._session).toEqual({ tag: 'existing' });
    });

    it('builds a cycle cursor for a direct action', () =>
    {
      const battler = buildBattler();
      const action = buildAction({ isDirectAction: () => true });

      JABS_TargetingManager.beginTargeting(battler, [ action ], vi.fn());

      expect(CycleCursorMock).toHaveBeenCalled();
      expect(JABS_TargetingManager.isActive()).toEqual(true);
    });

    it('builds a free-roam cursor for a non-direct action', () =>
    {
      const battler = buildBattler();
      const action = buildAction({ isDirectAction: () => false });

      JABS_TargetingManager.beginTargeting(battler, [ action ], vi.fn());

      expect(FreeRoamCursorMock).toHaveBeenCalled();
    });

    it('points the sentinel at the primary action and marks the session just-began', () =>
    {
      const action = buildAction();

      JABS_TargetingManager.beginTargeting(buildBattler(), [ action ], vi.fn());

      expect(sentinelInstance.set).toHaveBeenCalledWith(action);
      expect(JABS_TargetingManager._justBegan).toEqual(true);
    });
  });

  describe('gatherScopedCandidates()', () =>
  {
    it('gathers allied battlers for a support action', () =>
    {
      const battler = buildBattler();
      const action = buildAction({ isSupportAction: () => true });
      const allies = [ buildBattler() ];
      globalThis.JABS_AiManager.getAlliedBattlersWithinRange.mockReturnValue(allies);

      expect(JABS_TargetingManager.gatherScopedCandidates(battler, action, 5)).toEqual(allies);
    });

    it('gathers non-friendly battlers within range for a non-support action', () =>
    {
      // the source checks the *aiming* battler's isFriendlyTeam(candidate.getTeam()), not the
      // candidate's own isFriendlyTeam- so the aiming battler double is what needs the real logic.
      const battler = buildBattler({ isFriendlyTeam: (team) => team === 0 });
      const action = buildAction({ isSupportAction: () => false });
      const friendly = buildBattler({ getTeam: () => 0 });
      const enemy = buildBattler({ getTeam: () => 1 });
      globalThis.JABS_AiManager.getBattlersWithinRange.mockReturnValue([ friendly, enemy ]);

      expect(JABS_TargetingManager.gatherScopedCandidates(battler, action, 5)).toEqual([ enemy ]);
    });

    it('excludes invisible followers from the non-support candidate pool', () =>
    {
      const battler = buildBattler();
      const action = buildAction({ isSupportAction: () => false });
      // the visible follower is the near-miss sibling: same follower-ness, opposite visibility, and
      // it has to survive- otherwise "excludes invisible followers" and "excludes all followers"
      // would be the same program.
      const visibleFollower = buildBattler({
        isFollower: () => true,
        getCharacter: () => ({ isVisible: () => true }),
      });
      const invisibleFollower = buildBattler({
        isFollower: () => true,
        getCharacter: () => ({ isVisible: () => false }),
      });
      globalThis.JABS_AiManager.getBattlersWithinRange.mockReturnValue([ visibleFollower, invisibleFollower ]);

      const candidates = JABS_TargetingManager.gatherScopedCandidates(battler, action, 5);

      expect(candidates).toHaveLength(1);
      expect(candidates[0]).toBe(visibleFollower);
    });
  });

  describe('update()', () =>
  {
    it('does nothing when no session is active', () =>
    {
      expect(() => JABS_TargetingManager.update()).not.toThrow();
    });

    it('skips the frame the session began on', () =>
    {
      JABS_TargetingManager._session = { tag: 'session' };
      JABS_TargetingManager._cursor = buildFakeCursor();
      JABS_TargetingManager._justBegan = true;

      JABS_TargetingManager.update();

      expect(JABS_TargetingManager._justBegan).toEqual(false);
      expect(sentinelInstance.setPosition).not.toHaveBeenCalled();
    });

    it('confirms the session when ok is triggered', () =>
    {
      const battler = buildBattler();
      const action = buildAction();
      JABS_TargetingManager.beginTargeting(battler, [ action ], vi.fn());
      JABS_TargetingManager._justBegan = false;
      globalThis.Input.isTriggered.mockImplementation((s) => s === 'ok');

      JABS_TargetingManager.update();

      expect(JABS_TargetingManager.isActive()).toEqual(false);
    });

    it('cancels the session when cancel is triggered', () =>
    {
      const battler = buildBattler();
      const action = buildAction();
      JABS_TargetingManager.beginTargeting(battler, [ action ], vi.fn());
      JABS_TargetingManager._justBegan = false;
      globalThis.Input.isTriggered.mockImplementation((s) => s === 'cancel');

      JABS_TargetingManager.update();

      expect(JABS_TargetingManager.isActive()).toEqual(false);
    });

    it('moves a free-roam cursor when a direction is held, clamped to range', () =>
    {
      const caster = buildBattler({ getX: () => 0, getY: () => 0 });
      const cursor = buildFakeCursor({ cycleMode: false, caster, x: 0, y: 0, range: 1 });
      JABS_TargetingManager._session = { tag: 'session' };
      JABS_TargetingManager._cursor = cursor;
      globalThis.Input.dir8 = 6;
      globalThis.$jabsEngine.dir8ToUnitVector.mockReturnValue({ x: 10, y: 0 });

      JABS_TargetingManager.update();

      const [ nextX ] = cursor.setPosition.mock.calls.at(-1);
      expect(nextX).toBeCloseTo(1); // clamped to the range boundary.
    });

    it('moves a free-roam cursor by a full step when the landing point stays inside range', () =>
    {
      const caster = buildBattler({ getX: () => 0, getY: () => 0 });
      const cursor = buildFakeCursor({ cycleMode: false, caster, x: 0, y: 0, range: 10 });
      JABS_TargetingManager._session = { tag: 'session' };
      JABS_TargetingManager._cursor = cursor;
      globalThis.Input.dir8 = 6;
      // set the unit vector explicitly- the clamp test above overrides this mock permanently.
      globalThis.$jabsEngine.dir8ToUnitVector.mockReturnValue({ x: 1, y: 0 });

      JABS_TargetingManager.update();

      // a full unclamped step is exactly one FreeRoamSpeedPerFrame along the pressed axis; clamping
      // this same step would have thrown it all the way out to the range boundary instead.
      const [ nextX, nextY ] = cursor.setPosition.mock.calls.at(-1);
      expect(nextX).toBeCloseTo(0.15);
      expect(nextY).toBe(0);
    });

    it('does not move the free-roam cursor when no direction is pressed', () =>
    {
      const cursor = buildFakeCursor({ cycleMode: false });
      JABS_TargetingManager._session = { tag: 'session' };
      JABS_TargetingManager._cursor = cursor;

      JABS_TargetingManager.update();

      expect(cursor.setPosition).not.toHaveBeenCalled();
    });

    it('selects towards a freshly-pressed native direction in cycle mode', () =>
    {
      const cursor = buildFakeCursor({ cycleMode: true });
      JABS_TargetingManager._session = { tag: 'session' };
      JABS_TargetingManager._cursor = cursor;
      JABS_TargetingManager._previousDir8 = 0;
      globalThis.Input.dir8 = 6;

      JABS_TargetingManager.update();

      expect(cursor.selectTowards).toHaveBeenCalled();
    });

    it('does not re-select while the native direction is held from the previous frame', () =>
    {
      const cursor = buildFakeCursor({ cycleMode: true });
      JABS_TargetingManager._session = { tag: 'session' };
      JABS_TargetingManager._cursor = cursor;
      JABS_TargetingManager._previousDir8 = 6;
      globalThis.Input.dir8 = 6;

      JABS_TargetingManager.update();

      expect(cursor.selectTowards).not.toHaveBeenCalled();
    });

    it('steps the cycle index on a freshly-pressed d-pad direction', () =>
    {
      const cursor = buildFakeCursor({ cycleMode: true });
      JABS_TargetingManager._session = { tag: 'session' };
      JABS_TargetingManager._cursor = cursor;
      JABS_TargetingManager._previousDpadStep = 0;
      globalThis.Input.isPressed.mockImplementation((s) => s === 'dpad-right');

      JABS_TargetingManager.update();

      expect(cursor.stepIndex).toHaveBeenCalledWith(1);
    });

    it('does not re-step while the d-pad direction is held from the previous frame', () =>
    {
      const cursor = buildFakeCursor({ cycleMode: true });
      JABS_TargetingManager._session = { tag: 'session' };
      JABS_TargetingManager._cursor = cursor;
      JABS_TargetingManager._previousDpadStep = 1;
      globalThis.Input.isPressed.mockImplementation((s) => s === 'dpad-right');

      JABS_TargetingManager.update();

      expect(cursor.stepIndex).not.toHaveBeenCalled();
    });

    it('leaves the session open on a frame where neither ok nor cancel is triggered', () =>
    {
      const selected = buildBattler({ getX: () => 3, getY: () => 4 });
      const cursor = buildFakeCursor({ cycleMode: true, selectedBattler: selected });
      JABS_TargetingManager._session = { tag: 'session' };
      JABS_TargetingManager._cursor = cursor;

      JABS_TargetingManager.update();

      // proof the frame actually ran to the input checks rather than bailing at the just-began or
      // inactive gate, either of which would make the assertion below pass for the wrong reason.
      expect(sentinelInstance.setPosition).toHaveBeenCalledWith(3, 4);
      expect(JABS_TargetingManager.isActive()).toEqual(true);
    });

    it('does not select towards anything when no native direction is pressed in cycle mode', () =>
    {
      const selected = buildBattler({ getX: () => 3, getY: () => 4 });
      const cursor = buildFakeCursor({ cycleMode: true, selectedBattler: selected });
      JABS_TargetingManager._session = { tag: 'session' };
      JABS_TargetingManager._cursor = cursor;
      globalThis.Input.dir8 = 0;

      JABS_TargetingManager.update();

      // proof the cycle-selection path ran at all; the edge-detect backstop is neutralized by the
      // zeroed previousDir8, so the only thing left to suppress a selection is dir8 being 0.
      expect(sentinelInstance.setPosition).toHaveBeenCalledWith(3, 4);
      expect(cursor.selectTowards).not.toHaveBeenCalled();
    });

    it('does not step the cycle index when no d-pad direction is pressed', () =>
    {
      const selected = buildBattler({ getX: () => 3, getY: () => 4 });
      const cursor = buildFakeCursor({ cycleMode: true, selectedBattler: selected });
      JABS_TargetingManager._session = { tag: 'session' };
      JABS_TargetingManager._cursor = cursor;
      globalThis.Input.isPressed.mockReturnValue(false);

      JABS_TargetingManager.update();

      // proof the cycle-selection path ran at all; the edge-detect backstop is neutralized by the
      // zeroed previousDpadStep, so an unpressed d-pad is the only thing left to suppress a step.
      expect(sentinelInstance.setPosition).toHaveBeenCalledWith(3, 4);
      expect(cursor.stepIndex).not.toHaveBeenCalled();
    });
  });

  describe('#readDpadStep() via cycle-mode update()', () =>
  {
    it.each([
      [ 'dpad-right', 1 ], [ 'dpad-left', -1 ], [ 'dpad-down', 1 ], [ 'dpad-up', -1 ],
    ])('resolves %s to step %i', (symbol, expectedStep) =>
    {
      const cursor = buildFakeCursor({ cycleMode: true });
      JABS_TargetingManager._session = { tag: 'session' };
      JABS_TargetingManager._cursor = cursor;
      globalThis.Input.isPressed.mockImplementation((s) => s === symbol);

      JABS_TargetingManager.update();

      expect(cursor.stepIndex).toHaveBeenCalledWith(expectedStep);
    });
  });

  describe('#readDirectionalInput() via free-roam update()', () =>
  {
    it.each([
      [ { up: true, left: true }, 7 ],
      [ { up: true, right: true }, 9 ],
      [ { down: true, left: true }, 1 ],
      [ { down: true, right: true }, 3 ],
      [ { up: true }, 8 ],
      [ { down: true }, 2 ],
      [ { left: true }, 4 ],
      [ { right: true }, 6 ],
    ])('resolves d-pad combo %j to dir8 %i', (pressed, expectedDir8) =>
    {
      const cursor = buildFakeCursor({ cycleMode: false, x: 0, y: 0, range: 100 });
      JABS_TargetingManager._session = { tag: 'session' };
      JABS_TargetingManager._cursor = cursor;
      globalThis.Input.dir8 = 0;
      globalThis.Input.isPressed.mockImplementation((s) =>
      {
        if (s === 'dpad-up') return !!pressed.up;
        if (s === 'dpad-down') return !!pressed.down;
        if (s === 'dpad-left') return !!pressed.left;
        if (s === 'dpad-right') return !!pressed.right;
        return false;
      });

      JABS_TargetingManager.update();

      expect(globalThis.$jabsEngine.dir8ToUnitVector).toHaveBeenCalledWith(expectedDir8);
    });

    it('prefers native dir8 over the d-pad when both are present', () =>
    {
      const cursor = buildFakeCursor({ cycleMode: false, x: 0, y: 0, range: 100 });
      JABS_TargetingManager._session = { tag: 'session' };
      JABS_TargetingManager._cursor = cursor;
      globalThis.Input.dir8 = 6;
      globalThis.Input.isPressed.mockImplementation((s) => s === 'dpad-up');

      JABS_TargetingManager.update();

      expect(globalThis.$jabsEngine.dir8ToUnitVector).toHaveBeenCalledWith(6);
    });
  });

  describe('#syncSentinelPosition() via beginTargeting()/update()', () =>
  {
    it('centers on the selected battler in cycle mode', () =>
    {
      const selected = buildBattler({ getX: () => 3, getY: () => 4 });
      const action = buildAction({ isDirectAction: () => true });
      // stub the cursor mock to report a selected battler for this test.
      CycleCursorMock.mockImplementation(() => {});
      const originalCycle = globalThis.JABS_AiManager.getBattlersWithinRange;
      globalThis.JABS_AiManager.getBattlersWithinRange = vi.fn(() => [ selected ]);

      JABS_TargetingManager.beginTargeting(buildBattler(), [ action ], vi.fn());
      // the real JABS_TargetingCursor.Cycle() is mocked to always return a cursor with no
      // selection; directly force a selection to exercise the "selected battler found" branch.
      JABS_TargetingManager._cursor = buildFakeCursor({ cycleMode: true, selectedBattler: selected });
      JABS_TargetingManager._justBegan = false;

      JABS_TargetingManager.update();

      expect(sentinelInstance.setPosition).toHaveBeenCalledWith(3, 4);
      globalThis.JABS_AiManager.getBattlersWithinRange = originalCycle;
    });

    it('does nothing when cycle mode has no selected battler yet', () =>
    {
      JABS_TargetingManager._session = { tag: 'session' };
      JABS_TargetingManager._cursor = buildFakeCursor({ cycleMode: true, selectedBattler: null });

      JABS_TargetingManager.update();

      expect(sentinelInstance.setPosition).not.toHaveBeenCalled();
    });

    it('tracks the live cursor point in free-roam mode', () =>
    {
      JABS_TargetingManager._session = { tag: 'session' };
      JABS_TargetingManager._cursor = buildFakeCursor({ cycleMode: false, x: 1, y: 2 });

      JABS_TargetingManager.update();

      expect(sentinelInstance.setPosition).toHaveBeenCalledWith(1, 2);
      expect(sentinelInstance.setVerticalCenterOffset).toHaveBeenCalledWith(0);
    });
  });

  describe('confirm()', () =>
  {
    it('does nothing when no session is active', () =>
    {
      expect(() => JABS_TargetingManager.confirm()).not.toThrow();
    });

    it('builds and attaches a resolved location to every pending action, then commits', () =>
    {
      const onCommit = vi.fn();
      const battler = buildBattler();
      const action1 = buildAction();
      const action2 = buildAction();
      JABS_TargetingManager.beginTargeting(battler, [ action1, action2 ], onCommit);
      // the caster sits at (0, 0) while the selection sits at (9, 8), so a location built from the
      // wrong source is visibly the wrong location rather than coincidentally the right one.
      JABS_TargetingManager._cursor = buildFakeCursor({ cycleMode: true, selectedBattler: buildBattler({ getX: () => 9, getY: () => 8 }) });

      JABS_TargetingManager.confirm();

      const [ firstRebuilt ] = action1.setActionOptions.mock.calls.at(-1);
      const [ secondRebuilt ] = action2.setActionOptions.mock.calls.at(-1);
      expect(firstRebuilt.location).toEqual({ x: 9, y: 8, direction: 2 });
      expect(secondRebuilt.location).toEqual({ x: 9, y: 8, direction: 2 });
      expect(onCommit).toHaveBeenCalledWith([ action1, action2 ]);
      expect(JABS_TargetingManager.isActive()).toEqual(false);
    });

    it('routes a directLock confirmation through the known-target reference instead of a location', () =>
    {
      const onCommit = vi.fn();
      const battler = buildBattler();
      const selected = buildBattler();
      const action = buildAction({ getBaseSkill: () => ({ id: 1, targeted: true, jabsDirectLock: true }), isSupportAction: () => false });
      JABS_TargetingManager.beginTargeting(battler, [ action ], onCommit);
      JABS_TargetingManager._cursor = buildFakeCursor({ cycleMode: true, selectedBattler: selected });

      JABS_TargetingManager.confirm();

      expect(battler.setTarget).toHaveBeenCalledWith(selected);
      expect(action.setActionOptions).not.toHaveBeenCalled();
      expect(onCommit).toHaveBeenCalled();
    });

    it('routes a directLock support confirmation to setAllyTarget', () =>
    {
      const battler = buildBattler();
      const selected = buildBattler();
      const action = buildAction({ getBaseSkill: () => ({ id: 1, targeted: true, jabsDirectLock: true }), isSupportAction: () => true });
      JABS_TargetingManager.beginTargeting(battler, [ action ], vi.fn());
      JABS_TargetingManager._cursor = buildFakeCursor({ cycleMode: true, selectedBattler: selected });

      JABS_TargetingManager.confirm();

      expect(battler.setAllyTarget).toHaveBeenCalledWith(selected);
    });

    it('does not set any known-target reference for a directLock confirmation with no selection', () =>
    {
      const battler = buildBattler();
      const action = buildAction({ getBaseSkill: () => ({ id: 1, targeted: true, jabsDirectLock: true }) });
      JABS_TargetingManager.beginTargeting(battler, [ action ], vi.fn());
      JABS_TargetingManager._cursor = buildFakeCursor({ cycleMode: true, selectedBattler: null });

      JABS_TargetingManager.confirm();

      expect(battler.setTarget).not.toHaveBeenCalled();
      expect(battler.setAllyTarget).not.toHaveBeenCalled();
    });

    it('falls back to the aiming battler\'s own position when the cycle pool is empty', () =>
    {
      const battler = buildBattler({ getX: () => 7, getY: () => 6 });
      const action = buildAction();
      JABS_TargetingManager.beginTargeting(battler, [ action ], vi.fn());
      // the cursor's own free-roam point is still (0, 0) here, so a fallback landing on (7, 6)
      // could only have come from the aiming battler.
      JABS_TargetingManager._cursor = buildFakeCursor({ cycleMode: true, selectedBattler: null });

      JABS_TargetingManager.confirm();

      const [ rebuilt ] = action.setActionOptions.mock.calls.at(-1);
      expect(rebuilt.location).toEqual({ x: 7, y: 6, direction: 2 });
    });

    it('uses the free-roam cursor position when resolving the target location', () =>
    {
      // the caster sits somewhere other than the cursor, so resolving against the caster instead
      // of the live cursor point produces a visibly different location.
      const battler = buildBattler({ getX: () => 4, getY: () => 5 });
      const action = buildAction();
      JABS_TargetingManager.beginTargeting(battler, [ action ], vi.fn());
      JABS_TargetingManager._cursor = buildFakeCursor({ cycleMode: false, x: 11, y: 12 });

      JABS_TargetingManager.confirm();

      const [ rebuilt ] = action.setActionOptions.mock.calls.at(-1);
      expect(rebuilt.location).toEqual({ x: 11, y: 12, direction: 2 });
    });
  });

  describe('cancel()', () =>
  {
    it('does nothing when nobody is aiming', () =>
    {
      JABS_TargetingManager.cancel();

      // tearing a session down is the only thing cancel ever does, and resetting the shared
      // sentinel is the observable half of it- an idle cancel must not touch it.
      expect(sentinelInstance.reset).not.toHaveBeenCalled();
    });

    it('ends the active session', () =>
    {
      JABS_TargetingManager.beginTargeting(buildBattler(), [ buildAction() ], vi.fn());

      JABS_TargetingManager.cancel();

      expect(JABS_TargetingManager.isActive()).toEqual(false);
      expect(JABS_TargetingManager.getCursor()).toBeNull();
      expect(sentinelInstance.reset).toHaveBeenCalled();
    });
  });
});
//endregion plugins/abs/ext/targeting/managers/jabs-targeting-manager.test.js

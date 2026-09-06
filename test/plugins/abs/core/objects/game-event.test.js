//region plugins/abs/core/objects/game-event.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Game_Event.js is a prototype-patch file (aliases and adds methods onto the real RMMZ
 * `Game_Event.prototype`), so this file direct-imports it against bare placeholder engine
 * globals rather than nesting a vm context. Every sibling model it imports is mocked per the
 * "unit tier mocks all downstream file-external dependencies" convention. Comment-parsing regexes
 * are hand-rolled to a simple, predictable shape (not the real notetag syntax)- only the shape
 * matters for exercising the parsing loops, and callers only ever compare against fake comment
 * strings built by `buildCommentCommands()` below.
 */
describe('J-ABS Game_Event (unit, all downstream dependencies mocked)', () =>
{
  let JABS_EnemyAI_ctor;
  let JABS_BattlerRole_ctor;
  let originalFindProperPageIndex;
  let originalPage;

  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = {
      ABS: {
        Aliased: { Game_Event: new Map() },
        RegExp: {
          EnemyId: /enemyId:(\d+)/i,
          TeamId: /teamId:(\d+)/i,
          Sight: /sight:(\d+)/i,
          AlertedSightBoost: /alertedSightBoost:(\d+)/i,
          Pursuit: /pursuit:(\d+)/i,
          GuardRange: /guardRange:(\d+)/i,
          AlertedPursuitBoost: /alertedPursuitBoost:([\d.]+)/i,
          AlertDuration: /alertDuration:(\d+)/i,
          MoveSpeed: /moveSpeed:([\d.]+)/i,
          ConfigNoIdle: /noIdle/i,
          ConfigCanIdle: /canIdle/i,
          ConfigNoHpBar: /noHpBar/i,
          ConfigShowHpBar: /showHpBar/i,
          ConfigHideStates: /hideStates/i,
          ConfigShowStates: /showStates/i,
          ConfigNotInanimate: /notInanimate/i,
          ConfigInanimate: /^inanimate$/i,
          ConfigInvincible: /^invincible$/i,
          ConfigNotInvincible: /notInvincible/i,
          ConfigNoName: /noName/i,
          ConfigShowName: /showName/i,
          AiTraitCareful: /aiCareful/i,
          AiTraitExecutor: /aiExecutor/i,
          AiTraitReckless: /aiReckless/i,
          AiTraitHealer: /aiHealer/i,
          AiTraitCleanser: /aiCleanser/i,
          AiTraitBuffer: /aiBuffer/i,
          AiTraitTactical: /aiTactical/i,
          AiTraitBerserker: /aiBerserker/i,
          AiRoleLeader: /aiRoleLeader/i,
          AiRoleFollower: /aiRoleFollower/i,
          AiRoleGuardian: /aiRoleGuardian/i,
          AiRoleWard: /aiRoleWard/i,
          AiRoleSolo: /aiRoleSolo/i,
          AiRoleSentinel: /aiRoleSentinel/i,
          AiTraitLeader: /aiTraitLeader/i,
          AiTraitFollower: /aiTraitFollower/i,
          Respawn: /respawn:(\[.+])/i,
          NoRespawn: /noRespawn/i,
          RespawnAnimation: /respawnAnimation:(\d+)/i,
        },
      },
    };

    // the respawn override parses its captured bracket through J-Base's JsonMapper global.
    globalThis.JsonMapper = { parseObject: vi.fn() };

    function Game_Event()
    {
    }
    // stub "original" hooks as vi.fn()s (not plain functions) so J.ABS.Aliased.Game_Event.set(key, ...)
    // captures a mock reference tests can reconfigure per-case via .mockImplementation()- reassigning
    // Game_Event.prototype[key] later would NOT affect the aliased original already captured at import time.
    originalFindProperPageIndex = vi.fn(() => 0);
    originalPage = vi.fn(() => 'the-page');
    [ 'initMembers', 'event', 'refresh', 'setupPageSettings' ]
      .forEach(key => { Game_Event.prototype[key] = function() {}; });
    Game_Event.prototype.findProperPageIndex = originalFindProperPageIndex;
    Game_Event.prototype.page = originalPage;
    // vanilla accessor the abs layer reads through.
    Game_Event.prototype.eventId = function() { return this._eventId; };

    globalThis.Game_Event = Game_Event;

    // sibling model dependencies- mocked entirely per the unit-tier convention.
    JABS_EnemyAI_ctor = vi.fn(function(...args) { this.args = args; });
    vi.doMock('../../../../../src/plugins/abs/core/models/JABS_EnemyAI.js', () => ({ default: JABS_EnemyAI_ctor }));
    JABS_BattlerRole_ctor = vi.fn(function(...args) { this.args = args; });
    vi.doMock('../../../../../src/plugins/abs/core/models/JABS_BattlerRole.js', () => ({ default: JABS_BattlerRole_ctor }));
    vi.doMock('../../../../../src/plugins/abs/core/models/JABS_BattlerCoreData.js', () => ({
      default: class
      {
        static Builder()
        {
          const built = {};
          const chain = new Proxy({}, {
            get: (_target, prop) =>
            {
              if (prop === 'build') return () => built;
              return (value) => { built[prop.replace(/^set/, '').replace(/^./, (c) => c.toLowerCase())] = value; return chain; };
            },
          });
          return chain;
        }
      },
    }));
    vi.doMock('../../../../../src/plugins/abs/core/models/JABS_Battler.js', () => ({
      default: class
      {
        static neutralTeamId()
        {
          return -1;
        }
      },
    }));

    await import('../../../../../src/plugins/abs/core/objects/Game_Event.js');

    // RMMZ exposes map coordinates as native properties on Game_CharacterBase.
    Object.defineProperties(globalThis.Game_Event.prototype, {
      // vanilla exposes these read-only; the double allows writes so tests can position freely.
      x: { get() { return this._x; }, set(v) { this._x = v; }, configurable: true },
      y: { get() { return this._y; }, set(v) { this._y = v; }, configurable: true },
    });

    // J-Base coordinate accessors the pixel/abs layers read and write through.
    globalThis.Game_Event.prototype.setX = function(v) { this._x = v; };
    globalThis.Game_Event.prototype.setY = function(v) { this._y = v; };
    globalThis.Game_Event.prototype.realX = function() { return this._realX; };
    globalThis.Game_Event.prototype.realY = function() { return this._realY; };
    globalThis.Game_Event.prototype.setRealX = function(v) { this._realX = v; };
    globalThis.Game_Event.prototype.setRealY = function(v) { this._realY = v; };

    // J-Base accessors the production code now reads through.
    globalThis.Game_Event.prototype.pageIndex = function() { return this._pageIndex; };
    globalThis.Game_Event.prototype.setPageIndex = function(v) { this._pageIndex = v; };
  });

  beforeEach(() =>
  {
    JABS_EnemyAI_ctor.mockClear();
    JABS_BattlerRole_ctor.mockClear();
    globalThis.$jabsEngine = { absEnabled: true, event: vi.fn() };
    globalThis.$gameMap = { refreshOneBattler: vi.fn() };
    globalThis.$gameEnemies = { enemy: vi.fn(() => buildEnemyBattler()) };
  });

  /**
   * Builds a fake event-command list from plain comment strings, matching the
   * `{ parameters: [comment] }` shape read by every override parser.
   * @param {string[]} comments The raw comment strings.
   * @returns {Array<{parameters: string[]}>}
   */
  function buildCommentCommands(comments)
  {
    return comments.map(comment => ({ parameters: [ comment ] }));
  }

  /**
   * Builds a fake enemy database battler with every JABS default accessor stubbed.
   * @param {object} [overrides] Property/method overrides.
   * @returns {object} A fake enemy battler.
   */
  function buildEnemyBattler(overrides = {})
  {
    return {
      teamId: () => 9,
      ai: () => 'default-ai',
      jabsBattlerRole: 'default-role',
      sightRange: () => 5,
      alertedSightBoost: () => 1,
      pursuitRange: () => 6,
      alertedPursuitBoost: () => 2,
      alertDuration: () => 300,
      guardRange: () => null,
      canIdle: () => true,
      showHpBar: () => true,
      showStates: () => true,
      showBattlerName: () => true,
      isInvincible: () => false,
      isInanimate: () => false,
      ...overrides,
    };
  }

  /**
   * Builds a real Game_Event-prototype-backed instance with sane, overridable stub
   * implementations for every RMMZ/sibling-plugin method this file's patches call off `this`.
   * @param {object} [overrides] Instance-level method/property overrides.
   * @returns {object} A stubbed Game_Event instance.
   */
  function buildEvent(overrides = {})
  {
    const event = Object.create(globalThis.Game_Event.prototype);
    event.initMembers();

    Object.assign(event, {
      isDirectionFixed: () => false,
      isJabsAction: () => false,
      isJabsLoot: () => false,
      isErased: () => false,
      getJabsActionUuid: () => 'action-uuid',
      getJabsAction: () => null,
      getJabsBattler: () => null,
      getValidCommentCommands: () => [],
      findProperPageIndex: () => 0,
      setupPage: vi.fn(),
      straighten: vi.fn(),
      refreshBushDepth: vi.fn(),
      setMoveSpeed: vi.fn(),
      _x: 0,
      _y: 0,
      _eventId: 1,
      _pageIndex: 0,
      ...overrides,
    });

    return event;
  }

  //region initialization
  describe('initMembers()', () =>
  {
    it('initializes the _j._abs battler-data namespace with defaults', () =>
    {
      const event = Object.create(globalThis.Game_Event.prototype);
      event.initMembers();

      expect(event._j._abs._battlerData).toBeNull();
      expect(event._j._abs._initialDirection).toEqual(0);
      expect(event._j._abs._castedDirection).toEqual(0);
      expect(event._j._abs._dynamicSpawn).toEqual(false);
    });
  });

  describe('flagAsDynamicSpawn()/isDynamicSpawn()', () =>
  {
    it('reports authored events as not dynamically spawned', () =>
    {
      // Arrange
      const event = Object.create(globalThis.Game_Event.prototype);
      event.initMembers();

      // Act
      const result = event.isDynamicSpawn();

      // Assert
      expect(result).toEqual(false);
    });

    it('reports a flagged event as dynamically spawned', () =>
    {
      // Arrange
      const event = Object.create(globalThis.Game_Event.prototype);
      event.initMembers();

      // Act
      event.flagAsDynamicSpawn();

      // Assert
      expect(event.isDynamicSpawn()).toEqual(true);
    });
  });

  describe('setCastedDirection()/getCastedDirection()', () =>
  {
    it('sets and gets the casted direction', () =>
    {
      const event = buildEvent();
      event.setCastedDirection(4);

      expect(event.getCastedDirection()).toEqual(4);
    });

    it('does not turn when direction is fixed', () =>
    {
      const event = buildEvent({ isDirectionFixed: () => true });
      event.setCastedDirection(4);

      expect(event.getCastedDirection()).toEqual(0);
    });
  });

  describe('event()', () =>
  {
    it('returns the jabs action data for an action event', () =>
    {
      const actionData = { tag: 'action' };
      globalThis.$jabsEngine.event.mockReturnValue(actionData);
      const event = buildEvent({ isJabsAction: () => true });

      expect(event.event()).toEqual(actionData);
      expect(globalThis.$jabsEngine.event).toHaveBeenCalledWith('action-uuid');
    });

    it('falls through to the original event data for a non-action event', () =>
    {
      const event = buildEvent({ isJabsAction: () => false });

      const result = event.event();

      expect(result).toBeUndefined();
      expect(globalThis.$jabsEngine.event).not.toHaveBeenCalled();
    });
  });

  describe('findProperPageIndex()', () =>
  {
    it('returns the original result when it is a valid integer', () =>
    {
      originalFindProperPageIndex.mockReturnValueOnce(3);
      const event = Object.create(globalThis.Game_Event.prototype);

      expect(event.findProperPageIndex()).toEqual(3);
    });

    it('returns -1 and swallows any error thrown by the original logic', () =>
    {
      vi.spyOn(console, 'trace').mockImplementation(() => {});
      vi.spyOn(console, 'error').mockImplementation(() => {});
      originalFindProperPageIndex.mockImplementationOnce(() => { throw new Error('boom'); });
      const event = Object.create(globalThis.Game_Event.prototype);

      expect(event.findProperPageIndex()).toEqual(-1);

      vi.restoreAllMocks();
    });
  });

  describe('refresh()/jabsEventRefresh()', () =>
  {
    it('delegates to jabsEventRefresh() when JABS is enabled', () =>
    {
      globalThis.$jabsEngine.absEnabled = true;
      const event = buildEvent();
      const jabsRefreshSpy = vi.spyOn(event, 'jabsEventRefresh');

      event.refresh();

      expect(jabsRefreshSpy).toHaveBeenCalled();
    });

    it('falls through to the original refresh logic when JABS is disabled', () =>
    {
      globalThis.$jabsEngine.absEnabled = false;
      const event = buildEvent();
      const jabsRefreshSpy = vi.spyOn(event, 'jabsEventRefresh');

      event.refresh();

      expect(jabsRefreshSpy).not.toHaveBeenCalled();
    });

    it('does not refresh loot events', () =>
    {
      // the stale page index deliberately disagrees with the one the lookup would resolve, so
      // the "page index has not changed" branch cannot be what suppresses the refresh here.
      const event = buildEvent({ isJabsLoot: () => true, findProperPageIndex: () => 0, _pageIndex: 1 });

      event.jabsEventRefresh();

      expect(event.setupPage).not.toHaveBeenCalled();
      expect(event.pageIndex()).toEqual(1);
    });

    it('sets the page index to -1 for an erased event and re-runs setup when it changed', () =>
    {
      const event = buildEvent({ isErased: () => true, _pageIndex: 0 });
      const transformSpy = vi.spyOn(event, 'transformBattler').mockImplementation(() => {});

      event.jabsEventRefresh();

      expect(event._pageIndex).toEqual(-1);
      expect(event.setupPage).toHaveBeenCalled();
      expect(transformSpy).toHaveBeenCalled();
    });

    it('does nothing further when the page index has not changed', () =>
    {
      const event = buildEvent({ findProperPageIndex: () => 0, _pageIndex: 0 });

      event.jabsEventRefresh();

      expect(event.setupPage).not.toHaveBeenCalled();
    });
  });

  describe('page()', () =>
  {
    it('performs the original logic when event data is present', () =>
    {
      const event = buildEvent({ event: () => ({}) });

      expect(event.page()).toEqual('the-page');
    });

    it('warns and returns null when event data is missing', () =>
    {
      vi.spyOn(console, 'warn').mockImplementation(() => {});
      const event = buildEvent({ event: () => null });

      expect(event.page()).toBeNull();

      // pin the payload's own fields. this branch reports on an event whose data is already gone, so
      // every value it reads must come from the event itself- x and y in particular are native
      // properties on Game_CharacterBase rather than accessors. a payload that throws while being
      // built is replaced wholesale by the Diagnostics failure report, so pinning the built fields is
      // what proves this one was built rather than reported as broken.
      const [ firstWarn ] = console.warn.mock.calls;
      const [ , details ] = firstWarn;
      expect(details.x).toEqual(0);
      expect(details.y).toEqual(0);
      expect(details.eventId).toEqual(1);
      expect(details.pageIndex).toEqual(0);
      expect(details.jabsActionUuid).toEqual('action-uuid');

      console.warn.mockRestore();
    });
  });

  describe('transformBattler()', () =>
  {
    it('reveals the hidden jabs battler and refreshes the map sprite', () =>
    {
      const jabsBattler = { revealHiddenBattler: vi.fn() };
      const event = buildEvent({ getJabsBattler: () => jabsBattler });

      event.transformBattler();

      expect(jabsBattler.revealHiddenBattler).toHaveBeenCalled();
      expect(globalThis.$gameMap.refreshOneBattler).toHaveBeenCalledWith(event);
    });

    it('does not throw when there is no jabs battler yet', () =>
    {
      const event = buildEvent({ getJabsBattler: () => null });

      expect(() => event.transformBattler()).not.toThrow();
      expect(globalThis.$gameMap.refreshOneBattler).toHaveBeenCalledWith(event);
    });
  });

  describe('setupPageSettings()', () =>
  {
    it('parses enemy comments after the original logic', () =>
    {
      const event = buildEvent();
      const parseSpy = vi.spyOn(event, 'parseEnemyComments').mockImplementation(() => {});

      event.setupPageSettings();

      expect(parseSpy).toHaveBeenCalled();
    });
  });
  //endregion initialization

  //region parseEnemyComments / canParseEnemyComments
  describe('canParseEnemyComments()', () =>
  {
    it('returns false when the page index is less than -1', () =>
    {
      // the comment list is otherwise fully parseable- it carries an enemy id- so the page index
      // is the only thing left that can produce a false here.
      const event = buildEvent({
        findProperPageIndex: () => -2,
        getValidCommentCommands: () => buildCommentCommands([ 'enemyId:5' ]),
      });

      expect(event.canParseEnemyComments()).toEqual(false);
    });

    it('returns false when there are no valid comment commands', () =>
    {
      const event = buildEvent({ getValidCommentCommands: () => [] });

      expect(event.canParseEnemyComments()).toEqual(false);
    });

    it('returns false when no comment declares an enemy id', () =>
    {
      const event = buildEvent({ getValidCommentCommands: () => buildCommentCommands([ 'unrelated' ]) });

      expect(event.canParseEnemyComments()).toEqual(false);
    });

    it('returns true when a comment declares an enemy id', () =>
    {
      const event = buildEvent({ getValidCommentCommands: () => buildCommentCommands([ 'enemyId:5' ]) });

      expect(event.canParseEnemyComments()).toEqual(true);
    });
  });

  describe('parseEnemyComments()', () =>
  {
    it('initializes null core data when comments cannot be parsed', () =>
    {
      const event = buildEvent({ getValidCommentCommands: () => [] });

      event.parseEnemyComments();

      expect(event.getBattlerCoreData()).toBeNull();
    });

    it('builds core data from database defaults when no overrides are present', () =>
    {
      const event = buildEvent({ getValidCommentCommands: () => buildCommentCommands([ 'enemyId:5' ]) });

      event.parseEnemyComments();

      const built = event.getBattlerCoreData();
      expect(built.battlerId).toEqual(5);
      expect(built.teamId).toEqual(9);
      expect(built.battlerAi).toEqual('default-ai');
      expect(built.sightRange).toEqual(5);
    });

    it('applies event-page overrides on top of database defaults', () =>
    {
      const event = buildEvent({
        getValidCommentCommands: () => buildCommentCommands([ 'enemyId:5', 'teamId:3', 'sight:20' ]),
      });

      event.parseEnemyComments();

      const built = event.getBattlerCoreData();
      expect(built.teamId).toEqual(3);
      expect(built.sightRange).toEqual(20);
    });

    it('forces neutral team, no idle, no hp bar, and no name when inanimate', () =>
    {
      const event = buildEvent({
        getValidCommentCommands: () => buildCommentCommands([ 'enemyId:5', 'inanimate' ]),
      });

      event.parseEnemyComments();

      const built = event.getBattlerCoreData();
      expect(built.teamId).toEqual(-1);
      expect(built.canIdle).toEqual(false);
      expect(built.showHpBar).toEqual(false);
      expect(built.showBattlerName).toEqual(false);
    });

    it('honors explicit page overrides even while inanimate', () =>
    {
      const event = buildEvent({
        getValidCommentCommands: () => buildCommentCommands([ 'enemyId:5', 'inanimate', 'canIdle' ]),
      });

      event.parseEnemyComments();

      expect(event.getBattlerCoreData().canIdle).toEqual(true);
    });

    it('honors explicit showHpBar and showName overrides even while inanimate', () =>
    {
      const event = buildEvent({
        getValidCommentCommands: () => buildCommentCommands([ 'enemyId:5', 'inanimate', 'showHpBar', 'showName' ]),
      });

      event.parseEnemyComments();

      const built = event.getBattlerCoreData();
      expect(built.showHpBar).toEqual(true);
      expect(built.showBattlerName).toEqual(true);
      // canIdle has no explicit override here, so the inanimate default still suppresses it.
      expect(built.canIdle).toEqual(false);
    });
  });
  //endregion parseEnemyComments / canParseEnemyComments

  //region numeric overrides
  describe.each([
    [ 'getBattlerIdOverrides', 'enemyId:5', 5, 0 ],
    [ 'getTeamIdOverrides', 'teamId:5', 5, null ],
    [ 'getSightRangeOverrides', 'sight:5', 5, null ],
    [ 'getAlertedSightBoostOverrides', 'alertedSightBoost:5', 5, null ],
    [ 'getPursuitRangeOverrides', 'pursuit:5', 5, null ],
    [ 'getGuardRangeOverrides', 'guardRange:5', 5, null ],
    [ 'getAlertDurationOverrides', 'alertDuration:5', 5, null ],
    [ 'getRespawnAnimationOverrides', 'respawnAnimation:5', 5, null ],
  ])('%s()', (method, matchingComment, expectedValue, defaultValue) =>
  {
    it(`returns ${defaultValue} when no comment matches`, () =>
    {
      const event = buildEvent({ getValidCommentCommands: () => buildCommentCommands([ 'unrelated' ]) });

      expect(event[method]()).toEqual(defaultValue);
    });

    it(`parses the integer value from a matching comment`, () =>
    {
      const event = buildEvent({ getValidCommentCommands: () => buildCommentCommands([ matchingComment ]) });

      expect(event[method]()).toEqual(expectedValue);
    });
  });

  describe('getRespawnOverrides()', () =>
  {
    it('returns null when no comment declares a respawn', () =>
    {
      // Arrange
      const event = buildEvent({ getValidCommentCommands: () => buildCommentCommands([ 'unrelated' ]) });

      // Act
      const result = event.getRespawnOverrides();

      // Assert
      expect(result).toBeNull();
    });

    it('parses the captured pair through JsonMapper from a matching comment', () =>
    {
      // Arrange
      const parsedPair = [ 'seconds', 90 ];
      globalThis.JsonMapper.parseObject.mockReturnValue(parsedPair);
      const event = buildEvent({ getValidCommentCommands: () => buildCommentCommands([ 'respawn:[seconds, 90]' ]) });

      // Act
      const result = event.getRespawnOverrides();

      // Assert
      expect(globalThis.JsonMapper.parseObject).toHaveBeenCalledWith('[seconds, 90]');
      expect(result).toBe(parsedPair);
    });
  });

  describe('getNoRespawnOverrides()', () =>
  {
    it('returns null when no comment declares permanence', () =>
    {
      // Arrange
      const event = buildEvent({ getValidCommentCommands: () => buildCommentCommands([ 'unrelated' ]) });

      // Act
      const result = event.getNoRespawnOverrides();

      // Assert
      expect(result).toBeNull();
    });

    it('returns true from a matching comment', () =>
    {
      // Arrange
      const event = buildEvent({ getValidCommentCommands: () => buildCommentCommands([ 'noRespawn' ]) });

      // Act
      const result = event.getNoRespawnOverrides();

      // Assert
      expect(result).toEqual(true);
    });
  });

  describe('getAlertedPursuitBoostOverrides()', () =>
  {
    it('returns null when no comment matches', () =>
    {
      const event = buildEvent({ getValidCommentCommands: () => [] });

      expect(event.getAlertedPursuitBoostOverrides()).toBeNull();
    });

    it('parses a floating-point value from a matching comment', () =>
    {
      const event = buildEvent({
        getValidCommentCommands: () => buildCommentCommands([ 'alertedPursuitBoost:1.5' ]),
      });

      expect(event.getAlertedPursuitBoostOverrides()).toEqual(1.5);
    });
  });
  //endregion numeric overrides

  //region boolean dual-flag overrides
  describe.each([
    [ 'getCanIdleOverrides', 'noIdle', 'canIdle' ],
    [ 'getShowHpBarOverrides', 'noHpBar', 'showHpBar' ],
    [ 'getShowStatesOverrides', 'hideStates', 'showStates' ],
    [ 'getInvincibleOverrides', 'notInvincible', 'invincible' ],
    [ 'getShowBattlerNameOverrides', 'noName', 'showName' ],
  ])('%s()', (method, offComment, onComment) =>
  {
    it('returns null when no comment matches', () =>
    {
      // a non-matching comment rather than an empty list, so the parsing loop actually runs and
      // both flag regexes get their chance to decline- matching the numeric block above.
      const event = buildEvent({ getValidCommentCommands: () => buildCommentCommands([ 'unrelated' ]) });

      expect(event[method]()).toBeNull();
    });

    it('returns false for the "off" tag', () =>
    {
      const event = buildEvent({ getValidCommentCommands: () => buildCommentCommands([ offComment ]) });

      expect(event[method]()).toEqual(false);
    });

    it('returns true for the "on" tag', () =>
    {
      const event = buildEvent({ getValidCommentCommands: () => buildCommentCommands([ onComment ]) });

      expect(event[method]()).toEqual(true);
    });
  });

  describe('getInanimateOverrides()', () =>
  {
    it('returns null when no comment matches', () =>
    {
      // same as the dual-flag block above: a non-matching comment, so the loop runs and the
      // regexes have to decline on their own merits rather than never being consulted.
      const event = buildEvent({ getValidCommentCommands: () => buildCommentCommands([ 'unrelated' ]) });

      expect(event.getInanimateOverrides()).toBeNull();
    });

    it('returns false for the notInanimate tag', () =>
    {
      const event = buildEvent({ getValidCommentCommands: () => buildCommentCommands([ 'notInanimate' ]) });

      expect(event.getInanimateOverrides()).toEqual(false);
    });

    it('returns true for the inanimate tag', () =>
    {
      const event = buildEvent({ getValidCommentCommands: () => buildCommentCommands([ 'inanimate' ]) });

      expect(event.getInanimateOverrides()).toEqual(true);
    });
  });
  //endregion boolean dual-flag overrides

  //region getBattlerAiOverrides
  describe('getBattlerAiOverrides()', () =>
  {
    it('returns null when no ai trait comment matches, so the caller falls back to the database', () =>
    {
      const event = buildEvent({ getValidCommentCommands: () => [] });

      const result = event.getBattlerAiOverrides();

      expect(result).toBeNull();
      expect(JABS_EnemyAI_ctor).not.toHaveBeenCalled();
    });

    it('flags every trait found across the comment list', () =>
    {
      const event = buildEvent({
        getValidCommentCommands: () => buildCommentCommands([
          'aiCareful', 'aiExecutor', 'aiReckless', 'aiHealer', 'aiCleanser', 'aiBuffer', 'aiTactical', 'aiBerserker',
        ]),
      });

      event.getBattlerAiOverrides();

      expect(JABS_EnemyAI_ctor).toHaveBeenCalledWith(true, true, true, true, true, true, true, true);
    });
  });
  //endregion getBattlerAiOverrides

  //region getBattlerRoleOverrides
  describe('getBattlerRoleOverrides()', () =>
  {
    it('returns null when no role tag is present', () =>
    {
      const event = buildEvent({ getValidCommentCommands: () => [] });

      expect(event.getBattlerRoleOverrides()).toBeNull();
    });

    it('constructs a role from the aiRole tag family', () =>
    {
      const event = buildEvent({
        getValidCommentCommands: () => buildCommentCommands([ 'aiRoleGuardian', 'aiRoleWard' ]),
      });

      event.getBattlerRoleOverrides();

      expect(JABS_BattlerRole_ctor).toHaveBeenCalledWith(false, false, true, true, false, false);
    });

    it('recognizes the remaining aiRole tags: leader, follower, solo, and sentinel', () =>
    {
      const event = buildEvent({
        getValidCommentCommands: () => buildCommentCommands([
          'aiRoleLeader', 'aiRoleFollower', 'aiRoleSolo', 'aiRoleSentinel',
        ]),
      });

      event.getBattlerRoleOverrides();

      expect(JABS_BattlerRole_ctor).toHaveBeenCalledWith(true, true, false, false, true, true);
    });

    it('honors the legacy aiTrait:leader/follower aliases', () =>
    {
      const event = buildEvent({
        getValidCommentCommands: () => buildCommentCommands([ 'aiTraitLeader', 'aiTraitFollower' ]),
      });

      event.getBattlerRoleOverrides();

      expect(JABS_BattlerRole_ctor).toHaveBeenCalledWith(true, true, false, false, false, false);
    });
  });
  //endregion getBattlerRoleOverrides

  //region misc
  describe('initializeCoreData()/getBattlerCoreData()/setBattlerCoreData()/isJabsBattler()', () =>
  {
    it('round-trips the core battler data', () =>
    {
      const event = buildEvent();
      const coreData = { tag: 'core' };

      event.initializeCoreData(coreData);

      expect(event.getBattlerCoreData()).toEqual(coreData);
      expect(event.isJabsBattler()).toEqual(true);
    });

    it('is not a jabs battler without core data', () =>
    {
      const event = buildEvent();

      expect(event.isJabsBattler()).toEqual(false);
    });
  });

  describe('applyCustomMoveSpeed()', () =>
  {
    it('does not set a move speed without a matching comment', () =>
    {
      const event = buildEvent({ getValidCommentCommands: () => [] });

      event.applyCustomMoveSpeed();

      expect(event.setMoveSpeed).not.toHaveBeenCalled();
    });

    it('sets the parsed move speed from a matching comment', () =>
    {
      const event = buildEvent({
        getValidCommentCommands: () => buildCommentCommands([ 'moveSpeed:4.5' ]),
      });

      event.applyCustomMoveSpeed();

      expect(event.setMoveSpeed).toHaveBeenCalledWith(4.5);
    });
  });

  describe('getBattlerId()', () =>
  {
    it('returns 0 when there is no core data', () =>
    {
      const event = buildEvent();

      expect(event.getBattlerId()).toEqual(0);
    });

    it('returns the core data battlerId', () =>
    {
      const event = buildEvent();
      event.setBattlerCoreData({ battlerId: () => 7 });

      expect(event.getBattlerId()).toEqual(7);
    });
  });

  describe('getCaster()', () =>
  {
    it('returns null when this is not an action', () =>
    {
      const event = buildEvent({ isJabsAction: () => false });

      expect(event.getCaster()).toBeNull();
    });

    it('returns the caster from the underlying jabs action', () =>
    {
      const caster = { tag: 'caster' };
      const event = buildEvent({
        isJabsAction: () => true,
        getJabsAction: () => ({ getCaster: () => caster }),
      });

      expect(event.getCaster()).toEqual(caster);
    });
  });

  describe('existOnCaster()', () =>
  {
    it('does nothing without a caster', () =>
    {
      const event = buildEvent({ isJabsAction: () => false });

      expect(() => event.existOnCaster()).not.toThrow();
      expect(event.straighten).not.toHaveBeenCalled();
    });

    it('copies the caster character coordinates and straightens', () =>
    {
      const character = { _realX: 1.5, _realY: 2.5, _x: 1, _y: 2 };
      const event = buildEvent({
        isJabsAction: () => true,
        getJabsAction: () => ({ getCaster: () => ({ getCharacter: () => character }) }),
      });

      event.existOnCaster();

      expect(event._realX).toEqual(1.5);
      expect(event._realY).toEqual(2.5);
      expect(event._x).toEqual(1);
      expect(event._y).toEqual(2);
      expect(event.straighten).toHaveBeenCalled();
      expect(event.refreshBushDepth).toHaveBeenCalled();
    });
  });
  //endregion misc
});
//endregion plugins/abs/core/objects/game-event.test.js

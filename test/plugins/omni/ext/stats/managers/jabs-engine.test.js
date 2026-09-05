//region plugins/omni/ext/stats/managers/jabs-engine.test.js
import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('J-OMNI-Stats JABS_Engine hooks (direct src import)', () =>
{
  /**
   * The originals this plugin aliases, spied on to prove each chain is intact.
   * @type {Object<string, Function>}
   */
  let originals;

  /**
   * The recorder every hook ends in, spied on rather than exercised.
   * @type {object}
   */
  let recorder;

  /**
   * The cooldown keys the metrics manager treats as item slots.
   * @type {string[]}
   */
  const ITEM_SLOTS = [ 'tool', 'usable-item' ];

  /**
   * Builds a stand-in JABS action.
   * @param {{cooldownType?: string}=} options How to shape it.
   * @returns {object} The stubbed action.
   */
  const buildAction = (options = {}) =>
  {
    const { cooldownType = 'mainhand' } = options;

    return { getCooldownType: () => cooldownType };
  };

  /**
   * Builds a stand-in JABS battler on the receiving end of a hit.
   * @param {{hpDamage?: number, isEnemy?: boolean, isActor?: boolean}=} options How to shape it.
   * @returns {object} The stubbed battler.
   */
  const buildTarget = (options = {}) =>
  {
    const {
      hpDamage = 100,
      isEnemy = true,
      isActor = false,
    } = options;

    return {
      isEnemy: () => isEnemy,
      isActor: () => isActor,
      getBattler: () => ({ result: () => ({ hpDamage }) }),
    };
  };

  beforeEach(async () =>
  {
    vi.resetModules();

    globalThis.J = { OMNI: { EXT: { STATS: { Aliased: { JABS_Engine: new Map() } } } } };

    // J-ABS-Metrics ships in a different bundle and is a bare global by the time this script runs.
    globalThis.JABS_MetricsManager = { isItemSlot: key => ITEM_SLOTS.includes(key) };

    originals = {
      preExecuteSkillEffects: vi.fn(),
      postExecuteSkillEffects: vi.fn(),
      handleDefeatedEnemy: vi.fn(),
      handleDefeatedPlayer: vi.fn(),
      executeMapAction: vi.fn(),
    };

    function JABS_Engine() {}

    Object.assign(JABS_Engine.prototype, originals);
    globalThis.JABS_Engine = JABS_Engine;

    const recorderModule = await import(
      '../../../../../../src/plugins/omni/ext/stats/managers/StatistopediaRecorder.js');
    recorder = recorderModule.default;

    vi.spyOn(recorder, 'rememberPreHitHp')
      .mockImplementation(() => {});
    vi.spyOn(recorder, 'trackHitLanded')
      .mockImplementation(() => {});
    vi.spyOn(recorder, 'trackHitTaken')
      .mockImplementation(() => {});
    vi.spyOn(recorder, 'trackDefeatedEnemy')
      .mockImplementation(() => {});
    vi.spyOn(recorder, 'trackDefeatedPlayer')
      .mockImplementation(() => {});
    vi.spyOn(recorder, 'trackSkillUsage')
      .mockImplementation(() => {});

    await import('../../../../../../src/plugins/omni/ext/stats/managers/JABS_Engine.js');
  });

  describe('preExecuteSkillEffects', () =>
  {
    it('remembers the target hp before the original logic touches it', () =>
    {
      // Arrange.
      const engine = new globalThis.JABS_Engine();
      const target = buildTarget();

      // Act.
      engine.preExecuteSkillEffects(buildAction(), target);

      // Assert.
      expect(originals.preExecuteSkillEffects).toHaveBeenCalledTimes(1);
      expect(recorder.rememberPreHitHp).toHaveBeenCalledWith(target);
    });
  });

  describe('postExecuteSkillEffects', () =>
  {
    it('files a hit the party landed on an enemy', () =>
    {
      // Arrange.
      const engine = new globalThis.JABS_Engine();
      const target = buildTarget({ isEnemy: true, hpDamage: 250 });
      const action = buildAction({ cooldownType: 'mainhand' });

      // Act.
      engine.postExecuteSkillEffects(action, target);

      // Assert.
      expect(originals.postExecuteSkillEffects).toHaveBeenCalledTimes(1);
      expect(recorder.trackHitLanded).toHaveBeenCalledWith(action, target);
    });

    it('files a hit the party took', () =>
    {
      // Arrange.
      const engine = new globalThis.JABS_Engine();
      const target = buildTarget({ isEnemy: false, isActor: true, hpDamage: 250 });

      // Act.
      engine.postExecuteSkillEffects(buildAction(), target);

      // Assert.
      expect(recorder.trackHitTaken).toHaveBeenCalledWith(target);
    });

    it('files nothing for an item, whose damage belongs to the item', () =>
    {
      // Arrange: a real hit for real damage on a real enemy, differing only by the slot it came from.
      const engine = new globalThis.JABS_Engine();
      const target = buildTarget({ isEnemy: true, hpDamage: 250 });
      const action = buildAction({ cooldownType: 'tool' });

      // Act.
      engine.postExecuteSkillEffects(action, target);

      // Assert.
      expect(recorder.trackHitLanded).not.toHaveBeenCalled();
      expect(recorder.trackHitTaken).not.toHaveBeenCalled();
    });

    it('files nothing for a hit that dealt no hp damage', () =>
    {
      // Arrange: a pure state application, which is not attack data.
      const engine = new globalThis.JABS_Engine();
      const target = buildTarget({ isEnemy: true, hpDamage: 0 });

      // Act.
      engine.postExecuteSkillEffects(buildAction(), target);

      // Assert.
      expect(recorder.trackHitLanded).not.toHaveBeenCalled();
    });

    it('files nothing for a target that is neither an enemy nor an actor', () =>
    {
      // Arrange.
      const engine = new globalThis.JABS_Engine();
      const target = buildTarget({
        isEnemy: false,
        isActor: false,
        hpDamage: 250,
      });

      // Act.
      engine.postExecuteSkillEffects(buildAction(), target);

      // Assert.
      expect(recorder.trackHitLanded).not.toHaveBeenCalled();
      expect(recorder.trackHitTaken).not.toHaveBeenCalled();
    });
  });

  describe('handleDefeatedEnemy', () =>
  {
    it('files the defeat after the original logic has run', () =>
    {
      // Arrange.
      const engine = new globalThis.JABS_Engine();
      const defeated = buildTarget();
      const caster = buildTarget();

      // Act.
      engine.handleDefeatedEnemy(defeated, caster);

      // Assert.
      expect(originals.handleDefeatedEnemy).toHaveBeenCalledWith(defeated, caster);
      expect(recorder.trackDefeatedEnemy).toHaveBeenCalledWith(defeated);
    });
  });

  describe('handleDefeatedPlayer', () =>
  {
    it('files the death before the original logic can trigger a game over', () =>
    {
      // Arrange: the ordering is the point, since the original may never return.
      const engine = new globalThis.JABS_Engine();
      const callOrder = [];
      recorder.trackDefeatedPlayer.mockImplementation(() => callOrder.push('recorded'));
      originals.handleDefeatedPlayer.mockImplementation(() => callOrder.push('original'));

      // Act.
      engine.handleDefeatedPlayer();

      // Assert.
      expect(callOrder).toEqual([ 'recorded', 'original' ]);
    });
  });

  describe('executeMapAction', () =>
  {
    it('files which skill the player reached for', () =>
    {
      // Arrange.
      const engine = new globalThis.JABS_Engine();
      const caster = { isPlayer: () => true };
      const action = buildAction();

      // Act.
      engine.executeMapAction(caster, action, 3, 4);

      // Assert.
      expect(originals.executeMapAction).toHaveBeenCalledWith(caster, action, 3, 4);
      expect(recorder.trackSkillUsage).toHaveBeenCalledWith(action);
    });

    it('files nothing when an ally is the one swinging', () =>
    {
      // Arrange: this is a record of how the player plays, not of what the party AI chose.
      const engine = new globalThis.JABS_Engine();
      const caster = { isPlayer: () => false };

      // Act.
      engine.executeMapAction(caster, buildAction(), 3, 4);

      // Assert.
      expect(originals.executeMapAction).toHaveBeenCalledTimes(1);
      expect(recorder.trackSkillUsage).not.toHaveBeenCalled();
    });
  });
});
//endregion plugins/omni/ext/stats/managers/jabs-engine.test.js

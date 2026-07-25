//region plugins/resources/_component/game-battler-base-and-battler-direct.test.js
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Exercises src/plugins/resources/core/objects/Game_BattlerBase.js and Game_Battler.js directly against
 * the real test realm (no vm sandbox), following the pattern established by
 * test/plugins/_base/game-battler-notes-direct.test.js. Both files patch bare host globals
 * (Game_BattlerBase, Game_Battler) at module-evaluation time, so this suite installs minimal placeholder
 * classes with just the engine-level methods these files alias (initMembers, onBattlerDataChange,
 * skillMpCost, skillTpCost, canPaySkillCost, paySkillCost) before importing.
 */
describe('Game_BattlerBase / Game_Battler resource extensions (resources core, direct src import)', () =>
{
  let baseSkillMpCost;
  let baseSkillTpCost;
  let baseCanPaySkillCost;
  let basePaySkillCost;
  let baseInitMembers;
  let baseOnBattlerDataChange;

  beforeEach(async () =>
  {
    vi.resetModules();

    // stand-in for the engine's Game_BattlerBase, providing just the methods this plugin aliases.
    function Game_BattlerBase()
    {
    }

    baseSkillMpCost = vi.fn(() => 10);
    baseSkillTpCost = vi.fn(() => 5);
    baseCanPaySkillCost = vi.fn(() => true);
    basePaySkillCost = vi.fn();
    Game_BattlerBase.prototype.skillMpCost = baseSkillMpCost;
    Game_BattlerBase.prototype.skillTpCost = baseSkillTpCost;
    Game_BattlerBase.prototype.canPaySkillCost = baseCanPaySkillCost;
    Game_BattlerBase.prototype.paySkillCost = basePaySkillCost;

    // stand-in for the engine's Game_Battler, inheriting from Game_BattlerBase like the real engine does.
    function Game_Battler()
    {
    }

    Game_Battler.prototype = Object.create(Game_BattlerBase.prototype);
    Game_Battler.prototype.constructor = Game_Battler;
    baseInitMembers = vi.fn();
    baseOnBattlerDataChange = vi.fn();
    Game_Battler.prototype.initMembers = baseInitMembers;
    Game_Battler.prototype.onBattlerDataChange = baseOnBattlerDataChange;
    Game_Battler.prototype.gainHp = vi.fn();
    Game_Battler.prototype.gainMp = vi.fn();
    Game_Battler.prototype.gainTp = vi.fn();
    Game_Battler.prototype.tcr = 1;

    globalThis.Game_BattlerBase = Game_BattlerBase;
    globalThis.Game_Battler = Game_Battler;

    globalThis.J = {
      RESOURCES: {
        Aliased: {
          Game_BattlerBase: new Map(),
          Game_Battler: new Map(),
        },
        RegExp: {
          HpCostLethal: {},
          HpCostFlat: {},
          HpCostPercent: {},
          HpCostFormula: {},
          MpCostFlat: {},
          MpCostPercent: {},
          MpCostFormula: {},
          TpCostFlat: {},
          TpCostPercent: {},
          TpCostFormula: {},
          HpGainFlat: {},
          HpGainPercent: {},
          HpGainFormula: {},
          MpGainFlat: {},
          MpGainPercent: {},
          MpGainFormula: {},
          TpGainFlat: {},
          TpGainPercent: {},
          TpGainFormula: {},
          StackCost: {},
          ItemCost: {},
        },
      },
    };
    // ResourceCostManager (imported for real, not mocked, by both files under test) needs these.
    globalThis.RPGManager = {
      checkForBooleanFromNoteByRegex: vi.fn(() => false),
      getNumberFromNoteByRegex: vi.fn(() => 0),
      getResultFromNoteByRegex: vi.fn(() => 0),
      getArrayFromNotesByRegex: vi.fn(() => []),
    };

    // the files under test — patch globalThis.Game_BattlerBase.prototype / Game_Battler.prototype directly.
    await import('../../../../src/plugins/resources/core/objects/Game_BattlerBase.js');
    await import('../../../../src/plugins/resources/core/objects/Game_Battler.js');
  });

  afterEach(() =>
  {
    delete globalThis.Game_BattlerBase;
    delete globalThis.Game_Battler;
    delete globalThis.J;
    delete globalThis.RPGManager;
    delete globalThis.$gameParty;
    delete globalThis.$dataItems;
  });

  describe('Game_BattlerBase.prototype.hcrFactor / hcr', () =>
  {
    it('defaults hcrFactor to 1.0 and hcr to 0 at the base-class level', () =>
    {
      const battler = new globalThis.Game_BattlerBase();

      expect(battler.hcrFactor()).toBe(1.0);
      expect(battler.hcr).toBe(0);
    });
  });

  describe('Game_BattlerBase.prototype.skillStackCost / skillItemCost', () =>
  {
    it('returns the sentinel [0, 0] tuple when no stackCost tag is present', () =>
    {
      // Arrange: the RPGManager mock defaults to returning [] for any regex lookup.
      const battler = new globalThis.Game_BattlerBase();

      // Act.
      const result = battler.skillStackCost({});

      // Assert.
      expect(result).toEqual([ 0, 0 ]);
    });

    it('returns the parsed [stateId, count] tuple when a stackCost tag is present', () =>
    {
      // Arrange: simulate RPGManager finding a <stackCost:[7, 3]> tag on the skill.
      globalThis.RPGManager.getArrayFromNotesByRegex.mockReturnValue([ 7, 3 ]);
      const battler = new globalThis.Game_BattlerBase();

      // Act.
      const result = battler.skillStackCost({});

      // Assert.
      expect(result).toEqual([ 7, 3 ]);
    });

    it('returns the sentinel [0, 0] tuple when no itemCost tag is present', () =>
    {
      // Arrange: the RPGManager mock defaults to returning [] for any regex lookup.
      const battler = new globalThis.Game_BattlerBase();

      // Act.
      const result = battler.skillItemCost({});

      // Assert.
      expect(result).toEqual([ 0, 0 ]);
    });

    it('returns the parsed [itemId, count] tuple when an itemCost tag is present', () =>
    {
      // Arrange: simulate RPGManager finding a <itemCost:[12, 2]> tag on the skill.
      globalThis.RPGManager.getArrayFromNotesByRegex.mockReturnValue([ 12, 2 ]);
      const battler = new globalThis.Game_BattlerBase();

      // Act.
      const result = battler.skillItemCost({});

      // Assert.
      expect(result).toEqual([ 12, 2 ]);
    });
  });

  describe('Game_BattlerBase.prototype.skillMpCost / skillTpCost aliasing', () =>
  {
    it('adds extraMpCostBySkill on top of the base mp cost, floored at 0', () =>
    {
      const battler = new globalThis.Game_Battler();
      battler.initResourcesMembers();
      battler.mmp = 1000;
      battler.mcr = 1;
      const skill = {};

      // base mp cost mocked to 10; no extra-cost tags configured, so extra is 0.
      expect(battler.skillMpCost(skill)).toBe(10);
      expect(baseSkillMpCost).toHaveBeenCalledWith(skill);
    });

    it('scales the combined tp cost by tcr', () =>
    {
      const battler = new globalThis.Game_Battler();
      battler.initResourcesMembers();
      battler.mtp = 100;
      battler.tcr = 2;
      const skill = {};

      // base tp cost mocked to 5, no extra-cost tags -> (5 + 0) * tcr 2 = 10.
      expect(battler.skillTpCost(skill)).toBe(10);
    });
  });

  describe('Game_Battler hcr storage', () =>
  {
    it('initializes _j._hcr to 100 (no reduction) via initResourcesMembers', () =>
    {
      const battler = new globalThis.Game_Battler();
      battler.initResourcesMembers();

      expect(battler._j._hcr).toBe(100);
      // hcr getter is (100 - _hcr) / 100, so a fresh battler has 0% reduction.
      expect(battler.hcr).toBe(0);
      expect(battler.hcrFactor()).toBe(1);
    });

    it('setHcr updates the stored value and hcr/hcrFactor reflect it', () =>
    {
      const battler = new globalThis.Game_Battler();
      battler.initResourcesMembers();
      battler.setHcr(40);

      // stored _hcr of 40 means hp costs are multiplied by 40% (hcrFactor), i.e. a 60% reduction (hcr).
      expect(battler.hcrFactor()).toBe(0.4);
      expect(battler.hcr).toBeCloseTo(0.6);
    });

    it('refreshHcr subtracts each source hcr() from 100, floored at 0', () =>
    {
      const battler = new globalThis.Game_Battler();
      battler.initResourcesMembers();
      battler.hcrSources = () => [ { hcr: () => 30 }, { hcr: () => 90 } ];

      battler.refreshHcr();

      // 100 - 30 - 90 = -20, floored to 0.
      expect(battler._j._hcr).toBe(0);
    });

    it('hcrSources defaults to an empty array on the base Game_Battler', () =>
    {
      const battler = new globalThis.Game_Battler();

      expect(battler.hcrSources()).toEqual([]);
    });
  });

  describe('Game_Battler.prototype.initMembers aliasing', () =>
  {
    it('calls the original initMembers and then initializes resources members', () =>
    {
      const battler = new globalThis.Game_Battler();

      battler.initMembers();

      expect(baseInitMembers).toHaveBeenCalledTimes(1);
      expect(battler._j._hcr).toBe(100);
    });
  });

  describe('Game_Battler.prototype.onBattlerDataChange aliasing', () =>
  {
    it('calls the original onBattlerDataChange and then refreshes hcr', () =>
    {
      const battler = new globalThis.Game_Battler();
      battler.initResourcesMembers();
      battler.hcrSources = () => [ { hcr: () => 25 } ];

      battler.onBattlerDataChange();

      expect(baseOnBattlerDataChange).toHaveBeenCalledTimes(1);
      expect(battler._j._hcr).toBe(75);
    });
  });

  describe('Game_Battler.prototype.canPaySkillCost', () =>
  {
    it('defers to the base result first, returning false immediately if it fails', () =>
    {
      baseCanPaySkillCost.mockReturnValue(false);
      const battler = new globalThis.Game_Battler();
      battler.initResourcesMembers();
      const skill = {};

      expect(battler.canPaySkillCost(skill)).toBe(false);
    });

    it('requires hp to remain above the hp cost when sacrifice is not allowed', () =>
    {
      const battler = new globalThis.Game_Battler();
      battler.initResourcesMembers();
      battler.skillHpCost = () => 50;
      battler.hp = 50;
      globalThis.RPGManager.checkForBooleanFromNoteByRegex.mockReturnValue(false);

      // hp (50) must be strictly greater than hpCost (50) — equal is not enough.
      expect(battler.canPaySkillCost({})).toBe(false);
    });

    it('allows dropping to 0 or below when the hp-cost-can-kill tag is present', () =>
    {
      const battler = new globalThis.Game_Battler();
      battler.initResourcesMembers();
      battler.skillHpCost = () => 999;
      battler.hp = 1;
      globalThis.RPGManager.checkForBooleanFromNoteByRegex.mockReturnValue(true);

      expect(battler.canPaySkillCost({})).toBe(true);
    });

    it('returns true when there is no hp cost at all', () =>
    {
      const battler = new globalThis.Game_Battler();
      battler.initResourcesMembers();
      battler.skillHpCost = () => 0;

      expect(battler.canPaySkillCost({})).toBe(true);
    });

    it('still checks stack/item costs after an hp sacrifice is allowed, rather than short-circuiting', () =>
    {
      // Arrange: hp-cost-can-kill clears the hp gate, but stacks are insufficient to afford the cast.
      const battler = new globalThis.Game_Battler();
      battler.initResourcesMembers();
      battler.skillHpCost = () => 999;
      battler.hp = 1;
      globalThis.RPGManager.checkForBooleanFromNoteByRegex.mockReturnValue(true);
      battler.skillStackCost = () => [ 7, 3 ];
      battler.stackCount = () => 1;

      // Act.
      const result = battler.canPaySkillCost({});

      // Assert: the hp gate alone would have passed, but the stack gate still blocks it.
      expect(result).toBe(false);
    });

    it('returns false when the battler has fewer stacks than the required stackCost', () =>
    {
      // Arrange.
      const battler = new globalThis.Game_Battler();
      battler.initResourcesMembers();
      battler.skillHpCost = () => 0;
      battler.skillStackCost = () => [ 7, 3 ];
      battler.stackCount = () => 2;

      // Act.
      const result = battler.canPaySkillCost({});

      // Assert.
      expect(result).toBe(false);
    });

    it('returns true when the battler has at least as many stacks as the required stackCost', () =>
    {
      // Arrange.
      const battler = new globalThis.Game_Battler();
      battler.initResourcesMembers();
      battler.skillHpCost = () => 0;
      battler.skillStackCost = () => [ 7, 3 ];
      battler.stackCount = () => 3;

      // Act.
      const result = battler.canPaySkillCost({});

      // Assert.
      expect(result).toBe(true);
    });

    it('returns false when the party has fewer of the required item than the itemCost', () =>
    {
      // Arrange.
      const battler = new globalThis.Game_Battler();
      battler.initResourcesMembers();
      battler.skillHpCost = () => 0;
      battler.skillItemCost = () => [ 12, 2 ];
      globalThis.$dataItems = { at: id => ({ id }) };
      globalThis.$gameParty = { numItems: () => 1 };

      // Act.
      const result = battler.canPaySkillCost({});

      // Assert.
      expect(result).toBe(false);
    });

    it('returns true when the party has at least as much of the required item as the itemCost', () =>
    {
      // Arrange.
      const battler = new globalThis.Game_Battler();
      battler.initResourcesMembers();
      battler.skillHpCost = () => 0;
      battler.skillItemCost = () => [ 12, 2 ];
      globalThis.$dataItems = { at: id => ({ id }) };
      globalThis.$gameParty = { numItems: () => 2 };

      // Act.
      const result = battler.canPaySkillCost({});

      // Assert.
      expect(result).toBe(true);
    });
  });

  describe('Game_Battler.prototype.paySkillCost', () =>
  {
    it('pays the base cost, deducts the hp cost, and applies all resource gains', () =>
    {
      const battler = new globalThis.Game_Battler();
      battler.initResourcesMembers();
      battler.mhp = 1000;
      battler.mmp = 500;
      battler.mtp = 100;
      battler.rec = 1;
      battler.skill = id => ({ id });
      const skill = { id: 1 };

      battler.paySkillCost(skill);

      // base engine paySkillCost is invoked once via the alias.
      expect(basePaySkillCost).toHaveBeenCalledWith(skill);
      // no hp/mp/tp-cost or gain tags configured, so hp cost is 0 (paid via gainHp) and gains are 0.
      expect(battler.gainHp).toHaveBeenCalledTimes(2);
      expect(battler.gainHp.mock.calls[0][0]).toBe(-0);
      expect(battler.gainHp.mock.calls[1][0]).toBe(0);
      expect(battler.gainMp).toHaveBeenCalledWith(0);
      expect(battler.gainTp).toHaveBeenCalledWith(0);
    });

    it('decrements state stacks when a stackCost is configured', () =>
    {
      // Arrange.
      const battler = new globalThis.Game_Battler();
      battler.initResourcesMembers();
      battler.mhp = 1000;
      battler.mmp = 500;
      battler.mtp = 100;
      battler.rec = 1;
      battler.skill = id => ({ id });
      battler.skillStackCost = () => [ 7, 3 ];
      battler.decrementStateStacks = vi.fn();
      const skill = { id: 1 };

      // Act.
      battler.paySkillCost(skill);

      // Assert.
      expect(battler.decrementStateStacks).toHaveBeenCalledWith(7, 3);
    });

    it('does not touch state stacks when no stackCost is configured', () =>
    {
      // Arrange.
      const battler = new globalThis.Game_Battler();
      battler.initResourcesMembers();
      battler.mhp = 1000;
      battler.mmp = 500;
      battler.mtp = 100;
      battler.rec = 1;
      battler.skill = id => ({ id });
      battler.decrementStateStacks = vi.fn();
      const skill = { id: 1 };

      // Act.
      battler.paySkillCost(skill);

      // Assert.
      expect(battler.decrementStateStacks).not.toHaveBeenCalled();
    });

    it('loses items from the party when an itemCost is configured', () =>
    {
      // Arrange.
      const battler = new globalThis.Game_Battler();
      battler.initResourcesMembers();
      battler.mhp = 1000;
      battler.mmp = 500;
      battler.mtp = 100;
      battler.rec = 1;
      battler.skill = id => ({ id });
      battler.skillItemCost = () => [ 12, 2 ];
      const itemRow = { id: 12 };
      globalThis.$dataItems = { at: () => itemRow };
      globalThis.$gameParty = { loseItem: vi.fn() };
      const skill = { id: 1 };

      // Act.
      battler.paySkillCost(skill);

      // Assert.
      expect(globalThis.$gameParty.loseItem).toHaveBeenCalledWith(itemRow, 2, false);
    });

    it('does not touch the party inventory when no itemCost is configured', () =>
    {
      // Arrange.
      const battler = new globalThis.Game_Battler();
      battler.initResourcesMembers();
      battler.mhp = 1000;
      battler.mmp = 500;
      battler.mtp = 100;
      battler.rec = 1;
      battler.skill = id => ({ id });
      globalThis.$gameParty = { loseItem: vi.fn() };
      const skill = { id: 1 };

      // Act.
      battler.paySkillCost(skill);

      // Assert.
      expect(globalThis.$gameParty.loseItem).not.toHaveBeenCalled();
    });
  });

  describe('Game_Battler.prototype.gain*FromResource', () =>
  {
    it('gainHpFromResource/gainMpFromResource/gainTpFromResource delegate to the vanilla gain methods', () =>
    {
      const battler = new globalThis.Game_Battler();

      battler.gainHpFromResource(5);
      battler.gainMpFromResource(6);
      battler.gainTpFromResource(7);

      expect(battler.gainHp).toHaveBeenCalledWith(5);
      expect(battler.gainMp).toHaveBeenCalledWith(6);
      expect(battler.gainTp).toHaveBeenCalledWith(7);
    });
  });
});
//endregion plugins/resources/_component/game-battler-base-and-battler-direct.test.js

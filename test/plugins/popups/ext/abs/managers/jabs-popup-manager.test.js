//region plugins/popups/ext/abs/managers/jabs-popup-manager.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('JABS_PopupManager (direct src import)', () =>
{
  let JABS_PopupManager;
  let FakeJABSPopupMergeController;

  beforeAll(async () =>
  {
    vi.resetModules();

    FakeJABSPopupMergeController = {
      routeMitigationPop: vi.fn(),
      routeStrikePop: vi.fn(),
      routeRewardPop: vi.fn(),
      routeSlipPop: vi.fn(),
    };
    vi.doMock('../../../../../../src/plugins/popups/ext/abs/managers/JABS_PopupMergeController.js', () => ({ default: FakeJABSPopupMergeController }));

    globalThis.Map_TextPop = {
      Types: { Parry: 'parry', Evade: 'evade', Experience: 'experience', Gold: 'gold' },
    };

    globalThis.J = { ELEM: false, POPUPS: { EXT: { ABS: { Metadata: { disableSkillUsedPopups: false } } }, notifyMergeFlushAll: vi.fn() } };

    globalThis.TextPopManager = { show: vi.fn(), showBatch: vi.fn() };

    // a chainable recorder standing in for the real (already-tested-elsewhere) TextPopBuilder:
    // every convenience/setter method records its call and returns `this`; build() snapshots state.
    function FakeTextPopBuilder(value)
    {
      this.value = value;
      this.iconIndex = undefined;
      this.critical = undefined;
      this.popupType = undefined;
      this.calls = [];
    }

    const chainMethods = [
      'isHpDamage', 'isMpDamage', 'isTpDamage', 'forIncomingHealRing', 'forEnemyDamageRing',
      'forCenterFocusRing', 'forRegenRing', 'forSlipDamageRing', 'setTextAccent', 'setTextColorIndex',
      'isElemental', 'isSkillUsed', 'isExperience', 'isGold', 'isLoot', 'isLevelUp', 'isSkillLearned',
    ];
    chainMethods.forEach(name =>
    {
      FakeTextPopBuilder.prototype[name] = function(...args)
      {
        this.calls.push([ name, ...args ]);
        return this;
      };
    });
    FakeTextPopBuilder.prototype.setValue = function(v)
    {
      this.value = v;
      this.calls.push([ 'setValue', v ]);
      return this;
    };
    FakeTextPopBuilder.prototype.setPopupType = function(v)
    {
      this.popupType = v;
      this.calls.push([ 'setPopupType', v ]);
      return this;
    };
    FakeTextPopBuilder.prototype.setIconIndex = function(v)
    {
      this.iconIndex = v;
      this.calls.push([ 'setIconIndex', v ]);
      return this;
    };
    FakeTextPopBuilder.prototype.setCritical = function(v)
    {
      this.critical = v;
      this.calls.push([ 'setCritical', v ]);
      return this;
    };
    FakeTextPopBuilder.prototype.build = function()
    {
      return { value: this.value, iconIndex: this.iconIndex, critical: this.critical, popupType: this.popupType, calls: this.calls };
    };
    globalThis.TextPopBuilder = FakeTextPopBuilder;

    ({ default: JABS_PopupManager } = await import('../../../../../../src/plugins/popups/ext/abs/managers/JABS_PopupManager.js'));
  });

  beforeEach(() =>
  {
    vi.clearAllMocks();
  });

  function makeActionResult(overrides = {})
  {
    return { parried: false, evaded: false, hpDamage: 0, mpDamage: 0, tpDamage: 0, glancing: false, critical: false, ...overrides };
  }

  describe('showAttackPop', () =>
  {
    it('does nothing for a support skill (damage.type 0)', () =>
    {
      // Arrange
      const action = { getBaseSkill: () => ({ damage: { type: 0 } }) };
      const target = {};

      // Act
      JABS_PopupManager.showAttackPop(action, target, {});

      // Assert
      expect(FakeJABSPopupMergeController.routeMitigationPop).not.toHaveBeenCalled();
      expect(FakeJABSPopupMergeController.routeStrikePop).not.toHaveBeenCalled();
    });

    it('routes a mitigation pop for a parried result and does not route a strike pop', () =>
    {
      // Arrange
      const character = { getJabsBattlerUuid: () => 'target-uuid' };
      const action = {
        getBaseSkill: () => ({ damage: { type: 1 } }),
        getCaster: () => ({ getUuid: () => 'caster-uuid' }),
        getAction: () => ({ calcElementRate: () => 1 }),
      };
      const target = { getCharacter: () => character, getBattler: () => ({ result: () => makeActionResult({ parried: true }) }) };
      const engine = { determineElementalIcon: () => 5 };

      // Act
      JABS_PopupManager.showAttackPop(action, target, engine);

      // Assert
      expect(FakeJABSPopupMergeController.routeMitigationPop).toHaveBeenCalledWith(
        expect.objectContaining({ value: 'PARRY!' }),
        character,
        expect.objectContaining({ mitigationType: 'parry', labelPrefix: 'PARRY' }),
      );
      expect(FakeJABSPopupMergeController.routeStrikePop).not.toHaveBeenCalled();
    });

    it('routes a mitigation pop for an evaded result', () =>
    {
      // Arrange
      const character = { getJabsBattlerUuid: () => 'target-uuid' };
      const action = {
        getBaseSkill: () => ({ damage: { type: 1 } }),
        getCaster: () => ({ getUuid: () => 'caster-uuid' }),
        getAction: () => ({ calcElementRate: () => 1 }),
      };
      const target = { getCharacter: () => character, getBattler: () => ({ result: () => makeActionResult({ evaded: true }) }) };
      const engine = { determineElementalIcon: () => 5 };

      // Act
      JABS_PopupManager.showAttackPop(action, target, engine);

      // Assert
      expect(FakeJABSPopupMergeController.routeMitigationPop).toHaveBeenCalledWith(
        expect.anything(),
        character,
        expect.objectContaining({ mitigationType: 'evade', labelPrefix: 'DODGE' }),
      );
    });

    it('routes a strike pop using hpDamage when present', () =>
    {
      // Arrange
      const character = { getJabsBattlerUuid: () => 'target-uuid' };
      const action = {
        getBaseSkill: () => ({ damage: { type: 1 } }),
        getCaster: () => ({ getUuid: () => 'caster-uuid' }),
        getAction: () => ({ calcElementRate: () => 1 }),
      };
      const target = { getCharacter: () => character, getBattler: () => ({ result: () => makeActionResult({ hpDamage: 12 }) }) };
      const engine = { determineElementalIcon: () => 5 };

      // Act
      JABS_PopupManager.showAttackPop(action, target, engine);

      // Assert
      expect(FakeJABSPopupMergeController.routeStrikePop).toHaveBeenCalledWith(
        expect.anything(),
        character,
        { attackerUuid: 'caster-uuid', targetUuid: 'target-uuid', amount: 12 },
      );
    });

    it('falls back to mpDamage when hpDamage is zero', () =>
    {
      // Arrange
      const character = { getJabsBattlerUuid: () => 'target-uuid' };
      const action = {
        getBaseSkill: () => ({ damage: { type: 1 } }),
        getCaster: () => ({ getUuid: () => 'caster-uuid' }),
        getAction: () => ({ calcElementRate: () => 1 }),
      };
      const target = { getCharacter: () => character, getBattler: () => ({ result: () => makeActionResult({ mpDamage: 7 }) }) };
      const engine = { determineElementalIcon: () => 5 };

      // Act
      JABS_PopupManager.showAttackPop(action, target, engine);

      // Assert
      expect(FakeJABSPopupMergeController.routeStrikePop).toHaveBeenCalledWith(expect.anything(), character, expect.objectContaining({ amount: 7 }));
    });

    it('falls back to tpDamage when hp/mp damage are zero', () =>
    {
      // Arrange
      const character = { getJabsBattlerUuid: () => 'target-uuid' };
      const action = {
        getBaseSkill: () => ({ damage: { type: 1 } }),
        getCaster: () => ({ getUuid: () => 'caster-uuid' }),
        getAction: () => ({ calcElementRate: () => 1 }),
      };
      const target = { getCharacter: () => character, getBattler: () => ({ result: () => makeActionResult({ tpDamage: 4 }) }) };
      const engine = { determineElementalIcon: () => 5 };

      // Act
      JABS_PopupManager.showAttackPop(action, target, engine);

      // Assert
      expect(FakeJABSPopupMergeController.routeStrikePop).toHaveBeenCalledWith(expect.anything(), character, expect.objectContaining({ amount: 4 }));
    });

    it('falls back to hpDamage (0) when nothing was dealt at all', () =>
    {
      // Arrange
      const character = { getJabsBattlerUuid: () => 'target-uuid' };
      const action = {
        getBaseSkill: () => ({ damage: { type: 1 } }),
        getCaster: () => ({ getUuid: () => 'caster-uuid' }),
        getAction: () => ({ calcElementRate: () => 1 }),
      };
      const target = { getCharacter: () => character, getBattler: () => ({ result: () => makeActionResult() }) };
      const engine = { determineElementalIcon: () => 5 };

      // Act
      JABS_PopupManager.showAttackPop(action, target, engine);

      // Assert
      expect(FakeJABSPopupMergeController.routeStrikePop).toHaveBeenCalledWith(expect.anything(), character, expect.objectContaining({ amount: 0 }));
    });
  });

  describe('buildDamagePop', () =>
  {
    it('uses calculateRawElementRate when J.ELEM is active', () =>
    {
      // Arrange
      globalThis.J.ELEM = true;
      const calculateRawElementRate = vi.fn().mockReturnValue(2);
      const action = {
        getBaseSkill: () => ({}),
        getCaster: () => ({}),
        getAction: () => ({ calculateRawElementRate, calcElementRate: vi.fn() }),
      };
      const target = { getBattler: () => ({ result: () => makeActionResult({ hpDamage: 5 }) }) };
      const engine = { determineElementalIcon: () => 5 };

      // Act
      JABS_PopupManager.buildDamagePop(action, target, engine);

      // Assert
      expect(calculateRawElementRate).toHaveBeenCalled();
      globalThis.J.ELEM = false;
    });

    it('uses calcElementRate when J.ELEM is not active', () =>
    {
      // Arrange
      const calcElementRate = vi.fn().mockReturnValue(1);
      const action = {
        getBaseSkill: () => ({}),
        getCaster: () => ({}),
        getAction: () => ({ calcElementRate }),
      };
      const target = { getBattler: () => ({ result: () => makeActionResult({ hpDamage: 5 }) }) };
      const engine = { determineElementalIcon: () => 5 };

      // Act
      JABS_PopupManager.buildDamagePop(action, target, engine);

      // Assert
      expect(calcElementRate).toHaveBeenCalled();
    });

    it('uses the parry icon (128) instead of the elemental icon for a parried result', () =>
    {
      // Arrange
      const action = { getBaseSkill: () => ({}), getCaster: () => ({}), getAction: () => ({ calcElementRate: () => 1 }) };
      const target = { getBattler: () => ({ result: () => makeActionResult({ parried: true }) }) };
      const engine = { determineElementalIcon: () => 99 };

      // Act
      const pop = JABS_PopupManager.buildDamagePop(action, target, engine);

      // Assert
      expect(pop.iconIndex).toEqual(128);
    });

    it('sets the parry value/type/ring/accent for a parried result', () =>
    {
      // Arrange
      const action = { getBaseSkill: () => ({}), getCaster: () => ({}), getAction: () => ({ calcElementRate: () => 1 }) };
      const target = { getBattler: () => ({ result: () => makeActionResult({ parried: true }) }) };
      const engine = { determineElementalIcon: () => 99 };

      // Act
      const pop = JABS_PopupManager.buildDamagePop(action, target, engine);

      // Assert
      expect(pop.value).toEqual('PARRY!');
      expect(pop.popupType).toEqual('parry');
      expect(pop.calls).toEqual(expect.arrayContaining([ [ 'forCenterFocusRing' ], [ 'setTextAccent', 'parry' ] ]));
    });

    it('sets the dodge value/type/ring/accent for an evaded result', () =>
    {
      // Arrange
      const action = { getBaseSkill: () => ({}), getCaster: () => ({}), getAction: () => ({ calcElementRate: () => 1 }) };
      const target = { getBattler: () => ({ result: () => makeActionResult({ evaded: true }) }) };
      const engine = { determineElementalIcon: () => 99 };

      // Act
      const pop = JABS_PopupManager.buildDamagePop(action, target, engine);

      // Assert
      expect(pop.value).toEqual('DODGE');
      expect(pop.popupType).toEqual('evade');
    });

    it('marks a positive hp result as damage with the enemy-damage ring', () =>
    {
      // Arrange
      const action = { getBaseSkill: () => ({}), getCaster: () => ({}), getAction: () => ({ calcElementRate: () => 1 }) };
      const target = { getBattler: () => ({ result: () => makeActionResult({ hpDamage: 10 }) }) };
      const engine = { determineElementalIcon: () => 99 };

      // Act
      const pop = JABS_PopupManager.buildDamagePop(action, target, engine);

      // Assert
      expect(pop.calls).toEqual(expect.arrayContaining([ [ 'isHpDamage' ], [ 'forEnemyDamageRing' ] ]));
    });

    it('marks a negative hp result as healing with the incoming-heal ring', () =>
    {
      // Arrange
      const action = { getBaseSkill: () => ({}), getCaster: () => ({}), getAction: () => ({ calcElementRate: () => 1 }) };
      const target = { getBattler: () => ({ result: () => makeActionResult({ hpDamage: -10 }) }) };
      const engine = { determineElementalIcon: () => 99 };

      // Act
      const pop = JABS_PopupManager.buildDamagePop(action, target, engine);

      // Assert
      expect(pop.calls).toEqual(expect.arrayContaining([ [ 'forIncomingHealRing' ] ]));
    });

    it('applies the glancing accent/color for a glancing hp hit', () =>
    {
      // Arrange
      const action = { getBaseSkill: () => ({}), getCaster: () => ({}), getAction: () => ({ calcElementRate: () => 1 }) };
      const target = { getBattler: () => ({ result: () => makeActionResult({ hpDamage: 10, glancing: true }) }) };
      const engine = { determineElementalIcon: () => 99 };

      // Act
      const pop = JABS_PopupManager.buildDamagePop(action, target, engine);

      // Assert
      expect(pop.calls).toEqual(expect.arrayContaining([ [ 'setTextAccent', 'glance' ], [ 'setTextColorIndex', 7 ] ]));
    });

    it('marks an mp result appropriately', () =>
    {
      // Arrange
      const action = { getBaseSkill: () => ({}), getCaster: () => ({}), getAction: () => ({ calcElementRate: () => 1 }) };
      const target = { getBattler: () => ({ result: () => makeActionResult({ mpDamage: 10 }) }) };
      const engine = { determineElementalIcon: () => 99 };

      // Act
      const pop = JABS_PopupManager.buildDamagePop(action, target, engine);

      // Assert
      expect(pop.calls).toEqual(expect.arrayContaining([ [ 'isMpDamage' ] ]));
    });

    it('marks a tp result appropriately', () =>
    {
      // Arrange
      const action = { getBaseSkill: () => ({}), getCaster: () => ({}), getAction: () => ({ calcElementRate: () => 1 }) };
      const target = { getBattler: () => ({ result: () => makeActionResult({ tpDamage: 10 }) }) };
      const engine = { determineElementalIcon: () => 99 };

      // Act
      const pop = JABS_PopupManager.buildDamagePop(action, target, engine);

      // Assert
      expect(pop.calls).toEqual(expect.arrayContaining([ [ 'isTpDamage' ] ]));
    });

    it('falls back to the default hp-damage branch when nothing was dealt', () =>
    {
      // Arrange
      const action = { getBaseSkill: () => ({}), getCaster: () => ({}), getAction: () => ({ calcElementRate: () => 1 }) };
      const target = { getBattler: () => ({ result: () => makeActionResult() }) };
      const engine = { determineElementalIcon: () => 99 };

      // Act
      const pop = JABS_PopupManager.buildDamagePop(action, target, engine);

      // Assert
      expect(pop.calls).toEqual(expect.arrayContaining([ [ 'isHpDamage' ], [ 'forEnemyDamageRing' ] ]));
    });

    it('marks the popup critical when the result was critical', () =>
    {
      // Arrange
      const action = { getBaseSkill: () => ({}), getCaster: () => ({}), getAction: () => ({ calcElementRate: () => 1 }) };
      const target = { getBattler: () => ({ result: () => makeActionResult({ hpDamage: 10, critical: true }) }) };
      const engine = { determineElementalIcon: () => 99 };

      // Act
      const pop = JABS_PopupManager.buildDamagePop(action, target, engine);

      // Assert
      expect(pop.critical).toEqual(true);
    });
  });

  describe('showSkillUsedPop', () =>
  {
    it('does not show when skill-used popups are disabled', () =>
    {
      // Arrange
      globalThis.J.POPUPS.EXT.ABS.Metadata.disableSkillUsedPopups = true;
      const action = { getCaster: () => ({ isInanimate: () => false }) };

      // Act
      JABS_PopupManager.showSkillUsedPop(action);

      // Assert
      expect(globalThis.TextPopManager.show).not.toHaveBeenCalled();
      globalThis.J.POPUPS.EXT.ABS.Metadata.disableSkillUsedPopups = false;
    });

    it('does not show when the caster is inanimate', () =>
    {
      // Arrange
      const action = { getCaster: () => ({ isInanimate: () => true }) };

      // Act
      JABS_PopupManager.showSkillUsedPop(action);

      // Assert
      expect(globalThis.TextPopManager.show).not.toHaveBeenCalled();
    });

    it('shows the skill-used popup on the caster character', () =>
    {
      // Arrange
      const character = {};
      const action = {
        getCaster: () => ({ isInanimate: () => false, getCharacter: () => character }),
        getBaseSkill: () => ({ name: 'Fireball', iconIndex: 64 }),
      };

      // Act
      JABS_PopupManager.showSkillUsedPop(action);

      // Assert
      const [ [ pop, shownCharacter ] ] = globalThis.TextPopManager.show.mock.calls;
      expect(pop.value).toEqual('Fireball');
      expect(shownCharacter).toBe(character);
    });
  });

  describe('showExperiencePop', () =>
  {
    it('routes a rounded experience reward pop', () =>
    {
      // Arrange
      const character = {};

      // Act
      JABS_PopupManager.showExperiencePop(12.6, character);

      // Assert
      expect(FakeJABSPopupMergeController.routeRewardPop).toHaveBeenCalledWith(
        expect.objectContaining({ value: 13 }),
        character,
        { rewardType: 'experience', amount: 13 },
      );
    });
  });

  describe('showGoldPop', () =>
  {
    it('routes a rounded gold reward pop', () =>
    {
      // Arrange
      const character = {};

      // Act
      JABS_PopupManager.showGoldPop(9.5, character);

      // Assert
      expect(FakeJABSPopupMergeController.routeRewardPop).toHaveBeenCalledWith(
        expect.objectContaining({ value: 10 }),
        character,
        { rewardType: 'gold', amount: 10 },
      );
    });
  });

  describe('showItemPickedUpPops', () =>
  {
    it('builds one loot pop per item and dispatches them as a batch', () =>
    {
      // Arrange
      const itemDataList = [ { name: 'Potion', iconIndex: 1 }, { name: 'Ether', iconIndex: 2 } ];
      const character = {};

      // Act
      JABS_PopupManager.showItemPickedUpPops(itemDataList, character);

      // Assert
      const [ [ pops, shownCharacter ] ] = globalThis.TextPopManager.showBatch.mock.calls;
      expect(pops).toHaveLength(2);
      expect(pops[0].value).toEqual('Potion');
      expect(pops[1].value).toEqual('Ether');
      expect(shownCharacter).toBe(character);
    });
  });

  describe('showLevelUpPop', () =>
  {
    it('flushes all merges then shows a level-up popup', () =>
    {
      // Arrange
      const character = {};

      // Act
      JABS_PopupManager.showLevelUpPop(character);

      // Assert
      expect(globalThis.J.POPUPS.notifyMergeFlushAll).toHaveBeenCalledWith('level-up');
      const [ [ pop, shownCharacter ] ] = globalThis.TextPopManager.show.mock.calls;
      expect(pop.value).toEqual('LEVEL UP');
      expect(shownCharacter).toBe(character);
    });
  });

  describe('showSkillLearnPop', () =>
  {
    it('flushes all merges then shows a skill-learn popup', () =>
    {
      // Arrange
      const character = {};
      const skill = { name: 'Fireball', iconIndex: 64 };

      // Act
      JABS_PopupManager.showSkillLearnPop(skill, character);

      // Assert
      expect(globalThis.J.POPUPS.notifyMergeFlushAll).toHaveBeenCalledWith('skill-learn');
      const [ [ pop, shownCharacter ] ] = globalThis.TextPopManager.show.mock.calls;
      expect(pop.value).toEqual('Fireball');
      expect(shownCharacter).toBe(character);
    });
  });

  describe('showItemAppliedPop', () =>
  {
    beforeEach(() =>
    {
      globalThis.$jabsEngine = { determineElementalIcon: vi.fn().mockReturnValue(5) };
    });

    it('routes a mitigation pop for a parried result and does not route a strike pop', () =>
    {
      // Arrange
      const character = {};
      const caster = { getCharacter: () => character, getUuid: () => 'caster-uuid' };
      const target = { getBattler: () => ({ result: () => makeActionResult({ parried: true }) }), getCharacter: () => ({ getJabsBattlerUuid: () => 'target-uuid' }) };

      // Act
      JABS_PopupManager.showItemAppliedPop({}, {}, caster, target);

      // Assert
      expect(FakeJABSPopupMergeController.routeMitigationPop).toHaveBeenCalledWith(expect.anything(), character, expect.objectContaining({ mitigationType: 'parry' }));
      expect(FakeJABSPopupMergeController.routeStrikePop).not.toHaveBeenCalled();
    });

    it('routes a mitigation pop for an evaded result', () =>
    {
      // Arrange
      const character = {};
      const caster = { getCharacter: () => character, getUuid: () => 'caster-uuid' };
      const target = { getBattler: () => ({ result: () => makeActionResult({ evaded: true }) }), getCharacter: () => ({ getJabsBattlerUuid: () => 'target-uuid' }) };

      // Act
      JABS_PopupManager.showItemAppliedPop({}, {}, caster, target);

      // Assert
      expect(FakeJABSPopupMergeController.routeMitigationPop).toHaveBeenCalledWith(expect.anything(), character, expect.objectContaining({ mitigationType: 'evade' }));
    });

    it('routes a strike pop with the hp/mp/tp-priority amount for a normal result', () =>
    {
      // Arrange
      const character = {};
      const caster = { getCharacter: () => character, getUuid: () => 'caster-uuid' };
      const target = { getBattler: () => ({ result: () => makeActionResult({ hpDamage: 6 }) }), getCharacter: () => ({ getJabsBattlerUuid: () => 'target-uuid' }) };

      // Act
      JABS_PopupManager.showItemAppliedPop({}, {}, caster, target);

      // Assert
      expect(FakeJABSPopupMergeController.routeStrikePop).toHaveBeenCalledWith(
        expect.anything(),
        character,
        { attackerUuid: 'caster-uuid', targetUuid: 'target-uuid', amount: 6 },
      );
    });
  });

  describe('showSlipPop', () =>
  {
    it('marks an hp slip as damage and routes it', () =>
    {
      // Arrange
      const character = {};
      const battler = { getCharacter: () => character };

      // Act
      JABS_PopupManager.showSlipPop(5, 0, battler, 1);

      // Assert
      expect(FakeJABSPopupMergeController.routeSlipPop).toHaveBeenCalledWith(
        expect.objectContaining({ calls: expect.arrayContaining([ [ 'isHpDamage' ], [ 'forSlipDamageRing' ] ]) }),
        character,
        { type: 0, stateId: 1, amount: 5 },
      );
    });

    it('marks an mp slip as damage', () =>
    {
      // Arrange
      const battler = { getCharacter: () => ({}) };

      // Act
      JABS_PopupManager.showSlipPop(3, 1, battler, 1);

      // Assert
      expect(FakeJABSPopupMergeController.routeSlipPop).toHaveBeenCalledWith(
        expect.objectContaining({ calls: expect.arrayContaining([ [ 'isMpDamage' ] ]) }),
        expect.anything(),
        expect.anything(),
      );
    });

    it('marks a tp slip as damage', () =>
    {
      // Arrange
      const battler = { getCharacter: () => ({}) };

      // Act
      JABS_PopupManager.showSlipPop(2, 2, battler, 1);

      // Assert
      expect(FakeJABSPopupMergeController.routeSlipPop).toHaveBeenCalledWith(
        expect.objectContaining({ calls: expect.arrayContaining([ [ 'isTpDamage' ] ]) }),
        expect.anything(),
        expect.anything(),
      );
    });

    it('uses the regen ring for a negative (regen) amount', () =>
    {
      // Arrange
      const battler = { getCharacter: () => ({}) };

      // Act
      JABS_PopupManager.showSlipPop(-5, 0, battler, 1);

      // Assert
      expect(FakeJABSPopupMergeController.routeSlipPop).toHaveBeenCalledWith(
        expect.objectContaining({ calls: expect.arrayContaining([ [ 'forRegenRing' ] ]) }),
        expect.anything(),
        expect.anything(),
      );
    });
  });
});
//endregion plugins/popups/ext/abs/managers/jabs-popup-manager.test.js

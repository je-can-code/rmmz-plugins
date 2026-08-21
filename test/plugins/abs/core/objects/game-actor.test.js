//region plugins/abs/core/objects/game-actor.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Game_Actor.js is a prototype-patch file (aliases and adds methods onto the real RMMZ
 * `Game_Actor.prototype`), so this file direct-imports it against bare placeholder engine
 * globals rather than nesting a vm context. Every sibling model/manager it imports is mocked
 * per the "unit tier mocks all downstream file-external dependencies" convention. Every RMMZ
 * built-in method it calls off `this` (equips(), currentClass(), skills(), etc.) is not part of
 * this plugin, so `buildActor()` below stubs sane per-call defaults that individual tests override.
 */
describe('J-ABS Game_Actor (unit, all downstream dependencies mocked)', () =>
{
  let getBattlerByUuidMock;

  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = {
      ABS: {
        Aliased: { Game_Actor: new Map() },
        RegExp: {
          Sight: /sight/i,
          AlertedSightBoost: /alertedSightBoost/i,
          Pursuit: /pursuit/i,
          AlertedPursuitBoost: /alertedPursuitBoost/i,
          AlertDuration: /alertDuration/i,
          ConfigNoSwitch: /configNoSwitch/i,
          ConfigAutoUpgradeSkills: /configAutoUpgradeSkills/i,
          NoSkillUpgrading: /noSkillUpgrading/i,
          UpgradeOverSkill: /upgradeOverSkill/i,
          ConfigAutoAssignSkills: /configAutoAssignSkills/i,
          NoAutoAssign: /noAutoAssign/i,
          UpgradeOnlySkill: /upgradeOnlySkill/i,
        },
      },
      PASSIVE: { RegExp: { EquippedPassiveStateIds: /equippedPassiveStateIds/i } },
    };

    globalThis.RPGManager = {
      getNumberFromNoteByRegex: vi.fn(() => null),
      checkForBooleanFromNoteByRegex: vi.fn(() => false),
      getNumbersFromNoteByRegex: vi.fn(() => []),
    };

    globalThis.JABS_Button = { Mainhand: 'mainhand', Offhand: 'offhand' };

    // placeholder RMMZ engine classes, wired with the same prototype chain as the real engine.
    function Game_Battler()
    {
    }
    Game_Battler.prototype.initJabsMembers = function() {};
    Game_Battler.prototype.sightRange = function() { return 3; };
    Game_Battler.prototype.alertedSightBoost = function() { return 2; };
    Game_Battler.prototype.pursuitRange = function() { return 4; };
    Game_Battler.prototype.alertedPursuitBoost = function() { return 1; };
    Game_Battler.prototype.alertDuration = function() { return 300; };
    globalThis.Game_Battler = Game_Battler;

    function Game_Actor()
    {
    }
    Object.setPrototypeOf(Game_Actor.prototype, Game_Battler.prototype);
    // stub "original" hooks so J.ABS.Aliased.Game_Actor.set(key, Game_Actor.prototype.key) captures
    // real functions instead of undefined- these are captured but only some are ever invoked.
    [ 'setup', 'onBattlerDataChange', 'onDeath', 'onRevive', 'onLevelUp', 'onLevelDown',
      'onLearnNewSkill', 'performMapDamage', 'turnEndOnMap', 'getSkillTransformSources' ]
      .forEach(key => { Game_Actor.prototype[key] = function() {}; });
    globalThis.Game_Actor = Game_Actor;

    globalThis.$dataSkills = [];

    // sibling model/manager dependencies- mocked entirely per the unit-tier convention.
    vi.doMock('../../../../../src/plugins/abs/core/models/JABS_SkillSlot.js', () => ({ default: class {} }));
    vi.doMock('../../../../../src/plugins/abs/core/models/JABS_Battler.js', () => ({
      default: class
      {
        static allyTeamId()
        {
          return 0;
        }

        static isSkillVisibleInOffhandMenu(skill)
        {
          return skill.offhandEligible === true;
        }

        static isSkillVisibleInCombatMenu(skill)
        {
          return skill.combatEligible === true;
        }

        static isSkillVisibleInDodgeMenu(skill)
        {
          return skill.dodgeEligible === true;
        }
      },
    }));
    getBattlerByUuidMock = vi.fn();
    vi.doMock('../../../../../src/plugins/abs/core/managers/JABS_AiManager.js', () => ({
      default: class
      {
        static getBattlerByUuid(uuid)
        {
          return getBattlerByUuidMock(uuid);
        }
      },
    }));

    await import('../../../../../src/plugins/abs/core/objects/Game_Actor.js');
  });

  beforeEach(() =>
  {
    globalThis.RPGManager.getNumberFromNoteByRegex.mockReset().mockReturnValue(null);
    globalThis.RPGManager.checkForBooleanFromNoteByRegex.mockReset().mockReturnValue(false);
    globalThis.RPGManager.getNumbersFromNoteByRegex.mockReset().mockReturnValue([]);
    getBattlerByUuidMock.mockReset();
    globalThis.$jabsEngine = {
      absEnabled: true,
      requestSpriteRefresh: false,
      battlerLevelup: vi.fn(),
      battlerSkillLearn: vi.fn(),
    };
    globalThis.$gameScreen = { startFlashForDamage: vi.fn() };
  });

  /**
   * Builds a real `Game_Actor`-prototype-backed instance with sane, overridable stub
   * implementations for every RMMZ built-in method this plugin's patches call off `this`.
   * @param {object} [overrides] Instance-level method/property overrides.
   * @returns {object} A stubbed Game_Actor instance.
   */
  function buildActor(overrides = {})
  {
    const actor = Object.create(globalThis.Game_Actor.prototype);
    actor.initJabsMembers();

    Object.assign(actor, {
      actor: () => ({ id: 1 }),
      actorId: () => 1,
      equips: () => [ null, null ],
      currentClass: () => ({}),
      skills: () => [],
      skill: () => null,
      states: () => [],
      allStates: () => [],
      databaseData: () => ({}),
      equippedEquips: () => [],
      hasSkill: () => true,
      isLeader: () => false,
      isEquipTypeSealed: () => false,
      isDualWield: () => false,
      // non-empty by default so `.some()` gates actually invoke the mocked RPGManager predicate
      // instead of short-circuiting on an empty array.
      getAllNotes: () => [ {} ],
      getActorNotes: () => [ {} ],
      resolveEquippedSkillId: (baseSkillId) => baseSkillId,
      getEmptySecondarySkills: () => [],
      getSkillSlotManager: () => buildSkillSlotManager(),
      setEquippedSkill: vi.fn(),
      setCachedVisionModifier: vi.fn(),
      setCachedProjectileDurationModifier: vi.fn(),
      refreshBonusHits: vi.fn(),
      refreshCdr: vi.fn(),
      refreshPer: vi.fn(),
      refreshPositiveRolls: vi.fn(),
      refreshNegativeRolls: vi.fn(),
      refreshEncoreRepeats: vi.fn(),
      ...overrides,
    });

    return actor;
  }

  /**
   * Builds a minimal fake skill slot manager test double.
   * @param {object} [overrides] Properties/methods to override.
   * @returns {object} A fake skill slot manager.
   */
  function buildSkillSlotManager(overrides = {})
  {
    return {
      isSetupComplete: () => true,
      setupSlots: vi.fn(),
      getAllSlots: () => [],
      getEquippedSlots: () => [],
      getAllSecondarySlots: () => [],
      getAllPrimarySlots: () => [],
      getToolSlot: () => ({}),
      getDodgeSlot: () => ({}),
      getOffhandPinnedSkillId: () => 0,
      setOffhandPinnedSkillId: vi.fn(),
      clearOffhandPin: vi.fn(),
      flagAllSkillSlotsForRefresh: vi.fn(),
      ...overrides,
    };
  }

  //region initialization
  describe('initJabsMembers()', () =>
  {
    it('initializes the _j._abs namespace with defaults', () =>
    {
      const actor = Object.create(globalThis.Game_Actor.prototype);
      actor.initJabsMembers();

      expect(actor._j._abs._deathEffect).toEqual(false);
      expect(actor._j._abs._lastOffhandItemId).toBeNull();
    });
  });

  describe('setup()', () =>
  {
    it('initializes abs skills and performs a jabs refresh', () =>
    {
      const actor = buildActor();
      const initAbsSkillsSpy = vi.spyOn(actor, 'initAbsSkills');
      const jabsRefreshSpy = vi.spyOn(actor, 'jabsRefresh');

      actor.setup(1);

      expect(initAbsSkillsSpy).toHaveBeenCalled();
      expect(jabsRefreshSpy).toHaveBeenCalled();
    });
  });

  describe('onBattlerDataChange()', () =>
  {
    it('invalidates caches and refreshes every cached derived stat', () =>
    {
      const actor = buildActor();

      actor.onBattlerDataChange();

      expect(actor.setCachedVisionModifier).toHaveBeenCalledWith(null);
      expect(actor.setCachedProjectileDurationModifier).toHaveBeenCalledWith(null);
      expect(actor.refreshBonusHits).toHaveBeenCalled();
      expect(actor.refreshCdr).toHaveBeenCalled();
      expect(actor.refreshPer).toHaveBeenCalled();
      expect(actor.refreshPositiveRolls).toHaveBeenCalled();
      expect(actor.refreshNegativeRolls).toHaveBeenCalled();
      expect(actor.refreshEncoreRepeats).toHaveBeenCalled();
    });
  });
  //endregion initialization

  //region JABS basic attack skills
  describe('refreshBasicAttackSkills()/canRefreshBasicAttackSkills()', () =>
  {
    it('does nothing when the skill slot manager is missing', () =>
    {
      const actor = buildActor({ getSkillSlotManager: () => null });

      expect(() => actor.refreshBasicAttackSkills()).not.toThrow();
      expect(actor.setEquippedSkill).not.toHaveBeenCalled();
    });

    it('does nothing when the skill slot manager has not finished setup', () =>
    {
      const actor = buildActor({ getSkillSlotManager: () => buildSkillSlotManager({ isSetupComplete: () => false }) });

      actor.refreshBasicAttackSkills();

      expect(actor.setEquippedSkill).not.toHaveBeenCalled();
    });

    it('updates mainhand and offhand slots and removes invalid skills once setup is complete', () =>
    {
      const actor = buildActor();
      const removeInvalidSpy = vi.spyOn(actor, 'removeInvalidSkills');

      actor.refreshBasicAttackSkills();

      expect(actor.setEquippedSkill).toHaveBeenCalledWith('mainhand', 0);
      expect(actor.setEquippedSkill).toHaveBeenCalledWith('offhand', 0);
      expect(removeInvalidSpy).toHaveBeenCalled();
    });
  });

  describe('getMainhandSkill()', () =>
  {
    it('returns 0 when there is no mainhand equipped', () =>
    {
      const actor = buildActor({ equips: () => [ null ] });

      expect(actor.getMainhandSkill()).toEqual(0);
    });

    it('returns the mainhand jabsSkillId when present', () =>
    {
      const actor = buildActor({ equips: () => [ { jabsSkillId: 7 } ] });

      expect(actor.getMainhandSkill()).toEqual(7);
    });

    it('defaults to 0 when the mainhand has no jabsSkillId tag', () =>
    {
      const actor = buildActor({ equips: () => [ {} ] });

      expect(actor.getMainhandSkill()).toEqual(0);
    });
  });

  describe('offhandEquipTypeId()', () =>
  {
    it('returns the fixed offhand equip type id', () =>
    {
      const actor = buildActor();

      expect(actor.offhandEquipTypeId()).toEqual(2);
    });
  });

  describe('isTwoHanded()/isMainhandTwoHanded()', () =>
  {
    it('reflects the native offhand equip-seal trait', () =>
    {
      const sealed = buildActor({ isEquipTypeSealed: () => true });
      const unsealed = buildActor({ isEquipTypeSealed: () => false });

      expect(sealed.isTwoHanded()).toEqual(true);
      expect(sealed.isMainhandTwoHanded()).toEqual(true);
      expect(unsealed.isTwoHanded()).toEqual(false);
    });
  });

  describe('mainhandDeclaresOffhandSkillId()', () =>
  {
    it('returns false when there is no mainhand', () =>
    {
      const actor = buildActor({ equips: () => [ null ] });

      expect(actor.mainhandDeclaresOffhandSkillId()).toEqual(false);
    });

    it('returns false when the mainhand has no positive offhand skill declaration', () =>
    {
      const actor = buildActor({ equips: () => [ {} ] });

      expect(actor.mainhandDeclaresOffhandSkillId()).toEqual(false);
    });

    it('returns true when the mainhand declares a positive offhand skill id', () =>
    {
      const actor = buildActor({ equips: () => [ { jabsOffhandSkillId: 5 } ] });

      expect(actor.mainhandDeclaresOffhandSkillId()).toEqual(true);
    });
  });

  describe('getOffhandSkill()', () =>
  {
    it('returns 0 when two-handed and the mainhand does not declare an offhand skill', () =>
    {
      // Arrange- the offhand equip genuinely grants a skill, which the sibling dual-wield case
      // below resolves to 12. Without it, the "no base offhand skill" gate further down returned 0
      // on its own and the entire seal check could be bypassed with nothing noticing.
      const actor = buildActor({
        isEquipTypeSealed: () => true,
        isDualWield: () => false,
        equips: () => [ {}, { jabsSkillId: 12 } ],
      });

      // Act & Assert
      expect(actor.getOffhandSkill()).toEqual(0);
    });

    it('resolves through when two-handed but the mainhand declares an offhand skill', () =>
    {
      const actor = buildActor({
        isEquipTypeSealed: () => true,
        equips: () => [ { jabsOffhandSkillId: 9 } ],
      });

      expect(actor.getOffhandSkill()).toEqual(9);
    });

    it('resolves through when two-handed but also dual-wielding a second weapon', () =>
    {
      const actor = buildActor({
        isEquipTypeSealed: () => true,
        isDualWield: () => true,
        equips: () => [ {}, { jabsSkillId: 12 } ],
      });

      expect(actor.getOffhandSkill()).toEqual(12);
    });

    it('returns 0 when there is no base offhand skill to resolve', () =>
    {
      const actor = buildActor({ equips: () => [ null, null ] });

      expect(actor.getOffhandSkill()).toEqual(0);
    });

    it('applies the transform resolver to the resolved base offhand skill', () =>
    {
      const actor = buildActor({
        equips: () => [ null, { jabsSkillId: 3 } ],
        resolveEquippedSkillId: () => 33,
      });

      expect(actor.getOffhandSkill()).toEqual(33);
    });
  });

  describe('getBaseOffhandSkill()', () =>
  {
    it('prefers a valid player pin over other sources', () =>
    {
      const actor = buildActor({
        getSkillSlotManager: () => buildSkillSlotManager({ getOffhandPinnedSkillId: () => 4 }),
        skills: () => [ { id: 4, offhandEligible: true } ],
      });

      expect(actor.getBaseOffhandSkill()).toEqual(4);
    });

    it('falls back to the mainhand-provided skill when the pin is not assignable', () =>
    {
      const actor = buildActor({
        getSkillSlotManager: () => buildSkillSlotManager({ getOffhandPinnedSkillId: () => 4 }),
        equips: () => [ { jabsOffhandSkillId: 8 }, null ],
      });

      expect(actor.getBaseOffhandSkill()).toEqual(8);
    });

    it('falls back to the offhand-equipped skill when no pin or mainhand skill exists', () =>
    {
      const actor = buildActor({ equips: () => [ null, { jabsSkillId: 6 } ] });

      expect(actor.getBaseOffhandSkill()).toEqual(6);
    });

    it('returns 0 when nothing resolves', () =>
    {
      const actor = buildActor();

      expect(actor.getBaseOffhandSkill()).toEqual(0);
    });
  });

  describe('getMainhandProvidedOffhandSkillId()', () =>
  {
    it('returns 0 when there is no mainhand', () =>
    {
      const actor = buildActor({ equips: () => [ null ] });

      expect(actor.getMainhandProvidedOffhandSkillId()).toEqual(0);
    });

    it('returns the mainhand-provided offhand skill id', () =>
    {
      const actor = buildActor({ equips: () => [ { jabsOffhandSkillId: 11 } ] });

      expect(actor.getMainhandProvidedOffhandSkillId()).toEqual(11);
    });

    it('returns 0 when the mainhand exists but grants no offhand skill', () =>
    {
      const actor = buildActor({ equips: () => [ { jabsOffhandSkillId: null } ] });

      expect(actor.getMainhandProvidedOffhandSkillId()).toEqual(0);
    });
  });

  describe('isMainhandProvidedOffhandSkill()', () =>
  {
    it('returns false for a falsy skill id', () =>
    {
      const actor = buildActor();

      expect(actor.isMainhandProvidedOffhandSkill(0)).toEqual(false);
    });

    it('returns false when the mainhand provides no offhand skill', () =>
    {
      const actor = buildActor({ equips: () => [ null ] });

      expect(actor.isMainhandProvidedOffhandSkill(5)).toEqual(false);
    });

    it('returns true on a direct match against the mainhand-provided skill', () =>
    {
      // Arrange- a live transform sends 5 somewhere else on purpose. With the fixture's identity
      // resolver the transformed-match arm right below answers true for the same input, so the
      // direct-match comparison could be skipped entirely and this still passed.
      const actor = buildActor({
        equips: () => [ { jabsOffhandSkillId: 5 } ],
        resolveEquippedSkillId: (id) => (id === 5 ? 55 : id),
      });

      // Act & Assert
      expect(actor.isMainhandProvidedOffhandSkill(5)).toEqual(true);
    });

    it('returns true on a transformed match against the mainhand-provided skill', () =>
    {
      const actor = buildActor({
        equips: () => [ { jabsOffhandSkillId: 5 } ],
        resolveEquippedSkillId: (id) => (id === 5 ? 55 : id),
      });

      expect(actor.isMainhandProvidedOffhandSkill(55)).toEqual(true);
    });

    it('returns true when the skill id is a combo descendant of the root offhand skill', () =>
    {
      globalThis.$dataSkills[5] = { getComboSkillIdList: () => [ 6, 7 ] };
      const actor = buildActor({ equips: () => [ { jabsOffhandSkillId: 5 } ] });

      expect(actor.isMainhandProvidedOffhandSkill(7)).toEqual(true);
    });

    it('returns false when the root offhand skill has no database entry at all', () =>
    {
      const actor = buildActor({ equips: () => [ { jabsOffhandSkillId: 999 } ] });

      expect(actor.isMainhandProvidedOffhandSkill(7)).toEqual(false);
    });

    it('returns false when the skill id matches none of the sources', () =>
    {
      globalThis.$dataSkills[5] = { getComboSkillIdList: () => [] };
      const actor = buildActor({ equips: () => [ { jabsOffhandSkillId: 5 } ] });

      expect(actor.isMainhandProvidedOffhandSkill(999)).toEqual(false);
    });
  });

  describe('getOffhandEquippedSkillId()', () =>
  {
    it('returns 0 when there is no offhand equipped', () =>
    {
      const actor = buildActor({ equips: () => [ null, null ] });

      expect(actor.getOffhandEquippedSkillId()).toEqual(0);
    });

    it('returns the offhand-granted skill id', () =>
    {
      const actor = buildActor({ equips: () => [ null, { jabsSkillId: 12 } ] });

      expect(actor.getOffhandEquippedSkillId()).toEqual(12);
    });

    it('returns 0 when the offhand exists but grants no skill', () =>
    {
      const actor = buildActor({ equips: () => [ null, { jabsSkillId: null } ] });

      expect(actor.getOffhandEquippedSkillId()).toEqual(0);
    });
  });

  describe('getGuardSkillId()', () =>
  {
    it('returns 0 when there is no offhand equipped', () =>
    {
      const actor = buildActor({ equips: () => [ null, null ] });

      expect(actor.getGuardSkillId()).toEqual(0);
    });

    it('returns 0 when the offhand exists but declares no guard skill', () =>
    {
      const actor = buildActor({ equips: () => [ null, { jabsGuardSkillId: null } ] });

      expect(actor.getGuardSkillId()).toEqual(0);
    });

    it('returns the offhand-declared guard skill id', () =>
    {
      const actor = buildActor({ equips: () => [ null, { jabsGuardSkillId: 221 } ] });

      expect(actor.getGuardSkillId()).toEqual(221);
    });
  });

  describe('getPinnedOffhandSkillId()', () =>
  {
    it('returns 0 when there is no skill slot manager', () =>
    {
      const actor = buildActor({ getSkillSlotManager: () => null });

      expect(actor.getPinnedOffhandSkillId()).toEqual(0);
    });

    it('delegates to the skill slot manager pin accessor', () =>
    {
      const actor = buildActor({
        getSkillSlotManager: () => buildSkillSlotManager({ getOffhandPinnedSkillId: () => 21 }),
      });

      expect(actor.getPinnedOffhandSkillId()).toEqual(21);
    });
  });

  describe('pinOffhandSkill()/clearOffhandPin()', () =>
  {
    it('does nothing without a skill slot manager', () =>
    {
      const actor = buildActor({ getSkillSlotManager: () => null });

      expect(() => actor.pinOffhandSkill(5)).not.toThrow();
    });

    it('writes the pin then refreshes basic attack skills', () =>
    {
      const skillSlotManager = buildSkillSlotManager();
      const actor = buildActor({ getSkillSlotManager: () => skillSlotManager });
      const refreshSpy = vi.spyOn(actor, 'refreshBasicAttackSkills');

      actor.pinOffhandSkill(5);

      expect(skillSlotManager.setOffhandPinnedSkillId).toHaveBeenCalledWith(5);
      expect(refreshSpy).toHaveBeenCalled();
    });

    it('clears the pin by pinning a 0 skill id', () =>
    {
      const skillSlotManager = buildSkillSlotManager();
      const actor = buildActor({ getSkillSlotManager: () => skillSlotManager });

      actor.clearOffhandPin();

      expect(skillSlotManager.setOffhandPinnedSkillId).toHaveBeenCalledWith(0);
    });
  });

  describe('isOffhandSkillAssignable()/buildOffhandAssignableSkillIds()', () =>
  {
    it('returns false for a falsy skill id', () =>
    {
      const actor = buildActor();

      expect(actor.isOffhandSkillAssignable(0)).toEqual(false);
    });

    it('includes explicitly-eligible learned skills, the offhand-equipped skill, and the mainhand-provided skill', () =>
    {
      const actor = buildActor({
        skills: () => [ { id: 1, offhandEligible: true }, { id: 1, offhandEligible: true }, { id: 2 } ],
        equips: () => [ { jabsOffhandSkillId: 3 }, { jabsSkillId: 4 } ],
      });

      const ids = actor.buildOffhandAssignableSkillIds();

      expect(ids).toEqual([ 1, 4, 3 ]);
      expect(actor.isOffhandSkillAssignable(1)).toEqual(true);
      expect(actor.isOffhandSkillAssignable(99)).toEqual(false);
    });

    it('omits both equip-provided sources from the pool when neither hand grants a skill', () =>
    {
      // Arrange- every prior case had both hands granting a real skill id, so the truthiness half
      // of each push gate was only ever satisfied. Bare hands report 0 from both accessors, and a
      // gate that always opened would seed the pinning pool with a pair of unusable zeroes.
      const actor = buildActor({
        skills: () => [ { id: 1, offhandEligible: true } ],
        equips: () => [ null, null ],
      });

      // Act
      const ids = actor.buildOffhandAssignableSkillIds();

      // Assert
      expect(ids).toEqual([ 1 ]);
    });

    it('does not re-add the offhand-equipped skill that is already an eligible learned skill', () =>
    {
      // Arrange- the same id arrives from two sources. The dedupe half of the push gate had never
      // been made to answer "already present", so an always-open gate would list 5 twice.
      const actor = buildActor({
        skills: () => [ { id: 5, offhandEligible: true } ],
        equips: () => [ null, { jabsSkillId: 5 } ],
      });

      // Act
      const ids = actor.buildOffhandAssignableSkillIds();

      // Assert
      expect(ids).toEqual([ 5 ]);
    });

    it('does not re-add the mainhand-provided skill that is already an eligible learned skill', () =>
    {
      // Arrange- the mainhand's push gate carries its own dedupe half, independent of the offhand
      // one above, and it had the same untested arm.
      const actor = buildActor({
        skills: () => [ { id: 7, offhandEligible: true } ],
        equips: () => [ { jabsOffhandSkillId: 7 }, null ],
      });

      // Act
      const ids = actor.buildOffhandAssignableSkillIds();

      // Assert
      expect(ids).toEqual([ 7 ]);
    });
  });

  describe('buildOffhandAssignableSkillPool()', () =>
  {
    it('translates assignable skill ids into skill data, dropping unresolved ids', () =>
    {
      const actor = buildActor({
        skills: () => [ { id: 1, offhandEligible: true } ],
        // id 2 comes in via the equipped offhand item (buildOffhandAssignableSkillIds), but
        // fails to resolve to real skill data here, so it must be dropped from the pool.
        equips: () => [ null, { jabsSkillId: 2 } ],
        skill: (id) => (id === 1 ? { id: 1 } : null),
      });

      expect(actor.buildOffhandAssignableSkillPool()).toEqual([ { id: 1 } ]);
    });
  });

  describe('buildCombatSkillCandidatePool()', () =>
  {
    it('filters learned skills down to those visible in the combat menu', () =>
    {
      const actor = buildActor({
        skills: () => [ { id: 1, combatEligible: true }, { id: 2, combatEligible: false } ],
      });

      expect(actor.buildCombatSkillCandidatePool()).toEqual([ { id: 1, combatEligible: true } ]);
    });
  });

  describe('buildDodgeSkillCandidatePool()', () =>
  {
    it('filters learned skills down to those visible in the dodge menu', () =>
    {
      const actor = buildActor({
        skills: () => [ { id: 1, dodgeEligible: false }, { id: 2, dodgeEligible: true } ],
      });

      expect(actor.buildDodgeSkillCandidatePool()).toEqual([ { id: 2, dodgeEligible: true } ]);
    });
  });

  describe('getSkillTransformSources()', () =>
  {
    it('orders sources as states (by descending priority) > equips > class > actor db row', () =>
    {
      const stateLow = { priority: 1, tag: 'state-low' };
      const stateHigh = { priority: 5, tag: 'state-high' };
      const equip = { tag: 'equip' };
      const clazz = { tag: 'class' };
      const actorDb = { tag: 'actor-db' };
      const actor = buildActor({
        states: () => [ stateLow, stateHigh ],
        equippedEquips: () => [ equip ],
        currentClass: () => clazz,
        databaseData: () => actorDb,
      });

      expect(actor.getSkillTransformSources()).toEqual([ stateHigh, stateLow, equip, clazz, actorDb ]);
    });
  });

  describe('getTransformedOffhandSkillId()', () =>
  {
    it('delegates to resolveEquippedSkillId', () =>
    {
      const actor = buildActor({ resolveEquippedSkillId: (id) => id * 2 });

      expect(actor.getTransformedOffhandSkillId(5)).toEqual(10);
    });
  });

  describe('removeInvalidSkills()', () =>
  {
    it('autoclears slots for skills the actor no longer knows', () =>
    {
      const knownSlot = { id: 1, autoclear: vi.fn() };
      const unknownSlot = { id: 2, autoclear: vi.fn() };
      const actor = buildActor({
        getSkillSlotManager: () => buildSkillSlotManager({ getAllSlots: () => [ knownSlot, unknownSlot ] }),
        hasSkill: (id) => id === 1,
      });

      actor.removeInvalidSkills();

      expect(knownSlot.autoclear).not.toHaveBeenCalled();
      expect(unknownSlot.autoclear).toHaveBeenCalled();
    });

    it('clears an unassignable offhand pin', () =>
    {
      const skillSlotManager = buildSkillSlotManager({
        getAllSlots: () => [],
        getOffhandPinnedSkillId: () => 7,
      });
      const actor = buildActor({ getSkillSlotManager: () => skillSlotManager });

      actor.removeInvalidSkills();

      expect(skillSlotManager.clearOffhandPin).toHaveBeenCalled();
    });

    it('leaves a still-assignable offhand pin alone', () =>
    {
      const skillSlotManager = buildSkillSlotManager({
        getAllSlots: () => [],
        getOffhandPinnedSkillId: () => 7,
      });
      const actor = buildActor({
        getSkillSlotManager: () => skillSlotManager,
        skills: () => [ { id: 7, offhandEligible: true } ],
      });

      actor.removeInvalidSkills();

      expect(skillSlotManager.clearOffhandPin).not.toHaveBeenCalled();
    });
  });

  describe('lastOffhandItemId()/setLastOffhandItemId()/hasLastOffhandSnapshot()', () =>
  {
    it('defaults to 0 with no prior snapshot', () =>
    {
      const actor = buildActor();

      expect(actor.lastOffhandItemId()).toEqual(0);
      expect(actor.hasLastOffhandSnapshot()).toEqual(false);
    });

    it('records the offhand item id, or 0 when unequipped', () =>
    {
      const actor = buildActor();
      actor.setLastOffhandItemId({ id: 9 });

      expect(actor.lastOffhandItemId()).toEqual(9);
      expect(actor.hasLastOffhandSnapshot()).toEqual(true);

      actor.setLastOffhandItemId(null);
      expect(actor.lastOffhandItemId()).toEqual(0);
    });
  });

  describe('reconcileOffhandPinAgainstEquip()', () =>
  {
    it('seeds the cache without clearing anything on first observation', () =>
    {
      const skillSlotManager = buildSkillSlotManager();
      const actor = buildActor({
        getSkillSlotManager: () => skillSlotManager,
        equips: () => [ null, { id: 3 } ],
      });

      actor.reconcileOffhandPinAgainstEquip();

      expect(actor.lastOffhandItemId()).toEqual(3);
      expect(skillSlotManager.clearOffhandPin).not.toHaveBeenCalled();
    });

    it('does nothing further when the offhand item has not changed', () =>
    {
      const skillSlotManager = buildSkillSlotManager();
      const actor = buildActor({
        getSkillSlotManager: () => skillSlotManager,
        equips: () => [ null, { id: 3 } ],
      });
      actor.setLastOffhandItemId({ id: 3 });

      actor.reconcileOffhandPinAgainstEquip();

      expect(skillSlotManager.clearOffhandPin).not.toHaveBeenCalled();
    });

    it('clears the pin when the offhand item has changed since the last snapshot', () =>
    {
      const skillSlotManager = buildSkillSlotManager();
      const actor = buildActor({
        getSkillSlotManager: () => skillSlotManager,
        equips: () => [ null, { id: 5 } ],
      });
      actor.setLastOffhandItemId({ id: 3 });

      actor.reconcileOffhandPinAgainstEquip();

      expect(actor.lastOffhandItemId()).toEqual(5);
      expect(skillSlotManager.clearOffhandPin).toHaveBeenCalled();
    });

    it('does not throw when the offhand item changed but there is no skill slot manager', () =>
    {
      const actor = buildActor({
        getSkillSlotManager: () => null,
        equips: () => [ null, { id: 5 } ],
      });
      actor.setLastOffhandItemId({ id: 3 });

      expect(() => actor.reconcileOffhandPinAgainstEquip()).not.toThrow();
      expect(actor.lastOffhandItemId()).toEqual(5);
    });
  });
  //endregion JABS basic attack skills

  //region JABS battler properties
  describe('getUuid()', () =>
  {
    it('returns a stable uuid derived from the actor id', () =>
    {
      const actor = buildActor({ actor: () => ({ id: 1 }), actorId: () => 4 });

      expect(actor.getUuid()).toEqual('actor-4');
    });

    it('warns and returns an empty string when there is no underlying actor', () =>
    {
      vi.spyOn(console, 'warn').mockImplementation(() => {});
      const actor = buildActor({ actor: () => null });

      expect(actor.getUuid()).toEqual(String.empty);

      console.warn.mockRestore();
    });
  });

  describe('prepareTime()', () =>
  {
    it('is always 1', () =>
    {
      const actor = buildActor();

      expect(actor.prepareTime()).toEqual(1);
    });
  });

  describe('getJabsParameter()', () =>
  {
    it('prefers the class-derived parameter when present', () =>
    {
      globalThis.RPGManager.getNumberFromNoteByRegex.mockReturnValueOnce(10);
      const actor = buildActor();

      expect(actor.getJabsParameter(/x/, 0)).toEqual(10);
    });

    it('falls back to the actor-derived parameter when the class has none', () =>
    {
      globalThis.RPGManager.getNumberFromNoteByRegex.mockReturnValueOnce(null).mockReturnValueOnce(20);
      const actor = buildActor();

      expect(actor.getJabsParameter(/x/, 0)).toEqual(20);
    });

    it('falls back to the given default when neither class nor actor define it', () =>
    {
      const actor = buildActor();

      expect(actor.getJabsParameter(/x/, 99)).toEqual(99);
    });
  });

  describe('sightRange()/alertedSightBoost()/pursuitRange()/alertedPursuitBoost()/alertDuration()', () =>
  {
    it('falls back to the base Game_Battler value when no override note exists', () =>
    {
      const actor = buildActor();

      expect(actor.sightRange()).toEqual(3);
      expect(actor.alertedSightBoost()).toEqual(2);
      expect(actor.pursuitRange()).toEqual(4);
      expect(actor.alertedPursuitBoost()).toEqual(1);
      expect(actor.alertDuration()).toEqual(300);
    });

    it('uses the jabs parameter override when present', () =>
    {
      globalThis.RPGManager.getNumberFromNoteByRegex.mockReturnValue(50);
      const actor = buildActor();

      expect(actor.sightRange()).toEqual(50);
    });
  });

  describe('static behavior flags', () =>
  {
    it('ai() is always null', () =>
    {
      expect(buildActor().ai()).toBeNull();
    });

    it('canIdle() is always false', () =>
    {
      expect(buildActor().canIdle()).toEqual(false);
    });

    it('showStates() is always true', () =>
    {
      expect(buildActor().showStates()).toEqual(true);
    });

    it('showBattlerName() is always false', () =>
    {
      expect(buildActor().showBattlerName()).toEqual(false);
    });

    it('isInvincible() is always false', () =>
    {
      expect(buildActor().isInvincible()).toEqual(false);
    });

    it('isInanimate() is always false', () =>
    {
      expect(buildActor().isInanimate()).toEqual(false);
    });

    it('teamId() delegates to JABS_Battler.allyTeamId()', () =>
    {
      expect(buildActor().teamId()).toEqual(0);
    });
  });

  describe('showHpBar()', () =>
  {
    it('hides the hp bar for the party leader', () =>
    {
      const actor = buildActor({ isLeader: () => true });

      expect(actor.showHpBar()).toEqual(false);
    });

    it('shows the hp bar for a non-leader', () =>
    {
      const actor = buildActor({ isLeader: () => false });

      expect(actor.showHpBar()).toEqual(true);
    });
  });

  describe('switchLocked()', () =>
  {
    it('returns false when no note carries the config tag', () =>
    {
      const actor = buildActor({ getAllNotes: () => [ {} ] });

      expect(actor.switchLocked()).toEqual(false);
    });

    it('returns true when some note carries the config tag', () =>
    {
      globalThis.RPGManager.checkForBooleanFromNoteByRegex.mockReturnValue(true);
      const actor = buildActor({ getAllNotes: () => [ {} ] });

      expect(actor.switchLocked()).toEqual(true);
    });
  });
  //endregion JABS battler properties

  //region ondeath management
  describe('needsDeathEffect()/toggleDeathEffect()', () =>
  {
    it('toggles the internal death effect flag', () =>
    {
      const actor = buildActor();

      expect(actor.needsDeathEffect()).toEqual(false);

      actor.toggleDeathEffect();
      expect(actor.needsDeathEffect()).toEqual(true);

      actor.toggleDeathEffect();
      expect(actor.needsDeathEffect()).toEqual(false);
    });
  });

  describe('onDeath()', () =>
  {
    it('toggles the death effect flag on', () =>
    {
      const actor = buildActor();

      actor.onDeath();

      expect(actor.needsDeathEffect()).toEqual(true);
    });
  });

  describe('onRevive()', () =>
  {
    it('stops dying and clears the death context', () =>
    {
      const actor = buildActor({ clearDeathContext: vi.fn() });

      actor.onRevive();

      expect(actor.clearDeathContext).toHaveBeenCalled();
    });
  });

  describe('stopDying()', () =>
  {
    it('does nothing when no jabs battler is found for this uuid', () =>
    {
      getBattlerByUuidMock.mockReturnValue(undefined);
      const actor = buildActor();

      expect(() => actor.stopDying()).not.toThrow();
    });

    it('turns off the dying flag on the resolved jabs battler', () =>
    {
      const jabsBattler = { setDying: vi.fn() };
      getBattlerByUuidMock.mockReturnValue(jabsBattler);
      const actor = buildActor();

      actor.stopDying();

      expect(jabsBattler.setDying).toHaveBeenCalledWith(false);
    });
  });
  //endregion ondeath management

  //region JABS skill slot access
  describe('skill slot accessors', () =>
  {
    it('getAllPrimarySkills() delegates to the slot manager', () =>
    {
      const actor = buildActor({
        getSkillSlotManager: () => buildSkillSlotManager({ getAllPrimarySlots: () => [ 'primary' ] }),
      });

      expect(actor.getAllPrimarySkills()).toEqual([ 'primary' ]);
    });

    it('getAllCombatSkillSlots() delegates to the slot manager', () =>
    {
      const actor = buildActor({
        getSkillSlotManager: () => buildSkillSlotManager({ getAllSecondarySlots: () => [ 'secondary' ] }),
      });

      expect(actor.getAllCombatSkillSlots()).toEqual([ 'secondary' ]);
    });

    it('getToolSkillSlot() delegates to the slot manager', () =>
    {
      const actor = buildActor({ getSkillSlotManager: () => buildSkillSlotManager({ getToolSlot: () => 'tool' }) });

      expect(actor.getToolSkillSlot()).toEqual('tool');
    });

    it('getDodgeSkillSlot() delegates to the slot manager', () =>
    {
      const actor = buildActor({ getSkillSlotManager: () => buildSkillSlotManager({ getDodgeSlot: () => 'dodge' }) });

      expect(actor.getDodgeSkillSlot()).toEqual('dodge');
    });

    it('getValidEquippedSkillSlots() returns an empty array without a slot manager', () =>
    {
      const actor = buildActor({ getSkillSlotManager: () => null });

      expect(actor.getValidEquippedSkillSlots()).toEqual([]);
    });

    it('getValidEquippedSkillSlots() delegates to the slot manager when present', () =>
    {
      const actor = buildActor({
        getSkillSlotManager: () => buildSkillSlotManager({ getEquippedSlots: () => [ 'equipped' ] }),
      });

      expect(actor.getValidEquippedSkillSlots()).toEqual([ 'equipped' ]);
    });

    it('getUpgradableSkillSlots() filters to unlocked, autoclearable slots', () =>
    {
      const upgradable = { canBeAutocleared: () => true, isLocked: () => false };
      const locked = { canBeAutocleared: () => true, isLocked: () => true };
      const permanent = { canBeAutocleared: () => false, isLocked: () => false };
      const actor = buildActor({
        getSkillSlotManager: () => buildSkillSlotManager({
          getEquippedSlots: () => [ upgradable, locked, permanent ],
        }),
      });

      expect(actor.getUpgradableSkillSlots()).toEqual([ upgradable ]);
    });
  });
  //endregion JABS skill slot access

  //region leveling
  describe('shouldDisplayLevelUp()', () =>
  {
    it('is always false', () =>
    {
      expect(buildActor().shouldDisplayLevelUp()).toEqual(false);
    });
  });

  describe('onLevelUp()/jabsLevelUp()', () =>
  {
    it('requests a sprite refresh and notifies the engine of the levelup', () =>
    {
      const actor = buildActor();

      actor.onLevelUp();

      expect(globalThis.$jabsEngine.requestSpriteRefresh).toEqual(true);
      expect(globalThis.$jabsEngine.battlerLevelup).toHaveBeenCalledWith(actor.getUuid());
    });
  });

  describe('onLevelDown()/jabsLevelDown()', () =>
  {
    it('does nothing for a non-leader', () =>
    {
      const actor = buildActor({ isLeader: () => false });

      actor.onLevelDown();

      expect(globalThis.$jabsEngine.requestSpriteRefresh).toEqual(false);
    });

    it('requests a sprite refresh for the party leader', () =>
    {
      const actor = buildActor({ isLeader: () => true });

      actor.onLevelDown();

      expect(globalThis.$jabsEngine.requestSpriteRefresh).toEqual(true);
    });
  });
  //endregion leveling

  //region learning
  describe('onLearnNewSkill()/jabsLearnNewSkill()', () =>
  {
    it('does nothing for a falsy skill id', () =>
    {
      const actor = buildActor();

      actor.onLearnNewSkill(0);

      expect(globalThis.$jabsEngine.battlerSkillLearn).not.toHaveBeenCalled();
    });

    it('shows a popup and processes the learned skill for a valid skill id', () =>
    {
      const learnedSkill = { id: 5 };
      const actor = buildActor({ skill: () => learnedSkill });
      const processSpy = vi.spyOn(actor, 'jabsProcessLearnedSkill');

      actor.onLearnNewSkill(5);

      expect(globalThis.$jabsEngine.battlerSkillLearn).toHaveBeenCalledWith(learnedSkill, actor.getUuid());
      expect(processSpy).toHaveBeenCalledWith(5);
    });
  });

  describe('jabsProcessLearnedSkill()', () =>
  {
    it('upgrades, then auto-assigns, then flags all slots for refresh', () =>
    {
      const skillSlotManager = buildSkillSlotManager();
      const actor = buildActor({ getSkillSlotManager: () => skillSlotManager });
      const upgradeSpy = vi.spyOn(actor, 'autoUpgradeSkillIfRequired').mockImplementation(() => {});
      const assignSpy = vi.spyOn(actor, 'autoAssignSkillIfRequired').mockImplementation(() => {});

      actor.jabsProcessLearnedSkill(5);

      expect(upgradeSpy).toHaveBeenCalledWith(5);
      expect(assignSpy).toHaveBeenCalledWith(5);
      expect(skillSlotManager.flagAllSkillSlotsForRefresh).toHaveBeenCalled();
    });

    it('does not throw without a skill slot manager', () =>
    {
      const actor = buildActor({ getSkillSlotManager: () => null });
      vi.spyOn(actor, 'autoUpgradeSkillIfRequired').mockImplementation(() => {});
      vi.spyOn(actor, 'autoAssignSkillIfRequired').mockImplementation(() => {});

      expect(() => actor.jabsProcessLearnedSkill(5)).not.toThrow();
    });
  });

  describe('canUpgradeSkill()', () =>
  {
    it('returns false when auto-upgrade is disallowed', () =>
    {
      // Arrange- the slot-targeting gate at the end of the chain is armed to pass (the new skill
      // names slot 1 as its upgrade target). Left at the fixture default of null it answered false
      // by itself, so this case passed with the config gate deleted.
      globalThis.RPGManager.getNumberFromNoteByRegex.mockReturnValue(1);
      const actor = buildActor();

      // Act & Assert
      expect(actor.canUpgradeSkill({ id: 1 }, 2)).toEqual(false);
    });

    it('returns false when the current skill blocks auto-upgrade', () =>
    {
      // Arrange- same treatment: with the slot-targeting gate armed, only the per-skill block tag
      // can still be what refuses this upgrade.
      globalThis.RPGManager.checkForBooleanFromNoteByRegex.mockReturnValueOnce(true).mockReturnValueOnce(true);
      globalThis.RPGManager.getNumberFromNoteByRegex.mockReturnValue(1);
      const actor = buildActor();

      // Act & Assert
      expect(actor.canUpgradeSkill({ id: 1 }, 2)).toEqual(false);
    });

    it('returns false when the new skill does not target this slot for upgrading', () =>
    {
      globalThis.RPGManager.checkForBooleanFromNoteByRegex.mockReturnValueOnce(true).mockReturnValueOnce(false);
      globalThis.RPGManager.getNumberFromNoteByRegex.mockReturnValue(99);
      const actor = buildActor();

      expect(actor.canUpgradeSkill({ id: 1 }, 2)).toEqual(false);
    });

    it('returns true when every gate passes', () =>
    {
      globalThis.RPGManager.checkForBooleanFromNoteByRegex.mockReturnValueOnce(true).mockReturnValueOnce(false);
      globalThis.RPGManager.getNumberFromNoteByRegex.mockReturnValue(1);
      const actor = buildActor();

      expect(actor.canUpgradeSkill({ id: 1 }, 2)).toEqual(true);
    });
  });

  describe('autoUpgradeSkillIfRequired()', () =>
  {
    it('does nothing when there are no upgradable slots', () =>
    {
      const actor = buildActor({ getSkillSlotManager: () => buildSkillSlotManager({ getEquippedSlots: () => [] }) });

      expect(() => actor.autoUpgradeSkillIfRequired(5)).not.toThrow();
      expect(actor.setEquippedSkill).not.toHaveBeenCalled();
    });

    it('skips a slot that is not eligible to upgrade', () =>
    {
      const slot = { key: 'combat-1', canBeAutocleared: () => true, isLocked: () => false };
      const actor = buildActor({
        getSkillSlotManager: () => buildSkillSlotManager({ getEquippedSlots: () => [ slot ] }),
      });
      vi.spyOn(actor, 'canUpgradeSkill').mockReturnValue(false);

      actor.autoUpgradeSkillIfRequired(5);

      expect(actor.setEquippedSkill).not.toHaveBeenCalled();
    });

    it('upgrades every eligible slot', () =>
    {
      const slot = { key: 'combat-1', canBeAutocleared: () => true, isLocked: () => false };
      const actor = buildActor({
        getSkillSlotManager: () => buildSkillSlotManager({ getEquippedSlots: () => [ slot ] }),
      });
      vi.spyOn(actor, 'canUpgradeSkill').mockReturnValue(true);

      actor.autoUpgradeSkillIfRequired(5);

      expect(actor.setEquippedSkill).toHaveBeenCalledWith('combat-1', 5);
    });
  });

  describe('autoAssignSkillIfRequired()/canAutoAssignSkillOnLevelup()', () =>
  {
    it('does not assign when auto-assign is disallowed', () =>
    {
      const actor = buildActor();

      actor.autoAssignSkillIfRequired(5);

      expect(actor.setEquippedSkill).not.toHaveBeenCalled();
    });

    it('does not assign when the skill is already equipped', () =>
    {
      globalThis.RPGManager.checkForBooleanFromNoteByRegex.mockReturnValue(true);
      const actor = buildActor({
        getSkillSlotManager: () => buildSkillSlotManager({ getAllSecondarySlots: () => [ { id: 5 } ] }),
      });

      actor.autoAssignSkillIfRequired(5);

      expect(actor.setEquippedSkill).not.toHaveBeenCalled();
    });

    it('does not assign when there are no empty secondary slots', () =>
    {
      globalThis.RPGManager.checkForBooleanFromNoteByRegex.mockReturnValue(true);
      const actor = buildActor({ getEmptySecondarySkills: () => [] });

      actor.autoAssignSkillIfRequired(5);

      expect(actor.setEquippedSkill).not.toHaveBeenCalled();
    });

    /**
     * Arranges an actor for whom every auto-assign gate except one is deliberately open, so a
     * refusal can only be attributed to the gate a caller chooses to close.<br/>
     * The three tag-driven gates share one mocked predicate, hence routing by regex identity: the
     * config gate answers true and the block/upgrade-only gates answer false.
     * @param {object} [overrides] Actor stub overrides for the gate under test.
     * @returns {object} A stubbed Game_Actor instance.
     */
    function buildAutoAssignReadyActor(overrides = {})
    {
      globalThis.RPGManager.checkForBooleanFromNoteByRegex
        .mockImplementation((_object, regex) => regex === globalThis.J.ABS.RegExp.ConfigAutoAssignSkills);

      return buildActor({
        getEmptySecondarySkills: () => [ { key: 'combat-2' } ],
        skill: () => ({ stypeId: 1 }),
        ...overrides,
      });
    }

    it('permits auto-assign when every gate is open', () =>
    {
      // Arrange- the unflipped baseline the three refusal cases below are measured against.
      const actor = buildAutoAssignReadyActor();

      // Act & Assert
      expect(actor.canAutoAssignSkillOnLevelup(5)).toEqual(true);
    });

    it('refuses auto-assign purely on the config tag being absent', () =>
    {
      // Arrange- an empty slot exists and the skill is clean, so the downstream gates that used to
      // do this refusal's work on their own are all open. Only the config tag is closed.
      globalThis.RPGManager.checkForBooleanFromNoteByRegex.mockReset().mockReturnValue(false);
      const actor = buildActor({
        getEmptySecondarySkills: () => [ { key: 'combat-2' } ],
        skill: () => ({ stypeId: 1 }),
      });

      // Act & Assert
      expect(actor.canAutoAssignSkillOnLevelup(5)).toEqual(false);
    });

    it('refuses auto-assign purely because this skill already occupies a combat slot', () =>
    {
      // Arrange- slot 4 is a near-miss sibling that must survive the scan; with only the matching
      // slot present, "holds this skill" and "holds anything" would be the same program.
      const actor = buildAutoAssignReadyActor({
        getSkillSlotManager: () => buildSkillSlotManager({
          getAllSecondarySlots: () => [ { id: 4 }, { id: 5 } ],
        }),
      });

      // Act & Assert
      expect(actor.canAutoAssignSkillOnLevelup(5)).toEqual(false);
    });

    it('permits auto-assign when the combat slots hold other skills but not this one', () =>
    {
      // Arrange- the mirror of the case above: occupied slots that do not match must not be read
      // as "already equipped", which is what an always-matching comparison would do.
      const actor = buildAutoAssignReadyActor({
        getSkillSlotManager: () => buildSkillSlotManager({
          getAllSecondarySlots: () => [ { id: 4 }, { id: 6 } ],
        }),
      });

      // Act & Assert
      expect(actor.canAutoAssignSkillOnLevelup(5)).toEqual(true);
    });

    it('refuses auto-assign purely because no secondary slot is empty', () =>
    {
      // Arrange- the existing "no empty slots" case above left the skill data at the fixture's
      // null, which tripped the block-tag gate instead; real skill data removes that backstop.
      const actor = buildAutoAssignReadyActor({ getEmptySecondarySkills: () => [] });

      // Act & Assert
      expect(actor.canAutoAssignSkillOnLevelup(5)).toEqual(false);
    });

    it('assigns into the first empty secondary slot when every gate passes', () =>
    {
      // only the "auto-assign enabled" config gate should pass- the block/upgrade-only gates
      // must stay false or the method exits early before reaching the assignment.
      globalThis.RPGManager.checkForBooleanFromNoteByRegex
        .mockImplementation((_object, regex) => regex === globalThis.J.ABS.RegExp.ConfigAutoAssignSkills);
      const emptySlot = { key: 'combat-2' };
      const actor = buildActor({
        getEmptySecondarySkills: () => [ emptySlot ],
        skill: () => ({ stypeId: 1 }),
      });

      actor.autoAssignSkillIfRequired(5);

      expect(actor.setEquippedSkill).toHaveBeenCalledWith('combat-2', 5);
    });

    it('does not assign a skill explicitly blocked from auto-assignment', () =>
    {
      globalThis.RPGManager.checkForBooleanFromNoteByRegex
        .mockImplementation((_object, regex) => regex === globalThis.J.ABS.RegExp.ConfigAutoAssignSkills
          || regex === globalThis.J.ABS.RegExp.NoAutoAssign);
      const actor = buildActor({
        getEmptySecondarySkills: () => [ { key: 'combat-2' } ],
        skill: () => ({ stypeId: 1 }),
      });

      actor.autoAssignSkillIfRequired(5);

      expect(actor.setEquippedSkill).not.toHaveBeenCalled();
    });

    it('does not assign an upgrade-only skill to a blank slot', () =>
    {
      globalThis.RPGManager.checkForBooleanFromNoteByRegex
        .mockImplementation((_object, regex) => regex === globalThis.J.ABS.RegExp.ConfigAutoAssignSkills
          || regex === globalThis.J.ABS.RegExp.UpgradeOnlySkill);
      const actor = buildActor({
        getEmptySecondarySkills: () => [ { key: 'combat-2' } ],
        skill: () => ({ stypeId: 1 }),
      });

      actor.autoAssignSkillIfRequired(5);

      expect(actor.setEquippedSkill).not.toHaveBeenCalled();
    });

    it('does not assign a skill whose type is blacklisted', () =>
    {
      globalThis.RPGManager.checkForBooleanFromNoteByRegex
        .mockImplementation((_object, regex) => regex === globalThis.J.ABS.RegExp.ConfigAutoAssignSkills);
      globalThis.RPGManager.getNumbersFromNoteByRegex.mockReturnValue([ 1 ]);
      const actor = buildActor({
        getEmptySecondarySkills: () => [ { key: 'combat-2' } ],
        getAllNotes: () => [ {} ],
        skill: () => ({ stypeId: 1 }),
      });

      actor.autoAssignSkillIfRequired(5);

      expect(actor.setEquippedSkill).not.toHaveBeenCalled();
    });
  });

  describe('refreshAutoEquippedSkills()', () =>
  {
    it('processes every known skill for auto-assignment/upgrade', () =>
    {
      const actor = buildActor({ skills: () => [ { id: 1 }, { id: 2 } ] });
      const processSpy = vi.spyOn(actor, 'jabsProcessLearnedSkill').mockImplementation(() => {});

      actor.refreshAutoEquippedSkills();

      expect(processSpy).toHaveBeenCalledWith(1);
      expect(processSpy).toHaveBeenCalledWith(2);
    });
  });
  //endregion learning

  //region JABS bonus hits
  describe('getBonusHitsSources()', () =>
  {
    it('collects allStates, actor data, equips, and current class', () =>
    {
      const allStates = [ 'state' ];
      const actorData = { tag: 'actor' };
      const equips = [ 'weapon' ];
      const clazz = { tag: 'class' };
      const actor = buildActor({
        allStates: () => allStates,
        databaseData: () => actorData,
        equips: () => equips,
        currentClass: () => clazz,
      });

      expect(actor.getBonusHitsSources()).toEqual([ allStates, [ actorData ], equips, [ clazz ] ]);
    });
  });
  //endregion JABS bonus hits

  //region map effects
  describe('performMapDamage()/performJabsFloorDamage()', () =>
  {
    it('delegates to the JABS floor damage path when JABS is enabled', () =>
    {
      globalThis.$jabsEngine.absEnabled = true;
      const actor = buildActor();
      const floorDamageSpy = vi.spyOn(actor, 'performJabsFloorDamage');

      actor.performMapDamage();

      expect(floorDamageSpy).toHaveBeenCalled();
    });

    it('falls through to the original logic when JABS is disabled', () =>
    {
      globalThis.$jabsEngine.absEnabled = false;
      const actor = buildActor();
      const floorDamageSpy = vi.spyOn(actor, 'performJabsFloorDamage');
      const originalSpy = vi.spyOn(globalThis.J.ABS.Aliased.Game_Actor.get('performMapDamage'), 'call');

      actor.performMapDamage();

      expect(originalSpy).toHaveBeenCalled();
      expect(floorDamageSpy).not.toHaveBeenCalled();
    });

    it('starts a screen flash for JABS floor damage', () =>
    {
      const actor = buildActor();

      actor.performJabsFloorDamage();

      expect(globalThis.$gameScreen.startFlashForDamage).toHaveBeenCalled();
    });
  });

  describe('turnEndOnMap()', () =>
  {
    it('does nothing while JABS is enabled', () =>
    {
      globalThis.$jabsEngine.absEnabled = true;
      const actor = buildActor();

      expect(() => actor.turnEndOnMap()).not.toThrow();
    });

    it('falls through to the original logic when JABS is disabled', () =>
    {
      globalThis.$jabsEngine.absEnabled = false;
      const actor = buildActor();

      expect(() => actor.turnEndOnMap()).not.toThrow();
    });
  });
  //endregion map effects
});
//endregion plugins/abs/core/objects/game-actor.test.js

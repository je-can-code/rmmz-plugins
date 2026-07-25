//region plugins/sks/ext/abs/_component/end-to-end-pipeline.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import RPG_Skill from '../../../../../../src/plugins/_base/database/implementations/RPG_Skill.js';

/**
 * Builds a real {@link RPG_Skill}-shaped object for note-parsing tests without going through
 * $dataSkills/DataManager loading. Mirrors sks's own `skillData()` fixture helper.
 * @param {object} props Overrides merged onto the RPG_Skill prototype.
 * @returns {RPG_Skill}
 */
function skillData(props)
{
  return Object.assign(Object.create(RPG_Skill.prototype), props);
}

/**
 * This test spans three plugin families- sks/core, sks/ext/abs, and passive/ext/sks (which itself
 * builds on passive/core)- to prove the full pipeline actually wires together on one shared actor,
 * not just that each piece is individually correct in isolation. It direct-imports the REAL source
 * for every piece involved (no mocking of the actual gating logic under test), and only mocks the
 * JABS internals abs/core's Game_Actor.js needs to load (JABS_Battler, JABS_SkillSlot, JABS_AiManager)
 * plus a hand-built JABS_SkillSlotManager double, following the same recipe already proven in
 * test/plugins/abs/core/objects/game-actor.test.js.
 */
describe('SKS -> JABS quick menus -> passive states, end-to-end pipeline (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    // placeholder engine classes, wired with the same prototype chain as the real engine.
    function Game_BattlerBase()
    {
    }
    Game_BattlerBase.prototype.initMembers = function() {};
    globalThis.Game_BattlerBase = Game_BattlerBase;

    function Game_Battler()
    {
    }
    Object.setPrototypeOf(Game_Battler.prototype, Game_BattlerBase.prototype);
    Game_Battler.prototype.initJabsMembers = function() {};
    Game_Battler.prototype.initMembers = function()
    {
      Game_BattlerBase.prototype.initMembers.call(this);
    };
    globalThis.Game_Battler = Game_Battler;

    function Game_Actor()
    {
    }
    Object.setPrototypeOf(Game_Actor.prototype, Game_Battler.prototype);
    globalThis.Game_Actor = Game_Actor;

    globalThis.$dataSkills = [];
    globalThis.$gameVariables = { _data: [] };
    globalThis.RPG_Skill = RPG_Skill;

    // sibling model/manager dependencies abs/core/objects/Game_Actor.js needs to load- mocked
    // per the same unit-tier convention already established in abs/core's own Game_Actor tests.
    vi.doMock('../../../../../../src/plugins/abs/core/models/JABS_SkillSlot.js', () => ({ default: class {} }));
    vi.doMock('../../../../../../src/plugins/abs/core/models/JABS_Battler.js', () => ({
      default: class
      {
        static allyTeamId()
        {
          return 0;
        }

        static isSkillVisibleInCombatMenu(skill)
        {
          return skill.stypeId === 1;
        }

        static isSkillVisibleInDodgeMenu()
        {
          return false;
        }

        static isSkillVisibleInOffhandMenu()
        {
          return false;
        }
      },
    }));
    vi.doMock('../../../../../../src/plugins/abs/core/managers/JABS_AiManager.js', () => ({
      default: class
      {
        static getBattlerByUuid()
        {
          return undefined;
        }
      },
    }));

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
    // the real RPGManager, not a fake- sks/core's notetag parsing (e.g. the <unslotted> and
    // <baseSlots:[...]> tags exercised below) needs genuine regex/formula evaluation, not a stub.
    ({ default: globalThis.RPGManager } = await import('../../../../../../src/plugins/_base/managers/RPGManager.js'));
    globalThis.JABS_Button = { Mainhand: 'mainhand', Offhand: 'offhand' };

    await import('../../../../../../src/plugins/abs/core/objects/Game_Actor.js');

    // sks/core: real notetag-driven slot/point budget and equip primitives.
    globalThis.PluginMetadata = (await import('../../../../../../src/plugins/_base/models/PluginMetadata.js')).default;
    globalThis.SerializableRegistry = { register() {} };
    globalThis.PluginManager = {
      parameters(name)
      {
        if (name === 'J-SkillSlots')
        {
          return {
            'menu-switch': '101',
            'equippable-skill-type-ids': '[]',
            'default-max-slots': '4',
            'default-max-slot-points': '4',
            'enable-exclusive-mode': 'false',
            'slots-only': 'false',
          };
        }

        return {};
      },
      registerCommand() {},
    };
    globalThis.__PLUGIN_NAME__ = 'J-Base';
    globalThis.__PLUGIN_VERSION__ = '3.2.0';
    await import('../../../../../../src/plugins/_base/_metadata/initialization.js');

    globalThis.__PLUGIN_NAME__ = 'J-SkillSlots';
    globalThis.__PLUGIN_VERSION__ = '1.0.0';
    await import('../../../../../../src/plugins/sks/core/_metadata/initialization.js');
    await import('../../../../../../src/plugins/sks/core/database/RPG_Skill.js');
    await import('../../../../../../src/plugins/sks/core/objects/Game_Actor.js');

    // sks/ext/abs: real quick-menu candidate filter + unequip-cleanup hook.
    globalThis.__PLUGIN_NAME__ = 'J-SkillSlots-ABS';
    globalThis.__PLUGIN_VERSION__ = '1.0.0';
    await import('../../../../../../src/plugins/sks/ext/abs/_metadata/initialization.js');
    await import('../../../../../../src/plugins/sks/ext/abs/objects/Game_Actor.js');

    // passive/core: real getPassiveStateSourcedSkills seam (default returns this.skills()).
    globalThis.__PLUGIN_NAME__ = 'J-Passive';
    globalThis.__PLUGIN_VERSION__ = '1.0.0';
    await import('../../../../../../src/plugins/passive/core/_metadata/initialization.js');
    await import('../../../../../../src/plugins/passive/core/objects/Game_Battler.js');

    // passive/ext/sks: real seam override, gating by SKS equip state / <unslotted>.
    globalThis.__PLUGIN_NAME__ = 'J-Passive-SKS';
    globalThis.__PLUGIN_VERSION__ = '1.0.0';
    await import('../../../../../../src/plugins/passive/ext/sks/_metadata/initialization.js');
    await import('../../../../../../src/plugins/passive/ext/sks/objects/Game_Actor.js');
  });

  beforeEach(() =>
  {
    globalThis.RPGManager.clearCache();
  });

  /**
   * Builds a real Game_Actor-prototype-backed instance with just enough stubbed RMMZ surface for
   * abs/core's Game_Actor.js patches to function, plus a hand-built JABS_SkillSlotManager double
   * so the unequip-cleanup hook has something real to observe.
   * @param {number[]} skillIds The ids of the skills this actor knows.
   * @returns {{actor: object, jabsSlots: Map<string, number>}}
   */
  function buildActor(skillIds)
  {
    const actor = Object.create(globalThis.Game_Actor.prototype);
    actor.initJabsMembers();
    actor.initMembers();

    const jabsSlots = new Map();
    const skillSlotManager = {
      setSlot(key, skillId)
      {
        jabsSlots.set(key, skillId);
      },
      getSlotBySkillId(skillId)
      {
        for (const [ key, id ] of jabsSlots)
        {
          if (id === skillId) return { key };
        }

        return undefined;
      },
      clearSlot(key)
      {
        jabsSlots.delete(key);
      },
    };

    Object.assign(actor, {
      actor: () => ({ id: 1 }),
      actorId: () => 1,
      equips: () => [ null, null ],
      currentClass: () => ({}),
      skills: () => skillIds.map(id => globalThis.$dataSkills[id]).filter(Boolean),
      skill: (id) => globalThis.$dataSkills[id] ?? null,
      states: () => [],
      allStates: () => [],
      databaseData: () => ({}),
      equippedEquips: () => [],
      hasSkill: () => true,
      isLeader: () => false,
      isEquipTypeSealed: () => false,
      getAllNotes: () => [ {} ],
      getActorNotes: () => [ {} ],
      resolveEquippedSkillId: (baseSkillId) => baseSkillId,
      getEmptySecondarySkills: () => [],
      getSkillSlotManager: () => skillSlotManager,
      setEquippedSkill: vi.fn(),
      setCachedVisionModifier: vi.fn(),
      setCachedProjectileDurationModifier: vi.fn(),
      refreshBonusHits: vi.fn(),
      refreshCdr: vi.fn(),
      refreshPer: vi.fn(),
      refreshPositiveRolls: vi.fn(),
      refreshNegativeRolls: vi.fn(),
      refreshEncoreRepeats: vi.fn(),
    });

    return { actor, jabsSlots };
  }

  it('carries an equip/unequip through SKS, the JABS quick menu, and passive state sourcing together', () =>
  {
    // Arrange- Skill A (equippable, combat-visible), Skill B (same), Skill C (unslotted, always exempt).
    globalThis.$dataSkills = [
      null,
      skillData({
        id: 1, stypeId: 1, name: 'Skill A', note: '<slotCost:1>', damage: { elementId: 0 },
      }),
      skillData({
        id: 2, stypeId: 1, name: 'Skill B', note: '<slotCost:1>', damage: { elementId: 0 },
      }),
      skillData({
        id: 3, stypeId: 1, name: 'Skill C', note: '<unslotted>', damage: { elementId: 0 },
      }),
    ];
    const { actor, jabsSlots } = buildActor([ 1, 2, 3 ]);

    // Act & Assert- with nothing SKS-equipped, only the exempt skill is candidate/passive-eligible.
    expect(actor.equippedSkills()).toEqual([]);
    expect(actor.buildCombatSkillCandidatePool()
      .map(s => s.id)).toEqual([ 3 ]);
    expect(actor.getPassiveStateSourcedSkills()
      .map(s => s.id)).toEqual([ 3 ]);

    // Act- SKS-equip Skill A into slot 0.
    actor.equipSkillToSlot(0, 1);

    // Assert- Skill A now joins the exempt skill in both the JABS pool and the passive source list.
    expect(actor.equippedSkills()
      .map(s => s.id)).toEqual([ 1 ]);
    expect(actor.buildCombatSkillCandidatePool()
      .map(s => s.id)
      .sort()).toEqual([ 1, 3 ]);
    expect(actor.getPassiveStateSourcedSkills()
      .map(s => s.id)
      .sort()).toEqual([ 1, 3 ]);

    // Act- pin Skill A to a live JABS combat slot, as if the player assigned it via the quick menu.
    actor.getSkillSlotManager()
      .setSlot('combat', 1);
    expect(jabsSlots.get('combat')).toBe(1);

    // Act- SKS-unequip Skill A.
    actor.unequipSkillFromSlot(0);

    // Assert- the JABS slot was cleared, and Skill A dropped from both the pool and the passive list-
    // one actor action produced all three downstream effects.
    expect(jabsSlots.has('combat')).toBe(false);
    expect(actor.equippedSkills()).toEqual([]);
    expect(actor.buildCombatSkillCandidatePool()
      .map(s => s.id)).toEqual([ 3 ]);
    expect(actor.getPassiveStateSourcedSkills()
      .map(s => s.id)).toEqual([ 3 ]);
  });

  it('blocks equipping a second skill once slots are exhausted, proving real enforcement is live', () =>
  {
    // Arrange- baseSlots resolves to 1 via a real <baseSlots:[...]> tag on the actor's own notes.
    globalThis.$dataSkills = [
      null,
      skillData({
        id: 1, stypeId: 1, name: 'Skill A', note: '<slotCost:1>', damage: { elementId: 0 },
      }),
      skillData({
        id: 2, stypeId: 1, name: 'Skill B', note: '<slotCost:1>', damage: { elementId: 0 },
      }),
    ];
    const { actor } = buildActor([ 1, 2 ]);
    actor.getActorNotes = () => [ { note: '<baseSlots:[1]>' } ];
    actor.equipSkillToSlot(0, 1);

    // Act
    const result = actor.canEquipSkillToSlot(1, 2);

    // Assert
    expect(result).toBe(false);
  });
});
//endregion plugins/sks/ext/abs/_component/end-to-end-pipeline.test.js

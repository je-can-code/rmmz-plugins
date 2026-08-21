//region plugins/sks/ext/abs/objects/game-actor.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('Game_Actor ext/abs (sks) augments (direct src import)', () =>
{
  let Game_Actor;

  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = { SKS: { EXT: { ABS: { Aliased: { Game_Actor: new Map() } } } } };

    function StubGameActor()
    {
    }

    // pre-alias stand-ins for the real abs/core and sks/core methods this extension wraps.
    StubGameActor.prototype.buildCombatSkillCandidatePool = vi.fn();
    StubGameActor.prototype.buildDodgeSkillCandidatePool = vi.fn();
    StubGameActor.prototype.buildOffhandAssignableSkillPool = vi.fn();
    StubGameActor.prototype.onSkillUnequipChange = vi.fn();
    globalThis.Game_Actor = StubGameActor;

    await import('../../../../../../src/plugins/sks/ext/abs/objects/Game_Actor.js');
    ({ Game_Actor } = globalThis);
  });

  beforeEach(() =>
  {
    vi.clearAllMocks();
  });

  /**
   * Builds a stub actor exposing just the surface this extension reads: `equippedSkills()`,
   * `getMainhandProvidedOffhandSkillId()`, and `getSkillSlotManager()`.
   * @param {object} [overrides] Instance-level overrides.
   * @returns {object}
   */
  function buildActor(overrides = {})
  {
    const actor = new Game_Actor();

    Object.assign(actor, {
      equippedSkills: () => [],
      getMainhandProvidedOffhandSkillId: () => 0,
      getSkillSlotManager: () => ({ getSlotBySkillId: () => undefined, clearSlot: vi.fn() }),
      ...overrides,
    });

    return actor;
  }

  describe('buildCombatSkillCandidatePool', () =>
  {
    it('excludes a learned-but-unequipped combat-visible skill', () =>
    {
      // Arrange
      const skill = { id: 1, unslotted: false };
      const actor = buildActor({ equippedSkills: () => [] });
      globalThis.J.SKS.EXT.ABS.Aliased.Game_Actor.get('buildCombatSkillCandidatePool')
        .mockReturnValue([ skill ]);

      // Act
      const result = actor.buildCombatSkillCandidatePool();

      // Assert
      expect(result).toEqual([]);
    });

    it('includes a learned-and-equipped combat-visible skill', () =>
    {
      // Arrange
      const skill = { id: 1, unslotted: false };
      const actor = buildActor({ equippedSkills: () => [ skill ] });
      globalThis.J.SKS.EXT.ABS.Aliased.Game_Actor.get('buildCombatSkillCandidatePool')
        .mockReturnValue([ skill ]);

      // Act
      const result = actor.buildCombatSkillCandidatePool();

      // Assert
      expect(result).toEqual([ skill ]);
    });

    it('includes a learned, unequipped skill flagged unslotted', () =>
    {
      // Arrange
      const skill = { id: 1, unslotted: true };
      const actor = buildActor({ equippedSkills: () => [] });
      globalThis.J.SKS.EXT.ABS.Aliased.Game_Actor.get('buildCombatSkillCandidatePool')
        .mockReturnValue([ skill ]);

      // Act
      const result = actor.buildCombatSkillCandidatePool();

      // Assert
      expect(result).toEqual([ skill ]);
    });
  });

  describe('buildDodgeSkillCandidatePool', () =>
  {
    it('excludes a learned-but-unequipped dodge-visible skill', () =>
    {
      // Arrange
      const skill = { id: 2, unslotted: false };
      const actor = buildActor({ equippedSkills: () => [] });
      globalThis.J.SKS.EXT.ABS.Aliased.Game_Actor.get('buildDodgeSkillCandidatePool')
        .mockReturnValue([ skill ]);

      // Act
      const result = actor.buildDodgeSkillCandidatePool();

      // Assert
      expect(result).toEqual([]);
    });

    it('includes a learned-and-equipped dodge-visible skill', () =>
    {
      // Arrange
      const skill = { id: 2, unslotted: false };
      const actor = buildActor({ equippedSkills: () => [ skill ] });
      globalThis.J.SKS.EXT.ABS.Aliased.Game_Actor.get('buildDodgeSkillCandidatePool')
        .mockReturnValue([ skill ]);

      // Act
      const result = actor.buildDodgeSkillCandidatePool();

      // Assert
      expect(result).toEqual([ skill ]);
    });

    it('includes a learned, unequipped skill flagged unslotted', () =>
    {
      // Arrange
      const skill = { id: 2, unslotted: true };
      const actor = buildActor({ equippedSkills: () => [] });
      globalThis.J.SKS.EXT.ABS.Aliased.Game_Actor.get('buildDodgeSkillCandidatePool')
        .mockReturnValue([ skill ]);

      // Act
      const result = actor.buildDodgeSkillCandidatePool();

      // Assert
      expect(result).toEqual([ skill ]);
    });
  });

  describe('buildOffhandAssignableSkillPool', () =>
  {
    it('includes an equipped offhand-eligible skill', () =>
    {
      // Arrange
      const skill = { id: 3, unslotted: false };
      const actor = buildActor({ equippedSkills: () => [ skill ] });
      globalThis.J.SKS.EXT.ABS.Aliased.Game_Actor.get('buildOffhandAssignableSkillPool')
        .mockReturnValue([ skill ]);

      // Act
      const result = actor.buildOffhandAssignableSkillPool();

      // Assert
      expect(result).toEqual([ skill ]);
    });

    it('excludes an unequipped, non-unslotted, learned offhand-eligible skill', () =>
    {
      // Arrange
      const skill = { id: 3, unslotted: false };
      const actor = buildActor({ equippedSkills: () => [] });
      globalThis.J.SKS.EXT.ABS.Aliased.Game_Actor.get('buildOffhandAssignableSkillPool')
        .mockReturnValue([ skill ]);

      // Act
      const result = actor.buildOffhandAssignableSkillPool();

      // Assert
      expect(result).toEqual([]);
    });

    it('includes an unequipped skill flagged unslotted', () =>
    {
      // Arrange: the offhand pool keeps its own copy of the exempt-or-equipped filter rather than
      // sharing the helper the combat and dodge pools use, and every case here left the unslotted
      // flag off - so that operand never decided anything and could have been dropped from this
      // copy alone. An always-available skill would then vanish from the offhand list while still
      // appearing in the other two.
      const skill = {
        id: 3, unslotted: true,
      };
      const actor = buildActor({ equippedSkills: () => [] });
      globalThis.J.SKS.EXT.ABS.Aliased.Game_Actor.get('buildOffhandAssignableSkillPool')
        .mockReturnValue([ skill ]);

      // Act
      const result = actor.buildOffhandAssignableSkillPool();

      // Assert
      expect(result).toEqual([ skill ]);
    });

    it('always includes the mainhand-provided offhand skill, regardless of SKS equip state', () =>
    {
      // Arrange- the weapon-granted skill is never learned/equipped through the normal SKS path.
      const weaponGrantedSkill = { id: 4, unslotted: false };
      const actor = buildActor({
        equippedSkills: () => [],
        getMainhandProvidedOffhandSkillId: () => 4,
      });
      globalThis.J.SKS.EXT.ABS.Aliased.Game_Actor.get('buildOffhandAssignableSkillPool')
        .mockReturnValue([ weaponGrantedSkill ]);

      // Act
      const result = actor.buildOffhandAssignableSkillPool();

      // Assert
      expect(result).toEqual([ weaponGrantedSkill ]);
    });
  });

  describe('onSkillUnequipChange', () =>
  {
    it('clears the matching JABS slot when a live assignment holds the unequipped skill', () =>
    {
      // Arrange
      const clearSlot = vi.fn();
      const actor = buildActor({
        getSkillSlotManager: () => ({
          getSlotBySkillId: (skillId) => (skillId === 5 ? { key: 'mainhand' } : undefined),
          clearSlot,
        }),
      });

      // Act
      actor.onSkillUnequipChange(0, 5);

      // Assert
      expect(clearSlot).toHaveBeenCalledWith('mainhand');
    });

    it('is a safe no-op when no live JABS slot holds the unequipped skill', () =>
    {
      // Arrange
      const clearSlot = vi.fn();
      const actor = buildActor({
        getSkillSlotManager: () => ({ getSlotBySkillId: () => undefined, clearSlot }),
      });

      // Act
      actor.onSkillUnequipChange(0, 5);

      // Assert
      expect(clearSlot).not.toHaveBeenCalled();
    });

    it('always calls through to the original aliased implementation', () =>
    {
      // Arrange
      const actor = buildActor();

      // Act
      actor.onSkillUnequipChange(0, 5);

      // Assert
      expect(globalThis.J.SKS.EXT.ABS.Aliased.Game_Actor.get('onSkillUnequipChange')).toHaveBeenCalledWith(0, 5);
    });
  });
});
//endregion plugins/sks/ext/abs/objects/game-actor.test.js

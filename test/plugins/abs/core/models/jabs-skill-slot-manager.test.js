//region plugins/abs/core/models/jabs-skill-slot-manager.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('JABS_SkillSlotManager (direct src import)', () =>
{
  let JABS_SkillSlotManager;
  let FakeJABSBattler;
  let FakeJABSAiManager;

  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.SerializableRegistry = { register: vi.fn() };
    globalThis.JABS_Button = {
      Mainhand: 'mainhand', Offhand: 'offhand', Tool: 'tool', UsableItem: 'item', Dodge: 'dodge',
      CombatSkill1: 'combat1', CombatSkill2: 'combat2', CombatSkill3: 'combat3', CombatSkill4: 'combat4',
    };
    globalThis.Sprite_SkillCost = { Types: { HP: 'hp', MP: 'mp', TP: 'tp', Item: 'item' } };
    globalThis.SoundManager = { playBuzzer: vi.fn() };
    globalThis.J = { ABS: { Globals: { GlobalCooldownKey: 'gcd' } } };
    globalThis.console = { ...console, warn: vi.fn() };

    FakeJABSBattler = { isDodgeSkillById: vi.fn(() => false), isGuardSkillById: vi.fn(() => false) };
    vi.doMock('../../../../../src/plugins/abs/core/models/JABS_Battler.js', () => ({ default: FakeJABSBattler }));

    FakeJABSAiManager = { buildEnemyCooldownType: vi.fn(skill => `${skill.id}-${skill.name}`) };
    vi.doMock('../../../../../src/plugins/abs/core/managers/JABS_AiManager.js', () => ({ default: FakeJABSAiManager }));

    ({ default: JABS_SkillSlotManager } = await import('../../../../../src/plugins/abs/core/models/JABS_SkillSlotManager.js'));
  });

  beforeEach(() =>
  {
    FakeJABSBattler.isDodgeSkillById.mockReset().mockReturnValue(false);
    FakeJABSBattler.isGuardSkillById.mockReset().mockReturnValue(false);
    FakeJABSAiManager.buildEnemyCooldownType.mockClear();
    globalThis.console.warn.mockClear();
  });

  it('registers itself with the serializable registry on module load', () =>
  {
    expect(globalThis.SerializableRegistry.register).toHaveBeenCalledWith(JABS_SkillSlotManager);
  });

  describe('constructor / initMembers', () =>
  {
    it('starts with no slots', () =>
    {
      const manager = new JABS_SkillSlotManager();
      expect(manager.getAllSlots()).toEqual([]);
    });

    it('starts not setup', () =>
    {
      const manager = new JABS_SkillSlotManager();
      expect(manager.isSetupComplete()).toBe(false);
    });
  });

  describe('completeSetup / isSetupComplete', () =>
  {
    it('flags setup as complete', () =>
    {
      const manager = new JABS_SkillSlotManager();
      manager.completeSetup();
      expect(manager.isSetupComplete()).toBe(true);
    });
  });

  function buildActor()
  {
    return { isActor: () => true, isEnemy: () => false };
  }

  function buildEnemy(overrides = {})
  {
    return {
      isActor: () => false,
      isEnemy: () => true,
      databaseData: () => ({ actions: [ { skillId: 10 }, { skillId: 11 } ] }),
      basicAttackSkillId: () => 0,
      skill: id => ({ id, name: `Skill${id}` }),
      ...overrides,
    };
  }

  describe('setupSlots() / setupActorSlots()', () =>
  {
    it('sets up all ten fixed slots for an actor', () =>
    {
      const manager = new JABS_SkillSlotManager();
      manager.setupSlots(buildActor());

      expect(manager.getAllSlots()).toHaveLength(10);
      expect(manager.getSkillSlotByKey('mainhand')).toBeDefined();
      expect(manager.getSkillSlotByKey('gcd')).toBeDefined();
    });

    it('pre-enables the gcd slot\'s cooldown so it does not block before the first stamp', () =>
    {
      const manager = new JABS_SkillSlotManager();
      manager.setupSlots(buildActor());

      expect(manager.getSkillSlotByKey('gcd').getCooldown().isBaseReady()).toBe(true);
    });

    it('flags setup as complete after setting up an actor', () =>
    {
      const manager = new JABS_SkillSlotManager();
      manager.setupSlots(buildActor());
      expect(manager.isSetupComplete()).toBe(true);
    });

    it('does not re-setup an already-setup actor', () =>
    {
      const manager = new JABS_SkillSlotManager();
      manager.setupSlots(buildActor());
      manager.getSkillSlotByKey('mainhand').setSkillId(99);

      manager.setupSlots(buildActor());

      expect(manager.getSkillSlotByKey('mainhand').id).toBe(99);
    });
  });

  describe('setupEnemySlots()', () =>
  {
    it('adds a slot per unique skill id from the database actions', () =>
    {
      const manager = new JABS_SkillSlotManager();
      manager.setupSlots(buildEnemy());

      // gcd slot + dodge slot + offhand (guard) slot + 2 unique action skills = 5 slots.
      expect(manager.getAllSlots()).toHaveLength(5);
    });

    it('adds the basic attack skill id when present', () =>
    {
      const manager = new JABS_SkillSlotManager();
      manager.setupSlots(buildEnemy({ basicAttackSkillId: () => 20 }));

      expect(manager.getAllSlots()).toHaveLength(6);
    });

    it('deduplicates skill ids that appear more than once', () =>
    {
      const manager = new JABS_SkillSlotManager();
      manager.setupSlots(buildEnemy({
        databaseData: () => ({ actions: [ { skillId: 10 }, { skillId: 10 } ] }),
      }));

      // gcd + dodge + offhand + 1 unique skill = 4 slots.
      expect(manager.getAllSlots()).toHaveLength(4);
    });

    it('assigns the first dodge-classified skill to the dodge slot', () =>
    {
      FakeJABSBattler.isDodgeSkillById.mockImplementation(id => id === 11);
      const manager = new JABS_SkillSlotManager();
      manager.setupSlots(buildEnemy());

      expect(manager.getDodgeSlot().id).toBe(11);
    });

    it('leaves the dodge slot empty when no skill is dodge-classified', () =>
    {
      const manager = new JABS_SkillSlotManager();
      manager.setupSlots(buildEnemy());

      expect(manager.getDodgeSlot().id).toBe(0);
    });

    it('assigns the first guard-classified skill to the offhand slot', () =>
    {
      FakeJABSBattler.isGuardSkillById.mockImplementation(id => id === 10);
      const manager = new JABS_SkillSlotManager();
      manager.setupSlots(buildEnemy());

      expect(manager.getSkillSlotByKey('offhand').id).toBe(10);
    });

    it('gives remaining non-dodge/non-guard skills a per-skill cooldown key', () =>
    {
      const manager = new JABS_SkillSlotManager();
      manager.setupSlots(buildEnemy());

      expect(FakeJABSAiManager.buildEnemyCooldownType).toHaveBeenCalled();
      expect(manager.getSkillSlotByKey('10-Skill10').id).toBe(10);
      expect(manager.getSkillSlotByKey('11-Skill11').id).toBe(11);
    });

    it('does not double-register a skill that already claimed the dodge or guard slot', () =>
    {
      FakeJABSBattler.isDodgeSkillById.mockImplementation(id => id === 10);
      const manager = new JABS_SkillSlotManager();
      manager.setupSlots(buildEnemy());

      // skill 10 went to the dodge slot- it should not also get a per-skill slot.
      expect(manager.getSkillSlotByKey('10-Skill10')).toBeUndefined();
    });
  });

  describe('filterActionSkills()', () =>
  {
    it('always returns true (the default filter accepts every action)', () =>
    {
      const manager = new JABS_SkillSlotManager();
      expect(manager.filterActionSkills({}, {})).toBe(true);
    });
  });

  describe('flagAllSkillSlotsForRefresh()', () =>
  {
    it('flags every slot for refresh', () =>
    {
      const manager = new JABS_SkillSlotManager();
      manager.setupSlots(buildActor());
      manager.getAllSlots().forEach(slot => slot.acknowledgeNameRefresh());

      manager.flagAllSkillSlotsForRefresh();

      expect(manager.getAllSlots().every(slot => slot.needsVisualNameRefresh())).toBe(true);
    });
  });

  describe('addSlot()', () =>
  {
    it('adds a new slot with the given key and skill id', () =>
    {
      const manager = new JABS_SkillSlotManager();
      manager.addSlot('custom', 5);
      expect(manager.getSkillSlotByKey('custom').id).toBe(5);
    });

    it('does not add a duplicate slot for an existing key', () =>
    {
      const manager = new JABS_SkillSlotManager();
      manager.addSlot('custom', 5);
      manager.addSlot('custom', 99);
      expect(manager.getSkillSlotByKey('custom').id).toBe(5);
      expect(manager.getAllSlots()).toHaveLength(1);
    });
  });

  describe('getAllPrimarySlots() / getAllSecondarySlots()', () =>
  {
    it('separates primary and secondary slots for an actor', () =>
    {
      const manager = new JABS_SkillSlotManager();
      manager.setupSlots(buildActor());

      expect(manager.getAllPrimarySlots()).toHaveLength(5);
      expect(manager.getAllSecondarySlots()).toHaveLength(4);
    });
  });

  describe('getToolSlot() / getUsableItemSlot() / getDodgeSlot()', () =>
  {
    it('resolves the well-known convenience slots by key', () =>
    {
      const manager = new JABS_SkillSlotManager();
      manager.setupSlots(buildActor());

      expect(manager.getToolSlot().key).toBe('tool');
      expect(manager.getUsableItemSlot().key).toBe('item');
      expect(manager.getDodgeSlot().key).toBe('dodge');
    });
  });

  describe('getEquippedSlots() / getEmptySecondarySlots()', () =>
  {
    it('returns only slots with a skill assigned', () =>
    {
      const manager = new JABS_SkillSlotManager();
      manager.setupSlots(buildActor());
      manager.setSlot('mainhand', 5, false);

      expect(manager.getEquippedSlots().map(s => s.key)).toEqual([ 'mainhand' ]);
    });

    it('returns only secondary slots without a skill assigned', () =>
    {
      const manager = new JABS_SkillSlotManager();
      manager.setupSlots(buildActor());
      manager.setSlot('combat1', 5, false);

      const emptyKeys = manager.getEmptySecondarySlots().map(s => s.key);
      expect(emptyKeys).toEqual([ 'combat2', 'combat3', 'combat4' ]);
    });
  });

  describe('getSlotBySkillId()', () =>
  {
    it('finds a slot by its base skill id', () =>
    {
      const manager = new JABS_SkillSlotManager();
      manager.setupSlots(buildActor());
      manager.setSlot('mainhand', 5, false);

      expect(manager.getSlotBySkillId(5).key).toBe('mainhand');
    });

    it('falls back to finding a slot by its combo skill id', () =>
    {
      const manager = new JABS_SkillSlotManager();
      manager.setupSlots(buildActor());
      manager.setSlot('mainhand', 5, false);
      manager.setSlotComboId('mainhand', 9);

      expect(manager.getSlotBySkillId(9).key).toBe('mainhand');
    });

    it('returns undefined when no slot matches', () =>
    {
      const manager = new JABS_SkillSlotManager();
      manager.setupSlots(buildActor());

      expect(manager.getSlotBySkillId(999)).toBeUndefined();
    });
  });

  describe('setSlot()', () =>
  {
    it('sets the skill id and lock state on the target slot', () =>
    {
      const manager = new JABS_SkillSlotManager();
      manager.setupSlots(buildActor());

      manager.setSlot('combat1', 5, true);

      const slot = manager.getSkillSlotByKey('combat1');
      expect(slot.id).toBe(5);
      expect(slot.isLocked()).toBe(true);
    });
  });

  describe('getSlotComboId() / setSlotComboId()', () =>
  {
    it('returns 0 and warns when the slot key does not exist', () =>
    {
      const manager = new JABS_SkillSlotManager();
      expect(manager.getSlotComboId('missing')).toBe(0);
      expect(globalThis.console.warn).toHaveBeenCalled();
    });

    it('returns the combo id for an existing slot', () =>
    {
      const manager = new JABS_SkillSlotManager();
      manager.setupSlots(buildActor());
      manager.setSlotComboId('mainhand', 9);

      expect(manager.getSlotComboId('mainhand')).toBe(9);
    });

    it('flags the slot for refresh when setting a combo id', () =>
    {
      const manager = new JABS_SkillSlotManager();
      manager.setupSlots(buildActor());
      manager.getSkillSlotByKey('mainhand').acknowledgeNameRefresh();

      manager.setSlotComboId('mainhand', 9);

      expect(manager.getSkillSlotByKey('mainhand').needsVisualNameRefresh()).toBe(true);
    });
  });

  describe('updateCooldowns()', () =>
  {
    it('updates the cooldown of every equipped slot', () =>
    {
      const manager = new JABS_SkillSlotManager();
      manager.setupSlots(buildActor());
      manager.setSlot('mainhand', 5, false);
      manager.getSkillSlotByKey('mainhand').getCooldown().setFrames(3);

      manager.updateCooldowns();

      expect(manager.getSkillSlotByKey('mainhand').getCooldown().frames).toBe(2);
    });

    it('always ticks the gcd slot even though it is never "equipped"', () =>
    {
      const manager = new JABS_SkillSlotManager();
      manager.setupSlots(buildActor());
      manager.getSkillSlotByKey('gcd').getCooldown().setFrames(3);

      manager.updateCooldowns();

      expect(manager.getSkillSlotByKey('gcd').getCooldown().frames).toBe(2);
    });

    it('does nothing when there is no gcd slot at all', () =>
    {
      const manager = new JABS_SkillSlotManager();
      manager.addSlot('mainhand', 5);

      expect(() => manager.updateCooldowns()).not.toThrow();
    });
  });

  describe('isAnyCooldownReadyForSlot()', () =>
  {
    it('is ready when the base cooldown is ready', () =>
    {
      const manager = new JABS_SkillSlotManager();
      manager.setupSlots(buildActor());
      manager.setSlot('mainhand', 5, false);
      manager.getSkillSlotByKey('mainhand').getCooldown().setFrames(0);

      expect(manager.isAnyCooldownReadyForSlot('mainhand')).toBe(true);
    });

    it('is ready when there is a combo id and the combo cooldown is ready', () =>
    {
      const manager = new JABS_SkillSlotManager();
      manager.setupSlots(buildActor());
      manager.setSlot('mainhand', 5, false);
      manager.setSlotComboId('mainhand', 9);
      const slot = manager.getSkillSlotByKey('mainhand');
      slot.getCooldown().setFrames(10);
      slot.getCooldown().setComboFrames(0);

      expect(manager.isAnyCooldownReadyForSlot('mainhand')).toBe(true);
    });

    it('is not ready when there is a combo id but the combo cooldown is not ready', () =>
    {
      const manager = new JABS_SkillSlotManager();
      manager.setupSlots(buildActor());
      manager.setSlot('mainhand', 5, false);
      manager.setSlotComboId('mainhand', 9);
      const slot = manager.getSkillSlotByKey('mainhand');
      slot.getCooldown().setFrames(10);
      slot.getCooldown().setComboFrames(10);

      expect(manager.isAnyCooldownReadyForSlot('mainhand')).toBe(false);
    });

    it('is not ready when there is no combo id and the base cooldown is still running', () =>
    {
      const manager = new JABS_SkillSlotManager();
      manager.setupSlots(buildActor());
      manager.setSlot('mainhand', 5, false);
      manager.getSkillSlotByKey('mainhand').getCooldown().setFrames(30);

      expect(manager.isAnyCooldownReadyForSlot('mainhand')).toBe(false);
    });
  });

  describe('clearSlot()', () =>
  {
    it('clears and unlocks the target slot', () =>
    {
      const manager = new JABS_SkillSlotManager();
      manager.setupSlots(buildActor());
      manager.setSlot('combat1', 5, true);

      manager.clearSlot('combat1');

      const slot = manager.getSkillSlotByKey('combat1');
      expect(slot.id).toBe(0);
      expect(slot.isLocked()).toBe(false);
    });
  });

  describe('unlockAllSlots()', () =>
  {
    it('unlocks every slot', () =>
    {
      const manager = new JABS_SkillSlotManager();
      manager.setupSlots(buildActor());
      manager.setSlot('combat1', 5, true);
      manager.setSlot('combat2', 6, true);

      manager.unlockAllSlots();

      expect(manager.getSkillSlotByKey('combat1').isLocked()).toBe(false);
      expect(manager.getSkillSlotByKey('combat2').isLocked()).toBe(false);
    });
  });

  describe('offhand pin: getOffhandPinnedSkillId() / setOffhandPinnedSkillId() / clearOffhandPin()', () =>
  {
    it('returns 0 when the offhand slot does not exist yet', () =>
    {
      const manager = new JABS_SkillSlotManager();
      expect(manager.getOffhandPinnedSkillId()).toBe(0);
    });

    it('does nothing when setting a pin before the offhand slot exists', () =>
    {
      const manager = new JABS_SkillSlotManager();
      expect(() => manager.setOffhandPinnedSkillId(12)).not.toThrow();
    });

    it('sets and reads back the offhand pin', () =>
    {
      const manager = new JABS_SkillSlotManager();
      manager.setupSlots(buildActor());

      manager.setOffhandPinnedSkillId(12);

      expect(manager.getOffhandPinnedSkillId()).toBe(12);
    });

    it('clears the offhand pin', () =>
    {
      const manager = new JABS_SkillSlotManager();
      manager.setupSlots(buildActor());
      manager.setOffhandPinnedSkillId(12);

      manager.clearOffhandPin();

      expect(manager.getOffhandPinnedSkillId()).toBe(0);
    });
  });
});
//endregion plugins/abs/core/models/jabs-skill-slot-manager.test.js

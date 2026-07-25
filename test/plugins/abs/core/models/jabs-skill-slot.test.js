//region plugins/abs/core/models/jabs-skill-slot.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('JABS_SkillSlot (direct src import)', () =>
{
  let JABS_SkillSlot;

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
    globalThis.console = { ...console, warn: vi.fn() };

    ({ default: JABS_SkillSlot } = await import('../../../../../src/plugins/abs/core/models/JABS_SkillSlot.js'));
  });

  beforeEach(() =>
  {
    globalThis.SoundManager.playBuzzer.mockClear();
    globalThis.console.warn.mockClear();
    globalThis.$dataItems = { 7: { id: 7, name: 'Potion' } };
    globalThis.$dataSkills = { 5: { id: 5, name: 'Slash' }, 9: { id: 9, name: 'ComboSlash' } };
  });

  it('registers itself with the serializable registry on module load', () =>
  {
    expect(globalThis.SerializableRegistry.register).toHaveBeenCalledWith(JABS_SkillSlot);
  });

  describe('constructor / initialize', () =>
  {
    it('stores the key and skill id', () =>
    {
      const slot = new JABS_SkillSlot('mainhand', 5);
      expect(slot.key).toBe('mainhand');
      expect(slot.id).toBe(5);
    });

    it('initializes with a clean, unlocked, unpinned slot', () =>
    {
      const slot = new JABS_SkillSlot('mainhand', 5);
      expect(slot.comboId).toBe(0);
      expect(slot.locked).toBe(false);
      expect(slot.pinnedSkillId).toBe(0);
    });

    it('creates a cooldown tagged with this slot\'s own key', () =>
    {
      const slot = new JABS_SkillSlot('offhand', 5);
      expect(slot.getCooldown().key).toBe('offhand');
    });

    it('starts flagged for every visual refresh', () =>
    {
      const slot = new JABS_SkillSlot('mainhand', 5);
      expect(slot.needsVisualNameRefresh()).toBe(true);
      expect(slot.needsVisualIconRefresh()).toBe(true);
    });
  });

  describe('visual refresh flags', () =>
  {
    it('flags every refresh at once via flagSkillSlotForRefresh', () =>
    {
      const slot = new JABS_SkillSlot('mainhand', 5);
      slot.acknowledgeNameRefresh();
      slot.acknowledgeIconRefresh();

      slot.flagSkillSlotForRefresh();

      expect(slot.needsVisualNameRefresh()).toBe(true);
      expect(slot.needsVisualIconRefresh()).toBe(true);
    });

    it('acknowledges the name refresh', () =>
    {
      const slot = new JABS_SkillSlot('mainhand', 5);
      slot.acknowledgeNameRefresh();
      expect(slot.needsVisualNameRefresh()).toBe(false);
    });

    it('acknowledges the icon refresh', () =>
    {
      const slot = new JABS_SkillSlot('mainhand', 5);
      slot.acknowledgeIconRefresh();
      expect(slot.needsVisualIconRefresh()).toBe(false);
    });

    describe('needsVisualCostRefreshByType / acknowledgeCostRefreshByType', () =>
    {
      it.each([
        [ 'hp', 'needsHpCostRefresh' ],
        [ 'mp', 'needsMpCostRefresh' ],
        [ 'tp', 'needsTpCostRefresh' ],
        [ 'item', 'needsItemCostRefresh' ],
      ])('reads and acknowledges the %s cost refresh flag', (costType, field) =>
      {
        const slot = new JABS_SkillSlot('mainhand', 5);
        expect(slot.needsVisualCostRefreshByType(costType)).toBe(true);

        slot.acknowledgeCostRefreshByType(costType);

        expect(slot[field]).toBe(false);
        expect(slot.needsVisualCostRefreshByType(costType)).toBe(false);
      });

      it('warns and returns false for an unrecognized cost type when reading', () =>
      {
        const slot = new JABS_SkillSlot('mainhand', 5);
        expect(slot.needsVisualCostRefreshByType('unknown')).toBe(false);
        expect(globalThis.console.warn).toHaveBeenCalled();
      });

      it('warns for an unrecognized cost type when acknowledging', () =>
      {
        const slot = new JABS_SkillSlot('mainhand', 5);
        slot.acknowledgeCostRefreshByType('unknown');
        expect(globalThis.console.warn).toHaveBeenCalled();
      });
    });
  });

  describe('updateCooldown / handleComboReadiness', () =>
  {
    it('updates the underlying cooldown', () =>
    {
      const slot = new JABS_SkillSlot('mainhand', 5);
      slot.getCooldown().setFrames(3);

      slot.updateCooldown();

      expect(slot.getCooldown().frames).toBe(2);
    });

    it('resets the combo and acknowledges it once the cooldown requests a combo clear', () =>
    {
      const slot = new JABS_SkillSlot('mainhand', 5);
      slot.setComboId(9);
      slot.getCooldown().requestComboClear();

      slot.handleComboReadiness();

      expect(slot.getComboId()).toBe(0);
      expect(slot.getCooldown().needsComboClear()).toBe(false);
    });

    it('does nothing when the cooldown does not need a combo clear', () =>
    {
      const slot = new JABS_SkillSlot('mainhand', 5);
      slot.setComboId(9);

      slot.handleComboReadiness();

      expect(slot.getComboId()).toBe(9);
    });
  });

  describe('onChange / resetCombo / getComboId / setComboId', () =>
  {
    it('flags for refresh on change', () =>
    {
      const slot = new JABS_SkillSlot('mainhand', 5);
      slot.acknowledgeNameRefresh();

      slot.onChange();

      expect(slot.needsVisualNameRefresh()).toBe(true);
    });

    it('resets the combo id back to 0 and flags for refresh', () =>
    {
      const slot = new JABS_SkillSlot('mainhand', 5);
      slot.setComboId(9);
      slot.acknowledgeNameRefresh();

      slot.resetCombo();

      expect(slot.getComboId()).toBe(0);
      expect(slot.needsVisualNameRefresh()).toBe(true);
    });

    it('fires the on-change hook when the combo id actually changes', () =>
    {
      const slot = new JABS_SkillSlot('mainhand', 5);
      slot.acknowledgeNameRefresh();

      slot.setComboId(9);

      expect(slot.needsVisualNameRefresh()).toBe(true);
    });

    it('does not fire the on-change hook when setting the same combo id', () =>
    {
      const slot = new JABS_SkillSlot('mainhand', 5);
      slot.setComboId(9);
      slot.acknowledgeNameRefresh();

      slot.setComboId(9);

      expect(slot.needsVisualNameRefresh()).toBe(false);
    });

    it('returns this for fluent chaining', () =>
    {
      const slot = new JABS_SkillSlot('mainhand', 5);
      expect(slot.setComboId(9)).toBe(slot);
    });
  });

  describe('isUsable / isEmpty', () =>
  {
    it('is usable when the id is positive', () =>
    {
      expect(new JABS_SkillSlot('mainhand', 5).isUsable()).toBe(true);
    });

    it('is not usable when the id is 0', () =>
    {
      expect(new JABS_SkillSlot('mainhand', 0).isUsable()).toBe(false);
    });

    it('is empty when the id is 0', () =>
    {
      expect(new JABS_SkillSlot('mainhand', 0).isEmpty()).toBe(true);
    });

    it('is not empty when the id is positive', () =>
    {
      expect(new JABS_SkillSlot('mainhand', 5).isEmpty()).toBe(false);
    });
  });

  describe('isItem / isSkill', () =>
  {
    it('treats the tool slot as an item slot', () =>
    {
      expect(new JABS_SkillSlot('tool', 5).isItem()).toBe(true);
    });

    it('treats the usable-item slot as an item slot', () =>
    {
      expect(new JABS_SkillSlot('item', 5).isItem()).toBe(true);
    });

    it('treats every other slot as a skill slot', () =>
    {
      const slot = new JABS_SkillSlot('mainhand', 5);
      expect(slot.isItem()).toBe(false);
      expect(slot.isSkill()).toBe(true);
    });
  });

  describe('isPrimarySlot / isSecondarySlot', () =>
  {
    it.each([ 'mainhand', 'offhand', 'tool', 'item', 'dodge' ])('treats %s as a primary slot', key =>
    {
      expect(new JABS_SkillSlot(key, 5).isPrimarySlot()).toBe(true);
    });

    it('does not treat a combat skill slot as primary', () =>
    {
      expect(new JABS_SkillSlot('combat1', 5).isPrimarySlot()).toBe(false);
    });

    it.each([ 'combat1', 'combat2', 'combat3', 'combat4' ])('treats %s as a secondary slot', key =>
    {
      expect(new JABS_SkillSlot(key, 5).isSecondarySlot()).toBe(true);
    });

    it('does not treat mainhand as secondary', () =>
    {
      expect(new JABS_SkillSlot('mainhand', 5).isSecondarySlot()).toBe(false);
    });
  });

  describe('setSkillId', () =>
  {
    it('assigns the new skill id and fires the on-change hook', () =>
    {
      const slot = new JABS_SkillSlot('mainhand', 5);
      slot.acknowledgeNameRefresh();

      slot.setSkillId(9);

      expect(slot.id).toBe(9);
      expect(slot.needsVisualNameRefresh()).toBe(true);
    });

    it('refuses to assign and buzzes when the slot is locked', () =>
    {
      const slot = new JABS_SkillSlot('combat1', 5);
      slot.lock();

      slot.setSkillId(9);

      expect(slot.id).toBe(5);
      expect(globalThis.SoundManager.playBuzzer).toHaveBeenCalled();
    });

    it('returns this for fluent chaining', () =>
    {
      const slot = new JABS_SkillSlot('mainhand', 5);
      expect(slot.setSkillId(9)).toBe(slot);
    });
  });

  describe('locking: setLock / lock / unlock / isLocked / canBeLocked', () =>
  {
    it('mainhand and offhand cannot be locked', () =>
    {
      expect(new JABS_SkillSlot('mainhand', 5).canBeLocked()).toBe(false);
      expect(new JABS_SkillSlot('offhand', 5).canBeLocked()).toBe(false);
    });

    it('other slots can be locked', () =>
    {
      expect(new JABS_SkillSlot('combat1', 5).canBeLocked()).toBe(true);
    });

    it('locks a lockable slot', () =>
    {
      const slot = new JABS_SkillSlot('combat1', 5);
      slot.lock();
      expect(slot.isLocked()).toBe(true);
    });

    it('does not lock an unlockable slot', () =>
    {
      const slot = new JABS_SkillSlot('mainhand', 5);
      slot.lock();
      expect(slot.isLocked()).toBe(false);
    });

    it('unlocks a locked slot', () =>
    {
      const slot = new JABS_SkillSlot('combat1', 5);
      slot.lock();
      slot.unlock();
      expect(slot.isLocked()).toBe(false);
    });

    it('returns this for fluent chaining on lock and unlock', () =>
    {
      const slot = new JABS_SkillSlot('combat1', 5);
      expect(slot.lock()).toBe(slot);
      expect(slot.unlock()).toBe(slot);
    });
  });

  describe('pin: getPinnedSkillId / setPinnedSkillId / hasPinnedSkill / clearPinnedSkill', () =>
  {
    it('has no pin by default', () =>
    {
      const slot = new JABS_SkillSlot('offhand', 5);
      expect(slot.getPinnedSkillId()).toBe(0);
      expect(slot.hasPinnedSkill()).toBe(false);
    });

    it('treats a legacy undefined pin field as no pin', () =>
    {
      const slot = new JABS_SkillSlot('offhand', 5);
      slot.pinnedSkillId = undefined;
      expect(slot.getPinnedSkillId()).toBe(0);
    });

    it('sets a pin and fires the on-change hook', () =>
    {
      const slot = new JABS_SkillSlot('offhand', 5);
      slot.acknowledgeNameRefresh();

      slot.setPinnedSkillId(12);

      expect(slot.getPinnedSkillId()).toBe(12);
      expect(slot.hasPinnedSkill()).toBe(true);
      expect(slot.needsVisualNameRefresh()).toBe(true);
    });

    it('does not fire the on-change hook when the pin does not actually change', () =>
    {
      const slot = new JABS_SkillSlot('offhand', 5);
      slot.setPinnedSkillId(12);
      slot.acknowledgeNameRefresh();

      slot.setPinnedSkillId(12);

      expect(slot.needsVisualNameRefresh()).toBe(false);
    });

    it('clears the pin', () =>
    {
      const slot = new JABS_SkillSlot('offhand', 5);
      slot.setPinnedSkillId(12);

      slot.clearPinnedSkill();

      expect(slot.getPinnedSkillId()).toBe(0);
      expect(slot.hasPinnedSkill()).toBe(false);
    });
  });

  describe('data()', () =>
  {
    it('returns null when targetId is null', () =>
    {
      const slot = new JABS_SkillSlot('mainhand', 5);
      expect(slot.data(null, null)).toBeNull();
    });

    it('returns null when the slot is empty', () =>
    {
      const slot = new JABS_SkillSlot('mainhand', 0);
      expect(slot.data()).toBeNull();
    });

    it('returns the item data for an item slot', () =>
    {
      const slot = new JABS_SkillSlot('tool', 7);
      expect(slot.data()).toBe(globalThis.$dataItems[7]);
    });

    it('returns the user\'s combo skill when a user and combo id are present', () =>
    {
      const skill = vi.fn(id => ({ id }));
      const user = { skill };
      const slot = new JABS_SkillSlot('mainhand', 5);
      slot.setComboId(9);

      const result = slot.data(user);

      expect(skill).toHaveBeenCalledWith(9);
      expect(result).toEqual({ id: 9 });
    });

    it('returns the user\'s target-id skill when a user is present with no combo id', () =>
    {
      const skill = vi.fn(id => ({ id }));
      const user = { skill };
      const slot = new JABS_SkillSlot('mainhand', 5);

      const result = slot.data(user);

      expect(skill).toHaveBeenCalledWith(5);
      expect(result).toEqual({ id: 5 });
    });

    it('falls back to the raw database skill data when there is no user', () =>
    {
      const slot = new JABS_SkillSlot('mainhand', 5);
      expect(slot.data()).toBe(globalThis.$dataSkills[5]);
    });
  });

  describe('clear()', () =>
  {
    it('unlocks and zeroes the skill id', () =>
    {
      const slot = new JABS_SkillSlot('combat1', 5);
      slot.lock();

      slot.clear();

      expect(slot.isLocked()).toBe(false);
      expect(slot.id).toBe(0);
    });

    it('returns this for fluent chaining', () =>
    {
      const slot = new JABS_SkillSlot('combat1', 5);
      expect(slot.clear()).toBe(slot);
    });
  });

  describe('autoclear() / canBeAutocleared()', () =>
  {
    it.each([ 'mainhand', 'offhand', 'tool', 'item' ])('cannot be autocleared: %s', key =>
    {
      expect(new JABS_SkillSlot(key, 5).canBeAutocleared()).toBe(false);
    });

    it('other slots can be autocleared', () =>
    {
      expect(new JABS_SkillSlot('combat1', 5).canBeAutocleared()).toBe(true);
    });

    it('does nothing when the slot cannot be autocleared', () =>
    {
      const slot = new JABS_SkillSlot('mainhand', 5);
      slot.autoclear();
      expect(slot.id).toBe(5);
    });

    it('zeroes the skill id when the slot can be autocleared', () =>
    {
      const slot = new JABS_SkillSlot('combat1', 5);
      slot.autoclear();
      expect(slot.id).toBe(0);
    });
  });
});
//endregion plugins/abs/core/models/jabs-skill-slot.test.js

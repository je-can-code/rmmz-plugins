//region plugins/abs/core/_metadata/pluginCommands.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('J-ABS plugin commands (direct src import)', () =>
{
  let handlers;
  let JABS_GlobalCooldown_mock;
  let JABS_InputAdapter_mock;

  beforeAll(async () =>
  {
    vi.resetModules();

    JABS_GlobalCooldown_mock = { jabsBattlerForActor: vi.fn() };
    vi.doMock('../../../../../src/plugins/abs/core/models/JABS_GlobalCooldown.js', () => ({ default: JABS_GlobalCooldown_mock }));

    JABS_InputAdapter_mock = { performPartyCycling: vi.fn() };
    vi.doMock('../../../../../src/plugins/abs/core/models/JABS_InputAdapter.js', () => ({ default: JABS_InputAdapter_mock }));

    globalThis.J = {
      ABS: {
        Metadata: { name: 'J-ABS' },
        Globals: { GlobalCooldownKey: 'global' },
        Helpers: { PluginManager: { TranslateOptionToSlot: vi.fn(slot => slot) } },
      },
    };

    // bare global from ext/input's JABS_Button- pluginCommands.js references it directly without
    // an import, matching how the real concatenated plugin scope works.
    globalThis.JABS_Button = { Offhand: 'Offhand', Tool: 'Tool', UsableItem: 'UsableItem' };

    handlers = {};
    globalThis.PluginManager = {
      registerCommand: vi.fn((pluginName, commandName, handler) =>
      {
        handlers[commandName] = handler;
      }),
    };

    await import('../../../../../src/plugins/abs/core/_metadata/pluginCommands.js');
  });

  beforeEach(() =>
  {
    vi.clearAllMocks();
    globalThis.$jabsEngine = {
      addEnemyToMap: vi.fn(),
      addLootDropToMap: vi.fn(),
    };
    globalThis.$gameParty = {
      leader: vi.fn(),
      disablePartyCycling: vi.fn(),
      enablePartyCycling: vi.fn(),
    };
    globalThis.$gameActors = { actor: vi.fn() };
    globalThis.$dataItems = { at: vi.fn(id => ({ kind: 'item', id })) };
    globalThis.$dataWeapons = { at: vi.fn(id => ({ kind: 'weapon', id })) };
    globalThis.$dataArmors = { at: vi.fn(id => ({ kind: 'armor', id })) };
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('registers all twelve commands under the J-ABS plugin name', () =>
  {
    // Arrange/Act (registration happened in beforeAll)

    // Assert
    expect(Object.keys(handlers)).toEqual([
      'Enable JABS',
      'Disable JABS',
      'toggleHitboxOverlays',
      'Set JABS Skill',
      'Unlock JABS Skill Slot',
      'Unlock All JABS Skill Slots',
      'Rotate Party Members',
      'Disable Party Rotation',
      'Enable Party Rotation',
      'Apply Global Cooldown',
      'Spawn Enemy',
      'Spawn Loot',
    ]);
  });

  describe('Enable JABS', () =>
  {
    it('sets absEnabled to true', () =>
    {
      // Arrange
      globalThis.$jabsEngine.absEnabled = false;

      // Act
      handlers['Enable JABS']();

      // Assert
      expect(globalThis.$jabsEngine.absEnabled).toEqual(true);
    });
  });

  describe('Disable JABS', () =>
  {
    it('sets absEnabled to false', () =>
    {
      // Arrange
      globalThis.$jabsEngine.absEnabled = true;

      // Act
      handlers['Disable JABS']();

      // Assert
      expect(globalThis.$jabsEngine.absEnabled).toEqual(false);
    });
  });

  describe('toggleHitboxOverlays', () =>
  {
    it('flags requestToggleHitboxOverlays', () =>
    {
      // Arrange/Act
      handlers['toggleHitboxOverlays']();

      // Assert
      expect(globalThis.$jabsEngine.requestToggleHitboxOverlays).toEqual(true);
    });
  });

  /**
   * The plugin manager hands every command argument across as a string, numeric fields included, so
   * every id below is quoted the way the running engine would deliver it. Supplying the parsed
   * numbers a reader might assume would exercise comparisons that cannot happen in production.
   */
  describe('Set JABS Skill', () =>
  {
    it('assigns a non-offhand, non-tool/item skill slot using the skillId', () =>
    {
      // Arrange
      const actor = { setEquippedSkill: vi.fn() };
      globalThis.$gameActors.actor.mockReturnValue(actor);
      const args = { actorId: '1', skillId: '5', itemId: '0', slot: 'L1A', locked: 'false' };

      // Act
      handlers['Set JABS Skill'](args);

      // Assert
      expect(actor.setEquippedSkill).toHaveBeenCalledWith('L1A', 5, false);
    });

    it('overwrites the assigned id with the itemId for a Tool slot', () =>
    {
      // Arrange
      const actor = { setEquippedSkill: vi.fn() };
      globalThis.$gameActors.actor.mockReturnValue(actor);
      const args = { actorId: '1', skillId: '5', itemId: '9', slot: 'Tool', locked: 'true' };

      // Act
      handlers['Set JABS Skill'](args);

      // Assert
      expect(actor.setEquippedSkill).toHaveBeenCalledWith('Tool', 9, true);
    });

    it('overwrites the assigned id with the itemId for a UsableItem slot', () =>
    {
      // Arrange
      const actor = { setEquippedSkill: vi.fn() };
      globalThis.$gameActors.actor.mockReturnValue(actor);
      const args = { actorId: '1', skillId: '5', itemId: '9', slot: 'UsableItem', locked: 'false' };

      // Act
      handlers['Set JABS Skill'](args);

      // Assert
      expect(actor.setEquippedSkill).toHaveBeenCalledWith('UsableItem', 9, false);
    });

    it('assigns the skillId to a Tool slot when no item id was chosen', () =>
    {
      // Arrange- plugin command arguments arrive as strings, so the unset item id is the string "0"
      // rather than the number. Comparing it without parsing is true for every input, which sends a
      // skill-bound tool slot down the item branch and overwrites its id with zero.
      const actor = { setEquippedSkill: vi.fn() };
      globalThis.$gameActors.actor.mockReturnValue(actor);
      const args = { actorId: '1', skillId: '5', itemId: '0', slot: 'Tool', locked: 'false' };

      // Act
      handlers['Set JABS Skill'](args);

      // Assert- the skill lands in the slot rather than the command silently doing nothing.
      expect(actor.setEquippedSkill).toHaveBeenCalledWith('Tool', 5, false);
    });

    it('does not overwrite the skillId with itemId for a non tool/item slot even if itemId is set', () =>
    {
      // Arrange
      const actor = { setEquippedSkill: vi.fn() };
      globalThis.$gameActors.actor.mockReturnValue(actor);
      const args = { actorId: '1', skillId: '5', itemId: '9', slot: 'L1A', locked: 'false' };

      // Act
      handlers['Set JABS Skill'](args);

      // Assert
      expect(actor.setEquippedSkill).toHaveBeenCalledWith('L1A', 5, false);
    });

    it('does nothing when the resolved assignedId is 0', () =>
    {
      // Arrange
      const actor = { setEquippedSkill: vi.fn() };
      globalThis.$gameActors.actor.mockReturnValue(actor);
      const args = { actorId: '1', skillId: '0', itemId: '0', slot: 'L1A', locked: 'false' };

      // Act
      handlers['Set JABS Skill'](args);

      // Assert
      expect(actor.setEquippedSkill).not.toHaveBeenCalled();
    });

    it('pins the offhand skill without locking it when locked is false', () =>
    {
      // Arrange
      const slotManager = { getSkillSlotByKey: vi.fn() };
      const actor = { pinOffhandSkill: vi.fn(), getSkillSlotManager: vi.fn(() => slotManager), setEquippedSkill: vi.fn() };
      globalThis.$gameActors.actor.mockReturnValue(actor);
      const args = { actorId: '1', skillId: '5', itemId: '0', slot: 'Offhand', locked: 'false' };

      // Act
      handlers['Set JABS Skill'](args);

      // Assert
      expect(actor.pinOffhandSkill).toHaveBeenCalledWith(5);
      expect(slotManager.getSkillSlotByKey).not.toHaveBeenCalled();
      expect(actor.setEquippedSkill).not.toHaveBeenCalled();
    });

    it('pins and locks the offhand skill when locked is true', () =>
    {
      // Arrange
      const slot = { lock: vi.fn() };
      const slotManager = { getSkillSlotByKey: vi.fn(() => slot) };
      const actor = { pinOffhandSkill: vi.fn(), getSkillSlotManager: vi.fn(() => slotManager), setEquippedSkill: vi.fn() };
      globalThis.$gameActors.actor.mockReturnValue(actor);
      const args = { actorId: '1', skillId: '5', itemId: '0', slot: 'Offhand', locked: 'true' };

      // Act
      handlers['Set JABS Skill'](args);

      // Assert
      expect(actor.pinOffhandSkill).toHaveBeenCalledWith(5);
      expect(slotManager.getSkillSlotByKey).toHaveBeenCalledWith('Offhand');
      expect(slot.lock).toHaveBeenCalled();
    });
  });

  describe('Unlock JABS Skill Slot', () =>
  {
    it('unlocks the translated slot on the party leader', () =>
    {
      // Arrange
      const leader = { unlockSlot: vi.fn() };
      globalThis.$gameParty.leader.mockReturnValue(leader);
      const args = { Slot: 'L1A' };

      // Act
      handlers['Unlock JABS Skill Slot'](args);

      // Assert
      expect(leader.unlockSlot).toHaveBeenCalledWith('L1A');
    });

    it('warns and does nothing when there is no leader', () =>
    {
      // Arrange
      globalThis.$gameParty.leader.mockReturnValue(null);
      const args = { Slot: 'L1A' };

      // Act
      handlers['Unlock JABS Skill Slot'](args);

      // Assert
      expect(console.warn).toHaveBeenCalled();
    });
  });

  describe('Unlock All JABS Skill Slots', () =>
  {
    it('unlocks all slots on the party leader', () =>
    {
      // Arrange
      const leader = { unlockAllSlots: vi.fn() };
      globalThis.$gameParty.leader.mockReturnValue(leader);

      // Act
      handlers['Unlock All JABS Skill Slots']();

      // Assert
      expect(leader.unlockAllSlots).toHaveBeenCalled();
    });

    it('warns and does nothing when there is no leader', () =>
    {
      // Arrange
      globalThis.$gameParty.leader.mockReturnValue(null);

      // Act
      handlers['Unlock All JABS Skill Slots']();

      // Assert
      expect(console.warn).toHaveBeenCalled();
    });
  });

  describe('Rotate Party Members', () =>
  {
    it('forces party cycling via the input adapter', () =>
    {
      // Arrange/Act
      handlers['Rotate Party Members']();

      // Assert
      expect(JABS_InputAdapter_mock.performPartyCycling).toHaveBeenCalledWith(true);
    });
  });

  describe('Disable Party Rotation', () =>
  {
    it('disables party cycling', () =>
    {
      // Arrange/Act
      handlers['Disable Party Rotation']();

      // Assert
      expect(globalThis.$gameParty.disablePartyCycling).toHaveBeenCalled();
    });
  });

  describe('Enable Party Rotation', () =>
  {
    it('enables party cycling', () =>
    {
      // Arrange/Act
      handlers['Enable Party Rotation']();

      // Assert
      expect(globalThis.$gameParty.enablePartyCycling).toHaveBeenCalled();
    });
  });

  describe('Apply Global Cooldown', () =>
  {
    it('warns and returns without setting a counter when the actor has no map battler', () =>
    {
      // Arrange
      JABS_GlobalCooldown_mock.jabsBattlerForActor.mockReturnValue(null);
      const args = { actorId: '1', frames: '30' };

      // Act
      handlers['Apply Global Cooldown'](args);

      // Assert
      expect(console.warn).toHaveBeenCalled();
    });

    it('sets the counter to the parsed frame count when positive', () =>
    {
      // Arrange
      const jabsBattler = { setCooldownCounter: vi.fn() };
      JABS_GlobalCooldown_mock.jabsBattlerForActor.mockReturnValue(jabsBattler);
      const args = { actorId: '1', frames: '30' };

      // Act
      handlers['Apply Global Cooldown'](args);

      // Assert
      expect(jabsBattler.setCooldownCounter).toHaveBeenCalledWith('global', 30);
    });

    it('clears the counter to 0 when frames is zero', () =>
    {
      // Arrange
      const jabsBattler = { setCooldownCounter: vi.fn() };
      JABS_GlobalCooldown_mock.jabsBattlerForActor.mockReturnValue(jabsBattler);
      const args = { actorId: '1', frames: '0' };

      // Act
      handlers['Apply Global Cooldown'](args);

      // Assert
      expect(jabsBattler.setCooldownCounter).toHaveBeenCalledWith('global', 0);
    });

    it('clears the counter to 0 when frames is negative', () =>
    {
      // Arrange- a negative count is finite, so it fails only the positive half of the guard. Zero
      // cannot make that case on its own: it is both the input and the cleared value, so a guard
      // that let it straight through would produce the same 0 the rejection does.
      const jabsBattler = { setCooldownCounter: vi.fn() };
      JABS_GlobalCooldown_mock.jabsBattlerForActor.mockReturnValue(jabsBattler);
      const args = { actorId: '1', frames: '-5' };

      // Act
      handlers['Apply Global Cooldown'](args);

      // Assert
      expect(jabsBattler.setCooldownCounter).toHaveBeenCalledWith('global', 0);
    });

    it('clears the counter to 0 when frames is not a finite number', () =>
    {
      // Arrange
      const jabsBattler = { setCooldownCounter: vi.fn() };
      JABS_GlobalCooldown_mock.jabsBattlerForActor.mockReturnValue(jabsBattler);
      const args = { actorId: '1', frames: 'not-a-number' };

      // Act
      handlers['Apply Global Cooldown'](args);

      // Assert
      expect(jabsBattler.setCooldownCounter).toHaveBeenCalledWith('global', 0);
    });
  });

  describe('Spawn Enemy', () =>
  {
    it('spawns the enemy without scheduling an animation when spawnAnimationId is falsy', async () =>
    {
      // Arrange- the enemy spawns successfully, so the only thing that can suppress the animation
      // is the id check itself rather than the failed-spawn early return below.
      const addedEnemy = { requestAnimation: vi.fn() };
      globalThis.$jabsEngine.addEnemyToMap.mockReturnValue(addedEnemy);
      const args = { x: '3', y: '4', enemyEventId: '7', spawnAnimationId: '0' };

      // Act- the animation is scheduled 50ms out, so the wait has to outlast that timer; asserting
      // synchronously would pass simply by beating the callback rather than by preventing it.
      handlers['Spawn Enemy'](args);
      await new Promise(resolve => { setTimeout(resolve, 60); });

      // Assert
      expect(globalThis.$jabsEngine.addEnemyToMap).toHaveBeenCalledWith(3, 4, 7);
      expect(addedEnemy.requestAnimation).not.toHaveBeenCalled();
    });

    it('schedules the animation on the newly spawned enemy when spawnAnimationId is set', async () =>
    {
      // Arrange
      const addedEnemy = { requestAnimation: vi.fn() };
      globalThis.$jabsEngine.addEnemyToMap.mockReturnValue(addedEnemy);
      const args = { x: '3', y: '4', enemyEventId: '7', spawnAnimationId: '12' };

      // Act
      handlers['Spawn Enemy'](args);
      await new Promise(resolve => { setTimeout(resolve, 60); });

      // Assert
      expect(addedEnemy.requestAnimation).toHaveBeenCalledWith(12);
    });

    it('logs an error and does not schedule an animation when spawning failed', () =>
    {
      // Arrange
      globalThis.$jabsEngine.addEnemyToMap.mockReturnValue(null);
      const args = { x: '3', y: '4', enemyEventId: '7', spawnAnimationId: '12' };

      // Act
      handlers['Spawn Enemy'](args);

      // Assert
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('Spawn Loot', () =>
  {
    it('drops every item/weapon/armor and does not schedule an animation when spawnAnimationId is falsy', async () =>
    {
      // Arrange- loot actually drops here, so lastDropped is a real target and the id check is the
      // only thing left that can keep the animation from being scheduled onto it.
      const lastDropped = { requestAnimation: vi.fn() };
      globalThis.$jabsEngine.addLootDropToMap.mockReturnValue(lastDropped);
      const args = {
        x: '1',
        y: '2',
        lootItemIds: JSON.stringify([ 10 ]),
        lootWeaponIds: JSON.stringify([ 20 ]),
        lootArmorIds: JSON.stringify([ 30 ]),
        spawnAnimationId: '0',
      };

      // Act- the animation is scheduled 50ms out, so the wait has to outlast that timer; asserting
      // synchronously would pass simply by beating the callback rather than by preventing it.
      handlers['Spawn Loot'](args);
      await new Promise(resolve => { setTimeout(resolve, 60); });

      // Assert
      expect(globalThis.$jabsEngine.addLootDropToMap).toHaveBeenCalledWith(1, 2, { kind: 'item', id: 10 });
      expect(globalThis.$jabsEngine.addLootDropToMap).toHaveBeenCalledWith(1, 2, { kind: 'weapon', id: 20 });
      expect(globalThis.$jabsEngine.addLootDropToMap).toHaveBeenCalledWith(1, 2, { kind: 'armor', id: 30 });
      expect(lastDropped.requestAnimation).not.toHaveBeenCalled();
    });

    it('schedules the animation on the last dropped loot when spawnAnimationId is set', async () =>
    {
      // Arrange
      const lastDropped = { requestAnimation: vi.fn() };
      globalThis.$jabsEngine.addLootDropToMap.mockReturnValue(lastDropped);
      const args = {
        x: '1',
        y: '2',
        lootItemIds: JSON.stringify([]),
        lootWeaponIds: JSON.stringify([]),
        lootArmorIds: JSON.stringify([ 30 ]),
        spawnAnimationId: '9',
      };

      // Act
      handlers['Spawn Loot'](args);
      await new Promise(resolve => { setTimeout(resolve, 60); });

      // Assert
      expect(lastDropped.requestAnimation).toHaveBeenCalledWith(9);
    });
  });
});
//endregion plugins/abs/core/_metadata/pluginCommands.test.js

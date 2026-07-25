//region plugins/log/core/_models/loot-log-builder.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('LootLogBuilder (direct src import)', () =>
{
  let LootLogBuilder;
  let ActionLog;

  beforeAll(async () =>
  {
    String.empty = '';
    ({ default: ActionLog } = await import('../../../../../src/plugins/log/core/_models/ActionLog.js'));
    ({ default: LootLogBuilder } = await import('../../../../../src/plugins/log/core/_models/LootLogBuilder.js'));
  });

  beforeEach(() =>
  {
    globalThis.$gameParty = { numItems: vi.fn().mockReturnValue(3) };
    globalThis.$dataArmors = { at: id => ({ id, kind: 'armor' }) };
    globalThis.$dataWeapons = { at: id => ({ id, kind: 'weapon' }) };
    globalThis.$dataItems = { at: id => ({ id, kind: 'item' }) };
  });

  describe('build', () =>
  {
    it('builds an ActionLog with the current message and clears the builder', () =>
    {
      // Arrange
      const builder = new LootLogBuilder();
      builder.setMessage('custom message');

      // Act
      const log = builder.build();
      const secondLog = builder.build();

      // Assert
      expect(log).toBeInstanceOf(ActionLog);
      expect(log.message()).toEqual('custom message');
      expect(secondLog.message()).toEqual(String.empty);
    });
  });

  describe('setupUsedItem', () =>
  {
    it('builds a used-item message', () =>
    {
      // Arrange
      const builder = new LootLogBuilder();

      // Act
      const log = builder.setupUsedItem(5).build();

      // Assert
      expect(log.message()).toEqual('Used the \\Item[5].');
    });
  });

  describe('setupUsedLastItem', () =>
  {
    it('builds a used-last-item message', () =>
    {
      // Arrange
      const builder = new LootLogBuilder();

      // Act
      const log = builder.setupUsedLastItem(5).build();

      // Assert
      expect(log.message()).toEqual('The last \\Item[5] was used.');
    });
  });

  describe('setupGoldFound', () =>
  {
    it('builds a gold-found message with the colored amount', () =>
    {
      // Arrange
      const builder = new LootLogBuilder();

      // Act
      const log = builder.setupGoldFound(100).build();

      // Assert
      expect(log.message()).toEqual('Found \\*\\C[14]100\\C[0]\\* gold.');
    });
  });

  describe('setupLootObtained', () =>
  {
    it('builds an armor-acquired message with the current owned count', () =>
    {
      // Arrange
      const builder = new LootLogBuilder();

      // Act
      const log = builder.setupLootObtained('armor', 5).build();

      // Assert
      expect(log.message()).toEqual('\\*\\Armor[5] (3)\\* acquired.');
    });

    it('builds a weapon-acquired message with the current owned count', () =>
    {
      // Arrange
      const builder = new LootLogBuilder();

      // Act
      const log = builder.setupLootObtained('weapon', 7).build();

      // Assert
      expect(log.message()).toEqual('\\*\\Weapon[7] (3)\\* acquired.');
    });

    it('builds an item-acquired message with the current owned count', () =>
    {
      // Arrange
      const builder = new LootLogBuilder();

      // Act
      const log = builder.setupLootObtained('item', 9).build();

      // Assert
      expect(log.message()).toEqual('\\*\\Item[9] (3)\\* acquired.');
    });

    it('falls back to an empty translation for an unrecognized loot type', () =>
    {
      // Arrange
      const builder = new LootLogBuilder();

      // Act
      const log = builder.setupLootObtained('bogus', 1).build();

      // Assert
      expect(log.message()).toEqual('\\*\\* acquired.');
    });
  });
});
//endregion plugins/log/core/_models/loot-log-builder.test.js

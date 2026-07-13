//region plugins/passive/j-passive-affix.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  installPassiveHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJPassive,
} from './fixtures/install-passive-host-globals.js';
import {
  installPassiveAffixHostGlobals,
  setPluginContextToJPassiveAffix,
} from './fixtures/install-passive-affix-host-globals.js';
import { installPluginManagerWithParams } from '../../setup/install-plugin-manager-with-params.js';

describe('J-Passive-Affix (direct src import)', () =>
{
  let JPassiveAffix_PluginMetadata;

  beforeAll(async () =>
  {
    vi.resetModules();

    installPassiveHostGlobals();

    setPluginContextToJBase();
    await import('../../../src/plugins/_base/_metadata/initialization.js');

    ({ default: globalThis.RPGManager } = await import('../../../src/plugins/_base/managers/RPGManager.js'));
    ({ default: globalThis.RPG_Enemy } = await import('../../../src/plugins/_base/database/implementations/RPG_Enemy.js'));
    ({ default: globalThis.RPG_State } = await import('../../../src/plugins/_base/database/implementations/RPG_State.js'));

    setPluginContextToJPassive();
    await import('../../../src/plugins/passive/core/_metadata/initialization.js');

    installPassiveAffixHostGlobals();

    setPluginContextToJPassiveAffix();
    await import('../../../src/plugins/passive/ext/affix/_metadata/initialization.js');

    // patches the real RPG_*/Game_Event.prototype chain and JABS_AiManager stand-in directly.
    await import('../../../src/plugins/passive/ext/affix/database/RPG_Enemy.js');
    await import('../../../src/plugins/passive/ext/affix/database/RPG_State.js');
    await import('../../../src/plugins/passive/ext/affix/managers/JABS_AiManager.js');
    await import('../../../src/plugins/passive/ext/affix/managers/JABS_Battler.js');
    await import('../../../src/plugins/passive/ext/affix/managers/JABS_Engine.js');
    await import('../../../src/plugins/passive/ext/affix/objects/Game_Enemy.js');
    await import('../../../src/plugins/passive/ext/affix/objects/Game_Event.js');
    await import('../../../src/plugins/passive/ext/affix/scenes/Scene_Boot.js');
    await import('../../../src/plugins/passive/ext/affix/sprites/Sprite_Character.js');

    ({ default: JPassiveAffix_PluginMetadata } = await import('../../../src/plugins/passive/ext/affix/_metadata/_pluginMetadata.js'));
  });

  beforeEach(() =>
  {
    globalThis.RPGManager.clearCache();
  });

  describe('metadata', () =>
  {
    it('reads the default prefix chance from plugin parameters', () =>
    {
      // Arrange & Act
      const result = globalThis.J.PASSIVE.EXT.AFFIX.Metadata.defaultPrefixChance;

      // Assert
      expect(result).toBe(33);
    });

    it('reads the default suffix chance from plugin parameters', () =>
    {
      // Arrange & Act
      const result = globalThis.J.PASSIVE.EXT.AFFIX.Metadata.defaultSuffixChance;

      // Assert
      expect(result).toBe(33);
    });
  });

  describe('RPG_State#tierColorHex', () =>
  {
    it('is null when the tier hex tag is absent', () =>
    {
      // Arrange
      const state = Object.create(globalThis.RPG_State.prototype);
      state.id = 1;
      state.note = '<enemy-prefix>';

      // Act
      const result = state.tierColorHex;

      // Assert
      expect(result).toBe(null);
    });

    it('returns the captured hex when the tag is present', () =>
    {
      // Arrange
      const state = Object.create(globalThis.RPG_State.prototype);
      state.id = 2;
      state.note = '<enemy-prefix>\n<tier-color-hex:#aabbcc>';

      // Act
      const result = state.tierColorHex;

      // Assert
      expect(result).toBe('#aabbcc');
    });
  });

  describe('RPG_Enemy#noRngPassives', () =>
  {
    it('reads <no-rng-passives> on the enemy note', () =>
    {
      // Arrange
      const enemy = Object.create(globalThis.RPG_Enemy.prototype);
      enemy.note = '<no-rng-passives>';

      // Act
      const result = enemy.noRngPassives;

      // Assert
      expect(result).toBe(true);
    });
  });

  describe('JABS_AiManager.shouldBlockPassivePrefixRng', () =>
  {
    it('blocks when the enemy has noRngPassives', () =>
    {
      // Arrange
      const enemyData = { noRngPassives: true, noRngPrefixes: false };
      const character = { eventCommentsDisablePassiveAffixPrefixRng: () => false };

      // Act
      const result = globalThis.JABS_AiManager.shouldBlockPassivePrefixRng(character, enemyData);

      // Assert
      expect(result).toBe(true);
    });

    it('still allows prefix when only the slot tag is absent', () =>
    {
      // Arrange
      const enemyData = { noRngPassives: false, noRngPrefixes: false };
      const character = { eventCommentsDisablePassiveAffixPrefixRng: () => false };

      // Act
      const result = globalThis.JABS_AiManager.shouldBlockPassivePrefixRng(character, enemyData);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('JABS_AiManager.shouldBlockPassiveSuffixRng', () =>
  {
    it('blocks when the enemy has noRngPassives', () =>
    {
      // Arrange
      const enemyData = { noRngPassives: true, noRngSuffixes: false };
      const character = { eventCommentsDisablePassiveAffixSuffixRng: () => false };

      // Act
      const result = globalThis.JABS_AiManager.shouldBlockPassiveSuffixRng(character, enemyData);

      // Assert
      expect(result).toBe(true);
    });
  });

  describe('J.PASSIVE.EXT.AFFIX.Helpers.resolvePassiveTierStripeColorHex', () =>
  {
    it('returns empty when the first prefix state has no tier hex tag', () =>
    {
      // Arrange
      const prefixState = Object.create(globalThis.RPG_State.prototype);
      prefixState.id = 50;
      prefixState.note = '<enemy-prefix>';
      prefixState.name = 'Tier';
      const battler = {
        isEnemy: () => true,
        getPassiveStateIds: () => [ 50 ],
        state: (stateId) => (stateId === 50 ? prefixState : null),
      };

      // Act
      const hex = globalThis.J.PASSIVE.EXT.AFFIX.Helpers.resolvePassiveTierStripeColorHex(battler);

      // Assert
      expect(hex).toBe('');
    });

    it('returns the hex when the prefix state defines tier-color-hex', () =>
    {
      // Arrange
      const prefixState = Object.create(globalThis.RPG_State.prototype);
      prefixState.id = 51;
      prefixState.note = '<enemy-prefix>\n<tier-color-hex:#ff00aa>';
      prefixState.name = 'Tier';
      const battler = {
        isEnemy: () => true,
        getPassiveStateIds: () => [ 51 ],
        state: (stateId) => (stateId === 51 ? prefixState : null),
      };

      // Act
      const hex = globalThis.J.PASSIVE.EXT.AFFIX.Helpers.resolvePassiveTierStripeColorHex(battler);

      // Assert
      expect(hex).toBe('#ff00aa');
    });
  });

  describe('Game_Event#getResolvedPassiveAffixPrefixChance', () =>
  {
    it('prefers the last event comment tag over the enemy note', () =>
    {
      // Arrange
      const enemyData = Object.create(globalThis.RPG_Enemy.prototype);
      enemyData.note = '<passive-affix-prefix-chance:10>';
      const ev = new globalThis.Game_Event();
      ev.getValidCommentCommands = () => [
        { parameters: [ '<passive-affix-prefix-chance:25>' ] },
        { parameters: [ '<passive-affix-prefix-chance:40>' ] },
      ];

      // Act
      const chance = ev.getResolvedPassiveAffixPrefixChance(enemyData);

      // Assert
      expect(chance).toBe(40);
    });

    it('falls back to the metadata default when no overrides apply', () =>
    {
      // Arrange
      const enemyData = Object.create(globalThis.RPG_Enemy.prototype);
      enemyData.note = '';
      const ev = new globalThis.Game_Event();
      ev.getValidCommentCommands = () => [];

      // Act
      const chance = ev.getResolvedPassiveAffixPrefixChance(enemyData);

      // Assert
      expect(chance).toBe(33);
    });
  });

  describe('metadata with custom plugin parameters', () =>
  {
    let scenarioCounter = 0;

    /**
     * Builds a fresh J.PASSIVE.EXT.AFFIX.Metadata instance from custom plugin parameters, using a
     * distinct plugin name each time- PluginMetadata's append-only static registry throws on a
     * repeat registration of the same name.
     * @param {Record<string, string>} params
     * @returns {object}
     */
    function buildCustomMetadata(params)
    {
      scenarioCounter += 1;
      const name = `J-Passive-Affix-test-custom-${scenarioCounter}`;
      installPluginManagerWithParams(globalThis, name, params);
      return new JPassiveAffix_PluginMetadata(name, '1.0.0');
    }

    it('honors a custom default prefix chance', () =>
    {
      // Arrange & Act
      const metadata = buildCustomMetadata({
        'default-prefix-chance': '12',
        'default-suffix-chance': '88',
      });

      // Assert
      expect(metadata.defaultPrefixChance).toBe(12);
    });

    it('honors a custom default suffix chance', () =>
    {
      // Arrange & Act
      const metadata = buildCustomMetadata({
        'default-prefix-chance': '12',
        'default-suffix-chance': '88',
      });

      // Assert
      expect(metadata.defaultSuffixChance).toBe(88);
    });
  });
});
//endregion plugins/passive/j-passive-affix.test.js

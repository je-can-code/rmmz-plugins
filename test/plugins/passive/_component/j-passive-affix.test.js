//region plugins/passive/_component/j-passive-affix.test.js
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  installPassiveHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJPassive,
} from './fixtures/install-passive-host-globals.js';
import {
  installPassiveAffixHostGlobals,
  setPluginContextToJPassiveAffix,
} from './fixtures/install-passive-affix-host-globals.js';
import { installPluginManagerWithParams } from '../../../setup/install-plugin-manager-with-params.js';

describe('J-Passive-Affix (direct src import)', () =>
{
  let JPassiveAffix_PluginMetadata;
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

  beforeAll(async () =>
  {
    vi.resetModules();

    installPassiveHostGlobals();

    setPluginContextToJBase();
    await import('../../../../src/plugins/_base/_metadata/initialization.js');

    ({ default: globalThis.RPGManager } = await import('../../../../src/plugins/_base/managers/RPGManager.js'));
    ({ default: globalThis.RPG_Enemy } = await import('../../../../src/plugins/_base/database/implementations/RPG_Enemy.js'));
    ({ default: globalThis.RPG_State } = await import('../../../../src/plugins/_base/database/implementations/RPG_State.js'));

    setPluginContextToJPassive();
    await import('../../../../src/plugins/passive/core/_metadata/initialization.js');

    installPassiveAffixHostGlobals();

    setPluginContextToJPassiveAffix();
    await import('../../../../src/plugins/passive/ext/affix/_metadata/initialization.js');

    // patches the real RPG_*/Game_Event.prototype chain and JABS_AiManager stand-in directly.
    await import('../../../../src/plugins/passive/ext/affix/database/RPG_Enemy.js');
    await import('../../../../src/plugins/passive/ext/affix/database/RPG_State.js');
    await import('../../../../src/plugins/passive/ext/affix/managers/JABS_AiManager.js');
    await import('../../../../src/plugins/passive/ext/affix/managers/JABS_Battler.js');
    await import('../../../../src/plugins/passive/ext/affix/managers/JABS_Engine.js');
    await import('../../../../src/plugins/passive/ext/affix/objects/Game_Enemy.js');
    await import('../../../../src/plugins/passive/ext/affix/objects/Game_Event.js');
    await import('../../../../src/plugins/passive/ext/affix/scenes/Scene_Boot.js');
    await import('../../../../src/plugins/passive/ext/affix/sprites/Sprite_Character.js');

    ({ default: JPassiveAffix_PluginMetadata } = await import('../../../../src/plugins/passive/ext/affix/_metadata/_pluginMetadata.js'));
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

    it('returns empty for a falsy battler', () =>
    {
      // Act & Assert
      expect(globalThis.J.PASSIVE.EXT.AFFIX.Helpers.resolvePassiveTierStripeColorHex(null)).toBe('');
    });

    it('returns empty when the battler is not an enemy', () =>
    {
      // Arrange
      const battler = { isEnemy: () => false };

      // Act & Assert
      expect(globalThis.J.PASSIVE.EXT.AFFIX.Helpers.resolvePassiveTierStripeColorHex(battler)).toBe('');
    });

    it('returns empty when the battler has no passive states', () =>
    {
      // Arrange
      const battler = { isEnemy: () => true, getPassiveStateIds: () => [] };

      // Act & Assert
      expect(globalThis.J.PASSIVE.EXT.AFFIX.Helpers.resolvePassiveTierStripeColorHex(battler)).toBe('');
    });

    it('skips a null passive state entry and a non-prefix state before finding the prefix', () =>
    {
      // Arrange
      const nonPrefixState = Object.create(globalThis.RPG_State.prototype);
      nonPrefixState.id = 52;
      nonPrefixState.note = '';
      const prefixState = Object.create(globalThis.RPG_State.prototype);
      prefixState.id = 53;
      prefixState.note = '<enemy-prefix>\n<tier-color-hex:#112233>';
      const statesById = { 51: null, 52: nonPrefixState, 53: prefixState };
      const battler = {
        isEnemy: () => true,
        getPassiveStateIds: () => [ 51, 52, 53 ],
        state: (id) => statesById[id],
      };

      // Act & Assert
      expect(globalThis.J.PASSIVE.EXT.AFFIX.Helpers.resolvePassiveTierStripeColorHex(battler)).toBe('#112233');
    });
  });

  describe('J.PASSIVE.EXT.AFFIX.Helpers.findFirstEnemyPrefixState', () =>
  {
    it('finds nothing when the battler carries passives but none of them is a prefix', () =>
    {
      // Arrange
      const plainState = Object.create(globalThis.RPG_State.prototype);
      plainState.id = 60;
      plainState.note = '';
      plainState.name = 'Ordinary';
      const battler = {
        isEnemy: () => true,
        getPassiveStateIds: () => [ 60 ],
        state: (stateId) => (stateId === 60 ? plainState : null),
      };

      // Act
      const result = globalThis.J.PASSIVE.EXT.AFFIX.Helpers.findFirstEnemyPrefixState(battler);

      // Assert
      // walking the whole list without a prefix has to end in nothing, not in the last state looked
      // at- an ordinary enemy with ordinary passives has no tier presentation to speak of.
      expect(result).toBeNull();
    });

    it('skips passive ids that resolve to no state at all', () =>
    {
      // Arrange
      const prefixState = Object.create(globalThis.RPG_State.prototype);
      prefixState.id = 62;
      prefixState.note = '<enemy-prefix>';
      prefixState.name = 'Tier';
      const battler = {
        isEnemy: () => true,
        getPassiveStateIds: () => [ 61, 62 ],
        state: (stateId) => (stateId === 62 ? prefixState : null),
      };

      // Act
      const result = globalThis.J.PASSIVE.EXT.AFFIX.Helpers.findFirstEnemyPrefixState(battler);

      // Assert
      expect(result).toBe(prefixState);
    });
  });

  describe('J.PASSIVE.EXT.AFFIX.Helpers.resolvePassiveTierRank', () =>
  {
    it('returns 0 when the first prefix state has no tier tag', () =>
    {
      // Arrange
      const prefixState = Object.create(globalThis.RPG_State.prototype);
      prefixState.id = 60;
      prefixState.note = '<enemy-prefix>';
      prefixState.name = 'Tier';
      const battler = {
        isEnemy: () => true,
        getPassiveStateIds: () => [ 60 ],
        state: (stateId) => (stateId === 60 ? prefixState : null),
      };

      // Act
      const rank = globalThis.J.PASSIVE.EXT.AFFIX.Helpers.resolvePassiveTierRank(battler);

      // Assert
      expect(rank).toBe(0);
    });

    it('returns the tier when the prefix state defines affix-tier', () =>
    {
      // Arrange
      const prefixState = Object.create(globalThis.RPG_State.prototype);
      prefixState.id = 61;
      prefixState.note = '<enemy-prefix>\n<affix-tier:4>';
      prefixState.name = 'Tier';
      const battler = {
        isEnemy: () => true,
        getPassiveStateIds: () => [ 61 ],
        state: (stateId) => (stateId === 61 ? prefixState : null),
      };

      // Act
      const rank = globalThis.J.PASSIVE.EXT.AFFIX.Helpers.resolvePassiveTierRank(battler);

      // Assert
      expect(rank).toBe(4);
    });

    it('returns 0 for a falsy battler', () =>
    {
      // Act & Assert
      expect(globalThis.J.PASSIVE.EXT.AFFIX.Helpers.resolvePassiveTierRank(null)).toBe(0);
    });

    it('returns 0 when the battler is not an enemy', () =>
    {
      // Arrange
      const battler = { isEnemy: () => false };

      // Act & Assert
      expect(globalThis.J.PASSIVE.EXT.AFFIX.Helpers.resolvePassiveTierRank(battler)).toBe(0);
    });

    it('returns 0 when the battler has no passive states', () =>
    {
      // Arrange
      const battler = { isEnemy: () => true, getPassiveStateIds: () => [] };

      // Act & Assert
      expect(globalThis.J.PASSIVE.EXT.AFFIX.Helpers.resolvePassiveTierRank(battler)).toBe(0);
    });

    it('skips a null passive state entry and a non-prefix state before finding the prefix', () =>
    {
      // Arrange
      const nonPrefixState = Object.create(globalThis.RPG_State.prototype);
      nonPrefixState.id = 62;
      nonPrefixState.note = '';
      const prefixState = Object.create(globalThis.RPG_State.prototype);
      prefixState.id = 63;
      prefixState.note = '<enemy-prefix>\n<affix-tier:2>';
      const statesById = { 61: null, 62: nonPrefixState, 63: prefixState };
      const battler = {
        isEnemy: () => true,
        getPassiveStateIds: () => [ 61, 62, 63 ],
        state: (id) => statesById[id],
      };

      // Act & Assert
      expect(globalThis.J.PASSIVE.EXT.AFFIX.Helpers.resolvePassiveTierRank(battler)).toBe(2);
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

    it('falls back to the enemy note override when the event has none', () =>
    {
      // Arrange
      const enemyData = Object.create(globalThis.RPG_Enemy.prototype);
      enemyData.note = '<passive-affix-prefix-chance:20>';
      const ev = new globalThis.Game_Event();
      ev.getValidCommentCommands = () => [];

      // Act
      const chance = ev.getResolvedPassiveAffixPrefixChance(enemyData);

      // Assert
      expect(chance).toBe(20);
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

  describe('initializeStateAffixWeights / isAffixStateId', () =>
  {
    /** Builds a minimal $dataStates-shaped stub row. */
    function affixState(id, isEnemyPrefix, isEnemySuffix, affixWeight)
    {
      return {
        id, isEnemyPrefix, isEnemySuffix, affixWeight,
      };
    }

    it('sums prefix/suffix weights across $dataStates, skipping the null first entry', () =>
    {
      // Arrange- state 3 is both a prefix and a suffix; state 4 is neither.
      const prefixOnly = affixState(1, true, false, 10);
      const suffixOnly = affixState(2, false, true, 20);
      const both = affixState(3, true, true, 5);
      const neither = affixState(4, false, false, 100);
      globalThis.$dataStates = [ null, prefixOnly, suffixOnly, both, neither ];
      const metadata = buildCustomMetadata({});

      // Act
      metadata.initializeStateAffixWeights();

      // Assert
      expect(metadata.totalPrefixWeight).toBe(15);
      expect(metadata.totalSuffixWeight).toBe(25);
      expect(metadata.prefixMap).toEqual(new Map([ [ 1, 10 ], [ 3, 5 ] ]));
      expect(metadata.suffixMap).toEqual(new Map([ [ 2, 20 ], [ 3, 5 ] ]));
    });

    it('reports true for a prefix id, true for a suffix id, and false for an unrelated id', () =>
    {
      // Arrange
      globalThis.$dataStates = [ null, affixState(1, true, false, 10), affixState(2, false, true, 20) ];
      const metadata = buildCustomMetadata({});
      metadata.initializeStateAffixWeights();

      // Act & Assert
      expect(metadata.isAffixStateId(1)).toBe(true);
      expect(metadata.isAffixStateId(2)).toBe(true);
      expect(metadata.isAffixStateId(999)).toBe(false);
    });
  });

  describe('J.PASSIVE.EXT.AFFIX.Helpers.parseRewardMultipliers', () =>
  {
    it('returns an empty map when databaseData is falsy', () =>
    {
      // Act & Assert
      expect(globalThis.J.PASSIVE.EXT.AFFIX.Helpers.parseRewardMultipliers(null)).toEqual(new Map());
    });

    it('returns an empty map when the note is falsy', () =>
    {
      // Act & Assert
      expect(globalThis.J.PASSIVE.EXT.AFFIX.Helpers.parseRewardMultipliers({ note: '' })).toEqual(new Map());
    });

    it('parses reward multiplier tags into a map keyed by lowercased reward type', () =>
    {
      // Arrange
      const data = { note: '<rewardMultiplier:[EXP, 1.5]>\n<rewardMultiplier:[gold, 2]>' };

      // Act
      const result = globalThis.J.PASSIVE.EXT.AFFIX.Helpers.parseRewardMultipliers(data);

      // Assert
      expect(result).toEqual(new Map([ [ 'exp', 1.5 ], [ 'gold', 2 ] ]));
    });

    it('skips lines with no match', () =>
    {
      // Arrange
      const data = { note: 'an unrelated comment line\n<rewardMultiplier:[sdp, 3]>' };

      // Act
      const result = globalThis.J.PASSIVE.EXT.AFFIX.Helpers.parseRewardMultipliers(data);

      // Assert
      expect(result).toEqual(new Map([ [ 'sdp', 3 ] ]));
    });

    it('lets the last tag win when a reward type is duplicated', () =>
    {
      // Arrange
      const data = { note: '<rewardMultiplier:[exp, 1]>\n<rewardMultiplier:[exp, 2]>' };

      // Act
      const result = globalThis.J.PASSIVE.EXT.AFFIX.Helpers.parseRewardMultipliers(data);

      // Assert
      expect(result.get('exp')).toBe(2);
    });
  });

  describe('RPG_Enemy remaining getters', () =>
  {
    it('noRngPrefixes reads <no-rng-passive-prefixes>', () =>
    {
      // Arrange
      const enemy = Object.create(globalThis.RPG_Enemy.prototype);
      enemy.note = '<no-rng-passive-prefixes>';

      // Act & Assert
      expect(enemy.noRngPrefixes).toBe(true);
    });

    it('noRngSuffixes reads <no-rng-passive-suffixes>', () =>
    {
      // Arrange
      const enemy = Object.create(globalThis.RPG_Enemy.prototype);
      enemy.note = '<no-rng-passive-suffixes>';

      // Act & Assert
      expect(enemy.noRngSuffixes).toBe(true);
    });

    it('passiveAffixSuffixChance parses the tag', () =>
    {
      // Arrange
      const enemy = Object.create(globalThis.RPG_Enemy.prototype);
      enemy.note = '<passive-affix-suffix-chance:42>';

      // Act & Assert
      expect(enemy.passiveAffixSuffixChance).toBe(42);
    });

    it('passiveAffixSuffixChance is null when the tag is absent', () =>
    {
      // Arrange
      const enemy = Object.create(globalThis.RPG_Enemy.prototype);
      enemy.note = '';

      // Act & Assert
      expect(enemy.passiveAffixSuffixChance).toBe(null);
    });

    it('rewardMultipliers delegates to Helpers.parseRewardMultipliers', () =>
    {
      // Arrange
      const enemy = Object.create(globalThis.RPG_Enemy.prototype);
      enemy.note = '<rewardMultiplier:[gold, 3]>';

      // Act & Assert
      expect(enemy.rewardMultipliers).toEqual(new Map([ [ 'gold', 3 ] ]));
    });
  });

  describe('RPG_State remaining getters', () =>
  {
    it('isEnemySuffix reads <enemy-suffix>', () =>
    {
      // Arrange
      const state = Object.create(globalThis.RPG_State.prototype);
      state.note = '<enemy-suffix>';

      // Act & Assert
      expect(state.isEnemySuffix).toBe(true);
    });

    it('affixWeight parses the tag', () =>
    {
      // Arrange
      const state = Object.create(globalThis.RPG_State.prototype);
      state.note = '<affix-weight:5>';

      // Act & Assert
      expect(state.affixWeight).toBe(5);
    });

    it('affixWeight defaults to 100 when the tag is absent', () =>
    {
      // Arrange
      const state = Object.create(globalThis.RPG_State.prototype);
      state.note = '';

      // Act & Assert
      expect(state.affixWeight).toBe(100);
    });

    it('affixTier parses the tag', () =>
    {
      // Arrange
      const state = Object.create(globalThis.RPG_State.prototype);
      state.note = '<affix-tier:3>';

      // Act & Assert
      expect(state.affixTier).toBe(3);
    });

    it('affixTier defaults to 0 when the tag is absent', () =>
    {
      // Arrange
      const state = Object.create(globalThis.RPG_State.prototype);
      state.note = '';

      // Act & Assert
      expect(state.affixTier).toBe(0);
    });

    it('rewardMultipliers delegates to Helpers.parseRewardMultipliers', () =>
    {
      // Arrange
      const state = Object.create(globalThis.RPG_State.prototype);
      state.note = '<rewardMultiplier:[ap, 1.2]>';

      // Act & Assert
      expect(state.rewardMultipliers).toEqual(new Map([ [ 'ap', 1.2 ] ]));
    });
  });

  describe('JABS_AiManager.shouldBlockPassivePrefixRng remaining branches', () =>
  {
    it('blocks when only noRngPrefixes is set', () =>
    {
      // Arrange
      const enemyData = { noRngPassives: false, noRngPrefixes: true };
      const character = { eventCommentsDisablePassiveAffixPrefixRng: () => false };

      // Act & Assert
      expect(globalThis.JABS_AiManager.shouldBlockPassivePrefixRng(character, enemyData)).toBe(true);
    });

    it('blocks when the event comments disable prefix rng', () =>
    {
      // Arrange
      const enemyData = { noRngPassives: false, noRngPrefixes: false };
      const character = { eventCommentsDisablePassiveAffixPrefixRng: () => true };

      // Act & Assert
      expect(globalThis.JABS_AiManager.shouldBlockPassivePrefixRng(character, enemyData)).toBe(true);
    });
  });

  describe('JABS_AiManager.shouldBlockPassiveSuffixRng remaining branches', () =>
  {
    it('still allows suffix when only the slot tag is absent', () =>
    {
      // Arrange
      const enemyData = { noRngPassives: false, noRngSuffixes: false };
      const character = { eventCommentsDisablePassiveAffixSuffixRng: () => false };

      // Act & Assert
      expect(globalThis.JABS_AiManager.shouldBlockPassiveSuffixRng(character, enemyData)).toBe(false);
    });

    it('blocks when only noRngSuffixes is set', () =>
    {
      // Arrange
      const enemyData = { noRngPassives: false, noRngSuffixes: true };
      const character = { eventCommentsDisablePassiveAffixSuffixRng: () => false };

      // Act & Assert
      expect(globalThis.JABS_AiManager.shouldBlockPassiveSuffixRng(character, enemyData)).toBe(true);
    });

    it('blocks when the event comments disable suffix rng', () =>
    {
      // Arrange
      const enemyData = { noRngPassives: false, noRngSuffixes: false };
      const character = { eventCommentsDisablePassiveAffixSuffixRng: () => true };

      // Act & Assert
      expect(globalThis.JABS_AiManager.shouldBlockPassiveSuffixRng(character, enemyData)).toBe(true);
    });
  });

  describe('JABS_AiManager.postConvertMutate', () =>
  {
    /** Builds a minimal character (spawning map event) stub. */
    function buildCharacter(overrides = {})
    {
      return {
        getPassiveStateIds: () => [],
        eventCommentsDisablePassiveAffixPrefixRng: () => false,
        eventCommentsDisablePassiveAffixSuffixRng: () => false,
        getResolvedPassiveAffixPrefixChance: () => 0,
        getResolvedPassiveAffixSuffixChance: () => 0,
        ...overrides,
      };
    }

    /** Builds a minimal battler stub. */
    function buildBattler(overrides = {})
    {
      return {
        enemy: () => ({}),
        addPassiveStateExternalSourceByStateIds: vi.fn(),
        ...overrides,
      };
    }

    beforeEach(() =>
    {
      // reset the shared metadata's affix pools before every scenario in this block.
      globalThis.J.PASSIVE.EXT.AFFIX.Metadata.prefixMap = new Map();
      globalThis.J.PASSIVE.EXT.AFFIX.Metadata.totalPrefixWeight = 0;
      globalThis.J.PASSIVE.EXT.AFFIX.Metadata.suffixMap = new Map();
      globalThis.J.PASSIVE.EXT.AFFIX.Metadata.totalSuffixWeight = 0;
    });

    it('adds explicit affix-tagged passives and skips the RNG pass entirely', () =>
    {
      // Arrange- state 1 is a registered affix id, so the explicit-affix short-circuit fires.
      globalThis.J.PASSIVE.EXT.AFFIX.Metadata.prefixMap = new Map([ [ 1, 10 ] ]);
      globalThis.J.PASSIVE.EXT.AFFIX.Metadata.totalPrefixWeight = 10;
      const character = buildCharacter({ getPassiveStateIds: () => [ 1 ] });
      const battler = buildBattler();
      const jabsBattler = { getCharacter: () => character };

      // Act
      globalThis.JABS_AiManager.postConvertMutate(battler, jabsBattler);

      // Assert- the enemy data is never even consulted once the explicit-affix path is taken.
      expect(battler.addPassiveStateExternalSourceByStateIds).toHaveBeenCalledWith([ 1 ]);
    });

    it('falls through to the RNG pass when there are no explicit passives at all', () =>
    {
      // Arrange
      const character = buildCharacter();
      const battler = buildBattler();
      const jabsBattler = { getCharacter: () => character };

      // Act
      globalThis.JABS_AiManager.postConvertMutate(battler, jabsBattler);

      // Assert- with 0% chances and empty pools, no ids get pushed onto the (empty) list.
      expect(battler.addPassiveStateExternalSourceByStateIds).toHaveBeenCalledWith([]);
    });

    it('falls through to the RNG pass when explicit passives carry no affix ids', () =>
    {
      // Arrange- state 1 is explicit but not registered in either affix pool.
      const character = buildCharacter({ getPassiveStateIds: () => [ 1 ] });
      const battler = buildBattler();
      const jabsBattler = { getCharacter: () => character };

      // Act
      globalThis.JABS_AiManager.postConvertMutate(battler, jabsBattler);

      // Assert- the non-affix explicit id rides along into the RNG-pass call.
      expect(battler.addPassiveStateExternalSourceByStateIds).toHaveBeenCalledWith([ 1 ]);
    });

    it('rolls in both a prefix and a suffix when neither roll is blocked and both pools produce a choice', () =>
    {
      // Arrange- single-entry pools with weight equal to the total always produce that entry.
      globalThis.J.PASSIVE.EXT.AFFIX.Metadata.prefixMap = new Map([ [ 10, 5 ] ]);
      globalThis.J.PASSIVE.EXT.AFFIX.Metadata.totalPrefixWeight = 5;
      globalThis.J.PASSIVE.EXT.AFFIX.Metadata.suffixMap = new Map([ [ 20, 5 ] ]);
      globalThis.J.PASSIVE.EXT.AFFIX.Metadata.totalSuffixWeight = 5;
      const character = buildCharacter({
        getResolvedPassiveAffixPrefixChance: () => 100,
        getResolvedPassiveAffixSuffixChance: () => 100,
      });
      const battler = buildBattler();
      const jabsBattler = { getCharacter: () => character };

      // Act
      globalThis.JABS_AiManager.postConvertMutate(battler, jabsBattler);

      // Assert
      expect(battler.addPassiveStateExternalSourceByStateIds).toHaveBeenCalledWith([ 10, 20 ]);
    });

    it('does not push a prefix when the prefix roll is blocked, even at 100% chance', () =>
    {
      // Arrange
      globalThis.J.PASSIVE.EXT.AFFIX.Metadata.prefixMap = new Map([ [ 10, 5 ] ]);
      globalThis.J.PASSIVE.EXT.AFFIX.Metadata.totalPrefixWeight = 5;
      const character = buildCharacter({
        eventCommentsDisablePassiveAffixPrefixRng: () => true,
        getResolvedPassiveAffixPrefixChance: () => 100,
      });
      const battler = buildBattler();
      const jabsBattler = { getCharacter: () => character };

      // Act
      globalThis.JABS_AiManager.postConvertMutate(battler, jabsBattler);

      // Assert
      expect(battler.addPassiveStateExternalSourceByStateIds).toHaveBeenCalledWith([]);
    });

    it('does not push a suffix when the suffix roll fails at 0% chance', () =>
    {
      // Arrange
      globalThis.J.PASSIVE.EXT.AFFIX.Metadata.suffixMap = new Map([ [ 20, 5 ] ]);
      globalThis.J.PASSIVE.EXT.AFFIX.Metadata.totalSuffixWeight = 5;
      const character = buildCharacter({ getResolvedPassiveAffixSuffixChance: () => 0 });
      const battler = buildBattler();
      const jabsBattler = { getCharacter: () => character };

      // Act
      globalThis.JABS_AiManager.postConvertMutate(battler, jabsBattler);

      // Assert
      expect(battler.addPassiveStateExternalSourceByStateIds).toHaveBeenCalledWith([]);
    });

    it('does not push a prefix when the roll succeeds but the (empty) pool produces no choice', () =>
    {
      // Arrange- totalPrefixWeight stays 0 from beforeEach, so weightedMapChoice short-circuits to null.
      const character = buildCharacter({ getResolvedPassiveAffixPrefixChance: () => 100 });
      const battler = buildBattler();
      const jabsBattler = { getCharacter: () => character };

      // Act
      globalThis.JABS_AiManager.postConvertMutate(battler, jabsBattler);

      // Assert
      expect(battler.addPassiveStateExternalSourceByStateIds).toHaveBeenCalledWith([]);
    });

    it('does not push a suffix when the roll succeeds but the (empty) pool produces no choice', () =>
    {
      // Arrange- totalSuffixWeight stays 0 from beforeEach, so weightedMapChoice short-circuits to null.
      const character = buildCharacter({ getResolvedPassiveAffixSuffixChance: () => 100 });
      const battler = buildBattler();
      const jabsBattler = { getCharacter: () => character };

      // Act
      globalThis.JABS_AiManager.postConvertMutate(battler, jabsBattler);

      // Assert
      expect(battler.addPassiveStateExternalSourceByStateIds).toHaveBeenCalledWith([]);
    });
  });

  describe('JABS_Engine reward multiplier extensions', () =>
  {
    it('rounds experience up after applying the exp reward multiplier', () =>
    {
      // Arrange
      const engine = Object.create(globalThis.JABS_Engine.prototype);
      const defeatedEnemy = { getRewardMultiplierByType: () => 1.5 };
      globalThis.J.PASSIVE.EXT.AFFIX.Aliased.JABS_Engine.set('determineExperienceGained', () => 10);

      // Act
      const result = engine.determineExperienceGained(defeatedEnemy, {});

      // Assert
      expect(result).toBe(15);
    });

    it('rounds gold up after applying the gold reward multiplier', () =>
    {
      // Arrange
      const engine = Object.create(globalThis.JABS_Engine.prototype);
      const defeatedEnemy = { getRewardMultiplierByType: () => 1.2 };
      globalThis.J.PASSIVE.EXT.AFFIX.Aliased.JABS_Engine.set('determineGoldGained', () => 10);

      // Act
      const result = engine.determineGoldGained(defeatedEnemy, {});

      // Assert- 10 * 1.2 = 12 exactly, still exercises the ceil call.
      expect(result).toBe(12);
    });

    it('rounds sdp up after applying the sdp reward multiplier', () =>
    {
      // Arrange
      const engine = Object.create(globalThis.JABS_Engine.prototype);
      const defeatedEnemy = { getRewardMultiplierByType: () => 1.15 };
      globalThis.J.PASSIVE.EXT.AFFIX.Aliased.JABS_Engine.set('determineSdpGained', () => 10);

      // Act
      const result = engine.determineSdpGained(defeatedEnemy, {});

      // Assert- 10 * 1.15 = 11.5, ceil rounds it up to 12.
      expect(result).toBe(12);
    });

    it('rounds ap up after applying the ap reward multiplier', () =>
    {
      // Arrange
      const engine = Object.create(globalThis.JABS_Engine.prototype);
      const defeatedEnemy = { getRewardMultiplierByType: () => 2 };
      globalThis.J.PASSIVE.EXT.AFFIX.Aliased.JABS_Engine.set('determineApGained', () => 5);

      // Act
      const result = engine.determineApGained(defeatedEnemy);

      // Assert
      expect(result).toBe(10);
    });
  });

  describe('Game_Enemy reward multiplier extensions', () =>
  {
    /** Builds a minimal Game_Enemy stub backed by the given enemy row and active states. */
    function buildGameEnemy(enemyRow, states = [])
    {
      const enemy = Object.create(globalThis.Game_Enemy.prototype);
      enemy.enemy = () => enemyRow;
      enemy.allStates = () => states;
      return enemy;
    }

    describe('getRewardMultiplierByType', () =>
    {
      it('returns the neutral 1.0 multiplier when nothing tags this reward type', () =>
      {
        // Arrange
        const enemy = buildGameEnemy({ rewardMultipliers: new Map() });

        // Act & Assert
        expect(enemy.getRewardMultiplierByType('exp')).toBe(1.0);
      });

      it('applies the enemy note multiplier alone', () =>
      {
        // Arrange
        const enemy = buildGameEnemy({ rewardMultipliers: new Map([ [ 'exp', 2 ] ]) });

        // Act & Assert
        expect(enemy.getRewardMultiplierByType('exp')).toBe(2);
      });

      it('stacks the enemy note multiplier multiplicatively with matching state multipliers', () =>
      {
        // Arrange
        const state = { rewardMultipliers: new Map([ [ 'gold', 1.5 ] ]) };
        const enemy = buildGameEnemy({ rewardMultipliers: new Map([ [ 'gold', 2 ] ]) }, [ state ]);

        // Act & Assert
        expect(enemy.getRewardMultiplierByType('gold')).toBe(3);
      });

      it('ignores a state whose reward multipliers do not include this reward type', () =>
      {
        // Arrange
        const state = { rewardMultipliers: new Map([ [ 'sdp', 5 ] ]) };
        const enemy = buildGameEnemy({ rewardMultipliers: new Map() }, [ state ]);

        // Act & Assert
        expect(enemy.getRewardMultiplierByType('gold')).toBe(1.0);
      });
    });

    describe('getDropMultiplierBonus', () =>
    {
      it('multiplies the base drop bonus by the drops reward multiplier', () =>
      {
        // Arrange
        const enemy = buildGameEnemy({ rewardMultipliers: new Map([ [ 'drops', 2 ] ]) });
        globalThis.J.PASSIVE.EXT.AFFIX.Aliased.Game_Enemy.set('getDropMultiplierBonus', () => 1.5);

        // Act
        const result = enemy.getDropMultiplierBonus();

        // Assert
        expect(result).toBe(3);
      });
    });
  });

  describe('Game_Event remaining methods', () =>
  {
    it('getPassiveAffixPrefixChanceFromEventComments returns null when no comment matches', () =>
    {
      // Arrange
      const ev = new globalThis.Game_Event();
      ev.getValidCommentCommands = () => [ { parameters: [ 'unrelated comment' ] } ];

      // Act & Assert
      expect(ev.getPassiveAffixPrefixChanceFromEventComments()).toBe(null);
    });

    it('getPassiveAffixSuffixChanceFromEventComments reads the last matching tag', () =>
    {
      // Arrange
      const ev = new globalThis.Game_Event();
      ev.getValidCommentCommands = () => [
        { parameters: [ 'unrelated comment' ] },
        { parameters: [ '<passive-affix-suffix-chance:15>' ] },
        { parameters: [ '<passive-affix-suffix-chance:30>' ] },
      ];

      // Act & Assert
      expect(ev.getPassiveAffixSuffixChanceFromEventComments()).toBe(30);
    });

    it('getPassiveAffixSuffixChanceFromEventComments returns null when no comment matches', () =>
    {
      // Arrange
      const ev = new globalThis.Game_Event();
      ev.getValidCommentCommands = () => [];

      // Act & Assert
      expect(ev.getPassiveAffixSuffixChanceFromEventComments()).toBe(null);
    });

    it('eventCommentsDisablePassiveAffixPrefixRng is true for the combined master switch tag', () =>
    {
      // Arrange
      const ev = new globalThis.Game_Event();
      ev.getValidCommentCommands = () => [ { parameters: [ '<no-rng-passives>' ] } ];

      // Act & Assert
      expect(ev.eventCommentsDisablePassiveAffixPrefixRng()).toBe(true);
    });

    it('eventCommentsDisablePassiveAffixPrefixRng is true for the slot-specific tag', () =>
    {
      // Arrange
      const ev = new globalThis.Game_Event();
      ev.getValidCommentCommands = () => [ { parameters: [ '<no-rng-passive-prefixes>' ] } ];

      // Act & Assert
      expect(ev.eventCommentsDisablePassiveAffixPrefixRng()).toBe(true);
    });

    it('eventCommentsDisablePassiveAffixPrefixRng is false when no blocking comment is present', () =>
    {
      // Arrange
      const ev = new globalThis.Game_Event();
      ev.getValidCommentCommands = () => [ { parameters: [ 'unrelated comment' ] } ];

      // Act & Assert
      expect(ev.eventCommentsDisablePassiveAffixPrefixRng()).toBe(false);
    });

    it('eventCommentsDisablePassiveAffixSuffixRng is true for the combined master switch tag', () =>
    {
      // Arrange
      const ev = new globalThis.Game_Event();
      ev.getValidCommentCommands = () => [ { parameters: [ '<no-rng-passives>' ] } ];

      // Act & Assert
      expect(ev.eventCommentsDisablePassiveAffixSuffixRng()).toBe(true);
    });

    it('eventCommentsDisablePassiveAffixSuffixRng is true for the slot-specific tag', () =>
    {
      // Arrange
      const ev = new globalThis.Game_Event();
      ev.getValidCommentCommands = () => [ { parameters: [ '<no-rng-passive-suffixes>' ] } ];

      // Act & Assert
      expect(ev.eventCommentsDisablePassiveAffixSuffixRng()).toBe(true);
    });

    it('eventCommentsDisablePassiveAffixSuffixRng is false when no blocking comment is present', () =>
    {
      // Arrange
      const ev = new globalThis.Game_Event();
      ev.getValidCommentCommands = () => [ { parameters: [ 'unrelated comment' ] } ];

      // Act & Assert
      expect(ev.eventCommentsDisablePassiveAffixSuffixRng()).toBe(false);
    });

    describe('getResolvedPassiveAffixSuffixChance', () =>
    {
      it('prefers the event comment override over the enemy note', () =>
      {
        // Arrange
        const enemyData = Object.create(globalThis.RPG_Enemy.prototype);
        enemyData.note = '<passive-affix-suffix-chance:10>';
        const ev = new globalThis.Game_Event();
        ev.getValidCommentCommands = () => [ { parameters: [ '<passive-affix-suffix-chance:40>' ] } ];

        // Act & Assert
        expect(ev.getResolvedPassiveAffixSuffixChance(enemyData)).toBe(40);
      });

      it('falls back to the enemy note override when the event has none', () =>
      {
        // Arrange
        const enemyData = Object.create(globalThis.RPG_Enemy.prototype);
        enemyData.note = '<passive-affix-suffix-chance:25>';
        const ev = new globalThis.Game_Event();
        ev.getValidCommentCommands = () => [];

        // Act & Assert
        expect(ev.getResolvedPassiveAffixSuffixChance(enemyData)).toBe(25);
      });

      it('falls back to the metadata default when no overrides apply', () =>
      {
        // Arrange
        const enemyData = Object.create(globalThis.RPG_Enemy.prototype);
        enemyData.note = '';
        const ev = new globalThis.Game_Event();
        ev.getValidCommentCommands = () => [];

        // Act & Assert
        expect(ev.getResolvedPassiveAffixSuffixChance(enemyData)).toBe(33);
      });
    });
  });

  describe('JABS_Battler (with J.HUD.EXT.TARGET present)', () =>
  {
    let savedJHud;

    beforeAll(async () =>
    {
      // this file's own guard (`if (J.HUD && J.HUD.EXT.TARGET)`) only patches the prototype when
      // J-HUD's target extension is present- flip that on and re-run the module fresh.
      savedJHud = globalThis.J.HUD;
      globalThis.J.HUD = { EXT: { TARGET: true } };
      globalThis.ColorManager.isValidHexColor = (hex) => typeof hex === 'string' && hex.length > 0;
      globalThis.ColorManager.colorIndexFromHex = (hex) => (hex ? 7 : null);
      globalThis.Window_Base.prototype.colorizeText = (colorIndex, text) => `\\C[${colorIndex}]${text}\\C[0]`;

      vi.resetModules();
      await import('../../../../src/plugins/passive/ext/affix/managers/JABS_Battler.js');
    });

    afterAll(() =>
    {
      globalThis.J.HUD = savedJHud;
    });

    /** Builds a minimal prefix/suffix-capable RPG_State-shaped stub. */
    function tierState(overrides = {})
    {
      return {
        isEnemyPrefix: false,
        isEnemySuffix: false,
        iconIndex: 0,
        tierColorHex: null,
        name: 'Tier',
        ...overrides,
      };
    }

    /** Builds a minimal enemy battler backing a JABS_Battler-shaped lastHit stub. */
    function buildLastHit(overrides = {})
    {
      return {
        isEnemy: () => true,
        getBattler: () => overrides.battler,
        ...overrides,
      };
    }

    describe('buildFramedTarget', () =>
    {
      it('applies the tier stripe color to the framed target name when the stripe hex is valid', () =>
      {
        // Arrange
        const prefixState = tierState({ isEnemyPrefix: true, tierColorHex: '#aabbcc' });
        const battler = {
          isEnemy: () => true,
          getPassiveStateIds: () => [ 1 ],
          state: () => prefixState,
        };
        const battlerLastHit = buildLastHit({ battler });

        // Act
        const jabsBattlerInstance = Object.create(globalThis.JABS_Battler.prototype);
        const framedTarget = globalThis.JABS_Battler.prototype.buildFramedTarget
          .call(jabsBattlerInstance, battlerLastHit);

        // Assert
        expect(framedTarget.nameColorHex).toBe('#aabbcc');
      });

      it('does not set a name color when the resolved stripe hex is empty', () =>
      {
        // Arrange- no passive states at all, so resolvePassiveTierStripeColorHex resolves to empty.
        const battler = { isEnemy: () => true, getPassiveStateIds: () => [] };
        const battlerLastHit = buildLastHit({ battler });

        // Act
        const jabsBattlerInstance = Object.create(globalThis.JABS_Battler.prototype);
        const framedTarget = globalThis.JABS_Battler.prototype.buildFramedTarget
          .call(jabsBattlerInstance, battlerLastHit);

        // Assert
        expect(framedTarget.nameColorHex).toBeUndefined();
      });
    });

    describe('applyPassiveTierTargetFrameDecoration', () =>
    {
      it('does nothing when the last-hit target is not an enemy', () =>
      {
        // Arrange
        const framedTarget = { name: 'Slime' };
        const battlerLastHit = { isEnemy: () => false };

        // Act
        globalThis.JABS_Battler.prototype.applyPassiveTierTargetFrameDecoration
          .call({}, framedTarget, battlerLastHit);

        // Assert
        expect(framedTarget.name).toBe('Slime');
      });

      it('does nothing when the battler has no passive states', () =>
      {
        // Arrange
        const framedTarget = { name: 'Slime' };
        const battler = { getPassiveStateIds: () => [] };
        const battlerLastHit = buildLastHit({ battler });

        // Act
        globalThis.JABS_Battler.prototype.applyPassiveTierTargetFrameDecoration
          .call({}, framedTarget, battlerLastHit);

        // Assert
        expect(framedTarget.name).toBe('Slime');
      });

      it('does nothing when none of the passive states are prefix/suffix affixes', () =>
      {
        // Arrange
        const framedTarget = { name: 'Slime' };
        const plainState = tierState();
        const battler = {
          getPassiveStateIds: () => [ 1 ],
          state: () => plainState,
        };
        const battlerLastHit = buildLastHit({ battler });

        // Act
        globalThis.JABS_Battler.prototype.applyPassiveTierTargetFrameDecoration
          .call({}, framedTarget, battlerLastHit);

        // Assert
        expect(framedTarget.name).toBe('Slime');
      });

      it('prepends the prefix name and icon, ignoring a null passive state entry along the way', () =>
      {
        // Arrange
        const prefixState = tierState({ isEnemyPrefix: true, iconIndex: 5, name: 'Fierce' });
        const battler = {
          getPassiveStateIds: () => [ 1, 2 ],
          state: (id) => (id === 1 ? null : prefixState),
        };
        const battlerLastHit = buildLastHit({ battler });
        const framedTarget = { name: 'Slime' };

        // Act
        globalThis.JABS_Battler.prototype.applyPassiveTierTargetFrameDecoration
          .call({}, framedTarget, battlerLastHit);

        // Assert
        expect(framedTarget.name).toBe('\\I[5]Fierce Slime');
      });

      it('appends the suffix name and icon after the enemy label', () =>
      {
        // Arrange
        const suffixState = tierState({ isEnemySuffix: true, iconIndex: 6, name: 'Doom' });
        const battler = {
          getPassiveStateIds: () => [ 1 ],
          state: () => suffixState,
        };
        const battlerLastHit = buildLastHit({ battler });
        const framedTarget = { name: 'Slime' };

        // Act
        globalThis.JABS_Battler.prototype.applyPassiveTierTargetFrameDecoration
          .call({}, framedTarget, battlerLastHit);

        // Assert
        expect(framedTarget.name).toBe('\\I[6]Slime of Doom');
      });

      it('applies both a prefix and a suffix, stopping the scan once both slots are filled', () =>
      {
        // Arrange- a third state would fill a would-be second prefix, but the scan should
        // already have broken out by then.
        const prefixState = tierState({ isEnemyPrefix: true, iconIndex: 5, name: 'Fierce' });
        const suffixState = tierState({ isEnemySuffix: true, iconIndex: 6, name: 'Doom' });
        const extraPrefixState = tierState({ isEnemyPrefix: true, iconIndex: 9, name: 'Unused' });
        const statesById = { 1: prefixState, 2: suffixState, 3: extraPrefixState };
        const battler = {
          getPassiveStateIds: () => [ 1, 2, 3 ],
          state: (id) => statesById[id],
        };
        const battlerLastHit = buildLastHit({ battler });
        const framedTarget = { name: 'Slime' };

        // Act
        globalThis.JABS_Battler.prototype.applyPassiveTierTargetFrameDecoration
          .call({}, framedTarget, battlerLastHit);

        // Assert
        expect(framedTarget.name).toBe('\\I[5]\\I[6]Fierce Slime of Doom');
      });

      it('colorizes the label when J.MESSAGE is present and the prefix defines a tier hex', () =>
      {
        // Arrange
        const savedMessage = globalThis.J.MESSAGE;
        globalThis.J.MESSAGE = {};
        const prefixState = tierState({
          isEnemyPrefix: true, iconIndex: 5, name: 'Fierce', tierColorHex: '#aabbcc',
        });
        const battler = {
          getPassiveStateIds: () => [ 1 ],
          state: () => prefixState,
        };
        const battlerLastHit = buildLastHit({ battler });
        const framedTarget = { name: 'Slime' };

        // Act
        globalThis.JABS_Battler.prototype.applyPassiveTierTargetFrameDecoration
          .call({}, framedTarget, battlerLastHit);

        // Assert
        expect(framedTarget.name).toBe('\\I[5]\\C[7]Fierce Slime\\C[0]');

        // Cleanup
        globalThis.J.MESSAGE = savedMessage;
      });

      it('does not colorize the label when the prefix defines no tier hex, even with J.MESSAGE present', () =>
      {
        // Arrange
        const savedMessage = globalThis.J.MESSAGE;
        globalThis.J.MESSAGE = {};
        const prefixState = tierState({ isEnemyPrefix: true, iconIndex: 5, name: 'Fierce', tierColorHex: null });
        const battler = {
          getPassiveStateIds: () => [ 1 ],
          state: () => prefixState,
        };
        const battlerLastHit = buildLastHit({ battler });
        const framedTarget = { name: 'Slime' };

        // Act
        globalThis.JABS_Battler.prototype.applyPassiveTierTargetFrameDecoration
          .call({}, framedTarget, battlerLastHit);

        // Assert
        expect(framedTarget.name).toBe('\\I[5]Fierce Slime');

        // Cleanup
        globalThis.J.MESSAGE = savedMessage;
      });
    });
  });
});
//endregion plugins/passive/_component/j-passive-affix.test.js

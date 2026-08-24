//region plugins/diff/ext/affix/__models/difficulty-metadata.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { installDiffAffixHostGlobals } from '../fixtures/install-diff-affix-host-globals.js';

/**
 * This extension has no constructor of its own to seed a field in - J-Difficulty builds every layer
 * before this ship's script is evaluated - so the cold value has to come off the prototype. What is
 * tested here is that it actually does, because a layer answering `undefined` instead of `null`
 * would pass straight through every `!== null` check downstream.
 */
describe('DifficultyMetadata affix augment (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installDiffAffixHostGlobals();

    await import('../../../../../../src/plugins/diff/ext/affix/__models/DifficultyMetadata.js');
  });

  it('answers null for a layer nothing decorated', () =>
  {
    // Arrange- Object.create rather than a constructor call, matching how J-Difficulty's own decode
    // path builds these and proving the default really is on the prototype.
    const layer = Object.create(globalThis.DifficultyMetadata.prototype);

    // Act & Assert
    expect(layer.getAffixEffects()).toBe(null);
  });

  it('answers with the effects it was given', () =>
  {
    // Arrange
    const layer = Object.create(globalThis.DifficultyMetadata.prototype);
    const effects = { prefixChance: 150 };

    // Act
    layer.setAffixEffects(effects);

    // Assert
    expect(layer.getAffixEffects()).toBe(effects);
  });

  it('keeps each layer\'s effects to itself', () =>
  {
    // Arrange- the near-miss: a second layer that must stay cold while the first is decorated.
    // A default assigned to the prototype rather than the instance would fail exactly here.
    const decorated = Object.create(globalThis.DifficultyMetadata.prototype);
    const untouched = Object.create(globalThis.DifficultyMetadata.prototype);

    // Act
    decorated.setAffixEffects({ prefixChance: 150 });

    // Assert
    expect(decorated.getAffixEffects().prefixChance).toBe(150);
    expect(untouched.getAffixEffects()).toBe(null);
  });
});
//endregion plugins/diff/ext/affix/__models/difficulty-metadata.test.js
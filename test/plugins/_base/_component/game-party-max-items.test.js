//region plugins/_base/_component/game-party-max-items.test.js
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { installJabsOnChanceEffectGlobalStub } from './fixtures/install-jabs-onchance-stub.js';
import { installJBaseHostGlobals } from './fixtures/install-j-base-host-globals.js';

describe('Game_Party.maxItems <max:VALUE> tag (direct src import)', () =>
{
  let RPGManager;

  beforeAll(async () =>
  {
    // fresh module registry so re-running this file doesn't double-apply J.BASE setup.
    vi.resetModules();

    installJBaseHostGlobals();

    // getOnChanceEffectsFromDatabaseObject() instantiates JABS_OnChanceEffect, which lives in JABS, not J-Base.
    installJabsOnChanceEffectGlobalStub(globalThis);

    // real production code- sets up J.BASE.RegExp.MaxItems and J.BASE.Aliased maps.
    await import('../../../../src/plugins/_base/_metadata/initialization.js');

    ({ default: RPGManager } = await import('../../../../src/plugins/_base/managers/RPGManager.js'));
    globalThis.RPGManager = RPGManager;

    // patches globalThis.Game_Party.prototype directly, no vm involved.
    await import('../../../../src/plugins/_base/objects/Game_Party.js');
  });

  afterAll(() =>
  {
    RPGManager.clearCache();
    vi.unstubAllGlobals();
  });

  beforeEach(() =>
  {
    RPGManager.clearCache();
  });

  function buildParty()
  {
    return {
      defaultMaxItems: globalThis.Game_Party.prototype.defaultMaxItems,
      maxItems: globalThis.Game_Party.prototype.maxItems,
    };
  }

  it('parses a documented <max:VALUE> tag instead of falling through to the default', () =>
  {
    // Arrange
    const party = buildParty();
    const item = { note: '<max:15>' };

    // Act
    const result = party.maxItems(item);

    // Assert
    expect(result).toBe(15);
  });

  it('falls back to the default max when the item carries no <max:VALUE> tag', () =>
  {
    // Arrange
    const party = buildParty();
    const item = { note: '' };

    // Act
    const result = party.maxItems(item);

    // Assert
    expect(result).toBe(party.defaultMaxItems());
  });

  it('returns the default max when no item is provided', () =>
  {
    // Arrange
    const party = buildParty();

    // Act
    const result = party.maxItems();

    // Assert
    expect(result).toBe(party.defaultMaxItems());
  });
});
//endregion plugins/_base/_component/game-party-max-items.test.js

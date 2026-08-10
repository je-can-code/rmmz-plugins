//region plugins/__ca-mods/_component/jabs-battler.test.js
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import PluginMetadata from '../../../../src/plugins/_base/core/models/PluginMetadata.js';

describe('CAMods JABS_Battler.getTargetFrameText (direct src import, hand-rolled JABS stand-in)', () =>
{
  /** @type {import('vitest').Mock} */
  let originalGetTargetFrameText;

  beforeAll(async () =>
  {
    // JABS_Battler is a real ES class from the (separately-bundled) J-ABS plugin; by ship time it's
    // a bare global, same rationale as jabs-engine.test.js.
    originalGetTargetFrameText = vi.fn(() => String.empty);

    function JABS_Battler() {}

    JABS_Battler.prototype.getTargetFrameText = originalGetTargetFrameText;

    globalThis.JABS_Battler = JABS_Battler;

    globalThis.PluginManager = { parameters: () => '[]' };
    globalThis.PluginMetadata = PluginMetadata;
    globalThis.__PLUGIN_NAME__ = 'Test-Plugin';
    globalThis.__PLUGIN_VERSION__ = '0.0.0-test';

    // J-Base first- gives us String.empty, read by both this file and the patch under test.
    await import('../../../../src/plugins/_base/core/_metadata/initialization.js');
    await import('../../../../src/plugins/__ca-mods/core/_metadata/initialization.js');

    // the file under test- aliases and extends the stand-in getTargetFrameText() above.
    await import('../../../../src/plugins/__ca-mods/core/_models/JABS_Battler.js');
  });

  afterAll(() =>
  {
    delete globalThis.JABS_Battler;
    delete globalThis.PluginManager;
    delete globalThis.PluginMetadata;
    delete globalThis.__PLUGIN_NAME__;
    delete globalThis.__PLUGIN_VERSION__;
    delete globalThis.J;
  });

  /**
   * Builds a battler reporting the given elemental rates for the four CA "xTrait" element ids
   * (21 armed, 22 flying, 23 shielded, 24 aura). Unlisted ids default to a rate of 1 (no trait).
   * @param {Record<number, number>} rates
   * @returns {object}
   */
  function buildBattler(rates)
  {
    return { elementRate: elementId => rates[elementId] ?? 1 };
  }

  it('returns the original text unchanged when the original logic already produced text', () =>
  {
    originalGetTargetFrameText.mockReturnValueOnce('Boss');

    const jabsBattler = new globalThis.JABS_Battler();
    jabsBattler.getBattler = () => buildBattler({});

    expect(jabsBattler.getTargetFrameText()).toBe('Boss');
  });

  it('returns an empty string when the original text is empty and the battler has no CA traits', () =>
  {
    const jabsBattler = new globalThis.JABS_Battler();
    jabsBattler.getBattler = () => buildBattler({});

    expect(jabsBattler.getTargetFrameText()).toBe(String.empty);
  });

  it('includes only the present trait labels for a partial trait set', () =>
  {
    // hasNoTraits uses `.some(trait => !!trait)`, so the early-return only fires when NONE of the
    // four traits are present- a battler with some but not all traits reaches the per-trait
    // `traits.push(...)` block below it and gets text for just the traits it actually has.
    const jabsBattler = new globalThis.JABS_Battler();
    jabsBattler.getBattler = () => buildBattler({ 21: 1.5, 22: 1, 23: 1, 24: 2 });

    expect(jabsBattler.getTargetFrameText()).toBe('Weaponized, Aural');
  });

  it('includes all four trait labels when every CA element rate is above 1', () =>
  {
    const jabsBattler = new globalThis.JABS_Battler();
    jabsBattler.getBattler = () => buildBattler({ 21: 2, 22: 2, 23: 2, 24: 2 });

    expect(jabsBattler.getTargetFrameText()).toBe('Weaponized, Flying, Shielded, Aural');
  });

  it('omits the weaponized label for a battler carrying every trait except that one', () =>
  {
    // Arrange- the four traits are read from four separate element rates, and a label that ignored
    // its own rate would show on every enemy that had any trait at all.
    const jabsBattler = new globalThis.JABS_Battler();
    jabsBattler.getBattler = () => buildBattler({ 21: 1, 22: 2, 23: 2, 24: 2 });

    // Act & Assert
    expect(jabsBattler.getTargetFrameText()).toBe('Flying, Shielded, Aural');
  });

  it('omits the aural label for a battler carrying every trait except that one', () =>
  {
    // Arrange
    const jabsBattler = new globalThis.JABS_Battler();
    jabsBattler.getBattler = () => buildBattler({ 21: 2, 22: 2, 23: 2, 24: 1 });

    // Act & Assert
    expect(jabsBattler.getTargetFrameText()).toBe('Weaponized, Flying, Shielded');
  });
});
//endregion plugins/__ca-mods/_component/jabs-battler.test.js

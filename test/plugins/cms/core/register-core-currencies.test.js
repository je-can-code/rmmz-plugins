//region plugins/cms/core/register-core-currencies.test.js
import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Gold is registered with the currency strip through the same door everything else uses. It could have
 * been drawn directly by the strip and saved a few lines, but then gold would be the one currency the
 * window knew by name- and the next thing added would have had to argue for a seam that ought to have
 * existed already. These tests pin that gold really does go through the door.
 *
 * The registration happens at module scope, so the import lives inside the helper below rather than at
 * the top of the file: hoisting it would run the registration once against whichever realm existed
 * first, and every test after that would be reading a stale result.
 */
describe('registerCoreCurrencies', () =>
{
  beforeEach(() =>
  {
    vi.resetModules();

    globalThis.String.empty ??= '';

    // the strip extends this at class-declaration time, so it has to exist before the import.
    globalThis.Window_Selectable = class
    {
    };

    globalThis.TextManager = { currencyUnit: 'G' };
    globalThis.$gameParty = { gold: () => 1234 };
  });

  /**
   * Imports the registration module and hands back the strip it registered into.
   * @returns {Promise<Function>} The window class holding the registrations.
   */
  const importRegistration = async () =>
  {
    const { default: Window_Currencies } =
      await import('../../../../src/plugins/cms/core/windows/Window_Currencies.js');

    await import('../../../../src/plugins/cms/core/registerCoreCurrencies.js');

    return Window_Currencies;
  };

  it('registers gold with the strip', async () =>
  {
    // Arrange
    // Act
    const Window_Currencies = await importRegistration();

    // Assert
    const definitions = Window_Currencies.definitions();
    expect(definitions.length).toBe(1);
    expect(definitions[0].key).toBe('gold');
  });

  it('draws gold without an icon', async () =>
  {
    // Arrange
    // Act
    const Window_Currencies = await importRegistration();

    // Assert
    const [ gold ] = Window_Currencies.definitions();
    expect(gold.hasIcon()).toBe(false);
  });

  it('reads the currency unit out of the database rather than at registration', async () =>
  {
    // Arrange- the label is swapped after the module has already been imported.
    const Window_Currencies = await importRegistration();
    globalThis.TextManager.currencyUnit = 'Zenny';

    // Act
    const [ gold ] = Window_Currencies.definitions();

    // Assert
    expect(gold.unit()).toBe('Zenny');
  });

  it('reads the amount out of the party rather than at registration', async () =>
  {
    // Arrange
    const Window_Currencies = await importRegistration();
    globalThis.$gameParty.gold = () => 99;

    // Act
    const [ gold ] = Window_Currencies.definitions();

    // Assert
    expect(gold.amount()).toBe(99);
  });

  it('ignores a second registration of a key the strip already carries', async () =>
  {
    // Arrange- a plugin registering during a hook that runs more than once must not stack copies.
    const Window_Currencies = await importRegistration();
    const [ gold ] = Window_Currencies.definitions();

    // Act
    Window_Currencies.register(gold);

    // Assert
    expect(Window_Currencies.definitions().length).toBe(1);
  });

  it('accepts a second registration under a key the strip does not carry', async () =>
  {
    // Arrange- the near-miss to the refusal above; only the key differs.
    const Window_Currencies = await importRegistration();
    const [ gold ] = Window_Currencies.definitions();
    const impostor = { ...gold, key: 'not-gold' };

    // Act
    Window_Currencies.register(impostor);

    // Assert
    expect(Window_Currencies.definitions().length).toBe(2);
  });
});
//endregion plugins/cms/core/register-core-currencies.test.js
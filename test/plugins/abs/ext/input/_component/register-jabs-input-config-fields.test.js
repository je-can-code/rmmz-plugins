//region plugins/abs/ext/input/_component/register-jabs-input-config-fields.test.js
import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Where a player's keybinds live, and the one thing that decides it.
 *
 * Bindings used to sit inside each savefile because vanilla `ConfigManager` had no room for an
 * eighth field. That was visible to the player in the worst way: rebinding a key applied to one save,
 * a second playthrough started on the defaults, and deleting saves deleted the bindings with them.
 * `registerField` is J-Base-Save's addition, so whether that plugin is installed is exactly what
 * decides which of those two worlds the player is in.
 */
describe('registerJabsInputConfigFields', () =>
{
  /**
   * Every field name handed to `ConfigManager.registerField`, in order.
   * @type {string[]}
   */
  let registered;

  beforeEach(() =>
  {
    vi.resetModules();

    registered = [];

    globalThis.ConfigManager = {
      registerField: (name, seed) => registered.push({
        name,
        seed,
      }),
    };
  });

  it('registers both stores into config.json when J-Base-Save is installed', async () =>
  {
    // Arrange
    globalThis.J = { BASE: { EXT: { SAVE: {} } } };

    // Act
    await import('../../../../../../src/plugins/abs/ext/input/registerJabsInputConfigFields.js');

    // Assert: both in `config.json` beside volume and touch UI, which makes bindings global.
    expect(registered.map(field => field.name))
      .toEqual([ 'jabsInputMappings', 'jabsInputBindings' ]);
  });

  it('registers nothing when J-Base-Save is not installed', async () =>
  {
    // Arrange: without `registerField` there is nowhere installation-scoped to put them, so they
    // stay inside each savefile exactly as they always were rather than failing to save at all.
    globalThis.J = { BASE: { EXT: {} } };

    // Act
    await import('../../../../../../src/plugins/abs/ext/input/registerJabsInputConfigFields.js');

    // Assert
    expect(registered)
      .toEqual([]);
  });

  it('seeds both stores empty rather than with the built-in mapping', async () =>
  {
    // Arrange: the controllers are the authority on what the defaults are and are not constructed
    // yet at this point, so `initializeJabsInputIfMissing` is what fills an empty store from them.
    globalThis.J = { BASE: { EXT: { SAVE: {} } } };

    // Act
    await import('../../../../../../src/plugins/abs/ext/input/registerJabsInputConfigFields.js');

    // Assert
    registered.forEach(field =>
    {
      expect(field.seed())
        .toEqual({});
    });
  });

  it('gives each store its own object, so one cannot write into the other', async () =>
  {
    // Arrange
    globalThis.J = { BASE: { EXT: { SAVE: {} } } };
    await import('../../../../../../src/plugins/abs/ext/input/registerJabsInputConfigFields.js');

    // Act
    const [ mappings, bindings ] = registered;

    // Assert
    expect(mappings.seed())
      .not.toBe(bindings.seed());
  });
});
//endregion plugins/abs/ext/input/_component/register-jabs-input-config-fields.test.js
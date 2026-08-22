//region plugins/time/core/_metadata/plugin-metadata.test.js
import { describe, expect, it, vi } from 'vitest';

import { DEFAULT_TIME_PLUGIN_PARAMS } from '../../_component/fixtures/time-plugin-params.js';

/**
 * Every toggle on this metadata is a `param === 'true'` comparison against a string RMMZ handed over,
 * so each one needs seeing from both sides: a configured `'true'` has to arrive as `true`, and a
 * configured `'false'` has to arrive as `false`. Reading only one side cannot tell a real comparison
 * apart from a constant, since the boot fixture happens to agree with whichever constant it is.
 */
describe('J_TIME_PluginMetadata parameter mapping (direct src import)', () =>
{
  /**
   * Boots a fresh copy of the metadata class against a plugin parameter set of our choosing.
   *
   * The module graph is reset per call because {@link PluginMetadata} keeps a registry keyed by
   * plugin name and refuses a second registration under a name it already knows- two instances of
   * `J-TIME` can only exist in two separate graphs.
   * @param {object} overrides Parameter values to replace on top of the shipped test defaults.
   * @returns {Promise<object>} The freshly constructed metadata.
   */
  const metadataWith = async overrides =>
  {
    vi.resetModules();

    const parameters = Object.assign({}, DEFAULT_TIME_PLUGIN_PARAMS, overrides);

    globalThis.PluginManager = {
      parameters: () => parameters,
      registerCommand: () =>
      {
      },
    };

    const { default: PluginMetadata } = await import(
      '../../../../../src/plugins/_base/core/models/PluginMetadata.js');

    // the shipped runtime concatenates J-Base ahead of TIME, so the base class is a bare global by
    // the time the subclass declaration is evaluated.
    globalThis.PluginMetadata = PluginMetadata;

    const { default: J_TIME_PluginMetadata } = await import(
      '../../../../../src/plugins/time/core/_metadata/_pluginMetadata.js');

    return new J_TIME_PluginMetadata('J-TIME', '1.0.0');
  };

  // each flag, paired with the parameter key it reads from.
  const flags = [
    [ 'StartVisible', 'startVisible' ],
    [ 'StartActivated', 'startActivated' ],
    [ 'UseRealTime', 'useRealTime' ],
    [ 'ChangeToneByTime', 'changeToneByTime' ],
    [ 'UseVariableAssignment', 'useVariableAssignment' ],
  ];

  flags.forEach(([ field, parameterKey ]) =>
  {
    it(`turns ${field} on when ${parameterKey} is configured true`, async () =>
    {
      // Arrange
      const metadata = await metadataWith({ [ parameterKey ]: 'true' });

      // Act
      const result = metadata[field];

      // Assert
      expect(result).toBe(true);
    });

    it(`turns ${field} off when ${parameterKey} is configured false`, async () =>
    {
      // Arrange
      const metadata = await metadataWith({ [ parameterKey ]: 'false' });

      // Act
      const result = metadata[field];

      // Assert
      expect(result).toBe(false);
    });
  });

  it('reads the numeric settings through as numbers rather than as the strings RMMZ hands over', async () =>
  {
    // Arrange
    // an anchor for the whole mapping: these arrive as strings and every consumer does arithmetic on
    // them, so a toggle read correctly on a metadata that never ran its numeric half proves little.
    const metadata = await metadataWith({});

    // Act
    const { StartingHour, FramesPerTick } = metadata;

    // Assert
    expect(StartingHour).toBe(9);
    expect(FramesPerTick).toBe(60);
  });
});
//endregion plugins/time/core/_metadata/plugin-metadata.test.js

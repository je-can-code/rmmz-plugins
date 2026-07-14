//region plugins/resources/_component/hcr-regex.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

describe('J.RESOURCES.RegExp.HpCostReduction (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = { BASE: { Helpers: { satisfies: () => true }, Metadata: { Version: '3.0.0' } } };
    globalThis.PluginManager = { parameters: () => ({}) };
    globalThis.__PLUGIN_NAME__ = 'J-Resources';
    globalThis.__PLUGIN_VERSION__ = '0.0.0-test';

    // minimal stand-in for J-Base's PluginMetadata base class.
    globalThis.PluginMetadata = class PluginMetadata
    {
      constructor(name, version)
      {
        this.name = name;
        this.version = version;
        this.parsedPluginParameters = PluginManager.parameters(name);
      }

      postInitialize()
      {
      }
    };

    // real production code- sets up J.RESOURCES.RegExp.HpCostReduction.
    await import('../../../../src/plugins/resources/core/_metadata/initialization.js');
  });

  it('matches the documented <hcr:[VALUE]> tag, not the old transposed <hrc:[VALUE]>', () =>
  {
    // Arrange
    const regex = globalThis.J.RESOURCES.RegExp.HpCostReduction;

    // Act & Assert
    expect(regex.test('<hcr:[5]>')).toBe(true);
  });
});
//endregion plugins/resources/_component/hcr-regex.test.js

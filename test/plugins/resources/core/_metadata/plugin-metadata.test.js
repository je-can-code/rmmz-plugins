//region plugins/resources/core/_metadata/plugin-metadata.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import PluginMetadata from '../../../../../src/plugins/_base/models/PluginMetadata.js';

/**
 * The resources metadata subclass exists to translate one plugin parameter into a usable number.
 * Nothing else in the suite constructs it, so both its post-initialization hook and the translation
 * that hook performs go unexercised despite shipping in every build.
 */
describe('JResources_PluginMetadata', () =>
{
  let metadata;

  beforeAll(async () =>
  {
    vi.resetModules();

    String.empty = '';

    // the subclass reaches PluginMetadata as a bare global, the way the concatenated bundle supplies
    // it- J-Base is always laid down ahead of any plugin that subclasses it.
    globalThis.PluginMetadata = PluginMetadata;

    globalThis.PluginManager = {
      parameters: () => ({ 'menu-switch': '42' }),
    };

    const { default: JResources_PluginMetadata } =
      await import('../../../../../src/plugins/resources/core/_metadata/_pluginMetadata.js');

    // constructed exactly once for the whole file: PluginMetadata registers every instance by name
    // and throws on a repeat, so a second construction under the same name would fail outright.
    metadata = new JResources_PluginMetadata('J-Resources', '1.0.0');
  });

  it('translates the menu switch parameter into a number', () =>
  {
    // Arrange
    // Act
    // Assert
    // the raw parameter arrives as the string RMMZ hands over; a switch id is only usable as a number.
    expect(metadata.menuSwitchId).toBe(42);
  });

  it('carries through the name it was constructed with', () =>
  {
    // Arrange
    // Act
    // Assert
    expect(metadata.name).toBe('J-Resources');
  });
});
//endregion plugins/resources/core/_metadata/plugin-metadata.test.js

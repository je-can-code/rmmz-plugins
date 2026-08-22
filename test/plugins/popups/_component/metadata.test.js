//region plugins/popups/_component/metadata.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import {
  installPopupsHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJPopups,
} from './fixtures/install-popups-host-globals.js';
import { installPluginManagerWithParams } from '../../../setup/install-plugin-manager-with-params.js';

describe('J-Popups metadata (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installPopupsHostGlobals();

    setPluginContextToJBase();
    await import('../../../../src/plugins/_base/core/_metadata/initialization.js');

    // real J-Base class- extends PIXI.utils.EventEmitter, so must be imported after PIXI is stubbed.
    ({ default: globalThis.J_EventEmitter } = await import('../../../../src/plugins/_base/core/models/J_EventEmitter.js'));

    setPluginContextToJPopups();
    await import('../../../../src/plugins/popups/core/_metadata/initialization.js');
  });

  it('initializes J.POPUPS.Metadata.name', () =>
  {
    // Arrange & Act
    const result = globalThis.J.POPUPS.Metadata.name;

    // Assert
    expect(result).toBe('J-Popups');
  });

  it('initializes J.POPUPS.Metadata.disablePopups', () =>
  {
    // Arrange & Act
    const result = globalThis.J.POPUPS.Metadata.disablePopups;

    // Assert
    expect(result).toBe(false);
  });

  it('reads disablePopups as true when the parameter is explicitly the string true', async () =>
  {
    // Arrange- PluginMetadata's static registry rejects a duplicate name, so this second
    // configuration introduces itself under a name of its own; only the lookup keys off the name.
    const { default: PopupsPluginMetadata } =
      await import('../../../../src/plugins/popups/core/_metadata/_pluginMetadata.js');
    installPluginManagerWithParams(globalThis, 'J-Popups-Disabled', { disablePopups: 'true' });

    // Act
    const metadata = new PopupsPluginMetadata('J-Popups-Disabled', '2.1.0');

    // Assert
    expect(metadata.disablePopups).toBe(true);
  });
});
//endregion plugins/popups/_component/metadata.test.js

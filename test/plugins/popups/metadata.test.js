//region plugins/popups/metadata.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import {
  installPopupsHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJPopups,
} from './fixtures/install-popups-host-globals.js';

describe('J-Popups metadata (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installPopupsHostGlobals();

    setPluginContextToJBase();
    await import('../../../src/plugins/_base/_metadata/initialization.js');

    // real J-Base class- extends PIXI.utils.EventEmitter, so must be imported after PIXI is stubbed.
    ({ default: globalThis.J_EventEmitter } = await import('../../../src/plugins/_base/models/J_EventEmitter.js'));

    setPluginContextToJPopups();
    await import('../../../src/plugins/popups/core/_metadata/initialization.js');
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
});
//endregion plugins/popups/metadata.test.js

//region plugins/popups/ext/sdp/_component/metadata.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  installPopupsHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJPopupsSdp,
} from '../../../_component/fixtures/install-popups-host-globals.js';

const jBaseInitPath = '../../../../../../src/plugins/_base/_metadata/initialization.js';
const sdpInitPath = '../../../../../../src/plugins/popups/ext/sdp/_metadata/initialization.js';
const pluginMetadataPath = '../../../../../../src/plugins/_base/models/PluginMetadata.js';

describe('J-Popups-SDP metadata (direct src import)', () =>
{
  /** @type {object} the J umbrella as J-Base built it; its bootstrap is once-per-realm. */
  let realJ;

  beforeAll(async () =>
  {
    installPopupsHostGlobals();

    setPluginContextToJBase();
    await import(jBaseInitPath);

    realJ = globalThis.J;
  });

  beforeEach(async () =>
  {
    vi.resetModules();

    globalThis.J = realJ;

    // this extension does not gate on a parent version, but it does nest itself under the parent
    // namespaces, so those have to be cleared to observe the `||=` behaviour honestly.
    delete globalThis.J.POPUPS;

    const { default: FreshPluginMetadata } = await import(pluginMetadataPath);
    globalThis.PluginMetadata = FreshPluginMetadata;

    setPluginContextToJPopupsSdp();
  });

  it('registers the plugin metadata under the SDP extension namespace', async () =>
  {
    // Arrange & Act
    await import(sdpInitPath);

    // Assert
    expect(globalThis.J.POPUPS.EXT.SDP.Metadata.name).toBe('J-Popups-SDP');
  });

  it('records the plugin version from the build-time identity', async () =>
  {
    // Arrange & Act
    await import(sdpInitPath);

    // Assert
    const { version } = globalThis.J.POPUPS.EXT.SDP.Metadata;
    expect(version.major).toBe(1);
    expect(version.minor).toBe(0);
    expect(version.patch).toBe(0);
  });

  it('creates the aliased-method map for the engine class it patches', async () =>
  {
    // Arrange & Act
    await import(sdpInitPath);

    // Assert- JABS_Engine is where the SDP point popup is actually emitted from.
    expect(globalThis.J.POPUPS.EXT.SDP.Aliased.JABS_Engine).toBeInstanceOf(Map);
  });

  it('builds the parent popups namespace when it does not exist yet', async () =>
  {
    // Arrange- plugin load order is user-controlled, so this extension cannot assume the parent
    // already staked out its namespace.
    // Act
    await import(sdpInitPath);

    // Assert
    expect(globalThis.J.POPUPS.EXT).toBeDefined();
  });

  it('preserves an existing popups namespace rather than replacing it', async () =>
  {
    // Arrange- when the parent plugin did load first, its namespace must survive intact.
    globalThis.J.POPUPS = { EXT: {}, placedEarlier: true };

    // Act
    await import(sdpInitPath);

    // Assert
    expect(globalThis.J.POPUPS.placedEarlier).toBe(true);
    expect(globalThis.J.POPUPS.EXT.SDP.Metadata).toBeDefined();
  });

  it('preserves an existing SDP namespace rather than replacing it', async () =>
  {
    // Arrange
    globalThis.J.POPUPS = { EXT: { SDP: { placedEarlier: true } } };

    // Act
    await import(sdpInitPath);

    // Assert
    expect(globalThis.J.POPUPS.EXT.SDP.placedEarlier).toBe(true);
  });

  it('preserves an existing aliased map rather than discarding recorded originals', async () =>
  {
    // Arrange- clobbering this would drop any original method references already saved into it,
    // which surfaces much later as an alias call against undefined.
    globalThis.J.POPUPS = { EXT: { SDP: { Aliased: { SomethingElse: new Map() } } } };

    // Act
    await import(sdpInitPath);

    // Assert
    expect(globalThis.J.POPUPS.EXT.SDP.Aliased.SomethingElse).toBeInstanceOf(Map);
    expect(globalThis.J.POPUPS.EXT.SDP.Aliased.JABS_Engine).toBeInstanceOf(Map);
  });

  it('reuses the existing J umbrella rather than replacing it', async () =>
  {
    // Arrange
    const umbrellaBeforeImport = globalThis.J;

    // Act
    await import(sdpInitPath);

    // Assert
    expect(globalThis.J).toBe(umbrellaBeforeImport);
  });

  it('creates the J umbrella from nothing when nothing has loaded yet', async () =>
  {
    // Arrange- unlike most extensions this one has no version gate, so the falsy side of
    // `globalThis.J ||= {}` is genuinely survivable rather than a crash.
    delete globalThis.J;

    // Act
    await import(sdpInitPath);

    // Assert
    expect(globalThis.J.POPUPS.EXT.SDP.Metadata.name).toBe('J-Popups-SDP');
  });
});
//endregion plugins/popups/ext/sdp/_component/metadata.test.js

//region plugins/extend/ext/abs/_component/metadata.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  installExtendHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJExtend,
  setPluginContextToJExtendAbs,
} from '../../../_component/fixtures/install-extend-host-globals.js';

const jBaseInitPath = '../../../../../../src/plugins/_base/_metadata/initialization.js';
const extendInitPath = '../../../../../../src/plugins/extend/core/_metadata/initialization.js';
const absInitPath = '../../../../../../src/plugins/extend/ext/abs/_metadata/initialization.js';
const pluginMetadataPath = '../../../../../../src/plugins/_base/models/PluginMetadata.js';

describe('J-Extend-ABS metadata (direct src import)', () =>
{
  /** @type {object} the J umbrella as J-Base built it; its bootstrap is once-per-realm. */
  let realJ;

  beforeAll(async () =>
  {
    installExtendHostGlobals();

    ({ default: globalThis.JCache } = await import('../../../../../../src/plugins/_base/core/JCache.js'));

    setPluginContextToJBase();
    await import(jBaseInitPath);

    realJ = globalThis.J;
  });

  beforeEach(async () =>
  {
    vi.resetModules();

    globalThis.J = realJ;
    globalThis.J.BASE.Metadata.Version = '3.2.0';
    delete globalThis.J.EXTEND;

    // PluginMetadata's registry is a private static that throws on duplicate names; a fresh copy per
    // test gives each one a private, empty registry.
    const { default: FreshPluginMetadata } = await import(pluginMetadataPath);
    globalThis.PluginMetadata = FreshPluginMetadata;

    // this extension nests directly under the parent's namespace, so the parent must load first.
    setPluginContextToJExtend();
    await import(extendInitPath);

    setPluginContextToJExtendAbs();
  });

  it('creates the aliased-method map for the battler class it patches', async () =>
  {
    // Arrange & Act
    await import(absInitPath);

    // Assert- a missing map surfaces later as "cannot read set of undefined" at patch time.
    expect(globalThis.J.EXTEND.EXT.ABS.Aliased.JABS_Battler).toBeInstanceOf(Map);
  });

  it('still performs the base PluginMetadata initialization it extends', async () =>
  {
    // Arrange & Act
    await import(absInitPath);

    // Assert
    expect(globalThis.J.EXTEND.EXT.ABS.Metadata.parsedPluginParameters).toBeDefined();
  });

  it('reuses the existing J umbrella rather than replacing it', async () =>
  {
    // Arrange
    const umbrellaBeforeImport = globalThis.J;

    // Act
    await import(absInitPath);

    // Assert- the truthy side of `globalThis.J ||= {}` keeps every J plugin sharing one namespace.
    expect(globalThis.J).toBe(umbrellaBeforeImport);
  });

  it('throws when the parent J-Extend plugin has not been loaded', async () =>
  {
    // Arrange- unlike its siblings this extension has no explicit version gate, so a wrong load
    // order surfaces as a bare property access failure rather than a friendly message.
    delete globalThis.J.EXTEND;

    // Act & Assert
    await expect(import(absInitPath)).rejects.toThrow(TypeError);
  });
});
//endregion plugins/extend/ext/abs/_component/metadata.test.js

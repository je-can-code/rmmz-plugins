//region plugins/map/_component/metadata.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { installMapHostGlobals, setPluginContextToJBase, setPluginContextToJMap } from './fixtures/install-map-host-globals.js';

describe('J-MAP metadata (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installMapHostGlobals();

    setPluginContextToJBase();
    await import('../../../../src/plugins/_base/core/_metadata/initialization.js');

    setPluginContextToJMap();
    await import('../../../../src/plugins/map/core/_metadata/initialization.js');
  });

  it('parses the initial minimap visibility out of the plugin parameters', () =>
  {
    // Arrange & Act & Assert
    expect(globalThis.J.MAP.Metadata.startVisible).toBe(true);
  });

  it('parses whether the minimap hides alongside the hud', () =>
  {
    // Arrange & Act & Assert
    expect(globalThis.J.MAP.Metadata.respectHudHide).toBe(true);
  });

  it('parses the overlap opacity as a fraction rather than a whole percentage', () =>
  {
    // Arrange & Act & Assert
    expect(globalThis.J.MAP.Metadata.overlapOpacity).toBe(0.4);
  });

  describe('unconfigured parameters', () =>
  {
    it('falls back to its shipped defaults when the project never set any parameters', async () =>
    {
      // Arrange- a project that installs the minimap and never opens its parameter panel gets an
      // empty parameter object. The negative coordinates are the "auto-place me" sentinel rather
      // than a literal position, and both toggles default on so the minimap is visible out of the box.
      //
      // Constructed directly under its own name rather than re-imported: `PluginMetadata` keeps a
      // static registry of every plugin it has seen and throws on a duplicate, and that registry
      // outlives `vi.resetModules()` because the class reaches this realm as a bare global.
      const { default: Metadata } = await import('../../../../src/plugins/map/core/_metadata/_pluginMetadata.js');
      const previous = globalThis.PluginManager;
      globalThis.PluginManager = {
        parameters: () => ({}),
        registerCommand() {},
      };

      // Act
      const metadata = new Metadata('J-MAP-Unconfigured', '1.0.0');
      globalThis.PluginManager = previous;

      // Assert
      expect(metadata.minimapX).toBe(-1);
      expect(metadata.minimapY).toBe(-1);
      expect(metadata.startVisible).toBe(true);
      expect(metadata.respectHudHide).toBe(true);
      expect(metadata.overlapOpacity).toBe(0.4);
    });

    it('honours a project that switched both toggles off', async () =>
    {
      // Arrange- both toggles default on, so `false` is the only answer a project can give that the
      // defaults could never have produced. The opacity is set to something distinctive alongside
      // them purely as proof this instance read the parameter object at all, since `false` is also
      // what an unread parameter would leave behind.
      const { default: Metadata } = await import('../../../../src/plugins/map/core/_metadata/_pluginMetadata.js');
      const previous = globalThis.PluginManager;
      globalThis.PluginManager = {
        parameters: () => ({
          startVisible: 'false',
          respectHudHide: 'false',
          overlapOpacityPercent: '55',
        }),
        registerCommand() {},
      };

      // Act
      const metadata = new Metadata('J-MAP-BothTogglesOff', '1.0.0');
      globalThis.PluginManager = previous;

      // Assert
      expect(metadata.startVisible).toBe(false);
      expect(metadata.respectHudHide).toBe(false);
      expect(metadata.overlapOpacity).toBe(0.55);
    });
  });
});
//endregion plugins/map/_component/metadata.test.js

//region plugins/map/game-event-minimap.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { installMapHostGlobals, setPluginContextToJBase, setPluginContextToJMap } from './fixtures/install-map-host-globals.js';

describe('J-MAP Game_Event minimap parsing + caching (direct src import)', () =>
{
  /** @type {typeof import('../../../src/plugins/map/core/__models/MinimapEventType.js').default} */
  let MinimapEventType;

  beforeAll(async () =>
  {
    vi.resetModules();

    installMapHostGlobals();

    setPluginContextToJBase();
    await import('../../../src/plugins/_base/_metadata/initialization.js');

    setPluginContextToJMap();
    await import('../../../src/plugins/map/core/_metadata/initialization.js');

    // must be imported from the SAME post-reset module registry epoch as Game_Event.js below,
    // since Game_Event.js imports its own copy of this module- two separate static imports would
    // otherwise resolve to two different module instances with structurally-equal-but-not-identical enums.
    ({ default: MinimapEventType } = await import('../../../src/plugins/map/core/__models/MinimapEventType.js'));

    // patches globalThis.Game_Event.prototype directly, no vm involved.
    await import('../../../src/plugins/map/core/objects/Game_Event.js');
  });

  it('shouldShowOnMinimap() returns true when comment contains minimap tag', () =>
  {
    // Arrange
    const ev = new globalThis.Game_Event();
    ev.initMembers();
    ev.getValidCommentCommands = function()
    {
      return [ { parameters: [ '<minimap:npc>' ] } ];
    };

    // Act & Assert
    expect(ev.shouldShowOnMinimap()).toBe(true);

    // ensure cached value is used on subsequent calls (even if we remove comments).
    ev.getValidCommentCommands = function()
    {
      return [];
    };
    expect(ev.shouldShowOnMinimap()).toBe(true);
  });

  it('minimapEventType() resolves type from comment tag and caches it', () =>
  {
    // Arrange
    const ev = new globalThis.Game_Event();
    ev.initMembers();
    ev.getValidCommentCommands = function()
    {
      return [ { parameters: [ '<mm:teleport>' ] } ];
    };

    // Act
    const type1 = ev.minimapEventType();

    // Assert
    expect(type1).toBe(MinimapEventType.Teleport);

    ev.getValidCommentCommands = function()
    {
      return [ { parameters: [ '<mm:npc>' ] } ];
    };

    // still teleport, because cached.
    const type2 = ev.minimapEventType();
    expect(type2).toBe(MinimapEventType.Teleport);

    ev.clearMinimapCache();
    const type3 = ev.minimapEventType();
    expect(type3).toBe(MinimapEventType.Npc);
  });
});
//endregion plugins/map/game-event-minimap.test.js

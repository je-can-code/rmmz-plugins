//region plugins/map/game-event-minimap.test.js
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { loadMapPluginVm } from './map-vm.js';

describe('J-MAP Game_Event minimap parsing + caching (out/J-Map.js)', () =>
{
  let sandbox;

  beforeAll(() =>
  {
    sandbox = { console };
    loadMapPluginVm(sandbox);
  });

  afterAll(() =>
  {
    sandbox = null;
  });

  it('shouldShowOnMinimap() returns true when comment contains minimap tag', () =>
  {
    const ev = new sandbox.Game_Event();
    ev.initMembers();

    ev.getValidCommentCommands = function()
    {
      return [
        { parameters: [ '<minimap:npc>' ] },
      ];
    };

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
    const { MinimapEventType } = sandbox;
    const ev = new sandbox.Game_Event();
    ev.initMembers();

    ev.getValidCommentCommands = function()
    {
      return [
        { parameters: [ '<mm:teleport>' ] },
      ];
    };

    const type1 = ev.minimapEventType();
    expect(type1).toBe(MinimapEventType.Teleport);

    ev.getValidCommentCommands = function()
    {
      return [
        { parameters: [ '<mm:npc>' ] },
      ];
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

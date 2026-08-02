//region plugins/map/_component/datamanager-input-registration.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { installMapHostGlobals, setPluginContextToJBase, setPluginContextToJMap } from './fixtures/install-map-host-globals.js';

describe('J-MAP DataManager.createGameObjects registers minimap inputs (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installMapHostGlobals();

    setPluginContextToJBase();
    await import('../../../../src/plugins/_base/core/_metadata/initialization.js');

    setPluginContextToJMap();
    await import('../../../../src/plugins/map/core/_metadata/initialization.js');

    // patches globalThis.DataManager directly, no vm involved.
    await import('../../../../src/plugins/map/core/managers/DataManager.js');
  });

  it('registers actions and seeds default bindings', () =>
  {
    // Arrange
    const actions = [];
    const seeded = [];
    let gotBindings = false;
    globalThis.Input.registerAction = function(namespace, action)
    {
      actions.push({ namespace, action });
    };
    globalThis.Input.seedDefaultBindings = function(namespace, defaults)
    {
      seeded.push({ namespace, defaults });
    };
    globalThis.Input.getAllBindings = function(namespace)
    {
      gotBindings = (namespace === 'J.MAP');
      return [];
    };

    // Act
    globalThis.DataManager.createGameObjects();

    // Assert
    expect(actions.length).toBe(2);
    expect(actions[0].namespace).toBe('J.MAP');
    expect(actions[0].action.key).toBe('minimap-toggle');
    expect(actions[1].action.key).toBe('expand-minimap');

    expect(seeded.length).toBe(1);
    expect(seeded[0].namespace).toBe('J.MAP');
    expect(seeded[0].defaults['minimap-toggle']).toEqual([ 'dpadUp' ]);
    expect(seeded[0].defaults['expand-minimap']).toEqual([ 'dpadDown' ]);
    expect(gotBindings).toBe(true);
  });
});
//endregion plugins/map/_component/datamanager-input-registration.test.js

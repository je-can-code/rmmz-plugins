//region plugins/map/datamanager-input-registration.test.js
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { loadMapPluginVm } from './map-vm.js';

describe('J-MAP DataManager.createGameObjects registers minimap inputs (out/J-Map.js)', () =>
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

  it('registers actions and seeds default bindings', () =>
  {
    const actions = [];
    const seeded = [];
    let gotBindings = false;

    sandbox.Input.registerAction = function(namespace, action)
    {
      actions.push({ namespace, action });
    };
    sandbox.Input.seedDefaultBindings = function(namespace, defaults)
    {
      seeded.push({ namespace, defaults });
    };
    sandbox.Input.getAllBindings = function(namespace)
    {
      gotBindings = (namespace === 'J.MAP');
      return [];
    };

    sandbox.DataManager.createGameObjects();

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
//endregion plugins/map/datamanager-input-registration.test.js

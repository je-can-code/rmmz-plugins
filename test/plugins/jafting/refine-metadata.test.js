//region plugins/jafting/refine-metadata.test.js
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { DEFAULT_JAFTING_REFINE_PLUGIN_PARAMS } from './fixtures/engine-stubs.js';
import { loadJaftingRefinePluginVm } from './jafting-refine-vm.js';

describe('J-JAFTING + J-JAFTING-Refinement metadata (built plugins)', () =>
{
  let sandbox;

  beforeAll(() =>
  {
    sandbox = { console };
    loadJaftingRefinePluginVm(sandbox);
  });

  afterAll(() =>
  {
    sandbox = null;
  });

  it('maps Refinement plugin parameters onto J.JAFTING.EXT.REFINE.Metadata', () =>
  {
    const md = sandbox.J.JAFTING.EXT.REFINE.Metadata;

    expect(md.name).toBe('J-JAFTING-Refinement');
    expect(md.menuSwitchId).toBe(Number(DEFAULT_JAFTING_REFINE_PLUGIN_PARAMS['menu-switch']));
    expect(md.commandName).toBe(DEFAULT_JAFTING_REFINE_PLUGIN_PARAMS['menu-name']);
    expect(md.commandIconIndex).toBe(Number(DEFAULT_JAFTING_REFINE_PLUGIN_PARAMS['menu-icon']));
  });
});
//endregion plugins/jafting/refine-metadata.test.js

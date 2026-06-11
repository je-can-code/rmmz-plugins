//region plugins/drops/metadata.test.js
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { loadDropsControlPluginVm, resetDropsControlPluginSandbox } from './drops-vm.js';

describe('J-DropsControl metadata (out/drops/J-DropsControl.js)', () =>
{
  let sandbox;

  beforeAll(() =>
  {
    sandbox = { console };
    loadDropsControlPluginVm(sandbox);
  });

  afterAll(() =>
  {
    sandbox = null;
  });

  beforeEach(() =>
  {
    resetDropsControlPluginSandbox(sandbox);
  });

  it('exposes plugin name on J.DROPS.Metadata', () =>
  {
    expect(sandbox.J.DROPS.Metadata.name).toBe('J-DropsControl');
  });
});
//endregion plugins/drops/metadata.test.js

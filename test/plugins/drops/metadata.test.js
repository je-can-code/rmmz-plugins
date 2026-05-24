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
    expect(sandbox.J.DROPS.Metadata.version.major).toBe(2);
    expect(sandbox.J.DROPS.Metadata.version.minor).toBe(1);
    expect(sandbox.J.DROPS.Metadata.version.patch).toBe(2);
  });
});
//endregion plugins/drops/metadata.test.js

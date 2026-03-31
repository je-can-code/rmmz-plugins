//region plugins/crit/metadata.test.js
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { loadCriticalFactorsPluginVm } from './crit-vm.js';

describe('J-CriticalFactors metadata (out/J-CriticalFactors.js)', () =>
{
  let sandbox;

  beforeAll(() =>
  {
    sandbox = { console };
    loadCriticalFactorsPluginVm(sandbox);
  });

  afterAll(() =>
  {
    sandbox = null;
  });

  it('exposes plugin name on J.CRIT.Metadata', () =>
  {
    expect(sandbox.J.CRIT.Metadata.Name).toBe('J-CriticalFactors');
  });
});
//endregion plugins/crit/metadata.test.js

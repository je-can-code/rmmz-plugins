//region plugins/crit/metadata.test.js
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { loadCriticalFactorsPluginVm } from './crit-vm.js';

describe('J-CriticalFactors metadata (out/crit/J-CriticalFactors.js)', () =>
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

  it('initializes metadata and regex objects', () =>
  {
    expect(sandbox.J.CRIT.Metadata.name).toBe('J-CriticalFactors');
  });
});
//endregion plugins/crit/metadata.test.js
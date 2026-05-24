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
    expect(sandbox.J.CRIT.Metadata.version.major).toBe(1);
    expect(sandbox.J.CRIT.Metadata.version.minor).toBe(0);
    expect(sandbox.J.CRIT.Metadata.version.patch).toBe(2);
  });
});
//endregion plugins/crit/metadata.test.js
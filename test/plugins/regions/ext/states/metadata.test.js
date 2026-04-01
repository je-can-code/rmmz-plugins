//region plugins/regions/ext/states/metadata.test.js
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { loadRegionsStatesStackVm } from '../../regions-vm.js';

describe('J-Regions-States stack metadata (out/regions/ext/J-Regions-States.js)', () =>
{
  let sandbox;

  beforeAll(() =>
  {
    sandbox = { console };
    loadRegionsStatesStackVm(sandbox);
  });

  afterAll(() =>
  {
    sandbox = null;
  });

  it('exposes states extension metadata delay', () =>
  {
    expect(Number(sandbox.J.REGIONS.EXT.STATES.Metadata.delayBetweenApplications)).toBe(15);
  });
});
//endregion plugins/regions/ext/states/metadata.test.js

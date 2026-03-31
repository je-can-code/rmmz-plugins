//region plugins/apt/metadata.test.js
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { DEFAULT_APT_PLUGIN_PARAMS } from './fixtures/engine-stubs.js';
import { loadAptPluginVm } from './apt-vm.js';

describe('J-Aptitude metadata (out/apt/J-Aptitude.js)', () =>
{
  let sandbox;

  beforeAll(() =>
  {
    sandbox = { console };
    loadAptPluginVm(sandbox);
  });

  afterAll(() =>
  {
    sandbox = null;
  });

  it('maps plugin parameters onto J.APT.Metadata', () =>
  {
    expect(sandbox.J.APT.Metadata.name).toBe('J-Aptitude');
    expect(sandbox.J.APT.Metadata.menuSwitchId).toBe(Number(DEFAULT_APT_PLUGIN_PARAMS['menu-switch']));
    expect(sandbox.J.APT.Metadata.maxLevelThreshold).toBe(-1);
    expect(sandbox.J.APT.Metadata.usingLevelThresholdLimit).toBe(false);
  });
});
//endregion plugins/apt/metadata.test.js

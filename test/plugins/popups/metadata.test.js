//region plugins/popups/metadata.test.js
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { loadPopupsPluginVm } from './popups-vm.js';

describe('J-TextPops metadata (out/J-TextPops.js)', () =>
{
  let sandbox;

  beforeAll(() =>
  {
    sandbox = { console };
    loadPopupsPluginVm(sandbox);
  });

  afterAll(() =>
  {
    sandbox = null;
  });

  it('initializes J.POPUPS metadata', () =>
  {
    expect(sandbox.J.POPUPS.Metadata.Name).toBe('J-TextPops');
    expect(sandbox.J.POPUPS.Metadata.Version).toBe('1.0.0');
  });
});
//endregion plugins/popups/metadata.test.js

//region plugins/popups/metadata.test.js
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { loadPopupsPluginVm } from './popups-vm.js';

describe('J-Popups metadata (out/popups/J-Popups.js)', () =>
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
    expect(sandbox.J.POPUPS.Metadata.name).toBe('J-Popups');
    expect(sandbox.J.POPUPS.Metadata.disablePopups).toBe(false);
  });
});
//endregion plugins/popups/metadata.test.js

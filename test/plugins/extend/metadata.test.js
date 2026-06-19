//region plugins/extend/metadata.test.js
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { loadSkillExtendPluginVm } from './extend-vm.js';

describe('J-Extend metadata (out/extend/J-Extend.js)', () =>
{
  let sandbox;

  beforeAll(() =>
  {
    sandbox = { console };
    loadSkillExtendPluginVm(sandbox);
  });

  afterAll(() =>
  {
    sandbox = null;
  });

  it('exposes plugin name on J.EXTEND.Metadata', () =>
  {
    expect(sandbox.J.EXTEND.Metadata.name).toBe('J-Extend');
  });
});
//endregion plugins/extend/metadata.test.js

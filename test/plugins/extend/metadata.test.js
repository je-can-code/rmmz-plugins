//region plugins/extend/metadata.test.js
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { loadSkillExtendPluginVm } from './extend-vm.js';

describe('J-SkillExtend metadata (out/extend/J-SkillExtend.js)', () =>
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
    expect(sandbox.J.EXTEND.Metadata.name).toBe('J-SkillExtend');
    expect(sandbox.J.EXTEND.Metadata.version.major).toBe(1);
    expect(sandbox.J.EXTEND.Metadata.version.minor).toBe(2);
    expect(sandbox.J.EXTEND.Metadata.version.patch).toBe(1);
  });
});
//endregion plugins/extend/metadata.test.js

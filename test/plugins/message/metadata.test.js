//region plugins/message/metadata.test.js
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { loadMessagePluginVm } from './message-vm.js';

describe('J-MessageTextCodes metadata (out/message/J-MessageTextCodes.js)', () =>
{
  let sandbox;

  beforeAll(() =>
  {
    sandbox = { console };
    loadMessagePluginVm(sandbox);
  });

  afterAll(() =>
  {
    sandbox = null;
  });

  it('initializes J.MESSAGE metadata and regex', () =>
  {
    expect(sandbox.J.MESSAGE.Metadata.name).toBe('J-MessageTextCodes');
    expect(sandbox.J.MESSAGE.Metadata.version.major).toBe(1);
    expect(sandbox.J.MESSAGE.Metadata.version.minor).toBe(2);
    expect(sandbox.J.MESSAGE.Metadata.version.patch).toBe(1);

    expect(sandbox.J.MESSAGE.RegExp.LeaderChoiceConditional.test('<leaderChoiceCondition: 3>')).toBe(true);
    expect(sandbox.J.MESSAGE.RegExp.SwitchOffChoiceConditional.test('<switchOffChoiceCondition:2>')).toBe(true);
  });
});
//endregion plugins/message/metadata.test.js

//region plugins/message/metadata.test.js
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { loadMessagePluginVm } from './message-vm.js';

describe('J-MessageTextCodes metadata (out/J-MessageTextCodes.js)', () =>
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
    expect(sandbox.J.MESSAGE.Metadata.Name).toBe('J-MessageTextCodes');
    expect(sandbox.J.MESSAGE.Metadata.Version).toBe('1.2.1');

    expect(sandbox.J.MESSAGE.RegExp.LeaderChoiceConditional.test('<leaderChoiceCondition: 3>')).toBe(true);
    expect(sandbox.J.MESSAGE.RegExp.SwitchOffChoiceConditional.test('<switchOffChoiceCondition:2>')).toBe(true);
  });
});
//endregion plugins/message/metadata.test.js

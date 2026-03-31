//region plugins/message/game-message-choices.test.js
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { loadMessagePluginVm } from './message-vm.js';

describe('J-MessageTextCodes Game_Message choice hiding (out/J-MessageTextCodes.js)', () =>
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

  it('tracks hidden choices, and can backup/restore choices', () =>
  {
    const msg = new sandbox.Game_Message();
    msg._choices = [ 'a', 'b', 'c' ];
    msg.clear();

    expect(msg.isChoiceHidden(0)).toBe(false);
    msg.hideChoice(0, true);
    expect(msg.isChoiceHidden(0)).toBe(true);

    msg._choices = [ 'a', 'b', 'c' ];
    msg.backupChoices();
    msg._choices = [ 'x' ];
    msg.restoreChoices();
    expect(msg._choices).toEqual([ 'a', 'b', 'c' ]);
  });
});
//endregion plugins/message/game-message-choices.test.js

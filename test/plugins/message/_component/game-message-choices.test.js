//region plugins/message/_component/game-message-choices.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { installMessageHostGlobals, setPluginContextToJBase, setPluginContextToJMessage } from './fixtures/install-message-host-globals.js';

describe('J-MessageTextCodes Game_Message choice hiding (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installMessageHostGlobals();

    setPluginContextToJBase();
    await import('../../../../src/plugins/_base/core/_metadata/initialization.js');

    setPluginContextToJMessage();
    await import('../../../../src/plugins/message/core/_metadata/initialization.js');

    // vanilla accessor this file reads through.
    globalThis.Game_Message.prototype.choices = function() { return this._choices; };

    // patches globalThis.Game_Message.prototype directly, no vm involved.
    await import('../../../../src/plugins/message/core/objects/Game_Message.js');
  });

  it('tracks hidden choices, and can backup/restore choices', () =>
  {
    // Arrange
    const msg = new globalThis.Game_Message();
    msg._choices = [ 'a', 'b', 'c' ];
    msg.clear();

    // Act & Assert
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
//endregion plugins/message/_component/game-message-choices.test.js

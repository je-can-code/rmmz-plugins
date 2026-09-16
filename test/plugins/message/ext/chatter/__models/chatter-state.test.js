//region plugins/message/ext/chatter/__models/chatter-state.test.js
import { beforeAll, describe, expect, it } from 'vitest';

import ChatterProfile from '../../../../../../src/plugins/message/ext/chatter/__models/ChatterProfile.js';
import ChatterSession from '../../../../../../src/plugins/message/ext/chatter/__models/ChatterSession.js';
import ChatterState from '../../../../../../src/plugins/message/ext/chatter/__models/ChatterState.js';

/**
 * The one thing worth being careful about here is the difference between a wait that has not been
 * rolled yet and a wait that has been rolled and came up zero. Both are numbers, both mean "not
 * waiting", and only one of them should send the manager back to the dice.
 */
describe('J-Message-Chatter ChatterState (direct src import)', () =>
{
  beforeAll(() =>
  {
    // the model seeds its string field from String.empty, which J-Base installs onto the String
    // constructor.
    if (String.empty === undefined)
    {
      Object.defineProperty(String, 'empty', {
        value: '',
        writable: false,
        configurable: true,
      });
    }
  });

  /**
   * A state for a character with something to say.
   * @returns {ChatterState}
   */
  function declared()
  {
    const profile = ChatterProfile.fromValues({ lines: [ 'Lovely weather.' ] });

    return new ChatterState(profile);
  }

  it('remembers the profile it was declared with', () =>
  {
    // Arrange & Act
    const state = declared();

    // Assert
    expect(state.profile()
      .lines()).toEqual([ 'Lovely weather.' ]);
  });

  it('takes a newly-settled profile when the page changes', () =>
  {
    // Arrange
    const state = declared();
    const replacement = ChatterProfile.fromValues({ lines: [ 'Closing up.' ] });

    // Act
    state.setProfile(replacement);

    // Assert
    expect(state.profile()
      .lines()).toEqual([ 'Closing up.' ]);
  });

  it('starts owing a freshly rolled wait', () =>
  {
    // Arrange & Act
    const state = declared();

    // Assert
    expect(state.isAwaitingDelayRoll()).toBe(true);
  });

  it('stops owing a roll once one has been made', () =>
  {
    // Arrange
    const state = declared();

    // Act
    state.setDelayRemaining(42);

    // Assert
    expect(state.isAwaitingDelayRoll()).toBe(false);
    expect(state.delayRemaining()).toBe(42);
  });

  it('treats a wait that came up zero as rolled rather than as owed', () =>
  {
    // Arrange- the near miss for the sentinel, and the one that matters: a character due to speak
    // on the next frame would otherwise be sent back to roll a new wait, forever.
    const state = declared();

    // Act
    state.setDelayRemaining(0);

    // Assert
    expect(state.isAwaitingDelayRoll()).toBe(false);
  });

  it('starts free to speak rather than resting', () =>
  {
    // Arrange & Act
    const state = declared();

    // Assert
    expect(state.cooldownRemaining()).toBe(0);
  });

  it('takes a rest it has been given', () =>
  {
    // Arrange
    const state = declared();

    // Act
    state.setCooldownRemaining(600);

    // Assert
    expect(state.cooldownRemaining()).toBe(600);
  });

  it('starts quiet', () =>
  {
    // Arrange & Act
    const state = declared();

    // Assert
    expect(state.isSpeaking()).toBe(false);
    expect(state.session()).toBe(null);
  });

  it('is speaking once it has been given a line', () =>
  {
    // Arrange
    const state = declared();
    const session = new ChatterSession('Lovely weather.', state.profile(), false, 180, false);

    // Act
    state.setSession(session);

    // Assert
    expect(state.isSpeaking()).toBe(true);
    expect(state.session()).toBe(session);
  });

  it('is quiet again once its line has been taken away', () =>
  {
    // Arrange
    const state = declared();
    const session = new ChatterSession('Lovely weather.', state.profile(), false, 180, false);
    state.setSession(session);

    // Act
    state.setSession(null);

    // Assert
    expect(state.isSpeaking()).toBe(false);
  });

  it('starts having said nothing', () =>
  {
    // Arrange & Act
    const state = declared();

    // Assert
    expect(state.lastLine()).toBe('');
  });

  it('remembers the last thing it said', () =>
  {
    // Arrange
    const state = declared();

    // Act
    state.setLastLine('Lovely weather.');

    // Assert- kept past the end of the line that said it, because the repeat worth avoiding is the
    // one a player hears back to back.
    expect(state.lastLine()).toBe('Lovely weather.');
  });
});
//endregion plugins/message/ext/chatter/__models/chatter-state.test.js
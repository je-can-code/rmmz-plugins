//region plugins/message/_component/game-event-basic-conditional.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { installMessageHostGlobals, setPluginContextToJBase, setPluginContextToJMessage } from './fixtures/install-message-host-globals.js';
import JsonMapper from '../../../../src/plugins/_base/core/_utilities/JsonMapper.js';

describe('J-MessageTextCodes BasicChoiceConditional via Game_Event (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installMessageHostGlobals();

    setPluginContextToJBase();
    await import('../../../../src/plugins/_base/core/_metadata/initialization.js');

    setPluginContextToJMessage();
    await import('../../../../src/plugins/message/core/_metadata/initialization.js');

    globalThis.JsonMapper = JsonMapper;

    // patches globalThis.Game_Event directly (static methods), no vm involved.
    await import('../../../../src/plugins/message/core/objects/Game_Event.js');
  });

  it('parses leader and not-leader conditionals and evaluates them', () =>
  {
    // Arrange
    const actor = { actorId: () => 7 };
    globalThis.$gameParty.leader = function()
    {
      return actor;
    };
    const leaderCmd = { parameters: [ '<leaderChoiceCondition:7>' ] };
    const notLeaderCmd = { parameters: [ '<notLeaderChoiceCondition:3>' ] };

    // Act
    const leaderConditional = globalThis.Game_Event.toBasicConditional(leaderCmd);
    const notLeaderConditional = globalThis.Game_Event.toBasicConditional(notLeaderCmd);

    // Assert
    expect(leaderConditional.isMet()).toBe(true);
    expect(notLeaderConditional.isMet()).toBe(true);
  });

  it('parses switch on/off conditionals and evaluates them', () =>
  {
    // Arrange
    globalThis.$gameSwitches.value = function(id)
    {
      return id === 5;
    };
    const onCmd = { parameters: [ '<switchOnChoiceCondition:5>' ] };
    const offCmd = { parameters: [ '<switchOffChoiceCondition:6>' ] };

    // Act
    const onConditional = globalThis.Game_Event.toBasicConditional(onCmd);
    const offConditional = globalThis.Game_Event.toBasicConditional(offCmd);

    // Assert
    expect(onConditional.isMet()).toBe(true);
    expect(offConditional.isMet()).toBe(true);
  });

  describe('filterCommentCommandsForBasicConditionals', () =>
  {
    it('keeps a comment carrying any of the four conditional tags', () =>
    {
      // Arrange
      const command = { parameters: [ '<leaderChoiceCondition:7>' ] };

      // Act
      const kept = globalThis.Game_Event.filterCommentCommandsForBasicConditionals(command);

      // Assert
      expect(kept).toBe(true);
    });

    it('drops a comment that carries none of them', () =>
    {
      // Arrange- event pages are full of ordinary developer comments, and every one of them reaches
      // this filter.
      const command = { parameters: [ 'just a note to self' ] };

      // Act
      const kept = globalThis.Game_Event.filterCommentCommandsForBasicConditionals(command);

      // Assert
      expect(kept).toBe(false);
    });

    it('drops a command with no comment text at all', () =>
    {
      // Arrange- a comment command's continuation rows arrive with an empty parameter, and testing a
      // regex against nothing is what this guard exists to avoid.
      const command = { parameters: [ '' ] };

      // Act
      const kept = globalThis.Game_Event.filterCommentCommandsForBasicConditionals(command);

      // Assert
      expect(kept).toBe(false);
    });
  });

  describe('isMet for an unrecognized conditional type', () =>
  {
    it('permits the choice rather than hiding it', () =>
    {
      // Arrange- a conditional whose type matches no known case is a tag this build does not
      // understand. Showing the choice is the safe answer: hiding it would silently remove a branch
      // of dialogue with nothing anywhere reporting why.
      const conditional = globalThis.Game_Event.toBasicConditional({
        parameters: [ '<leaderChoiceCondition:7>' ],
      });
      conditional.type = 'a type from some future build';

      // Act
      const isMet = conditional.isMet();

      // Assert
      expect(isMet).toBe(true);
    });
  });
});
//endregion plugins/message/_component/game-event-basic-conditional.test.js

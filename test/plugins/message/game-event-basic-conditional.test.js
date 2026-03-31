//region plugins/message/game-event-basic-conditional.test.js
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { loadMessagePluginVm } from './message-vm.js';

describe('J-MessageTextCodes BasicChoiceConditional via Game_Event (out/J-MessageTextCodes.js)', () =>
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

  it('parses leader and not-leader conditionals and evaluates them', () =>
  {
    const actor = { actorId: () => 7 };
    sandbox.$gameParty.leader = function()
    {
      return actor;
    };

    const leaderCmd = { parameters: [ '<leaderChoiceCondition:7>' ] };
    const notLeaderCmd = { parameters: [ '<notLeaderChoiceCondition:3>' ] };
    const leaderConditional = sandbox.Game_Event.toBasicConditional(leaderCmd);
    const notLeaderConditional = sandbox.Game_Event.toBasicConditional(notLeaderCmd);

    expect(leaderConditional.isMet()).toBe(true);
    expect(notLeaderConditional.isMet()).toBe(true);
  });

  it('parses switch on/off conditionals and evaluates them', () =>
  {
    sandbox.$gameSwitches.value = function(id)
    {
      return id === 5;
    };

    const onCmd = { parameters: [ '<switchOnChoiceCondition:5>' ] };
    const offCmd = { parameters: [ '<switchOffChoiceCondition:6>' ] };
    const onConditional = sandbox.Game_Event.toBasicConditional(onCmd);
    const offConditional = sandbox.Game_Event.toBasicConditional(offCmd);

    expect(onConditional.isMet()).toBe(true);
    expect(offConditional.isMet()).toBe(true);
  });
});
//endregion plugins/message/game-event-basic-conditional.test.js

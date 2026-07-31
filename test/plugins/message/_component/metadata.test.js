//region plugins/message/_component/metadata.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { installMessageHostGlobals, setPluginContextToJBase, setPluginContextToJMessage } from './fixtures/install-message-host-globals.js';

describe('J-MessageTextCodes metadata (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installMessageHostGlobals();

    setPluginContextToJBase();
    await import('../../../../src/plugins/_base/_metadata/initialization.js');

    setPluginContextToJMessage();
    await import('../../../../src/plugins/message/core/_metadata/initialization.js');
  });

  it('matches a leader choice conditional carrying the optional space after the colon', () =>
  {
    // Arrange & Act & Assert
    expect(globalThis.J.MESSAGE.RegExp.LeaderChoiceConditional.test('<leaderChoiceCondition: 3>')).toBe(true);
  });

  it('matches a switch-off choice conditional written without the optional space', () =>
  {
    // Arrange & Act & Assert
    expect(globalThis.J.MESSAGE.RegExp.SwitchOffChoiceConditional.test('<switchOffChoiceCondition:2>')).toBe(true);
  });
});
//endregion plugins/message/_component/metadata.test.js

//region plugins/message/metadata.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { installMessageHostGlobals, setPluginContextToJBase, setPluginContextToJMessage } from './fixtures/install-message-host-globals.js';

describe('J-MessageTextCodes metadata (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installMessageHostGlobals();

    setPluginContextToJBase();
    await import('../../../src/plugins/_base/_metadata/initialization.js');

    setPluginContextToJMessage();
    await import('../../../src/plugins/message/core/_metadata/initialization.js');
  });

  it('initializes J.MESSAGE metadata and regex', () =>
  {
    // Arrange & Act & Assert
    expect(globalThis.J.MESSAGE.Metadata.name).toBe('J-MessageTextCodes');
    expect(globalThis.J.MESSAGE.RegExp.LeaderChoiceConditional.test('<leaderChoiceCondition: 3>')).toBe(true);
    expect(globalThis.J.MESSAGE.RegExp.SwitchOffChoiceConditional.test('<switchOffChoiceCondition:2>')).toBe(true);
  });
});
//endregion plugins/message/metadata.test.js

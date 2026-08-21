//region plugins/prof/ext/knowledge/_metadata/plugin-commands.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * RMMZ hands every plugin command argument over as a string, including the ones that are obviously
 * numbers. A command that forgets to parse them does not fail- it quietly writes to variable "21"
 * rather than variable 21, and the event branching on the result simply never fires.
 */
describe('J-Proficiency-Knowledge plugin commands', () =>
{
  let registered;
  let exchangeSpy;
  let reportSpy;

  beforeAll(async () =>
  {
    vi.resetModules();

    registered = new Map();

    globalThis.PluginManager = {
      registerCommand(pluginName, commandName, handler)
      {
        registered.set(commandName, handler);
      },
    };

    globalThis.J = {
      PROF: {
        EXT: {
          KNOWLEDGE: { Metadata: { name: 'J-Proficiency-Knowledge' } },
        },
      },
    };

    await import('../../../../../../src/plugins/prof/ext/knowledge/_metadata/pluginCommands.js');

    const { default: KnowledgeExchangeManager } =
      await import('../../../../../../src/plugins/prof/ext/knowledge/managers/KnowledgeExchangeManager.js');

    // both stand in for the real thing, because this file is about what the command does with its
    // arguments rather than about the transaction underneath it. mockReset would put the originals
    // back, so the implementations are installed once and only the call log is cleared per test.
    exchangeSpy = vi.spyOn(KnowledgeExchangeManager, 'exchange')
      .mockImplementation(() => ({
        units: 1,
        granted: 1,
      }));
    reportSpy = vi.spyOn(KnowledgeExchangeManager, 'report')
      .mockImplementation(() =>
      {
      });
  });

  beforeEach(() =>
  {
    exchangeSpy.mockClear();
    reportSpy.mockClear();
  });

  it('performs the exchange the event named', () =>
  {
    // Arrange
    const handler = registered.get('exchange-knowledge');

    // Act
    handler({
      exchangeKey: 'vitest_blueprints',
      resultVariableId: '21',
      resultSwitchId: '31',
    });

    // Assert
    expect(exchangeSpy).toHaveBeenCalledWith('vitest_blueprints');
  });

  it('parses the result ids out of the strings RMMZ delivers them as', () =>
  {
    // Arrange
    const handler = registered.get('exchange-knowledge');

    // Act
    handler({
      exchangeKey: 'vitest_blueprints',
      resultVariableId: '21',
      resultSwitchId: '31',
    });

    // Assert- numbers, not the strings they arrived as.
    expect(reportSpy).toHaveBeenCalledWith({
      units: 1,
      granted: 1,
    }, 21, 31);
  });
});
//endregion plugins/prof/ext/knowledge/_metadata/plugin-commands.test.js
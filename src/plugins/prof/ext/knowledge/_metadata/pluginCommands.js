//region plugin commands
import KnowledgeExchangeManager from '../managers/KnowledgeExchangeManager.js';

/**
 * Plugin command for converting a tag's banked knowledge into whatever the named exchange offers.
 */
PluginManager.registerCommand(J.PROF.EXT.KNOWLEDGE.Metadata.name, 'exchange-knowledge', args =>
{
  const {
    exchangeKey,
    resultVariableId,
    resultSwitchId
  } = args;

  // every argument arrives as a string, so the ids are worthless until they are numbers.
  const parsedVariableId = parseInt(resultVariableId, 10);
  const parsedSwitchId = parseInt(resultSwitchId, 10);

  const result = KnowledgeExchangeManager.exchange(exchangeKey);

  KnowledgeExchangeManager.report(result, parsedVariableId, parsedSwitchId);
});
//endregion plugin commands
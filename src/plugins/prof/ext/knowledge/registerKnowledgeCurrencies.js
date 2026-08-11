//region registerKnowledgeCurrencies
/**
 * Puts every kind of knowledge on the menu's currency strip.
 *
 * The menu is genuinely optional here- knowledge accrues and is spent perfectly well without one- so
 * this is the single namespace check that arrangement is allowed. J-CMS knows nothing about knowledge
 * in return; it publishes a strip and anything with something to show registers itself.
 *
 * The tags are read out of configuration rather than named here, so a game adding a fifth kind of
 * knowledge gets it on the strip without anybody touching this file.
 */
if (J.CMS)
{
  J.PROF.EXT.KNOWLEDGE.Metadata.tags.forEach(tag =>
  {
    const definition = new CurrencyDefinition(
      `knowledge-${tag.key}`,
      tag.iconIndex,
      () => tag.name,
      () => $gameParty.knowledgePoints(tag.key));

    Window_Currencies.register(definition);
  });
}
//endregion registerKnowledgeCurrencies
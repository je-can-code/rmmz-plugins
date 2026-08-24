//region JPassiveAffix_PluginMetadata
/**
 * Extends {@link #effectivePrefixPool}.<br/>
 * Also substitutes the difficulty-adjusted pool once one has been built.
 *
 * Aliasing a prototype method works here even though the metadata instance was constructed long
 * before this file ran: methods live on the prototype, dispatch resolves at call time, and the
 * instance carries no own property shadowing them - so the existing instance sees the replacement.
 */
J.DIFFICULTY.EXT.AFFIX.Aliased.JPassiveAffix_PluginMetadata.set(
  'effectivePrefixPool',
  JPassiveAffix_PluginMetadata.prototype.effectivePrefixPool);
JPassiveAffix_PluginMetadata.prototype.effectivePrefixPool = function()
{
  // perform original logic.
  const original = J.DIFFICULTY.EXT.AFFIX.Aliased.JPassiveAffix_PluginMetadata.get('effectivePrefixPool')
    .call(this);

  const adjusted = J.DIFFICULTY.EXT.AFFIX.Metadata.effectivePrefixPool();

  // a cold cache means no layer has been evaluated yet, which is not the same as no layer having
  // any effect - the authored pool is the honest answer until there is something to say instead.
  if (adjusted === null) return original;

  return adjusted;
};

/**
 * Extends {@link #effectiveSuffixPool}.<br/>
 * Also substitutes the difficulty-adjusted pool once one has been built.
 */
J.DIFFICULTY.EXT.AFFIX.Aliased.JPassiveAffix_PluginMetadata.set(
  'effectiveSuffixPool',
  JPassiveAffix_PluginMetadata.prototype.effectiveSuffixPool);
JPassiveAffix_PluginMetadata.prototype.effectiveSuffixPool = function()
{
  // perform original logic.
  const original = J.DIFFICULTY.EXT.AFFIX.Aliased.JPassiveAffix_PluginMetadata.get('effectiveSuffixPool')
    .call(this);

  const adjusted = J.DIFFICULTY.EXT.AFFIX.Metadata.effectiveSuffixPool();

  // same cold-cache policy as the prefix slot.
  if (adjusted === null) return original;

  return adjusted;
};
//endregion JPassiveAffix_PluginMetadata
//region plugin commands
/**
 * Plugin command for doing the thing.
 */
PluginManager.registerCommand(
  J.__TEMPLATE__.Metadata.name,
  "do-the-thing",
  args =>
{
  console.log('did the thing.');
});
//endregion plugin commands
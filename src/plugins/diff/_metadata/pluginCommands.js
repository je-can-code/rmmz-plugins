//region plugin commands
/**
 * Plugin command for calling the Difficulty scene/menu.
 */
PluginManager.registerCommand(J.DIFFICULTY.Metadata.Name, "callDifficultyMenu", () =>
{
  Scene_Difficulty.callScene();
});

/**
 * Plugin command for calling the locking one or many difficulties.
 */
PluginManager.registerCommand(J.DIFFICULTY.Metadata.Name, "lockDifficulty", args =>
{
  let {keys} = args;
  keys = JSON.parse(keys);
  keys.forEach(key =>
  {
    DifficultyManager.lockDifficulty(key);
  });
});

/**
 * Plugin command for calling the unlocking one or many difficulties.
 */
PluginManager.registerCommand(J.DIFFICULTY.Metadata.Name, "unlockDifficulty", args =>
{
  let {keys} = args;
  keys = JSON.parse(keys);
  keys.forEach(key =>
  {
    DifficultyManager.unlockDifficulty(key);
  });
});

/**
 * Plugin command for hiding one or many difficulties.
 */
PluginManager.registerCommand(J.DIFFICULTY.Metadata.Name, "hideDifficulty", args =>
{
  let {keys} = args;
  keys = JSON.parse(keys);
  keys.forEach(key =>
  {
    DifficultyManager.hideDifficulty(key);
  });
});

/**
 * Plugin command for unhiding one or many difficulties.
 */
PluginManager.registerCommand(J.DIFFICULTY.Metadata.Name, "unhideDifficulty", args =>
{
  let {keys} = args;
  keys = JSON.parse(keys);
  keys.forEach(key =>
  {
    DifficultyManager.unhideDifficulty(key);
  });
});

/**
 * Plugin command for enabling one or many difficulties.
 */
PluginManager.registerCommand(J.DIFFICULTY.Metadata.Name, "enableDifficulty", args =>
{
  let {keys} = args;
  keys = JSON.parse(keys);
  keys.forEach(key =>
  {
    DifficultyManager.enableDifficulty(key);
  });
});

/**
 * Plugin command for disabling one or many difficulties.
 */
PluginManager.registerCommand(J.DIFFICULTY.Metadata.Name, "disableDifficulty", args =>
{
  let {keys} = args;
  keys = JSON.parse(keys);
  keys.forEach(key =>
  {
    DifficultyManager.disableDifficulty(key);
  });
});

/**
 * Plugin command for modifying the max layer points.
 */
PluginManager.registerCommand(J.DIFFICULTY.Metadata.Name, "modifyLayerMax", args =>
{
  const { amount } = args;
  const parsedAmount = parseInt(amount);
  $gameSystem.modLayerPointMax(parsedAmount);
});
//endregion plugin commands
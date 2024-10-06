//region plugin commands
/**
 * Plugin command for calling the Difficulty scene/menu.
 */
PluginManager.registerCommand(J.DIFFICULTY.Metadata.name, "callDifficultyMenu", () =>
{
  Scene_Difficulty.callScene();
});

/**
 * Plugin command for calling the locking one or many difficulties.
 */
PluginManager.registerCommand(J.DIFFICULTY.Metadata.name, "lockDifficulty", args =>
{
  let { keys } = args;
  keys = JSON.parse(keys);
  keys.forEach(key =>
  {
    DifficultyManager.lockDifficulty(key);
  });
});

/**
 * Plugin command for calling the unlocking one or many difficulties.
 */
PluginManager.registerCommand(J.DIFFICULTY.Metadata.name, "unlockDifficulty", args =>
{
  let { keys } = args;
  keys = JSON.parse(keys);
  keys.forEach(key =>
  {
    DifficultyManager.unlockDifficulty(key);
  });
});

/**
 * Plugin command for hiding one or many difficulties.
 */
PluginManager.registerCommand(J.DIFFICULTY.Metadata.name, "hideDifficulty", args =>
{
  let { keys } = args;
  keys = JSON.parse(keys);
  keys.forEach(key =>
  {
    DifficultyManager.hideDifficulty(key);
  });
});

/**
 * Plugin command for unhiding one or many difficulties.
 */
PluginManager.registerCommand(J.DIFFICULTY.Metadata.name, "unhideDifficulty", args =>
{
  let { keys } = args;
  keys = JSON.parse(keys);
  keys.forEach(key =>
  {
    DifficultyManager.unhideDifficulty(key);
  });
});

/**
 * Plugin command for enabling one or many difficulties.
 */
PluginManager.registerCommand(J.DIFFICULTY.Metadata.name, "enableDifficulty", args =>
{
  let { keys } = args;
  keys = JSON.parse(keys);
  keys.forEach(key =>
  {
    DifficultyManager.enableDifficulty(key);
  });
});

/**
 * Plugin command for disabling one or many difficulties.
 */
PluginManager.registerCommand(J.DIFFICULTY.Metadata.name, "disableDifficulty", args =>
{
  let { keys } = args;
  keys = JSON.parse(keys);
  keys.forEach(key =>
  {
    DifficultyManager.disableDifficulty(key);
  });
});

/**
 * Plugin command for modifying the max layer points.
 */
PluginManager.registerCommand(J.DIFFICULTY.Metadata.name, "modifyLayerMax", args =>
{
  const { amount } = args;
  const parsedAmount = parseInt(amount);
  $gameSystem.modLayerPointMax(parsedAmount);
});
//endregion plugin commands
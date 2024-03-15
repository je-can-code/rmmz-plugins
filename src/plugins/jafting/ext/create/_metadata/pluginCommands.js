//region plugin commands
/**
 * A plugin command.<br>
 * Calls the JAFTING creation menu.
 */
PluginManager.registerCommand(
  J.JAFTING.EXT.CREATE.Metadata.name,
  "call-menu",
  () =>
  {
    Scene_JaftingCreate.callScene();
  });

/**
 * A plugin command.<br>
 * Unlocks all categories matching the provided keys.
 */
PluginManager.registerCommand(
  J.JAFTING.EXT.CREATE.Metadata.name,
  "unlock-categories",
  args =>
  {
    const {categoryKeys} = args;

    const parsedCategoryKeys = JSON.parse(categoryKeys);
    parsedCategoryKeys.forEach($gameParty.unlockCategory, $gameParty);
  });

/**
 * A plugin command.<br>
 * Unlocks all categories matching the provided keys.
 */
PluginManager.registerCommand(
  J.JAFTING.EXT.CREATE.Metadata.name,
  "lock-categories",
  args =>
  {
    const {categoryKeys} = args;

    const parsedCategoryKeys = JSON.parse(categoryKeys);
    parsedCategoryKeys.forEach($gameParty.lockCategory, $gameParty);
  });

/**
 * A plugin command.<br>
 * Unlocks all recipes matching the provided keys.<br>
 * If the owning categories are not unlocked, the recipes won't be accessible.
 */
PluginManager.registerCommand(
  J.JAFTING.EXT.CREATE.Metadata.name,
  "unlock-recipes",
  args =>
{
  const {recipeKeys} = args;

  const parsedRecipeKeys = JSON.parse(recipeKeys);
  parsedRecipeKeys.forEach($gameParty.unlockRecipe, $gameParty);
});

/**
 * A plugin command.<br>
 * Unlocks all categories matching the provided keys.
 */
PluginManager.registerCommand(
  J.JAFTING.EXT.CREATE.Metadata.name,
  "lock-recipes",
  args =>
  {
    const {recipeKeys} = args;

    const parsedRecipeKeys = JSON.parse(recipeKeys);
    parsedRecipeKeys.forEach($gameParty.lockRecipe, $gameParty);
  });

/**
 * A plugin command.<br>
 * Unlocks all categories.
 */
PluginManager.registerCommand(
  J.JAFTING.EXT.CREATE.Metadata.name,
  "unlock-all-categories",
  () =>
  {
    $gameParty.unlockAllCategories();
  });

/**
 * A plugin command.<br>
 * Unlocks all categories.
 */
PluginManager.registerCommand(
  J.JAFTING.EXT.CREATE.Metadata.name,
  "lock-all-categories",
  () =>
  {
    $gameParty.lockAllCategories();
  });

/**
 * A plugin command.<br>
 * Unlocks all recipes.
 */
PluginManager.registerCommand(
  J.JAFTING.EXT.CREATE.Metadata.name,
  "unlock-all-recipes",
  () =>
  {
    $gameParty.unlockAllRecipes();
  });

/**
 * A plugin command.<br>
 * Unlocks all recipes.
 */
PluginManager.registerCommand(
  J.JAFTING.EXT.CREATE.Metadata.name,
  "lock-all-recipes",
  () =>
  {
    $gameParty.lockAllRecipes();
  });
//endregion plugin commands
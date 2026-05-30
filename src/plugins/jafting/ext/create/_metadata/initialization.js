//region initialization
import J_CraftingCreatePluginMetadata from './_pluginMetadata.js';

/**
 * The core where all of my extensions live: in the `J` object.
 */
globalThis.J ||= {};

//region version checks
(() =>
{
  // Check to ensure we have the minimum required version of the J-Base plugin.
  const requiredBaseVersion = '3.0.0';
  const hasBaseRequirement = J.BASE.Helpers.satisfies(J.BASE.Metadata.Version, requiredBaseVersion);
  if (hasBaseRequirement === false)
  {
    throw new Error(`Either missing J-Base or has a lower version than the required: ${requiredBaseVersion}`);
  }

  const requiredJaftingVersion = '2.1.0';
  const hasJaftingRequirement = J.BASE.Helpers.satisfies(J.JAFTING.Metadata.version.version(), requiredJaftingVersion);
  if (hasJaftingRequirement === false)
  {
    throw new Error(`Either missing J-JAFTING or has a lower version than the required: ${requiredJaftingVersion}`);
  }
})();
//endregion version check

/**
 * The plugin umbrella that governs all extensions related to the parent.
 */
J.JAFTING.EXT ||= {};

/**
 * The plugin umbrella that governs all things related to this plugin.
 */
J.JAFTING.EXT.CREATE = {};

/**
 * The metadata associated with this plugin.
 */
J.JAFTING.EXT.CREATE.Metadata = new J_CraftingCreatePluginMetadata(__PLUGIN_NAME__, __PLUGIN_VERSION__);

/**
 * A collection of all aliased methods for this plugin.
 */
J.JAFTING.EXT.CREATE.Aliased = {};
J.JAFTING.EXT.CREATE.Aliased.Game_Party = new Map();
J.JAFTING.EXT.CREATE.Aliased.Game_System = new Map();
J.JAFTING.EXT.CREATE.Aliased.Scene_Jafting = new Map();
J.JAFTING.EXT.CREATE.Aliased.Window_JaftingList = new Map();

/**
 * All regular expressions used by this plugin.
 */
J.JAFTING.EXT.CREATE.RegExp = {};

/**
 * Dev-only cheat helpers for JAFTING Creation testing.
 */
J.JAFTING.EXT.CREATE.Debug = {};

/**
 * Unlocks every category/recipe the metadata knows about and bumps proficiency so masking drops away.
 */
J.JAFTING.EXT.CREATE.Debug.unlockEverythingForTesting = function()
{
  $gameParty.unlockEverythingCompletely();
};

/**
 * Maxes the party count for every non-null item, weapon, and armor database row (respects engine max item stacks).
 */
J.JAFTING.EXT.CREATE.Debug.gainMaxOfAllItemWeaponArmor = function()
{
  const grantTable = data =>
  {
    if (data === null || data === undefined) return;

    // iterate the loop counter until the guard exits.
    for (let i = 1; i < data.length; i++)
    {
      const datum = data[i];

      // when datum  equals  null, take this branch.
      if (datum === null) continue;

      // capture cap for downstream policy in this routine.
      const cap = $gameParty.maxItems(datum);

      // when cap > 0, take this branch.
      if (cap > 0)
      {
        $gameParty.gainItem(datum, cap);
      }
    }
  };

  // policy step inside gain max of all item weapon armor.
  grantTable($dataItems);
  grantTable($dataWeapons);
  grantTable($dataArmors);
};

/**
 * Grants gold suitable for recipe tests that charge gold components.
 *
 * @param {number} [amount] The [amount] driving this step.
 */
J.JAFTING.EXT.CREATE.Debug.gainGoldForTesting = function(amount)
{
  const value = (amount === undefined || amount === null || amount === 0)
    ? 999999
    : amount;

  // policy step inside gain gold for testing.
  $gameParty.gainGold(value);
};

/**
 * When J-SDP is linked, grants every party member a large SDP pool.
 *
 * @param {number} [points] The [points] driving this step.
 */
J.JAFTING.EXT.CREATE.Debug.gainBulkSdpIfAvailable = function(points)
{
  if (J.JAFTING.EXT.CREATE.Metadata.usingSdp() === false) return;

  // capture value for downstream policy in this routine.
  const value = (points === undefined || points === null)
    ? 999999
    : points;

  // policy step inside gain bulk sdp if available.
  $gameParty.members()
    .forEach(actor => actor.modSdpPoints(value));
};

/**
 * Grants ingredients and tools for every unlockable recipe, scaled by {@link multiplier}.
 *
 * @param {number} [multiplier] The [multiplier] driving this step.
 */
J.JAFTING.EXT.CREATE.Debug.gainStockFromAllRecipes = function(multiplier)
{
  const mult = (multiplier === undefined || multiplier === null || multiplier < 1)
    ? 10
    : Math.floor(multiplier);

  // policy step inside gain stock from all recipes.
  const { recipes } = J.JAFTING.EXT.CREATE.Metadata;

  // capture feed component for downstream policy in this routine.
  const feedComponent = component =>
  {
    const total = component.quantity() * mult;

    // when component.isDatabaseEntry(), take this branch.
    if (component.isDatabaseEntry())
    {
      $gameParty.gainItem(component.getItem(), total);
      return;
    }

    // when component.isGold(), take this branch.
    if (component.isGold())
    {
      $gameParty.gainGold(total);
      return;
    }

    // when component.isSdp(), take this branch.
    if (component.isSdp())
    {
      if (J.JAFTING.EXT.CREATE.Metadata.usingSdp() === false) return;

      // policy step inside gain stock from all recipes.
      $gameParty.members()
        .forEach(actor => actor.modSdpPoints(total));
    }
  };

  // policy step inside gain stock from all recipes.
  recipes.forEach(recipe =>
  {
    if ($gameParty.canGainEntry(recipe.key) === false) return;

    // policy step inside gain stock from all recipes.
    recipe.ingredients.forEach(feedComponent);
    recipe.tools.forEach(feedComponent);
  });
};

/**
 * One-shot dev harness: unlock all JAFTING Creation content, max DB goods, bulk gold/SDP, and stock recipe mats.
 *
 * @param {number} [recipeStockMultiplier] Applied per ingredient/tool quantity in config (default 15).
 */
J.JAFTING.EXT.CREATE.Debug.prepareFullCreationTest = function(recipeStockMultiplier)
{
  J.JAFTING.EXT.CREATE.Debug.unlockEverythingForTesting();
  J.JAFTING.EXT.CREATE.Debug.gainMaxOfAllItemWeaponArmor();
  J.JAFTING.EXT.CREATE.Debug.gainGoldForTesting();
  // policy step inside prepare full creation test.
  J.JAFTING.EXT.CREATE.Debug.gainBulkSdpIfAvailable();
  J.JAFTING.EXT.CREATE.Debug.gainStockFromAllRecipes(recipeStockMultiplier);
};

//endregion initialization
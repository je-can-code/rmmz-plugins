//region jaftingCreationDebug
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

    for (let i = 1; i < data.length; i++)
    {
      const datum = data[i];

      if (datum === null) continue;

      const cap = $gameParty.maxItems(datum);

      if (cap > 0)
      {
        $gameParty.gainItem(datum, cap);
      }
    }
  };

  grantTable($dataItems);
  grantTable($dataWeapons);
  grantTable($dataArmors);
};

/**
 * Grants gold suitable for recipe tests that charge gold components.
 *
 * @param {number} [amount]
 */
J.JAFTING.EXT.CREATE.Debug.gainGoldForTesting = function(amount)
{
  const value = (amount === undefined || amount === null || amount === 0)
    ? 999999
    : amount;

  $gameParty.gainGold(value);
};

/**
 * When J-SDP is linked, grants every party member a large SDP pool.
 *
 * @param {number} [points]
 */
J.JAFTING.EXT.CREATE.Debug.gainBulkSdpIfAvailable = function(points)
{
  if (J.JAFTING.EXT.CREATE.Metadata.usingSdp() === false) return;

  const value = (points === undefined || points === null)
    ? 999999
    : points;

  $gameParty.members()
    .forEach(actor => actor.modSdpPoints(value));
};

/**
 * Grants ingredients and tools for every unlockable recipe, scaled by {@link multiplier}.
 *
 * @param {number} [multiplier]
 */
J.JAFTING.EXT.CREATE.Debug.gainStockFromAllRecipes = function(multiplier)
{
  const mult = (multiplier === undefined || multiplier === null || multiplier < 1)
    ? 10
    : Math.floor(multiplier);

  const {recipes} = J.JAFTING.EXT.CREATE.Metadata;

  const feedComponent = component =>
  {
    const total = component.quantity() * mult;

    if (component.isDatabaseEntry())
    {
      $gameParty.gainItem(component.getItem(), total);
      return;
    }

    if (component.isGold())
    {
      $gameParty.gainGold(total);
      return;
    }

    if (component.isSdp())
    {
      if (J.JAFTING.EXT.CREATE.Metadata.usingSdp() === false) return;

      $gameParty.members()
        .forEach(actor => actor.modSdpPoints(total));
    }
  };

  recipes.forEach(recipe =>
  {
    if ($gameParty.canGainEntry(recipe.key) === false) return;

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
  J.JAFTING.EXT.CREATE.Debug.gainBulkSdpIfAvailable();
  J.JAFTING.EXT.CREATE.Debug.gainStockFromAllRecipes(recipeStockMultiplier);
};

//endregion jaftingCreationDebug
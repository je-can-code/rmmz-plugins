//region Game_Party
/**
 * Determines whether an item, weapon, or armor datum should be stripped from the party.
 * Treats missing rows, blank names after trim, and names starting with "===" as invalid.
 *
 * @param {RPG.BaseItem|undefined|null} datum The `$dataItems` / `$dataWeapons` / `$dataArmors` row.
 * @returns {boolean} True when the row should be removed from bags and equipment.
 */
Game_Party.isInvalidInventoryDatum = function(datum)
{
  if (datum === undefined || datum === null)
  {
    return true;
  }

  const rawName = datum.name;
  if (rawName === undefined || rawName === null)
  {
    return true;
  }

  const name = String(rawName).trim();
  if (name === '')
  {
    return true;
  }

  if (name.indexOf('===') === 0)
  {
    return true;
  }

  return false;
};

/**
 * Removes invalid items, weapons, and armors from party containers and from equipped slots.
 * Invalid rows are null/undefined database entries, blank display names, or names starting with "===".
 *
 * Call after load or from a Common Event when migrating saves.
 */
Game_Party.prototype.removeInvalidItemsFromParty = function()
{
  const purgeContainer = (container, dataTable) =>
  {
    const keys = Object.keys(container);
    for (let i = 0; i < keys.length; i++)
    {
      const key = keys[i];
      const id = Number(key);
      const datum = dataTable[id];
      if (Game_Party.isInvalidInventoryDatum(datum))
      {
        delete container[key];
      }
    }
  };

  purgeContainer(this.rawItems(), $dataItems);
  purgeContainer(this.rawWeapons(), $dataWeapons);
  purgeContainer(this.rawArmors(), $dataArmors);

  const members = this.members();
  for (let i = 0; i < members.length; i++)
  {
    const actor = members[i];
    const equips = actor.equips();
    for (let s = 0; s < equips.length; s++)
    {
      const datum = equips[s];
      if (datum && Game_Party.isInvalidInventoryDatum(datum))
      {
        actor.discardEquip(datum);
      }
    }
    actor.refresh();
  }

  $gameMap.requestRefresh();
};
//endregion Game_Party
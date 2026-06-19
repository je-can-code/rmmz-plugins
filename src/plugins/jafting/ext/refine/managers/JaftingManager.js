//region JaftingManager
import JAFTING_Trait from './../__models/JAFTING_Trait.js';

/**
 * A class responsible for handling interactions between the JAFTING data stores,
 * and the mutating the data itself.
 */
class JaftingManager
{
  /**
   * A collection of categories of equipment that are refinable.
   */
  static RefinementTypes = {
    Armor: "armor",
    Weapon: "weapon",
  }

  /**
   * The starting index for when our custom refined equips will be saved into the
   * target datastore.
   * @type {number}
   */
  static StartingIndex = 2001;

  /**
   * Parses all traits off the equipment that are below the "divider".
   * The divider is NOT parameterized, the "collapse effect" trait is the perfect trait
   * to use for this purpose since it has 0 use on actor equipment.
   * @param {RPG_EquipItem} equip An equip to parse traits off of.
   * @returns {JAFTING_Trait[]}
   */
  static parseTraits(equip)
  {
    // shallow copy of the traits (which is all we need- traits aren't layered).
    const allTraits = [ ...equip.traits ];

    // identify where the divider is.
    const divider = allTraits.findIndex(trait => trait.code === 63);

    // if there was no divider, then there are no traits to parse.
    if (divider === -1) return Array.empty;

    // grab all the traits AFTER the divider.
    const availableTraits = allTraits.splice(divider + 1);

    // if we had a divider but nothing after it, then there are no traits to parse.
    if (availableTraits.length === 0) return Array.empty;

    // consolidate same-dataId parameter traits before returning for display/count purposes.
    const consolidated = TraitResolver.consolidate(availableTraits);

    // map consolidated traits into JAFTING traits.
    return consolidated.map(t => new JAFTING_Trait(t.code, t.dataId, t.value));
  }

  /**
   * Determines the result of refining a given base with a given material.
   * Trait merging is delegated to {@link TraitResolver.refineTraits}.
   * @param {RPG_EquipItem} base An equip to refine.
   * @param {RPG_EquipItem} material An equip to consume as the refinement material.
   * @returns {RPG_EquipItem}
   */
  static determineRefinementOutput(base, material)
  {
    // don't process if we are missing a parameter.
    if (!base || !material) return null;

    // extract transferable traits from both equips as RPG_Trait arrays.
    const baseRpgTraits = this.parseTraits(base)
      .map(t => RPG_Trait.fromValues(t._code, t._dataId, t._value));
    const materialRpgTraits = this.parseTraits(material)
      .map(t => RPG_Trait.fromValues(t._code, t._dataId, t._value));

    // resolve the merge with "keep better" semantics.
    let mergedTraits = TraitResolver.refineTraits(baseRpgTraits, materialRpgTraits);

    // strip any seal-slot trait that would seal the equip's own slot.
    mergedTraits = mergedTraits.filter(t => !(t.code === 54 && t.dataId === base.etypeId));

    // clone the base equip as the starting point for the output.
    const output = base._generate(base, base._index());

    // locate or insert the divider in the output's trait list.
    const dividerIndex = output.traits.findIndex(trait => trait.code === 63);
    if (dividerIndex === -1)
    {
      // no divider yet — add one before we append the merged traits.
      output.traits.push(JAFTING_Trait.divider());
    }
    else
    {
      // divider exists — truncate everything after it so we start clean.
      output.traits.splice(dividerIndex + 1);
    }

    // push all merged traits after the divider.
    mergedTraits.forEach(t => output.traits.push(t));

    if (material.jaftingRefinedCount > 0)
    {
      // the -1 at the end is to accommodate the default of +1 that occurs when an equip is refined.
      output.jaftingRefinedCount += material.jaftingRefinedCount - 1;
    }

    return output;
  }

  /**
   * Takes the refinement result equip and creates it in the appropriate datastore, and adds it to
   * the player's inventory.
   * @param {RPG_EquipItem} outputEquip The equip to generate and add to the player's inventory.
   */
  static createRefinedOutput(outputEquip)
  {
    if (outputEquip.wtypeId)
    {
      this.generateRefinedEquip($dataWeapons, outputEquip, this.RefinementTypes.Weapon);
    }
    else if (equip.atypeId)
    {
      this.generateRefinedEquip($dataArmors, outputEquip, this.RefinementTypes.Armor);
    }
  };

  /**
   * Generates the new entry in the corresponding datastore for the new equip data that was refined.
   * @param {RPG_Weapon[]|RPG_Armor[]} datastore The datastore to extend with new data.
   * @param {RPG_EquipItem} equip The equip to generate and add to the player's inventory.
   * @param {string} refinementType The type of equip this is; for incrementing the counter on custom data.
   * @returns {RPG_EquipItem}
   */
  static generateRefinedEquip(datastore, equip, refinementType)
  {
    equip.jaftingRefinedCount++;
    const suffix = `+${equip.jaftingRefinedCount}`;
    if (equip.jaftingRefinedCount === 1)
    {
      // first time refining, they don't have a name to replace.
      equip.name = `${equip.name} ${suffix}`;
    }
    else
    {
      // second or later time refining, they need to replace the suffix.
      const index = equip.name.indexOf("+");
      if (index > -1)
      {
        equip.name = `${equip.name.slice(0, index)}${suffix}`;
      }
      else
      {
        equip.name = `${equip.name} ${suffix}`;
      }
    }

    // generate the new entry in the database.
    const newIndex = $gameParty.getRefinementCounter(refinementType);
    equip._updateIndex(newIndex);
    datastore[newIndex] = equip;

    // gain the actual item.
    $gameParty.gainItem(datastore[newIndex], 1);

    // increment the index to ensure we don't overwrite it.
    $gameParty.incrementRefinementCounter(refinementType);

    // add it to our running list of everything we've literally ever created ever.
    if (equip.wtypeId)
    {
      $gameParty.addRefinedWeapon(equip);
    }
    else if (equip.atypeId)
    {
      $gameParty.addRefinedArmor(equip);
    }
    else
    {
      console.error(`The following equip failed to be captured because it was neither weapon nor armor.`);
      console.warn(equip);
      throw new Error("please stop crafting stuff that isn't valid.");
    }
  }

  /**
   * True when party inventory has at least one equip that the primary refinable list would allow as base
   * (material type omitted, same enable rules as {@link Window_RefinableList} primary branch).
   * @returns {boolean}
   */
  static partyHasEnterableRefinementBase()
  {
    let equips = $gameParty.equipItems();

    if (equips.length === 0)
    {
      return false;
    }

    // Keep only rows that pass this predicate.
    equips = equips.filter(equip =>
    {
      if (JaftingSalvageLedger.isMaterialArmorDatum(equip))
      {
        return false;
      }

      if (JaftingSalvageLedger.isMaterialWeaponDatum(equip))
      {
        return false;
      }

      return true;
    });

    for (let i = 0; i < equips.length; i++)
    {
      const equip = equips[i];

      if (equip.jaftingUnrefinable)
      {
        continue;
      }

      const equipIsMaxRefined = (equip.jaftingMaxRefineCount === 0)
        ? false
        : equip.jaftingMaxRefineCount <= equip.jaftingRefinedCount;

      if (equipIsMaxRefined)
      {
        continue;
      }

      const equipHasMaxTraits = equip.jaftingMaxTraitCount === 0
        ? false
        : equip.jaftingMaxTraitCount <= JaftingManager.parseTraits(equip).length;

      if (equipHasMaxTraits)
      {
        continue;
      }

      if (equip.jaftingNotRefinementBase)
      {
        continue;
      }

      return true;
    }

    return false;
  }
}

export default JaftingManager;

//endregion JaftingManager

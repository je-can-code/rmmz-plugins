//region JaftingManager
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

    // map all the traits into JAFTING traits for managing them properly.
    let jaftingTraits = availableTraits.map(t => new JAFTING_Trait(t.code, t.dataId, t.value));

    // combine all the various parameter-based traits.
    jaftingTraits = this.combineAllParameterTraits(jaftingTraits);

    // return the newly parsed traits.
    return jaftingTraits;
  }

  /**
   * Combines all parameter-related traits where applicable.
   * @param {JAFTING_Trait[]} traitList The list of traits.
   * @returns {JAFTING_Trait[]}
   */
  static combineAllParameterTraits(traitList)
  {
    traitList = this.combineBaseParameterTraits(traitList);
    traitList = this.combineExParameterTraits(traitList);
    traitList = this.combineSpParameterTraits(traitList);
    return traitList;
  }

  /**
   * Combines all b-parameter-traits that are applicable.
   * @param {JAFTING_Trait[]} traitList The list of traits.
   * @returns {JAFTING_Trait[]}
   */
  static combineBaseParameterTraits(traitList)
  {
    const canCombineCode = 21;
    let tempTraitList = JsonEx.makeDeepCopy(traitList);
    const traitTracker = {};
    const indices = [];
    traitList.forEach((trait, index) =>
    {
      if (trait._code !== canCombineCode) return;

      if (!traitTracker[trait._dataId])
      {
        // if we haven't started tracking it yet, add it.
        traitTracker[trait._dataId] = trait._value;
      }
      else
      {
        // if we have started tracking it, then increase the value by the bonus amount.
        traitTracker[trait._dataId] += trait._value - 1;
      }

      // mark the index to be removed and replaced later.
      indices.push(index);
    });

    // if we didn't have any traits to combine, then we're done.
    if (!indices.length)
    {
      return traitList;
    }

    // get rid of all the old traits.
    indices.forEach(i => tempTraitList.splice(i, 1, null));
    tempTraitList = tempTraitList.filter(element => !!element);

    // make the new combined traits and add them to the list.
    for (const dataId in traitTracker)
    {
      const value = parseFloat(traitTracker[dataId].toFixed(2));
      const newTrait = new JAFTING_Trait(canCombineCode, parseInt(dataId), value);
      tempTraitList.push(newTrait);
    }

    return tempTraitList;
  }

  /**
   * Combines all ex-parameter-traits that are applicable.
   * @param {JAFTING_Trait[]} traitList The list of traits.
   * @returns {JAFTING_Trait[]}
   */
  static combineExParameterTraits(traitList)
  {
    const canCombineCode = 22;
    let tempTraitList = JsonEx.makeDeepCopy(traitList);
    const traitTracker = {};
    const indices = [];
    traitList.forEach((trait, index) =>
    {
      if (trait._code !== canCombineCode) return;

      if (!traitTracker[trait._dataId])
      {
        // if we haven't started tracking it yet, add it.
        traitTracker[trait._dataId] = trait._value;
      }
      else
      {
        // if we have started tracking it, then increase the value by the bonus amount.
        traitTracker[trait._dataId] += trait._value;
      }

      // mark the index to be removed and replaced later.
      indices.push(index);
    });

    // if we didn't have any traits to combine, then we're done.
    if (!indices.length)
    {
      return traitList;
    }

    // get rid of all the old traits.
    indices.forEach(i => tempTraitList.splice(i, 1, null));
    tempTraitList = tempTraitList.filter(element => !!element);

    // make the new combined traits and add them to the list.
    for (const dataId in traitTracker)
    {
      const value = parseFloat(traitTracker[dataId].toFixed(2));
      const newTrait = new JAFTING_Trait(canCombineCode, parseInt(dataId), value);
      tempTraitList.push(newTrait);
    }

    return tempTraitList;
  }

  /**
   * Combines all sp-parameter-traits that are applicable.
   * @param {JAFTING_Trait[]} traitList The list of traits.
   * @returns {JAFTING_Trait[]}
   */
  static combineSpParameterTraits(traitList)
  {
    const canCombineCode = 23;
    let tempTraitList = JsonEx.makeDeepCopy(traitList);
    const traitTracker = {};
    const indices = [];
    traitList.forEach((trait, index) =>
    {
      if (trait._code !== canCombineCode) return;

      if (!traitTracker[trait._dataId])
      {
        // if we haven't started tracking it yet, add it.
        traitTracker[trait._dataId] = trait._value - 1;
      }
      else
      {
        // if we have started tracking it, then increase the value by the bonus amount.
        traitTracker[trait._dataId] += trait._value - 1;
      }

      // mark the index to be removed and replaced later.
      indices.push(index);
    });

    // if we didn't have any traits to combine, then we're done.
    if (!indices.length)
    {
      return traitList;
    }

    // get rid of all the old traits.
    indices.forEach(i => tempTraitList.splice(i, 1, null));
    tempTraitList = tempTraitList.filter(element => !!element);

    // make the new combined traits and add them to the list.
    for (const dataId in traitTracker)
    {
      const value = parseFloat(traitTracker[dataId].toFixed(2)) + 1;
      const newTrait = new JAFTING_Trait(canCombineCode, parseInt(dataId), value);
      tempTraitList.push(newTrait);
    }

    return tempTraitList;
  }

  /**
   * Determines the result of refining a given base with a given material.
   * @param {RPG_EquipItem} base An equip to parse traits off of.
   * @param {RPG_EquipItem} material An equip to parse traits off of.
   * @returns {RPG_EquipItem}
   */
  static determineRefinementOutput(base, material)
  {
    // don't process if we are missing a parameter.
    if (!base || !material) return null;

    let baseTraits = this.parseTraits(base);
    let materialTraits = this.parseTraits(material);

    [ baseTraits, materialTraits ] = this.removeIncompatibleTraits(baseTraits, materialTraits);

    [ baseTraits, materialTraits ] = this.#overwriteAllOverwritableTraits(baseTraits, materialTraits);

    // copy of primary equip that represents the projected result.
    const output = base._generate(base, base._index());

    // if the primary equip doesn't have any transferrable traits, then it also won't have a divider.
    if (!baseTraits.length)
    {
      // add a divider trait at the end of the primary equip's trait list.
      output.traits.push(JAFTING_Trait.divider());
    }
    else
    {
      // determine the divider's index.
      const index = output.traits.findIndex(trait => trait.code === 63);

      // check if we have a valid divider index and there is stuff after the divider.
      if (index > -1 && !!output.traits[index])
      {
        // if we have stuff after the divider, get rid of it.
        output.traits.splice(index + 1);
      }

      // add our modified primary traits.
      baseTraits.forEach(trait => output.traits.push(trait.convertToRmTrait()));
    }

    // iterate over all the secondary traits that can be transferred to the refined primary equip.
    materialTraits.forEach(trait =>
    {
      // if the trait is non-transferable, then skip it.
      if (!this.#isTransferableTrait(output, trait)) return;

      // create and add the new trait from the material onto the base.
      const newTrait = RPG_Trait.fromValues(trait._code, trait._dataId, trait._value);
      output.traits.push(newTrait);
    });

    if (material.jaftingRefinedCount > 0)
    {
      // the -1 at the end is to accommodate the default of +1 that occurs when an equip is refined.
      output.jaftingRefinedCount += material.jaftingRefinedCount - 1;
    }

    return output;
  }

  /**
   * Compares traits on the base item against those on the material, and purges
   * all conflicting traits from the result.
   * @param {JAFTING_Trait[]} baseTraits The traits from the base item.
   * @param {JAFTING_Trait[]} materialTraits The traits from the material.
   * @returns {[JAFTING_Trait[], JAFTING_Trait[]]}
   */
  static removeIncompatibleTraits(baseTraits, materialTraits)
  {
    // a list of traits that should be purged from the secondary list if found.
    const noDuplicateTraitCodes = [ 14, 31, 41, 42, 43, 44, 51, 52, 53, 54, 55, 62, 64 ];
    baseTraits.forEach(jaftingTrait =>
    {
      if (noDuplicateTraitCodes.includes(jaftingTrait._code))
      {
        this.purgeDuplicateTrait(jaftingTrait, materialTraits, jaftingTrait._code);
      }
    });

    // handle lock/unlock skills types.
    [ baseTraits, materialTraits ] = this.removeOppositeTrait(baseTraits, materialTraits, 41, 42);

    // handle lock/unlock skills.
    [ baseTraits, materialTraits ] = this.removeOppositeTrait(baseTraits, materialTraits, 43, 44);

    // overwrite basic attack skill.
    [ baseTraits, materialTraits ] = this.replaceTrait(baseTraits, materialTraits, 35);

    // overwrite enable/disable of dual-wield (unique case!)
    [ baseTraits, materialTraits ] = this.replaceTrait(baseTraits, materialTraits, 55);

    return [ baseTraits, materialTraits ];
  }

  /**
   * Compare one trait with a rolling trait list to see if the list has any conflicting
   * traits with it. If so, remove them.
   * @param {JAFTING_Trait} potentialJaftingTrait The trait potentially to add if it doesn't already exist.
   * @param {JAFTING_Trait[]} rollingJaftingTraitList The trait list to compare against.
   */
  static purgeDuplicateTrait(potentialJaftingTrait, rollingJaftingTraitList)
  {
    let donePurging = false;
    while (!donePurging)
    {
      const index = rollingJaftingTraitList.findIndex(trait => trait._code === potentialJaftingTrait._code);
      if (index > -1 && rollingJaftingTraitList[index]._dataId === potentialJaftingTrait._dataId)
      {
        rollingJaftingTraitList.splice(index, 1);
      }
      else
      {
        donePurging = true;
      }
    }
  }

  /**
   * Compares two lists of traits and looks for a pair of codes that could possibly be
   * opposing one another. If one code is found in one list, and the opposing code is found
   * in the other list, the traits are removed from their respective lists. This will look
   * in both lists for both codes, so repeating this function for both orders is not necessary.
   * This will also retroactively remove both codes if they somehow live in the same list.
   * @param {JAFTING_Trait[]} baseTraitList The primary list of traits.
   * @param {JAFTING_Trait[]} materialTraitList The secondary list of traits.
   * @param {number} code One of the codes to compare.
   * @param {number} opposingCode The opposing code to compare.
   * @returns {[JAFTING_Trait[], JAFTING_Trait[]]}
   */
  static removeOppositeTrait(baseTraitList, materialTraitList, code, opposingCode)
  {
    // determine (if any) the index of any designated trait codes.
    const hasTraitCode = trait => trait._code === code;
    const baseHasCode = baseTraitList.findIndex(hasTraitCode);
    const materialHasCode = materialTraitList.findIndex(hasTraitCode);

    // determine (if any) the index of any opposing trait codes.
    const hasOpposingTraitCode = trait => trait._code === opposingCode;
    const baseHasOpposingCode = baseTraitList.findIndex(hasOpposingTraitCode);
    const materialHasOpposingCode = materialTraitList.findIndex(hasOpposingTraitCode);

    // a re-usable function for checking if two indices were "found".
    const hasBothCodes = (leftIndex, rightIndex) => (leftIndex > -1 && rightIndex > -1);

    // if the primary has the base code, and secondary has opposing, remove both.
    if (hasBothCodes(baseHasCode, materialHasOpposingCode))
    {
      if (baseTraitList[baseHasCode]._dataId === materialTraitList[materialHasOpposingCode]._dataId)
      {
        baseTraitList.splice(baseHasCode, 1, null);
        materialTraitList.splice(materialHasOpposingCode, 1, null);
      }
    }

    // if the secondary has the base code, and primary has opposing, remove both.
    if (hasBothCodes(materialHasCode, baseHasOpposingCode))
    {
      if (baseTraitList[baseHasOpposingCode]._dataId === materialTraitList[materialHasCode]._dataId)
      {
        baseTraitList.splice(baseHasOpposingCode, 1, null);
        materialTraitList.splice(materialHasCode, 1, null);
      }
    }

    // if the primary list has both codes, remove both traits.
    if (hasBothCodes(baseHasCode, baseHasOpposingCode))
    {
      if (baseTraitList[baseHasCode]._dataId === baseTraitList[baseHasOpposingCode]._dataId)
      {
        baseTraitList.splice(baseHasCode, 1, null);
        baseTraitList.splice(baseHasOpposingCode, 1, null);
      }
    }

    // if the secondary list has both codes, remove both traits.
    if (hasBothCodes(materialHasCode, materialHasOpposingCode))
    {
      if (materialTraitList[materialHasCode]._dataId === materialTraitList[materialHasOpposingCode]._dataId)
      {
        materialTraitList.splice(materialHasCode, 1, null);
        materialTraitList.splice(materialHasOpposingCode, 1, null);
      }
    }

    // cleanup both our lists from any messy falsy traits.
    baseTraitList = baseTraitList.filter(trait => !!trait);
    materialTraitList = materialTraitList.filter(trait => !!trait);

    return [ baseTraitList, materialTraitList ];
  }

  /**
   * Removes a trait from the primary list if the same trait also lives on the secondary
   * list. This gives the illusion of overwriting the trait with the new one.
   * @param {JAFTING_Trait[]} baseTraitList The primary list of traits.
   * @param {JAFTING_Trait[]} materialTraitList The secondary list of traits.
   * @param {number} code The code to overwrite if it exists in both lists.
   * @returns {[JAFTING_Trait[], JAFTING_Trait[]]}
   */
  static replaceTrait(baseTraitList, materialTraitList, code)
  {
    // determine (if any) the index of any designated trait codes.
    const hasTraitCode = trait => trait._code === code;
    const baseHasCode = baseTraitList.findIndex(hasTraitCode);
    const materialHasCode = materialTraitList.findIndex(hasTraitCode);

    // a re-usable function for checking if two indices were "found".
    const hasBothCodes = (leftIndex, rightIndex) => (leftIndex > -1 && rightIndex > -1);

    // if both lists have the same trait, remove from base list.
    if (hasBothCodes(baseHasCode, materialHasCode))
    {
      baseTraitList.splice(baseHasCode, 1, null);
    }

    // cleanup both our lists from any removed traits.
    baseTraitList = baseTraitList.filter(trait => !!trait);
    return [ baseTraitList, materialTraitList ];
  }

  /**
   * Overwrites all traits from the two lists depending on which is better as applicable.
   * @param {JAFTING_Trait[]} baseTraits The primary list of traits.
   * @param {JAFTING_Trait[]} materialTraits The secondary list of traits.
   * @returns {[JAFTING_Trait[], JAFTING_Trait[]]}
   */
  static #overwriteAllOverwritableTraits(baseTraits, materialTraits)
  {
    const overwritableCodes = [ 11, 12, 13, 32, 33, 34, 61 ];
    overwritableCodes.forEach(code =>
    {
      [ baseTraits, materialTraits ] = this.#overwriteIfBetter(baseTraits, materialTraits, code);
    });

    return [ baseTraits, materialTraits ];
  }

  /**
   * Checks the material trait list to see if better versions of the traits in the base
   * trait list are already there. If so, purges them from the base to allow for "overwriting"
   * from the material.
   * @param {JAFTING_Trait[]} baseTraitList The primary list of traits.
   * @param {JAFTING_Trait[]} materialTraitList The secondary list of traits.
   * @param {number} code The code to overwrite if it exists in both lists.
   * @returns {[JAFTING_Trait[], JAFTING_Trait[]]}
   */
  static #overwriteIfBetter(baseTraitList, materialTraitList, code)
  {
    // a quick function to use against each element of the base trait list
    // to check and see if the material trait list has any of the same codes with dataIds
    const hasTraitCodeAndDataIdWithBetterValue = trait =>
    {
      if (trait._code !== code) return false;

      // check if another version of the trait exists on the material.
      const index = materialTraitList.findIndex(jaftingTrait => jaftingTrait._code === code && jaftingTrait._dataId === trait._dataId);
      return index > -1;
    };

    // get all indices that return true for the above function and store them.
    const sameIndices = [];
    baseTraitList.forEach((jaftingTrait, index) =>
    {
      if (hasTraitCodeAndDataIdWithBetterValue(jaftingTrait))
      {
        sameIndices.push(index);
      }
    });

    // if we have no matches to combine, then just return the lists untouched.
    if (!sameIndices.length) return [ baseTraitList, materialTraitList ];

    // create copies for working with.
    let tempBaseList = JsonEx.makeDeepCopy(baseTraitList);
    let tempMaterialList = JsonEx.makeDeepCopy(materialTraitList);

    const higherIsBetterCodes = [ 32, 33, 34, 61 ];
    const lowerIsBetterCodes = [ 11, 12, 13 ];

    // iterate over all shared traits to analyze them further.
    sameIndices.forEach(i =>
    {
      const baseTrait = baseTraitList[i];
      const materialTraitIndex = materialTraitList
        .findIndex(t => t._code === baseTrait._code && t._dataId === baseTrait._dataId);
      const materialTrait = materialTraitList[materialTraitIndex];
      // if the trait code prefers higher values, then compare that way.
      if (higherIsBetterCodes.includes(baseTrait._code))
      {
        if (baseTrait._value > materialTrait._value)
        {
          // if better on the base, then remove it from the material.
          tempMaterialList.splice(materialTraitIndex, 1, null);
        }
        else
        {
          // if better on the material, then remove it from the base.
          tempBaseList.splice(i, 1, null);
        }
        // if the trait code prefers lower values, then compare that way.
      }
      else if (lowerIsBetterCodes.includes(baseTrait._code))
      {
        if (baseTrait._value < materialTrait._value)
        {
          // if better on the base, then remove it from the material.
          tempMaterialList.splice(materialTraitIndex, 1, null);
        }
        else
        {
          // if better on the material, then remove it from the base.
          tempBaseList.splice(i, 1, null);
        }
      }
    });

    tempBaseList = tempBaseList
      .filter(t => !!t)
      .map(t => new JAFTING_Trait(t._code, t._dataId, t._value));
    tempMaterialList = tempMaterialList
      .filter(t => !!t)
      .map(t => new JAFTING_Trait(t._code, t._dataId, t._value));

    return [ tempBaseList, tempMaterialList ];
  }

  /**
   * Determines whether or not a trait should be transfered to the refined base equip.
   * @param {RPG_EquipItem} output The to-be refined base equip.
   * @param {JAFTING_Trait} jaftingTrait The new trait to be potentially transferred.
   * @returns {boolean}
   */
  static #isTransferableTrait(output, jaftingTrait)
  {
    switch (jaftingTrait._code)
    {
      case 11: // elemental damage rate - stackable.
      case 12: // debuff rate - stackable.
      case 13: // state rate - stackable.
      case 14: // state immunity - don't add the same twice.
      case 21: // base parameter rate - stackable.
      case 22: // ex-parameter rate - stackable.
      case 23: // sp-parameter rate - stackable.
      case 31: // attack element - uniquely stackable.
      case 32: // apply state chance - stackable.
      case 33: // skill speed - stackable.
      case 34: // repeat times - stackable.
      case 35: // change basic attack skill - overwrite.
      case 41: // unlock skill type - one or the other or none.
      case 42: // lock skill type - one or the other or none.
      case 43: // learn skill while equipped - one or the other or none.
      case 44: // unlearn skill while equipped - one or the other or none.
      case 51: // can use new weapon type - don't add the same twice.
      case 52: // can use new armor type - don't add the same twice.
      case 53: // (lock)cannot change equipment from slot.
      case 55: // enable/disable dual-wielding - overwrite.
      case 61: // action times percent boost - stackable.
      case 62: // special flag - don't add the same twice.
      case 64: // party ability - don't add the same twice.
        return true;

      case 54: // (seal) slot is not equippable while equipped.
        const sealingOwnEquipType = (jaftingTrait._dataId === output.etypeId);
        // don't transfer over slot sealing if it would seal the slot the equip is on.
        return !sealingOwnEquipType;
      default:
        console.error(`all traits are accounted for- is this a custom trait code: [${jaftingTrait._code}]?`);
        return false;
    }
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
    else if (outputEquip.atypeId)
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
}

//endregion JaftingManager
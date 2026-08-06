//region JaftingManager
import JAFTING_Trait from './../__models/JAFTING_Trait.js';
import JaftingRefinementLineage from './../__models/JaftingRefinementLineage.js';

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
   * Stamps a freshly-merged output equip with the identity a refined row carries: one more refine on
   * the counter, the `+N` suffix on the name, and the datastore slot it will live in.
   *
   * This is deliberately separated from {@link generateRefinedEquip}, which surrounds it with party
   * side effects - spending the counter, gaining the item, recording the lineage. Everything here is
   * a pure function of the equip and the slot, and that is precisely what makes it replayable: a
   * load re-derives a refined row by running {@link determineRefinementOutput} and then this, with
   * nothing in between. Two implementations that had to agree would be the bug the lineage work
   * exists to prevent, so there is only ever one.
   * @param {RPG_EquipItem} equip The merged output to stamp, mutated in place.
   * @param {number} index The datastore slot this refinement occupies.
   */
  static stampRefinedOutput(equip, index)
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
      const plusIndex = equip.name.indexOf("+");
      if (plusIndex > -1)
      {
        equip.name = `${equip.name.slice(0, plusIndex)}${suffix}`;
      }
      else
      {
        equip.name = `${equip.name} ${suffix}`;
      }
    }

    equip._updateIndex(index);
  }

  /**
   * Rebuilds a refined equip from its provenance, against whatever the database says right now.
   *
   * This is the whole point of storing lineage instead of results. Every input is resolved fresh -
   * a leaf out of the live `$data*` table, a nested refinement by replaying it in turn - so a base
   * weapon whose ATK was raised during rebalancing reaches every refined descendant a player is
   * carrying on their next load.
   *
   * **The tradeoff is deliberate and worth stating: derived values follow the deriver.** Changing
   * `TraitResolver.refineTraits`, the divider convention, or the suffix format shifts every existing
   * refined item the next time a save is opened. During pre-release rebalancing that is the feature.
   * If it ever needs not to be, the lineage node is the place to gate it on a schema version.
   * @param {JaftingRefinementLineage} lineage The provenance to replay.
   * @returns {RPG_EquipItem} The rebuilt row, not yet written to any datastore.
   */
  static replayLineage(lineage)
  {
    // a leaf is the floor of the recursion: it names a database row and resolves straight to it.
    if (lineage.isLeaf()) return this.resolveLineageLeaf(lineage);

    // both inputs resolve the same way, and either may itself be a refinement several steps deep.
    const base = this.replayLineage(lineage.base);
    const material = this.replayLineage(lineage.material);

    // the same two calls a live refinement makes, in the same order, against today's rows.
    const output = this.determineRefinementOutput(base, material);
    this.stampRefinedOutput(output, lineage.index);

    // the dismantle stamp is the one thing replay cannot re-derive: it was built from party salvage
    // bags that the consuming `gainItem` has since pruned. it travels with the node instead.
    output._jaftingSalvageLedger = lineage.ledger;

    return output;
  }

  /**
   * Resolves the database row a leaf node names.
   * @param {JaftingRefinementLineage} lineage The leaf to resolve.
   * @returns {RPG_EquipItem} The live database row.
   */
  static resolveLineageLeaf(lineage)
  {
    const datastore = this.datastoreForLineageKind(lineage.kind);
    const row = datastore[lineage.id];

    // a lineage naming a row that no longer exists is loud rather than silent, and it is loud about
    // *which* row. post-ship this cannot happen, because rows do not disappear; pre-ship it means
    // someone deleted a database entry a player's refined equipment was built out of, and finding
    // that out at the next load beats finding it out as a blank item in an equip slot.
    if (!row)
    {
      throw new Error(
        `refinement lineage names '${lineage.kind}:${lineage.id}', which is not in the database. `
        + 'A row that refined equipment was built from has been removed.');
    }

    return row;
  }

  /**
   * Maps a lineage node's datastore letter onto the table it refers to.
   * @param {string} kind The datastore letter: `w`, `a`, or `i`.
   * @returns {RPG_Weapon[]|RPG_Armor[]|RPG_Item[]} The datastore.
   */
  static datastoreForLineageKind(kind)
  {
    if (kind === 'w') return $dataWeapons;

    if (kind === 'a') return $dataArmors;

    if (kind === 'i') return $dataItems;

    throw new Error(`refinement lineage carries an unknown datastore letter: '${kind}'.`);
  }

  /**
   * Builds the lineage node describing an equip that is about to become a refinement input.
   *
   * A plain database row becomes a leaf. A refined row hands back the lineage already recorded for
   * it, so the provenance nests rather than restarting - which is what lets a three-deep refinement
   * replay from base rows alone.
   * @param {RPG_EquipItem} datum The equip being consumed as a base or a material.
   * @returns {JaftingRefinementLineage} The node describing it.
   */
  static lineageForDatum(datum)
  {
    // a dynamic slot means this row was itself refined, and its provenance is already on file.
    // the slot is the *index*, never the id: a refined row is a clone of its base, so it keeps the
    // base's id forever and only `_updateIndex` moves it into the dynamic range. Asking about the id
    // here answers about the original weapon and quietly makes every refinement look like a first one.
    const slot = datum._key();

    if (slot >= this.StartingIndex)
    {
      const tracked = datum.isWeapon()
        ? $gameParty.getRefinedWeapons()
        : $gameParty.getRefinedArmors();

      const existing = tracked.find(lineage => lineage.index === slot);

      // a refined row is recorded the moment it is created and only removed when its last copy
      // leaves the party - so one being consumed as an input is always still on the list.
      if (existing) return existing;
    }

    return JaftingRefinementLineage.leaf(this.lineageKindForDatum(datum), datum.id);
  }

  /**
   * Maps an equip onto the datastore letter a lineage leaf records it under.
   * @param {RPG_EquipItem} datum The equip to classify.
   * @returns {string} The datastore letter: `w`, `a`, or `i`.
   */
  static lineageKindForDatum(datum)
  {
    if (datum.isWeapon()) return 'w';

    if (datum.isArmor()) return 'a';

    return 'i';
  }

  /**
   * Takes the refinement result equip and creates it in the appropriate datastore, and adds it to
   * the player's inventory.
   *
   * The two input nodes come along because the party records *provenance*, not the result: the
   * lineage node built here is what a save writes, and what a load replays. They arrive already
   * built rather than as raw equips, because both inputs have been spent by the time this runs -
   * see {@link RefinementWorkflowSession#commitRefinement} for why that ordering is forced.
   * @param {RPG_EquipItem} outputEquip The equip to generate and add to the player's inventory.
   * @param {JaftingRefinementLineage} baseLineage The provenance of the equip that was improved.
   * @param {JaftingRefinementLineage} materialLineage The provenance of the equip that was consumed.
   */
  static createRefinedOutput(outputEquip, baseLineage, materialLineage)
  {
    if (outputEquip.wtypeId)
    {
      this.generateRefinedEquip($dataWeapons, outputEquip, this.RefinementTypes.Weapon, baseLineage, materialLineage);

      return;
    }

    if (outputEquip.atypeId)
    {
      this.generateRefinedEquip($dataArmors, outputEquip, this.RefinementTypes.Armor, baseLineage, materialLineage);

      return;
    }

    // refusing here rather than falling through silently, because there is no third datastore to pick
    // and the alternative is worse than a throw: {@link generateRefinedEquip} writes its row *before*
    // recording lineage, so guessing a datastore would leave an orphaned row behind on its way to
    // failing anyway.
    throw new Error('a refinement output was neither weapon nor armor, so there is no datastore for it.');
  };

  /**
   * Generates the new entry in the corresponding datastore for the new equip data that was refined.
   * @param {RPG_Weapon[]|RPG_Armor[]} datastore The datastore to extend with new data.
   * @param {RPG_EquipItem} equip The equip to generate and add to the player's inventory.
   * @param {string} refinementType The type of equip this is; for incrementing the counter on custom data.
   * @param {JaftingRefinementLineage} baseLineage The provenance of the equip that was improved.
   * @param {JaftingRefinementLineage} materialLineage The provenance of the equip that was consumed.
   */
  static generateRefinedEquip(datastore, equip, refinementType, baseLineage, materialLineage)
  {
    // the allocator's own state decides where this row lives, and the lineage records that choice.
    const newIndex = $gameParty.getRefinementCounter(refinementType);

    // the deterministic half of creating a refined row - shared verbatim with the replay path.
    this.stampRefinedOutput(equip, newIndex);

    datastore[newIndex] = equip;

    // gain the actual item.
    $gameParty.gainItem(datastore[newIndex], 1);

    // increment the index to ensure we don't overwrite it.
    $gameParty.incrementRefinementCounter(refinementType);

    // the provenance of the inputs was captured before they were spent; this only names the slot.
    const lineage = JaftingRefinementLineage.refinement(
      newIndex,
      baseLineage,
      materialLineage,
      equip._jaftingSalvageLedger);

    // add it to our running list of everything we've literally ever created ever.
    if (equip.wtypeId)
    {
      $gameParty.addRefinedWeapon(lineage);
    }
    else if (equip.atypeId)
    {
      $gameParty.addRefinedArmor(lineage);
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

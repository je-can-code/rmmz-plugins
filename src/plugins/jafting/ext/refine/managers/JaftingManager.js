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
   * The literal note line separating an equip's own effects from the ones it hands over when consumed.
   *
   * Written verbatim onto a refinement output, so a refined equip can itself be donated later. The
   * matching pattern lives on {@link J.JAFTING.EXT.REFINE.RegExp.TransferrableEffectsBelow}; this is the
   * text, because a RegExp cannot be turned back into the thing it recognizes.
   * @type {string}
   */
  static TransferrableEffectsDivider = '<transferrableEffectsBelow>';

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
   * How many refined effects an equip is carrying, counting both channels a refinement can add to.
   *
   * Refinement hands over two things: the traits below the trait divider, and the note lines below the
   * transferable divider. Both are effects the player chose and paid for, so a ceiling that counted only
   * the trait array would let an equip accumulate note effects without limit while claiming to be full.
   * @param {RPG_EquipItem} equip An equip to count refined effects on.
   * @returns {number}
   */
  static countRefinedEffects(equip)
  {
    const traits = JaftingManager.parseTraits(equip).length;
    const noteEffects = JaftingManager.parseNoteEffects(equip);

    // an equip offering nothing from its note contributes no lines rather than one empty one.
    if (noteEffects === String.empty) return traits;

    return traits + noteEffects.split('\n').length;
  }

  /**
   * The note text below the transferable divider - what this equip hands over when consumed.
   *
   * No divider means no note effects transfer at all. That is the deliberate default and the mirror of
   * {@link parseTraits}: an equip says what it is willing to give away, and silence means nothing. The
   * alternative - transferring everything unless told otherwise - would hand a donor's identity over,
   * including the `<this{PARAM}:N>` bases that make a percentage bounded by the item carrying it.
   * @param {RPG_EquipItem} equip An equip to read transferable effects from.
   * @returns {string} The transferable note text, or an empty string when there is none.
   */
  static parseNoteEffects(equip)
  {
    const lines = this.#noteLinesOf(equip);
    const dividerIndex = this.#dividerIndexOf(lines);

    // no divider means this equip offers nothing from its note.
    if (dividerIndex === -1) return String.empty;

    return lines.slice(dividerIndex + 1)
      .join('\n');
  }

  /**
   * The note text at and above the transferable divider - what an equip keeps no matter what.
   *
   * An equip with no divider keeps its whole note, since none of it was ever offered.
   * @param {RPG_EquipItem} equip An equip to read retained effects from.
   * @returns {string} The retained note text.
   */
  static parseRetainedNote(equip)
  {
    const lines = this.#noteLinesOf(equip);
    const dividerIndex = this.#dividerIndexOf(lines);

    // no divider means the entire note is the equip's own.
    if (dividerIndex === -1)
    {
      return lines.join('\n');
    }

    return lines.slice(0, dividerIndex)
      .join('\n');
  }

  /**
   * Splits a note into its non-empty lines.
   * @param {RPG_EquipItem} equip The equip whose note to split.
   * @returns {string[]}
   */
  static #noteLinesOf(equip)
  {
    const note = equip.note || String.empty;

    return note.split(/[\r\n]+/)
      .filter(line => line.length > 0);
  }

  /**
   * Locates the transferable divider among a note's lines.
   * @param {string[]} lines The note's lines.
   * @returns {number} The divider's line index, or -1 when absent.
   */
  static #dividerIndexOf(lines)
  {
    const pattern = J.JAFTING.EXT.REFINE.RegExp.TransferrableEffectsBelow;

    return lines.findIndex(line => pattern.test(line));
  }

  /**
   * Decides how each tag key in a pair of transferable notes should merge.
   *
   * Derived from the shape of the values rather than from a list of known keys, because the divider is
   * what declares a tag transferable - so the set of keys that can arrive here is whatever an author
   * writes, not something this plugin can enumerate ahead of time.
   *
   * A key whose every value is a plain number **sums**: two `<bonusHits:2>` become four hits, which is
   * what a player refining the same material twice expects. Everything else - arrays, formulas, booleans,
   * prose - **accumulates**: distinct lines stack side by side, and identical ones collapse to one, which
   * lands exactly where the same formula appearing twice ought to.
   * @param {string} baseNote The base's transferable note text.
   * @param {string} overlayNote The donor's transferable note text.
   * @returns {{accumulatingKeys: string[], summingKeys: string[]}}
   */
  static transferPolicyFor(baseNote, overlayNote)
  {
    const scalarShape = /^<([^:]+):\s*(-?\d+(?:\.\d+)?)\s*>$/;
    const tags = [ ...this.#tagsOf(baseNote), ...this.#tagsOf(overlayNote) ];

    // a key stays a summing candidate only while every line under it reads as a plain number; one array
    // or formula anywhere disqualifies it, since totalling a mixed pair would invent a value.
    const scalarByKey = new Map();

    tags.forEach(tag =>
    {
      const inner = tag.substring(1, tag.length - 1);
      const colonIndex = inner.indexOf(':');
      const rawKey = colonIndex === -1
        ? inner
        : inner.substring(0, colonIndex);
      const key = rawKey.trim()
        .toLowerCase();
      const isScalar = scalarShape.test(tag);

      if (scalarByKey.has(key) === false)
      {
        scalarByKey.set(key, isScalar);

        return;
      }

      if (isScalar === false) scalarByKey.set(key, false);
    });

    const summingKeys = [];
    const accumulatingKeys = [];

    scalarByKey.forEach((isScalar, key) =>
    {
      if (isScalar)
      {
        summingKeys.push(key);

        return;
      }

      accumulatingKeys.push(key);
    });

    return {
      accumulatingKeys,
      summingKeys,
    };
  }

  /**
   * Extracts the angle-bracketed tags from a note.
   * @param {string} note The note text to read.
   * @returns {string[]}
   */
  static #tagsOf(note)
  {
    const text = note || String.empty;

    return text.match(/<[^>]+>/g) || [];
  }

  /**
   * Groups a note's tags into their authored values, keyed by tag key.
   *
   * Values are kept exactly as written, brackets and all. Nothing here interprets what a tag *means* -
   * that is a job for a tag registry, and inventing a friendlier reading in the meantime would produce
   * something confidently wrong rather than something plainly unfinished.
   *
   * A boolean tag has no value to report, so its presence is the value.
   * @param {string} note The note text to read.
   * @returns {Map<string, string[]>} Each key's authored values, in the order written.
   */
  static tagValuesOf(note)
  {
    const values = new Map();

    this.#tagsOf(note)
      .forEach(tag =>
      {
        const inner = tag.substring(1, tag.length - 1);
        const colonIndex = inner.indexOf(':');
        const key = colonIndex === -1
          ? inner.trim()
          : inner.substring(0, colonIndex)
            .trim();
        const value = colonIndex === -1
          ? 'yes'
          : inner.substring(colonIndex + 1)
            .trim();

        if (values.has(key) === false)
        {
          values.set(key, []);
        }

        const existing = values.get(key);

        // an identical value written twice says nothing twice, matching how the merger buckets them.
        if (existing.includes(value) === false) existing.push(value);
      });

    return values;
  }

  /**
   * Pairs the base's transferable note effects against the projected output's, per tag key.
   *
   * Only the output's keys are walked, because the merge cannot drop one: every key the base carried is
   * appended in some form, whether it stood alone, accumulated, or was totalled. A key with no `before`
   * is therefore genuinely arriving from the donor.
   * @param {RPG_EquipItem} base The equip being refined.
   * @param {RPG_EquipItem} result The projected refinement output.
   * @returns {{key: string, before: (string|null), after: string}[]} One row per key, key-ordered.
   */
  static buildNoteEffectComparison(base, result)
  {
    const before = this.tagValuesOf(this.parseNoteEffects(base));
    const after = this.tagValuesOf(this.parseNoteEffects(result));

    const rows = [];

    after.forEach((values, key) =>
    {
      const beforeValues = before.has(key)
        ? before.get(key)
          .join(', ')
        : null;

      rows.push({
        key,
        before: beforeValues,
        after: values.join(', '),
      });
    });

    // stable ordering, so the same pairing always reads the same way down the column.
    return rows.sort((left, right) => left.key.localeCompare(right.key));
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

    // notes merge the same way traits do: the base keeps everything it never offered, and the two
    // transferable halves combine below the divider.
    output.note = this.mergeTransferableNotes(base, material);

    // the donor's own history is deliberately not carried onto the output. One refinement costs one
    // count no matter how refined the donor was, which is what makes a spent max-refined weapon usable
    // as a donor for the price of a single count. Its accumulated payload transfers; its tally does not.
    return output;
  }

  /**
   * Builds the note a refinement output carries.
   *
   * The base's retained half is reproduced verbatim, then the two transferable halves are merged and
   * written back beneath a divider - so the output is itself donatable, carrying forward everything it
   * was given without ever offering the identity it kept.
   *
   * A divider is only written when there is something under it. An output with nothing transferable
   * should not advertise an empty payload, and an equip that never had a divider should not gain one for
   * free.
   * @param {RPG_EquipItem} base The equip being refined.
   * @param {RPG_EquipItem} material The equip being consumed.
   * @returns {string} The output's note.
   */
  static mergeTransferableNotes(base, material)
  {
    const retained = this.parseRetainedNote(base);
    const baseTransferable = this.parseNoteEffects(base);
    const materialTransferable = this.parseNoteEffects(material);

    const { accumulatingKeys, summingKeys } = this.transferPolicyFor(baseTransferable, materialTransferable);
    const merged = NoteResolver.merge(baseTransferable, materialTransferable, accumulatingKeys, summingKeys);

    // nothing was transferable on either side, so the output keeps the base's note and no divider.
    if (merged.length === 0) return retained;

    const divider = JaftingManager.TransferrableEffectsDivider;

    // a base with an empty note still gets a well-formed payload rather than a leading blank line.
    if (retained.length === 0)
    {
      return `${divider}\n${merged}`;
    }

    return `${retained}\n${divider}\n${merged}`;
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
        : equip.jaftingMaxTraitCount <= JaftingManager.countRefinedEffects(equip);

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

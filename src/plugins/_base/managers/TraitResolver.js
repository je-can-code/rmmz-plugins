import RPG_Trait from '../database/_data/RPG_Trait.js';

//region TraitResolver
/**
 * A static class that centralizes trait-merging operations shared across the ecosystem.
 *
 * Two distinct merge strategies are exposed:
 *  - {@link overlayTraits}  "last wins per code+dataId" — used by state extension.
 *  - {@link refineTraits}   "keep better per code+dataId" — used by JAFTING refinement.
 *
 * Both strategies share the same underlying sub-operations (opposing-pair cancellation,
 * no-duplicate filtering, parameter-trait additive combining) but differ in how they
 * resolve conflicts between traits that share the same code and dataId.
 */
class TraitResolver
{
  constructor()
  {
    throw new Error('This is a static class.');
  }

  //region constants
  /**
   * Pairs of trait codes that are semantically opposed.
   * When one side is present in the overlay and the other is present in the base,
   * both are cancelled (for refinement) or the base entry is removed (for overlay).
   * @type {[number, number][]}
   */
  static #OpposingPairs = [
    [ 41, 42 ],   // unlock skill type / lock skill type
    [ 43, 44 ],   // learn skill / seal skill
  ];

  /**
   * Trait codes where having more than one entry with the same dataId is meaningless.
   * Duplicates are stripped from the incoming overlay/material list during merging.
   * @type {number[]}
   */
  static #NoDuplicateCodes = [ 14, 31, 51, 52, 53, 54, 62, 64 ];

  /**
   * Trait codes where a higher value is the "better" one (used by {@link refineTraits}).
   * @type {number[]}
   */
  static #HigherIsBetterCodes = [ 32, 33, 34, 61 ];

  /**
   * Trait codes where a lower value is the "better" one (used by {@link refineTraits}).
   * @type {number[]}
   */
  static #LowerIsBetterCodes = [ 11, 12, 13 ];

  /**
   * Trait codes that have exactly one meaningful instance; the overlay/material version
   * always replaces the base version when both are present (used by {@link refineTraits}).
   * @type {number[]}
   */
  static #AlwaysReplaceCodes = [ 35, 55 ];
  //endregion constants

  //region public API
  /**
   * Merges {@link overlayTraits} onto {@link baseTraits} using "last wins per code+dataId" semantics.
   *
   * For every trait in the overlay:
   *  - Any base trait sharing the same code+dataId is removed (the overlay wins).
   *  - If the overlay trait belongs to an opposing pair, the opposing code with the same
   *    dataId is also removed from the base (e.g. overlay "seal skill type 3" strips
   *    base "unlock skill type 3").
   *
   * All overlay traits are then appended to the surviving base traits.
   * @param {RPG_Trait[]} baseTraits The traits of the object being extended.
   * @param {RPG_Trait[]} overlayTraits The traits of the extension object.
   * @returns {RPG_Trait[]} The merged trait array.
   */
  static overlayTraits(baseTraits, overlayTraits)
  {
    // clone base so we never mutate the source array.
    let result = baseTraits.map(t => RPG_Trait.fromValues(t.code, t.dataId, t.value));

    // process each overlay trait against the current working result.
    overlayTraits.forEach(overlay =>
    {
      // strip any base trait with the same code+dataId — overlay wins.
      result = result.filter(t => !(t.code === overlay.code && t.dataId === overlay.dataId));

      // if this overlay code has an opposing code, also strip that from the base.
      const opposing = this.#opposingCode(overlay.code);
      if (opposing !== null)
      {
        result = result.filter(t => !(t.code === opposing && t.dataId === overlay.dataId));
      }
    });

    // append all overlay traits to the cleared base.
    overlayTraits.forEach(t => result.push(RPG_Trait.fromValues(t.code, t.dataId, t.value)));

    return result;
  }

  /**
   * Merges {@link materialTraits} onto {@link baseTraits} using "keep better per code+dataId" semantics.
   *
   * Steps applied in order:
   *  1. Additive combining of parameter traits (codes 21/22/23) within each list.
   *  2. Opposing-pair cancellation — conflicting pairs are removed from both lists.
   *  3. No-duplicate filtering — material entries are dropped if base already has them.
   *  4. Always-replace codes (35, 55) — base entry is removed when material has the same code.
   *  5. Keep-better resolution for rate/stackable codes — the lower-value or higher-value
   *     winner stays; the loser is removed from its list before the final concat.
   *  6. All surviving base traits are returned first, followed by remaining material traits.
   * @param {RPG_Trait[]} baseTraits The traits of the base equip being refined.
   * @param {RPG_Trait[]} materialTraits The traits of the material being consumed.
   * @returns {RPG_Trait[]} The merged trait array.
   */
  /**
   * Folds all same-dataId traits within a single trait list into one combined entry per
   * dataId using additive math, for every code where additive stacking is meaningful.
   *
   * This covers the full display-relevant set:
   *  - Codes 11/12/13  (element/debuff/state rates)      — neutral 1.0, delta formula
   *  - Codes 21/22/23  (base/ex/sp parameter rates)      — neutral 1.0 or 0.0
   *  - Code  32        (attack state chance)              — neutral 0.0, straight additive
   *
   * Used by display and count consumers (e.g. JAFTING's {@link JaftingManager.parseTraits})
   * that need a clean, consolidated view of an equip's traits rather than raw separate entries.
   * Not used during merging — {@link refineTraits} and {@link overlayTraits} have their own
   * resolution semantics for these codes.
   * @param {RPG_Trait[]} traits The trait list to consolidate.
   * @returns {RPG_Trait[]} A new array with stackable traits combined per code+dataId.
   */
  static consolidate(traits)
  {
    let result = traits.map(t => RPG_Trait.fromValues(t.code, t.dataId, t.value));

    // rate traits: element rate, debuff rate, state rate — neutral 1.0.
    result = this.#combineParameterTraitsForCode(result, 11, 1);
    result = this.#combineParameterTraitsForCode(result, 12, 1);
    result = this.#combineParameterTraitsForCode(result, 13, 1);

    // parameter rate traits — neutral 1.0 or 0.0.
    result = this.#combineParameterTraitsForCode(result, 21, 1);
    result = this.#combineParameterTraitsForCode(result, 22, 0);
    result = this.#combineParameterTraitsForCode(result, 23, 1);

    // attack state chance — neutral 0.0, straight additive.
    result = this.#combineParameterTraitsForCode(result, 32, 0);

    return result;
  }

  static refineTraits(baseTraits, materialTraits)
  {
    // step 1: additively combine same-dataId parameter traits within each list.
    let base = this.#combineAllParameterTraits(baseTraits.map(t => RPG_Trait.fromValues(t.code, t.dataId, t.value)));
    let material = this.#combineAllParameterTraits(materialTraits.map(t => RPG_Trait.fromValues(t.code, t.dataId, t.value)));

    // step 2: cancel opposing pairs across and within both lists.
    [ base, material ] = this.#cancelOpposingPairs(base, material);

    // step 3: strip material traits the base already owns (no-duplicate codes).
    [ base, material ] = this.#filterNoDuplicates(base, material);

    // step 4: always-replace codes — material wins, so strip matching base entry.
    for (const code of this.#AlwaysReplaceCodes)
    {
      [ base, material ] = this.#replaceCode(base, material, code);
    }

    // step 5: keep better for rate/stackable codes.
    [ base, material ] = this.#keepBetterAll(base, material);

    // step 6: concat survivors.
    return [
      ...base,
      ...material.map(t => RPG_Trait.fromValues(t.code, t.dataId, t.value)),
    ];
  }
  //endregion public API

  //region private helpers
  /**
   * Returns the opposing code for a given trait code, or null if it has none.
   * @param {number} code The trait code to look up.
   * @returns {number|null}
   */
  static #opposingCode(code)
  {
    for (const [ a, b ] of this.#OpposingPairs)
    {
      if (code === a) return b;
      if (code === b) return a;
    }

    return null;
  }

  /**
   * Runs additive parameter combining for codes 21, 22, and 23 on a single trait list.
   * Multiple entries with the same code+dataId are folded into one with a summed value.
   * @param {RPG_Trait[]} traits The trait list to process in place.
   * @returns {RPG_Trait[]}
   */
  static #combineAllParameterTraits(traits)
  {
    // code 21 (base param rate): neutral value 1.0 — (1.1 + 1.2) - 1 = 1.3.
    let combined = this.#combineParameterTraitsForCode(traits, 21, 1);

    // code 22 (ex-param): neutral value 0.0 — 0.1 + 0.2 = 0.3.
    combined = this.#combineParameterTraitsForCode(combined, 22, 0);

    // code 23 (sp-param rate): neutral value 1.0 — same offset as code 21.
    combined = this.#combineParameterTraitsForCode(combined, 23, 1);

    return combined;
  }

  /**
   * Folds all traits of a single code in the list into one per dataId using additive math.
   * @param {RPG_Trait[]} traits The trait list to process.
   * @param {number} code The trait code to combine.
   * @param {number} neutral The neutral value for this code (1 for rate traits, 0 for additive traits).
   * @returns {RPG_Trait[]}
   */
  static #combineParameterTraitsForCode(traits, code, neutral)
  {
    // track accumulated delta per dataId.
    const tracker = {};

    // track which indices to remove.
    const toRemove = new Set();

    traits.forEach((trait, index) =>
    {
      // skip traits that don't match this code.
      if (trait.code !== code) return;

      // accumulate delta from neutral.
      if (tracker[trait.dataId] === undefined)
      {
        tracker[trait.dataId] = trait.value - neutral;
      }
      else
      {
        tracker[trait.dataId] += trait.value - neutral;
      }

      // mark for removal so we can replace with the combined entry.
      toRemove.add(index);
    });

    // if nothing was tracked, return untouched.
    if (Object.keys(tracker).length === 0) return traits;

    // strip old entries of this code.
    const result = traits.filter((_, i) => !toRemove.has(i));

    // add one combined entry per dataId, skipping any that resolved to neutral (meaningless).
    for (const dataId in tracker)
    {
      const value = parseFloat((tracker[dataId] + neutral).toFixed(2));
      if (value === neutral) continue;
      result.push(RPG_Trait.fromValues(code, parseInt(dataId), value));
    }

    return result;
  }

  /**
   * Cancels opposing trait pairs across and within both lists.
   * Any dataId that appears as both code A and code B (across or within either list) is
   * removed entirely from both lists.
   * @param {RPG_Trait[]} baseTraits
   * @param {RPG_Trait[]} materialTraits
   * @returns {[RPG_Trait[], RPG_Trait[]]}
   */
  static #cancelOpposingPairs(baseTraits, materialTraits)
  {
    let base = baseTraits;
    let material = materialTraits;

    for (const [ codeA, codeB ] of this.#OpposingPairs)
    {
      [ base, material ] = this.#cancelPair(base, material, codeA, codeB);
    }

    return [ base, material ];
  }

  /**
   * Cancels one opposing pair across and within both lists.
   * @param {RPG_Trait[]} base
   * @param {RPG_Trait[]} material
   * @param {number} codeA
   * @param {number} codeB
   * @returns {[RPG_Trait[], RPG_Trait[]]}
   */
  static #cancelPair(base, material, codeA, codeB)
  {
    // collect all conflicting dataIds across all four cross-product combinations.
    const conflicts = new Set();

    const baseA = base.filter(t => t.code === codeA);
    const baseB = base.filter(t => t.code === codeB);
    const matA = material.filter(t => t.code === codeA);
    const matB = material.filter(t => t.code === codeB);

    // cross-list conflicts.
    baseA.forEach(a => { if (matB.some(b => b.dataId === a.dataId)) conflicts.add(a.dataId); });
    baseB.forEach(b => { if (matA.some(a => a.dataId === b.dataId)) conflicts.add(b.dataId); });

    // within-list conflicts.
    baseA.forEach(a => { if (baseB.some(b => b.dataId === a.dataId)) conflicts.add(a.dataId); });
    matA.forEach(a => { if (matB.some(b => b.dataId === a.dataId)) conflicts.add(a.dataId); });

    if (conflicts.size === 0) return [ base, material ];

    // remove all conflicting entries from both lists.
    const strip = traits => traits.filter(t =>
    {
      if (t.code !== codeA && t.code !== codeB) return true;

      return !conflicts.has(t.dataId);
    });

    return [ strip(base), strip(material) ];
  }

  /**
   * Strips material traits that the base already owns for no-duplicate codes.
   * @param {RPG_Trait[]} base
   * @param {RPG_Trait[]} material
   * @returns {[RPG_Trait[], RPG_Trait[]]}
   */
  static #filterNoDuplicates(base, material)
  {
    const noDupes = this.#NoDuplicateCodes;

    const filteredMaterial = material.filter(mat =>
    {
      // only apply this filter to no-duplicate codes.
      if (!noDupes.includes(mat.code)) return true;

      // drop if the base already has this exact code+dataId.
      return !base.some(b => b.code === mat.code && b.dataId === mat.dataId);
    });

    return [ base, filteredMaterial ];
  }

  /**
   * Removes the base entry for a given code when the material also has that code.
   * This gives the material ("last applied") effective replacement behavior for
   * codes like 35 (basic attack skill) and 55 (dual-wield toggle).
   * @param {RPG_Trait[]} base
   * @param {RPG_Trait[]} material
   * @param {number} code The code to apply replacement to.
   * @returns {[RPG_Trait[], RPG_Trait[]]}
   */
  static #replaceCode(base, material, code)
  {
    // if material doesn't carry this code at all, nothing to replace.
    if (!material.some(t => t.code === code)) return [ base, material ];

    // strip base entries of this code so the material version wins.
    return [ base.filter(t => t.code !== code), material ];
  }

  /**
   * Runs keep-better resolution for all higher-is-better and lower-is-better codes.
   * @param {RPG_Trait[]} base
   * @param {RPG_Trait[]} material
   * @returns {[RPG_Trait[], RPG_Trait[]]}
   */
  static #keepBetterAll(base, material)
  {
    let resultBase = base;
    let resultMaterial = material;

    for (const code of this.#HigherIsBetterCodes)
    {
      [ resultBase, resultMaterial ] = this.#keepBetter(resultBase, resultMaterial, code, true);
    }

    for (const code of this.#LowerIsBetterCodes)
    {
      [ resultBase, resultMaterial ] = this.#keepBetter(resultBase, resultMaterial, code, false);
    }

    return [ resultBase, resultMaterial ];
  }

  /**
   * For each shared code+dataId pair between the two lists, removes the "worse" entry
   * from its list so only the winner survives into the final concat.
   * @param {RPG_Trait[]} base
   * @param {RPG_Trait[]} material
   * @param {number} code The trait code to process.
   * @param {boolean} higherIsBetter True if higher values are preferred; false if lower is.
   * @returns {[RPG_Trait[], RPG_Trait[]]}
   */
  static #keepBetter(base, material, code, higherIsBetter)
  {
    const baseToRemove = new Set();
    const matToRemove = new Set();

    base.forEach((baseTrait, bi) =>
    {
      // only process this specific code.
      if (baseTrait.code !== code) return;

      // find the matching material entry.
      const mi = material.findIndex(t => t.code === code && t.dataId === baseTrait.dataId);
      if (mi === -1) return;

      const matTrait = material[mi];
      const baseWins = higherIsBetter
        ? baseTrait.value >= matTrait.value
        : baseTrait.value <= matTrait.value;

      if (baseWins)
      {
        // base already has the better value; drop the material entry.
        matToRemove.add(mi);
      }
      else
      {
        // material has the better value; drop the base entry.
        baseToRemove.add(bi);
      }
    });

    return [
      base.filter((_, i) => !baseToRemove.has(i)),
      material.filter((_, i) => !matToRemove.has(i)),
    ];
  }
  //endregion private helpers
}

export default TraitResolver;
//endregion TraitResolver

//region RefinementEligibility
import JaftingManager from './JaftingManager.js';

/**
 * Answers whether one equip may take part in refinement right now, and why not when it may not.
 *
 * **This exists so the list can be sorted.** The eligibility rules used to be computed while each row was being
 * built, which meant the ordering pass ran before any row knew whether it was usable and had nothing to sort on -
 * so a player hunting for the one valid donor scrolled past every invalid one to find it. Deciding first and
 * drawing second is the whole point, and it happens to put the rules somewhere they can be tested without a scene.
 *
 * **Two kinds of "no", and they are treated differently.**
 *
 * - **Permanent** - this equip can never fill this role, in any circumstance. Those rows are dropped entirely,
 *   because showing a player something they will never be allowed to pick is a tease. JAFTING already did this for
 *   {@link RPG_EquipItem.jaftingUnrefinable}; this widens it to the per-role flags that mean the same thing.
 * - **Situational** - this equip is fine in principle but not against the base currently chosen, or has been
 *   improved as far as it goes. Those rows stay, disabled and carrying a reason, and sort to the bottom. Filtering
 *   them would be actively worse: a maxed-out weapon is an achievement the player wants to see rather than an
 *   error, and a "not with this base" row becomes valid the moment they back out and choose differently, so hiding
 *   it would make the list change shape while it is being read.
 */
class RefinementEligibility
{
  /**
   * Icon shown on a row that is barred outright, whether by rule or by the chosen base.
   * @type {number}
   */
  static BlockedIcon = 90;

  /**
   * Icon marking the physical copy the player already committed as the base.
   * @type {number}
   */
  static ChosenBaseIcon = 91;

  /**
   * Icon shown on a row that has hit a ceiling - fully refined, or at its trait cap.
   * @type {number}
   */
  static CappedIcon = 92;

  /**
   * Whether this equip can never fill this role, so the list should not offer it at all.
   *
   * @param {RPG_EquipItem} equip The equip being considered.
   * @param {boolean} isPrimary True when filling the base slot, false when filling the donor slot.
   * @returns {boolean}
   */
  static isPermanentlyExcluded(equip, isPrimary)
  {
    // barred from refinement altogether, in either role.
    if (equip.jaftingUnrefinable)
    {
      return true;
    }

    if (isPrimary)
    {
      return equip.jaftingNotRefinementBase;
    }

    return equip.jaftingNotRefinementMaterial;
  }

  /**
   * Judges one equip for the role currently being filled.
   *
   * Deliberately answers about the **template** rather than a particular copy of it. Which physical copy the player
   * is pointing at only matters for refusing to feed a base to itself, and that is the list's own business - every
   * copy of one template shares the verdict returned here, which is exactly what lets the sort treat them as a
   * block.
   *
   * @param {RPG_EquipItem} equip The equip being considered.
   * @param {boolean} isPrimary True when filling the base slot, false when filling the donor slot.
   * @param {RPG_EquipItem|null} baseSelection The already-chosen base, or null while choosing one.
   * @returns {{ enabled: boolean, iconIndex: number, errorText: string }}
   */
  static evaluate(equip, isPrimary, baseSelection)
  {
    if (isPrimary)
    {
      return RefinementEligibility.evaluateAsBase(equip);
    }

    return RefinementEligibility.evaluateAsMaterial(equip, baseSelection);
  }

  /**
   * Judges an equip offered as the thing being improved.
   *
   * @param {RPG_EquipItem} equip The equip being considered.
   * @returns {{ enabled: boolean, iconIndex: number, errorText: string }}
   */
  static evaluateAsBase(equip)
  {
    const verdict = {
      enabled: true,
      iconIndex: equip.iconIndex,
      errorText: String.empty,
    };

    // a cap of zero means "no cap" rather than "none allowed", for both of the ceilings below.
    const refineCap = equip.jaftingMaxRefineCount;
    const isMaxRefined = refineCap === 0
      ? false
      : refineCap <= equip.jaftingRefinedCount;

    if (isMaxRefined)
    {
      verdict.enabled = false;
      verdict.iconIndex = RefinementEligibility.CappedIcon;
      verdict.errorText += `${J.JAFTING.EXT.REFINE.Messages.AlreadyMaxRefineCount}\n`;
    }

    const traitCap = equip.jaftingMaxTraitCount;
    const currentTraits = JaftingManager.countRefinedEffects(equip);
    const hasMaxTraits = traitCap === 0
      ? false
      : traitCap <= currentTraits;

    if (hasMaxTraits)
    {
      verdict.enabled = false;
      verdict.iconIndex = RefinementEligibility.CappedIcon;
      verdict.errorText += `${J.JAFTING.EXT.REFINE.Messages.AlreadyMaxTraitCount}\n`;
    }

    return verdict;
  }

  /**
   * Judges an equip offered as the thing being consumed.
   *
   * @param {RPG_EquipItem} equip The equip being considered.
   * @param {RPG_EquipItem|null} baseSelection The already-chosen base, or null while choosing one.
   * @returns {{ enabled: boolean, iconIndex: number, errorText: string }}
   */
  static evaluateAsMaterial(equip, baseSelection)
  {
    const verdict = {
      enabled: true,
      iconIndex: equip.iconIndex,
      errorText: String.empty,
    };

    // refinement moves the traits below the divider, so a donor without any has nothing to give.
    if (JaftingManager.parseTraits(equip).length === 0)
    {
      verdict.enabled = false;
      verdict.errorText += `${J.JAFTING.EXT.REFINE.Messages.NoTraitsOnMaterial}\n`;
    }

    // the remaining ceilings are all measured against the base, so there is nothing to measure yet without one.
    if (baseSelection === null)
    {
      return verdict;
    }

    RefinementEligibility.applyRefineCountCeiling(verdict, equip, baseSelection);
    RefinementEligibility.applyTraitCountCeiling(verdict, equip, baseSelection);

    return verdict;
  }

  /**
   * Bars a donor when the base has already been refined as many times as it is allowed to be.
   *
   * The donor itself is not consulted. Every refinement costs the base exactly one count regardless of
   * how much history the donor brought with it, so what a donor accumulated has no bearing on whether
   * the base can accept it.
   *
   * @param {{ enabled: boolean, iconIndex: number, errorText: string }} verdict The verdict being amended.
   * @param {RPG_EquipItem} _equip The donor being considered, which this ceiling does not depend on.
   * @param {RPG_EquipItem} baseSelection The chosen base.
   */
  static applyRefineCountCeiling(verdict, _equip, baseSelection)
  {
    const cap = baseSelection.jaftingMaxRefineCount;

    // zero means uncapped.
    if (cap === 0)
    {
      return;
    }

    // a refinement costs exactly one count, whatever the donor accumulated before it got here. Charging
    // the donor's history instead is what used to bar a max-refined weapon from being spent on anything.
    const projected = baseSelection.jaftingRefinedCount + 1;

    if (cap >= projected)
    {
      return;
    }

    verdict.enabled = false;
    verdict.iconIndex = RefinementEligibility.BlockedIcon;
    verdict.errorText += `${J.JAFTING.EXT.REFINE.Messages.ExceedRefineCount} ${projected}/${cap}.<br>\n`;
  }

  /**
   * Whether this equip should sort with the crafted goods rather than the stock ones.
   *
   * Anything carrying dismantle history or a refine counter has a story, and those are the rows a player browsing
   * this list is usually looking for. Note this asks about the **template**, never a single copy of it - ordering on
   * a per-copy value would reshuffle identical rows every time the list refreshed.
   *
   * @param {RPG_EquipItem} equip The equip being considered.
   * @returns {boolean}
   */
  static hasStampedLineage(equip)
  {
    if (equip.jaftingRefinedCount > 0)
    {
      return true;
    }

    const ledger = JaftingSalvageManager.getLedgerForDatum(equip);

    if (ledger === null)
    {
      return false;
    }

    return ledger.rows.length > 0;
  }

  /**
   * Orders two judged rows for display.
   *
   * **Usable first, and that is the point of the whole exercise.** Everything after it is the ordering this list
   * always had: rows with a history above stock equipment, weapons before armor, then by id so copies of one
   * template stay together.
   *
   * @param {{ equip: RPG_EquipItem, verdict: { enabled: boolean } }} left The row being placed.
   * @param {{ equip: RPG_EquipItem, verdict: { enabled: boolean } }} right The row it is compared against.
   * @returns {number}
   */
  static compareCandidates(left, right)
  {
    if (left.verdict.enabled !== right.verdict.enabled)
    {
      return left.verdict.enabled
        ? -1
        : 1;
    }

    const leftStamped = RefinementEligibility.hasStampedLineage(left.equip);
    const rightStamped = RefinementEligibility.hasStampedLineage(right.equip);

    if (leftStamped !== rightStamped)
    {
      return leftStamped
        ? -1
        : 1;
    }

    if (left.equip.etypeId !== right.equip.etypeId)
    {
      return left.equip.etypeId - right.equip.etypeId;
    }

    return left.equip.id - right.equip.id;
  }

  /**
   * Bars a donor whose traits would push the merged result past the base's trait ceiling.
   *
   * @param {{ enabled: boolean, iconIndex: number, errorText: string }} verdict The verdict being amended.
   * @param {RPG_EquipItem} equip The donor being considered.
   * @param {RPG_EquipItem} baseSelection The chosen base.
   */
  static applyTraitCountCeiling(verdict, equip, baseSelection)
  {
    const cap = baseSelection.jaftingMaxTraitCount;

    // zero means uncapped.
    if (cap === 0)
    {
      return;
    }

    const projectedOutput = JaftingManager.determineRefinementOutput(baseSelection, equip);
    const projectedTraits = JaftingManager.countRefinedEffects(projectedOutput);

    if (cap >= projectedTraits)
    {
      return;
    }

    verdict.enabled = false;
    verdict.iconIndex = RefinementEligibility.CappedIcon;
    verdict.errorText += `${J.JAFTING.EXT.REFINE.Messages.ExceedTraitCount} ${projectedTraits}/${cap}.<br>\n`;
  }
}

export default RefinementEligibility;

//endregion RefinementEligibility
import RPG_Traited from '../base/RPG_Traited.js';

//region RPG_BaseBattler
/**
 * A class representing the groundwork for what all battlers
 * database data look like.
 */
class RPG_BaseBattler
  extends RPG_Traited
{
  /**
   * The engine's trait code for an element rate modifier.<br/>
   * Mirrored here so element inference does not depend on {@link Game_BattlerBase} being defined,
   * which matters because database objects are hydrated before the battler classes are touched.
   * @type {number}
   */
  static TRAIT_ELEMENT_RATE = 11;

  /**
   * The name of the battler while in battle.
   * @type {string}
   */
  battlerName = String.empty;

  /**
   * Constructor.
   * Maps the base battler data to the properties on this class.
   * @param {RPG_Enemy|RPG_Actor} battler The battler to parse.
   * @param {number} index The index of the entry in the database.
   */
  constructor(battler, index)
  {
    // perform original logic.
    super(battler, index);

    // map core battler data onto this object.
    this.battlerName = battler.battlerName;
  }

  /**
   * Gets the type of implementation this database entry is.
   * @returns {string}
   */
  implementationType()
  {
    return `${super.implementationType()}:battler`;
  }

  /**
   * Computes this battler's element rates from its own database traits alone.<br/>
   * Runtime states, equipment and class are deliberately NOT considered- this is the battler's
   * innate elemental profile as authored, which is what identity inference needs. A battler that
   * is only resistant to fire because it is standing in a buff is not a fire creature.
   *
   * The result is indexed by element id and defaults to `1.0` for every element the battler has
   * no trait for. Multiple rate traits on the same element multiply together, matching how the
   * engine itself accumulates {@link Game_BattlerBase.TRAIT_ELEMENT_RATE}.
   * @returns {number[]} Element rates indexed by element id.
   */
  elementRates()
  {
    // every element starts at unmodified, which is a rate of exactly one.
    const rates = new Array($dataSystem.elements.length).fill(1.0);

    // accumulate each element rate trait onto its element.
    this.traits
      .filter(trait => trait.code === RPG_BaseBattler.TRAIT_ELEMENT_RATE)
      .forEach(trait =>
      {
        // rates stack multiplicatively rather than replacing one another.
        rates[trait.dataId] = rates[trait.dataId] * Number(trait.value);
      });

    return rates;
  }

  /**
   * Infers which elements characterize this battler, by reading how sharply it deviates from
   * neutral on each one. An element the battler strongly resists, or is strongly weak to, is
   * treated as telling you something about what the battler *is*.
   *
   * This is deliberately numeric and knows nothing about element naming conventions. A caller
   * that cares only about a particular family of elements- a taxonomy prefix, an id range- is
   * expected to filter the returned ids itself.
   * @param {number} resistThreshold Rates strictly below this count as an alignment.
   * @param {number} weaknessThreshold Rates strictly above this count as a vulnerability.
   * @returns {number[]} The inferred element ids, ascending, without duplicates.
   */
  inferredElementIds(resistThreshold, weaknessThreshold)
  {
    // resolve the innate rate of every element on this battler.
    const rates = this.elementRates();

    // collect the ids that deviate far enough from neutral in either direction.
    const inferred = [];
    rates.forEach((rate, elementId) =>
    {
      // element id zero is the engine's "no element" slot and characterizes nothing.
      if (elementId === 0) return;

      // a sharp resistance and a sharp vulnerability are equally identifying.
      if (rate < resistThreshold || rate > weaknessThreshold)
      {
        inferred.push(elementId);
      }
    });

    // the loop visits each id exactly once, so these are already unique and already ordered.
    return inferred;
  }
}


export default RPG_BaseBattler;
//endregion RPG_BaseBattler
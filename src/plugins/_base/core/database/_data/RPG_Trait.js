//region RPG_Trait
import IconManager from './../../managers/IconManager.js';

/**
 * A class representing a single trait living on one of the many types
 * of database classes that leverage traits.
 */
class RPG_Trait
{
  /**
   * Constructs a new {@link RPG_Trait} from only its triad of base values.
   * @param {number} code The code that designates what kind of trait this is.
   * @param {number} dataId The identifier that further defines the trait.
   * @param {number} value The value of the trait, for traits that have numeric values.
   * @returns {RPG_Trait}
   */
  static fromValues(code, dataId, value)
  {
    return new RPG_Trait({
      code,
      dataId,
      value
    });
  }

  /**
   * The code that designates what kind of trait this is.
   * @type {number}
   */
  code = 0;

  /**
   * The identifier that further defines the trait.
   * Data type and usage depends on the code.
   * @type {number}
   */
  dataId = 0;

  /**
   * The value of the trait, for traits that have numeric values.
   * Often is a floating point number to represent a percent multiplier.
   * @type {number}
   */
  value = 1.00;

  /**
   * Constructor.
   * @param {RPG_Trait} trait The trait to parse.
   */
  constructor(trait)
  {

    // assign code on this instance for callers.
    this.code = trait.code;
    this.dataId = trait.dataId;
    this.value = trait.value;
  }

  /**
   * The icon representing what this trait affects, or 0 when it has no natural one.
   *
   * The three parameter codes line up exactly with the three parameter icon lookups already in
   * {@link IconManager}, so a trait carrying a stat can always be shown as that stat's icon rather than
   * spelled out. Everything else - element rates, skill seals, party abilities - has no single icon that
   * means it, and answers 0 so a caller can fall back to words instead of inventing artwork.
   * @returns {number}
   */
  iconIndex()
  {
    // base parameters: MHP through LUK.
    if (this.code === 21) return IconManager.param(this.dataId);

    // ex-parameters: HIT through TRG.
    if (this.code === 22) return IconManager.xparam(this.dataId);

    // sp-parameters: TGR through EXR.
    if (this.code === 23) return IconManager.sparam(this.dataId);

    // an element the bearer strikes with, or resists.
    if (this.code === 11 || this.code === 31) return IconManager.element(this.dataId);

    // a state this resists; the state already has a face.
    if (this.code === 14) return $dataStates.at(this.dataId).iconIndex;

    // a skill granted, sealed, or attacked with; likewise.
    if (this.code === 35 || this.code === 43 || this.code === 44) return $dataSkills.at(this.dataId).iconIndex;

    return 0;
  }

  /**
   * Gets a combined textual name and value of this trait.
   * @return {string}
   */
  textNameAndValue()
  {
    return `${this.textName()} ${this.textValue()}`;
  }

  /**
   * Renders an amount that carries its own sign, prefixing a plus when it is not already negative.
   *
   * This is the shape a parameter delta takes: the number itself is the answer, and the sign is
   * only there so a reader can tell a gain from a loss at a glance.
   * @param {number} amount The already-signed amount to render.
   * @returns {string}
   */
  static asDelta(amount)
  {
    return `${amount >= 0
      ? '+'
      : ''}${amount}`;
  }

  /**
   * Renders a signed amount as a percentage.
   * @param {number} amount The already-signed amount to render.
   * @returns {string}
   */
  static asDeltaPercent(amount)
  {
    const delta = RPG_Trait.asDelta(amount);

    return `${delta}%`;
  }

  /**
   * Renders a magnitude behind an explicitly chosen sign.
   *
   * Unlike {@link RPG_Trait.asDelta}, the sign here is a separate decision from the number: several
   * trait codes compute a rate whose sign runs opposite the direction a player reads it in, so the
   * caller decides which way it points and hands over the magnitude alone.
   * @param {number} magnitude The amount to render, whose own sign is discarded.
   * @param {boolean} isPositive Whether to render this as a gain rather than a loss.
   * @returns {string}
   */
  static asSignedMagnitude(magnitude, isPositive)
  {
    return `${isPositive
      ? '+'
      : '-'}${Math.abs(magnitude)}`;
  }

  /**
   * Renders a magnitude behind an explicitly chosen sign, as a percentage.
   * @param {number} magnitude The amount to render, whose own sign is discarded.
   * @param {boolean} isPositive Whether to render this as a gain rather than a loss.
   * @returns {string}
   */
  static asSignedMagnitudePercent(magnitude, isPositive)
  {
    const signed = RPG_Trait.asSignedMagnitude(magnitude, isPositive);

    return `${signed}%`;
  }

  /**
   * The formatters rendering the name half of a trait, keyed by trait code.
   *
   * A formatter answers the noun that the value half then qualifies, and receives the trait rather
   * than reading one from a closure, so it stays a plain function anything can call and test.
   *
   * This is an extension point rather than a private detail. A plugin introducing its own trait
   * code registers a formatter for it from its own tree - `RPG_Trait.NameFormatters[70] = ...` -
   * the same way popup types are added to {@link Map_TextPop.Types}, instead of this file growing a
   * case for every plugin that ever ships. A code with no formatter falls to
   * {@link RPG_Trait#unknownTraitName}.
   * @type {Object<number, function(RPG_Trait): string>}
   */
  static NameFormatters = {
    // first tab: elemental, parameter and state resistances.
    11: trait => `${$dataSystem.elements[trait.dataId]} dmg`,
    12: trait => `${TextManager.param(trait.dataId)} debuff rate`,
    13: trait => `${$dataStates[trait.dataId].name} resist`,
    14: () => 'Immune to',

    // second tab: the three parameter families.
    21: trait => `${TextManager.param(trait.dataId)}`,
    22: trait => `${TextManager.xparam(trait.dataId)}`,
    23: trait => `${TextManager.sparam(trait.dataId)}`,

    // third tab: what an attack is made of.
    31: () => 'Element:',
    32: trait => `${$dataStates[trait.dataId].name} on-hit`,
    33: () => 'Skill Speed',
    34: () => 'Times',
    35: () => 'Basic Attack w/',

    // fourth tab: skill access. the four read as a matched set, which is why they are four verbs
    // rather than four sentences - the value half names the skill or skill type being acted on.
    41: () => 'Unlock:',
    42: () => 'Lock:',
    43: () => 'Learn:',
    44: () => 'Seal:',

    // fifth tab: equipment access. 53 and 54 read the same table on purpose, because both name an
    // equip slot; the value half is what says whether it is locked or sealed.
    51: trait => `${$dataSystem.weaponTypes[trait.dataId]}`,
    52: trait => `${$dataSystem.armorTypes[trait.dataId]}`,
    53: trait => `${$dataSystem.equipTypes[trait.dataId]}`,
    54: trait => `${$dataSystem.equipTypes[trait.dataId]}`,

    // this one is a toggle rather than a slot, so the dataId is read as truth rather than as an
    // index into anything.
    55: trait => (trait.dataId
      ? 'Enable'
      : 'Disable'),

    // sixth tab: party-wide effects and the special flags. both are interpolated rather than
    // returned bare because their translators answer undefined for a data id they do not name, and
    // interpolating is what has always turned that into text instead of leaking the value onward.
    61: () => 'Another turn chance:',
    62: trait => `${trait.translateSpecialFlag()}`,
    63: () => 'TRANSFERABLE TRAITS',
    64: trait => `${trait.translatePartyAbility()}`,
  };

  /**
   * Gets the underlying name of the trait as text.
   * @returns {string}
   */
  textName()
  {
    const formatter = RPG_Trait.NameFormatters[this.code];

    // a code nothing registered belongs to a plugin that introduced the trait without teaching this
    // table how to render it, so say that rather than printing an empty half of a sentence.
    if (formatter === undefined) return this.unknownTraitName();

    return formatter(this);
  }

  /**
   * The name given to a trait whose code no formatter claims.
   *
   * Its own method so a plugin that knows better about its own codes can alias it and answer
   * something more useful than a shrug.
   * @returns {string}
   */
  unknownTraitName()
  {
    return 'Is this a custom trait?';
  }

  /**
   * The formatters rendering the value half of a trait, keyed by trait code.
   *
   * The counterpart to {@link RPG_Trait.NameFormatters} and extended the same way: a plugin owning
   * a trait code registers both halves for it. A code with no formatter falls to
   * {@link RPG_Trait#unknownTraitValue}.
   * @type {Object<number, function(RPG_Trait): string>}
   */
  static ValueFormatters = {
    // first tab.
    11: trait =>
    {
      // a positive result is a resistance and a negative one a weakness, but a player reads this as
      // damage taken- so the sign is flipped against the number on the way out.
      const elementalRate = Math.round(100 - (trait.value * 100));
      const isMoreDamage = elementalRate <= 0;

      return RPG_Trait.asSignedMagnitudePercent(elementalRate, isMoreDamage);
    },
    12: trait =>
    {
      // positive is more susceptible to the debuff, negative is less.
      const debuffRate = Math.round((trait.value * 100) - 100);
      const isMoreSusceptible = debuffRate >= 0;

      return RPG_Trait.asSignedMagnitudePercent(debuffRate, isMoreSusceptible);
    },
    13: trait =>
    {
      // positive is more resistant, meaning the state is less likely to land.
      const stateRate = Math.round(100 - (trait.value * 100));
      const isMoreResistant = stateRate > 0;

      return RPG_Trait.asSignedMagnitudePercent(stateRate, isMoreResistant);
    },
    14: trait => $dataStates[trait.dataId].name,

    // second tab.
    21: trait =>
    {
      const bParamRate = Math.round((trait.value * 100) - 100);

      return RPG_Trait.asDeltaPercent(bParamRate);
    },
    22: trait =>
    {
      const xParamRate = Math.round(trait.value * 100);

      // accuracy (hit, dataId 0): the xparam base is 0, so value*100 IS the flat integer JABS
      // reads. Same math as every other xparam- only the percent sign is omitted, because the
      // number is not one.
      if (trait.dataId === 0) return RPG_Trait.asDelta(xParamRate);

      return RPG_Trait.asDeltaPercent(xParamRate);
    },
    23: trait =>
    {
      const sParamRate = Math.round((trait.value * 100) - 100);

      // parry (grd, dataId 1): the sparam base is 1.0, so (value*100)-100 IS the flat integer JABS
      // reads, on the same reasoning as accuracy above.
      if (trait.dataId === 1) return RPG_Trait.asDelta(sParamRate);

      return RPG_Trait.asDeltaPercent(sParamRate);
    },

    // third tab.
    31: trait => `${$dataSystem.elements.at(trait.dataId)}`,
    32: trait => `${(trait.value * 100)}%`,
    33: trait => RPG_Trait.asSignedMagnitude(trait.value, trait.value >= 0),
    34: trait => RPG_Trait.asSignedMagnitude(trait.value, trait.value >= 0),
    35: trait => `${$dataSkills[trait.dataId].name}`,

    // fourth tab.
    41: trait => `${$dataSystem.skillTypes[trait.dataId]}`,
    42: trait => `${$dataSystem.skillTypes[trait.dataId]}`,
    43: trait => `${$dataSkills[trait.dataId].name}`,
    44: trait => `${$dataSkills[trait.dataId].name}`,

    // fifth tab.
    51: () => 'proficiency',
    52: () => 'proficiency',
    53: () => 'is locked',
    54: () => 'is sealed',
    55: () => 'Dual-wield',

    // sixth tab. the flag codes carry their whole meaning in the name half, so the value is empty
    // rather than absent- a trailing sentinel keeps textNameAndValue from growing a dangling word.
    61: trait => `${Math.round(trait.value * 100)}%`,
    62: () => String.empty,
    63: () => String.empty,
    64: () => String.empty,
  };

  /**
   * Gets the underlying value of the trait as text.
   * @returns {string}
   */
  textValue()
  {
    const formatter = RPG_Trait.ValueFormatters[this.code];

    // matches the name half: an unregistered code says so rather than rendering nothing.
    if (formatter === undefined) return this.unknownTraitValue();

    return formatter(this);
  }

  /**
   * The value given to a trait whose code no formatter claims.
   *
   * Its own method for the same reason {@link RPG_Trait#unknownTraitName} is: a plugin that owns
   * the code can alias it rather than reaching into the table.
   * @returns {string}
   */
  unknownTraitValue()
  {
    return 'is this a custom trait?';
  }

  /**
   * The names of the special flags a trait of code 62 can carry, keyed by data id.
   *
   * Extended the same way the formatter tables are, for a plugin introducing a special flag of
   * its own.
   * @type {Object<number, string>}
   */
  static SpecialFlagNames = {
    0: 'Autobattle',
    1: 'Empowered Guard',
    2: 'Cover/Substitute',
    3: 'Preserve TP',
  };

  /**
   * The names of the party abilities a trait of code 64 can carry, keyed by data id.
   *
   * Extended the same way the formatter tables are, for a plugin introducing a party ability of
   * its own.
   * @type {Object<number, string>}
   */
  static PartyAbilityNames = {
    0: 'Encounter Half',
    1: 'Encounter None',
    2: 'Prevent Surprise',
    3: 'Frequent Pre-emptive',
    4: 'Gold Dropped 2x',
    5: 'Loot Drop Chance 2x',
  };

  /**
   * Translates this trait's data id into the name of the special flag it sets.
   *
   * Answers undefined for a data id the table does not name, which is the one place in this class
   * that does not answer a typed sentinel. That predates the table and is pinned by test, so it is
   * preserved here rather than quietly corrected under a refactor.
   * @returns {string|undefined}
   */
  translateSpecialFlag()
  {
    return RPG_Trait.SpecialFlagNames[this.dataId];
  }

  /**
   * Translates this trait's data id into the name of the party ability it grants.
   *
   * Answers undefined for an unnamed data id, on the same footing as
   * {@link RPG_Trait#translateSpecialFlag}.
   * @returns {string|undefined}
   */
  translatePartyAbility()
  {
    return RPG_Trait.PartyAbilityNames[this.dataId];
  }
}

export default RPG_Trait;
//endregion RPG_Trait
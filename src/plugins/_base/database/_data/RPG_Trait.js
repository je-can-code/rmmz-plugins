//region RPG_Trait
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
    return new RPG_Trait({ code, dataId, value });
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

    this.code = trait.code;
    this.dataId = trait.dataId;
    this.value = trait.value;
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
   * Gets the underlying name of the trait as text.
   * @return {string}
   */
  textName()
  {
    switch (this.code)
    {
      // first tab.
      case 11:
        return `${$dataSystem.elements[this.dataId]} dmg`;
      case 12:
        return `${TextManager.param(this.dataId)} debuff rate`;
      case 13:
        return `${$dataStates[this.dataId].name} resist`;
      case 14:
        return 'Immune to';

      // second tab.
      case 21:
        return `${TextManager.param(this.dataId)}`;
      case 22:
        return `${TextManager.xparam(this.dataId)}`;
      case 23:
        return `${TextManager.sparam(this.dataId)}`;

      // third tab.
      case 31:
        return 'Element:';
      case 32:
        return `${$dataStates[this.dataId].name} on-hit`;
      case 33:
        return 'Skill Speed';
      case 34:
        return 'Times';
      case 35:
        return 'Basic Attack w/';

      // fourth tab.
      case 41:
        return `Unlock:`;
      case 42:
        return `Lock:`;
      case 43:
        return `Learn:`;
      case 44:
        return `Seal:`;

      // fifth tab.
      case 51:
        return `${$dataSystem.weaponTypes[this.dataId]}`;
      case 52:
        return `${$dataSystem.armorTypes[this.dataId]}`;
      case 53:
        return `${$dataSystem.equipTypes[this.dataId]}`;
      case 54:
        return `${$dataSystem.equipTypes[this.dataId]}`;
      case 55:
        return `${this.dataId
          ? "Enable"
          : "Disable"}`;

      // sixth tab.
      case 61:
        return 'Another turn chance:';
      case 62:
        return `${this.translateSpecialFlag()}`;
      case 64:
        return `${this.translatePartyAbility()}`;

      case 63:
        return 'TRANSFERABLE TRAITS';
      default:
        return 'Is this a custom trait?';
    }
  }

  /**
   * Gets the underlying value of the trait as text.
   * @return {*|string}
   */
  textValue()
  {
    switch (this.code)
    {
      // first tab.
      case 11:
        const calculatedElementalRate = Math.round(100 - (this.value * 100));
        return `${calculatedElementalRate > 0
          ? "-"
          : "+"}${calculatedElementalRate}%`;
      case 12:
        const calculatedDebuffRate = Math.round((this.value * 100) - 100);
        return `${calculatedDebuffRate > 0
          ? "+"
          : "-"}${calculatedDebuffRate}%`;
      case 13:
        const calculatedStateRate = Math.round(100 - (this.value * 100));
        return `${calculatedStateRate > 0
          ? "+"
          : "-"}${calculatedStateRate}%`;
      case 14:
        return $dataStates[this.dataId].name;

      // second tab.
      case 21:
        const calculatedBParam = Math.round((this.value * 100) - 100);
        return `${calculatedBParam >= 0
          ? "+"
          : ""}${calculatedBParam}%`;
      case 22:
        const calculatedXParam = Math.round((this.value * 100));
        return `${calculatedXParam >= 0
          ? "+"
          : ""}${calculatedXParam}%`;
      case 23:
        const calculatedSParam = Math.round((this.value * 100) - 100);
        return `${calculatedSParam >= 0
          ? "+"
          : ""}${calculatedSParam}%`;

      // third tab.
      case 31:
        return `${$dataSystem.elements.at(this.dataId)}`;
      case 32:
        return `${(this.value * 100)}%`;
      case 33:
        return `${this.value > 0
          ? "+"
          : "-"}${this.value}`;
      case 34:
        return `${this.value > 0
          ? "+"
          : "-"}${this.value}`;
      case 35:
        return `${$dataSkills[this.value].name}`;

      // fourth tab.
      case 41:
        return `${$dataSystem.skillTypes[this.dataId]}`;
      case 42:
        return `${$dataSystem.skillTypes[this.dataId]}`;
      case 43:
        return `${$dataSkills[this.dataId].name}`;
      case 44:
        return `${$dataSkills[this.dataId].name}`;

      // fifth tab.
      case 51:
        return 'proficiency';
      case 52:
        return 'proficiency';
      case 53:
        return 'is locked';
      case 54:
        return 'is sealed';
      case 55:
        return 'Dual-wield';

      // sixth tab.
      case 61:
        return `${Math.round(this.value * 100)}%`;
      case 62:
        return String.empty;
      case 64:
        return String.empty;
      case 63:
        return String.empty;
      default:
        return "is this a custom trait?";
    }
  }

  translateSpecialFlag()
  {
    switch (this.dataId)
    {
      case 0:
        return 'Autobattle';
      case 1:
        return 'Empowered Guard';
      case 2:
        return 'Cover/Substitute';
      case 3:
        return 'Preserve TP';
    }
  }

  translatePartyAbility()
  {
    switch (this.dataId)
    {
      case 0:
        return 'Encounter Half';
      case 1:
        return 'Encounter None';
      case 2:
        return 'Prevent Surprise';
      case 3:
        return 'Frequent Pre-emptive';
      case 4:
        return 'Gold Dropped 2x';
      case 5:
        return 'Loot Drop Chance 2x';
    }
  }
}

//endregion RPG_Trait
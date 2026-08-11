//region CurrencyDefinition
/**
 * One kind of spendable thing the currency strip is willing to display.
 *
 * A definition is a description rather than a value: it knows what to call itself, what to draw beside
 * itself, and how to go and ask for the current amount. That last part is a function on purpose- a
 * balance changes constantly, and a strip caching numbers would be a strip showing yesterday's.
 *
 * The menu owns the strip but not what goes in it. Anything with a currency describes it this way and
 * hands it over, which is what lets the menu display a thing it has never heard of.
 */
class CurrencyDefinition
{
  /**
   * The unique identifier for this currency, used to keep the same one from being added twice.
   * @type {string}
   */
  key = String.empty;

  /**
   * The icon drawn beside the amount, or -1 to draw none.
   * @type {number}
   */
  iconIndex = -1;

  /**
   * Answers with the short label drawn beside the amount.<br/>
   * Declared without a default, because the constructor requires one and a stand-in nobody can ever
   * observe is just a lie about what happens when it is missing.
   * @type {function(): string}
   */
  unitProvider;

  /**
   * Answers with the amount currently held.<br/>
   * Declared without a default, for the same reason as the label above it.
   * @type {function(): number}
   */
  amountProvider;

  /**
   * Constructor.
   *
   * Both halves are functions rather than values, and for the same reason. An amount changes constantly.
   * A label can come from the database- gold's does- and the database does not exist at the moment a
   * plugin registers itself, so reading one eagerly would throw before the title screen.
   * @param {string} key The unique identifier for this currency.
   * @param {number} iconIndex The icon drawn beside the amount, or -1 for none.
   * @param {function(): string} unitProvider Answers with the short label drawn beside the amount.
   * @param {function(): number} amountProvider Answers with the amount currently held.
   */
  constructor(key, iconIndex, unitProvider, amountProvider)
  {
    this.key = key;
    this.iconIndex = iconIndex;
    this.unitProvider = unitProvider;
    this.amountProvider = amountProvider;
  }

  /**
   * The short label drawn beside the amount.
   * @returns {string}
   */
  unit()
  {
    return this.unitProvider();
  }

  /**
   * The amount currently held of this currency.
   * @returns {number}
   */
  amount()
  {
    return this.amountProvider();
  }

  /**
   * Whether this currency draws an icon beside its amount.
   * @returns {boolean}
   */
  hasIcon()
  {
    return this.iconIndex > -1;
  }
}

export default CurrencyDefinition;
//endregion CurrencyDefinition
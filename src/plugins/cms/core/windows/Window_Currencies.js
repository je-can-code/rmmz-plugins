//region Window_Currencies
/**
 * The strip along the floor of the menu's centre stack, showing everything the party can spend.
 *
 * This exists instead of vanilla's `Window_Gold` because that window draws gold and nothing else, with
 * the single draw call written directly into its refresh. There is no seam in it to add a second value
 * to, and it is small enough that inheriting from it would buy nothing but its shape.
 *
 * The menu does not know what currencies a game has. Anything that owns one registers a
 * {@link CurrencyDefinition} and is drawn alongside the rest, which is why gold is registered the same
 * way everything else is rather than being special-cased here.
 */
class Window_Currencies
  extends Window_Selectable
{
  /**
   * Every currency willing to be displayed, in the order they were registered.
   *
   * Static, because the registrations happen at boot- long before a menu is opened, and once for the
   * lifetime of the session rather than once per window.
   * @type {CurrencyDefinition[]}
   */
  static #definitions = [];

  /**
   * Adds a currency to the strip.
   *
   * Registering the same key twice is ignored rather than duplicated, so a plugin that registers during
   * a hook that can run more than once does not slowly fill the strip with copies of itself.
   * @param {CurrencyDefinition} definition The currency to display.
   */
  static register(definition)
  {
    const alreadyRegistered = Window_Currencies.#definitions.some(existing => existing.key === definition.key);

    if (alreadyRegistered) return;

    Window_Currencies.#definitions.push(definition);
  }

  /**
   * Every currency currently registered for display.
   * @returns {CurrencyDefinition[]}
   */
  static definitions()
  {
    return Window_Currencies.#definitions;
  }

  /**
   * Constructor.
   * @param {Rectangle} rect The rectangle that represents this window.
   */
  constructor(rect)
  {
    super(rect);
  }

  /**
   * Implements {@link Window_Selectable.initialize}.
   * @param {Rectangle} rect The rectangle that represents this window.
   */
  initialize(rect)
  {
    // perform original logic.
    super.initialize(rect);

    // draw what the party is currently carrying.
    this.refresh();
  }

  /**
   * Overwrites {@link #colSpacing}.<br/>
   * The strip is a single row of text rather than a grid, so it wants no gutter of its own.
   * @returns {number}
   */
  colSpacing()
  {
    return 0;
  }

  /**
   * Overwrites {@link #refresh}.<br/>
   * Redraws every registered currency across the width of the strip.
   */
  refresh()
  {
    this.contents.clear();

    const definitions = Window_Currencies.definitions();

    // a strip with nothing registered is a strip with nothing to say, and dividing by zero besides.
    if (definitions.length === 0) return;

    const rect = this.itemLineRect(0);
    const slotWidth = Math.floor(rect.width / definitions.length);

    definitions.forEach((definition, index) => this.drawCurrency(definition, index, rect, slotWidth));
  }

  /**
   * Draws a single currency into its own slot along the strip.
   *
   * The icon eats into the left of the slot rather than being drawn over the amount, because the amount
   * is right-aligned and a wide number would otherwise run underneath it.
   * @param {CurrencyDefinition} definition The currency being drawn.
   * @param {number} index Which slot along the strip it occupies.
   * @param {Rectangle} rect The line the strip draws along.
   * @param {number} slotWidth How wide a single currency's slot is.
   */
  drawCurrency(definition, index, rect, slotWidth)
  {
    const slotX = rect.x + (index * slotWidth);

    if (definition.hasIcon())
    {
      this.drawIcon(definition.iconIndex, slotX, rect.y);
    }

    const textX = definition.hasIcon()
      ? slotX + ImageManager.iconWidth + 4
      : slotX;
    const textWidth = slotX + slotWidth - textX;

    const amount = definition.amount();
    const unit = definition.unit();

    this.drawCurrencyValue(amount, unit, textX, rect.y, textWidth);
  }
}

export default Window_Currencies;
//endregion Window_Currencies
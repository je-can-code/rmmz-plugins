//region Window_ControlLegend
import InputLegendResolver from './../managers/InputLegendResolver.js';

/**
 * A single-line legend describing what the controls do in the scene currently being viewed.
 *
 * Every scene teaches its own controls or the player never finds them. This is the window that does
 * the teaching, and it lives in J-Base precisely so that it is available to every scene rather than
 * being reinvented- or, as has historically happened, simply omitted- one scene at a time.
 *
 * Entries are supplied as semantic handler names paired with a plain-language label. The semantic is
 * resolved through {@link InputLegendResolver} when something has registered one, so the rendered
 * glyph follows the player's own remapping instead of asserting a button that may no longer be true.
 */
class Window_ControlLegend
  extends Window_Base
{
  /**
   * @constructor
   * @param {Rectangle} rect The rectangle that defines this window's shape.
   */
  constructor(rect)
  {
    // perform original logic.
    super(rect);

    // initialize our custom members.
    this.initMembers();
  }

  /**
   * Initializes all custom members of this window.
   */
  initMembers()
  {
    /**
     * The entries described by this legend.
     * @type {{semantic: string, label: string}[]}
     */
    this._entries = [];
  }

  /**
   * Gets the entries currently described by this legend.
   * @returns {{semantic: string, label: string}[]}
   */
  entries()
  {
    return this._entries;
  }

  /**
   * Sets the entries described by this legend and redraws.
   * @param {{semantic: string, label: string}[]} entries The entries to describe.
   */
  setEntries(entries)
  {
    // swap in the new entries.
    this._entries = entries;

    // the legend is only useful if it reflects what is currently true.
    this.refresh();
  }

  /**
   * Renders the legend.
   */
  refresh()
  {
    // wipe whatever was previously rendered.
    this.contents.clear();

    // a legend with nothing to say draws nothing at all.
    if (this._entries.length === 0) return;

    // draw the assembled line.
    this.drawLegend();
  }

  /**
   * Draws the assembled legend line.
   */
  drawLegend()
  {
    // pull away from the chrome edges slightly so it reads as helper text rather than content.
    const padX = this.legendPadding();

    // start from a known font state so repeated refreshes cannot compound size changes.
    this.resetFontSettings();

    // shrink so the legend never competes with the content it is describing.
    this.modFontSize(this.legendFontSizeModifier());

    // build the full line from the individual entries.
    const text = this.buildLegendText();

    // vertically center within whatever height this window was given.
    const y = Math.max(0, Math.floor((this.innerHeight - this.lineHeight()) / 2));

    // render the line across the available width.
    this.drawTextEx(text, padX, y, this.innerWidth - (padX * 2));

    // leave the font as we found it for any other consumer of this window's contents.
    this.resetFontSettings();
  }

  /**
   * Builds the full legend line from this window's entries.
   * @returns {string}
   */
  buildLegendText()
  {
    // describe each entry, then join them into a single line.
    return this.entries()
      .map(entry => this.describeEntry(entry))
      .join(this.legendSeparator());
  }

  /**
   * Describes a single legend entry as displayable text.
   * @param {{semantic: string, label: string}} entry The entry to describe.
   * @returns {string}
   */
  describeEntry(entry)
  {
    // ask whoever owns the input mapping what this semantic currently looks like, falling back to
    // the semantic's own name when nobody can say.
    const input = InputLegendResolver.resolve(entry.semantic, entry.semantic);

    // pair the input with what it actually does.
    return `${input}: ${entry.label}`;
  }

  /**
   * The horizontal padding applied to either end of the legend.
   * @returns {number}
   */
  legendPadding()
  {
    return 12;
  }

  /**
   * The separator drawn between legend entries.
   * @returns {string}
   */
  legendSeparator()
  {
    return '   ';
  }

  /**
   * How much smaller the legend renders than body copy.
   * @returns {number}
   */
  legendFontSizeModifier()
  {
    return -4;
  }
}

export default Window_ControlLegend;
//endregion Window_ControlLegend

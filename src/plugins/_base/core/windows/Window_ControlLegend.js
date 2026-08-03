//region Window_ControlLegend
import InputLegendResolver from './../managers/InputLegendResolver.js';
import InputDeviceTracker from './../managers/InputDeviceTracker.js';

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

    /**
     * The input device this legend's glyphs were last drawn for.
     * @type {string} One of {@link InputDevice}.
     */
    this._renderedDevice = InputDeviceTracker.currentDevice();
  }

  /**
   * Gets the input device this legend's glyphs were last drawn for.
   * @returns {string} One of {@link InputDevice}.
   */
  renderedDevice()
  {
    // hand back the device this legend currently reflects.
    return this._renderedDevice;
  }

  /**
   * Sets the input device this legend's glyphs were last drawn for.
   * @param {string} device One of {@link InputDevice}.
   */
  setRenderedDevice(device)
  {
    // assign the device this legend now reflects.
    this._renderedDevice = device;
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
   * Extends {@link Window_Base.update}.<br/>
   * Also redraws the legend when the player changes input device.
   *
   * Nothing pushes this change outward- the tracker has no idea who is listening- so the window asks,
   * which is the same way every other window in the engine notices the world moving underneath it. The
   * comparison is against what was last *drawn* rather than a flag, so a legend created before the
   * player ever touched anything still corrects itself.
   */
  update()
  {
    // perform original logic.
    super.update();

    // find out what the player is holding now.
    const currentDevice = InputDeviceTracker.currentDevice();

    // glyphs already match the device in the player's hands.
    if (this.renderedDevice() === currentDevice) return;

    // remember what we are about to draw for, so this only happens once per change.
    this.setRenderedDevice(currentDevice);

    // redraw every glyph in the other device's language.
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
    if (this.entries().length === 0) return;

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
   *
   * An entry may name more than one semantic, because some controls are a pair the player thinks of
   * as one thing- moving between columns is "left or right", not two separate abilities. Listing
   * those separately would say the same sentence twice.
   * @param {{semantic: (string|string[]), label: string}} entry The entry to describe.
   * @returns {string}
   */
  describeEntry(entry)
  {
    // an entry may carry one semantic or several; treat both the same way.
    const semantics = Array.isArray(entry.semantic)
      ? entry.semantic
      : [ entry.semantic ];

    // ask whoever owns the input mapping what each currently looks like, falling back to the
    // semantic's own name when nobody can say.
    const inputs = semantics.map(semantic => InputLegendResolver.resolve(semantic, semantic))
      .join(this.semanticSeparator());

    // pair the inputs with what they actually do.
    return `${inputs}: ${entry.label}`;
  }

  /**
   * The separator drawn between the inputs of a single entry.
   * @returns {string}
   */
  semanticSeparator()
  {
    return '/';
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

//region Window_JabsRemapUsageHelp
/**
 * Static usage/help panel for the JABS remap scene (right side).
 */
class Window_JabsRemapUsageHelp
  extends Window_Base
{
  /**
   * @param {Rectangle} rect The rectangle to draw this window within.
   */
  constructor(rect)
  {
    // perform super initialize.
    super(rect);

    // refresh immediately.
    this.refresh();
  }

  /**
   * Refreshes the static help text.
   */
  refresh()
  {
    // clear the contents.
    this.contents.clear();

    // build the ex-text with icons for each hint line.
    const rebind = `${this.iconTextForSymbol('ok')} Rebind`;
    const clear = `${this.iconTextForSymbol(J.ABS.Input.GuardTrigger)} Clear Binding`;
    const apply = `${this.iconTextForSymbol(J.ABS.Input.Quickmenu)} Apply`;
    const reset = `${this.iconTextForSymbol(J.ABS.Input.Tool)} Reset`;

    // draw each line using drawTextEx so icons render.
    this.drawTextEx(rebind, 0, this.lineHeight() * 0, this.contentsWidth());
    this.drawTextEx(clear, 0, this.lineHeight() * 1, this.contentsWidth());
    this.drawTextEx(apply, 0, this.lineHeight() * 2, this.contentsWidth());
    this.drawTextEx(reset, 0, this.lineHeight() * 3, this.contentsWidth());
  }

  /**
   * Converts a physical input symbol into icon ex-text for display.
   * Returns combined gamepad/keyboard icons when available.
   * @param {string} symbol The physical symbol.
   * @returns {string} The ex-text (may include one or more \I[...] tokens).
   */
  iconTextForSymbol(symbol)
  {
    // handle empty/unbound case.
    if (!symbol) return '(unbound)';

    // map common symbols to your established icon pairs.
    switch (symbol)
    {
      case 'ok':
        // Cross (pad) / Z (kb)
        return '\\I[2448] / \\I[2432]';
      case 'cancel':
        // Circle (pad) / X (kb)
        return '\\I[2449] / \\I[2433]';
      case 'shift':
        // Square (pad) / Shift (kb)
        return '\\I[2450] / \\I[2434]';
      case 'tab':
        // Triangle (pad) / C (kb)
        return '\\I[2451] / \\I[2435]';
      case 'pageup':
        // L1 (pad) / Q (kb)
        return '\\I[2452] / \\I[2436]';
      case 'l2':
        // L2 (pad) / Ctrl (kb)
        return '\\I[2454] / \\I[2437]';
      case 'pagedown':
        // R1 (pad) / E (kb)
        return '\\I[2453] / \\I[2438]';
      case 'r2':
        // R2 (pad) / Tab (kb)
        return '\\I[2455] / \\I[2439]';
      case 'start':
        // Options/Menu (pad) / Enter (kb)
        return '\\I[2456] / \\I[2440]';
      case 'select':
        // Select/Share (pad) / Del (kb)
        return '\\I[2457] / \\I[2441]';

      default:
        // fall back to raw text if unmapped.
        return String(symbol);
    }
  }
}

//endregion Window_JabsRemapUsageHelp
//region Window_JabsRemapPrompt
/**
 * Full-screen overlay that captures the next input symbol.
 */
class Window_JabsRemapPrompt
  extends Window_Base
{
  /**
   * @param {Rectangle} rect The rectangle to draw this window within.
   */
  constructor(rect)
  {
    // perform super initialize.
    super(rect);

    /**
     * The captured symbol awaiting pickup by the scene.
     * @type {string|null}
     */
    this._captured = null;

    /**
     * Whether or not the prompt is currently active.
     * @type {boolean}
     */
    this._activePrompt = false;

    /**
     * Debounce (in frames) to avoid immediately capturing the OK used to open the prompt.
     * @type {number}
     */
    this._warmupFrames = 0;

    /**
     * The remaining frames before this prompt auto-times out. (60 FPS assumed)
     * @type {number}
     */
    this._timeoutFrames = 0;

    /**
     * The label of the logical action currently being rebound.
     * @type {string}
     */
    this._buttonLabel = '';

    // make background darker for overlay effect.
    this.opacity = 192;

    // draw once empty.
    this.refresh();
  }

  /**
   * Begins the prompt for the given logical action.
   * @param {string} button The logical action being captured.
   */
  startPrompt(button)
  {
    // reset the captured symbol.
    this._captured = null;

    // set the active flag.
    this._activePrompt = true;

    // set a short warmup to avoid immediately capturing OK/Cancel.
    this._warmupFrames = 30; // ~0.16s at 60 FPS

    // set the timeout to 5 seconds (assuming 60 FPS).
    this._timeoutFrames = 5 * 60; // 300

    // store the label for redraws each frame.
    this._buttonLabel = button;

    // show the window.
    this.show();

    // draw prompt text.
    this.drawPrompt();
  }

  /**
   * Ends the capture prompt.
   */
  endPrompt()
  {
    // clear flags.
    this._activePrompt = false;

    // hide the window.
    this.hide();
  }

  /**
   * Draws the prompt text for the current button.
   */
  drawPrompt()
  {
    // clear then draw the prompt text centered.
    this.contents.clear();

    // compute center coordinates.
    const cx = 0;
    const cy = this.contentsHeight() / 2 - this.lineHeight();

    // draw title.
    this.drawText('Press a key or button…', cx, cy, this.contentsWidth(), 'center');

    // draw the logical button label.
    this.drawText(`for: ${this._buttonLabel}`, cx, cy + this.lineHeight(), this.contentsWidth(), 'center');

    // draw the countdown using inline math (60 FPS assumed).
    this.drawText(
      `Auto-cancels in ${(this._timeoutFrames / 60).toFixed(1)}s`,
      cx,
      cy + this.lineHeight() * 2,
      this.contentsWidth(),
      'center'
    );
  }

  /**
   * Per-frame update for capture.
   */
  /**
   * Per-frame update for capture.
   */
  update()
  {
    // perform super update.
    super.update();

    // if not active, do nothing.
    if (this._activePrompt === false) return;

    // scan for a triggered symbol using curated lists and warmup rules.
    const found = this._findTriggeredSymbol();

    // decrement warmup if active.
    this._decrementWarmup();

    // if we captured something, store it and end the prompt.
    if (found)
    {
      // set the captured symbol.
      this._captured = found;

      // end the prompt.
      this.endPrompt();
      return;
    }

    // tick timeout, redraw countdown, and auto-cancel if time elapsed.
    if (this._tickTimeoutAndRedraw())
    {
      // timed out; end the prompt without capturing.
      this._captured = null;
      this.endPrompt();
    }
  }

  /**
   * Determines whether or not the user cancelled the prompt this frame.
   * @returns {boolean}
   */
  _isCancelTriggered()
  {
    // return true if the cancel input was pressed.
    if (Input.isTriggered("cancel"))
    {
      return true;
    }

    // not cancelled.
    return false;
  }

  /**
   * Attempts to find a triggered symbol from curated sets, honoring warmup rules.
   * @returns {string|null}
   */
  _findTriggeredSymbol()
  {
    // define all symbols we want to scan for.
    const symbols = this._curatedSymbols();

    // define symbols we ignore during warmup to prevent instant-binding of UI controls.
    const uiSymbols = this._uiSymbols();

    // check the curated list first.
    for (let i = 0; i < symbols.length; i++)
    {
      // get the symbol at this index.
      const s = symbols[i];

      // if in warmup and this symbol is a UI symbol, skip it.
      if (this._warmupFrames > 0 && uiSymbols.includes(s))
      {
        // skip UI-like inputs during warmup.
        continue;
      }

      // if this symbol was triggered, capture it.
      if (Input.isTriggered(s))
      {
        // return the found symbol.
        return s;
      }
    }

    // fallback: if nothing triggered, consider latest button if available and allowed.
    const latest = Input._latestButton;
    if (latest)
    {
      // when in warmup, ignore UI symbols.
      const allowLatest = this._warmupFrames === 0 || uiSymbols.includes(latest) === false;
      if (allowLatest)
      {
        // return the latest captured symbol.
        return latest;
      }
    }

    // nothing was triggered.
    return null;
  }

  /**
   * Gets the curated list of symbols to poll each frame.
   * @returns {string[]}
   */
  _curatedSymbols()
  {
    // collect core input constants from your adapter.
    const k = J.ABS.Input;

    // build a base list using your constants first (preferred).
    const inputs = [
      // face/core actions
      k.Mainhand,
      k.Offhand,
      k.Dash,
      k.Tool,

      // modifier/shoulder/trigger style
      k.SkillTrigger,
      k.GuardTrigger,
      k.StrafeTrigger,
      k.MobilitySkill,

      // utility
      k.PartyCycle,
      k.Quickmenu,

      // d-pad
      k.DirUp,
      k.DirDown,
      k.DirLeft,
      k.DirRight,
    ];

    // add preferred constants.
    const curated = [];
    inputs.forEach(sym => curated.push(sym));

    // return the curated symbol list.
    return curated;
  }

  /**
   * Gets the set of UI/navigation symbols ignored during warmup.
   * @returns {string[]}
   */
  _uiSymbols()
  {
    // inputs commonly used to operate UI, not to bind immediately.
    return [ "ok", "cancel", "up", "down", "left", "right" ];
  }

  /**
   * Decrements the warmup countdown when active.
   */
  _decrementWarmup()
  {
    // reduce warmup frames if still active.
    if (this._warmupFrames > 0)
    {
      // decrement remaining warmup frames.
      this._warmupFrames--;
    }
  }

  /**
   * Decrements the timeout, redraws countdown text, and returns whether it expired.
   * @returns {boolean} True if timeout reached zero this frame; false otherwise.
   */
  _tickTimeoutAndRedraw()
  {
    // if there is no timeout active, nothing to tick.
    if (this._timeoutFrames <= 0)
    {
      return false;
    }

    // decrement remaining frames until timeout.
    this._timeoutFrames--;

    // redraw the prompt text with updated countdown.
    this.drawPrompt();

    // if the timeout reached zero, report expiry.
    if (this._timeoutFrames === 0)
    {
      return true;
    }

    // timeout still active.
    return false;
  }

  /**
   * Returns the captured symbol for one frame and clears it.
   * @returns {string|null}
   */
  pollCapturedSymbol()
  {
    // take the captured symbol into a temp.
    const out = this._captured;

    // clear the captured symbol.
    this._captured = null;

    // return the symbol.
    return out;
  }
}

//endregion Window_JabsRemapPrompt
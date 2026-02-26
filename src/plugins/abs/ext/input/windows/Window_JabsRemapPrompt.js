//region Window_JabsRemapPrompt
/**
 * Full-screen overlay that captures the next input symbol.
 */
class Window_JabsRemapPrompt
  extends Window_Base
{
  //region static
  /**
   * Frames to ignore immediate UI inputs after opening the prompt.
   * Adjusted for 60 FPS.
   * Can be migrated to plugin parameters later.
   * @type {number}
   */
  static WarmupFrames = 20; // ~0.33s

  /**
   * Maximum frames the prompt remains active before auto-closing.
   * Adjusted for 60 FPS.
   * Can be migrated to plugin parameters later.
   * @type {number}
   */
  static TimeoutFrames = 5 * 60; // 5s
  //endregion static

  /**
   * @param {Rectangle} rect The rectangle to draw this window within.
   */
  constructor(rect)
  {
    // perform super initialize.
    super(rect);

    // make background darker for overlay effect.
    this.opacity = 192;

    // initial draw.
    this.refresh();
  }

  //region init
  /**
   * Lazily ensures the root plugin namespace exists for this window's data.
   */
  _root()
  {
    // ensure root namespaces.
    this._j ||= {};
    this._j._abs ||= {};
    this._j._abs._input ||= {};
  }

  //endregion init

  //region accessors
  /**
   * Gets the captured symbol awaiting pickup by the scene.
   * @returns {string|null}
   */
  getCapturedSymbol()
  {
    this._root();
    return this._j._abs._input._remapCaptured ?? null;
  }

  /**
   * Sets the captured symbol awaiting pickup by the scene.
   * @param {string|null} v The captured symbol.
   */
  setCapturedSymbol(v)
  {
    this._root();
    this._j._abs._input._remapCaptured = v ?? null;
  }

  /**
   * Gets whether or not the prompt is currently active.
   * @returns {boolean}
   */
  isActive()
  {
    this._root();
    return this._j._abs._input._remapActive === true;
  }

  /**
   * Sets whether or not the prompt is currently active.
   * @param {boolean} v The new active state.
   */
  setActive(v)
  {
    this._root();
    this._j._abs._input._remapActive = v === true;
  }

  /**
   * Gets the remaining warmup frames.
   * @returns {number}
   */
  getWarmupFrames()
  {
    this._root();
    return this._j._abs._input._remapWarmup | 0;
  }

  /**
   * Sets the remaining warmup frames.
   * @param {number} v The frames to set.
   */
  setWarmupFrames(v)
  {
    this._root();
    this._j._abs._input._remapWarmup = Math.max(0, v | 0);
  }

  /**
   * Gets the remaining timeout frames.
   * @returns {number}
   */
  getTimeoutFrames()
  {
    this._root();
    return this._j._abs._input._remapTimeout | 0;
  }

  /**
   * Sets the remaining timeout frames.
   * @param {number} v The frames to set.
   */
  setTimeoutFrames(v)
  {
    this._root();
    this._j._abs._input._remapTimeout = Math.max(0, v | 0);
  }

  /**
   * Gets the logical action label being captured for.
   * @returns {string}
   */
  getButtonLabel()
  {
    this._root();
    return this._j._abs._input._remapButtonLabel || String.empty;
  }

  /**
   * Sets the logical action label being captured for.
   * @param {string} v The button label.
   */
  setButtonLabel(v)
  {
    this._root();
    this._j._abs._input._remapButtonLabel = String(v || '');
  }

  //endregion accessors

  //region lifecycle
  /**
   * Begins the prompt for the given logical action.
   * @param {string} button The logical action being captured.
   */
  startPrompt(button)
  {
    // reset the captured symbol.
    this.setCapturedSymbol(null);

    // set the active flag.
    this.setActive(true);

    // set a short warmup to avoid immediately capturing UI inputs.
    this.setWarmupFrames(Window_JabsRemapPrompt.WarmupFrames);

    // set the timeout duration.
    this.setTimeoutFrames(Window_JabsRemapPrompt.TimeoutFrames);

    // store the label for redraws each frame.
    this.setButtonLabel(button);

    // show the window.
    this.show();

    // draw prompt text.
    this.refresh();
  }

  /**
   * Ends the capture prompt.
   */
  endPrompt()
  {
    // clear the active flag.
    this.setActive(false);

    // hide the window.
    this.hide();
  }

  //endregion lifecycle

  //region update/capture
  /**
   * Per-frame update for capture.
   */
  update()
  {
    // perform original logic.
    super.update();

    // if not active, do nothing.
    if (this.isActive() === false)
    {
      return;
    }

    // attempt to find a triggered symbol using curated lists and warmup rules.
    const found = this._findTriggeredSymbol();

    // decrement warmup if active.
    this._decrementWarmup();

    // if we captured something, store it and end the prompt.
    if (found)
    {
      // set the captured symbol.
      this.setCapturedSymbol(found);

      // end the prompt.
      this.endPrompt();
      return;
    }

    // tick timeout, redraw countdown, and auto-cancel if time elapsed.
    if (this._tickTimeoutAndRedraw())
    {
      // timed out; end the prompt without capturing.
      this.setCapturedSymbol(null);
      this.endPrompt();
    }
  }

  /**
   * Attempts to find a triggered symbol from curated sets, honoring warmup.
   * Accepts only keyboard/gamepad symbols; mouse inputs are not considered.
   * @returns {string|null}
   */
  _findTriggeredSymbol()
  {
    // if in warmup, block all input to avoid accidental captures.
    if (this.getWarmupFrames() > 0)
    {
      return null;
    }

    // get curated symbols to poll.
    const symbols = this._curatedSymbols();

    // build a membership set for fast checks (also used for latest fallback).
    const allow = new Set(symbols);

    // check the curated list first (edge-triggered only).
    for (let i = 0; i < symbols.length; i++)
    {
      // get the symbol at this index.
      const s = symbols[i];

      // if this symbol was triggered, capture it.
      if (Input.isTriggered(s))
      {
        return s;
      }
    }

    // guarded fallback: allow latest only if it is curated AND edge-triggered.
    const latest = Input._latestButton;
    if (latest && allow.has(latest) && Input.isTriggered(latest))
    {
      return latest;
    }

    // nothing was captured this frame.
    return null;
  }

  /**
   * Gets the curated list of keyboard/gamepad symbols to poll each frame.
   * @returns {string[]}
   */
  _curatedSymbols()
  {
    // collect core input constants from the JABS input adapter constants.
    // These should reflect only keyboard/gamepad bindings.
    const k = J.ABS.EXT.INPUT.Symbols;

    // build the list using adapter constants.
    const inputs = [
      // face/core actions.
      k.Mainhand, k.Offhand, k.Dash, k.Tool,

      // modifier/shoulder/trigger style.
      k.SkillTrigger, k.GuardTrigger, k.StrafeTrigger, k.MobilitySkill,

      // utility.
      k.PartyCycle, k.Quickmenu,

      // controller d-pad inputs.
      k.DPadUp, k.DPadDown, k.DPadLeft, k.DPadRight,
    ];

    // merge in engine-wide capture symbols registered by other plugins.
    const extras = Input.getRemapCaptureSymbols();

    // return the curated symbol list.
    return inputs.concat(extras);
  }

  /**
   * Decrements the warmup countdown when active.
   */
  _decrementWarmup()
  {
    // reduce warmup frames if still active.
    if (this.getWarmupFrames() > 0)
    {
      this.setWarmupFrames(this.getWarmupFrames() - 1);
    }
  }

  /**
   * Decrements the timeout, redraws countdown text, and returns whether it expired.
   * @returns {boolean} True if timeout reached zero this frame; false otherwise.
   */
  _tickTimeoutAndRedraw()
  {
    // if there is no timeout active, nothing to tick.
    if (this.getTimeoutFrames() <= 0)
    {
      return false;
    }

    // decrement remaining frames until timeout.
    this.setTimeoutFrames(this.getTimeoutFrames() - 1);

    // redraw the prompt text with updated countdown.
    this.refresh();

    // if the timeout reached zero, report expiry.
    if (this.getTimeoutFrames() === 0)
    {
      return true;
    }

    // timeout still active.
    return false;
  }

  //endregion update/capture

  //region drawing
  /**
   * Redraws the prompt if active, otherwise clears contents.
   */
  refresh()
  {
    // clear then draw if active.
    this.contents.clear();

    // only draw the prompt when active.
    if (this.isActive())
    {
      this.drawPrompt();
    }
  }

  /**
   * Draws the prompt text for the current button.
   */
  drawPrompt()
  {
    // compute center coordinates.
    const cx = 0;
    const cy = Math.floor(this.contentsHeight() / 2) - this.lineHeight();

    // draw title.
    this.drawText('Press a key or button…', cx, cy, this.contentsWidth(), 'center');

    // draw the logical button label.
    this.drawText(`for: ${this.getButtonLabel()}`, cx, cy + this.lineHeight(), this.contentsWidth(), 'center');

    // draw the countdown using inline math (60 FPS assumed).
    this.drawText(
      `Auto-cancels in ${(this.getTimeoutFrames() / 60).toFixed(1)}s`,
      cx,
      cy + this.lineHeight() * 2,
      this.contentsWidth(),
      'center',
    );
  }

  //endregion drawing

  //region api
  /**
   * Returns the captured symbol for one frame and clears it.
   * @returns {string|null}
   */
  pollCapturedSymbol()
  {
    // take the captured symbol into a temp.
    const out = this.getCapturedSymbol();

    // clear the captured symbol.
    this.setCapturedSymbol(null);

    // return the symbol.
    return out;
  }

  //endregion api
}

//endregion Window_JabsRemapPrompt
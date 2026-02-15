//region Scene_JabsRemap
/**
 * The scene for remapping JABS inputs.
 * Owns layout, capture flow, and applying/saving mappings.
 */
class Scene_JabsRemap
  extends Scene_MenuBase
{
  /**
   * Initializes this scene.
   */
  initialize()
  {
    // perform super initialize.
    super.initialize();

    /**
     * The index of the controller being edited (aligned with adapter order).
     * Always 0 for single-controller UX.
     * @type {number}
     */
    this._controllerIndex = 0;

    /**
     * The list of controllers from the adapter (constrained to [0]).
     * @type {JABS_StandardController[]}
     */
    this._controllers = [];

    /**
     * The working copy of mappings per controller key.
     * @type {Object<string, Object<string, string[]>>}
     */
    this._pendingByKey = {};

    /**
     * The capture state flag.
     * @type {boolean}
     */
    this._isCapturing = false;

    /**
     * The logical action currently being captured.
     * @type {string|null}
     */
    this._capturingButton = null;
  }

  /**
   * Creates all display objects for this scene.
   */
  create()
  {
    // perform super create.
    super.create();

    // build the initial controller list and pending maps.
    this.buildControllerList();

    // create the top action help (conventional help window).
    this.createTopHelpWindow();

    // create the actions window (middle-left region).
    this.createActionsWindow();

    // create the right-side usage/help panel (middle-right region).
    this.createUsageHelpWindow();

    // create the bottom command window (bottom region).
    this.createCommandWindow();

    // create the capture overlay (fullscreen overlay, hidden by default).
    this.createPromptWindow();

    // refresh layout with the current controller.
    this.refreshAll();
  }

  /**
   * Builds the controller list from the adapter and snapshots as pending.
   */
  buildControllerList()
  {
    // get all controllers from the adapter.
    const all = JABS_InputAdapter.getAllControllers();

    // constrain to the first controller only for the current UX.
    this._controllers = all.length > 0
      ? [ all[0] ]
      : [];

    // build pending maps keyed to playerN using the resolver.
    for (let i = 0; i < this._controllers.length; i++)
    {
      // resolve the key for this index.
      const key = this.resolveControllerKey(i);

      // export the live mapping from the controller.
      const exportMap = this._controllers[i].exportAllInputs();

      // ensure arrays for each binding (normalization).
      const normalized = {};

      // iterate over each exported mapping key.
      Object.keys(exportMap)
        .forEach(k =>
        {
          // read the value for this key.
          const v = exportMap[k];

          // if the value is already an array, clone it.
          if (Array.isArray(v))
          {
            normalized[k] = v.slice(0);
          }
          // if a single value exists, wrap it in an array.
          else if (v)
          {
            normalized[k] = [ v ];
          }
          // otherwise, use an empty array for no binding.
          else
          {
            normalized[k] = [];
          }
        });

      // store the mapping as the initial pending state.
      this._pendingByKey[key] = normalized;
    }
  }

  /**
   * Resolves the stored-key for a controller index.
   * @param {number} index The adapter index for the controller.
   * @returns {string} The key in the form of player{n}.
   */
  resolveControllerKey(index)
  {
    // return the playerN key for this index.
    return `player${index + 1}`;
  }

  /**
   * Creates the top help window that describes the selected logical action.
   */
  createTopHelpWindow()
  {
    // define the rectangle for the top help window (conventional help band).
    const rect = this.topHelpWindowRect();

    // create the top help window.
    this._topHelpWindow = new Window_Help(rect);

    // add the window to the scene.
    this.addWindow(this._topHelpWindow);
  }

  /**
   * Creates the actions list window (middle).
   */
  createActionsWindow()
  {
    // define the rectangle for the actions window (middle-left band).
    const rect = this.actionsWindowRect();

    // create the actions window.
    this._actionsWindow = new Window_JabsRemapActions(rect);

    // bind handlers for interactions.
    this._actionsWindow.setHandler('ok', this.onRemapRequested.bind(this));
    this._actionsWindow.setHandler('clear', this.onClearBinding.bind(this));
    this._actionsWindow.setHandler('cancel', this.onActionsCancel.bind(this));

    // attach the top help so selection changes update descriptions.
    this._actionsWindow.setHelpWindow(this._topHelpWindow);

    // add the window to the scene.
    this.addWindow(this._actionsWindow);
  }

  /**
   * Creates the bottom command window (Apply/Reset/Cancel).
   */
  createCommandWindow()
  {
    // define the rectangle for the command window.
    const rect = this.commandWindowRect();

    // create the command window.
    this._commandWindow = new Window_JabsRemapCommand(rect);

    // set the handlers for command selections.
    this._commandWindow.setHandler('apply', this.onApply.bind(this));
    this._commandWindow.setHandler('defaults', this.onDefaults.bind(this));
    this._commandWindow.setHandler('reset', this.onReset.bind(this));
    this._commandWindow.setHandler('cancel', this.popScene.bind(this));

    // add the window to the scene.
    this.addWindow(this._commandWindow);

    // keep actions as the primary interaction by default.
    this._commandWindow.deselect();
    this._commandWindow.deactivate();
  }

  /**
   * Creates the capture prompt overlay window.
   */
  createPromptWindow()
  {
    // create the prompt window covering the full screen.
    const rect = new Rectangle(0, 0, Graphics.boxWidth, Graphics.boxHeight);

    // instantiate the prompt.
    this._promptWindow = new Window_JabsRemapPrompt(rect);

    // start hidden by default.
    this._promptWindow.hide();

    // add the window to the scene.
    this.addWindow(this._promptWindow);
  }

  /**
   * Creates the right-side usage/help panel that lists scene controls.
   */
  createUsageHelpWindow()
  {
    // define the rectangle for the right-side usage/help window.
    const rect = this.usageHelpWindowRect();

    // create the usage help window.
    this._usageHelpWindow = new Window_JabsRemapUsageHelp(rect);

    // add the window to the scene.
    this.addWindow(this._usageHelpWindow);
  }

  /**
   * Calculates the rectangle for the top help window (conventional band).
   * @returns {Rectangle}
   */
  topHelpWindowRect()
  {
    // determine the height for the top help window (single row).
    const wh = this.calcWindowHeight(1.8, true);

    // compute the total width for the centered middle group.
    const ww = Math.floor(Graphics.boxWidth * 0.60);

    // compute the starting x so the band is centered on-screen.
    const wx = Math.floor((Graphics.boxWidth - ww) / 2);

    // position the window at the top of the screen.
    const wy = 0;

    // return the rectangle describing the top help window.
    return new Rectangle(wx, wy, ww, wh);
  }

  /**
   * Calculates the rectangle for the bottom command window.
   * @returns {Rectangle}
   */
  commandWindowRect()
  {
    // determine the height for the command window (bottom strip).
    const wh = this.calcWindowHeight(4, true);

    // determine the width as 75% of the screen.
    const ww = Math.floor(Graphics.boxWidth * 0.25);

    // center the window horizontally.
    const wx = Math.floor((Graphics.boxWidth - ww) / 2);

    // position the window at the bottom of the screen.
    const wy = Graphics.boxHeight - wh;

    // return the rectangle describing the command window.
    return new Rectangle(wx, wy, ww, wh);
  }

  /**
   * Calculates the rectangle for the actions window (middle region).
   * @returns {Rectangle}
   */
  actionsWindowRect()
  {
    // compute heights of top and bottom bands.
    const topH = this.topHelpWindowRect().height;
    const cmdH = this.commandWindowRect().height;

    // determine the height for the actions window (middle-left band).
    const wy = topH;
    const wh = Graphics.boxHeight - topH - cmdH;

    // compute the total width for the centered middle group (actions + usage help).
    const groupW = Math.floor(Graphics.boxWidth * 0.60);

    // compute the starting x so the group is centered on-screen.
    const groupX = Math.floor((Graphics.boxWidth - groupW) / 2);

    // compute the actions window width as 70% of the group.
    const actionsW = Math.floor(groupW * 0.70);

    // place the actions window at the left of the centered group.
    const wx = groupX;

    // return the rectangle describing the actions window.
    return new Rectangle(wx, wy, actionsW, wh);
  }

  /**
   * Calculates the rectangle for the right-side usage/help window.
   * @returns {Rectangle}
   */
  usageHelpWindowRect()
  {
    // compute heights of top and bottom bands.
    const topH = this.topHelpWindowRect().height;
    const cmdH = this.commandWindowRect().height;

    // determine the height for the usage/help window (middle-right band).
    const wy = topH;
    const wh = Graphics.boxHeight - topH - cmdH;

    // compute the total width for the centered middle group (actions + usage help).
    const groupW = Math.floor(Graphics.boxWidth * 0.60);

    // compute the starting x so the group is centered on-screen.
    const groupX = Math.floor((Graphics.boxWidth - groupW) / 2);

    // compute the actions window width as 70% of the group.
    const actionsW = Math.floor(groupW * 0.70);

    // compute the usage/help window width as the remaining 30% of the group.
    const usageW = groupW - actionsW;

    // place the usage/help window immediately to the right of the actions window.
    const wx = groupX + actionsW;

    // return the rectangle describing the usage/help window.
    return new Rectangle(wx, wy, usageW, wh);
  }

  /**
   * Refreshes all windows for the current controller.
   */
  refreshAll()
  {
    // get the pending mapping for the current controller.
    const mapping = this.currentPendingMapping();

    // set the actions mapping and ensure it is the active focus.
    this._actionsWindow.setMapping(mapping);
    this._actionsWindow.activate();

    // ensure the bottom command strip is not active by default.
    this._commandWindow.deactivate();
  }

  /**
   * Gets the pending mapping object for the current controller.
   * @returns {Object<string, string[]>}
   */
  currentPendingMapping()
  {
    // resolve the key for this controller index.
    const key = this.resolveControllerKey(this._controllerIndex);

    // return the mapping for this key.
    return this._pendingByKey[key];
  }

  /**
   * Ensures at most one logical action holds a given symbol across the mapping.
   * Last occurrence wins in iteration order.
   * @param {Object<string, string[]>} mapping The mapping to sanitize.
   */
  sanitizeMappingUnique(mapping)
  {
    // track the first owner of each symbol while scanning.
    const ownerBySymbol = {};

    // first pass: record the first time we see a symbol and clear dups on the fly.
    Object.keys(mapping)
      .forEach(button =>
      {
        // get the list for this button (we treat only the first binding in UI).
        const list = mapping[button] || [];

        // if empty, continue.
        if (list.length === 0) return;

        // read the primary symbol.
        const [ symbol ] = list;

        // if we’ve not seen it, mark ownership and continue.
        if (!ownerBySymbol[symbol])
        {
          ownerBySymbol[symbol] = button;
          return;
        }

        // otherwise another action already owns it; unbind here.
        mapping[button] = [];
      });
  }

  /**
   * Handler when Apply is chosen.
   */
  onApply()
  {
    // iterate all controllers to apply their pending mappings.
    for (let i = 0; i < this._controllers.length; i++)
    {
      // get controller and key.
      const controller = this._controllers[i];
      const key = this.resolveControllerKey(i);

      // get the pending mapping for this controller.
      const mapping = this._pendingByKey[key];

      // enforce uniqueness as a final pass before applying.
      this.sanitizeMappingUnique(mapping);

      // set the live mapping on the controller.
      controller.setAllInputs(mapping);

      // persist the mapping into the system for saves.
      $gameSystem.setJabsInputConfig(key, mapping);
    }

    // exit the scene after applying.
    SceneManager.pop();
  }

  /**
   * Replaces the pending map with the controller’s defaults (preview),
   * without applying to the live controller or saving.
   */
  onDefaults()
  {
    // get the working controller index and key.
    const idx = this._controllerIndex;
    const key = this.resolveControllerKey(idx);

    // get the controller being edited.
    const controller = this._controllers[idx];

    // build a fresh default mapping.
    const defaults = controller.buildDefaultMapping();

    // replace the pending mapping with defaults.
    this._pendingByKey[key] = defaults;

    // refresh the actions to reflect defaults.
    this._actionsWindow.setMapping(this._pendingByKey[key]);

    // flip back to the remap window.
    this.onActionsCancel();
    this._commandWindow.deactivate();
    this._actionsWindow.activate();
  }

  /**
   * Handler when Reset is chosen.
   */
  onReset()
  {
    // rebuild pending based on current live controller mappings.
    this.buildControllerList();

    // refresh everything.
    this.refreshAll();
  }

  /**
   * Handler when the action list cancels.
   * Switch focus to the bottom command strip.
   */
  onActionsCancel()
  {
    // deactivate the actions window.
    this._actionsWindow.deactivate();

    // select the first command and activate the command window.
    this._commandWindow.select(0);
    this._commandWindow.activate();
  }

  /**
   * Begins a capture for the currently selected logical action.
   */
  onRemapRequested()
  {
    // get the logical action being edited.
    const button = this._actionsWindow.currentButton();

    // begin capture for this logical action.
    this.beginCapture(button);
  }

  /**
   * Clears the binding for the selected logical action.
   */
  onClearBinding()
  {
    // get the logical action.
    const button = this._actionsWindow.currentButton();

    // get the pending map and clear this button.
    const pending = this.currentPendingMapping();
    pending[button] = [];

    // refresh the actions to reflect the change.
    this._actionsWindow.setMapping(pending);
  }

  /**
   * Begins the capture overlay for a logical action.
   * @param {string} button The logical action to capture for.
   */
  beginCapture(button)
  {
    // record which logical action we are capturing for.
    this._capturingButton = button;

    // set the capture flag.
    this._isCapturing = true;

    // show the capture prompt overlay.
    this._promptWindow.startPrompt(button);

    // deactivate normal windows while capturing.
    this._commandWindow.deactivate();
    this._actionsWindow.deactivate();
  }

  /**
   * Ends the capture overlay.
   */
  endCapture()
  {
    // clear the capture flag and button.
    this._isCapturing = false;
    this._capturingButton = null;

    // hide the capture prompt overlay.
    this._promptWindow.endPrompt();

    // reactivate actions window.
    this._actionsWindow.activate();
  }

  /**
   * Removes a symbol from all actions in the provided mapping, except for one.
   * @param {Object<string, string[]>} mapping The mapping to sanitize.
   * @param {string} symbol The physical input symbol to remove.
   * @param {string} exceptButton The logical action to exclude from removal.
   */
  unbindSymbolFromMapping(mapping, symbol, exceptButton)
  {
    // iterate all logical actions in the mapping.
    Object.keys(mapping)
      .forEach(key =>
      {
        // skip the action that is intended to receive this symbol.
        if (key === exceptButton) return;

        // read the current list for this action.
        const list = mapping[key] || [];

        // if there is nothing to remove, continue.
        if (!list.length) return;

        // filter out the symbol.
        const filtered = list.filter(s => s !== symbol);

        // if changed, write back the filtered list.
        if (filtered.length !== list.length)
        {
          mapping[key] = filtered;
        }
      });
  }

  /**
   * Assigns a symbol to the given logical action while enforcing uniqueness.
   * If the symbol exists on any other action, it will be unbound there first.
   * @param {string} button The logical action receiving the new binding.
   * @param {string} symbol The physical input symbol to assign.
   */
  assignWithConflictResolution(button, symbol)
  {
    // get the pending mapping for this controller.
    const pending = this.currentPendingMapping();

    // unbind this symbol from any other actions in this mapping.
    this.unbindSymbolFromMapping(pending, symbol, button);

    // write the symbol as a single-binding array for the target action.
    pending[button] = [ symbol ];
  }

  /**
   * Standard per-frame update.
   */
  update()
  {
    // perform super update.
    super.update();

    // if we are not capturing, do nothing.
    if (this._isCapturing === false) return;

    // attempt to read a captured symbol from the prompt overlay.
    const captured = this._promptWindow.pollCapturedSymbol();

    // if nothing has been captured yet, continue waiting.
    if (!captured) return;

    // resolve and assign with conflict handling.
    this.assignWithConflictResolution(this._capturingButton, captured);

    // reflect the updated mapping in the actions window.
    this._actionsWindow.setMapping(this.currentPendingMapping());

    // end the capture flow.
    this.endCapture();
  }
}

//endregion Scene_JabsRemap
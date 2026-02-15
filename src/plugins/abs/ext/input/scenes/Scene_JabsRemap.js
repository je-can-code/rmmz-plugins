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

    // create the help window first (top region).
    this.createHelpWindow();

    // create the actions window (middle region).
    this.createActionsWindow();

    // create the command window (bottom region).
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
   * Creates the help window (top).
   */
  createHelpWindow()
  {
    // define the rectangle for the help window (top, 3 lines).
    const rect = this.helpWindowRect();

    // create the help window.
    this._helpWindow = new Window_JabsRemapHelp(rect);

    // add the window to the scene.
    this.addWindow(this._helpWindow);
  }

  /**
   * Creates the actions list window (middle).
   */
  createActionsWindow()
  {
    // define the rectangle for the actions window.
    const rect = this.actionsWindowRect();

    // create the actions window.
    this._actionsWindow = new Window_JabsRemapActions(rect);

    // wire handlers.
    this._actionsWindow.setHandler('ok', this.onRemapRequested.bind(this));
    this._actionsWindow.setHandler('clear', this.onClearBinding.bind(this));
    this._actionsWindow.setHandler('cancel', this.onActionsCancel.bind(this));

    // connect help.
    this._actionsWindow.setHelpWindow(this._helpWindow);

    // add to scene.
    this.addWindow(this._actionsWindow);
  }

  /**
   * Creates the bottom command window (Apply/Reset/Cancel).
   */
  createCommandWindow()
  {
    // define the rectangle for the command window (bottom strip).
    const rect = this.commandWindowRect();

    // create the command window.
    this._commandWindow = new Window_JabsRemapCommand(rect);

    // set the handlers for command selections.
    this._commandWindow.setHandler("apply", this.onApply.bind(this));
    this._commandWindow.setHandler("defaults", this.onDefaults.bind(this));
    this._commandWindow.setHandler("reset", this.onReset.bind(this));
    this._commandWindow.setHandler("cancel", this.popScene.bind(this));

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
   * Calculates the rectangle for the help window (top).
   * @returns {Rectangle}
   */
  helpWindowRect()
  {
    // determine width and height for the help window (3 lines).
    const ww = Math.floor(Graphics.boxWidth * 0.50);
    const wh = this.calcWindowHeight(2.7, false);
    const wx = Math.floor((Graphics.boxWidth - ww) / 2);
    const wy = 0;

    // return the rectangle describing the help window.
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
    const helpH = this.helpWindowRect().height;
    const cmdH = this.commandWindowRect().height;

    // determine the height for the actions window (middle band).
    const wy = helpH;
    const wh = Graphics.boxHeight - helpH - cmdH;

    // determine the width as 50% of the screen.
    const ww = Math.floor(Graphics.boxWidth * 0.5);

    // center the window horizontally.
    const wx = Math.floor((Graphics.boxWidth - ww) / 2);

    // return the rectangle describing the actions window.
    return new Rectangle(wx, wy, ww, wh);
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
   * Handler when Apply is chosen.
   */
  onApply()
  {
    // iterate all controllers to apply their pending mappings (single controller today).
    for (let i = 0; i < this._controllers.length; i++)
    {
      // get controller and key.
      const controller = this._controllers[i];
      const key = this.resolveControllerKey(i);

      // get the pending mapping for this controller.
      const mapping = this._pendingByKey[key];

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

    // write the captured symbol as a single-binding array for the selected button.
    const pending = this.currentPendingMapping();
    pending[this._capturingButton] = [ captured ];

    // reflect the updated mapping in the actions window.
    this._actionsWindow.setMapping(pending);

    // end the capture flow.
    this.endCapture();
  }
}

//endregion Scene_JabsRemap
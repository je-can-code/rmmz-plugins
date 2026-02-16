//region Scene_JabsRemap
/**
 * The scene for remapping JABS inputs.
 * Owns layout, capture flow, and applying/saving mappings.
 */
class Scene_JabsRemap
  extends Scene_MenuBase
{
  /**
   * Constructor.
   */
  constructor()
  {
    // call super when having extended constructors.
    super();

    // jumpstart initialization on creation.
    this.initialize();
  }

  /**
   * Pushes this current scene onto the stack, forcing it into action.
   */
  static callScene()
  {
    SceneManager.push(this);
  }

  //region init
  /**
   * Initializes this scene and members.
   */
  initialize()
  {
    // perform original logic.
    super.initialize();

    // also initialize our scene properties.
    this.initMembers();
  }

  /**
   * Initialize all properties required by the scene.
   */
  initMembers()
  {
    // initialize the root-namespace definition members.
    this.initCoreMembers();

    // initialize the primary members for the remap scene.
    this.initPrimaryMembers();
  }

  /**
   * Initializes the shared root namespace for this plugin branch.
   */
  initCoreMembers()
  {
    /**
     * The shared root namespace for all of J's plugin data.
     */
    this._j ||= {};

    /**
     * A grouping of all properties associated with JABS.
     */
    this._j._abs ||= {};

    /**
     * A grouping of all properties associated with JABS input.
     */
    this._j._abs._input ||= {};
  }

  /**
   * Initializes windows and state tracking for the remap scene.
   */
  initPrimaryMembers()
  {
    /**
     * The collection of windows owned by this scene.
     */
    this._j._abs._input._windows = {
      _topHelp: null,
      _actions: null,
      _usageHelp: null,
      _command: null,
      _prompt: null,
    };

    /**
     * The state data for this scene.
     */
    this._j._abs._input._state = {
      _controllerIndex: 0,
      _controllers: [],
      _pendingByKey: {},
      _isCapturing: false,
      _capturingButton: null,
    };
  }

  //endregion init

  //region create
  /**
   * Creates all display objects for this scene.
   */
  create()
  {
    // perform original logic.
    super.create();

    // build the initial controller list and pending maps.
    this.buildControllerList();

    // create the various display objects on the screen.
    this.createDisplayObjects();

    // refresh layout with the current controller.
    this.refreshAll();
  }

  /**
   * Creates the display objects for this scene.
   */
  createDisplayObjects()
  {
    // create all our windows.
    this.createAllWindows();
  }

  /**
   * Creates all remap-related windows.
   */
  createAllWindows()
  {
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
  }

  //endregion create

  //region windows
  //region top help window
  /**
   * Creates the top help window that describes the selected logical action.
   */
  createTopHelpWindow()
  {
    // create the window.
    const window = this.buildTopHelpWindow();

    // update the tracker with the new window.
    this.setTopHelpWindow(window);

    // add the window to the scene manager's tracking.
    this.addWindow(window);
  }

  /**
   * Sets up and defines the top help window.
   * @returns {Window_Help}
   */
  buildTopHelpWindow()
  {
    // define the rectangle of the window.
    const rectangle = this.topHelpWindowRectangle();

    // create the window with the rectangle.
    const window = new Window_Help(rectangle);

    // return the built and configured help window.
    return window;
  }

  /**
   * Gets the rectangle associated with the top help window.
   * @returns {Rectangle}
   */
  topHelpWindowRectangle()
  {
    // determine the height for the top help window (single row).
    const wh = this.calcWindowHeight(1.8, true);

    // compute the total width for the centered middle group.
    const ww = Math.floor(Graphics.boxWidth * 0.60);

    // compute the starting x so the band is centered on-screen.
    const wx = Math.floor((Graphics.boxWidth - ww) / 2);

    // position the window at the top of the screen.
    const wy = 0;

    // build the rectangle to return.
    return new Rectangle(wx, wy, ww, wh);
  }

  /**
   * Gets the currently tracked top help window.
   * @returns {Window_Help}
   */
  getTopHelpWindow()
  {
    return this._j._abs._input._windows._topHelp;
  }

  /**
   * Set the currently tracked top help window to the given window.
   * @param {Window_Help} helpWindow The help window to track.
   */
  setTopHelpWindow(helpWindow)
  {
    this._j._abs._input._windows._topHelp = helpWindow;
  }

  //endregion top help window

  //region actions window
  /**
   * Creates the actions list window (middle-left region).
   */
  createActionsWindow()
  {
    // create the window.
    const window = this.buildActionsWindow();

    // update the tracker with the new window.
    this.setActionsWindow(window);

    // add the window to the scene manager's tracking.
    this.addWindow(window);
  }

  /**
   * Sets up and defines the actions window.
   * @returns {Window_JabsRemapActions}
   */
  buildActionsWindow()
  {
    // define the rectangle of the window.
    const rectangle = this.actionsWindowRectangle();

    // create the window with the rectangle.
    const window = new Window_JabsRemapActions(rectangle);

    // bind handlers for interactions.
    window.setHandler('ok', this.onRemapRequested.bind(this));
    window.setHandler('clear', this.onClearBinding.bind(this));
    window.setHandler('cancel', this.onActionsCancel.bind(this));

    // attach the top help so selection changes update descriptions.
    window.setHelpWindow(this.getTopHelpWindow());

    // return the built and configured actions window.
    return window;
  }

  /**
   * Gets the rectangle associated with the actions window (middle-left region).
   * @returns {Rectangle}
   */
  actionsWindowRectangle()
  {
    // compute heights of top and bottom bands.
    const topH = this.topHelpWindowRectangle().height;
    const cmdH = this.commandWindowRectangle().height;

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

    // build the rectangle to return.
    return new Rectangle(wx, wy, actionsW, wh);
  }

  /**
   * Gets the currently tracked actions window.
   * @returns {Window_JabsRemapActions}
   */
  getActionsWindow()
  {
    return this._j._abs._input._windows._actions;
  }

  /**
   * Set the currently tracked actions window to the given window.
   * @param {Window_JabsRemapActions} actionsWindow The actions window to track.
   */
  setActionsWindow(actionsWindow)
  {
    this._j._abs._input._windows._actions = actionsWindow;
  }

  //endregion actions window

  //region usage help window
  /**
   * Creates the right-side usage/help panel that lists scene controls.
   */
  createUsageHelpWindow()
  {
    // create the window.
    const window = this.buildUsageHelpWindow();

    // update the tracker with the new window.
    this.setUsageHelpWindow(window);

    // add the window to the scene manager's tracking.
    this.addWindow(window);
  }

  /**
   * Sets up and defines the usage/help window.
   * @returns {Window_JabsRemapUsageHelp}
   */
  buildUsageHelpWindow()
  {
    // define the rectangle of the window.
    const rectangle = this.usageHelpWindowRectangle();

    // create the window with the rectangle.
    const window = new Window_JabsRemapUsageHelp(rectangle);

    // return the built and configured usage/help window.
    return window;
  }

  /**
   * Gets the rectangle associated with the right-side usage/help window.
   * @returns {Rectangle}
   */
  usageHelpWindowRectangle()
  {
    // compute heights of top and bottom bands.
    const topH = this.topHelpWindowRectangle().height;
    const cmdH = this.commandWindowRectangle().height;

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

    // build the rectangle to return.
    return new Rectangle(wx, wy, usageW, wh);
  }

  /**
   * Gets the currently tracked usage/help window.
   * @returns {Window_JabsRemapUsageHelp}
   */
  getUsageHelpWindow()
  {
    return this._j._abs._input._windows._usageHelp;
  }

  /**
   * Set the currently tracked usage/help window to the given window.
   * @param {Window_JabsRemapUsageHelp} helpWindow The usage/help window to track.
   */
  setUsageHelpWindow(helpWindow)
  {
    this._j._abs._input._windows._usageHelp = helpWindow;
  }

  //endregion usage help window

  //region command window
  /**
   * Creates the bottom command window (Apply/Reset/Cancel).
   */
  createCommandWindow()
  {
    // create the window.
    const window = this.buildCommandWindow();

    // update the tracker with the new window.
    this.setCommandWindow(window);

    // add the window to the scene manager's tracking.
    this.addWindow(window);

    // keep actions as the primary interaction by default.
    window.deselect();
    window.deactivate();
  }

  /**
   * Sets up and defines the command window.
   * @returns {Window_JabsRemapCommand}
   */
  buildCommandWindow()
  {
    // define the rectangle of the window.
    const rectangle = this.commandWindowRectangle();

    // create the window with the rectangle.
    const window = new Window_JabsRemapCommand(rectangle);

    // set the handlers for command selections.
    window.setHandler('apply', this.onApply.bind(this));
    window.setHandler('defaults', this.onDefaults.bind(this));
    window.setHandler('reset', this.onReset.bind(this));
    window.setHandler('cancel', this.popScene.bind(this));

    // return the built and configured command window.
    return window;
  }

  /**
   * Gets the rectangle associated with the command window.
   * @returns {Rectangle}
   */
  commandWindowRectangle()
  {
    // determine the height for the command window (bottom strip).
    const wh = this.calcWindowHeight(4, true);

    // determine the width as 75% of the screen.
    const ww = Math.floor(Graphics.boxWidth * 0.25);

    // center the window horizontally.
    const wx = Math.floor((Graphics.boxWidth - ww) / 2);

    // position the window at the bottom of the screen.
    const wy = Graphics.boxHeight - wh;

    // build the rectangle to return.
    return new Rectangle(wx, wy, ww, wh);
  }

  /**
   * Gets the currently tracked command window.
   * @returns {Window_JabsRemapCommand}
   */
  getCommandWindow()
  {
    return this._j._abs._input._windows._command;
  }

  /**
   * Set the currently tracked command window to the given window.
   * @param {Window_JabsRemapCommand} commandWindow The command window to track.
   */
  setCommandWindow(commandWindow)
  {
    this._j._abs._input._windows._command = commandWindow;
  }

  //endregion command window

  //region prompt window
  /**
   * Creates the capture prompt overlay window.
   */
  createPromptWindow()
  {
    // create the window.
    const window = this.buildPromptWindow();

    // update the tracker with the new window.
    this.setPromptWindow(window);

    // add the window to the scene manager's tracking.
    this.addWindow(window);
  }

  /**
   * Sets up and defines the prompt overlay window.
   * @returns {Window_JabsRemapPrompt}
   */
  buildPromptWindow()
  {
    // define the rectangle of the window.
    const rectangle = this.promptWindowRectangle();

    // instantiate the prompt.
    const window = new Window_JabsRemapPrompt(rectangle);

    // start hidden by default.
    window.hide();

    // return the built and configured prompt window.
    return window;
  }

  /**
   * Gets the rectangle associated with the prompt overlay window.
   * @returns {Rectangle}
   */
  promptWindowRectangle()
  {
    // define a fullscreen rectangle.
    return new Rectangle(0, 0, Graphics.boxWidth, Graphics.boxHeight);
  }

  /**
   * Gets the currently tracked prompt overlay window.
   * @returns {Window_JabsRemapPrompt}
   */
  getPromptWindow()
  {
    return this._j._abs._input._windows._prompt;
  }

  /**
   * Set the currently tracked prompt overlay window to the given window.
   * @param {Window_JabsRemapPrompt} promptWindow The prompt window to track.
   */
  setPromptWindow(promptWindow)
  {
    this._j._abs._input._windows._prompt = promptWindow;
  }

  //endregion prompt window
  //endregion windows

  //region actions
  /**
   * Builds the controller list from the adapter and snapshots as pending.
   */
  buildControllerList()
  {
    // get all controllers from the adapter.
    const all = JABS_InputAdapter.getAllControllers();

    // constrain to the first controller only for the current UX.
    const controllers = all.length > 0
      ? [ all[0] ]
      : [];
    this.setControllers(controllers);

    // build pending maps keyed to playerN using the resolver.
    for (let i = 0; i < controllers.length; i++)
    {
      // resolve the key for this index.
      const key = this.resolveControllerKey(i);

      // export the live mapping from the controller.
      const exportMap = controllers[i].exportAllInputs();

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
      this._state()._pendingByKey[key] = normalized;
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
   * Refreshes all windows for the current controller.
   */
  refreshAll()
  {
    // get the pending mapping for the current controller.
    const mapping = this.currentPendingMapping();

    // set the actions mapping and ensure it is the active focus.
    this.getActionsWindow()
      .setMapping(mapping);
    this.getActionsWindow()
      .activate();

    // ensure the bottom command strip is not active by default.
    this.getCommandWindow()
      .deactivate();
  }

  /**
   * Gets the pending mapping object for the current controller.
   * @returns {Object<string, string[]>}
   */
  currentPendingMapping()
  {
    // resolve the key for this controller index.
    const key = this.resolveControllerKey(this._state()._controllerIndex);

    // return the mapping for this key.
    return this._state()._pendingByKey[key];
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
    const controllers = this._state()._controllers;
    for (let i = 0; i < controllers.length; i++)
    {
      // get controller and key.
      const controller = controllers[i];
      const key = this.resolveControllerKey(i);

      // get the pending mapping for this controller.
      const mapping = this._state()._pendingByKey[key];

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
    const idx = this._state()._controllerIndex;
    const key = this.resolveControllerKey(idx);

    // get the controller being edited.
    const controller = this._state()._controllers[idx];

    // build a fresh default mapping.
    const defaults = controller.buildDefaultMapping();

    // replace the pending mapping with defaults.
    this._state()._pendingByKey[key] = defaults;

    // refresh the actions to reflect defaults.
    this.getActionsWindow()
      .setMapping(this._state()._pendingByKey[key]);

    // flip back to the remap window.
    this.onActionsCancel();
    this.getCommandWindow()
      .deactivate();
    this.getActionsWindow()
      .activate();
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
    this.getActionsWindow()
      .deactivate();

    // select the first command and activate the command window.
    this.getCommandWindow()
      .select(0);
    this.getCommandWindow()
      .activate();
  }

  /**
   * Begins a capture for the currently selected logical action.
   */
  onRemapRequested()
  {
    // read the current command row.
    const cmd = this.getActionsWindow()
      .currentData();

    // external row: start capture with a stable token and friendly label.
    if (cmd && cmd.ext && cmd.ext.kind === 'ext-action')
    {
      // store a token we will parse on apply: __ext__<ns>:<key>
      const token = `__ext__${cmd.ext.ns}:${cmd.ext.key}`;

      // begin capture with friendly label.
      this._state()._capturingButton = token;
      this._state()._isCapturing = true;
      this.getPromptWindow()
        .startPrompt(String(cmd.ext.label || ''));

      // deactivate normal windows while capturing.
      this.getCommandWindow()
        .deactivate();
      this.getActionsWindow()
        .deactivate();
      return;
    }

    // JABS logical action path (original behavior).
    const button = this.getActionsWindow()
      .currentButton();
    this.beginCapture(button);
  }

  /**
   * Clears the binding for the selected logical action.
   */
  onClearBinding()
  {
    // read the current command row.
    const cmd = this.getActionsWindow()
      .currentData();

    // if external, clear via Input registry and refresh the list.
    if (cmd && cmd.ext && cmd.ext.kind === 'ext-action')
    {
      Input.setBindings(cmd.ext.ns, cmd.ext.key, []);
      this.getActionsWindow()
        .refresh();
      return;
    }

    // JABS logical action path (original behavior).
    const button = this.getActionsWindow()
      .currentButton();
    const pending = this.currentPendingMapping();
    pending[button] = [];
    this.getActionsWindow()
      .setMapping(pending);
  }

  /**
   * Begins the capture overlay for a logical action.
   * @param {string} button The logical action to capture for.
   */
  beginCapture(button)
  {
    // record which logical action we are capturing for.
    this._state()._capturingButton = button;

    // set the capture flag.
    this._state()._isCapturing = true;

    // show the capture prompt overlay.
    this.getPromptWindow()
      .startPrompt(button);

    // deactivate normal windows while capturing.
    this.getCommandWindow()
      .deactivate();
    this.getActionsWindow()
      .deactivate();
  }

  /**
   * Ends the capture overlay.
   */
  endCapture()
  {
    // clear the capture flag and button.
    this._state()._isCapturing = false;
    this._state()._capturingButton = null;

    // hide the capture prompt overlay.
    this.getPromptWindow()
      .endPrompt();

    // reactivate actions window.
    this.getActionsWindow()
      .activate();
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
   * If external, writes directly to Input registry.
   * @param {string} button The logical action receiving the new binding, or an external token.
   * @param {string} symbol The physical input symbol to assign.
   */
  assignWithConflictResolution(button, symbol)
  {
    // external capture token: __ext__<ns>:<key>
    if (typeof button === 'string' && button.indexOf('__ext__') === 0)
    {
      const without = button.substring('__ext__'.length);
      const splitAt = without.indexOf(':');
      if (splitAt > 0)
      {
        const ns = without.substring(0, splitAt);
        const key = without.substring(splitAt + 1);
        Input.setBindings(ns, key, [ symbol ]);
        this.getActionsWindow()
          .refresh();
        return;
      }
    }

    // otherwise, original JABS behavior for the pending map.
    const pending = this.currentPendingMapping();
    this.unbindSymbolFromMapping(pending, symbol, button);
    pending[button] = [ symbol ];
  }

  //endregion actions

  //region update
  /**
   * Standard per-frame update.
   */
  update()
  {
    // perform original logic.
    super.update();

    // if we are not capturing, do nothing.
    if (this._state()._isCapturing === false)
    {
      return;
    }

    // attempt to read a captured symbol from the prompt overlay.
    const captured = this.getPromptWindow()
      .pollCapturedSymbol();

    // if nothing has been captured yet, continue waiting.
    if (!captured)
    {
      return;
    }

    // resolve and assign with conflict handling.
    this.assignWithConflictResolution(this._state()._capturingButton, captured);

    // reflect the updated mapping in the actions window.
    this.getActionsWindow()
      .setMapping(this.currentPendingMapping());

    // end the capture flow.
    this.endCapture();
  }

  //endregion update

  //region helpers
  /**
   * Convenience accessor for the scene state object.
   */
  _state()
  {
    return this._j._abs._input._state;
  }

  /**
   * Sets the controller collection being edited.
   * @param {Object[]} controllers The list of controllers.
   */
  setControllers(controllers)
  {
    this._state()._controllers = controllers;
  }

  //endregion helpers
}

//endregion Scene_JabsRemap
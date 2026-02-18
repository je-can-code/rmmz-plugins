//region JABS_InputController
/**
 * The class that handles input in the context of JABS for a player.
 * A battler must be set in order for this to update.
 * It is important to note that rotate and guard are arbitrarily coupled together by this controller.
 */
class JABS_StandardController
  extends JABS_BaseController
{
  /**
   * Constructor.
   */
  constructor()
  {
    // also run superclass constructor for registration.
    super();

    // initialize this.
    this.initialize();
  }

  /**
   * Initializes this class.
   */
  initialize()
  {
    // initialize the other members of the class.
    this.initMembers();

    // initialize default mappings.
    this.initMapping();
  }

  /**
   * Initializes all members of this class.
   */
  initMembers()
  {
    // start with a null battler when initializing.
    this.battler = null;

    /**
     * A collection of input mappings from logical action (button) to an array of physical inputs.
     * "Physical inputs" are `Input` symbols like `ok`, `cancel`, or custom entries registered by plugins.
     * @type {Map<string, string[]>}
     */
    this.inputMapping = new Map();
  }

  /**
   * Initialize the button-to-input mappings.
   * Seeds from current JABS defaults.
   */
  initMapping()
  {
    // seed defaults from current JABS input symbols using string[] per action.
    this.inputMapping.set(JABS_Button.Menu, [ J.ABS.Input.Quickmenu ]);
    this.inputMapping.set(JABS_Button.Select, [ J.ABS.Input.PartyCycle ]);

    // seed primaries.
    this.inputMapping.set(JABS_Button.Mainhand, [ J.ABS.Input.Mainhand ]);
    this.inputMapping.set(JABS_Button.Offhand, [ J.ABS.Input.Offhand ]);
    this.inputMapping.set(JABS_Button.Tool, [ J.ABS.Input.Tool ]);
    this.inputMapping.set(JABS_Button.Dodge, [ J.ABS.Input.MobilitySkill ]);

    // seed mobility & modifiers.
    this.inputMapping.set(JABS_Button.Sprint, [ J.ABS.Input.Dash ]);
    this.inputMapping.set(JABS_Button.Strafe, [ J.ABS.Input.StrafeTrigger ]);
    this.inputMapping.set(JABS_Button.Rotate, [ J.ABS.Input.GuardTrigger ]);
    this.inputMapping.set(JABS_Button.Guard, [ J.ABS.Input.GuardTrigger ]);
    this.inputMapping.set(JABS_Button.SkillTrigger, [ J.ABS.Input.SkillTrigger ]);

    // seed L1 + buttons (combat skills).
    this.inputMapping.set(JABS_Button.CombatSkill1, [ J.ABS.Input.CombatSkill1 ]);
    this.inputMapping.set(JABS_Button.CombatSkill2, [ J.ABS.Input.CombatSkill2 ]);
    this.inputMapping.set(JABS_Button.CombatSkill3, [ J.ABS.Input.CombatSkill3 ]);
    this.inputMapping.set(JABS_Button.CombatSkill4, [ J.ABS.Input.CombatSkill4 ]);
  }

  /**
   * Builds a plain-object of the default mappings without mutating this controller.
   * This is safe to use for "Reset to Defaults" previews in the remap scene.
   * @returns {Object<string, string[]>} The default logical->physical mapping.
   */
  buildDefaultMapping()
  {
    // create a new object to hold the default mappings.
    const defaults = {};

    // seed defaults from current JABS input symbols using string[] per action.
    defaults[JABS_Button.Menu] = [ J.ABS.Input.Quickmenu ];
    defaults[JABS_Button.Select] = [ J.ABS.Input.PartyCycle ];

    // seed primaries.
    defaults[JABS_Button.Mainhand] = [ J.ABS.Input.Mainhand ];
    defaults[JABS_Button.Offhand] = [ J.ABS.Input.Offhand ];
    defaults[JABS_Button.Tool] = [ J.ABS.Input.Tool ];
    defaults[JABS_Button.Dodge] = [ J.ABS.Input.MobilitySkill ];

    // seed mobility/modifiers.
    defaults[JABS_Button.Sprint] = [ J.ABS.Input.Dash ];
    defaults[JABS_Button.Strafe] = [ J.ABS.Input.StrafeTrigger ];
    defaults[JABS_Button.Rotate] = [ J.ABS.Input.GuardTrigger ];
    defaults[JABS_Button.Guard] = [ J.ABS.Input.GuardTrigger ];
    defaults[JABS_Button.SkillTrigger] = [ J.ABS.Input.SkillTrigger ];

    // seed L1 + buttons (combat skills).
    defaults[JABS_Button.CombatSkill1] = [ J.ABS.Input.CombatSkill1 ];
    defaults[JABS_Button.CombatSkill2] = [ J.ABS.Input.CombatSkill2 ];
    defaults[JABS_Button.CombatSkill3] = [ J.ABS.Input.CombatSkill3 ];
    defaults[JABS_Button.CombatSkill4] = [ J.ABS.Input.CombatSkill4 ];

    // return the assembled defaults.
    return defaults;
  }

  /**
   * Resets this controller’s live bindings back to the defaults.
   * Does not touch persistence; the caller should save if desired.
   */
  resetToDefaults()
  {
    // rebuild the default mapping without mutating first.
    const defaults = this.buildDefaultMapping();

    // apply the defaults to this controller.
    this.setAllInputs(defaults);
  }

  /**
   * Gets the physical inputs for the given logical button.
   * @param {string} button The logical action key.
   * @returns {string[]} The list of physical inputs associated with this action.
   */
  getInputsForButton(button)
  {
    // get the configured value for this button.
    const raw = this.inputMapping.get(button);

    // return an empty array if nothing was configured.
    if (!raw) return [];

    // normalize string -> [ string ], and copy arrays for safety.
    if (Array.isArray(raw)) return raw.slice(0);

    // if the mapping is a single string, convert it into an array.
    return [ raw ];
  }

  /**
   * Gets the primary physical input for the given button (convenience).
   * @param {string} slot The logical action key.
   * @returns {string|undefined} The first physical input, if any.
   */
  getInputForButton(slot)
  {
    // grab the list of inputs for the button.
    const inputs = this.getInputsForButton(slot);

    // return the first one from the list, if available.
    return inputs.length > 0
      ? inputs[0]
      : undefined;
  }

  /**
   * Overwrites the entire mapping for this controller in one call.
   * Accepts either a `Map<string, string|string[]>` or a plain object `{ [button]: string|string[] }`.
   * No saving happens here; this is purely runtime state.
   * @param {Map<string,(string|string[])>|Object<string,(string|string[])>} mapping The mapping to apply.
   */
  setAllInputs(mapping)
  {
    // clear current map before applying new one.
    this.inputMapping.clear();

    // helper to normalize a mapping entry into an array of strings.
    const toArray = value =>
    {
      // return a shallow copy if the value is already an array.
      if (Array.isArray(value)) return value.slice(0);

      // return an empty array if there is no value.
      if (!value) return [];

      // otherwise, wrap the single value in an array.
      return [ value ];
    };

    // apply based on input type.
    if (mapping instanceof Map)
    {
      // copy entries from the provided map.
      mapping.forEach((value, key) =>
      {
        // set the normalized entry for this key.
        this.inputMapping.set(key, toArray(value));
      }, this);
    }
    else
    {
      // treat it like a POJO and copy own keys.
      Object.keys(mapping)
        .forEach(key =>
        {
          // set the normalized entry for this key.
          this.inputMapping.set(key, toArray(mapping[key]));
        });
    }

    // read the current rotate inputs (if any) after normalization.
    const rotateInputs = this.inputMapping.get(JABS_Button.Rotate) || [];

    // overwrite Guard with a cloned copy of Rotate’s inputs.
    this.inputMapping.set(JABS_Button.Guard, rotateInputs.slice(0));
  }

  /**
   * Exports the current mapping as a plain object suitable for saving.
   * @returns {Object<string,string[]>} A shallow copy of the current mapping.
   */
  exportAllInputs()
  {
    // create a plain object export of the map.
    const out = {};

    // iterate all entries and copy arrays into the object.
    this.inputMapping.forEach((value, key) => out[key] = Array.isArray(value)
      ? value.slice(0)
      : []);

    // return the export.
    return out;
  }

  /**
   * Determines if any physical input bound to the logical action was triggered this frame.
   * @param {string} button The logical action key.
   * @returns {boolean}
   */
  isActionTriggered(button)
  {
    // get the inputs to check.
    const inputs = this.getInputsForButton(button);

    // iterate all inputs and short-circuit on the first triggered.
    for (let i = 0; i < inputs.length; i++)
    {
      // grab the physical input at this index.
      const physical = inputs[i];

      // if this physical input was triggered, then the action is triggered.
      if (Input.isTriggered(physical)) return true;
    }

    // none of the inputs were triggered for this action.
    return false;
  }

  /**
   * Determines if any physical input bound to the logical action is currently pressed.
   * @param {string} button The logical action key.
   * @returns {boolean}
   */
  isActionPressed(button)
  {
    // get the inputs to check.
    const inputs = this.getInputsForButton(button);

    // iterate all inputs and short-circuit on the first pressed.
    for (let i = 0; i < inputs.length; i++)
    {
      // grab the physical input at this index.
      const physical = inputs[i];

      // if this physical input is pressed, then the action is pressed.
      if (Input.isPressed(physical)) return true;
    }

    // none of the inputs are pressed for this action.
    return false;
  }

  //region update
  /**
   * Updates the input loop for tracking JABS input.
   */
  update()
  {
    // if updating is not available, then do not.
    if (this.canUpdate() === false) return;

    // update input for the management actions.
    this.updateMenuAction();
    this.updatePartyCycleAction();

    // update input for the triggered-button actions.
    this.updateMainhandAction();
    this.updateOffhandAction();
    this.updateToolAction();
    this.updateDodgeAction();

    // update input for multi-button actions.
    this.updateCombatAction1();
    this.updateCombatAction2();
    this.updateCombatAction3();
    this.updateCombatAction4();

    // update input for the pressed(held down)-button actions.
    this.updateSprintCommand();
    this.updateGuardCommand();
    this.updateStrafeCommand();
    this.updateRotateCommand();
  }

  /**
   * Checks whether or not we can update this controller's input.
   * @returns {boolean}
   */
  canUpdate()
  {
    // if we don't have a battler, we can't update their input.
    if (this.getBattler() === null) return false;

    // update!
    return true;
  }

  //endregion update

  //region menu action
  /**
   * Monitors and takes action based on player input regarding the menu.
   * This is `Menu` on the gamepad by default.
   */
  updateMenuAction()
  {
    // check if the action's input requirements have been met.
    if (this.isMenuActionTriggered())
    {
      // execute the action.
      this.performMenuAction();
    }
  }

  /**
   * Checks the inputs of the menu action (Menu default).
   * @returns {boolean}
   */
  isMenuActionTriggered()
  {
    // this action requires Menu to be triggered.
    if (this.isActionTriggered(JABS_Button.Menu))
    {
      return true;
    }

    // Menu was never triggered.
    return false;
  }

  /**
   * Executes the menu action (Menu default).
   */
  performMenuAction()
  {
    // perform the quick menu action via the adapter.
    JABS_InputAdapter.performMenuAction();
  }

  //endregion menu action

  //region party cycle
  /**
   * Monitors and takes action based on player input regarding party cycling.
   * This is `Select` on the gamepad by default.
   */
  updatePartyCycleAction()
  {
    // check if the action's input requirements have been met.
    if (this.isPartyCycleActionTriggered())
    {
      // execute the action.
      this.performPartyCycleAction();
    }
  }

  /**
   * Checks the inputs of the party cycle action (Select default).
   * @returns {boolean}
   */
  isPartyCycleActionTriggered()
  {
    // this action requires Select to be triggered.
    if (this.isActionTriggered(JABS_Button.Select))
    {
      return true;
    }

    // Select was never triggered.
    return false;
  }

  /**
   * Executes the party cycle action (Select default).
   */
  performPartyCycleAction()
  {
    // perform party cycling via the adapter.
    JABS_InputAdapter.performPartyCycling(false);
  }

  //endregion party cycle

  //region mainhand
  /**
   * Monitors and takes action based on player input regarding the mainhand action.
   * This is `A` on the gamepad by default.
   */
  updateMainhandAction()
  {
    // check if the action's input requirements have been met.
    if (this.isMainhandActionTriggered())
    {
      // execute the action.
      this.performMainhandAction();
    }
  }

  /**
   * Checks the inputs of the mainhand action currently assigned (A default).
   * @returns {boolean}
   */
  isMainhandActionTriggered()
  {
    // if the player is preparing to use a skill, don't do this as well.
    if (this.isCombatSkillUsageEnabled())
    {
      return false;
    }

    // this action requires the logical Mainhand to be triggered.
    if (this.isActionTriggered(JABS_Button.Mainhand))
    {
      return true;
    }

    // Mainhand is not being triggered.
    return false;
  }

  /**
   * Executes the currently assigned mainhand action (A default).
   */
  performMainhandAction()
  {
    // perform the mainhand action for this controller's battler.
    JABS_InputAdapter.performMainhandAction(this.getBattler());
  }

  //endregion mainhand

  //region offhand
  /**
   * Monitors and takes action based on player input regarding the offhand action.
   * This is `B` on the gamepad by default.
   */
  updateOffhandAction()
  {
    // check if the action's input requirements have been met.
    if (this.isOffhandActionTriggered())
    {
      // execute the action.
      this.performOffhandAction();
    }
  }

  /**
   * Checks the inputs of the offhand action currently assigned (B default).
   * @returns {boolean}
   */
  isOffhandActionTriggered()
  {
    // if the player is preparing to use a skill, don't do this as well.
    if (this.isCombatSkillUsageEnabled())
    {
      return false;
    }

    // this action requires the logical Offhand to be triggered.
    if (this.isActionTriggered(JABS_Button.Offhand))
    {
      return true;
    }

    // Offhand is not being triggered.
    return false;
  }

  /**
   * Executes the currently assigned offhand action (B default).
   */
  performOffhandAction()
  {
    // perform the offhand action for this controller's battler.
    JABS_InputAdapter.performOffhandAction(this.getBattler());
  }

  //endregion offhand

  //region sprint
  updateSprintCommand()
  {
    // check if the action's input requirements have been met.
    if (this.isSprintActionTriggered())
    {
      // execute the action.
      this.performSprintAction();
    }
    // if they aren't being met.
    else
    {
      // then execute the alter-action.
      this.performSprintAlterAction();
    }
  }

  /**
   * Checks the inputs of the sprint action currently assigned (Shift default).
   * @returns {boolean}
   */
  isSprintActionTriggered()
  {
    // this action requires Sprint to be pressed.
    if (this.isActionPressed(JABS_Button.Sprint))
    {
      return true;
    }

    // Sprint is not being pressed.
    return false;
  }

  /**
   * Enables sprinting for this controller's battler.
   */
  performSprintAction()
  {
    // perform sprint enable for this controller's battler.
    JABS_InputAdapter.performSprint(true, this.battler);
  }

  /**
   * Disables sprinting for this controller's battler.
   */
  performSprintAlterAction()
  {
    // perform sprint disable for this controller's battler.
    JABS_InputAdapter.performSprint(false, this.battler);
  }
  //endregion sprint

  //region tool
  /**
   * Monitors and takes action based on player input regarding the tool action.
   * This is `Y` on the gamepad by default.
   */
  updateToolAction()
  {
    // check if the action's input requirements have been met.
    if (this.isToolActionTriggered())
    {
      // execute the action.
      this.performToolAction();
    }
  }

  /**
   * Checks the inputs of the tool action currently assigned (Y default).
   * @returns {boolean}
   */
  isToolActionTriggered()
  {
    // if the player is preparing to use a skill, don't do this as well.
    if (this.isCombatSkillUsageEnabled())
    {
      return false;
    }

    // this action requires the logical Tool to be triggered.
    if (this.isActionTriggered(JABS_Button.Tool))
    {
      return true;
    }

    // Tool is not being triggered.
    return false;
  }

  /**
   * Executes the currently assigned tool action (Y default).
   */
  performToolAction()
  {
    // perform the tool action for this controller's battler.
    JABS_InputAdapter.performToolAction(this.getBattler());
  }

  //endregion tool

  //region dodge
  /**
   * Monitors and takes action based on player input regarding the dodge action.
   * This is `R2` on the gamepad by default.
   */
  updateDodgeAction()
  {
    // check if the action's input requirements have been met.
    if (this.isDodgeActionTriggered())
    {
      // execute the action.
      this.performDodgeAction();
    }
  }

  /**
   * Checks the inputs of the dodge action currently assigned (R2 default).
   * @returns {boolean}
   */
  isDodgeActionTriggered()
  {
    // this action requires the logical Dodge to be triggered.
    if (this.isActionTriggered(JABS_Button.Dodge))
    {
      return true;
    }

    // Dodge is not being triggered.
    return false;
  }

  /**
   * Executes the currently assigned dodge action (R2 default).
   */
  performDodgeAction()
  {
    // perform the dodge action for this controller's battler.
    JABS_InputAdapter.performDodgeAction(this.getBattler());
  }

  //endregion dodge

  //region combat actions
  /**
   * Checks the inputs to ensure the combat action enabler is being held down (L1 default).
   * @returns {boolean}
   */
  isCombatSkillUsageEnabled()
  {
    // this action requires the logical SkillTrigger to be held down.
    if (this.isActionPressed(JABS_Button.SkillTrigger))
    {
      return true;
    }

    // SkillTrigger is not being held down.
    return false;
  }

  /**
   * Executes the combat action in the given slot.
   * @param {string} slot The slot to execute the combo action from.
   */
  performCombatAction(slot)
  {
    // perform the combat action for this controller's battler and the given slot.
    JABS_InputAdapter.performCombatAction(slot, this.getBattler());
  }

  //region combat action 1
  /**
   * Monitors and takes action based on player input regarding combat action 1.
   * This is `L1 + Mainhand` on the gamepad by default.
   */
  updateCombatAction1()
  {
    // check if the action's input requirements have been met.
    if (this.isCombatAction1Triggered())
    {
      // execute the action.
      this.performCombatAction(JABS_Button.CombatSkill1);
    }
  }

  /**
   * Checks the inputs of the combat action in slot 1.
   * Requires SkillTrigger held and CombatSkill1 triggered.
   * @returns {boolean}
   */
  isCombatAction1Triggered()
  {
    // if the SkillTrigger is being held down...
    if (this.isCombatSkillUsageEnabled())
    {
      // ...and Mainhand is triggered this frame, then combat action 1 should fire.
      if (this.isActionTriggered(JABS_Button.Mainhand))
      {
        return true;
      }
    }

    // alternatively, if the keyboard shortcut for CombatSkill1 was triggered, then fire.
    if (this.isActionTriggered(JABS_Button.CombatSkill1))
    {
      return true;
    }

    // neither the chord nor the keyboard shortcut were used.
    return false;
  }

  //endregion combat action 1

  //region combat action 2
  /**
   * Monitors and takes action based on player input regarding combat action 2.
   * This is `L1 + Offhand` on the gamepad by default.
   */
  updateCombatAction2()
  {
    // check if the action's input requirements have been met.
    if (this.isCombatAction2Triggered())
    {
      // execute the action.
      this.performCombatAction(JABS_Button.CombatSkill2);
    }
  }

  /**
   * Checks the inputs of the combat action in slot 2.
   * Requires SkillTrigger held and CombatSkill2 triggered.
   * @returns {boolean}
   */
  isCombatAction2Triggered()
  {
    // if the SkillTrigger is being held down...
    if (this.isCombatSkillUsageEnabled())
    {
      // ...and Offhand is triggered this frame, then combat action 2 should fire.
      if (this.isActionTriggered(JABS_Button.Offhand))
      {
        return true;
      }
    }

    // alternatively, if the keyboard shortcut for CombatSkill2 was triggered, then fire.
    if (this.isActionTriggered(JABS_Button.CombatSkill2))
    {
      return true;
    }

    // neither the chord nor the keyboard shortcut were used.
    return false;
  }

  //endregion combat action 2

  //region combat action 3
  /**
   * Monitors and takes action based on player input regarding combat action 3.
   * This is `L1 + Dash` (X) on the gamepad by default.
   */
  updateCombatAction3()
  {
    // check if the action's input requirements have been met.
    if (this.isCombatAction3Triggered())
    {
      // execute the action.
      this.performCombatAction(JABS_Button.CombatSkill3);
    }
  }

  /**
   * Checks the inputs of the combat action in slot 3.
   * Requires SkillTrigger held and CombatSkill3 triggered.
   * @returns {boolean}
   */
  isCombatAction3Triggered()
  {
    // if the SkillTrigger is being held down...
    if (this.isCombatSkillUsageEnabled())
    {
      // ...and Dodge is triggered this frame, then combat action 3 should fire.
      if (this.isActionTriggered(JABS_Button.Dodge))
      {
        return true;
      }
    }

    // alternatively, if the keyboard shortcut for CombatSkill3 was triggered, then fire.
    if (this.isActionTriggered(JABS_Button.CombatSkill3))
    {
      return true;
    }

    // neither the chord nor the keyboard shortcut were used.
    return false;
  }

  //endregion combat action 3

  //region combat action 4
  /**
   * Monitors and takes action based on player input regarding combat action 4.
   * This is `L1 + Tool` (Y) on the gamepad by default.
   */
  updateCombatAction4()
  {
    // check if the action's input requirements have been met.
    if (this.isCombatAction4Triggered())
    {
      // execute the action.
      this.performCombatAction(JABS_Button.CombatSkill4);
    }
  }

  /**
   * Checks the inputs of the combat action in slot 4.
   * Requires SkillTrigger held and CombatSkill4 triggered.
   * @returns {boolean}
   */
  isCombatAction4Triggered()
  {
    // if the SkillTrigger is being held down...
    if (this.isCombatSkillUsageEnabled())
    {
      // ...and Tool is triggered this frame, then combat action 4 should fire.
      if (this.isActionTriggered(JABS_Button.Tool))
      {
        return true;
      }
    }

    // alternatively, if the keyboard shortcut for CombatSkill4 was triggered, then fire.
    if (this.isActionTriggered(JABS_Button.CombatSkill4))
    {
      return true;
    }

    // neither the chord nor the keyboard shortcut were used.
    return false;
  }

  //endregion combat action 4
  //endregion combat actions

  //region strafe
  /**
   * Monitors and takes action based on player input regarding the strafe action.
   * This is `L2` on the gamepad by default.
   */
  updateStrafeCommand()
  {
    // check if the action's input requirements have been met.
    if (this.isStrafeActionTriggered())
    {
      // execute the action.
      this.performStrafeAction();
    }
    // if they aren't being met.
    else
    {
      // then execute the alter-action.
      this.performStrafeAlterAction();
    }
  }

  /**
   * Checks the inputs of the strafe action currently assigned (L2 default).
   * @returns {boolean}
   */
  isStrafeActionTriggered()
  {
    // this action requires Strafe to be pressed.
    if (this.isActionPressed(JABS_Button.Strafe))
    {
      return true;
    }

    // Strafe is not being pressed.
    return false;
  }

  /**
   * Executes the currently assigned strafe action (L2 default).
   */
  performStrafeAction()
  {
    // perform strafe enable for this controller's battler.
    JABS_InputAdapter.performStrafe(true, this.getBattler());
  }

  /**
   * Executes the currently assigned strafe alter-action (untouched-L2 default).
   */
  performStrafeAlterAction()
  {
    // perform strafe disable for this controller's battler.
    JABS_InputAdapter.performStrafe(false, this.getBattler());
  }

  //endregion strafe

  //region rotate
  /**
   * Monitors and takes action based on player input regarding the rotate action.
   * This is `R1` on the gamepad by default.
   */
  updateRotateCommand()
  {
    // check if the action's input requirements have been met.
    if (this.isRotateActionTriggered())
    {
      // execute the action.
      this.performRotateAction();
    }
    // if they aren't being met.
    else
    {
      // then execute the alter-action.
      this.performRotateAlterAction();
    }
  }

  /**
   * Checks the inputs of the rotate action currently assigned (R1 default).
   * @returns {boolean}
   */
  isRotateActionTriggered()
  {
    // this action requires Rotate to be pressed.
    if (this.isActionPressed(JABS_Button.Rotate))
    {
      return true;
    }

    // Rotate is not being pressed.
    return false;
  }

  /**
   * Executes the currently assigned rotate action (R1 default).
   */
  performRotateAction()
  {
    // perform rotate enable for this controller's battler.
    JABS_InputAdapter.performRotate(true, this.getBattler());

    // also enable guarding while rotating; adapter/battler will vet eligibility.
    JABS_InputAdapter.performGuard(true, this.getBattler());
  }

  /**
   * Executes the currently assigned rotate alter-action (untouched-R1 default).
   */
  performRotateAlterAction()
  {
    // perform rotate disable for this controller's battler.
    JABS_InputAdapter.performRotate(false, this.getBattler());

    // also disable guarding when rotation stops; adapter/battler will vet eligibility.
    JABS_InputAdapter.performGuard(false, this.getBattler());
  }

  //endregion rotate

  //region guard
  /**
   * Monitors and takes action based on player input regarding the guard action.
   * This is `R1` on the gamepad by default.
   */
  updateGuardCommand()
  {
    // check if the action's input requirements have been met.
    if (this.isGuardActionTriggered())
    {
      // execute the action.
      this.performGuardAction();
    }
    // if they aren't being met.
    else
    {
      // then execute the alter-action.
      this.performGuardAlterAction();
    }
  }

  /**
   * Checks the inputs of the guard action currently assigned (R1 default).
   * @returns {boolean}
   */
  isGuardActionTriggered()
  {
    // this action requires Guard to be held down.
    if (this.isActionPressed(JABS_Button.Guard))
    {
      return true;
    }

    // Guard is not being held down.
    return false;
  }

  /**
   * Activates the currently assigned guard action (R1 default).
   */
  performGuardAction()
  {
    // perform guard enable for this controller's battler.
    JABS_InputAdapter.performGuard(true, this.getBattler());
  }

  /**
   * Deactivates the currently assigned guard alter-action (untouched-R1 default).
   */
  performGuardAlterAction()
  {
    // perform guard disable for this controller's battler.
    JABS_InputAdapter.performGuard(false, this.getBattler());
  }

  //endregion guard
}

//endregion JABS_InputController
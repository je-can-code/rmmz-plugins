//region introduction
/*:
 * @target MZ
 * @plugindesc
 * [v2.0.0 INPUT] A manager for overseeing the input of JABS.
 * @author JE
 * @url https://github.com/je-can-code/rmmz-plugins
 * @base J-ABS
 * @base J-Base
 * @orderAfter J-ABS
 * @orderAfter J-Base
 * @orderAfter J-ABS-AllyAI
 * @orderBefore J-HUD
 * @help
 * ============================================================================
 * OVERVIEW
 * ----------------------------------------------------------------------------
 * This plugin is a mapping of inputs to controls for JABS.
 *
 * This plugin requires JABS.
 * This plugin has no additional configuration required.
 * ----------------------------------------------------------------------------
 * DETAILS:
 * This entire plugin provides an implementation of a "controller" that the
 * player leverages to control inputs for JABS. With it, the player can press
 * keys or buttons to trigger JABS-specific functionality, like execution of
 * a skill, cycling with other members of the party, or bringing up the quick
 * menu. This plugin also provides a way to remap inputs to different keys or
 * buttons to suit the player's preferences.
 *
 * NOTE ABOUT DUPLICATES:
 * No single input can be mapped to multiple actions. Mapping the same input
 * to a second action will unbind the original. Be sure all actions you care
 * about are mapped! These cannot be undone mid-run by the player! (but they
 * can there is an exposed function on Game_System that will reset all input
 * mapping back to defaults via script call if necessary).
 *
 * ============================================================================
 * CHANGELOG
 * ----------------------------------------------------------------------------
 * - 2.0.0
 *   Significantly overhauled the plugin to support with input remapping.
 * - 1.0.0
 *   Initial release.
 * ============================================================================
 */

/**
 * The core where all of my extensions live: in the `J` object.
 */
var J = J || {};

//region version checks
(() =>
{
  // Check to ensure we have the minimum required version of the J-Base plugin.
  const requiredBaseVersion = '2.1.0';
  const hasBaseRequirement = J.BASE.Helpers.satisfies(J.BASE.Metadata.Version, requiredBaseVersion);
  if (!hasBaseRequirement)
  {
    throw new Error(`Either missing J-Base or has a lower version than the required: ${requiredBaseVersion}`);
  }
})();
//endregion version check

//region metadata
/**
 * The plugin umbrella that governs all things related to this plugin.
 */
J.ABS.EXT.INPUT = {};

/**
 * The `metadata` associated with this plugin, such as version.
 */
J.ABS.EXT.INPUT = {};
J.ABS.EXT.INPUT.Metadata = {};
J.ABS.EXT.INPUT.Metadata.Version = '2.0.0';
J.ABS.EXT.INPUT.Metadata.Name = `J-ABS-InputManager`;

/**
 * The actual `plugin parameters` extracted from RMMZ.
 */
J.ABS.EXT.INPUT.PluginParameters = PluginManager.parameters(J.ABS.EXT.INPUT.Metadata.Name);

/**
 * Extend this plugin's metadata with additional configurable data points.
 */
J.ABS.EXT.INPUT.Metadata = {
  // the previously defined metadata.
  ...J.ABS.EXT.INPUT.Metadata,
};

/**
 * A collection of all aliased methods for this plugin.
 */
J.ABS.EXT.INPUT.Aliased = {
  DataManager: new Map(),
  Game_System: new Map(),
  JABS_Engine: new Map(),
  JABS_Battler: new Map(),
  Window_MenuCommand: new Map(),
  Scene_Menu: new Map(),
};
//endregion metadata

/**
 * The global reference for the player's input manager.
 * This interprets and manages incoming inputs for JABS-related functionality.
 * @type {JABS_StandardController}
 * @global
 */
// eslint-disable-next-line no-unused-vars
var $jabsController1 = null;
//endregion introduction

//region JABS_Battler
/**
 * Generates a `JABS_Battler` based on the current leader of the party.
 * Also assigns the controller inputs for the player.
 */
J.ABS.EXT.INPUT.Aliased.JABS_Battler.set('createPlayer', JABS_Battler.createPlayer);
JABS_Battler.createPlayer = function()
{
  // intercept return data from original logic.
  const playerJabsBattler = J.ABS.EXT.INPUT.Aliased.JABS_Battler.get('createPlayer')
    .call(this);

  // assign newly players are created to controller 1.
  $jabsController1.setBattler(playerJabsBattler);

  // return original logic data.
  return playerJabsBattler;
};
//endregion JABS_Battler

//region JABS_Button
/**
 * A static class containing all input keys available for JABS.
 */
class JABS_Button
{
  //region functionality
  /**
   * The "start" key.
   * Used for bringing up the JABS menu on the map.
   * @type {string}
   */
  static Menu = 'Menu';

  /**
   * The "select" key.
   * Used for party-cycling.
   * @type {string}
   */
  static Select = 'Select';
  //endregion functionality

  //region primary
  /**
   * The "main", "A" button, or "Z" key.
   * Used for executing the mainhand action.
   * @type {string}
   */
  static Mainhand = 'Main';

  /**
   * The "offhand", "B" button, or "X" key.
   * Used for executing the offhand action.
   * @type {string}
   */
  static Offhand = 'Offhand';

  /**
   * The "tool", "Y" button, or "C" key.
   * Used for executing the currently selected tool skill.
   * @type {string}
   */
  static Tool = 'Tool';

  /**
   * The "dodge", "R2" button, or "Tab" key.
   * Used for executing the currently selected dodge skill.
   * @type {string}
   */
  static Dodge = 'Dodge';
  //endregion primary

  //region mobility & modifiers
  /**
   * The sprint/dash input (engine-native dash replacement).
   * While held, the player sprints if allowed.
   * @type {string}
   */
  static Sprint = "Sprint";

  /**
   * The "strafe", "L2" button, or "Left Ctrl" key.
   * Used for locking the direction faced while the input is held.
   * @type {string}
   */
  static Strafe = 'Strafe';

  /**
   * The "rotate", "R1" button, or "W" and "E" key(s).
   * Used for locking in-place while the input is held.
   * @type {string}
   */
  static Rotate = 'Rotate';

  /**
   * The "guard", "R1" button, or "W", and "E" key(s).
   * Used for activating the guard function while the input is held.
   * @type {string}
   */
  static Guard = 'Guard';

  /**
   * The combat "enabler" (commonly L1 hold on gamepads).
   * Used as a modifier to enable Combat Skill 1–4 actions while held.
   * @type {string}
   */
  static SkillTrigger = 'SkillTrigger';
  //endregion mobility & modifiers

  //region L1 + buttons
  /**
   * The `L1 + A` or 1 key.
   * Executes combat skill 1.
   * @type {string}
   */
  static CombatSkill1 = 'CombatSkill1';

  /**
   * The `L1 + B` or 2 key.
   * Executes combat skill 2.
   * @type {string}
   */
  static CombatSkill2 = 'CombatSkill2';

  /**
   * The `L1 + X` or 3 key.
   * Executes combat skill 3.
   * @type {string}
   */
  static CombatSkill3 = 'CombatSkill3';

  /**
   * The `L1 + Y` or 4 key.
   * Executes combat skill 4.
   * @type {string}
   */
  static CombatSkill4 = 'CombatSkill4';

  //endregion  L1 + buttons

  /**
   * Gets all assignable buttons used for JABS.
   * @returns {string[]} A collection of JABS-input keys' identifiers.
   */
  static assignableInputs()
  {
    // the valid set of assignable inputs.
    const okInputs = [
      // primary
      this.Mainhand, this.Offhand, this.Tool, this.Dodge,

      // modifiers & mobility
      this.SkillTrigger, this.Sprint, this.Strafe, this.Rotate,

      // functionality
      this.Menu, this.Select,
    ];

    // a filter function for ensuring only the correct inputs are accepted.
    const filtering = buttonInput => okInputs.includes(buttonInput);

    // return the filtered buttons.
    return this.allButtons()
      .filter(filtering);
  }

  /**
   * Gets all currently available buttons used for JABS.
   * @returns {string[]} A collection of JABS-input key's identifiers.
   */
  static allButtons()
  {
    return [
      // primary
      this.Mainhand, this.Offhand, this.Tool, this.Sprint,


      // mobility & modifiers
      this.SkillTrigger,  this.Strafe, this.Rotate, this.Guard, this.Dodge,

      // L1 + buttons
      this.CombatSkill1, this.CombatSkill2, this.CombatSkill3, this.CombatSkill4,

      // functionality
      this.Menu, this.Select,
    ];
  }
}

//endregion JABS_Button

//region JABS_InputAdapter.getAllControllers
/**
 * Gets all registered input controllers managed by the adapter.
 * Returns a shallow copy to prevent external mutation.
 * @returns {JABS_StandardController[]} The list of registered controllers.
 */
JABS_InputAdapter.getAllControllers = function()
{
  // return a shallow copy of the internal controllers list.
  return this.controllers.slice(0);
};
//endregion JABS_InputAdapter.getAllControllers

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

//region DataManager
J.ABS.EXT.INPUT.Aliased.DataManager.set('createGameObjects', DataManager.createGameObjects);
DataManager.createGameObjects = function()
{
  // perform original logic.
  J.ABS.EXT.INPUT.Aliased.DataManager.get('createGameObjects')
    .call(this);

  // initialize controller 1 for JABS.
  if (!$jabsController1)
  {
    // TODO: figure out how to prevent duplicate registration of controllers.
    $jabsController1 = new JABS_StandardController();
  }
};
//endregion DataManager

//region IconManager (JABS-Input helpers)
/**
 * Resolves a combined (controller/keyboard) icon ex-text for a physical input symbol.
 * Falls back to raw symbol text when unmapped.
 * @param {string} symbol The physical input symbol (ex: "ok", "pagedown", "l2", "start").
 * @returns {string} The ex-text to render (may include one or more `\I[...]` tokens).
 */
IconManager.jabsIconTextForSymbol = function(symbol)
{
  // handle empty/unbound case.
  if (!symbol) return "(unbound)";

  // translate common engine/gamepad symbols to paired glyphs.
  switch (symbol)
  {
    // confirm / cancel
    case "ok":
      // Cross (pad) / Z (kb)
      return "\\I[2448] / \\I[2432]";
    case "cancel":
      // Circle (pad) / X (kb)
      return "\\I[2449] / \\I[2433]";

    // face buttons / modifiers
    case "shift":
      // Square (pad) / Shift (kb)
      return "\\I[2450] / \\I[2434]";
    case "tab":
      // Triangle (pad) / C (kb)
      return "\\I[2451] / \\I[2435]";

    // bumpers / triggers
    case "pageup":
      // L1 (pad) / Q (kb)
      return "\\I[2452] / \\I[2436]";
    case "pagedown":
      // R1 (pad) / E (kb)
      return "\\I[2453] / \\I[2438]";
    case "l2":
      // L2 (pad) / Ctrl (kb)
      return "\\I[2454] / \\I[2437]";
    case "r2":
      // R2 (pad) / Tab (kb)
      return "\\I[2455] / \\I[2439]";

    // meta buttons
    case "start":
      // Options/Menu (pad) / Enter (kb)
      return "\\I[2456] / \\I[2440]";
    case "select":
      // Select/Share (pad) / Del (kb)
      return "\\I[2457] / \\I[2441]";

    // default fallback
    default:
      // fall back to raw text if unmapped.
      return String(symbol);
  }
};

/**
 * Resolves a single icon index for a physical input symbol by consulting J.ABS.Input.
 * Useful for left-column glyphs. Returns 0 when unmapped.
 * @param {string} symbol The physical input symbol.
 * @returns {number} The icon index to draw, or 0 if none.
 */
IconManager.jabsIconIndexForSymbol = function(symbol)
{
  // if nothing is bound, do not draw an icon.
  if (!symbol) return 0;

  // reference the configured input constants (source of truth for symbols).
  const I = J.ABS.Input;

  // normalize any aliases if needed (currently a pass-through).
  const normalized = symbol;

  // map configured inputs to icon indices (single-glyph usage).
  const iconByInput = {
    // primaries
    [I.Mainhand]: 76,         // Cross / Z
    [I.Offhand]: 77,          // Circle / X
    [I.Tool]: 176,            // Triangle / C
    [I.Dash]: 140,            // Square / Shift

    // modifiers & mobility
    [I.SkillTrigger]: 86,     // L1 / Q
    [I.StrafeTrigger]: 82,    // L2 / Ctrl
    [I.GuardTrigger]: 83,     // R1 / E
    [I.MobilitySkill]: 13,    // R2 / Tab

    // menu-ish
    [I.Quickmenu]: 2563,      // Start / Enter
    [I.PartyCycle]: 75,       // Select / Del

    // combat face button triggers (shared glyph, by choice)
    [I.CombatSkill1]: 79,
    [I.CombatSkill2]: 79,
    [I.CombatSkill3]: 79,
    [I.CombatSkill4]: 79,
  };

  // return the matching icon index or 0 if not mapped.
  return iconByInput[normalized] || 0;
};
//endregion IconManager (JABS-Input helpers)

//region Input
/**
 * Extends the existing mapper for keyboards to accommodate for the
 * additional skill inputs that are used for gamepads.
 */
Input.keyMapper = {
  // define the original keyboard mapping.
  ...Input.keyMapper,

  // core buttons.
  90: J.ABS.Input.Mainhand,       // z
  88: J.ABS.Input.Offhand,        // x
  16: J.ABS.Input.Dash,           // shift (already defined)
  67: J.ABS.Input.Tool,           // c

  // functional buttons.
  81: J.ABS.Input.SkillTrigger,   // q
  17: J.ABS.Input.StrafeTrigger,  // ctrl
  69: J.ABS.Input.GuardTrigger,   // e
  9: J.ABS.Input.MobilitySkill,   // tab

  // quickmenu button.
  13: J.ABS.Input.Quickmenu,      // enter

  // party cycling button.
  46: J.ABS.Input.PartyCycle,     // del

  // movement buttons.
  38: J.ABS.Input.DirUp,          // arrow up
  40: J.ABS.Input.DirDown,        // arrow down
  37: J.ABS.Input.DirLeft,        // arrow left
  39: J.ABS.Input.DirRight,       // arrow right

  // keyboard alternative for the multi-button skills.
  49: J.ABS.Input.CombatSkill1,   // 1 = L1 + cross
  50: J.ABS.Input.CombatSkill2,   // 2 = L1 + circle
  51: J.ABS.Input.CombatSkill3,   // 3 = L1 + square
  52: J.ABS.Input.CombatSkill4,   // 4 = L1 + triangle
};
//endregion Input

//region JABS_Engine
J.ABS.EXT.INPUT.Aliased.JABS_Engine.set('performPartyCycling', JABS_Engine.prototype.performPartyCycling);
/**
 * Extends {@link #performPartyCycling}.<br/>
 * Include reassigning the controller to the player.
 */
JABS_Engine.prototype.performPartyCycling = function()
{
  // perform original logic.
  J.ABS.EXT.INPUT.Aliased.JABS_Engine.get('performPartyCycling')
    .call(this);

  // when the player party cycles, update their controls to the updated battler.
  $jabsController1.setBattler(this.getPlayer1());
};

/**
 * Handles the player input.
 */
J.ABS.EXT.INPUT.Aliased.JABS_Engine.set('updateInput', JABS_Engine.prototype.updateInput);
JABS_Engine.prototype.updateInput = function()
{
  // perform original logic.
  J.ABS.EXT.INPUT.Aliased.JABS_Engine.get('updateInput')
    .call(this);

  // don't update if we aren't allowed to update.
  if (!this.canUpdateInput()) return;

  // update the input.
  $jabsController1.update();
};
//endregion JABS_Engine

//region Game_System
/**
 * Extends {@link #initMembers}.<br/>
 * Initializes members used for storing JABS input mappings per controller.
 */
J.ABS.EXT.INPUT.Aliased.Game_System.set('initMembers', Game_System.prototype.initMembers);
Game_System.prototype.initMembers = function()
{
  // perform original logic.
  J.ABS.EXT.INPUT.Aliased.Game_System.get('initMembers')
    .call(this);

  // initialize extension members for JABS input configurations.
  this.initJabsInputConfigMembers();
};

/**
 * Initializes members used for storing JABS input mappings and controller references.
 */
Game_System.prototype.initJabsInputConfigMembers = function()
{
  /**
   * Root namespace for J-related data stored on the system object.
   */
  this._j ||= {};

  /**
   * ABS (JABS) namespace stored under the J-root on the system object.
   */
  this._j._abs ||= {};

  /**
   * Input extension namespace stored under the ABS namespace on the system object.
   */
  this._j._abs._input ||= {};

  /**
   * Dictionary of controllerKey -> mapping object `{ [button]: symbol }`.
   * @type {Object<string, Object<string, string>>}
   */
  this._j._abs._input._mappings ||= {};
};

/**
 * Gets the stored mapping dictionary of controllerKey -> mapping object.
 * @returns {Object<string, Object<string,string>>}
 */
Game_System.prototype.getJabsInputMappings = function()
{
  // return the full mappings dictionary.
  return this._j._abs._input._mappings;
};

/**
 * Overwrites the stored mapping dictionary of controllerKey -> mapping object.
 * @param {Object<string, Object<string,string>>} mappings The new mappings dictionary.
 */
Game_System.prototype.setJabsInputMappings = function(mappings)
{
  // assign the provided mappings dictionary.
  this._j._abs._input._mappings = mappings;
};

/**
 * Stores a full mapping for the given controller key.
 * @param {string} controllerKey The key representing which controller this mapping belongs to.
 * @param {Object<string,string>} mapping The mapping object to store.
 */
Game_System.prototype.setJabsInputConfig = function(controllerKey, mapping)
{
  // create a shallow copy to avoid external mutation.
  const copy = {};

  // copy each mapping entry by key.
  Object.keys(mapping)
    .forEach(key => copy[key] = mapping[key]);

  // set the new value into the mappings dictionary via the setter.
  const mappings = this.getJabsInputMappings();
  mappings[controllerKey] = copy;
  this.setJabsInputMappings(mappings);
};

/**
 * Gets the stored mapping for the given controller key.
 * @param {string} controllerKey The key representing which controller’s mapping to retrieve.
 * @returns {Object<string,string>|null} The stored mapping, or null if none found.
 */
Game_System.prototype.getJabsInputConfig = function(controllerKey)
{
  // read the mappings dictionary.
  const mappings = this.getJabsInputMappings();

  // grab the mapping bucket for this key.
  const found = mappings[controllerKey];

  // return null if not found.
  if (!found) return null;

  // return a shallow copy for safety.
  const copy = {};
  Object.keys(found)
    .forEach(key => copy[key] = found[key]);
  return copy;
};

/**
 * Applies a stored mapping (if present) to the given controller.
 * @param {string} controllerKey The key used to look up the mapping.
 * @param {JABS_StandardController} controller The input controller to apply to.
 */
Game_System.prototype.applyJabsInputConfigToController = function(controllerKey, controller)
{
  // fetch any stored mapping for this key.
  const mapping = this.getJabsInputConfig(controllerKey);

  // if nothing was found, there is nothing to apply.
  if (!mapping) return;

  // push the full mapping to the controller in one call.
  controller.setAllInputs(mapping);
};

/**
 * Captures current mappings from all known controllers into system storage.
 * This should be called before save, or explicitly by the remap scene’s Save.
 */
Game_System.prototype.saveAllJabsInputConfigs = function()
{
  // get all currently registered controllers from the adapter.
  const controllers = JABS_InputAdapter.getAllControllers();

  // iterate each controller and snapshot its mapping.
  controllers.forEach((controller, index) =>
  {
    // resolve a key for this controller.
    const key = this.resolveJabsControllerKey(controller, index);

    // export and store the controller’s mapping.
    this.setJabsInputConfig(key, controller.exportAllInputs());
  });
};

/**
 * Applies stored mappings to all currently registered controllers.
 * Intended to be called after a save file loads.
 */
Game_System.prototype.applyAllJabsInputConfigs = function()
{
  // get all currently registered controllers from the adapter.
  const controllers = JABS_InputAdapter.getAllControllers();

  // apply per resolved key.
  controllers.forEach((controller, index) =>
  {
    const key = this.resolveJabsControllerKey(controller, index);
    this.applyJabsInputConfigToController(key, controller);
  });
};

/**
 * Resets a controller to defaults and persists the mapping.
 * @param {number} index The adapter index of the controller to reset.
 */
Game_System.prototype.resetJabsInputConfigToDefaults = function(index)
{
  // get controllers from adapter.
  const list = JABS_InputAdapter.getAllControllers();

  // get the controller and its key.
  const controller = list[index];
  const key = this.resolveJabsControllerKey(controller, index);

  // build and apply defaults.
  const defaults = controller.buildDefaultMapping();
  controller.setAllInputs(defaults);

  // persist the defaults for future loads.
  this.setJabsInputConfig(key, defaults);
};

/**
 * Resolves a stable key for the given controller for config storage.
 * Default strategy: "player" + (index+1).
 * @param {JABS_StandardController} controller The controller to resolve a key for.
 * @param {number} index The index of this controller in the adapter list.
 * @returns {string} The resolved key.
 */
Game_System.prototype.resolveJabsControllerKey = function(controller, index)
{
  // basic, stable default: player1, player2, ...
  return `player${index + 1}`;
};

/**
 * Extends {@link #onBeforeSave}.<br/>
 * Snapshots controller mappings before saving.
 */
J.ABS.EXT.INPUT.Aliased.Game_System.set('onBeforeSave', Game_System.prototype.onBeforeSave);
Game_System.prototype.onBeforeSave = function()
{
  // perform original logic.
  const original = J.ABS.EXT.INPUT.Aliased.Game_System.get('onBeforeSave');
  original.call(this);

  // snapshot all current controller mappings into system storage.
  this.saveAllJabsInputConfigs();
};

/**
 * Extends {@link #onAfterLoad}.<br/>
 * Applies stored mappings after loading.
 */
J.ABS.EXT.INPUT.Aliased.Game_System.set('onAfterLoad', Game_System.prototype.onAfterLoad);
Game_System.prototype.onAfterLoad = function()
{
  // perform original logic.
  J.ABS.EXT.INPUT.Aliased.Game_System.get('onAfterLoad')
    .call(this);

  // attempt to apply stored configs to any currently registered controllers.
  this.applyAllJabsInputConfigs();
};

//endregion Game_System

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
    // get the logical action being edited.
    const button = this.getActionsWindow()
      .currentButton();

    // begin capture for this logical action.
    this.beginCapture(button);
  }

  /**
   * Clears the binding for the selected logical action.
   */
  onClearBinding()
  {
    // get the logical action.
    const button = this.getActionsWindow()
      .currentButton();

    // get the pending map and clear this button.
    const pending = this.currentPendingMapping();
    pending[button] = [];

    // refresh the actions to reflect the change.
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

/**
 * Extends {@link #createCommandWindow}.<br/>
 * Also wires the handler for opening the JABS input remapping scene.
 */
J.ABS.EXT.INPUT.Aliased.Scene_Menu.set('createCommandWindow', Scene_Menu.prototype.createCommandWindow);
Scene_Menu.prototype.createCommandWindow = function()
{
  // perform original logic.
  J.ABS.EXT.INPUT.Aliased.Scene_Menu.get('createCommandWindow')
    .call(this);

  // wire the handler for our custom command symbol.
  this._commandWindow.setHandler('jabsRemap', () =>
  {
    // open the JABS remapping scene.
    SceneManager.push(Scene_JabsRemap);
  });
};

//region Window_JabsRemapActions
/**
 * The list window that shows logical actions and current bindings.
 * Refactored to extend {@link Window_Command} with builder-style organization
 * and namespaced state under {@link this._j._abs._input}.
 */
class Window_JabsRemapActions
  extends Window_Command
{
  /**
   * Constructor.
   * @param {Rectangle} rect The rectangle to draw this window within.
   */
  constructor(rect)
  {
    // perform super initialize.
    super(rect);

    // initialize the root-namespace definition members.
    this.initCoreMembers();

    // initialize the window-local members.
    this.initPrimaryMembers();

    // align selection to the first actionable entry by default.
    this.select(this.firstActionIndex());
  }

  //region init
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

    /**
     * A grouping for this window within the input branch.
     */
    this._j._abs._input._actions ||= {};
  }

  /**
   * Initializes the state and view members for this window.
   */
  initPrimaryMembers()
  {
    /**
     * Window-local state bag.
     */
    this._j._abs._input._actions._state = {
      _mapping: {},
      _buttons: [],
    };

    /**
     * Window-local view bag.
     */
    this._j._abs._input._actions._view = {
      _helpWindow: null,
    };

    // pre-build the static button list if not already present.
    if (this.getButtons().length === 0)
    {
      // set the authoritative buttons list for this window.
      this.setButtons(this.buildButtonList());
    }
  }

  //endregion init

  //region accessors
  /**
   * Gets the current mapping being displayed.
   * @returns {Object<string, string[]>}
   */
  getMapping()
  {
    // read from the lazily-initialized state bag.
    return this._state()._mapping || {};
  }

  /**
   * Sets the mapping to display and refreshes.
   * @param {Object<string, string[]>} mapping The mapping to show and edit.
   */
  setMapping(mapping)
  {
    // store the mapping reference (scene owns lifecycle of the object).
    this._state()._mapping = mapping || {};

    // refresh the contents to draw the values.
    this.refresh();
  }

  /**
   * Gets the ordered list of logical action keys.
   * @returns {string[]}
   */
  getButtons()
  {
    // obtain the window state bag.
    const state = this._state();

    // if we already have an authoritative list, use it.
    if (state._buttons && state._buttons.length > 0)
    {
      return state._buttons;
    }

    // otherwise, fall back to the canonical assignable list without mutating state.
    return this.buildButtonList();
  }

  /**
   * Sets the ordered list of logical action keys.
   * @param {string[]} buttons The ordered list of buttons.
   */
  setButtons(buttons)
  {
    // store a defensive copy of the ordered button list.
    this._state()._buttons = Array.isArray(buttons) ? buttons.slice(0) : [];

    // rebuild the command list to reflect the new set of rows.
    this.refresh();
  }

  /**
   * Gets the currently bound help window.
   * @returns {Window_Help|null}
   */
  getHelpWindow()
  {
    // return the tracked help window instance.
    return this._view()._helpWindow;
  }

  /**
   * Sets the help window and forwards to the base implementation for linkage.
   * @param {Window_Help} helpWindow The help window to bind.
   */
  setHelpWindow(helpWindow)
  {
    // store a local reference for access via getter.
    this._view()._helpWindow = helpWindow;

    // also perform the default linkage.
    super.setHelpWindow(helpWindow);
  }

  /**
   * Returns the current logical button at the cursor (or section label for headers).
   * @returns {string}
   */
  currentButton()
  {
    // read the current command.
    const cmd = this.currentData();

    // if there is no command, return empty.
    if (!cmd) return String.empty;

    // if this is a header, return its label.
    if (cmd.ext && cmd.ext.kind === 'header')
    {
      return String(cmd.ext.label || '');
    }

    // otherwise return the logical action key.
    return String(cmd.symbol || cmd.ext?.button || '');
  }

  /**
   * Lazily ensures the root namespace exists.
   */
  _root()
  {
    // ensure root namespaces.
    this._j ||= {};
    this._j._abs ||= {};
    this._j._abs._input ||= {};
    this._j._abs._input._actions ||= {};
  }

  /**
   * Lazily ensures and returns the window-local state bag.
   * @returns {{_mapping:Object<string,string[]>, _buttons:string[]}}
   */
  _state()
  {
    // ensure root namespaces.
    this._root();

    // ensure and return the state bag.
    const actions = this._j._abs._input._actions;
    actions._state ||= { _mapping: {}, _buttons: [] };
    return actions._state;
  }

  /**
   * Lazily ensures and returns the window-local view bag.
   * @returns {{_helpWindow:Window_Help|null}}
   */
  _view()
  {
    // ensure root namespaces.
    this._root();

    // ensure and return the view bag.
    const actions = this._j._abs._input._actions;
    actions._view ||= { _helpWindow: null };
    return actions._view;
  }

  //endregion accessors

  //region builders
  /**
   * Builds the ordered list of logical actions to show.
   * @returns {string[]}
   */
  buildButtonList()
  {
    // build from the canonical list of assignable inputs provided by JABS_Button.
    const list = JABS_Button.assignableInputs();

    // return as-is (the provided list is authoritative and de-duplicated).
    return list;
  }

  /**
   * Implements {@link Window_Command.prototype.makeCommandList}.<br>
   * Creates all commands (headers + actions) for this window.
   */
  makeCommandList()
  {
    // build all the commands for the window; this does not require pre-initialized state.
    const commands = this.buildCommands();

    // add all built commands to the list.
    commands.forEach(this.addBuiltCommand, this);
  }

  /**
   * Builds all commands for this command window (headers + actions).
   * @returns {BuiltWindowCommand[]}
   */
  buildCommands()
  {
    // reference the assignable set for quick membership checks; falls back if not stored yet.
    const can = new Set(this.getButtons());

    // a small helper to test and build an action command.
    const addIf = (rows, label, button) =>
    {
      // only add if the action is assignable in this context.
      if (can.has(button)) rows.push(this.buildActionCommand(button));
    };

    // compile the rows in the requested grouping order.
    const rows = [];

    // primary actions section.
    rows.push(this.buildHeaderCommand("Primary Actions"));
    addIf(rows, "Mainhand", JABS_Button.Mainhand);
    addIf(rows, "Offhand", JABS_Button.Offhand);
    addIf(rows, "Tool", JABS_Button.Tool);
    addIf(rows, "Sprint", JABS_Button.Sprint);

    // secondary actions section.
    rows.push(this.buildHeaderCommand("Secondary Actions"));
    addIf(rows, "Skill Trigger", JABS_Button.SkillTrigger);
    addIf(rows, "Rotate", JABS_Button.Rotate);
    addIf(rows, "Strafe", JABS_Button.Strafe);
    addIf(rows, "Dodge", JABS_Button.Dodge);

    // functional actions section.
    rows.push(this.buildHeaderCommand("Functional Actions"));
    addIf(rows, "Menu", JABS_Button.Menu);
    addIf(rows, "Party Cycle", JABS_Button.Select);

    // return the compiled list of commands.
    return rows;
  }

  /**
   * Builds a header command that is non-interactive.
   * @param {string} label The header label to display.
   * @returns {BuiltWindowCommand}
   */
  buildHeaderCommand(label)
  {
    // build a disabled command that represents a section header.
    return new WindowCommandBuilder(label)
      .setSymbol(`__header__${label}`)
      .setExtensionData({
        kind: 'header',
        label
      })
      .setEnabled(false)
      .build();
  }

  /**
   * Builds an actionable command for a logical action button.
   * @param {string} button The logical action key.
   * @returns {BuiltWindowCommand}
   */
  buildActionCommand(button)
  {
    // build an enabled command that represents a remappable action.
    return new WindowCommandBuilder(this.humanizeButton(button))
      .setSymbol(button)
      .setExtensionData({
        kind: 'action',
        button
      })
      .setEnabled(true)
      .build();
  }

  //endregion builders

  //region drawing
  /**
   * Draws a single item.
   * @param {number} index The index to draw.
   */
  drawItem(index)
  {
    // get the rectangle for this line.
    const rect = this.itemRectWithPadding(index);

    // resolve the command to draw.
    const cmd = this._list[index];

    // fallback if no command was found.
    if (!cmd) return;

    // if this is a header row, draw the section title and exit.
    if (cmd.ext && cmd.ext.kind === 'header')
    {
      // pick a stronger font and centered alignment for headers.
      const name = cmd.name || '';

      // draw the header text centered across the full row.
      this.changeTextColor(ColorManager.systemColor());
      this.contents.fontBold = true;
      this.drawText(name, rect.x, rect.y, rect.width, 'center');
      this.resetTextColor();
      this.contents.fontBold = false;
      return;
    }

    // compute the logical action key for this row.
    const button = String(cmd.symbol);

    // read the current bindings for this logical action from the mapping.
    const mapping = this.getMapping();

    // get the list of bound symbols for this action.
    const boundList = mapping[button] || [];

    // extract the primary binding if any.
    const bound = boundList.length > 0
      ? boundList[0]
      : String.empty;

    // determine the icon index for the bound physical symbol.
    const iconIndex = this.iconIndexForSymbol(bound);

    // pull icon sizing for positioning.
    const iw = ImageManager.iconWidth;
    const ih = ImageManager.iconHeight;

    // compute a vertically-centered y for the icon.
    const iconY = rect.y + Math.max(0, Math.floor((this.lineHeight() - ih) / 2));

    // track the x-position for the action text, starting at the left side.
    let leftTextX = rect.x;

    // if we have a valid icon index (> 0), draw it and bump the text to the right.
    if (iconIndex > 0)
    {
      // draw the icon to the far-left, preceding the action label.
      this.drawIcon(iconIndex, rect.x, iconY);

      // add spacing for the icon width + padding before drawing the action text.
      leftTextX += iw + 6;
    }

    // draw the logical action label to the right of the icon (if any).
    this.drawText(this.humanizeButton(button), leftTextX, rect.y, rect.width / 2);

    // draw an arrow separating columns.
    const arrow = '→';

    // compute mid-column x.
    const midX = rect.x + rect.width / 2;

    // draw the arrow centered between columns.
    this.drawText(arrow, midX - this.textWidth(arrow), rect.y, rect.width / 2);

    // build the right-column rich text (supports icons/escape codes).
    const rightText = IconManager.jabsIconTextForSymbol(bound);

    // measure the rendered width (icons + text) to right-align manually.
    const rightWidth = this.textSizeEx(rightText).width;

    // compute the right-aligned x within the right half.
    const rightX = midX + (rect.width / 2) - rightWidth;

    // draw the mapping text on the right column using drawTextEx (enables icons).
    this.drawTextEx(rightText, rightX, rect.y, rect.width / 2);
  }

  //endregion drawing

  //region help
  /**
   * Updates the linked help window with a description of the selected action.
   */
  updateHelp()
  {
    // read the bound help window.
    const help = this.getHelpWindow();

    // if we have no help window, do nothing.
    if (!help) return;

    // resolve the currently selected logical or header label.
    const button = this.currentButton();

    // build the description for this selection.
    const text = this.describeButton(button);

    // update the help text.
    help.setText(text);
  }

  //endregion help

  //region handling
  /**
   * Processes the OK input.
   * Prevents confirming header rows.
   */
  processOk()
  {
    // read the current command.
    const cmd = this.currentData();

    // if this is not an action row, buzz and do nothing.
    if (!cmd || (cmd.ext && cmd.ext.kind !== 'action'))
    {
      SoundManager.playBuzzer();
      return;
    }

    // defer to default behavior when actionable.
    super.processOk();
  }

  /**
   * Defines the standard handlers for OK/Cancel and Clear.
   */
  processHandling()
  {
    // perform super handling.
    super.processHandling();

    // handle clear binding when the delete-like key is pressed.
    if (this.isOpenAndActive())
    {
      // if the PageDown key was triggered, clear the binding.
      if (Input.isTriggered('pagedown')) this.callHandler('clear');
    }
  }

  //endregion handling

  //region utils
  /**
   * Finds the first actionable command index (skips headers).
   * @returns {number}
   */
  firstActionIndex()
  {
    // find the first index in the list that is enabled.
    for (let i = 0; i < this._list.length; i++)
    {
      // read the command at this index.
      const cmd = this._list[i];

      // if enabled, return this index.
      if (cmd && cmd.enabled !== false) return i;
    }

    // fallback to zero when none found.
    return 0;
  }

  /**
   * Converts a logical button key into a readable label.
   * @param {string} button The logical button key.
   * @returns {string}
   */
  humanizeButton(button)
  {
    // map known logical keys to nice labels.
    const map = {};
    map[JABS_Button.Mainhand] = 'Mainhand';
    map[JABS_Button.Offhand] = 'Offhand';
    map[JABS_Button.Tool] = 'Tool';
    map[JABS_Button.Dodge] = 'Dodge';

    // updated, descriptive labels for the four combat actions (not assignable here).
    map[JABS_Button.CombatSkill1] = 'Skill Trigger + Mainhand';
    map[JABS_Button.CombatSkill2] = 'Skill Trigger + Offhand';
    map[JABS_Button.CombatSkill3] = 'Skill Trigger + Dodge';
    map[JABS_Button.CombatSkill4] = 'Skill Trigger + Tool';

    // modifiers & mobility.
    map[JABS_Button.Sprint] = 'Sprint';
    map[JABS_Button.SkillTrigger] = 'Skill Trigger';
    map[JABS_Button.Strafe] = 'Strafe';
    map[JABS_Button.Rotate] = 'Rotate';
    map[JABS_Button.Guard] = 'Guard';

    // functionality.
    map[JABS_Button.Menu] = 'Menu';
    map[JABS_Button.Select] = 'Party Cycle';

    // return the translated label or the key if missing.
    return map[button] || button;
  }

  /**
   * Resolves an icon for a physical input symbol by consulting the IconManager.
   * Falls back to 0 (no icon) when unmapped.
   * @param {string} symbol The physical symbol to resolve an icon for.
   * @returns {number} The icon index to draw, or 0 if none.
   */
  iconIndexForSymbol(symbol)
  {
    // delegate to IconManager for a single icon index (or 0).
    return IconManager.jabsIconIndexForSymbol(symbol);
  }

  /**
   * Gets a human-readable description for a logical action or header.
   * @param {string} button The logical action key or header label.
   * @returns {string} The description text.
   */
  describeButton(button)
  {
    // provide descriptions for section headers when selected.
    if (button === 'Primary Actions')
    {
      // describe the purpose of primary actions.
      return 'Primary actions used moment-to-moment: mainhand/offhand attacks and tools.\n'
        + 'These are your core mapped buttons for direct, immediate use.';
    }

    // provide descriptions for section headers when selected.
    if (button === 'Secondary Actions')
    {
      // describe the purpose of secondary actions.
      return 'Secondary and modifier inputs: Skill Trigger, Rotate, Strafe, Dodge.\n'
        + 'Hold or tap to modify movement or enable combat skill slots.';
    }

    // provide descriptions for section headers when selected.
    if (button === 'Functional Actions')
    {
      // describe the purpose of functional actions.
      return 'Functional shortcuts unrelated to attacks: open the JABS menu, cycle party leader.\n'
        + 'Useful for management between encounters or to swap leaders on the fly.';
    }

    // a small dictionary of descriptions per logical action.
    const d = {};

    // functionality
    d[JABS_Button.Menu] = 'Open the JABS quick menu.\nAccess actions, tools, and options.';
    d[JABS_Button.Select] = 'Cycle the party leader.\nRotate the front actor with the next in line.';

    // primaries
    d[JABS_Button.Mainhand] = 'Use the mainhand action.\nTypically your basic weapon attack.';
    d[JABS_Button.Offhand] = 'Use the offhand action.\nTypically your secondary skill, or the guard-ready indicator.';
    d[JABS_Button.Tool] = 'Use the selected tool.\nExecutes the currently equipped tool skill.';
    d[JABS_Button.Sprint] = 'Sprint while held.\nMove faster when conditions allow.';

    // modifiers
    d[JABS_Button.Dodge] = 'Execute the mobility skill.\nLunge, backstep, tumble, or similar move.';
    d[JABS_Button.Strafe] = 'Hold facing while moving.\nLocks direction for circle-strafing.';
    d[JABS_Button.Rotate] = 'Rotate in place while held.\nIf you are guard-ready, you will also raise your guard.';
    d[JABS_Button.SkillTrigger] = 'Enable combat skills while held.\nPrimary actions become Combat skills 1-4.';

    // NOTE: this is not actually directly mappable- it arbitrarily shares input with rotation.
    d[JABS_Button.Guard] = 'Hold to raise guard (if guard skill is available).\nRaises guard skill when available.';

    // combat (L1 + face buttons)
    d[JABS_Button.CombatSkill1] = 'Trigger Combat Skill 1.\nUsed with the Skill Trigger modifier.';
    d[JABS_Button.CombatSkill2] = 'Trigger Combat Skill 2.\nUsed with the Skill Trigger modifier.';
    d[JABS_Button.CombatSkill3] = 'Trigger Combat Skill 3.\nUsed with the Skill Trigger modifier.';
    d[JABS_Button.CombatSkill4] = 'Trigger Combat Skill 4.\nUsed with the Skill Trigger modifier.';

    // fallback to the logical name if no description exists.
    return d[button] || String(button);
  }

  //endregion utils
}

//endregion Window_JabsRemapActions

//region Window_JabsRemapCommand
/**
 * Bottom command strip for Apply / Reset / Cancel.
 */
class Window_JabsRemapCommand
  extends Window_Command
{
  /**
   * @param {Rectangle} rect The rectangle to draw this window within.
   */
  constructor(rect)
  {
    // perform super initialize.
    super(rect);
  }

  /**
   * Gets the number of visible rows.
   * @returns {number}
   */
  numVisibleRows()
  {
    // render a single row.
    return 4;
  }

  /**
   * Defines the commands for this window.
   */
  makeCommandList()
  {
    // build the commands.
    const commands = this.buildCommands();

    // add the built commands.
    commands.forEach(this.addBuiltCommand, this);
  }

  /**
   * Builds the commands for this window.
   * @returns {BuiltWindowCommand[]}
   */
  buildCommands()
  {
    // build the "Apply" command.
    const apply = new WindowCommandBuilder('Apply current remapping')
      .setIconIndex(91)
      .setSymbol('apply')
      .setEnabled(true)
      .build();

    // build the "Reset to Defaults" command.
    const defaults = new WindowCommandBuilder('Reset to defaults')
      .setIconIndex(207)
      .setSymbol('defaults')
      .setEnabled(true)
      .build();

    // build the "Undo changes" command.
    const reset = new WindowCommandBuilder('Undo changes')
      .setIconIndex(74)
      .setSymbol('reset')
      .setEnabled(true)
      .build();

    // build the "Exit without saving" command.
    const cancel = new WindowCommandBuilder('Exit without saving')
      .setIconIndex(90)
      .setSymbol('cancel')
      .setEnabled(true)
      .build();

    return [ apply, defaults, reset, cancel ];
  }
}

//endregion Window_JabsRemapCommand

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
    // get curated symbols to poll.
    const symbols = this._curatedSymbols();

    // build a membership set for fast checks (also used for latest fallback).
    const allow = new Set(symbols);

    // define symbols we ignore during warmup to prevent instant-binding of UI controls.
    const uiSymbols = this._uiSymbols();

    // check the curated list first.
    for (let i = 0; i < symbols.length; i++)
    {
      // get the symbol at this index.
      const s = symbols[i];

      // if in warmup and this symbol is a UI symbol, skip it.
      if (this.getWarmupFrames() > 0 && uiSymbols.indexOf(s) >= 0)
      {
        continue;
      }

      // if this symbol was triggered, capture it.
      if (Input.isTriggered(s))
      {
        return s;
      }
    }

    // fallback: if nothing triggered, consider latest button if available and allowed.
    const latest = Input._latestButton;
    if (latest)
    {
      // require membership in curated set (no mouse) and allow if warmup permits UI symbols.
      const warmupBlocks = this.getWarmupFrames() > 0 && uiSymbols.indexOf(latest) >= 0;
      if (allow.has(latest) && warmupBlocks === false)
      {
        return latest;
      }
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
    const k = J.ABS.Input;

    // build the list using adapter constants.
    const inputs = [
      // face/core actions
      k.Mainhand, k.Offhand, k.Dash, k.Tool,

      // modifier/shoulder/trigger style
      k.SkillTrigger, k.GuardTrigger, k.StrafeTrigger, k.MobilitySkill,

      // utility
      k.PartyCycle, k.Quickmenu,
    ];

    // return the curated symbol list (duplicates are harmless but unlikely).
    return inputs;
  }

  /**
   * Gets the set of UI/navigation symbols ignored during warmup.
   * @returns {string[]}
   */
  _uiSymbols()
  {
    // inputs commonly used to operate UI, not to bind immediately during warmup.
    return [ 'ok', 'cancel', 'up', 'down', 'left', 'right', 'pageup', 'pagedown' ];
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
    const rebind = `${IconManager.jabsIconTextForSymbol('ok')} Rebind`;
    const clear = `${IconManager.jabsIconTextForSymbol(J.ABS.Input.GuardTrigger)} Clear Binding`;

    // draw each line using drawTextEx so icons render.
    this.drawTextEx(rebind, 0, this.lineHeight() * 0, this.contentsWidth());
    this.drawTextEx(clear, 0, this.lineHeight() * 1, this.contentsWidth());
  }
}

//endregion Window_JabsRemapUsageHelp

/**
 * Extends {@link #addOriginalCommands}.<br/>
 * Also adds a command to open the JABS input remapping scene from the main menu.
 */
J.ABS.EXT.INPUT.Aliased.Window_MenuCommand.set('addOriginalCommands', Window_MenuCommand.prototype.addOriginalCommands);
Window_MenuCommand.prototype.addOriginalCommands = function()
{
  // perform original logic.
  J.ABS.EXT.INPUT.Aliased.Window_MenuCommand.get('addOriginalCommands')
    .call(this);

  // if we cannot add the command, then do not.
  if (this.canAddJabsRemapCommand() === false) return;

  this.addJabsRemapCommand();
};

/**
 * Adds the JABS Controls command to the main menu.
 */
Window_MenuCommand.prototype.addJabsRemapCommand = function()
{
  // build the JABS remap command.
  const command = new WindowCommandBuilder('JABS Controls')
    .setSymbol('jabsRemap')
    .setIconIndex(2569)
    .setEnabled(true)
    .build();

  // determine what the last command is.
  const lastCommand = this._list.at(-1);

  // check if the last command is the "End Game" command.
  if (lastCommand.symbol === "gameEnd")
  {
    // add it before the "End Game" command.
    this._list.splice(this._list.length - 2, 0, command);
  }
  // the last command is something else.
  else
  {
    // just add it to the end.
    this.addBuiltCommand(command);
  }
};

/**
 * Determines whether or not the JABS Controls command can be added to the main menu.
 * @returns {boolean} True if the command should be added, false otherwise.
 */
Window_MenuCommand.prototype.canAddJabsRemapCommand = function()
{
  // if JABS is not present, then do not render this command.
  if (!J.ABS) return false;

  // render the command!
  return true;
};
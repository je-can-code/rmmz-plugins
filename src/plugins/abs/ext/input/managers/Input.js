//region Input
/**
 * The mappings of the gamepad descriptions to their buttons.
 */
J.ABS.Input = {};

//region input definitions

// this section of inputs is an attempt to align with the internal RMMZ mapping convention.
J.ABS.Input.DirUp = 'up';
J.ABS.Input.DirDown = 'down';
J.ABS.Input.DirLeft = 'left';
J.ABS.Input.DirRight = 'right';
J.ABS.Input.Mainhand = 'ok';
J.ABS.Input.Offhand = 'cancel';
J.ABS.Input.Dash = 'shift';
J.ABS.Input.Tool = 'tab';
J.ABS.Input.GuardTrigger = 'pagedown';
J.ABS.Input.SkillTrigger = 'pageup';

// this section of inputs are newly implemented.
J.ABS.Input.MobilitySkill = 'r2';
J.ABS.Input.StrafeTrigger = 'l2';
J.ABS.Input.Quickmenu = 'start';
J.ABS.Input.PartyCycle = 'select';
J.ABS.Input.Debug = 'cheat';

// for gamepads, these buttons are tracked, but aren't used by JABS right now.
J.ABS.Input.R3 = 'r3';
J.ABS.Input.L3 = 'l3';

// for dedicated D-pad shortcuts (not movement directions).
J.ABS.Input.DPadUp = 'dpad-up';
J.ABS.Input.DPadDown = 'dpad-down';
J.ABS.Input.DPadLeft = 'dpad-left';
J.ABS.Input.DPadRight = 'dpad-right';

// for keyboards, these buttons are for direct combatskill usage.
J.ABS.Input.CombatSkill1 = 'combat-skill-1';
J.ABS.Input.CombatSkill2 = 'combat-skill-2';
J.ABS.Input.CombatSkill3 = 'combat-skill-3';
J.ABS.Input.CombatSkill4 = 'combat-skill-4';
//endregion input definitions

/**
 * Extends the existing mapper for keyboards to accommodate for the
 * additional skill inputs that are used for gamepads.
 */
Input.keyMapper = {
  // define the original keyboard mapping.
  ...Input.keyMapper,

  // this is the new debug move-through for use with JABS.
  192: J.ABS.Input.Debug,       // ` (backtick)

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

/**
 * Overwrites gamepad button input to instead perform the various
 * actions that are expected in this ABS.
 *
 * This includes:
 * - D-Pad up, down, left, right
 * - A/kross, B/circle, X/square, Y/triangle
 * - L1/LB, R1/RB
 * - NEW: select/options, start/menu
 * - NEW: L2/LT, R2/RT
 * - NEW: L3/LSB, R3/RSB
 * - OVERWRITE: Y now is the tool button, and start is the menu.
 */
Input.gamepadMapper = {
  // action face buttons.
  0: J.ABS.Input.Mainhand,      // kross
  1: J.ABS.Input.Offhand,       // circle
  2: J.ABS.Input.Dash,          // square
  3: J.ABS.Input.Tool,          // triangle

  // shoulder/trigger buttons.
  4: J.ABS.Input.SkillTrigger,  // (L1) left bumper
  5: J.ABS.Input.GuardTrigger,  // (R1) right bumper
  6: J.ABS.Input.StrafeTrigger, // (L2) left trigger
  7: J.ABS.Input.MobilitySkill, // (R2) right trigger

  // meta/menu buttons.
  8: J.ABS.Input.PartyCycle,    // select
  9: J.ABS.Input.Quickmenu,     // start

  // stick-click buttons.
  10: J.ABS.Input.L3,           // (L3) left stick button
  11: J.ABS.Input.R3,           // (R3) right stick button

  // D-pad buttons remapped to dedicated shortcut symbols (not movement directions).
  12: J.ABS.Input.DPadUp,       // d-pad up (shortcut)
  13: J.ABS.Input.DPadDown,     // d-pad down (shortcut)
  14: J.ABS.Input.DPadLeft,     // d-pad left (shortcut)
  15: J.ABS.Input.DPadRight,    // d-pad right (shortcut)

  // the analog stick should be natively supported for movement.
};

// region registries

// Ensure a single bag for registry/bindings data on Input.
Input._jRegistries ||= {
  actions: Object.create(null),     // ns -> Array<action def>
  symbolLabels: Object.create(null),// symbol -> label
  capture: new Set(),               // Set<string>
  bindings: Object.create(null),    // ns -> { key: string[] }
  defaults: Object.create(null),    // ns -> { key: string[] }
  bootstrapped: false,              // idempotency flag
};

/**
 * Registers a logical action under a namespace for remapping.
 * @param {string} ns The namespace (e.g., "JABS", "HUD", "MINIMAP").
 * @param {object} def The action definition.
 * @param {string} def.key The logical action key (unique within ns).
 * @param {string} def.label The friendly label shown in UIs.
 * @param {string[]} [def.defaults] Optional default physical symbols.
 * @param {string} [def.category] Optional category label.
 */
Input.registerAction = function(ns, def)
{
  // Coerce shapes.
  if (!ns || !def || !def.key) return;

  // Initialize namespace list for actions.
  const bag = Input._jRegistries.actions;
  bag[ns] = bag[ns] || [];

  // Push normalized action def.
  bag[ns].push({
    key: String(def.key),
    label: String(def.label || def.key),
    defaults: Array.isArray(def.defaults)
      ? def.defaults.slice()
      : [],
    category: String(def.category || 'misc'),
  });
};

/**
 * Gets the registered logical actions for a namespace.
 * @param {string} ns The namespace.
 * @returns {Array<{key:string,label:string,defaults:string[],category:string}>}
 */
Input.getRegisteredActions = function(ns)
{
  const bag = Input._jRegistries.actions;
  const list = bag[ns] || [];
  return list.slice();
};

/**
 * Seeds the default physical bindings for a namespace in bulk.
 * Does not override live bindings; use resetBindingsToDefaults() to re-apply.
 * @param {string} ns The namespace.
 * @param {Object<string, string[]>} defaults Map of key -> physical symbols.
 */
Input.seedDefaultBindings = function(ns, defaults)
{
  if (!ns || !defaults) return;
  const out = Object.create(null);
  const keys = Object.keys(defaults);
  for (let i = 0; i < keys.length; i++)
  {
    const k = keys[i];
    out[k] = Array.isArray(defaults[k])
      ? defaults[k].slice()
      : [];
  }
  Input._jRegistries.defaults[ns] = out;
};

/**
 * Gets the live bindings (logical -> physical[]) for a namespace.
 * If empty, returns a lazily-initialized copy of the defaults.
 * @param {string} ns The namespace.
 * @returns {Object<string, string[]>}
 */
Input.getAllBindings = function(ns)
{
  const b = Input._jRegistries.bindings;
  if (!b[ns])
  {
    // Lazy-init from defaults so querying works before any remaps are saved.
    const d = Input._jRegistries.defaults[ns] || Object.create(null);
    const clone = Object.create(null);
    const keys = Object.keys(d);
    for (let i = 0; i < keys.length; i++)
    {
      const k = keys[i];
      clone[k] = d[k].slice();
    }
    b[ns] = clone;
  }
  return b[ns];
};

/**
 * Gets the bound physical symbols for a single logical key.
 * @param {string} ns The namespace.
 * @param {string} key The logical action key.
 * @returns {string[]} Array of physical symbols (may be empty).
 */
Input.getBindings = function(ns, key)
{
  const all = Input.getAllBindings(ns);
  const arr = all[key];
  return Array.isArray(arr)
    ? arr
    : [];
};

/**
 * Overwrites the bound physical symbols for a single logical key.
 * @param {string} ns The namespace.
 * @param {string} key The logical action key.
 * @param {string[]} physical Array of physical symbols.
 */
Input.setBindings = function(ns, key, physical)
{
  const all = Input.getAllBindings(ns);
  all[key] = Array.isArray(physical)
    ? physical.slice()
    : [];
};

/**
 * Resets a namespace’s live bindings back to the seeded defaults.
 * @param {string} ns The namespace.
 */
Input.resetBindingsToDefaults = function(ns)
{
  const d = Input._jRegistries.defaults[ns] || Object.create(null);
  const clone = Object.create(null);
  const keys = Object.keys(d);
  for (let i = 0; i < keys.length; i++)
  {
    const k = keys[i];
    clone[k] = d[k].slice();
  }
  Input._jRegistries.bindings[ns] = clone;
};

/**
 * Determines if any physical input bound to the logical action is triggered this frame.
 * @param {string} ns The namespace.
 * @param {string} key The logical action key.
 * @returns {boolean}
 */
Input.isActionTriggered = function(ns, key)
{
  const inputs = Input.getBindings(ns, key);
  for (let i = 0; i < inputs.length; i++)
  {
    const physical = inputs[i];
    if (Input.isTriggered(physical)) return true;
  }
  return false;
};

/**
 * Determines if any physical input bound to the logical action is currently pressed.
 * @param {string} ns The namespace.
 * @param {string} key The logical action key.
 * @returns {boolean}
 */
Input.isActionPressed = function(ns, key)
{
  const inputs = Input.getBindings(ns, key);
  for (let i = 0; i < inputs.length; i++)
  {
    const physical = inputs[i];
    if (Input.isPressed(physical)) return true;
  }
  return false;
};

/**
 * Registers a friendly label for a physical input symbol.
 * @param {string} symbol The physical symbol (e.g., 'dpad-up').
 * @param {string} label The friendly label (e.g., 'D-Pad Up').
 */
Input.registerSymbolLabel = function(symbol, label)
{
  Input._jRegistries.symbolLabels[String(symbol)] = String(label || symbol);
};

/**
 * Resolves a friendly label for a physical input symbol.
 * @param {string} symbol The physical symbol.
 * @returns {string}
 */
Input.labelForSymbol = function(symbol)
{
  const labels = Input._jRegistries.symbolLabels;
  const key = String(symbol);
  return labels[key] || key;
};

/**
 * Registers a physical symbol as eligible for capture by the remap prompt.
 * @param {string} symbol The symbol to allow.
 */
Input.registerRemapCaptureSymbol = function(symbol)
{
  Input._jRegistries.capture.add(String(symbol));
};

/**
 * Gets all extra capture-eligible symbols registered by plugins.
 * @returns {string[]}
 */
Input.getRemapCaptureSymbols = function()
{
  return Array.from(Input._jRegistries.capture);
};

/**
 * Idempotent bootstrap for remap defaults and symbol labels.
 * Should be called from DataManager.createGameObjects() on boot/load.
 */
Input.ensureRemapBootstrapped = function()
{
  if (Input._jRegistries.bootstrapped === true)
  {
    return; // already bootstrapped for this session
  }

  // Seed JABS defaults (logical actions -> physical symbols).
  const d = {};
  d[JABS_Button.Menu] = [ J.ABS.Input.Quickmenu ];
  d[JABS_Button.Select] = [ J.ABS.Input.PartyCycle ];
  d[JABS_Button.Mainhand] = [ J.ABS.Input.Mainhand ];
  d[JABS_Button.Offhand] = [ J.ABS.Input.Offhand ];
  d[JABS_Button.Tool] = [ J.ABS.Input.Tool ];
  d[JABS_Button.Dodge] = [ J.ABS.Input.MobilitySkill ];
  d[JABS_Button.Sprint] = [ J.ABS.Input.Dash ];
  d[JABS_Button.Strafe] = [ J.ABS.Input.StrafeTrigger ];
  d[JABS_Button.Rotate] = [ J.ABS.Input.GuardTrigger ];
  d[JABS_Button.Guard] = [ J.ABS.Input.GuardTrigger ];
  d[JABS_Button.SkillTrigger] = [ J.ABS.Input.SkillTrigger ];
  d[JABS_Button.CombatSkill1] = [ J.ABS.Input.CombatSkill1 ];
  d[JABS_Button.CombatSkill2] = [ J.ABS.Input.CombatSkill2 ];
  d[JABS_Button.CombatSkill3] = [ J.ABS.Input.CombatSkill3 ];
  d[JABS_Button.CombatSkill4] = [ J.ABS.Input.CombatSkill4 ];

  Input.seedDefaultBindings('JABS', d);
  Input.getAllBindings('JABS'); // lazy-init live bindings

  // Optional: friendly labels for some common symbols.
  Input.registerSymbolLabel(J.ABS.Input.L3, 'L3');
  Input.registerSymbolLabel(J.ABS.Input.R3, 'R3');
  Input.registerSymbolLabel(J.ABS.Input.MobilitySkill, 'R2');

  // Allow these symbols to be captured in the prompt if desired.
  Input.registerRemapCaptureSymbol(J.ABS.Input.L3);
  Input.registerRemapCaptureSymbol(J.ABS.Input.R3);

  // Mark as bootstrapped for this runtime session.
  Input._jRegistries.bootstrapped = true;
};

/**
 * Adjustable stick axis threshold (deadzone) for converting axes → directions.
 * Lower this if your controller’s axes don’t reach ±1.0. Default 0.50.
 * @type {number}
 */
Input._axisThreshold = 0.5;

/**
 * Sets the analog stick threshold.
 * @param {number} v The new threshold (0.05–0.90 recommended).
 */
Input.setAxisThreshold = function(v)
{
  // constrain a bit to avoid nonsense values.
  const n = Number(v);
  if (!isNaN(n) && n > 0 && n < 1)
  {
    Input._axisThreshold = n;
  }
};

/**
 * OVERWRITE-ALIAS Extends gamepad processing to reinforce directions from axes
 * using a configurable threshold, without disabling vanilla behavior.
 * Ensures mutual exclusivity and proper clearing when axes return to neutral.
 * Also writes results to the per-pad state, then rebuilds the merged state as
 * (keyboardApprox OR currentGamepadAxes) so keyboard arrows are preserved while
 * stick clears. Includes optional diagnostic logging when enabled.
 * @param {Gamepad} gamepad The gamepad polled from navigator.getGamepads().
 */
J.ABS.EXT.INPUT.Aliased.Input.set('_updateGamepadState', Input._updateGamepadState);
Input._updateGamepadState = function(gamepad)
{
  // perform original logic first (creates newState and updates _currentState/_gamepadStates).
  J.ABS.EXT.INPUT.Aliased.Input
    .get('_updateGamepadState')
    .call(this, gamepad);

  // if no pad, nothing further to do.
  if (!gamepad)
  {
    return;
  }

  // ensure we have the merged current state bag and per-pad state.
  const s = this._currentState;
  const padState = this._gamepadStates && typeof gamepad.index === 'number'
    ? this._gamepadStates[gamepad.index]
    : null;
  if (!s || !padState)
  {
    return;
  }

  // --- D-Pad normalization: force dpad-* to match raw buttons 12..15 exactly ---
  const dpu = !!(gamepad.buttons && gamepad.buttons[12] && gamepad.buttons[12].pressed);
  const dpd = !!(gamepad.buttons && gamepad.buttons[13] && gamepad.buttons[13].pressed);
  const dpl = !!(gamepad.buttons && gamepad.buttons[14] && gamepad.buttons[14].pressed);
  const dpr = !!(gamepad.buttons && gamepad.buttons[15] && gamepad.buttons[15].pressed);

  // Overwrite merged & per-pad strictly from raw dpad buttons.
  s['dpad-up'] = dpu;
  padState['dpad-up'] = dpu;
  s['dpad-down'] = dpd;
  padState['dpad-down'] = dpd;
  s['dpad-left'] = dpl;
  padState['dpad-left'] = dpl;
  s['dpad-right'] = dpr;
  padState['dpad-right'] = dpr;

  // If no axes array, stop after D-pad normalization.
  if (!gamepad.axes || gamepad.axes.length < 2)
  {
    return;
  }

  // --- Capture last frame’s axes contribution and the current merged snapshot ---
  const prevAxes = Input._axesStamp || {
    up: false,
    down: false,
    left: false,
    right: false
  };
  const s0_up = !!s.up;
  const s0_down = !!s.down;
  const s0_left = !!s.left;
  const s0_right = !!s.right;

  // --- analog stick threshold assist (mutually-exclusive in per-pad) ---
  const ax = gamepad.axes[0] || 0; // X (left/right)
  const ay = gamepad.axes[1] || 0; // Y (up/down)
  const t = Input._axisThreshold;

  // resolve horizontal direction.
  const holdLeft = ax <= -t;
  const holdRight = ax >= t;
  const neutralX = !holdLeft && !holdRight;

  // resolve vertical direction.
  const holdUp = ay <= -t;
  const holdDown = ay >= t;
  const neutralY = !holdUp && !holdDown;

  // apply to per-pad state (mutual exclusivity + neutral clearing).
  if (holdLeft)
  {
    padState.left = true;
    padState.right = false;
  }
  else if (holdRight)
  {
    padState.right = true;
    padState.left = false;
  }
  else if (neutralX)
  {
    padState.left = false;
    padState.right = false;
  }

  if (holdUp)
  {
    padState.up = true;
    padState.down = false;
  }
  else if (holdDown)
  {
    padState.down = true;
    padState.up = false;
  }
  else if (neutralY)
  {
    padState.up = false;
    padState.down = false;
  }

  // --- Current axes contribution (from our per-pad resolution this frame) ---
  const axesNow = {
    up: padState.up === true,
    down: padState.down === true,
    left: padState.left === true,
    right: padState.right === true,
  };

  // --- Approximate keyboard-only contribution from previous merged state ---
  // If merged had it last frame AND it wasn’t set by axes last frame, treat as keyboard.
  const kbdApprox = {
    up: s0_up && (prevAxes.up === false),
    down: s0_down && (prevAxes.down === false),
    left: s0_left && (prevAxes.left === false),
    right: s0_right && (prevAxes.right === false),
  };

  // --- Rebuild merged state as (keyboardApprox OR currentGamepadAxes) ---
  s.up = (kbdApprox.up === true) || (axesNow.up === true);
  s.down = (kbdApprox.down === true) || (axesNow.down === true);
  s.left = (kbdApprox.left === true) || (axesNow.left === true);
  s.right = (kbdApprox.right === true) || (axesNow.right === true);

  // --- Update our stamp for next frame’s separation logic ---
  Input._axesStamp = axesNow;

  // --- optional compact diagnostic (unchanged), if enabled ---
  if (Input._diagEnabled)
  {
    const idx = typeof gamepad.index === 'number'
      ? gamepad.index
      : 0;
    const map = gamepad.mapping || '';
    const sDpd = s['dpad-down']
      ? 1
      : 0;
    const sDn = s.down
      ? 1
      : 0;
    console.log(
      `[Pad${idx} ${map === 'standard'
        ? 'std'
        : 'ns'}] ` +
      `ax=${ax.toFixed(2)} ay=${ay.toFixed(2)} ` +
      `b12=${dpu
        ? 1
        : 0} b13=${dpd
        ? 1
        : 0} b14=${dpl
        ? 1
        : 0} b15=${dpr
        ? 1
        : 0} | ` +
      `sym down=${sDn} dpad-down=${sDpd}`
    );
  }
};

//endregion registries
//endregion Input
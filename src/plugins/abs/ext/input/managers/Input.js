//region Input
/**
 * The mappings of the gamepad descriptions to their buttons.
 */
J.ABS.EXT.INPUT.Symbols = {};

//region input definitions

// this section of inputs is an attempt to align with the internal RMMZ mapping convention.
J.ABS.EXT.INPUT.Symbols.DirUp = 'up';
J.ABS.EXT.INPUT.Symbols.DirDown = 'down';
J.ABS.EXT.INPUT.Symbols.DirLeft = 'left';
J.ABS.EXT.INPUT.Symbols.DirRight = 'right';
J.ABS.EXT.INPUT.Symbols.Mainhand = 'ok';
J.ABS.EXT.INPUT.Symbols.Offhand = 'cancel';
J.ABS.EXT.INPUT.Symbols.Dash = 'shift';
J.ABS.EXT.INPUT.Symbols.Tool = 'tab';
J.ABS.EXT.INPUT.Symbols.GuardTrigger = 'pagedown';
J.ABS.EXT.INPUT.Symbols.SkillTrigger = 'pageup';

// this section of inputs are newly implemented.
J.ABS.EXT.INPUT.Symbols.MobilitySkill = 'r2';
J.ABS.EXT.INPUT.Symbols.StrafeTrigger = 'l2';
J.ABS.EXT.INPUT.Symbols.Quickmenu = 'start';
J.ABS.EXT.INPUT.Symbols.PartyCycle = 'select';
J.ABS.EXT.INPUT.Symbols.Debug = 'cheat';

// for gamepads, these buttons are tracked, but aren't used by JABS right now.
J.ABS.EXT.INPUT.Symbols.R3 = 'r3';
J.ABS.EXT.INPUT.Symbols.L3 = 'l3';

// for dedicated D-pad shortcuts (not movement directions).
J.ABS.EXT.INPUT.Symbols.DPadUp = 'dpad-up';
J.ABS.EXT.INPUT.Symbols.DPadDown = 'dpad-down';
J.ABS.EXT.INPUT.Symbols.DPadLeft = 'dpad-left';
J.ABS.EXT.INPUT.Symbols.DPadRight = 'dpad-right';

// for keyboards, these buttons are for direct combatskill usage.
J.ABS.EXT.INPUT.Symbols.CombatSkill1 = 'combat-skill-1';
J.ABS.EXT.INPUT.Symbols.CombatSkill2 = 'combat-skill-2';
J.ABS.EXT.INPUT.Symbols.CombatSkill3 = 'combat-skill-3';
J.ABS.EXT.INPUT.Symbols.CombatSkill4 = 'combat-skill-4';
//endregion input definitions

/**
 * Extends the existing mapper for keyboards to accommodate for the
 * additional skill inputs that are used for gamepads.
 */
Input.keyMapper = {
  // define the original keyboard mapping.
  ...Input.keyMapper,

  // this is the new debug move-through for use with JABS.
  // ` (backtick).
  192: J.ABS.EXT.INPUT.Symbols.Debug,

  // core buttons.
  // z.
  90: J.ABS.EXT.INPUT.Symbols.Mainhand,
  // x.
  88: J.ABS.EXT.INPUT.Symbols.Offhand,
  // shift (already defined).
  16: J.ABS.EXT.INPUT.Symbols.Dash,
  // c.
  67: J.ABS.EXT.INPUT.Symbols.Tool,

  // functional buttons.
  // q.
  81: J.ABS.EXT.INPUT.Symbols.SkillTrigger,
  // ctrl.
  17: J.ABS.EXT.INPUT.Symbols.StrafeTrigger,
  // e.
  69: J.ABS.EXT.INPUT.Symbols.GuardTrigger,
  // tab.
  9: J.ABS.EXT.INPUT.Symbols.MobilitySkill,

  // quickmenu button.
  // enter.
  13: J.ABS.EXT.INPUT.Symbols.Quickmenu,

  // party cycling button.
  // del.
  46: J.ABS.EXT.INPUT.Symbols.PartyCycle,

  // movement buttons.
  // arrow up.
  38: J.ABS.EXT.INPUT.Symbols.DirUp,
  // arrow down.
  40: J.ABS.EXT.INPUT.Symbols.DirDown,
  // arrow left.
  37: J.ABS.EXT.INPUT.Symbols.DirLeft,
  // arrow right.
  39: J.ABS.EXT.INPUT.Symbols.DirRight,

  // keyboard alternative for the multi-button skills.
  // 1 = L1 + cross.
  49: J.ABS.EXT.INPUT.Symbols.CombatSkill1,
  // 2 = L1 + circle.
  50: J.ABS.EXT.INPUT.Symbols.CombatSkill2,
  // 3 = L1 + square.
  51: J.ABS.EXT.INPUT.Symbols.CombatSkill3,
  // 4 = L1 + triangle.
  52: J.ABS.EXT.INPUT.Symbols.CombatSkill4,
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
  // kross.
  0: J.ABS.EXT.INPUT.Symbols.Mainhand,
  // circle.
  1: J.ABS.EXT.INPUT.Symbols.Offhand,
  // square.
  2: J.ABS.EXT.INPUT.Symbols.Dash,
  // triangle.
  3: J.ABS.EXT.INPUT.Symbols.Tool,

  // shoulder/trigger buttons.
  // (L1) left bumper.
  4: J.ABS.EXT.INPUT.Symbols.SkillTrigger,
  // (R1) right bumper.
  5: J.ABS.EXT.INPUT.Symbols.GuardTrigger,
  // (L2) left trigger.
  6: J.ABS.EXT.INPUT.Symbols.StrafeTrigger,
  // (R2) right trigger.
  7: J.ABS.EXT.INPUT.Symbols.MobilitySkill,

  // meta/menu buttons.
  // select.
  8: J.ABS.EXT.INPUT.Symbols.PartyCycle,
  // start.
  9: J.ABS.EXT.INPUT.Symbols.Quickmenu,

  // stick-click buttons.
  // (L3) left stick button.
  10: J.ABS.EXT.INPUT.Symbols.L3,
  // (R3) right stick button.
  11: J.ABS.EXT.INPUT.Symbols.R3,

  // D-pad buttons remapped to dedicated shortcut symbols (not movement directions).
  // d-pad up (shortcut).
  12: J.ABS.EXT.INPUT.Symbols.DPadUp,
  // d-pad down (shortcut).
  13: J.ABS.EXT.INPUT.Symbols.DPadDown,
  // d-pad left (shortcut).
  14: J.ABS.EXT.INPUT.Symbols.DPadLeft,
  // d-pad right (shortcut).
  15: J.ABS.EXT.INPUT.Symbols.DPadRight,

  // the analog stick should be natively supported for movement.
};

//region registries

// Ensure a single bag for registry/bindings data on Input.
Input._jRegistries ||= {
  // ns -> Array<action def>.
  actions: Object.create(null),
  // symbol -> label.
  symbolLabels: Object.create(null),
  // set<string>.
  capture: new Set(),
  // ns -> { key: string[] }.
  bindings: Object.create(null),
  // ns -> { key: string[] }.
  defaults: Object.create(null),
  // idempotency flag.
  bootstrapped: false,
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
  // if already bootstrapped for this session, do nothing.
  if (Input._jRegistries.bootstrapped === true)
  {
    return;
  }

  // Seed JABS defaults (logical actions -> physical symbols).
  const d = {};

  // functionality
  d[JABS_Button.Menu] = [ J.ABS.EXT.INPUT.Symbols.Quickmenu ];
  d[JABS_Button.Select] = [ J.ABS.EXT.INPUT.Symbols.PartyCycle ];

  // primary actions
  d[JABS_Button.Mainhand] = [ J.ABS.EXT.INPUT.Symbols.Mainhand ];
  d[JABS_Button.Offhand] = [ J.ABS.EXT.INPUT.Symbols.Offhand ];
  d[JABS_Button.Tool] = [ J.ABS.EXT.INPUT.Symbols.Tool ];

  // mobility & modifiers
  // IMPORTANT: No default binding for Dodge; Sprint handles mobility contextually.
  // d[JABS_Button.Dodge] is intentionally omitted.
  d[JABS_Button.Sprint] = [ J.ABS.EXT.INPUT.Symbols.Dash ];
  d[JABS_Button.Strafe] = [ J.ABS.EXT.INPUT.Symbols.StrafeTrigger ];
  d[JABS_Button.Rotate] = [ J.ABS.EXT.INPUT.Symbols.GuardTrigger ];
  d[JABS_Button.Guard] = [ J.ABS.EXT.INPUT.Symbols.GuardTrigger ];
  d[JABS_Button.SkillTrigger] = [ J.ABS.EXT.INPUT.Symbols.SkillTrigger ];

  // L1 + buttons (keyboard shortcuts available separately)
  d[JABS_Button.CombatSkill1] = [ J.ABS.EXT.INPUT.Symbols.CombatSkill1 ];
  d[JABS_Button.CombatSkill2] = [ J.ABS.EXT.INPUT.Symbols.CombatSkill2 ];
  d[JABS_Button.CombatSkill3] = [ J.ABS.EXT.INPUT.Symbols.CombatSkill3 ];
  d[JABS_Button.CombatSkill4] = [ J.ABS.EXT.INPUT.Symbols.CombatSkill4 ];

  // register the defaults and ensure live bindings are initialized.
  Input.seedDefaultBindings('JABS', d);
  Input.getAllBindings('JABS');

  // friendly labels for some common symbols.
  Input.registerSymbolLabel(J.ABS.EXT.INPUT.Symbols.L3, 'L3');
  Input.registerSymbolLabel(J.ABS.EXT.INPUT.Symbols.R3, 'R3');
  Input.registerSymbolLabel(J.ABS.EXT.INPUT.Symbols.MobilitySkill, 'R2');
  Input.registerSymbolLabel(J.ABS.EXT.INPUT.Symbols.DPadUp, 'D-Pad Up');
  Input.registerSymbolLabel(J.ABS.EXT.INPUT.Symbols.DPadDown, 'D-Pad Down');
  Input.registerSymbolLabel(J.ABS.EXT.INPUT.Symbols.DPadLeft, 'D-Pad Left');
  Input.registerSymbolLabel(J.ABS.EXT.INPUT.Symbols.DPadRight, 'D-Pad Right');

  // allow these symbols to be captured in the prompt if desired.
  Input.registerRemapCaptureSymbol(J.ABS.EXT.INPUT.Symbols.L3);
  Input.registerRemapCaptureSymbol(J.ABS.EXT.INPUT.Symbols.R3);
  Input.registerRemapCaptureSymbol(J.ABS.EXT.INPUT.Symbols.DPadUp);
  Input.registerRemapCaptureSymbol(J.ABS.EXT.INPUT.Symbols.DPadDown);
  Input.registerRemapCaptureSymbol(J.ABS.EXT.INPUT.Symbols.DPadLeft);
  Input.registerRemapCaptureSymbol(J.ABS.EXT.INPUT.Symbols.DPadRight);

  // expose all non-engine keyboard keys for capture/binding.
  Input.bootstrapAllKeyboardKeysForCapture();

  // mark as bootstrapped for this runtime session.
  Input._jRegistries.bootstrapped = true;
};

/**
 * Generates capture-eligible symbols for any keyboard keycodes that are not
 * already mapped to core RMMZ symbols, and registers readable labels for them.
 */
Input.bootstrapAllKeyboardKeysForCapture = function()
{
  // collect a snapshot of engine/core-reserved symbols to avoid overriding them.
  const reserved = new Set([
    // core engine actions and directions.
    'ok', 'cancel', 'menu', 'escape', 'tab', 'pageup', 'pagedown', 'shift', 'control', 'up', 'down', 'left', 'right',
  ]);

  // also consider whatever the current keyMapper already resolves to.
  const existingMap = Object.assign({}, Input.keyMapper);
  Object.keys(existingMap)
    .forEach(code =>
    {
      // read the mapped symbol for this code.
      const sym = existingMap[code];

      // if mapped to a core-like word, add to the reserved set for safety.
      if (typeof sym === 'string' && sym.length)
      {
        reserved.add(sym);
      }
    });

  // iterate a reasonable range of DOM KeyboardEvent.keyCode values.
  for (let code = 8; code <= 222; code++)
  {
    // never capture or map blacklisted keycodes (Function keys, etc.).
    if (Input._isBlacklistedKeycode(code))
    {
      continue;
    }

    // if the engine already has a mapping for this keycode, leave it alone.
    if (Object.prototype.hasOwnProperty.call(Input.keyMapper, code))
    {
      // still allow capture if it is NOT a reserved symbol and NOT blacklisted.
      const s = Input.keyMapper[code];
      if (s && reserved.has(s) === false)
      {
        // register this existing non-engine symbol for the prompt & label.
        Input.registerRemapCaptureSymbol(s);
        Input.registerSymbolLabel(s, Input._keycodeLabelFor(code, s));
      }
      continue;
    }

    // create a stable unique symbol for this unmapped keycode.
    const symbol = `key-${code}`;

    // define a keyboard mapping so Input can detect presses for this key.
    Input.keyMapper[code] = symbol;

    // allow the capture prompt to consider this symbol.
    Input.registerRemapCaptureSymbol(symbol);

    // provide a human-friendly label for the remap UI.
    Input.registerSymbolLabel(symbol, Input._keycodeLabelFor(code, symbol));
  }
};

/**
 * Determines if a keycode should be excluded from capture/mapping.
 * Currently blacklists Function keys to avoid conflicts with RMMZ/NW.js.
 *
 * @param {number} code The keycode to evaluate.
 * @returns {boolean} True if blacklisted; false otherwise.
 */
Input._isBlacklistedKeycode = function(code)
{
  // F1–F12 are 112–123.
  if (code >= 112 && code <= 123)
  {
    return true;
  }

  // Some platforms expose F13–F24 as 124–135; exclude those as well for safety.
  if (code >= 124 && code <= 135)
  {
    return true;
  }

  // allow all other keys.
  return false;
};

/**
 * Resolves a display label for a given keycode.
 * Falls back to the symbol if not recognized.
 * @param {number} code The keyboard keycode (8..222 range typically).
 * @param {string} fallback The fallback label when unknown.
 * @returns {string}
 */
// eslint-disable-next-line complexity
Input._keycodeLabelFor = function(code, fallback)
{
  // A–Z
  if (code >= 65 && code <= 90)
  {
    // convert 65->A, 66->B, etc.
    return String.fromCharCode(code);
  }

  // 0–9 (top row)
  if (code >= 48 && code <= 57)
  {
    return String(code - 48);
  }

  // Numpad 0–9
  if (code >= 96 && code <= 105)
  {
    return `Num ${code - 96}`;
  }

  // Function keys F1–F12
  if (code >= 112 && code <= 123)
  {
    return `F${code - 111}`;
  }

  // Common punctuation and special keys.
  switch (code)
  {
    case 8:
      return 'Backspace';
    case 9:
      return 'Tab';
    case 13:
      return 'Enter';
    case 16:
      return 'Shift';
    case 17:
      return 'Ctrl';
    case 18:
      return 'Alt';
    case 19:
      return 'Pause';
    case 20:
      return 'CapsLock';
    case 27:
      return 'Esc';
    case 32:
      return 'Space';
    case 33:
      return 'PageUp';
    case 34:
      return 'PageDown';
    case 35:
      return 'End';
    case 36:
      return 'Home';
    case 37:
      return 'Left';
    case 38:
      return 'Up';
    case 39:
      return 'Right';
    case 40:
      return 'Down';
    case 45:
      return 'Insert';
    case 46:
      return 'Delete';
    case 91:
      return 'Meta';
    case 93:
      return 'Context';
    case 106:
      return 'Num *';
    case 107:
      return 'Num +';
    case 109:
      return 'Num -';
    case 110:
      return 'Num .';
    case 111:
      return 'Num /';
    case 186:
      return '; :';
    case 187:
      return '= +';
    case 188:
      return ', <';
    case 189:
      return '- _';
    case 190:
      return '. >';
    case 191:
      return '/ ?';
    case 192:
      return '` ~';
    case 219:
      return '[ {';
    case 220:
      return '\\ |';
    case 221:
      return '] }';
    case 222:
      return '\' "';
  }

  // fallback to the provided symbol when unknown.
  return String(fallback || `Key ${code}`);
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
  // perform original engine logic first.
  J.ABS.EXT.INPUT.Aliased.Input
    .get('_updateGamepadState')
    .call(this, gamepad);

  // if there is no pad, there is nothing further to do this frame.
  if (!gamepad)
  {
    return;
  }

  // ensure we have both state bags; bail if missing.
  const ensured = Input._ensurePadStates(gamepad);
  if (!ensured)
  {
    return;
  }

  // unpack the state bags for readability.
  const { s } = ensured;
  const { padState } = ensured;

  // 1) Normalize D-pad strictly from raw buttons 12..15.
  Input._normalizeDpadFromButtons(gamepad, s, padState);

  // if there are no axes to process, stop here after D-pad normalization.
  if (!gamepad.axes || gamepad.axes.length < 2)
  {
    return;
  }

  // 2) Capture the merged snapshot BEFORE axis processing (for keyboard approx).
  const s0 = Input._snapshotMergedDirections(s);

  // 3) Resolve axis flags from the left stick.
  const flags = Input._resolveAxesFlags(gamepad);

  // 4) Apply axis flags to the per-pad snapshot with mutual exclusivity + neutral clearing.
  Input._applyAxesToPerPad(padState, flags);

  // 5) Compute current axes contribution from the per-pad snapshot.
  const axesNow = Input._axesNowFromPadState(padState);

  // 6) Derive keyboard-only approximation using last merged-vs-axes stamp.
  const prevAxes = Input._axesStamp || {
    up: false,
    down: false,
    left: false,
    right: false,
  };
  const kbdApprox = Input._keyboardApproxFromSnapshot(s0, prevAxes);

  // 7) Rebuild merged directions as (keyboardApprox OR current axes).
  Input._rebuildMergedDirections(s, kbdApprox, axesNow);

  // 8) Update the axes stamp for next frame's separation logic.
  Input._axesStamp = axesNow;
};

/**
 * Ensures we have both the merged current state bag and the per-pad snapshot.
 * @param {Gamepad} gamepad The polled gamepad.
 * @returns {{ s: object, padState: object }|null}
 */
Input._ensurePadStates = function(gamepad)
{
  // read the merged state for this frame.
  const s = this._currentState;

  // resolve the per-pad state snapshot for this index.
  const padState = this._gamepadStates && typeof gamepad.index === 'number'
    ? this._gamepadStates[gamepad.index]
    : null;

  // if either is missing, we cannot proceed.
  if (!s || !padState)
  {
    return null;
  }

  // provide both state bags to the caller.
  return {
    s,
    padState
  };
};

/**
 * Normalizes the four D-pad symbols strictly from raw buttons 12..15.
 * Writes into both merged current state and per-pad snapshot.
 * @param {Gamepad} gamepad The polled gamepad.
 * @param {object} s The merged current state bag.
 * @param {object} padState The per-pad snapshot for this device.
 */
Input._normalizeDpadFromButtons = function(gamepad, s, padState)
{
  // coerce D-pad buttons to booleans from the raw Gamepad API.
  const dpu = !!(gamepad.buttons && gamepad.buttons[12] && gamepad.buttons[12].pressed);
  const dpd = !!(gamepad.buttons && gamepad.buttons[13] && gamepad.buttons[13].pressed);
  const dpl = !!(gamepad.buttons && gamepad.buttons[14] && gamepad.buttons[14].pressed);
  const dpr = !!(gamepad.buttons && gamepad.buttons[15] && gamepad.buttons[15].pressed);

  // write merged state for D-pad symbols.
  s['dpad-up'] = dpu;
  s['dpad-down'] = dpd;
  s['dpad-left'] = dpl;
  s['dpad-right'] = dpr;

  // mirror into per-pad snapshot for edge/trigger bookkeeping.
  padState['dpad-up'] = dpu;
  padState['dpad-down'] = dpd;
  padState['dpad-left'] = dpl;
  padState['dpad-right'] = dpr;
};

/**
 * Captures the current merged cardinal directions into a plain object.
 * @param {object} s The merged current state bag.
 * @returns {{up:boolean,down:boolean,left:boolean,right:boolean}}
 */
Input._snapshotMergedDirections = function(s)
{
  // build a simple snapshot of current merged directions.
  return {
    up: !!s.up,
    down: !!s.down,
    left: !!s.left,
    right: !!s.right,
  };
};

/**
 * Resolves axis flags from the left stick using the configured threshold.
 * @param {Gamepad} gamepad The polled gamepad.
 */
Input._resolveAxesFlags = function(gamepad)
{
  // read the two primary axes.
  const ax = gamepad.axes && gamepad.axes.length > 0
    ? (gamepad.axes[0] || 0)
    : 0;
  const ay = gamepad.axes && gamepad.axes.length > 1
    ? (gamepad.axes[1] || 0)
    : 0;

  // apply the configured threshold to derive flags.
  const t = Input._axisThreshold;
  const holdLeft = ax <= -t;
  const holdRight = ax >= t;
  const neutralX = !holdLeft && !holdRight;
  const holdUp = ay <= -t;
  const holdDown = ay >= t;
  const neutralY = !holdUp && !holdDown;

  // return all computed values to the caller.
  return {
    ax,
    ay,
    holdLeft,
    holdRight,
    holdUp,
    holdDown,
    neutralX,
    neutralY
  };
};

/**
 * Applies axis flags to the per-pad snapshot with mutual exclusivity and neutral clearing.
 * @param {object} padState The per-pad snapshot for this device.
 * @param {object} f The axis flags.
 */
Input._applyAxesToPerPad = function(padState, f)
{
  // resolve horizontal contribution.
  if (f.holdLeft)
  {
    padState.left = true;
    padState.right = false;
  }
  else if (f.holdRight)
  {
    padState.right = true;
    padState.left = false;
  }
  else if (f.neutralX)
  {
    padState.left = false;
    padState.right = false;
  }

  // resolve vertical contribution.
  if (f.holdUp)
  {
    padState.up = true;
    padState.down = false;
  }
  else if (f.holdDown)
  {
    padState.down = true;
    padState.up = false;
  }
  else if (f.neutralY)
  {
    padState.up = false;
    padState.down = false;
  }
};

/**
 * Extracts the current axis-derived directions from the per-pad snapshot.
 * @param {object} padState The per-pad snapshot for this device.
 * @returns {{up:boolean,down:boolean,left:boolean,right:boolean}}
 */
Input._axesNowFromPadState = function(padState)
{
  // interpret the per-pad snapshot booleans as the axes contribution for this frame.
  return {
    up: padState.up === true,
    down: padState.down === true,
    left: padState.left === true,
    right: padState.right === true,
  };
};

/**
 * Separates an approximate keyboard-only contribution from the previous merged snapshot.
 * Anything present in merged last frame that was NOT set by axes last frame is treated as keyboard.
 * @param {{up:boolean,down:boolean,left:boolean,right:boolean}} s0 The merged snapshot prior to axes resolution.
 * @param {{up:boolean,down:boolean,left:boolean,right:boolean}} prevAxes The last frame's axes contribution.
 * @returns {{up:boolean,down:boolean,left:boolean,right:boolean}}
 */
Input._keyboardApproxFromSnapshot = function(s0, prevAxes)
{
  // derive a keyboard-only approximation by subtracting prior axes contribution.
  return {
    up: s0.up && (prevAxes.up === false),
    down: s0.down && (prevAxes.down === false),
    left: s0.left && (prevAxes.left === false),
    right: s0.right && (prevAxes.right === false),
  };
};

/**
 * Rebuilds merged directions as (keyboardApprox OR currentGamepadAxes) for each cardinal.
 * @param {object} s The merged current state bag to write into.
 * @param {{up:boolean,down:boolean,left:boolean,right:boolean}} kbdApprox The keyboard-only approximation.
 * @param {{up:boolean,down:boolean,left:boolean,right:boolean}} axesNow The axes contribution for this frame.
 */
Input._rebuildMergedDirections = function(s, kbdApprox, axesNow)
{
  // combine keyboard approximation with current axes for each direction.
  s.up = (kbdApprox.up === true) || (axesNow.up === true);
  s.down = (kbdApprox.down === true) || (axesNow.down === true);
  s.left = (kbdApprox.left === true) || (axesNow.left === true);
  s.right = (kbdApprox.right === true) || (axesNow.right === true);
};

/**
 * Exports a deep-cloned snapshot of all live namespace bindings for save.
 * Shape: { [ns: string]: { [key: string]: string[] } }
 * @returns {Object<string, Object<string, string[]>>}
 */
Input.exportAllBindingsForSave = function()
{
  // read the live bindings bag.
  const b = Input._jRegistries.bindings || Object.create(null);

  // deep clone to avoid save-time mutation risks.
  const out = Object.create(null);
  const namespaces = Object.keys(b);
  for (let i = 0; i < namespaces.length; i++)
  {
    // clone each namespace mapping.
    const ns = namespaces[i];
    const map = b[ns] || Object.create(null);
    const clone = Object.create(null);
    const keys = Object.keys(map);
    for (let k = 0; k < keys.length; k++)
    {
      const key = keys[k];
      const arr = map[key];
      clone[key] = Array.isArray(arr)
        ? arr.slice(0)
        : [];
    }
    out[ns] = clone;
  }

  // return the cloned snapshot.
  return out;
};

/**
 * Imports all namespace bindings from a saved snapshot into the live registry.
 * Any namespaces absent from the snapshot retain their current (bootstrapped) values.
 * @param {Object<string, Object<string, string[]>>} saved The snapshot to import.
 */
Input.importAllBindingsFromSave = function(saved)
{
  // ignore invalid inputs.
  if (!saved || typeof saved !== 'object')
  {
    return;
  }

  // ensure the bindings bag exists.
  const b = Input._jRegistries.bindings;

  // apply each namespace from the save.
  const namespaces = Object.keys(saved);
  for (let i = 0; i < namespaces.length; i++)
  {
    // read the namespace and its map.
    const ns = namespaces[i];
    const map = saved[ns] || Object.create(null);

    // build a safe clone of the map for assignment.
    const clone = Object.create(null);
    const keys = Object.keys(map);
    for (let k = 0; k < keys.length; k++)
    {
      const key = keys[k];
      const arr = map[key];
      clone[key] = Array.isArray(arr)
        ? arr.slice(0)
        : [];
    }

    // replace the live namespace mapping with the cloned one.
    b[ns] = clone;
  }
};

//endregion registries
//endregion Input
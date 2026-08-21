//region plugins/abs/ext/input/managers/input.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Input.js is a prototype-patch file that extends the bare RMMZ `Input` static object, so this
 * file direct-imports it against a placeholder `Input` global rather than nesting a vm context.
 * JABS_Button and JabsInputSymbols are pure, dependency-free data classes, so they are imported
 * for real rather than mocked (mirrors the convention used elsewhere for trivially-pure siblings).
 */
describe('J-ABS-Input Input (unit, real pure siblings, engine surface stubbed)', () =>
{
  let originalUpdateGamepadState;
  let importedKeyMapper;

  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = { ABS: { EXT: { INPUT: { Aliased: { Input: new Map() } } } } };

    originalUpdateGamepadState = vi.fn();
    globalThis.Input = {
      keyMapper: {},
      _updateGamepadState: originalUpdateGamepadState,
      isTriggered: vi.fn(() => false),
      isPressed: vi.fn(() => false),
    };

    await import('../../../../../../src/plugins/abs/ext/input/managers/Input.js');

    // J-Base accessors the input layer reads through.
    globalThis.Input.currentState = function() { return this._currentState; };
    globalThis.Input.gamepadStates = function() { return this._gamepadStates; };

    // snapshot the freshly-patched keyMapper so each test can restore a clean copy- bootstrap
    // tests mutate it in place (registering "key-N" entries), and those mutations would otherwise
    // leak into later tests and permanently "reserve" symbols that should still be fresh.
    importedKeyMapper = { ...globalThis.Input.keyMapper };
  });

  beforeEach(() =>
  {
    globalThis.Input.keyMapper = { ...importedKeyMapper };
    // static registries persist across tests- reset to a clean slate every time.
    globalThis.Input._jRegistries = {
      actions: Object.create(null),
      symbolLabels: Object.create(null),
      capture: new Set(),
      bindings: Object.create(null),
      defaults: Object.create(null),
      bootstrapped: false,
    };
    originalUpdateGamepadState.mockReset();
    globalThis.Input.isTriggered.mockReset().mockReturnValue(false);
    globalThis.Input.isPressed.mockReset().mockReturnValue(false);
  });

  //region static maps
  describe('keyMapper/gamepadMapper', () =>
  {
    it('maps the mainhand keyboard code to the ok symbol', () =>
    {
      expect(globalThis.Input.keyMapper[90]).toEqual('ok');
    });

    it('maps the mainhand gamepad button index to the ok symbol', () =>
    {
      expect(globalThis.Input.gamepadMapper[0]).toEqual('ok');
    });
  });
  //endregion static maps

  //region registries
  describe('registerAction()/getRegisteredActions()', () =>
  {
    it('does nothing when the namespace is missing', () =>
    {
      globalThis.Input.registerAction(null, { key: 'foo' });

      expect(globalThis.Input.getRegisteredActions('JABS')).toEqual([]);
    });

    it('does nothing when the def is missing', () =>
    {
      globalThis.Input.registerAction('JABS', null);

      expect(globalThis.Input.getRegisteredActions('JABS')).toEqual([]);
    });

    it('does nothing when the def has no key', () =>
    {
      globalThis.Input.registerAction('JABS', { label: 'Foo' });

      expect(globalThis.Input.getRegisteredActions('JABS')).toEqual([]);
    });

    it('registers a normalized action def, defaulting label to key and category to misc', () =>
    {
      globalThis.Input.registerAction('JABS', { key: 'mainhand' });

      expect(globalThis.Input.getRegisteredActions('JABS')).toEqual([
        { key: 'mainhand', label: 'mainhand', defaults: [], category: 'misc' },
      ]);
    });

    it('preserves explicit label, defaults array, and category', () =>
    {
      globalThis.Input.registerAction('JABS', {
        key: 'mainhand', label: 'Main Hand', defaults: [ 'ok' ], category: 'combat',
      });

      expect(globalThis.Input.getRegisteredActions('JABS')).toEqual([
        { key: 'mainhand', label: 'Main Hand', defaults: [ 'ok' ], category: 'combat' },
      ]);
    });

    it('returns an independent copy so callers cannot mutate the live registry', () =>
    {
      globalThis.Input.registerAction('JABS', { key: 'mainhand' });
      const list = globalThis.Input.getRegisteredActions('JABS');
      list.push({ key: 'intruder' });

      expect(globalThis.Input.getRegisteredActions('JABS')).toHaveLength(1);
    });

    it('returns an empty array for an unregistered namespace', () =>
    {
      expect(globalThis.Input.getRegisteredActions('UNKNOWN')).toEqual([]);
    });
  });

  describe('seedDefaultBindings()/getAllBindings()', () =>
  {
    it('does nothing when the namespace is missing', () =>
    {
      globalThis.Input.seedDefaultBindings(null, { mainhand: [ 'ok' ] });

      expect(globalThis.Input.getAllBindings('JABS')).toEqual({});
    });

    it('does nothing when defaults is missing', () =>
    {
      globalThis.Input.seedDefaultBindings('JABS', null);

      expect(globalThis.Input.getAllBindings('JABS')).toEqual({});
    });

    it('seeds defaults and getAllBindings lazily clones them into live bindings', () =>
    {
      globalThis.Input.seedDefaultBindings('JABS', { mainhand: [ 'ok' ], offhand: 'not-an-array' });

      expect(globalThis.Input.getAllBindings('JABS')).toEqual({ mainhand: [ 'ok' ], offhand: [] });
    });

    it('returns the same live bindings object on subsequent calls without re-cloning', () =>
    {
      globalThis.Input.seedDefaultBindings('JABS', { mainhand: [ 'ok' ] });
      const first = globalThis.Input.getAllBindings('JABS');
      const second = globalThis.Input.getAllBindings('JABS');

      expect(first).toBe(second);
    });
  });

  describe('getBindings()', () =>
  {
    it('returns the bound physical symbols for a known key', () =>
    {
      globalThis.Input.seedDefaultBindings('JABS', { mainhand: [ 'ok' ] });

      expect(globalThis.Input.getBindings('JABS', 'mainhand')).toEqual([ 'ok' ]);
    });

    it('returns an empty array for an unknown key', () =>
    {
      expect(globalThis.Input.getBindings('JABS', 'unknown')).toEqual([]);
    });
  });

  describe('setBindings()', () =>
  {
    it('overwrites the bound physical symbols for a key', () =>
    {
      globalThis.Input.setBindings('JABS', 'mainhand', [ 'ok', 'space' ]);

      expect(globalThis.Input.getBindings('JABS', 'mainhand')).toEqual([ 'ok', 'space' ]);
    });

    it('defaults to an empty array when given a non-array value', () =>
    {
      globalThis.Input.setBindings('JABS', 'mainhand', 'not-an-array');

      expect(globalThis.Input.getBindings('JABS', 'mainhand')).toEqual([]);
    });
  });

  describe('resetBindingsToDefaults()', () =>
  {
    it('resets live bindings back to a fresh clone of the seeded defaults', () =>
    {
      globalThis.Input.seedDefaultBindings('JABS', { mainhand: [ 'ok' ] });
      globalThis.Input.setBindings('JABS', 'mainhand', [ 'space' ]);

      globalThis.Input.resetBindingsToDefaults('JABS');

      expect(globalThis.Input.getBindings('JABS', 'mainhand')).toEqual([ 'ok' ]);
    });

    it('resets to an empty bag when there are no seeded defaults', () =>
    {
      globalThis.Input.resetBindingsToDefaults('UNKNOWN');

      expect(globalThis.Input.getAllBindings('UNKNOWN')).toEqual({});
    });
  });

  describe('isActionTriggered()/isActionPressed()', () =>
  {
    beforeEach(() =>
    {
      globalThis.Input.seedDefaultBindings('JABS', { mainhand: [ 'ok', 'space' ] });
    });

    it('returns false when none of the bound physical inputs are triggered', () =>
    {
      expect(globalThis.Input.isActionTriggered('JABS', 'mainhand')).toEqual(false);
    });

    it('returns true when any bound physical input is triggered', () =>
    {
      globalThis.Input.isTriggered.mockImplementation((symbol) => symbol === 'space');

      expect(globalThis.Input.isActionTriggered('JABS', 'mainhand')).toEqual(true);
    });

    it('returns false when none of the bound physical inputs are pressed', () =>
    {
      expect(globalThis.Input.isActionPressed('JABS', 'mainhand')).toEqual(false);
    });

    it('returns true when any bound physical input is pressed', () =>
    {
      globalThis.Input.isPressed.mockImplementation((symbol) => symbol === 'ok');

      expect(globalThis.Input.isActionPressed('JABS', 'mainhand')).toEqual(true);
    });
  });

  describe('registerSymbolLabel()/labelForSymbol()', () =>
  {
    it('registers and resolves an explicit label', () =>
    {
      globalThis.Input.registerSymbolLabel('ok', 'Confirm');

      expect(globalThis.Input.labelForSymbol('ok')).toEqual('Confirm');
    });

    it('falls back to the symbol itself when no label was given', () =>
    {
      globalThis.Input.registerSymbolLabel('ok', null);

      expect(globalThis.Input.labelForSymbol('ok')).toEqual('ok');
    });

    it('falls back to the symbol itself when never registered', () =>
    {
      expect(globalThis.Input.labelForSymbol('unregistered')).toEqual('unregistered');
    });
  });

  describe('registerRemapCaptureSymbol()/getRemapCaptureSymbols()', () =>
  {
    it('registers and lists capture-eligible symbols', () =>
    {
      globalThis.Input.registerRemapCaptureSymbol('ok');
      globalThis.Input.registerRemapCaptureSymbol('cancel');

      expect(globalThis.Input.getRemapCaptureSymbols()).toEqual(expect.arrayContaining([ 'ok', 'cancel' ]));
    });

    it('does not register the same symbol twice', () =>
    {
      globalThis.Input.registerRemapCaptureSymbol('ok');
      globalThis.Input.registerRemapCaptureSymbol('ok');

      expect(globalThis.Input.getRemapCaptureSymbols()).toEqual([ 'ok' ]);
    });
  });

  describe('ensureRemapBootstrapped()', () =>
  {
    it('seeds JABS defaults, registers labels/capture symbols, and marks itself bootstrapped', () =>
    {
      globalThis.Input.ensureRemapBootstrapped();

      expect(globalThis.Input._jRegistries.bootstrapped).toEqual(true);
      expect(globalThis.Input.getAllBindings('JABS').Main).toEqual([ 'ok' ]);
      expect(globalThis.Input.labelForSymbol('l3')).toEqual('L3');
    });

    it('is idempotent- a second call does not re-run the bootstrap work', () =>
    {
      globalThis.Input.ensureRemapBootstrapped();
      const bootstrapSpy = vi.spyOn(globalThis.Input, 'bootstrapAllKeyboardKeysForCapture');

      globalThis.Input.ensureRemapBootstrapped();

      expect(bootstrapSpy).not.toHaveBeenCalled();
      bootstrapSpy.mockRestore();
    });
  });

  describe('bootstrapAllKeyboardKeysForCapture()', () =>
  {
    it('registers a capture symbol/label for an existing non-reserved keyMapper entry', () =>
    {
      globalThis.Input.keyMapper[219] = 'jabs-custom';

      globalThis.Input.bootstrapAllKeyboardKeysForCapture();

      expect(globalThis.Input.getRemapCaptureSymbols()).toContain('jabs-custom');

      delete globalThis.Input.keyMapper[219];
    });

    it('leaves reserved existing engine mappings alone without registering capture', () =>
    {
      globalThis.Input.keyMapper[13] = 'ok';

      globalThis.Input.bootstrapAllKeyboardKeysForCapture();

      expect(globalThis.Input.getRemapCaptureSymbols()).not.toContain('ok');
    });

    it('generates a stable key-N symbol and label for unmapped, non-blacklisted keycodes', () =>
    {
      globalThis.Input.bootstrapAllKeyboardKeysForCapture();

      expect(globalThis.Input.keyMapper[219]).toEqual('key-219');
      expect(globalThis.Input.getRemapCaptureSymbols()).toContain('key-219');
      expect(globalThis.Input.labelForSymbol('key-219')).toEqual('[ {');
    });

    it('does not map blacklisted function-key keycodes', () =>
    {
      globalThis.Input.bootstrapAllKeyboardKeysForCapture();

      expect(globalThis.Input.keyMapper[115]).toBeUndefined();
    });
  });

  describe('_isBlacklistedKeycode()', () =>
  {
    it('blacklists F1-F12 (112-123)', () =>
    {
      expect(globalThis.Input._isBlacklistedKeycode(112)).toEqual(true);
      expect(globalThis.Input._isBlacklistedKeycode(123)).toEqual(true);
    });

    it('blacklists F13-F24 (124-135)', () =>
    {
      expect(globalThis.Input._isBlacklistedKeycode(124)).toEqual(true);
      expect(globalThis.Input._isBlacklistedKeycode(135)).toEqual(true);
    });

    it('allows keycodes outside the blacklisted ranges', () =>
    {
      expect(globalThis.Input._isBlacklistedKeycode(65)).toEqual(false);
      expect(globalThis.Input._isBlacklistedKeycode(111)).toEqual(false);
      expect(globalThis.Input._isBlacklistedKeycode(136)).toEqual(false);
    });
  });

  describe('_keycodeLabelFor()', () =>
  {
    it('converts A-Z keycodes to their letter', () =>
    {
      expect(globalThis.Input._keycodeLabelFor(65, 'fallback')).toEqual('A');
      expect(globalThis.Input._keycodeLabelFor(90, 'fallback')).toEqual('Z');
    });

    it('converts top-row digit keycodes to their digit', () =>
    {
      expect(globalThis.Input._keycodeLabelFor(48, 'fallback')).toEqual('0');
      expect(globalThis.Input._keycodeLabelFor(57, 'fallback')).toEqual('9');
    });

    it('converts numpad digit keycodes to a Num-prefixed label', () =>
    {
      expect(globalThis.Input._keycodeLabelFor(96, 'fallback')).toEqual('Num 0');
      expect(globalThis.Input._keycodeLabelFor(105, 'fallback')).toEqual('Num 9');
    });

    it('converts function-key keycodes to an F-prefixed label', () =>
    {
      expect(globalThis.Input._keycodeLabelFor(112, 'fallback')).toEqual('F1');
      expect(globalThis.Input._keycodeLabelFor(123, 'fallback')).toEqual('F12');
    });

    it.each([
      [ 8, 'Backspace' ], [ 9, 'Tab' ], [ 13, 'Enter' ], [ 16, 'Shift' ], [ 17, 'Ctrl' ], [ 18, 'Alt' ],
      [ 19, 'Pause' ], [ 20, 'CapsLock' ], [ 27, 'Esc' ], [ 32, 'Space' ], [ 33, 'PageUp' ], [ 34, 'PageDown' ],
      [ 35, 'End' ], [ 36, 'Home' ], [ 37, 'Left' ], [ 38, 'Up' ], [ 39, 'Right' ], [ 40, 'Down' ],
      [ 45, 'Insert' ], [ 46, 'Delete' ], [ 91, 'Meta' ], [ 93, 'Context' ], [ 106, 'Num *' ], [ 107, 'Num +' ],
      [ 109, 'Num -' ], [ 110, 'Num .' ], [ 111, 'Num /' ], [ 186, '; :' ], [ 187, '= +' ], [ 188, ', <' ],
      [ 189, '- _' ], [ 190, '. >' ], [ 191, '/ ?' ], [ 192, '` ~' ], [ 219, '[ {' ], [ 220, '\\ |' ],
      [ 221, '] }' ], [ 222, '\' "' ],
    ])('resolves keycode %i to the punctuation/special-key label %j', (code, expected) =>
    {
      expect(globalThis.Input._keycodeLabelFor(code, 'fallback')).toEqual(expected);
    });

    it('falls back to the given fallback for an unrecognized keycode', () =>
    {
      expect(globalThis.Input._keycodeLabelFor(4, 'fallback')).toEqual('fallback');
    });

    it('falls back to a generated Key-N label when no fallback is given', () =>
    {
      expect(globalThis.Input._keycodeLabelFor(4, undefined)).toEqual('Key 4');
    });
  });

  describe('setAxisThreshold()', () =>
  {
    it('accepts a valid threshold within (0, 1)', () =>
    {
      globalThis.Input.setAxisThreshold(0.3);

      expect(globalThis.Input._axisThreshold).toEqual(0.3);
    });

    it('ignores a NaN value', () =>
    {
      globalThis.Input._axisThreshold = 0.5;
      globalThis.Input.setAxisThreshold('not-a-number');

      expect(globalThis.Input._axisThreshold).toEqual(0.5);
    });

    it('ignores a value at or below 0', () =>
    {
      globalThis.Input._axisThreshold = 0.5;
      globalThis.Input.setAxisThreshold(0);

      expect(globalThis.Input._axisThreshold).toEqual(0.5);
    });

    it('ignores a value at or above 1', () =>
    {
      globalThis.Input._axisThreshold = 0.5;
      globalThis.Input.setAxisThreshold(1);

      expect(globalThis.Input._axisThreshold).toEqual(0.5);
    });
  });

  describe('exportAllBindingsForSave()/importAllBindingsFromSave()', () =>
  {
    it('exports a deep clone of the live bindings', () =>
    {
      globalThis.Input.seedDefaultBindings('JABS', { mainhand: [ 'ok' ] });
      globalThis.Input.getAllBindings('JABS');

      const exported = globalThis.Input.exportAllBindingsForSave();
      exported.JABS.mainhand.push('intruder');

      expect(globalThis.Input.getBindings('JABS', 'mainhand')).toEqual([ 'ok' ]);
    });

    it('imports namespaces from a saved snapshot into the live registry', () =>
    {
      globalThis.Input.importAllBindingsFromSave({ JABS: { mainhand: [ 'space' ] } });

      expect(globalThis.Input.getBindings('JABS', 'mainhand')).toEqual([ 'space' ]);
    });

    it('coerces a non-array saved value to an empty array', () =>
    {
      globalThis.Input.importAllBindingsFromSave({ JABS: { mainhand: 'not-an-array' } });

      expect(globalThis.Input.getBindings('JABS', 'mainhand')).toEqual([]);
    });

    it('exports an empty snapshot when the live bindings bag is missing entirely', () =>
    {
      globalThis.Input._jRegistries.bindings = undefined;

      const exported = globalThis.Input.exportAllBindingsForSave();

      expect(exported).toEqual({});
    });

    it('exports an empty namespace map when a registered namespace key has no value', () =>
    {
      globalThis.Input._jRegistries.bindings = { JABS: null };

      const exported = globalThis.Input.exportAllBindingsForSave();

      expect(exported.JABS).toEqual({});
    });

    it('coerces a non-array live binding value to an empty array on export', () =>
    {
      globalThis.Input._jRegistries.bindings = { JABS: { mainhand: 'not-an-array' } };

      const exported = globalThis.Input.exportAllBindingsForSave();

      expect(exported.JABS.mainhand).toEqual([]);
    });

    it('treats a null namespace value in the saved snapshot as an empty map on import', () =>
    {
      globalThis.Input.importAllBindingsFromSave({ JABS: null });

      expect(globalThis.Input.getBindings('JABS', 'mainhand')).toEqual([]);
    });
  });
  //endregion registries

  //region gamepad axis normalization
  describe('_updateGamepadState()', () =>
  {
    beforeEach(() =>
    {
      globalThis.Input._axisThreshold = 0.5;
      globalThis.Input._currentState = { up: false, down: false, left: false, right: false };
      globalThis.Input._gamepadStates = { 0: { up: false, down: false, left: false, right: false } };
    });

    it('always performs the original engine logic first', () =>
    {
      const gamepad = { index: 0 };

      globalThis.Input._updateGamepadState(gamepad);

      expect(originalUpdateGamepadState).toHaveBeenCalledWith(gamepad);
    });

    it('stops after the original logic when there is no gamepad', () =>
    {
      expect(() => globalThis.Input._updateGamepadState(null)).not.toThrow();
    });

    it('stops after d-pad normalization when either state bag is missing', () =>
    {
      globalThis.Input._currentState = null;
      const gamepad = { index: 0, buttons: [], axes: [] };

      expect(() => globalThis.Input._updateGamepadState(gamepad)).not.toThrow();
    });

    it('stops after d-pad normalization when there are fewer than 2 axes', () =>
    {
      // Arrange
      // the lone axis is pushed hard right, past the 0.5 threshold, so continuing past the guard
      // would stamp right onto the per-pad snapshot. the d-pad right button is pressed as the
      // proof-of-execution anchor- an untouched per-pad snapshot also happens to be what a
      // method that did nothing at all would leave behind.
      const buttons = new Array(15).fill(undefined);
      buttons.push({ pressed: true });
      const gamepad = { index: 0, buttons, axes: [ 1 ] };

      // Act
      globalThis.Input._updateGamepadState(gamepad);

      // Assert
      expect(globalThis.Input._currentState['dpad-right']).toEqual(true);
      expect(globalThis.Input._gamepadStates[0].right).toEqual(false);
    });

    it('merges keyboard-approximated and axis-derived directions on a full pass', () =>
    {
      // simulate the keyboard already holding "right" this frame, with the stick pushed hard left.
      globalThis.Input._currentState.right = true;
      const gamepad = { index: 0, buttons: [], axes: [ -1, 0 ] };

      globalThis.Input._updateGamepadState(gamepad);

      expect(globalThis.Input._currentState.left).toEqual(true);
      expect(globalThis.Input._currentState.right).toEqual(true);
    });
  });

  describe('_ensurePadStates()', () =>
  {
    it('returns null when the merged state bag is missing', () =>
    {
      globalThis.Input._currentState = null;
      globalThis.Input._gamepadStates = { 0: {} };

      expect(globalThis.Input._ensurePadStates({ index: 0 })).toBeNull();
    });

    it('returns null when the per-pad state bag is missing', () =>
    {
      globalThis.Input._currentState = {};
      globalThis.Input._gamepadStates = null;

      expect(globalThis.Input._ensurePadStates({ index: 0 })).toBeNull();
    });

    it('returns both state bags when present', () =>
    {
      globalThis.Input._currentState = { tag: 'merged' };
      globalThis.Input._gamepadStates = { 0: { tag: 'per-pad' } };

      expect(globalThis.Input._ensurePadStates({ index: 0 })).toEqual({
        s: { tag: 'merged' },
        padState: { tag: 'per-pad' },
      });
    });
  });

  describe('_normalizeDpadFromButtons()', () =>
  {
    it('coerces pressed d-pad buttons into both state bags', () =>
    {
      const buttons = new Array(12).fill(undefined);
      buttons.push({ pressed: true }, { pressed: false }, { pressed: true }, { pressed: false });
      const gamepad = { buttons };
      const s = {};
      const padState = {};

      globalThis.Input._normalizeDpadFromButtons(gamepad, s, padState);

      expect(s).toEqual({ 'dpad-up': true, 'dpad-down': false, 'dpad-left': true, 'dpad-right': false });
      expect(padState).toEqual({ 'dpad-up': true, 'dpad-down': false, 'dpad-left': true, 'dpad-right': false });
    });

    it('coerces the complementary pressed d-pad buttons into both state bags', () =>
    {
      // Arrange
      // the fixture above leaves 13 and 15 unpressed, so their expected value is false and
      // nothing could tell "read button 13" apart from "always false". this is the mirror image:
      // 13 and 15 pressed with 12 and 14 as near-miss neighbours that must stay false.
      const buttons = new Array(12).fill(undefined);
      buttons.push({ pressed: false }, { pressed: true }, { pressed: false }, { pressed: true });
      const gamepad = { buttons };
      const s = {};
      const padState = {};

      // Act
      globalThis.Input._normalizeDpadFromButtons(gamepad, s, padState);

      // Assert
      expect(s).toEqual({ 'dpad-up': false, 'dpad-down': true, 'dpad-left': false, 'dpad-right': true });
      expect(padState).toEqual({ 'dpad-up': false, 'dpad-down': true, 'dpad-left': false, 'dpad-right': true });
    });

    it('defaults every d-pad flag to false when buttons are missing', () =>
    {
      const s = {};
      const padState = {};

      globalThis.Input._normalizeDpadFromButtons({}, s, padState);

      expect(s).toEqual({ 'dpad-up': false, 'dpad-down': false, 'dpad-left': false, 'dpad-right': false });
    });
  });

  describe('_snapshotMergedDirections()', () =>
  {
    it('coerces the merged state into strict booleans', () =>
    {
      expect(globalThis.Input._snapshotMergedDirections({ up: 1, down: 0 })).toEqual({
        up: true, down: false, left: false, right: false,
      });
    });
  });

  describe('_resolveAxesFlags()', () =>
  {
    beforeEach(() =>
    {
      globalThis.Input._axisThreshold = 0.5;
    });

    it('resolves hold-left/hold-up flags past the negative threshold', () =>
    {
      const flags = globalThis.Input._resolveAxesFlags({ axes: [ -0.9, -0.9 ] });

      expect(flags.holdLeft).toEqual(true);
      expect(flags.holdUp).toEqual(true);
      expect(flags.neutralX).toEqual(false);
      // neutralY had no negative case anywhere: the deadzone test expects it true and the two
      // hold tests never looked at it, so "!holdUp && !holdDown" could have been a constant true.
      expect(flags.neutralY).toEqual(false);
    });

    it('resolves hold-right/hold-down flags past the positive threshold', () =>
    {
      const flags = globalThis.Input._resolveAxesFlags({ axes: [ 0.9, 0.9 ] });

      expect(flags.holdRight).toEqual(true);
      expect(flags.holdDown).toEqual(true);
    });

    it('resolves neutral flags within the deadzone', () =>
    {
      const flags = globalThis.Input._resolveAxesFlags({ axes: [ 0, 0 ] });

      expect(flags.neutralX).toEqual(true);
      expect(flags.neutralY).toEqual(true);
    });

    it('defaults missing axes to 0', () =>
    {
      const flags = globalThis.Input._resolveAxesFlags({ axes: [] });

      expect(flags.ax).toEqual(0);
      expect(flags.ay).toEqual(0);
    });
  });

  describe('_applyAxesToPerPad()', () =>
  {
    it('sets left and clears right when holding left', () =>
    {
      const padState = { left: false, right: true };
      globalThis.Input._applyAxesToPerPad(padState, { holdLeft: true, holdRight: false, neutralX: false, holdUp: false, holdDown: false, neutralY: false });

      expect(padState).toMatchObject({ left: true, right: false });
    });

    it('sets right and clears left when holding right', () =>
    {
      const padState = { left: true, right: false };
      globalThis.Input._applyAxesToPerPad(padState, { holdLeft: false, holdRight: true, neutralX: false, holdUp: false, holdDown: false, neutralY: false });

      expect(padState).toMatchObject({ left: false, right: true });
    });

    it('clears both when horizontally neutral', () =>
    {
      const padState = { left: true, right: true };
      globalThis.Input._applyAxesToPerPad(padState, { holdLeft: false, holdRight: false, neutralX: true, holdUp: false, holdDown: false, neutralY: false });

      expect(padState).toMatchObject({ left: false, right: false });
    });

    it('leaves horizontal state untouched when neither holding nor neutral (mid-transition frame)', () =>
    {
      const padState = { left: true, right: false };
      globalThis.Input._applyAxesToPerPad(padState, { holdLeft: false, holdRight: false, neutralX: false, holdUp: false, holdDown: false, neutralY: false });

      expect(padState).toMatchObject({ left: true, right: false });
    });

    it('sets up and clears down when holding up', () =>
    {
      const padState = { up: false, down: true };
      globalThis.Input._applyAxesToPerPad(padState, { holdLeft: false, holdRight: false, neutralX: true, holdUp: true, holdDown: false, neutralY: false });

      expect(padState).toMatchObject({ up: true, down: false });
    });

    it('sets down and clears up when holding down', () =>
    {
      const padState = { up: true, down: false };
      globalThis.Input._applyAxesToPerPad(padState, { holdLeft: false, holdRight: false, neutralX: true, holdUp: false, holdDown: true, neutralY: false });

      expect(padState).toMatchObject({ up: false, down: true });
    });

    it('clears both when vertically neutral', () =>
    {
      const padState = { up: true, down: true };
      globalThis.Input._applyAxesToPerPad(padState, { holdLeft: false, holdRight: false, neutralX: true, holdUp: false, holdDown: false, neutralY: true });

      expect(padState).toMatchObject({ up: false, down: false });
    });

    it('leaves vertical state untouched when neither holding nor neutral (mid-transition frame)', () =>
    {
      // the horizontal axis had this case and the vertical one did not, which left neutralY as
      // the only branch condition here that could be forced true unnoticed: every other fixture
      // either takes an earlier arm or already expects the cleared result.
      const padState = { up: true, down: false };
      globalThis.Input._applyAxesToPerPad(padState, { holdLeft: false, holdRight: false, neutralX: true, holdUp: false, holdDown: false, neutralY: false });

      expect(padState).toMatchObject({ up: true, down: false });
    });
  });

  describe('_axesNowFromPadState()', () =>
  {
    it('strictly interprets true booleans from the per-pad snapshot', () =>
    {
      expect(globalThis.Input._axesNowFromPadState({ up: true, down: 'truthy-but-not-true', left: false, right: undefined }))
        .toEqual({ up: true, down: false, left: false, right: false });
    });

    it('strictly interprets the complementary per-pad booleans', () =>
    {
      // the fixture above expects false for down, left and right, which is also what a hardcoded
      // false would produce for those three- and true for up, which a hardcoded true matches.
      // this inverts every cardinal so each strict comparison has to answer the other way.
      expect(globalThis.Input._axesNowFromPadState({ up: false, down: true, left: 'truthy-but-not-true', right: true }))
        .toEqual({ up: false, down: true, left: false, right: true });
    });
  });

  describe('_keyboardApproxFromSnapshot()', () =>
  {
    it('treats a merged direction as keyboard-only when axes did not contribute it last frame', () =>
    {
      const result = globalThis.Input._keyboardApproxFromSnapshot(
        { up: true, down: false, left: false, right: false },
        { up: false, down: false, left: false, right: false },
      );

      expect(result.up).toEqual(true);
    });

    it('does not treat a merged direction as keyboard-only when axes contributed it last frame', () =>
    {
      const result = globalThis.Input._keyboardApproxFromSnapshot(
        { up: true, down: false, left: false, right: false },
        { up: true, down: false, left: false, right: false },
      );

      expect(result.up).toEqual(false);
    });

    it('treats a merged down as keyboard-only when axes did not contribute it last frame', () =>
    {
      const result = globalThis.Input._keyboardApproxFromSnapshot(
        { up: false, down: true, left: false, right: false },
        { up: false, down: false, left: false, right: false },
      );

      expect(result.down).toEqual(true);
    });

    it('treats a merged left as keyboard-only when axes did not contribute it last frame', () =>
    {
      const result = globalThis.Input._keyboardApproxFromSnapshot(
        { up: false, down: false, left: true, right: false },
        { up: false, down: false, left: false, right: false },
      );

      expect(result.left).toEqual(true);
    });

    it('treats a merged right as keyboard-only when axes did not contribute it last frame', () =>
    {
      const result = globalThis.Input._keyboardApproxFromSnapshot(
        { up: false, down: false, left: false, right: true },
        { up: false, down: false, left: false, right: false },
      );

      expect(result.right).toEqual(true);
    });

    // only the "up" cardinal had a paired case where the axes DID contribute last frame. the
    // other three were single-sided, so their prevAxes comparison never had to answer false and
    // both the subtraction and the whole conjunction could have been constants. the three tests
    // below are that missing half, one per cardinal.
    it('does not treat a merged down as keyboard-only when axes contributed it last frame', () =>
    {
      const result = globalThis.Input._keyboardApproxFromSnapshot(
        { up: false, down: true, left: false, right: false },
        { up: false, down: true, left: false, right: false },
      );

      expect(result.down).toEqual(false);
    });

    it('does not treat a merged left as keyboard-only when axes contributed it last frame', () =>
    {
      const result = globalThis.Input._keyboardApproxFromSnapshot(
        { up: false, down: false, left: true, right: false },
        { up: false, down: false, left: true, right: false },
      );

      expect(result.left).toEqual(false);
    });

    it('does not treat a merged right as keyboard-only when axes contributed it last frame', () =>
    {
      const result = globalThis.Input._keyboardApproxFromSnapshot(
        { up: false, down: false, left: false, right: true },
        { up: false, down: false, left: false, right: true },
      );

      expect(result.right).toEqual(false);
    });
  });

  describe('_rebuildMergedDirections()', () =>
  {
    it('combines keyboard approximation and current axes with logical OR', () =>
    {
      const s = {};
      globalThis.Input._rebuildMergedDirections(
        s,
        { up: true, down: false, left: false, right: false },
        { up: false, down: false, left: false, right: true },
      );

      expect(s).toEqual({ up: true, down: false, left: false, right: true });
    });

    // the mixed fixture above pins exactly two of the eight operands: it contributes up from the
    // keyboard and right from the axes, and expects false for the other two cardinals. an operand
    // whose expected value is already false survives being forced false, and one whose expected
    // value is already true survives being forced true- so six of the eight were unconstrained.
    // the three cases below walk the source matrix: keyboard-only, axes-only, and neither.
    it('derives every direction from the keyboard approximation when the axes contribute nothing', () =>
    {
      const s = {};
      globalThis.Input._rebuildMergedDirections(
        s,
        { up: true, down: true, left: true, right: true },
        { up: false, down: false, left: false, right: false },
      );

      expect(s).toEqual({ up: true, down: true, left: true, right: true });
    });

    it('derives every direction from the axes when the keyboard contributes nothing', () =>
    {
      const s = {};
      globalThis.Input._rebuildMergedDirections(
        s,
        { up: false, down: false, left: false, right: false },
        { up: true, down: true, left: true, right: true },
      );

      expect(s).toEqual({ up: true, down: true, left: true, right: true });
    });

    it('clears every direction when neither source contributes', () =>
    {
      const s = {};
      globalThis.Input._rebuildMergedDirections(
        s,
        { up: false, down: false, left: false, right: false },
        { up: false, down: false, left: false, right: false },
      );

      expect(s).toEqual({ up: false, down: false, left: false, right: false });
    });
  });
  //endregion gamepad axis normalization
});
//endregion plugins/abs/ext/input/managers/input.test.js

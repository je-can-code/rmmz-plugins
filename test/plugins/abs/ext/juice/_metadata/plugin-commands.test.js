//region plugins/abs/ext/juice/_metadata/plugin-commands.test.js
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * pluginCommands.js registers its handlers as a side effect of being imported, so the handlers are
 * captured off a stubbed `PluginManager` as they register — the only way a command is reachable
 * from a test. Every collaborator is mocked per the "unit tier mocks all downstream file-external
 * dependencies" convention, and `MotionTargetResolver` is stubbed as the bare global it arrives as
 * from J-Motion's bundle.
 *
 * Every plugin command argument arrives as a string in a real game, so every fixture here passes
 * strings. A test that passed numbers would agree with a handler that had forgotten to parse them.
 */
describe('J-ABS-Juice plugin commands (unit, all downstream dependencies mocked)', () =>
{
  /** @type {Map<string, Function>} */
  const registeredCommands = new Map();

  /** @type {Object} */
  let JuiceHeldOverlayManagerMock;

  /** @type {Object} */
  let JuiceWeaponSwingOverlayMock;

  /** @type {Object} */
  let JuiceIconResolverMock;

  /** @type {Object} */
  let JuiceMapSpriteFinderMock;

  /** @type {import('vitest').MockInstance} */
  let warn;

  /** @type {Object} */
  let interpreter;

  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = { ABS: { EXT: { JUICE: { Metadata: { name: 'J-ABS-Juice' } } } } };

    globalThis.MotionTargetResolver = { resolve: vi.fn() };

    globalThis.PluginManager = {
      registerCommand: (pluginName, commandName, handler) =>
      {
        registeredCommands.set(commandName, handler);
      },
    };

    JuiceHeldOverlayManagerMock = { declare: vi.fn(), withdraw: vi.fn() };
    vi.doMock('../../../../../../src/plugins/abs/ext/juice/managers/JuiceHeldOverlayManager.js', () => ({
      default: JuiceHeldOverlayManagerMock,
    }));

    JuiceWeaponSwingOverlayMock = { playPreset: vi.fn() };
    vi.doMock('../../../../../../src/plugins/abs/ext/juice/managers/JuiceWeaponSwingOverlay.js', () => ({
      default: JuiceWeaponSwingOverlayMock,
    }));

    JuiceIconResolverMock = { resolve: vi.fn(() => 195) };
    vi.doMock('../../../../../../src/plugins/abs/ext/juice/core/JuiceIconResolver.js', () => ({
      default: JuiceIconResolverMock,
    }));

    JuiceMapSpriteFinderMock = { findSpriteCharacterFor: vi.fn() };
    vi.doMock('../../../../../../src/plugins/abs/ext/juice/helpers/JuiceMapSpriteFinder.js', () => ({
      default: JuiceMapSpriteFinderMock,
    }));

    vi.doMock('../../../../../../src/plugins/abs/ext/juice/models/JuiceWeaponSwingMotionEffect.js', () => ({
      default: { isKnownMotionType: motionType => motionType === 'present' || motionType === 'spin' },
    }));

    await import('../../../../../../src/plugins/abs/ext/juice/_metadata/pluginCommands.js');
  });

  beforeEach(() =>
  {
    interpreter = { eventId: () => 3 };

    globalThis.MotionTargetResolver.resolve.mockReset();
    JuiceHeldOverlayManagerMock.declare.mockReset();
    JuiceHeldOverlayManagerMock.withdraw.mockReset();
    JuiceWeaponSwingOverlayMock.playPreset.mockReset();
    JuiceIconResolverMock.resolve.mockReset().mockReturnValue(195);
    JuiceMapSpriteFinderMock.findSpriteCharacterFor.mockReset();

    warn = vi.spyOn(Diagnostics, 'warn').mockImplementation(() =>
    {
    });
  });

  afterEach(() =>
  {
    warn.mockRestore();
  });

  /**
   * Builds a full set of applyOverlay arguments, as strings, with overridable entries.
   * @param {object} [overrides] Named overrides.
   * @returns {object} The command arguments.
   */
  function buildApplyArgs(overrides = {})
  {
    return {
      target: 'Player',
      targetId: '1',
      iconSource: 'Item',
      iconId: '4',
      motion: 'present',
      duration: '20',
      repeats: '1',
      spanDegrees: '120',
      hold: 'false',
      sourceKey: 'command',
      ...overrides,
    };
  }

  /**
   * Runs a registered command handler against the fake interpreter.
   * @param {string} commandName The command to run.
   * @param {object} args The command arguments.
   */
  function runCommand(commandName, args)
  {
    registeredCommands.get(commandName)
      .call(interpreter, args);
  }

  describe('applyOverlay', () =>
  {
    it('warns and does nothing when the target does not resolve', () =>
    {
      // Arrange: an event id pointing at a page that is not on this map.
      globalThis.MotionTargetResolver.resolve.mockReturnValue(null);

      // Act
      runCommand('applyOverlay', buildApplyArgs({ target: 'Event', targetId: '9' }));

      // Assert
      expect(warn).toHaveBeenCalledTimes(1);
      expect(JuiceHeldOverlayManagerMock.declare).not.toHaveBeenCalled();
      expect(JuiceWeaponSwingOverlayMock.playPreset).not.toHaveBeenCalled();
    });

    it('warns and does nothing for a preset that does not exist', () =>
    {
      // Arrange: falling through would silently play an arc nobody asked for.
      globalThis.MotionTargetResolver.resolve.mockReturnValue({ direction: () => 2 });

      // Act
      runCommand('applyOverlay', buildApplyArgs({ motion: 'arcs' }));

      // Assert
      expect(warn).toHaveBeenCalledTimes(1);
      expect(JuiceWeaponSwingOverlayMock.playPreset).not.toHaveBeenCalled();
    });

    it('declares a held overlay rather than drawing one', () =>
    {
      // Arrange
      const character = { direction: () => 4 };
      globalThis.MotionTargetResolver.resolve.mockReturnValue(character);
      JuiceIconResolverMock.resolve.mockReturnValue(87);

      // Act
      runCommand('applyOverlay', buildApplyArgs({
        hold: 'true',
        motion: 'spin',
        duration: '30',
        repeats: '2',
        spanDegrees: '200',
        sourceKey: 'cutscene',
      }));

      // Assert
      expect(JuiceHeldOverlayManagerMock.declare)
        .toHaveBeenCalledWith(character, 'cutscene', 87, 'spin', 30, 2, 200);
      expect(JuiceWeaponSwingOverlayMock.playPreset).not.toHaveBeenCalled();
    });

    it('resolves the icon through the named source', () =>
    {
      // Arrange
      globalThis.MotionTargetResolver.resolve.mockReturnValue({ direction: () => 2 });

      // Act
      runCommand('applyOverlay', buildApplyArgs({ hold: 'true', iconSource: 'Weapon', iconId: '12' }));

      // Assert
      expect(JuiceIconResolverMock.resolve).toHaveBeenCalledWith('Weapon', 12);
    });

    it('warns and does nothing when a one-shot target has no sprite on screen', () =>
    {
      // Arrange
      globalThis.MotionTargetResolver.resolve.mockReturnValue({ direction: () => 2 });
      JuiceMapSpriteFinderMock.findSpriteCharacterFor.mockReturnValue(null);

      // Act
      runCommand('applyOverlay', buildApplyArgs());

      // Assert
      expect(warn).toHaveBeenCalledTimes(1);
      expect(JuiceWeaponSwingOverlayMock.playPreset).not.toHaveBeenCalled();
    });

    it('draws a one-shot overlay on the target sprite', () =>
    {
      // Arrange
      const sprite = { name: 'a-sprite' };
      globalThis.MotionTargetResolver.resolve.mockReturnValue({ direction: () => 6 });
      JuiceMapSpriteFinderMock.findSpriteCharacterFor.mockReturnValue(sprite);
      JuiceIconResolverMock.resolve.mockReturnValue(87);

      // Act
      runCommand('applyOverlay', buildApplyArgs({ motion: 'spin', duration: '30', repeats: '2', spanDegrees: '200' }));

      // Assert
      expect(JuiceWeaponSwingOverlayMock.playPreset)
        .toHaveBeenCalledWith(sprite, 87, 'spin', 30, 2, 200, 6);
      expect(JuiceHeldOverlayManagerMock.declare).not.toHaveBeenCalled();
    });

    it('treats any hold value other than the literal true as a one-shot', () =>
    {
      // Arrange
      globalThis.MotionTargetResolver.resolve.mockReturnValue({ direction: () => 2 });
      JuiceMapSpriteFinderMock.findSpriteCharacterFor.mockReturnValue({ name: 'a-sprite' });

      // Act
      runCommand('applyOverlay', buildApplyArgs({ hold: 'TRUE' }));

      // Assert
      expect(JuiceHeldOverlayManagerMock.declare).not.toHaveBeenCalled();
      expect(JuiceWeaponSwingOverlayMock.playPreset).toHaveBeenCalledTimes(1);
    });

    it('falls back to the command source when none is given', () =>
    {
      // Arrange: MZ hands over an empty string for a blank text argument.
      globalThis.MotionTargetResolver.resolve.mockReturnValue({ direction: () => 2 });

      // Act
      runCommand('applyOverlay', buildApplyArgs({ hold: 'true', sourceKey: '' }));

      // Assert
      const [ declareCall ] = JuiceHeldOverlayManagerMock.declare.mock.calls;
      expect(declareCall.at(1)).toEqual('command');
    });

    it('falls back to the declared defaults for numeric fields left blank', () =>
    {
      // Arrange: a NaN duration is the dangerous one - progress is measured against it, so the
      // overlay never reaches its end and a one-shot is tracked by nothing that could remove it.
      globalThis.MotionTargetResolver.resolve.mockReturnValue({ direction: () => 2 });

      // Act
      runCommand('applyOverlay', buildApplyArgs({ hold: 'true', duration: '', repeats: '', spanDegrees: '' }));

      // Assert
      const [ declareCall ] = JuiceHeldOverlayManagerMock.declare.mock.calls;
      expect(declareCall.at(4)).toEqual(20);
      expect(declareCall.at(5)).toEqual(1);
      expect(declareCall.at(6)).toEqual(120);
    });

    it('keeps a numeric field that was actually filled in', () =>
    {
      // Arrange: a fallback that ignored its input would pass the test above too.
      globalThis.MotionTargetResolver.resolve.mockReturnValue({ direction: () => 2 });

      // Act
      runCommand('applyOverlay', buildApplyArgs({ hold: 'true', duration: '45', repeats: '3', spanDegrees: '200' }));

      // Assert
      const [ declareCall ] = JuiceHeldOverlayManagerMock.declare.mock.calls;
      expect(declareCall.at(4)).toEqual(45);
      expect(declareCall.at(5)).toEqual(3);
      expect(declareCall.at(6)).toEqual(200);
    });
  });

  describe('removeOverlay', () =>
  {
    it('warns and does nothing when the target does not resolve', () =>
    {
      // Arrange
      globalThis.MotionTargetResolver.resolve.mockReturnValue(null);

      // Act
      runCommand('removeOverlay', { target: 'Event', targetId: '9', sourceKey: 'command' });

      // Assert
      expect(warn).toHaveBeenCalledTimes(1);
      expect(JuiceHeldOverlayManagerMock.withdraw).not.toHaveBeenCalled();
    });

    it('withdraws what the named source was holding', () =>
    {
      // Arrange
      const character = { direction: () => 2 };
      globalThis.MotionTargetResolver.resolve.mockReturnValue(character);

      // Act
      runCommand('removeOverlay', { target: 'Player', targetId: '1', sourceKey: 'cutscene' });

      // Assert
      expect(JuiceHeldOverlayManagerMock.withdraw).toHaveBeenCalledWith(character, 'cutscene');
    });

    it('falls back to the command source when none is given', () =>
    {
      // Arrange
      const character = { direction: () => 2 };
      globalThis.MotionTargetResolver.resolve.mockReturnValue(character);

      // Act
      runCommand('removeOverlay', { target: 'Player', targetId: '1', sourceKey: '' });

      // Assert
      expect(JuiceHeldOverlayManagerMock.withdraw).toHaveBeenCalledWith(character, 'command');
    });

    it('resolves the target through the interpreter running the command', () =>
    {
      // Arrange: `This Event` means nothing without the interpreter's own event id.
      globalThis.MotionTargetResolver.resolve.mockReturnValue({ direction: () => 2 });

      // Act
      runCommand('removeOverlay', { target: 'This Event', targetId: '1', sourceKey: 'command' });

      // Assert
      expect(globalThis.MotionTargetResolver.resolve)
        .toHaveBeenCalledWith('This Event', 1, interpreter);
    });
  });
});
//endregion plugins/abs/ext/juice/_metadata/plugin-commands.test.js
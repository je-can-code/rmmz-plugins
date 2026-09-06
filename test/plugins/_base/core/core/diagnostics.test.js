//region plugins/_base/core/core/diagnostics.test.js
import { afterEach, describe, expect, it, vi } from 'vitest';

import Diagnostics from '../../../../../src/plugins/_base/core/core/Diagnostics.js';

describe('Diagnostics', () =>
{
  afterEach(() =>
  {
    // spies here sit on a bare global, which restoreAllMocks does not reliably reach.
    vi.restoreAllMocks();
  });

  describe('format', () =>
  {
    it('wraps the plugin name in brackets ahead of the message', () =>
    {
      // Act
      const stamped = Diagnostics.format('J-ABS', 'something went sideways');

      // Assert- pinned exactly, because every console filter in the repo keys off this shape.
      expect(stamped).toBe('[J-ABS] something went sideways');
    });

    it('leaves a message carrying its own colons readable', () =>
    {
      // Arrange- the reason the prefix is bracketed rather than "J-ABS: " is that most messages
      // already contain a colon, and two colons in one line reads as one prefix swallowing another.
      const message = 'attempted to request a refresh of type: hp, but it is not implemented.';

      // Act
      const stamped = Diagnostics.format('J-ABS', message);

      // Assert
      expect(stamped).toBe('[J-ABS] attempted to request a refresh of type: hp, but it is not implemented.');
    });
  });

  describe('warn', () =>
  {
    it('passes only the stamped message when there are no details', () =>
    {
      // Arrange
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      // Act
      Diagnostics.warn('J-SDP', 'panel key was not found.');

      // Assert- exactly one argument; a trailing null next to every message is the bug this avoids.
      expect(warnSpy).toHaveBeenCalledWith('[J-SDP] panel key was not found.');
    });

    it('appends the details when they are supplied', () =>
    {
      // Arrange
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const details = { panelKey: 'slime-puddle' };

      // Act
      Diagnostics.warn('J-SDP', 'panel key was not found.', details);

      // Assert
      expect(warnSpy).toHaveBeenCalledWith('[J-SDP] panel key was not found.', details);
    });
  });

  describe('info', () =>
  {
    it('passes only the stamped message when there are no details', () =>
    {
      // Arrange
      const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

      // Act
      Diagnostics.info('J-Base', 'loaded external JSON from file data/config.jabs.json.');

      // Assert
      expect(infoSpy).toHaveBeenCalledWith('[J-Base] loaded external JSON from file data/config.jabs.json.');
    });

    it('appends the details when they are supplied', () =>
    {
      // Arrange
      const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
      const details = { layers: 4 };

      // Act
      Diagnostics.info('J-Base', 'loaded external JSON from file data/config.diff.json.', details);

      // Assert
      expect(infoSpy).toHaveBeenCalledWith('[J-Base] loaded external JSON from file data/config.diff.json.', details);
    });
  });

  describe('error', () =>
  {
    it('passes only the stamped message when there are no details', () =>
    {
      // Arrange
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Act
      Diagnostics.error('J-Base', 'the enemy failed to generate.');

      // Assert
      expect(errorSpy).toHaveBeenCalledWith('[J-Base] the enemy failed to generate.');
    });

    it('appends the details when they are supplied', () =>
    {
      // Arrange
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const details = { enemyId: 42 };

      // Act
      Diagnostics.error('J-Base', 'the enemy failed to generate.', details);

      // Assert
      expect(errorSpy).toHaveBeenCalledWith('[J-Base] the enemy failed to generate.', details);
    });

    it('writes to console.error rather than console.warn', () =>
    {
      // Arrange- the two methods differ only by which console channel they reach, so a test that
      // never looks at the other channel cannot tell them apart.
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      // Act
      Diagnostics.error('J-Base', 'the enemy failed to generate.');

      // Assert
      expect(errorSpy).toHaveBeenCalledTimes(1);
      expect(warnSpy).not.toHaveBeenCalled();
    });
  });

  describe('trace', () =>
  {
    it('emits the stamped warning and the stack together', () =>
    {
      // Arrange
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const traceSpy = vi.spyOn(console, 'trace').mockImplementation(() => {});

      // Act
      Diagnostics.trace('J-DropsControl', 'a static class was instantiated.');

      // Assert- the stack is the payload; the message alone is what this method exists to improve on.
      expect(warnSpy).toHaveBeenCalledWith('[J-DropsControl] a static class was instantiated.');
      expect(traceSpy).toHaveBeenCalledTimes(1);
    });

    it('forwards details through to the warning it emits', () =>
    {
      // Arrange
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      vi.spyOn(console, 'trace').mockImplementation(() => {});
      const details = { skillSlotKey: 'mainhand' };

      // Act
      Diagnostics.trace('J-ABS', 'a follower was asked to cast.', details);

      // Assert
      expect(warnSpy).toHaveBeenCalledWith('[J-ABS] a follower was asked to cast.', details);
    });
  });

  describe('resolve', () =>
  {
    it('hands back a value that is not a thunk untouched', () =>
    {
      // Arrange- an object carrying a `call` key, so a duck-typed "does it look callable" check
      // would misread it as a thunk where the prototype check correctly does not.
      const details = {
        call: 'a string, not a method',
        panelKey: 'slime-puddle',
      };

      // Act
      const resolved = Diagnostics.resolve(details);

      // Assert- the same object, not a copy; devtools inspection depends on the identity surviving.
      expect(resolved.value).toBe(details);
      expect(resolved.error).toBeNull();
    });

    it('invokes a thunk and hands back what it built', () =>
    {
      // Arrange
      const thunk = () => ({ eventId: 42 });

      // Act
      const resolved = Diagnostics.resolve(thunk);

      // Assert
      expect(resolved.value).toEqual({ eventId: 42 });
      expect(resolved.error).toBeNull();
    });

    it('captures the error when a thunk throws while building', () =>
    {
      // Arrange- the exact shape that crashed a playtest: a payload reading a property of an
      // object whose state is already gone.
      const failure = new Error('this.x is not a function');
      const thunk = () =>
      {
        throw failure;
      };

      // Act
      const resolved = Diagnostics.resolve(thunk);

      // Assert- the error is carried back rather than swallowed, and nothing propagated out.
      expect(resolved.error).toBe(failure);
      expect(resolved.value).toBeNull();
    });
  });

  describe('payload', () =>
  {
    it('uses the caller details when neither half failed', () =>
    {
      // Arrange
      const details = { panelKey: 'slime-puddle' };

      // Act
      const payload = Diagnostics.payload({ value: 'a message', error: null }, { value: details, error: null });

      // Assert
      expect(payload).toBe(details);
    });

    it('reports the failure when the details thunk threw', () =>
    {
      // Arrange
      const failure = new Error('details exploded');

      // Act
      const payload = Diagnostics.payload({ value: 'a message', error: null }, { value: null, error: failure });

      // Assert- both halves are named, so an absent payload is distinguishable from an unasked one.
      expect(payload.diagnosticsPayloadFailed).toBe(true);
      expect(payload.detailsError).toBe(failure);
      expect(payload.messageError).toBeNull();
    });

    it('reports the failure when the message thunk threw', () =>
    {
      // Arrange- the details built fine here, so they must survive into the failure report rather
      // than being discarded alongside the half that broke.
      const failure = new Error('message exploded');
      const details = { panelKey: 'slime-puddle' };

      // Act
      const payload = Diagnostics.payload({ value: null, error: failure }, { value: details, error: null });

      // Assert
      expect(payload.messageError).toBe(failure);
      expect(payload.detailsError).toBeNull();
      expect(payload.details).toBe(details);
    });
  });

  describe('lazy payloads', () =>
  {
    it('prints the built details when a details thunk succeeds', () =>
    {
      // Arrange
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      // Act
      Diagnostics.warn('J-ABS', 'missing event data.', () => ({ eventId: 42 }));

      // Assert- the caller sees exactly what the eager form would have printed.
      expect(warnSpy).toHaveBeenCalledWith('[J-ABS] missing event data.', { eventId: 42 });
    });

    it('still prints the message when a details thunk throws', () =>
    {
      // Arrange
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const failure = new Error('this.x is not a function');
      const thunk = () =>
      {
        throw failure;
      };

      // Act- this is the call that used to crash the game instead of reporting anything.
      Diagnostics.warn('J-ABS', 'missing event data.', thunk);

      // Assert- the original warning survives, and the reason its payload is missing rides with it.
      const [ firstWarn ] = warnSpy.mock.calls;
      const [ stamped, printed ] = firstWarn;
      expect(stamped).toBe('[J-ABS] missing event data.');
      expect(printed.detailsError).toBe(failure);
    });

    it('builds a message handed over as a thunk', () =>
    {
      // Arrange
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      // Act
      Diagnostics.warn('J-ABS', () => 'built lazily.');

      // Assert
      expect(warnSpy).toHaveBeenCalledWith('[J-ABS] built lazily.');
    });

    it('substitutes failure text when a message thunk throws', () =>
    {
      // Arrange
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const failure = new Error('message exploded');
      const thunk = () =>
      {
        throw failure;
      };

      // Act
      Diagnostics.warn('J-ABS', thunk);

      // Assert- something still reaches the console, and it says why it is not the real message.
      const [ firstWarn ] = warnSpy.mock.calls;
      const [ stamped, printed ] = firstWarn;
      expect(stamped).toBe(`[J-ABS] ${Diagnostics.MESSAGE_BUILD_FAILURE}`);
      expect(printed.messageError).toBe(failure);
    });
  });
});
//endregion plugins/_base/core/core/diagnostics.test.js

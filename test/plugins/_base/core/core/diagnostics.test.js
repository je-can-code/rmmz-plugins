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
});
//endregion plugins/_base/core/core/diagnostics.test.js

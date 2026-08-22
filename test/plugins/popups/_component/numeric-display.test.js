//region plugins/popups/_component/numeric-display.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import {
  installPopupsHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJPopups,
} from './fixtures/install-popups-host-globals.js';

describe('PopupNumericDisplay.formatNumericPopupDisplayString (direct src import)', () =>
{
  let PopupNumericDisplay;

  beforeAll(async () =>
  {
    vi.resetModules();

    installPopupsHostGlobals();

    setPluginContextToJBase();
    await import('../../../../src/plugins/_base/core/_metadata/initialization.js');

    ({ default: globalThis.J_EventEmitter } = await import('../../../../src/plugins/_base/core/models/J_EventEmitter.js'));

    setPluginContextToJPopups();
    await import('../../../../src/plugins/popups/core/_metadata/initialization.js');

    ({ default: PopupNumericDisplay } = await import('../../../../src/plugins/popups/core/helpers/PopupNumericDisplay.js'));
  });

  describe('rounds float dust', () =>
  {
    it('rounds a plain decimal string', () =>
    {
      // Arrange & Act
      const result = PopupNumericDisplay.formatNumericPopupDisplayString('12.000000000000001');

      // Assert
      expect(result).toBe('12');
    });

    it('rounds a plain decimal number', () =>
    {
      // Arrange & Act
      const result = PopupNumericDisplay.formatNumericPopupDisplayString(11.9999999999998);

      // Assert
      expect(result).toBe('12');
    });
  });

  describe('preserves letter-bearing labels', () =>
  {
    it('leaves a "PARRY x3" label untouched', () =>
    {
      // Arrange & Act
      const result = PopupNumericDisplay.formatNumericPopupDisplayString('PARRY x3');

      // Assert
      expect(result).toBe('PARRY x3');
    });

    it('leaves a "Missed" label untouched', () =>
    {
      // Arrange & Act
      const result = PopupNumericDisplay.formatNumericPopupDisplayString('Missed');

      // Assert
      expect(result).toBe('Missed');
    });

    it('leaves an already plus-prefixed heal label untouched', () =>
    {
      // Arrange & Act- a merge refresh hands back the text it previously rendered, and `+` is not a
      // signed decimal literal, so the label must survive rather than being re-parsed into a bare 30.
      const result = PopupNumericDisplay.formatNumericPopupDisplayString('+30');

      // Assert
      expect(result).toBe('+30');
    });
  });

  describe('normalizes signed integers', () =>
  {
    it('leaves a clean negative integer as-is', () =>
    {
      // Arrange & Act
      const result = PopupNumericDisplay.formatNumericPopupDisplayString('-9');

      // Assert
      expect(result).toBe('-9');
    });

    it('rounds float dust on a negative decimal', () =>
    {
      // Arrange & Act
      const result = PopupNumericDisplay.formatNumericPopupDisplayString('-9.000000000000002');

      // Assert
      expect(result).toBe('-9');
    });
  });

  describe('healing/regen display (isHealing flag)', () =>
  {
    it('flips a negative value to +magnitude', () =>
    {
      // Arrange & Act
      const result = PopupNumericDisplay.formatNumericPopupDisplayString('-9', true);

      // Assert
      expect(result).toBe('+9');
    });

    it('prefixes an already-positive value with +', () =>
    {
      // Arrange & Act
      const result = PopupNumericDisplay.formatNumericPopupDisplayString('9', true);

      // Assert
      expect(result).toBe('+9');
    });

    it('rounds float dust before flipping the sign', () =>
    {
      // Arrange & Act
      const result = PopupNumericDisplay.formatNumericPopupDisplayString('-9.000000000000002', true);

      // Assert
      expect(result).toBe('+9');
    });
  });
});
//endregion plugins/popups/_component/numeric-display.test.js

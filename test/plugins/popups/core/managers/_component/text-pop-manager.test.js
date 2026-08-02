//region plugins/popups/core/managers/_component/text-pop-manager.test.js
import { beforeEach, describe, expect, it, vi } from 'vitest';

import TextPopManager from '../../../../../../src/plugins/popups/core/managers/TextPopManager.js';

describe('TextPopManager', () =>
{
  let character;

  beforeEach(() =>
  {
    character = { addTextPop: vi.fn(), requestTextPop: vi.fn() };
  });

  describe('show', () =>
  {
    it('adds the popup to the character and requests a flush', () =>
    {
      // Arrange
      const pop = { text: 'hello' };

      // Act
      TextPopManager.show(pop, character);

      // Assert
      expect(character.addTextPop).toHaveBeenCalledWith(pop);
      expect(character.requestTextPop).toHaveBeenCalled();
    });
  });

  describe('showBatch', () =>
  {
    it('adds every popup to the character, then requests a single flush', () =>
    {
      // Arrange
      const popA = { text: 'a' };
      const popB = { text: 'b' };

      // Act
      TextPopManager.showBatch([ popA, popB ], character);

      // Assert
      expect(character.addTextPop).toHaveBeenNthCalledWith(1, popA);
      expect(character.addTextPop).toHaveBeenNthCalledWith(2, popB);
      expect(character.requestTextPop).toHaveBeenCalledTimes(1);
    });
  });
});
//endregion plugins/popups/core/managers/_component/text-pop-manager.test.js

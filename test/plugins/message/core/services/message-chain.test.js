//region plugins/message/core/services/message-chain.test.js
import { describe, expect, it } from 'vitest';

import MessageChain from '../../../../../src/plugins/message/core/services/MessageChain.js';

/**
 * Two things ask these questions and they must not get different answers: the interpreter, deciding
 * whether another Show Text still has room to be welded on, and the window, deciding how tall to be
 * once the welding is done. A cap that disagreed with the height built from it would weld a message
 * into a window with nowhere to draw it.
 *
 * The numbers throughout are the engine's own at its default resolution- a 36 pixel row, a 12 pixel
 * frame, a 624 pixel screen, and the 176 pixel four-row box the scene builds, which is four rows and
 * a frame plus eight pixels the scene adds on top of that.
 */
describe('J-Message MessageChain (direct src import)', () =>
{
  describe('how many rows fit in a height', () =>
  {
    it('counts the rows in the box the scene builds', () =>
    {
      // Arrange & Act
      const rows = MessageChain.rowsFor(176, 36, 12);

      // Assert- the scene's extra eight pixels are not most of a fifth row, and must not read as one.
      expect(rows).toBe(4);
    });

    it('counts the rows in a whole screen', () =>
    {
      // Arrange & Act
      const rows = MessageChain.rowsFor(624, 36, 12);

      // Assert
      expect(rows).toBe(16);
    });

    it('drops a partial row rather than rounding up to it', () =>
    {
      // Arrange- three rows, a frame, and most of a fourth row that nobody could read.
      const rows = MessageChain.rowsFor(167, 36, 12);

      // Assert
      expect(rows).toBe(3);
    });

    it('takes the frame off both edges rather than one', () =>
    {
      // Arrange & Act
      // with only one edge removed this height would hold four rows instead of three.
      const rows = MessageChain.rowsFor(160, 36, 12);

      // Assert
      expect(rows).toBe(3);
    });
  });

  describe('how tall a window holds a message', () =>
  {
    it('stays the size the scene built it for an ordinary short message', () =>
    {
      // Arrange & Act
      const height = MessageChain.heightFor(2, 176, 4, 36);

      // Assert- a two-line message must not shrink the box the project laid out.
      expect(height).toBe(176);
    });

    it('stays the size the scene built it for a message filling the box exactly', () =>
    {
      // Arrange & Act
      const height = MessageChain.heightFor(4, 176, 4, 36);

      // Assert
      expect(height).toBe(176);
    });

    it('grows by a row for the first row past the box', () =>
    {
      // Arrange & Act
      const height = MessageChain.heightFor(5, 176, 4, 36);

      // Assert- grown from the scene's height, so its extra eight pixels survive the growing.
      expect(height).toBe(212);
    });

    it('grows to hold a message as tall as the screen allows', () =>
    {
      // Arrange & Act
      const height = MessageChain.heightFor(16, 176, 4, 36);

      // Assert- still inside a 624 pixel screen, which is what makes the cap and this agree.
      expect(height).toBe(608);
    });
  });

  describe('the most rows a welded message may hold', () =>
  {
    it('leaves room for twelve rows past the box at the default resolution', () =>
    {
      // Arrange & Act
      const rows = MessageChain.maxRows(624, 176, 4, 36);

      // Assert
      expect(rows).toBe(16);
    });

    it('caps a taller screen by what the box can actually grow into', () =>
    {
      // Arrange & Act
      // counted straight off this screen the answer would be twenty-two, and twenty-two rows grown
      // from a 176 pixel box stand 824 pixels tall - eight past the screen they were measured for.
      const rows = MessageChain.maxRows(816, 176, 4, 36);

      // Assert
      expect(rows).toBe(21);
    });

    it('caps a shorter screen by the same reckoning', () =>
    {
      // Arrange & Act
      const rows = MessageChain.maxRows(600, 176, 4, 36);

      // Assert
      expect(rows).toBe(15);
    });

    it('never answers a row count the window could not fit on screen', () =>
    {
      // Arrange
      const rows = MessageChain.maxRows(816, 176, 4, 36);

      // Act
      const height = MessageChain.heightFor(rows, 176, 4, 36);

      // Assert- the invariant the whole cap exists to hold, checked at a resolution where counting
      // rows off the bare screen height would have overflowed it.
      expect(height).toBe(788);
      expect(height).toBeLessThanOrEqual(816);
    });
  });

  describe('whether another message still fits', () =>
  {
    it('takes a message with room to spare', () =>
    {
      // Arrange & Act
      const fits = MessageChain.fits(4, 4, 16);

      // Assert
      expect(fits).toBe(true);
    });

    it('takes a message that lands exactly on the ceiling', () =>
    {
      // Arrange & Act
      const fits = MessageChain.fits(12, 4, 16);

      // Assert- sixteen rows is a full screen, not one row too many.
      expect(fits).toBe(true);
    });

    it('refuses a message that would cross the ceiling by a single row', () =>
    {
      // Arrange & Act
      const fits = MessageChain.fits(13, 4, 16);

      // Assert
      expect(fits).toBe(false);
    });
  });
});
//endregion plugins/message/core/services/message-chain.test.js
//region plugins/hud/ext/target/_models/framed-target.test.js
import { beforeAll, describe, expect, it } from 'vitest';

describe('FramedTarget (direct src import)', () =>
{
  let FramedTarget;

  beforeAll(async () =>
  {
    // String.empty is a J-Base runtime augmentation, always present by the time this file's
    // production code runs in-game; stub it here since this test doesn't boot J-Base itself.
    String.empty = '';

    ({ default: FramedTarget } = await import('../../../../../../src/plugins/hud/ext/target/_models/FramedTarget.js'));
  });

  describe('constructor defaults', () =>
  {
    it('defaults text/nameColorHex to String.empty, icon to 0, battler/configuration to null', () =>
    {
      // Arrange/Act
      const target = new FramedTarget('Slime');

      // Assert
      expect(target.name).toEqual('Slime');
      expect(target.text).toEqual(String.empty);
      expect(target.icon).toEqual(0);
      expect(target.battler).toEqual(null);
      expect(target.configuration).toEqual(null);
      expect(target.nameColorHex).toEqual(String.empty);
    });

    it('starts every target with a list of name icons of its own', () =>
    {
      // Arrange- two targets, since a list shared between them would carry one's icons onto the other.
      const first = new FramedTarget('Slime');
      const second = new FramedTarget('Bat');

      // Act
      first.nameIconIndices.push(5);

      // Assert
      expect(first.nameIconIndices).toEqual([ 5 ]);
      expect(second.nameIconIndices).toEqual([]);
    });
  });

  describe('constructor with all values provided', () =>
  {
    it('assigns every explicitly-provided value', () =>
    {
      // Arrange
      const battler = {};
      const configuration = {};

      // Act
      const target = new FramedTarget('Slime', 'Boss', 42, battler, configuration, '#ff0000');

      // Assert
      expect(target.name).toEqual('Slime');
      expect(target.text).toEqual('Boss');
      expect(target.icon).toEqual(42);
      expect(target.battler).toBe(battler);
      expect(target.configuration).toBe(configuration);
      expect(target.nameColorHex).toEqual('#ff0000');
    });
  });
});
//endregion plugins/hud/ext/target/_models/framed-target.test.js

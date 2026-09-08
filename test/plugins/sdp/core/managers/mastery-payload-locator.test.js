//region plugins/sdp/core/managers/mastery-payload-locator.test.js
import { afterEach, beforeAll, describe, expect, it } from 'vitest';

/**
 * Most masteries hold a tag naming a second row rather than holding their own numbers, so finding
 * that row correctly decides whether any description can quote anything. Every fixture below carries
 * a decoy row the locator must not pick, because with one candidate "finds the payload" and "returns
 * whatever exists" are the same program.
 */
describe('MasteryPayloadLocator (direct src import)', () =>
{
  let MasteryPayloadLocator;

  const state = (id, note, extra = {}) => ({ id, note, isState: () => true, isSkill: () => false, ...extra });
  const skill = (id, note, extra = {}) => ({ id, note, isState: () => false, isSkill: () => true, ...extra });

  beforeAll(async () =>
  {
    Object.defineProperty(String, 'empty', { value: '', configurable: true });

    ({ default: MasteryPayloadLocator } = await import(
      '../../../../../src/plugins/sdp/core/managers/MasteryPayloadLocator.js'));
  });

  afterEach(() =>
  {
    globalThis.$dataStates = [];
    globalThis.$dataSkills = [];
  });

  //region locate
  describe('locate', () =>
  {
    it('follows a state-delivery tag on the mastery state', () =>
    {
      // Arrange: 1002 is the decoy, and must not be chosen.
      globalThis.$dataStates = [];
      globalThis.$dataStates[1001] = state(1001, String.empty);
      globalThis.$dataStates[1002] = state(1002, String.empty);
      globalThis.$dataSkills = [];
      const mastery = state(1111, '<autoApplyState:[1001, time, 3600]>');

      // Act
      const result = MasteryPayloadLocator.locate(mastery, skill(1111, String.empty));

      // Assert
      expect(result.id).toBe(1001);
    });

    it('follows a skill-delivery tag when no state tag is present', () =>
    {
      // Arrange
      globalThis.$dataStates = [];
      globalThis.$dataSkills = [];
      globalThis.$dataSkills[1001] = skill(1001, '<radius:3>');
      globalThis.$dataSkills[1002] = skill(1002, '<radius:9>');
      const mastery = state(1121, '<autoExecuteSkill:[1001, time, 180]>');

      // Act
      const result = MasteryPayloadLocator.locate(mastery, skill(1121, String.empty));

      // Assert
      expect(result.id).toBe(1001);
    });

    it('reads a delivery tag off the wrapper skill when the state carries none', () =>
    {
      // Arrange
      globalThis.$dataStates = [];
      globalThis.$dataStates[1411] = state(1411, '<lst:3>');
      globalThis.$dataStates[1412] = state(1412, '<lst:9>');
      globalThis.$dataSkills = [];
      const wrapper = skill(1411, '<passiveStateCount:[1411, enemiesNearby, 1]>');

      // Act
      const result = MasteryPayloadLocator.locate(state(1411, String.empty), wrapper);

      // Assert
      expect(result.id).toBe(1411);
    });

    it('follows an inert aura skill through to the state it applies', () =>
    {
      // Arrange: the aura deals no damage; its whole job is the add-state effect.
      globalThis.$dataStates = [];
      globalThis.$dataStates[1081] = state(1081, '<stateDuration:900>');
      globalThis.$dataStates[1082] = state(1082, '<stateDuration:60>');
      globalThis.$dataSkills = [];
      globalThis.$dataSkills[1031] = skill(1031, '<proximity:2>', {
        damage: { formula: '0' },
        effects: [ { code: 21, dataId: 1081 } ],
      });
      const mastery = state(1391, '<autoExecuteSkill:[1031, time, 600]>');

      // Act
      const result = MasteryPayloadLocator.locate(mastery, skill(1391, String.empty));

      // Assert
      expect(result.id).toBe(1081);
    });

    it('stops at a delivery skill that deals damage of its own', () =>
    {
      // Arrange: identical to the case above but for the formula, which makes the skill the payload.
      globalThis.$dataStates = [];
      globalThis.$dataStates[1081] = state(1081, '<stateDuration:900>');
      globalThis.$dataSkills = [];
      globalThis.$dataSkills[1031] = skill(1031, '<proximity:2>', {
        damage: { formula: 'a.mat * 3' },
        effects: [ { code: 21, dataId: 1081 } ],
      });
      const mastery = state(1121, '<autoExecuteSkill:[1031, time, 600]>');

      // Act
      const result = MasteryPayloadLocator.locate(mastery, skill(1121, String.empty));

      // Assert
      expect(result.id).toBe(1031);
    });

    it('stops at a delivery skill carrying no effects at all', () =>
    {
      // Arrange
      globalThis.$dataStates = [];
      globalThis.$dataSkills = [];
      globalThis.$dataSkills[1051] = skill(1051, '<direct>', { damage: { formula: '0' } });
      const mastery = state(1521, '<autoExecuteSkill:[1051, time, 300]>');

      // Act
      const result = MasteryPayloadLocator.locate(mastery, skill(1521, String.empty));

      // Assert
      expect(result.id).toBe(1051);
    });

    it('stops at a delivery skill whose effects add nothing', () =>
    {
      // Arrange: a non-state effect must not be mistaken for one.
      globalThis.$dataStates = [];
      globalThis.$dataSkills = [];
      globalThis.$dataSkills[1051] = skill(1051, '<direct>', {
        damage: { formula: '0' },
        effects: [ { code: 11, dataId: 0 } ],
      });
      const mastery = state(1521, '<autoExecuteSkill:[1051, time, 300]>');

      // Act
      const result = MasteryPayloadLocator.locate(mastery, skill(1521, String.empty));

      // Assert
      expect(result.id).toBe(1051);
    });

    it('stops at a delivery skill naming a state that does not exist', () =>
    {
      // Arrange
      globalThis.$dataStates = [];
      globalThis.$dataSkills = [];
      globalThis.$dataSkills[1031] = skill(1031, '<proximity:2>', {
        damage: { formula: '0' },
        effects: [ { code: 21, dataId: 9999 } ],
      });
      const mastery = state(1391, '<autoExecuteSkill:[1031, time, 600]>');

      // Act
      const result = MasteryPayloadLocator.locate(mastery, skill(1391, String.empty));

      // Assert
      expect(result.id).toBe(1031);
    });

    it('falls back to the mastery state when nothing is delivered', () =>
    {
      // Arrange
      globalThis.$dataStates = [];
      globalThis.$dataSkills = [];
      const mastery = state(1271, '<onSelfHpHealMp:[10, 0]>');

      // Act
      const result = MasteryPayloadLocator.locate(mastery, skill(1271, String.empty));

      // Assert
      expect(result.id).toBe(1271);
    });

    it('ignores a delivery tag whose id is not a number', () =>
    {
      // Arrange
      globalThis.$dataStates = [];
      globalThis.$dataSkills = [];
      const mastery = state(1271, '<autoApplyState:[nonsense, time, 60]>');

      // Act
      const result = MasteryPayloadLocator.locate(mastery, skill(1271, String.empty));

      // Assert
      expect(result.id).toBe(1271);
    });
  });
  //endregion locate

  //region locateVehicle
  describe('locateVehicle', () =>
  {
    it('stops at the delivery skill rather than following it through', () =>
    {
      // Arrange
      globalThis.$dataStates = [];
      globalThis.$dataStates[1081] = state(1081, '<stateDuration:900>');
      globalThis.$dataSkills = [];
      globalThis.$dataSkills[1031] = skill(1031, '<proximity:2>', {
        damage: { formula: '0' },
        effects: [ { code: 21, dataId: 1081 } ],
      });
      const mastery = state(1391, '<autoExecuteSkill:[1031, time, 600]>');

      // Act
      const result = MasteryPayloadLocator.locateVehicle(mastery, skill(1391, String.empty));

      // Assert: locate() would have answered 1081 here, which is the whole point of the distinction.
      expect(result.id).toBe(1031);
    });

    it('reads a delivery tag off the wrapper skill when the state carries none', () =>
    {
      // Arrange
      globalThis.$dataStates = [];
      globalThis.$dataStates[1411] = state(1411, '<lst:3>');
      globalThis.$dataSkills = [];
      const wrapper = skill(1411, '<passiveStateCount:[1411, enemiesNearby, 1]>');

      // Act
      const result = MasteryPayloadLocator.locateVehicle(state(1411, String.empty), wrapper);

      // Assert
      expect(result.id).toBe(1411);
    });

    it('falls back to the mastery state when nothing is delivered', () =>
    {
      // Arrange
      globalThis.$dataStates = [];
      globalThis.$dataSkills = [];
      const mastery = state(1271, '<onSelfHpHealMp:[10, 0]>');

      // Act
      const result = MasteryPayloadLocator.locateVehicle(mastery, skill(1271, String.empty));

      // Assert
      expect(result.id).toBe(1271);
    });
  });
  //endregion locateVehicle

  //region construction
  describe('construction', () =>
  {
    it('refuses to be instantiated, being a static class', () =>
    {
      // Arrange & Act & Assert
      expect(() => new MasteryPayloadLocator()).toThrow('This is a static class.');
    });
  });
  //endregion construction
});
//endregion plugins/sdp/core/managers/mastery-payload-locator.test.js
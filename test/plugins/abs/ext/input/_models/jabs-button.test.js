//region plugins/abs/ext/input/_models/jabs-button.test.js
import { beforeAll, describe, expect, it } from 'vitest';

describe('J-ABS-Input JABS_Button (unit, pure class, no downstream dependencies)', () =>
{
  let JABS_Button;

  beforeAll(async () =>
  {
    // the empty-array sentinel is defined by J-Base at runtime; this file loads the class alone.
    Array.empty ||= Object.freeze([]);

    ({ default: JABS_Button } = await import('../../../../../../src/plugins/abs/ext/input/_models/JABS_Button.js'));
  });

  describe('allButtons', () =>
  {
    it('includes every defined button constant exactly once', () =>
    {
      const all = JABS_Button.allButtons();
      expect(all).toContain(JABS_Button.Mainhand);
      expect(all).toContain(JABS_Button.CombatSkill4);
      expect(all).toContain(JABS_Button.Menu);
      expect(new Set(all).size).toBe(all.length);
    });

    it('includes Select alongside Menu in the functionality group', () =>
    {
      expect(JABS_Button.allButtons()).toContain(JABS_Button.Select);
    });
  });

  describe('assignableInputs', () =>
  {
    it('filters allButtons down to only the remap-eligible subset', () =>
    {
      const assignable = JABS_Button.assignableInputs();
      expect(assignable).toContain(JABS_Button.Mainhand);
      expect(assignable).toContain(JABS_Button.SkillTrigger);
      expect(assignable).toContain(JABS_Button.Menu);
    });

    it('excludes combat-skill and dodge/guard buttons, since they are not user-remappable', () =>
    {
      const assignable = JABS_Button.assignableInputs();
      expect(assignable).not.toContain(JABS_Button.CombatSkill1);
      expect(assignable).not.toContain(JABS_Button.Dodge);
      expect(assignable).not.toContain(JABS_Button.Guard);
    });

    it('includes Select, since it is both in allButtons and the okInputs allowlist', () =>
    {
      expect(JABS_Button.assignableInputs()).toContain(JABS_Button.Select);
    });
  });

  describe('combatSkillCompositions', () =>
  {
    it('describes every combat skill slot', () =>
    {
      // Arrange/Act
      const compositions = JABS_Button.combatSkillCompositions();

      // Assert
      expect(Object.keys(compositions))
        .toEqual([
          JABS_Button.CombatSkill1,
          JABS_Button.CombatSkill2,
          JABS_Button.CombatSkill3,
          JABS_Button.CombatSkill4,
        ]);
    });

    it('composes every combat skill from the skill trigger modifier', () =>
    {
      // Arrange
      const compositions = JABS_Button.combatSkillCompositions();

      // Act
      const modifiers = Object.values(compositions)
        .map(composition => composition[0]);

      // Assert
      expect(modifiers).toEqual(Array(4).fill(JABS_Button.SkillTrigger));
    });

    it('pairs each combat skill with its own distinct primary button', () =>
    {
      // Arrange
      const compositions = JABS_Button.combatSkillCompositions();

      // Act
      const primaries = Object.values(compositions)
        .map(composition => composition[1]);

      // Assert
      expect(primaries)
        .toEqual([ JABS_Button.Mainhand, JABS_Button.Offhand, JABS_Button.Sprint, JABS_Button.Tool ]);
    });

    it('never composes a combat skill from the retired dodge input', () =>
    {
      // Arrange- dodge remains a real skill slot, but sprint absorbed its input binding, so no
      // combat skill may be described as being produced by pressing dodge.
      const compositions = JABS_Button.combatSkillCompositions();

      // Act
      const allComponents = Object.values(compositions).flat();

      // Assert
      expect(allComponents).not.toContain(JABS_Button.Dodge);
    });

    it('composes combat skills only from remappable buttons, so labels can resolve live bindings', () =>
    {
      // Arrange
      const assignable = JABS_Button.assignableInputs();

      // Act
      const allComponents = Object.values(JABS_Button.combatSkillCompositions()).flat();

      // Assert
      allComponents.forEach(component => expect(assignable).toContain(component));
    });
  });

  describe('combatSkillComposition', () =>
  {
    it('returns the component buttons for a combat skill', () =>
    {
      // Arrange/Act
      const composition = JABS_Button.combatSkillComposition(JABS_Button.CombatSkill1);

      // Assert
      expect(composition).toEqual([ JABS_Button.SkillTrigger, JABS_Button.Mainhand ]);
    });

    it('returns an empty collection for a button that is not a combat skill', () =>
    {
      // Arrange/Act
      const composition = JABS_Button.combatSkillComposition(JABS_Button.Mainhand);

      // Assert
      expect(composition).toEqual([]);
    });
  });
});
//endregion plugins/abs/ext/input/_models/jabs-button.test.js

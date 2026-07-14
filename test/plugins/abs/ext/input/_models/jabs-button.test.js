//region plugins/abs/ext/input/_models/jabs-button.test.js
import { beforeAll, describe, expect, it } from 'vitest';

describe('J-ABS-Input JABS_Button (unit, pure class, no downstream dependencies)', () =>
{
  let JABS_Button;

  beforeAll(async () =>
  {
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
});
//endregion plugins/abs/ext/input/_models/jabs-button.test.js

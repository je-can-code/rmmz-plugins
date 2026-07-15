//region plugins/extend/ext/abs/database/rpg-skill.test.js
import { beforeAll, describe, expect, it } from 'vitest';

describe('RPG_Skill ext/abs augments (direct src import)', () =>
{
  beforeAll(async () =>
  {
    globalThis.J = { EXTEND: { RegExp: { Extend: /<extend:(.*)>/i } } };

    function StubRPGSkill()
    {
    }

    globalThis.RPG_Skill = StubRPGSkill;

    await import('../../../../../../src/plugins/extend/ext/abs/database/RPG_Skill.js');
  });

  describe('isSkillExtender', () =>
  {
    it('is true when the note bears the extend tag', () =>
    {
      // Arrange
      const skill = new globalThis.RPG_Skill();
      skill.note = '<extend:[5,6]>';

      // Act
      const result = skill.isSkillExtender;

      // Assert
      expect(result).toEqual(true);
    });

    it('is false when the note lacks the extend tag', () =>
    {
      // Arrange
      const skill = new globalThis.RPG_Skill();
      skill.note = 'no tags here';

      // Act
      const result = skill.isSkillExtender;

      // Assert
      expect(result).toEqual(false);
    });
  });
});
//endregion plugins/extend/ext/abs/database/rpg-skill.test.js

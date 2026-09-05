//region plugins/extend/ext/abs/managers/jabs-battler.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('JABS_Battler ext/extend-abs augments (direct src import)', () =>
{
  let JABS_Battler;

  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = { EXTEND: { EXT: { ABS: { Aliased: { JABS_Battler: new Map() } } } } };

    function StubJABSBattler()
    {
    }

    StubJABSBattler.prototype.aiSkillFilter = vi.fn();
    globalThis.JABS_Battler = StubJABSBattler;

    await import('../../../../../../src/plugins/extend/ext/abs/managers/JABS_Battler.js');
    ({ JABS_Battler } = globalThis);
  });

  beforeEach(() =>
  {
    vi.clearAllMocks();
  });

  describe('aiSkillFilter', () =>
  {
    it('always calls through to the original aliased implementation', () =>
    {
      // Arrange
      const battler = new JABS_Battler();
      globalThis.J.EXTEND.EXT.ABS.Aliased.JABS_Battler.get('aiSkillFilter').mockReturnValue(true);
      const skill = { isExtension: false };

      // Act
      battler.aiSkillFilter(skill);

      // Assert
      expect(globalThis.J.EXTEND.EXT.ABS.Aliased.JABS_Battler.get('aiSkillFilter')).toHaveBeenCalledWith(skill);
    });

    it('passes through the original rejection when the base filter already rejects the skill', () =>
    {
      // Arrange
      const battler = new JABS_Battler();
      globalThis.J.EXTEND.EXT.ABS.Aliased.JABS_Battler.get('aiSkillFilter').mockReturnValue(false);
      const skill = { isExtension: false };

      // Act
      const result = battler.aiSkillFilter(skill);

      // Assert
      expect(result).toEqual(false);
    });

    it('rejects a skill-extension skill even when the base filter allows it', () =>
    {
      // Arrange
      const battler = new JABS_Battler();
      globalThis.J.EXTEND.EXT.ABS.Aliased.JABS_Battler.get('aiSkillFilter').mockReturnValue(true);
      const skill = { isExtension: true };

      // Act
      const result = battler.aiSkillFilter(skill);

      // Assert
      expect(result).toEqual(false);
    });

    it('allows a normal, non-extension skill when the base filter allows it', () =>
    {
      // Arrange
      const battler = new JABS_Battler();
      globalThis.J.EXTEND.EXT.ABS.Aliased.JABS_Battler.get('aiSkillFilter').mockReturnValue(true);
      const skill = { isExtension: false };

      // Act
      const result = battler.aiSkillFilter(skill);

      // Assert
      expect(result).toEqual(true);
    });
  });
});
//endregion plugins/extend/ext/abs/managers/jabs-battler.test.js

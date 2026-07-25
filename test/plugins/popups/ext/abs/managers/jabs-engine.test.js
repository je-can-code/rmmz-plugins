//region plugins/popups/ext/abs/managers/jabs-engine.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('JABS_Engine ext/abs augments (direct src import)', () =>
{
  let JABS_Engine;
  let FakeJABSPopupManager;

  beforeAll(async () =>
  {
    vi.resetModules();

    FakeJABSPopupManager = {
      showAttackPop: vi.fn(),
      showSkillUsedPop: vi.fn(),
      showExperiencePop: vi.fn(),
      showGoldPop: vi.fn(),
      showItemPickedUpPops: vi.fn(),
      showLevelUpPop: vi.fn(),
      showSkillLearnPop: vi.fn(),
    };
    vi.doMock('../../../../../../src/plugins/popups/ext/abs/managers/JABS_PopupManager.js', () => ({ default: FakeJABSPopupManager }));

    globalThis.J = { POPUPS: { EXT: { ABS: { Aliased: { JABS_Engine: new Map() } } } } };

    function StubJABSEngine()
    {
    }

    StubJABSEngine.prototype.postPrimaryBattleEffects = vi.fn();
    StubJABSEngine.prototype.gainExperienceReward = vi.fn();
    StubJABSEngine.prototype.gainGoldReward = vi.fn();
    StubJABSEngine.prototype.onItemPickedUp = vi.fn();
    StubJABSEngine.prototype.battlerLevelup = vi.fn();
    StubJABSEngine.prototype.battlerSkillLearn = vi.fn();
    globalThis.JABS_Engine = StubJABSEngine;

    globalThis.JABS_AiManager = { getBattlerByUuid: vi.fn() };

    await import('../../../../../../src/plugins/popups/ext/abs/managers/JABS_Engine.js');
    ({ JABS_Engine } = globalThis);
  });

  beforeEach(() =>
  {
    vi.clearAllMocks();
  });

  describe('postPrimaryBattleEffects', () =>
  {
    it('always calls through to the original aliased implementation, then shows attack + skill-used pops', () =>
    {
      // Arrange
      const engine = new JABS_Engine();
      const action = {};
      const target = {};

      // Act
      engine.postPrimaryBattleEffects(action, target);

      // Assert
      expect(globalThis.J.POPUPS.EXT.ABS.Aliased.JABS_Engine.get('postPrimaryBattleEffects')).toHaveBeenCalledWith(action, target);
      expect(FakeJABSPopupManager.showAttackPop).toHaveBeenCalledWith(action, target, engine);
      expect(FakeJABSPopupManager.showSkillUsedPop).toHaveBeenCalledWith(action);
    });
  });

  describe('gainExperienceReward', () =>
  {
    it('always calls through to the original aliased implementation', () =>
    {
      // Arrange
      const engine = new JABS_Engine();

      // Act
      engine.gainExperienceReward(0, {});

      // Assert
      expect(globalThis.J.POPUPS.EXT.ABS.Aliased.JABS_Engine.get('gainExperienceReward')).toHaveBeenCalledWith(0, {});
    });

    it('does not show a popup when there is no experience', () =>
    {
      // Arrange
      const engine = new JABS_Engine();

      // Act
      engine.gainExperienceReward(0, {});

      // Assert
      expect(FakeJABSPopupManager.showExperiencePop).not.toHaveBeenCalled();
    });

    it('shows an experience popup when experience was gained', () =>
    {
      // Arrange
      const engine = new JABS_Engine();
      const character = {};

      // Act
      engine.gainExperienceReward(50, character);

      // Assert
      expect(FakeJABSPopupManager.showExperiencePop).toHaveBeenCalledWith(50, character);
    });
  });

  describe('gainGoldReward', () =>
  {
    it('does not show a popup when there is no gold', () =>
    {
      // Arrange
      const engine = new JABS_Engine();

      // Act
      engine.gainGoldReward(0, {});

      // Assert
      expect(FakeJABSPopupManager.showGoldPop).not.toHaveBeenCalled();
    });

    it('shows a gold popup when gold was gained', () =>
    {
      // Arrange
      const engine = new JABS_Engine();
      const character = {};

      // Act
      engine.gainGoldReward(100, character);

      // Assert
      expect(FakeJABSPopupManager.showGoldPop).toHaveBeenCalledWith(100, character);
    });
  });

  describe('onItemPickedUp', () =>
  {
    it('shows item-picked-up popups for the list', () =>
    {
      // Arrange
      const engine = new JABS_Engine();
      const itemDataList = [ {} ];
      const character = {};

      // Act
      engine.onItemPickedUp(itemDataList, character);

      // Assert
      expect(FakeJABSPopupManager.showItemPickedUpPops).toHaveBeenCalledWith(itemDataList, character);
    });
  });

  describe('battlerLevelup', () =>
  {
    it('does nothing when there is no associated JABS battler', () =>
    {
      // Arrange
      const engine = new JABS_Engine();
      globalThis.JABS_AiManager.getBattlerByUuid.mockReturnValue(null);

      // Act
      engine.battlerLevelup('uuid-1');

      // Assert
      expect(FakeJABSPopupManager.showLevelUpPop).not.toHaveBeenCalled();
    });

    it('shows a level-up popup on the resolved battler character', () =>
    {
      // Arrange
      const engine = new JABS_Engine();
      const character = {};
      globalThis.JABS_AiManager.getBattlerByUuid.mockReturnValue({ getCharacter: () => character });

      // Act
      engine.battlerLevelup('uuid-1');

      // Assert
      expect(FakeJABSPopupManager.showLevelUpPop).toHaveBeenCalledWith(character);
    });
  });

  describe('battlerSkillLearn', () =>
  {
    it('does nothing when there is no associated JABS battler', () =>
    {
      // Arrange
      const engine = new JABS_Engine();
      globalThis.JABS_AiManager.getBattlerByUuid.mockReturnValue(null);
      const skill = {};

      // Act
      engine.battlerSkillLearn(skill, 'uuid-1');

      // Assert
      expect(FakeJABSPopupManager.showSkillLearnPop).not.toHaveBeenCalled();
    });

    it('shows a skill-learn popup on the resolved battler character', () =>
    {
      // Arrange
      const engine = new JABS_Engine();
      const character = {};
      globalThis.JABS_AiManager.getBattlerByUuid.mockReturnValue({ getCharacter: () => character });
      const skill = {};

      // Act
      engine.battlerSkillLearn(skill, 'uuid-1');

      // Assert
      expect(FakeJABSPopupManager.showSkillLearnPop).toHaveBeenCalledWith(skill, character);
    });
  });
});
//endregion plugins/popups/ext/abs/managers/jabs-engine.test.js

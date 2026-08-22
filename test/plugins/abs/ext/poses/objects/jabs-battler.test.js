//region plugins/abs/ext/poses/objects/jabs-battler.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('J-ABS-Poses JABS_Battler (unit, all downstream dependencies mocked)', () =>
{
  /** @type {import('vitest').Mock} the "original" (aliased) prototype methods this file wraps- kept
   *  as stable variables and mutated in place, never reassigned, since the Aliased map captures a
   *  fixed reference to whichever function object sat on the prototype at import time. */
  let originalInitialize;
  let originalUpdate;
  let originalStartGuarding;
  let originalExecuteDodgeSkill;

  beforeAll(async () =>
  {
    vi.resetModules();

    // minimal J.ABS.EXT.POSES namespace- only the shape this one file reads/writes.
    globalThis.J = {
      ABS: {
        EXT: {
          POSES: {
            Aliased: { JABS_Battler: new Map() },
            Helpers: { gameAssetExists: vi.fn() },
          },
        },
      },
    };

    // $jabsEngine is a bare RMMZ-style singleton global; only canUpdatePoses reaches for it.
    globalThis.$jabsEngine = { absEnabled: true };

    // ImageManager/Utils are bare RMMZ singleton globals; only tryStartPose reaches for them.
    globalThis.ImageManager = { loadCharacter: vi.fn() };
    globalThis.Utils = { encodeURI: (name) => name };

    // JABS_Battler.prototype.<method> is aliased ("original") before this file overwrites each;
    // stub each with a bare mock rather than pulling in the real JABS_Battler chain.
    function JABS_Battler()
    {
    }

    originalInitialize = vi.fn();
    originalUpdate = vi.fn();
    originalStartGuarding = vi.fn();
    originalExecuteDodgeSkill = vi.fn();
    JABS_Battler.prototype.initialize = originalInitialize;
    JABS_Battler.prototype.update = originalUpdate;
    JABS_Battler.prototype.startGuarding = originalStartGuarding;
    JABS_Battler.prototype.executeDodgeSkill = originalExecuteDodgeSkill;
    globalThis.JABS_Battler = JABS_Battler;

    // the file under test- patches globalThis.JABS_Battler.prototype directly, no vm involved.
    await import('../../../../../../src/plugins/abs/ext/poses/objects/JABS_Battler.js');
  });

  beforeEach(() =>
  {
    originalInitialize.mockReset();
    originalUpdate.mockReset();
    originalStartGuarding.mockReset();
    originalExecuteDodgeSkill.mockReset();
    globalThis.J.ABS.EXT.POSES.Helpers.gameAssetExists.mockReset();
    globalThis.ImageManager.loadCharacter.mockReset();
    globalThis.$jabsEngine.absEnabled = true;
  });

  /**
   * Builds a duck-typed JABS_Battler carrying the real patched prototype, plus a duck-typed
   * character carrying only the properties/methods the pose logic touches.
   * @param {object} [overrides]
   * @returns {object}
   */
  function buildBattler(overrides = {})
  {
    const character = {
      _characterName: 'Actor1',
      _characterIndex: 0,
      _pattern: 0,
      setImage: vi.fn(function(name, index)
      {
        this._characterName = name;
        this._characterIndex = index;
      }),
    };

    const battler = Object.create(globalThis.JABS_Battler.prototype);
    battler.getCharacter = () => character;
    battler.guarding = () => false;
    battler.initPoseInfo();

    return Object.assign(battler, overrides);
  }

  describe('initialize', () =>
  {
    it('calls the original initialize then initializes pose info', () =>
    {
      // Arrange
      const battler = Object.create(globalThis.JABS_Battler.prototype);
      battler.getCharacter = () => ({ _characterName: 'Actor1', _characterIndex: 0 });
      const event = { id: 'event' };
      const rawBattler = { id: 'battler' };
      const coreData = { id: 'coreData' };

      // Act
      battler.initialize(event, rawBattler, coreData);

      // Assert
      expect(originalInitialize).toHaveBeenCalledWith(event, rawBattler, coreData);
      expect(battler.getPoseFrames()).toBe(0);
      expect(battler.getBaseSpriteImage()).toBe('Actor1');
    });
  });

  describe('pose frame counters', () =>
  {
    it('getPoseFrames/setPoseFrames/modPoseFrames/hasPoseFrames track the frame count', () =>
    {
      // Arrange
      const battler = buildBattler();

      // Act / Assert- setPoseFrames.
      expect(battler.setPoseFrames(5)).toBe(5);
      expect(battler.getPoseFrames()).toBe(5);
      expect(battler.hasPoseFrames()).toBe(true);

      // Act / Assert- modPoseFrames.
      expect(battler.modPoseFrames(-2)).toBe(3);
      expect(battler.getPoseFrames()).toBe(3);
    });

    it('hasPoseFrames is false when there are no frames remaining', () =>
    {
      // Arrange
      const battler = buildBattler();

      // Act
      battler.setPoseFrames(0);

      // Assert
      expect(battler.hasPoseFrames()).toBe(false);
    });
  });

  describe('base sprite info getters/setters', () =>
  {
    it('getBaseSpriteImage/setBaseSpriteImage track the base image name', () =>
    {
      // Arrange
      const battler = buildBattler();

      // Act
      battler.setBaseSpriteImage('Actor2');

      // Assert
      expect(battler.getBaseSpriteImage()).toBe('Actor2');
    });

    it('getBaseSpriteIndex/setBaseSpriteIndex track the base sprite index', () =>
    {
      // Arrange
      const battler = buildBattler();

      // Act
      battler.setBaseSpriteIndex(3);

      // Assert
      expect(battler.getBaseSpriteIndex()).toBe(3);
    });
  });

  describe('posing flag', () =>
  {
    it('isPosing/startPosing/endPosing track the posing flag', () =>
    {
      // Arrange
      const battler = buildBattler();
      expect(battler.isPosing()).toBe(false);

      // Act
      battler.startPosing();

      // Assert
      expect(battler.isPosing()).toBe(true);

      // Act
      battler.endPosing();

      // Assert
      expect(battler.isPosing()).toBe(false);
    });
  });

  describe('captureBaseSpriteInfo', () =>
  {
    it('captures the current character sprite name and index', () =>
    {
      // Arrange
      const battler = buildBattler();
      battler.getCharacter()._characterName = 'Actor3';
      battler.getCharacter()._characterIndex = 4;

      // Act
      battler.captureBaseSpriteInfo();

      // Assert
      expect(battler.getBaseSpriteImage()).toBe('Actor3');
      expect(battler.getBaseSpriteIndex()).toBe(4);
    });
  });

  describe('getCharacterSpriteName / getCharacterSpriteIndex', () =>
  {
    it('reads the current character sprite name and index', () =>
    {
      // Arrange
      const battler = buildBattler();
      battler.getCharacter()._characterName = 'Actor4';
      battler.getCharacter()._characterIndex = 2;

      // Act / Assert
      expect(battler.getCharacterSpriteName()).toBe('Actor4');
      expect(battler.getCharacterSpriteIndex()).toBe(2);
    });
  });

  describe('setPosePattern', () =>
  {
    it('sets the pose pattern on the underlying character', () =>
    {
      // Arrange
      const battler = buildBattler();

      // Act
      battler.setPosePattern(2);

      // Assert
      expect(battler.getCharacter()._pattern).toBe(2);
    });
  });

  describe('performActionPose', () =>
  {
    it('ends the prior animation when already posing before trying the new pose', () =>
    {
      // Arrange
      const battler = buildBattler();
      battler.startPosing();
      battler.endAnimation = vi.fn();
      battler.tryStartPose = vi.fn();
      const skill = { jabsPoseData: null };

      // Act
      battler.performActionPose(skill);

      // Assert
      expect(battler.endAnimation).toHaveBeenCalledTimes(1);
    });

    it('leaves the prior animation alone when not currently posing', () =>
    {
      // Arrange- nothing else in this method can suppress the premature end; the posing state is
      // the only gate in front of it.
      const battler = buildBattler();
      battler.endAnimation = vi.fn();
      battler.tryStartPose = vi.fn();
      const skill = { jabsPoseData: null };

      // Act
      battler.performActionPose(skill);

      // Assert
      expect(battler.endAnimation).not.toHaveBeenCalled();
    });

    it('does not try to start a pose when the skill has no pose data', () =>
    {
      // Arrange
      const battler = buildBattler();
      battler.tryStartPose = vi.fn();
      const skill = { jabsPoseData: null };

      // Act
      battler.performActionPose(skill);

      // Assert
      expect(battler.tryStartPose).not.toHaveBeenCalled();
    });

    it('tries to start the pose when the skill has pose data', () =>
    {
      // Arrange
      const battler = buildBattler();
      battler.tryStartPose = vi.fn();
      const skill = { jabsPoseData: [ 'suffix', 0, 10 ] };

      // Act
      battler.performActionPose(skill);

      // Assert
      expect(battler.tryStartPose).toHaveBeenCalledWith(skill);
    });
  });

  describe('tryStartPose', () =>
  {
    it('swaps to the pose sprite when the pose sheet exists on disk', () =>
    {
      // Arrange
      const battler = buildBattler();
      battler.getCharacter()._characterName = 'Actor1';
      globalThis.J.ABS.EXT.POSES.Helpers.gameAssetExists.mockReturnValue(true);
      const skill = { jabsPoseDuration: 12, jabsPoseSuffix: '_attack', jabsPoseIndex: 1 };

      // Act
      battler.tryStartPose(skill);

      // Assert
      expect(globalThis.ImageManager.loadCharacter).toHaveBeenCalledWith('Actor1_attack');
      expect(battler.getCharacter().setImage).toHaveBeenCalledWith('Actor1_attack', 1);
      expect(battler.getPoseFrames()).toBe(12);
    });

    it('does not swap the sprite when the pose sheet does not exist on disk', () =>
    {
      // Arrange
      const battler = buildBattler();
      globalThis.J.ABS.EXT.POSES.Helpers.gameAssetExists.mockReturnValue(false);
      const skill = { jabsPoseDuration: 12, jabsPoseSuffix: '_attack', jabsPoseIndex: 1 };

      // Act
      battler.tryStartPose(skill);

      // Assert
      expect(globalThis.ImageManager.loadCharacter).not.toHaveBeenCalled();
      expect(battler.getCharacter().setImage).not.toHaveBeenCalled();
    });
  });

  describe('endAnimation', () =>
  {
    it('zeroes the pose duration and resets the pose', () =>
    {
      // Arrange
      const battler = buildBattler();
      battler.setPoseDuration(10);
      battler.resetPose = vi.fn();

      // Act
      battler.endAnimation();

      // Assert
      expect(battler.getPoseFrames()).toBe(0);
      expect(battler.resetPose).toHaveBeenCalledTimes(1);
    });
  });

  describe('setPoseDuration', () =>
  {
    it('sets the pose frames then normalizes the posing state', () =>
    {
      // Arrange
      const battler = buildBattler();

      // Act
      battler.setPoseDuration(5);

      // Assert
      expect(battler.getPoseFrames()).toBe(5);
      expect(battler.isPosing()).toBe(true);
    });
  });

  describe('normalizePosing', () =>
  {
    it('starts posing when there are pose frames remaining', () =>
    {
      // Arrange
      const battler = buildBattler();
      battler.setPoseFrames(3);

      // Act
      battler.normalizePosing();

      // Assert
      expect(battler.isPosing()).toBe(true);
    });

    it('stops posing and zeroes the frame count when there are no frames remaining', () =>
    {
      // Arrange
      const battler = buildBattler();
      battler.startPosing();
      battler.setPoseFrames(0);

      // Act
      battler.normalizePosing();

      // Assert
      expect(battler.isPosing()).toBe(false);
      expect(battler.getPoseFrames()).toBe(0);
    });
  });

  describe('resetPose', () =>
  {
    it('does nothing when there is no base sprite image or index to reset to', () =>
    {
      // Arrange
      const battler = buildBattler();
      battler.setBaseSpriteImage(String.empty);
      battler.setBaseSpriteIndex(0);

      // Act
      battler.resetPose();

      // Assert
      expect(battler.getCharacter().setImage).not.toHaveBeenCalled();
    });

    it('ends the animation first when currently posing', () =>
    {
      // Arrange
      const battler = buildBattler();
      battler.setBaseSpriteImage('Actor1');
      battler.setBaseSpriteIndex(0);
      battler.startPosing();
      battler.endAnimation = vi.fn();

      // Act
      battler.resetPose();

      // Assert
      expect(battler.endAnimation).toHaveBeenCalledTimes(1);
    });

    it('restores the original sprite when only the sprite sheet differs', () =>
    {
      // Arrange- the index deliberately still matches, so the sheet name is the only thing that
      // can justify the restore.
      const battler = buildBattler();
      battler.setBaseSpriteImage('Actor1');
      battler.setBaseSpriteIndex(0);
      battler.getCharacter()._characterName = 'Actor1_attack';
      battler.getCharacter()._characterIndex = 0;

      // Act
      battler.resetPose();

      // Assert
      expect(battler.getCharacter().setImage).toHaveBeenCalledWith('Actor1', 0);
    });

    it('restores the original sprite when only the sprite index differs', () =>
    {
      // Arrange- the sheet name deliberately still matches, so the index is the only thing that
      // can justify the restore.
      const battler = buildBattler();
      battler.setBaseSpriteImage('Actor1');
      battler.setBaseSpriteIndex(0);
      battler.getCharacter()._characterName = 'Actor1';
      battler.getCharacter()._characterIndex = 1;

      // Act
      battler.resetPose();

      // Assert
      expect(battler.getCharacter().setImage).toHaveBeenCalledWith('Actor1', 0);
    });

    it('does not touch the sprite when it already matches the original', () =>
    {
      // Arrange
      const battler = buildBattler();
      battler.setBaseSpriteImage('Actor1');
      battler.setBaseSpriteIndex(0);
      battler.getCharacter()._characterName = 'Actor1';
      battler.getCharacter()._characterIndex = 0;

      // Act
      battler.resetPose();

      // Assert
      expect(battler.getCharacter().setImage).not.toHaveBeenCalled();
    });
  });

  describe('update / updatePoses', () =>
  {
    it('calls the original update then updates the pose effects', () =>
    {
      // Arrange
      const battler = buildBattler();
      battler.updatePoses = vi.fn();

      // Act
      battler.update();

      // Assert
      expect(originalUpdate).toHaveBeenCalledTimes(1);
      expect(battler.updatePoses).toHaveBeenCalledTimes(1);
    });

    it('does nothing when pose effects cannot currently be updated', () =>
    {
      // Arrange
      const battler = buildBattler();
      battler.canUpdatePoses = () => false;
      battler.countdownPoseTimer = vi.fn();
      battler.handlePosePattern = vi.fn();

      // Act
      battler.updatePoses();

      // Assert
      expect(battler.countdownPoseTimer).not.toHaveBeenCalled();
      expect(battler.handlePosePattern).not.toHaveBeenCalled();
    });

    it('counts down the timer and handles the pose pattern when updates are allowed', () =>
    {
      // Arrange
      const battler = buildBattler();
      battler.canUpdatePoses = () => true;
      battler.countdownPoseTimer = vi.fn();
      battler.handlePosePattern = vi.fn();

      // Act
      battler.updatePoses();

      // Assert
      expect(battler.countdownPoseTimer).toHaveBeenCalledTimes(1);
      expect(battler.handlePosePattern).toHaveBeenCalledTimes(1);
    });
  });

  describe('canUpdatePoses', () =>
  {
    it('is false when jabs is not enabled', () =>
    {
      // Arrange
      globalThis.$jabsEngine.absEnabled = false;
      const battler = buildBattler();
      battler.startPosing();

      // Act / Assert
      expect(battler.canUpdatePoses()).toBe(false);
    });

    it('is false when this battler is not currently posing', () =>
    {
      // Arrange
      const battler = buildBattler();

      // Act / Assert
      expect(battler.canUpdatePoses()).toBe(false);
    });

    it('is true when jabs is enabled and this battler is posing', () =>
    {
      // Arrange
      const battler = buildBattler();
      battler.startPosing();

      // Act / Assert
      expect(battler.canUpdatePoses()).toBe(true);
    });
  });

  describe('countdownPoseTimer', () =>
  {
    it('does not decrement while guarding', () =>
    {
      // Arrange
      const battler = buildBattler({ guarding: () => true });
      battler.setPoseFrames(5);

      // Act
      battler.countdownPoseTimer();

      // Assert
      expect(battler.getPoseFrames()).toBe(5);
    });

    it('decrements the pose frames when there are frames remaining', () =>
    {
      // Arrange
      const battler = buildBattler();
      battler.setPoseFrames(5);

      // Act
      battler.countdownPoseTimer();

      // Assert
      expect(battler.getPoseFrames()).toBe(4);
    });

    it('does not decrement when there are no pose frames remaining', () =>
    {
      // Arrange
      const battler = buildBattler();
      battler.setPoseFrames(0);

      // Act
      battler.countdownPoseTimer();

      // Assert
      expect(battler.getPoseFrames()).toBe(0);
    });
  });

  describe('handlePosePattern', () =>
  {
    it('manages the pose pattern when there are pose frames remaining', () =>
    {
      // Arrange
      const battler = buildBattler();
      battler.setPoseFrames(5);
      battler.managePosePattern = vi.fn();
      battler.resetPose = vi.fn();

      // Act
      battler.handlePosePattern();

      // Assert
      expect(battler.managePosePattern).toHaveBeenCalledTimes(1);
      expect(battler.resetPose).not.toHaveBeenCalled();
    });

    it('resets the pose when there are no pose frames remaining', () =>
    {
      // Arrange
      const battler = buildBattler();
      battler.setPoseFrames(0);
      battler.managePosePattern = vi.fn();
      battler.resetPose = vi.fn();

      // Act
      battler.handlePosePattern();

      // Assert
      expect(battler.resetPose).toHaveBeenCalledTimes(1);
      expect(battler.managePosePattern).not.toHaveBeenCalled();
    });
  });

  describe('managePosePattern', () =>
  {
    it('sets the pattern to 0 when fewer than 4 pose frames remain', () =>
    {
      // Arrange
      const battler = buildBattler();
      battler.setPoseFrames(3);

      // Act
      battler.managePosePattern();

      // Assert
      expect(battler.getCharacter()._pattern).toBe(0);
    });

    it('sets the pattern to 2 when more than 10 pose frames remain', () =>
    {
      // Arrange
      const battler = buildBattler();
      battler.setPoseFrames(11);

      // Act
      battler.managePosePattern();

      // Assert
      expect(battler.getCharacter()._pattern).toBe(2);
    });

    it('sets the pattern to 1 when between 5 and 10 pose frames remain', () =>
    {
      // Arrange
      const battler = buildBattler();
      battler.setPoseFrames(7);

      // Act
      battler.managePosePattern();

      // Assert
      expect(battler.getCharacter()._pattern).toBe(1);
    });
  });

  describe('startGuarding', () =>
  {
    it('performs the original logic then poses for the equipped guard skill', () =>
    {
      // Arrange
      const battler = buildBattler();
      const skill = { id: 7 };
      battler.getBattler = () => ({ getGuardSkillId: vi.fn(() => 7) });
      battler.getSkill = vi.fn(() => skill);
      battler.performActionPose = vi.fn();

      // Act
      battler.startGuarding();

      // Assert
      expect(originalStartGuarding).toHaveBeenCalledWith();
      expect(battler.getSkill).toHaveBeenCalledWith(7);
      expect(battler.performActionPose).toHaveBeenCalledWith(skill);
    });
  });

  describe('executeDodgeSkill', () =>
  {
    it('performs the original logic then poses for the dodge skill', () =>
    {
      // Arrange
      const battler = buildBattler();
      const skill = { id: 9 };
      battler.performActionPose = vi.fn();

      // Act
      battler.executeDodgeSkill(skill, 4);

      // Assert
      expect(originalExecuteDodgeSkill).toHaveBeenCalledWith(skill, 4);
      expect(battler.performActionPose).toHaveBeenCalledWith(skill);
    });
  });
});
//endregion plugins/abs/ext/poses/objects/jabs-battler.test.js

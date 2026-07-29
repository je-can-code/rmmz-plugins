//region plugins/abs/ext/danger/sprites/sprite-character.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('J-ABS-Danger Sprite_Character (unit, all downstream dependencies mocked)', () =>
{
  /** @type {import('vitest').Mock} the "original" (aliased) prototype methods this file wraps. */
  let originalInitMembers;
  let originalSetupJabsSprite;
  let originalUpdate;

  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = {
      ABS: {
        EXT: {
          DANGER: {
            Aliased: { Sprite_Character: new Map() },
          },
        },
      },
    };

    // Sprite_Icon is a bare RMMZ-style global constructed by createDangerIndicatorSprite.
    globalThis.Sprite_Icon = vi.fn(function()
    {
      this.hide = vi.fn();
      this.show = vi.fn();
      this.setIconIndex = vi.fn();
      this.scale = { x: 1, y: 1 };
      this.move = vi.fn();
    });

    function Sprite_Character()
    {
    }

    originalInitMembers = vi.fn();
    originalSetupJabsSprite = vi.fn();
    originalUpdate = vi.fn();
    Sprite_Character.prototype.initMembers = originalInitMembers;
    Sprite_Character.prototype.setupJabsSprite = originalSetupJabsSprite;
    Sprite_Character.prototype.update = originalUpdate;

    // J-Base defines this accessor on every Sprite_Character; production code reads through it.
    Sprite_Character.prototype.character = function() { return this._character; };
    globalThis.Sprite_Character = Sprite_Character;

    await import('../../../../../../src/plugins/abs/ext/danger/sprites/Sprite_Character.js');
  });

  beforeEach(() =>
  {
    originalInitMembers.mockReset();
    originalSetupJabsSprite.mockReset();
    originalUpdate.mockReset();
    globalThis.Sprite_Icon.mockClear();
    globalThis.$jabsEngine = { getPlayer1: vi.fn() };
  });

  function buildSprite(overrides = {})
  {
    const sprite = Object.create(globalThis.Sprite_Character.prototype);
    sprite.addChild = vi.fn();
    sprite.canUpdate = () => true;
    sprite.isJabsBattler = () => true;
    sprite.getBattler = () => ({ id: 'battler' });
    sprite._character = { getJabsBattler: () => ({ showDangerIndicator: () => true }) };
    sprite.initMembers();
    return Object.assign(sprite, overrides);
  }

  describe('initMembers', () =>
  {
    it('calls the original initMembers then initializes the danger indicator slot to null', () =>
    {
      // Arrange
      const sprite = Object.create(globalThis.Sprite_Character.prototype);

      // Act
      sprite.initMembers();

      // Assert
      expect(originalInitMembers).toHaveBeenCalledTimes(1);
      expect(sprite._j._dangerIndicator).toBeNull();
    });
  });

  describe('setupJabsSprite', () =>
  {
    it('performs the original logic then sets up the battler visuals and danger indicator', () =>
    {
      // Arrange
      const sprite = buildSprite();
      sprite.handleBattlerSetup = vi.fn();
      sprite.setupDangerIndicator = vi.fn();

      // Act
      sprite.setupJabsSprite();

      // Assert
      expect(originalSetupJabsSprite).toHaveBeenCalledTimes(1);
      expect(sprite.handleBattlerSetup).toHaveBeenCalledTimes(1);
      expect(sprite.setupDangerIndicator).toHaveBeenCalledTimes(1);
    });
  });

  describe('setupDangerIndicator', () =>
  {
    it('creates and attaches a new indicator sprite when none exists yet', () =>
    {
      // Arrange
      const sprite = buildSprite();
      sprite.getDangerIndicatorIcon = () => 5;

      // Act
      sprite.setupDangerIndicator();

      // Assert
      expect(globalThis.Sprite_Icon).toHaveBeenCalledWith(5);
      expect(sprite.addChild).toHaveBeenCalledWith(sprite._j._dangerIndicator);
      expect(sprite._j._dangerIndicator.hide).toHaveBeenCalledTimes(1);
      expect(sprite._j._dangerIndicator.scale).toEqual({ x: 0.5, y: 0.5 });
      expect(sprite._j._dangerIndicator.move).toHaveBeenCalledWith(-50, 8);
    });

    it('overwrites the icon on the existing indicator instead of creating a new one', () =>
    {
      // Arrange
      const sprite = buildSprite();
      sprite.getDangerIndicatorIcon = () => 5;
      sprite.setupDangerIndicator();
      globalThis.Sprite_Icon.mockClear();
      sprite.addChild.mockClear();
      sprite.getDangerIndicatorIcon = () => 9;

      // Act
      sprite.setupDangerIndicator();

      // Assert
      expect(globalThis.Sprite_Icon).not.toHaveBeenCalled();
      expect(sprite.addChild).not.toHaveBeenCalled();
      expect(sprite._j._dangerIndicator.setIconIndex).toHaveBeenCalledWith(9);
    });
  });

  describe('getDangerIndicatorIcon', () =>
  {
    it('returns -1 when there is no battler on this sprite', () =>
    {
      // Arrange
      const sprite = buildSprite({ getBattler: () => null });

      // Act / Assert
      expect(sprite.getDangerIndicatorIcon()).toBe(-1);
    });

    it('returns -1 when the battler on this sprite is the player', () =>
    {
      // Arrange
      const battler = { id: 'battler' };
      const sprite = buildSprite({ getBattler: () => battler });
      globalThis.$jabsEngine.getPlayer1.mockReturnValue({ getBattler: () => battler });

      // Act / Assert
      expect(sprite.getDangerIndicatorIcon()).toBe(-1);
    });

    it('delegates to the battler icon calculation otherwise', () =>
    {
      // Arrange
      const battler = { id: 'battler', getDangerIndicatorIcon: () => 3 };
      const sprite = buildSprite({ getBattler: () => battler });
      globalThis.$jabsEngine.getPlayer1.mockReturnValue({ getBattler: () => ({ id: 'other' }) });

      // Act / Assert
      expect(sprite.getDangerIndicatorIcon()).toBe(3);
    });
  });

  describe('update', () =>
  {
    it('performs the original logic then updates the indicator when updates are allowed', () =>
    {
      // Arrange
      const sprite = buildSprite();
      sprite.canUpdateDangerIndicator = () => true;
      sprite.updateDangerIndicator = vi.fn();
      sprite.hideDangerIndicator = vi.fn();

      // Act
      sprite.update();

      // Assert
      expect(originalUpdate).toHaveBeenCalledTimes(1);
      expect(sprite.updateDangerIndicator).toHaveBeenCalledTimes(1);
      expect(sprite.hideDangerIndicator).not.toHaveBeenCalled();
    });

    it('hides the indicator when updates are not allowed', () =>
    {
      // Arrange
      const sprite = buildSprite();
      sprite.canUpdateDangerIndicator = () => false;
      sprite.updateDangerIndicator = vi.fn();
      sprite.hideDangerIndicator = vi.fn();

      // Act
      sprite.update();

      // Assert
      expect(sprite.hideDangerIndicator).toHaveBeenCalledTimes(1);
      expect(sprite.updateDangerIndicator).not.toHaveBeenCalled();
    });
  });

  describe('canUpdateDangerIndicator', () =>
  {
    it('is false when this sprite cannot update at all', () =>
    {
      const sprite = buildSprite({ canUpdate: () => false });
      expect(sprite.canUpdateDangerIndicator()).toBe(false);
    });

    it('is false when this sprite has no jabs battler', () =>
    {
      const sprite = buildSprite({ isJabsBattler: () => false });
      expect(sprite.canUpdateDangerIndicator()).toBe(false);
    });

    it('is false when the jabs battler is configured not to show the indicator', () =>
    {
      const sprite = buildSprite({
        _character: { getJabsBattler: () => ({ showDangerIndicator: () => false }) },
      });
      expect(sprite.canUpdateDangerIndicator()).toBe(false);
    });

    it('is true when updates are allowed, a jabs battler exists, and it should show', () =>
    {
      const sprite = buildSprite();
      expect(sprite.canUpdateDangerIndicator()).toBe(true);
    });
  });

  describe('showDangerIndicator / hideDangerIndicator', () =>
  {
    it('shows the indicator sprite', () =>
    {
      // Arrange
      const sprite = buildSprite();
      sprite.getDangerIndicatorIcon = () => 1;
      sprite.setupDangerIndicator();

      // Act
      sprite.showDangerIndicator();

      // Assert
      expect(sprite._j._dangerIndicator.show).toHaveBeenCalledTimes(1);
    });

    it('hides the indicator sprite', () =>
    {
      // Arrange- setupDangerIndicator itself calls hide() once on creation; reset before the
      // actual assertion so this test only observes hideDangerIndicator's own call.
      const sprite = buildSprite();
      sprite.getDangerIndicatorIcon = () => 1;
      sprite.setupDangerIndicator();
      sprite._j._dangerIndicator.hide.mockClear();

      // Act
      sprite.hideDangerIndicator();

      // Assert
      expect(sprite._j._dangerIndicator.hide).toHaveBeenCalledTimes(1);
    });
  });
});
//endregion plugins/abs/ext/danger/sprites/sprite-character.test.js

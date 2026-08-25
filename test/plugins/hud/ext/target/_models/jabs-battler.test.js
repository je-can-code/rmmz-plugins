//region plugins/hud/ext/target/_models/jabs-battler.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('JABS_Battler (J-HUD-TargetFrame) (direct src import)', () =>
{
  /** @type {import('vitest').Mock} the "original" (aliased) setBattlerLastHit. */
  let originalSetBattlerLastHit;

  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = {
      HUD: {
        EXT: {
          TARGET: {
            Aliased: { JABS_Battler: new Map() },
            Metadata: { EnableHP: true, EnableMP: true, EnableTP: true },
          },
        },
      },
    };

    function JABS_Battler()
    {
    }

    originalSetBattlerLastHit = vi.fn();
    JABS_Battler.prototype.setBattlerLastHit = originalSetBattlerLastHit;
    JABS_Battler.prototype.isPlayer = () => false;
    JABS_Battler.prototype.isEnemy = () => false;
    globalThis.JABS_Battler = JABS_Battler;

    await import('../../../../../../src/plugins/hud/ext/target/_models/JABS_Battler.js');
  });

  beforeEach(() =>
  {
    originalSetBattlerLastHit.mockReset();
    globalThis.$hudManager = { setNewTarget: vi.fn(), requestTargetFrameRefresh: vi.fn() };
  });

  function buildBattler(overrides = {})
  {
    const battler = Object.create(globalThis.JABS_Battler.prototype);
    return Object.assign(battler, overrides);
  }

  describe('setBattlerLastHit', () =>
  {
    it('always calls through to the original aliased implementation', () =>
    {
      // Arrange
      const battler = buildBattler({ isPlayer: () => false });
      const lastHit = {};

      // Act
      battler.setBattlerLastHit(lastHit);

      // Assert
      expect(originalSetBattlerLastHit).toHaveBeenCalledWith(lastHit);
    });

    it('sets a new hud target when the target frame should be updated', () =>
    {
      // Arrange
      const framedTarget = { name: 'built' };
      const lastHit = {};
      const battler = buildBattler({
        canUpdateTargetFrame: vi.fn(() => true),
        buildFramedTarget: vi.fn(() => framedTarget),
      });

      // Act
      battler.setBattlerLastHit(lastHit);

      // Assert
      expect(battler.buildFramedTarget).toHaveBeenCalledWith(lastHit);
      expect(globalThis.$hudManager.setNewTarget).toHaveBeenCalledWith(framedTarget);
    });

    it('does not touch the hud target when the target frame should not be updated', () =>
    {
      // Arrange
      const lastHit = {};
      const battler = buildBattler({ canUpdateTargetFrame: vi.fn(() => false) });

      // Act
      battler.setBattlerLastHit(lastHit);

      // Assert
      expect(globalThis.$hudManager.setNewTarget).not.toHaveBeenCalled();
    });
  });

  describe('canUpdateTargetFrame', () =>
  {
    it('returns false when this battler is not the player', () =>
    {
      // Arrange
      const battler = buildBattler({ isPlayer: () => false });

      // Act & Assert
      expect(battler.canUpdateTargetFrame({})).toBe(false);
    });

    it('returns false when the potential target is falsy', () =>
    {
      // Arrange
      const battler = buildBattler({ isPlayer: () => true });

      // Act & Assert
      expect(battler.canUpdateTargetFrame(null)).toBe(false);
    });

    it('returns false when the potential target hides its target frame', () =>
    {
      // Arrange
      const battler = buildBattler({ isPlayer: () => true });
      const potentialTarget = { canShowTargetFrame: () => false };

      // Act & Assert
      expect(battler.canUpdateTargetFrame(potentialTarget)).toBe(false);
    });

    it('requests a target frame refresh once the target passes the show check', () =>
    {
      // Arrange
      const battler = buildBattler({ isPlayer: () => true, getTarget: () => null });
      const potentialTarget = { canShowTargetFrame: () => true };

      // Act
      battler.canUpdateTargetFrame(potentialTarget);

      // Assert
      expect(globalThis.$hudManager.requestTargetFrameRefresh).toHaveBeenCalled();
    });

    it('returns true when there was no prior target', () =>
    {
      // Arrange
      const battler = buildBattler({ isPlayer: () => true, getTarget: () => null });
      const potentialTarget = { canShowTargetFrame: () => true };

      // Act & Assert
      expect(battler.canUpdateTargetFrame(potentialTarget)).toBe(true);
    });

    it('returns false when the potential target is the same as the current target', () =>
    {
      // Arrange
      const battler = buildBattler({
        isPlayer: () => true,
        getTarget: () => ({ getUuid: () => 'same-uuid' }),
      });
      const potentialTarget = { canShowTargetFrame: () => true, getUuid: () => 'same-uuid' };

      // Act & Assert
      expect(battler.canUpdateTargetFrame(potentialTarget)).toBe(false);
    });

    it('returns true when the potential target differs from the current target', () =>
    {
      // Arrange
      const battler = buildBattler({
        isPlayer: () => true,
        getTarget: () => ({ getUuid: () => 'old-uuid' }),
      });
      const potentialTarget = { canShowTargetFrame: () => true, getUuid: () => 'new-uuid' };

      // Act & Assert
      expect(battler.canUpdateTargetFrame(potentialTarget)).toBe(true);
    });
  });

  describe('buildFramedTarget', () =>
  {
    it('assembles a FramedTarget from the last-hit battler', () =>
    {
      // Arrange
      const battler = buildBattler();
      const gameEnemy = { hp: 1 };
      const targetConfiguration = { showName: true };
      const battlerLastHit = {
        battlerName: () => 'Slime',
        getTargetFrameText: () => 'extra text',
        getTargetFrameIcon: () => 64,
        buildFramedTargetConfiguration: () => targetConfiguration,
        getBattler: () => gameEnemy,
      };

      // Act
      const result = battler.buildFramedTarget(battlerLastHit);

      // Assert
      expect(result.name).toBe('Slime');
      expect(result.text).toBe('extra text');
      expect(result.icon).toBe(64);
      expect(result.battler).toBe(gameEnemy);
      expect(result.configuration).toBe(targetConfiguration);
      expect(result.nameColorHex).toBe(String.empty);
    });
  });

  describe('canShowTargetFrame', () =>
  {
    it('returns false when this battler is not an enemy', () =>
    {
      // Arrange
      const battler = buildBattler({ isEnemy: () => false });

      // Act & Assert
      expect(battler.canShowTargetFrame()).toBe(false);
    });

    it('returns false when there is no character', () =>
    {
      // Arrange
      const battler = buildBattler({ isEnemy: () => true, getCharacter: () => null });

      // Act & Assert
      expect(battler.canShowTargetFrame()).toBe(false);
    });

    it('returns false when the character is erased', () =>
    {
      // Arrange
      const battler = buildBattler({
        isEnemy: () => true,
        getCharacter: () => ({ isErased: () => true }),
      });

      // Act & Assert
      expect(battler.canShowTargetFrame()).toBe(false);
    });

    it('returns false when the underlying event hides the target frame', () =>
    {
      // Arrange
      const battler = buildBattler({
        isEnemy: () => true,
        getCharacter: () => ({ isErased: () => false, canShowTargetFrame: () => false }),
      });

      // Act & Assert
      expect(battler.canShowTargetFrame()).toBe(false);
    });

    it('returns false when the underlying database enemy hides the target frame', () =>
    {
      // Arrange
      const battler = buildBattler({
        isEnemy: () => true,
        getCharacter: () => ({ isErased: () => false, canShowTargetFrame: () => true }),
        getBattler: () => ({ showTargetFrame: () => false }),
      });

      // Act & Assert
      expect(battler.canShowTargetFrame()).toBe(false);
    });

    it('returns true when nothing hides the target frame', () =>
    {
      // Arrange
      const battler = buildBattler({
        isEnemy: () => true,
        getCharacter: () => ({ isErased: () => false, canShowTargetFrame: () => true }),
        getBattler: () => ({ showTargetFrame: () => true }),
      });

      // Act & Assert
      expect(battler.canShowTargetFrame()).toBe(true);
    });
  });

  describe('buildFramedTargetConfiguration', () =>
  {
    it('assembles a FramedTargetConfiguration from this battler\'s show checks', () =>
    {
      // Arrange
      const battler = buildBattler({
        showBattlerName: () => true,
        canShowTargetText: () => false,
        canShowTargetHp: () => true,
        canShowTargetMp: () => false,
        canShowTargetTp: () => true,
      });

      // Act
      const result = battler.buildFramedTargetConfiguration();

      // Assert
      expect(result.showName).toBe(true);
      expect(result.showText).toBe(false);
      expect(result.showHp).toBe(true);
      expect(result.showMp).toBe(false);
      expect(result.showTp).toBe(true);
    });
  });

  describe('canShowTargetHp', () =>
  {
    it('returns false when the plugin metadata disables the hp gauge', () =>
    {
      // Arrange- every other reason to hide the bar has to be switched off, or the metadata gate is
      // not what the assertion is measuring. a bare fixture is not an enemy, and that alone answers
      // false whether the gate exists or not.
      globalThis.J.HUD.EXT.TARGET.Metadata.EnableHP = false;
      const battler = buildBattler({
        isEnemy: () => true,
        getCharacter: () => ({ showTargetHpBar: () => true }),
        getBattler: () => ({ showTargetHpBar: () => true }),
      });

      // Act & Assert
      expect(battler.canShowTargetHp()).toBe(false);

      // cleanup
      globalThis.J.HUD.EXT.TARGET.Metadata.EnableHP = true;
    });

    it('returns false when this battler is not an enemy', () =>
    {
      // Arrange
      const battler = buildBattler({ isEnemy: () => false });

      // Act & Assert
      expect(battler.canShowTargetHp()).toBe(false);
    });

    it('returns false when the event hides the hp bar', () =>
    {
      // Arrange
      const battler = buildBattler({
        isEnemy: () => true,
        getCharacter: () => ({ showTargetHpBar: () => false }),
      });

      // Act & Assert
      expect(battler.canShowTargetHp()).toBe(false);
    });

    it('returns false when the database enemy hides the hp bar', () =>
    {
      // Arrange
      const battler = buildBattler({
        isEnemy: () => true,
        getCharacter: () => ({ showTargetHpBar: () => true }),
        getBattler: () => ({ showTargetHpBar: () => false }),
      });

      // Act & Assert
      expect(battler.canShowTargetHp()).toBe(false);
    });

    it('returns true when nothing hides the hp bar', () =>
    {
      // Arrange
      const battler = buildBattler({
        isEnemy: () => true,
        getCharacter: () => ({ showTargetHpBar: () => true }),
        getBattler: () => ({ showTargetHpBar: () => true }),
      });

      // Act & Assert
      expect(battler.canShowTargetHp()).toBe(true);
    });
  });

  describe('canShowTargetMp', () =>
  {
    it('returns false when the plugin metadata disables the mp gauge', () =>
    {
      // Arrange- see the hp counterpart: the fixture has to be showable on every other axis so the
      // metadata gate is the only thing left that can answer false.
      globalThis.J.HUD.EXT.TARGET.Metadata.EnableMP = false;
      const battler = buildBattler({
        isEnemy: () => true,
        getCharacter: () => ({ showTargetMpBar: () => true }),
        getBattler: () => ({ showTargetMpBar: () => true }),
      });

      // Act & Assert
      expect(battler.canShowTargetMp()).toBe(false);

      // cleanup
      globalThis.J.HUD.EXT.TARGET.Metadata.EnableMP = true;
    });

    it('returns false when this battler is not an enemy', () =>
    {
      // Arrange
      const battler = buildBattler({ isEnemy: () => false });

      // Act & Assert
      expect(battler.canShowTargetMp()).toBe(false);
    });

    it('returns false when the event hides the mp bar', () =>
    {
      // Arrange
      const battler = buildBattler({
        isEnemy: () => true,
        getCharacter: () => ({ showTargetMpBar: () => false }),
      });

      // Act & Assert
      expect(battler.canShowTargetMp()).toBe(false);
    });

    it('returns false when the database enemy hides the mp bar', () =>
    {
      // Arrange
      const battler = buildBattler({
        isEnemy: () => true,
        getCharacter: () => ({ showTargetMpBar: () => true }),
        getBattler: () => ({ showTargetMpBar: () => false }),
      });

      // Act & Assert
      expect(battler.canShowTargetMp()).toBe(false);
    });

    it('returns false when the battler has no max mp', () =>
    {
      // Arrange
      const battler = buildBattler({
        isEnemy: () => true,
        getCharacter: () => ({ showTargetMpBar: () => true }),
        getBattler: () => ({ showTargetMpBar: () => true, param: paramId => (paramId === 1 ? 0 : 999) }),
      });

      // Act & Assert
      expect(battler.canShowTargetMp()).toBe(false);
    });

    it('returns true when nothing hides the mp bar and max mp is nonzero', () =>
    {
      // Arrange
      const battler = buildBattler({
        isEnemy: () => true,
        getCharacter: () => ({ showTargetMpBar: () => true }),
        getBattler: () => ({ showTargetMpBar: () => true, param: () => 999 }),
      });

      // Act & Assert
      expect(battler.canShowTargetMp()).toBe(true);
    });
  });

  describe('canShowTargetTp', () =>
  {
    it('returns false when the plugin metadata disables the tp gauge', () =>
    {
      // Arrange
      globalThis.J.HUD.EXT.TARGET.Metadata.EnableTP = false;
      const battler = buildBattler({
        isEnemy: () => true,
        getCharacter: () => ({ showTargetTpBar: () => true }),
        getBattler: () => ({ showTargetTpBar: () => true }),
      });

      // Act & Assert
      expect(battler.canShowTargetTp()).toBe(false);

      // cleanup
      globalThis.J.HUD.EXT.TARGET.Metadata.EnableTP = true;
    });

    it('returns false when this battler is not an enemy', () =>
    {
      // Arrange
      const battler = buildBattler({ isEnemy: () => false });

      // Act & Assert
      expect(battler.canShowTargetTp()).toBe(false);
    });

    it('returns false when the event hides the tp bar', () =>
    {
      // Arrange
      const battler = buildBattler({
        isEnemy: () => true,
        getCharacter: () => ({ showTargetTpBar: () => false }),
      });

      // Act & Assert
      expect(battler.canShowTargetTp()).toBe(false);
    });

    it('returns false when the database enemy hides the tp bar', () =>
    {
      // Arrange
      const battler = buildBattler({
        isEnemy: () => true,
        getCharacter: () => ({ showTargetTpBar: () => true }),
        getBattler: () => ({ showTargetTpBar: () => false }),
      });

      // Act & Assert
      expect(battler.canShowTargetTp()).toBe(false);
    });

    it('returns false when the battler has no max tp', () =>
    {
      // Arrange
      const battler = buildBattler({
        isEnemy: () => true,
        getCharacter: () => ({ showTargetTpBar: () => true }),
        getBattler: () => ({ showTargetTpBar: () => true, maxTp: () => 0 }),
        isInanimate: () => false,
      });

      // Act & Assert
      expect(battler.canShowTargetTp()).toBe(false);
    });

    it('returns false when the battler is inanimate even with nonzero max tp', () =>
    {
      // Arrange
      const battler = buildBattler({
        isEnemy: () => true,
        getCharacter: () => ({ showTargetTpBar: () => true }),
        getBattler: () => ({ showTargetTpBar: () => true, maxTp: () => 100 }),
        isInanimate: () => true,
      });

      // Act & Assert
      expect(battler.canShowTargetTp()).toBe(false);
    });

    it('returns true when nothing hides the tp bar, max tp is nonzero, and not inanimate', () =>
    {
      // Arrange
      const battler = buildBattler({
        isEnemy: () => true,
        getCharacter: () => ({ showTargetTpBar: () => true }),
        getBattler: () => ({ showTargetTpBar: () => true, maxTp: () => 100 }),
        isInanimate: () => false,
      });

      // Act & Assert
      expect(battler.canShowTargetTp()).toBe(true);
    });
  });

  describe('canShowTargetText', () =>
  {
    it('returns false when this battler is not an enemy', () =>
    {
      // Arrange
      const battler = buildBattler({ isEnemy: () => false });

      // Act & Assert
      expect(battler.canShowTargetText()).toBe(false);
    });

    it('returns false when the event hides the target text', () =>
    {
      // Arrange
      const battler = buildBattler({
        isEnemy: () => true,
        getCharacter: () => ({ showTargetText: () => false }),
      });

      // Act & Assert
      expect(battler.canShowTargetText()).toBe(false);
    });

    it('returns false when the database enemy hides the target text', () =>
    {
      // Arrange
      const battler = buildBattler({
        isEnemy: () => true,
        getCharacter: () => ({ showTargetText: () => true }),
        getBattler: () => ({ showTargetText: () => false }),
      });

      // Act & Assert
      expect(battler.canShowTargetText()).toBe(false);
    });

    it('returns true when nothing hides the target text', () =>
    {
      // Arrange
      const battler = buildBattler({
        isEnemy: () => true,
        getCharacter: () => ({ showTargetText: () => true }),
        getBattler: () => ({ showTargetText: () => true }),
      });

      // Act & Assert
      expect(battler.canShowTargetText()).toBe(true);
    });
  });

  describe('getTargetFrameText', () =>
  {
    it('returns the empty string when this battler is not an enemy', () =>
    {
      // Arrange
      const battler = buildBattler({ isEnemy: () => false });

      // Act & Assert
      expect(battler.getTargetFrameText()).toBe(String.empty);
    });

    it('prefers the text from the character event when present', () =>
    {
      // Arrange
      const battler = buildBattler({
        isEnemy: () => true,
        getCharacter: () => ({ getTargetFrameText: () => 'from event' }),
        getBattler: () => ({ targetFrameText: () => 'from enemy' }),
      });

      // Act & Assert
      expect(battler.getTargetFrameText()).toBe('from event');
    });

    it('falls back to the database enemy text when the event has none', () =>
    {
      // Arrange
      const battler = buildBattler({
        isEnemy: () => true,
        getCharacter: () => ({ getTargetFrameText: () => String.empty }),
        getBattler: () => ({ targetFrameText: () => 'from enemy' }),
      });

      // Act & Assert
      expect(battler.getTargetFrameText()).toBe('from enemy');
    });
  });

  describe('getTargetFrameIcon', () =>
  {
    it('returns 0 when this battler is not an enemy', () =>
    {
      // Arrange
      const battler = buildBattler({ isEnemy: () => false });

      // Act & Assert
      expect(battler.getTargetFrameIcon()).toBe(0);
    });

    it('prefers the icon from the character event when present', () =>
    {
      // Arrange
      const battler = buildBattler({
        isEnemy: () => true,
        getCharacter: () => ({ getTargetFrameIcon: () => 12 }),
        getBattler: () => ({ targetFrameIcon: () => 34 }),
      });

      // Act & Assert
      expect(battler.getTargetFrameIcon()).toBe(12);
    });

    it('falls back to the database enemy icon when the event has none', () =>
    {
      // Arrange
      const battler = buildBattler({
        isEnemy: () => true,
        getCharacter: () => ({ getTargetFrameIcon: () => 0 }),
        getBattler: () => ({ targetFrameIcon: () => 34 }),
      });

      // Act & Assert
      expect(battler.getTargetFrameIcon()).toBe(34);
    });
  });
});
//endregion plugins/hud/ext/target/_models/jabs-battler.test.js

//region plugins/abs/ext/charge/sprites/sprite-character.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('J-ABS-Charge Sprite_Character (unit, all downstream dependencies mocked)', () =>
{
  let originalInitGaugeMembers;
  let originalSetupMapSprite;
  let originalUpdateGauges;

  /** duck-typed stand-in for Sprite_MapChargeGauge. */
  class FakeGauge
  {
    constructor()
    {
      this.visible = false;
      this._jabsBattler = null;
      this._expectedCharacter = null;
      this._expectedUuid = null;
      this._battler = null;
    }

    setupJabs(jabsBattler, expectedCharacter)
    {
      this._jabsBattler = jabsBattler;
      this._expectedCharacter = expectedCharacter;
      this._expectedUuid = jabsBattler ? jabsBattler.getUuid() : null;
    }

    activateGauge()
    {
      this.activated = true;
    }

    show()
    {
      this.visible = true;
    }

    hide()
    {
      this.visible = false;
    }

    move()
    {
    }

    bitmapWidth()
    {
      return 100;
    }
  }

  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = { ABS: { EXT: { CHARGE: { Aliased: { Sprite_Character: new Map() } } } } };

    vi.doMock('../../../../../../src/plugins/abs/ext/charge/sprites/Sprite_MapChargeGauge.js', () => ({
      default: FakeGauge,
    }));

    function Sprite_Character()
    {
    }

    originalInitGaugeMembers = vi.fn();
    originalSetupMapSprite = vi.fn();
    originalUpdateGauges = vi.fn();
    Sprite_Character.prototype.initGaugeMembers = originalInitGaugeMembers;
    Sprite_Character.prototype.setupMapSprite = originalSetupMapSprite;
    Sprite_Character.prototype.updateGauges = originalUpdateGauges;
    globalThis.Sprite_Character = Sprite_Character;

    await import('../../../../../../src/plugins/abs/ext/charge/sprites/Sprite_Character.js');
  });

  beforeEach(() =>
  {
    originalInitGaugeMembers.mockReset();
    originalSetupMapSprite.mockReset();
    originalUpdateGauges.mockReset();
  });

  function buildSprite(overrides = {})
  {
    const sprite = Object.create(globalThis.Sprite_Character.prototype);
    sprite._j = { _abs: { _gauges: {} } };
    sprite.addChild = vi.fn();
    sprite.canUpdate = () => true;
    sprite.isJabsBattler = () => true;
    // stable references matter here- the source compares these across calls by identity.
    const stableBattler = { id: 'battler' };
    const stableJabsBattler = { isCharging: () => true, getUuid: () => 'uuid-1' };
    sprite.getBattler = () => stableBattler;
    sprite._character = { getJabsBattler: () => stableJabsBattler };
    return Object.assign(sprite, overrides);
  }

  describe('initGaugeMembers', () =>
  {
    it('calls the original then initializes the charge gauge slot to null', () =>
    {
      const sprite = Object.create(globalThis.Sprite_Character.prototype);
      sprite._j = { _abs: { _gauges: {} } };

      sprite.initGaugeMembers();

      expect(originalInitGaugeMembers).toHaveBeenCalledTimes(1);
      expect(sprite._j._abs._gauges._chargeGauge).toBeNull();
    });
  });

  describe('setupMapSprite', () =>
  {
    it('performs the original logic then sets up the charge gauge', () =>
    {
      const sprite = buildSprite();
      sprite.setupChargeGauge = vi.fn();

      sprite.setupMapSprite();

      expect(originalSetupMapSprite).toHaveBeenCalledTimes(1);
      expect(sprite.setupChargeGauge).toHaveBeenCalledTimes(1);
    });
  });

  describe('setupChargeGauge', () =>
  {
    it('creates and attaches a new gauge sprite when none exists yet', () =>
    {
      const sprite = buildSprite();

      sprite.setupChargeGauge();

      const gauge = sprite._j._abs._gauges._chargeGauge;
      expect(gauge).toBeInstanceOf(FakeGauge);
      expect(gauge.activated).toBe(true);
      expect(sprite.addChild).toHaveBeenCalledWith(gauge);
    });

    it('rebinds and reactivates the existing gauge instead of creating a new one', () =>
    {
      const sprite = buildSprite();
      sprite.setupChargeGauge();
      const gauge = sprite._j._abs._gauges._chargeGauge;
      sprite.addChild.mockClear();
      const rebindSpy = vi.spyOn(gauge, 'setupJabs');

      sprite.setupChargeGauge();

      expect(rebindSpy).toHaveBeenCalledTimes(1);
      expect(sprite.addChild).not.toHaveBeenCalled();
      expect(sprite._j._abs._gauges._chargeGauge).toBe(gauge);
    });
  });

  describe('updateGauges', () =>
  {
    it('performs the original logic then updates the gauge when allowed', () =>
    {
      const sprite = buildSprite();
      sprite.canUpdateChargeGauge = () => true;
      sprite.updateChargeGauge = vi.fn();
      sprite.hideChargeGauge = vi.fn();

      sprite.updateGauges();

      expect(originalUpdateGauges).toHaveBeenCalledTimes(1);
      expect(sprite.updateChargeGauge).toHaveBeenCalledTimes(1);
      expect(sprite.hideChargeGauge).not.toHaveBeenCalled();
    });

    it('hides the gauge when updates are not allowed', () =>
    {
      const sprite = buildSprite();
      sprite.canUpdateChargeGauge = () => false;
      sprite.updateChargeGauge = vi.fn();
      sprite.hideChargeGauge = vi.fn();

      sprite.updateGauges();

      expect(sprite.hideChargeGauge).toHaveBeenCalledTimes(1);
      expect(sprite.updateChargeGauge).not.toHaveBeenCalled();
    });
  });

  describe('canUpdateChargeGauge', () =>
  {
    it('is false when this sprite cannot update at all', () =>
    {
      const sprite = buildSprite({ canUpdate: () => false });
      expect(sprite.canUpdateChargeGauge()).toBe(false);
    });

    it('is false when this sprite has no jabs battler', () =>
    {
      const sprite = buildSprite({ isJabsBattler: () => false });
      expect(sprite.canUpdateChargeGauge()).toBe(false);
    });

    it('is false when there is no gauge sprite yet', () =>
    {
      const sprite = buildSprite();
      expect(sprite.canUpdateChargeGauge()).toBe(false);
    });

    it('is false when the character has no jabs battler', () =>
    {
      const sprite = buildSprite({ _character: { getJabsBattler: () => null } });
      sprite.setupChargeGauge();
      expect(sprite.canUpdateChargeGauge()).toBe(false);
    });

    it('is false when the jabs battler is not currently charging', () =>
    {
      const sprite = buildSprite({
        _character: { getJabsBattler: () => ({ isCharging: () => false, getUuid: () => 'uuid-1' }) },
      });
      sprite.setupChargeGauge();
      expect(sprite.canUpdateChargeGauge()).toBe(false);
    });

    it('is true when updating is allowed, the gauge exists, and the battler is charging', () =>
    {
      const sprite = buildSprite();
      sprite.setupChargeGauge();
      expect(sprite.canUpdateChargeGauge()).toBe(true);
    });
  });

  describe('updateChargeGauge', () =>
  {
    it('shows the gauge and rebinds the underlying battler', () =>
    {
      const sprite = buildSprite();
      sprite.setupChargeGauge();

      sprite.updateChargeGauge();

      const gauge = sprite._j._abs._gauges._chargeGauge;
      expect(gauge.visible).toBe(true);
      expect(gauge._battler).toBe(sprite.getBattler());
    });

    it('rebinds the gauge when the tracked jabs battler has drifted', () =>
    {
      const sprite = buildSprite();
      sprite.setupChargeGauge();
      const gauge = sprite._j._abs._gauges._chargeGauge;
      const newJabs = { isCharging: () => true, getUuid: () => 'uuid-2' };
      sprite._character = { getJabsBattler: () => newJabs };
      const rebindSpy = vi.spyOn(gauge, 'setupJabs');

      sprite.updateChargeGauge();

      expect(rebindSpy).toHaveBeenCalledWith(newJabs, sprite._character);
    });

    it('does not rebind the gauge when nothing has drifted', () =>
    {
      const sprite = buildSprite();
      sprite.setupChargeGauge();
      const gauge = sprite._j._abs._gauges._chargeGauge;
      const rebindSpy = vi.spyOn(gauge, 'setupJabs');

      sprite.updateChargeGauge();

      expect(rebindSpy).not.toHaveBeenCalled();
    });
  });

  describe('showChargeGauge / hideChargeGauge', () =>
  {
    it('does nothing when there is no gauge yet', () =>
    {
      const sprite = buildSprite();
      expect(() => sprite.showChargeGauge()).not.toThrow();
      expect(() => sprite.hideChargeGauge()).not.toThrow();
    });

    it('activates and shows the gauge when it exists', () =>
    {
      const sprite = buildSprite();
      sprite.setupChargeGauge();
      const gauge = sprite._j._abs._gauges._chargeGauge;
      gauge.hide();

      sprite.showChargeGauge();

      expect(gauge.visible).toBe(true);
    });

    it('hides the gauge when it exists', () =>
    {
      const sprite = buildSprite();
      sprite.setupChargeGauge();
      const gauge = sprite._j._abs._gauges._chargeGauge;
      gauge.show();

      sprite.hideChargeGauge();

      expect(gauge.visible).toBe(false);
    });
  });
});
//endregion plugins/abs/ext/charge/sprites/sprite-character.test.js

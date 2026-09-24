//region plugins/_base/core/sprites/sprite-map-gauge-trail.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * How a map gauge hands itself to its trail: which gauges trail at all, when a trail starts over, when a frame is
 * worth redrawing, and where the chunk of recent change lands when it is drawn.
 *
 * The trail's own numbers are pinned in its own tests. What is pinned here is the wiring, and two parts of it
 * fail quietly. A trail cleared on every setup never drains, because the target frame sets its gauge up again
 * on every hit. And a redraw skipped on the frame the trail settles leaves the last sliver of it on screen.
 */
describe('Sprite_MapGauge trail (direct src import)', () =>
{
  let Sprite_MapGauge;
  let engineSetup;
  let engineUpdateBitmap;
  let engineDrawGaugeRect;

  beforeAll(async () =>
  {
    vi.resetModules();

    String.empty = '';

    // Sprite_Icon extends the engine sprite, so a bare one lets its class declaration evaluate.
    globalThis.Sprite = class
    {
    };

    // the engine gauge the map gauge extends. Its setup records the pair and updates the bitmap, as vanilla's does.
    function Sprite_Gauge()
    {
    }

    engineSetup = vi.fn(function(battler, statusType)
    {
      this._battler = battler;
      this._statusType = statusType;
      this.updateBitmap();
    });
    engineUpdateBitmap = vi.fn();
    engineDrawGaugeRect = vi.fn();
    Sprite_Gauge.prototype.setup = engineSetup;
    Sprite_Gauge.prototype.updateBitmap = engineUpdateBitmap;
    Sprite_Gauge.prototype.drawGaugeRect = engineDrawGaugeRect;
    globalThis.Sprite_Gauge = Sprite_Gauge;

    globalThis.ColorManager = {
      powerUpColor: () => '#00ff00',
      powerDownColor: () => '#ff0000',
    };

    // J-Base's accessors for the engine gauge's fields.
    await import('../../../../../src/plugins/_base/core/sprites/Sprite_Gauge.js');

    ({ default: Sprite_MapGauge } = await import('../../../../../src/plugins/_base/core/sprites/Sprite_MapGauge.js'));
  });

  beforeEach(() =>
  {
    engineSetup.mockClear();
    engineUpdateBitmap.mockClear();
    engineDrawGaugeRect.mockClear();
  });

  /**
   * Builds a map gauge for the given resource, with no battler bound and nothing drawn.
   * @param {string} statusType The resource the gauge shows.
   * @returns {Sprite_MapGauge}
   */
  function buildGauge(statusType = 'hp')
  {
    const gauge = Object.create(Sprite_MapGauge.prototype);
    gauge.initGaugeMembers(202, 12, 12, String.empty, null, -1);
    gauge._battler = null;
    gauge._statusType = statusType;
    gauge._value = NaN;
    gauge._maxValue = NaN;
    gauge.redraw = vi.fn();
    gauge.isValid = () => true;
    gauge.gaugeBackColor = () => 'back';
    gauge.gaugeColor1 = () => 'fill-1';
    gauge.gaugeColor2 = () => 'fill-2';
    gauge.bitmap = { fillRect: vi.fn(), gradientFillRect: vi.fn() };

    return gauge;
  }

  describe('usesTrail', () =>
  {
    it('trails a resource that gets spent and restored', () =>
    {
      // Arrange
      const gauge = buildGauge('hp');

      // Act
      const result = gauge.usesTrail();

      // Assert
      expect(result).toBe(true);
    });

    it('does not trail a gauge that only ever fills', () =>
    {
      // Arrange
      const gauge = buildGauge('cast');

      // Act
      const result = gauge.usesTrail();

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('setup', () =>
  {
    it('starts a fresh battler\'s trail over ahead of the engine\'s setup, then draws it', () =>
    {
      // Arrange- the trail is showing some other battler when the new one arrives.
      const gauge = buildGauge('hp');
      gauge._battler = { hp: 80, mhp: 100 };
      gauge.gaugeTrail()
        .track(80, 100);
      let observedWhenEngineRan = null;
      engineSetup.mockImplementationOnce(function()
      {
        observedWhenEngineRan = this.gaugeTrail()
          .hasObserved();
      });

      // Act
      gauge.setup({ hp: 20, mhp: 100 }, 'hp');

      // Assert
      expect(observedWhenEngineRan).toBe(false);
      expect(gauge.redraw).toHaveBeenCalledTimes(1);
    });

    it('leaves a draining trail alone for the same battler and resource, and skips the extra draw', () =>
    {
      // Arrange- the target frame sets its gauge up again on every hit, mid-drain.
      const battler = { hp: 50, mhp: 100 };
      const gauge = buildGauge('hp');
      gauge._battler = battler;
      gauge.gaugeTrail()
        .track(80, 100);
      gauge.gaugeTrail()
        .track(50, 100);
      engineSetup.mockImplementationOnce(() =>
      {
      });

      // Act
      gauge.setup(battler, 'hp');

      // Assert
      expect(engineSetup).toHaveBeenCalledTimes(1);
      expect(gauge.gaugeTrail()
        .isSettled()).toBe(false);
      expect(gauge.redraw).not.toHaveBeenCalled();
    });

    it('treats a different resource on the same battler as a fresh gauge', () =>
    {
      // Arrange
      const battler = { hp: 50, mhp: 100, mp: 5, mmp: 10 };
      const gauge = buildGauge('hp');
      gauge._battler = battler;
      gauge.gaugeTrail()
        .track(50, 100);
      let observedWhenEngineRan = null;
      engineSetup.mockImplementationOnce(function()
      {
        observedWhenEngineRan = this.gaugeTrail()
          .hasObserved();
      });

      // Act
      gauge.setup(battler, 'mp');

      // Assert
      expect(observedWhenEngineRan).toBe(false);
      expect(gauge.redraw).toHaveBeenCalledTimes(1);
    });
  });

  describe('updateBitmap', () =>
  {
    it('leaves a gauge that does not trail to the engine', () =>
    {
      // Arrange
      const gauge = buildGauge('cast');

      // Act
      gauge.updateBitmap();

      // Assert
      expect(engineUpdateBitmap).toHaveBeenCalledTimes(1);
    });

    it('follows the trail for a gauge that trails, instead of the engine', () =>
    {
      // Arrange
      const gauge = buildGauge('hp');
      gauge._battler = { hp: 50, mhp: 100 };

      // Act
      gauge.updateBitmap();

      // Assert
      expect(engineUpdateBitmap).not.toHaveBeenCalled();
      expect(gauge.gaugeTrail()
        .fillRate()).toBe(0.5);
    });
  });

  describe('updateTrail', () =>
  {
    it('does nothing while no battler is bound', () =>
    {
      // Arrange
      const gauge = buildGauge('hp');

      // Act
      gauge.updateTrail();

      // Assert
      expect(gauge.gaugeTrail()
        .hasObserved()).toBe(false);
      expect(gauge.redraw).not.toHaveBeenCalled();
    });

    it('redraws when the value changed, and keeps the engine\'s record of it current', () =>
    {
      // Arrange
      const gauge = buildGauge('hp');
      gauge._battler = { hp: 50, mhp: 100 };
      gauge._value = 80;
      gauge._maxValue = 100;
      gauge.gaugeTrail()
        .track(80, 100);

      // Act
      gauge.updateTrail();

      // Assert
      expect(gauge.redraw).toHaveBeenCalledTimes(1);
      expect(gauge.value()).toBe(50);
    });

    it('redraws when only the max changed', () =>
    {
      // Arrange
      const gauge = buildGauge('hp');
      gauge._battler = { hp: 50, mhp: 200 };
      gauge._value = 50;
      gauge._maxValue = 100;
      gauge.gaugeTrail()
        .track(50, 100);

      // Act
      gauge.updateTrail();

      // Assert
      expect(gauge.redraw).toHaveBeenCalledTimes(1);
      expect(gauge.maxValue()).toBe(200);
    });

    it('redraws the frame the trail settles on, even with nothing else changed', () =>
    {
      // Arrange- a 0.12 drop is still 0.108 wide after its first step, and settles on the next.
      const gauge = buildGauge('hp');
      gauge._battler = { hp: 49.88, mhp: 100 };
      gauge._value = 49.88;
      gauge._maxValue = 100;
      gauge.gaugeTrail()
        .track(50, 100);
      gauge.gaugeTrail()
        .track(49.88, 100);

      // Act
      gauge.updateTrail();

      // Assert
      expect(gauge.gaugeTrail()
        .isSettled()).toBe(true);
      expect(gauge.redraw).toHaveBeenCalledTimes(1);
    });

    it('skips the redraw when nothing changed and the trail is at rest', () =>
    {
      // Arrange
      const gauge = buildGauge('hp');
      gauge._battler = { hp: 50, mhp: 100 };
      gauge._value = 50;
      gauge._maxValue = 100;
      gauge.gaugeTrail()
        .track(50, 100);

      // Act
      gauge.updateTrail();

      // Assert
      expect(gauge.redraw).not.toHaveBeenCalled();
    });
  });

  describe('drawGaugeRect', () =>
  {
    it('draws a gauge that does not trail as the engine does', () =>
    {
      // Arrange
      const gauge = buildGauge('cast');

      // Act
      gauge.drawGaugeRect(0, 0, 202, 12);

      // Assert
      expect(engineDrawGaugeRect).toHaveBeenCalledWith(0, 0, 202, 12);
      expect(gauge.bitmap.fillRect).not.toHaveBeenCalled();
    });

    it('draws a gauge that trails with its trail', () =>
    {
      // Arrange
      const gauge = buildGauge('hp');
      gauge.drawTrailingGaugeRect = vi.fn();

      // Act
      gauge.drawGaugeRect(0, 0, 202, 12);

      // Assert
      expect(gauge.drawTrailingGaugeRect).toHaveBeenCalledWith(0, 0, 202, 12);
      expect(engineDrawGaugeRect).not.toHaveBeenCalled();
    });
  });

  describe('drawTrailingGaugeRect', () =>
  {
    it('draws the backdrop, then a loss draining in the loss color, then the fill over it', () =>
    {
      // Arrange- a drop from 80 to 50: the fill sits at 0.5, the trail has drained to 0.77.
      const gauge = buildGauge('hp');
      gauge.gaugeTrail()
        .track(80, 100);
      gauge.gaugeTrail()
        .track(50, 100);

      // Act
      gauge.drawTrailingGaugeRect(0, 0, 202, 12);

      // Assert- inside the border, 200 pixels wide: the fill takes 100, the chunk the next 54.
      expect(gauge.bitmap.fillRect.mock.calls).toEqual([
        [ 0, 0, 202, 12, 'back' ],
        [ 101, 1, 54, 10, '#ff0000' ],
      ]);
      expect(gauge.bitmap.gradientFillRect).toHaveBeenCalledWith(1, 1, 100, 10, 'fill-1', 'fill-2');
    });

    it('draws a gain filling in with the gain color', () =>
    {
      // Arrange- a rise from 50 to 80: the trail sits at 0.8, the fill has grown to 0.53.
      const gauge = buildGauge('hp');
      gauge.gaugeTrail()
        .track(50, 100);
      gauge.gaugeTrail()
        .track(80, 100);

      // Act
      gauge.drawTrailingGaugeRect(0, 0, 202, 12);

      // Assert
      expect(gauge.bitmap.fillRect).toHaveBeenCalledWith(107, 1, 54, 10, '#00ff00');
      expect(gauge.bitmap.gradientFillRect).toHaveBeenCalledWith(1, 1, 106, 10, 'fill-1', 'fill-2');
    });

    it('draws no chunk once the trail has settled', () =>
    {
      // Arrange
      const gauge = buildGauge('hp');
      gauge.gaugeTrail()
        .track(50, 100);

      // Act
      gauge.drawTrailingGaugeRect(0, 0, 202, 12);

      // Assert- the backdrop is the only plain fill; the gradient still draws the value.
      expect(gauge.bitmap.fillRect).toHaveBeenCalledTimes(1);
      expect(gauge.bitmap.gradientFillRect).toHaveBeenCalledWith(1, 1, 100, 10, 'fill-1', 'fill-2');
    });

    it('draws a gauge with nothing valid to show as empty, trail and all', () =>
    {
      // Arrange- mid-drain, so both ends would have something to draw if the gauge were valid.
      const gauge = buildGauge('tp');
      gauge.isValid = () => false;
      gauge.gaugeTrail()
        .track(80, 100);
      gauge.gaugeTrail()
        .track(50, 100);

      // Act
      gauge.drawTrailingGaugeRect(0, 0, 202, 12);

      // Assert
      expect(gauge.bitmap.fillRect).toHaveBeenCalledTimes(1);
      expect(gauge.bitmap.gradientFillRect).toHaveBeenCalledWith(1, 1, 0, 10, 'fill-1', 'fill-2');
    });
  });
});
//endregion plugins/_base/core/sprites/sprite-map-gauge-trail.test.js

//region plugins/weather/core/core/weather-presets.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';
import WeatherPresets from '../../../../../src/plugins/weather/core/core/WeatherPresets.js';

/**
 * Turning the name of a look into the layers that draw it.
 *
 * The fixture below is deliberately not a copy of the shipped config. It is two motions and two
 * presets chosen so that every lookup has a near-miss sibling to get wrong: two motions that differ
 * in every field, a preset whose stops differ in layer *count* as well as density, and a second
 * preset that exists purely so "found the right one" can be told apart from "found the only one".
 */
describe('WeatherPresets', () =>
{
  beforeAll(() =>
  {
    // the build-time ship identifier, which Diagnostics reads on every report.
    globalThis.__PLUGIN_NAME__ = 'J-Weather';
  });

  const config = {
    motions: {
      fall: {
        edge: 'top',
        speedX: 0,
        speedY: 4,
        jitterX: 0,
        jitterY: 3,
        roll: 0,
        growth: 0,
        fadeIn: 25,
        staggerFrames: 120,
      },
      drift: {
        edge: 'leading',
        speedX: 2,
        speedY: 1,
        jitterX: 4,
        jitterY: 2,
        roll: 0.5,
        growth: 0.25,
        fadeIn: 8,
        staggerFrames: 60,
      },
    },
    presets: {
      rain: {
        stops: {
          light: [ { motion: 'fall', asset: 'Rain_01A', density: 150, speed: 50, scale: 100, blend: 'normal' } ],
          heavy: [
            { motion: 'fall', asset: 'Rain_01A', density: 1000, speed: 200, scale: 100, blend: 'normal' },
            { motion: 'drift', asset: 'Rain_01B', density: 250, speed: 100, scale: 50, blend: 'additive' },
          ],
        },
      },
      snow: {
        stops: {
          light: [ { motion: 'drift', asset: 'Snow_01', density: 60, speed: 100, scale: 60, blend: 'normal' } ],
        },
      },
    },
  };

  describe('layersFor', () =>
  {
    it('resolves every layer of the named stop', () =>
    {
      // Arrange & Act - heavy rain is two layers, beside a light stop that is one, so a resolver
      // that returned the wrong stop would hand back the wrong count.
      const result = WeatherPresets.layersFor(config, 'rain', 'heavy');

      // Assert.
      expect(result)
        .toHaveLength(2);
      expect(result[0].asset)
        .toBe('Rain_01A');
      expect(result[1].asset)
        .toBe('Rain_01B');
    });

    it('resolves the stop it was asked for rather than the first one', () =>
    {
      // Arrange & Act.
      const result = WeatherPresets.layersFor(config, 'rain', 'light');

      // Assert - one layer, at the light density.
      expect(result)
        .toHaveLength(1);
      expect(result[0].density)
        .toBe(150);
    });

    it('resolves the preset it was asked for rather than the first one', () =>
    {
      // Arrange & Act - snow exists so that picking 'rain' is a choice rather than the only option.
      const result = WeatherPresets.layersFor(config, 'snow', 'light');

      // Assert.
      expect(result[0].asset)
        .toBe('Snow_01');
    });

    it('reports and draws nothing for a preset nobody configured', () =>
    {
      // Arrange - a mistyped tag, which the regex was perfectly happy to match.
      const warn = vi.spyOn(globalThis.Diagnostics, 'warn')
        .mockImplementation(() => {});

      // Act.
      const result = WeatherPresets.layersFor(config, 'rian', 'light');

      // Assert.
      expect(result)
        .toEqual([]);
      expect(warn)
        .toHaveBeenCalledTimes(1);

      warn.mockRestore();
    });

    it('reports and draws nothing for an intensity the preset does not reach', () =>
    {
      // Arrange - snow is configured light-only here, so asking for heavy is a real content gap.
      const warn = vi.spyOn(globalThis.Diagnostics, 'warn')
        .mockImplementation(() => {});

      // Act.
      const result = WeatherPresets.layersFor(config, 'snow', 'heavy');

      // Assert - and the preset itself was found, so this is the second guard rather than the first.
      expect(result)
        .toEqual([]);
      expect(warn)
        .toHaveBeenCalledTimes(1);

      warn.mockRestore();
    });
  });

  describe('resolveLayer', () =>
  {
    it('scales the motion velocity by the layer authored speed', () =>
    {
      // Arrange - half speed against a motion that falls at 4 with 3 of jitter.
      const layer = { motion: 'fall', asset: 'Rain_01A', density: 150, speed: 50, scale: 100, blend: 'normal' };

      // Act.
      const result = WeatherPresets.resolveLayer(config, layer);

      // Assert.
      expect(result.speedY)
        .toBe(2);
      expect(result.jitterY)
        .toBe(1.5);
    });

    it('carries every knob a motion can declare through to the resolved layer', () =>
    {
      // Arrange - a motion declaring **every** knob a motion can declare, each at a value nothing
      // else in this fixture uses. This is the guard against the whole class of bug where a knob
      // is added to the motion model and to the config, works perfectly in its own unit tests, and
      // is silently dropped here - which looks exactly like the feature not existing.
      //
      // **This fixture is the contract.** It guarded nothing for `drag` because `drag` was never
      // added to it: the knob was authored on `streak`, read by `WeatherMotion.advance`, and lost
      // in between, so shooting stars travelled at full pelt to the moment they vanished. A knob
      // added to the motion model belongs in this list the same day.
      //
      // `becomes` is the one exception and is covered by its own cases below, because naming it
      // here would resolve a successor and change what this is measuring.
      const everything = {
        motions: {
          kitchenSink: {
            edge: 'bottom',
            speedX: 1,
            speedY: -2,
            jitterX: 3,
            jitterY: 4,
            roll: 0.5,
            growth: 0.25,
            fadeIn: 8,
            fadeOut: 9,
            staggerFrames: 60,
            margin: 280,
            entryDepth: 700,
            sway: 14,
            swayRate: 0.06,
            life: 240,
            lifeJitter: 90,
            drag: 0.013,
            tilt: 0.4,
            stretch: 0.3,
            lean: 0.16,
            flip: 0.03,
            pulse: 0.55,
            pulseRate: 0.018,
          },
        },
      };
      const layer = { motion: 'kitchenSink', asset: 'Light_01C', density: 10, speed: 100, scale: 100, blend: 'additive' };

      // Act.
      const result = WeatherPresets.resolveLayer(everything, layer);

      // Assert - a dropped knob arrives as undefined, so every one is named here deliberately.
      Object.keys(everything.motions.kitchenSink)
        .forEach(knob => expect(result[knob])
          .toBeDefined());
      expect(result.sway)
        .toBe(14);
      expect(result.margin)
        .toBe(280);
    });

    it('carries drag through unscaled by the layer speed', () =>
    {
      // Arrange - a shooting star at double pace. Drag is a fraction of speed shed per frame, so
      // unlike the wander pace it must not ride the layer's own speed: a thing burning up loses a
      // share of whatever it had, however fast that was.
      const burning = {
        motions: {
          streak: {
            edge: 'top',
            speedX: 6,
            speedY: 4,
            jitterX: 0,
            jitterY: 0,
            drag: 0.013,
            roll: 0,
            growth: 0,
            fadeIn: 2,
            staggerFrames: 0,
          },
        },
      };
      const layer = { motion: 'streak', asset: 'Star_01A', density: 3, speed: 200, scale: 100, blend: 'additive' };

      // Act.
      const result = WeatherPresets.resolveLayer(burning, layer);

      // Assert - and the speed beside it did double, which is what makes this a claim about drag
      // rather than about the layer not being scaled at all.
      expect(result.drag)
        .toBe(0.013);
      expect(result.speedX)
        .toBe(12);
    });

    it('rides the wander pace on the layer speed so a faster layer keeps its shape', () =>
    {
      // Arrange - amplitude is a distance and must not scale; the pace must, or the same motion run
      // faster weaves through a longer stretch of screen per cycle and changes shape.
      const swaying = {
        motions: {
          spark: {
            edge: 'bottom',
            speedX: 0,
            speedY: -1,
            jitterX: 0,
            jitterY: 0,
            roll: 0,
            growth: 0,
            fadeIn: 10,
            staggerFrames: 0,
            sway: 20,
            swayRate: 0.05,
          },
        },
      };
      const layer = { motion: 'spark', asset: 'Light_01C', density: 10, speed: 200, scale: 100, blend: 'additive' };

      // Act.
      const result = WeatherPresets.resolveLayer(swaying, layer);

      // Assert.
      expect(result.swayRate)
        .toBe(0.1);
      expect(result.sway)
        .toBe(20);
    });

    it('gives a motion with no wander a pace of zero rather than a broken number', () =>
    {
      // Arrange - multiplying an absent rate by the layer speed is how this becomes NaN, which
      // then poisons a particle position the first time anything does reach the wander.
      const layer = { motion: 'fall', asset: 'Rain_01A', density: 150, speed: 50, scale: 100, blend: 'normal' };

      // Act.
      const result = WeatherPresets.resolveLayer(config, layer);

      // Assert.
      expect(result.swayRate)
        .toBe(0);
    });

    it('gives a layer whose motion names no successor nothing to become', () =>
    {
      // Arrange.
      const layer = { motion: 'fall', asset: 'Rain_01A', density: 150, speed: 50, scale: 100, blend: 'normal' };

      // Act.
      const result = WeatherPresets.resolveLayer(config, layer);

      // Assert.
      expect(result.becomes)
        .toBeNull();
    });

    it('resolves what a staged layer turns into', () =>
    {
      // Arrange - a drop that lands and splashes, the splash being its own motion and picture.
      const staging = {
        motions: {
          drop: {
            edge: 'top', speedX: 0, speedY: 6, jitterX: 0, jitterY: 1,
            roll: 0, growth: 0, fadeIn: 25, staggerFrames: 0,
            becomes: 'splash',
          },
          splash: {
            edge: 'anywhere', speedX: 0, speedY: 0, jitterX: 0, jitterY: 0,
            roll: 0, growth: 0, fadeIn: 30, staggerFrames: 0, life: 20, fadeOut: 20,
          },
        },
      };
      const layer = {
        motion: 'drop', asset: 'Rain_01A', density: 400, speed: 100, scale: 100, blend: 'normal',
        becomesAsset: 'Rain_02', becomesScale: 40,
      };

      // Act.
      const result = WeatherPresets.resolveLayer(staging, layer);

      // Assert - the successor carries its own picture, its own size and its own motion.
      expect(result.becomes.asset)
        .toBe('Rain_02');
      expect(result.becomes.scale)
        .toBe(0.4);
      expect(result.becomes.life)
        .toBe(20);
    });

    it('stops the chain at one stage, so a successor has no successor', () =>
    {
      // Arrange - a motion whose successor is itself, which would otherwise resolve forever.
      const looping = {
        motions: {
          ouroboros: {
            edge: 'top', speedX: 0, speedY: 1, jitterX: 0, jitterY: 0,
            roll: 0, growth: 0, fadeIn: 25, staggerFrames: 0,
            becomes: 'ouroboros',
          },
        },
      };
      const layer = { motion: 'ouroboros', asset: 'Rain_01A', density: 10, speed: 100, scale: 100, blend: 'normal' };

      // Act.
      const result = WeatherPresets.resolveLayer(looping, layer);

      // Assert.
      expect(result.becomes)
        .not
        .toBeNull();
      expect(result.becomes.becomes)
        .toBeNull();
    });

    it('lets a successor that named no size inherit the one it came from', () =>
    {
      // Arrange - saying nothing most likely meant "the same as the thing it came from".
      const staging = {
        motions: {
          drop: {
            edge: 'top', speedX: 0, speedY: 6, jitterX: 0, jitterY: 0,
            roll: 0, growth: 0, fadeIn: 25, staggerFrames: 0,
            becomes: 'splash',
          },
          splash: {
            edge: 'anywhere', speedX: 0, speedY: 0, jitterX: 0, jitterY: 0,
            roll: 0, growth: 0, fadeIn: 30, staggerFrames: 0,
          },
        },
      };
      const layer = {
        motion: 'drop', asset: 'Rain_01A', density: 400, speed: 100, scale: 250, blend: 'normal',
        becomesAsset: 'Rain_02',
      };

      // Act.
      const result = WeatherPresets.resolveLayer(staging, layer);

      // Assert.
      expect(result.becomes.scale)
        .toBe(2.5);
    });

    it('turns an authored hex tint into the renderer own packed integer', () =>
    {
      // Arrange - a warm shaft of light, authored the way it comes out of a colour picker.
      const layer = { motion: 'fall', asset: 'SunLight_01A', density: 5, speed: 100, scale: 100, tint: '#ffeaa8', blend: 'additive' };

      // Act.
      const result = WeatherPresets.resolveLayer(config, layer);

      // Assert.
      expect(result.tint)
        .toBe(0xffeaa8);
    });

    it('leaves a layer that authored no tint drawing its picture as painted', () =>
    {
      // Arrange.
      const layer = { motion: 'fall', asset: 'Rain_01A', density: 150, speed: 50, scale: 100, blend: 'normal' };

      // Act.
      const result = WeatherPresets.resolveLayer(config, layer);

      // Assert.
      expect(result.tint)
        .toBe(0xffffff);
    });

    it('turns an authored opacity percentage into the renderer own units', () =>
    {
      // Arrange - thirty percent of 255 is 76.5, which has to land somewhere whole.
      const layer = { motion: 'fall', asset: 'Cloud_04C', density: 8, speed: 100, scale: 400, opacity: 30, blend: 'multiply' };

      // Act.
      const result = WeatherPresets.resolveLayer(config, layer);

      // Assert.
      expect(result.peakOpacity)
        .toBe(77);
    });

    it('draws a layer that authored no opacity at full strength', () =>
    {
      // Arrange - which is what all but the shading layers want.
      const layer = { motion: 'fall', asset: 'Rain_01A', density: 150, speed: 50, scale: 100, blend: 'normal' };

      // Act.
      const result = WeatherPresets.resolveLayer(config, layer);

      // Assert.
      expect(result.peakOpacity)
        .toBe(255);
    });

    it('reads the layer authored scale as a percentage', () =>
    {
      // Arrange - the fog layers in the shipped config sit at 400, so this is the real case.
      const layer = { motion: 'fall', asset: 'Cloud_05A', density: 10, speed: 100, scale: 400, blend: 'normal' };

      // Act.
      const result = WeatherPresets.resolveLayer(config, layer);

      // Assert.
      expect(result.scale)
        .toBe(4);
    });

    it('carries the motion shape across untouched by the layer', () =>
    {
      // Arrange - drift differs from fall in every single field, so a resolver that grabbed the
      // wrong motion cannot produce these numbers.
      const layer = { motion: 'drift', asset: 'Snow_01', density: 60, speed: 100, scale: 100, blend: 'normal' };

      // Act.
      const result = WeatherPresets.resolveLayer(config, layer);

      // Assert.
      expect(result.edge)
        .toBe('leading');
      expect(result.roll)
        .toBe(0.5);
      expect(result.growth)
        .toBe(0.25);
      expect(result.fadeIn)
        .toBe(8);
      expect(result.staggerFrames)
        .toBe(60);
    });

    it('reads the layer authored size variance as a percentage', () =>
    {
      // Arrange - fog is drawn as a field, and a field of identical sprites reads as a repeated
      // sprite however it is arranged.
      const layer = {
        motion: 'fall',
        asset: 'Cloud_05A',
        density: 30,
        speed: 100,
        scale: 140,
        scaleJitter: 80,
        blend: 'normal',
      };

      // Act.
      const result = WeatherPresets.resolveLayer(config, layer);

      // Assert - 140% through 220%.
      expect(result.scale)
        .toBe(1.4);
      expect(result.scaleJitter)
        .toBe(0.8);
    });

    it('gives no size variance to a layer that asked for none', () =>
    {
      // Arrange - a raindrop is already the size a raindrop should be.
      const layer = { motion: 'fall', asset: 'Rain_01A', density: 150, speed: 100, scale: 100, blend: 'normal' };

      // Act.
      const result = WeatherPresets.resolveLayer(config, layer);

      // Assert - and the scale beside it proves the layer resolved rather than coming back blank.
      expect(result.scaleJitter)
        .toBe(0);
      expect(result.scale)
        .toBe(1);
    });

    it('carries the layer own fields across untouched by the motion', () =>
    {
      // Arrange.
      const layer = { motion: 'fall', asset: 'Rain_01B', density: 250, speed: 100, scale: 100, blend: 'additive' };

      // Act.
      const result = WeatherPresets.resolveLayer(config, layer);

      // Assert.
      expect(result.asset)
        .toBe('Rain_01B');
      expect(result.density)
        .toBe(250);
      expect(result.blend)
        .toBe('additive');
    });

    it('reports and inerts a layer naming a motion nobody configured', () =>
    {
      // Arrange.
      const warn = vi.spyOn(globalThis.Diagnostics, 'warn')
        .mockImplementation(() => {});
      const layer = { motion: 'tumble', asset: 'Leaf_04A', density: 30, speed: 100, scale: 100, blend: 'normal' };

      // Act.
      const result = WeatherPresets.resolveLayer(config, layer);

      // Assert - zero density draws nothing, while the asset surviving proves it is the real layer
      // being inerted rather than some unrelated blank.
      expect(result.density)
        .toBe(0);
      expect(result.asset)
        .toBe('Leaf_04A');
      expect(warn)
        .toHaveBeenCalledTimes(1);

      warn.mockRestore();
    });
  });

  describe('names', () =>
  {
    it('lists every configured look', () =>
    {
      // Arrange & Act.
      const result = WeatherPresets.names(config);

      // Assert.
      expect(result)
        .toEqual([ 'rain', 'snow' ]);
    });
  });
});
//endregion plugins/weather/core/core/weather-presets.test.js
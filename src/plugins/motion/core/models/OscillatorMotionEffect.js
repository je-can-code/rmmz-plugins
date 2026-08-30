//region OscillatorMotionEffect
import MotionEffect from './MotionEffect.js';
import MotionChannels from '../core/MotionChannels.js';

/**
 * Any motion that cycles smoothly around its rest state forever.
 *
 * Nine of the eighteen motion types are this one effect pointed at different channels, because
 * breathing, floating, swaying, swinging, fading and throbbing are the same sine wave wearing
 * different clothes. Keeping them together means the phase and period arithmetic — the part that
 * is fiddly and the part that has to stay identical across types for the desync to work — exists
 * exactly once.
 *
 * Two waveforms cover every type:
 *
 * - `wave` runs -1 to 1 and is centred on the rest state, for motions that overshoot in both
 *   directions. A swaying reed leans equally left and right.
 * - `rise` runs 0 to 1 and never goes negative, for motions where the rest state is a floor rather
 *   than a midpoint. A floating thing hovers above the ground and comes back down to it; it does
 *   not spend half of every cycle sunk into the floor.
 */
class OscillatorMotionEffect
  extends MotionEffect
{
  /**
   * Writes this frame's oscillation into the composition.
   * @param {MotionComposition} composition The composition being built for this character.
   */
  applyTo(composition)
  {
    const wave = this.wave();
    const rise = this.rise();
    const parameters = this.parameters();
    const motionType = this.declaration()
      .type();

    switch (motionType)
    {
      case 'breathe':
        // volume-preserving: the body lengthens as it narrows, the way a chest does.
        composition.contribute(this, MotionChannels.SCALE_Y, 1 + (parameters.amount * wave));
        composition.contribute(this, MotionChannels.SCALE_X, 1 - (parameters.amount * wave));
        break;
      case 'stretch':
        // height only, which reads as something rising and settling rather than inhaling.
        composition.contribute(this, MotionChannels.SCALE_Y, 1 + (parameters.amount * wave));
        break;
      case 'pulse':
        // both axes together, which reads as a heartbeat rather than a breath.
        composition.contribute(this, MotionChannels.SCALE_X, 1 + (parameters.amount * wave));
        composition.contribute(this, MotionChannels.SCALE_Y, 1 + (parameters.amount * wave));
        break;
      case 'float':
        // negative is upward in screen space, and the rise waveform keeps it out of the floor.
        composition.contribute(this, MotionChannels.OFFSET_Y, -(parameters.distance * rise));
        break;
      case 'sway':
        // centred, so the character drifts equally to either side of where it stands.
        composition.contribute(this, MotionChannels.OFFSET_X, parameters.distance * wave);
        break;
      case 'swing':
        // authored in degrees because nobody thinks in radians; the channel wants radians.
        composition.contribute(this, MotionChannels.ROTATION, this.degreesToRadians(parameters.angle) * wave);
        break;
      case 'ghost':
        composition.contribute(this, MotionChannels.OPACITY, this.ghostOpacity(wave));
        break;
      case 'throb':
        composition.contribute(this, MotionChannels.TONE, this.throbTone(rise));
        break;
      case 'flash':
        composition.contribute(this, MotionChannels.FLASH, this.flashColor(rise));
        break;
    }
  }

  /**
   * This frame's position in the cycle, from 0 to 1.
   *
   * The phase offset is added to the frame count rather than to the result, so that an effect
   * which starts mid-cycle stays mid-cycle forever instead of drifting back into step with its
   * neighbours.
   * @returns {number}
   */
  progress()
  {
    const { period } = this.parameters();
    const advanced = this.elapsedFrames() + this.phaseOffset();

    return (advanced % period) / period;
  }

  /**
   * The centred waveform, running -1 to 1 across one cycle.
   * @returns {number}
   */
  wave()
  {
    return Math.sin(2 * Math.PI * this.progress());
  }

  /**
   * The unipolar waveform, running 0 to 1 and back across one cycle without going negative.
   * @returns {number}
   */
  rise()
  {
    return 0.5 - (0.5 * Math.cos(2 * Math.PI * this.progress()));
  }

  /**
   * Converts an authored angle into the radians the rotation channel expects.
   * @param {number} degrees The angle in degrees.
   * @returns {number}
   */
  degreesToRadians(degrees)
  {
    return (degrees * Math.PI) / 180;
  }

  /**
   * The opacity multiplier for a ghosting character.
   *
   * The wave is remapped from its natural -1..1 into 0..1 first so that the authored minimum and
   * maximum are hit exactly at the extremes of the cycle rather than approximately.
   * @param {number} wave The centred waveform value.
   * @returns {number}
   */
  ghostOpacity(wave)
  {
    const { min, max } = this.parameters();
    const normalized = 0.5 + (0.5 * wave);

    return min + ((max - min) * normalized);
  }

  /**
   * The colour tone for a throbbing character, scaled by how far into the pulse it is.
   * @param {number} rise The unipolar waveform value.
   * @returns {number[]} The `[r, g, b, gray]` tone.
   */
  throbTone(rise)
  {
    const { red, green, blue, gray } = this.parameters();

    return [ red * rise, green * rise, blue * rise, gray * rise ];
  }

  /**
   * The blend colour for a flashing character, pulsing its alpha rather than its colour.
   * @param {number} rise The unipolar waveform value.
   * @returns {number[]} The `[r, g, b, a]` blend colour.
   */
  flashColor(rise)
  {
    const { color } = this.parameters();
    const [ red, green, blue ] = color;

    return [ red, green, blue, 255 * rise ];
  }
}

export default OscillatorMotionEffect;
//endregion OscillatorMotionEffect
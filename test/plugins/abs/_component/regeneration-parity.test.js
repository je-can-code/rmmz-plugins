//region plugins/abs/_component/regeneration-parity.test.js
import { describe, expect, it } from 'vitest';

/**
 * Algebraic parity for {@link JABS_Battler} regeneration redesign (half tick rate, scaled amounts).
 *
 * Keep numeric literals aligned with:
 * `src/plugins/abs/core/__models/JABS_Battler.js`
 */
describe('JABS_Battler regeneration DPS parity (constant algebra)', () =>
{
  const LEGACY_TICKS_PER_SEC = 4;
  const NEW_TICKS_PER_SEC = 2;
  const LEGACY_SLIP_DIV = 20;
  const NEW_SLIP_DIV = 10;
  const NATURAL_SCALE = 2;

  it('state slip per-second total matches legacy four-tick-per-second /20 model', () =>
  {
    const slipFiveTotal = 999;
    const legacyPerSec = LEGACY_TICKS_PER_SEC * (slipFiveTotal / LEGACY_SLIP_DIV);
    const newPerSec = NEW_TICKS_PER_SEC * (slipFiveTotal / NEW_SLIP_DIV);

    expect(newPerSec).toBe(legacyPerSec);
  });

  it('natural HRG-style ticks integrate to same per-second as legacy flat ticks', () =>
  {
    const baseTick = 17;
    const legacyPerSec = LEGACY_TICKS_PER_SEC * baseTick;
    const newPerSec = NEW_TICKS_PER_SEC * (baseTick * NATURAL_SCALE);

    expect(newPerSec).toBe(legacyPerSec);
  });

  it('60fps regen interval matches expected tick rates', () =>
  {
    const fps = 60;
    const legacyInterval = 15;
    const newInterval = 30;

    expect(fps / legacyInterval).toBe(LEGACY_TICKS_PER_SEC);
    expect(fps / newInterval).toBe(NEW_TICKS_PER_SEC);
  });
});
//endregion plugins/abs/_component/regeneration-parity.test.js
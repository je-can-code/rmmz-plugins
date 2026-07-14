//region plugins/abs/ext/star/_models/star-phase.test.js
import { beforeAll, describe, expect, it } from 'vitest';

describe('J-ABS-Star StarPhase (unit, pure class, no downstream dependencies)', () =>
{
  let StarPhase;

  beforeAll(async () =>
  {
    String.empty = '';
    ({ default: StarPhase } = await import('../../../../../../src/plugins/abs/ext/star/_models/StarPhase.js'));
  });

  it('assigns name and key from the constructor', () =>
  {
    const phase = new StarPhase('Preparing', 1);
    expect(phase.name).toBe('Preparing');
    expect(phase.key).toBe(1);
  });
});
//endregion plugins/abs/ext/star/_models/star-phase.test.js

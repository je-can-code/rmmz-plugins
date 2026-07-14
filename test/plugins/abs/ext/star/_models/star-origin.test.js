//region plugins/abs/ext/star/_models/star-origin.test.js
import { beforeAll, describe, expect, it } from 'vitest';

describe('J-ABS-Star StarOrigin (unit, pure class, no downstream dependencies)', () =>
{
  let StarOrigin;

  beforeAll(async () =>
  {
    ({ default: StarOrigin } = await import('../../../../../../src/plugins/abs/ext/star/_models/StarOrigin.js'));
  });

  it('assigns mapId, x, and y from the constructor', () =>
  {
    const origin = new StarOrigin(3, 5, 9);
    expect(origin.mapId).toBe(3);
    expect(origin.x).toBe(5);
    expect(origin.y).toBe(9);
  });
});
//endregion plugins/abs/ext/star/_models/star-origin.test.js

//region plugins/abs/ext/food/models/jabs-food-chain-segment.test.js
import { beforeAll, describe, expect, it } from 'vitest';

describe('J-ABS-Food JABS_FoodChainSegment (unit, pure class, no downstream dependencies)', () =>
{
  let JABS_FoodChainSegment;

  beforeAll(async () =>
  {
    ({ default: JABS_FoodChainSegment } = await import('../../../../../../src/plugins/abs/ext/food/models/JABS_FoodChainSegment.js'));
  });

  it('assigns stateId, chainType, frames, and color from the constructor', () =>
  {
    const segment = new JABS_FoodChainSegment(12, 'protein', 600, '#44cc44');
    expect(segment.stateId).toBe(12);
    expect(segment.chainType).toBe('protein');
    expect(segment.frames).toBe(600);
    expect(segment.color).toBe('#44cc44');
  });
});
//endregion plugins/abs/ext/food/models/jabs-food-chain-segment.test.js

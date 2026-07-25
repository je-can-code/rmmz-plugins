//region plugins/abs/ext/juice/helpers/juice-flurry-strike-record.test.js
import { beforeAll, describe, expect, it } from 'vitest';

describe('J-ABS-Juice JuiceFlurryStrikeRecord (unit, pure class, no downstream dependencies)', () =>
{
  let JuiceFlurryStrikeRecord;

  beforeAll(async () =>
  {
    ({ default: JuiceFlurryStrikeRecord } = await import('../../../../../../src/plugins/abs/ext/juice/helpers/JuiceFlurryStrikeRecord.js'));
  });

  it('assigns count and frame from the constructor', () =>
  {
    const record = new JuiceFlurryStrikeRecord(3, 120);
    expect(record.count).toBe(3);
    expect(record.frame).toBe(120);
  });
});
//endregion plugins/abs/ext/juice/helpers/juice-flurry-strike-record.test.js

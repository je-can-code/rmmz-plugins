//region plugins/abs/ext/juice/resolvers/juice-style-multiplier-row.test.js
import { beforeAll, describe, expect, it } from 'vitest';

describe('J-ABS-Juice JuiceStyleMultiplierRow (unit, pure class, no downstream dependencies)', () =>
{
  let JuiceStyleMultiplierRow;

  beforeAll(async () =>
  {
    ({ default: JuiceStyleMultiplierRow } = await import('../../../../../../src/plugins/abs/ext/juice/resolvers/JuiceStyleMultiplierRow.js'));
  });

  it('assigns tiltMul and swingMul from the constructor', () =>
  {
    const row = new JuiceStyleMultiplierRow(1.5, 2);
    expect(row.tiltMul).toBe(1.5);
    expect(row.swingMul).toBe(2);
  });

  it('defaults both multipliers to 1 when omitted', () =>
  {
    const row = new JuiceStyleMultiplierRow();
    expect(row.tiltMul).toBe(1);
    expect(row.swingMul).toBe(1);
  });
});
//endregion plugins/abs/ext/juice/resolvers/juice-style-multiplier-row.test.js

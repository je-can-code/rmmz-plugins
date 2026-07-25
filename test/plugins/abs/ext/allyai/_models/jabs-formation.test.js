//region plugins/abs/ext/allyai/_models/jabs-formation.test.js
import { beforeAll, describe, expect, it } from 'vitest';

describe('J-ABS-AllyAI JABS_Formation (unit, pure class, no downstream dependencies)', () =>
{
  let JABS_Formation;

  beforeAll(async () =>
  {
    String.empty = '';
    ({ default: JABS_Formation } = await import('../../../../../../src/plugins/abs/ext/allyai/_models/JABS_Formation.js'));
  });

  it('assigns name, description, formation, and effects from the constructor', () =>
  {
    const effects = [ { id: 1 } ];
    const formation = new JABS_Formation('Wedge', 'A wedge shape', [ [ 1, 1 ] ], effects);
    expect(formation.name).toBe('Wedge');
    expect(formation.description).toBe('A wedge shape');
    expect(formation.formation).toEqual([ [ 1, 1 ] ]);
    expect(formation.effects).toBe(effects);
  });

  it('defaults effects to an empty array when omitted', () =>
  {
    const formation = new JABS_Formation('Line', 'A line shape', [ [ 0, 0 ] ]);
    expect(formation.effects).toEqual([]);
  });
});
//endregion plugins/abs/ext/allyai/_models/jabs-formation.test.js
